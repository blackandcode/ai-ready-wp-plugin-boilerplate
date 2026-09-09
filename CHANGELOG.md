# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.3] - 2026-09-09

### Added

- Added `tools/release/smoke-test-package.mjs` and `npm run release:smoke` script to verify standalone PHP bootstrap on packaged distribution archives with accompanying unit test `tests/node/release/smoke-test-package.test.mjs`

### Changed

- Expanded local pre-commit quality gate (`tools/git-hooks/pre-commit.mjs`, `npm run check`) from 6 to 10 checks to achieve full CI parity with `_release-readiness.yml` including build, release check, package build & validation, and standalone PHP smoke test, with `--skip-package` fast iteration mode

### Fixed

- Fixed GitHub Actions CI asset externalization test failure by compiling frontend assets before `npm run test` in `_release-readiness.yml` and making `tests/node/release/asset-externalization.test.mjs` self-healing

## [1.3.2] - 2026-09-09

### Fixed

- Protected test fixtures and versioning tests in tools/versioning/version-sync.mjs from version scanning and aligned sample-plugin test assertions

## [1.3.1] - 2026-09-09

### Fixed

- Fixed lower target version test fixture assertion in tests/node/versioning/version-sync.test.mjs

## [1.3.0] - 2026-09-09

### Added

- Isolated staging release builder (dist/.staging/), production allowlist assembly, and .files.json release inventory report in tools/release/build-package.mjs
- Plugin Production Release workflow (.github/workflows/plugin-release.yml) with dry-run support (dry_run: true) and packaged plugin PHP smoke test in _release-readiness.yml
- ADR-0014: Boilerplate Starter Release Distribution Architecture documenting dual-release model, starter package invariants, and installer decoupling
- Boilerplate Starter Release packaging toolchain (tools/release/build-boilerplate-package.mjs, tools/release/validate-boilerplate-package.mjs, tests/node/release/boilerplate-package.test.mjs, and npm run boilerplate:build / validate scripts)
- Boilerplate Template Release workflow (.github/workflows/boilerplate-release.yml) with dry_run flag, standalone PHP smoke test, Sigstore attestation, and boilerplate-v<version> tag

### Changed

- Overhauled tools/release/validate-package.mjs with top-level allowlist checking, dev artifact leak prevention, and Composer require-dev package detection
- Expanded tools/release/validate-release.mjs with Plugin::VERSION, block.json, and WP 7.1 / PHP 8.3 baseline checks
- Synchronized .distignore and DEFAULT_DISTIGNORE to exclude src/development/, uncompiled React/TypeScript source, build/admin/developer/, and root dev configs

## [1.2.0] - 2026-09-09

### Added

