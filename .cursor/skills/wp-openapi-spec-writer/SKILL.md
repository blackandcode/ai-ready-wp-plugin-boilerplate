---
name: wp-openapi-spec-writer
description: Use whenever creating, changing, renaming, deprecating, or removing WordPress REST API routes/controllers, request arguments, response schemas, or REST-facing DTO contracts in the AI-Ready WordPress plugin boilerplate. Keeps WordPress REST code and the generated OpenAPI 3.1 reference at docs/api/openapi.yaml synchronized. Use alongside wp-rest-api; this skill owns OpenAPI metadata, generation, contract drift checks, and API-reference documentation, not general REST authentication/security/controller design.
compatibility: Targets the AI-Ready WP Plugin Boilerplate conventions, WordPress 7.0+, PHP 8.3+, OpenAPI 3.1, and WP-CLI. Requires the repository OpenAPI generator once installed.
---

# WordPress OpenAPI Spec Writer

## Purpose

Keep the plugin's REST implementation and its checked-in OpenAPI reference synchronized without maintaining two hand-written API definitions.

The contract model is:

```text
WP_REST_Controller route registration + schemas + OpenAPI operation metadata
                                |
                                v
                     OpenAPI generator
                                |
                                v
                    docs/api/openapi.yaml
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
          AI agents        Admin API UI      CI / Bruno / clients
```

`docs/api/openapi.yaml` is the authoritative **generated reference for consumers and coding agents**. The PHP REST registration and schema code is the **authoring source of truth**. Never hand-edit the generated YAML.

## When to use

Use this skill for every task that does any of the following:

- creates a new plugin REST route or `WP_REST_Controller`;
- changes a REST path, namespace, HTTP method, route argument, request body, or response shape;
- changes `get_item_schema()`, `get_public_item_schema()`, or endpoint args derived from a schema;
- changes permission-visible API behavior that must be documented as an OpenAPI response/security requirement;
- renames, deprecates, or removes an endpoint;
- changes REST-facing DTO serialization (`to_array()`) when the public response contract changes;
- changes the OpenAPI generator, API-reference admin viewer, or contract verification tooling.

Do not use this skill by itself for generic WordPress REST implementation. Pair it with `wp-rest-api` whenever endpoint behavior is being authored or modified.

## Ownership boundaries

Avoid overlapping with existing skills:

- `wp-rest-api`: route design, `register_rest_route()`, `WP_REST_Controller`, permissions, auth, validation, sanitization, response/error behavior.
- `wp-openapi-spec-writer` (this skill): operation metadata, schema-to-OpenAPI mapping, generated `docs/api/openapi.yaml`, OpenAPI lint/drift checks, API-reference synchronization.
- `wp-wpcli-and-ops`: generic WP-CLI architecture and operational conventions. This skill only specifies the OpenAPI command behavior.
- `wp-admin-ui-ux`: layout, accessibility, WPDS components, and visual verification for the development-only API Reference UI.
- `bruno-*`: Bruno collection/test authoring and execution. This skill only requires generated OpenAPI changes to remain compatible with contract-test workflows.
- `wp-architecture-decision-records`: use when an API change introduces or reverses a meaningful architectural decision.

## Required inputs

Before editing:

1. Identify the plugin root.
2. Read `AGENTS.md` and applicable repository instructions.
3. Read `docs/apps/settings/rest-api-contracts.md` and `docs/api/README.md`.
4. Read the current `docs/api/openapi.yaml` as the generated consumer reference.
5. Locate the affected `WP_REST_Controller`, application service, DTOs, tests, and frontend API client.
6. Run:

```bash
node .cursor/skills/wp-openapi-spec-writer/scripts/detect-openapi.mjs
```

If the repository mirrors skills under `.agents/skills/`, use the equivalent script path there.

## Procedure

### 1. Load the companion REST rules

