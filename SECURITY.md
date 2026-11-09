# Security

Flea Ledger is a static website. Calculations run in the browser, and saved items stay on the visitor's device. The calculator has no accounts, uploads or server database.

Item names are displayed as text. Saved items and downloaded catalogue data are validated, and numerical inputs have limits. The website uses a Content Security Policy that restricts scripts, styles and data requests to its own origin.

Dependencies are pinned in the lockfile. Deployment checks include calculation tests, input validation, a dependency audit and a scan of the built website. Deployment credentials are restricted to the publishing job.

Do not enter passwords, tokens or personal details into the calculator, or include them in public bug reports. Browser storage is not suitable for confidential information.
