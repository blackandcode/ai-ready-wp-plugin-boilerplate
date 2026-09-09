# Diagnostics App Technical Documentation

This directory contains technical documentation for the **Diagnostics App**, which provides system health telemetry, environment checks, and AI agent diagnostic capabilities.

Governed by **ADR-0007** and **ADR-0009**.

---

## 1. Scope & Implementation Locations

- **Backend Headless Domain (`src/backend/Apps/Diagnostics/`):**
  - `Domain/`: `DiagnosticsProviderInterface`.
  - `Application/`: `DiagnosticsService`, `DiagnosticsDTO`.
  - `Infrastructure/`: `WordPressDiagnosticsProvider` (inspecting host PHP version, WordPress core version, database connection, REST API accessibility).
  - `Rest/`: `DiagnosticsController` exposing authenticated `GET /ai-ready-wp/v1/diagnostics`.
  - `Cli/`: `DiagnosticsCliCommand` implementing `wp ai-ready doctor`.
  - `Abilities/`: `DiagnosticsAbilities` registering diagnostics with the WordPress Abilities API.
  - `DiagnosticsBackendServiceProvider.php`: Boots diagnostics routes and CLI commands.

- **Frontend Integration:**
  - Integrated into the Settings React app as `DiagnosticsSection.tsx` (`src/frontend/apps/settings/react/components/DiagnosticsSection.tsx`), rendering live system health badges.

---

## 2. Technical Documents

- [technical-spec.md](technical-spec.md): Telemetry metrics schema, provider contract, `wp ai-ready doctor` CLI output formatting, and Abilities API registration.

---

## 3. Coding Agent Guidance

1. **Permission Invariant:** `GET /diagnostics` requires `manage_options` capability. Never expose system diagnostics publicly.
2. **Sanitize Host Info:** Never expose database passwords, secret keys, or internal private network IPs in diagnostics telemetry.
3. **Graceful Failures:** If a diagnostic check fails (e.g. database ping times out), report the status as `'unhealthy'` inside the DTO rather than throwing an unhandled fatal error.
