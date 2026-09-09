# ADR-0012: WordPress 7.1 Minimum Compatibility Baseline and Runtime Package Locking

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Development Team & AI Coding Agents
- **Consulted:** Architecture Stakeholders, Frontend Engineers, WordPress Core Contributors
- **Informed:** All Contributors

---

## Context and Problem Statement

WordPress plugins built with modern React and Gutenberg tooling face a classic runtime discrepancy: production JavaScript bundles depend on `@wordpress/*` packages (such as `@wordpress/components`, `@wordpress/element`, `@wordpress/api-fetch`, `@wordpress/blocks`, `@wordpress/block-editor`), but in the browser these packages are not executed from bundled npm dependencies. Instead, they are externalized via `@wordpress/dependency-extraction-webpack-plugin` to consume the global `window.wp.*` objects provided by the host WordPress installation.

When plugin developers or AI agents use the npm `latest` dist-tag for `@wordpress/*` runtime dependencies:

1. **Phantom API Regressions:** The codebase may import methods, components, or React hooks available in the latest standalone npm release of Gutenberg that do not exist in the host WordPress installation's bundled scripts, causing fatal JavaScript errors for users on the minimum supported WordPress version.
2. **Coupled Tooling Antipattern:** Attempting to pin the entire project (including dev tooling like `@wordpress/scripts`, `@wordpress/env`, Playwright, TypeScript, and test runners) to an older WordPress release cripples developer experience, prevents adoption of modern Node versions (Node 24 LTS), and blocks linting and security improvements.
3. **Accidental Bundling:** Missing or misconfigured externalization can lead to massive bundle size inflation where an entire `@wordpress/*` package (and its subdependencies like React or Emotion) is bundled inline into the distribution archive rather than resolved through WordPress script registration.
4. **Premature Auto-Upgrades:** When WordPress 7.2 or 7.3 is released, automated package managers (like Dependabot) or automated scripts frequently bump runtime packages to the latest dist-tag, silently breaking compatibility with the declared minimum supported WordPress version.

The boilerplate requires an immutable architectural policy establishing the minimum supported WordPress version, pinning externalized production runtime packages, decoupling development tooling, enforcing dual-target testing, and guaranteeing `.asset.php` externalization.

## Decision Drivers

1. **Guaranteed Runtime Safety:** Every `@wordpress/*` API, component, and hook used in the plugin must be guaranteed to exist on the declared minimum supported WordPress version.
2. **Decoupled Tooling Architecture:** Development dependencies must run on their newest stable releases compatible with Node 24 and the modern toolchain, independent of runtime version constraints.
3. **Deterministic Version Floor:** The minimum supported version is an immutable contract; newer WordPress releases (7.2, 7.3) must not trigger automatic runtime package updates.
4. **Automated Verification:** Automated build-time checks must verify that `.asset.php` files are generated and that `@wordpress/*` packages are externalized, never bundled.
5. **Dual-Target Testing Parity:** The test harness must support and verify both the minimum compatibility baseline (WordPress 7.1) and the forward-compatibility target (Latest Stable WordPress).

## Considered Options

### Option 1: Track `latest` for all `@wordpress/*` packages

Use `npm install @wordpress/package@latest` for all packages.

- **Good, because:** Access to newest features and experimental components.
- **Bad, because:** Causes fatal runtime errors on older supported WordPress sites when using APIs introduced in newer Gutenberg releases. Violates the minimum version compatibility contract.

### Option 2: Pin both runtime dependencies and development tooling to WordPress 7.1

Lock `@wordpress/scripts`, `@wordpress/env`, and dev tooling to WordPress 7.1 alongside runtime dependencies.

- **Good, because:** Uniform version numbers across all `@wordpress/*` packages.
- **Bad, because:** Forces outdated build tooling, older ESLint/Stylelint configs, older TypeScript support, and prevents running modern testing tools on Node 24.

### Option 3: Lock runtime packages to WordPress 7.1 baseline, decouple dev tooling, enforce dual-target testing, and verify `.asset.php` (Chosen)

Partition package governance into two decoupled tiers:

1. **Production Runtime Packages (`dependencies`):** Pinned to the exact package versions released in the official WordPress 7.1 distribution line (`wp/7.1` branch). Never use `latest`.
2. **Development Tooling (`devDependencies`):** Kept on the newest compatible stable versions (`@wordpress/scripts`, `@wordpress/env`, Playwright, TypeScript, Redocly, Bruno CLI, markdownlint-cli2).
3. **Intentional Upgrade Rule:** When WordPress 7.2 or 7.3 is released, runtime packages are **not** updated automatically. They change only when the plugin's declared minimum supported WordPress version is intentionally bumped.
4. **Dual-Target Testing:** Automated tests run against both WordPress 7.1 (minimum baseline) and Latest Stable WordPress (forward compatibility).
5. **Asset Externalization Verification:** In-tree verification script (`tools/assets/verify-assets.mjs`) asserts that every entrypoint has a `.asset.php` file and that `@wordpress/*` packages are externalized, failing builds if any runtime package is inlined.

- **Good, because:** Eliminates phantom API errors across all supported WordPress installations.
- **Good, because:** Allows development tooling to advance to newer stable releases without compromising runtime compatibility.
- **Good, because:** Automated verification prevents accidental bundle bloating and module leakage.
- **Good, because:** Dependabot rules explicitly ignore semver major/minor bumps for `@wordpress/*` packages.
- **Good, because:** Dual-target testing proves both backward compatibility and forward compatibility.

## Decision Outcome

Chosen Option: **Option 3**.

### Concrete Invariants & Governance Rules

