# SP Raja Portfolio Architecture

This document describes the portfolio's implemented architecture and a proposed extension for customer accounts. The current website is a static application: the visitor's browser displays the content and runs its interactions.

## Current system

```mermaid
flowchart TB
    Visitor["Visitor<br/>Customer, employer or collaborator"]
    Sites["Sites hosting<br/>Public website"]
    Browser["Visitor's browser"]
    HTML["index.html<br/>Content and form"]
    CSS["style.css<br/>Layout and responsive design"]
    JS["script.js<br/>Menu, service selection and email draft"]
    PDF["assets/SP-Raja-CV.pdf<br/>CV download"]
    Email["Visitor's email application"]
    Inbox["SP Raja's email inbox"]
    Profiles["GitHub projects, LinkedIn, Facebook and X"]
    Visitor -->|"Opens website"| Sites
    Sites -->|"Serves static files over HTTPS"| Browser
    Browser --> HTML
    Browser --> CSS
    Browser --> JS
    Browser -->|"View or download"| PDF
    JS -->|"mailto: opens a draft"| Email
    Email -->|"Visitor presses Send"| Inbox
    Browser -->|"External links"| Profiles
```

There is no application server, customer database, or account system in the current project. Form details are used in the browser to prepare an email draft; the site does not save them. Email delivery depends on the visitor's configured email application and their decision to send.

## Information architecture

The website is one HTML page with section links, rather than separate pages.

```mermaid
flowchart LR
    Home["Introduction"]
    About["About"]
    Journey["Education and experience"]
    Work["Selected projects"]
    CV["CV sample and PDF"]
    Services["Services"]
    Contact["Contact and enquiry"]
    Home --> About --> Journey --> Work --> CV --> Services --> Contact
    Services --> Web["Website design"]
    Services --> Docs["Documents"]
    Services --> Dash["Dashboards"]
    Services --> Cyber["Cyber analysis"]
    Services --> Data["Data analysis"]
    Services --> Network["Network analysis"]
```

Selecting a service takes the visitor to the contact section and selects that service in the enquiry form.

## Components and responsibilities

| Component | Responsibility |
| --- | --- |
| `index.html` | Profile, education, experience, projects, CV sample, services, social links, and labelled form fields |
| `style.css` | Colours, typography, grid layouts, mobile breakpoints, focus indicators, and reduced-motion support |
| `script.js` | Mobile menu state, Escape handling, service selection, form validation, email draft creation, and footer year |
| `assets/SP-Raja-CV.pdf` | Two-page CV available for viewing and downloading |
| `.nojekyll` | Allows the exported project to be served as plain static files on GitHub Pages |
| `README.md` | Overview, design rationale, features, verification status, and deployment instructions |

The contact form uses browser validation for required fields and email format. Its success message explains that an email draft was requested; it does not claim the enquiry was delivered.

## Enquiry flow

```mermaid
sequenceDiagram
    actor Visitor
    participant Page as Portfolio page
    participant Mail as Email application
    participant Inbox as SP Raja inbox
    Visitor->>Page: Choose a service
    Page->>Page: Select service in contact form
    Visitor->>Page: Enter name, email and message
    Page->>Page: Validate required fields and email format
    alt Fields are valid
        Page->>Mail: Request draft using mailto
        Page-->>Visitor: Explain that sending happens in email app
        opt Email app opens and visitor chooses Send
            Visitor->>Mail: Send message
            Mail->>Inbox: Deliver through email provider
        end
    else Fields are invalid
        Page-->>Visitor: Show browser validation message
    end
```

## Source and deployment

```mermaid
flowchart LR
    Local["Website working files"]
    Review["Review and checks"]
    GitHub["GitHub repository<br/>Rajakokila-P/index.html"]
    Package["Sites publication package"]
    Live["Live Sites website"]
    Pages["GitHub Pages<br/>Optional additional deployment"]
    Local --> Review
    Review -->|"Upload current export"| GitHub
    Review -->|"Package current source"| Package
    Package -->|"Explicit publication"| Live
    GitHub -.->|"Enable in repository Settings → Pages"| Pages
```

- **Live site:** https://rajak-personal-portfolio.wise-wasp-0659.chatgpt.site/
- **GitHub repository:** https://github.com/Rajakokila-P/index.html
- The Sites project serves its configured `dist` directory.
- The GitHub export places the same public website files at the repository root.
- GitHub and Sites are separate publication destinations. Updating GitHub does not currently update the Sites website automatically.
- GitHub Pages is an optional hosting destination; its activation has not been verified.

## Public information and access

Visitors can browse the public website without signing in. The downloadable CV and website omit the street address. The owner-approved phone number, email address, and social links remain public.

The GitHub export contains current website files and the corrected CV. Original CV documents, recordings, the course handbook, hosting credentials, and previous Sites source history are not part of that export.

## Proposed customer account architecture

**Future design only — these components have not been implemented.** A supported authentication and hosting arrangement must be selected before adding email/password registration and recovery.

```mermaid
flowchart TB
    Customer["Customer browser"]
    Public["Public portfolio and services"]
    Auth["Managed identity service<br/>Registration, sign-in, email verification and recovery"]
    Portal["Customer portal"]
    API["Server API<br/>Validate identity and permissions"]
    DB["Customer and enquiry database"]
    Notify["Transactional email service"]
    Admin["SP Raja administration area"]
    Customer --> Public
    Customer --> Auth
    Auth -->|"Authenticated session"| Portal
    Portal -->|"Authenticated requests"| API
    API -->|"Authorised records only"| DB
    API -->|"Enquiry notifications"| Notify
    Admin -->|"Authorised administration requests"| API
    Auth -->|"Verification or recovery email"| Customer
```

The future server would verify the identity and ownership of every customer record before returning or changing it. The identity provider would manage passwords and recovery; browser code would not store passwords or service secrets. The administration area would require an owner role checked by the server.

A future enquiry form would submit to the server and show confirmation only after the enquiry is saved or accepted. This differs from the current email-draft workflow and requires backend implementation and testing.

## Verification status

The current JavaScript syntax, section links, service count, contact targets, and CV availability were checked. Both PDF pages were visually inspected, and Sites confirmed successful publication. Full browser interaction, responsive-layout, and automated accessibility testing remain outstanding.
