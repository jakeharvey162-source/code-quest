import { createClient } from "@supabase/supabase-js";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createVoiceHandler } from "../server/voice-handler.mjs";
export default createVoiceHandler({
  env: process.env,
  createUserClient: (token) =>
    createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
        },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    ),
  convert: (voiceId, request) =>
    new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    }).textToSpeech.convert(voiceId, request, {
      timeoutInSeconds: 25,
      maxRetries: 0,
    }),
});
