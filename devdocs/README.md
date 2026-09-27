# DevOne CMS 2.0 Developer Documentation

This is the developer-facing contract for DevOne CMS 2.0.

Start here:
- CORE-API.md — provider-independent Core API, routes, auth, permissions, CSRF, providers, and responses.
- EXTENSION-API.md — extension architecture, package rules, lifecycle, compatibility, and security.
- THEMES.md — custom themes and templates.
- PLUGINS.md — TypeScript/JavaScript plugins.
- HOOKS-AND-EVENTS.md — public extension-point policy.
- MODULES.md — larger application features.
- LIBRARIES.md — shared front-end dependencies.
- API-BUILDER.md — authenticated CRUD/API patterns.
- PACKAGE-SIGNING.md — package integrity.
- SECURITY.md — secure extension development.
- RUNTIME-LOADER.md — runtime loading and performance.

## 2.0 rule
Do not modify DevOne Core source to extend the CMS. Build against documented Core APIs and extension points so extensions remain upgradeable and provider-independent.

## Source of truth
The TypeScript interfaces under core/api/ are the immediate implementation source of truth. A documented API is stable only when its signature and behavior are implemented and tested.