# ADR-0014: Boilerplate Starter Release Distribution Architecture

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** DevOps Guild, Developer Experience (DX) Team, WordPress Plugin Architects
- **Informed:** All Contributors
- **Extends:** [ADR-0010](0010-two-pipeline-ci-cd-and-release-readiness-architecture.md)

---

## Context

The repository serves two distinct audiences with fundamentally conflicting packaging requirements:

1. **Production Plugin Consumers (Live Sites & Plugin Directory):**
   - Need a lightweight, leak-free runtime archive ready for production deployment or submission to WordPress.org.
   - Must strictly exclude developer sources, tools, tests, markdown files, AI-agent configs, and uncompiled TypeScript assets (enforced by ADR-0010 and ADR-0013 via `plugin-release.yml` and `tools/release/build-package.mjs`).

2. **Developer Onboarding & Standalone Tooling Consumers (Template Starter Users):**
   - Developers adopting this boilerplate want a complete starting workspace with all agent skills, rules, documentation, developer CLI tools, tests, and source files intact.
   - Requiring developers to use `git clone` can be a high-friction barrier for beginners or non-git workflows.
   - Future tooling (such as an `npx create-ai-ready-plugin` installer CLI) requires a downloadable template archive from GitHub Releases that can be extracted and scaffolded without depending on Git commands.
   - However, downloading raw repository ZIPs from GitHub lacks pre-compiled frontend assets and Composer autoloaders, requiring multi-step local environment bootstrapping before the plugin can even be activated in WordPress.
   - Conversely, committing or bundling `node_modules/` (over 2GB and platform-dependent binaries) or upstream `.git/` history into distribution archives is unacceptable.

---

## Decision

We establish a formal **Boilerplate Starter Release** distribution pipeline decoupled from the Production Plugin Release:

### 1. Dual Release Products and Namespaced Tags

We maintain two distinct, manually dispatched release pipelines:

| Dimension | Production Plugin Release | Boilerplate Starter Release |
|:---|:---|:---|
| **Workflow** | `.github/workflows/plugin-release.yml` | `.github/workflows/boilerplate-release.yml` |
| **Release Tag** | `vX.Y.Z` (e.g. `v1.3.2`) | `boilerplate-vX.Y.Z` (e.g. `boilerplate-v1.3.2`) |
| **Archive Name** | `{slug}-{version}.zip` | `{slug}-starter-{version}.zip` |
| **Release Title** | `v{version}` | `AI-Ready WP Plugin Boilerplate Starter v{version}` |
| **Primary Scope** | Live WordPress sites / WP.org | Developers, Starter Template, `npx` installer |
| **Composer Vendor** | Pruned runtime-only (`vendor/`) | Production runtime autoloader (`vendor/`) |
| **Frontend Assets** | Compiled runtime assets only | Pre-compiled assets + full source code |
| **Developer Tools** | Excluded (`src/development/`, etc.) | Fully included (`src/development/`, `tools/`, `docs/`, `tests/`) |

### 2. Boilerplate Starter Package Composition Invariants

The Boilerplate Starter archive (`dist/<slug>-starter-<version>.zip`) is assembled via an isolated staging builder (`tools/release/build-boilerplate-package.mjs`) adhering to the following rules:

1. **Top-Level Root Folder:** All contents are contained inside `{plugin-slug}/` so the ZIP can be directly uploaded and activated as a WordPress plugin.
2. **Instant Plugin Bootability:** The archive includes pre-compiled production assets in `build/` (settings UI, blocks, manifest) and a production-optimized Composer autoloader (`vendor/autoload.php`). This ensures that if a user installs the ZIP directly in WordPress, the plugin boots immediately without crashing.
3. **Complete Developer Environment:** The archive includes all development files:
   - AI agent guidance: `.cursor/`, `AGENTS.md`, `MANIFEST.md`
   - Architecture & documentation: `docs/`, `CHANGELOG.md`, `README.md`
   - Complete source code: `src/framework/`, `src/backend/`, `src/frontend/`, `src/development/`
   - Toolchain & tests: `tools/`, `tests/`, `blueprint.json`, `redocly.yaml`, `wp-cli.yml`
   - Package configurations: `package.json`, `package-lock.json`, `composer.json`, `composer.lock`, `tsconfig.json`, `webpack.config.js`, `phpcs.xml.dist`, `phpstan.neon.dist`, `phpunit.xml.dist`
