# Repository Manifest & File Inventory — AI-Ready WP Plugin Boilerplate

This manifest provides a comprehensive directory and file inventory for the **WordPress AI Plugin Development Boilerplate**, indicating each file's role, architectural layer, and importance to agentic workflows.

---

## 1. Root Configuration & Project Files

| File | Purpose | Layer |
|---|---|---|
| `ai-ready-wp-plugin-boilerplate.php` | Main WordPress plugin entrypoint with headers, constants, and hooks. | Bootstrap |
| `uninstall.php` | Cleanup handler executing data retention policy on uninstallation. | Lifecycle |
| `package.json` | Node dependencies, build scripts, test suites, and scaffolding commands. | Toolchain |
| `composer.json` | PHP dependencies, PSR-4 autoload mapping (`AIReady\WPPluginBoilerplate\`), and linters. | Toolchain |
| `.wp-env.json` | Docker orchestration for local WordPress 7.0 and PHP 8.3 development. | Environment |
| `webpack.config.js` | Webpack build configuration compiling React apps and Gutenberg blocks. | Asset Build |
| `tsconfig.json` | TypeScript compiler configuration with strict checking and React JSX support. | Asset Build |
| `phpcs.xml.dist` | PHP_CodeSniffer ruleset (`WordPress-Core`, `WordPress-Extra`, `WordPress-Docs`). | Static Quality |
| `phpstan.neon.dist` | PHPStan Level 6+ configuration with WordPress stubs and extensions. | Static Quality |
| `phpunit.xml.dist` | PHPUnit 11 configuration defining Unit and Integration testsuites. | Testing |
| `jest.config.js` | Jest unit test configuration for React admin apps and Gutenberg blocks. | Testing |
| `playwright.config.ts` | Playwright E2E configuration with visual regression snapshot paths. | Testing |
| `.editorconfig` | Cross-editor formatting standards (tabs for PHP/JS, spaces for MD/JSON/YML). | Standards |
| `.gitignore` | Git ignore rules excluding vendor, node_modules, build, and credentials. | Git |
| `.markdownlint-cli2.jsonc` | Markdownlint configuration ignoring build and vendor directories. | Documentation |
| `.env.example` | Template for environment variables, Bruno credentials, and target version. | Environment |
| `README.md` | High-conversion marketing and developer onboarding documentation. | Documentation |
| `AGENTS.md` | Universal agent marching orders and constraints across AI tools. | Agent Guidance |
| `CHANGELOG.md` | Keep a Changelog compliant release history. | Release |
| `MANIFEST.md` | This inventory file. | Documentation |

---

## 2. PHP Kernel & Backend Sources (`src/`)

| File | Purpose | Layer |
|---|---|---|
| `src/Bootstrap/Plugin.php` | Singleton orchestrator managing lifecycle and service providers. | Bootstrap |
| `src/Bootstrap/Container.php` | Micro in-tree Dependency Injection container. | Bootstrap |
| `src/Bootstrap/ServiceProvider.php` | Interface contract for all modular service providers. | Bootstrap |
| `src/Bootstrap/ServiceProviderRegistry.php` | Registry managing provider registration and booting. | Bootstrap |
| `src/Bootstrap/Compatibility.php` | Runtime verification of PHP 8.3+ and WordPress 7.0+ requirements. | Bootstrap |
| `src/Bootstrap/Activation.php` | Plugin activation routines, default settings seed, rewrite flush. | Lifecycle |
| `src/Bootstrap/Deactivation.php` | Plugin deactivation routines and rewrite flush. | Lifecycle |
| `src/Admin/AdminRoute.php` | Slug constants and screen matching helpers. | Presentation |
| `src/Admin/AdminMenu.php` | Admin top-level menu page and settings submenu registration. | Presentation |
| `src/Admin/AdminAssets.php` | Enqueues React scripts, styles, and localized bootstrap data. | Presentation |
| `src/Admin/ScreenBootstrapData.php` | Builds configuration JSON for the React admin app. | Presentation |
| `src/Admin/AdminServiceProvider.php` | Service provider registering admin menus and assets. | Bootstrap |
| `src/Block/BlockServiceProvider.php` | Registers Gutenberg blocks and patterns. | Bootstrap |
| `src/Rest/Controller/HelloWorldController.php` | Public `GET /ai-ready-wp/v1/hello` REST controller. | Presentation |
| `src/Rest/Controller/SettingsController.php` | Authenticated `GET` and `POST /ai-ready-wp/v1/settings` controller delegating to application service. | Presentation |
| `src/Rest/Controller/DiagnosticsController.php` | Authenticated `GET /ai-ready-wp/v1/diagnostics` controller exposing runtime telemetry. | Presentation |
| `src/Rest/RestServiceProvider.php` | Service provider registering REST routes and binding core services. | Bootstrap |
| `src/Cli/PluginCliCommand.php` | WP-CLI commands (`wp ai-ready settings-get`, `settings-update`, `doctor`). | Presentation |
| `src/Cli/CliServiceProvider.php` | Service provider registering WP-CLI commands. | Bootstrap |
| `src/Abilities/AbilitiesServiceProvider.php` | Registers plugin abilities with WordPress Abilities API for AI agents. | Presentation |
| `src/Event/EventDispatcher.php` | Dispatches domain events and bridges to WordPress action hooks. | Application |
| `src/Event/EventDispatcherInterface.php` | Contract for domain event dispatching. | Application |
| `src/Settings/Domain/Model/PluginSettings.php` | Aggregate root encapsulating settings state, invariants, and events. | Domain |
| `src/Settings/Domain/ValueObject/GreetingMessage.php` | Value object encapsulating greeting message invariants. | Domain |
| `src/Settings/Domain/ValueObject/FeatureFlag.php` | Value object encapsulating boolean feature toggle. | Domain |
| `src/Settings/Domain/ValueObject/Description.php` | Value object encapsulating plugin description text. | Domain |
| `src/Settings/Domain/ValueObject/RestDebug.php` | Value object encapsulating REST debug flag. | Domain |
| `src/Settings/Domain/ValueObject/CacheTtl.php` | Value object encapsulating cache duration in seconds. | Domain |
| `src/Settings/Domain/ValueObject/DataRetentionPolicy.php` | Backed string enum for uninstall cleanup policies. | Domain |
| `src/Settings/Domain/Event/SettingsUpdatedEvent.php` | Domain event fired when settings are updated. | Domain |
| `src/Settings/Domain/Event/RetentionPolicyChangedEvent.php` | Domain event fired when retention policy changes. | Domain |
| `src/Settings/Domain/Repository/SettingsRepositoryInterface.php` | Domain contract for settings persistence. | Domain |
| `src/Settings/Application/SettingsApplicationService.php` | Shared core application service executing settings use cases. | Application |
| `src/Settings/Application/Command/UpdateSettingsCommand.php` | Command object carrying update parameters. | Application |
| `src/Settings/Application/DTO/SettingsDTO.php` | Immutable DTO carrying settings across boundaries. | Application |
| `src/Settings/Infrastructure/WordPressSettingsRepository.php` | Adapter persisting settings with autoload=false policy. | Infrastructure |
| `src/Settings/Infrastructure/SettingsRepository.php` | Backward-compatible repository wrapper. | Infrastructure |
| `src/Settings/Infrastructure/SettingsSchema.php` | Settings schema definition, default values, and sanitization. | Infrastructure |
| `src/Diagnostics/Domain/DiagnosticsProviderInterface.php` | Contract for querying system diagnostics. | Domain |
| `src/Diagnostics/Application/DiagnosticsService.php` | Service formatting diagnostics telemetry. | Application |
| `src/Diagnostics/Application/DTO/DiagnosticsDTO.php` | DTO representing runtime telemetry. | Application |
| `src/Diagnostics/Infrastructure/WordPressDiagnosticsProvider.php` | Infrastructure telemetry provider querying WP environment. | Infrastructure |
| `src/Support/Cache/TransientCache.php` | Transient caching utility with TTL clamping. | Infrastructure |
| `src/Support/WordPressErrorMapper.php` | Converts application exceptions to typed `WP_Error` responses. | Infrastructure |
| `src/Support/View/TemplateRendererInterface.php` | Interface for template rendering and path resolution. | Infrastructure |
| `src/Support/View/TemplateRenderer.php` | Template renderer with directory traversal guards and scoped variables. | Infrastructure |

---

## 3. Gutenberg Blocks & Patterns (`blocks/`, `patterns/`)

| File | Purpose | Layer |
|---|---|---|
| `blocks/hello-world/block.json` | Block API v3 metadata declaration and attribute definitions. | Presentation |
| `blocks/hello-world/types.ts` | Strongly typed attributes, context, and Interactivity store contracts. | Presentation |
| `blocks/hello-world/index.ts` | Block registration entrypoint registering edit and save. | Presentation |
| `blocks/hello-world/edit/Inspector.tsx` | Gutenberg inspector sidebar controls panel. | Presentation |
| `blocks/hello-world/edit.tsx` | Modular block editor React UI with decomposed Inspector and canvas preview. | Presentation |
| `blocks/hello-world/save.tsx` | Frontend save renderer emitting Interactivity API directives (`data-wp-*`). | Presentation |
| `blocks/hello-world/view.ts` | Interactivity API client store managing dynamic state and actions. | Presentation |
| `blocks/hello-world/style.css` | Shared frontend and editor styling. | Presentation |
| `blocks/hello-world/editor.css` | Editor-specific boundary and focus styles. | Presentation |
| `patterns/interactive-showcase.php` | Block pattern showcasing interactive Hello World block. | Presentation |
| `patterns/card-feature.php` | Block pattern callout card with responsive WPDS styling. | Presentation |

---

## 4. Admin UI Applications & Templates (`assets/`, `templates/`)

| File | Purpose | Layer |
|---|---|---|
| `templates/admin/admin-settings-root.php` | PHP HTML template rendering page title and React root container. | Presentation |
| `templates/partials/app-loading.php` | Reusable partial for loading placeholder state. | Presentation |
| `templates/admin-settings-root.php` | Backwards-compatible wrapper delegating to `templates/admin/`. | Presentation |
| `assets/src/apps/settings/index.tsx` | Webpack entrypoint mounting React app to `#airwp-settings-root`. | Presentation |
| `assets/src/apps/settings/App.tsx` | Orchestrating container managing state reducer, API client, and error boundary. | Presentation |
| `assets/src/apps/settings/types.ts` | TypeScript types for bootstrap data, settings, and sections. | Presentation |
| `assets/src/apps/settings/styles/settings.css` | WPDS card and vertical sidebar layout styles. | Presentation |
| `assets/src/apps/settings/components/SettingsShell.tsx` | Navigation sidebar with icons, card structure, and action footer. | Presentation |
| `assets/src/apps/settings/components/GeneralSection.tsx` | Form controls for greeting message, feature toggle, and description. | Presentation |
| `assets/src/apps/settings/components/AdvancedSection.tsx` | Form controls for REST debug, cache TTL, and data retention policy. | Presentation |
| `assets/src/apps/settings/components/DiagnosticsSection.tsx` | System diagnostic table verifying PHP, WP core, and API status. | Presentation |
| `assets/src/apps/settings/components/StatusBadge.tsx` | WPDS status indicator badge. | Presentation |
| `assets/src/shared/api/SettingsApiClient.ts` | Repository/Adapter encapsulating `@wordpress/api-fetch` and typed errors. | Presentation |
| `assets/src/shared/hooks/useSettingsForm.ts` | State Reducer custom hook for form immutability and dirty tracking. | Presentation |
| `assets/src/shared/hooks/useNotice.ts` | Custom hook for accessible notification state. | Presentation |
| `assets/src/shared/hooks/useSettingsApi.ts` | Custom hook delegating settings operations to `SettingsApiClient`. | Presentation |
| `assets/src/shared/components/CardLayout.tsx` | Compound WPDS component (`CardLayout.Header`, `Body`, `Footer`). | Presentation |
| `assets/src/shared/components/SectionHeader.tsx` | Reusable section header with badge icon and actions. | Presentation |
| `assets/src/shared/components/NoticeBanner.tsx` | Accessible dismissible banner (`role="status"`, `role="alert"`). | Presentation |
| `assets/src/shared/components/LoadingSkeleton.tsx` | Accessible loading skeleton emitting `data-airwp-app-state="loading"`. | Presentation |
| `assets/src/shared/components/ErrorBoundary.tsx` | Defensive error boundary catching render crashes with retry action. | Presentation |

---

## 5. Automation & Scaffolding Scripts (`scripts/`, `tools/`)

| File | Purpose | Layer |
|---|---|---|
| `scripts/scaffold-plugin.mjs` | CLI for automated plugin scaffolding, renaming, and rebranding. | Toolchain |
| `scripts/lib/scaffold-engine.mjs` | Core engine executing atomic token replacements and file renames. | Toolchain |
| `scripts/increase-plugin-version.mjs` | Automated SemVer release tool updating all project metadata. | Toolchain |
| `scripts/record-unreleased-change.mjs` | Deterministic CLI helper to stage unreleased changelog notes. | Toolchain |
| `scripts/lib/version-sync.mjs` | Version synchronization engine with rollback and changelog promotion. | Toolchain |
| `scripts/sync-agent-skills.mjs` | Downloads and syncs external agent skills from upstream repositories. | Toolchain |
| `tools/wp-env/after-start.mjs` | Lifecycle script provisioning admin and Bruno test users after `wp-env start`. | Environment |

---

## 6. Testing Harnesses & Suites (`tests/`, `bruno/`)

| File | Purpose | Tier |
|---|---|---|
| `tests/phpunit/bootstrap.php` | PHPUnit bootstrap initializing autoloader and constants. | Tier 2 |
| `tests/phpunit/unit/Bootstrap/ContainerTest.php` | Unit tests for DI container bindings, singletons, and exceptions. | Tier 2 |
| `tests/phpunit/unit/Bootstrap/PluginTest.php` | Unit tests for Plugin singleton, versioning, and boot idempotency. | Tier 2 |
| `tests/phpunit/unit/Bootstrap/CompatibilityTest.php` | Unit tests for PHP and WordPress version compatibility checks. | Tier 2 |
| `tests/phpunit/unit/Settings/SettingsSchemaTest.php` | Unit tests for settings defaults and sanitization rules. | Tier 2 |
| `tests/phpunit/unit/Support/WordPressErrorMapperTest.php` | Unit tests for exception-to-WP_Error conversion. | Tier 2 |
| `tests/phpunit/unit/Support/TemplateRendererTest.php` | Unit tests for TemplateRenderer security guards and template evaluation. | Tier 2 |
| `tests/phpunit/integration/SampleIntegrationTest.php` | Integration test harness for WordPress runtime checks. | Tier 2 |
| `tests/js/setup-tests.ts` | Jest test setup loading `@testing-library/jest-dom`. | Tier 3 |
| `tests/js/shared/CardLayout.test.tsx` | Unit tests for compound WPDS CardLayout components. | Tier 3 |
| `tests/js/shared/SectionHeader.test.tsx` | Unit tests for accessible section headers with badges and actions. | Tier 3 |
| `tests/js/shared/NoticeBanner.test.tsx` | Unit tests for accessible notices, roles, and dismiss callbacks. | Tier 3 |
| `tests/js/shared/ErrorBoundary.test.tsx` | Unit tests for defensive React error boundary and retry actions. | Tier 3 |
| `tests/js/shared/SettingsApiClient.test.ts` | Unit tests for SettingsApiClient adapter, headers, and error normalization. | Tier 3 |
| `tests/js/shared/useSettingsForm.test.ts` | Unit tests for useSettingsForm state reducer and immutability. | Tier 3 |
| `tests/js/apps/settings/App.test.tsx` | Unit tests for Settings App container and API client delegation. | Tier 3 |
| `tests/js/apps/settings/SettingsShell.test.tsx` | Unit tests for Settings React shell, tab navigation, and save buttons. | Tier 3 |
| `tests/js/blocks/hello-world/edit.test.tsx` | Unit tests for Gutenberg Hello World block edit component. | Tier 3 |
| `tests/js/blocks/hello-world/save.test.tsx` | Unit tests for Hello World save directives. | Tier 3 |
| `tests/node/versioning/version-sync.test.mjs` | Integration tests for automated SemVer synchronization engine. | Toolchain |
| `tests/node/scaffolding/scaffold.test.mjs` | Integration tests for automated scaffolding & renaming CLI. | Toolchain |
| `bruno/bruno.json` | Bruno REST API collection manifest. | Tier 4 |
| `bruno/collection.bru` | Root collection configuration with basic auth and pre-request vars. | Tier 4 |
| `bruno/environments/Local.bru` | Environment variables for local Bruno test execution. | Tier 4 |
| `bruno/00 Smoke/rest-index.bru` | Verification of core WordPress REST API discovery (`/wp-json/`). | Tier 4 |
| `bruno/00 Smoke/hello-world.bru` | Verification of public `/ai-ready-wp/v1/hello` contract. | Tier 4 |
| `bruno/03 Settings/get-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` GET with Chai schema checks. | Tier 4 |
| `bruno/03 Settings/update-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` POST. | Tier 4 |
| `bruno/03 Settings/invalid-settings.bru` | Verification of 400 Bad Request on invalid settings payloads. | Tier 4 |
| `bruno/04 Diagnostics/get-diagnostics.bru` | Verification of `/ai-ready-wp/v1/diagnostics` system telemetry. | Tier 4 |
| `tests/e2e/playwright/setup/auth.setup.ts` | Playwright global authentication storing storageState. | Tier 5 |
| `tests/e2e/playwright/pages/SettingsPage.ts` | Page Object Model encapsulating selectors and tab navigation. | Tier 5 |
| `tests/e2e/playwright/tests/settings.spec.ts` | Playwright browser and visual snapshot regression tests using POM. | Tier 5 |

---

## 7. Agent Skills & Rules (`.cursor/`, `.agents/`, `.codex/`)

| Path | Purpose |
|---|---|
| `.cursor/rules/adr-evaluation.mdc` | Persistent Cursor rule enforcing pre-planning and in-session ADR evaluation gate. |
| `.cursor/rules/wp-admin-ui-ux.mdc` | Persistent Cursor rule enforcing WPDS admin styling and tokens. |
| `.cursor/rules/post-phase-documentation.mdc` | Persistent Cursor rule enforcing phase closure, logs, and prompt-aware versioning. |
| `.cursor/rules/changelog-unreleased.mdc` | Persistent Cursor rule enforcing 100% unreleased changelog recording on every run. |
| `.cursor/rules/windows-coreutils-shell.mdc` | Guidance for terminal commands and execution in Windows / WSL environments. |
| `.cursor/skills/` | Bundled and synchronized agent skills covering WordPress APIs, testing, DDD, OOP, patterns, refactoring, versioning, changelog, and ADRs. |
| `.agents/` | Symlink to `.cursor/` for vendor-agnostic AI agent compatibility. |
| `.codex/` | Symlink to `.cursor/` for OpenAI Codex compatibility. |
| `docs/README.md` | Master documentation hub and directory index. |
| `docs/general/` | Foundational architectural principles, product charter, and ADR guide. |
| `docs/boilerplate-development/` | Toolchain, local environment, testing strategy, linters, scaffolding, and release lifecycles. |
| `docs/feature-development/` | Practical authoring guides for Domain/Application services, REST API, admin UI/UX, Blocks & Interactivity API, WP-CLI, and Abilities API. |
| `docs/adr/` | Durable Architecture Decision Records (ADRs) with index registry and foundational records. |
| `docs/api/openapi.yaml` | OpenAPI 3.1 specification for all plugin endpoints. |
| `docs/plans/01-starter-phase-template/` | 4-document phase template for structured agile implementation. |
