import { tutorVoices } from "../src/lib/voice-catalog.mjs";
export function createVoiceHandler({ env, createUserClient, convert }) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store");
    const fail = (status, error) => res.status(status).json({ error });
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return fail(405, "Use POST.");
    }
    if (
      !env.ELEVENLABS_API_KEY ||
      !env.VITE_SUPABASE_URL ||
      !env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      !env.PUBLIC_APP_URL
    )
      return fail(
        503,
        "Cloud voice is not connected. Choose Device voices in Settings.",
      );
    if (
      req.headers.origin &&
      req.headers.origin !== new URL(env.PUBLIC_APP_URL).origin
    )
      return fail(403, "This origin is not allowed.");
    if (
      !String(req.headers["content-type"] || "").startsWith("application/json")
    )
      return fail(415, "Send JSON.");
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization || "")?.[1];
    if (!token || token.length > 8192)
      return fail(401, "Sign in to use cloud voices.");
    let body = req.body;
    if (typeof body === "string") {
      if (body.length > 4096) return fail(413, "Voice request is too large.");
      try {
        body = JSON.parse(body);
      } catch {
        return fail(400, "Invalid JSON.");
      }
    }
    const voice = tutorVoices[body?.language];
    if (
      !voice?.voiceId ||
      typeof body?.text !== "string" ||
      !body.text.trim() ||
      body.text.length > 800
    )
      return fail(
        400,
        "Choose a supported language and text between 1 and 800 characters.",
      );
    try {
      const client = createUserClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user)
        return fail(401, "Your session expired. Sign in again.");
      const quota = await client.rpc("cq_reserve_voice", {
        characters: body.text.length,
      });
      if (quota.error)
        return fail(
          503,
          "Cloud voice limits could not be checked. Choose a device voice.",
        );
      if (quota.data !== true)
        return fail(
          429,
          "The cloud voice allowance has been reached. Device voices are still available.",
        );
      const stream = await convert(voice.voiceId, {
        text: body.text,
        modelId: voice.model,
        outputFormat: "mp3_44100_128",
      });
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      if (!bytes.length)
        return fail(
          502,
          "The voice service returned no audio. Try a device voice.",
        );
      res.setHeader("Content-Type", "audio/mpeg");
      return res.status(200).send(Buffer.from(bytes));
    } catch {
      return fail(
        503,
        "The voice service is unavailable. Choose Device voices in Settings.",
      );
    }
  };
}
