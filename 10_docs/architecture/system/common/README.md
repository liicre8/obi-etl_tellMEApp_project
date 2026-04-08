# <component> common — Shared Utilities

## Scope
- Pure, dependency-light helpers shared by `v1/`, `v2/`, `v3/`.

## Allowed
- Serialization, schema helpers, retry/backoff, logging adapters, HTTP wrappers.

## Not Allowed
- Business logic, retailer-specific rules, direct I/O to external systems.

## Import Rules
- Versioned code **may** import from `common/`.
- `common/` **must not** import from any `vX/`.

## Dependencies
- Keep minimal/stable; note versions if pinned.

## Tests
- Unit tests must accompany helpers; no external calls without fakes/mocks.
