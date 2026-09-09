# ADR-0011: Generated OpenAPI 3.1 specification from WordPress REST controllers

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** API Security & Integrations Group, Frontend Team
- **Informed:** All Contributors
- **Supersedes:** [ADR-0004](0004-contract-first-rest-api-specification.md)

---

## Context

In [ADR-0004](0004-contract-first-rest-api-specification.md), the project adopted a "contract-first" model where `docs/api/openapi.yaml` was authored and maintained manually. Over time, maintaining a completely separate, hand-written OpenAPI specification in parallel with WordPress `WP_REST_Controller` implementations introduced critical architectural liabilities:

1. **Contract Drift & Dual-Maintenance Burden:** Changes to PHP controller routes, schemas, permissions, or error payloads frequently diverged from the hand-edited OpenAPI document, creating discrepancies between documented behavior and runtime execution.
2. **Duplication of Validation Schemas:** Schema constraints (types, min/max, enums) were defined once in YAML and separately in `WP_REST_Controller::get_item_schema()`, violating the Single Source of Truth (SSOT) principle.
3. **Agent Coordination Friction:** Autonomous coding agents frequently edited either the controller or the specification file, introducing hallucinated endpoints or out-of-sync parameters.
4. **Viewer Isolation:** Serving an interactive API reference in the WordPress admin required either insecure filesystem access, public CDN scripts, or parsing raw YAML on the server.

## Decision Outcome

We replace the manual contract-first model with a **Code-Driven Generated OpenAPI 3.1 Architecture**:

1. **Single Authoring Source of Truth:**
   Registered WordPress `WP_REST_Controller` instances, standard JSON schemas (`get_item_schema()`), and endpoint-level `openapi` operation metadata serve as the single, authoritative source of truth for the plugin's REST contract.
2. **Deterministic OpenAPI 3.1 Generation:**
   A dedicated framework pipeline (`src/framework/Rest/OpenApi/`) introspects registered routes for namespace `ai-ready-wp/v1`, converts JSON schemas to OpenAPI 3.1 components, normalizes route regexes to OpenAPI path templates, and outputs deterministic, byte-identical YAML to `docs/api/openapi.yaml`.
3. **Committed Reference Artifact:**
   `docs/api/openapi.yaml` remains a tracked, committed Git artifact so that coding agents, external client libraries, and documentation tools can inspect the API contract without executing PHP. Manual edits to `docs/api/openapi.yaml` are strictly prohibited; it is generated via `wp ai-ready openapi generate`.
4. **Automated Drift & Compliance Quality Gates:**
   CI workflows and developer tooling enforce zero-drift and spec validity via `wp ai-ready openapi check` and `npm run openapi:lint` (`@redocly/cli`).
5. **Development-Only Live Endpoint & Admin Viewer:**
   A development-only endpoint (`GET /wp-json/ai-ready-wp-dev/v1/openapi`) exposes live generated JSON spec data exclusively when `wp_is_development_mode( 'plugin' )` returns true and the user has `manage_options`. An interactive API Reference tab in the Settings React app visualizes this contract using a locally bundled, code-split OpenAPI viewer component.

## Architectural Constraints

1. **Byte-for-Byte Determinism:**
   Generation must produce byte-identical output across runs: paths are sorted lexically, HTTP methods follow a fixed order (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`), components are alphabetically ordered, and no machine-specific hostnames or timestamps are embedded.
2. **Production Isolation of Developer Tools:**
   The `ai-ready-wp-dev/v1` namespace and the admin "API Reference" tab are completely absent unless `wp_is_development_mode( 'plugin' )` returns true. They must never be accessible in staging or production.
3. **No Direct Business Logic in Controllers:**
   Controllers remain pure presentation adapters delegating domain work to Application services via DTOs/Commands.
4. **No Manual Edits to Generated OpenAPI Reference:**
   `docs/api/openapi.yaml` is strictly a generated artifact. All contract changes must originate in controller schemas and metadata.
5. **Standard OpenAPI Operation Metadata:**
   Every registered REST route handler must include a valid `openapi` configuration block containing `operationId` (lowerCamelCase and globally unique), `summary`, `tags`, and explicit `responses`.

## Consequences

### Positive

- **Eliminates Contract Drift:** The OpenAPI specification is guaranteed to match runtime route registration and schema validation.
- **Single Source of Truth:** Developers and AI agents author routes, argument schemas, and operation descriptions once in PHP controller classes.
- **Instant In-Admin API Reference:** Developers can explore and test live endpoints directly inside the WordPress Settings app without external tooling or public CDNs.
- **Zero-Touch CI Verification:** Pull requests fail automatically if route changes are committed without synchronizing `docs/api/openapi.yaml`.

### Negative & Trade-offs

- Requires `symfony/yaml` as a development Composer dependency for YAML dumping.
- Generating the contract requires booting WordPress REST route registrations (via WP-CLI or unit test doubles).

## Verification & Fitness Functions

1. `wp-env run cli wp ai-ready openapi generate`: Generates and writes `docs/api/openapi.yaml`.
2. `wp-env run cli wp ai-ready openapi check`: Verifies existing file matches live routes byte-for-byte (exit non-zero on drift).
3. `npm run openapi:lint`: Validates OpenAPI 3.1 specification compliance via Redocly CLI.
4. `npm run test:unit`: Verifies frontend API reference tab visibility and rendering states.
5. `composer test`: Executes unit tests asserting schema converter, path normalizer, and document factory invariants.

## Reconsider When

- WordPress Core implements a native OpenAPI 3.1 generation engine in core REST API infrastructure that supersedes userland introspection.
- A future PHP extension or standardized PSR provides built-in YAML dumping that eliminates the need for `symfony/yaml`.
