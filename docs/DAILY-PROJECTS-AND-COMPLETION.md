# Daily repairs and C# suggestions

Code Challenges → **Daily repair project** opens a repeatable project for the device's local date. **Another repair project** produces another variation on demand. The format follows the supplied UJ-style practice: repair a class, recover/parse records, validate capture, check business rules and statistics, and explain the repairs. Original practice files and the ten reviewed missions remain available.

The generator varies equipment prefixes, codes, maximum booking days and combinations of three to five defects. Each project has 16 checks. These are renewable variations of a reviewed project family, not unlimited new topics or official exam predictions. The current source and rules remain stable when the page reloads. The date label updates while the app is open, but crossing midnight never replaces unfinished code automatically.

One active generated draft and one previous generated draft are retained, including input and completion status. Restore previous project swaps them. Opening today's project also resumes it if it occupies the previous slot. Export this project code before cycling through more variations. Original mission drafts stay separate. Generated exercises award no repeat XP and are not secure examination grades.

## Editor assistance

The rich C# editor now suggests declared variables with type labels, local/project class names, public class members and common C#/WinForms APIs. Examples: `string name` → type `na` and choose `name`; `name.` → string members; `Console.` → WriteLine/ReadLine; `booking.` → public members declared in a class. Code Lab supplies other source files as suggestion context; WinForms also supplies its control names and types.

Use Ctrl+Space or **Suggest** to open suggestions, then arrow keys and Tab/Enter to choose. Mouse/touch selection works too. Existing standalone snippet aliases still expand with Tab twice. Escape then Tab leaves the editor. The plain accessible textarea mode retains its existing snippet support; the completion menu belongs to the rich editor.

Suggestions use offline declaration scanning and reviewed member lists. They are not Visual Studio's full Roslyn semantic IntelliSense: complex generics, chained expressions, overload resolution, every library API and precise nested-scope analysis are not implemented. The C# compiler remains the authority for validity. No code is sent to an AI service to generate suggestions.

Browser checks caught and fixed a fast-Tab acceptance race and a Suggest-button viewport issue. Suggestions inside comments and strings are suppressed. Declaration names are ranked ahead of general keywords. The popup has constrained phone width and 44px phone options.

## Verification boundaries

The preceding published commit 5b4a5b4 passed GitHub Actions run 38731827642, including the full browser suite, account/Classroom and Community fixtures, explicit 3D Tor verification and Windows native-export compilation. Local Community coverage previously passed all 12 cases: messaging persistence, friend-consent DMs, blocks, offline queues/reconnect, account isolation, moderation, unread state, history search and 320px–desktop layouts. These do not establish hosted production delivery.

This update's tests cover declared-name/member selection, real C# execution after completion, pointer selection, Enter and Tab acceptance, phone width, South African local midnight, reload, previous-draft recovery, original challenge grading and generated starters/solutions. The generator is checked for deterministic variation across 50 rounds; browser compilation checks three projects against all their rule cases. Test outcomes are recorded after the final follow-up checks.

No production merge or Community migration was performed. At the last read-only inspection, Community tables were absent; hosted two-account messaging and real authentication/reset-email delivery remain release requirements.

## References checked

- https://codemirror.net/examples/autocompletion/
- https://codemirror.net/docs/ref/#autocomplete
- https://learn.microsoft.com/en-us/visualstudio/ide/using-intellisense

## Final local results — 15 October 2026

142 unit/database tests passed with serial file execution, including generator determinism, 50 varied specifications, reversible draft slots, comment/string suppression and member/type suggestions. TypeScript and the final production build passed.

Fourteen distinct focused browser cases passed: all seven original coding challenges in one student flow; editor completion and actual C# execution; daily date/restore/reload flow; three generated projects with all rule cases; three Visual Studio shortcut flows; and seven Android/WinForms layout/event/colour cases (the daily flow was rechecked in the final group). The editor flow also passed twice consecutively to check acceptance timing. Manual visual inspection of the 360px daily-project screenshot found no horizontal overflow. South African local midnight is explicitly tested, and daily reopening resumes a previously stored draft.

The initial checks exposed a too-broad test locator (name versus namespace), a rapid-Tab timing issue, and an offscreen Suggest menu. The test locator and both application behaviours were corrected before the successful runs. The latest general UI flows do not constitute manual NVDA/TalkBack testing or physical-device verification.