When REST implementation changes are required, apply `wp-rest-api` first for WordPress routing, permissions, schema validation, and responses. Do not duplicate or override its security rules.

### 2. Preserve one authoring source of truth

For custom controller routes:

- define the resource schema in the controller (`get_item_schema()`);
- register the route-level `schema` callback once, not separately inside each HTTP handler;
- derive write arguments from the controller schema with `get_endpoint_args_for_item_schema()` where the endpoint body maps to that resource schema;
- add only operation-level information that WordPress JSON Schema cannot express as `openapi` route-handler metadata;
- do not duplicate property definitions with Swagger/OpenAPI PHP attributes unless the repository explicitly adopts a different architecture.

Preferred registration shape:

```php
register_rest_route(
    $this->namespace,
    '/' . $this->rest_base,
    array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_item' ),
            'permission_callback' => array( $this, 'permissions_check' ),
            'openapi'             => array(
                'operationId' => 'getPluginSettings',
                'summary'     => 'Get plugin settings',
                'tags'        => array( 'Settings' ),
                'responses'   => array(
                    200 => array( 'description' => 'Current plugin settings.' ),
                    403 => array( 'description' => 'Insufficient permissions.' ),
                ),
            ),
        ),
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( $this, 'update_item' ),
            'permission_callback' => array( $this, 'permissions_check' ),
            'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
            'openapi'             => array(
                'operationId' => 'updatePluginSettings',
                'summary'     => 'Update plugin settings',
                'tags'        => array( 'Settings' ),
                'responses'   => array(
                    200 => array( 'description' => 'Updated plugin settings.' ),
                    400 => array( 'description' => 'Invalid settings.' ),
                    403 => array( 'description' => 'Insufficient permissions.' ),
                ),
            ),
        ),
        'schema' => array( $this, 'get_public_item_schema' ),
    )
);
```

Preserve existing supported HTTP methods unless the task explicitly changes the API. Do not broaden POST-only endpoints to PUT/PATCH merely to copy a WordPress Core example.

### 3. Make schemas documentation-quality

Every public schema property should carry enough information for an agent or API consumer to understand it without reading implementation code.

Prefer:

- `type`;
- `description`;
- `required` where applicable;
- `default` where behavior has a real default;
- `enum` for finite vocabularies;
- `minimum` / `maximum`;
- `minLength` / `maxLength`;
- `pattern` when the pattern is part of the contract;
- nested `properties` / `items`;
- `readonly`/context information only where supported by the repository converter.

Do not add constraints that runtime validation does not enforce.

### 4. Add OpenAPI-only operation metadata

WordPress route/schema metadata is not enough to express all operation-level OpenAPI concepts. Use the repository's standard `openapi` metadata shape for:

- `operationId` — required for every operation and globally unique;
- `summary` — required, short action-oriented phrase;
- `description` — add when behavior/side effects need explanation;
- `tags` — at least one stable resource/domain tag;
- `responses` — document success plus material error statuses;
- `deprecated` — when an endpoint is intentionally being phased out;
- `security` — only when the generator cannot infer the repository standard safely;
- explicit request/response overrides only when WordPress route/schema metadata cannot model the contract.

Read `references/metadata-conventions.md` before inventing naming.

### 5. Regenerate the checked-in reference

After every REST contract change run:

```bash
wp ai-ready openapi generate
```

The command must deterministically write:

```text
docs/api/openapi.yaml
```

The YAML must start with a generated-file warning and regeneration command. Do not modify it manually afterward.

Then run the drift check:

```bash
wp ai-ready openapi check
```

If the repository exposes npm wrappers, use those wrappers as well.

### 6. Lint the generated OpenAPI document

Run the repository OpenAPI linter, expected to be:

```bash
npm run openapi:lint
```

The generated file must be valid OpenAPI 3.1 and pass the configured project rules. Fix PHP schemas/metadata or generator behavior; do not patch generated YAML to silence lint errors.

