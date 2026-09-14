# ADR-0015: Modular Scaffolding Pipeline, Repository History Reset, and Version Baseline

- **Status:** accepted
- **Date:** 2026-09-14
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** Developer Tooling Guild, Release Engineering, WordPress Architecture Stakeholders
- **Informed:** All Contributors
- **Amends:** [ADR-0006](0006-automated-project-scaffolding-cli.md)

---

## Context

When developers or AI coding agents clone this boilerplate to build a new custom plugin, running the project scaffolding tool (`npm run scaffold`) rebrands identifiers, namespaces, and constant prefixes. However, several critical repository lifecycle problems remained:

1. **Boilerplate History Leakage:** The rebranded plugin retained the entire historical `CHANGELOG.md` of the boilerplate (from v1.0.0 to v1.4.0 plus unreleased notes), all 14 boilerplate-internal Architecture Decision Records (`docs/adr/0002-*` through `docs/adr/0014-*`), and past phase implementation audit logs (`docs/implementation-logs/`).
2. **Version Inflation:** Rather than starting cleanly at version `1.0.0`, the newly scaffolded plugin remained pinned to the boilerplate's current version (e.g., `1.4.0`) across package manifests, root PHP headers, runtime constants, and block manifests.
3. **Monolithic Architecture Debt:** The original scaffolding engine (`tools/scaffolding/scaffold-engine.mjs`) was structured as a single 900-line monolithic script where project detection, casing derivations, token replacement dictionaries, recursive filesystem walking, transactional writing, and file renaming were tightly coupled. Adding new post-clone preparation steps (such as history resetting, sample app pruning, or environment configuration) increased cyclomatic complexity and hindered maintainability.

---

## Decision

We amend ADR-0006 by decomposing the scaffolding engine into an extensible **Pipeline Pattern** and introducing automated **History Cleanup** and **1.0.0 Version Baseline Reset** during scaffolding:

### 1. Modular Scaffolding Pipeline Architecture

We refactor `tools/scaffolding/` into discrete, single-responsibility modules coordinated by an extensible pipeline (`tools/scaffolding/lib/pipeline.mjs`):

- `detect.mjs`: Project identifier detection and casing derivation.
- `history-cleaner.mjs`: Purging boilerplate logs and resetting the changelog and ADR index.
- `version-resetter.mjs`: Synchronizing all project files to a clean version baseline (default: `1.0.0`).
- `replacements.mjs`: Building deterministic token transformation rules.
- `transformer.mjs`: Performing atomic filesystem scanning and text replacements.
- `renamer.mjs`: Managing file renames (main PHP file, translation catalogs).
- `manifest-sync.mjs`: Synchronizing `MANIFEST.md` entries with the cleaned repository structure.

### 2. Automated History Cleanup

By default, executing `npm run scaffold` cleans boilerplate historical records:

- **`CHANGELOG.md`:** Replaces boilerplate history with a clean Keep-a-Changelog baseline containing an empty `## [Unreleased]` section and a single `## [1.0.0]` release section noting `Initial release of <Target Plugin Name>.`
- **`readme.txt` Changelog:** Resets the `== Changelog ==` section to `= 1.0.0 =` with `* Initial release of <Target Plugin Name>.`
- **Architecture Decision Records (`docs/adr/`):** Prunes boilerplate-specific ADRs (`0002` through `0014+`) while preserving `ADR-0001` ("Record architecture decisions") as the durable foundational architectural seed. Resets `docs/adr/README.md` table to list solely `ADR-0001` so that `npm run adr:validate` passes with zero integrity warnings.
- **Implementation Logs (`docs/implementation-logs/`):** Purges past boilerplate phase audit logs, ensuring `docs/implementation-logs/.gitkeep` remains to track the directory in git.
- **Decision Logs:** Removes legacy `docs/decision-log.md` if present.

### 3. Automated Version Baseline Reset

By default, scaffolding resets all project files from the boilerplate release version to `1.0.0` (or `--target-version`):

- `package.json` and `package-lock.json` root version fields.
- `composer.json` version field (if present).
- Main plugin PHP header (`Version: 1.0.0`) and constant definition (`<PREFIX>VERSION`).
- Framework kernel constant `Plugin::VERSION = '1.0.0'`.
- Starter block definition `src/frontend/apps/hello-world/block.json`.
- `readme.txt` header (`Stable tag: 1.0.0`).

