# Debug repair lab

Open **Code challenges → Debug repair lab**. This is first-year C# repair practice: read a requirement, predict the result, repair one fault and test the boundaries. The exercises are original and informed by the supplied Units 1–7, equipment-booking practice paper and sample projects. They do not reproduce an assessment or predict its questions.

## Missions

- Validation: replace a permissive OR gate with all required conditions; test invalid text and both day boundaries.
- Loop statistics: completed records must not subtract booked records.
- Object repair: distinguish constructor parameters from fields, store setter `value`, and change the existing object's status.
- Record parsing: validate field count before indexing; use TryParse and enforce business rules.
- Code completion: normalize strings and reject a separator that would corrupt a record.
- Compilation and boundary repair: first fix syntax, then test the exact passing mark.
- Event wiring: subscribe a handler once and check one action per click. This is a console model of event subscription, not a native WinForms window.

The original seven missions contain 33 checks. The equipment-booking practice and its two variations add 48 checks, bringing the repair lab to ten missions and 81 checks. See STUDENT-LECTURER-VERIFICATION.md for the source project, missing historical file, assignment workflow and Tor study desk. They complement the existing seven method challenges, renewable revision questions and coding remixes. Progress labels mean a mission was practised; this lab does not award repeat XP or claim exam marks. Programs, chosen mission and console input use the existing account-scoped progress drafts and are included when that progress is backed up.

## Console and trace

**Run console** compiles and executes the edited C# program. Enter input before running: each Console.ReadLine reads the next line; exhausted input returns null. Input is buffered, not a live terminal prompt. **Check repairs** runs the uninstrumented program against each listed case and compares actual output with expected output. Runtime errors appear as failures. This is learning feedback, not an adversarial grading service.

**Record & trace** compiles the edited program with probes at standalone comments such as `// @trace days, valid`. Add them inside executable blocks before a statement, with initialized variables or side-effect-free properties that are in scope. Use braces around loop/if bodies. The same trace point can record several snapshots when a loop repeats. Strings and block comments containing this text are not treated as probes.

Snapshots contain the values and console output at that moment, before the following statement executes. F10 advances one snapshot; F9 toggles a replay breakpoint at the current trace point; F5 continues to the next selected replay breakpoint. Controls are also buttons/checkboxes for touch and keyboard access. Shift+F5 stops an active repair run. Editing code or input discards stale traces and test results.

This is recorded execution, **not a live .NET debugger**. The whole run happens before replay. It does not step into arbitrary methods with F11, alter live variables, or inspect every local automatically. Add trace comments for more checkpoints. Trace mode stops at 150 snapshots; ordinary runs still have the worker's execution limit. Export a WinForms project and use Visual Studio for a native debugger and full file/event inspection.

## Report fixes

The uploaded test report identified misleading infinite-loop feedback when a learner ran the first lesson's `return 0;` starter. The worker now warms the first runtime invocation and obtains compilation diagnostics before starting the execution timer. Startup and compilation each have a separate 90-second timeout; final emit/run retains the 10-second safety limit. Since the library's run API includes final emit, timeout wording explicitly allows for a slow device and does not diagnose an infinite loop. Tests cover delayed preparation, a real cold starter run, infinite-loop termination and recovery.

Tor and read-aloud status containers explicitly use `role="status"`, `aria-live="polite"` and `aria-atomic="true"`. The existing arrow-key movement now has accessible instructions and declared keyboard shortcuts. The compact phone dock remains intentionally fixed; desktop Tor can be repositioned.

## Research

Microsoft's debugger guidance informed the before-statement explanation and the distinction between step-over, step-into, breakpoints and variable inspection. Recorded replay controls are labelled distinctly so they do not imply native debugger support.

- https://learn.microsoft.com/en-us/visualstudio/get-started/csharp/tutorial-debugger
- https://learn.microsoft.com/en-us/visualstudio/debugger/get-started-with-breakpoints
- https://learn.microsoft.com/en-us/visualstudio/debugger/navigating-through-code-with-the-debugger
- https://learn.microsoft.com/en-us/dotnet/api/system.console.readline

## Verification, 15 October 2026

135 unit/database tests and TypeScript passed. The production bundle built successfully for the browser tests. Nine focused browser checks passed: all C# lesson solutions; infinite-loop termination/recovery; all seven repair starters and solutions; phone trace/replay/input/draft persistence; Tor keyboard movement; the report's exact cold first-lesson starter; unavailable-voice live-region markup; C# terminal input regression; and the 360px dark trace with an automated WCAG A/AA scan. The existing seven coding challenges also passed in the preceding run.

Screen-reader markup is tested; no claim is made that NVDA, TalkBack or VoiceOver was manually exercised. Hosted production remains separate from this draft branch.
