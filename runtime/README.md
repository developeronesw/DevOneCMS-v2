# DevOne Node.js installation

Use `developeronesw/DevOneCMS-v2`. Its `main` branch supersedes the original
`DevOne-CMS-/serverless-2.0` branch. This is still **2.0.0-alpha.3**, not a
production-certified 2.0.0 release. No PHP or external database server is required.

## Quick local test (Node.js 24)

```bash
git clone https://github.com/developeronesw/DevOneCMS-v2.git
cd DevOneCMS-v2
npm ci
npm run check
npm run build:local
npm test
npm start
```

Open `http://localhost:8080/`. The Node server serves the setup UI, dashboard,
and API together. SQLite migrations run automatically. Data and the generated
secret key are stored in `./data`. Keep this entire directory private and backed up.
For frontend development, run `npm run local` and `npm run dev -- --mode selfhost`
in separate terminals; Vite proxies `/api` to port 8080.

## Linux server install from a root or sudo shell

Prerequisites: Linux with systemd running, Git, curl, and **system-wide Node.js 24
with npm** (`/usr/bin/node` or `/usr/local/bin/node`). The installer checks these;
it does not install OS packages or replace another application's Node version.
Use a clean clone of the intended release or review branch:

```bash
git clone https://github.com/developeronesw/DevOneCMS-v2.git
cd DevOneCMS-v2
sudo bash scripts/install.sh --check
sudo bash scripts/install.sh
```

The installer copies the **committed checkout**, creates a dedicated `devone-cms`
account, installs locked dependencies, checks types, builds the UI, and starts a
systemd service. It refuses existing installation directories or service accounts.
Run from the same reviewed commit whose installer you inspected; uncommitted edits
are not included. If installation fails after creating files, inspect the error and
preserve any data before manually resolving the partial installation; reruns stop safely.

| Item | Location |
| --- | --- |
| Application | `/opt/devone-cms` |
| Database, media, encryption key | `/var/lib/devone-cms` |
| Environment configuration | `/etc/devone-cms.env` |
| Service | `devone-cms.service` |
| HTTP upstream | `127.0.0.1:8080` |

The CMS runs as the dedicated account, not root. Systemd permits writes only to
the data directory. Nginx, CloudPanel, certificates, and firewall rules are not changed.
If port 8080 is occupied, choose a free port in `/etc/devone-cms.env` and restart.

### Complete setup before public exposure

From your own computer or Android SSH client, forward a local port:

```bash
ssh -L 8080:127.0.0.1:8080 YOUR_SSH_USER@YOUR_SERVER
```

Visit `http://localhost:8080` and choose **Local Install** to create your site and
administrator. The first administrator setup must remain private until complete.
Secure cookies are enabled for the production service. For an HTTP-only tunnel test,
set `DEVONE_SECURE_COOKIES=false` in `/etc/devone-cms.env` and restart the service;
restore `true` and restart before using the public HTTPS domain.

Then configure your CloudPanel/Nginx HTTPS site to reverse proxy to
`http://127.0.0.1:8080` (or your chosen port). Do not use the repository or data directory
as the public document root. Set the website URL to the final HTTPS domain during setup.

```bash
sudo systemctl restart devone-cms
sudo systemctl status devone-cms --no-pager
sudo journalctl -u devone-cms -n 100 --no-pager
curl --fail http://127.0.0.1:8080/api/health
```

## Configuration and updates

`PORT`, `HOST`, `DEVONE_DATA_DIR`, `DEVONE_MEDIA_DIR`, `DEVONE_STATIC_DIR`, and
`DEVONE_SECURE_COOKIES` configure the Node runtime. A checkout started via `npm start`
also reads an optional `.env`. `NODE_ENV=production` defaults cookies to Secure.
The built frontend is `dist/local`; the separate Cloudflare build uses `dist/client`.

Do not rerun the fresh-install script to update. Stop the service, back up the whole
data directory and environment file, prepare/check/build a reviewed release in a
separate directory, then replace application files and restart. Preserve ownership
and all data. SQLite migrations run at startup; rollback can require restoring the
matching database backup as well as application files. No automatic updater is included.
