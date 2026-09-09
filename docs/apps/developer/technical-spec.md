# Developer Tools App Technical Specification

This document details the software design, runtime environment gating, and API contract delivery of the Developer Tools App.

---

## 1. Architectural Motivation

In modern decoupled WordPress plugin development, developers and AI coding agents need immediate access to live REST schemas and interactive API explorers without relying on external SaaS tools or insecure public CDNs.

The Developer Tools App bridges this gap:

- Serves live, introspected OpenAPI 3.1 JSON generated directly from registered WordPress controllers.
- Strictly isolated to development environments to ensure zero production performance or security impact.

---

## 2. Environment Gating (`DeveloperBackendServiceProvider`)

`DeveloperBackendServiceProvider` registers routes strictly when plugin development mode is active:

```php
public function register_routes(): void {
    if ( ! function_exists( 'wp_is_development_mode' ) || ! wp_is_development_mode( 'plugin' ) ) {
        return;
    }

    $controller = new DevOpenApiController();
    $controller->register_routes();
}
```

In `.wp-env.json`, development mode is enabled via:

```json
{
  "config": {
    "WP_DEVELOPMENT_MODE": "plugin"
  }
}
```

In production or staging, `wp_is_development_mode('plugin')` returns `false`, causing the route registration to be skipped entirely.

---

## 3. Development REST Controller (`DevOpenApiController`)

- **Route:** `GET /ai-ready-wp-dev/v1/openapi`
- **Controller Class:** `AIReady\WPPluginBoilerplate\Backend\Apps\Developer\Rest\DevOpenApiController`
- **Permission Callback:**

  ```php
  public function check_permission( WP_REST_Request $request ): bool {
      return function_exists( 'wp_is_development_mode' )
          && wp_is_development_mode( 'plugin' )
          && current_user_can( 'manage_options' );
  }
  ```

- **Response Format:** Returns the full OpenAPI 3.1 document as dynamic JSON.

---

## 4. Frontend API Reference Viewer Integration

In `src/frontend/apps/settings/react/App.tsx`:

1. The bootstrap configuration (`window.airwpSettingsBootstrap.isDevMode`) informs the React container if development mode is active.
2. If active, an "API Reference" tab appears in the sidebar.
3. Clicking the tab lazily loads the API Reference component, which fetches `/ai-ready-wp-dev/v1/openapi` and renders interactive documentation.
