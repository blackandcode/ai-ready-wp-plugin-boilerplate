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
| `src/Block/BlockServiceProvider.php` | Registers Gutenberg blocks using `register_block_type_from_metadata`. | Bootstrap |
| `src/Rest/Controller/HelloWorldController.php` | Public `GET /ai-ready-wp/v1/hello` REST controller. | Presentation |
| `src/Rest/Controller/SettingsController.php` | Authenticated `GET` and `POST /ai-ready-wp/v1/settings` controller. | Presentation |
| `src/Rest/RestServiceProvider.php` | Service provider registering REST routes and binding controllers. | Bootstrap |
| `src/Settings/Infrastructure/SettingsSchema.php` | Settings schema definition, default values, and sanitization. | Infrastructure |
| `src/Settings/Infrastructure/SettingsRepository.php` | Repository handling WordPress `wp_options` retrieval and storage. | Infrastructure |
| `src/Support/WordPressErrorMapper.php` | Converts application exceptions to typed `WP_Error` responses. | Infrastructure |

---

## 3. Gutenberg Blocks (`blocks/`)

| File | Purpose | Layer |
|---|---|---|
| `blocks/hello-world/block.json` | Block API v3 metadata declaration and attribute definitions. | Presentation |
| `blocks/hello-world/index.ts` | Block registration entrypoint registering edit and save. | Presentation |
| `blocks/hello-world/edit.tsx` | Block editor React UI with `InspectorControls` and live preview. | Presentation |
| `blocks/hello-world/save.tsx` | Frontend save renderer saving semantic HTML. | Presentation |
| `blocks/hello-world/style.css` | Shared frontend and editor styling. | Presentation |
| `blocks/hello-world/editor.css` | Editor-specific boundary and focus styles. | Presentation |

---

## 4. Admin UI Applications & Templates (`assets/`, `templates/`)

| File | Purpose | Layer |
|---|---|---|
| `templates/admin-settings-root.php` | PHP HTML template rendering page title and React root container. | Presentation |
| `assets/src/apps/settings/index.tsx` | Webpack entrypoint mounting React app to `#airwp-settings-root`. | Presentation |
| `assets/src/apps/settings/App.tsx` | Top-level state manager with dirty tracking, saving, and notices. | Presentation |
| `assets/src/apps/settings/types.ts` | TypeScript types for bootstrap data, settings, and sections. | Presentation |
| `assets/src/apps/settings/styles/settings.css` | WPDS card and vertical sidebar layout styles. | Presentation |
| `assets/src/apps/settings/components/SettingsShell.tsx` | Navigation sidebar with icons, card structure, and action footer. | Presentation |
| `assets/src/apps/settings/components/GeneralSection.tsx` | Form controls for greeting message, feature toggle, and description. | Presentation |
| `assets/src/apps/settings/components/AdvancedSection.tsx` | Form controls for REST debug, cache TTL, and data retention policy. | Presentation |
| `assets/src/apps/settings/components/DiagnosticsSection.tsx` | System diagnostic table verifying PHP, WP core, and API status. | Presentation |
| `assets/src/apps/settings/components/StatusBadge.tsx` | WPDS status indicator badge. | Presentation |

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
| `tests/phpunit/integration/SampleIntegrationTest.php` | Integration test harness for WordPress runtime checks. | Tier 2 |
| `tests/js/setup-tests.ts` | Jest test setup loading `@testing-library/jest-dom`. | Tier 3 |
| `tests/js/apps/settings/SettingsShell.test.tsx` | Unit tests for Settings React shell, tab navigation, and save buttons. | Tier 3 |
| `tests/js/blocks/hello-world/edit.test.tsx` | Unit tests for Gutenberg Hello World block edit component. | Tier 3 |
| `tests/node/versioning/version-sync.test.mjs` | Integration tests for automated SemVer synchronization engine. | Toolchain |
| `tests/node/scaffolding/scaffold.test.mjs` | Integration tests for automated scaffolding & renaming CLI. | Toolchain |
| `bruno/bruno.json` | Bruno REST API collection manifest. | Tier 4 |
| `bruno/collection.bru` | Root collection configuration with basic auth and pre-request vars. | Tier 4 |
| `bruno/environments/Local.bru` | Environment variables for local Bruno test execution. | Tier 4 |
| `bruno/00 Smoke/rest-index.bru` | Verification of core WordPress REST API discovery (`/wp-json/`). | Tier 4 |
| `bruno/00 Smoke/hello-world.bru` | Verification of public `/ai-ready-wp/v1/hello` contract. | Tier 4 |
| `bruno/03 Settings/get-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` GET. | Tier 4 |
| `bruno/03 Settings/update-settings.bru` | Verification of authenticated `/ai-ready-wp/v1/settings` POST. | Tier 4 |
| `tests/e2e/playwright/setup/auth.setup.ts` | Playwright global authentication storing storageState. | Tier 5 |
| `tests/e2e/playwright/tests/settings.spec.ts` | Playwright browser and visual snapshot regression tests. | Tier 5 |

---

## 7. Agent Skills & Rules (`.cursor/`, `.agents/`, `.codex/`)

| Path | Purpose |
|---|---|
| `.cursor/rules/wp-admin-ui-ux.mdc` | Persistent Cursor rule enforcing WPDS admin styling and tokens. |
| `.cursor/rules/post-phase-documentation.mdc` | Persistent Cursor rule enforcing phase closure, logs, and prompt-aware versioning. |
| `.cursor/rules/changelog-unreleased.mdc` | Persistent Cursor rule enforcing 100% unreleased changelog recording on every run. |
| `.cursor/rules/windows-coreutils-shell.mdc` | Guidance for terminal commands and execution in Windows / WSL environments. |
| `.cursor/skills/` | Bundled and synchronized agent skills covering WordPress APIs, testing, DDD, OOP, patterns, refactoring, versioning, changelog, and ADRs. |
| `.agents/` | Symlink to `.cursor/` for vendor-agnostic AI agent compatibility. |
| `.codex/` | Symlink to `.cursor/` for OpenAI Codex compatibility. |
| `docs/00-product-charter-and-decisions.md` | Single authoritative source of truth for architectural invariants. |
| `docs/decision-log.md` | Architecture Decision Records (ADRs) and release history. |
| `docs/api/openapi.yaml` | OpenAPI 3.1 specification for all plugin endpoints. |
| `docs/plans/01-starter-phase-template/` | 4-document phase template for structured agile implementation. |
