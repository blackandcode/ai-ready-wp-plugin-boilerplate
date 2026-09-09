# Feature Implementation Plan Template

> **Template Usage Instructions:**
> Duplicate or reference this template when planning a **new feature** or major architectural expansion in the plugin.
> Keep the entire plan in a **single comprehensive document** (e.g., `docs/specifications/plans/XX-[feature-slug].md`).
>
> 💡 **For AI Coding Agents:** This template outlines the recommended dimensions and boilerplate rules for a production-ready feature. Use it as structured guidance—adapt sections flexibly to best fit the specific requirements of the feature without losing architectural rigor or testing completeness. Skip this heavyweight template for simple bug fixes or minor cosmetic tweaks.

---

## Plan Overview: [Feature Name / Title]

- **Feature Slug / Target App:** `[e.g., analytics | workflow-automation | webhooks]`
- **Target Directories:**
  - Backend: `src/backend/Apps/[AppName]/`
  - Frontend: `src/frontend/apps/[AppName]/`
  - REST Namespace: `src/backend/Apps/[AppName]/Rest/`
- **Pre-Implementation Log:** `docs/implementation-logs/YYYY-MM-DD-phase-XX-[short-name].md`
- **Target Release Milestone:** `[e.g., v1.3.3]`

---

## 1. Architectural Governance & ADR Gate

> 💡 **Agent Guidance:** Before drafting implementation details, consult `docs/adr/README.md` and evaluate the feature scope against `.cursor/rules/adr-evaluation.mdc`.

### 1.1 ADR Gate Evaluation

- [ ] **ADR Impact State:** `[Select: ADR_REQUIRED | ADR_RECOMMENDED | ADR_NOT_NEEDED | EXISTING_ADR_GOVERNS | EXISTING_ADR_MAY_REQUIRE_SUPERSESSION]`

- **Governing Accepted ADRs:**
  - `[ADR-0002]`: Lightweight Dependency Injection Container (`src/framework/Container/`)
  - `[ADR-0007]`: Hexagonal Domain Reorganization (Pure Domain, Decoupled Infrastructure)
  - `[ADR-0009]`: Tripartite App-Centric Architecture (`Framework/`, `Backend/Apps/`, `Frontend/Apps/`)
  - `[ADR-0010]`: Two-Pipeline CI/CD and Release Readiness
  - `[ADR-0011]`: Generated OpenAPI 3.1 Specification from WordPress REST Controllers
- **New ADR Required?** `[Yes/No]`
  - *If Yes:* Run `npm run adr:new -- -t "[ADR Title]"` before writing code. Do not duplicate ADR reasoning here; link to the ADR and summarize only binding invariants.

---

## 2. Functional Specification (User & Business Outcomes)

> 💡 **Agent Guidance:** Define the user experience and business outcomes clearly. Ensure permission models and boundary exclusions prevent scope creep.

### 2.1 Problem Statement & Jobs-to-Be-Done (JTBD)

- **Problem:** What user frustration or business gap does this feature address?
- **JTBD Statement:**
  > When **[situation/context]**, I want to **[perform action / utilize capability]**, so that **[achieve desired outcome / business value]**.

### 2.2 User Workflows & Experience

1. **Discovery & Navigation:** Where does the user access this in WordPress admin? (e.g. sidebar menu, tab under Settings, block in editor).
2. **Primary User Flow:** Step-by-step path the user takes to complete the primary action.
3. **UI States & Feedback:**
   - **Empty State:** First-time onboarding copy and call-to-action button.
   - **Loading State:** Skeleton loaders or WPDS spinners during asynchronous API fetches.
   - **Success State:** Non-intrusive WPDS notice banner or toast confirmation.
   - **Error State:** Descriptive inline validation errors and actionable error messages.

### 2.3 Permissions & Security Model

