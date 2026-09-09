# ADR-0004: Contract-first REST API specification

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** API Security & Integrations Group
- **Informed:** All Contributors

---

## Context

WordPress plugins commonly expose custom REST API endpoints using ad-hoc `register_rest_route` calls scattered across procedural files. This pattern creates significant maintenance hurdles:

1. Endpoints lack formal, machine-readable documentation, leading to client integration regressions.
2. Permission and validation callbacks are frequently missed or implemented inconsistently, exposing critical security vulnerabilities (such as broken object-level authorization or missing nonce checks).
3. Automated integration testing cannot verify whether an endpoint actually matches its intended API contract.

To ensure security, consistency, and agentic precision, we need an explicit specification process.

## Decision

We mandate a **Contract-First REST API architecture** utilizing **OpenAPI 3.0/3.1** as the authoritative source of truth (`docs/rest-api.yaml`), implemented via object-oriented `WP_REST_Controller` subclasses under `src/Rest/Controller/`, and verified via Git-native Bruno contract tests (`tests/bruno/`).

All endpoints must:

1. Be defined in `docs/rest-api.yaml` with explicit parameter schemas, request bodies, and error response codes before implementation.
2. Extend `WP_REST_Controller` and declare protected namespace and rest_base properties.
3. Implement mandatory `permission_callback` methods on every route without exception (`__return_true` is prohibited for mutating routes).
4. Register routes through a dedicated `RestServiceProvider` attached to the `rest_api_init` hook.
5. Provide matching Git-native Bruno (`.bru`) tests verifying status codes, JSON schema response structures, and authorization constraints.

## Rationale

1. **Security Invariant:** Enforcing explicit permission callbacks and schema validation prevents unauthorized data manipulation and parameter injection.
2. **Machine-Verifiable Contracts:** Having `docs/rest-api.yaml` allows autonomous coding agents and external consumers to inspect exact data types, headers, and error shapes without reading PHP controller internals.
3. **Automated Regression Prevention:** Git-native Bruno collections allow instantaneous end-to-end testing against local WordPress environments using Application Passwords.

## Consequences

### Positive

- Strict, consistent API responses conforming to JSON:API / standard WordPress REST formatting.
- Eliminates unauthenticated or insecurely exposed custom routes.
- Decouples API contract authoring from backend controller logic.
- Enables automated client SDK generation and interactive API documentation.

### Negative & Trade-offs

- Creating or altering an endpoint requires updating both `docs/rest-api.yaml` and the PHP controller.
- Requires maintaining Bruno test collections alongside API code.

### Risks & Mitigations

- **Risk:** The OpenAPI document drifting out of sync with PHP controller implementation.
  **Mitigation:** Bruno contract tests execute during CI/E2E workflows, asserting that actual response bodies match the schemas documented in the OpenAPI specification.

## Non-Goals

- Exposing raw database rows directly through REST routes without domain transformation or sanitization.
- Replacing WordPress core REST infrastructure with external API routers or micro-frameworks.

## Architectural Constraints

- Every registered REST route must specify an explicit `permission_callback` (returning a `WP_Error` on authorization failure).
- Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) must enforce capability checks (`manage_options` or context-appropriate caps) and verify nonce/application password authentication.
- Controller business logic must delegate to pure domain services or settings bridges rather than executing database queries directly.

## Verification & Fitness Functions

- **Unit Test Verification:** `tests/phpunit/unit/Rest/` verifies controller route registration, schema validation, and permission callbacks.
- **REST Contract Verification:** Bruno test files under `tests/bruno/` execute against local WordPress instances (`npm run test:rest`), asserting HTTP status codes and schema validity.

## Reconsider When

- WordPress core introduces a native, built-in OpenAPI contract generation engine that natively reflects controller schemas without manual synchronization.

## Implementation References

- OpenAPI Contract: `docs/rest-api.yaml`
- REST Controller Base: `src/Rest/Controller/`
- Example Controllers: `HelloWorldController.php`, `SettingsController.php`
- Service Provider: `src/Bootstrap/RestServiceProvider.php`
- Bruno Test Collections: `tests/bruno/`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md), [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md)
