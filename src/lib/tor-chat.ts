import { supabase } from "./supabase";
export type TorMessage = { role: "user" | "assistant"; content: string };
export async function chatWithTor(
  messages: TorMessage[],
  signal: AbortSignal,
  mode = "student",
  language = "en-ZA",
) {
  if (!navigator.onLine)
    throw Error(
      "You’re offline. Choose the offline guide, or reconnect to chat with Tor.",
    );
  const { data } = (await supabase?.auth.getSession()) || {
    data: { session: null },
  };
  if (!data.session)
    throw Error("Sign in to chat with Tor, or choose the offline guide.");
  messages = messages
    .slice(-8)
    .map((m) => ({ ...m, content: m.content.slice(0, 6000) }));
  while (
    messages.reduce((n, m) => n + m.content.length, 0) > 28000 &&
    messages.length > 1
  )
    messages.shift();
  const response = await fetch("/api/tor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + data.session.access_token,
    },
    body: JSON.stringify({ messages: messages.slice(-8), mode, language }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(50000)]),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.text !== "string")
    throw Error(
      result.error ||
        "Tor’s AI is unavailable. Your question is kept; please retry.",
    );
  return result.text as string;
}
