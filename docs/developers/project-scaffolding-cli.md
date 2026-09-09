# Project Scaffolding & Rebranding CLI

The **Automated Project Scaffolding CLI** allows developers to rapidly transform this boilerplate into a production-ready, custom-branded plugin without manual search-and-replace errors.

Governed by **ADR-0006: Automated Project Scaffolding CLI**.

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
| `--text-domain <string>` | string | Same as `--slug` | The WordPress gettext translation domain. |
| `--rest-namespace <string>` | string | `<slug>/v1` | The REST API URL route namespace. |
| `--block-name <string>` | string | `<slug>/hello-world` | The Gutenberg block identifier (`namespace/block-name`). |
| `--root <path>` | string | `process.cwd()` | Project root path to operate upon. |
| `--dry-run` | boolean | `false` | Previews all planned file modifications and renames without writing to disk. |
| `--interactive` | boolean | `false` | Force interactive terminal prompts. |
| `--help` | boolean | `false` | Displays usage instructions and exits. |

---

## 3. What the Scaffolding Engine Transforms

When executed, `tools/scaffolding/scaffold-engine.mjs` executes an atomic transformation:

1. **Main Plugin File:**
   - Detects the current root PHP file (e.g., `ai-ready-wp-plugin-boilerplate.php`).
   - Renames it to `<new-slug>.php`.
2. **PHP Namespaces:**
   - Replaces all occurrences of `AIReady\WPPluginBoilerplate` with the new namespace across all PHP and TypeScript files.
   - Replaces JSON double-escaped namespaces (`AIReady\\WPPluginBoilerplate`) inside `composer.json`.
3. **PHP Constants & Prefix Variations:**
   - Replaces uppercase constant prefix `AIRWP_` with `<NEWPREFIX_>` (e.g., `MDM_PLUGIN_FILE`, `MDM_VERSION`).
   - Replaces lowercase underscore prefix (`airwp_`) in database option names (`airwp_settings` -> `mdm_settings`), function names, and test users (`airwp_api_test`).
   - Replaces lowercase hyphen prefix (`airwp-`) in admin menu slugs (`airwp-settings`), CSS selectors (`.airwp-*`), and HTML mount points (`#airwp-settings-root`).
   - Replaces camelCase and PascalCase identifiers (`airwpAdminBootstrap`, `AirwpBootstrapData`).
4. **Configuration & Manifest Files:**
   - Updates `package.json`, `composer.json`, `.wp-env.json`, `phpcs.xml.dist`, `tests/bruno/`, and `docs/api/openapi.yaml`.

---

## 4. Verification

After scaffolding a new project:

```bash
# 1. Regenerate Composer autoloader
composer dump-autoload

# 2. Verify all test suites pass under the new branding
npm test
composer lint
composer test
```
