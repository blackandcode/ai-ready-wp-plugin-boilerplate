# 10 — Configuration Templates Reference

This chapter provides complete, parameterized configuration files ready to be copied into any new WordPress plugin repository.

Replace placeholders:
- `<plugin-slug>`: e.g., `diagram-flow`, `custom-checkout`
- `<vendor>/<plugin-slug>`: e.g., `acme/diagram-flow`
- `Vendor\\PluginName`: e.g., `Acme\\DiagramFlow`
- `<prefix>`: e.g., `df`, `mdm`, `cc`

---

## 1. `package.json`

```json
{
  "name": "<plugin-slug>",
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
    "wp:setup": "node tools/wp-env/after-start.mjs",
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "lint": "npm run lint:js && npm run lint:css && npm run lint:md",
    "lint:js": "wp-scripts lint-js assets/src",
    "lint:css": "wp-scripts lint-style 'assets/src/**/*.css'",
    "lint:md": "markdownlint-cli2 'docs/**/*.md' 'README.md' 'AGENTS.md'",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "wp-scripts test-unit-js --config=jest.config.js",
    "test:e2e": "set -a; . ./.env; set +a; playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:update": "playwright test --update-snapshots",
    "test:rest": "set -a; . ./.env; set +a; cd bruno && npx bru run --env Local --reporter-skip-headers Authorization Cookie X-WP-Nonce",
    "test:rest:html": "export $(cat .env | grep -v '^#' | xargs) && cd bruno && npx bru run --env Local --reporter-html reports/test-results.html --reporter-skip-headers Authorization Cookie X-WP-Nonce",
    "skills:sync": "node scripts/sync-agent-skills.mjs",
    "update-version": "node scripts/increase-plugin-version.mjs",
    "update-version:dry-run": "node scripts/increase-plugin-version.mjs --dry-run",
    "test:versioning": "node --test tests/node/versioning/*.test.mjs"
  },
  "devDependencies": {
    "@playwright/test": "1.62.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.0",
    "@usebruno/cli": "4.0.0",
    "@wordpress/env": "11.12.0",
    "@wordpress/scripts": "34.0.0",
    "markdownlint-cli2": "0.23.2",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "typescript": "6.0.3"
  },
  "dependencies": {
    "@wordpress/api-fetch": "7.0.0",
    "@wordpress/components": "30.0.0",
    "@wordpress/dataviews": "^17.3.0",
    "@wordpress/element": "6.0.0",
    "@wordpress/i18n": "6.0.0",
    "@wordpress/icons": "11.0.0"
  }
}
```

---

## 2. `composer.json`

```json
{
  "name": "<vendor>/<plugin-slug>",
  "description": "Production WordPress plugin built with the Agentic Boilerplate.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=8.3"
  },
  "autoload": {
    "psr-4": {
      "Vendor\\PluginName\\": "src/"
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
  "core": "WordPress/WordPress#7.0",
  "phpVersion": "8.3",
  "plugins": [
    "."
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

## 4. `tools/wp-env/after-start.mjs`

```javascript
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLUGIN_SLUG = '<plugin-slug>';
const TEST_USER = '<prefix>_api_test';

