# DevOne CMS 2.0 Plugins

Plugins add focused behavior without modifying Core.

## 1. Good plugin candidates
SEO, forms, integrations, content enhancements, admin utilities, custom API routes, and other focused capabilities.

## 2. 2.0 package structure
```text
acme-seo/
├── plugin.json
├── src/
│   ├── index.ts
│   ├── routes.ts
│   └── settings.ts
├── assets/
├── migrations/
├── README.md
├── CHANGELOG.md
└── LICENSE
```
Legacy PHP plugin entry files are not part of DevOne CMS 2.0.

## 3. Manifest
```json
{
  "name": "Acme SEO",
  "slug": "acme-seo",
  "version": "1.0.0",
  "type": "plugin",
  "main": "src/index.ts",
  "author": "Acme",
  "requires": { "devone": "2.0.0" }
}
```
The exact package-loader validation rules will be finalized with the 2.0 package manager; do not invent unsupported fields.

## 4. API routes
Use the Core router and a unique namespace. See CORE-API.md for request lifecycle, authentication, permission, CSRF, and response rules.

## 5. Data
Plugin data must be isolated by plugin namespace and site ID where applicable. Use Core's database provider and parameterized SQL.

## 6. Events
Use only documented Core extension points. If a required event is missing, add the public contract before depending on it.

## 7. Lifecycle
Plan install, activate, update, deactivate, and uninstall. Migrations should be versioned, retry-safe, and non-destructive by default.

## 8. Security checklist
Verify route permissions, CSRF, validation, SQL parameters, upload restrictions, HTML escaping, debug logging, secrets, uninstall, and upgrades.

## 9. Migration rule
Do not copy legacy 1.x PHP plugin examples into 2.0. The 2.0 architecture is TypeScript-based and provider-independent.