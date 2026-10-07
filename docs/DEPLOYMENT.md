# Deploy and share CodeQuest

The application supports local self-study without accounts. Supabase adds accounts, manual cloud saves/history, lecturer classes, invitations, assignments and optional sharing of lesson completion/XP. ElevenLabs is optional; device speech remains available without an API charge. Lessons remain in English. Language previews and voice commands do not constitute translated courses.

## Current connection blockers

- The connected Supabase organization already has its two active free projects. Create a **dedicated CodeQuest** project after freeing an active slot yourself, or use an explicitly approved paid plan. Do not apply the migration to another application's database.
- The connected ElevenLabs account has **zero remaining credits**. Actual generation tests were rejected for quota exhaustion. Voice selections were searched in the library and estimated without charging; spoken quality still needs listening tests when credits reset.
- The Vercel connection could not access the selected team (403). Reconnect the appropriate Vercel account/team or import the repository in the dashboard.

## Vercel deployment

1. Create a dedicated Supabase project named CodeQuest. Keep its database password in a password manager. In the SQL Editor run `supabase/migrations/20261007141701_codequest_accounts_classes.sql` **once**. Review Supabase's Security Advisor after applying it. Alternatively use the Supabase CLI's documented login/link/db-push workflow with the dedicated project reference; never push to an inherited project.
2. In Supabase Authentication, enable email/password and email confirmation. Configure custom SMTP. Supabase's default mail service only sends to organization team addresses, is currently limited to two messages per hour, and is not suitable for public registration. Resend offers a free allowance; verify a domain you own and use the provider's SMTP settings. A domain may cost money even when the email allowance is free.
3. Open Vercel → Add New → Project → import `jakeharvey162-source/code-quest`. Use the repository root, Vite, Node 24, install command `npm ci`, build command `npm run build`, output directory `dist`. `vercel.json` already specifies the build settings. The `/api/voice.mjs` function is deployed by Vercel with the site.
4. Set these environment variables in the **CodeQuest project**, then deploy/redeploy:

| Variable | Value | Exposure |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Dedicated project's URL | Browser-safe |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Dedicated project's publishable key | Browser-safe, protected by RLS |
| `ELEVENLABS_API_KEY` | Restricted text-to-speech key | Server only; never add a `VITE_` prefix |
| `PUBLIC_APP_URL` | Exact production URL, e.g. `https://codequest.vercel.app` | Server origin validation |

No service-role key belongs in this setup. Never paste API keys into chat, source files or public GitHub. Use provider dashboards and Vercel's environment settings.

5. In Supabase Authentication → URL Configuration, set Site URL to the production origin. Allow the callback `https://YOUR-HOST/?auth=callback` (and your explicitly approved local/preview URLs). Password confirmation/reset uses PKCE and returns to Account. Test on the same browser that requested the link. Configure local `http://localhost:5173/?auth=callback` only for development. Keep unrelated preview origins out of the production allowlist.
6. In ElevenLabs select/add the catalog voices to the API-key workspace and check plan availability. The server chooses voice IDs and models; browsers cannot submit an arbitrary voice or model. Set usage restrictions on the provider key and disable paid overage if you want a hard free budget. The database reserves at most 800 characters per request, 1,600 per account/day and 8,000 across the app/calendar month. These are **character safeguards, not a promise of available credits**; other workspace uses, credit multipliers and the provider billing cycle still matter.
7. Smoke-test with two real accounts: confirmation, wrong password, reset email/new password, sign out/account switching, save and restore on a second device, class creation/join/assignment/progress sharing/leave, each available voice, Stop, quota errors, phone install, offline learning and C# after its first download. Run Security Advisor and inspect function logs without logging bearer tokens or learner text. Native WinForms exports need Windows/Visual Studio testing; the browser preview does not execute those event handlers.
8. Share the final **HTTPS production link**, not a dashboard or deployment-protected preview URL. Learners can use their browser or Install/Add to Home Screen for the PWA. This is not an APK or an App Store release. Verify the production deployment's protection setting permits your intended learners. Share a class invitation privately with the relevant class.

Vercel Hobby is free for personal/non-commercial projects. For commercial use choose an appropriate Vercel plan. Vercel is the easiest option for this repository because its authenticated ElevenLabs proxy is a Node function.

## Voices selected

| Text language | ElevenLabs choice | Match | Model |
| --- | --- | --- | --- |
| South African English | Peter | Library labels: South African English | Multilingual v2 |
| French | Enrick | Standard French, calm teaching style | Multilingual v2 |
| Portuguese | Adilson | European Portuguese, matches `pt-PT` | Multilingual v2 |
| Swahili | Halima | Library description: Tanga cadence, Tanzania; not Kenyan | Eleven v3 |
| isiZulu | No verified library voice selected | Matching device voice if installed; clear missing-voice message otherwise | No cloud fallback mislabelled as native |

Names, IDs and models are in `src/lib/voice-catalog.mjs`. Some library voices are paid-only; do not advertise these as individually free until the account can generate them. Estimates for the four choices used the standard one-credit-per-character rate, with no indicated extra multiplier. ElevenLabs Free includes 10,000 shared credits/month and non-commercial use with required attribution. Commercial use requires the relevant license. Generated audio has not passed a native-speaker pronunciation review. Eleven v3 supports Swahili but not isiZulu in its documented language list; v4 lists isiZulu, but model language support alone does not prove a voice's native accent.

## Free services and alternative hosting

| Service | Useful for | Free allowance / limit to watch |
| --- | --- | --- |
| Supabase | Auth, Postgres, saves and classes | 50,000 MAU, 500 MB database, 5 GB egress, two active free projects; inactive projects may pause |
| Device Web Speech | Read aloud | No CodeQuest API charge; available languages and privacy depend on OS/browser |
| ElevenLabs Free | Cloud voice experiments | 10,000 shared credits/month; no unlimited public narration or commercial license |
| Resend Free | Account email via SMTP | 3,000 emails/month and 100/day; verify a sender domain |
| Cloudflare Pages | Static app/PWA hosting | Largest single asset limit 25 MiB; this build's largest compiler asset is about 5.5 MB |

Cloudflare Pages can host `dist` with the same `VITE_SUPABASE_*` build variables. It is a reasonable static-host alternative, but **the Vercel `/api/voice.mjs` Node handler does not run on Pages unchanged**. Keep device voices, or separately adapt/deploy the authenticated voice endpoint to a Worker/Supabase Edge Function and configure its origin/URL and quota checks. This adapter is not supplied or verified in this release. No extra LLM API is needed for the authored lessons, compiler, rubric coaching, quizzes or gamification.

Official references (checked 7 October 2026):
- https://vercel.com/docs/plans/hobby
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/redirect-urls
- https://resend.com/pricing
- https://elevenlabs.io/pricing
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/eleven-creative/voices/voice-library
- https://developers.cloudflare.com/pages/platform/limits/
