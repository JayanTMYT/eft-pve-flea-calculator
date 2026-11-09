# Security policy and deployment notes

## Design

This project is intended for public **static hosting**. There is no server-side application, public catalogue proxy, database, account system, file upload, user-supplied URL fetch or secret in the browser bundle. Numerical work happens on each visitor's device. This removes many server attack paths; it is not a guarantee that the application cannot contain vulnerabilities.

User-controlled item names are React text nodes, never HTML. Browser-saved and downloaded records are validated and rebuilt from allowed fields. Input sizes and numerical ranges are bounded. Downloads use fixed same-origin URLs in the browser and fixed upstream HTTPS URLs during builds, with body limits and timeouts. Malformed data does not silently become executable code.

The production HTML contains a restrictive Content Security Policy through a meta tag, allowing local scripts/styles and same-origin data only, with no inline scripts or eval. It also sets a no-referrer policy. GitHub Pages does not offer arbitrary security-header configuration: a meta CSP cannot enforce `frame-ancestors`, and cannot provide every protection available through HTTP headers. Clickjacking prevention and further header controls require a host or proxy supporting response headers. There are no high-impact authenticated controls to protect in this version.

The build scans output for private deployment IDs, credential patterns and absolute asset paths. The final publishing review must also check source and commit metadata. No automated pattern scan can prove the absence of every secret or vulnerability.

## Repository and supply chain

- Enable GitHub account 2FA or a passkey and protect account recovery methods.
- Use a new, clean repository history. Do not publish the private hosting checkout, environment files, tokens, personal browser records, old archives or logs.
- Use a GitHub-provided no-reply commit email if the personal email address should stay private. Review the author name and email before the first push.
- Keep the default workflow token read-only. Only the deployment job receives `pages: write` and `id-token: write`; it has no repository-contents write permission.
- Pull requests run checks but cannot refresh or deploy the public site. This project does not use `pull_request_target` or run unreviewed pull-request scripts with deployment permissions.
- Pin Actions to official upstream commit SHAs, use the npm lockfile with `npm ci --ignore-scripts`, and review Dependabot updates. A successful npm audit is one signal, not a complete security assessment.
- Restrict the Pages environment to `main` and require review of changes to workflows, package files and scripts where repository rulesets support it. CODEOWNERS requires an enforcing ruleset to have an effect.
- Keep HTTPS enabled. Prefer a dedicated custom hostname if isolation from other project sites is needed. Verify domain ownership and remove obsolete DNS records before relinquishing a domain.
- Keep the site free of personal inputs and secrets. No game login, GitHub token, personal access token or API key should ever be entered into the calculator.

## Reporting

Do not post working exploits containing private data or credentials in a public issue. The owner should enable GitHub private vulnerability reporting before public release where available. Report privately through the repository's Security tab when configured. Non-sensitive bugs and calculation discrepancies can be filed publicly.
