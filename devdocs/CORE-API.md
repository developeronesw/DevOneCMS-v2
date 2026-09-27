# DevOne CMS 2.0 Core API

**Status:** Core API contract
**Version:** 2.0.0
**Source:** core/api/types.ts, core/api/router.ts, core/api/index.ts

## 1. What the Core API is
The Core API is the provider-independent boundary between DevOne CMS and its runtime. Local/self-hosted and Cloudflare deployments provide infrastructure; extensions talk to Core rather than directly to SQLite, D1, R2, or a local filesystem.

Core provides HTTP routing, authentication identity, permissions, CSRF enforcement, site context, database/cache/media provider interfaces, installer endpoints, system status, and the CMS workspace APIs.

## 2. Request lifecycle
1. Match method and path. 2. Parse JSON for state-changing requests. 3. Enforce the request-body limit. 4. Authenticate. 5. Resolve site context. 6. Check public/private access. 7. Validate CSRF when required. 8. Check route permission. 9. Call the handler. 10. Serialize a JSON response with no-store caching.

## 3. TypeScript contracts
```ts
export interface CoreRequest { method: HttpMethod; path: string; headers: Headers; query: URLSearchParams; params: Record<string, string>; body?: unknown; raw: Request; }

export interface CoreResponse<T = unknown> { status: number; body?: T; headers?: HeadersInit; }

export interface CoreApiContext { user: CoreUser | null; siteId: number | null; services: CoreServices; body?: unknown; }

export interface ApiRoute { method: HttpMethod | HttpMethod[]; path: string; handler: ApiHandler; permission?: string; public?: boolean; csrf?: boolean; }
```

## 4. Core services
| Service | Interface | Purpose |
|---|---|---|
| db | DatabaseProvider | Prepared SQL, reads, writes, batches |
| cache | CacheProvider | Reusable cached values |
| media | MediaProvider | Object/media storage |
| config | Record<string, unknown> | Runtime configuration exposed by host |

Example database access:
```ts
const rows = await context.services.db.all<MyRecord>(
  "SELECT id, title FROM my_extension_records WHERE site_id = ?1 ORDER BY id DESC",
  context.siteId,
);
```
Always use parameters. Never concatenate untrusted input into SQL.

## 5. Built-in endpoints
### Public system
| Method | Path | Purpose |
|---|---|---|
| GET | /api/install/status | Installation state |
| GET | /api/install/prerequisites | Runtime/deployment readiness |
| POST | /api/install/test-smtp | Pre-install mail test |
| POST | /api/install | Install CMS |
| GET | /api/core/health | Health and install state |
| GET | /api/core/status | Core/runtime/license status |
| GET | /api/core/license | Current entitlement |

### Authenticated Core
| Method | Path | Permission |
|---|---|---|
| GET | /api/core/content | content.read |
| POST | /api/core/content | content.create |
| GET | /api/core/media | media.read |
| POST | /api/core/media | media.create |
| GET | /api/core/users | users.read |
| POST | /api/core/users | users.create |
| GET | /api/core/settings | system.read |
| PATCH | /api/core/settings | system.manage |
| GET | /api/core/sites | sites.read |
| POST | /api/core/sites | sites.create |

Auth runtime endpoints used by the administrator UI: GET /api/auth/me, POST /api/auth/login, POST /api/auth/logout.

## 6. Authentication and permissions
context.user identifies the authenticated user or null. Protected writes require authentication and the appropriate permission. Site-aware code should use context.siteId. Do not trust a browser-supplied site ID when the runtime can resolve site context.

Example route:
```ts
router.post("/api/my-extension/settings", async (_request, context) => {
  if (!context.user) return fail("Authentication required.", 401);
  return ok({ ok: true });
}, { permission: "my_extension.manage" });
```

## 7. CSRF
Authenticated state-changing requests are protected by CSRF by default. Browser clients send X-DevOne-CSRF with the current token and Content-Type application/json. Do not disable CSRF merely to simplify a request.

## 8. Errors
Use ok() and fail(). Common codes include authentication_required, permission_denied, csrf_failed, method_not_allowed, route_not_found, invalid_json, unsupported_media_type, body_too_large.

## 9. Extension routes
Extensions own their behavior and should use a unique namespace such as /api/vendor-slug/... . Never patch the router internals or monkey-patch fetch/Request.

## 10. Provider independence
Correct: Extension → Core API → Provider interface → runtime adapter. Avoid: Extension → Cloudflare D1, Extension → SQLite, Extension → local filesystem.

## 11. Compatibility
The Core API version is exposed through /api/core/health and /api/core/status. Extensions should declare their minimum supported DevOne version and handle optional capabilities gracefully.

## 12. Why this boundary matters
The Core API keeps themes focused on presentation, plugins focused on behavior, and runtimes focused on infrastructure. If an extension needs to modify Core to work, the missing extension point should be proposed and documented instead.