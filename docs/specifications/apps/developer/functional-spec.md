# Developer Tools & API Reference Viewer Functional Specification

This document defines the functional requirements, user stories, development environment gating, and in-admin API Reference viewer behavior.

---

## 1. User Stories

1. **In-Admin API Exploration:** As a developer, I want to explore and test all plugin REST endpoints directly inside the WordPress admin Settings screen without leaving my site.
2. **Offline Self-Contained Documentation:** As a developer working offline or in air-gapped environments, I want the API documentation to be rendered locally without external CDN dependencies.
3. **Zero Production Leakage:** As a site owner, I want all developer tools, debug routes, and test endpoints to be completely disabled in staging and production environments.

---

## 2. Interactive API Reference Viewer

- **Location:** Dedicated "API Reference" tab inside the Settings React application (`/wp-admin/admin.php?page=ai-ready-wp-settings`).
- **Gating Invariant:** Only rendered when `wp_is_development_mode('plugin')` returns `true`.
- **Dynamic Loading:** The viewer component is code-split and loaded on demand when the developer clicks the tab.
- **Features:**
  - Displays all endpoints under `/ai-ready-wp/v1/`.
  - Shows request methods (`GET`, `POST`), URL parameters, and request body JSON schemas.
  - Lists response status codes (`200`, `400`, `401`, `403`) with example payloads.
  - Live reload capability fetching fresh contract data from `/wp-json/ai-ready-wp-dev/v1/openapi`.

---

## 3. Production Safety

- If `wp_is_development_mode('plugin')` is `false`:
  - The "API Reference" tab is omitted from the React sidebar.
  - The `GET /wp-json/ai-ready-wp-dev/v1/openapi` route is not registered.
  - Requests to the development namespace return a 404 Not Found from WordPress core.
