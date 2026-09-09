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
- **Minimum Supported WordPress Version:** `7.0`
- **Minimum Supported PHP Version:** `8.3`
- **License:** GPL-2.0-or-later

---

## 2. Core Architectural Invariants

### Invariant 1: Clean Hexagonal Architecture & Zero Framework Lock-In

1. **Domain Layer:** Pure PHP classes representing business rules, immutable Value Objects, Aggregate Roots, and Domain Exceptions. Zero dependencies on WordPress core functions (`get_posts`, `$wpdb`) or HTTP superglobals.
2. **Infrastructure Layer:** Concrete WordPress adapters implementing Domain interfaces (Custom Post Types, Post Meta, Options API with explicit `autoload => false` performance policy, Transient caching).
3. **Application Layer:** CQRS-Lite Command and Query handlers, DTOs, Event Dispatcher, and Application Services (`SettingsApplicationService`, `DiagnosticsService`) orchestrating use cases.
4. **Presentation Layer:** Multi-channel presentation adapters: REST Controllers extending `WP_REST_Controller`, custom WP-CLI commands (`wp ai-ready settings-get/update`, `doctor`), official WordPress Abilities API integration for autonomous AI agents, and React 18 admin applications using `@wordpress/components`.
5. **Micro Dependency Injection:** The backend uses an in-tree, zero-dependency `Container` and `ServiceProviderRegistry` under `src/Bootstrap/`. Never pull heavy third-party PHP framework containers (Symfony, Laravel) into standard WordPress plugins.

### Invariant 2: Mandatory Coding Standards & Static Analysis

1. **WordPress Coding Standards (WPCS):** Enforced via PHP_CodeSniffer with rulesets `WordPress-Core`, `WordPress-Extra`, and `WordPress-Docs`. Class filenames inside `src/` use modern PSR-4 PascalCase naming (`src/Bootstrap/Plugin.php`), exempted from the legacy `class-*.php` rule.
2. **PHPStan Static Analysis:** Minimum Level 6 analysis with `szepeviktor/phpstan-wordpress` and official WordPress/WP-CLI stubs. Zero errors or uninspected baselines allowed.
3. **Frontend Quality:** JavaScript and TypeScript validated via `@wordpress/scripts` ESLint rules.

### Invariant 3: Five-Tier Testing Pyramid

No feature is considered complete without accompanying automated tests:

1. **Tier 1 — Static Quality:** WPCS, PHPStan Level 6, ESLint, Stylelint, Markdownlint.
2. **Tier 2 — PHPUnit Unit & Integration Tests:** In-memory unit tests in `tests/phpunit/unit/` (sub-millisecond execution) and WordPress integration tests in `tests/phpunit/integration/`.
3. **Tier 3 — Frontend Unit Tests:** Jest and `@testing-library/react` verifying React components and custom hooks in `tests/js/`.
4. **Tier 4 — Contract-First REST E2E:** Black-box HTTP validation via Bruno (`bruno/`) using Application Password authentication.
5. **Tier 5 — Browser & Visual Regression:** Real Chromium end-to-end tests via Playwright (`tests/e2e/playwright/`) with visual screenshot comparisons.

### Invariant 4: WordPress Native Look and Feel (WPDS)

1. **WPDS Design Tokens:** Use native WordPress admin tokens (`var(--wp-admin-theme-color, #2271b1)`, `#1d2327`, `#f0f0f1`).
2. **Strict Heading Hierarchy:** PHP templates render the single primary `<h1>` on the screen. React components must never render `<h1>`; subheadings must be `<h2>` or `<h3>` inside `CardHeader`.
3. **Layout Primitives:** Form sections and settings panels use WPDS `Card`, `CardHeader`, `CardBody`, and `CardFooter`.
4. **Navigation:** Multi-section admin pages use vertical sidebar navigation with `@wordpress/icons` and clear active state indicators.

### Invariant 5: Atomic, Automated Release Lifecycle

1. Changing version numbers is strictly forbidden as a manual text edit.
2. All releases must be executed via `npm run update-version`, driven by `scripts/increase-plugin-version.mjs`.
3. The script atomically updates `package.json`, `package-lock.json`, `composer.json`, plugin file headers, constants, `readme.txt`, and promotes staged `CHANGELOG.md` unreleased entries into the release milestone header.

### Invariant 6: Durable Architectural Memory (ADR Governance)

1. Architectural decisions must be evaluated before planning or coding using `.cursor/rules/adr-evaluation.mdc`.
2. All durable architectural choices, trade-offs, and invariants must be captured in `docs/adr/` as immutable Architecture Decision Records under `docs/adr/`.
3. Accepted ADRs are binding on all subsequent development. Any departure from an accepted ADR requires drafting a new ADR that explicitly supersedes it.
4. Ephemeral phase plans (`docs/plans/`) must cite active governing ADRs and never substitute for architectural memory.
