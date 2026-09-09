# Command Catalog

This document is the authoritative directory of all verified commands across the environment, testing tiers, code quality, WP-CLI, build workflows, release tooling, and OpenAPI generation.

---

## 1. Environment & Container Management

```bash
# Pre-flight environment check (Docker, Compose, PHP, Composer, Node)
npm run pre-check
npm run pre-check -- --strict
npm run pre-check -- --json

# Start local containerized WordPress environment (PHP 8.3 & MariaDB)
npm run env:start

# Suspend containers while preserving state
npm run env:stop

# Reset WordPress database and options to clean state
npm run env:reset

# Clean container caches
npm run env:clean

# Destroy all containers, networks, and volumes
npm run env:destroy

# Stream real-time container logs
npm run env:logs

# Open an interactive bash shell in the CLI container
npm run env:cli

# Re-run automated post-boot provisioning manually
npm run wp:setup
```

---

## 2. Asset Building & Compilation

```bash
# Start Webpack watcher for live frontend compilation
npm run start

# Production build for admin applications and Gutenberg blocks
npm run build
```

---

## 3. Code Quality & Static Analysis (Tier 1)

```bash
# Run all linters (JS/TS, CSS, Markdown, GitHub Actions)
npm run lint

# Lint TypeScript and JavaScript in src/frontend
npm run lint:js

# Auto-fix TypeScript and JavaScript violations
npm run lint:js:fix

# Lint CSS styles
npm run lint:css

# Lint markdown documentation
npm run lint:md

# Lint GitHub Actions workflows for version tagging and permissions
npm run lint:actions

# PHP Coding Standards (WordPress-Core, Extra, Docs)
composer lint

# Automatically fix PHPCS formatting violations
composer lint:fix

# PHPStan Static Analysis (Level 6+)
composer analyse
```

---

## 4. Testing Suites (Tiers 2–5)

```bash
# Full test suite (Units, Scaffolding, Versioning, Environment, Release, Dependabot)
npm test

# Dependabot runner unit tests
npm run test:dependabot

# Tier 2: PHPUnit unit tests (in-memory, sub-millisecond)
composer test
vendor/bin/phpunit --testsuite Unit

# Tier 2: PHPUnit integration tests inside container
npx wp-env run cli --env-cwd=wp-content/plugins/ai-ready-wp-plugin-boilerplate vendor/bin/phpunit --testsuite Integration

# Tier 3: Frontend Jest unit tests
npm run test:unit
npm run test:unit -- --watch

# Tier 4: Bruno REST contract E2E tests
npm run test:rest
npm run test:rest:html

# Tier 5: Playwright browser end-to-end tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:update    # Update baseline visual regression snapshots
```

---

## 5. OpenAPI 3.1 Tools (ADR-0011)

```bash
# Generate deterministic docs/api/openapi.yaml from live registered REST routes
npm run openapi:generate

# Verify committed openapi.yaml matches live routes byte-for-byte (zero drift)
npm run openapi:check

# Validate OpenAPI 3.1 specification compliance via Redocly CLI
npm run openapi:lint
```

---

## 6. Scaffolding, Rebranding & Versioning

```bash
# Interactive plugin rebranding & scaffolding CLI
npm run scaffold

# Preview scaffolding changes without writing to disk
npm run scaffold -- --dry-run

# Staging changes in CHANGELOG.md under ## [Unreleased]
npm run changelog:add -- -t Added "New feature description"

# SemVer Version Synchronization
npm run update-version:dry-run
npm run update-version:patch
npm run update-version:minor
npm run update-version:major
```

---

## 7. Two-Pipeline Release Tooling (ADR-0010)

```bash
# Build production distribution ZIP package respecting .distignore
npm run release:build

# Inspect and validate distribution ZIP against package content contract
npm run release:validate

# Verify version parity and git tag readiness before release
npm run release:check

# Extract release notes for a target version from CHANGELOG.md
npm run release:notes -- --version 1.1.2

# Execute release contract unit and integration test suite
npm run test:release
```

---

## 8. Architecture Decision Records (ADRs)

```bash
# Create a new ADR using standard MADR template
npm run adr:new -- -t "Title of Architectural Decision"

# Validate all ADRs for referential integrity and format
npm run adr:validate -- --strict

# Update status of an existing ADR
npm run adr:status -- --file docs/adr/0004-xyz.md --status superseded --by 0011
```

---

## 9. Local Dependabot Tooling

```bash
# Run local Dependabot checks across all configured ecosystems (GitHub Actions, npm, Composer)
npm run dependabot

# Run checks for a specific ecosystem
npm run dependabot -- --ecosystem github-actions
npm run dependabot -- --ecosystem npm
npm run dependabot -- --ecosystem composer

# Run check for a specific dependency
npm run dependabot -- -e composer -d yoast/phpunit-polyfills

# Validate prerequisites and configuration without starting Docker containers
npm run dependabot -- --dry-run

# Run Dependabot runner unit test suite
npm run test:dependabot
```

---

## 10. Agent Skills Synchronization

```bash
# Sync external agent skills from upstream repositories (preserves in-tree skills)
npm run skills:sync
```
