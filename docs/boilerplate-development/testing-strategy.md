# Testing Strategy and Test Harnesses

A robust plugin demands a multi-layered testing pyramid. Tests serve as executable contracts, preventing regressions and giving coding agents immediate feedback.

This guide details the **5-Tier Testing Pyramid** implemented in the **WordPress AI Plugin Development Boilerplate**.

---

## 1. The 5-Tier Testing Pyramid

```mermaid
flowchart TD
    subgraph Pyramid ["The 5-Tier Testing Pyramid"]
        T5["Tier 5: Playwright Browser & Visual Regression (Real Browser)"]
        T4["Tier 4: Bruno REST API E2E Contracts (HTTP Client)"]
        T3["Tier 3: Jest & React Testing Library (Frontend Unit)"]
        T2["Tier 2: PHPUnit Unit & Integration (PHP Domain & WP APIs)"]
        T1["Tier 1: Static Quality Analysis (PHPCS, PHPStan, Linters)"]
    end

    T1 --> T2 --> T3 --> T4 --> T5
```

| Tier | Category | Focus Area | Runtime / Runner |
| --- | --- | --- | --- |
| **Tier 1** | Static Quality | Code formatting, type safety, Markdown syntax | PHPCS (WPCS), PHPStan Level 6, ESLint, Stylelint, Markdownlint |
| **Tier 2** | PHP Unit & Integration | Domain invariants, Value Objects, Aggregates, Event Dispatcher, WP APIs | PHPUnit 11 inside WSL / wp-env container |
| **Tier 3** | Frontend Unit | React components, API hooks, Gutenberg block directives | Jest + `@testing-library/react` via `@wordpress/scripts` |
| **Tier 4** | REST Contract E2E | Black-box HTTP validation, error codes, auth | Bruno CLI (`@usebruno/cli`) with Application Passwords |
| **Tier 5** | Browser & Visual E2E | User journeys, admin settings, keyboard accessibility, snapshots | Playwright Test with Chromium & visual diffing |

---

## 2. Tier 1: Static Quality Analysis

Static quality gates run before any code is executed or built:

```bash
# PHP Coding Standards (WordPress-Core, Extra, Docs)
composer lint
composer lint:fix    # auto-fixes formatting

# PHPStan Static Analysis (Level 6+)
composer analyse

# JavaScript, CSS, and Markdown linting
npm run lint:js      # wp-scripts lint-js
npm run lint:css     # wp-scripts lint-style
npm run lint:md      # markdownlint-cli2
```

---

## 3. Tier 2: PHPUnit Unit and Integration Testing

Test suites are separated in `phpunit.xml.dist` into two distinct directories:

### 3.1 PHPUnit Unit Tests (`tests/phpunit/unit/`)

- **Characteristics:** Fast, in-memory, pure PHP execution.
- **Scope:** Value objects (`GreetingMessageTest`, `CacheTtlTest`, `DataRetentionPolicyTest`), aggregate roots (`PluginSettingsTest`), domain events, application services (`SettingsApplicationServiceTest`), event dispatching (`EventDispatcherTest`), and caching utilities (`TransientCacheTest`).
- **Rule:** **Zero** WordPress functions or database access. Must run in sub-milliseconds without `wp-env`.

```php
// tests/phpunit/unit/Settings/Domain/GreetingMessageTest.php
use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\GreetingMessage;
use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidGreetingMessageException;

final class GreetingMessageTest extends TestCase {
    public function test_accepts_valid_trimmed_message(): void {
        $message = new GreetingMessage( '  Hello World  ' );
        $this->assertSame( 'Hello World', $message->value() );
    }

    public function test_throws_exception_on_empty_message(): void {
        $this->expectException( InvalidGreetingMessageException::class );
        new GreetingMessage( '   ' );
    }
}
```

Execution:

```bash
vendor/bin/phpunit
# or
composer test
```

### 3.2 PHPUnit Integration Tests (`tests/phpunit/integration/`)

