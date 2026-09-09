# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Frontend Design Patterns Architecture: Authored and accepted ADR-0008 establishing Repository/Adapter, Container/Presenter, Compound WPDS Components, State Reducer, and View Strategy patterns.
- `SettingsApiClient` repository adapter encapsulating `@wordpress/api-fetch`, nonce injection, and normalized `ApiClientError` error handling.
- `useSettingsForm` state reducer hook providing immutable form state, dirty tracking, atomic commit, and rollback reset routines.
- `useNotice` hook and accessible `NoticeBanner` component supporting `status` and `alert` ARIA roles with dismiss callbacks.
- `LoadingSkeleton` component emitting `data-airwp-app-state="loading"` for deterministic readiness assertions.
- `ErrorBoundary` component catching unhandled React render exceptions and providing user-facing recovery actions.
- Compound component architecture for `CardLayout` (`CardLayout.Header`, `CardLayout.Body`, `CardLayout.Footer`) with backward-compatible prop support.
- Modular Gutenberg block decomposition: `blocks/hello-world/types.ts` and `blocks/hello-world/edit/Inspector.tsx`.
- Dynamic block metadata scanner and block pattern scanner in `src/Block/BlockServiceProvider.php`.
- New block pattern `patterns/card-feature.php` showcasing responsive WPDS feature cards.
- `TemplateRenderer` implementing Template Method and View Strategy with directory traversal security guards and extensible filters.
- `DiagnosticsController` exposing authenticated `GET /ai-ready-wp/v1/diagnostics` REST endpoint for system telemetry.
- Playwright Page Object Model (`SettingsPage.ts`) encapsulating selectors, navigation, and state assertions.
- Comprehensive Jest unit tests for shared components, hooks, blocks, and admin app container (10 suites, 28 tests).
- Enriched Bruno API contract tests with Chai `expect` schema assertions, error case testing, and diagnostics telemetry checks.
- Validated `blueprint.json` strictly conforming to official WordPress Playground schema with top-level `meta` and `features`.
- Strictly separated Hexagonal / DDD Architecture with pure PHP 8.3 Domain Layer (Value Objects `GreetingMessage`, `FeatureFlag`, `Description`, `RestDebug`, `CacheTtl`, backed string enum `DataRetentionPolicy`, aggregate root `PluginSettings`, and domain repository interface `SettingsRepositoryInterface`).
- Decoupled Application Layer with CQRS-Lite commands (`UpdateSettingsCommand`), queries (`GetSettingsQuery`), `SettingsDTO`, `DiagnosticsDTO`, and shared core services `SettingsApplicationService` and `DiagnosticsService`.
- In-memory `EventDispatcher` bridging domain events (`SettingsUpdatedEvent`, `RetentionPolicyChangedEvent`) to WordPress action hooks (`airwp_settings_updated`, `airwp_retention_policy_changed`).
- WordPress infrastructure adapters: `WordPressSettingsRepository` with explicit `autoload=false` performance policy, `WordPressDiagnosticsProvider`, and `TransientCache` with TTL clamping.
- Multi-channel Presentation Adapters: Refactored `SettingsController` delegating to `SettingsApplicationService`, custom WP-CLI commands (`wp ai-ready settings-get`, `wp ai-ready settings-update`, `wp ai-ready doctor`), and official WordPress Abilities API integration (`ai-ready-wp/get-settings`, `ai-ready-wp/update-settings`, `ai-ready-wp/get-diagnostics`).
- Gutenberg Block API v3 Interactivity API implementation with client store (`view.ts`) and directives (`data-wp-interactive`, `data-wp-context`, `data-wp-on--click`, `data-wp-bind`, `data-wp-text`).
- Reusable block pattern `ai-ready-wp/interactive-showcase` in `patterns/interactive-showcase.php`.
- Shared frontend modules in `assets/src/shared/` (`CardLayout`, `SectionHeader`, `useSettingsApi`, shared TypeScript types).
- Declarative zero-install WordPress Playground blueprint (`blueprint.json`) and CLI configuration (`wp-cli.yml`).
- Accepted ADR-0007 documenting Hexagonal domain reorganization, shared core service pattern, and skills integration.
- Authored new comprehensive feature development guides for pure PHP Domain/Application services, Gutenberg Interactivity API, custom WP-CLI commands, and WordPress Abilities API.
- Created docs/README.md master documentation hub with categorized navigation paths and mermaid architectural diagrams.

