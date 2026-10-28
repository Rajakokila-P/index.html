# SP Raja — Personal Portfolio

A static personal website presenting education, experience, projects, six services and direct contact details. Customer accounts, saved enquiries, Supabase, Resend and the downloadable CV have been removed. No API keys, database, paid API, subscription or third-party runtime package is required by this website.

## Open the website

Open `index.html` in your browser. All visual assets are inline or local. The contact form opens a draft in the visitor's email application; the visitor must press Send there. No message is sent automatically or stored on this website. Without JavaScript, direct email and telephone links remain available.

## Build and check (optional Node.js 22 or newer)

```sh
npm test
npm run build
npm run preview
```

No `npm install` is needed for these commands. Preview: http://127.0.0.1:4173. The clean build copies only public website files into `dist`. It removes stale files, including previously built CV PDFs.

## Replace an existing GitHub Pages deployment

1. Replace the old repository contents with this project, including `.github/workflows/pages.yml` and `.nojekyll`. Delete obsolete backend folders, configuration, dependency lockfiles, portal scripts/styles, and `assets/SP-Raja-CV.pdf`; copying new files over old ones alone will not remove them.
2. In repository Settings → Pages, select GitHub Actions as the publishing source for the included workflow.
3. Push to `main`, then check the completed deployment. The workflow needs no backend variables or secrets and installs no npm packages.
4. Check the published homepage and `portal.html`. Verify that `/assets/SP-Raja-CV.pdf` returns 404 and the CV section is absent.

For a no-build upload to a static host, use the included `dist` contents. Use a free hosting option within its free limits; no paid hosting or custom domain is needed by the application. No hosting account or billing plan has been changed by this update.

Removing the current PDF does not erase it from an existing Git history, old deployment, downloaded copy or search cache. This ZIP cannot remove those external copies. Existing Supabase data and the Supabase project have not been deleted; this website no longer connects to them.

## Fifteen development areas

| Area | Current implementation / acceptance criterion |
| --- | --- |
| 1. Requirements | P0: no backend calls, API credentials or CV. P1: all six services and direct contact remain usable. |
| 2. Design | Existing portfolio design retained. Responsive CSS retained; browser verification is pending because Chromium was unavailable. |
| 3. Architecture | Static HTML/CSS/JavaScript; see ARCHITECTURE.md. |
| 4. Database/backend | Intentionally absent. No account or enquiry database. |
| 5. API | Intentionally absent. Email uses a mailto link and the visitor's email application. |
| 6. Coding rules | See AGENTS.md. |
| 7. README | Setup, publishing, limitations and acceptance criteria documented here. |
| 8. Implementation plan | Remove paid-service dependencies and CV → test static output → browser checks → owner publishes and checks live URL. Removal and static test gates complete; browser and live gates pending. |
| 9. Setup | Open HTML directly or use the dependency-free Node build/preview. |
| 10. Features | Portfolio, education, experience, projects, services, mobile navigation, contact draft and social links. |
| 11. Security | No login, credentials or stored visitor data. Form hidden until JavaScript is ready, preventing accidental GET submissions. |
| 12. MCP | Not needed by the site. |
| 13. Integrations | Outbound social/project links and email/telephone handlers only; no automatic third-party calls. |
| 14. Testing/QA | See TESTING.md for fresh results and reproducible commands. |
| 15. Debugging | See troubleshooting below. |

## Troubleshooting

- No email application opens: copy `sarvamsky@gmail.com` into your preferred email service. Preparing a draft is not confirmation of delivery.
- CV still visible online: confirm that the new deployment succeeded, remove the old PDF from the repository, and refresh the browser cache.
- Old account page appears: check that `portal.html` has been replaced and the deployment uses the new files.
- Navigation fails: confirm `script.js` is beside `index.html`; direct contact links remain available without JavaScript.
- External links: the OilPulse card links to the GitHub profile and is labelled accordingly. A direct OilPulse repository URL was not supplied or guessed.
