// English Intuition: shared AI look-ups for signed-in people.
// Holds the Gemini key on the server (secret GEMINI_API_KEY), so nobody using the app needs their own key,
// and limits each person to DAILY_LIMIT requests a day (default 150, about 50 new words).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Fast, reliable model first; the full Flash model only as a fallback.
const MODELS = (Deno.env.get("GEMINI_MODELS") ?? "gemini-flash-lite-latest,gemini-flash-latest")
  .split(",").map((m) => m.trim()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) return json({ error: "not_configured" }, 500);

  // Who is asking? (The request must carry a signed-in user's token.)
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (!user) return json({ error: "sign_in" }, 401);

  let body: { prompt?: unknown; tier?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt || prompt.length > 15000) return json({ error: "bad_request" }, 400);

  // Daily limit per person.
  const limit = Number(Deno.env.get("DAILY_LIMIT") ?? "150");
  const { data: used, error } = await admin.rpc("bump_ai_usage", { p_user: user.id, p_limit: limit });
  if (error) return json({ error: "usage", message: error.message }, 500);
  if (used === -1) return json({ error: "daily_limit", limit }, 429);

  let last = "busy";
  for (const model of MODELS) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), body.tier === "quick" ? 15000 : 40000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        signal: ctl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        }),
      });
      clearTimeout(timer);
      const j = await r.json().catch(() => ({}));
      if (r.status === 429 || r.status >= 500) { last = `model_${r.status}`; continue; }
      if (!r.ok) return json({ error: "upstream", status: r.status, message: j?.error?.message ?? "" }, 502);
      const cand = j?.candidates?.[0];
      if (!cand) {
        if (j?.promptFeedback?.blockReason) return json({ error: "refused" }, 422);
        last = "empty"; continue;
      }
      const text = (cand.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
      return json({ text, model, used, limit });
    } catch {
      clearTimeout(timer);
      last = "timeout";
    }
  }
  return json({ error: "busy", detail: last }, 503);
});
