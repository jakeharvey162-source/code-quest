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
