# DevOne CMS 2.0.0 — Release Notes

**Current development release:** 2.0.0-alpha.3  
**Architecture:** TypeScript / serverless-ready  
**Primary runtimes:** Local self-hosted and Cloudflare Workers

DevOne CMS 2.0 is a clean architectural generation of DevOne CMS. It replaces the legacy PHP application stack with a provider-independent TypeScript Core, runtime adapters, a modern installer, protected Core APIs, serverless deployment support, and a first-class Extension API direction.

> **Status:** 2.0.0-alpha.3 is an active development release. The 1.x release notes below are retained as historical context only; 1.x architecture and compatibility claims do not define the 2.0 runtime.

## 2.0.0-alpha.3 — Current Release

### Foundation and runtime
- Established the provider-independent Core API boundary.
- Local and Cloudflare runtimes use the same Core service contracts.
- Added runtime provider abstractions for database, cache, media/object storage, configuration, and mail.
- Hardened local HTTP request handling with a 2 MB request-body limit and `413 body_too_large` behavior.
- Aligned local runtime version identity with 2.0.0-alpha.3.
- Added fresh-install/runtime authentication coverage for install, login, session restoration, CSRF rotation, logout, and session invalidation.

### Authentication and session hardening
- Corrected session restore parameter binding for SQLite/local runtime.
- Protected authenticated Core operations with authentication, permissions, CSRF, and site context.
- Added session lifecycle regression coverage.
- Kept sensitive operations behind explicit route permissions.

### Installer
- Added a 2.0 installer flow for Local and Cloudflare deployments.
- Added installation status and prerequisite APIs.
- Added Cloudflare prerequisite validation for Workers, D1, R2, KV, Email Service, and the runtime secret.
- Added pre-install SMTP connection testing.
- Installer blocks setup until required prerequisites are ready.
- Installer state includes success, retry, validation, and failure handling.
- Removed legacy PHP installer code.

### Admin workspaces
- Added live Core API-backed Overview and Sites workspaces.
- Added Content create/list workflows.
- Added Media upload/list workflows through the media provider abstraction.
- Added Users create/list workflows.
- Added Settings read/write workflows with site-level persistence.
- Added loading, empty, success, and error states.
- Added permission-protected administration APIs.

### Core API
The Core API is the stable architectural boundary between DevOne CMS and its runtime/provider layer. Extensions should use Core contracts rather than accessing SQLite, D1, R2, or local storage directly.

Documented developer APIs include:
- Core request/response contracts
- authentication and permissions
- CSRF requirements
- database/cache/media provider interfaces
- installer and system endpoints
- Content, Media, Users, Settings, and Sites APIs
- extension route conventions
- provider independence and compatibility rules

### Extension API and developer documentation
Added the 2.0 developer documentation foundation for:
- Core API
- Extension API
- Themes
- Plugins
- Modules
- Libraries
- Hooks and Events
- API Builder
- Package Signing
- Security
- Runtime Loader

The Extension API is part of the Core architecture. Themes, plugins, modules, apps, and libraries are intended to extend DevOne without modifying Core.

The current documentation deliberately distinguishes implemented APIs from planned package-loader behavior. Undocumented loader hooks are not considered public API.

### Themes
- Established the 2.0 theme package contract.
- Added DevOne light and dark theme assets.
- Defined presentation/data boundaries, namespaced settings, accessibility, responsive behavior, and security expectations.
- Removed PHP theme implementation requirements from the 2.0 developer model.

### Plugins and extensions
- Established the TypeScript/JavaScript 2.0 extension direction.
- Legacy PHP plugin entry files are not part of DevOne CMS 2.0.
- Defined package namespaces, lifecycle expectations, migration rules, API route conventions, and security requirements.
- Extension packages must not modify Core or write outside their assigned storage boundary.

### Licensing
- Retired the legacy 1.7.4 licensing/distribution artifacts from the 2.0 source tree.
- Established the proprietary DevOne CMS 2.0 licensing model.
- Base single-site CMS use does not require a paid Network activation.
- Commercial Network licensing unlocks Network/Multi-Site capability.
- One Network license is bound to one authorized DevOne CMS installation.
- Network entitlement supports unlimited sites within that authorized installation when `maxSites` is null.
- Expired, invalid, revoked, or unverifiable entitlements fail closed to single-site capability.
- Defined the future License Server protocol for installation registration, activation, refresh/revalidation, deactivation, recovery, and revocation.
- No fake or placeholder activation endpoint is shipped in Core.

