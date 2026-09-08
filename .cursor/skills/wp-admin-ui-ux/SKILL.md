---
name: wp-admin-ui-ux
description: Create, audit, and refine high-quality WordPress React Admin UIs following WPDS standards, Dokan/Admin-UI architectural patterns, and Playwright visual testing loops.
---

# WordPress Admin UI/UX Development Skill

Use this skill when building, modifying, or reviewing React admin user interfaces in WordPress plugins.

## Architecture & Design Patterns

1. **Framework-Neutral Contracts & Local State:**
   - Keep React state framework-local.
   - Use WP REST API endpoints for application state and mutations.
   - Boot React apps using PHP bootstrap contracts (`ScreenBootstrapData`) with nonces, capabilities, and i18n strings.

2. **Component Library & Design Tokens:**
   - Prefer `@wordpress/components` (`Card`, `CardHeader`, `CardBody`, `CardFooter`, `Button`, `SelectControl`, `ToggleControl`, `TextControl`, `Icon`).
   - Use `@wordpress/icons` for navigation, section headers, and status badges.
   - Use `@wordpress/i18n` for all user-facing strings.

3. **Settings Navigation Pattern:**
   - Multi-section settings should use a vertical sidebar navigation panel with icons.
   - Map section IDs to semantic icons (`cog`, `download`, `edit`, `layout`, `shield`, `file`, `info`).

4. **Micro-copy & Help Text:**
   - Always supply `help` text descriptions for every setting control.
   - Show clear save status indicators in card footers ("Unsaved changes" / "All changes saved").
   - Include pagination count summaries ("Showing X–Y of Z items").

## Visual Verification Workflow

When updating admin UI code or styles:

1. Build JavaScript assets:
   ```bash
   npm run build
   ```
2. Execute Playwright E2E visual tests:
   ```bash
   npm run test:e2e -- --update-snapshots
   ```
3. Inspect captured screenshots in `tests/e2e/playwright/__screenshots__/` using image reading capabilities.
4. Perform iterative refinement passes until visual hierarchy, contrast, spacing, and micro-copy meet WPDS standards.
