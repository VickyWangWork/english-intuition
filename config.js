// Public settings for English Intuition.
// The Supabase URL and publishable key are designed to be public: database rules (Row Level Security)
// keep each person's words private, and the AI key lives only on the server.
window.EI_CONFIG = {
  supabaseUrl: "",   // e.g. "https://abcd1234.supabase.co"
  supabaseKey: "",   // publishable key, e.g. "sb_publishable_..."
  google: true       // show "Continue with Google"
};
