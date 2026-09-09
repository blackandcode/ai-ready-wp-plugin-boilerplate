# WordPress-specific troubleshooting

## `Not logged in`

Symptoms:

- `admin.visitAdminPage()` throws `Not logged in`
- navigation redirects to `wp-login.php`
- `#wpadminbar` is absent

Check:

1. The config has `use.storageState`.
2. Global setup runs before tests.
3. Global setup calls `requestUtils.setupRest()`.
4. `WP_BASE_URL`, `WP_USERNAME`, and `WP_PASSWORD` exist in the Playwright process.
5. The storage-state path used by global setup matches the config.
6. The test site uses standard WordPress login.

`requestUtils.login()` authenticates the API request context only. It does not apply cookies to an existing browser context.

## `SyntaxError: Unexpected token 'export'`

A packaging regression was reported for `@wordpress/e2e-test-utils-playwright` 1.48.0 in external projects.

Actions:

1. Inspect the installed version and lockfile.
2. Update to a current known-working release or pin to the last known-working release for the project.
3. Remove `node_modules` and reinstall from the lockfile.
4. Confirm the installed package contains compiled `build/` files.
5. Add a minimal import smoke test before debugging the WordPress site.

Do not work around a broken package by transpiling all of `node_modules` unless the project has a deliberate reason.

## `Failed to discover REST API endpoint`

The package discovers the REST root from the WordPress API link header and polls while the site starts.

Check:

- `WP_BASE_URL` points to the WordPress home URL.
- WordPress is fully ready, not only accepting TCP connections.
- a `HEAD` request to the home page includes the `https://api.w.org/` link relation
- a reverse proxy or security plugin is not stripping the link header
- the REST API is enabled
- the installation subdirectory is included
- `wp-env` is started before a custom global setup if the web-server readiness check is insufficient

For a custom environment, add a readiness endpoint or pre-test health check rather than an arbitrary sleep.

## REST nonce endpoint returns 404/400

The package requests:

```text
wp-admin/admin-ajax.php?action=rest-nonce
```

Possible causes:

- custom login or admin URL
- reverse-proxy rewrite
- external hosted test site restrictions
- disabled or protected `admin-ajax.php`
- SSO session not represented by standard WordPress cookies
- mismatched base URL or subdirectory

Use a local deterministic WordPress environment where possible. For an SSO-only deployment, implement a project-specific authentication setup and keep a small separate smoke suite for the real identity-provider integration.

## Plugin is not installed

`requestUtils.activatePlugin( 'slug' )` maps the human plugin name returned by the REST API to a slug.

Check:

- the plugin is mounted by `wp-env`
- the plugin header name is present
- the expected slug matches the plugin name mapping
- the plugin REST controller is available
- an MU plugin is not being treated as a normal plugin

Run a direct `/wp/v2/plugins` request through `requestUtils.rest()` to inspect the installed list.

## Theme is not installed

Do not copy Gutenberg's project-level global setup blindly. Gutenberg's own suite activates a specific test theme because that theme is mounted in its environment.

A plugin test suite should activate a theme only when:

- the feature depends on that theme
- the theme is declared in `.wp-env.json`
- the test restores or consistently controls the theme state

## Editor block cannot be found

Check the UI layer:

- block content: `editor.canvas`
- editor top bar, sidebar, publish panel: `page`

Then check:

- the block is registered
- the editor finished loading
- the locator uses the accessible block name
- the test is in post editor versus Site Editor as expected
- the block is not inside another nested iframe
- the WordPress/Gutenberg version changed the accessible name

Do not switch immediately to generated CSS selectors.

## Test passes alone but fails in the suite

Likely shared WordPress state.

Check:

- posts, pages, options, users, media, menus, templates, and preferences left behind
- plugin or theme state changed and not restored
- global shared record names
- multiple workers using one database
- tests that assume the default site state
- test ordering dependencies

Keep `workers: 1` until the suite has explicit isolation.

## Flaky after save or publish

Do not wait for a fixed timeout.

Use:

- `editor.publishPost()` or `editor.saveDraft()`
- WordPress success notice
- REST response completion
- persisted value after reload
- `expect.poll()` for server-side state when appropriate

## External requests fail in `wp-env`

The WordPress container may not have the same network access as the host. For tests involving third-party APIs:

- prefer local deterministic mocks or a test endpoint
- test plugin behavior for success, timeout, malformed response, and failure
- keep one optional integration smoke test for the real service
- configure proxy/network access explicitly when real outbound access is required

Do not make the entire E2E suite dependent on an external SaaS service.

## Console warnings and errors

The WordPress extended page fixture observes browser `warn` and `error` console messages and surfaces them in test output, with some known WordPress/browser warnings filtered.

Treat new console output as a regression signal. When a warning is expected, scope and document the exception rather than globally ignoring all console output.

## Subdirectory installations

The extended page fixture adjusts root-relative `page.goto()` calls so they resolve against the full configured base URL.

Still set `WP_BASE_URL` correctly and avoid manually concatenating URLs with assumptions about `/`.

## Version drift

The package documentation has historically contained stale version wording while the package continued to evolve.

When an API appears inconsistent:

1. inspect the installed type declarations
2. inspect the exact installed package source
3. check the current Gutenberg package source and issues
4. pin the dependency
5. update this skill when the project upgrades
