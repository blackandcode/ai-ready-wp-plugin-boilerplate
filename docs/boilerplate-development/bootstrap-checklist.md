# Project Bootstrap Checklist

This checklist defines the pre-flight verification items for bootstrapping a fresh development environment on WSL2/Linux.

---

## 1. Host Runtimes

- [x] Docker Desktop is running with the WSL2 backend and Ubuntu integration enabled.
- [x] Repository resides within the Linux filesystem (`/home/<user>/workspace/...`), not under `/mnt/c`.
- [x] Cursor or VS Code opens the WSL Linux directory directly over IPC.
- [x] Node.js satisfies `package.json` (`>=24.16.0`); npm 11 and Docker Compose v2+ / v5+ are verified.
- [x] Host PHP 8.3 CLI and Composer are installed and available.

---

## 2. Dependencies & Toolchains

- [x] Run `npm install` and verify `node_modules` exists.
- [x] Installed Playwright browser binaries via `npx playwright install chromium`.
- [x] Run `composer install` (or `composer update`) and verify `vendor/` exists.
- [x] Pre-flight verification succeeds: `npm run pre-check`.

---

## 3. Containerized Runtime (`wp-env`)

- [x] Local environment starts cleanly: `npm run env:start`.
- [x] WordPress 7.0 and PHP 8.3 running on `http://localhost:8888`.
- [x] Companion plugins active: MCP Adapter, OpenAI provider, Secure Custom Fields.
- [x] Lifecycle script `tools/wp-env/after-start.mjs` configures permalinks and test users.
- [x] Dedicated test user `airwp_api_test` created with Application Password synced to `.env`.

---

## 4. Testing Pyramid Verification

- [x] **Tier 1 (Static):** `composer lint`, `composer analyse`, and `npm run lint` pass.
- [x] **Tier 2 (PHPUnit):** `composer test` executes pure unit tests sub-millisecond.
- [x] **Tier 3 (Frontend):** `npm run test:unit` executes Jest and RTL tests with 0 failures.
- [x] **Tier 4 (REST):** `npm run test:rest` executes Bruno collections against running WordPress.
- [x] **Tier 5 (Playwright):** `npm run test:e2e` completes end-to-end tests and visual snapshot checks.
- [x] **Tooling:** `npm run test:versioning`, `npm run test:scaffold`, and `npm run test:env` pass.
