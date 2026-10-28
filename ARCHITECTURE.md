# Architecture and API

The public portfolio is static HTML/CSS/JavaScript. It makes no account requests. `portal.html` loads a same-origin bundled official Supabase client and the public project configuration.

`src/account.mjs` manages forms and account state; `src/portal.js` creates the SDK client and handles connection failure. Supabase owns password hashing, credential checks, email verification, tokens and password recovery. No password is saved in localStorage/sessionStorage by application code. SDK session tokens use tab-scoped sessionStorage. Session refresh is enabled; users should explicitly log out on shared devices.

The dashboard is rendered only after `auth.getUser()` succeeds and returns an email-confirmed user. It displays that user's Auth fields and updates their own display-name metadata. Metadata is presentation only, never used as an authorisation role. All user-provided text is written through textContent or form values. No new application database, policies, queues, paid providers or tables are introduced.

| SDK method | Input | Success / failure behaviour |
| --- | --- | --- |
| signUp | Email, password, full_name metadata, exact confirmation callback | Neutral verification guidance; mismatch and invalid name rejected locally; provider errors displayed. |
| signInWithPassword | Email and password | Server-verified dashboard; invalid credentials do not open it. |
| resend | signup type, email, exact callback | Neutral email guidance; provider limits shown. |
| resetPasswordForEmail | Email and exact recovery callback | Neutral response; never asserts inbox delivery. |
| updateUser | New password from recovery session, or display-name metadata | Name updates; recovery attempts global logout after password change. |
| signOut | local for ordinary logout; global after recovery | Clears visible account information after success; errors are not reported as success. |
| getSession / getUser | Existing SDK session | SDK processes callback first; server confirms current user. |

Async render generations discard stale results after sign-out. Auth callbacks run SDK work outside the auth-state callback lock. Recovery URLs containing errors fail closed even when an older session exists. The signed-in user's recovery view survives a reload via the recovery URL parameter; the parameter alone cannot grant a session.

Content Security Policy restricts portal scripts to this origin, connections to this origin and Supabase HTTPS endpoints, and disables objects. Referrer policy is no-referrer. Hidden account panels stay hidden without JavaScript, and a contact fallback is provided.

This is personal exploration, not a claim of production readiness. Live email, shared-project configuration and SDK integration need controlled owner testing. Existing database policies and other sites sharing the Supabase project are not changed.
