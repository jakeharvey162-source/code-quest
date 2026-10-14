# CodeQuest Community

Community is an additive module in the existing React/Vite application. It uses the existing Supabase client and sign-in flow. Classroom now groups classes/assignments and Community (including friend-only private chat). Both Classroom routes require sign-in; existing #community links remain supported. Guest learning and the standalone code tools remain available. Learning progress, compiler workers, WinForms exports and account storage formats are unchanged.

## Product behaviour

- Five authenticated channels: C#, Python, JavaScript, general programming and help. The migration seeds room definitions only, never invented users or conversations.
- Profiles are opt-in. Nickname, selected emoji, interests, practice XP and completed-lesson count are visible to signed-in members. XP is self-reported practice progress, not verified exam performance. Friend requests and activity visibility default off.
- A pending friend request must be accepted by its recipient before either account can create/read a private conversation. Removing the friendship or blocking in either direction revokes server access. Blocking also filters downloaded messages in the UI.
- Existing class owners can create one class discussion. Only the owner and enrolled learners can read it. Owners can lock/unlock posting, remove messages and review reports in that class. Owners are determined by `cq_classes.owner_id`, never editable JWT user metadata.
- Messages can include text, highlighted code and a named code-challenge invitation. Copy, private save, download and Open in editor are available. Opening code transfers it to the existing isolated terminal; **it never executes automatically**.
- Message reactions, per-room unread counts, muting and a moderation inbox are provided. Reports are visible only to their author and the responsible moderators. A site moderator can review/remove the specific reported private message, but cannot browse the rest of that private conversation. No email, push or device-notification subscription is created.
- On desktop, the room-list edge is resizable. A shared snippet can also open in a coding pane beside the conversation; a width control adjusts the split, and closing the pane leaves the chat intact. On narrow screens it becomes a bounded list above the conversation; quick navigation is below the content. The composer stays in document flow for software-keyboard safety; the mobile bottom bar stays hidden while a form has focus. Tor is docked below Community to avoid covering controls.
- Conversation history is fetched in pages of 50. Online text/code search queries the selected conversation, with up to 50 matches per field. Discovery and conversation lists are currently bounded at 200; the caller's own profile is fetched separately. Large-directory pagination is future work, not silently claimed.

## Offline contract

`CommunityStore` uses IndexedDB database `codequest-community-v1`. Schema version 2 adds an owner/type index and preserves version-1 records, so listing the outbox or snippets does not load every cached conversation into memory. Every record key includes the authenticated account ID or `guest`, record type and item key. Legacy guest caches remain preserved but are not exposed through the signed-in Classroom. Guest drafts and notebooks cannot appear in signed-in profiles, and accounts cannot see one another's caches through the UI.

Downloaded room lists, profiles and the latest synchronized message pages can be read offline. Earlier online history remains available through pagination/search; it is not all pre-downloaded automatically. Drafts and private snippets can be edited/saved offline. Queued messages use stable client-generated UUIDs. A message is removed from the outbox only after an authenticated server acknowledgement. An interrupted request can safely be replayed: the database accepts the same UUID/payload once and rejects changing a reused identifier.

- Network, expired-session and rate-limit failures pause the queue.
- Permission/validation failures remain visible as failed items with retry, move-back-to-draft and discard controls.
- Moving an item back to a draft persists the draft before removing its queued copy.
- Online events, an explicit Sync action and a 15-second visible-page fallback retry delivery. Postgres Changes subscriptions refresh authorized state promptly when Realtime is connected.
- Sending verifies the current session is still the same account that owns the outbox.
- Storage failures show an error instead of claiming a draft was saved. Quota exhaustion requires freeing browser storage or downloading/copying code; it cannot be hidden.

No live exchange with other people is possible without connectivity. Browser storage is not encrypted against someone with access to the device or browser profile. Signing out partitions subsequent UI access; it does not erase downloaded content. Server permission revocation cannot retract bytes already downloaded while a user was authorized. Do not post sensitive personal information.

Existing compiler runtimes work offline only after the required runtime files have been downloaded and cached. Community does not change those runtime requirements.

## Database and rollout

