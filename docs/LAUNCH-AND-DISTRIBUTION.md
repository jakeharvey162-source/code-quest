# CodeQuest release and distribution — 15 October 2026

## What this branch delivers

Original beginner exercises follow the C# concepts in the supplied DSW01B1 Units 1–7 and shared study chat: predict output, identify errors, trace loops and strings, validate input, handle WinForms events, work with files/lists, constructors, properties and polymorphism. No lecturer slides are republished. These are not official or predicted UJ examination questions.

Continuous practice offers explanations, optional teaching, first-attempt counts, saved position and recurring five-question goals. The generator is a finite template bank with repeatable variations, not infinitely many unique concepts. Coding remixes are checked by the real C# runner, including boundary cases; repeated practice earns no extra leaderboard XP. Existing crafted lessons and seven coding challenges remain available.

Classroom combines classes/assignments and Community behind sign-in. Community includes public channels, friend requests, consent-based DMs, blocking, reporting, offline drafts, acknowledged-delivery outbox and private device notebooks. It does not supply a live employed lecturer. Private chats require connectivity to deliver messages; offline writing queues them.

## Account and saving behaviour

Local progress is isolated per account. Signed-in accounts save changed work automatically while visible and online, with checks every five seconds. First save requires no button. Backups include learning/challenge drafts, form controls and practical code, extra C# solution files and terminal sources. Fresh devices restore the last cloud snapshot automatically. Account → **Cloud recovery & save options** contains manual controls for resolving conflicting device work.

Wait for the saved status before closing or switching devices. Offline/network failures preserve local work, and retries use backoff. A cross-device revision conflict pauses saving instead of silently overwriting newer work. Open terminal/designer views refresh after cloud restoration. This is snapshot backup, not a full imported filesystem backup or simultaneous collaborative editing.

The authentication UI now normalises email, accepts older short passwords for sign-in, offers password visibility, handles duplicate signup correctly and distinguishes confirmation guidance. Re-registering an existing email does not change its password. Browser fixtures cover these paths, but they cannot prove a particular user's password or real password-reset email delivery.

## What is actually live

PR #25 is authorized for release after checks. The hosted Community migration is installed alongside the existing account/Classroom tables. Three temporary real Auth accounts passed hosted signup/sign-in, friendship/DM consent and privacy, delivery/retry, and snapshot isolation/conflict checks; test accounts and records were then removed. See RELEASE-2026-10-15.md for current evidence. The shared backend's total user count is not a CodeQuest user count.

The additive `20261014052709_codequest_community.sql` migration must be applied before enabling hosted Community. It only introduces CodeQuest-scoped objects. Do not change unrelated apps or global auth policies in this shared project. The earlier shared implementation brief requested a draft for review before production.

## More than 400 users

Four hundred registered learners and four hundred simultaneous chat connections are different workloads. Supabase Free's documented allowances include 50,000 monthly active auth users but only **200 peak Realtime connections**, 500 MB database and 5 GB egress. Pro includes 500 peak Realtime connections, but other quotas and compute remain relevant. Other apps and multiple browser tabs can consume the same shared limits.

Implemented measures: account-isolated data; database RLS; paginated messages and rankings; 405-participant ranking correctness coverage; server-side member search beyond the first 200 cached profiles; one chat synchronization at a time; jittered visible-page polling and exponential backoff after failures. `VITE_COMMUNITY_REALTIME=false` disables WebSockets while keeping polling. This reduces connection use but adds polling load and slower delivery; it is not proof of capacity.

Before calling 400 concurrent learners production-ready, run representative sustained/burst traffic on an isolated staging backend: reads, message sends, backups, reconnects and multiple tabs. Measure p95 latency, unexpected errors, DB CPU/locks, egress and message/connection quotas. Agree targets, for example p95 under two seconds and under 1% unexpected errors. The local 405-row correctness test is **not** a hosted concurrency benchmark. Do not load-test the shared production backend without coordinating the other apps.

