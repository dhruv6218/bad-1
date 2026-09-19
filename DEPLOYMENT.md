# Astrix AI deployment notes

The managed preview already receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through the project secret manager. Public browser configuration may be exposed to the client, but service-role keys, provider API keys, webhook signing secrets, email credentials, and error-tracking DSNs must be configured only in the hosting provider’s secret manager.

The production launch sequence is: configure Supabase Auth redirect URLs for the final domain; add the final domain to the project URL allowlist; configure the provider sandbox credentials; add webhook endpoints and signing secrets; verify webhook idempotency against `webhook_events`; configure email sender authentication; turn on leaked-password protection in Supabase Auth; enable error tracking; run the CI workflow; deploy a preview; verify signup, workspace provisioning, invoice creation, CSV import, pause/resume, invitation acceptance, and webhook replay behavior; then promote the exact tested artifact to production.

The current managed runtime is a single Node server with a Vite client build. Request-bound work is safe in this runtime. Long-running reminder workers and scheduled integrations should run through Supabase Edge Functions, `pg_cron`/`pgmq`, or another durable worker rather than an in-memory process in the web container.

## Recovery worker activation

The active `process-recovery-v2` Supabase Edge Function is deployed but intentionally fails closed until `CRON_SECRET`, `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, and (for AI-generated copy) `AI_PROVIDER_URL`, `AI_PROVIDER_API_KEY`, and `AI_MODEL` are configured in Supabase Edge Function secrets. Configure the Supabase service-role key through the platform’s secret manager; never place it in Vite client variables. After secrets are present, invoke the function from a trusted scheduler every 15–60 minutes with a valid `x-cron-secret` header. Verify the first run against a provider sandbox and replay the same request to confirm `reminder_logs.idempotency_key` prevents duplicate delivery.

## Billing and observability activation

The Supabase project now has `create-checkout-v2` (JWT-authenticated, owner/admin workspace authorization, atomic checkout rate limiting, provider idempotency) and `billing-webhook-v2` (raw-body HMAC signature verification, durable event recording, database-enforced duplicate suppression, subscription upsert, and workspace plan synchronization). Configure `BILLING_CHECKOUT_URL`, `BILLING_API_KEY`, `BILLING_WEBHOOK_SECRET`, `BILLING_PROVIDER`, and the Supabase service-role secret in the Edge Function secret manager before enabling paid checkout. The browser never receives billing credentials.

The client error boundary generates a support reference and posts structured error envelopes only when `VITE_ERROR_REPORTING_URL` is configured. Until a Sentry/Better Stack/Datadog-compatible ingestion endpoint is selected, the reporter fails closed after logging the reference locally.
