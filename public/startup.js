// Runs independently of React so a missing entry bundle still has a recovery UI.
(() => {
  const aliases = { dashboard: "home", login: "account", winforms: "designer", lessons: "learn" };
  const routes = new Set(["home", "learn", "challenges", "videos", "playground", "terminal", "designer", "assessment", "leaderboard", "progress", "settings", "account", "classes", "community", "tor"]);
  const parts = location.pathname.split("/").filter(Boolean);
  const route = aliases[parts[0]] || parts[0];
  if (routes.has(route)) {
    const hash = location.hash || "#" + [route, ...parts.slice(1)].join("/");
    history.replaceState(null, "", "/" + location.search + hash);
  }
  const message = document.getElementById("startup-message");
  const recovery = document.getElementById("startup-recovery");
  const retry = document.getElementById("startup-retry");
  if (!message || !recovery || !retry) return;
  const showRecovery = () => {
    if (!message.isConnected) return;
    message.textContent = navigator.onLine ? "Loading is taking longer than expected." : "You appear to be offline.";
    recovery.hidden = false;
  };
  const timer = setTimeout(showRecovery, 15000);
  const onError = (event) => {
    if (event.target instanceof HTMLScriptElement) showRecovery();
  };
  window.addEventListener("error", onError, true);
  window.addEventListener("offline", showRecovery);
  retry.addEventListener("click", async () => {
    if (!navigator.onLine) { showRecovery(); return; }
    retry.disabled = true;
    retry.textContent = "Trying again…";
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter(r => new URL(r.scope).pathname === "/").map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("codequest-shell-")).map(key => caches.delete(key)));
      }
    } catch { /* A normal reload is still available when storage is restricted. */ }
    location.reload();
  });
  const observer = new MutationObserver(() => {
    if (message.isConnected) return;
    clearTimeout(timer);
    window.removeEventListener("error", onError, true);
    window.removeEventListener("offline", showRecovery);
    observer.disconnect();
  });
  observer.observe(document.getElementById("root"), { childList: true });
})();
