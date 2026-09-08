# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
