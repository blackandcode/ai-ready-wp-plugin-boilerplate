# ADR-0010: Two-Pipeline CI/CD and Release Readiness Architecture

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Development Team & AI Coding Agents
- **Consulted:** Architecture Stakeholders, Security & DevOps Engineers
- **Informed:** All Contributors

---

## Context and Problem Statement

WordPress plugin development frequently suffers from release drift, brittle distribution archives, supply-chain vulnerabilities, and divergent verification logic between daily continuous integration (CI) and release packaging. Common antipatterns include:

1. Rebuilding release archives in separate workflows from what was tested ("tested source ≈ released artifact" instead of "tested artifact == released artifact").
2. Having release workflows bump versions, commit back to `main`, and bypass branch protections or trigger cascading builds.
3. Running WordPress Plugin Check and static analysis on raw git checkouts containing dev dependencies, configuration files, and uncompiled assets rather than the actual distributable archive.
4. Using mutable third-party GitHub Action tags (`@v4`) and bloated GitHub token permissions that expose the supply chain.
5. Lacking local CLI commands that mirror CI and release operations, creating opaque CI lock-in for human developers and AI coding agents.

This boilerplate requires a robust, reproducible, and secure CI/CD and release architecture that guarantees `main` is always releasable while keeping release publishing an explicit, human-controlled action.

## Decision Drivers

1. **Shared Definition of "Release Ready":** CI and Release workflows must share an identical, deterministic release-readiness verification gate to eliminate pipeline drift.
2. **Tested Artifact is the Released Artifact:** The exact ZIP package built and validated in CI/CD must be the one published to releases, eliminating rebuild anomalies.
3. **Decoupled Versioning & Clean Branch Protection:** The release workflow must never modify git history or commit version bumps to `main`. Version synchronization occurs prior to release via `npm run update-version`.
4. **Package Contract Enforcement:** The generated distribution ZIP must be structurally verified against an explicit package contract (mandatory files, forbidden dev/test files) before release.
5. **Real-World Plugin Check:** Official WordPress Plugin Check (`WordPress/plugin-check-action`) must analyze the extracted production distribution package.
6. **Supply Chain Hardening:** Immutable GitHub Releases, Sigstore build provenance attestations (`actions/attest-build-provenance`), semantic version tag action referencing, Dependabot automation, and least-privilege token permissions.
7. **Local CLI Parity:** Developers and AI agents must be able to run identical build, validation, and release-check steps locally without invoking GitHub Actions.

## Considered Options

### Option 1: Two-Pipeline Model with Reusable Shared Release Readiness (`_release-readiness.yml`), Manual Release Dispatch, Local Tooling Parity, and Artifact Attestations (Chosen)

A modular GitHub Actions architecture where:

- Pipeline 1 (`ci.yml`): Runs on every pull request to `main` and push to `main`, invoking a reusable workflow (`_release-readiness.yml`). It lints, runs tests across PHP 8.3 and 8.5, compiles assets, builds the production candidate ZIP in an isolated staging environment via an explicit allowlist, validates the ZIP against a strict package contract, executes a standalone packaged plugin PHP smoke test, runs WordPress Plugin Check on the extracted ZIP, and generates a rich `$GITHUB_STEP_SUMMARY`.
- Pipeline 2 (`plugin-release.yml`): Manually triggered via `workflow_dispatch` on `main` (named "Plugin Production Release"). It accepts `version` and optional `dry_run` parameters. It validates version consistency across `package.json`, main plugin file, `AIRWP_VERSION`, `Plugin::VERSION`, block metadata, `readme.txt`, and `CHANGELOG.md`, runs the exact same `_release-readiness.yml` gate, and when `dry_run` is false, signs the artifact with Sigstore provenance attestation, drafts the release, uploads the ZIP + SHA256 + `.files.json` + changelog notes, tags `vX.Y.Z`, and publishes an immutable GitHub Release. When `dry_run` is true, it verifies all gates without tagging or publishing.
- In-tree CLI tooling (`tools/release/`) provides deterministic local equivalents: `npm run release:build`, `npm run release:validate`, `npm run release:check`, and `npm run release:notes`.

- **Good, because:** Zero drift between CI and release verification.
- **Good, because:** The released ZIP is identical to the tested ZIP.
- **Good, because:** `main` branch protections remain uncompromised; release workflow performs zero git mutations.
- **Good, because:** Automated package-content contract detects leaked dotfiles, test files, or missing vendor autoloaders before release.
- **Good, because:** Generates cryptographically verifiable Sigstore provenance attestations.
- **Good, because:** Full local CLI parity allows AI agents and developers to debug release gates offline.
- **Bad, because:** Requires maintaining reusable workflow syntax and local packaging scripts.

### Option 2: Monolithic Release Pipeline Triggered Automatically by Git Tag Pushes (`v*`)

Developers push git tags (`git push origin v1.3.2`), which triggers a standalone release workflow that builds the ZIP and publishes the release.

- **Good, because:** Familiar traditional open-source workflow.
- **Bad, because:** Fails the "main is always releasable" requirement; tags can be created on feature branches or outdated commits.
- **Bad, because:** Does not enforce that CI passed prior to tag creation.
- **Bad, because:** Prone to duplicate CI runs, missing attestations, and drift between CI checks and release checks.

### Option 3: External All-in-One Action (e.g. `10up/action-wordpress-plugin-build-zip`) Without In-Tree Contract

Relying entirely on a third-party GitHub Action to assemble the zip and upload to GitHub Releases.

- **Good, because:** Fewer workflow lines in the repository.
- **Bad, because:** Breaks local CLI parity; developers and AI agents cannot locally validate the distribution archive contract.
- **Bad, because:** Harder to pin and audit supply-chain security.
- **Bad, because:** Tightly couples the boilerplate's packaging rules to external workflow logic.

