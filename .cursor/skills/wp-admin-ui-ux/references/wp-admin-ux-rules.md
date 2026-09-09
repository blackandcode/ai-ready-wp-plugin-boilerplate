# WordPress Admin UX Rules

Use this reference before designing, polishing, or reviewing WordPress plugin
admin screens.

## Design Posture

WordPress admin UI is an operational workspace. Optimize for comprehension,
repeated use, trust, and quick movement from information to action.

Adapted principles:

- Information to action: the user should understand the state of the system and
  see the next reasonable action without searching.
- Craftsmanship: alignment, spacing, typography, icon choice, hover/focus
  states, and responsive behavior should feel intentionally made.
- Trust: labels, error states, confirmations, and disabled states should make
  consequences understandable before the user commits.
- Purpose before styling: define the user, task, screen density, and constraints
  before changing visuals.
- Production engineering: include accessibility, state coverage, responsiveness,
  component reuse, and design-system compliance.
- Auditability: visual changes need source evidence, screenshot evidence, and a
  short explanation of why the result is better.

## External Design-Skill Principles Adapted

Use these as judgment lenses, translated for WordPress admin rather than public
marketing sites:

- Microsoft `frontend-design-review`: optimize the path from information to
  action, visual craftsmanship, and trustworthy interaction.
- Anthropic `frontend-design`: define the user, task, visual direction,
  typography, color constraints, and non-generic layout before coding. In
  wp-admin, prioritize clarity and consistency over expressive novelty.
- Addy Osmani `frontend-ui-engineering`: verify component architecture,
  accessibility, responsive behavior, state management, loading/error/empty
  states, and design-system use.
- Vercel `web-design-guidelines`: review the implementation against concrete UX,
  accessibility, performance, and source-level evidence instead of relying on
  taste alone.

## WordPress-Native Feel

- Use WP admin layout conventions: page title, notices, toolbars, filters, tabs,
  grid/list/DataViews pages, edit forms, cards/panels, and predictable primary
  actions.
- Prefer `@wordpress/components` and `@wordpress/icons` for standard controls.
  Use local adapters when the repo already wraps them.
- Use WordPress admin CSS variables and design tokens when available, especially
  admin theme colors and border/text variables.
- Respect the active admin color scheme. Do not hard-code a large one-note
  palette that fights wp-admin.
- Keep the interface dense but breathable. Avoid oversized hero layouts,
  decorative illustrations, large marketing cards, and dramatic gradients.
- Use cards only for coherent groups, repeated items, modals, and framed tools.
  Avoid page sections styled as floating cards and avoid nested cards.
- Keep border radius restrained, generally 8px or less unless the established
  component system requires otherwise.
- Use the WordPress admin font stack and normal letter spacing. Do not scale
  font size with viewport width.

## Component Rules

- Buttons: use clear verbs, stable size, loading/disabled states, and icons when
  a familiar icon improves scanning.
- Icons: use `@wordpress/icons` in WordPress component contexts. If a chosen
  library is already installed for a component system, use it consistently and
  provide accessible labels/tooltips.
- Forms: label every field, provide help text, show validation near the field,
  and preserve input values on failure.
- Toggles: use for immediate boolean settings only when the result is clear. Use
  confirmation for high-risk toggles.
- Tabs/sidebar navigation: use when settings have distinct mental models. Keep
  active state obvious and keyboard accessible.
- Notices: use WordPress notice semantics for success, warning, error, and info.
  Avoid stacking duplicate toasts/notices for the same event.
- Badges: use for status, not decoration. Status labels must be textual, not
  color-only.
- Tables/grids/DataViews: favor scannable columns, sticky or predictable
  controls, and explicit count/pagination summaries.
- Edit pages: keep form sections clear, validation near fields, save/cancel
  actions predictable, and unsaved-change behavior trustworthy.
- Empty states: distinguish "nothing created yet" from "nothing matches
  filters".

## Accessibility And Trust

- Maintain visible focus rings and correct tab order.
- Use semantic headings, lists, tables, buttons, links, and form controls.
- Do not rely on color alone for meaning.
- Ensure contrast for text, borders that communicate grouping, badges, and
  disabled states.
- Keep keyboard paths for search, filters, tabs, row actions, modals, and save
  flows.
- Confirm destructive actions and explain what will be deleted, unpublished,
  overwritten, or made public.
- Avoid hiding important consequences in tooltips only; tooltips are
  supplemental.
- Avoid raw technical errors. Translate server errors into user-facing recovery
  steps while preserving stable error codes for diagnostics where useful.

## Responsive Rules

- Verify at least one desktop and one narrow/mobile viewport for admin React
  screens.
- Controls must not overlap the WordPress admin menu, admin bar, notices, or
  each other.
- Long labels and translated strings must wrap cleanly or truncate only where
  the full text remains accessible.
- Tables should degrade to horizontal scroll or responsive list view
  intentionally. Do not let columns crush into unreadable text.
- Sticky headers/footers must not cover form fields, notices, or pagination.

## Visual Review Checklist

Use screenshots to answer these questions:

- Is the primary task obvious within the first few seconds?
- Are headings, sections, and actions in the expected hierarchy?
- Can the user move from current information to next action without hunting?
- Do loading, empty, error, permission, saving, and success states look
  intentional?
- Are spacing, alignment, border use, icon sizing, and typography consistent?
- Does the screen still look native inside WordPress admin?
- Does it survive narrow viewport, long labels, many rows, zero rows, and error
  messages?
- Is every visual cue backed by accessible text or semantics?
