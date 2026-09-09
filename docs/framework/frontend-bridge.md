# Frontend Presentation Bridge (`src/frontend/Bridge/`)

This document details the architecture of the server-side presentation bridge under `src/frontend/Bridge/`, which manages WordPress UI lifecycle hooks, admin menus, asset enqueueing, and dynamic block/pattern registries.

Governed by **ADR-0008** and **ADR-0009**.

---

## 1. Architectural Role and Invariants

In the Tripartite App-Centric Architecture, presentation code is decoupled from headless backend logic:

- `src/backend/` contains **zero** presentation concerns (no `add_menu_page`, no `wp_enqueue_script`).
- `src/frontend/` contains all presentation code: React apps, blocks, patterns, templates, and the PHP presentation bridge.
- `src/frontend/Bridge/` isolates all PHP classes needed to bridge frontend assets into WordPress core.

```mermaid
flowchart TD
    subgraph WP [WordPress Core Lifecycle]
        InitHook["init hook"]
        AdminMenuHook["admin_menu hook"]
        EnqueueHook["admin_enqueue_scripts hook"]
    end

    subgraph Bridge [src/frontend/Bridge/ (PSR-4: Frontend\\)]
        FSP["FrontendServiceProvider"]
        BlockReg["BlockRegistry"]
        PatternReg["PatternRegistry"]
        SettingsMenu["SettingsAdminMenu"]
        SettingsAssets["SettingsAssets"]
        SettingsBootstrap["SettingsBootstrapData"]
    end

    subgraph Client [Browser Presentation]
        AdminReact["Settings React 18 App"]
        BlockHTML["Gutenberg Blocks & Patterns"]
    end

    FSP --> BlockReg
    FSP --> PatternReg
    FSP --> SettingsMenu
    FSP --> SettingsAssets

    InitHook --> BlockReg
    InitHook --> PatternReg
    AdminMenuHook --> SettingsMenu
    EnqueueHook --> SettingsAssets
    SettingsAssets --> SettingsBootstrap

    SettingsAssets -->|"enqueues build/admin/settings"| AdminReact
    BlockReg -->|"registers build/blocks/hello-world"| BlockHTML
```

---

## 2. Component Directory

### 2.1 `FrontendServiceProvider` (`src/frontend/Bridge/FrontendServiceProvider.php`)

The master presentation service provider booted by `Plugin::boot()`. It aggregates:

- `SettingsFrontendServiceProvider`: Manages admin menu registration and asset enqueueing.
- `BlockRegistry`: Scans and registers dynamic Gutenberg blocks.
- `PatternRegistry`: Discovers and registers block patterns.

### 2.2 `BlockRegistry` (`src/frontend/Bridge/Registry/BlockRegistry.php`)

Scans `src/frontend/apps/*/block.json` and registers discovered blocks via `register_block_type()` on the WordPress `init` hook:

- Automatic asset and script handle resolution from `block.json`.
- Eliminates manual `register_block_type` calls for every new block.

### 2.3 `PatternRegistry` (`src/frontend/Bridge/Registry/PatternRegistry.php`)

Discovers block patterns placed under `src/frontend/patterns/*.php` and registers them using `register_block_pattern()` on the WordPress `init` hook.

### 2.4 Settings UI Presentation Bridge

- **`SettingsAdminMenu`:** Registers top-level `AI-Ready WP` menu and submenu pages using `add_menu_page()` and `add_submenu_page()`. Renders the HTML mount root template.
- **`SettingsAssets`:** Checks if the current admin screen matches `SettingsRoute::is_settings_screen()`. If matched, enqueues compiled scripts from `build/admin/settings/`, localized translations, and inline bootstrap data.
- **`SettingsRoute`:** Centralizes menu slugs, screen IDs, and capability checks (`manage_options`).
- **`SettingsBootstrapData`:** Assembles the initial configuration JSON object injected via `wp_add_inline_script` (REST base URLs, nonces, user capabilities, plugin version).

---

## 3. Coding Agent Rules

1. **Keep Bridge in `src/frontend/Bridge/`:** Never place presentation PHP classes in the root of `src/frontend/` or in `src/backend/`.
2. **Never Call Backend Services Directly in Bridge Views:** The bridge must render minimal mount HTML (`<div id="airwp-settings-root"></div>`) and inject bootstrap metadata. All dynamic data fetching must be executed client-side via the REST API.
3. **Always Screen-Guard Assets:** Asset enqueuing must strictly verify `SettingsRoute::is_settings_screen()` before calling `wp_enqueue_script()` or `wp_enqueue_style()` to prevent asset leaking into unrelated admin screens.