### Changed

- Refactored `App.tsx` into a clean Container component orchestrating `useSettingsForm`, `SettingsApiClient`, and `ErrorBoundary`.
- Refactored `AdminMenu::render_settings_page()` to delegate rendering to `TemplateRenderer`.
- Reorganized `templates/` into structured subdirectories (`templates/admin/`, `templates/partials/`) with backwards-compatible root wrappers.
- Enhanced `scripts/lib/environment-checker.mjs` to recognize Docker Compose v2+ releases (e.g. Docker Compose v5).
- Hardened `tools/wp-env/after-start.mjs` plugin activation to dynamically resolve mounted plugin slug.
- Created cross-platform REST runner `scripts/run-rest-tests.mjs` for seamless execution across Linux, WSL2, macOS, and Windows.
- Refactored `uninstall.php` to clean transient caches when complete purge retention policy is selected.
- Reorganized documentation structure into three clean categories: general/, boilerplate-development/, and feature-development/, preserving adr/ and api/ intact.


## [1.0.1] - 2026-09-08

### Added

- Added CLI parameters (--bump, --target-version, -m, -d) and positional arguments to scripts/increase-plugin-version.mjs, completely decoupling versioning from .env
- Added convenient npm release scripts: npm run update-version:patch, npm run update-version:minor, and npm run update-version:major
- Authored changelog skill (.cursor/skills/changelog/SKILL.md) and deterministic CLI helper scripts/record-unreleased-change.mjs (npm run changelog:add)
- Bundled wp-architecture-decision-records and adr-skill agent skills, elevating architectural governance to a formal machine-verifiable discipline.
- Created persistent Cursor rule (.cursor/rules/adr-evaluation.mdc) enforcing pre-planning and in-session ADR evaluation gates.
- Bootstrapped docs/adr/ with index registry and 6 foundational accepted records (ADR-0001 through ADR-0006).
- Authored comprehensive architectural guide in docs/12-architecture-decision-records.md and added adr:* npm scripts.

### Changed

- Enforced prompt-aware versioning in AGENTS.md and post-phase-documentation.mdc, requiring explicit user prompt instructions before triggering version bumps
- Enacted mandatory 100% unreleased changelog recording rule (.cursor/rules/changelog-unreleased.mdc) and expanded test suite to 14 automated integration tests
- Hardened scripts/sync-agent-skills.mjs with PROTECTED_IN_TREE_SKILLS safeguard and post-sync integrity verification to protect in-tree skills and rules from deletion or remote overwrite
- Decoupled scripts/lib/version-sync.mjs, scripts/increase-plugin-version.mjs, and versioning test suite from docs/decision-log.md.
- Updated README.md, AGENTS.md, charter, directory architecture, versioning lifecycle, and manifests to enforce ADR governance.

### Removed

- Removed obsolete docs/project-boilerplate directory and redundant duplicate assets
- Deprecated and removed docs/decision-log.md to eliminate dual-source drift between CHANGELOG.md and docs/adr/.

## [1.0.0] - 2026-08-01

### Added
- Enterprise-grade plugin kernel with micro Dependency Injection Container and Service Providers in `src/Bootstrap/`.
- Gutenberg Block API v3 Hello World block with `InspectorControls`, attributes, and scoped styling in `blocks/hello-world/`.
- Contract-first REST API controllers for `/hello` and `/settings` endpoints with schema validation.
- WordPress Design System (WPDS) React 18 Settings application with Card layout and vertical sidebar tab navigation.
- Automated scaffolding & rebranding CLI (`scripts/scaffold-plugin.mjs`) supporting interactive and flag-based execution.
- Automated semantic versioning and release synchronization engine (`scripts/increase-plugin-version.mjs`).
- Complete Five-Tier Testing Pyramid:
  - Tier 1: WPCS, PHPStan Level 6+, and frontend linters.
  - Tier 2: PHPUnit 11 unit and integration test suites.
  - Tier 3: Jest and React Testing Library frontend unit tests.
  - Tier 4: Executable Bruno REST E2E test collection with Application Password authentication.
  - Tier 5: Playwright visual regression and browser end-to-end tests.
- 30 bundled agent skills (including DDD, OOP, Design Patterns, TDD, and Refactoring) and persistent Cursor rules.
- Authoritative Product Charter (`docs/00-product-charter-and-decisions.md`) and OpenAPI 3.1 specification (`docs/api/openapi.yaml`).
