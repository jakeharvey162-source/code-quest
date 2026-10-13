import { createClient } from "@supabase/supabase-js";
import { cloudConfig } from "./cloud-config";
const url = import.meta.env.VITE_SUPABASE_URL?.trim() || cloudConfig.url;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || cloudConfig.publishableKey;
let configurationError = "";
function configuredClient() {
  if (import.meta.env.VITE_SUPABASE_DISABLED === "true" || !url || !key) return null;
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
