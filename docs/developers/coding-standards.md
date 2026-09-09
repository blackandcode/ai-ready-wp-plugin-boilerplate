# Coding Standards & Engineering Practices

High software quality is non-negotiable in the **WordPress AI Plugin Development Boilerplate**.

This guide details the mandatory enforcement of **WordPress Coding Standards (WPCS)**, **PHPStan** static analysis at Level 6+, frontend code linters (ESLint, Stylelint, Markdownlint), GitHub Actions workflow linting, and software craftsmanship principles.

---

## 1. WordPress Coding Standards (WPCS)

All PHP code must strictly adhere to the official WordPress Coding Standards. Code formatting, naming, security escaping, and sanitization are verified automatically.

### 1.1 `phpcs.xml.dist` Configuration

Modern enterprise plugins require **PSR-4 autoloading** with PascalCase class filenames (e.g. `src/framework/Kernel/Plugin.php`). The boilerplate excludes `src/*` from the legacy `class-*.php` rule while enforcing all other strict security and formatting rules:

```xml
<?xml version="1.0"?>
<ruleset name="PluginCodingStandards">
    <description>PHPCS ruleset for WordPress AI Plugin Boilerplate.</description>

    <file>src/</file>
    <file>ai-ready-wp-plugin-boilerplate.php</file>
    <file>uninstall.php</file>

    <exclude-pattern>/vendor/</exclude-pattern>
    <exclude-pattern>/node_modules/</exclude-pattern>
    <exclude-pattern>/build/</exclude-pattern>
    <exclude-pattern>/tests/</exclude-pattern>

    <rule ref="WordPress-Core"/>
    <rule ref="WordPress-Extra"/>
    <rule ref="WordPress-Docs"/>

    <rule ref="WordPress.Files.FileName">
        <exclude-pattern>src/*</exclude-pattern>
    </rule>

    <config name="text_domain" value="ai-ready-wp-plugin-boilerplate"/>
    <config name="minimum_supported_wp_version" value="7.1"/>
</ruleset>
```

### 1.2 Execution Commands

```bash
# Run PHPCS checks
composer lint

# Automatically fix whitespace and styling violations
composer lint:fix
```

---

## 2. PHPStan Static Analysis (Level 6+)

Configured via `phpstan.neon.dist`:

- Level 6 analysis with `szepeviktor/phpstan-wordpress`.
- Strict checking of function signatures, return types, and parameter types.
- Scans `src/` and root entrypoints.

```bash
composer analyse
```

---

## 3. Frontend & Markdown Linting

- **JavaScript / TypeScript:** `@wordpress/scripts lint-js src/frontend`
- **Stylesheets:** `@wordpress/scripts lint-style 'src/frontend/**/*.css'`
- **Markdown:** `markdownlint-cli2 'docs/**/*.md' 'README.md' 'AGENTS.md'`
- **GitHub Actions:** `node tools/release/lint-actions.mjs`

```bash
npm run lint
```

---

## 4. Software Craftsmanship Principles

1. **Clean Hexagonal Architecture:** Keep domain entities pure, immutable, and decoupled from WordPress core.
2. **Defensive Coding:** Validate all inputs at system boundaries (REST, CLI, forms) and sanitize all outputs.
3. **Immutability:** Value objects and DTOs must be immutable.
4. **Zero-Drift Invariant:** Keep documentation, tests, OpenAPI contracts, and code perfectly synchronized.