Remaining release checks: working custom SMTP and reset-link redirects, recovery/backups, actual two-account hosted chat/save/restore, physical Android keyboard testing, moderation coverage and privacy/deletion information matching actual data handling. Default Supabase SMTP is restricted and best-effort; a successful reset form does not prove receipt of an email. No paid services or plan upgrades were purchased.

Leaderboard scores are opt-in and self-reported from learner devices. They are suitable for friendly practice, not tamper-proof cash-prize competitions. A prize contest requires a trusted grading service, submission records and abuse controls.

## Install now as a PWA

Android Chrome: open the final HTTPS site, then menu → Install app/Add to Home screen. Windows Edge: open the site and select the install-app action. The app already has a manifest and service worker. First-use compiler/runtime downloads need internet; only cached learning/runtime assets work offline. Cloud saves and chats require a connection.

## Make an Android APK

1. After production verification, enter the final site URL at https://www.pwabuilder.com/.
2. Check manifest name, icons, start URL and scope. Choose Android packaging and a permanent package ID.
3. Generate a signed package. Keep the signing key/passwords privately backed up; do not commit them. Updates must retain the correct signing identity.
4. Host the generated Digital Asset Links JSON at `/.well-known/assetlinks.json`, containing the real package ID and certificate fingerprint. If using Play App Signing later, include the relevant Play signing certificate too. Do not publish a made-up placeholder fingerprint.
5. Install the APK on a physical phone and test launch, sign-up/sign-in, reset-link return, backup/restore, keyboard, double-tap designer actions, compiler downloads, offline relaunch and upgrades.
6. Use an APK for direct installation; an Android App Bundle is for a compatible store. A wrapper does not turn the simulated designer into native Windows Forms on Android.

No APK has been signed and no store submission has been made by this branch.

## Free distribution options

| Channel | Package | Conditions |
| --- | --- | --- |
| CodeQuest website | Installable PWA | No store registration; hosting/backend terms and costs still apply. |
| Microsoft Store | PWA/Windows package | Current individual and company registration is free; identity verification and app certification remain required. |
| GitHub Releases | Signed APK/versioned downloads | Publish a release with version notes and checksums. Downloads do not generate automatic revenue. |
| itch.io | Educational app download page | Free publishing, with optional pay-what-you-want payments. Payment processing and revenue-sharing terms apply to sales. |
| F-Droid | Eligible open-source Android application | Not a general APK mirror: the app and build must meet its free-software/inclusion policies. A web wrapper may not qualify. |

For Microsoft Store, register at https://storedeveloper.microsoft.com/, reserve the app name, package the PWA with the Store identity, add accurate screenshots/description/privacy and age information, then submit for certification. Approval is not guaranteed. Google Play and Apple developer registration should not be described as free.

## Does each download pay?

No. There is no standard payment per free download or per 100 free downloads. One hundred free installs with no purchases normally creates zero sales revenue. Income needs a real model: paid features, subscriptions, donations/tips, institutional licences or appropriate advertising. A practical option is a reliable free learning core with optional paid teacher/class administration later; do not promise guaranteed earnings.

Microsoft documents different commerce arrangements, including 15% for apps or 12% for games using its commerce and own-commerce options for non-game apps. App classification and current policy matter. Vercel Hobby is limited to personal non-commercial use; resolve the hosting plan before monetizing.

## Primary references checked

- C# beginner learning: https://learn.microsoft.com/en-us/training/paths/get-started-c-sharp-part-1/
- Language reference: https://learn.microsoft.com/en-us/dotnet/csharp/
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Realtime limits: https://supabase.com/docs/guides/realtime/limits
- Production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Auth SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Android packaging: https://github.com/pwa-builder/PWABuilder/blob/main/docs/builder/android.md
- Asset links: https://github.com/pwa-builder/pwabuilder-google-play/blob/main/Asset-links.md
- Microsoft registration: https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account
- Microsoft publishing: https://learn.microsoft.com/en-us/windows/apps/publish/
- Microsoft commerce: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/why-distribute-through-store
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- itch.io: https://itch.io/docs/creators/faq.amp
- F-Droid: https://f-droid.org/en/docs/Inclusion_Policy/
