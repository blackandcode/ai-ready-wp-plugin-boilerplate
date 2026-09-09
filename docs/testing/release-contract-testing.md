# Release Contract Testing (`tests/node/release/`)

This document details automated release packaging and contract testing under `tests/node/release/`, governed by **ADR-0010: Two-Pipeline CI/CD and Release Readiness Architecture**.

---

## 1. Architectural Purpose

To ensure that the released distribution package is production-ready, free of development leaks, and compliant with WordPress packaging rules, the boilerplate includes a dedicated Node.js release test suite.

This suite executes during continuous integration and local pre-release gates, asserting that:

1. `.distignore` filtering accurately excludes developer tooling and test files.
2. Built ZIP archives adhere to the distribution package contract.
3. Version parity validation detects discrepancies across files.
4. Release notes are cleanly extracted from `CHANGELOG.md`.

---

## 2. Test Suite Overview

| Test File | Target Module | What It Verifies |
|:---|:---|:---|
| `distignore.test.mjs` | `tools/release/lib/distignore.mjs` | Parses `.distignore` and asserts that `.git`, `.github`, `docs/`, `tests/`, and dotfiles are ignored while production source files are included. |
| `zip-utils.test.mjs` | `tools/release/lib/zip-utils.mjs` | Tests pure Node.js PKZIP creation, file extraction, directory traversal guards, and file listing without external dependencies. |
| `validate-package.test.mjs` | `tools/release/validate-package.mjs` | Asserts that mandatory production files (`plugin.php`, `readme.txt`, `vendor/autoload.php`, `build/`) exist in the ZIP and forbidden test/tool files are absent. |
| `validate-release.test.mjs` | `tools/release/validate-release.mjs` | Verifies version synchronization checks, branch protection checks (`main`), and git tag matching. |
| `extract-release-notes.test.mjs` | `tools/release/extract-release-notes.mjs` | Verifies extraction of Markdown release bullet points for a specific version from `CHANGELOG.md`. |
| `build-package.test.mjs` | `tools/release/build-package.mjs` | End-to-end integration test creating a temporary package, archiving, and validating the contract. |

---

## 3. Execution Commands

```bash
# Run all release contract tests
npm run test:release

# Inspect distribution package contract locally
npm run release:validate

# Verify release readiness for current version
npm run release:check
```

---

## 4. Coding Agent Rules

1. **Keep In-Tree Release Parity:** Any change to release workflows in `.github/workflows/` must be mirrored and tested in `tools/release/` and `tests/node/release/`.
2. **Never Allow Dev Tool Leaks:** If a new developer tool or configuration file is added to the repository root, ensure it is added to `.distignore` and asserted in `tests/node/release/distignore.test.mjs`.
