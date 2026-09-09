# ADR-0003: Gutenberg Block API v3 standard

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** WordPress Block Editor Working Group
- **Informed:** All Contributors

---

## Context

WordPress block development has evolved through multiple iterations (API v1, v2, and v3). Legacy block implementations frequently rely on deprecated JavaScript APIs, procedural PHP registration via `register_block_type` without JSON metadata, or outdated build tooling. This creates fragmentation, prevents server-side style optimization (such as Block Hooks and block-level asset enqueuing), and makes autonomous agent code generation error-prone.

We require a single, modern standard for all custom Gutenberg blocks developed within this boilerplate.

## Decision

We adopt **Gutenberg Block API Version 3 (`apiVersion: 3`)** with metadata-driven registration via `block.json` as the strict project standard.

All blocks must:

1. Reside in isolated subdirectories under `blocks/<block-slug>/`.
2. Provide a valid `block.json` specifying `"apiVersion": 3`.
3. Use `@wordpress/scripts` (`wp-scripts`) for build orchestration.
4. Separate frontend/editor JavaScript (`index.js`), styling (`style.scss`, `editor.scss`), and server-side dynamic rendering (`render.php`).
5. Register via `register_block_type( __DIR__ . '/blocks/<block-slug>' )` inside `BlockServiceProvider`.

## Rationale

1. **Native Performance & Optimization:** API v3 enables iframe editor encapsulation, preventing CSS bleeding between the WordPress admin dashboard and the block canvas.
2. **Standardized Tooling:** `block.json` is the core WordPress schema standard. It enables automatic localization extraction (`wp i18n make-pot`), asset dependency generation (`index.asset.php`), and automated block documentation.
3. **Agent Predictability:** Restricting block architecture to schema-validated `block.json` files allows AI coding agents to scaffold, validate, and inspect blocks deterministically without guessing registration hooks.

## Consequences

### Positive

- Full compatibility with WordPress 6.x and upcoming WordPress 7.x core editor features.
- Clean separation between server-rendered PHP templates (`render.php`) and editor React controls (`edit.js`).
- Automatic asset loading: WordPress core automatically registers and enqueues scripts and styles only when the block is present on the page.

### Negative & Trade-offs

- Drops support for legacy WordPress installations prior to 6.3 (which did not fully support Block API v3 iframe rendering).
- Requires an active npm build step (`npm run build`) to produce compiled block distribution assets.

### Risks & Mitigations

- **Risk:** Build output assets (`build/`) drifting out of sync with source files (`blocks/`).
  **Mitigation:** `package.json` includes `npm run build` as a required CI and pre-release hook, verified during version increments and release packaging.

## Non-Goals

- Supporting legacy Gutenberg Block API v1 or v2 patterns.
- Supporting non-standard custom block bundlers or Webpack configs when `@wordpress/scripts` satisfies all project requirements.

## Architectural Constraints

- Every block must have a `block.json` file declaring `"apiVersion": 3`.
- Blocks must be registered on the `init` action hook through a dedicated `BlockServiceProvider`.
- Dynamic rendering templates must reside in `render.php` and adhere to secure WordPress escaping standards (`esc_html()`, `esc_attr()`).

## Verification & Fitness Functions

- **Build Verification:** `npm run build` succeeds and produces `build/blocks/<block-slug>/block.json` and associated assets.
- **PHP Linting:** `composer lint` verifies PHP syntax and escaping in `render.php`.
- **E2E Visual Verification:** Playwright browser tests under `tests/e2e/playwright/` insert and render the block in the Gutenberg editor.

## Reconsider When

- WordPress core introduces Block API Version 4 with mandatory architectural transitions.

## Implementation References

- Block Definition: `blocks/hello-world/block.json`
- Editor Component: `blocks/hello-world/src/edit.js`
- Dynamic Render Template: `blocks/hello-world/render.php`
- Service Provider: `src/Bootstrap/BlockServiceProvider.php`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md), [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md)