Migration: `supabase/migrations/20261014052709_codequest_community.sql` (created with Supabase CLI 2.120.0).

This migration requires the existing CodeQuest accounts/classes migration. It adds eight public Community tables, a private moderator table, indexes, explicit grants, RLS, narrow internal authorization lookups, invoker RPCs and insert guards. No existing data is rewritten. It adds four Community tables to `supabase_realtime` if that publication exists.

First apply all migrations to an isolated staging Supabase database using the team's normal reviewed migration workflow. Configure the development branch's Preview environment:

```
VITE_SUPABASE_URL=<staging Supabase URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>
```

Do not configure `VITE_SUPABASE_DISABLED=true` for the Community preview. No service-role key belongs in frontend variables. `vercel.json` permits the existing HTTPS API host and Supabase WSS connections. `/community` is a supported direct-route alias; the app retains its existing hash navigation.

If the deployment's database has no `supabase_realtime` publication, enable Postgres Changes for `cq_community_messages`, `cq_community_friends`, `cq_community_reactions` and `cq_community_rooms` before testing realtime delivery. Polling remains a recovery path, not a substitute for checking the hosted subscription.

To provision a site moderator, an administrator runs reviewed SQL in the staging/production database, using an existing authenticated user's ID:

```sql
insert into cq_private.community_moderators(user_id)
values ('<existing authenticated user UUID>');
```

Do not make the moderator table publicly writable. Class discussion management requires no site-wide moderator grant.

After local checks, test with **two real staging Supabase accounts**: opt into profiles, exchange a request and acceptance, send public and private messages, reload, disconnect/reconnect, block/unblock and remove the friendship. Check a third account cannot read the DM. Verify hosted realtime subscriptions, class-owner controls, report resolution and a real Android software keyboard. Run Supabase security advisors on staging. Only then recommend merging and applying the same migration to the production database.

This branch does not automatically apply migrations to the hosted production database, create real user accounts, merge itself or replace the production deployment.

## Verification commands and evidence

```
npm ci
npm run check
npx playwright install --with-deps chromium
npm run test:community
npm run test:browser
npm run test:cloud
```

`npm run check` runs the unit/database suite, TypeScript and a production build. The existing project has no separate ESLint configuration; formatting checks for the new files use the existing Prettier dependency. The new Community suite is included in the existing CI workflow.

The Community browser fixture uses real Postgres execution through PGlite for queries, RLS, triggers, friendships, private-room permissions and persisted rows. Browser accounts use **test-only Auth responses**. A protocol adapter simulates Supabase Realtime v2 while checking database visibility before sending each change. These checks exercise the real UI and offline IndexedDB with isolated browser contexts, but are **not proof of real hosted Supabase Auth/Realtime operation**. Test identities/messages never ship in production code or migrations.

The permission suite includes sender spoofing, immutable message metadata, duplicate delivery, private-room consent, third-user isolation, either-sided blocking, revoked friendship, class enrollment, lecturer locks, unauthorized reactions/reports, moderator restrictions, rate limiting and private unread preferences. The queue suite covers network/auth failures, permanent failures, overlapping sync calls, stable IDs, account partitioning and storage errors.

Browser tests capture dark-mode layouts at 320, 360, 412 and 1440 CSS pixels. These are emulated widths, not physical-device certification. Test screenshots and traces are uploaded by CI as the `browser-evidence` artifact.

See `COMMUNITY-VERIFICATION.md` for the actual results of this implementation session and outstanding checks.

## Rollback

Before merging, production is unchanged: close the PR or remove its preview to discard this release candidate.

After a production rollout, revert the feature commit/PR and redeploy the previous frontend. The Community schema is additive and can remain in place; this preserves messages and avoids touching learning data. If access must be suspended, an administrator can revoke authenticated grants on the new Community tables/RPCs while leaving all pre-existing CodeQuest objects intact. Re-enable the reviewed grants from the migration when ready.

Do not automatically drop Community tables to roll back the UI. Export/archive Community data and obtain explicit approval before any permanent deletion. Never drop existing CodeQuest authentication, classes, learning saves or ranking objects.
