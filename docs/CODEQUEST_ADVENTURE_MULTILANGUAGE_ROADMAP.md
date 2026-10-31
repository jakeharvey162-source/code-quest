# CodeQuest Adventure + Multi-Language Studio — implementation plan (30 Oct 2026)

## Product promise

**CodeQuest is a real coding adventure, not a tutorial website wearing game decorations.** Every mission ends in executed, objectively checked learner code. Code changes the visible world; the existing trustworthy compiler and real learner progress remain the authority. Tor is the existing companion, not a duplicate chatbot. Keep the present CodeQuest interface recognizable and preserve every route, cloud save, WinForms project, challenge, and account feature.

GitHub issue #42 already describes the Lagos story vertical slice. This draft PR implements a deliberately small opt-in first piece; **it does not claim to be a finished 3D game or multiple complete courses**.

## Current foundation verified from source

- 21 authored C# lessons, 3 districts (Lagos 9, Johannesburg 6, Kinshasa 6); five lesson stages (See, Predict, Build, Break & fix, Apply alone).
- Real C# browser runtime, WinForms designer, assessments, debug practice, Code Lab, and terminal.
- Universal Terminal already supports C#, JavaScript, TypeScript, Python, Python Turtle, HTML and CSS: runtime availability does NOT mean fully written curricula exist.
- Three.js-based Tor GLB avatar already exists. District map is SVG, not currently 3D.
- Online free-form Tor requires authenticated account and a working hosted provider. Offline guidance must remain available without model access.
- Cloud progress, classes, community and leaderboard already exist; build upon them without assuming production account flows are fully verified.

## Implemented in the first safe pull request

Files: src/lib/story-missions.mjs, src/components/RookieStory.tsx, src/styles.css, src/main.tsx, tests/story-mode.test.mjs, tests/story-mode.spec.mjs.

- Optional **Enter story mode** on the existing World page; it does not replace the existing hero, city map, Learn, Code Terminal or side navigation.
- Three authored Lagos story cards mapped to existing C# lessons (`variables`, `strings`, `conditions`) with real tests in the existing lesson engine.
- Street landmarks change from dark to lit ONLY when progress.completed already marks the respective completed lesson. A partially completed lesson shows in-progress; clicking a card opens the actual lesson. No special game XP, reroll, invented scores, fake multiplayer or destructive progress migration.
- A concise language launchpad is explicit: C# full lessons exist; Python, JavaScript, TypeScript, HTML and CSS are currently runnable through Code Terminal, not new finished learning paths.
- Styling follows the six supplied premium-interface reels: coherent palette, contrast, typography, measured highlights and depth, one clear action, responsive layout, real interactions, reduced-motion support. The existing CodeQuest cream/green/amber base is retained; only the optional story area gets a restrained midnight/cobalt accent.

## Product architecture / milestones for Codex Astra

### Gate A — Production verification before expansion

1. Re-run `npm ci`, `npm run check`, `npm run test:browser`, `npm run test:cloud`, `npm run test:community`, WebGL test and Windows/.NET export on the exact PR commit. Preserve all artifacts and exact fail messages. Add fixed mobile snapshots at 320, 360, 390 and 412 px. Check keyboard focus, reduced motion, screen reader, old progress and new browser guest.
2. Verify anonymous and authenticated Tor independently: the anonymous online request must show an honest sign-in path, not a fake model answer; an authorized test account must receive a real model reply and a controlled quota/failure response, without revealing credentials. Remove test records. If no authorized signed-in session is available, explicitly mark **live AI response NOT VERIFIED**; do not bypass auth or fabricate one.
3. Confirm every route (World, Lessons, Code challenges, Video tutorials, Code Lab, Code Terminal, WinForms, Assessment, Leaderboard, Progress, Settings, Account) renders and has a safe primary action; test on production with one user and no changes to other members' data. Resolve cross-device/cloud restore and accessibility regressions before merge.

### Gate B — A genuine playable Lagos world (follow-on PR)

1. Replace **optional story area's skyline preview**, not global navigation, with a lazily loaded Three.js/LGLTF street scene. Clicking or keyboard-selecting a building focuses its mission; the same mission cards remain in accessible DOM.
2. Use a single coherent low-poly 3D art direction: Lagos market, welcome studio, and crossing, initially unlit; after the real completed lesson they brighten and people/vehicles appear. No progress for mere visits or viewing an answer.
3. Use Tor's EXISTING 3D identity (do not add a second mascot), reacting to genuine statuses: available, learner testing, compiler error, completed; animated dialogue is skippable. Keep hints user-initiated.
4. Lazy-load assets, cap draw calls and pixel ratio, pause rendering on hidden tabs, support low-power phones/WebGL failure, keyboard/reduced-motion and a 2D accessible map fallback. Measure runtime memory, FPS and first interaction before choosing a quality tier; do not claim 60 FPS without evidence.
5. Implement a single vertical slice: start story -> select market mission -> compile actual C# -> complete all stages -> see persistent street restoration -> return next day to the correct next mission. Then extend to other landmarks and cities.

### Gate C — Language selection and authored multi-language lessons

