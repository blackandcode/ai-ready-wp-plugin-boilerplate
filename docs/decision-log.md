# Decision Log — AI-Ready WP Plugin Boilerplate

This log records release-linked project decisions and architectural decision records (ADRs). Newest entries appear first.

<!-- release-entries -->

## REL-1.0.0 — Version 1.0.0

- Date: 2026-08-01
- Version: `1.0.0`
- Previous version: `0.0.0`
- Status: Applied
- Command: Initial boilerplate release
- Changelog: [1.0.0](../CHANGELOG.md#100---2026-08-01)

**Decision:** Baseline release established. The plugin kernel, dependency injection container, Gutenberg Hello World block, REST API endpoints, WPDS React 18 settings application, automated scaffolding engine, and five-tier testing pyramid are fully operational and verified.

---

## Architectural Decision Records (ADRs)

### ADR-001: In-Tree Lightweight Dependency Injection Container
- **Context:** Enterprise WordPress plugins need modular service registration, loose coupling, and testability without dragging massive PHP framework dependencies into client WordPress environments.
- **Decision:** Implemented a minimal in-tree `Container` and `ServiceProviderRegistry` under `src/Bootstrap/`. All services bind factories and resolve singletons cleanly without reflection overhead.
- **Consequences:** Near-zero runtime overhead, full unit testability via `bind()` mocks, zero dependency security footprint.

### ADR-002: Gutenberg Block API v3 Standard
- **Context:** Modern block editor architecture in WordPress 7.0+ deprecates legacy API v1/v2 definitions.
- **Decision:** Adopted Block API v3 with declarative `block.json` metadata, scoped `style.css` / `editor.css`, and typed React edit/save components using `useBlockProps`.
- **Consequences:** Full FSE compatibility, automatic server-side registration via `register_block_type_from_metadata`, and standard asset orchestration.

### ADR-003: Contract-First REST API Specification
- **Context:** Backend and frontend development drift when API endpoints lack machine-readable contracts.
- **Decision:** Designed OpenAPI 3.1 contract (`docs/api/openapi.yaml`) paired with executable Git-native Bruno collections (`bruno/`).
- **Consequences:** Automated regression protection, exact status codes, clear validation error handling.

### ADR-004: WPDS Admin Architecture (Card + Vertical Sidebar Layout)
- **Context:** Admin pages must blend seamlessly into the WordPress admin experience while providing high-performance React 18 interactivity.
- **Decision:** Enforced WordPress Design System (WPDS) tokens and components (`Card`, `CardHeader`, `CardBody`, `CardFooter`, `@wordpress/icons`) with vertical sidebar navigation.
- **Consequences:** Native WordPress aesthetic, responsive layout, accessible navigation, and predictable component hierarchy.

### ADR-005: Automated Project Scaffolding CLI
- **Context:** Adapting a boilerplate to new plugins often results in missed search-and-replace occurrences, broken namespaces, or mismatched constant prefixes.
- **Decision:** Authored `scripts/scaffold-plugin.mjs` and `scripts/lib/scaffold-engine.mjs` for atomic token replacement, file renaming, and dry-run preview.
- **Consequences:** Instant creation of new plugins from the boilerplate with 100% confidence in consistency.
