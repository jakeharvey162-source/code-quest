# Release checklist

## Automated gates

- [x] Clean npm ci, unit/regression tests and TypeScript pass.
- [x] Production static build includes self-hosted compiler, PWA icons and shell asset manifest.
- [x] Thirty coding solutions compile and produce the authored expected outputs using Roslyn in Chromium.
- [x] User completes all five lesson stages; invalid C# yields real errors; XP is not awarded twice.
- [x] Scratchpad runs, infinite loop is stopped and subsequent execution recovers.
- [x] Form designer CRUD, properties, preview, undo, export and persistence pass.
- [x] Exported solution builds on Windows with .NET 8.
- [x] Assessment scoring/history, backup restore and corrupt storage recovery pass.
- [x] Voice-selection, reading-speed, cancellation and denied-microphone handling pass.
- [x] Phone navigation/layout and automated WCAG serious/critical checks pass.
- [x] App shell and lazy pages load offline after first install.
- [ ] Live production URL serves the app, worker, runtime and PWA assets.

## Device acceptance

Use Settings → Voice & accessibility → Read aloud on a real phone/desktop. Confirm audible playback, selected voice and speed, cancellation, microphone permission recovery and recognition accuracy. Headless automation cannot verify physical audio or every vendor voice service. Check exported native forms visually in Visual Studio on Windows; compilation is not a substitute for native GUI interaction.

## Included scope

Single-device self-study application with authored English curriculum, local progress, browser console C# and exportable Windows forms. No cloud account, automatic translation, official exam proctoring or native Android APK is implied by this release.

## Verification evidence (7 October 2026)

31 unit/regression tests, TypeScript and production build pass. All nine Chromium user-flow tests pass, including 30 actual C# solutions, five-stage lesson completion, replay protection, compiler timeout/recovery, designer ZIP export, assessment/history, backup recovery, voice API lifecycle/permission handling, all seven mobile routes with no serious/critical axe findings, and offline shell/lazy-page loading. Voice automation uses controlled browser API doubles; physical audio is a device acceptance gate.

Public deployment is blocked: Vercel returned 403 Forbidden for team_Kfsdvn1tXmeZLCVzYI7pDa66. Reconnect an account authorized for that team before creating the production project.

GitHub Actions run 37600253084 compiled the exported Windows/.NET 8 solution successfully. Its stock Chromium exposed an intermediate navigation color-transition contrast issue; background interpolation was removed so foreground/background pairs remain consistent during route changes.

## Production hardening revision

Latest branch changes were reread and preserved. Upgrades migrate legacy profiles and form event fields, blocked storage no longer crashes practical routes, backups include practical drafts, and reset clears all learning drafts. New selection/checked event handlers and practical handler bodies are included in native exports; CI compiles that richer sample. Practical review ignores comments/quoted examples, distinguishes eight characters from digit validation, respects the learner's coach tone, and links directly to targeted lessons. Voice input languages expose matching constrained command phrases; lesson text remains English.

41 unit/regression tests pass. All 17 Chromium browser flows pass together, including actual C# offline execution after its first download. Final GitHub CI additionally validates the richer Windows sample. The dependency audit reports zero known vulnerabilities.
