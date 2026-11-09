# Public-release review

## Prepared design

- A new static React/Vite app, copied through an explicit file allowlist from the calculator.
- No private hosting configuration, old Git history, server route, external account connection or runtime secret is included.
- Public item data and the ten fee observations are included as non-personal validation data.
- Inputs remain in each visitor's browser. Saved records are scoped to a project-specific key; clear-data and privacy controls are present.
- A same-origin catalogue snapshot is used. Trusted GitHub Actions builds refresh the snapshot; visitors cannot trigger an upstream server proxy.
- Production CSP, input/schema validation, body limits, a lockfile, pinned Actions and least-privilege workflow jobs are included.
- No original-code reuse licence has been selected; third-party notices are retained.

## Verification

Run and record `npm test`, `npm run build`, `npm run audit:runtime` and a full `npm audit` before release. Review the built page in a browser with the CSP active. Check catalogue loading, an existing fee observation, named-item persistence, unknown-base calibration, malicious text displayed as text, and subpath asset loading. Re-check these if security-related code changes.

## Owner actions that still require GitHub administration

1. Publish under the intended `JayanTMYT` account using a public repository; confirm the selected account before writing.
2. Set Settings → Pages → Source to GitHub Actions.
3. Keep HTTPS enabled, restrict the deployment environment to `main`, and apply branch/ruleset protections supported by the account plan.
4. Enable dependency/security alerts, secret scanning/push protection and private vulnerability reporting where available.
5. Review the visible Git author identity and choose a code licence if redistribution is intended.
6. Confirm the actual successful Pages deployment URL before sharing the site.

No public deployment is claimed merely because this release is prepared. The original private site remains separate.

## Checks completed on 9 November 2026

- 12 automated tests passed, including the ten independent fee points, base inference, brute-force optimum comparisons, malformed saved data, hostile catalogue fields and JSON size limits.
- TypeScript check and production build passed. Relative asset paths were checked for a project subpath.
- A full npm audit reported zero known vulnerabilities at the time of review. This is not a penetration-test certificate.
- Browser QA passed with the production CSP active: catalogue loading/reloading, the exact Wrench point, saved unknown-base calibration after reopening, literal display of HTML-like item names without an injected image or script dialog, and privacy controls.
- The subscription link is `https://www.youtube.com/@Jayan_TM?sub_confirmation=1`.
- The data refresh script successfully fetched and validated 5,200 public PVE items.
- Publication requires access to the intended JayanTMYT account and Pages administration. No public deployment has yet been claimed.

## Intelligence Centre and key warnings update

- Intelligence Centre levels 0–3 are selectable; level 3 applies a 30% reduction before rounding, and levels 0–2 leave fees unchanged.
- Observations retain their recorded Intelligence Centre level. Calibration can use those levels without changing historical fees.
- Fixed item-condition labels were removed. Keys and keycards use the upstream item classification and show a used-key fee warning; remaining uses are not automatically priced.
- All 16 calculation, input-validation and catalogue-classification tests passed. Browser checks verified the discounted fees, changed optimum, key warning and removal of the condition label.
