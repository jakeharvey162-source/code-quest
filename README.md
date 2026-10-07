# CodeQuest

**Build your understanding. Run real C#. Build real Windows Forms projects.**

CodeQuest is an African-rooted learning product for C#, Windows Forms, debugging, OOP and assessment preparation. It combines authored lessons, real in-browser C# execution, a Visual-Studio-inspired form designer, practical marking, adaptive Tor coaching, offline learning and native Windows project export.

## Product status
CodeQuest is an active release candidate. Release candidates must pass unit/regression tests, TypeScript, production build, Chromium user journeys, real C# execution, offline PWA, responsive/accessibility checks and Windows .NET 8 native-export compilation before release.

## Core experience
- Learn: See → Predict → Build → Break & Fix → Apply alone.
- Run real C# locally through WasmSharp/Roslyn in a Web Worker with timeout/cancel controls.
- Build WinForms with toolbox, placement, resize, Properties, Events, preview, undo/redo and default-event creation.
- Export a Visual Studio .NET 8 Windows Forms solution with Form1.cs and Designer.cs.
- Assessment Arena provides theory practice, formative practical review and targeted remediation.
- Tor offers Teacher/Friendly/Spicy progressive coaching rather than immediate answer dumping.
- Offline-first PWA with keyboard navigation, reduced motion, high contrast and read-aloud support.

## Stack
React 19 · TypeScript · Vite · CodeMirror · WasmSharp/Roslyn · fflate · Playwright · axe-core · PWA/service worker · .NET 8 Windows Forms export.

## Development
Requires Node.js 24+.

```sh
npm ci
npm run dev
```

Validation:

```sh
npm run check
npx playwright install --with-deps chromium
npm run test:browser
```

## Environment and secrets
CodeQuest currently requires no secret API key for its core learning experience. Never commit credentials, tokens, private keys or production secrets.

- Local environment files and common credential files are git-ignored.
- Only .env.example is committed and it contains safe documentation/placeholders.
- Every VITE_* value is public because Vite compiles it into browser code. Never use VITE_* for secrets.
- Future secret-bearing integrations must run server/edge-side and read encrypted deployment environment variables.
- Rotate a credential immediately if it is ever committed.

## Deployment
The web/PWA build is Vercel-ready. Preview deployments should pass validation before production promotion. Native WinForms exports run on Windows and are separate from the browser runtime.

## Security and privacy
Read SECURITY.md before reporting vulnerabilities. Dependency updates are configured through Dependabot. Core progress and C# execution are local-first. Voice commands are opt-in and browser speech recognition depends on the browser/OS provider.

## Honest limitations
The browser WinForms preview simulates controls/event wiring; arbitrary native WinForms event C# executes in the exported Windows project. Content is currently primarily English; language selection is not yet complete UI translation. Practical rubric scores are formative static review, not official academic marks or runtime proof.

## Engineering standards
- No secrets in source control.
- Keep dependencies pinned through the lockfile.
- Add tests for behavioural changes.
- Never call a feature tested because it only compiled.
- Preserve accessibility, phone layout and offline behaviour.
- Keep third-party licenses documented in THIRD_PARTY_NOTICES.md.

## License
MIT. Third-party components retain their own licenses; see THIRD_PARTY_NOTICES.md.
