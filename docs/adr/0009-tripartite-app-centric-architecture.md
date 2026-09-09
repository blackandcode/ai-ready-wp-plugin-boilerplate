# ADR-0009: Tripartite App-Centric Architecture (Framework, Backend, Frontend Bridge)

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Development Team & AI Coding Agents
- **Consulted:** WordPress Core Architects, Hexagonal/DDD Guild, Frontend Engineering Team
- **Informed:** All Contributors

---

## Context and Problem Statement

The plugin previously established clean Hexagonal/DDD domain principles (ADR-0007) and component design patterns (ADR-0008). However, the directory structure and architectural boundaries still presented friction:

1. **Scattered Frontend Directories:** Frontend assets were fragmented across the repository root (`assets/`, `blocks/`, `templates/`, `patterns/`), causing structural noise and weak cohesion.
2. **Ambiguous Frontend/Backend Boundary:** UI lifecycle hooks (admin menu registration, asset enqueueing, and bootstrap data provisioning) were mixed into backend service providers (`AdminServiceProvider`, `BlockServiceProvider`).
3. **Lack of App-Centric Organization:** Business logic was split by technical layers across the plugin, making it difficult to trace or isolate feature-specific subsystems (e.g. Settings vs Diagnostics vs Hello World).
4. **Need for a Headless Invariant:** As modern WordPress evolves toward decoupled admin interfaces and AI agent integration, the backend must operate as a pure headless system exposing REST endpoints, WP-CLI commands, and Abilities API definitions.
5. **Autoloading Clarity:** A monolithic root PSR-4 prefix (`src/`) obscured architectural domains and allowed frontend and backend classes to couple inappropriately.

We need a definitive architectural organization that strictly segregates the shared framework, headless backend apps, and frontend applications/bridges while enforcing a REST API communication boundary and clean Composer PSR-4 autoloading.

## Decision Drivers

