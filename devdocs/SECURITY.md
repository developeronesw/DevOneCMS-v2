# Secure Extension Development

DevOne CMS 2.0 extensions run behind the Core API boundary.

## Required

- Use documented Core APIs and provider interfaces.
- Require the narrowest permission before protected actions.
- Enforce CSRF protection on authenticated browser mutations.
- Validate all external input and package metadata.
- Use parameterized database operations through the Core database provider.
- Keep credentials and secrets in runtime configuration, never in packages or client bundles.
- Treat uploaded archives as untrusted and block path traversal.
- Use HTTPS for external services.
- Avoid dynamic code generation and arbitrary command execution.
- Never log passwords, installation secrets, license keys, or other sensitive credentials.

## Storage

Extensions should use the Core provider abstraction for database, cache, media, and configuration access. Do not depend on a local filesystem layout when the extension is expected to run on Cloudflare.

## Licensing boundary

The Network License Server is a separate service. The CMS should receive only the minimum entitlement state required to enforce the documented 2.0 license contract.
