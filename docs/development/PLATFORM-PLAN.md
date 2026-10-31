# CodeQuest platform audit and implementation plan

Audited 2026-10-31 against repository commit `2895e7f5f48213fcbb892bc2548f5b08718607c1`.
This is an incremental engineering plan, not a claim of Visual Studio parity.
The existing compiler, tutor, progress records and native exports are compatibility requirements.

## Priority 1 — Developer Studio

| Area / source                                               | Existing behavior                                                                                                     | Gap and next increment                                                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `CodeEditor.tsx`                                            | CodeMirror C# highlighting, authored completion, snippets, search/replace, shortcuts, plain editor                    | Document tabs with independent selection/history; semantic navigation/refactoring requires language services, not additional completion labels |
| `SourceExplorer.tsx`, `source-files.mjs`                    | Shared account-scoped extra C# files, add items, real combined compilation                                            | Flat selector, no rename/remove; console import flattens folders. First PR: hierarchy and safe file management                                 |
| `Playground.tsx`, `project-export.mjs`, `ProjectReader.tsx` | Console project ZIP; Forms solution/project, designer code, handlers and restoration manifest; bounded ZIP reads      | One implicit project; no project references, MSBuild or NuGet. Preserve folder paths before introducing versioned projects                     |
| `compiler.ts`, `compiler.worker.js`                         | Real local Roslyn/WasmSharp worker, cancellation, loading/compile/run timeouts                                        | Source concatenation/using hoisting has no reliable original-file mapping. Add mapping before diagnostic navigation                            |
| `FormDesigner.tsx`, `debug-practice.mjs`                    | Designer validation Error List; real handler execution; recorded trace/watch/step replay                              | Separate compiler diagnostic table needed. Recorded replay is not live pause/step, call stack or variable evaluation                           |
| `FormDesigner.tsx`, `designer-engine.mjs`                   | 16 controls, placement/resize, containers, keyboard movement, undo/redo, Properties/Events, native Anchor/Dock export | Add multi-select and transactional align/distribute/copy, preserving parent-relative geometry and native export                                |
| `styles.css` / workspace components                         | Responsive fixed toolbox/canvas/properties, movable running form                                                      | Add persisted panel visibility, keyboard dock/resize controls and reset layout, then pointer docking                                           |
| `UniversalTerminal.tsx`, `terminal-sandbox.mjs`             | Seven language modes, examples, saved drafts, real execution and isolated previews                                    | Learning tracks/projects are incomplete; do not replace functioning runtimes with simulated editors                                            |

### Reviewable pull requests, in order

1. **Hierarchical Solution Explorer and safe C# items** (current implementation): one explicit local solution/project, folder/file navigation, keyboard tree, folder creation through Add item, file rename/move, confirmed removal, legacy storage compatibility and nested console/WinForms export/import. Rename changes the path only. Keep the existing quick selector. Verify traversal/case/file-folder collision rejection, real C# execution, ZIP restoration, storage failures, mobile and accessibility. No fake references, generated-file editors or breakpoint controls.
2. **Versioned project workspace**: separate console and Forms projects through an explicit migration that retains the current shared files and recovery copy; project names/templates, document tabs and independent undo. Test account switching, quota failure, old backups, multi-project ZIP selection and native export. No destructive automatic migration.
3. **Diagnostics and execution state**: expose real compiler phases; retain raw messages; map transformed sources to original file/line/span before clickable Error List entries. Test syntax errors in imports, file-scoped namespaces, stdin transformations, multiple files and stale results. Mark diagnostics stale after edits. Keep runtime errors distinct from compiler errors.
4. **Workspace panels**: persist dock/size/visibility by workspace, keyboard alternatives, mobile stacking, reset layout. Test focus recovery, resize bounds, storage failures and reduced motion. Do not claim native OS floating windows.
5. **Designer and debugging**: multi-selection, alignment/distribution, copy/paste with unique names/event policies and undo as a single action. Improve real trace instrumentation and replay navigation; explicitly label replay. Live debugging needs a supported runtime protocol and cannot be manufactured from trace steps. Compile exported native samples on Windows .NET 8 in CI.

### Microsoft workflow comparison

Reviewed Microsoft's current documentation source in `MicrosoftDocs/visualstudio-docs` via `raw.githubusercontent.com`; direct Learn requests were blocked by the environment's network policy. Reference workflows:

