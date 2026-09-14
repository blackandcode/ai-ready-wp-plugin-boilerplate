# Project Scaffolding & Rebranding CLI

The **Automated Project Scaffolding CLI** allows developers to rapidly transform this boilerplate into a production-ready, custom-branded plugin without manual search-and-replace errors.

Governed by **[ADR-0006](../adr/0006-automated-project-scaffolding-cli.md)** and amended by **[ADR-0015](../adr/0015-modular-scaffolding-pipeline-repository-history-reset-and-version-baseline.md)**.

---

## 1. Overview & Commands

The project includes two npm script aliases pointing to the scaffolding engine:

```bash
# Interactive mode (prompts for options if in a TTY)
npm run scaffold

# Alias for renaming an existing project
npm run rename
```

### Command-Line Flag Execution

You can run non-interactive automation by providing CLI arguments:

```bash
npm run scaffold -- \
  --name "Mermaid Diagrams" \
  --slug "mermaid-diagrams" \
  --namespace "WebFalcon\MermaidDiagrams" \
  --prefix "MDM_" \
  --author "WebFalcon" \
  --rest-namespace "mdm/v1" \
  --block-name "mdm/diagram"
```

---

## 2. CLI Options Reference

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `--name <string>` | string | `"My Custom WordPress Plugin"` | The human-readable display name of the plugin. |
| `--slug <string>` | string | Generated from `--name` | The plugin slug used in directory names, file names, and text domains. |
| `--namespace <string>` | string | Generated from author + slug | The root PSR-4 PHP namespace (e.g., `"WebFalcon\MermaidDiagrams"`). |
| `--prefix <string>` | string | Generated from slug (e.g. `MDM_`) | The PHP constant prefix (uppercase, ending with `_`). |
| `--author <string>` | string | `"Plugin Developer"` | Author or organization name. |
| `--description <string>` | string | Auto-generated | Plugin description for headers, manifests, and documentation. |
| `--greeting <string>` | string | Auto-generated | Default greeting message for REST endpoints and block attributes. |
| `--block-title <string>` | string | `"Hello World"` | Primary block display title. |
| `--block-description <string>` | string | Auto-generated | Primary block description in `block.json`. |
| `--text-domain <string>` | string | Same as `--slug` | The WordPress gettext translation domain. |
| `--rest-namespace <string>` | string | `<slug>/v1` | The REST API URL route namespace. |
| `--block-name <string>` | string | `<slug>/hello-world` | The Gutenberg block identifier (`namespace/block-name`). |
| `--composer-name <string>` | string | `<vendor>/<slug>` | The Composer package identifier in `composer.json`. |
| `--cli-command <string>` | string | Auto-generated from slug | The WP-CLI root command (e.g. `wp <command>`). |
| `--clean-history` | boolean | `true` | Clean boilerplate changelog, ADRs, audit logs, and decision logs. |
| `--no-clean-history` | boolean | `false` | Preserve existing changelog, ADRs, and audit logs. |
| `--keep-history` | boolean | `false` | Alias for `--no-clean-history`. |
| `--reset-version` | boolean | `true` | Reset plugin version baseline across all files to 1.0.0. |
| `--no-reset-version` | boolean | `false` | Retain existing version numbers without resetting. |
| `--target-version <string>` | string | `"1.0.0"` | Target semantic version baseline when resetting. |
| `--root <path>` | string | `process.cwd()` | Project root path to operate upon. |
| `--dry-run` | boolean | `false` | Previews all planned file modifications, renames, and deletions without writing to disk. |
| `--interactive` | boolean | `false` | Force interactive terminal prompts. |
| `--help` | boolean | `false` | Displays usage instructions and exits. |

---

## 3. Modular Pipeline Architecture

Governed by **ADR-0015**, the scaffolding tool is organized as an extensible pipeline (`tools/scaffolding/lib/pipeline.mjs`) composed of specialized steps:

```text
tools/scaffolding/
├── scaffold-plugin.mjs          # CLI entry point and argument parsing
├── scaffold-engine.mjs          # Backwards-compatible facade and pipeline invoker
└── lib/
    ├── detect.mjs               # Project metadata detection & casing derivation
    ├── history-cleaner.mjs      # Repository history, changelog, and ADR cleanup
    ├── version-resetter.mjs     # 1.0.0 baseline synchronization across manifests
    ├── replacements.mjs         # Deterministic token replacement dictionaries
    ├── transformer.mjs          # Atomic text scanning, replacement, and rollback
    ├── renamer.mjs              # File renames (main PHP file, language catalogs)
    ├── manifest-sync.mjs        # MANIFEST.md table synchronization
    └── pipeline.mjs             # Pipeline orchestrator and transaction manager
```

