# Plugin-UI Architecture And UX Reference

This is a self-contained reference distilled from `getdokan/plugin-ui`
(`@wedevs/plugin-ui`) so agents do not need to leave this skill folder to use
its architectural and UX ideas.

Source provenance: analyzed from `https://github.com/getdokan/plugin-ui` on
`main` commit `3404c77c543bed1990c6edd9fad4726d8d97cbb3`. Use these notes as
design and architecture patterns. Do not copy source code or add the dependency
unless the current project explicitly approves the dependency, license, and
version plan.

## What Plugin-UI Optimizes For

Plugin-ui is a React component system for WordPress plugin admin interfaces. Its
useful ideas are:

- Scope the application UI inside a plugin root so component styles do not break
  the surrounding WordPress admin.
- Keep WordPress-specific integrations in a small layer, while core UI
  components remain mostly framework and platform neutral.
- Compose admin pages from reusable layout, settings, DataViews, field,
  feedback, overlay, and status components.
- Use theme tokens and CSS variables rather than scattering hard-coded colors
  across components.
- Provide extension points through WordPress hooks/filters where host plugins or
  add-ons need to customize fields, table elements, or layout actions.

## Architecture Pattern

Use this mental model when designing a WordPress admin UI:

- UI primitives: buttons, inputs, fields, cards, notices, badges, modals,
  dropdowns, tabs, skeletons, spinners, and tooltips.
- WordPress integration components: layout shell, media upload, settings system,
  DataViews wrapper, WordPress date/locale helpers, and hook bridges.
- Providers: theme provider, app bootstrap provider, notices/toasts provider,
  query/cache provider, permissions/capabilities provider when needed.
- Adapters: REST client, schema normalizer, URL/query-state adapter, entity
  mappers, and error mappers.
- Application services/server: persistence, sanitization, capabilities,
  defaults, validation, and domain rules stay authoritative on the server.

Prefer this separation even when not using plugin-ui directly.

## Settings System Pattern

Plugin-ui's settings model is useful because it treats settings as a schema and
keeps UI navigation, dirty state, validation, and save behavior consistent.

Recommended concepts:

- Organize settings as pages, subpages, tabs, sections, subsections, fields, and
  field groups when the amount of configuration justifies it.
- Give every field a stable `id`, label, description/help text, value/default,
  variant/type, validation, disabled/read-only state, and optional dependencies.
- Use a field wrapper pattern so labels, descriptions, errors, badges, and
  controls align consistently.
- Track dirty state per save scope rather than making one huge global dirty
  flag.
- Pass custom save-button rendering where the host project needs translated,
  product-specific, or permission-aware save actions.
- If the component system supports field filters, pass the actual
  `@wordpress/hooks` `applyFilters` function and use a stable hook prefix.

Server contract:

- The server owns defaults, sanitization, capabilities, schema, and saved
  values.
- The browser may validate early, but server validation remains required.
- After save, refresh or reconcile with server state because sanitization may
  alter values.
- Partial saves must merge with existing saved data and preserve untouched
  sections.
- UI field keys must match REST schema keys. Avoid aliases that the REST schema
  will strip.

UX lessons:

- Settings navigation should help users find a mental category, not decorate the
  page.
- Search within settings is useful when there are many fields or deep groups.
- Collapsible sections work for diagnostics and advanced options, but important
  controls should not be hidden by default.
- Destructive or risky settings need clear warnings and confirmation.

## DataViews And Grid Pattern

Plugin-ui wraps WordPress DataViews with conventions that are useful for any
admin grid/list page.

Recommended concepts:

- Require a unique namespace for each grid/list so hooks, slots, test IDs, and
  extension points do not collide.
- Keep `view` state explicit: type/layout, page, per-page count, sort, filters,
  search, and visible fields.
- Provide stable field definitions with `id`, label, render function, raw value
  getter, sorting behavior, and hiding behavior.
- Provide row actions with stable IDs, labels, icons, eligibility checks,
  primary/destructive markers, and bulk support flags.
- Wrap destructive callbacks with confirmation before invoking the mutation.
- Support selection as controlled state and clear it intentionally after
  mutations.
- Support tabs and filters as first-class view controls, not ad hoc toolbar
  fragments.
- Provide skeleton loading that matches table/list/grid layout.
- Provide empty state props or slots for "no data" and filtered-empty states.
- Switch to a responsive list layout on narrow screens when tables become
  unreadable.

UX lessons:

- A grid is for scanning and action. Prioritize title, status, owner/date,
  important metrics, and primary row action.
- Users need counts and range summaries to trust pagination and filters.
- Bulk actions should show selected count and consequences.
- Grid/list layout must remain usable with long labels, translated strings,
  hidden columns, many filters, and narrow viewport widths.

## Layout And Navigation Pattern

Plugin-ui's layout ideas translate into these general WordPress admin rules:

- Use a root layout component that owns sidebar/header/body/main regions.
- Use a namespace for hook-based layout actions, such as toggling a sidebar.
- Use one top-level app root and one style scope.
- Keep menu/sidebar items data-driven with stable IDs, labels, icons, test IDs,
  and optional nested children.
- On mobile, sidebars should become accessible drawers with backdrop, close
  button, and focusable controls.
- Do not duplicate WordPress admin page titles with React titles unless the PHP
  title is intentionally absent.

## Theme And CSS Pattern

Plugin-ui maps theme tokens to CSS custom properties on the plugin root. The
important reusable lessons are:

- Convert design tokens into CSS variables at the app root.
- Keep colors semantic: background, foreground, card, primary, muted, accent,
  border, input, ring, success, warning, info, destructive.
- Keep sidebar and chart tokens separate from core form tokens when needed.
- Use the current WordPress admin color scheme where possible.
- Scope Tailwind preflight, utility resets, or any aggressive CSS reset to the
  plugin root.
- Reset WordPress admin heading/paragraph leakage only inside the plugin root.
- Ensure modals/portals receive the same theme variables when rendered outside
  the main app root.

Do not adopt plugin-ui's Tailwind setup automatically. Use the current project's
approved build pipeline and component system first.

## Extension Pattern

Use WordPress hook/filter integration only for real extension needs:

- Give every hook a stable prefix or namespace.
- Keep hook names predictable, such as `{prefix}_settings_{variant}_field` or
  `{namespace}_dataviews_{element}`.
- Pass enough context for add-ons to decide whether to customize a field/action,
  but do not leak secrets or raw sensitive data.
- Document whether the filter changes presentation only or can change behavior.
- Keep capability checks on the server even when hooks hide or alter actions.

## Adoption Guardrails

- Prefer WordPress core packages and the current project's local adapters.
- Treat plugin-ui as a pattern library unless dependency approval is explicit.
- Do not vendor source files from plugin-ui.
- Do not introduce Tailwind, Base UI, lucide, sonner, or other dependencies only
  because plugin-ui uses them.
- If adopting plugin-ui directly, confirm React, WordPress packages, build
  tooling, CSS scoping, license, version pinning, and bundle-size impact.
- Keep app-specific domain rules outside UI components.

## Review Checklist

When borrowing plugin-ui ideas, verify:

- Provider boundaries are clear.
- REST/data adapters are separate from visual components.
- Settings schemas have labels, descriptions, defaults, and validation.
- Grids have namespaces, stable fields, actions, loading, empty, and responsive
  states.
- Destructive actions confirm before mutation.
- CSS cannot leak into the rest of wp-admin.
- Server state remains authoritative after save.
- Extension hooks cannot bypass permissions or validation.
