# Tier 3: Frontend Unit Testing (Jest & React Testing Library)

This document details frontend unit testing using **Jest** and **React Testing Library** for React admin apps, custom hooks, and Gutenberg blocks under `tests/js/`.

---

## 1. Overview & Setup

Tier 3 frontend unit tests verify user interface components, form state reducers, and block serialization in Node.js using JSDOM:

- **Runner:** `wp-scripts test-unit-js` configured via `jest.config.js`.
- **Environment:** JSDOM with `@testing-library/jest-dom` extensions loaded in `tests/js/setup-tests.ts`.
- **Target Files:** `tests/js/apps/settings/`, `tests/js/blocks/hello-world/`, and `tests/js/shared/`.

---

## 2. Test Suites

### 2.1 Shared UI Primitives & Adapters (`tests/js/shared/`)

- `CardLayout.test.tsx`: Tests compound WPDS components (`CardLayout.Header`, `Body`, `Footer`).
- `SectionHeader.test.tsx`: Tests section titles, action slots, and badge rendering.
- `NoticeBanner.test.tsx`: Tests accessible notices (`role="status"`, `role="alert"`), dismiss callbacks, and icon variations.
- `ErrorBoundary.test.tsx`: Verifies that UI crashes are safely caught and offer retry actions.
- `SettingsApiClient.test.ts`: Verifies `@wordpress/api-fetch` wrapping, headers, error parsing, and URL formatting.
- `useSettingsForm.test.ts`: Verifies state reducer immutability, dirty tracking, and field updates.

### 2.2 App Containers & Shells (`tests/js/apps/settings/`)

- `App.test.tsx`: Tests data fetching, loading skeleton states, tab switching, form submission, and error alerts.
- `SettingsShell.test.tsx`: Tests sidebar navigation items, active tab indicators, and save footer buttons.

### 2.3 Gutenberg Blocks (`tests/js/blocks/hello-world/`)

- `edit.test.tsx`: Tests Gutenberg block edit controls, inspector panel toggles, and live canvas preview.
- `save.test.tsx`: Verifies static save HTML and Interactivity API directives (`data-wp-interactive`, `data-wp-context`).

---

## 3. Execution Commands

```bash
# Run all frontend unit tests
npm run test:unit

# Run tests in watch mode during development
npm run test:unit -- --watch

# Run a specific test file
npm run test:unit tests/js/apps/settings/App.test.tsx
```

---

## 4. Coding Agent Rules

1. **Test User Behavior, Not Implementation Details:** Use queries like `getByRole`, `getByLabelText`, and `getByText`. Avoid querying internal CSS class names.
2. **Mock API Calls via `SettingsApiClient`:** Mock API client methods rather than mocking `@wordpress/api-fetch` directly:

   ```typescript
   jest.spyOn(SettingsApiClient.prototype, 'getSettings').mockResolvedValue(mockSettings);
   ```

3. **Verify Accessibility Attributes:** Assert ARIA roles (`role="alert"`, `aria-selected`, `aria-controls`) to prevent accessibility regressions.
