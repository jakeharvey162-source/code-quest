export function communityError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  if (["42P01", "PGRST205", "PGRST202"].includes(code))
    return "Community is being set up. Your drafts and saved code are available; try connecting again later.";
  if (code === "42501")
    return "This conversation is unavailable to your account. Check your friendship or class membership, then sync again.";
  if (code === "23503")
    return "The related profile or conversation is no longer available. Sync and check your membership before retrying.";
  if (code === "23505")
    return "That item already exists. Sync to see its latest state.";
  if (code === "23514" && !message.includes("identifier"))
    return "Check your message length, nickname and selected code language, then try again.";
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message))
    return "Could not reach Community. Your queued messages stay saved. Check your connection and tap Sync messages.";
  return (
    message ||
    "Could not complete that action. Your saved drafts are still on this device."
  );
}
