import { cp, mkdir } from "node:fs/promises";
await mkdir("public/runtimes", { recursive: true });
await cp("node_modules/pyodide", "public/runtimes/python", { recursive: true });
await cp("node_modules/typescript-browser/lib/typescript.js", "public/runtimes/typescript.js");
await cp("node_modules/typescript-browser/LICENSE.txt", "public/runtimes/typescript-LICENSE.txt");
await cp("node_modules/skulpt/dist", "public/runtimes/turtle", { recursive: true });
await cp("node_modules/skulpt/LICENSE", "public/runtimes/turtle-LICENSE.txt");
console.log("Prepared self-hosted Python, Turtle and TypeScript runtimes.");
