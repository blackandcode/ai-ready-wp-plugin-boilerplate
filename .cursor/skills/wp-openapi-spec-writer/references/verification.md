# Verification Matrix

## REST controller

- Route uses the established plugin namespace/version.
- Every handler has `permission_callback`.
- Route-level `schema` is registered once.
- Write args are derived from schema when appropriate.
- Runtime request parsing matches the generated content type.
- Runtime response shape matches documented response schema.
- Material `WP_Error` status codes are documented.

## OpenAPI metadata

- Every method has `operationId`.
- Operation IDs are globally unique.
- Summaries and tags are present.
- Deprecated operations are explicitly flagged.
- Path variables are represented as required path parameters.
- GET filters/pagination args are represented as query parameters.

## Generator

Run twice:

```bash
wp ai-ready openapi generate
sha256sum docs/api/openapi.yaml
wp ai-ready openapi generate
sha256sum docs/api/openapi.yaml
```

Hashes must match with unchanged source.

Then:

```bash
wp ai-ready openapi check
npm run openapi:lint
```

Both must exit 0.

## Contract drift tests

Add automated coverage that fails when:

- a registered plugin REST operation lacks OpenAPI metadata;
- duplicate operation IDs exist;
- route schema conversion encounters unsupported constructs;
- generated output differs from committed `docs/api/openapi.yaml`;
- unexpected routes outside the allowlisted namespace enter the spec.

## Admin viewer

Test two configurations.

### Plugin development mode enabled

`wp-config.php` equivalent:

```php
define( 'WP_DEVELOPMENT_MODE', 'plugin' );
```

or `all`.

Expected:

- Settings navigation includes `API Reference`;
- viewer loads generated live spec;
- protected spec endpoint returns 200 for authorized administrator;
- unauthorized request fails appropriately.

### Plugin development mode disabled

Expected:

- Settings navigation has no `API Reference` item;
- development-only spec endpoint is not registered;
- viewer-specific assets are not enqueued;
- ordinary settings functionality remains unchanged.

## Regression suite

Run project PHP/JS lint, static analysis, unit/integration tests, frontend build, and relevant Playwright/Bruno tests.
