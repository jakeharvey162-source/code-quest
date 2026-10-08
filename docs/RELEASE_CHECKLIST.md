# Release checklist

## Automated release gates

- [x] Unit/security checks, TypeScript and production build pass locally.
- [x] Self-hosted compiler, PWA icons and app-shell asset manifest are included.
- [x] Authored C# challenge solutions compile and produce their expected outputs using Roslyn in Chromium.
- [x] Five-stage learning, failed-code feedback, replay protection, compiler timeout and recovery are covered.
- [x] WinForms CRUD, pointer toolbox drag/drop, one-control double-click placement, F5/Shift+F5, resize, undo/redo, event navigation, editable C# tabs, persistence and ZIP export are covered.
- [x] Practical marking recognises Tor's All(char.IsDigit) pattern and the authored ASCII digit-range example; parsing a number alone does not establish an eight-digit identifier.
- [x] Assessment/history, backup restore, corrupt/blocked storage and legacy save migration are covered.
- [x] Phone navigation/layout and automated serious/critical WCAG checks are covered across all nine routes.
- [x] Offline app loading and C# execution after the first runtime download are covered.
- [x] Controlled transient and persistent lazy-module failures recover without deleting learner progress or looping; blocked session storage leaves manual recovery usable. Service-worker activation retains modules needed by old tabs.
- [x] Actual Postgres role/RLS tests isolate account saves and enforce class ownership, opt-in progress sharing and persistent voice quotas.
- [x] Provider-mocked journeys cover account switching, cloud saves/restore, confirmation/reset, lecturer/learner classes, exhausted voice allowances and unreachable expired sessions.
- [ ] The exact release candidate must pass GitHub CI, including Windows/.NET 8 export compilation, before merging.
- [ ] Verify the deployment commit and repeat a public-browser smoke test after merging.

## Evidence and limits

The local integrated build passes 54 unit/security checks, TypeScript and the production build. The full browser run passes 25 journeys, and seven provider-mocked cloud journeys pass. Focused practical checks pass after the final marking correction. The production dependency audit reports no known vulnerabilities. GitHub CI repeats unit/build/browser/cloud checks and compiles the Windows export; use the run for the exact candidate commit as the release gate.

The production project is https://code-quest-tau-woad.vercel.app/ and tracks main. Live browser testing has exercised actual C# execution, the app-update flow, designer/event-code editing, export initiation, practical handoff and voice-error recovery. The user's original error was not reproduced in a fresh browser; a controlled failed workspace download is covered by the recovery regression. Vercel READY is deployment evidence, not proof that every feature works. Production error-log access is blocked by the connected team's permissions.

## Device acceptance and cloud setup

- [ ] Confirm audible playback, native pronunciation, reading speed, cancellation and microphone recognition on physical devices. Browser API tests do not verify physical audio. The remote browser has no usable installed speech voice.
- [ ] Create/connect a dedicated CodeQuest Supabase project, apply the migration and configure production SMTP. The connected organization has used its active free project slots; no other application's database was reused.
- [ ] Verify confirmation/reset emails, two real account profiles, cloud persistence and class membership on the configured deployment.
- [ ] Verify real ElevenLabs playback after credits become available. Connected-account generation was rejected for zero credits. No verified native isiZulu library voice is claimed.
- [ ] Inspect and run exported native forms on Windows. CI compilation does not verify native GUI interaction.

## Included scope

Self-study with authored English curriculum, local/account-isolated progress, optional accounts/manual saves/history/classes, browser console C# and exportable Windows forms. Language-matched voice previews do not translate the course. Native Android installers, complete course translation and official exam proctoring are not part of the verified release. See DEPLOYMENT.md for configuration and DISTRIBUTION.md for sharing.