### 4. Opt-Out Flags and Dry-Run Parity

- Scaffolding provides `--no-clean-history` (or `--keep-history`) and `--no-reset-version` flags for cases where existing history or versions must be preserved.
- Full `--dry-run` simulation is supported across all pipeline steps, reporting all planned deletions, mutations, and renames without modifying disk state.

---

## Rationale

1. **Clean Distribution Slate:** New plugins built from the boilerplate should present an unpolluted, professional release baseline (`1.0.0`) and an accurate changelog starting at their own initial release.
2. **ADR-0001 Preservation:** Retaining `ADR-0001` preserves the established architectural decision practice in the downstream plugin, enabling new ADRs (`npm run adr:new`) to build seamlessly on top of an already validated directory structure.
3. **Pipeline Extensibility:** The modular pipeline decouples individual transformation phases, allowing future capabilities (e.g. optional app pruning, git initialization, or CI customization) to be added as standalone pipeline steps without modifying core file transformation logic.

---

## Consequences

### Positive

- Cloned plugins start immediately with a clean 1.0.0 release posture and unpolluted changelog.
- Boilerplate-internal ADRs and implementation logs are completely cleared, preventing agent confusion and hallucinations.
- `npm run adr:validate` passes immediately out-of-the-box on newly scaffolded repositories.
- Core scaffolding logic is organized into clean, unit-testable modules.

### Negative & Trade-offs

- Downstream developers lose access to boilerplate architectural rationale files locally once scaffolded (mitigated because they remain available in the upstream boilerplate repository).

### Risks & Mitigations

- **Risk:** Inadvertent deletion of non-boilerplate ADRs if scaffolding is run after user ADRs were added.
  **Mitigation:** Scaffolding explicitly targets boilerplate records; users can pass `--keep-history` / `--no-clean-history` to preserve existing records.
- **Risk:** Failure mid-pipeline leaving half-transformed files.
  **Mitigation:** The pipeline enforces atomic staging and reverses file mutations if an unexpected error occurs during transformation.

---

## Non-Goals

- Replacing Git repository initialization (`git init`) or managing remote Git remotes.
- Overwriting or resetting user-created custom business entities or app code outside the boilerplate starter files.

---

## Architectural Constraints

- The entire scaffolding pipeline must remain zero-dependency, using only Node.js standard built-ins (`node:fs`, `node:path`, `node:util`).
- `ADR-0001` must always be preserved and validated by `tools/scaffolding/lib/history-cleaner.mjs`.
- All steps must honor `--dry-run` and report planned changes without side effects.
- The entry point `tools/scaffolding/scaffold-engine.mjs` must maintain backwards-compatible exported signatures (`scaffoldPlugin`, `detectCurrentPlugin`, `slugify`, `toPascalCase`, `toCamelCase`).

---

## Verification & Fitness Functions

- **Automated Scaffolding Test Suite:** `npm run test:scaffold` verifies full pipeline execution, history cleaning, version reset, and dry-run safety.
- **ADR Referential Validation:** `npm run adr:validate` must succeed on both the boilerplate itself and any freshly scaffolded test fixture.
- **Release Verification Parity:** Running `npm run release:check` after scaffolding and version reset verifies complete version synchronization.

---

## Reconsider When

- The boilerplate adopts an external template management engine or official WordPress Core CLI that natively supports interactive repository resets.

---

## Implementation References

- CLI Entry Point: `tools/scaffolding/scaffold-plugin.mjs`
- Engine Facade: `tools/scaffolding/scaffold-engine.mjs`
- Modular Pipeline: `tools/scaffolding/lib/pipeline.mjs`
- History Cleaner: `tools/scaffolding/lib/history-cleaner.mjs`
- Version Resetter: `tools/scaffolding/lib/version-resetter.mjs`
- Scaffolding Test Suites: `tests/node/scaffolding/`

---

## Related Decisions

- **Amends:** [ADR-0006](0006-automated-project-scaffolding-cli.md)
- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md), [ADR-0010](0010-two-pipeline-ci-cd-and-release-readiness-architecture.md), [ADR-0014](0014-boilerplate-starter-release-distribution-architecture.md)
