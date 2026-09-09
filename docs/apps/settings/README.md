# Settings App Technical Documentation

This directory contains technical documentation for the **Settings App**, the primary administrative configuration module in the boilerplate.

Governed by **ADR-0005: WPDS Admin Card & Sidebar Architecture**, **ADR-0007**, **ADR-0008**, and **ADR-0009**.

---

## 1. Scope & Implementation Locations

The Settings App spans all three tiers of the Tripartite Architecture:

- **Backend Headless Domain (`src/backend/Apps/Settings/`):**
  - `Domain/`: Value Objects (`GreetingMessage`, `FeatureFlag`, `Description`, `RestDebug`, `CacheTtl`, `DataRetentionPolicy`), Aggregate Root (`PluginSettings`), Events (`SettingsUpdatedEvent`, `RetentionPolicyChangedEvent`), Exceptions, Repository Interface (`SettingsRepositoryInterface`).
  - `Application/`: `SettingsApplicationService`, Commands (`UpdateSettingsCommand`), Queries (`GetSettingsQuery`), DTOs (`SettingsDTO`).
  - `Infrastructure/`: `WordPressSettingsRepository` (persisting to `wp_options` with `autoload=false`), `SettingsSchema`.
  - `Rest/`: `SettingsController` exposing authenticated `/ai-ready-wp/v1/settings` endpoints.
  - `Cli/`: `SettingsCliCommand` (`wp ai-ready settings-get`, `wp ai-ready settings-update`).
  - `Abilities/`: `SettingsAbilities` registering capabilities with the WordPress Abilities API.
  - `SettingsBackendServiceProvider.php`: Service provider booting settings services.

- **Frontend React 18 Application (`src/frontend/apps/settings/`):**
  - `react/index.tsx`: Webpack entrypoint mounting React container to `#airwp-settings-root`.
  - `react/App.tsx`: Main orchestrator managing data loading, tab switching, and notice banners.
  - `react/components/`: `SettingsShell.tsx`, `GeneralSection.tsx`, `AdvancedSection.tsx`, `DiagnosticsSection.tsx`, `StatusBadge.tsx`.
  - `react/styles/settings.css`: Scoped CSS following WPDS layout guidelines.
  - `templates/admin-settings-root.php`: Minimal HTML mount template.

- **Frontend Presentation Bridge (`src/frontend/Bridge/Settings/`):**
  - `SettingsAdminMenu.php`: Registers top-level `AI-Ready WP` menu and settings submenu.
  - `SettingsAssets.php`: Enqueues scripts, styles, and localized bootstrap JSON.
  - `SettingsRoute.php`: Screen matching and menu constants.
  - `SettingsBootstrapData.php`: Assembles bootstrap payload for initial client render.

---

## 2. Technical Documents

- [technical-spec.md](technical-spec.md): Complete class architecture, domain models, state management, and UI component hierarchy.
- [rest-api-contracts.md](rest-api-contracts.md): REST endpoint contracts, JSON schemas, permission rules, and example payloads.

---

## 3. Coding Agent Guidance

1. **State Reducer Immutability:** Form state in `useSettingsForm` must be modified only via explicit dispatched actions (`SET_FIELD`, `RESET_FORM`, `LOAD_SETTINGS`).
2. **Autoload Policy:** The repository persists settings under the `airwp_settings` option with `autoload = false` to prevent polluting global WordPress autoload caches.
3. **Rest Boundary:** Never fetch settings directly in PHP templates. The React app reads initial bootstrap data and manages all subsequent updates via `SettingsApiClient`.
