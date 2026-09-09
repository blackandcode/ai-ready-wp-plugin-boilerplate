# Product Charter and Architectural Invariants — AI-Ready WP Plugin Boilerplate

This document is the **Single Source of Truth** for the **WordPress AI Plugin Development Boilerplate**.
If any specification, phase document, prompt, or code implementation conflicts with this charter, **the charter wins**, and the conflicting artifact must be corrected immediately.

---

## 1. Product Identity & Foundations

- **Product Name:** WordPress AI Plugin Development Boilerplate
- **Default Plugin Slug:** `ai-ready-wp-plugin-boilerplate`
- **Default PHP Root Namespace:** `AIReady\WPPluginBoilerplate`
- **Default Constant Prefix:** `AIRWP_`
- **Default REST Route Namespace:** `ai-ready-wp/v1`
- **Default Block Namespace:** `ai-ready-wp/hello-world`
- **Minimum Supported WordPress Version:** `7.1`
- **Minimum Supported PHP Version:** `8.3`
- **License:** MIT

---

## 2. Core Architectural Invariants

### Invariant 1: Tripartite Architecture, Clean Hexagonal Domain & Zero Framework Lock-In

1. **Tripartite Separation (ADR-0009):** The codebase is partitioned into three decoupled tiers: `src/framework/` (shared infrastructure kernel), `src/backend/` (pure headless business logic organized by discrete Apps), and `src/frontend/` (consolidated presentation apps, Gutenberg blocks, patterns, templates, and isolated PHP presentation bridge in `src/frontend/Bridge/`).
2. **Domain Layer:** Pure PHP classes representing business rules, immutable Value Objects, Aggregate Roots, and Domain Exceptions under `src/backend/Apps/<App>/Domain/`. Zero dependencies on WordPress core functions or HTTP superglobals.
3. **Infrastructure Layer:** Concrete WordPress adapters implementing Domain interfaces under `src/backend/Apps/<App>/Infrastructure/` (e.g. Options API with explicit `autoload => false` performance policy).
4. **Application Layer:** CQRS-Lite Command and Query handlers, DTOs, Event Dispatcher, and Application Services (`SettingsApplicationService`, `DiagnosticsService`, `HelloWorldService`) orchestrating use cases.
5. **Presentation Layer & Strict REST Boundary:** Frontend presentation components and templates communicate with backend services exclusively over the WordPress REST API (`/ai-ready-wp/v1/*`). Server-side PHP integration hooks for menus, script enqueuing, and dynamic block/pattern scanning reside exclusively in `src/frontend/Bridge/`.
6. **Micro Dependency Injection:** Zero-dependency `Container` and `ServiceProviderRegistry` under `src/framework/Container/`. Never pull heavy third-party PHP framework containers (Symfony, Laravel) into standard WordPress plugins.

### Invariant 2: Mandatory Coding Standards & Static Analysis

1. **WordPress Coding Standards (WPCS):** Enforced via PHP_CodeSniffer with rulesets `WordPress-Core`, `WordPress-Extra`, and `WordPress-Docs`. Class filenames inside `src/` use modern PSR-4 PascalCase naming (`src/framework/Kernel/Plugin.php`), exempted from the legacy `class-*.php` rule.
2. **PHPStan Static Analysis:** Minimum Level 6 analysis with `szepeviktor/phpstan-wordpress` and official WordPress/WP-CLI stubs. Zero errors or uninspected baselines allowed.
3. **Frontend Quality:** JavaScript and TypeScript validated via `@wordpress/scripts` ESLint rules.
4. **Actionlint & Workflow Quality:** GitHub Actions workflows validated with SHA-pinned commit references and strict permission scopes.

### Invariant 3: Five-Tier Testing Pyramid

No feature is considered complete without accompanying automated tests:

1. **Tier 1 — Static Quality:** WPCS, PHPStan Level 6, ESLint, Stylelint, Markdownlint, and Actionlint.
2. **Tier 2 — PHPUnit Unit & Integration Tests:** In-memory unit tests in `tests/phpunit/unit/` (sub-millisecond execution) and WordPress integration tests in `tests/phpunit/integration/`.
3. **Tier 3 — Frontend Unit Tests:** Jest and `@testing-library/react` verifying React components and custom hooks in `tests/js/`.
4. **Tier 4 — Contract-First REST E2E:** Black-box HTTP validation via Bruno (`tests/bruno/`) using Application Password authentication.
5. **Tier 5 — Browser & Visual Regression:** Real Chromium end-to-end tests via Playwright (`tests/e2e/playwright/`) with visual screenshot comparisons.

### Invariant 4: WordPress Native Look and Feel (WPDS)

1. **WPDS Design Tokens:** Use native WordPress admin tokens (`var(--wp-admin-theme-color, #2271b1)`, `#1d2327`, `#f0f0f1`).
2. **Strict Heading Hierarchy:** PHP templates render the single primary `<h1>` on the screen. React components must never render `<h1>`; subheadings must be `<h2>` or `<h3>` inside `CardHeader`.
3. **Layout Primitives:** Form sections and settings panels use WPDS `Card`, `CardHeader`, `CardBody`, and `CardFooter`.
4. **Navigation:** Multi-section admin pages use vertical sidebar navigation with `@wordpress/icons` and clear active state indicators.

### Invariant 5: Atomic, Automated Release Lifecycle & Two-Pipeline CI/CD

1. Changing version numbers is strictly forbidden as a manual text edit.
2. All releases must be executed via `npm run update-version`, driven by `tools/versioning/increase-plugin-version.mjs`.
3. The script atomically updates `package.json`, `package-lock.json`, `composer.json`, plugin file headers, constants, `readme.txt`, and promotes staged `CHANGELOG.md` unreleased entries into the release milestone header.
4. CI/CD enforces the Two-Pipeline model (ADR-0010): CI evaluates the exact reusable release gate (`_release-readiness.yml`), validating package contracts and running WordPress Plugin Check. The manual release workflow never commits to `main`.

### Invariant 6: Durable Architectural Memory (ADR Governance)

1. Architectural decisions must be evaluated before planning or coding using `.cursor/rules/adr-evaluation.mdc`.
2. All durable architectural choices, trade-offs, and invariants must be captured in `docs/adr/` as immutable Architecture Decision Records under `docs/adr/`.
3. Accepted ADRs are binding on all subsequent development. Any departure from an accepted ADR requires drafting a new ADR that explicitly supersedes it.
4. Ephemeral phase plans (`docs/specifications/plans/`) must cite active governing ADRs and never substitute for architectural memory.

### Invariant 7: Code-Driven Generated OpenAPI 3.1 Specification

1. All REST endpoints declare parameter schemas, descriptions, and operations inside their respective `WP_REST_Controller` implementations (ADR-0011).
2. `docs/api/openapi.yaml` is generated deterministically via `wp ai-ready openapi generate`. Manual editing of the OpenAPI specification is strictly forbidden.
3. Zero drift is verified in CI and pre-commit checks via `wp ai-ready openapi check` and `npm run openapi:lint`.