## Decision Outcome

- **Chosen Option:** Option 1: Two-Pipeline Model with Reusable Shared Release Readiness (`_release-readiness.yml`), Manual Release Dispatch, Local Tooling Parity, and Artifact Attestations.
- **Rationale:** Option 1 satisfies all security, verification, and AI-agent operability requirements. It cleanly decouples version preparation from release distribution, guarantees that the artifact released is the exact artifact tested, and enforces strict package boundary validation.

## Consequences

### Positive

- Unified release-readiness definition across PRs, pushes to `main`, and official releases.
- Total traceability: every release artifact contains SHA256 checksums and Sigstore-backed build provenance.
- Clean separation of concerns: version bumping remains deterministic in source (`npm run update-version`) while release publishing remains an audited human dispatch.
- Official WordPress Plugin Check runs on the actual compiled and pruned distribution archive.
- Dependabot monitors SHA-pinned actions, Composer dependencies, and npm packages.

### Negative & Trade-offs

- Manual release dispatch requires a human trigger in GitHub Actions UI or via `gh workflow run`.
- Reusable workflows require GitHub Actions runner infrastructure to execute full multi-job matrices.

### Risks & Mitigations

- **Risk:** Vendor directory containing dev dependencies or missing production autoloader.
  **Mitigation:** `build-package.mjs` executes `composer install --no-dev --prefer-dist --optimize-autoloader` in an isolated staging folder, fails hard if Composer errors, verifies that no package in `require-dev` is present in `vendor/`, and validates `vendor/autoload.php` is present while `vendor/bin/` is absent.
- **Risk:** Version mismatch across plugin files during release dispatch.
  **Mitigation:** `validate-release.mjs` strictly verifies that the requested release version matches `package.json`, plugin header `Version:`, `AIRWP_VERSION` constant, `Plugin::VERSION` constant, `block.json` version, `readme.txt` `Stable tag:`, WordPress/PHP baselines, and `CHANGELOG.md` entry.

## Non-Goals

- Direct automated deployment to the WordPress.org SVN plugin repository (reserved for a dedicated, optional downstream action).
- Automated version incrementing or git committing inside GitHub Actions.
- Testing every intermediate PHP minor version (PHP 8.4) on every pull request when the boundary matrix (8.3 and 8.5) covers current compatibility requirements.
- Releasing or tagging the boilerplate template repository itself (the packaging pipeline is strictly scoped to the production plugin product).

## Architectural Constraints

1. **Reusable Release-Readiness Gate:** All quality, linting, test, packaging, smoke test, and Plugin Check steps must reside in `.github/workflows/_release-readiness.yml` (`workflow_call`). Workflows must not define separate release criteria.
2. **Read-Only Release Workflow on `main`:** The release workflow (`.github/workflows/plugin-release.yml`) must only execute against `refs/heads/main` and must never commit, push, or modify files in the repository. It supports an optional `dry_run` flag to execute all validation steps without tagging or releasing.
3. **Artifact Parity:** The release job must download and publish the exact artifact generated by `_release-readiness.yml`, never rebuilding the ZIP.
4. **Package Content Contract:** Every distributable archive must be validated by `tools/release/validate-package.mjs`. It must conform to the top-level allowlist (root plugin directory `{slug}/`, main PHP file, `src/` runtime code, `build/` compiled assets, `vendor/autoload.php`, `readme.txt`, and `uninstall.php`), and must not contain tests, tools, dotfiles, node_modules, development subsystems (`src/development/`), uncompiled TypeScript sources, or development configurations.
5. **Version-Tagged Action Dependencies:** All external GitHub Actions in `.github/workflows/` must reference official semantic version tags (e.g. `actions/checkout@v4`).
6. **Least-Privilege Security:** Default workflow permissions must be `contents: read`. Elevated scopes (`contents: write`, `attestations: write`, `id-token: write`) are restricted exclusively to the publish job in `plugin-release.yml`.
7. **Distribution Exclusion Policy:** `.distignore` must maintain explicit exclusion of development tools, documentation, tests, and configuration files, while keeping runtime `vendor/` and `src/`.

## Verification & Fitness Functions

- **Package Contract Validator:** `npm run release:validate`
- **Release Pre-Flight Checker:** `npm run release:check -- --version <X.Y.Z>`
- **Distribution Package Builder:** `npm run release:build`
- **Release Notes Extractor:** `npm run release:notes -- --version <X.Y.Z>`
- **ADR Structural Integrity:** `npm run adr:validate -- --strict`
- **Pass Threshold:** All scripts exit with code `0`.

## Reconsider When

- WordPress.org SVN release deployment is integrated into the official boilerplate workflow.
- GitHub Actions introduces native first-class release packaging primitives that supersede reusable workflows.
- WordPress core officially mandates a different packaging layout or removes `readme.txt` requirements.

## Implementation References

- **Shared Readiness Workflow:** `.github/workflows/_release-readiness.yml`
- **CI Pipeline:** `.github/workflows/ci.yml`
- **Release Pipeline:** `.github/workflows/plugin-release.yml`
- **Package Contract Validator:** `tools/release/validate-package.mjs`
- **Release Pre-Flight Checker:** `tools/release/validate-release.mjs`
- **Package Builder:** `tools/release/build-package.mjs`
- **Release Documentation:** `docs/devops/releasing-and-distribution.md`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:**
  - [ADR-0001](0001-record-architecture-decisions.md) — Record architecture decisions
  - [ADR-0006](0006-automated-project-scaffolding-cli.md) — Automated project scaffolding CLI
  - [ADR-0007](0007-hexagonal-domain-reorganization-and-skills-integration.md) — Hexagonal domain reorganization and skills integration