- **Characteristics:** Runs with WordPress core loaded (`WP_UnitTestCase`).
- **Scope:** Custom post types, options API persistence, transient caching, capability checks.
- **Execution:** Run inside the container using `wp-env`:

  ```bash
  npx wp-env run cli --env-cwd=wp-content/plugins/ai-ready-wp-plugin-boilerplate vendor/bin/phpunit
  ```

---

## 4. Tier 3: JavaScript and React Unit Testing

Frontend unit tests verify isolated UI components, custom hooks, and Gutenberg block `save` directives using **Jest** and **React Testing Library**:

- **Configuration:** `jest.config.js` extends `@wordpress/scripts/config/jest-unit.config`.
- **Environment:** Node with JSDOM and `@testing-library/jest-dom`.
- **Execution:**

  ```bash
  npm run test:unit
  ```

```tsx
// tests/js/blocks/hello-world/save.test.tsx
import { render } from '@testing-library/react';
import Save from '../../../../blocks/hello-world/save';

test('renders block container with interactivity attributes', () => {
  const attributes = {
    message: 'Hello World',
    showLikes: true,
    initialLikes: 5,
  };

  const { container } = render(<Save attributes={attributes} />);
  const wrapper = container.querySelector('.wp-block-ai-ready-wp-hello-world');

  expect(wrapper).toHaveAttribute('data-wp-interactive', 'ai-ready-wp/hello-world');
  expect(wrapper).toHaveAttribute('data-wp-context');
});
```

---

## 5. Tier 4: Bruno REST API E2E Testing

Black-box contract testing treats the running WordPress instance as an external API server:

- **Runner:** `tools/rest-tests/run-rest-tests.mjs` executing Git-native `.bru` requests in `tests/bruno/`.
- **Authentication:** Automated WordPress Application Passwords auto-provisioned by `tools/wp-env/after-start.mjs`.
- **Execution:**

  ```bash
  npm run test:rest
  ```

- **Assertions:**
  - Status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`).
  - Strict JSON schema matching.
  - Verification of settings updates and error mapping.

---

## 6. Tier 5: Playwright Browser & Visual Regression Testing

Playwright tests the complete user journey inside headless Chromium:

### 6.1 Authentication Setup (`auth.setup.ts`)

Playwright logs into WordPress once via `tests/e2e/playwright/setup/auth.setup.ts`, saving browser cookies and local storage to `tests/e2e/playwright/.auth/admin.json`. All subsequent specs reuse this session, avoiding repeated login page overhead.

### 6.2 Deterministic Readiness Markers

Never use arbitrary delays (`await page.waitForTimeout(3000)`). The React apps render explicit DOM state attributes:

```tsx
<div
  id="airwp-settings-app"
  className="airwp-admin-wrap"
  data-airwp-app-state={isLoading ? 'loading' : 'ready'}
/>
```

Playwright specs wait deterministically:

```typescript
await page.waitForSelector('[data-airwp-app-state="ready"]');
```

### 6.3 Visual Regression Snapshots

Playwright captures pixel-level screenshots of key application views, comparing them against approved baseline images in `tests/e2e/playwright/__screenshots__/`:

```typescript
test('renders settings admin shell correctly', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=ai-ready-wp-settings');
  await page.waitForSelector('[data-airwp-app-state="ready"]');

  await expect(page.locator('#airwp-settings-app')).toHaveScreenshot('settings-app.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

### 6.4 Playwright Execution Commands

```bash
# Run headless browser test suite
npm run test:e2e

# Run with interactive Playwright UI for debugging
npm run test:e2e:ui

# Update visual baseline snapshots after intentional UI changes
npm run test:e2e:update
```

---

## 7. The Full Quality Gate Pipeline

Before merging code or closing an implementation phase, execute the full pipeline:

```bash
# 1. Static Checks
composer lint && composer analyse && npm run lint

# 2. Unit Suites
npm run test:unit && composer test

# 3. Integration & Contract Suites
npm run test:rest

# 4. End-to-End & Visual Suites
npm run test:e2e

# 5. Versioning & Environment Suites
npm run test:versioning && npm run test:env
```
