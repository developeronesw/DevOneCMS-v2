# DevOne CMS 2.0

DevOne CMS 2.0 is the next-generation proprietary, self-hosted DevOne CMS distribution by Developer One.

## Architecture

- Version: 2.0.0-alpha.3
- **PHP-free:** the v2 runtime contains no PHP requirement.
- Local runtime: TypeScript/Node.js with the provider-independent core.
- Cloudflare runtime: Cloudflare Workers + Vite.
- Cloudflare resources are provisioned by the deployment configuration: D1, KV, R2, Worker Assets, and Email Service.
- Each installation owns its own Cloudflare resources and secrets. Developer One credentials are not shipped in the CMS package.
- Base installation: single-site.
- Commercial Network License: unlocks Network/Multi-Site functionality for one activated Installation with unlimited Sites.

## Cloudflare deployment

Deployments use the Wrangler configuration in `wrangler.jsonc`. D1, KV, and R2 bindings are declared without customer-specific IDs so the deployment can provision resources in the customer's Cloudflare account. The installer then verifies the bindings before completing CMS initialization.

Required runtime resources:
- D1: `DB`
- KV: `CACHE`
- R2: `MEDIA`
- Worker Assets: `ASSETS`
- Email Service: `EMAIL`

Customer-specific secrets must be configured in the customer's Cloudflare environment and must never be committed to this repository or distributed in a DevOne CMS ZIP.

## Authentication

Password hashing uses PBKDF2-SHA-256 with **10,000 iterations** so fresh Cloudflare Workers Free installations stay within the CPU budget that blocked the previous 210,000-iteration implementation. Stored hashes with iteration counts from 10,000 through 2,000,000 remain verifiable, and successful logins transparently rehash older passwords to the current 10,000-iteration cost.

## Licensing

The base CMS may be installed and used for one Site without a paid Network activation. Network/Multi-Site functionality requires a valid commercial Network entitlement.

A commercial Network License is permanently bound to the single DevOne CMS Installation that successfully activates its key. One activation key cannot be reused to authorize another independent Installation.

A Network License authorizes unlimited Sites within its authorized Installation. Annual licenses expire according to their purchased term. A 99-Year Network License begins on the successful activation date and expires 99 years later.

Redistribution of the proprietary Core, unauthorized resale, sublicensing, white-labeling, license circumvention, and creation of a competing CMS based substantially on proprietary DevOne Core are prohibited unless expressly authorized.

See `DEVONE-CMS-2.0-LICENSE.md` for the complete software license terms.
