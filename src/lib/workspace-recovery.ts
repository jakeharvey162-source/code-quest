export async function reloadLatestWorkspace() {
  if (!navigator.onLine)
    throw new Error(
      "You are offline. Reconnect before downloading the latest workspace. Your saved work is unchanged.",
    );
  const registrations =
    "serviceWorker" in navigator
      ? await navigator.serviceWorker.getRegistrations()
      : [];
  await Promise.all(
    registrations.map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("codequest-shell-"))
        .map((key) => caches.delete(key)),
    );
  }
  location.reload();
}