- [Solution Explorer](https://learn.microsoft.com/en-us/visualstudio/ide/use-solution-explorer): actual solution/project/item hierarchy and contextual actions.
- [Solutions and projects](https://learn.microsoft.com/en-us/visualstudio/ide/solutions-and-projects-in-visual-studio): project boundaries, references and build configuration.
- [Window layouts](https://learn.microsoft.com/en-us/visualstudio/ide/customizing-window-layouts-in-visual-studio): docking, resizing, save/reset and keyboard operation.
- [Error List](https://learn.microsoft.com/en-us/visualstudio/ide/error-list-window): severity/scope filtering and source navigation.
- [Debugger tour](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour): live breakpoints, stepping, watches and call stack, distinct from recorded replay.

Use original CodeQuest styling and icons. Do not copy Microsoft's proprietary branding.

## Priority 2 — playable 3D coding campus

Current `CityMap.tsx` is an SVG navigation map, not a 3D game. `TorAvatar.tsx` already uses Three.js, licensed CC0 RobotExpressive (`public/models/TOR-LICENSE.md`, approximately 464 KB), animation crossfades, gestures and speech-driven expressions. Preserve Tor's model and identity. It already caps DPR, skips hidden rendering and falls back when WebGL is unavailable; repeated model traversal/head bounds work and continuous reduced-motion rendering remain optimization opportunities.

1. Admit actual Higgsfield GLB exports organized through Polytweaks: versioned asset manifest with author/provider/export IDs, license/provenance, SHA-256, dimensions, triangles, materials/draw calls, textures and LODs. Set budgets before admitting assets; inspect representative renders and performance. No provider tools, credentials or supplied packages are currently available, so provider integration is unfinished. Do not invent provenance or substitute unlabeled assets.
2. Lazy-load one playable campus area: keyboard/touch movement, bounded collision, accessible workstation activation, shared mission graph with a fully usable 2D list/map, low-quality mode, reduced motion and WebGL-loss recovery. Initial acceptance budget: no campus download on other routes, DPR at most 1.5, bounded texture/geometry memory, no per-frame React state. Measure frame time on a documented representative low-performance device before expanding.
3. Connect missions/NPC guidance to named programming exercises. Award mastery only from successful genuine exercise harness results tied to the submitted source/attempt version; reject stale/failed results and deduplicate rewards. Walking, clicking or arbitrary program execution earns no mastery. Existing local progress is editable and is not authoritative certification; use authenticated server validation for high-stakes rankings.
4. Refine Tor with cached scene references, measured animation scheduling and existing licensed clips. Regression tests cover reduced motion, speech lifecycle, hidden tabs, context loss and 2D mission parity. Profile before replacing assets or changing visual identity.

## Priority 3 — coherent language learning

The terminal already supports JavaScript/Canvas, HTML, CSS, Python/Pyodide, Python Turtle/Skulpt, TypeScript transpilation and real C#. C# has authored lessons and real challenge harnesses; terminal prompts are ungraded practice, not a structured curriculum.

1. Add versioned language-track/project schemas, accessible language selection, objectives/prerequisites and saved attempts without losing current drafts. Start with JavaScript and Python; ship complete small projects with real expected-result tests, feedback and error explanations.
2. Run non-DOM JavaScript/Python assessment code in disposable workers with strict time/output/memory bounds where supported; retain opaque-origin sandboxing and explicit Run for shared code. DOM exercises need constrained iframe tests. A sandbox iframe is not process isolation: synchronous JS can still freeze a tab today. Test worker termination, stale messages, source/origin tokens, CSP/network denials and cancellation.
3. Add TypeScript semantic diagnostics using the pinned compiler and controlled library definitions. Current transpilation is not semantic type checking. Explicitly document absent imports/native packages. HTML/CSS tracks use observable DOM/accessibility assertions; visual practice/self-report stays distinct from verified tests.

## Verification and delivery

- Before merge: unit/regression tests, TypeScript, build, full Chromium journeys, provider-mocked cloud and community suites. Run feature-focused axe, keyboard and mobile tests. Report passed/failed/skipped totals and known repository failures separately.
- Native WinForms export execution/build is a Windows .NET 8 CI requirement and cannot be claimed from a Linux browser test. Hosted SMTP/Supabase/voice/AI and real device performance are separate checks.
- Each PR contains its behavior, migration/compatibility impact, actual validation and explicit unfinished features. No release-wide completeness claim from a single increment.
- This plan does not authorize removal of functioning editor/compiler/designer/terminal/tutor features. New UI must exercise real state and execution.
