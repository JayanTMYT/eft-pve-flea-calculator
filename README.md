# Flea Ledger — Escape from Tarkov PVE

A static, browser-based flea-market calculator. It searches for the listing price with the highest net proceeds after the listing fee, using one shared fee formula and each item's base price.

- Search the published PVE base-price catalogue.
- Change quantity, listing price, base price and the search range.
- Compare fee and net proceeds for different listings.
- Add named items or infer unknown bases from recorded fee points.
- Keep custom items and corrections on the current browser only.
- Inspect recorded observations separately from calculated fees.

Select Intelligence Centre level 0–3. Levels 0–2 have no flea-fee reduction; level 3 applies a 30% reduction before final rounding. Hideout Management bonuses are not included. Keys and keycards display a warning if used; remaining uses are not calculated automatically. Net proceeds exclude acquisition cost and assume the whole listing sells. The formula reproduces ten recorded Wrench and Saline fee observations exactly with the bundled 5% / 5% rates. Game changes or condition changes can invalidate those assumptions.

## Hosting on GitHub Pages

This edition has no API server or database. GitHub Pages can serve every required file.

1. Create a **public** repository under `JayanTMYT`, for example `eft-pve-flea-calculator`. Start it empty; do not add credentials or private exports.
2. Put this project's files at the repository root. Upload source and the lockfile; do not upload `node_modules`, `dist`, old Git history, private Sites configuration or environment files.
3. Under **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
4. Push the `main` branch. The **Check and publish GitHub Pages** workflow tests, builds and deploys the static artifact. The successful deployment provides the actual website URL.
5. Keep HTTPS enabled. Restrict the `github-pages` environment to deployments from `main` and protect changes to `main` with a ruleset where the account plan supports it.

The workflow also rebuilds daily at 06:17 UTC to refresh the public item catalogue. GitHub may delay or disable scheduled workflows in inactive public repositories. The displayed data timestamp is authoritative; **Reload catalogue** fetches the latest published snapshot, rather than making an upstream API call. A failed upstream refresh retains the validated snapshot with its original date. No personal access token or repository secret is required for this workflow: GitHub supplies a short-lived Pages deployment token.

Until a GitHub deployment has succeeded, no public website URL is claimed by this project.

## Local checks

Use Node.js 24 or newer.

```sh
npm ci --ignore-scripts --no-fund
npm test
npm run build
npm run audit:runtime
```

Serve the `dist` directory with a static HTTP server for testing. The relative asset paths support both a repository subpath and a dedicated domain. Open `index.html` through HTTP, rather than directly as a local file, because the catalogue is fetched as JSON.

To refresh the local catalogue deliberately, run `npm run refresh:catalogue`. This fetches only two fixed HTTPS endpoints and validates and bounds the downloaded data. It does not write back to the upstream service.

## Public/private boundary

The app's source, catalogue snapshot, validation points and Git commit metadata will be public in a public repository. Custom entries typed by visitors are **not** added to GitHub: they are stored in that visitor's browser under the project-specific localStorage key `eft-pve-flea-calculator:items:v1`. They do not sync between devices.

A public site does not make the browser storage confidential. Other code on the same origin (including sibling GitHub Pages projects) can potentially access it. Do not enter passwords, contact details, tokens or sensitive notes. Use **Privacy → Clear saved calculator data** to remove saved items from this calculator.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md) and [PUBLICATION_REVIEW.md](PUBLICATION_REVIEW.md) before publishing. The original private deployment is not changed by this repository.

## Creator

[Subscribe to @Jayan_TM on YouTube](https://www.youtube.com/@Jayan_TM?sub_confirmation=1). The link opens YouTube with the subscription confirmation parameter; it does not subscribe automatically.

## Sources and attribution

Public catalogue: [Tarkov.dev API](https://tarkov.dev/api), using the PVE JSON item endpoint and English translations. [Formula reference](https://github.com/the-hideout/tarkov-dev/blob/main/src/modules/flea-market-fee.mjs). The final round-once behaviour is checked against recorded in-game observations.

Independent fan-made utility. Not affiliated with or endorsed by Battlestate Games. No game artwork or authentication is bundled. Referenced game names and trademarks remain with their respective holders.

No licence has yet been selected for the original project code. Publishing the website permits visitors to use the hosted calculator; select an explicit licence if you also want to grant redistribution and code-reuse rights. Existing third-party notices are retained in [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt).
