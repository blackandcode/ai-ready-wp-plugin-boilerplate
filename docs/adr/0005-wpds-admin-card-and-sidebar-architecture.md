# ADR-0005: WPDS admin card and sidebar architecture

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** WordPress UI/UX Working Group
- **Informed:** All Contributors

---

## Context

Legacy WordPress plugin administration screens rely on procedural HTML rendering, unstructured PHP echo statements, and the legacy Settings API table layout (`form-table`). These interfaces:
1. Deviate significantly from modern Gutenberg and WordPress core administrative styling.
2. Provide poor responsive and accessible experiences across mobile and desktop viewports.
3. Require custom styling solutions that quickly become technical debt and break when WordPress core updates admin CSS.

A cohesive, modern administration interface is required that feels native to the evolving WordPress dashboard while offering a reactive single-page experience.

## Decision

We adopt a **WordPress Design System (WPDS) React 18 single-page application architecture** for all administrative settings pages.

The administrative interface consists of:
1. A minimal PHP administrative container page (`templates/admin-page.php`) rendering a single root shell mount point.
2. A React 18 SPA (`src/admin/`) mounted via `createRoot` using core `@wordpress/components`, `@wordpress/element`, and `@wordpress/i18n` packages.
3. A two-column responsive layout comprising a primary **Card-based Settings Content** area and a **Contextual Sidebar** (system status, quick actions, documentation links).
4. Direct REST API communication via `@wordpress/api-fetch` communicating with the plugin's REST settings endpoints, with nonces passed securely via localized bootstrap data (`window.airwpAdminBootstrap`).

## Rationale

1. **Native Look and Feel:** Utilizing `@wordpress/components` ensures full visual alignment with Gutenberg, automatic dark mode support, and core accessibility (WCAG 2.1 AA) compliance.
2. **Zero Custom CSS Bloat:** By leveraging core design system tokens and components (`Card`, `CardHeader`, `CardBody`, `Button`, `Notice`, `Spinner`), the plugin avoids bundling heavy custom UI frameworks.
3. **Reactive User Experience:** Settings save asynchronously via REST API with inline notifications without requiring full-page browser reloads.

## Consequences

### Positive
- Consistent, modern, accessible administration UI adhering to WordPress core standards.
- Reuses WordPress-bundled React and components libraries, minimizing JavaScript bundle size.
- Clean separation between presentation (React SPA) and persistence (REST API controllers).

### Negative & Trade-offs
- Requires JavaScript to be enabled in the user's browser to manage plugin settings.
- Requires building React assets using `npm run build` before deployment.

### Risks & Mitigations
- **Risk:** Core component API deprecations in future WordPress versions.
  **Mitigation:** Component usage is restricted to stable `@wordpress/components` primitives; Playwright visual tests capture regressions against new WordPress major versions.

## Non-Goals
- Introducing third-party React component libraries (Material UI, Ant Design, Chakra UI, Tailwind CSS) that clash with the WordPress admin design language.
- Reverting to legacy procedural `settings_fields` / `do_settings_sections` table layouts.

## Architectural Constraints
- All administrative UI components must be sourced from `@wordpress/components` or follow WPDS token conventions.
- Admin scripts and styles must only be enqueued on the plugin's dedicated administrative hook (`admin_enqueue_scripts` with screen ID check).
- The REST API communication bridge must include nonce headers provided in the localized bootstrap data.

## Verification & Fitness Functions
- **Frontend Unit Tests:** Jest and React Testing Library tests under `tests/js/` assert component rendering, user interactions, and state updates.
- **Visual E2E Regression:** Playwright browser tests under `tests/e2e/playwright/` verify admin screen rendering, responsive layouts, and REST saving.

## Reconsider When
- WordPress core introduces a unified React-based administrative routing engine for all wp-admin screens.

## Implementation References
- Admin React Application: `src/admin/index.js`, `src/admin/App.js`
- Admin PHP Provider: `src/Bootstrap/AdminServiceProvider.php`
- Shell Template: `templates/admin-page.php`
- Style Definitions: `src/admin/admin.scss`

## Related Decisions
- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md), [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md), [ADR-0004](0004-contract-first-rest-api-specification.md)
