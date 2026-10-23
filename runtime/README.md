# DevOne Local Runtime

The local runtime is provider-independent. It uses SQLite for persistence, the local filesystem for media, and an in-process TTL cache.

## Start

`npm install`

`npm run local`

Default: `http://127.0.0.1:8080`

Set `HOST=0.0.0.0` to expose the runtime to a trusted LAN. Set `DEVONE_DATA_DIR` and `DEVONE_MEDIA_DIR` to choose storage locations.

The runtime automatically applies ordered SQL migrations and records them in `devone_migrations`. Migration execution is transactional.

Node.js 22.5+ is required for the built-in `node:sqlite` API; Node.js 24 LTS is recommended.

The local provider deliberately contains no Cloudflare API dependency.

## Managed production package

`npm ci --ignore-scripts && npm run build:local` produces `dist-local/` with the Node runtime, an offline initializer, migrations and the built dashboard. No npm packages, development server or Cloudflare account are required on the target server. The profile is still a **2.0.0-alpha.4 preview**; packaging does not certify full CMS feature completion.

Initialize `bootstrap.mjs` once as the site's unprivileged OS user, with a private `DEVONE_DATA_DIR` and `DEVONE_MIGRATIONS_DIR` pointing at the bundle's migrations. Supply JSON on stdin with `title`, `email`, a generated 64-character hexadecimal `password` and the canonical HTTPS `url`. Do not put credentials in arguments or logs. The managed DevOne Server installer performs these steps.

Run `runtime.mjs` behind a trusted reverse proxy with `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT`, `DEVONE_SITE_URL=https://your-domain`, `DEVONE_DATA_DIR`, `DEVONE_PUBLIC_DIR` and `DEVONE_MIGRATIONS_DIR`. The proxy must overwrite X-Forwarded-Proto and X-Real-IP. Production mutations require HTTPS and a matching Origin; cookies are Secure/HttpOnly, login attempts are bounded, and web setup/SMTP setup probes are disabled. Production refuses to listen before initialization. Data and keys belong outside the bundle's `web` asset directory; managed installs additionally place them outside the site's public document root.

Local production PBKDF2-SHA-256 uses 600,000 iterations. The Cloudflare Free policy remains 10,000 iterations; the runtime-specific setting is also applied to new CMS users and installer-created accounts. Existing owned data directories/SQLite/key files have their permissions tightened without replacing their contents. Invalid or linked keys/databases fail closed rather than silently generating replacement keys. Retain the data directory and key together for recovery. Full site backup/restore acceptance remains separate.

`npm run test:local-package` exercises the actual built package: initialization, static dashboard, private path denial, setup lockout, HTTPS/origin checks, login, CSRF-protected content creation, persistence and invalid-key rejection. It does not certify systemd, public TLS/ACME, rendered browser behavior, every CMS module or Cloudflare deployment acceptance.
