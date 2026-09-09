# Development Environment and Toolchain

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

## 2. Prerequisites & Engine Constraints

The environment enforces modern, pinned engine requirements defined in `package.json` and `composer.json`.

Before configuring your environment, run the pre-flight verification script to check your local system:

```bash
npm run pre-check
```

For complete OS-specific setup guides across macOS, native Windows, WSL2, and Linux, refer to the dedicated [Development Prerequisites Guide](development-prerequisites.md).

```bash
# Verify versions on host
node --version        # >= 24.16.0 (e.g., v24.18.1)
npm --version         # >= 11.0.1
php -v                # >= 8.3 (e.g., PHP 8.3.33 CLI)
composer --version    # >= 2.7.0
docker version        # Docker Desktop with WSL2 engine active
docker compose version # Docker Compose v2+ or v5+
```

### Checking Docker WSL Integration

In Windows Docker Desktop:

1. Open **Settings > General > Use the WSL 2 based engine** (Checked).
2. Open **Settings > Resources > WSL Integration > Enable integration with additional distros** (Check your Ubuntu distribution).
3. Verify in Ubuntu terminal: `docker ps`. If it returns a running daemon without permission errors, Docker is operational.

---

## 3. Containerized Runtime: `@wordpress/env`

`@wordpress/env` (`wp-env`) is WordPress's official Docker orchestration tool for local development and CI testing. It manages containerized WordPress, MariaDB, and CLI environments with zero manual web server configuration.

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

### Architectural Details of `.wp-env.json`

1. **`"core": null`:**
   - Configures `wp-env` to download and run the latest stable production release of WordPress without version limits.
   - Ensures latest core APIs (Block API v3, Interactivity API, Abilities API, AI Connectors) are active without legacy polyfills.
2. **`"phpVersion": "8.3"`:**
   - Forces PHP 8.3 across all WordPress and CLI containers.
3. **`"plugins": ["."]`:**
   - Mounts the current repository directly into `/var/www/html/wp-content/plugins/<plugin-slug>`.
   - Any local code edit is immediately reflected inside the container.
4. **`"testsEnvironment": false`:**
   - By default, `wp-env` creates a duplicate parallel test site on port 8889 and phpMyAdmin on 8890, causing port conflicts.
   - Setting `"testsEnvironment": false` prevents port clashes. For parallel trunk/regression tests, use a dedicated `.wp-env.test.json`.
5. **Debug Constants:**
   - `WP_DEBUG: true` and `SCRIPT_DEBUG: true` ensure PHP errors and unminified scripts load.
   - `WP_DEVELOPMENT_MODE: "plugin"` bypasses block and theme template caching during active development.
6. **`"lifecycleScripts": { "afterStart": ... }`:**
   - Executes an automated Node.js configuration script immediately after containers start or restart.

---

## 4. Automated Lifecycle Scripting (`tools/wp-env/after-start.mjs`)

Coding agents and developers must never manually configure WordPress settings via the admin dashboard. Manual clicks are error-prone and non-repeatable.

The `tools/wp-env/after-start.mjs` script runs automatically after `wp-env start` to guarantee an identical, deterministic environment on every boot.

### Responsibilities of `after-start.mjs`

1. **Activate Theme & Core Options:**
   - Activates a modern block theme (e.g. `twentytwentyfive`).
   - Sets blog title and development options.
2. **Activate Plugin & Companions:**
   - Ensures the root plugin (`ai-ready-wp-plugin-boilerplate`) and all companion plugins are active.
   - Features dynamic plugin name resolution if directory name differs from slug.
3. **Configure Pretty Permalinks:**
   - Sets rewrite structure to `/%postname%/` and executes a hard rewrite flush (`wp rewrite flush --hard`). Essential for WordPress REST API routes to function without `?rest_route=`.
4. **Reset Administrator Password:**
   - Enforces default credentials (`admin` / `password`) for local testing.
5. **Automate REST API Test User & Application Passwords:**
   - Checks if dedicated test user `airwp_api_test` exists; creates it if missing.
   - Generates a fresh WordPress **Application Password** named `bruno-test`.
   - **Extracts the clean password and automatically updates the host `.env` file** (`BRUNO_APPLICATION_PASSWORD=<password>`).
   - This enables Bruno CLI and Playwright tests to execute immediately with zero manual credential copying.

---

## 5. Environment Command Catalog

| Command | Action |
| --- | --- |
| `npm run pre-check` | Analyzes host runtimes, Docker daemon, Compose v2/v5, PHP, Composer, and ports to ensure environment readiness. |
| `npm run env:start` | Boots Docker containers (`@wordpress/env start`) and runs `afterStart` lifecycle script. |
| `npm run env:stop` | Suspends containers while preserving database and file state. |
| `npm run env:reset` | Resets WordPress database and options to clean state, re-running lifecycle setup. |
| `npm run env:clean` | Deletes generated environment files, caches, and test artifacts. |
| `npm run env:destroy` | Fully removes all Docker containers, networks, and volumes for this project. |
| `npm run env:logs` | Streams real-time Docker container logs. |
| `npm run env:cli -- <command>` | Executes arbitrary WP-CLI commands inside the containerized environment. |

---

## 6. WordPress Playground & Sandbox Testing

In addition to Docker-based `wp-env`, the boilerplate ships with a declarative [blueprint.json](../../blueprint.json) for zero-install WordPress Playground testing:

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/admin.php?page=ai-ready-wp-settings",
  "preferredVersions": {
    "php": "8.3",
    "wp": "7.0"
  },
  "phpExtensionHeaders": {
    "show": true
  },
  "features": {
    "networking": true
  },
  "steps": [
    {
      "step": "login",
      "username": "admin",
      "password": "password"
    },
    {
      "step": "activateTheme",
      "themeFolderName": "twentytwentyfive"
    },
    {
      "step": "setSiteOptions",
      "options": {
        "blogname": "WordPress AI Plugin Sandbox"
      }
    }
  ]
}
```

This allows instant testing of the plugin directly inside WebAssembly-powered WordPress Playground in any browser.
