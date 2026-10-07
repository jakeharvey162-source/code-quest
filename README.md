# CodeQuest — C# Adventure

African-first, globally usable game-based learning for C#, WinForms and OOP.

Learning loop: **See → Predict → Build → Run → Break → Fix → Explain → Apply alone**.

Current foundation includes the bright quest map, Visual-Studio-style lab, OOP mission, progressive Tor feedback, assessment skill detection, local persistence, language/voice preferences, study reminders, automated learning-engine tests and build CI.

The browser WinForms trainer will follow proven designer patterns: Toolbox → Canvas → Properties → Events → generated Designer.cs model. Full compiler execution remains a separate Roslyn/.NET WebAssembly adapter so lessons are not coupled to one runtime.

Run: `npm install && npm run check && npm run dev`.

## v0.3 designer slice
- Interactive WinForms toolbox and form canvas
- Selectable controls with editable Name/Text/X/Y properties
- Local form persistence
- Generated WinForms-style Designer.cs preview
- Automated tests for add/update/remove/code-generation behavior

## v0.4 learning loop
OOP Lab now exposes explicit See → Predict → Build → Break + Fix → Apply Alone stages, with help fading toward independent work. Passing a coding check advances the learner rather than merely awarding XP.

## v0.5 Visual Studio-style Properties
Designer properties now include categorized Design, Appearance, Layout, Behavior, Events and Accessibility fields: Name, Text, Font, ForeColor, BackColor, location/size, Anchor, Dock, Enabled, Visible, TabIndex, Click/TextChanged handlers and AccessibleName. Designer validation checks unique/valid names and required Button Click wiring.

## v0.6 readiness
- Offline service worker with cache-first fallback after first successful load
- Explicit CI permissions, PR/push/manual triggers and separate test/build steps
- PWA manifest scope/start URL

### Release gate
Do not merge until CI is observable and green, browser interaction tests pass, and real C# compilation adapter is integrated. Structural mission checks are teaching feedback, not a compiler.


## Reliability update (7 October 2026)
- Repaired the npm lockfile and pinned dependency versions; CI now checks TypeScript as well as tests/build.
- Control identifiers remain unique after deletion; numeric properties are clamped and handler names validated.
- Designer preview escapes C# strings and includes font, colors, anchor/dock, accessibility, TextChanged wiring and Controls.Add.
- Storage corruption and unavailable/quota-limited storage no longer crash the designer.
- Each lesson stage now checks its own task; Employee application cannot pass with the Student answer. XP is awarded once per stage and progress is persisted.
- Mobile navigation remains reachable. Reduced-motion preferences are respected.
- Offline failures only return the HTML shell for navigation, never for a missing JavaScript asset; unrelated caches are preserved.

Validation: 24 unit/regression tests, TypeScript check and production build passed locally. Browser regression coverage is in `tests/browser.spec.mjs` and CI (`npm run test:browser`). Local Chromium download was blocked by a corrupt download response; browser execution must be verified in CI.

Current limits: this is a browser teaching prototype, with structural C# checks rather than a compiler. The canvas uses selectable control representations, not native WinForms execution. Assessment input detects skills but routes to the fixed OOP lesson. Other district curricula, translation, scheduled notifications, a full C# runtime and timed assessment marking remain unfinished. The existing release gate still applies; keep the PR draft.
