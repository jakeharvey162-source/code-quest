# CodeQuest integrated game + studio release gate

**Decision: do not merge to production until these gates are verified on one exact integration commit.**

The current main branch is the existing live site. PR #44 is the developer-studio increment; #45 supplies compiler-verified Lagos missions; #46 adds the first optional, procedural 3D vertical slice. PR #43 adds an overlapping, simpler Story Mode. Review and reconcile, rather than merging all branches into main sequentially.

## Verified in the feature code vs missing for the original release vision

| Capability | Current implementation | Full release acceptance |
| --- | --- | --- |
| Real C# coding repairs | Three mission harnesses compiled with the existing local C# engine | Happy paths, boundary cases, syntax errors, oversized drafts, cancellation, stale runs and XP idempotency pass on integrated build |
| Premium 3D Lagos | Optional Three.js procedural street, box avatar and local Tor GLB | Reviewable authored neighborhood design, licensed modular GLB city kit, accessible streets, interiors/workstation locations, polished materials, lights, effects and high-quality character/NPC animations |
| Game navigation | Basic WASD/arrows and touch pad, simple camera yaw and path limits | Reliable desktop and mobile controls, turn/zoom camera, tested collisions and camera clipping, prompts, user navigation, pause/restart and progress persistence |
| Tor game companion | Local existing CC0 model, authored hints, basic follow behavior | Tested locomotion/idle animations, mission-specific dialogue, interaction, mute/reduced-motion rules, graceful model failure and AI network privacy |
| C# IDE | Working browser C# compiler/CodeMirror/WinForms; #44 adds nested Solution Explorer and safe file management | One integrated project workspace, tabbed files, real source-mapped compiler diagnostics, safe save/restore, verified export and honest recorded-debugger labeling |
| Other languages | Existing terminal runtimes | Coherent language selector and at least one full, tested JavaScript and Python mission track before calling it a multi-language story game |
| Accessibility / devices | 2D fallback, mobile controls, optional 3D and Tor | Full keyboard-only access, touch tests, no serious accessibility findings, screen reader mission parity, OS/app reduced motion, WebGL context-loss fallback |
| Performance | Lazy 3D component, DPR cap and hidden-tab pause | Representative low-end-device profiles, measured scene frame time and memory, download budgets, bounded draw calls/geometry/materials, LOD/texture compression, no uncontrolled frame allocations |
| Visual evidence | CI screenshot capture for the real WebGL scene (not a fabricated mockup) | Genuine captured desktop/phone pictures and gameplay video reviewed against final design; protected previews available to reviewers |
| Accounts & security | Existing local/cloud progress, some provider mocks | Signed-in account isolation, guest data, restore/backup conflict handling, trusted rewards policy and realistic threat model tested on the integrated exact commit |

## Required order before release

1. **Stop and fix failures.** Identify all exact-head GitHub Action failures in #45 and #46 (including the oversized editor regression); do not paper over a wrong-code result with a longer timeout. #44 must remain green.
2. **Capture honest visuals.** Produce screenshots from a successful software-WebGL Playwright run, plus a real browser smoke test through an appropriately authenticated Vercel preview. Do not claim to have visually reviewed a Vercel deployment solely from a READY state.
3. **Premium art package.** Define a coherent stylized/grounded African city art direction, not a generic placeholder game. For each model record creator, license, source URL, version, GLB hash, vertex/triangle counts, textures, draw calls and optimization results. Prefer appropriately licensed free assets; require approval before consuming paid Higgsfield/other provider credits. Do not substitute an AI image for a working 3D mesh.
4. **Complete one entire game loop.** Player enters 3D Lagos; Tor explains the mission; player finds an NPC/workstation, triggers the CodeQuest IDE, makes a genuine compiler-verified repair, returns to the same world position; the environment visibly changes; achievement is granted exactly once; save, refresh, offline/retry and account switch are correct.
5. **Add polish and game usability.** Replace box avatar and geometric buildings, add working animations, NPC roles, camera and collisions, optional audio, clear controls, realistic lighting and engaging missions. Keep a fully capable accessible 2D path and low-power mode.
6. **Integrate developer tools safely.** Create a separate integration branch bringing reviewed work from #44 and #46. Avoid duplicate Story Mode routes/components from #43 and #45. Preserve every existing compiler, terminal, WinForms, Tor, account and Community workflow.
7. **Verify exact integration commit.** Run unit/typecheck/build, full Playwright, dedicated WebGL, 3D mission gameplay, simulated no-WebGL, mobile 320/360/412px and desktop, accessibility, cloud isolation, community, Windows .NET 8 native export. Report pass/fail/skipped counts, reproducibility, crash cases, and documented exceptions.
8. **Preview and approve.** Show real screenshots/video of integrated release, compare against the original experience and approve a protected preview after manual checks. Ensure rollback instructions and backups are in place. Only then mark final integration PR ready to merge and let the tested main commit deploy to production.
9. **Postdeploy smoke.** Verify the production alias is serving the exact expected SHA, complete a real sample coding mission, check login and progress persistence and inspect runtime errors. Revert to last known-good deployment if critical smoke checks fail.

## Nonclaims

- READY Vercel deployment is **not** evidence of a passing gameplay test.
- An unmerged draft PR is **not live**.
- Procedural 3D architecture is **not** a premium fully modeled city.
- Recorded C# execution traces are **not** a native live debugger.
- An unsigned client-side XP counter is **not** independently certified assessment.
- No claims of 60 FPS, photorealism, full Visual Studio compatibility or full language curricula without direct evidence.

Only merge when the tracked release gates are genuinely closed.
