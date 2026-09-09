# Diagnostics App Technical Specification

This document details the telemetry metrics schema, provider interface, REST controller, CLI command, and Abilities API registration for the Diagnostics App.

---

## 1. Diagnostics Provider Contract (`DiagnosticsProviderInterface`)

```php
namespace AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Domain;

interface DiagnosticsProviderInterface {
    /**
     * Retrieve system diagnostics telemetry as an associative array.
     *
     * @return array<string, mixed> Telemetry data.
     */
    public function get_diagnostics(): array;
}
```

### 1.1 Infrastructure Provider (`WordPressDiagnosticsProvider`)

Queries the WordPress host environment:

- PHP Version & Memory Limit.
- WordPress Core Version.
- MySQL / MariaDB Server Version.
- REST API availability.
- Write permissions on `wp-content/uploads/`.
- Active theme and plugin count.

---

## 2. Diagnostics REST API (`DiagnosticsController`)

- **Route:** `GET /ai-ready-wp/v1/diagnostics`
- **Permission Callback:** `current_user_can('manage_options')`
- **Response Format (`200 OK`):**

```json
{
  "system": {
    "php_version": "8.3.10",
    "wp_version": "7.1.0",
    "web_server": "nginx/1.25.4"
  },
  "database": {
    "server_version": "10.11.7-MariaDB",
    "prefix": "wp_",
    "connected": true
  },
  "plugin": {
    "version": "1.3.3",
    "active_apps": ["Settings", "Diagnostics", "HelloWorld", "Developer"]
  },
  "status": "healthy"
}
```

---

## 3. WP-CLI Command (`wp ai-ready doctor`)

`DiagnosticsCliCommand` formats telemetry data for terminal display:

```bash
# Output as formatted ASCII table
wp ai-ready doctor

# Output as raw JSON for machine parsing
wp ai-ready doctor --format=json
```

---

## 4. WordPress Abilities API (`DiagnosticsAbilities`)

Registers plugin diagnostic checks into the WordPress Abilities API:

- **Category:** `ai-ready-wp/diagnostics`
- **Ability Name:** `get_system_health`
- **Description:** "Inspects WordPress runtime environment, database connectivity, and plugin health."
- **Permission:** Checks `manage_options` capability.
