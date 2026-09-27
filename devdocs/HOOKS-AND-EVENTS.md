# DevOne CMS 2.0 Hooks and Events

## Status
This document defines the extension-point policy. Only events with an implemented signature and documented behavior are public API.

## Event categories
The 2.0 design covers lifecycle, request, content, media, users, sites, admin, and system events. A category is not itself a callable hook name.

## Stability rule
A public event must document its exact name, firing point, payload, mutation/return behavior, error behavior, runtime availability, and compatibility version.

## Custom events
Extensions may define namespaced events such as acme_seo.scan_started and acme_seo.scan_completed. Do not use generic names.

## Request hooks
Use the Core router/API contract rather than monkey-patching Request, fetch, or internal router arrays.

## Security
Events never replace authorization. Permission checks belong at the protected operation boundary.