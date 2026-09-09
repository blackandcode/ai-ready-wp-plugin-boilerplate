# GitHub Actions CI/CD Architecture

This document details the configuration, job orchestration, multi-PHP testing matrix, and reusable workflows powering the continuous integration pipeline under `.github/workflows/`.

Governed by **ADR-0010: Two-Pipeline CI/CD and Release Readiness Architecture**.

---

## 1. Workflow Architecture & Partitioning

The GitHub Actions system is divided into reusable and trigger workflows:

| Workflow File | Name | Trigger | Purpose |
|:---|:---|:---|:---|
| `.github/workflows/_release-readiness.yml` | `Release Readiness` | `workflow_call` | Shared, reusable definition of "release ready". Runs linters, multi-PHP tests, asset compilation, `.distignore` packaging, contract validation, and official WordPress Plugin Check. |
| `.github/workflows/ci.yml` | `CI/CD — Release Readiness` | `push` / `pull_request` on `main` | Continuous integration pipeline invoking `_release-readiness.yml`. Retains candidate ZIP for 7 days. |
| `.github/workflows/release.yml` | `Release Plugin` | `workflow_dispatch` (manual) | Audited release pipeline on `main`. Verifies version consistency, invokes `_release-readiness.yml`, attests Sigstore provenance, and publishes immutable GitHub Release. |
| `.github/dependabot.yml` | Dependabot | Scheduled (weekly) | Maintains `github-actions` (with version tags), `npm`, and `composer` dependencies. |

---

## 2. The Reusable Release-Readiness Gate (`_release-readiness.yml`)

The reusable workflow executes eight coordinated stages:

```text
1. Lint & Static Analysis
   ├── PHPCS (WPCS)
   ├── PHPStan (Level 6+)
   ├── ESLint & Stylelint
   ├── Markdownlint
   └── Actionlint (version tagging check)
       │
       ▼
2. Multi-PHP Unit Testing Matrix
   ├── PHP 8.3 (Minimum supported version)
   └── PHP 8.5 (Forward compatibility boundary)
       │
       ▼
3. Production Asset Compilation (wp-scripts build)
       │
       ▼
4. Production Packaging (.distignore rules)
       │
       ▼
5. Package Contract Inspection & Validation (tools/release/validate-package.mjs)
       │
       ▼
6. Archive Extraction
       │
       ▼
7. Official WordPress Plugin Check (WordPress/plugin-check-action)
       │
       ▼
8. Rich GitHub Step Summary Generation
```

### 2.1 Multi-PHP Boundary Matrix

Testing executes across PHP 8.3 and PHP 8.5 to guarantee both minimum version compatibility and upcoming runtime compatibility:

- `php-version: ['8.3', '8.5']`
- Uses `shivammathur/setup-php` with `pcov` coverage extension.

### 2.2 WordPress Plugin Check on Production Archive

Unlike common implementations that run Plugin Check against the root Git repository (which falsely flags dev dependencies and build tools), this gate runs `WordPress/plugin-check-action` strictly against the **extracted production distribution package**, ensuring accurate real-world analysis.

---

## 3. Supply-Chain Hardening & Dependabot

1. **Semantic Version Tagging:** Every third-party action reference uses an official semantic version tag:

   ```yaml
   uses: actions/checkout@v4
   ```

2. **Dependabot Configuration (`.github/dependabot.yml`):**
   - Configured with `package-ecosystem: "github-actions"`.
   - Automatically opens pull requests to update action version tags.
3. **Least Privilege:**
   - Root permissions default to `contents: read`.
   - Elevated scopes (`attestations: write`, `id-token: write`) are only granted to specific release jobs.
