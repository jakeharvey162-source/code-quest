import { supabase } from "./supabase";

export type TorTurn = { question: string; answer: string };
export type TorLiveReply = { answer: string | null; notice: string; live: boolean };

/** Live tutoring is opt-in via a signed-in learner, never a fake local LLM. */
export async function askTorLive(
  question: string,
  role: "student" | "lecturer" = "student",
  history: TorTurn[] = [],
  context = "study desk",
  signal?: AbortSignal,
): Promise<TorLiveReply> {
  if (!navigator.onLine)
    return { answer: null, notice: "Offline: using the built-in study guide.", live: false };
  if (!supabase)
    return { answer: null, notice: "Live AI has not been configured; using the built-in guide.", live: false };
  let token = "";
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    token = data.session?.access_token || "";
  } catch {
    return { answer: null, notice: "Could not verify your session. Using the built-in guide.", live: false };
  }
  if (!token)
    return { answer: null, notice: "Sign in through Account to use live Tor AI. Built-in study help still works.", live: false };
  try {
    const response = await fetch("/api/tor", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: question.slice(0, 1500),
        role,
        context: context.slice(0, 100),
        history: history.slice(-6).map((h) => ({
          question: h.question.slice(0, 900),
          answer: h.answer.slice(0, 1600),
        })),
      }),
      signal,
    });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.answer !== "string" || !payload.answer.trim())
      return {
        answer: null,
        notice: response.status === 503
          ? "Live AI is not configured on the server yet. Showing built-in guidance."
          : response.status === 429
            ? "Tor is receiving too many requests. Showing built-in guidance for now."
            : response.status === 401
              ? "Your sign-in has expired. Sign in again for live AI."
              : "Live AI is unavailable right now. Showing built-in guidance.",
        live: false,
      };
    return { answer: payload.answer.slice(0, 5000), notice: "Live AI · Gemini", live: true };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { answer: null, notice: "Tor couldn't reach live AI. Showing built-in guidance.", live: false };
  }
}
