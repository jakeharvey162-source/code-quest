import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
test("worker activation keeps open-tab assets and online navigation loads fresh HTML", async () => {
  const handlers = {},
    stores = new Map();
  let offline = false;
  const key = (request) =>
    new URL(
      typeof request === "string" ? request : request.url,
      "https://cq.example",
    ).pathname;
  const caches = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      return {
        match: async (req) => stores.get(name).get(key(req))?.clone(),
        put: async (req, res) => stores.get(name).set(key(req), res),
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (req) => {
      for (const store of stores.values()) {
        const value = store.get(key(req));
        if (value) return value.clone();
      }
    },
  };
  stores.set(
    "codequest-shell-previous",
    new Map([["/assets/old.js", new Response("old module")]]),
  );
  stores.set(
    "codequest-shell-__BUILD_VERSION__",
    new Map([["/index.html", new Response("offline HTML")]]),
  );
  vm.runInNewContext(
    fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"),
    {
      self: {
        location: { origin: "https://cq.example" },
        addEventListener: (type, handler) => (handlers[type] = handler),
        clients: { claim: async () => {} },
        skipWaiting() {},
      },
      caches,
      URL,
      Response,
      fetch: async (request) => {
        if (offline || key(request).startsWith("/assets/"))
          throw Error("unavailable");
        return new Response("fresh HTML");
      },
    },
  );
  let pending;
  handlers.activate({ waitUntil: (p) => (pending = p) });
  await pending;
  assert.ok(stores.has("codequest-shell-previous"));
  async function fetchPath(path, mode = "cors") {
    let result;
    handlers.fetch({
      request: { method: "GET", url: "https://cq.example" + path, mode },
      respondWith: (p) => (result = p),
    });
    return (await result).text();
  }
  assert.equal(await fetchPath("/assets/old.js"), "old module");
  assert.equal(await fetchPath("/", "navigate"), "fresh HTML");
  offline = true;
  assert.equal(await fetchPath("/", "navigate"), "offline HTML");
});
