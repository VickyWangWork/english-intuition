# Set up sign-in, cloud sync and shared AI (one time, about 20 minutes)

After this, anyone you share the app with just signs in. Their words sync across their devices, and AI look-ups use your Gemini key on the server, with a daily limit per person. Nobody needs their own key or token.

You will create two things: a free **Supabase** project (database, sign-in and the AI function) and a **Google sign-in** client. Keep this page open beside you.

---

## 1. Create the Supabase project
1. Go to **supabase.com** → **Start your project** → sign in with **GitHub**.
2. **New project**: name `english-intuition`, region **West EU (London)**, click **Generate a password** and save it in your password manager. Create the project and wait a couple of minutes until it's ready.

## 2. Create the database
1. In the left menu open **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) in this repository, copy all of it, paste it in, and click **Run**. You should see *Success. No rows returned*.

## 3. Add the AI function
1. Left menu → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name it exactly `ai`. Replace the sample code with everything in [`supabase/functions/ai/index.ts`](supabase/functions/ai/index.ts) and click **Deploy**.
3. Still in Edge Functions, open **Secrets** and add:
   - `GEMINI_API_KEY`: a **new** key from aistudio.google.com/apikey. Paste it only here, not in any chat.
   - Optional `DAILY_LIMIT`: requests per person per day (default 150, about 50 new words).

## 4. Tell Supabase where the app lives
**Authentication** → **URL Configuration**:
- **Site URL**: `https://vickywangwork.github.io/english-intuition/`
- **Redirect URLs** → Add: `https://vickywangwork.github.io/english-intuition/**`

## 5. Email sign-in codes (works in the Home Screen app)
**Authentication** → **Emails** → **Templates**. In both **Confirm signup** and **Magic Link**, replace the message body with:

```html
<h2>Your English Intuition sign-in code</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
<p>It expires in an hour. If you didn't ask for it, you can ignore this email.</p>
```

If Supabase says templates can only be edited with custom SMTP, skip this: the standard email contains a sign-in **link** instead, and the app accepts that link (tap it, or paste it into the app). Supabase's built-in email only sends a few emails an hour. That's fine for you and a few friends. If more people join, add free SMTP (for example Resend) under **Authentication → Emails → SMTP Settings**.

## 6. Google sign-in
1. In Supabase: **Authentication** → **Sign In / Providers** → **Google**. Copy the **Callback URL**.
2. Go to **console.cloud.google.com** and create a project called `English Intuition`.
3. **Google Auth Platform** (APIs & Services → OAuth consent screen): set the app name `English Intuition` and your email; Audience **External**; then **Publish app** so anyone with a Google account can sign in. The default scopes (email, profile) are all it needs.
4. **Clients** → **Create client** → **Web application**:
   - **Authorized JavaScript origins**: `https://vickywangwork.github.io`
   - **Authorized redirect URIs**: the Supabase Callback URL from step 1
   Create it and copy the **Client ID** and **Client secret**.
5. Back in Supabase's Google provider: turn it on, paste the Client ID and secret, **Save**.

## 7. Send Claude the two public values
**Project Settings** → **API Keys** (or **Data API**):
- **Project URL** (looks like `https://abcd1234.supabase.co`)
- **Publishable key** (starts with `sb_publishable_`), or the legacy **anon public** key

These two are designed to be public: they go into the app's code, and the database rules keep each person's words private. **Never share** the *secret* / *service_role* key or your database password.

---

### How it works
- **Sign in**: Google in a browser tab; on the iPhone Home Screen app, use the email code (Google sign-in can open outside the Home Screen app).
- **Sync**: each word is saved to the database; devices pull changes when they open, come online or come back to the front, and every few minutes.
- **AI**: the app calls the `ai` function, which checks who's signed in, counts today's requests and asks Gemini with the key stored in Secrets.
