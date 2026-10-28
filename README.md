# SP Raja — Personal Portfolio & Visitor Accounts

Personal portfolio with real Supabase Free authentication for exploration. The CV remains removed. No paid upgrade, email provider, SMS, payment service or subscription is configured by this change.

## Features

- Register with name, email and password; verify email and resend verification.
- Log in and log out with real Supabase sessions.
- Request an account recovery email, follow the link and set a new password.
- Visitor dashboard: own display name, email, verification status, joining date and project/service/contact links.
- Edit display name in your own account.
- Existing public portfolio and email-draft contact form remain accessible without an account.

## Important: free personal exploration

The existing Supabase organisation was confirmed on the Free plan on 28 October 2026. The built-in Supabase email service is intended for testing, normally sends only to authorised project-team addresses, and currently allows two emails per hour. Use your Supabase organisation-member email when exploring verification and password recovery. Do not add untrusted people to your Supabase team merely to allow website registration.

This is not unrestricted public email delivery. No paid mail provider has been enabled. Free projects can pause after inactivity and have usage limits; no paid plan is required by this application. No genuine account creation or recovery emails were sent during automated verification.

## Project and callbacks

Project: `fqvftoegqpmakumfagzk` (SP Raja Personal Website). `config.json` contains only its public publishable key, which is designed for browsers. Never put a service-role key or other secret here.

In Supabase Authentication → URL Configuration, allow these exact URLs:

- `https://rajakokila-p.github.io/index.html/portal.html`
- `https://rajakokila-p.github.io/index.html/portal.html?recovery=1`

Both URLs were submitted through the dashboard during setup, but the browser connection stopped responding before the saved state could be confirmed. Verify they appear in the list before testing email flows. The existing Site URL and existing callback for the separate personal Jarvis site were preserved. Keep email confirmation enabled and retain email templates that honour the requested redirect URL (normally `{{ .ConfirmationURL }}`). Shared-project template settings have not been changed.

## Run and build

Node.js 22 or newer:

```sh
npm ci
npm test
npm run build
npm run preview
```

Open http://127.0.0.1:4173. For email callbacks, use the published HTTPS URL above. Local callback URLs must be explicitly configured if you want local email-flow testing.

The build bundles the official Supabase SDK. `portal.js` at repository root is the generated bundle, committed so GitHub Pages branch publishing also works. Do not hand-edit it; edit `src/` and rebuild. `dist/` is the clean output for artifact publishing. The build excludes all CV files and server secrets.

## Publishing

The workflow installs pinned dependencies with `npm ci`, runs tests and builds the site. GitHub Pages can publish the repository root (using the committed bundle) or the workflow's `dist` artifact. Keep `config.json`, `portal.js`, `portal.css` and `portal.html` together.

## Fifteen development areas

| Area | Evidence / acceptance criterion |
| --- | --- |
| 1. Requirements | Real register/login/logout/recovery/dashboard; no CV or paid upgrades. |
| 2. Design | Existing navy/cream design, responsive account panels, form labels and keyboard focus. |
| 3. Architecture | Static portfolio plus Supabase Auth; see ARCHITECTURE.md. |
| 4. Database/backend | Supabase's existing Auth service; no new tables or schema changes. |
| 5. API | Official SDK Auth methods documented in ARCHITECTURE.md. |
| 6. Coding rules | AGENTS.md keeps the free-plan and CV-removal constraints. |
| 7. README | Setup, email limits, deployment and troubleshooting. |
| 8. Implementation plan | Implement → isolated tests → build → publish → owner verifies real email flow. |
| 9. Setup | Pinned packages and npm lockfile; public-only configuration. |
| 10. Features | Public portfolio plus personal visitor account features. |
| 11. Authentication/security | Server-verified user, verified email gate, tab-scoped session storage, safe text rendering. |
| 12. MCP | Development tooling only; not required by visitors. |
| 13. Integrations | Supabase Free Auth; no Resend, payments or notification worker. |
| 14. Testing/QA | 15 passing automated checks and build; see TESTING.md for limits. |
| 15. Debugging | Explicit rate-limit, unsupported-email, invalid-login and connection messages. |

## Troubleshooting

- No verification/recovery email: use your authorised team address, check spam, wait for the email limit to reset, and check the redirect URLs and templates above.
- Recovery opens the wrong site: ensure the two exact portfolio callbacks are saved; the shared project's default Site URL belongs to the other site.
- Account connection fails: check whether the free project needs resuming and whether the public configuration and portal bundle are deployed.
- Login fails: use Forgot password or resend verification. The dashboard is not shown for an unverified or rejected session.
- No mail application opens for a contact enquiry: email `sarvamsky@gmail.com` manually. A prepared draft is not a sent message.
- CV removal applies to the current site/files; earlier repository history and downloaded copies are not erased.
