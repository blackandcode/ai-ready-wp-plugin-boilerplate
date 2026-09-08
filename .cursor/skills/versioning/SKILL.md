---
name: versioning
description: "Automatically calculate and synchronize plugin version increments across project files, package metadata, WordPress headers, constants, and changelog using scripts/increase-plugin-version.mjs."
compatibility: "Requires Node.js 24.16.0+, npm 11+, and optional PHP CLI for version_compare()."
---

# Versioning Skill

## When to Use

Trigger this skill whenever:
- The user's initial prompt explicitly requests a version bump or release (e.g. "bump version", "release v1.1.0", "finish phase with patch bump").
- A developer manually triggers an atomic plugin version increment.
- Synchronizing version numbers across the WordPress main plugin header, PHP constants, package manifests (`package.json`, `package-lock.json`, `composer.json`), `readme.txt`, docs, and `CHANGELOG.md`.

*Note:* If the user did **not** explicitly request a version bump, do NOT run version increments automatically; instead, stage changes in `CHANGELOG.md` under `## [Unreleased]` using the `changelog` skill.

---

## Execution Procedures

### 1. Determine Target Version or Bump Type

Inspect the current version in `package.json` and select the appropriate bump:
- **Patch bump (`patch`)** (e.g. `1.0.0` → `1.0.1`): Maintenance fixes, refactoring, bug fixes, or minor iteration.
- **Minor bump (`minor`)** (e.g. `1.0.0` → `1.1.0`): Completed standard implementation phase, major feature addition, or new endpoints/blocks.
- **Major bump (`major`)** (e.g. `1.x.x` → `2.0.0`): Breaking architectural change, increased minimum PHP/WP requirements, or foundational product baseline.

### 2. Run Dry Run Verification

Inspect planned file modifications without writing:

```bash
# Preview a patch bump
npm run update-version -- patch --dry-run

# Or preview an explicit target version
npm run update-version -- 1.1.0 --dry-run
```

### 3. Execute Version Synchronization

Execute the synchronization script via CLI arguments directly (no `.env` file modification required):

```bash
# Convenience bump scripts
npm run update-version:patch
npm run update-version:minor
npm run update-version:major

# Or explicit version with optional custom changelog prefix and decision rationale
npm run update-version -- 1.1.0 -m "Custom release notes" -d "Approved Phase 01 release"
```

*Note on 95% Changelog Packaging:* If `-m` / `--changelog` is omitted, the synchronization engine automatically scoops up all staged bullets under `## [Unreleased]` in `CHANGELOG.md` and converts them into the new release body!

### 4. Automated Verification

Run the versioning test suite:

```bash
npm run test:versioning
```

---

## Safety Constraints & Invariants

- **No `.env` Requirement:** Parameters are passed directly via CLI flags or positional arguments (`patch`, `minor`, `major`, `X.Y.Z`).
- **SemVer Strictness:** Target version must be valid Semantic Versioning (`X.Y.Z`) and higher than or equal to current version in `package.json`. Downgrades are rejected unless `--allow-downgrade` is explicitly passed.
- **PHP Version Ordering:** When PHP CLI is available, target version must pass PHP `version_compare()` check.
- **Dependency Preservation:** Never replace third-party dependency version numbers, even if they match the plugin version.
- **Changelog Promotion:** The script moves `Unreleased` content in `CHANGELOG.md` to `## [VERSION] - YYYY-MM-DD` and creates a fresh empty `## [Unreleased]` block.
- **Architectural Memory:** Architectural choices and invariants remain governed exclusively by `docs/adr/`.
- **Atomic Operations:** Uses temporary file writes and rollback on failure.

---

## Verification Checklist

- [ ] Target version calculated or bump type chosen.
- [ ] `package.json` top-level `version` matches target.
- [ ] `package-lock.json` root package version matches target.
- [ ] Plugin header `Version:` and constant match target.
- [ ] `CHANGELOG.md` contains release header `## [VERSION] - YYYY-MM-DD` with promoted unreleased notes.
- [ ] `npm run test:versioning` passes without errors.
