# Development Environment & Toolchain

This guide defines host requirements, containerized runtime orchestration via `@wordpress/env`, Docker Desktop integration on WSL2/Linux, and automated lifecycle scripting for the **WordPress AI Plugin Development Boilerplate**.

---

## 1. Host Architecture & Operating System

The primary development environment is built on **Linux (WSL2 Ubuntu)** with **Docker Desktop**:

- **Operating System:** Ubuntu 22.04 / 24.04 running under Windows Subsystem for Linux (WSL2), or native Linux.
- **Filesystem Location Rule:**
  - All project repositories **MUST** reside within the Linux root filesystem (e.g. `/home/<username>/workspace/wp-plugins-development/<plugin-slug>`).
  - **CRITICAL:** Never store or run projects under Windows mount paths (`/mnt/c/...`). Windows 9P filesystem mounts suffer from severe I/O degradation, broken `inotify` file watchers (which cripple Webpack and Playwright), and Unix file permission mismatches.
- **IDE Integration:**
  - Run Cursor or VS Code directly from within the WSL terminal:

    ```bash
    cd /home/black/workspace/wp-plugins-development/wordpress-ai-plugin-development-boilerplate
    cursor .
    ```

  - This connects the editor over IPC to the WSL Linux backend, ensuring terminal executions, Node processes, and file watchers execute in pure Linux.

---

## 2. Docker WSL2 Integration

In Windows Docker Desktop:

1. Open **Settings > General > Use the WSL 2 based engine** (Checked).
2. Open **Settings > Resources > WSL Integration > Enable integration with additional distros** (Check your Ubuntu distribution).
3. Verify in Ubuntu terminal: `docker ps`.

---

## 3. Containerized Runtime: `@wordpress/env`

`@wordpress/env` (`wp-env`) is WordPress's official Docker orchestration tool for local development.

### The `.wp-env.json` Specification

In your plugin root, `.wp-env.json` configures the runtime:

```json
{
  "$schema": "https://schemas.wp.org/trunk/wp-env.json",
  "core": null,
  "phpVersion": "8.3",
  "plugins": [
    ".",
    "https://github.com/WordPress/mcp-adapter/releases/latest/download/mcp-adapter.zip",
    "https://downloads.wordpress.org/plugin/ai-provider-for-openai.zip",
    "https://downloads.wordpress.org/plugin/secure-custom-fields.zip"
  ],
  "port": 8888,
  "testsEnvironment": false,
  "autoPort": false,
  "phpmyadmin": true,
  "phpmyadminPort": 8890,
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true,
    "WP_ENVIRONMENT_TYPE": "local",
    "WP_DEVELOPMENT_MODE": "plugin",
    "WP_AUTO_UPDATE_CORE": false
  },
  "lifecycleScripts": {
    "afterStart": "node tools/wp-env/after-start.mjs"
  }
}
```

### Architectural Key Points

1. **`"core": null`:** Downloads and runs latest stable production WordPress.
2. **`"phpVersion": "8.3"`:** Forces PHP 8.3 across all containers.
3. **`"plugins": ["."]`:** Mounts the current repository directly into `/var/www/html/wp-content/plugins/<plugin-slug>`.
4. **`WP_DEVELOPMENT_MODE: "plugin"`:** Bypasses template caching and enables `DevOpenApiController` route registration.
5. **`"lifecycleScripts": { "afterStart": ... }`:** Executes `tools/wp-env/after-start.mjs` automatically.

---

## 4. Automated Lifecycle Scripting (`tools/wp-env/after-start.mjs`)

The `tools/wp-env/after-start.mjs` script runs automatically after `wp-env start` to guarantee an identical, deterministic environment:

1. **Activates Theme & Core Options:** Activates `twentytwentyfive` block theme.
2. **Activates Plugin & Companions:** Activates `ai-ready-wp-plugin-boilerplate`, `mcp-adapter`, and companions.
3. **Configures Pretty Permalinks:** Sets rewrite structure to `/%postname%/` and executes `wp rewrite flush --hard`, necessary for REST API routes.
4. **Resets Administrator Credentials:** Enforces `admin` / `password`.
5. **Provisions Test User & Application Password:** Creates test user `airwp_api_test`, generates an Application Password named `bruno-test`, and automatically updates `.env` (`BRUNO_APPLICATION_PASSWORD=<password>`) for seamless Bruno and Playwright testing.

---

## 5. WordPress Playground (`blueprint.json`)

The boilerplate ships with a declarative `blueprint.json` for zero-install WordPress Playground in-browser testing:

- Boots WordPress in WebAssembly on PHP 8.3.
- Mounts plugin files and activates them.
- Directs landing page to `/wp-admin/admin.php?page=ai-ready-wp-settings`.
