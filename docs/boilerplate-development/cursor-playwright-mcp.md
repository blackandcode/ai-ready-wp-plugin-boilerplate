# Cursor, Playwright CLI, and Playwright MCP

This document details the distinct roles of the **Playwright Test CLI** versus the **Playwright MCP** server within Cursor, along with visual regression policies on WSL2.

---

## 1. Distinct Roles

- **Playwright Test CLI:** The committed, deterministic test runner for functional browser end-to-end tests and visual regression. Runs in CI/CD and terminal suites.
- **Playwright MCP:** An interactive development aid for Cursor. It helps coding agents inspect the running `wp-env` site, reproduce issues interactively, and develop selectors, but it never replaces committed tests.

---

## 2. Local CLI Installation & Setup

The project installs `@playwright/test` as a development dependency:

```bash
npm install
npx playwright install --with-deps chromium
npx playwright test --list
```

Chromium is the required baseline browser. Visual baselines use this pinned browser profile.

---

## 3. Visual Regression Policy

- **Environment Baseline:** Baselines are produced on the documented WSL2 / Docker / Chromium profile.
- **Deterministic Wait:** Wait for a plugin-emitted readiness marker (`data-airwp-app-state="ready"`), never arbitrary timeouts.
- **Dynamic Data Masking:** Mask timestamps, nonce values, user avatars, and other non-deterministic regions.
- **Snapshot Updates:** Updating snapshots requires an explicit command (`npm run test:e2e:update`) and review of the visual diff.

---

## 4. Authentication Strategy

Playwright logs into WordPress once via `tests/e2e/playwright/setup/auth.setup.ts` and saves `storageState` to `.auth/admin.json`. All functional test specs reuse this session to bypass repeated login page loading overhead.

---

## 5. MCP-to-Test Workflow

1. Reproduce or explore interactive features with browser tools or Playwright MCP.
2. Identify semantic roles (`getByRole`) or stable attributes.
3. Add a Playwright test specification in `tests/e2e/playwright/`.
4. Run headless tests: `npm run test:e2e`.
5. Capture or update baseline snapshots when UI intentionally changes: `npm run test:e2e:update`.
