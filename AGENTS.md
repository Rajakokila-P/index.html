# Project coding rules

- Keep the website static and free of paid API dependencies, backend accounts and API keys.
- Do not restore the CV, personal document downloads, account forms or visitor-data storage without the owner's request.
- Preserve the existing visual design, public contact details and project descriptions unless asked to change them.
- Never invent employment history, qualifications, project links or verification results.
- Keep email-draft wording accurate: a draft is not a sent message.
- Maintain accessible labels, keyboard focus, reduced-motion support and narrow-screen layouts.
- Run `npm test`, `npm run build` and syntax checks after changes. Browser checks use optional Playwright tooling; the site itself has no package dependencies.
- Keep current verification distinct from historical claims and live deployment checks.
- Do not deploy or alter external accounts unless the owner requests it.
