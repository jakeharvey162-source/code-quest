import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
let configurationError = "";
function configuredClient() {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    configurationError =
      "The account configuration is invalid. The app owner needs to check the Supabase URL and publishable key. Local learning is available.";
    return null;
  }
}
export const supabase = configuredClient();
export const supabaseConfigurationError = configurationError;
export const authRedirect = (kind = "callback") =>
  `${location.origin}/?auth=${kind}#account`;
