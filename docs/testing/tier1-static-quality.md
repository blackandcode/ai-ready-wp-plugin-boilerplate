# Tier 1: Static Quality Analysis

This document details the configuration, tools, and execution procedures for Tier 1 of the testing pyramid: static code quality and formatting gates.

---

## 1. Overview & Tools

Tier 1 static quality checks run instantaneously without executing plugin code or booting WordPress containers:

- **PHP CodeSniffer (PHPCS):** Enforces WordPress Coding Standards (`WordPress-Core`, `WordPress-Extra`, `WordPress-Docs`).
- **PHPStan:** Static analysis at Level 6+ with `szepeviktor/phpstan-wordpress` extensions and official WordPress stubs.
- **ESLint:** Enforces `@wordpress/eslint-plugin` rules across JavaScript and TypeScript.
- **Stylelint:** Enforces `@wordpress/stylelint-config` rules across CSS/SCSS stylesheets.
- **Markdownlint:** Enforces Markdown consistency and prevents syntax errors (`markdownlint-cli2`).
- **GitHub Actions Linter (`lint-actions.mjs`):** Validates workflow files for semantic version tagging, least-privilege token permissions, and syntax integrity.

---

## 2. PHP CodeSniffer (WPCS)

### Configuration (`phpcs.xml.dist`)

The ruleset enforces strict WordPress standards while accommodating modern PSR-4 class naming in `src/`:

```xml
<ruleset name="AIReadyWPPluginBoilerplate">
    <rule ref="WordPress-Core"/>
    <rule ref="WordPress-Extra"/>
    <rule ref="WordPress-Docs"/>
    <rule ref="WordPress.Files.FileName">
        <exclude-pattern>src/*</exclude-pattern>
    </rule>
</ruleset>
```

### Execution Commands

```bash
# Check PHP files for WPCS violations
composer lint

# Automatically fix whitespace, indentation, and formatting violations
composer lint:fix
```

---

## 3. PHPStan Static Analysis

### Configuration (`phpstan.neon.dist`)

Configured for **Level 6** analysis:

- Includes WordPress core stubs (`vendor/php-stubs/wordpress-stubs/wordpress-stubs.php`).
- Includes WP-CLI stubs (`vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php`).
- Excludes false-positive baseline overrides.

### Execution Command

```bash
composer analyse
```

---

## 4. Frontend & Markdown Linting

```bash
# Lint frontend TypeScript/React files in src/frontend
npm run lint:js

# Lint stylesheets
npm run lint:css

# Lint markdown files across docs/ and repository root
npm run lint:md

# Lint GitHub Actions workflows for version tagging and permissions
npm run lint:actions
```

---

## 5. Coding Agent Rules

1. **Zero Lint Tolerance:** Pull requests and phase closeouts must have 0 PHPCS errors, 0 PHPStan errors, and 0 ESLint warnings.
2. **Never Ignore PHPCS Without In-Line Explanation:** If a specific WordPress rule must be excluded (e.g., camelCase for an external API response object), use a granular line ignore with an explanatory comment:

   ```php
   // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- External API contract
   ```

3. **Always Run `composer lint:fix` First:** When WPCS errors appear, run `composer lint:fix` to resolve formatting discrepancies deterministically.
