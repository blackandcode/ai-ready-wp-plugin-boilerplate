# ADR-0008: Frontend Architecture and Component Design Patterns

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Development Team & AI Coding Agents
- **Consulted:** WordPress UI/UX and Gutenberg Working Groups
- **Informed:** All Contributors

---

## Context and Problem Statement

The plugin's backend recently adopted a clean Hexagonal / DDD architecture with strong separation of concerns, value objects, and dependency injection. However, the frontend (`assets/`, `blocks/`, `templates/`, and `patterns/`) requires equal architectural rigor:

1. **API Client & State Mixing:** Network calls via `@wordpress/api-fetch` were mixed directly into view components or simple hooks without clear repository or adapter abstractions for error mapping, nonce extraction, and optimistic concurrency.
2. **Component Coupling:** Admin components mixed form state, dirty tracking, and presentation, rather than separating into Container/Presenter components.
3. **Monolithic Block Architecture:** The Gutenberg Hello World block contained inspector controls, editing canvas, and state logic in a single file without modular decomposition or type contracts.
4. **Hardcoded Registrations:** Blocks and block patterns were manually wired in PHP with hardcoded paths instead of relying on declarative, dynamic registry scanners.
5. **Procedural Templates:** Admin PHP templates used direct `include` calls without a structured `TemplateRenderer` supporting variable scoping, directory traversal protection, and filterable override paths.

We must define a cohesive frontend architecture grounded in established software design patterns (Repository/Adapter, Container/Presenter, Compound Components, State Reducer, Template Method / View Strategy, and Dynamic Discovery).

## Decision Drivers

1. **WordPress Native Alignment:** Fully leverage `@wordpress/components`, `@wordpress/element`, `@wordpress/interactivity`, and Block API v3 without heavy external runtime dependencies.
2. **Separation of Concerns:** Strict division between network access, state management, presentational rendering, and server-side templates.
3. **Defensive Resilience:** Graceful error boundaries, accessible loading skeletons, and strict type safety across TypeScript and PHP.
4. **Testability & TDD:** Every layer (adapters, hooks, compound components, blocks, page objects) must be testable in isolation via Jest and Playwright.
5. **Extensibility & Security:** Safe template rendering with directory-traversal guards and filterable template paths.

## Considered Options

### Option 1: Ad-hoc React Components and Procedural PHP Includes (Status Quo)

Components manage their own state and fetch data directly with raw `apiFetch`; PHP includes template files directly via `include`.

- **Good, because:** Familiar to junior WordPress developers, fewer files.
- **Bad, because:** Violates Single Responsibility Principle, leaks network and state management concerns into UI primitives, lacks test seams, prone to directory traversal in template resolution, hard to maintain as plugin scales.

### Option 2: Heavy Third-Party Frontend Framework (Redux Toolkit, TanStack Query, Blade/Twig)

Introduce external client libraries (Redux, TanStack Query) and external PHP template engines (Blade, Twig, Plates).

- **Good, because:** Standard enterprise state management, familiar to full-stack engineers outside WordPress.
- **Bad, because:** Bloats bundle size, conflicts with WordPress core scripts, introduces heavy Composer dependencies, violates the zero-framework-lock-in product invariant.

### Option 3: Pattern-Driven Architecture using Native WordPress Primitives (Chosen)

Decompose frontend and templating into clean design patterns using native `@wordpress/*` packages and pure PHP view renderers:

- **Repository / Adapter Pattern (`SettingsApiClient`):** Encapsulates `@wordpress/api-fetch`, reading nonces from localized data, normalizing payloads, and mapping HTTP errors to typed failures.
- **State Reducer Hook (`useSettingsForm`):** Pure state management handling initial state, dirty tracking, immutability, optimistic updates, and resets.
- **Container / Presenter Pattern:** `App.tsx` acts as container; `SettingsShell`, `GeneralSection`, `AdvancedSection`, and `DiagnosticsSection` act as pure presentational components.
- **Compound Components (`CardLayout`):** Expressive WPDS layout primitives (`CardLayout.Header`, `CardLayout.Body`, `CardLayout.Footer`).
- **Decomposed Block Architecture:** Modular `types.ts`, `edit/Inspector.tsx`, `edit/index.tsx`, `save.tsx`, and Interactivity API store in `view.ts`.
- **Dynamic Registry Discovery (`BlockServiceProvider`):** Scans `blocks/*/block.json` and `patterns/*.php` dynamically.
- **Template Method / View Strategy (`TemplateRenderer`):** Safe, isolated, filterable PHP template engine.

