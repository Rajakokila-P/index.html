# Fresh verification — 28 October 2026

Environment: Node.js 24.22.1. Playwright is present, but its Chromium executable is unavailable. The browser download returned an invalid archive. No packages or paid services are needed to run the website.

| Check | Result |
| --- | --- |
| `npm test` | Six tests passed: fragment links, CV removal, backend independence, legacy contact page, clean build removing stale private documents, and email-draft encoding/validation. |
| `npm run build` | Passed; only index.html, style.css, script.js, portal.html and .nojekyll published. |
| `node --check script.js` | Passed. |
| `node tests/browser.cjs` | Blocked by missing Chromium; not a pass. The included suite covers four screen widths, navigation, service choice, validation, removed PDF, legacy contact, absence of external requests and no-JavaScript fallback. |

Browser checks require Playwright and its Chromium browser to be available in the development environment. They are optional development tooling, not website dependencies. The included CI runs the dependency-free checks and build.

Limits: live hosting, external GitHub/social destinations and actual email inbox delivery are not verified. No email was sent. This is not a claim of full WCAG conformance. Historical backend tests have been removed because the backend itself is removed.
