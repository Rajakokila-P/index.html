# Verification

Local verification on 12 October 2026:

| Check | Result | Scope |
| --- | --- | --- |
| Database and notification tests | 11 passed | Actual SQL migration in embedded PostgreSQL; injected email-provider responses |
| Browser checks | 33 passed | Headless Microsoft Edge, desktop/tablet/mobile layouts and simulated auth APIs |
| Production build | Passed | Bundled browser code and public-only deployment output |

## Reproduce

Use the Node and pnpm versions configured in the GitHub Actions workflow.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run build
pnpm exec playwright install chromium
pnpm run test:browser
```

For installed Microsoft Edge on Windows, set $env:PLAYWRIGHT_CHANNEL='msedge' in PowerShell before the browser test. Screenshots are written to test-results; GitHub Actions retains these as a short-lived artifact.

Coverage includes anonymous and unverified access rejection, per-customer record isolation, blocked direct writes, input validation, idempotent submission, rate limits, private queue access, worker authentication, email retry behaviour, registration and recovery screens, sign-out, safe rendering of customer text, failed-save messaging, responsive overflow checks, navigation and CV availability.

Browser tests intercept auth APIs and never create real accounts. Email tests use injected responses and never send email. Passing these checks does not confirm hosted provider integration, accessibility compliance, or real inbox delivery. Complete the production checklist in [BACKEND-SETUP.md](BACKEND-SETUP.md) before opening registration.

