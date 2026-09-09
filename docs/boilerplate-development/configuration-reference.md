# Configuration Templates Reference

This chapter provides complete, parameterized configuration files ready to be referenced or copied into any WordPress plugin repository.

Replace placeholders:

- `<plugin-slug>`: e.g., `diagram-flow`, `custom-checkout`
- `<vendor>/<plugin-slug>`: e.g., `acme/diagram-flow`
- `Vendor\\PluginName`: e.g., `Acme\\DiagramFlow`
- `<prefix>`: e.g., `df`, `mdm`, `airwp`

---

## 1. `package.json`

```json
{
  "name": "ai-ready-wp-plugin-boilerplate",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=24.16.0",
    "npm": ">=11"
  },
  "scripts": {
    "env:start": "wp-env start",
    "env:stop": "wp-env stop",
    "env:destroy": "wp-env destroy",
    "env:clean": "wp-env clean all",
    "env:reset": "wp-env reset all",
    "env:logs": "wp-env logs",
    "env:cli": "wp-env run cli bash",
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "lint": "npm run lint:js && npm run lint:css && npm run lint:md",
    "lint:js": "wp-scripts lint-js src/frontend",
    "lint:css": "wp-scripts lint-style 'src/frontend/**/*.css'",
    "lint:md": "markdownlint-cli2 'docs/**/*.md' 'README.md' 'AGENTS.md'",
    "test": "npm run test:unit && npm run test:versioning && npm run test:scaffold && npm run test:env",
    "test:unit": "wp-scripts test-unit-js --config=jest.config.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:update": "playwright test --update-snapshots",
    "test:rest": "node tools/rest-tests/run-rest-tests.mjs",
    "update-version": "node tools/versioning/increase-plugin-version.mjs",
    "changelog:add": "node tools/changelog/record-unreleased-change.mjs"
  }
}
```

---

## 2. `composer.json`

```json
{
  "name": "ai-ready/ai-ready-wp-plugin-boilerplate",
  "description": "Production WordPress plugin built with the Agentic Boilerplate.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=8.3"
  },
  "autoload": {
    "psr-4": {
      "AIReady\\WPPluginBoilerplate\\Framework\\": "src/framework/",
      "AIReady\\WPPluginBoilerplate\\Backend\\": "src/backend/",
      "AIReady\\WPPluginBoilerplate\\Frontend\\": "src/frontend/Bridge/"
    }
  },
  "require-dev": {
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0.0",
    "wp-coding-standards/wpcs": "^3.1.0",
    "phpstan/phpstan": "^2.1.0",
    "szepeviktor/phpstan-wordpress": "^2.0.0",
    "phpunit/phpunit": "^11.5.0",
    "yoast/phpunit-polyfills": "^3.0.0",
    "php-stubs/wordpress-stubs": "^6.7",
    "php-stubs/wp-cli-stubs": "^2.12"
  },
  "config": {
    "allow-plugins": {
      "dealerdirect/phpcodesniffer-composer-installer": true
    }
  },
  "scripts": {
    "lint": "vendor/bin/phpcs",
    "lint:fix": "vendor/bin/phpcbf",
    "test": "vendor/bin/phpunit",
    "analyse": "vendor/bin/phpstan analyse"
  }
}
```

---

## 3. `.wp-env.json`

```json
{
  "$schema": "https://schemas.wp.org/trunk/wp-env.json",
  "core": null,
  "phpVersion": "8.3",
  "plugins": [
    ".",
    "https://github.com/WordPress/mcp-adapter/releases/latest/download/mcp-adapter.zip",
    "https://downloads.wordpress.org/plugin/ai-provider-for-openai.zip",
    "https://downloads.wordpress.org/plugin/secure-custom-fields.zip"
  ],
  "port": 8888,
  "testsEnvironment": false,
  "autoPort": false,
  "phpmyadmin": true,
  "phpmyadminPort": 8890,
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true,
    "WP_ENVIRONMENT_TYPE": "local",
    "WP_DEVELOPMENT_MODE": "plugin",
    "WP_AUTO_UPDATE_CORE": false
  },
  "lifecycleScripts": {
    "afterStart": "node tools/wp-env/after-start.mjs"
  }
}
```

---

## 4. `phpunit.xml.dist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/11.5/phpunit.xsd"
    bootstrap="tests/phpunit/bootstrap.php"
    colors="true"
    cacheDirectory="tests/.phpunit.cache"
    beStrictAboutTestsThatDoNotTestAnything="true"
    beStrictAboutOutputDuringTests="true"
    failOnRisky="true"
    failOnWarning="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory suffix="Test.php">tests/phpunit/unit</directory>
        </testsuite>
        <testsuite name="integration">
            <directory suffix="Test.php">tests/phpunit/integration</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory suffix=".php">src</directory>
        </include>
    </source>
</phpunit>
```

---

## 5. `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/e2e/playwright',
  timeout: 30000,
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: 'tests/playwright-report' }], ['list']],
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: './tests/e2e/playwright/.auth/admin.json',
  },
  outputDir: 'tests/test-results/playwright',
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

---

## 6. `blueprint.json` (WordPress Playground)

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/admin.php?page=ai-ready-wp-settings",
  "preferredVersions": {
    "php": "8.3",
    "wp": "latest"
  },
  "phpExtensionHeaders": {
    "show": true
  },
  "features": {
    "networking": true
  },
  "steps": [
    {
      "step": "login",
      "username": "admin",
      "password": "password"
    },
    {
      "step": "activateTheme",
      "themeFolderName": "twentytwentyfive"
    },
    {
      "step": "setSiteOptions",
      "options": {
        "blogname": "WordPress AI Plugin Sandbox"
      }
    }
  ]
}
```

---

## 7. `wp-cli.yml`

```yaml
apache:
  modules:
    - mod_rewrite
```

---

## 8. `.markdownlint-cli2.jsonc`

```jsonc
{
  "config": {
    "default": true,
    "MD013": false,
    "MD033": false,
    "MD060": false
  },
  "ignores": [
    "node_modules/**",
    "vendor/**",
    "build/**"
  ]
}
```
