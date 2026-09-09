# Developer Tools App Technical Documentation

This directory contains technical documentation for the **Developer Tools App**, providing runtime development utilities, live OpenAPI contract inspection, and administrative API explorer tooling.

Governed by **ADR-0011: Generated OpenAPI 3.1 Specification from WordPress REST Controllers** and **ADR-0009**.

---

## 1. Scope & Implementation Locations

- **Backend Development Services (`src/backend/Apps/Developer/`):**
  - `DeveloperBackendServiceProvider.php`: Service provider conditionally registered in development environments.
  - `Rest/DevOpenApiController.php`: Dedicated development REST controller exposing live generated OpenAPI 3.1 contract JSON.

- **Frontend Integration:**
  - Integrated into the Settings React application as a lazy-loaded **API Reference** tab, visualizing endpoints directly within WordPress admin.

---

## 2. Technical Documents

- [technical-spec.md](technical-spec.md): Development mode gating (`wp_is_development_mode('plugin')`), live route specification, security authorization, and admin viewer integration.

---

## 3. Coding Agent Guidance

1. **Strict Development Isolation:** The entire `ai-ready-wp-dev/v1` namespace and the in-admin API Reference viewer must never be accessible unless `wp_is_development_mode('plugin')` returns `true`.
2. **Production Safety:** Code in this app must never be invoked during standard production requests.
3. **Admin Capability:** Accessing `GET /wp-json/ai-ready-wp-dev/v1/openapi` requires `manage_options` capability.
