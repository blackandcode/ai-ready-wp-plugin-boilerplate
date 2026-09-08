---
name: wp-playwright
description: "Use when configuring, writing, reviewing, or debugging Playwright E2E tests for WordPress plugins, themes, wp-admin screens, the Block Editor, the Site Editor, and WordPress front-end flows—especially with @wordpress/e2e-test-utils-playwright, @wordpress/scripts, and wp-env. This skill adds WordPress-specific guidance and should be used alongside the existing playwright-best-practices skill for generic Playwright architecture, locators, assertions, debugging, accessibility, and CI."
compatibility: "WordPress 5.6+ according to the package documentation; optimized for current WordPress 7.x/Gutenberg projects. Requires a supported Node.js LTS release, @playwright/test, and a locked @wordpress/e2e-test-utils-playwright version."
metadata:
  author: WebFalcon
  version: "1.0.0"
  researched: "2026-08-01"
---

# WordPress Playwright

WordPress-specific instructions for reliable Playwright tests using `@wordpress/e2e-test-utils-playwright`.

## Scope and relationship to other skills

Use this skill for:

- WordPress test environment setup with `wp-env`
- authentication and persisted WordPress admin sessions
- WordPress-specific Playwright fixtures
- plugin activation and test-data setup through the REST API
- wp-admin settings and custom admin application flows
- Block Editor and Site Editor testing
- front-end verification of WordPress content
- WordPress-specific debugging and failure modes

Also load `playwright-best-practices` when available. That skill remains the source of truth for generic Playwright practices such as locator quality, assertions, waits, Page Objects, accessibility, visual testing, traces, retries, CI, and flake investigation.

Do not duplicate generic Playwright abstractions when the existing skill already covers them.

## Required project triage

Before changing tests, inspect:

1. `package.json` and the lockfile
2. installed versions of:
   - `@playwright/test`
   - `@wordpress/e2e-test-utils-playwright`
   - `@wordpress/scripts`
   - `@wordpress/env`
3. `playwright.config.*`
4. `.wp-env.json` or the alternative WordPress test environment
5. existing `specs/`, `tests/e2e/`, fixtures, global setup, and page objects
6. environment variables used in local development and CI
7. the plugin/theme slug, admin page slug, custom post types, REST routes, and block names being tested

Respect the repository's existing conventions. Do not replace a working custom setup merely to match an example.

## Core decision rules

### Use the WordPress extended test fixture

Prefer:

```ts
import {
	test,
	expect,
} from '@wordpress/e2e-test-utils-playwright';
```

This provides:

- `admin`
- `editor`
- `pageUtils`
- `requestUtils`
- normal Playwright fixtures such as `page`, `context`, and `browser`

Use plain `@playwright/test` only for infrastructure code that must construct the WordPress fixtures itself, such as a custom global setup.

### Separate WordPress page chrome from editor canvas

Use `page` for:

- wp-admin menus
- editor top bar
- editor settings sidebar
- publish panels
- plugin settings pages
- notices and modals outside the content canvas

Use `editor.canvas` for blocks and elements rendered inside the editor iframe:

```ts
const block = editor.canvas.getByRole( 'document', {
	name: /Block: Example/i,
} );
```

Do not query the editor iframe through brittle CSS selectors.

### Use REST for state; UI for behavior

Use `requestUtils` to create, update, or remove preconditions when the setup itself is not the behavior under test.

Examples:

- create posts and pages
- delete previous content
- activate or deactivate a plugin
- create users
- upload media
- update site settings
- set preferences
- call a plugin REST route

Use the UI only for the workflow being verified.

A test for a settings form should save through the UI. A block-rendering test may create the post through REST and verify the front end.

### Prefer WordPress helpers over reimplementing WordPress navigation

Use:

- `admin.visitAdminPage()`
- `admin.createNewPost()`
- `admin.editPost()`
- `admin.visitSiteEditor()`
- `editor.insertBlock()`
- `editor.setContent()`
- `editor.getBlocks()`
- `editor.publishPost()`
- `editor.saveDraft()`

Use raw Playwright actions where no suitable WordPress helper exists or where the helper would bypass the exact behavior under test.

### Keep tests isolated

WordPress E2E environments commonly share one database. The default WordPress Playwright configuration uses one worker.

Do not enable full parallelism unless each worker has an isolated WordPress site/database or the test data is proven independent.

Create unique records and clean them through `requestUtils`. Never depend on test execution order.

### Keep authentication explicit

`RequestUtils.login()` authenticates its API request context. It does not retroactively authenticate an already-created browser context.

Browser authentication requires a storage-state file generated before browser contexts are created and configured through Playwright's `use.storageState`.

Prefer the `@wordpress/scripts` Playwright base configuration because it already performs this setup. When using a custom configuration, provide an equivalent global setup.

## Recommended workflow

1. Define the user-visible WordPress behavior.
2. Decide whether each precondition belongs in REST setup or UI interaction.
3. Start from a known plugin/theme/content state.
4. Navigate with `admin` or create content with `requestUtils`.
5. Interact through accessible locators.
6. Use `editor.canvas` only for iframe canvas content.
7. Assert the persisted result, not only the click or transient notice.
8. Clean records that could affect another test.
9. Run the targeted test.
10. Run the suite, then repeat critical tests to check stability.

## Activity-based reference guide

| Activity | Reference |
|---|---|
| Install and configure the stack | [references/setup-and-configuration.md](references/setup-and-configuration.md) |
| Choose and use WordPress fixtures | [references/fixtures-and-apis.md](references/fixtures-and-apis.md) |
| Write admin, editor, and front-end tests | [references/test-patterns-and-examples.md](references/test-patterns-and-examples.md) |
| Diagnose WordPress-specific failures | [references/troubleshooting.md](references/troubleshooting.md) |
| Review research sources and version notes | [references/source-map.md](references/source-map.md) |

## Mandatory quality checks

Before completing WordPress E2E work:

- [ ] The test imports the WordPress extended `test` when WordPress fixtures are needed.
- [ ] Authentication is created before browser contexts and applied with `storageState`.
- [ ] `WP_BASE_URL` matches the actual WordPress installation, including any subdirectory.
- [ ] Test setup uses REST unless setup through UI is the behavior under test.
- [ ] Blocks are located through `editor.canvas`.
- [ ] Editor chrome is located through `page`.
- [ ] Accessible locators are preferred.
- [ ] There are explicit assertions for the persisted outcome.
- [ ] The test does not rely on execution order.
- [ ] Shared WordPress state is cleaned or uniquely namespaced.
- [ ] No arbitrary sleeps were added.
- [ ] The lockfile is committed.
- [ ] The targeted test and relevant suite pass.
- [ ] Critical flows are repeated to detect flakiness.

## Do not

- Do not expect `requestUtils.login()` alone to log in the browser.
- Do not hardcode WordPress authentication cookies.
- Do not put real production credentials into tests.
- Do not automate external SSO for every test when a safe local test-auth strategy can provide deterministic coverage.
- Do not use `.components-*`, generated class names, block client IDs, or DOM structure as the first locator choice.
- Do not use `page.locator()` for content inside the editor iframe when `editor.canvas` is appropriate.
- Do not create all data through wp-admin UI.
- Do not reset the whole WordPress database from every test.
- Do not activate a theme or plugin that is not mounted or installed.
- Do not update snapshots unless the product change is intentional and reviewed.
- Do not increase retries to hide a race condition.
