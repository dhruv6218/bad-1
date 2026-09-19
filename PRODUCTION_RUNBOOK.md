# Astrix AI production runbook

This runbook is the final operational checklist for moving Astrix AI from the managed preview to a public domain. It separates checks that can be performed now from activation steps that require the founder’s provider accounts.

## Before launch

Confirm that the production Supabase project has daily backups enabled and that the retention period matches the business requirement. Create a dated backup verification record containing the project reference, backup timestamp, retention setting, and the operator who verified it. For a recovery drill, restore the latest backup into a non-production Supabase project, run the application smoke test, and verify that workspaces, memberships, invoices, billing subscriptions, webhook events, audit events, and reminder logs are present. Never run a restore over the live project as a test.

Enable Supabase Auth leaked-password protection in **Authentication → Policies** and verify that a known compromised-password test is rejected while a strong password can still sign up. Confirm that redirect URLs include only the production HTTPS origin, the approved preview origin, and the exact auth callback paths. Remove temporary preview redirects after the production domain is verified.

## Provider sandbox QA

Use sandbox credentials first. Create a test workspace and exercise sign-up, email verification, password reset, Google sign-in if enabled, first-workspace creation, invoice CSV import, manual invoice creation, pause/resume, tone settings, invitation acceptance, and sign out. For billing, create one checkout session, retry the same idempotency key, deliver the same webhook twice, deliver an invalid-signature webhook, and verify that only one `billing_subscriptions` row and one `webhook_events` row are created. Test canceled, past-due, active, and checkout-failed states.

For recovery, create an overdue test invoice and invoke the recovery worker with the configured cron secret. Verify that the AI provider is called only when its secrets are present, that the safe fallback text is used when the provider errors, that the email provider receives an idempotency key, that a retry does not send a second message, and that `reminder_logs`, invoice chase state, and `activity_items` are updated. Test a paused, paid, and disputed invoice to confirm that none receives a reminder.

## Scheduler and secrets

Configure the scheduler to call the active `process-recovery-v2` Supabase Edge Function with `POST` and the `x-cron-secret` header. Use a schedule appropriate for the workspace timezones and start with a low frequency during sandbox validation. Store `CRON_SECRET`, `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `AI_PROVIDER_URL`, `AI_PROVIDER_API_KEY`, `AI_MODEL`, and `AI_REMINDER_SYSTEM_PROMPT` only in the Edge Function secret manager. Store `BILLING_CHECKOUT_URL`, `BILLING_API_KEY`, `BILLING_WEBHOOK_SECRET`, and `BILLING_PROVIDER` only in the checkout/webhook Edge Function secret manager. Do not place any of these values in GitHub, Vite environment variables, browser storage, or `gateway_settings.api_key`.

## Domain and delivery

Set the production domain in the hosting provider and force HTTPS. Configure the apex-to-www or www-to-apex redirect once, not both. Verify that the canonical origin, Open Graph URL, favicon, `robots.txt`, and sitemap use the selected canonical hostname. Configure transactional email SPF, DKIM, and DMARC for the sending domain and confirm that the support address receives replies. Configure a custom error-reporting ingestion endpoint and verify that the client error boundary produces a support reference without exposing a stack trace.

## Monitoring and recovery

Alert on repeated 5xx responses from Edge Functions, failed webhook rows, recovery worker configuration errors, email provider failures, unusually high rate-limit denials, and Supabase database/storage usage thresholds. Review `webhook_events`, `audit_events`, `reminder_logs`, and billing subscription status daily during the first week. Keep the previous hosted checkpoint available for rollback. Record every provider activation, schema migration, backup verification, and recovery drill in the launch log.

## Go-live acceptance

Go live only after the sandbox checklist passes, the production secrets are stored, a real domain smoke test passes, the first production backup verification is recorded, the recovery drill has succeeded in a non-production project, leaked-password protection is enabled, billing webhook delivery is verified, and the scheduler is enabled. Until those actions are complete, paid checkout and automated recovery remain intentionally fail-closed.
