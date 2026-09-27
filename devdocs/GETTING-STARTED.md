# Getting Started with DevOne CMS 2.0 Development

DevOne CMS 2.0 is a TypeScript application with provider-independent Core APIs and a first-class Extension API.

## Choose the right extension

| Type | Use it for |
|---|---|
| Theme | Front-end design, templates, assets, and presentation |
| Plugin | A focused behavior or integration |
| Module | A larger feature area with routes, admin UI, data, and lifecycle |
| Library | Reusable front-end CSS, JavaScript, or other static dependencies |
| App | A packaged application that composes documented Core capabilities |

## Core API

Start with [CORE-API.md](./CORE-API.md). Extensions should call Core contracts rather than accessing SQLite, D1, R2, filesystem paths, or runtime-specific bindings directly.

Example:

```ts
import { createCoreApi } from "../core/api";

const api = createCoreApi({
  db,
  cache,
  media,
  config,
});
```

For HTTP extensions, register routes through the documented API route contract and enforce authentication, permissions, and CSRF requirements for mutations.

## Extension API

Read [EXTENSION-API.md](./EXTENSION-API.md) before creating a package. It defines the What, Where, When, and Why of DevOne extensions and identifies which package-loader capabilities are implemented versus planned.

## Security baseline

- Validate extension manifests before loading them.
- Use the narrowest permission required for every protected action.
- Enforce CSRF protection on authenticated browser mutations.
- Never expose secrets in manifests, client bundles, logs, or package metadata.
- Never bypass Core provider abstractions for persistent storage.
- Treat package paths, URLs, MIME types, and external input as untrusted.
- Keep extension settings namespaced by extension ID.
- Do not execute arbitrary source as part of package installation.

## Compatibility

Target the documented 2.0 API only. Legacy PHP APIs and 1.x runtime behavior are outside the 2.0 compatibility boundary.