1. Create a course registry with `courseId`, `languageId`, `displayName`, `runtime`, `lessonIds`, `judgeVersion`, `supportedFeatures`, `availability`. Do not conflate interface language (e.g., French text) with programming language (Python).
2. Keep the existing C# course unchanged. First add a small **Python** beginner quest sequence and a **JavaScript** beginner quest sequence, each with worked examples, prediction, executable build, bug fixing, independent apply, and deterministic hidden/visible tests.
3. Reuse the real Code Terminal runtimes/sandbox; do not evaluate arbitrary user code in the app origin, API workers or shared database. Python Turtle, HTML, CSS and TypeScript follow after proper validated graders and source preview isolation. Consider SQL with an isolated, scoped database later.
4. Scope progress and XP by courseId/languageId with migration-safe backward compatibility. No duplicated XP from switching courses or submitting unchanged code. Let learners swap courses any time, save drafts separately and see honest prerequisites.
5. Tor instructions and contextual prompts carry the chosen programming language and real compiler diagnostics, never conflate JS errors with C# explanations. If language support is experimental, label it.

### Gate D — Visual Studio-inspired **Studio Mode** without cloning proprietary assets

1. Keep current Code Terminal and compact lesson editor. Add an OPTIONAL Studio layout with Activity Bar, Explorer tree, editor tabs, Problems/Test panel, Output/Terminal, live preview and collapsible Tor drawer.
2. Layouts are drag/resizable on desktop; mobile uses bottom sheets or tab navigation, not squeezed desktop panels. Keyboard shortcuts are documented and must not steal browser/system shortcuts.
3. Use current C# Roslyn, JS/TS, Python and HTML/CSS runtimes via a common typed execution adapter, isolated sessions and cancellation. Truthful output/errors only. Browser worker + iframe CSP/sandbox rules and strict resource ceilings must remain enforced.
4. Project import/export, auto-restoration and synced drafts need collision protection and deterministic regression tests. No proprietary Visual Studio icons/code or false claim of Microsoft affiliation.

### Gate E — Endless new missions that are actually correct

1. Begin with a curated challenge-template library per language with controlled variants (seeded inputs, tests, explanations, hints, difficulty labels) so new challenges exist without inventing answers.
2. AI may *propose* story text, educational hints or new tasks to a review queue, but cannot instantly publish/grade untested programs or award points based on its opinion.
3. Require solutions to compile/run against both public and hidden cases, property tests, complexity/time limits and teacher review for new variants. Only deterministic graders award progress. Track recurring mistakes privately to suggest spaced practice.
4. A daily mission is a useful optional suggestion; do not pressure learners with streak threats, random loot or compulsive time limits.

### Gate F — Fair, safer player challenges

1. Start with asynchronous **Challenge a friend**: identical seeded problem, matched language/difficulty and tests, private invite code, privacy-safe pseudonyms, voluntary participation, accessible timing options. No real-money fees, betting, or cash rewards.
2. Server signs and verifies scores from isolated checks, never trusts client-submitted XP or downloaded answer strings. Prevent replay, plagiarized solutions and multi-account gaming, with transparent moderation and appeals.
3. Opt-in public rankings (if enabled) should show verified achievements and fair completion metrics. Age-appropriate defaults protect private profiles and avoid unsolicited messages or public personal identifiers.
4. Later: cooperative team repair quests, classroom tournaments and user-created levels with moderation and safe code sandboxes. Do not promise real-time multiplayer until server arbitration and abuse/latency tests pass.

## Competitive position

- CodeCombat already offers code-controlled game worlds, user-created levels and head-to-head arenas; CodeQuest must differentiate through a creative project-building studio and premium 3D world that reacts to *real code quality*, not just mimic combat.
- Codédex has several languages, XP/badges, practice and a portfolio/community; CodeQuest should connect those systems to realistic editor/debugger/app-building skills.
- Mimo has multi-language structured learning, AI help and projects; CodeQuest's strongest opportunity is an enjoyable **game + credible IDE + authentic assessment** combination, not simply claiming more languages.
- Compare objective journey metrics (first working program, compiler error recovery, completion of a five-stage quest, returning to project, mobile responsiveness) rather than unverified superiority or vanity scores.

## Required CI/release gates

- `npm run check`, Playwright desktop/mobile, cloud, community, WebGL, and Windows native export stay green. No production merge without successful exact-head CI.
- New story regressions: guest toggle, zero-visit XP, genuine completion, reload, no stuck missions, existing direct lesson routes, mobile 320/360/390/412, keyboard and reduced motion.
- New languages: real runtime compilation, expected output, sandbox escape tests, concurrent cancellation and deterministic grading.
- Competition: identity/permission/RLS, private invite, seeded fairness, anti-replay, moderation, no personal data exposure, and no buy-in.
- Optional 3D: quality/performance budgets, 2D fallback, WebGL unavailable, context loss, touch and keyboard controls, low-memory device.
- User-facing errors explain what failed. Never claim real Tor generation without a genuine authenticated model response.

## Ownership / task routing

**Astra in Codex**: primary engineer for GitHub branch/PR, React/Vite/Three.js scene, lesson registry and graders, multiplayer backend/security, Playwright, Supabase migrations, CI, and incremental safe merges.

**ChatGPT Work**: supplementary UX and competitive research, exploratory browser testing with authenticated user-approved profile, production acceptance documentation, storyboard/copy critique. Work is not a substitute for Codex integration tests.

**User**: choose the desired look/feel from a working screenshot/video of the Lagos slice, authenticate to validate account-gated features through a user-approved session (never share passwords in chat), approve production release. Existing product remains available during review.

## Not yet delivered by the first PR

No finished 3D playable city, no new full Python/JS/HTML courses, no competitive server, no Visual Studio replacement, no production deployment, and no real authenticated Gemini response. These are deliberately honest scope boundaries.
