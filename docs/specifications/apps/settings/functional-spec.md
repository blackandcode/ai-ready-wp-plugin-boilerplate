# Settings App Functional Specification

This document defines the functional requirements, user stories, interaction design, form behaviors, accessibility standards, and error states for the Settings App.

---

## 1. User Stories

1. **View Settings:** As a WordPress administrator, I want to view current plugin settings in a clean, native WordPress admin interface so that I understand how the plugin is currently configured.
2. **Update General Configuration:** As an administrator, I want to customize the greeting message, toggle feature availability, and edit plugin descriptions so that the plugin adapts to my site's needs.
3. **Configure Advanced Behavior:** As an administrator, I want to control REST debug logging, customize cache TTL, and choose an uninstallation data retention policy.
4. **Prevent Data Loss:** As an administrator, I want the interface to warn me if I attempt to navigate away while having unsaved changes.
5. **Inspect System Diagnostics:** As an administrator, I want to see system status metrics inside the settings panel.

---

## 2. Information Architecture & Navigation

The interface uses a vertical sidebar layout with WordPress Design System (WPDS) styling:

- **Header:** Displays page title (`AI-Ready WP Plugin Boilerplate`), version badge, and current environment indicator.
- **Sidebar Tabs:**
  - **General:** Greeting Message (text input, 1–255 chars), Enable Feature (toggle switch), Description (textarea, max 500 chars).
  - **Advanced:** REST API Debugging (toggle switch), Cache TTL (number input in seconds, 60–86400), Data Retention Policy (radio select: "Keep All Data" vs "Delete All Data on Uninstall").
  - **Diagnostics:** Live telemetry status cards.
  - **API Reference:** (Development mode only) Interactive OpenAPI documentation.
- **Footer Actions:**
  - **Save Changes Button:** Primary button, disabled when form is pristine (`!isDirty`) or saving.
  - **Reset Form Button:** Secondary button, reverts form back to initial state.
  - **Dirty State Indicator:** Visual badge indicating unsaved edits.

---

## 3. UI States & Feedback

- **Loading State:** Shows an accessible loading skeleton (`data-airwp-app-state="loading"`).
- **Ready State:** Emits `data-airwp-app-state="ready"` when configuration is loaded.
- **Success Notice:** Dismissible green banner (`role="status"`) announcing "Settings saved successfully."
- **Error Notice:** Red banner (`role="alert"`) displaying the exact validation or authorization error message.
- **Unsaved Changes Warning:** Browser `beforeunload` dialog triggers if user navigates with uncommitted form edits.

---

## 4. Accessibility (WCAG 2.1 AA)

- All form controls have associated `<label>` elements with matching `htmlFor`/`id`.
- Sidebar tab list uses `role="tablist"` with `aria-selected` and `aria-controls`.
- Success and error messages use ARIA live regions (`role="status"`, `role="alert"`).
