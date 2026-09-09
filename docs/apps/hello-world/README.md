# HelloWorld App Technical Documentation

This directory contains technical documentation for the **HelloWorld App**, showcasing modern Gutenberg block development using **Block API v3** and the **WordPress Interactivity API**.

Governed by **ADR-0003: Gutenberg Block API v3 Standard** and **ADR-0009**.

---

## 1. Scope & Implementation Locations

- **Backend Headless Domain (`src/backend/Apps/HelloWorld/`):**
  - `Domain/`: `HelloWorldGreeting` Value Object.
  - `Application/`: `HelloWorldService`, `HelloWorldDTO`.
  - `Rest/`: `HelloWorldController` exposing public `GET /ai-ready-wp/v1/hello`.
  - `HelloWorldBackendServiceProvider.php`: Registers service provider and REST routes.

- **Frontend Block Presentation (`src/frontend/apps/hello-world/`):**
  - `block.json`: Metadata declaration complying with Block API v3.
  - `index.ts`: Block registration entrypoint.
  - `types.ts`: TypeScript interfaces for attributes and client store.
  - `edit.tsx` & `edit/Inspector.tsx`: Gutenberg editor UI with decomposed Inspector controls.
  - `save.tsx`: Frontend markup emitting Interactivity API directives (`data-wp-*`).
  - `view.ts`: Interactivity API client store managing dynamic state and actions in the browser.
  - `style.css` & `editor.css`: Scoped block styling.

- **Patterns & Templates (`src/frontend/patterns/`):**
  - `interactive-showcase.php`: Pre-assembled block pattern demonstrating the Hello World block.

---

## 2. Technical Documents

- [technical-spec.md](technical-spec.md): Complete block specification, Interactivity API client store design, attribute schema, and backend greeting service.

---

## 3. Coding Agent Guidance

1. **Interactivity API Directives:** `save.tsx` must render static HTML with `data-wp-interactive`, `data-wp-context`, `data-wp-text`, and `data-wp-on--click` directives. It must not bundle React to the frontend.
2. **Block API v3:** Declare `$schema: "https://schemas.wp.org/trunk/block.json"` and `"apiVersion": 3`.
3. **No Heavy Frontend Bundles:** Block frontend interactivity relies strictly on the lightweight `@wordpress/interactivity` runtime loaded by WordPress core.
