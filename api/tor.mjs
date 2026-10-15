import { createClient } from "@supabase/supabase-js";
import { createTorHandler } from "../server/tor-handler.mjs";
// Public Supabase configuration only. Gateway credentials remain server-side.
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://ftsomveafuskrutqzsvs.supabase.co";
const supabaseApiKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_x3SYM26ShPtf_JIYdvOkEg_kLXb2kIz";
const client = (token) =>
  createClient(
    supabaseUrl,
    supabaseApiKey,
    {
      global: {
        headers: { Authorization: "Bearer " + token },
        fetch: (url, init) =>
          fetch(url, { ...init, signal: AbortSignal.timeout(10000) }),
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
export default createTorHandler({
  env: process.env,
  supabaseUrl,
  supabaseApiKey,
  authenticate: async (token) => {
    const { data, error } = await client(token).auth.getUser(token);
    return error ? null : data.user;
  },
  reserve: async (token) => {
    const { data, error } = await client(token).rpc("cq_reserve_tor_chat");
    if (error) throw error;
    return data === true;
  },
});
