# Privacy notice

This is a public static calculator. The calculator operator does not ask visitors to create accounts, submit personal details or log in to a game. The application has no analytics, advertising, tracking pixels, contact forms or writable server database.

## Calculator inputs and browser storage

Calculations run in the visitor's browser. Saving a named custom item, corrected base price or observed fee is optional and occurs only through save/remember controls. Saved records contain the item name, base price, source label and any supplied fee observations. They are stored in localStorage under `eft-pve-flea-calculator:items:v1`. They are not sent to the project owner, GitHub repository or other visitors. They remain until cleared by the visitor or browser and do not sync between devices.

The application reads its saved records on a later visit so it can restore the requested saved-item feature. Comparisons which are not saved as items are temporary. Clear saved records through **Privacy → Clear saved calculator data**, or through the browser's site-data settings.

Do not enter personal details, passwords, tokens or other confidential information in item names or observations. localStorage is not encrypted private storage, and other code on the same web origin may be able to read it. All project sites under one `username.github.io` hostname share an origin; a separate custom hostname provides better isolation from sibling projects.

## Hosting and external services

GitHub Pages serves the static files. GitHub states that it logs and stores visitors' IP addresses for security purposes, whether or not the visitor is signed in. See [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) and [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

The site's build workflow reads public Tarkov.dev item data from GitHub's runner. Visitors download the resulting snapshot from the site itself; their item searches and custom inputs are not sent to Tarkov.dev. External links contact their destination only when a visitor follows them. No external fonts, scripts or images are loaded by the calculator at runtime.

## Changes

Review and update this notice before adding analytics, ads, user accounts, form submissions, cloud storage or direct third-party API calls. Storage technologies are not automatically exempt from privacy rules merely because they are localStorage instead of cookies. Assess applicable requirements before adding non-essential tracking or storage, and obtain consent before using technologies that require it.