1. **Strict REST Communication Boundary:** Frontend interfaces (React admin apps, Gutenberg blocks) must communicate with the plugin backend exclusively through the WordPress REST API (`/ai-ready-wp/v1/*`).
2. **App-Centric Modularity:** Both backend services and frontend applications must be organized by distinct "Apps" (e.g., `Settings`, `Diagnostics`, `HelloWorld`) to allow modular development, testing, and replacement.
3. **Consolidated Frontend with Clean PHP Bridge:** All presentation code must reside in `src/frontend/`. General patterns and templates remain at `src/frontend/patterns/` and `src/frontend/templates/`, while all PHP hooks, registries, and asset enqueuers are consolidated under `src/frontend/Bridge/` to avoid folder pollution.
4. **Pure Headless Backend:** `src/backend/` must contain zero presentation concerns (no `add_menu_page`, no `wp_enqueue_script`, no HTML templates).
5. **Shared Framework Kernel:** Generic infrastructure (DI container, event bus, template renderer, error mappers, plugin lifecycle) must reside in an isolated `src/framework/` directory.
6. **Symmetric PSR-4 Autoloading:** Composer autoloading must explicitly represent the architectural domains (`Framework\`, `Backend\`, `Frontend\`).

## Considered Options

### Option 1: Monolithic Flat Structure with Scattered Root Directories (Status Quo)

Retain `src/`, `assets/`, `blocks/`, `templates/`, and `patterns/` at the repository root with mixed service providers.

- **Good, because:** No directory restructuring required; familiar to developers used to conventional WordPress folder layouts.
- **Bad, because:** Lacks architectural boundaries; frontend and backend concerns remain entangled; scaling to multiple apps causes root folder clutter; violates headless separation.

### Option 2: Full Multi-Package Monorepo (pnpm Workspaces / Composer Path Repositories)

Split the codebase into separate packages (`packages/framework`, `packages/backend`, `packages/frontend`) with individual `composer.json` and `package.json` configurations.

- **Good, because:** Absolute isolation between packages; independent versioning possible.
- **Bad, because:** Over-engineered for a single WordPress plugin; high developer friction with multiple builds, symbolic linking, and dual dependency trees.

### Option 3: In-Tree Tripartite App-Centric Architecture (Chosen)

Reorganize the repository under `src/` into three explicit architectural domains:

```text
src/
├── framework/       # Shared kernel, DI container, event bus, template engine
├── backend/         # Pure headless business logic organized by Apps (Settings, Diagnostics, HelloWorld)
└── frontend/        # Complete presentation layer (apps/, patterns/, templates/, shared/, Bridge/)
```

- **Framework (`src/framework/`):** Generic, domain-agnostic plumbing: `Container/`, `Kernel/`, `Event/`, `Support/`, `View/`.
- **Backend (`src/backend/`):** Headless app modules (`src/backend/Apps/<AppName>/`) containing their own Domain, Application, Infrastructure, REST, CLI, and Abilities definitions. Master `BackendServiceProvider` boots all apps.
- **Frontend (`src/frontend/`):**
  - `apps/`: Isolated client applications (React admin apps in `settings/react/`, Gutenberg blocks in `hello-world/`).
  - `patterns/` & `templates/`: General block patterns and PHP shell templates.
  - `shared/`: Reusable React components, hooks, API client adapter (`SettingsApiClient`), and TypeScript types.
  - `Bridge/`: Dedicated PHP subfolder containing `FrontendServiceProvider`, `Apps/Settings/` (`SettingsFrontendServiceProvider`, menu, assets, route, bootstrap data), and `Registry/` (`BlockRegistry`, `PatternRegistry`).
- **Composer PSR-4 Mapping:**
  - `AIReady\WPPluginBoilerplate\Framework\` -> `src/framework/`
  - `AIReady\WPPluginBoilerplate\Backend\` -> `src/backend/`
  - `AIReady\WPPluginBoilerplate\Frontend\` -> `src/frontend/Bridge/`

## Decision Outcome

- **Chosen Option:** Option 3 (In-Tree Tripartite App-Centric Architecture)
- **Rationale:** Establishes unbreakable architectural boundaries, strictly enforces the REST communication contract, organizes code logically by cohesive Apps, prevents frontend folder clutter through `src/frontend/Bridge/`, and provides clean PSR-4 autoloading without the overhead of a multi-package monorepo.

## Consequences

### Positive

- **Architectural Clarity:** Immediate visual understanding of where code belongs: shared plumbing (`framework/`), headless logic (`backend/`), or presentation (`frontend/`).
- **Decoupled Frontend:** Frontend applications interact strictly via HTTP/REST, making them portable, testable against mock servers, and decoupled from backend PHP implementation details.
- **Modular App Scaling:** Adding a new feature involves creating `src/backend/Apps/<NewApp>/` and optionally `src/frontend/apps/<new-app>/` without polluting other features.
- **Zero Presentation Leakage:** Backend services can be safely consumed by WP-CLI, REST, or the WordPress Abilities API without loading or referencing presentation dependencies.
- **Clutter-Free Frontend Root:** All PHP integration classes are grouped in `src/frontend/Bridge/`, leaving the frontend root clean for static assets, templates, patterns, and client apps.

### Negative & Trade-offs

- File paths change for all frontend and backend classes, requiring path adjustments in tests, Webpack configuration, and documentation.
- Developers must maintain namespace hygiene across three PSR-4 prefixes.

### Risks & Mitigations

- **Risk:** Developers might attempt to call backend application services directly inside frontend templates or bridge classes.
  - **Mitigation:** Architectural linting rules and code reviews enforce that frontend views obtain data only via REST endpoints or bootstrap configuration objects.
- **Risk:** Build tools (Webpack, Jest, Playwright) could break during path migration.
  - **Mitigation:** Centralized path updates in `webpack.config.js`, `package.json`, `jest.config.js`, and comprehensive validation across the five-tier testing pyramid.

## Architectural Constraints

1. **Strict REST Communication Boundary:** Frontend code (React components, Interactivity stores, templates) must never directly invoke backend application services or database repositories. All data exchange occurs over `/wp-json/ai-ready-wp/v1/*` using `SettingsApiClient`.
2. **Zero Presentation in Backend:** Files in `src/backend/` must never call `add_menu_page()`, `add_submenu_page()`, `wp_enqueue_script()`, or render HTML output.
3. **Frontend PHP Bridge Isolation:** All PHP classes belonging to the presentation domain must reside inside `src/frontend/Bridge/` and declare the `AIReady\WPPluginBoilerplate\Frontend` namespace.
4. **App-Centric Modularity:** Feature code must be encapsulated in app directories (`src/backend/Apps/<App>` and `src/frontend/apps/<app>`). Cross-app dependencies must communicate through events or domain interfaces.
5. **Framework Purity:** `src/framework/` must contain only generic, domain-agnostic infrastructure. No business logic, settings schemas, or feature-specific code is permitted in `framework/`.
6. **Autoloader Symmetry:** Every PHP class in the project must be autoloadable via Composer PSR-4 mappings (`Framework\`, `Backend\`, `Frontend\`) without manual `require` or `include` calls.

## Verification & Fitness Functions

- **Tier 1 (Static Analysis):**
  - `composer lint` (WPCS: `WordPress-Core`, `WordPress-Extra`, `WordPress-Docs`) passes with 0 errors across `src/framework/`, `src/backend/`, `src/frontend/Bridge/`.
  - `composer analyse` (PHPStan Level 6+ with `szepeviktor/phpstan-wordpress`) passes across all three PSR-4 domains.
  - `npm run lint` passes across `src/frontend/` (ESLint, Stylelint, Markdownlint).
- **Tier 2 (PHPUnit Unit Tests):**
  - In-memory unit tests in `tests/phpunit/unit/` verify Framework, Backend Apps, and Frontend Bridge classes with sub-millisecond execution.
- **Tier 3 (Jest Unit Tests):**
  - `npm run test:unit` validates all frontend components, hooks, API adapters, and blocks in `src/frontend/`.
- **Tier 4 (Bruno REST Contract Tests):**
  - `npm run test:rest` executes Bruno collections against `/wp-json/ai-ready-wp/v1/*` ensuring contract integrity.
- **Tier 5 (Playwright E2E Tests):**
  - `npm run test:e2e` executes real browser tests verifying the WPDS admin React app, settings workflows, visual regression, and Gutenberg block frontend interactivity.

## Reconsider When

- WordPress core introduces native micro-frontend package federation or an official decoupled plugin module standard.
- The project is split into independently distributed Composer/npm packages.

## Implementation References

- [ADR-0002: In-Tree Lightweight Dependency Injection Container](0002-in-tree-lightweight-dependency-injection-container.md)
- [ADR-0004: Contract-First REST API Specification](0004-contract-first-rest-api-specification.md)
- [ADR-0005: WPDS Admin Card and Sidebar Architecture](0005-wpds-admin-card-and-sidebar-architecture.md)
- [ADR-0007: Hexagonal Domain Reorganization and Skills Integration](0007-hexagonal-domain-reorganization-and-skills-integration.md)
- [ADR-0008: Frontend Architecture and Component Design Patterns](0008-frontend-architecture-and-component-design-patterns.md)
- [Architecture & Layers Documentation](../framework/architecture-and-layers.md)