### Legacy PHP retirement
- Removed all PHP source files from the 2.0 repository.
- Removed the legacy PHP installer and PHP-based Core/license implementation.
- Removed the legacy 1.7.4 distribution archive and release-manifest/checksum artifacts.
- Removed the old 1.x licensing documents from the active 2.0 source tree.

### UI and product direction
- Migrated the 2.0 installer toward the new light/off-white SaaS interface.
- Visual direction: refined glass surfaces, white/light panels, soft layered shadows, thin borders, charcoal typography, restrained purple/orange accents, and high readability.
- The 2.0 administration experience follows the same premium SaaS design language rather than the older dark/neon interface.

## Historical 1.x Development Record

The following is a consolidated summary of the retired 1.x release line. These entries are preserved here for historical context, not as current 2.0 compatibility requirements.

### 1.6.0 Stable — August 11, 2026
- Introduced the Developer One gold/silver brand logo and administration/installer fallback.
- Redesigned the administration sidebar with Site Logo priority, search, grouped navigation, user profile, and responsive styling.
- Improved permalink routing, canonical redirects, 404 handling, and canonical URLs.
- Added hierarchical menus with stable IDs and nested rendering.
- Expanded Media Library font handling and administration filters.
- Added the DevOne Apps engine and database schema.
- Added the Core update client/admin surface.
- Added theme entitlement foundations.
- Hardened Core Services, Assets API, CSRF helpers, and reserved-service protection.
- Removed bundled plugins and SuperAdmin-only distribution artifacts.
- Tightened Marketplace privacy presentation.

### 1.6.1 Stable
- Optimized Core schema repair so it no longer performed full repair work on every request.
- Avoided starting PHP sessions for anonymous public requests.
- Aligned release identity with the official Core version.
- Added incremental 1.6.0 → 1.6.1 update support with checksums, PHP linting, backups, and rollback.

### 1.7.0 Stable
- Introduced the backward-compatible Runtime Loader.
- Added optimized frontend, admin, API, background, and CLI runtime contexts.
- Added route-aware and shortcode-aware deferred loading.
- Added plugin lifecycle manifest support.
- Added active-plugin registry caching.
- Preserved legacy plugin/theme compatibility.

### 1.7.1 Stable
- Added Admin Runtime routing and page-scoped lazy admin registration.
- Added safe admin-registry caching for explicitly optimized plugins.
- Added lazy-admin page declarations.
- Improved cache invalidation for extension lifecycle changes.
- Removed unnecessary automatic schema repair from login/registration and normal admin request paths.
- Preserved existing Core Services, permissions, CSRF, authentication, and package-integrity behavior.

### 1.7.2 Stable — August 18, 2026
- Fixed same-page hash-anchor behavior during AJAX navigation.
- Corrected cross-page hash navigation and page-ready ordering.
- Improved browser Back/Forward behavior for hash targets.
- Added bulk page selection and AJAX page deletion.
- Added synchronized desktop/mobile selection state.
- Added accessible inline deletion feedback.
- Preserved CSRF, permission, site-scope, logging, and purge protections.

### 1.7.3 Stable — August 25, 2026
- Fixed Assets bootstrap reliability for Site Logo and User Avatar uploads.
- Standardized upload paths around the official Assets service.
- Added lazy Asset Manager fallback compatibility.
- Corrected fresh-install release identity to 1.7.3.
- Preserved existing upload validation and media behavior.

### 1.7.4 Stable — August 25, 2026
- Hardened Assets and upload validation.
- Hardened authentication, registration, sessions, authorization, site switching, and Network site isolation.
- Added package/update integrity validation and safer ZIP extraction.
- Hardened API secret-field handling and public content visibility.
- Hardened installer and fresh-install defaults.
- Improved storage boundaries, backup handling, and web-server protections.
- Added schema/performance safeguards.
- Preserved legacy extension compatibility within the PHP 1.x architecture.

## 2.0 Compatibility Boundary

DevOne CMS 2.0 is **not** a drop-in PHP upgrade from 1.x.

The 1.x release history is retained above for provenance. Developers targeting 2.0 should use the 2.0 Core API and Extension API documentation under `devdocs/` and should not depend on retired PHP functions, PHP plugin entry points, PHP sessions, MySQL/MariaDB assumptions, or undocumented 1.x runtime behavior.

## Validation

The 2.0 repository has automated Core and Checks workflows covering the current test suite and build validation. Automated CI does not replace physical browser testing or live Cloudflare deployment smoke testing.

## Next 2.0 Work

- Complete the first-class Extension API runtime/loader implementation.
- Expand theme rendering and package lifecycle support.
- Build the standalone DevOne CMS 2.0 License Server.
- Continue local/Cloudflare parity and production-readiness testing.
