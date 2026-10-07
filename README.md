# CodeQuest

**Build your understanding. Run real C#. Build real Windows Forms projects.**

CodeQuest is an African-rooted learning product for C#, Windows Forms, debugging, OOP and assessment preparation. It combines authored lessons, real in-browser C# execution, a Visual-Studio-inspired form designer, practical marking, adaptive Tor coaching, offline learning and native Windows project export.

## Product status
CodeQuest is an active release candidate. Release candidates must pass unit/regression tests, TypeScript, production build, Chromium user journeys, real C# execution, offline PWA, responsive/accessibility checks and Windows .NET 8 native-export compilation before release.
- **21 authored lessons:** nine C# fundamentals, six WinForms knowledge quests and six OOP coding quests.
- **Real C# compilation:** self-hosted WasmSharp/Roslyn runs in a Web Worker on the learner's device. Build and independent-application challenges check actual output against multiple test cases. The scratchpad compiles arbitrary console C#.
- **Learning loop:** See → Predict → Build → Break & Fix → Apply alone; hints fade and independent application uses a new task.
- **WinForms designer:** all eight standard controls, placement, keyboard movement, undo/redo, Properties, Events, typed control previews, collection Items, password masking and numeric bounds.
- **Native export:** download a ZIP with a Visual Studio solution, net8.0-windows project, Program.cs, Form1.cs and generated Designer.cs. Click, TextChanged, SelectedIndexChanged and CheckedChanged handlers are generated. Practical handler drafts are included in the exported Form1.cs.
- **Assessment arena:** 10-question practice, optional timer, scoring, explanations and result history. Registration briefs hand off to the designer, then a clearly labelled static rubric review suggests targeted lessons. Static review excludes comments/strings and does not verify runtime behaviour.
- **Progress:** earned XP, real study streaks, neighbourhood completion and milestones. Backup/restore moves progress, forms and practical drafts between browsers; previous version-1 saves migrate without losing work.
- **Voice:** automatic language-matched device speech, localized previews, reading speed, Stop and opt-in navigation commands. Optional authenticated ElevenLabs reading uses a server-only key, curated language voices and persistent quotas. Missing voices and exhausted allowances produce actionable messages. No listening before an explicit button press.
- **Accounts and history:** optional Supabase email/password auth, confirmation/reset, account-isolated local profiles, manual cloud save/restore with conflict protection and save history.
- **Lecturer classes:** create/join classes, invite codes, quest assignments and opt-in sharing of completion/XP; private learner drafts remain private under database row-level policies.
- **Study plan:** daily goal and downloadable calendar reminder.
- **Installable/offline:** responsive PWA with icons and cached app shell. Compiler assets are cached after first use. No compiler download on the homepage.
- **Accessibility:** keyboard navigation, visible focus, plain editor option, reduced-motion support and read-aloud text.

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
Guest progress is local to this browser. Signed-in profiles are separate and can be explicitly saved to/restored from Supabase when configured. It is self-study progress, not tamper-proof official assessment records. Clear browser storage and it is removed; export a backup first. Assessment practice is a quiz, not an official university test. The question analyser matches topics; it does not mark arbitrary submitted code/questions. Practical rubric scores describe static pattern coverage, not compiler correctness or official marks. Leaving an active assessment cancels that attempt.

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
## Accounts, voices and deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel setup, database migration, environment variables, mail configuration, sharing and current connection blockers. See `.env.example`; keep real keys out of GitHub. Account/browser flows are tested against mocked provider responses and actual Postgres policy tests run locally with PGlite; live SMTP/Supabase/ElevenLabs deployment checks still require connected services.

`npm run test:cloud` builds a separate provider-mocked browser test configuration. Run it after the normal browser tests; it rebuilds `dist` with test-only Supabase settings, so run `npm run build` again before manual deployment of `dist`.
