# ADR-0006: Automated project scaffolding CLI

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** Developer Tooling & Automation Group
- **Informed:** All Contributors

---

## Context

When developers or AI coding agents clone this boilerplate to build a new plugin, they face an error-prone manual rebranding process:

1. Renaming PHP class namespaces across dozens of files.
2. Renaming WordPress constant prefixes (`AIRWP_`, `WPBP_`) and function prefixes.
3. Updating the root plugin filename, block names, REST namespaces, and Composer/npm package identifiers.
4. Ensuring that file renames, translations, and asset references remain intact without leaving broken strings or half-renamed identifiers.

Manual renaming invariably leads to missed tokens, fatal PHP errors, broken autoloader mappings, and frustrating debugging cycles.

## Decision

We build an **automated, idempotent, dynamic scaffolding CLI tool** located at `tools/scaffolding/scaffold-plugin.mjs` backed by the core engine in `tools/scaffolding/scaffold-engine.mjs`.

The scaffolding engine:

1. **Dynamically Discovers Existing Identifiers:** Automatically inspects the current repository state to extract the active PHP namespace, constant prefix, lowercase underscore prefix, lowercase hyphen prefix, PascalCase prefix, camelCase global variables, REST route namespace, block identifier, and Composer package name.
2. **Accepts Flexible CLI Options:** Allows developers or agents to provide a new `--name`, `--slug`, `--namespace`, `--prefix`, `--author`, `--description`, and `--composer-name`.
3. **Performs Comprehensive Dynamic Token Replacement:** Executes safe, ordered string replacements across all project files (PHP classes, templates, tests, block definitions, JavaScript bundles, documentation, and configuration files).
4. **Renames Physical Files & Directories:** Atomically renames root plugin files, block folders, and test directories to match the new slug and naming conventions.
5. **Provides Dry-Run Capabilities:** Supports `--dry-run` to preview all planned string replacements and file renames before committing changes to disk.

## Rationale

1. **Idempotence & Re-runnability:** Because the engine dynamically detects the *current* state of the project rather than assuming hardcoded boilerplate strings, the scaffolding tool can be run repeatedly at any point in the plugin's lifecycle without breaking.
2. **Instant Developer Onboarding:** A new production-ready plugin with completely custom branding can be created in a single CLI command in under 2 seconds.
3. **Automated Verification:** Comprehensive Node.js integration tests run against ephemeral temporary directory fixtures to guarantee replacement correctness.

## Consequences

### Positive

- One-line rebranding: `npm run scaffold -- --name "My Plugin" --slug "my-plugin" --namespace "Vendor\\MyPlugin" --prefix "MYPLUG_"`.
- Completely prevents orphaned boilerplate identifiers in production code.
- Fully tested and verified via automated test suites in CI.

### Negative & Trade-offs

- The scaffolding engine must be maintained whenever new architectural tokens or global variables are introduced to the boilerplate.

### Risks & Mitigations

- **Risk:** Incomplete token replacement if a developer introduces a new casing variation.
  **Mitigation:** `detectCurrentPlugin` derives all casing permutations (uppercase, lowercase underscore, lowercase hyphen, PascalCase, camelCase), and comprehensive integration tests in `tests/node/scaffolding/scaffold.test.mjs` enforce complete coverage.

## Non-Goals

- Generating remote Git repositories or configuring hosting platforms (handled by external Cursor skills or CI pipelines).
- Replacing standard package management tools (`composer install`, `npm install`).

## Architectural Constraints

- Scaffolding must preserve all underlying architectural invariants (Hexagonal architecture, PSR-11 container, REST contracts, and testing pyramid).
- The scaffolding engine must remain self-contained using Node.js built-ins (`node:fs`, `node:path`, `node:util`) with zero external npm runtime dependencies.

## Verification & Fitness Functions

- **Automated Scaffolding Test Suite:** `node --test tests/node/scaffolding/*.test.mjs` executes unit and integration tests against real fixtures, asserting complete token and file transformation.
- **Dry-Run Output Verification:** Running `npm run scaffold -- --dry-run` outputs detailed lists of files to modify without changing disk contents.

## Reconsider When

- A standard WordPress-official scaffolding CLI (such as `@wordpress/create-block`) is expanded to support full-stack Hexagonal DDD plugins with in-tree containers and testing pyramids.

## Implementation References

- CLI Entry Point: `tools/scaffolding/scaffold-plugin.mjs`
- Core Scaffolding Engine: `tools/scaffolding/scaffold-engine.mjs`
- Scaffolding Test Suite: `tests/node/scaffolding/scaffold.test.mjs`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md), [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md), [ADR-0003](0003-gutenberg-block-api-v3-standard.md), [ADR-0004](0004-contract-first-rest-api-specification.md), [ADR-0005](0005-wpds-admin-card-and-sidebar-architecture.md)
