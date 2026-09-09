# Command Catalog

This document is the authoritative directory of all verified commands across the environment, testing tiers, code quality, WP-CLI, and build workflows.

---

## 1. Environment & Container Management

```bash
# Pre-flight environment check (Docker, Compose v2/v5, PHP, Composer, Node)
npm run pre-check
npm run pre-check -- --strict
npm run pre-check -- --json

# Start local containerized WordPress environment
npm run env:start

# Suspend containers
npm run env:stop

# Reset WordPress database and options to clean state
npm run env:reset

# Clean container caches
npm run env:clean

# Destroy all containers and volumes
npm run env:destroy

# Stream real-time container logs
npm run env:logs

# Open an interactive bash shell in the CLI container
npm run env:cli
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
# Run all linters (JS/TS, CSS, Markdown)
npm run lint

# Lint TypeScript and JavaScript
npm run lint:js

# Auto-fix TypeScript and JavaScript violations
npm run lint:js:fix

# Lint CSS styles
npm run lint:css

# Lint markdown documentation
npm run lint:md

# PHP Coding Standards (WordPress-Core, Extra, Docs)
composer lint

# Automatically fix PHPCS formatting violations
composer lint:fix

# PHPStan static analysis (Level 6+)
composer analyse
```

---

## 4. Automated Testing Suites (Tiers 2–5)

```bash
# Fast test suite (Jest unit, versioning, scaffolding, environment)
npm run test

# Frontend React & Block unit tests (Tier 3)
npm run test:unit

# In-memory PHPUnit unit tests (Tier 2)
composer test
# or
vendor/bin/phpunit

# Containerized WordPress integration tests (Tier 2)
npx wp-env run cli --env-cwd=wp-content/plugins/ai-ready-wp-plugin-boilerplate vendor/bin/phpunit

# Bruno REST API Contract Tests (Tier 4)
npm run test:rest
npm run test:rest:html

# Playwright Browser E2E & Visual Regression Tests (Tier 5)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:update

# Versioning and Scaffolding integration tests
npm run test:versioning
npm run test:scaffold
npm run test:env
```

---

## 5. Custom WP-CLI Operations

Execute custom plugin commands within the `wp-env` container:

```bash
# Retrieve plugin settings
npx wp-env run cli wp ai-ready settings-get
npx wp-env run cli wp ai-ready settings-get --format=json

# Update plugin settings
npx wp-env run cli wp ai-ready settings-update --greeting="Hello AI World" --cache_ttl=3600

# Execute health diagnostics
npx wp-env run cli wp ai-ready doctor
npx wp-env run cli wp ai-ready doctor --format=table
```

---

## 6. Project Scaffolding & Rebranding

```bash
# Interactive plugin renaming
npm run scaffold

# Non-interactive CLI rebranding
npm run scaffold -- \
  --name "Custom Plugin" \
  --slug "custom-plugin" \
  --namespace "Acme\\CustomPlugin" \
  --prefix "CP_"
```

---

## 7. Versioning & Changelog Management

```bash
# Append an unreleased entry to CHANGELOG.md
npm run changelog:add -- -t Added "Added new feature"
npm run changelog:add -- -t Fixed "Fixed bug"

# Atomic SemVer bump and release packaging
npm run update-version:patch
npm run update-version:minor
npm run update-version:major

# Custom bump with release notes
npm run update-version -- 1.1.0 -m "Release notes lead"
```

---

## 8. Agent Skills & ADRs

```bash
# Synchronize external agent skills from GitHub
npm run skills:sync

# Scaffold a new Architecture Decision Record
npm run adr:new -- -t "My Decision" --template madr

# Validate all ADRs
npm run adr:validate -- --strict

# Detect ADR conventions
npm run adr:detect
```
