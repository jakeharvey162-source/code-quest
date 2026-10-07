const SHELL = "codequest-shell-__BUILD_VERSION__";
const RUNTIME = "codequest-runtime-0.10.2";
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      const manifest = await fetch("/asset-manifest.json", {
        cache: "no-store",
      });
      if (!manifest.ok) throw Error("Asset manifest unavailable");
      const assets = await manifest.json();
      await cache.addAll([
        "/",
        "/index.html",
        "/manifest.webmanifest",
        "/icon.svg",
        "/icon-192.png",
        "/icon-512.png",
        ...assets,
      ]);
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const shells = keys.filter((key) => key.startsWith("codequest-shell-"));
      await Promise.all(
        shells
          .filter((key) => key !== SHELL)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    (async () => {
      const isCompiler = url.pathname.startsWith("/compiler/");
      const cache = await caches.open(isCompiler ? RUNTIME : SHELL);
      if (request.mode === "navigate") {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) return fresh;
        } catch {}
        return (await cache.match("/index.html")) || Response.error();
      }
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      if (url.pathname.startsWith("/assets/")) {
        const previous = await caches.match(request, { ignoreVary: true });
        if (previous) return previous;
      }
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;
        if (request.mode === "navigate")
          return (await cache.match("/index.html")) || Response.error();
        return Response.error();
      }
    })(),
  );
});