- **Required Capability:** `[e.g., manage_options | edit_posts | custom_capability]`
- **Authorization Check:** `current_user_can( '[capability]' )` enforced in REST permission callbacks and admin menu registrations.
- **Data Sanitization & Escaping:** Input sanitization via `sanitize_text_field`, `rest_sanitize_boolean`, output escaping via `esc_html`, `esc_attr`, `wp_kses_post`.
- **CSRF & Nonce Protection:** `wp_rest` nonce verification for REST calls via `X-WP-Nonce`.

### 2.4 Scope Boundaries

#### In-Scope Deliverables

- [ ] Backend domain model, repository interface, and concrete WordPress storage adapter.
- [ ] Dependency injection service provider registered in app lifecycle.
- [ ] REST API controller with full schema definitions and permission callbacks.
- [ ] React admin UI or Gutenberg block interface using WPDS components.
- [ ] Five-tier test suite (Unit, Jest, Bruno, Playwright).

#### Explicitly Out-of-Scope (Deferred)

- *List items deliberately excluded from this phase to prevent scope creep.*

---

## 3. Technical Specification (Hexagonal & WordPress Architecture)

> 💡 **Agent Guidance:** Follow clean hexagonal/DDD architecture. Keep domain logic pure and free of WordPress functions (`get_option`, `wpdb`, etc.). Inject repositories and services via the DI container.

### 3.1 Domain Model (Pure PHP and WordPress not HTML and CSS)

