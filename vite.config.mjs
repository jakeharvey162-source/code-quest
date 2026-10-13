import { defineConfig } from "vite";
import fs from "node:fs";
const headers = JSON.parse(
  fs.readFileSync(new URL("./vercel.json", import.meta.url), "utf8"),
).headers;
// WASM runtimes load from opaque-origin preview workers (Origin: null).
const runtimeHeaders = (server) => {
  server.middlewares.use((req, res, next) => {
    if (req.url?.startsWith("/runtimes/"))
      res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
};
const productionHeaders = (server) => {
  server.middlewares.use((req, res, next) => {
    const path = req.url?.split("?")[0];
    for (const rule of headers) {
      if (
        rule.source === headers[0].source
          ? path !== "/terminal-frame.html"
          : rule.source === "/runtimes/(.*)"
            ? path?.startsWith("/runtimes/")
            : path === rule.source
      )
        for (const header of rule.headers)
          res.setHeader(header.key, header.value);
    }
    next();
  });
};
export default defineConfig({
  plugins: [
    {
      name: "isolated-runtime-headers",
      configureServer: runtimeHeaders,
      configurePreviewServer: productionHeaders,
    },
  ],
});
