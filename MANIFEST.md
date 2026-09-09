# Repository Manifest & File Inventory — AI-Ready WP Plugin Boilerplate

This manifest provides a comprehensive directory and file inventory for the **WordPress AI Plugin Development Boilerplate**, indicating each file's role, architectural layer, and importance to agentic workflows under the **Tripartite App-Centric Architecture (ADR-0009)**.

---

## 1. Root Configuration & Project Files

| File | Purpose | Layer |
|---|---|---|
| `ai-ready-wp-plugin-boilerplate.php` | Main WordPress plugin entrypoint with headers, constants, and hooks. | Bootstrap |
| `uninstall.php` | Cleanup handler executing data retention policy on uninstallation. | Lifecycle |
| `package.json` | Node dependencies, build scripts, test suites, and scaffolding commands. | Toolchain |
| `composer.json` | PHP dependencies, quadripartite PSR-4 autoload mapping (`Framework\`, `Backend\`, `Development\`, `Frontend\`), and linters. | Toolchain |
| `.wp-env.json` | Docker orchestration for local WordPress (latest) and PHP 8.3 development. | Environment |
| `webpack.config.js` | Webpack build configuration compiling React apps (`src/frontend/apps/settings/`) and Gutenberg blocks (`src/frontend/apps/hello-world/`). | Asset Build |
| `tsconfig.json` | TypeScript compiler configuration with strict checking and React JSX support. | Asset Build |
| `phpcs.xml.dist` | PHP_CodeSniffer ruleset (`WordPress-Core`, `WordPress-Extra`, `WordPress-Docs`). | Static Quality |
| `phpstan.neon.dist` | PHPStan Level 6+ configuration with WordPress stubs and extensions. | Static Quality |
| `phpunit.xml.dist` | PHPUnit 11 configuration defining Unit and Integration testsuites. | Testing |
| `jest.config.js` | Jest unit test configuration for React admin apps and Gutenberg blocks. | Testing |
| `playwright.config.ts` | Playwright E2E configuration with visual regression snapshot paths. | Testing |
| `.editorconfig` | Cross-editor formatting standards (tabs for PHP/JS, spaces for MD/JSON/YML). | Standards |
| `.gitignore` | Git ignore rules excluding vendor, node_modules, build, and credentials. | Git |
| `.markdownlint-cli2.jsonc` | Markdownlint configuration ignoring build and vendor directories. | Documentation |
| `redocly.yaml` | Redocly CLI configuration for OpenAPI 3.1 specification linting. | Toolchain |
| `.env.example` | Template for environment variables, Bruno credentials, and target version. | Environment |
| `README.md` | High-conversion marketing and developer onboarding documentation. | Documentation |
| `LICENSE` | MIT License terms and conditions. | Legal |
| `readme.txt` | WordPress.org standard plugin readme with stable tag and descriptions. | Distribution |
| `.distignore` | Distribution archive rules specifying files to exclude from production ZIP. | Distribution |
| `.github/dependabot.yml` | Dependabot configuration for GitHub Actions, npm, and Composer. | Automation |
| `.github/workflows/_release-readiness.yml` | Reusable shared workflow defining the canonical release-readiness gate. | CI/CD |
| `.github/workflows/ci.yml` | Continuous integration workflow running on PRs and pushes to main. | CI/CD |
| `.github/workflows/release.yml` | Manual release workflow with version validation, provenance attestation, and GitHub Release. | Release |
| `AGENTS.md` | Universal agent marching orders and constraints across AI tools. | Agent Guidance |
| `.cursor/rules/local-quality-gate.mdc` | Always-applied agent rule enforcing local quality gate and autonomous self-healing. | Agent Guidance |
| `.githooks/pre-commit` | POSIX Git pre-commit hook script delegating to tools/git-hooks/pre-commit.mjs. | Git |
| `CHANGELOG.md` | Keep a Changelog compliant release history. | Release |
| `MANIFEST.md` | This inventory file. | Documentation |

---

## 2. Shared Framework Kernel (`src/framework/`)

| File | Purpose | Layer |
|---|---|---|
| `src/framework/Container/Container.php` | Micro in-tree Dependency Injection container. | Framework |
| `src/framework/Container/ServiceProviderInterface.php` | Interface contract for all modular service providers. | Framework |
| `src/framework/Container/ServiceProviderRegistry.php` | Registry managing provider registration and booting. | Framework |
| `src/framework/Environment/DevelopmentMode.php` | Contract defining development mode introspection. | Framework |
| `src/framework/Environment/WordPressDevelopmentMode.php` | WordPress core adapter for plugin development mode. | Framework |
| `src/framework/Environment/FakeDevelopmentMode.php` | Deterministic in-memory test double for development mode. | Framework |
| `src/framework/Kernel/Plugin.php` | Singleton orchestrator managing lifecycle, DI container, and master providers. | Framework |
| `src/framework/Kernel/Compatibility.php` | Runtime verification of PHP 8.3+ and WordPress 7.1+ requirements. | Framework |
| `src/framework/Kernel/Activation.php` | Plugin activation routines, default settings seed, rewrite flush. | Framework |
| `src/framework/Kernel/Deactivation.php` | Plugin deactivation routines and rewrite flush. | Framework |
| `src/framework/Event/EventDispatcherInterface.php` | Contract for domain event dispatching. | Framework |
| `src/framework/Event/EventDispatcher.php` | Dispatches domain events and bridges to WordPress action hooks. | Framework |
| `src/framework/Support/WordPressErrorMapper.php` | Converts application exceptions to typed `WP_Error` responses. | Framework |
| `src/framework/Support/Cache/TransientCache.php` | Transient caching utility with TTL clamping. | Framework |
| `src/framework/View/TemplateRendererInterface.php` | Interface for safe template rendering and path resolution. | Framework |
| `src/framework/View/TemplateRenderer.php` | Template renderer with directory traversal guards and scoped variables. | Framework |

---

## 3. Headless Backend Domain & Apps (`src/backend/`)

| File | Purpose | Layer |
|---|---|---|
| `src/backend/BackendServiceProvider.php` | Master backend provider registering and booting all backend apps. | Backend |
| `src/backend/Cli/PluginCliCommand.php` | Master WP-CLI command aggregator for runtime subcommands. | Backend |
| `src/backend/Apps/Settings/SettingsBackendServiceProvider.php` | Service provider booting Settings App backend services. | Backend (Settings) |
| `src/backend/Apps/Settings/Domain/Model/PluginSettings.php` | Aggregate root encapsulating settings state, invariants, and events. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/GreetingMessage.php` | Value object encapsulating greeting message invariants. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/FeatureFlag.php` | Value object encapsulating boolean feature toggle. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/Description.php` | Value object encapsulating plugin description text. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/RestDebug.php` | Value object encapsulating REST debug flag. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/CacheTtl.php` | Value object encapsulating cache duration in seconds. | Domain |
| `src/backend/Apps/Settings/Domain/ValueObject/DataRetentionPolicy.php` | Backed string enum for uninstall cleanup policies. | Domain |
| `src/backend/Apps/Settings/Domain/Event/SettingsUpdatedEvent.php` | Domain event fired when settings are updated. | Domain |
| `src/backend/Apps/Settings/Domain/Event/RetentionPolicyChangedEvent.php` | Domain event fired when retention policy changes. | Domain |
| `src/backend/Apps/Settings/Domain/Repository/SettingsRepositoryInterface.php` | Domain contract for settings persistence. | Domain |
| `src/backend/Apps/Settings/Application/SettingsApplicationService.php` | Core application service orchestrating settings commands. | Application |
| `src/backend/Apps/Settings/Application/Command/UpdateSettingsCommand.php` | Command object carrying update parameters. | Application |
| `src/backend/Apps/Settings/Application/Query/GetSettingsQuery.php` | Query object carrying read parameters. | Application |
| `src/backend/Apps/Settings/Application/DTO/SettingsDTO.php` | Immutable DTO carrying settings across boundaries. | Application |
| `src/backend/Apps/Settings/Infrastructure/WordPressSettingsRepository.php` | Adapter persisting settings with autoload=false policy. | Infrastructure |
| `src/backend/Apps/Settings/Infrastructure/SettingsRepository.php` | Backward-compatible repository wrapper. | Infrastructure |
| `src/backend/Apps/Settings/Infrastructure/SettingsSchema.php` | Settings schema definition, default values, and sanitization. | Infrastructure |
| `src/backend/Apps/Settings/Rest/SettingsController.php` | Authenticated `/ai-ready-wp/v1/settings` REST controller. | Rest |
| `src/backend/Apps/Settings/Cli/SettingsCliCommand.php` | WP-CLI commands (`wp ai-ready settings-get`, `settings-update`). | Cli |
| `src/backend/Apps/Settings/Abilities/SettingsAbilities.php` | Registers settings abilities with WordPress Abilities API. | Abilities |
| `src/backend/Apps/Diagnostics/DiagnosticsBackendServiceProvider.php` | Service provider booting Diagnostics App backend services. | Backend (Diagnostics) |
| `src/backend/Apps/Diagnostics/Domain/DiagnosticsProviderInterface.php` | Contract for querying system diagnostics. | Domain |
| `src/backend/Apps/Diagnostics/Application/DiagnosticsService.php` | Service formatting diagnostics telemetry. | Application |
| `src/backend/Apps/Diagnostics/Application/DTO/DiagnosticsDTO.php` | DTO representing runtime telemetry. | Application |
| `src/backend/Apps/Diagnostics/Infrastructure/WordPressDiagnosticsProvider.php` | Infrastructure telemetry provider querying WP environment. | Infrastructure |
| `src/backend/Apps/Diagnostics/Rest/DiagnosticsController.php` | Authenticated `/ai-ready-wp/v1/diagnostics` REST controller. | Rest |
| `src/backend/Apps/Diagnostics/Cli/DiagnosticsCliCommand.php` | WP-CLI commands (`wp ai-ready doctor`). | Cli |
| `src/backend/Apps/Diagnostics/Abilities/DiagnosticsAbilities.php` | Registers diagnostics abilities with WordPress Abilities API. | Abilities |
| `src/backend/Apps/HelloWorld/HelloWorldBackendServiceProvider.php` | Service provider booting HelloWorld App backend services. | Backend (HelloWorld) |
| `src/backend/Apps/HelloWorld/Domain/HelloWorldGreeting.php` | Value object encapsulating greeting invariants. | Domain |
| `src/backend/Apps/HelloWorld/Application/HelloWorldService.php` | Service producing Hello World responses. | Application |
| `src/backend/Apps/HelloWorld/Application/DTO/HelloWorldDTO.php` | DTO representing Hello World responses. | Application |
| `src/backend/Apps/HelloWorld/Rest/HelloWorldController.php` | Public `GET /ai-ready-wp/v1/hello` REST controller. | Rest |

---

## 4. Development Subsystem (`src/development/`)

| File | Purpose | Layer |
|---|---|---|
| `src/development/DevelopmentServiceProvider.php` | Service provider booting development routes, CLI commands, and services. | Development |
| `src/development/Rest/DevOpenApiController.php` | Development REST controller serving generated OpenAPI 3.1 specification. | Development Rest |
| `src/development/Cli/DeveloperCliServiceProvider.php` | Service provider registering development WP-CLI commands. | Development Cli |
| `src/development/Cli/OpenApiCliCommand.php` | WP-CLI commands (`wp ai-ready openapi generate` / `check`) for specification generation and drift checks. | Development Cli |
| `src/development/OpenApi/OpenApiGenerator.php` | Facade orchestrating route inspection, OpenAPI 3.1 assembly, and YAML serialization. | Development Tooling |
| `src/development/OpenApi/WordPressRouteInspector.php` | Introspects registered WordPress REST routes, schemas, and OpenAPI metadata. | Development Tooling |
| `src/development/OpenApi/OpenApiPathNormalizer.php` | Normalizes WordPress regex route patterns into OpenAPI path templates. | Development Tooling |
| `src/development/OpenApi/WordPressSchemaConverter.php` | Converts WordPress Draft-4 JSON schemas to OpenAPI 3.1 and extracts components. | Development Tooling |
| `src/development/OpenApi/OpenApiMetadataValidator.php` | Validates route handler OpenAPI metadata blocks and ensures unique operation IDs. | Development Tooling |
| `src/development/OpenApi/OpenApiDocumentFactory.php` | Assembles full OpenAPI 3.1 document structure with deterministic ordering. | Development Tooling |
| `src/development/OpenApi/OpenApiYamlWriter.php` | Serializes OpenAPI document to YAML with atomic writes and standard header. | Development Tooling |
| `src/development/OpenApi/Exception/OpenApiValidationException.php` | Exception thrown when OpenAPI metadata or route constraints are violated. | Development Tooling |

---

## 5. Consolidated Frontend Presentation (`src/frontend/`)

| File | Purpose | Layer |
|---|---|---|
| `src/frontend/Bridge/FrontendServiceProvider.php` | Master frontend provider aggregating app providers and registries. | Frontend Bridge |
| `src/frontend/Bridge/Apps/Settings/SettingsFrontendServiceProvider.php` | Service provider booting Settings menu, assets, and presentation hooks. | Frontend Bridge |
| `src/frontend/Bridge/Apps/Settings/SettingsAdminMenu.php` | Admin top-level menu page and settings submenu registration. | Frontend Bridge |
| `src/frontend/Bridge/Apps/Settings/SettingsAssets.php` | Enqueues React scripts, styles, and localized bootstrap data. | Frontend Bridge |
| `src/frontend/Bridge/Apps/Settings/SettingsRoute.php` | Slug constants and screen matching helpers. | Frontend Bridge |
| `src/frontend/Bridge/Apps/Settings/SettingsBootstrapData.php` | Builds configuration JSON for the React admin app. | Frontend Bridge |
| `src/frontend/Bridge/Registry/BlockRegistry.php` | Native adapter registering blocks via `wp_register_block_types_from_metadata_collection`. | Frontend Bridge |
| `src/frontend/Bridge/Registry/PatternRegistry.php` | Dynamic scanner registering block patterns from `src/frontend/patterns/*.php`. | Frontend Bridge |
| `src/frontend/apps/settings/react/index.tsx` | Webpack entrypoint mounting React app to `#airwp-settings-root`. | Frontend (Settings) |
| `src/frontend/apps/settings/react/App.tsx` | Orchestrating container managing state reducer, API client, and error boundary. | Frontend (Settings) |
| `src/frontend/apps/settings/react/types.ts` | TypeScript types for bootstrap data, settings, and sections. | Frontend (Settings) |
| `src/frontend/apps/settings/react/styles/settings.css` | WPDS card and vertical sidebar layout styles. | Frontend (Settings) |
| `src/frontend/apps/settings/react/components/SettingsShell.tsx` | Navigation sidebar with icons, card structure, and action footer. | Frontend (Settings) |
| `src/frontend/apps/settings/react/components/GeneralSection.tsx` | Form controls for greeting message, feature toggle, and description. | Frontend (Settings) |
| `src/frontend/apps/settings/react/components/AdvancedSection.tsx` | Form controls for REST debug, cache TTL, and data retention policy. | Frontend (Settings) |
| `src/frontend/apps/settings/templates/admin-settings-root.php` | HTML mount template for Settings app with action hooks. | Frontend (Settings) |
| `src/frontend/apps/developer/index.ts` | Public exports and Settings extension definition (`developerAppExtension`). | Frontend (Developer) |
| `src/frontend/apps/developer/react/index.tsx` | Webpack entrypoint mounting standalone Developer app to `#airwp-developer-root`. | Frontend (Developer) |
| `src/frontend/apps/developer/react/App.tsx` | Root container for standalone Developer app with ErrorBoundary. | Frontend (Developer) |
| `src/frontend/apps/developer/react/types.ts` | TypeScript types for Developer sub-tabs and metadata. | Frontend (Developer) |
| `src/frontend/apps/developer/react/styles/developer.css` | Dedicated styles for horizontal sub-tabs, diagnostics table, and banner. | Frontend (Developer) |
| `src/frontend/apps/developer/react/components/DeveloperShell.tsx` | Card-body presentation shell rendering horizontal sub-tabs and views. | Frontend (Developer) |
| `src/frontend/apps/developer/react/components/DiagnosticsSection.tsx` | System diagnostic table verifying PHP, WP core, and API status. | Frontend (Developer) |
| `src/frontend/apps/developer/react/components/ApiReferenceSection.tsx` | React section component fetching and presenting the live OpenAPI reference. | Frontend (Developer) |
| `src/frontend/apps/developer/react/components/ApiReferenceViewer.tsx` | Code-split React viewer rendering OpenAPI specification via Scalar. | Frontend (Developer) |
| `src/frontend/apps/hello-world/block.json` | Block API v3 metadata declaration and attribute definitions. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/types.ts` | Strongly typed attributes, context, and Interactivity store contracts. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/index.ts` | Block registration entrypoint registering edit and save. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/edit/Inspector.tsx` | Gutenberg inspector sidebar controls panel. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/edit.tsx` | Modular block editor React UI with decomposed Inspector and canvas preview. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/save.tsx` | Frontend save renderer emitting Interactivity API directives (`data-wp-*`). | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/view.ts` | Interactivity API client store managing dynamic state and actions. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/style.css` | Shared frontend and editor styling. | Frontend (HelloWorld) |
| `src/frontend/apps/hello-world/editor.css` | Editor-specific boundary and focus styles. | Frontend (HelloWorld) |
| `src/frontend/patterns/interactive-showcase.php` | Block pattern showcasing interactive Hello World block. | Frontend Patterns |
| `src/frontend/patterns/card-feature.php` | Block pattern callout card with responsive WPDS styling. | Frontend Patterns |
| `src/frontend/templates/partials/app-loading.php` | Reusable partial for loading placeholder state. | Frontend Templates |
| `src/frontend/shared/api/SettingsApiClient.ts` | Repository/Adapter encapsulating `@wordpress/api-fetch` and typed errors. | Frontend Shared |
| `src/frontend/shared/hooks/useSettingsForm.ts` | State Reducer custom hook for form immutability and dirty tracking. | Frontend Shared |
| `src/frontend/shared/hooks/useNotice.ts` | Custom hook for accessible notification state. | Frontend Shared |
| `src/frontend/shared/hooks/useSettingsApi.ts` | Custom hook delegating settings operations to `SettingsApiClient`. | Frontend Shared |
| `src/frontend/shared/components/CardLayout.tsx` | Compound WPDS component (`CardLayout.Header`, `Body`, `Footer`). | Frontend Shared |
| `src/frontend/shared/components/SectionHeader.tsx` | Reusable section header with badge icon and actions. | Frontend Shared |
| `src/frontend/shared/components/NoticeBanner.tsx` | Accessible dismissible banner (`role="status"`, `role="alert"`). | Frontend Shared |
| `src/frontend/shared/components/LoadingSkeleton.tsx` | Accessible loading skeleton emitting `data-airwp-app-state="loading"`. | Frontend Shared |
| `src/frontend/shared/components/StatusBadge.tsx` | WPDS status indicator badge for health and telemetry. | Frontend Shared |
| `src/frontend/shared/components/ErrorBoundary.tsx` | Defensive error boundary catching render crashes with retry action. | Frontend Shared |

---

## 6. Automation & Scaffolding Tools (`tools/`)

| File | Purpose | Layer |
|---|---|---|
| `tools/agent-skills/sync-agent-skills.mjs` | Downloads and syncs external agent skills from upstream repositories. | Toolchain |
| `tools/assets/verify-assets.mjs` | CLI validating production build asset externalization and .asset.php files. | Toolchain |
| `tools/changelog/record-unreleased-change.mjs` | Deterministic CLI helper to stage unreleased changelog notes. | Toolchain |
| `tools/dependabot/run-dependabot.mjs` | Local Dependabot runner coordinating CLI, token resolution, and Docker updaters. | Toolchain |
| `tools/environment/check-environment.mjs` | Pre-flight environment check CLI analyzing host, Docker, PHP, and ports. | Toolchain |
| `tools/environment/environment-checker.mjs` | Core environment verification and OS remediation engine. | Toolchain |
| `tools/git-hooks/install-hooks.mjs` | Configures Git core.hooksPath to .githooks or uninstalls in-tree hooks. | Toolchain |
| `tools/git-hooks/pre-commit.mjs` | Cross-platform pre-commit runner executing 6 CI-parity quality checks. | Toolchain |
| `tools/release/build-package.mjs` | CLI packaging production distribution ZIP respecting .distignore. | Release |
| `tools/release/extract-release-notes.mjs` | CLI extracting markdown release notes for a target version from CHANGELOG.md. | Release |
| `tools/release/lint-actions.mjs` | Static GitHub Actions workflow validator and version-tagging linter. | Quality |
| `tools/release/validate-package.mjs` | CLI enforcing package content contract against built ZIP archive. | Release |
| `tools/release/validate-release.mjs` | CLI validating version parity, branch, and tag readiness before release. | Release |
| `tools/release/lib/distignore.mjs` | Parser and glob matcher for .distignore exclusion rules. | Release |
| `tools/release/lib/zip-utils.mjs` | Zero-dependency pure Node.js PKZIP writer, reader, and extractor. | Release |
| `tools/rest-tests/run-rest-tests.mjs` | Cross-platform Bruno REST API test runner loading .env credentials. | Toolchain |
| `tools/scaffolding/scaffold-plugin.mjs` | CLI for automated plugin scaffolding, renaming, and rebranding. | Toolchain |
| `tools/scaffolding/scaffold-engine.mjs` | Core engine executing atomic token replacements and file renames. | Toolchain |
| `tools/security/audit-security-baseline.mjs` | Deterministic static checker enforcing repository-wide security baseline. | Quality |
| `tools/versioning/increase-plugin-version.mjs` | Automated SemVer release tool updating all project metadata. | Toolchain |
| `tools/versioning/version-sync.mjs` | Version synchronization engine with rollback and changelog promotion. | Toolchain |
| `tools/wp-env/after-start.mjs` | Lifecycle script provisioning admin and Bruno test users after `wp-env start`. | Environment |

---

## 7. Testing Harnesses & Suites (`tests/`)

| File | Purpose | Tier |
|---|---|---|
| `tests/phpunit/bootstrap.php` | PHPUnit bootstrap initializing autoloader and constants. | Tier 2 |
| `tests/phpunit/unit/Framework/Container/ContainerTest.php` | Unit tests for DI container bindings, singletons, and exceptions. | Tier 2 |
| `tests/phpunit/unit/Framework/Environment/DevelopmentModeTest.php` | Unit tests for DevelopmentMode abstraction and implementations. | Tier 2 |
| `tests/phpunit/unit/Framework/Kernel/PluginTest.php` | Unit tests for Plugin singleton, versioning, and boot idempotency. | Tier 2 |
| `tests/phpunit/unit/Framework/Kernel/CompatibilityTest.php` | Unit tests for PHP and WordPress version compatibility checks. | Tier 2 |
| `tests/phpunit/unit/Framework/Event/EventDispatcherTest.php` | Unit tests for event dispatcher and subscriber calls. | Tier 2 |
| `tests/phpunit/unit/Framework/Support/TransientCacheTest.php` | Unit tests for transient key hashing and TTL bounds. | Tier 2 |
| `tests/phpunit/unit/Framework/Support/WordPressErrorMapperTest.php` | Unit tests for exception-to-WP_Error conversion. | Tier 2 |
| `tests/phpunit/unit/Framework/View/TemplateRendererTest.php` | Unit tests for TemplateRenderer security guards and template evaluation. | Tier 2 |
| `tests/phpunit/unit/Architecture/DependencyDirectionTest.php` | Architectural tests verifying one-way dependency rules and subsystem isolation. | Tier 2 |
| `tests/phpunit/unit/Architecture/DevelopmentIsolationTest.php` | Architectural tests verifying development provider isolation in production. | Tier 2 |
| `tests/phpunit/unit/Architecture/RestSecurityContractTest.php` | Architectural tests verifying permission callbacks and authorization rules. | Tier 2 |
| `tests/phpunit/unit/Architecture/BlockRegistryTest.php` | Architectural tests verifying native metadata collection without glob or source scanning. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Domain/PluginSettingsTest.php` | Unit tests for Settings aggregate root and invariants. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Domain/GreetingMessageTest.php` | Unit tests for GreetingMessage value object normalization and invariants. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Domain/CacheTtlTest.php` | Unit tests for CacheTtl value object bounds and clamping. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Domain/DataRetentionPolicyTest.php` | Unit tests for DataRetentionPolicy enum cases and fallback. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Application/SettingsApplicationServiceTest.php` | Unit tests for Settings application service orchestration. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/Settings/Infrastructure/SettingsSchemaTest.php` | Unit tests for settings defaults and sanitization rules. | Tier 2 |
| `tests/phpunit/unit/Backend/Apps/HelloWorld/HelloWorldServiceTest.php` | Unit tests for HelloWorld service and greeting VO. | Tier 2 |
| `tests/phpunit/unit/Frontend/Apps/Settings/SettingsRouteTest.php` | Unit tests for SettingsRoute screen matching and service provider lifecycle. | Tier 2 |
| `tests/phpunit/unit/Frontend/Bridge/Registry/BlockRegistryTest.php` | Unit tests for native BlockRegistry execution and path resolution. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/OpenApiPathNormalizerTest.php` | Unit tests for WordPress route regex to OpenAPI path template conversion. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/WordPressSchemaConverterTest.php` | Unit tests for Draft-4 to OpenAPI 3.1 schema conversion and component extraction. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/OpenApiMetadataValidatorTest.php` | Unit tests for operationId formatting, uniqueness, and OpenAPI metadata invariants. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/OpenApiYamlWriterTest.php` | Unit tests for deterministic YAML dumping and atomic filesystem writing. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/OpenApiDocumentFactoryTest.php` | Unit tests for OpenAPI 3.1 document structure assembly and lexical sorting. | Tier 2 |
| `tests/phpunit/unit/Development/OpenApi/OpenApiDriftTest.php` | Unit tests for in-memory and on-disk OpenAPI specification drift detection. | Tier 2 |
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
| `tests/js/apps/developer/DeveloperShell.test.tsx` | Unit tests for Developer app horizontal sub-tabs and section switching. | Tier 3 |
| `tests/js/apps/developer/ApiReferenceSection.test.tsx` | Unit tests for ApiReferenceSection loading, error, retry, and viewer rendering states. | Tier 3 |
| `tests/js/blocks/hello-world/edit.test.tsx` | Unit tests for Gutenberg Hello World block edit component. | Tier 3 |
| `tests/js/blocks/hello-world/save.test.tsx` | Unit tests for Hello World save directives. | Tier 3 |
| `tests/node/versioning/version-sync.test.mjs` | Integration tests for automated SemVer synchronization engine. | Toolchain |
| `tests/node/scaffolding/scaffold.test.mjs` | Integration tests for automated scaffolding & renaming CLI. | Toolchain |
| `tests/node/dependabot/run-dependabot.test.mjs` | Unit tests for local Dependabot runner and job generator. | Toolchain |
| `tests/node/environment/environment-checker.test.mjs` | Unit tests for pre-flight environment checker. | Toolchain |
| `tests/node/git-hooks/install-hooks.test.mjs` | Unit tests for hook installation and core.hooksPath configuration. | Toolchain |
| `tests/node/git-hooks/pre-commit.test.mjs` | Unit tests for pre-commit runner step building, filtering, and CLI flags. | Toolchain |
| `tests/node/release/distignore.test.mjs` | Unit tests for .distignore parsing and path filtering. | Toolchain |
| `tests/node/release/zip-utils.test.mjs` | Unit tests for pure Node.js ZIP creation, listing, and extraction. | Toolchain |
| `tests/node/release/extract-release-notes.test.mjs` | Unit tests for release notes extraction from CHANGELOG.md. | Toolchain |
| `tests/node/release/validate-release.test.mjs` | Unit tests for release pre-flight version verification. | Toolchain |
| `tests/node/release/validate-package.test.mjs` | Unit tests for distribution package contract validator. | Toolchain |
| `tests/node/release/build-package.test.mjs` | Integration test for end-to-end package generation and verification. | Toolchain |
| `tests/node/release/asset-externalization.test.mjs` | Unit and integration tests for asset externalization and .asset.php parsing. | Toolchain |
| `tests/node/security/audit-security-baseline.test.mjs` | Unit tests for deterministic security static checker. | Toolchain |
| `tests/bruno/bruno.json` | Bruno REST API collection manifest. | Tier 4 |
| `tests/bruno/collection.bru` | Root collection configuration with basic auth and pre-request vars. | Tier 4 |
| `tests/bruno/environments/Local.bru` | Environment variables for local Bruno test execution. | Tier 4 |
| `tests/bruno/00 Smoke/rest-index.bru` | Verification of core WordPress REST API discovery (`/wp-json/`). | Tier 4 |
| `tests/bruno/00 Smoke/hello-world.bru` | Verification of public `/ai-ready-wp/v1/hello` contract. | Tier 4 |
| `tests/bruno/03 Settings/get-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` GET with Chai schema checks. | Tier 4 |
| `tests/bruno/03 Settings/update-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` POST. | Tier 4 |
| `tests/bruno/03 Settings/invalid-settings.bru` | Verification of 400 Bad Request on invalid settings payloads. | Tier 4 |
| `tests/bruno/04 Diagnostics/get-diagnostics.bru` | Verification of authenticated `/ai-ready-wp/v1/diagnostics` GET endpoint. | Tier 4 |
| `tests/bruno/05 Developer/get-dev-openapi.bru` | Verification of authenticated `/ai-ready-wp-dev/v1/openapi` live spec discovery contract. | Tier 4 |
| `tests/bruno/05 Developer/dev-openapi-unauthenticated.bru` | Verification of 403 Forbidden on unauthenticated access to development OpenAPI route. | Tier 4 |
| `tests/e2e/playwright/setup/auth.setup.ts` | Playwright global authentication fixture logging in admin user. | Tier 5 |
| `tests/e2e/playwright/pages/SettingsPage.ts` | Page Object Model encapsulating selectors and interactions for Settings screen. | Tier 5 |
| `tests/e2e/playwright/tests/settings.spec.ts` | End-to-end tests for settings rendering, tab navigation, and visual regression snapshot. | Tier 5 |

---

## 8. Documentation Hub (`docs/`)

| File | Purpose | Layer |
|---|---|---|
| `docs/README.md` | Master Documentation Hub, technical architecture guide, testing pyramid, and reading pathways. | Documentation |
| `docs/framework/README.md` | Framework kernel documentation hub. | Documentation |
| `docs/framework/product-charter.md` | Authoritative single source of truth for plugin identity and core invariants. | Framework |
| `docs/framework/architecture-and-layers.md` | Tripartite Hexagonal architecture specification and autoloader mappings. | Framework |
| `docs/framework/container-and-service-providers.md` | In-tree micro-DI container and Service Provider registry. | Framework |
| `docs/framework/kernel-and-lifecycle.md` | Plugin singleton orchestrator, compatibility checks, activation, and deactivation. | Framework |
| `docs/framework/event-dispatcher.md` | Domain Event Dispatcher and WordPress action bridge. | Framework |
| `docs/framework/template-renderer.md` | Safe template renderer with directory traversal guards and scoped variables. | Framework |
| `docs/framework/domain-and-application-services.md` | Clean Hexagonal domain modeling and CQRS application services. | Framework |
| `docs/framework/frontend-bridge.md` | Server-side presentation bridge, menus, assets, and registries. | Framework |
| `docs/framework/error-handling-and-cache.md` | WordPressErrorMapper and TransientCache utilities. | Framework |
| `docs/framework/openapi-generator-engine.md` | Code-driven OpenAPI 3.1 generator pipeline architecture. | Framework |
| `docs/testing/README.md` | Testing hub index, 5-tier pyramid summary, and execution cheatsheet. | Testing |
| `docs/testing/testing-strategy.md` | Comprehensive 5-Tier Testing Pyramid strategy and quality gate pipeline. | Testing |
| `docs/testing/tier1-static-quality.md` | Static quality analysis: PHPCS, PHPStan, ESLint, Stylelint, Markdownlint, Actionlint. | Testing |
| `docs/testing/tier2-phpunit-testing.md` | Fast in-memory PHPUnit unit tests and container integration testing. | Testing |
| `docs/testing/tier3-frontend-unit-testing.md` | Frontend unit testing with Jest and React Testing Library. | Testing |
| `docs/testing/tier4-bruno-rest-testing.md` | Black-box REST API contract testing with Bruno CLI. | Testing |
| `docs/testing/tier5-playwright-e2e-testing.md` | Playwright browser automation, POM, and visual regression testing. | Testing |
| `docs/testing/release-contract-testing.md` | Distribution package verification tests in tests/node/release/. | Testing |
| `docs/testing/wordpress-compatibility-testing.md` | WordPress 7.1 baseline, dual-target testing strategy, and asset verification guide. | Testing |
| `docs/apps/README.md` | App-Centric Architecture hub and inventory of apps. | Apps |
| `docs/apps/settings/README.md` | Settings App technical documentation index. | Apps |
| `docs/apps/settings/technical-spec.md` | Settings App technical specification and class architecture. | Apps |
| `docs/apps/settings/rest-api-contracts.md` | Settings App REST API contracts and schemas. | Apps |
| `docs/apps/hello-world/README.md` | HelloWorld App technical documentation index. | Apps |
| `docs/apps/hello-world/technical-spec.md` | HelloWorld block specification and Interactivity store. | Apps |
| `docs/apps/diagnostics/README.md` | Diagnostics App technical documentation index. | Apps |
| `docs/apps/diagnostics/technical-spec.md` | Diagnostics telemetry specification and doctor CLI. | Apps |
| `docs/apps/developer/README.md` | Developer Tools App technical documentation index. | Apps |
| `docs/apps/developer/technical-spec.md` | Developer tools and in-admin API Reference viewer specification. | Apps |
| `docs/developers/README.md` | Developer hub index and quickstart onboarding. | Developers |
| `docs/developers/development-prerequisites.md` | Host system requirements across macOS, Linux, WSL2, and Windows. | Developers |
| `docs/developers/environment-and-toolchain.md` | Docker orchestration via wp-env and automated lifecycle scripts. | Developers |
| `docs/developers/command-catalog.md` | Authoritative directory of all verified commands. | Developers |
| `docs/developers/bootstrap-checklist.md` | Pre-flight verification checklist for local development environments. | Developers |
| `docs/developers/coding-standards.md` | WordPress Coding Standards and static analysis guidelines. | Developers |
| `docs/developers/project-scaffolding-cli.md` | Automated plugin rebranding and scaffolding CLI guide. | Developers |
| `docs/developers/versioning-and-releases.md` | Atomic SemVer release tool and unreleased changelogging guide. | Developers |
| `docs/developers/openapi-tooling.md` | OpenAPI generation, drift checking, and Redocly linting manual. | Developers |
| `docs/developers/dependabot-tooling.md` | Local Dependabot CLI runner, token resolution, and ecosystem triage manual. | Developers |
| `docs/developers/git-hooks.md` | In-tree Git pre-commit hooks, CI-parity quality gate, and agent self-healing loops. | Developers |
| `docs/developers/agent-skills.md` | Bundled agent skills catalog and synchronization script. | Developers |
| `docs/developers/configuration-reference.md` | Annotated configuration templates reference. | Developers |
| `docs/developers/architecture-decision-records-guide.md` | Developer manual for evaluating, creating, and validating ADRs. | Developers |
| `docs/specifications/README.md` | Functional specifications and phased implementation hub. | Specifications |
| `docs/specifications/phased-workflow-guide.md` | Vertical slice decomposition and 4-document phase anatomy guide. | Specifications |
| `docs/specifications/apps/README.md` | App functional specifications index. | Specifications |
| `docs/specifications/apps/settings/functional-spec.md` | Settings App functional specification. | Specifications |
| `docs/specifications/apps/hello-world/functional-spec.md` | HelloWorld block functional specification. | Specifications |
| `docs/specifications/apps/diagnostics/functional-spec.md` | Diagnostics subsystem functional specification. | Specifications |
| `docs/specifications/apps/developer/functional-spec.md` | Developer Tools & API viewer functional specification. | Specifications |
| `docs/specifications/plans/README.md` | Phased implementation plans directory. | Specifications |
| `docs/specifications/plans/feature-plan-template.md` | Canonical single-document template for planning new features. | Specifications |
| `docs/api/README.md` | Code-driven generated OpenAPI 3.1 specification hub. | API |
| `docs/api/openapi.yaml` | The generated, authoritative OpenAPI 3.1 specification. | API |
| `docs/devops/README.md` | DevOps, CI/CD, and release architecture hub. | DevOps |
| `docs/devops/github-actions-ci-cd.md` | GitHub Actions CI/CD workflows and release-readiness gate. | DevOps |
| `docs/devops/releasing-and-distribution.md` | Releasing, decoupled versioning, and distribution architecture. | DevOps |
| `docs/devops/package-contract-and-distignore.md` | Package content contract and .distignore specification. | DevOps |
| `docs/devops/local-release-tooling.md` | Local release CLI tooling and parity reference. | DevOps |
| `docs/adr/README.md` | Architecture Decision Records index and status log. | Architecture |
| `docs/adr/0013-runtime-architecture-code-quality-and-security-hardening.md` | Architectural record defining runtime context, development decoupling, native blocks, and security. | Architecture |
| `docs/implementation-logs/2026-09-09-runtime-architecture-and-security-hardening.md` | Implementation report for runtime architecture and security hardening. | Implementation |
