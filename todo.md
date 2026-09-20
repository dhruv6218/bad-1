# Astrix AI production build tracker

## Completed in this milestone

- [x] Supabase Auth session adapter with email, Google OAuth, reset flow, and sign out.
- [x] Protected application and onboarding routes; unauthenticated users redirect to `/login`.
- [x] First-workspace provisioning scoped to the authenticated owner.
- [x] Supabase-backed dashboard snapshot, invoice list/create/pause-resume, CSV imports, analytics, gateway status, tone settings, and workspace profile settings.
- [x] Secure invitation acceptance RPC with token hashing, expiry, invitee-email verification, membership upsert, and single-use acceptance.
- [x] Cookie consent banner with essential-only and accept-all choices.
- [x] Public metadata, Open Graph defaults, favicon, privacy, terms, refund, and contact routes.
- [x] Admin allowlist, protected admin overview RPC, and a real aggregate-only God View.
- [x] RLS hardening, service-only webhook/rate-limit tables, foreign-key indexes, recovery queue indexes, audit events, and atomic rate limiting.
- [x] Provider-neutral checkout boundary with workspace authorization, rate limiting, idempotency, and fail-closed provider configuration.
- [x] Provider-neutral HMAC billing webhook with durable event storage, duplicate suppression, subscription upserts, and workspace plan synchronization.
- [x] Idempotent Supabase recovery worker with bounded queue processing and reminder history.
- [x] Client error boundary with support references and optional structured error ingestion.
- [x] CI workflow, deployment documentation, environment/secret guidance, and final live preview checkpoint.
- [x] TypeScript validation, 5 unit tests, production build, and visual preview QA.

## Credential-gated activation handoff

- [x] Billing provider activation boundary is implemented; connect `BILLING_CHECKOUT_URL`, `BILLING_API_KEY`, `BILLING_WEBHOOK_SECRET`, and `BILLING_PROVIDER` before enabling paid plans.
- [x] Email delivery activation boundary is implemented; connect `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, and `CRON_SECRET` before enabling reminder sends.
- [x] AI reminder generation boundary is represented by the tone settings and recovery worker contract; connect the chosen AI provider and approved prompt/model policy before enabling generation.
- [x] Error tracking activation boundary is implemented; connect `VITE_ERROR_REPORTING_URL` to the selected ingestion service.
- [x] Backups, recovery checks, provider sandbox QA, Supabase leaked-password protection, final domain redirects, and production scheduler activation are documented as launch runbook actions requiring the founder’s accounts and credentials.

## Known launch gates

- `gateway_settings.api_key` remains a legacy nullable field; live credentials must not be stored there. Use a server-side secret vault or provider OAuth flow before connecting live gateways.
- Paid billing, email sends, AI generation, and scheduled recovery are intentionally fail-closed until provider secrets are configured.
- Supabase Auth leaked-password protection still needs to be enabled from the Supabase Auth dashboard.
- The managed preview is a separate full-stack workspace from the original connected Next.js repository; publish the managed checkpoint or synchronize the desired GitHub branch before going live.

## Final audit outcome

- [x] Public Vercel production deployment is READY and serves the Astrix AI shell over HTTPS.
- [x] GitHub `main` is clean at the deployed commit, with `pre-astrixai-managed-20260919` retained as rollback history.
- [x] Published source passes 8 Vitest tests, TypeScript validation, and the Vercel static build.
- [x] Public route smoke tests return HTTP 200 for marketing, legal, auth, app, and admin paths; browser auth still gates protected screens.
- [x] Added `robots.txt`, `manifest.json`, `sitemap.xml`, favicon, and branded metadata.
- [x] Supabase advisor/function inventory was attempted but remains unverified in this session because the connector returned a permission error; no security claim is based on that failed check.
- [x] Final launch gates are documented: Edge Function secrets/scheduler, Supabase Auth leaked-password protection, backup/recovery drill, provider sandbox QA, custom domain, and error-ingestion endpoint.

## Final founder-requested hardening

- [x] Added Dodo as a supported gateway type.
- [x] Replaced browser API-key collection with hosted payment-link storage; Stripe, Razorpay, Dodo, and UPI links can be saved without exposing provider secrets to users or the client.
- [x] Persisted notification toggles through Supabase Auth user metadata.
- [x] Made workspace plan labels and upgrade messaging reflect the actual workspace plan.
- [x] Confirmed Godview remains an authenticated, aggregate-only admin surface.
- [ ] Move `astrixai.app` and `www.astrixai.app` from the existing Vercel `landing-page` project to `bad-1`; Vercel API reports the domain is already attached and the browser session is not authenticated, so this requires a Vercel dashboard/domain reassignment action.
- [ ] Configure and sandbox-test provider secrets, Edge Function scheduler, backups, leaked-password protection, error ingestion, and custom-domain DNS before claiming full operational go-live.
