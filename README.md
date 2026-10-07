# CodeQuest

**Build your understanding.** An African-rooted, globally accessible C#, WinForms and OOP learning app. No account, paid API or server is required for learning and code execution.

## What works

- **21 authored lessons:** nine C# fundamentals, six WinForms knowledge quests and six OOP coding quests.
- **Real C# compilation:** self-hosted WasmSharp/Roslyn runs in a Web Worker on the learner's device. Build and independent-application challenges check actual output against multiple test cases. The scratchpad compiles arbitrary console C#.
- **Learning loop:** See → Predict → Build → Break & Fix → Apply alone; hints fade and independent application uses a new task.
- **WinForms designer:** all eight standard controls, placement, keyboard movement, undo/redo, Properties, Events, typed control previews, collection Items, password masking and numeric bounds.
- **Native export:** download a ZIP with a Visual Studio solution, net8.0-windows project, Program.cs, Form1.cs and generated Designer.cs. Event handlers are wired with editable bodies.
- **Assessment arena:** 10-question practice, optional timer, scoring, explanations and result history.
- **Progress:** earned XP, real study streaks, neighbourhood completion and milestones. Backup/restore moves progress and forms between browsers.
- **Voice:** available device voices, reading speed, stop control, opt-in navigation commands and permission/support errors. No listening before an explicit button press.
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

Progress is local to this browser. It is self-study progress, not tamper-proof official assessment records. Clear browser storage and it is removed; export a backup first. Assessment practice is a quiz, not an official university test. The question analyser matches topics; it does not mark arbitrary submitted code/questions. Leaving an active assessment cancels that attempt.

## Validation

CI runs unit/regression tests, TypeScript, a production build, Chromium user journeys, all 30 authored coding solutions through the real browser compiler, offline loading, phone layout and WCAG accessibility checks. A Windows job builds the exported Visual Studio solution with all toolbox controls. `docs/RELEASE_CHECKLIST.md` records the release checks and remaining device checks.

## Free/open-source foundations

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for repository links and licenses: React, Vite, WasmSharp/Roslyn, CodeMirror, fflate, Lucide, Comlink, Playwright and axe-core. Lesson content, UI, district illustration, progress model and app integration are authored for CodeQuest.
