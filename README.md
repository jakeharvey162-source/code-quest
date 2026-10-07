# CodeQuest

**Build your understanding.** An African-rooted, globally accessible C#, WinForms and OOP learning app. No account, paid API or server is required for learning and code execution.

## What works

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

## Run locally

Node 24:

```sh
npm ci
npm run dev
```

Checks:

```sh
npm run check
npx playwright install --with-deps chromium
npm run test:browser
```

Browser tests use the production build (`npm run build` first). Build: `npm run build`; serve: `npm run preview`. Static output: `dist/`. Compiler preparation copies the pinned npm runtime, including its license, and vendors Comlink so the app needs no runtime CDN.

## Scope and honest limits

Lessons are in English; choosing a voice does not translate content. Device voices and speech recognition depend on the browser/OS. Browser recognition may send microphone audio to the browser vendor. Tests can verify handlers, selected voice/rate and error states but cannot establish audibility on every user's physical speaker/microphone.

The browser compiler's first run loads about 40 MB. Code is isolated from the UI in a worker with a 10-second execution timeout and Stop control. It is not a server-side execution service. Console.ReadLine interactive input and native Windows APIs are outside its scope. Native WinForms executes in the exported Windows project; preview controls do not execute C# handler logic. Add the handler's business logic in Form1.cs.

Guest progress is local to this browser. Signed-in profiles are separate and can be explicitly saved to/restored from Supabase when configured. It is self-study progress, not tamper-proof official assessment records. Clear browser storage and it is removed; export a backup first. Assessment practice is a quiz, not an official university test. The question analyser matches topics; it does not mark arbitrary submitted code/questions. Practical rubric scores describe static pattern coverage, not compiler correctness or official marks. Leaving an active assessment cancels that attempt.

## Validation

CI runs unit/regression tests, TypeScript, a production build, Chromium user journeys, all 30 authored coding solutions through the real browser compiler, offline loading, phone layout and WCAG accessibility checks. A Windows job builds the exported Visual Studio solution with all toolbox controls, all four supported event types and an authored handler body. `docs/RELEASE_CHECKLIST.md` records the release checks and remaining device checks.

## Free/open-source foundations

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for repository links and licenses: React, Vite, WasmSharp/Roslyn, CodeMirror, fflate, Lucide, Comlink, Playwright and axe-core. Lesson content, UI, district illustration, progress model and app integration are authored for CodeQuest.

## Accounts, voices and deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel setup, database migration, environment variables, mail configuration, sharing and current connection blockers. See `.env.example`; keep real keys out of GitHub. Account/browser flows are tested against mocked provider responses and actual Postgres policy tests run locally with PGlite; live SMTP/Supabase/ElevenLabs deployment checks still require connected services.

`npm run test:cloud` builds a separate provider-mocked browser test configuration. Run it after the normal browser tests; it rebuilds `dist` with test-only Supabase settings, so run `npm run build` again before manual deployment of `dist`.
