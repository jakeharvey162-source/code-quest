# Student and lecturer verification — 15 October 2026

## What changed

Code Challenges now includes the supplied **Practice Question 15 OCT** as an equipment-booking recovery task, a downloadable source-only copy of its deliberately broken Windows project, and an executable C# logic adaptation. Two original variations change the equipment prefix and allowed booking period. All three use a six-argument class constructor, seven fields/properties, saved statuses, active duplicate checks, parsing, validation and statistics. The repair bank now has ten missions and 81 checks; renewable revision and coding remixes remain available.

The supplied archive does not contain bookings.txt anywhere. Its IDE indexes and compiled outputs are excluded from the downloadable copy. Students must obtain the actual historical file before claiming recovery. Example console input is identified as test data. The project targets .NET Framework 4.7.2, while the paper requests 4.8. Native startup, Form Load/Click wiring, disk paths and reopening must be verified in Visual Studio; browser logic checks do not certify those steps. The supplied project namespace also differs from the name in the paper; keep project names consistent and confirm the expected submission with the lecturer.

Lecturers can assign repair missions as well as quests. The assigned link opens the correct mission. Learners explicitly share completed quest and repair IDs with their class; code and Tor conversations are excluded. The lecturer can expand the shared task list. Progress remains learner-reported, not a secured examination grade. Class detail requests ignore stale responses when a lecturer switches groups. Class state remounts when the signed-in account changes.

Tor has a full-page study desk, linked from the floating panel and All tools. It supports student/lecturer prompts, a bounded ten-exchange conversation in account-scoped progress, follow-up topic context, local question generation, suggested assignment planning/rubrics and official Microsoft reference links. The floating avatar is absent on this reading page. The desk does not call a language model or browse websites. This deliberate choice preserves the current no-API setup and avoids presenting an unconfigured AI service as working. Its local topic matching is limited; arbitrary questions may need a more specific topic, compiler evidence or a lecturer's explanation.

## User stories and boundaries

| Story | Evidence source | Limitation |
| --- | --- | --- |
| Student reads practice brief and downloads supplied project | Real browser download plus archive content check | Deliberately broken native project; no historical file supplied |
| Student repairs class, loads records and tests capture | Real browser C# compilation for broken starters and solutions, including edge cases | Console logic model; native GUI/disk steps remain external |
| Student studies with Tor and resumes history | Real browser student/lecturer prompts, reload and phone checks | Built-in coaching, not model-generated chat |
| Lecturer assigns practice and opens its link | Account/Classroom browser transport fixture | Hosted writes not performed |
| Learner joins, shares progress and leaves | Account browser transport fixture; database access-policy tests | Real credentials/reset-email delivery not established |
| Lecturer switches classes during delayed requests | Two-group race regression | Controlled response timing |
| Learners message, reconnect and moderate | Community fixtures and database policy tests | Hosted Community migration absent |

Read-only hosted check: Classroom tables exist, with zero classes at inspection; Community message tables are absent. No hosted class, message, account or production migration was created during verification. Vercel deployment-details access previously returned a project-team 403; that failed access path was not retried unchanged.

## Test results

The saved full browser report contains 109 scheduled tests: 108 passed, no failures or flaky tests, and one optional software-WebGL test skipped (7m 10s). It includes the equipment practice, native-project download, repair solutions, Tor student/lecturer conversation, mobile accessibility, C# execution, Python/JS/TS/HTML previews, assessments, persistence and offline flows. The fresh unit/database run passed all 138 tests; TypeScript passed.

The first account run passed 13 checks. Two new lecturer tests used an overly strict label locator for a select; changing those test locators to their accessible combobox roles allowed both lecturer flows to pass. Together these verify all 15 account/Classroom cases, including assigning the equipment mission and discarding delayed responses from an earlier class. No application change was required for that locator correction.

All 12 Community fixture tests passed. Both explicit checks passed: the Tor desk, local quiz and project download work offline after caching; software-WebGL Tor renders, walks, pauses for interaction and respects reduced motion. Together with the full run this exercises 110 distinct general browser cases, plus the 15 cloud/Classroom and 12 Community cases.

Visual review identified generic loop/control explanations being chosen for equipment recovery and object properties. Those paths now use a booking recovery plan and an explicit constructor/backing-field explanation. Focused Tor checks were repeated after that content correction. See COMMUNITY-VERIFICATION.md for preceding checkpoint evidence. A skipped optional WebGL test is distinguished from an explicitly enabled WebGL run. Browser and database fixtures are not a 400-concurrent-user load test, a manual screen-reader test, or physical Android verification.

## Official references checked

- Microsoft C# debugger tutorial: https://learn.microsoft.com/en-us/visualstudio/get-started/csharp/tutorial-debugger
- WinForms event handlers: https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls/how-to-add-an-event-handler
- C# properties: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties
- File.ReadAllLines (.NET Framework): https://learn.microsoft.com/en-us/dotnet/api/system.io.file.readalllines?view=netframework-4.8.1
