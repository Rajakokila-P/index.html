# Verification — 28 October 2026

Node.js 24.22.1. `npm test`: all 15 checks passed. `npm run build` and JavaScript syntax checks passed.

The account suite runs the real page markup and controller in JSDOM, with an injected authentication stub. It covers anonymous/unverified gating, registration mismatch validation and callbacks, successful login/logout, rejected login and failed logout, recovery URL/message, password update/global logout, expired-link rejection, safe profile rendering, profile updates, email restrictions and rate limits.

The static suite covers fragment destinations, CV removal, homepage independence, hidden account panels/CSP/referrer policy, clean builds removing old CV output, and email-draft encoding/validation.

A first test run caught a delayed auth callback overwriting the password-reset confirmation. The callback now checks the current generation before rendering; the regression test passes.

Live-read evidence: the Supabase project was ACTIVE_HEALTHY and its organisation plan was free. Its security advisor reported an existing warning that leaked-password protection is disabled. No schema changes were made. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection for details; no paid feature was enabled.

Limitations: no live signup, verification email, real password change or real logout has been executed. Browser verification was interrupted by an unresponsive connection; no visual pass is claimed. The two required callback URLs were submitted but persistence is unconfirmed. Check those settings and perform an owner-controlled registration and recovery test using an authorised team email.

Optional browser smoke test: with Playwright and Chromium installed in a development environment, run `node tests/browser.cjs`. This checks visible forms and page layout without creating real accounts or sending email.