4. **Strict Exclusions:**
   - **`node_modules/`:** Strictly excluded to maintain reasonable archive sizes (~8MB compressed vs >500MB) and avoid shipping platform-specific binaries. Developers install node dependencies locally via `npm install`.
   - **`.git/`:** Strictly excluded so that downstream developers or standalone installer CLIs can initialize fresh git repositories without upstream git history.
   - **Secrets & Temporary Artifacts:** `.env`, `.env.*` (preserving `.env.example`), `dist/`, `.phpunit.cache/`, test reports, and OS files (`.DS_Store`, `Thumbs.db`).

---

## Rationale

- **Decoupled Evolution:** Separating the starter release workflow and tag namespacing (`boilerplate-vX.Y.Z`) from plugin releases (`vX.Y.Z`) ensures zero collision with the immutable production plugin releases, while maintaining Git release history for both.
- **Enabling Zero-Git Standalone Installers:** A standalone installer (such as `npx create-ai-ready-plugin`) can fetch the latest GitHub Release asset `ai-ready-wp-plugin-boilerplate-starter-*.zip`, extract it to the target directory, execute `npm run scaffold`, and hand off a fully pre-compiled project to the developer without requiring Git or network cloning.
- **Fail-Safe WordPress Testing:** Because `build/` assets and `vendor/autoload.php` are pre-compiled and bundled, testers and evaluators can drop the starter zip directly into a standard WordPress `/wp-content/plugins/` directory and immediately see the plugin operational.

---

## Consequences

### Positive

- Enables one-click starter ZIP downloads for non-git developers.
- Provides a stable release asset endpoint for future CLI-based project scaffolding tools (`npx`).
- Starter package works out-of-the-box in WordPress without requiring `npm run build` or `composer install` prior to testing.
- Eliminates risk of leaking multi-gigabyte `node_modules/` or upstream git histories.
- Clean separation between "Plugin Production Artifact" and "Developer Starter Template".

### Negative & Trade-offs

- Two separate manual release workflows must be maintained (`plugin-release.yml` and `boilerplate-release.yml`).
- Starter releases require running both asset compilation and Composer autoloader generation in isolated staging.

### Risks & Mitigations

- **Risk:** Developers might assume `composer require-dev` packages are already installed because `vendor/autoload.php` is present.
  **Mitigation:** `README.md` and pre-flight checks clearly state that running `npm install && composer install` is the standard quick-start step for active development to obtain test runners (`phpunit`, `phpstan`).
- **Risk:** Unintentional inclusion of local `.env` secrets or `.git` directory in the starter package.
  **Mitigation:** Dedicated contract validator (`tools/release/validate-boilerplate-package.mjs`) checks and fails the build if `.git/`, `.env`, or `node_modules/` are detected.

---

## Non-Goals

- Distributing pre-installed `node_modules/` inside the starter release.
- Automating git repository initialization inside the ZIP archive.
- Merging the starter template release with the WordPress.org plugin directory submission pipeline.

---

## Architectural Constraints

1. **Dedicated Tag Format:** Boilerplate starter releases must strictly use the git tag pattern `boilerplate-v<X.Y.Z>`. The standard `v<X.Y.Z>` tag remains reserved for production plugin releases.
2. **Top-Level Root Prefix:** Every file in the boilerplate starter archive must reside under the `{plugin-slug}/` directory prefix.
3. **No Working Tree Mutation:** Assembling the starter package must take place in an isolated staging folder (`dist/.staging-boilerplate/<slug>/`), leaving the source workspace untouched.
4. **Mandatory Runtime + Developer Parity:** The starter archive must satisfy both runtime bootability (`vendor/autoload.php`, `build/`) and developer completeness (`package.json`, `composer.json`, `.cursor/`, `src/development/`, `tests/`, `tools/`).
5. **Strict Forbidden Artifacts:** Starter archives must never contain `node_modules/`, `.git/`, `.env`, or test report caches.

---

## Verification & Fitness Functions

- **Boilerplate Package Builder:** `npm run boilerplate:build`
- **Boilerplate Contract Validator:** `npm run boilerplate:validate`
- **Automated Node.js Test Suite:** `node --test tests/node/release/boilerplate-package.test.mjs`
- **Workflow Static Linting:** `npm run lint:actions`
- **ADR Structural Integrity:** `npm run adr:validate -- --strict`
- **Quality Gate:** Full pass under `npm run check`.

---

## Reconsider When

- Node.js or npm introduces standard zero-install bundled package mechanisms that replace uncompressed `node_modules/`.
- GitHub Releases introduces native template-repository release distribution artifacts.