function wp(...args) {
  return execFileSync('npx', ['wp-env', 'run', 'cli', 'wp', ...args], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
}

function wpInherit(...args) {
  execFileSync('npx', ['wp-env', 'run', 'cli', 'wp', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function updateDotEnvPassword(password) {
  const envPath = resolve(process.cwd(), '.env');
  try {
    let envContent = readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
      /^BRUNO_APPLICATION_PASSWORD=.*$/m,
      `BRUNO_APPLICATION_PASSWORD=${password}`
    );
    writeFileSync(envPath, envContent, 'utf-8');
    console.log('Synchronized .env with fresh BRUNO_APPLICATION_PASSWORD.');
  } catch (err) {
    console.warn('Notice: .env file not found or failed to update:', err.message);
  }
}

// 1. Theme activation
wpInherit('theme', 'activate', 'twentytwentyfive');

// 2. Plugin activation
wpInherit('plugin', 'activate', PLUGIN_SLUG);

// 3. Rewrites
wpInherit('rewrite', 'structure', '/%postname%/', '--hard');
wpInherit('rewrite', 'flush', '--hard');

// 4. Admin credentials
try {
  wpInherit('user', 'update', 'admin', '--user_pass=password');
} catch (e) {
  // admin user might not exist yet on fresh init
}

// 5. Bruno API test user
try {
  wp('user', 'get', TEST_USER, '--field=ID');
  console.log(`Test user ${TEST_USER} already exists.`);
} catch {
  console.log(`Creating test user ${TEST_USER}...`);
  wpInherit('user', 'create', TEST_USER, `${TEST_USER}@example.test`, '--role=administrator', '--user_pass=testpass');
}

// 6. Application Password for Bruno
try {
  try {
    wp('user', 'application-password', 'delete', TEST_USER, 'bruno-test');
  } catch (e) {
    // ignore
  }
  const appPassOutput = wp('user', 'application-password', 'create', TEST_USER, 'bruno-test');
  const match = appPassOutput.match(/Password:\s*([A-Za-z0-9\s]+)/);
  if (match && match[1]) {
    const cleanPassword = match[1].replace(/\s+/g, '');
    updateDotEnvPassword(cleanPassword);
  }
} catch (err) {
  console.error('Failed to configure application password:', err.message);
}

console.log('Environment setup and credential synchronization complete.');
```

---

## 5. `phpcs.xml.dist`

```xml
<?xml version="1.0"?>
<ruleset name="PluginCodingStandards">
    <description>PHPCS ruleset for WordPress plugin.</description>

    <file>src/</file>
    <file><plugin-slug>.php</file>
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

    <!-- Allow PSR-4 class filenames in modern src/ -->
    <rule ref="WordPress.Files.FileName">
        <exclude-pattern>src/*</exclude-pattern>
    </rule>

    <config name="text_domain" value="<plugin-slug>"/>
    <config name="minimum_supported_wp_version" value="7.0"/>
</ruleset>
```

---

## 6. `phpstan.neon.dist`

```neon
includes:
    - vendor/szepeviktor/phpstan-wordpress/extension.neon

parameters:
    level: 6
    paths:
        - src
        - <plugin-slug>.php
    bootstrapFiles:
        - <plugin-slug>.php
    scanFiles:
        - vendor/php-stubs/wordpress-stubs/wordpress-stubs.php
        - vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php
```

---

## 7. `phpunit.xml.dist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/11.5/phpunit.xsd"
    bootstrap="tests/phpunit/bootstrap.php"
    colors="true"
    cacheDirectory=".phpunit.cache"
>
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">tests/phpunit/unit</directory>
        </testsuite>
        <testsuite name="Integration">
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

## 8. `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.WP_BASE_URL ?? 'http://localhost:8888';

export default defineConfig({
  testDir: './tests/e2e/playwright',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.01,
    },
  },
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/playwright/e2e.xml' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'Europe/Belgrade',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
  outputDir: 'test-results/playwright',
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
});
```

---

## 9. `tests/e2e/playwright/setup/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const authFile = '.auth/admin.json';

setup('authenticate WordPress administrator', async ({ page }) => {
  await mkdir('.auth', { recursive: true });
  await page.goto('/wp-login.php');
  await page.getByLabel(/username|email address/i).fill(
    process.env.WP_ADMIN_USER ?? 'admin'
  );
  await page.locator('#user_pass').fill(
    process.env.WP_ADMIN_PASSWORD ?? 'password'
  );
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/wp-admin\//);
  await page.context().storageState({ path: authFile });
});
```

---

## 10. `webpack.config.js`

```javascript
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
  ...defaultConfig,
  entry: {
    ...defaultConfig.entry(),
    'admin/library/index': './assets/src/apps/library/index.tsx',
    'admin/settings/index': './assets/src/apps/settings/index.tsx',
  },
  output: {
    ...defaultConfig.output,
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },
};
```

---

## 11. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "assets/src/**/*",
    "tests/e2e/playwright/**/*",
    "tests/js/**/*"
  ]
}
```

---

## 12. `.env.example`

```dotenv
# Browser and REST test target
WP_BASE_URL=http://localhost:8888
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=password

# Bruno CLI: auto-populated by tools/wp-env/after-start.mjs
BRUNO_BASE_URL=http://localhost:8888
BRUNO_USERNAME=<prefix>_api_test
BRUNO_APPLICATION_PASSWORD=

# Optional legacy fallback for version synchronization (CLI arguments preferred: npm run update-version:patch)
# TARGET_VERSION=1.0.0
# TARGET_VERSION_DATE=2026-08-01
# TARGET_VERSION_CHANGELOG=Initial release of plugin kernel, REST contracts, and admin UI.
# TARGET_VERSION_DECISION=Baseline release approved following Phase 00 and 01 completion.
```
