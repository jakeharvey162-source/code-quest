# Third-party foundations

CodeQuest uses pinned npm distributions of these open-source projects. Their license files remain in installed dependencies; the complete WasmSharp license is copied into the deployed compiler directory. No paid API is required.

| Project    | Repository                                  | License    | Use                                           |
| ---------- | ------------------------------------------- | ---------- | --------------------------------------------- |
| React      | https://github.com/facebook/react           | MIT        | UI                                            |
| Vite       | https://github.com/vitejs/vite              | MIT        | Static build                                  |
| WasmSharp  | https://github.com/JakeYallop/WasmSharp     | Apache-2.0 | Browser .NET runtime and compiler integration |
| Roslyn     | https://github.com/dotnet/roslyn            | MIT        | Actual C# compilation (in WasmSharp)          |
| CodeMirror | https://github.com/codemirror/dev           | MIT        | Accessible code editor with C# syntax mode    |
| fflate     | https://github.com/101arrowz/fflate         | MIT        | Native Visual Studio ZIP export               |
| Lucide     | https://github.com/lucide-icons/lucide      | ISC        | Interface icons                               |
| Comlink    | https://github.com/GoogleChromeLabs/comlink | Apache-2.0 | Compiler worker messaging                     |
| Playwright | https://github.com/microsoft/playwright     | Apache-2.0 | Browser regression testing                    |
| axe-core   | https://github.com/dequelabs/axe-core       | MPL-2.0    | Automated accessibility checking              |

The browser's Web Speech API provides optional device speech synthesis and recognition. Those voices/services are supplied by the browser/operating system and are not bundled speech models or a guarantee of offline recognition.

WasmSharp's published JavaScript imports Comlink from a CDN. `scripts/prepare-compiler.mjs` rewrites those two imports to a copied, same-origin Comlink module; it also resolves extensionless module imports and converts the published .NET binary import placeholders into static asset URLs. The underlying runtime binaries are copied unchanged. This modification eliminates the runtime CDN dependency.

## Optional cloud integrations and database testing

- Supabase JavaScript client: https://github.com/supabase/supabase-js (MIT). Browser publishable keys are protected by database row-level policies.
- ElevenLabs JavaScript SDK: https://github.com/elevenlabs/elevenlabs-js (MIT SDK; hosted voices/output have separate provider and voice-library terms).
- PGlite: https://github.com/electric-sql/pglite (Apache-2.0); used to execute actual Postgres security-policy tests locally, not as the production database.
