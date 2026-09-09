# REST API & OpenAPI 3.1 Specification Hub

This directory houses the authoritative **OpenAPI 3.1 Specification** for the **WordPress AI Plugin Development Boilerplate**.

Governed by **ADR-0011: Generated OpenAPI 3.1 Specification from WordPress REST Controllers** (which formally supersedes ADR-0004).

---

## 1. Code-Driven Generated OpenAPI Model

Unlike legacy manual documentation where OpenAPI specifications are hand-edited and frequently drift from code, this boilerplate implements a **Code-Driven Generated Architecture**:

1. **Single Source of Truth (SSOT):**
   PHP controllers extending `WP_REST_Controller` declare argument validation, data types, parameter requirements, item schemas (`get_item_schema()`), and `openapi` operation metadata.
2. **Deterministic Generation:**
   The framework pipeline (`src/framework/Rest/OpenApi/`) introspects registered routes for the `ai-ready-wp/v1` namespace, converts JSON schemas to OpenAPI 3.1 components, normalizes regex paths to URI templates, and emits byte-identical YAML to `openapi.yaml`.
3. **Committed Reference Artifact:**
   `docs/api/openapi.yaml` remains a tracked, committed Git artifact so that coding agents, external consumers, and documentation generators can inspect the API contract without executing PHP.

---

## 2. File Inventory

- `openapi.yaml`: The generated, authoritative OpenAPI 3.1 specification covering:
  - `/settings`: Authenticated settings retrieval and updates.
  - `/diagnostics`: Authenticated system health telemetry.
  - `/hello`: Public smoke check and greeting contract.

---

## 3. Tooling & Commands

```bash
# 1. Regenerate openapi.yaml from live WordPress route registrations
npm run openapi:generate

# 2. Check for contract drift in CI (exits non-zero if openapi.yaml does not match PHP code)
npm run openapi:check

# 3. Lint openapi.yaml using Redocly CLI rules (redocly.yaml)
npm run openapi:lint
```

---

## 4. Coding Agent Guidance

1. **DO NOT Edit `docs/api/openapi.yaml` Manually:**
   Any manual edits to `docs/api/openapi.yaml` will be overwritten by `npm run openapi:generate` and will fail the zero-drift CI check (`npm run openapi:check`).
2. **Author Schema Changes in PHP Controllers:**
   When adding or modifying an endpoint, declare parameter schemas, descriptions, and operations inside the controller class (`src/backend/Apps/<App>/Rest/`). Then run `npm run openapi:generate`.
3. **Inspect Before Calling:**
   Autonomous agents and client code should read `docs/api/openapi.yaml` to discover parameter schemas, required headers, authentication requirements, and error payload formats before constructing HTTP calls.
