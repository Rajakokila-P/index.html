# SP Raja Personal Portfolio and Services Website

## Project Overview

SP Raja is a personal portfolio and services website for Rajakokila Muralitharan. It introduces her computing studies, data analysis projects, public-sector experience, and services available for discussion.

Built with HTML, CSS, and JavaScript, it presents education, experience, a corrected CV sample, selected projects, and six service enquiry options in a responsive single-page layout.

## Live Website and Repository

- Live website: https://rajak-personal-portfolio.wise-wasp-0659.chatgpt.site/
- GitHub repository: https://github.com/Rajakokila-P/index.html
- Portfolio: https://github.com/Rajakokila-P

The live website is hosted through Sites. GitHub Pages is an additional hosting option; it is not confirmed enabled for this repository.

## Project Purpose and Target Audience

The site helps prospective employers, customers, and collaborators understand SP Raja's background and start a conversation. Visitors can review technical skills, education, work history, projects, and a downloadable CV without needing an account.

## User Stories

| Visitor | Goal | How the site supports it |
| --- | --- | --- |
| First-time visitor | Understand the person behind the website | Introduction, About section, and clear navigation |
| Employer | Review education and experience | Education and work timeline plus a two-page PDF CV |
| Prospective customer | Find a relevant service | Six service options, each linked to the enquiry form |
| Portfolio visitor | Inspect technical projects | Aircraft Engine Monitoring and OilPulse Analytics links |
| Mobile visitor | Navigate on a smaller screen | Responsive grids and a collapsible navigation menu |
| Contact visitor | Discuss requirements | Telephone, email, social links, and an email draft form |

## UX Design Rationale

The visitor journey starts with an introduction, moves through background and selected work, and finishes with services and contact options. The CV sample provides a concise professional overview, with a download for more detail.

### Colours and Typography

- Warm paper background: `#f6f5ef`
- Navy text and panels: `#142c39`
- Brick accent: `#b6463c`
- Arial and Helvetica for body text; Georgia for display headings

System fonts avoid an external font dependency. A British flag and SP Raja monogram establish the personal identity. Project graphics are labelled as illustrative rather than presented as actual project screenshots.

### Layout and Accessibility

The site uses responsive CSS grids, mobile navigation, visible form labels, focus outlines, a skip link, and reduced-motion support. Navigation stays within the same page. The contact status message uses an accessible live region.

## Website Sections

| Section | Purpose |
| --- | --- |
| Introduction | Present SP Raja and link to selected work |
| About | Explain the professional profile |
| Education and experience | Show studies and recent work history |
| Selected work | Introduce data analytics projects |
| CV | Show a corrected sample and PDF download |
| Services | Website design, documents, dashboards, cyber analysis, data analysis, and network analysis |
| Contact | Telephone, email, social profiles, and an enquiry form |

## Features and JavaScript Functionality

- The menu button toggles the mobile navigation and updates `aria-expanded`.
- Selecting a navigation link or pressing Escape closes the mobile menu.
- Choosing a service populates the corresponding enquiry form option.
- Required fields and email input validation check the enquiry before creating an email draft.
- The form uses a `mailto:` URL with an encoded subject and message. It opens the visitor's email application; the visitor must press Send there. It does not confirm delivery or store enquiries on a server.
- The footer year updates automatically.
- LinkedIn, Facebook, X, GitHub, and PDF links are available.

Customer registration, email/password authentication, and password recovery are not implemented. These require a supported authentication service and further setup.

## Technologies Used

HTML5, CSS3, JavaScript, GitHub, and Sites hosting. The downloadable CV was generated with ReportLab and visually reviewed after rendering with Poppler.

## Folder Structure

```text
index.html/
├── index.html
├── style.css
├── script.js
├── README.md
├── .nojekyll
└── assets/
    └── SP-Raja-CV.pdf
```

## Testing and Verification

| Check | Result |
| --- | --- |
| JavaScript syntax using `node --check` | Passed |
| Internal anchor targets and unique section IDs | Passed |
| Six service sections present | Passed |
| Contact and supplied social link targets present | Passed |
| Street address and map link removed from current HTML | Passed |
| Downloadable PDF excludes the street address | Passed |
| CV PDF contains two pages and renders legibly | Both pages visually reviewed |
| Sites production deployment | Succeeded |
| Browser checks at desktop, tablet, and mobile widths | Not completed; browser tooling unavailable |
| W3C HTML/CSS validation and automated accessibility audit | Not completed |
| GitHub Pages live deployment | Not confirmed |

These checks do not establish end-to-end browser behaviour. Before relying on the site for customer enquiries, check navigation, form validation, email draft creation, the PDF download, and the mobile menu in your browser. No screenshot evidence or validator results from another project are claimed for this website.

## Changes and Corrections

The public contact section now has clickable telephone and email links and the supplied social profiles. The street address and map link were removed at the owner's request. The CV uses a consistent international telephone format and the owner's current public email. Earlier CV versions contained inconsistent employment dates; the sample uses the more recent LinkedIn chronology and should be reviewed before job applications.

## Local Preview

Open `index.html` in a browser or serve the repository with a static web server. No dependency installation or build step is required.

## Deployment

The production site is already hosted through Sites at the live link above. Uploading these files to GitHub stores the source; it does not automatically enable GitHub Pages.

To use GitHub Pages:

1. Open this repository's **Settings**.
2. Select **Pages** under **Code and automation**.
3. Choose **Deploy from a branch**.
4. Select **main** and **/ (root)**, then save.
5. Wait for GitHub to show the published URL and open it to verify the result.

Keep `index.html`, CSS, JavaScript, and `assets/` together so relative links continue to work.

## Privacy and Media

Only the current website and corrected PDF are included. Original CVs, recordings, the course handbook, credentials, and previous source history are excluded. The current site retains the phone number and email the owner authorised for public contact. The street address is omitted.

The monogram, flag, and illustrative project graphics are constructed with HTML, CSS, and SVG. No third-party stock photos or external fonts are used.

## Future Improvements

- A secure server-backed enquiry form with delivery confirmation
- Customer accounts through a supported authentication provider
- Password recovery if an email/password provider is selected
- Browser testing across mobile, tablet, and desktop
- HTML/CSS validation and automated accessibility checks

## Author

Rajakokila Muralitharan / SP Raja

GitHub: https://github.com/Rajakokila-P

