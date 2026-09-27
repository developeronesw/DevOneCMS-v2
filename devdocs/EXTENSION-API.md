# DevOne CMS 2.0 Extension API

This is the practical guide for developers building themes, plugins, modules, integrations, and marketplace packages.

## What / Where / When / Why
### What can I build?
- Theme — presentation, templates, CSS, front-end assets.
- Plugin — focused behavior, integrations, admin/API features.
- Module — larger first-class CMS capability.
- App — larger independently mounted application.
- Library — reusable front-end dependency or asset package.

### Where does it live?
content/ is divided into themes, theme-library, plugins, modules, apps, libraries, marketplace, media, and uploads. An extension owns its package directory and must not modify Core or another package.

### When should I use each?
Change how a site looks → Theme. Add focused behavior → Plugin. Add a substantial first-class feature → Module. Build an independently mounted application → App. Ship reusable front-end code → Library.

### Why use the Extension API?
It isolates custom work from upgrades, supports multiple runtimes, enables package validation/security, and provides a compatibility target.

## 1. Package rules
Every package should have a unique stable slug, version, author, license, documentation, no committed credentials, no path traversal, no writes outside assigned storage, and no Core modifications.

## 2. Core API first
Use CORE-API.md. The intended architecture is Extension → Core API → provider → runtime adapter. Never assume a specific hosting provider.

## 3. Security
Validate external input, authorize protected operations, use CSRF for browser writes, parameterize SQL, escape HTML, validate uploads, keep secrets server-side, and avoid arbitrary filesystem paths.

## 4. Lifecycle
Plan install, activate, runtime, update, deactivate, and uninstall. Migrations must be safe to retry and non-destructive by default.

## 5. Namespaces
Use the package slug for routes, settings, cache keys, CSS classes, events, and tables. Examples: /api/acme-seo/..., acme-seo.*, acme-seo:..., acme-seo-..., acme_seo_....

## 6. Marketplace readiness
Include README.md, CHANGELOG.md, LICENSE, screenshots, supported DevOne versions, installation, activation, configuration, requested permissions, dependencies, upgrade/uninstall behavior, support, and license terms.

## 7. Current 2.0 implementation note
The current repository implements the Core API, provider abstractions, installer, authentication, license foundation, and administrator workspaces. Some higher-level package lifecycle and marketplace loader mechanisms remain release work. Do not build against undocumented loader behavior.