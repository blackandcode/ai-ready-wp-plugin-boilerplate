# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added CLI parameters (--bump, --target-version, -m, -d) and positional arguments to scripts/increase-plugin-version.mjs, completely decoupling versioning from .env
- Added convenient npm release scripts: npm run update-version:patch, npm run update-version:minor, and npm run update-version:major
- Authored changelog skill (.cursor/skills/changelog/SKILL.md) and deterministic CLI helper scripts/record-unreleased-change.mjs (npm run changelog:add)

### Changed

- Enforced prompt-aware versioning in AGENTS.md and post-phase-documentation.mdc, requiring explicit user prompt instructions before triggering version bumps
- Enacted mandatory 100% unreleased changelog recording rule (.cursor/rules/changelog-unreleased.mdc) and expanded test suite to 14 automated integration tests
- Hardened scripts/sync-agent-skills.mjs with PROTECTED_IN_TREE_SKILLS safeguard and post-sync integrity verification to protect in-tree skills and rules from deletion or remote overwrite

### Removed

- Removed obsolete docs/project-boilerplate directory and redundant duplicate assets

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
