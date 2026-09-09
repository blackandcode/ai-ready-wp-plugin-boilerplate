# Diagnostics Functional Specification

This document defines the functional requirements, user stories, telemetry reporting behavior, CLI commands, and AI agent capabilities for the Diagnostics subsystem.

---

## 1. User Stories

1. **Admin Health Overview:** As an administrator, I want to inspect my site's PHP version, WordPress version, database health, and REST API availability from the Settings page.
2. **CLI System Doctor:** As a DevOps engineer or system administrator, I want to run `wp ai-ready doctor` in the terminal to inspect system compatibility quickly without opening a web browser.
3. **AI Agent Verification:** As an autonomous AI agent, I want to query the plugin's registered abilities via the WordPress Abilities API to verify site health before executing complex mutations.

---

## 2. Telemetry Reporting Requirements

The diagnostics subsystem inspects and reports:

- **Host Runtimes:** Active PHP CLI/FPM version (verifies `>=8.3.0`), memory limit, and execution limits.
- **WordPress Core:** WordPress version (verifies `>=7.0.0`), multisite status, active theme, and companion plugins.
- **Database Status:** MariaDB/MySQL server version, database connection state, table prefix verification.
- **REST API Health:** Endpoint availability and loopback request verification.
- **Permissions:** Filesystem writeability on uploads directory.

---

## 3. WP-CLI Command (`wp ai-ready doctor`)

- `wp ai-ready doctor`: Renders an ASCII table with status indicators (`OK`, `WARN`, `FAIL`).
- `wp ai-ready doctor --format=json`: Renders structured JSON for machine parsing.

---

## 4. AI Agent Abilities Integration

- Exposes `get_system_health` ability under the `ai-ready-wp/diagnostics` category.
- Allows AI coding agents (via MCP or REST) to query diagnostics securely using `manage_options` permissions.