1. **Declared Minimum Supported Version:**
   - The plugin declares `Requires at least: 7.1` in the main plugin file (`ai-ready-wp-plugin-boilerplate.php`) and `readme.txt`.
   - `Compatibility::MIN_WP_VERSION` is `'7.1'`.
   - PHPCS `minimum_supported_wp_version` is configured to `7.1`.

2. **Runtime Package Locking Table (WordPress 7.1 Baseline):**
   The following exact package versions from WordPress 7.1 (`wp/7.1` branch) are locked in `dependencies`:
   - `@wordpress/api-fetch`: `7.51.0`
   - `@wordpress/block-editor`: `16.0.0`
   - `@wordpress/blocks`: `15.24.0`
   - `@wordpress/components`: `37.0.0`
   - `@wordpress/element`: `8.3.0`
   - `@wordpress/i18n`: `6.24.0`
   - `@wordpress/icons`: `15.2.0`
   - Additional WordPress packages (`@wordpress/data` `10.51.0`, `@wordpress/hooks` `4.51.0`, `@wordpress/notices` `5.51.0`, `@wordpress/plugins` `7.51.0`, `@wordpress/url` `4.51.0`) serve as the authoritative version baseline whenever introduced.

3. **Dependabot Governance:**
   - `.github/dependabot.yml` explicitly ignores `semver-major` and `semver-minor` updates for `@wordpress/*` packages to prevent accidental bumps to `latest`.

4. **Asset Externalization Verification:**
   - Production build (`npm run build`) runs `wp-scripts build && npm run assets:verify`.
   - `tools/assets/verify-assets.mjs` validates that each entrypoint produces a valid `.asset.php` file containing required `wp-*` dependency handles.
   - The distribution package validator (`tools/release/validate-package.mjs`) asserts that all compiled assets inside the distribution ZIP include `.asset.php` metadata.

5. **Dual-Target Testing:**
   - Minimum baseline environment: `npm run env:start:min` (`wp-env start --core=WordPress/WordPress#7.1`).
   - Forward-compatibility target: `npm run env:start:latest` (`wp-env start`).
   - Tier 4 (Bruno) and Tier 5 (Playwright) suites are documented and executed across both targets.

## Consequences

### Positive

- Zero phantom API runtime bugs on WordPress 7.1 installations.
- Zero accidental bundling of heavy WordPress core packages into production distribution archives.
- Tooling remains modern, performant, and secure on Node 24 and npm 11.
- Automated self-healing quality gate verifies both build assets and package contracts locally.
- Strict protection against accidental dependencies updates via Dependabot ignore rules.

### Negative & Trade-offs

- Requires manual version update when deliberately elevating the minimum supported WordPress version.
- Requires maintaining dual-target test environment commands and documentation.

### Risks & Mitigations

- **Risk:** Developers or coding agents accidentally import a newer `@wordpress/*` API not present in WordPress 7.1.
  **Mitigation:** `package.json` pins exact WordPress 7.1 package versions; TypeScript static analysis against these pinned types fails immediately if an API does not exist in the 7.1 baseline.
- **Risk:** Production build bundles `@wordpress/*` packages instead of externalizing them.
  **Mitigation:** `tools/assets/verify-assets.mjs` runs on every `npm run build` and release build, checking for `.asset.php` existence and verifying that no internal `@wordpress/*` modules are bundled into JavaScript outputs.

## Architectural Constraints

1. **Exact Version Pinning:** Production `@wordpress/*` dependencies in `package.json` must be exact semver versions matching the WordPress 7.1 release baseline (no `^` or `~` ranges).
2. **Never Use `latest` Dist-Tag:** Do not use `latest` for runtime packages expected to be provided by host WordPress.
3. **Decoupled Development Tooling:** Development packages (`@wordpress/scripts`, `@wordpress/env`, Playwright, TypeScript, Redocly, Bruno CLI) must remain in `devDependencies` and use modern stable releases.
4. **Frozen Baseline across Minor Core Releases:** When WordPress 7.2 or 7.3 is released, runtime packages must not be automatically bumped. The baseline updates only when the plugin's declared minimum supported WordPress version is intentionally elevated.
5. **Mandatory Asset Externalization:** Every compiled JavaScript entrypoint must generate a companion `.asset.php` file with externalized `wp-*` dependency handles.

## Verification & Fitness Functions

- **Asset Externalization Verification:** `npm run assets:verify` (or `node tools/assets/verify-assets.mjs`)
- **Node Release Tests:** `npm run test:release`
- **ADR Structural Integrity:** `npm run adr:validate -- --strict`
- **Minimum Environment Test:** `npm run env:start:min && npm run test:rest`
- **Latest Environment Test:** `npm run env:start:latest && npm run test:rest`
- **Pass Threshold:** All scripts exit with code `0`.

## Reconsider When

- The plugin deliberately elevates its minimum supported WordPress version to 7.2 or higher.
- WordPress Core adopts an ESM module-native distribution architecture that eliminates script handles and `.asset.php` dependency extraction.

## Implementation References

- **Asset Verification Tool:** `tools/assets/verify-assets.mjs`
- **Asset Test Suite:** `tests/node/release/asset-externalization.test.mjs`
- **Compatibility Documentation:** `docs/testing/wordpress-compatibility-testing.md`
- **Package Manifest:** `package.json`
- **Dependabot Configuration:** `.github/dependabot.yml`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:**
  - [ADR-0003](0003-gutenberg-block-api-v3-standard.md) — Gutenberg Block API v3 standard
  - [ADR-0008](0008-frontend-architecture-and-component-design-patterns.md) — Frontend architecture and component design patterns
  - [ADR-0010](0010-two-pipeline-ci-cd-and-release-readiness-architecture.md) — Two-Pipeline CI/CD and Release Readiness Architecture
