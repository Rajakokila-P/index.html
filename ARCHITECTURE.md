# Architecture

The visitor loads `index.html`, `style.css` and `script.js` from the static host. The JavaScript controls mobile navigation, the copyright year, service selection and an encoded mailto draft. There is no API client, serverless worker, notification queue, authentication or database.

`portal.html` preserves the former URL as a static contact page. It does not load scripts or request credentials. CV files and CV sections are absent.

The contact form starts hidden. JavaScript reveals it and prevents native form submission; without JavaScript, the visitor uses direct email or phone links. No contact details are sent to the host as form query parameters. The email application handles the draft and sending.

The Node build uses only built-in modules and cleans `dist` before copying an explicit list of public files. The deployment workflow tests and builds the static output without package installation or backend secrets.

Project and social links are external destinations selected by visitors, not API integrations. Hosting logs, external sites and the email application have their own data handling. The existing Supabase project is outside this static site's runtime and is not modified by this package.
