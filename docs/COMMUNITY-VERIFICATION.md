# Community implementation verification

Date: 2026-10-14. Development branch: `feature/codequest-community`.

The shared brief asks for an isolated implementation and pull request before production release. No Community migration has been applied to the hosted production database and this branch has not been merged to `main`.

## Results

| Check                                | Actual result                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Baseline before changes              | 118 unit/database tests, type check and production build passed                                                          |
| Final unit/database suite            | 130 passed; includes real Postgres RLS/trigger tests through PGlite                                                      |
| Existing browser regression          | Initial complete run: 90 passed, 1 failed, 1 skipped out of 92                                                           |
| Tor caption regression fix           | Fixed the failure; both tests in `runtime-coach.spec.mjs` passed on rerun                                                |
| Previously skipped 3D Tor test       | Passed separately with `CODEQUEST_WEBGL_TEST=1` and software WebGL                                                       |
| Existing account/cloud fixture suite | All 9 passed                                                                                                             |
| Community browser suite              | All 11 passed                                                                                                            |
| Snippet download follow-up           | 1440px case passed again with an explicit `.js` filename assertion                                                       |
| TypeScript / production build        | Passed; final production build restores the real client configuration                                                    |
| Formatting                           | Existing Prettier checks passed for the new module/tests/config/docs; no separate ESLint setup exists in this repository |
| Patch hygiene                        | `git diff --check` passed                                                                                                |

Across the completed regression run and the focused reruns, all 92 existing browser checks were exercised successfully. The normal non-WebGL run still skips the opt-in 3D case by design; CI now also runs that case explicitly with software WebGL. Do not misread the initial failing run as a clean first pass: it found and led to the Tor caption fix.

## What the Community browser checks verified

1. Two isolated browser accounts exchanged persisted public messages and code. Private messaging required an accepted friend request; a third authenticated database identity could not read the DM. Blocking revoked access.
2. Private saved code opened in the existing terminal without running automatically.
3. A draft survived refresh. Offline queueing kept the message unsent until reconnect, then delivered it exactly once. A second account did not restore the first account's draft.
4. At 320, 360, 412 and 1440 CSS pixels: readable dark mode, no horizontal document overflow, safe literal rendering of HTML-like message text, saved notebook access and safe editor transfer.
5. A class owner created and locked a discussion. Enrolled learners could react and report; the owner could resolve the report. An outsider could not access the class.
6. Unread counts, mute preferences and history search stayed scoped to the conversation.
7. At 1600px, code opened beside the chat, the width control adjusted the layout without overlapping panes, and output appeared only after Run.
8. A version-1 IndexedDB database upgraded while retaining its draft and snippet. Listing the guest notebook did not display another account's stored item.
9. A code download retained the selected language extension so it can be imported into the existing terminal.

The SQL tests additionally cover immutable sender/timestamp fields, idempotent UUID replay, attempts to reuse a UUID with altered content, private-room consent, third-user isolation, either-sided blocking, revoked friendship, class enrollment and locks, unauthorized reports/reactions, rate limits, private read preferences and moderator boundaries. A site moderator can inspect the **reported** private message without reading the rest of the DM.

## Fixes made during verification

- Corrected new-room SELECT/INSERT permissions for consent-based private conversations.
- Fixed test protocol handling for the installed Realtime client's v2 wire format; the application still uses the real Supabase SDK.
- Prevented the phone bottom bar from reappearing mid-gesture while moving focus between composer controls. The attachment section now uses an explicit controlled button.
- Restored the last conversation and kept drafts partitioned by account/room.
- Added an IndexedDB owner/type index so reading the outbox or notebook does not pull every conversation cache into memory; the upgrade preserves existing records.
- Added friendly service-setup, network and permission errors rather than exposing raw database table names in the UI.
- Updated Tor's workspace explanation to include a selected label's actual visible caption. The existing regression test caught this pre-existing mismatch.
- Corrected snippet download extensions.

## Test environment and limits

The browser fixtures use the **actual application UI, browser IndexedDB and a real local Postgres engine (PGlite)**. Authentication responses and the Supabase HTTP/Realtime transport are test adapters. The adapters execute queries with the authenticated database role and the actor's claim; they do not bypass RLS for application requests. They check visibility before emitting simulated Realtime changes.

These are not two real hosted Supabase accounts. Hosted Supabase Auth/Realtime, staging migration/advisors and a physical Android software keyboard remain release checks. Emulated screen widths and software WebGL do not certify every phone or GPU. No claim of physical Windows native GUI testing is made in this session.

The normal Playwright browser download returned invalid archives in this environment. Browser validation used Chromium 153 from the published `@sparticuz/chromium@153.0.0` package, extracted in temporary tooling storage. That package is **not** a CodeQuest dependency and was not added to the repository. Software WebGL used that package's SwiftShader libraries. The existing pinned Playwright dependency ran the tests.

## Screenshots

These screenshots show local fixture accounts and test messages, not real production users. WebP conversion is lossless. Some emoji fonts are unavailable in the headless test runtime; the illustrated Tor fallback remains usable.

### Android-sized conversation, 412px, dark mode

![412px Community conversation](community-screenshots/android-412-dark.webp)

### Desktop conversation, 1440px, dark mode

![1440px Community conversation](community-screenshots/desktop-1440-dark.webp)

### Chat and running code beside each other

![Desktop code and conversation](community-screenshots/desktop-code-and-chat.webp)

## Release status

Ready for source review as a **draft PR**. Do not describe the Community feature as deployed to production. Follow the staging checklist and rollback plan in [COMMUNITY.md](COMMUNITY.md), then review the CI results and hosted two-account checks before recommending merge/release.
