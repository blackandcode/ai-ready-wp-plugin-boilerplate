# Project Bootstrap Checklist

This checklist defines the pre-flight verification items for bootstrapping a fresh development environment on WSL2/Linux.

---

## 1. Host Runtimes

- [ ] Docker Desktop is running with the WSL2 backend and Ubuntu integration enabled.
- [ ] Repository resides within the Linux filesystem (`/home/<user>/workspace/...`), not under `/mnt/c`.
- [ ] Cursor or VS Code opens the WSL Linux directory directly over IPC.
- [ ] Node.js satisfies `package.json` (`>=24.16.0`); npm 11 and Docker Compose v2+ / v5+ are verified.
- [ ] Host PHP 8.3 CLI and Composer are installed and available.

---

## 2. Dependencies & Toolchains

- [ ] Run `npm install` and verify `node_modules` exists.
- [ ] Install Playwright browser binaries via `npx playwright install chromium`.
- [ ] Run `composer install` and verify `vendor/` exists.
- [ ] Pre-flight verification succeeds: `npm run pre-check`.

---

## 3. Containerized Runtime (`wp-env`)

- [ ] Local environment starts cleanly: `npm run env:start`.
- [ ] Latest WordPress and PHP 8.3 running on `http://localhost:8888`.
- [ ] Companion plugins active: MCP Adapter, OpenAI provider, Secure Custom Fields.
- [ ] Lifecycle script `tools/wp-env/after-start.mjs` configures permalinks and test users.
- [ ] Dedicated test user `airwp_api_test` created with Application Password synced to `.env`.

---

## 4. Testing Pyramid Verification

- [ ] **Tier 1 (Static):** `composer lint`, `composer analyse`, and `npm run lint` pass.
- [ ] **Tier 2 (PHPUnit):** `composer test` executes pure unit tests sub-millisecond.
- [ ] **Tier 3 (Frontend):** `npm run test:unit` executes Jest and RTL tests with 0 failures.
- [ ] **Tier 4 (REST):** `npm run test:rest` executes Bruno collections against running WordPress.
- [ ] **Tier 5 (Playwright):** `npm run test:e2e` completes end-to-end tests and visual snapshot checks.
- [ ] **Tooling & Release:** `npm test` executes all unit, scaffolding, versioning, environment, and release test suites.
- [ ] **OpenAPI Drift:** `npm run openapi:check` confirms `docs/api/openapi.yaml` matches registered REST routes.
