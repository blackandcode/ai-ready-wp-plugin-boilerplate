# Tier 5: Playwright Browser & Visual Regression Testing

This document details Tier 5 end-to-end browser testing and visual regression verification using **Playwright Test** under `tests/e2e/playwright/`.

---

## 1. Architectural Strategy

Playwright runs inside real headless Chromium, executing real user interactions in the WordPress admin:

- Verifies complete end-to-end user workflows (form filling, tab switching, saving, resetting).
- Verifies responsive layout and WordPress Design System (WPDS) visual integrity.
- Asserts keyboard navigation and accessible roles.
- Employs pixel-level visual regression snapshot testing.

---

## 2. Global Authentication Setup (`auth.setup.ts`)

To avoid logging in before every individual test, Playwright uses a global authentication dependency (`tests/e2e/playwright/setup/auth.setup.ts`):

1. Runs once before all test projects.
2. Navigates to `/wp-login.php` and signs in as `admin`.
3. Saves authenticated cookies and localStorage to `tests/e2e/playwright/.auth/admin.json`.
4. Subsequent test suites consume this `storageState`, immediately loading authenticated admin screens.

---

## 3. Page Object Model (POM)

All screen selectors, form field interactions, and tab switching actions are encapsulated in Page Object classes:

- `SettingsPage.ts` (`tests/e2e/playwright/pages/SettingsPage.ts`):
  - Encapsulates tab switching (`clickGeneralTab`, `clickAdvancedTab`, `clickDiagnosticsTab`).
  - Encapsulates input filling and save operations.
  - Waits for deterministic readiness attributes.

---

## 4. Deterministic Readiness & Visual Snapshots

### 4.1 Readiness Markers

Never use arbitrary delays (`page.waitForTimeout()`). The React application emits explicit DOM state attributes:

```html
<div id="airwp-settings-app" data-airwp-app-state="ready">...</div>
```

Playwright waits deterministically:

```typescript
await page.waitForSelector('[data-airwp-app-state="ready"]');
```

### 4.2 Visual Snapshot Testing

Playwright compares current rendering against baseline snapshots in `tests/e2e/playwright/__screenshots__/`:

```typescript
test('renders settings admin shell correctly', async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  await settingsPage.goto();

  await expect(page.locator('#airwp-settings-app')).toHaveScreenshot('settings-app.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

---

## 5. Execution Commands

```bash
# Run headless browser test suite
npm run test:e2e

# Run with interactive Playwright UI for visual debugging
npm run test:e2e:ui

# Update visual baseline snapshots after approved design changes
npm run test:e2e:update
```

---

## 6. Playwright CLI vs Cursor Playwright MCP

- **Playwright Test CLI (`npm run test:e2e`):** The authoritative, automated regression test suite executed in CI/CD and pre-release gates.
- **Cursor Playwright MCP:** An interactive runtime inspection tool used by AI coding agents to navigate pages, inspect elements, and debug selectors interactively without replacing committed tests.

---

## 7. Coding Agent Rules

1. **Wait for `data-airwp-app-state="ready"`:** Always wait for the container readiness marker before attempting clicks or capturing screenshots.
2. **Encapsulate in Page Objects:** When adding new test scenarios for admin screens, add methods to the corresponding Page Object in `tests/e2e/playwright/pages/` rather than inlining raw CSS selectors.
3. **Commit Updated Snapshots Responsibly:** Only update visual snapshots (`npm run test:e2e:update`) when an intentional visual modification has been made and verified.
