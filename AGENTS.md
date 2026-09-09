# Agent Instructions — AI-Ready WP Plugin Boilerplate

Before executing any phase or modification:

1. **Read Charter & Consult Active ADRs:** Consult `docs/framework/product-charter.md` and active records under `docs/adr/`. The product charter and accepted ADRs are the ultimate single source of truth for architectural boundaries, database choices, and design constraints.
2. **Consult Active Phase Plan & Evaluate ADR Gate:**
   - Run the ADR-worthiness gate (`.cursor/rules/adr-evaluation.mdc`). If an architectural fork or boundary is touched, author/update an ADR in `docs/adr/` before executing implementation code.
   - When working on an implementation phase, read the active plan under `docs/specifications/plans/` and review its specifications and execution instructions.
3. **Execute Skills & Route Deterministically:**
   - Run the WordPress router and project triage skills (`.cursor/skills/wp-project-triage/`).
   - Load domain-specific skills required for the task (`wp-rest-api`, `wp-admin-ui-ux`, `ddd-best-practices`, `oop-best-practices`, `design-patterns-best-practices`, `tdd-best-practices`, `refactoring-best-practices`, `bruno-test-writer`, `wp-architecture-decision-records`).
4. **Adhere to Clean Hexagonal/DDD Architecture:**
   - Keep Domain logic pure, immutable, and free from direct database/WordPress dependencies.
   - Use the Dependency Injection container (`Container`) and `ServiceProvider` contracts under `src/framework/Container/`.
   - Never write procedural hooks directly in the root plugin file; register all hooks in dedicated service providers.
5. **Enforce Five-Tier Testing Pyramid:**
   - Always write tests alongside features (TDD invariant-first).
   - Fast Unit Tests (`tests/phpunit/unit/`): Pure PHP, in-memory, sub-millisecond execution.
   - REST Contract Tests (`tests/bruno/`): Authored as Git-native `.bru` files using Application Passwords.
   - Frontend Unit Tests (`tests/js/`): Jest and React Testing Library.
   - Visual & Browser Tests (`tests/e2e/playwright/`): Real Chromium tests with screenshot diffing.
6. **Mandatory Local Quality Gate & Autonomous Self-Healing Loop:**
   - On every coding session that modifies repository files, run the local quality gate `npm run check` (or `npm run pre-commit`) enforcing full parity with GitHub Actions (`_release-readiness.yml`):
     - `npm run lint` (JS, CSS, Markdown, GitHub Actions workflows)
     - `npm run openapi:lint` (Redocly OpenAPI 3.1 validation)
     - `npm run build` (Frontend assets and blocks manifest compilation)
     - `npm run test` (Jest and Node test suites)
     - `vendor/bin/phpcs` (WordPress Coding Standards: WordPress-Core, WordPress-Extra, WordPress-Docs)
     - `vendor/bin/phpstan analyse` (PHPStan Level 6+ with `szepeviktor/phpstan-wordpress`)
     - `vendor/bin/phpunit` (PHPUnit test suite)
     - `npm run release:check -- --skip-branch-check --skip-tag-check` (Release consistency check)
     - `npm run release:package` (Package build & contract validation)
     - `npm run release:smoke` (Packaged plugin standalone PHP smoke test)
   - **Autonomous Self-Healing Loop:** If any check fails, the agent MUST NOT stop or ask the user to fix errors. Parse the output, repair code, types, or tests locally, and rerun until all 10 checks are 100% green. Follow `.cursor/rules/local-quality-gate.mdc`.
7. **Post-Phase Documentation, Unreleased Changelog & Release Lifecycle:**
   - **Mandatory Unreleased Changelog (100% Invariant):** At the end of every session that modifies files, use the `changelog` skill (`.cursor/skills/changelog/SKILL.md`) or `npm run changelog:add` to record concise, descriptive bullets under `## [Unreleased]` in `CHANGELOG.md`.
   - **Prompt-Aware Versioning:** Check the initial user prompt. If and only if the user explicitly requested a version bump (e.g. "bump version", "release v1.3.3", "finish phase with patch bump"), execute atomic version bump via `npm run update-version -- [patch|minor|major|X.Y.Z]` directly via CLI parameters (never edit `.env` for versioning). Otherwise, leave version bumping as a manual task for the developer.
   - Follow `.cursor/rules/post-phase-documentation.mdc`.
   - Record implementation audit log in `docs/implementation-logs/YYYY-MM-DD-phase-XX-*.md` when finalizing planned phases.
   - Ensure all durable architectural choices are recorded as accepted ADRs in `docs/adr/` and synchronized with `CHANGELOG.md`.
8. **Permanent Protection Invariants for Workspace Rules & In-Tree Skills:**
   - **Workspace Rules (`.cursor/rules/`):** Core workspace rules (`adr-evaluation.mdc`, `post-phase-documentation.mdc`, `changelog-unreleased.mdc`, `local-quality-gate.mdc`, `wp-admin-ui-ux.mdc`, `windows-coreutils-shell.mdc`, `plan-mode-feature-planning.mdc`) encode immutable architectural policies and workflows. Agents and automated scripts MUST NEVER delete, clear, or overwrite workspace rules.
   - **In-Tree Custom Skills (`.cursor/skills/`):** Custom skills developed in-tree (`versioning`, `changelog`, `wp-admin-ui-ux`) are protected from upstream overwriting or deletion. `tools/agent-skills/sync-agent-skills.mjs` enforces `PROTECTED_IN_TREE_SKILLS` to guarantee remote repository updates only manage external skills.
9. **Two-Pipeline CI/CD and Release Readiness Invariants (ADR-0010):**
   - **Continuous Release Readiness:** `main` must always remain releasable. Pull requests and pushes to `main` must pass the shared readiness gate (`_release-readiness.yml`).
   - **No Version Bumping in Release Workflows:** The manual GitHub release workflow (`plugin-release.yml`) MUST NEVER commit, push, or bump versions on `main`. Version synchronization occurs strictly prior to release via `npm run update-version`.
   - **Tested Artifact == Released Artifact:** The exact ZIP package tested and verified during the release gate must be the one published to GitHub Releases, never rebuilt from source.
   - **Package Contract Enforcement:** Run `npm run release:validate` to ensure distributable packages strictly include required runtime files (`{slug}/`, main PHP, `vendor/autoload.php`, `src/`, `build/`, `readme.txt`, `uninstall.php`) and exclude tests, tools, dotfiles, and dev configurations.
   - **Local CLI Parity:** Agents can reproduce CI and release gates locally using `npm run ci`, `npm run release:check`, `npm run release:build`, `npm run release:validate`, and `npm run lint:actions`. Consult `docs/devops/releasing-and-distribution.md`.

10. **Code-Driven Generated OpenAPI Invariants (ADR-0011):**
    - **Never Edit `docs/api/openapi.yaml` Manually:** Manual editing of the OpenAPI specification is strictly forbidden.
    - **Source of Truth in Controllers:** All route parameter schemas, operation IDs, summaries, and item schemas must be declared inside `WP_REST_Controller` subclasses in `src/backend/Apps/<App>/Rest/`.
    - **Regenerate & Verify Drift:** Regenerate using `npm run openapi:generate` (`wp ai-ready openapi generate`) and verify zero drift via `npm run openapi:check` and `npm run openapi:lint`.