---

## 4. What the Scaffolding Engine Transforms

When executed, the pipeline executes an atomic transformation:

### 4.1 Identifiers, Namespaces & Constants

1. **Main Plugin File:**
   - Detects the current root PHP file (e.g., `wp-ai-ready-plugin-boilerplate.php`).
   - Renames it to `<new-slug>.php`.
2. **PHP Namespaces:**
   - Replaces all occurrences of `WPAIBP` and `AIReady\WPPluginBoilerplate` with the new namespace across all PHP and TypeScript files.
   - Replaces JSON double-escaped namespaces (`Vendor\\Plugin`) inside `composer.json`.
3. **PHP Constants & Prefix Variations:**
   - Replaces uppercase constant prefix `WPAIBP_` with `<NEWPREFIX_>` (e.g., `MDM_PLUGIN_FILE`, `MDM_VERSION`).
   - Replaces lowercase underscore prefix (`wpaibp_`) in database option names (`wpaibp_settings` -> `mdm_settings`), function names, and test users (`wpaibp_api_test`).
   - Replaces lowercase hyphen prefix (`wpaibp-`) in admin menu slugs (`wpaibp-settings`), CSS selectors (`.wpaibp-*`), and HTML mount points (`#wpaibp-settings-root`).
   - Replaces camelCase and PascalCase identifiers (`wpaibpAdminBootstrap`, `WpaibpBootstrapData`).
4. **Configuration & Manifest Files:**
   - Updates `package.json`, `composer.json`, `.wp-env.json`, `phpcs.xml.dist`, `tests/bruno/`, and `docs/api/openapi.yaml`.

### 4.2 Automated History Cleanup (Default: Enabled)

- **`CHANGELOG.md`:** Replaces the boilerplate changelog history with a clean Keep-a-Changelog template containing an empty `## [Unreleased]` section and a single `## [1.0.0]` release section noting `- Initial release of <Target Plugin Name>.`
- **`readme.txt` Changelog:** Resets the `== Changelog ==` section to `= 1.0.0 =` with `* Initial release of <Target Plugin Name>.`
- **Architecture Decision Records (`docs/adr/`):** Deletes boilerplate-specific ADRs (`0002-*` through `0015-*`), preserves foundational `ADR-0001: Record architecture decisions`, and resets `docs/adr/README.md` index table so that `npm run adr:validate` passes immediately with zero warnings.
- **Audit Logs (`docs/implementation-logs/`):** Removes past boilerplate phase implementation logs while maintaining `.gitkeep` to track the directory in Git.
- **Decision Logs:** Removes legacy `docs/decision-log.md` if present.

### 4.3 Automated Version Reset (Default: Enabled)

Resets the version baseline from the boilerplate release number (e.g. `1.4.0`) to `1.0.0` (or custom `--target-version`):

- `package.json` (`version: "1.0.0"`)
- `package-lock.json` (root and empty-string package version: `"1.0.0"`)
- `composer.json` (`version: "1.0.0"` if present)
- Main plugin PHP header (`Version: 1.0.0`)
- Constant definition (`define( '<PREFIX>VERSION', '1.0.0' );`)
- Framework kernel constant `Plugin::VERSION = '1.0.0'`
- Starter block definition `src/frontend/apps/hello-world/block.json` (`version: "1.0.0"`)
- WordPress distribution header in `readme.txt` (`Stable tag: 1.0.0`)

### 4.4 Repository Manifest Synchronization

- Synchronizes `MANIFEST.md` by updating renamed files (e.g. `wp-ai-ready-plugin-boilerplate.php` -> `<new-slug>.php`) and removing table rows for pruned ADRs and audit logs.

---

## 5. Verification

After scaffolding a new project:

```bash
# 1. Regenerate Composer autoloader
composer dump-autoload

# 2. Recompile frontend assets and OpenAPI schema
npm run build
npm run openapi:generate

# 3. Verify all test suites and quality gates pass under the new branding
npm test
composer lint
composer test
npm run adr:validate
```