- ADR-0013: Runtime Architecture, Code Quality and Security Hardening documenting quadripartite architecture, development decoupling, and security baselines
- DevelopmentMode abstraction (`DevelopmentMode`, `WordPressDevelopmentMode`, `FakeDevelopmentMode`) under `src/framework/Environment/` controlling feature availability and provider registration
- Dedicated Development subsystem under `src/development/` (`DevelopmentServiceProvider`, `DeveloperCliServiceProvider`, `DevOpenApiController`, `OpenApiCliCommand`, and `Development\OpenApi\` generator pipeline)
- Automated architectural test suite (`tests/phpunit/unit/Architecture/`) enforcing dependency direction, development isolation, REST security contracts, and native block registry invariants
- Deterministic security static checker (`tools/security/audit-security-baseline.mjs`) with unit tests, wired into `npm run lint:security` and `npm run test:security`

### Changed

- Refactored `Plugin.php` composition root and provider lifecycles to eliminate constructor side effects and conditionally boot `DevelopmentServiceProvider` only when development mode is active
- Hardened REST API controllers with explicit schema validation callbacks, strict `manage_options` capabilities, and removed loose authentication bypasses
- Refactored `BlockRegistry` to use native `wp_register_block_types_from_metadata_collection` with compiled `build/blocks-manifest.php`
- Relocated OpenAPI generator pipeline to `src/development/OpenApi/` as a development-only consumer of runtime REST declarations
- Hardened `uninstall.php` to use `$wpdb->prepare()` for dynamic database cleanup queries

## [1.1.2] - 2026-09-09

### Added

- In-tree native Git pre-commit hooks (.githooks/pre-commit) and cross-platform runner (tools/git-hooks/pre-commit.mjs) enforcing GitHub Actions CI parity locally
- Mandatory local quality gate rule (.cursor/rules/local-quality-gate.mdc) and autonomous self-healing protocol in AGENTS.md for coding agents
- Hook installation CLI (tools/git-hooks/install-hooks.mjs) with npm scripts (prepare, hooks:install, hooks:uninstall, pre-commit, check, check:js, check:php) and unit tests
- Automated asset externalization verification tool (tools/assets/verify-assets.mjs) and test suite ensuring .asset.php dependency extraction
- ADR-0012: WordPress 7.1 Minimum Compatibility Baseline and Runtime Package Locking
- Dual-target testing documentation (docs/testing/wordpress-compatibility-testing.md) and npm run env:start:min/latest scripts

### Fixed

- Markdownlint formatting violations in docs/developers/dependabot-tooling.md and docs/specifications/plans/feature-plan-template.md

### Changed

- Elevated minimum supported WordPress version to 7.1 across plugin header, readme.txt, Compatibility kernel, PHPCS, diagnostics, and tests
- Locked production @wordpress/* runtime dependencies in package.json to exact WordPress 7.1 package release line
- Configured Dependabot rules in .github/dependabot.yml to ignore semver-major and semver-minor updates for @wordpress/* packages

## [1.1.1] - 2026-09-09

### Added

- Standalone Developer Frontend Application (`src/frontend/apps/developer/`): Implemented independent React application structure (`DeveloperApp`, `DeveloperShell`, styles, and entrypoint) encapsulating System Diagnostics telemetry and live OpenAPI 3.1 Scalar reference viewer.
- Extensible Settings App Architecture (`src/frontend/apps/settings/`): Refactored `SettingsShell` and `App` to support `SettingsAppExtension` contracts, enabling dynamic discovery and embedding of sibling applications in the left sidebar navigation and card layout.
- In-Card Developer Horizontal Sub-Tabs: Added sub-tab navigation switching cleanly between **System Diagnostics** and **API Reference** inside the main card without leaving the Settings application.
- Developer Frontend Unit Test Suites: Added `tests/js/apps/developer/DeveloperShell.test.tsx` and migrated `ApiReferenceSection.test.tsx` to the Developer app domain.
- Bruno REST automated test suite for OpenAPI live endpoint: Added `tests/bruno/05 Developer/get-dev-openapi.bru` (verifying 200 OK, valid OpenAPI 3.1 structure, routes) and `tests/bruno/05 Developer/dev-openapi-unauthenticated.bru` (verifying 403 Forbidden).
- Playwright E2E test coverage for embedded Developer app & sub-tabs: Enhanced `tests/e2e/playwright/tests/settings.spec.ts` and `SettingsPage.ts` with assertions verifying the left sidebar "Developer Tools" menu item, in-card sub-tabs, and Scalar contract viewer.
- Unified Feature Plan Template (`docs/specifications/plans/feature-plan-template.md`): Added canonical single-document template for planning new features, integrating Functional Specifications, ADR evaluation, Hexagonal architecture, 5-tier testing, and execution instructions.
- Plan Mode Feature Planning Rule (`.cursor/rules/plan-mode-feature-planning.mdc`): Added guidance rule for AI agents in Plan Mode providing architectural context, proactive question-asking protocols for ambiguous requirements, and autonomous plan formulation.
- Local Dependabot CLI runner (`tools/dependabot/run-dependabot.mjs`) supporting multi-ecosystem checks (`github-actions`, `npm`, `composer`), automated token resolution, and local console reporting without opening GitHub pull requests.
- Automated unit test suite for Dependabot runner (`tests/node/dependabot/run-dependabot.test.mjs`) and `npm run test:dependabot` script.
- Local Dependabot developer manual (`docs/developers/dependabot-tooling.md`) and command catalog references.

### Changed

- Moved `StatusBadge` component from Settings app to `src/frontend/shared/components/StatusBadge.tsx` and exported via `src/frontend/shared/index.ts` for cross-application design token consistency.
- Updated `webpack.config.js` to register `admin/developer/index` standalone entrypoint alongside `admin/settings/index`.
- Streamlined root `README.md` into a marketing-ready developer onboarding guide with key features and site placeholders.
- Consolidated architectural highlights, 5-tier testing pyramid, SemVer lifecycle, CI/CD, and ADR details into `docs/README.md`.
- Updated project license from GPL-2.0-or-later to MIT across `README.md`, `LICENSE`, `package.json`, `composer.json`, headers, and metadata.
- Reordered `README.md` to prioritize Quick Start (Under 2 Minutes) above Why This Boilerplate and simplified Scaffolding section by removing the flags table.
- Updated Quick Start prerequisites in `README.md` and `docs/developers/development-prerequisites.md` to reference the official WordPress development environment documentation for `@wordpress/env` and relocated pre-check execution to post-clone.
- Consolidated Phased Planning Documentation: Updated `docs/specifications/plans/README.md`, `docs/specifications/phased-workflow-guide.md`, `docs/specifications/README.md`, `docs/README.md`, `AGENTS.md`, and workspace rules (`adr-evaluation.mdc`, `post-phase-documentation.mdc`) to point to `docs/specifications/plans/` and reference the unified single-document plan structure.

### Fixed

- Resolved Settings API Reference tab invisibility in WordPress Admin: Aligned localized window property names between `SettingsAssets.php` (`airwpAdminBootstrap` and `airwpSettingsBootstrap`) and `index.tsx`, ensuring bootstrap metadata and development status hydrate cleanly into the React container.
- Resolved direct browser inspection of `/ai-ready-wp-dev/v1/openapi`: Updated `DevOpenApiController::permissions_check()` to validate authenticated WordPress administrator cookie sessions (`wp_validate_auth_cookie`) when accessing directly in browser address bars without a REST nonce.
- Added relative path resolution in `ApiReferenceSection`: Supported `path: '/ai-ready-wp-dev/v1/openapi'` alongside `endpoint` URL to leverage WordPress `wp-api-fetch` core middlewares and prevent cross-origin/port issues in local and proxied development environments.
- Fixed card header title alignment in Settings App: Wrapped the icon badge, title, and subtitle into a cohesive `.airwp-header-content` container and set explicit `justify-content: flex-start` on `.airwp-card-header` in `SettingsShell.tsx` and `settings.css`, preventing Emotion flexbox defaults from pushing the title to the right edge.
- Added Playwright E2E layout alignment assertions in `tests/e2e/playwright/tests/settings.spec.ts` and `SettingsPage.ts` verifying the title is positioned on the left side adjacent to the icon badge across all tabs.

### Removed

- Deprecated Planning Paths and Multi-Document Template: Removed obsolete `docs/plans/` pointer directory and deleted legacy 4-document template directory `docs/specifications/plans/01-starter-phase-template/` in favor of single-document feature planning.

## [1.1.0] - 2026-09-09

### Added

- Documentation Hub Restructuring: Reorganized `docs/` into seven cohesive architectural pillars aligned with the Tripartite App-Centric Architecture (ADR-0009): `docs/framework/`, `docs/testing/`, `docs/apps/`, `docs/developers/`, `docs/specifications/`, `docs/api/`, and `docs/devops/`.
- Agent-Oriented Subdirectory Hubs: Added comprehensive `README.md` files in every documentation folder detailing architectural scope, component manifests, and non-negotiable coding agent guidance.
- DevOps & Two-Pipeline CI/CD Documentation (`docs/devops/`): Added in-depth guides for GitHub Actions workflows, reusable release-readiness gate (`_release-readiness.yml`), decoupled versioning, Sigstore provenance, distribution package contracts, and local release tooling.
- Code-Driven OpenAPI 3.1 Tooling & Engine Documentation: Authored deep dives for `src/framework/Rest/OpenApi/` (`docs/framework/openapi-generator-engine.md`), developer CLI workflows (`docs/developers/openapi-tooling.md`), and API hub overview (`docs/api/README.md`).
- App Technical & Functional Specifications: Added dedicated technical and functional documentation for Settings App, HelloWorld block, Diagnostics subsystem, and Developer Tools App.
- Code-Driven Generated OpenAPI 3.1 Architecture (ADR-0011): Replaced hand-authored specification with in-tree OpenAPI 3.1 generation from registered WordPress REST controllers, schemas, and endpoint metadata.
- Core OpenAPI generation infrastructure (`src/framework/Rest/OpenApi/`): Implemented `OpenApiGenerator`, `WordPressRouteInspector`, `OpenApiPathNormalizer`, `WordPressSchemaConverter`, `OpenApiMetadataValidator`, `OpenApiDocumentFactory`, `OpenApiYamlWriter`, and `OpenApiValidationException`.
- WP-CLI OpenAPI management commands (`src/backend/Cli/OpenApiCliCommand.php`): Implemented `wp ai-ready openapi generate` and `wp ai-ready openapi check` with npm script aliases.
- Redocly CLI integration: Configured `redocly.yaml` and added `npm run openapi:lint` to CI release-readiness workflow (`.github/workflows/_release-readiness.yml`).
- Development-only live OpenAPI endpoint (`src/backend/Apps/Developer/Rest/DevOpenApiController.php`): Registered `GET /wp-json/ai-ready-wp-dev/v1/openapi` gated by `wp_is_development_mode( 'plugin' )` and `manage_options` capability.
- Interactive API Reference tab in Settings app: Integrated lazy-loaded, code-split Scalar viewer component in WordPress Admin when in development mode.
- OpenAPI automated test coverage: Added PHPUnit unit tests for path normalization, schema conversion, metadata validation, YAML dumping, document factory, and drift checks, plus Jest unit tests for `ApiReferenceSection` and `SettingsShell` navigation.

- Two-Pipeline CI/CD and Release Readiness Architecture (ADR-0010): Authored and accepted ADR-0010 establishing the shared reusable release-readiness gate, manual GitHub Releases, package contract verification, and Sigstore provenance attestations.
- Reusable Shared Release Readiness Workflow (`.github/workflows/_release-readiness.yml`): Centralized definition of "release ready" executing linters, multi-PHP testing matrix (PHP 8.3 & 8.5), production asset compilation, distribution packaging, package contract verification, official WordPress Plugin Check on the distribution ZIP, and `$GITHUB_STEP_SUMMARY` reporting.
- Continuous Delivery Readiness Pipeline (`.github/workflows/ci.yml`): Triggers on pull requests and pushes to `main`, invoking `_release-readiness.yml` and uploading candidate ZIPs with 7-day retention.
- Manual Release Publishing Pipeline (`.github/workflows/release.yml`): Manual `workflow_dispatch` release workflow restricted to `main`, performing version pre-flight checks, running the shared readiness gate, generating Sigstore build provenance attestations, tagging `vX.Y.Z`, and publishing immutable GitHub Releases with notes extracted from `CHANGELOG.md`.
- Dependabot Configuration (`.github/dependabot.yml`): Automated weekly dependency updates for GitHub Actions (with SHA pinning preserved), npm packages, and Composer dependencies.
- Production Distribution Contract (`.distignore`): Defined strict archive boundaries keeping runtime source, build artifacts, vendor autoloader, readme, and license while excluding dev tools, tests, and configuration files.
- WordPress Plugin Readme (`readme.txt`): Standard WordPress readme format with synchronized `Stable tag:` tracking and plugin metadata.
- Local Release Toolchain Suite (`tools/release/`): Implemented `build-package.mjs` (zero-dependency pure Node.js PKZIP writer), `validate-package.mjs` (package contract validator), `validate-release.mjs` (pre-flight version consistency checker), `extract-release-notes.mjs` (changelog markdown extractor), `lint-actions.mjs` (workflow static validator and SHA-pinning linter), and helper libraries `lib/distignore.mjs` and `lib/zip-utils.mjs`.
- Added convenience npm release commands: `npm run release:build`, `npm run release:validate`, `npm run release:check`, `npm run release:notes`, `npm run release:inspect`, `npm run lint:actions`, `npm run test:release`, and `npm run ci`.
- Release Tooling Test Suites (`tests/node/release/`): Authoring 11 automated unit tests across `distignore.test.mjs`, `zip-utils.test.mjs`, `extract-release-notes.test.mjs`, `validate-release.test.mjs`, `validate-package.test.mjs`, and `build-package.test.mjs`.
- Authoritative Release Guide (`docs/releasing.md`): Comprehensive documentation on the release lifecycle, decoupled versioning, package contract rules, step-by-step releasing procedures, supply-chain security, and GitHub branch rulesets.
- App-Centric Frontend Bridge Architecture: Reorganized `src/frontend/Bridge/` to introduce `Apps/` subfolder (`src/frontend/Bridge/Apps/Settings/`) and `Registry/` folder (`src/frontend/Bridge/Registry/`), achieving 1:1 structural and namespace symmetry with `src/backend/Apps/`.
- Introduced `SettingsFrontendServiceProvider` encapsulating Settings UI lifecycle hooks, menu registration, and asset enqueuers.
- Extensible lifecycle action hooks in `SettingsAdminMenu` (`airwp_before_settings_page`, `airwp_render_settings_page`, `airwp_after_settings_page`, `airwp_settings_app_placeholder`) enabling decoupled placeholder rendering.
- Direct app-level template resolution in `TemplateRenderer` resolving `apps/<app>/templates/<template>.php` from the frontend root.
- Tripartite App-Centric Architecture (ADR-0009): Partitioned codebase into three clean, decoupled domains under `src/` (`src/framework/`, `src/backend/`, `src/frontend/`) with explicit Composer PSR-4 autoloading for `Framework\`, `Backend\`, and `Frontend\` namespaces.
- Shared Framework Domain (`src/framework/`): Zero-dependency DI container (`Container`, `ServiceProviderInterface`, `ServiceProviderRegistry`), Kernel singleton and lifecycle (`Plugin`, `Compatibility`, `Activation`, `Deactivation`), in-memory Event Dispatcher (`EventDispatcher`, `EventDispatcherInterface`), `WordPressErrorMapper`, `TransientCache`, and safe `TemplateRenderer`.
- Headless Backend Domain (`src/backend/`): Pure headless business logic organized by discrete applications (`Settings`, `Diagnostics`, `HelloWorld`) with domain aggregates, value objects, CQRS commands/queries, repositories, REST controllers, WP-CLI commands, and Abilities API registrations.
- Consolidated Frontend Domain (`src/frontend/`): Unified React 18 admin app (`src/frontend/apps/settings/react/`), Hello World Gutenberg block with Interactivity API (`src/frontend/apps/hello-world/`), block patterns (`src/frontend/patterns/`), HTML shell templates (`src/frontend/templates/`), and shared UI primitives and hooks (`src/frontend/shared/`).
- Architectural Frontend PHP Bridge (`src/frontend/Bridge/`): Isolated presentation hooks (`FrontendServiceProvider`, `SettingsAdminMenu`, `SettingsAssets`, `SettingsRoute`, `SettingsBootstrapData`, `BlockRegistry`, `PatternRegistry`) preventing presentation hook proliferation across the codebase.
- Updated Webpack toolchain and npm scripts to compile React apps and blocks directly from `src/frontend/apps/` to `build/`.
- Updated plugin scaffolding engine (`scripts/lib/scaffold-engine.mjs`) to detect block configurations in `src/frontend/apps/hello-world/block.json`.
- Frontend Design Patterns Architecture: Authored and accepted ADR-0008 establishing Repository/Adapter, Container/Presenter, Compound WPDS Components, State Reducer, and View Strategy patterns.
- `SettingsApiClient` repository adapter encapsulating `@wordpress/api-fetch`, nonce injection, and normalized `ApiClientError` error handling.
- `useSettingsForm` state reducer hook providing immutable form state, dirty tracking, atomic commit, and rollback reset routines.
- `useNotice` hook and accessible `NoticeBanner` component supporting `status` and `alert` ARIA roles with dismiss callbacks.
- `LoadingSkeleton` component emitting `data-airwp-app-state="loading"` for deterministic readiness assertions.
- `ErrorBoundary` component catching unhandled React render exceptions and providing user-facing recovery actions.
- Compound component architecture for `CardLayout` (`CardLayout.Header`, `CardLayout.Body`, `CardLayout.Footer`) with backward-compatible prop support.
- Modular Gutenberg block decomposition: `blocks/hello-world/types.ts` and `blocks/hello-world/edit/Inspector.tsx`.
- Dynamic block metadata scanner and block pattern scanner in `src/frontend/Bridge/Block/BlockRegistry.php` and `src/frontend/Bridge/Pattern/PatternRegistry.php`.
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

### Fixed

- Corrected class namespace import for `SettingsRoute` and `SettingsBootstrapData` in `tests/phpunit/unit/Frontend/FrontendBridgeTest.php` to align with the tripartite app structure.

### Changed

- Updated repository links and reading paths across `README.md`, `AGENTS.md`, `MANIFEST.md`, `check-environment.mjs`, and ADR cross-references to point to the new seven-pillar documentation structure.
- Consolidated phased implementation templates under `docs/specifications/plans/` while preserving `docs/plans/README.md` as a backward-compatible pointer.
- Refactored `SettingsController`, `HelloWorldController`, and `DiagnosticsController` to declare route-level schemas, derive write arguments via `get_endpoint_args_for_item_schema()`, enrich JSON schemas with validation constraints, and embed standard `openapi` metadata blocks.
- Superseded ADR-0004 with ADR-0011, establishing code-driven OpenAPI generation as single source of truth.
- Protected `wp-openapi-spec-writer` in `tools/agent-skills/sync-agent-skills.mjs` (`PROTECTED_IN_TREE_SKILLS`).
- Refactored `FrontendServiceProvider` as a master coordinator delegating to modular application frontend providers and registering cross-cutting dynamic registries.
- Relocated and namespaced `BlockRegistry` and `PatternRegistry` under `AIReady\WPPluginBoilerplate\Frontend\Registry`.
- Relocated PHPUnit unit tests for Settings route and frontend service provider to `tests/phpunit/unit/Frontend/Apps/Settings/SettingsRouteTest.php`.
- Relocated Bruno API contract test collection from root `bruno/` to `tests/bruno/` and reconfigured `scripts/run-rest-tests.mjs` to execute suites and write HTML reports in `tests/bruno/reports/`.
- Reconfigured Playwright, PHPUnit, and Jest test runners to output all execution artifacts (HTML reports, test traces, XML, `.auth/` storage sessions, `.phpunit.cache`, coverage) inside `tests/` instead of polluting the repository root.
- Consolidated settings root mount markup into `src/frontend/apps/settings/templates/admin-settings-root.php`, replacing procedural includes with lifecycle action hooks.
- Reorganized PHPUnit unit test suite (`tests/phpunit/unit/`) to strictly mirror the tripartite architecture (`Framework/`, `Backend/`, `Frontend/`).
- Updated `tsconfig.json` to target `src/frontend/**/*` and removed obsolete `assets/` and `blocks/` references.
- Refactored `App.tsx` into a clean Container component orchestrating `useSettingsForm`, `SettingsApiClient`, and `ErrorBoundary`.
- Refactored `AdminMenu::render_settings_page()` to delegate rendering to `TemplateRenderer`.
- Reorganized `templates/` into structured subdirectories (`templates/admin/`, `templates/partials/`) with backwards-compatible root wrappers.
- Enhanced `scripts/lib/environment-checker.mjs` to recognize Docker Compose v2+ releases (e.g. Docker Compose v5).
- Hardened `tools/wp-env/after-start.mjs` plugin activation to dynamically resolve mounted plugin slug.
- Created cross-platform REST runner `scripts/run-rest-tests.mjs` for seamless execution across Linux, WSL2, macOS, and Windows.
- Refactored `uninstall.php` to clean transient caches when complete purge retention policy is selected.
- Reorganized documentation structure into three clean categories: general/, boilerplate-development/, and feature-development/, preserving adr/ and api/ intact.
- Reorganized operational scripts into domain-structured tools directory and updated all references across code, tests, and documentation
- Updated .wp-env.json to set "core": null to always track the latest WordPress release without version limits, and synchronized related documentation.

### Removed

- Removed legacy documentation directories `docs/general/`, `docs/boilerplate-development/`, `docs/feature-development/`, and root `docs/releasing.md` to prevent documentation drift and eliminate duplication.
- Purged root-level legacy leftover directories (`assets/`, `blocks/`, `patterns/`, `templates/`) and eliminated obsolete fallback directory lookups across `TemplateRenderer`, `BlockRegistry`, `PatternRegistry`, and `scaffold-engine.mjs`.
- Removed redundant wrapper templates in `src/frontend/templates/` (`admin-settings-root.php` and `admin/admin-settings-root.php`).
- Purged legacy pre-tripartite root directories inside `src/` (`src/Bootstrap/`, `src/Settings/`, `src/Diagnostics/`, `src/Admin/`, `src/Block/`, `src/Cli/`, `src/Abilities/`, `src/Rest/`, `src/Event/`, `src/Support/`), leaving `src/` exclusively partitioned into `src/framework/`, `src/backend/`, and `src/frontend/`.

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
