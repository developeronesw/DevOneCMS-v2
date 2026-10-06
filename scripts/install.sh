#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

# Fresh installation only. Run from a reviewed checkout with sudo bash scripts/install.sh.
if [[ "${1:-}" == --help ]]; then
  printf '%s\n' 'Usage: sudo bash scripts/install.sh [--check]' \
    'Requires Linux/systemd, Git, curl, and Node.js 24 with npm in /usr/bin or /usr/local/bin.' \
    'Installs the current checkout in /opt/devone-cms; data in /var/lib/devone-cms.' \
    'Refuses existing installs. Does not change CloudPanel, Nginx, TLS, or firewall settings.'
  exit 0
fi
[[ $# == 0 || ( $# == 1 && "$1" == --check ) ]] || { echo 'Unknown option; use --help.' >&2; exit 1; }
[[ $EUID == 0 ]] || { echo 'Run with sudo bash scripts/install.sh.' >&2; exit 1; }
for command in node npm git curl systemctl useradd runuser install tar chown chmod; do
  command -v "$command" >/dev/null || { echo "Missing prerequisite: $command" >&2; exit 1; }
done
[[ -d /run/systemd/system ]] || { echo 'A running systemd installation is required.' >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) process.exit(1)' || { echo 'Node.js 24 is required.' >&2; exit 1; }
node_path=$(command -v node)
[[ "$node_path" == /usr/bin/node || "$node_path" == /usr/local/bin/node ]] || { echo 'Install Node.js system-wide for the service account.' >&2; exit 1; }
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ -f "$source_dir/package-lock.json" && -f "$source_dir/runtime/local-server.ts" ]] || { echo 'Run from a complete DevOneCMS-v2 checkout.' >&2; exit 1; }
git -C "$source_dir" diff --quiet HEAD -- || { echo 'Use a clean committed checkout; tracked files have uncommitted changes.' >&2; exit 1; }
git -C "$source_dir" cat-file -e HEAD:package-lock.json || { echo 'The selected commit must include package-lock.json.' >&2; exit 1; }
node -e 'const s = require("node:net").createServer(); s.on("error", () => { console.error("Port 8080 is occupied; free it before installation."); process.exit(1); }); s.listen(8080, "127.0.0.1", () => s.close());'
for path in /opt/devone-cms /var/lib/devone-cms /etc/devone-cms.env /etc/systemd/system/devone-cms.service; do
  [[ ! -e "$path" ]] || { echo "Existing installation path: $path. Back up and use the update procedure instead." >&2; exit 1; }
done
if id devone-cms >/dev/null 2>&1; then
  echo 'The devone-cms account already exists; refusing to reuse it.' >&2; exit 1
fi
if [[ "${1:-}" == --check ]]; then echo 'Installation prerequisites passed. No changes made.'; exit 0; fi
# Dependencies and builds execute with an unprivileged account.
useradd --system --user-group --home-dir /var/lib/devone-cms --shell /usr/sbin/nologin devone-cms
install -d -o devone-cms -g devone-cms -m 0750 /opt/devone-cms /var/lib/devone-cms
# Copy tracked files only; exclude local credentials, databases, and node_modules.
git -C "$source_dir" archive HEAD | tar -x -C /opt/devone-cms
chown -R devone-cms:devone-cms /opt/devone-cms
runuser -u devone-cms -- env PATH=/usr/local/bin:/usr/bin:/bin bash -c 'cd /opt/devone-cms && npm ci && npm run check && npm run build:local'
cat > /etc/devone-cms.env <<'CONFIG'
NODE_ENV=production
HOST=127.0.0.1
PORT=8080
DEVONE_DATA_DIR=/var/lib/devone-cms
DEVONE_STATIC_DIR=/opt/devone-cms/dist/local
DEVONE_SECURE_COOKIES=true
CONFIG
chown root:devone-cms /etc/devone-cms.env
chmod 0640 /etc/devone-cms.env
cat > /etc/systemd/system/devone-cms.service <<UNIT
[Unit]
Description=DevOne CMS 2.0
After=network.target

[Service]
Type=simple
User=devone-cms
Group=devone-cms
WorkingDirectory=/opt/devone-cms
EnvironmentFile=/etc/devone-cms.env
ExecStart=$node_path --import tsx runtime/local-server.ts
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/devone-cms

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now devone-cms
systemctl is-active --quiet devone-cms || { echo "Service did not start. Inspect journalctl -u devone-cms." >&2; exit 1; }
if ! curl --fail --silent --show-error --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8080/api/health; then
  echo 'Service health check failed. Inspect: journalctl -u devone-cms -n 100' >&2; exit 1
fi
printf '\n%s\n' 'DevOne installed on 127.0.0.1:8080.' \
  'Before exposing it publicly, complete setup over an SSH tunnel (see runtime/README.md).' \
  'Then configure your HTTPS reverse proxy to http://127.0.0.1:8080.'
