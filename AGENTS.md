# Agent Instructions — AI-Ready WP Plugin Boilerplate

Before executing any phase or modification:

1. **Read Charter & Consult Active ADRs:** Consult `docs/general/product-charter.md` and active records under `docs/adr/`. The product charter and accepted ADRs are the ultimate single source of truth for architectural boundaries, database choices, and design constraints.
2. **Consult Active Phase Plan & Evaluate ADR Gate:**
   - Run the ADR-worthiness gate (`.cursor/rules/adr-evaluation.mdc`). If an architectural fork or boundary is touched, author/update an ADR in `docs/adr/` before executing implementation code.
   - When working on an implementation phase, read the active directory under `docs/plans/` and review its `master-prompt.md`.
3. **Execute Skills & Route Deterministically:**
   - Run the WordPress router and project triage skills (`.cursor/skills/wp-project-triage/`).
   - Load domain-specific skills required for the task (`wp-rest-api`, `wp-admin-ui-ux`, `ddd-best-practices`, `oop-best-practices`, `design-patterns-best-practices`, `tdd-best-practices`, `refactoring-best-practices`, `bruno-test-writer`, `wp-architecture-decision-records`).
4. **Adhere to Clean Hexagonal/DDD Architecture:**
   - Keep Domain logic pure, immutable, and free from direct database/WordPress dependencies.
   - Use the Dependency Injection container (`Container`) and `ServiceProvider` contracts under `src/Bootstrap/`.
   - Never write procedural hooks directly in the root plugin file; register all hooks in dedicated service providers.
5. **Enforce Five-Tier Testing Pyramid:**
   - Always write tests alongside features (TDD invariant-first).
   - Fast Unit Tests (`tests/phpunit/unit/`): Pure PHP, in-memory, sub-millisecond execution.
   - REST Contract Tests (`bruno/`): Authored as Git-native `.bru` files using Application Passwords.
   - Frontend Unit Tests (`tests/js/`): Jest and React Testing Library.
   - Visual & Browser Tests (`tests/e2e/playwright/`): Real Chromium tests with screenshot diffing.
6. **Mandatory WordPress Coding Standards (WPCS) & Static Typing:**
   - Run `composer lint` (enforcing `WordPress-Core`, `WordPress-Extra`, and `WordPress-Docs`).
   - Run `composer analyse` (PHPStan Level 6+ with `szepeviktor/phpstan-wordpress`).
7. **Post-Phase Documentation, Unreleased Changelog & Release Lifecycle:**
   - **Mandatory Unreleased Changelog (100% Invariant):** At the end of every session that modifies files, use the `changelog` skill (`.cursor/skills/changelog/SKILL.md`) or `npm run changelog:add` to record concise, descriptive bullets under `## [Unreleased]` in `CHANGELOG.md`.
   - **Prompt-Aware Versioning:** Check the initial user prompt. If and only if the user explicitly requested a version bump (e.g. "bump version", "release v1.1.0", "finish phase with patch bump"), execute atomic version bump via `npm run update-version -- [patch|minor|major|X.Y.Z]` directly via CLI parameters (never edit `.env` for versioning). Otherwise, leave version bumping as a manual task for the developer.
   - Follow `.cursor/rules/post-phase-documentation.mdc`.
   - Record implementation audit log in `docs/implementation-logs/YYYY-MM-DD-phase-XX-*.md` when finalizing planned phases.
   - Ensure all durable architectural choices are recorded as accepted ADRs in `docs/adr/` and synchronized with `CHANGELOG.md`.
8. **Permanent Protection Invariants for Workspace Rules & In-Tree Skills:**
   - **Workspace Rules (`.cursor/rules/`):** Core workspace rules (`adr-evaluation.mdc`, `post-phase-documentation.mdc`, `changelog-unreleased.mdc`, `wp-admin-ui-ux.mdc`, `windows-coreutils-shell.mdc`) encode immutable architectural policies and workflows. Agents and automated scripts MUST NEVER delete, clear, or overwrite workspace rules.
   - **In-Tree Custom Skills (`.cursor/skills/`):** Custom skills developed in-tree (`versioning`, `changelog`, `wp-admin-ui-ux`) are protected from upstream overwriting or deletion. `scripts/sync-agent-skills.mjs` enforces `PROTECTED_IN_TREE_SKILLS` to guarantee remote repository updates only manage external skills.
