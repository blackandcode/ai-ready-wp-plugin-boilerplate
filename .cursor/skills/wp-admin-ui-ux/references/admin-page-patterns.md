# WordPress Admin Page Patterns

Use this reference when designing, implementing, or reviewing WordPress plugin
admin settings pages, grid/list pages, DataViews/table screens, create/edit
pages, detail pages, or preview-heavy workflows.

## Page Types

Choose the page pattern from the user's actual job:

- Settings page: tune durable plugin behavior, defaults, integrations,
  permissions, retention, feature gates, or advanced options.
- Grid/list page: scan, search, filter, compare, bulk update, and open records.
- Create/edit page: author or update one record with validation, save states,
  revision/conflict behavior, and optional preview.
- Detail page: inspect one record, status, metadata, activity, diagnostics, or
  related resources before taking actions.
- Wizard/setup page: guide a first-run or multi-step task only when the sequence
  is genuinely dependent.

Avoid making a landing or marketing page when the task is an admin workflow. The
first viewport should contain the usable admin experience.

## Shared Admin Structure

- Use one clear page title from PHP or React, not duplicate headings.
- Put primary actions in predictable places: page header, toolbar, row action,
  sticky form footer, or section footer.
- Use notices for page-level outcomes and field errors for field-level problems.
- Keep status visible with textual badges, not color alone.
- Include loading, empty, filtered-empty, error, permission-denied, saving,
  dirty, success, and disabled states when reachable.
- Keep query/view state in the URL when users expect reload, share, browser
  back, or bookmarking to work.
- Keep CSS scoped to the plugin root and avoid global resets.

## Settings Pages

Use settings pages for durable configuration, not for one-off operational
actions.

Settings contract:

- Keep server/application services authoritative for defaults, sanitization,
  capability checks, and persistence.
- Refetch or reconcile after save so the UI reflects canonical sanitized values.
- Save only the intended scope. If the UI saves one section/page at a time, the
  server must merge with existing values and preserve untouched sections.
- Ensure field IDs and UI state keys match REST schema keys.
- Use `@wordpress/api-fetch` with the REST nonce for wp-admin React clients.
- Map server validation errors back to fields where possible.
- Avoid autoloading large settings blobs unless there is a clear performance
  reason.

Settings field design:

- Every setting needs a label, help text, default behavior, validation rule, and
  disabled/saving/error state.
- Use switches for clear booleans, radio or segmented controls for small
  exclusive choices, select/combobox for longer option sets, number inputs or
  steppers for numeric values, and text areas only for multi-line input.
- Danger zones need separation, plain-language consequences, confirmation, and
  recovery language.
- Secrets must not render raw values by default and must never be logged.
- Help text should explain consequences: "what changes if this setting changes?"

Settings layout:

- Use sidebar navigation, tabs, or grouped cards only when there are enough
  settings to justify navigation.
- Keep one card or panel per coherent section. Avoid nested cards.
- Use sticky or persistent save affordances for long forms.
- Put diagnostics and uncommon operational details in collapsible panels.

## Grid, List, Table, And DataViews Pages

Use grid/list pages when users need to scan or act on many records.

Data contract:

- Use stable server IDs.
- Prefer server-side pagination, sorting, searching, and filtering for real
  datasets.
- Include total item counts, current range summaries, and filtered-empty copy.
- Keep REST payloads small with pagination, explicit fields, and response
  schemas.
- Use capability-aware action eligibility. Hidden or disabled actions are not
  authorization.
- Preserve row selection intentionally across view changes, or clear it
  explicitly with feedback.

Column and row design:

- Make the primary object name/title the first strong column.
- Use badges for status, visibility, validation, and async processing state.
- Keep row actions predictable: view, edit, duplicate, trash/delete, restore,
  export, or domain-specific actions.
- Destructive row and bulk actions need confirmation and clear selected counts.
- Right-align compact numeric values only when comparison matters.
- Do not introduce card/grid layouts for media-heavy objects until thumbnails,
  responsive behavior, and performance are proven.

State coverage:

- Loading: use skeleton rows/cards that preserve layout.
- Empty: distinguish "nothing exists yet" from "nothing matches filters".
- Error: explain recovery and offer retry where possible.
- Permission denied: explain missing capability without exposing impossible
  actions.
- Session expired: surface nonce/auth failures clearly.

## Create And Edit Pages

Use create/edit pages when users focus on one record or entity.

Form architecture:

- Split complex forms into meaningful sections. Keep related fields together.
- Put the primary save/publish/update action in a stable location.
- Use secondary actions for preview, duplicate, reset, cancel, or save draft.
- Track dirty state and warn before losing unsaved work when loss is possible.
- Validate before save in the browser for fast feedback, but enforce validation
  again on the server.
- Show optimistic or conflict/version-token behavior when multiple editors or
  background updates are possible.

Field and preview design:

- Show validation errors next to fields and summarize only when helpful.
- Keep previews close to the fields that affect them, or use a side panel when
  the preview is the main confidence signal.
- Use read-only summary fields when data is derived or server-owned.
- Use inline guidance for tricky inputs, formats, limits, or irreversible
  choices.
- Preserve user input on failed saves.

Edit-page state coverage:

- New/unsaved record.
- Existing record loaded.
- Dirty changes.
- Saving.
- Save success.
- Validation failure.
- Server failure.
- Permission denied.
- Conflict/stale version.
- Delete/trash/restore confirmation when available.

## Detail And Preview Pages

Use detail pages for inspection-heavy workflows:

- Show title, status, key metadata, ownership, timestamps, and primary actions.
- Keep secondary diagnostics, logs, history, and related resources below the
  main decision area or in tabs/panels.
- Make destructive or state-changing actions capability-aware and confirmable.
- Use preview panels only when they reveal the actual saved/rendered state.

## Acceptance Checklist

- The primary task is obvious within a few seconds.
- The page has one clear title and predictable primary action.
- The screen supports keyboard, focus, and readable narrow viewport behavior.
- Settings/forms include help text and field-level validation.
- Grids include counts, filters, pagination, empty states, and accessible row
  actions.
- Create/edit pages preserve unsaved input and show saving/error/success states.
- The UI respects WordPress admin styling and does not leak CSS globally.
- Screenshots have been inspected for every visually affected state.
