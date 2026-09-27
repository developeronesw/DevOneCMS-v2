# DevOne CMS 2.0 Developer Documentation

This is the developer-facing contract for DevOne CMS 2.0.

Start here:
- CORE-API.md — provider-independent Core API, routes, authentication, permissions, CSRF, providers, and responses.
- EXTENSION-API.md — first-class extension architecture, package rules, lifecycle, compatibility, and security.
- THEMES.md — custom themes and templates.
- PLUGINS.md — TypeScript/JavaScript plugins.
- HOOKS-AND-EVENTS.md — public extension-point policy.
- LIBRARIES.md — reusable front-end assets and dependencies.
- PACKAGE-SIGNING.md — package integrity and signing.
- SECURITY.md — secure extension development.
- GETTING-STARTED.md — the 2.0 TypeScript development path.

## 2.0 rule

Do not modify DevOne Core source to extend the CMS. Build against documented Core APIs and extension points so extensions remain upgradeable and provider-independent.

## Source of truth

The TypeScript interfaces under `core/api/` and the implemented extension contracts are the immediate implementation source of truth. A documented API is stable only when its signature and behavior are implemented and tested.

DevOne CMS 2.0 does not use PHP application, plugin, module, theme, or CLI entry points.
