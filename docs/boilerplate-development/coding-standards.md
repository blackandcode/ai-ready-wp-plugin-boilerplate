# Coding Standards and Engineering Practices

High software quality is non-negotiable in the **WordPress AI Plugin Development Boilerplate**.

This guide details the mandatory enforcement of **WordPress Coding Standards (WPCS)**, **PHPStan** static analysis at Level 6+, frontend code linters (ESLint, Stylelint, Markdownlint), and core software craftsmanship principles encoded in agent skills (`oop-best-practices`, `design-patterns-best-practices`, `tdd-best-practices`, `refactoring-best-practices`).

---

## 1. Mandatory WordPress Coding Standards (WPCS)

All PHP code must strictly adhere to the official WordPress Coding Standards. Code formatting, naming, security escaping, and sanitization are verified automatically.

### 1.1 Composer Setup

`composer.json` configures PHP_CodeSniffer and the WordPress Coding Standards:

```json
{
  "require-dev": {
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0.1",
    "wp-coding-standards/wpcs": "^3.1.0",
    "phpstan/phpstan": "^2.1.0",
    "szepeviktor/phpstan-wordpress": "^2.0.0",
    "php-stubs/wordpress-stubs": "^6.7",
    "php-stubs/wp-cli-stubs": "^2.12"
  },
  "scripts": {
    "lint": "vendor/bin/phpcs",
    "lint:fix": "vendor/bin/phpcbf",
    "analyse": "vendor/bin/phpstan analyse"
  }
}
```

### 1.2 `phpcs.xml.dist` Configuration

WordPress has historically used a kebab-case file naming convention (e.g. `class-my-widget.php`). Modern enterprise plugins, however, require **PSR-4 autoloading** with PascalCase class filenames (e.g. `src/Settings/Domain/Model/PluginSettings.php`).

The boilerplate resolves this cleanly by excluding `src/*` from the `WordPress.Files.FileName` rule while enforcing all other strict security and formatting rules:

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

    <arg name="colors"/>
    <arg value="sp"/>
    <arg name="extensions" value="php"/>

    <rule ref="WordPress-Core"/>
    <rule ref="WordPress-Extra"/>
    <rule ref="WordPress-Docs"/>

    <rule ref="WordPress.Files.FileName">
        <exclude-pattern>src/*</exclude-pattern>
    </rule>

    <config name="text_domain" value="ai-ready-wp-plugin-boilerplate"/>
    <config name="minimum_supported_wp_version" value="7.0"/>
</ruleset>
```

### 1.3 Linting Commands

```bash
# Check code against WPCS
composer lint

# Automatically fix whitespace and standard violations
composer lint:fix
```

---

## 2. PHPStan Static Analysis (Level 6+)

Static typing is enforced to catch type errors, undefined method calls, and invalid parameter types before code is executed.

### 2.1 `phpstan.neon.dist` Configuration

Using `szepeviktor/phpstan-wordpress`, PHPStan understands WordPress core function return types, hooks, and global variables:

```neon
includes:
    - vendor/szepeviktor/phpstan-wordpress/extension.neon

parameters:
    level: 6
    paths:
        - src
        - ai-ready-wp-plugin-boilerplate.php
    bootstrapFiles:
        - ai-ready-wp-plugin-boilerplate.php
    scanFiles:
        - vendor/php-stubs/wordpress-stubs/wordpress-stubs.php
        - vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php
```

### 2.2 Analysis Command

```bash
composer analyse
```

Zero errors are permitted in production builds or pull requests.

---

## 3. Frontend Quality & Linters

Frontend assets are validated through `@wordpress/scripts`:

```bash
# Lint JavaScript and TypeScript
npm run lint:js

# Automatically fix JavaScript / TypeScript lint issues
npm run lint:js:fix

# Lint CSS and stylesheets
npm run lint:css

# Lint markdown documentation
npm run lint:md

# Run all linters sequentially
npm run lint
```

---

## 4. Software Craftsmanship Principles

Coding agents and developers must adhere to the engineering disciplines codified in `.cursor/skills/`:

### 4.1 Domain-Driven Design (`ddd-best-practices`)

- Keep Domain classes pure PHP: no direct `get_option()` or `$wpdb` calls inside `src/<Context>/Domain/`.
- Encapsulate invariants inside Value Objects (`GreetingMessage`, `CacheTtl`).
- Coordinate persistence exclusively via Repository interfaces (`SettingsRepositoryInterface`).

### 4.2 Object-Oriented Programming (`oop-best-practices`)

- Single Responsibility Principle (SRP): Service providers boot, controllers adapt HTTP, application services orchestrate, repositories persist.
- Dependency Inversion Principle (DIP): High-level modules depend on abstractions (interfaces in `Domain/`), not low-level concrete classes.

### 4.3 Test-Driven Development (`tdd-best-practices`)

- Write tests alongside or before features.
- In-memory unit tests in `tests/phpunit/unit/` run with zero database overhead.
- REST contract tests in `bruno/` assert API behavior end-to-end.
