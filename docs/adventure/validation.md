# Validation — Lagos Story Mode

Application checks executed locally on 30 October 2026 with Node.js 24.19.0 and Chromium 154. Screenshots and review steps are in [the adventure guide](README.md).

| Check | Observed result |
| --- | --- |
| `npm run check` | 201 unit/regression checks passed; TypeScript and production build passed |
| Complete `npm run test:browser` | 120 passed; the dedicated software-WebGL test was intentionally skipped by the default configuration |
| Final `npm run test:browser -- tests/adventure.spec.mjs` | 6 passed after the final editor fix |
| `CODEQUEST_WEBGL_TEST=1 npm run test:browser -- tests/tor-model.spec.mjs` | 1 passed; TOR model rendering, movement, interaction, and reduced motion verified |
| `npm run test:cloud` | 19 passed with mocked providers, including real compilation, adventure cloud restore, and account isolation |
| `npm run test:community` | 15 passed |
| Native export | Exported Windows Forms sample cross-compiled successfully: 0 warnings, 0 errors; see [native evidence](native-validation.md) |

Browser commands used `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Suites ran sequentially because each rebuilds the shared `dist` directory and uses shared test output. A final `npm run build` restored the standard production bundle after the provider-mocked suites.

The complete browser run preceded the final isolated oversized-draft fix. The six adventure tests then passed on the final application source, covering both CodeMirror and plain editors. The cloud and community runs use the final application source.

Adventure coverage verifies three real C# repairs and their edge cases, failure feedback without XP penalties, 40/100/200 total XP, once-only rewards, locked-route handling, cancellation, reload persistence, offline hints and compiler reuse, quiet TOR behavior, mission focus, keyboard navigation, reduced motion, and serious/critical axe findings at 320/360/412 px plus dark mode. Oversized drafts remain visible and cannot accidentally execute an older saved solution.

The new restore scenario initially failed because it left automatic backup enabled while deliberately editing the local draft. It now explicitly pauses backup before diverging locally and restoring the selected snapshot; the full cloud suite passed after that correction.

Live hosted Supabase, SMTP, and online AI-provider health were not verified. Provider integration tests use existing mocks; database policy tests use the repository's local test engine. Native Windows execution and the branch's Windows CI job remain separate checks. No merge or deployment command was run.
