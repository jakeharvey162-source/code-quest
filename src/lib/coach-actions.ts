export type CoachAction = {
  type: string;
  control?: string;
  value?: string;
  direction?: string;
  distance?: number;
};
export type CoachRequest = {
  action: CoachAction;
  respond: (reply: string) => void;
};
// Lazy workspaces can finish loading after the tutor becomes visible. Wait for
// their handler rather than losing the first command; cancellation prevents a
// delayed edit after the user stops or changes pages.
export async function requestWorkspaceAction(
  action: CoachAction,
  signal: AbortSignal,
): Promise<string | null> {
  const deadline = Date.now() + 3000;
  while (!signal.aborted) {
    let reply: string | null = null;
    window.dispatchEvent(
      new CustomEvent<CoachRequest>("cq-coach-action", {
        detail: {
          action,
          respond: (text) => {
            reply = text;
          },
        },
      }),
    );
    if (reply !== null) return reply;
    if (Date.now() >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}