- **Namespace:** `AiReadyPlugin\Backend\Apps\[AppName]\Domain\`
- **Entities & Value Objects:**
  - `[EntityName]`: Encapsulates core state and validation invariants.
  - `[ValueObjectName]`: Immutable value object with guard clauses.
- **Domain Exceptions:**
  - `[AppName]DomainException`: Thrown when business invariants are breached.

### 3.2 Infrastructure & Storage Strategy

- **Storage Paradigm:** `[Options API | Post Meta / CPT | Custom Database Table via dbDelta]`
- **Repository Contract:** `AiReadyPlugin\Backend\Apps\[AppName]\Domain\[EntityName]RepositoryInterface`
- **Repository Implementation:** `AiReadyPlugin\Backend\Apps\[AppName]\Infrastructure\WordPress[EntityName]Repository`
  - Translates WordPress storage data to/from pure domain entities.

### 3.3 Service Provider & Container Registration (ADR-0002)

- **Provider:** `AiReadyPlugin\Backend\Apps\[AppName]\[AppName]ServiceProvider`
- **Bindings:**

  ```php
  // Register in container:
  $container->singleton(
      [EntityName]RepositoryInterface::class,
      fn( Container $c ) => new WordPress[EntityName]Repository()
  );
  ```

- **Hooks:** Hook registrations placed inside the service provider `register()` or `boot()` method (never write procedural hooks in the root plugin file).

### 3.4 REST API & OpenAPI Schema (ADR-0011)

> ⚠️ **Critical Invariant:** Never manually edit `docs/api/openapi.yaml`. Declare all route arguments, schemas, and summaries inside the REST controller.

- **Controller:** `AiReadyPlugin\Backend\Apps\[AppName]\Rest\[Endpoint]Controller`
- **Route:** `[METHOD] /wp-json/ai-ready/v1/[endpoint]`
- **Operation ID:** `[uniqueOperationId]`
- **Permissions Callback:** Checks user capabilities and returns boolean or `WP_Error`.
- **OpenAPI Schema Sync:**

  ```bash
  npm run openapi:generate # Regenerate docs/api/openapi.yaml from controllers
  npm run openapi:check    # Verify zero specification drift
  npm run openapi:lint     # Validate OpenAPI 3.1 syntax with Redocly
  ```

### 3.5 Frontend Admin UI / Block (ADR-0005, ADR-0008, WPDS)

- **Entry Point:** `src/frontend/apps/[AppName]/index.tsx`
- **Component Structure:**
  - Main App View: Structured using `Card`, `CardHeader`, `CardBody`, and `CardFooter`.
  - Sidebar Navigation: Vertical tabs with icons from `@wordpress/icons` if multi-view.
  - Feedback Elements: WPDS `Notice` or `Snackbar` for asynchronous state notifications.
  - Internationalization: All strings wrapped with `__( 'Text', 'ai-ready-wp-plugin-boilerplate' )`.

---

## 4. Five-Tier Testing Pyramid & Acceptance Criteria

> 💡 **Agent Guidance:** Write tests alongside feature implementation (TDD). Every tier provides unique confidence.

### 4.1 Acceptance Criteria Checklist

- [ ] **AC-01 (Happy Path):** User can successfully perform the primary action and state persists.
- [ ] **AC-02 (Validation & Errors):** Malformed input receives structured JSON errors (HTTP 400 / 422).
- [ ] **AC-03 (Security & Permissions):** Unauthorized requests receive HTTP 401 / 403.
- [ ] **AC-04 (UI States):** Interface renders loading spinner, clean empty state, and success notifications.
- [ ] **AC-05 (Zero Regressions):** Existing plugin functionality remains intact and tests pass.

### 4.2 Test Plan Across Pyramid Tiers

| Tier | Focus | Tooling | Execution Command |
| --- | --- | --- | --- |
| **Tier 1: Static Analysis** | Coding standards, types, syntax | WPCS, PHPStan (Level 6+), ESLint | `composer lint && composer analyse && npm run lint` |
| **Tier 2: Fast Unit Tests** | Pure PHP domain entities & services | PHPUnit (in-memory) | `composer test:unit` |
| **Tier 3: Frontend Component Tests** | React components, UI interactions | Jest, React Testing Library | `npm run test:unit` |
| **Tier 4: REST Contract Tests** | API contracts, schema verification | Bruno CLI (`tests/bruno/`) | `npm run test:rest` |
| **Tier 5: E2E & Visual Tests** | Real browser workflows & snapshots | Playwright (`tests/e2e/`) | `npm run test:e2e` |

---

## 5. Execution Roadmap & Agent Instructions

### 5.1 Step-by-Step Implementation Sequence

1. **Pre-Implementation Setup:**
   - Create pre-implementation audit log in `docs/implementation-logs/YYYY-MM-DD-phase-XX-[short-name].md`.
   - Complete ADR gate evaluation; create new ADR via `npm run adr:new` if required.
2. **Domain & Application Layer (TDD):**
   - Author PHPUnit test cases for domain entities and value objects.
   - Implement entities, value objects, and domain exceptions in pure PHP.
3. **Infrastructure & Service Provider:**
   - Implement concrete repository bridging to WordPress storage.
   - Register bindings and hooks in `[AppName]ServiceProvider`.
4. **REST API & OpenAPI Regeneration:**
   - Implement REST controller extending `WP_REST_Controller` with declared schemas.
   - Author Bruno contract tests in `tests/bruno/`.
   - Run `npm run openapi:generate` and `npm run openapi:check`.
5. **Frontend UI & WPDS Integration:**
   - Implement React components using WPDS design tokens and `@wordpress/components`.
   - Author Jest unit tests for UI rendering and interactions.
6. **E2E & Quality Verification:**
   - Run full test suite across all 5 tiers.
   - Verify zero lint or static analysis issues.

### 5.2 Post-Implementation Closeout

- [ ] **Unreleased Changelog Staging (Mandatory Invariant):**
  - Record concise bullets under `## [Unreleased]` in `CHANGELOG.md` using `npm run changelog:add`.
- [ ] **Prompt-Aware Version Bump Check:**
  - Check the initial user prompt. If and only if the user explicitly requested a version bump, run:

    ```bash
    npm run update-version -- [patch|minor|major] -d "Phase closeout approval"
    ```

  - Otherwise, leave version increment as a manual task for the developer.
- [ ] **Finalize Implementation Audit Log:**
  - Complete post-implementation verification checklist and test results in `docs/implementation-logs/YYYY-MM-DD-phase-XX-[short-name].md`.
- [ ] **Update Documentation & Manifest:**
  - Synchronize `docs/` and update `MANIFEST.md` if files were created, moved, or deleted.