### 7. Update dependent consumers when the contract changed

Inspect and update as applicable:

- frontend TypeScript API types/client;
- Bruno collection/tests;
- PHPUnit/REST integration tests;
- docs explaining endpoint behavior;
- changelog/versioning when externally visible behavior changed.

Do not regenerate unrelated clients/tests unless the task requires it.

### 8. Verify development-only API Reference UI

If the API Reference UI is touched:

- gate backend exposure and frontend navigation with `wp_is_development_mode( 'plugin' )`;
- do not use `WP_DEBUG` as the feature gate;
- do not treat `WP_ENVIRONMENT_TYPE` as equivalent to `WP_DEVELOPMENT_MODE`;
- require an appropriate capability such as `manage_options` for any development-only spec endpoint;
- never expose a spec-viewer route/tab in production when plugin development mode is disabled;
- use `wp-admin-ui-ux` for the actual Settings UI implementation.

Read `references/boilerplate-integration.md`.

## Generator expectations

The repository OpenAPI generator should:

- inspect only the plugin namespace, normally `ai-ready-wp/v1`;
- bootstrap `rest_api_init` exactly once when necessary in WP-CLI;
- enumerate registered routes and handler definitions from `WP_REST_Server`;
- normalize WordPress regex paths to OpenAPI path templates;
- map path and query arguments correctly;
- emit JSON request bodies for write operations when the endpoint consumes JSON;
- derive component schemas from route/controller schemas;
- convert the supported WordPress JSON Schema subset to OpenAPI 3.1-compatible schema objects;
- keep output ordering stable for useful Git diffs;
- emit deterministic YAML without timestamps or machine-specific paths;
- fail loudly on missing `operationId`, duplicate operation IDs, unsupported schema constructs, or undocumented routes according to project policy.

Read `references/contract-model.md` for the detailed mapping rules.

## Verification

Minimum completion checks for any REST API change:

```bash
composer lint
composer analyse
composer test
npm run lint
npm run test
wp ai-ready openapi generate
wp ai-ready openapi check
npm run openapi:lint
```

Run narrower project commands if the repository uses different wrappers, but do not skip OpenAPI generation/checking.

Also verify:

- the generated YAML changed when the public contract changed;
- the generated YAML did not change for internal-only refactors;
- each route/method has a unique `operationId`;
- request/response schema matches runtime behavior;
- `OPTIONS`/route schema discovery still works;
- API Reference tab appears in plugin development mode and disappears when it is disabled;
- no development-only route or viewer is accessible in production mode.

See `references/verification.md`.

## Failure modes

- **YAML differs after a second generation:** generator is non-deterministic; fix ordering/volatile fields.
- **REST route changed but YAML did not:** route is outside the configured namespace, metadata/schema is missing, or generator discovery is incomplete.
- **YAML changed but runtime did not:** likely hand-edited generated file; regenerate and revert manual edits.
- **Duplicate `operationId`:** rename operations using resource-oriented conventions.
- **Request body is form-encoded but controller uses `get_json_params()`:** generator mapping is wrong; emit `application/json`.
- **Schema appears twice:** consolidate the resource schema and reference it from operations rather than duplicating property trees.
- **Admin API Reference appears outside development mode:** fix gating with `wp_is_development_mode( 'plugin' )` on both server exposure and UI bootstrap/navigation.
- **Symfony YAML unavailable:** development dependencies are not installed; the CLI must report an actionable error rather than fatal unexpectedly.

## Completion definition

A REST-related task is not complete until:

1. runtime REST behavior is correct;
2. WordPress schemas/args are correct;
3. OpenAPI operation metadata is present and correct;
4. `docs/api/openapi.yaml` has been regenerated;
5. generation is deterministic and `openapi check` passes;
6. OpenAPI lint passes;
7. affected tests/clients are synchronized;
8. development-only API Reference behavior remains correctly gated.
