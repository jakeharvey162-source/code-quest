# Tor conversational AI

Tor's study desk defaults to a real hosted-model request through `/api/tor`. Signed-in floating Tor also sends freeform conversation to this endpoint; explicit workspace actions/navigation remain local commands. Offline guide is a separate, explicitly selected mode. An unavailable AI request remains an error and preserves the question instead of silently presenting a preset answer as AI.

The server selects `nvidia/nemotron-3.5-lightning-free`, verified against the live Gateway catalogue. It checks that the model's input and output prices remain zero before each generation and has no paid-model fallback. Free-provider capacity and account verification still apply. No provider secret or deployment OIDC token enters browser code.

Vercel deployment authentication reads the per-request `x-vercel-oidc-token` header in Vercel Functions. The `VERCEL_OIDC_TOKEN` environment variable is a fallback for builds/local development; it must not be assumed present in a deployed function. A server-only `AI_GATEWAY_API_KEY` can be configured through Vercel project settings if necessary. Local development also needs that server-only key and a Vercel-compatible API server; Vite's static preview alone does not run serverless endpoints. The Vercel project/team must have AI Gateway access activated. Activation failures are reported honestly; a deployed endpoint alone does not establish working generation.

Requests verify the Supabase user, accept only bounded user/assistant message history, and reserve a database-enforced allowance of eight requests/minute and sixty/day/account. The additive `codequest_tor_chat_limits` migration was applied to the existing hosted project. Its table is private and its RPC derives the actor from Auth. Supabase progress storage and other apps are unchanged.

Only questions and the recent conversation are sent. No private workspace files or account snapshots are attached automatically. The interface discloses that the free provider may retain messages. Tor has no autonomous browsing/execution tools and must not claim those capabilities. Learners can paste code and use the actual compiler for execution. History retains up to ten exchanges, dropping older rows if necessary to fit the existing cloud-draft size limit.

Ordinary cloud-saving success no longer occupies the workspace. A visible notice remains only for a failed/pending save, oversized backup or conflict requiring action.

Tests cover contextual request history, auth/body/origin limits, DB quotas, paid-price refusal, activation failures, no canned fallback, question preservation, saved history and phone layout. Live provider activation and a real generated response must be checked after deployment.