## Decision Outcome

- **Chosen Option:** Option 3 (Pattern-Driven Architecture using Native WordPress Primitives)
- **Rationale:** Delivers enterprise-grade architecture, high testability, and resilient error handling while respecting WordPress design tokens and avoiding external dependency bloat.

## Consequences

### Positive

- **High Testability:** UI components can be tested with mock props; hooks can be tested in isolation; API clients can be mocked via adapters.
- **Reduced Coupling:** Changing API endpoints or payload shapes requires updating only `SettingsApiClient`, not individual React controls.
- **Dynamic Extensibility:** Adding a new block or pattern requires only adding its folder or `.php` file, which is discovered automatically without touching service provider code.
- **Defensive Reliability:** `ErrorBoundary` catches unexpected React rendering errors with friendly fallback UI; `TemplateRenderer` guards against path traversal (`..`).

### Negative & Trade-offs

- More files and modular structures in `assets/src/` and `blocks/`.
- Developers must understand React design patterns (Container/Presenter, Compound Components, Custom Hooks) rather than writing monolithic components.

### Risks & Mitigations

- **Risk:** New developers might bypass `SettingsApiClient` and call `apiFetch` directly.
  **Mitigation:** Code reviews, ESLint rules, and centralized exports in `assets/src/shared/`.
- **Risk:** Dynamic pattern and block scanning could degrade PHP startup performance.
  **Mitigation:** Scanning uses efficient `glob()` targeting only the shallow plugin `blocks/` and `patterns/` directories; WordPress caches registered blocks in memory during request lifecycle.

## Architectural Constraints

1. **No Raw `apiFetch` in Presenters:** Presentational components must never call `apiFetch` directly; network operations belong in API client adapters (`SettingsApiClient`).
2. **Container/Presenter Separation:** Admin screen entrypoints manage state and orchestration; child section components must remain pure presenters.
3. **Compound Component Contracts:** WPDS layout primitives must support flexible compound composition (`CardLayout.Header`, `CardLayout.Body`, `CardLayout.Footer`).
4. **Safe Template Rendering:** PHP templates must always be rendered via `TemplateRenderer`, never raw string concatenations or unfiltered procedural `include` statements.
5. **Gutenberg Block API v3:** Blocks must declare `apiVersion: 3`, `supports.interactivity: true`, and separate inspector controls into `edit/`.

## Verification & Fitness Functions

- **Unit Tests:** `npm run test:unit` tests `SettingsApiClient`, `useSettingsForm`, `CardLayout`, `ErrorBoundary`, and block `edit`/`save` components.
- **E2E Tests:** `npm run test:e2e` verifies admin UI workflows using the Page Object Model (`SettingsPage.ts`).
- **PHP Standards:** `vendor/bin/phpcs` and `vendor/bin/phpstan analyse` pass with 0 errors.

## Reconsider When

- WordPress core introduces a unified official client state management library for admin screens that replaces custom hook state reducers.
- Gutenberg Block API v4 deprecates `block.json` API v3 patterns.

## Implementation References

- [ADR-0003: Gutenberg Block API v3 standard](0003-gutenberg-block-api-v3-standard.md)
- [ADR-0005: WPDS admin card and sidebar architecture](0005-wpds-admin-card-and-sidebar-architecture.md)
- [ADR-0007: Hexagonal domain reorganization and skills integration](0007-hexagonal-domain-reorganization-and-skills-integration.md)
- [Design Patterns Best Practices Skill](../../.cursor/skills/design-patterns-best-practices/SKILL.md)
