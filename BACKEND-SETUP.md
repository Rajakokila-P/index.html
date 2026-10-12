# Customer portal activation

The customer portal, database migration, notification worker, and automated tests are implemented in this repository. Production registration is disabled until a Supabase project and email provider are connected. No test accounts or test emails were created in production.

## 1 Configure Supabase

Use a dedicated Supabase project for the portfolio. Apply `supabase/migrations/202610120001_customer_enquiries.sql` once through migrations or the SQL editor. It creates the enquiries table, per-customer read policy, validated submission function, and private notification queue.

Enable email/password authentication and **Confirm email**. Set the minimum password length to at least 12 characters and configure auth rate limits before opening registration widely. Provider CAPTCHA is not integrated in this version; add its browser challenge before enabling that provider setting.

Set the Auth Site URL to the deployed GitHub Pages origin and repository path shown in the successful deployment. Allow only the exact portal callback URLs:

- `<published-site>/portal.html`
- `<published-site>/portal.html?recovery=1`

Do not use a wildcard production redirect. The browser SDK handles the email-link session and removes the token fragment. Sessions use tab-scoped session storage. There is no custom password database.

## 2 Configure account email

Connect Resend and verify a domain that you own. Configure Supabase **Custom SMTP** with the provider's SMTP settings and a verified sender. Keep confirmation enabled. The default Supabase email service is for testing and is unsuitable for general customer registration.

This setup needs a verified sender domain. The contact address `sarvamsky@gmail.com` can receive enquiries; it does not establish ownership of the `gmail.com` sending domain.

Test signup verification and password reset with controlled addresses before enabling the public backend configuration.

## 3 Configure enquiry notifications

Deploy `supabase/functions/notify-enquiries`. Keep `verify_jwt=false` for this service-to-service worker; the handler checks its own strong shared secret before touching the queue. It does not accept customer tokens.

Store these server-side values using the Supabase secrets UI or connected management tools. Never commit secret values or paste them into browser configuration:

| Secret | Purpose |
| --- | --- |
| `NOTIFICATION_WORKER_SECRET` | Random server-to-server secret, at least 32 random bytes |
| `RESEND_API_KEY` | Email provider secret |
| `ENQUIRY_FROM` | Sender on your verified domain, e.g. `SP Raja <enquiries@your-domain>` |
| `ENQUIRY_TO` | `sarvamsky@gmail.com` |

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the hosted function. The service role key must never be exposed to the browser.

Add Vault secrets named `portfolio_supabase_url` and `portfolio_notification_worker_secret` with the matching values. Run `supabase/schedule-notifications.sql` to schedule processing every five minutes.

Each accepted enquiry is saved together with its notification in one database transaction. The worker uses leases and provider idempotency keys, retries failures with increasing delays, and stops after eight attempts. A saved enquiry remains available even if email fails. Provider acceptance is not proof of inbox delivery; check provider delivery logs for bounces.

Review `enquiry_notifications` for rows with `sent_at is null and attempts >= 8`. Resolve the email issue before deliberately requeuing those rows. Administrators can read and update enquiry status in the Supabase dashboard; no public administrator role is inferred from customer metadata.

## 4 Activate the browser configuration

Set GitHub repository **Variables**:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Only the Supabase publishable key (or legacy anon key) belongs here. Database access is protected by server-side row-level security, not key secrecy. The build rejects known server secret keys. Alternatively set these public values in `config.json`; never put a service key there.

Keep both values empty until the migration, email settings and callbacks have been tested. The portal then shows a contact fallback without collecting passwords.

## 5 Enable automatic GitHub Pages deployment

In GitHub repository **Settings → Pages**, select **GitHub Actions** as the source. This is a one-time repository configuration. Subsequent pushes to `main` run database and notification tests, browser tests, a production build, and deployment. Failed tests block deployment.

The workflow uploads only the generated `dist/` folder. Database scripts, tests, setup documents, and dependencies are not deployed as website files. The existing Sites-hosted copy has a separate deployment process and is not automatically synchronised by this workflow.

## 6 Verify production before launch

1. Register two controlled test users and confirm their email addresses.
2. Confirm a customer cannot read another customer's records via the API.
3. Submit a test enquiry; verify its database record, dashboard entry, and owner notification.
4. Temporarily test provider failure in a non-production environment and confirm a retry preserves the enquiry.
5. Complete password recovery using the emailed link, then sign in with the new password.
6. Confirm sign-out clears visible customer records and review mail-provider logs.

Local tests cover these client flows with mocked auth and email APIs, and database permissions with embedded PostgreSQL. They do not replace this hosted integration check.

## References

- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
