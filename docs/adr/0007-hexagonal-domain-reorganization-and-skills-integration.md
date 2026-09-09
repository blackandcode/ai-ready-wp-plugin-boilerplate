# ADR-0007: Hexagonal domain reorganization and skills integration

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** Domain Modeling, WordPress Core & Tooling Specialists
- **Informed:** All Contributors

---

## Context

While earlier iterations of the boilerplate provided a basic settings repository, REST endpoints, and admin screens, the codebase lacked a rigorous separation between pure business logic and WordPress runtime infrastructure. Specifically:

1. Business validation was tightly coupled to WordPress procedural sanitization functions (`sanitize_text_field`, `sanitize_textarea_field`) inside an infrastructure schema class.
2. Multiple presentation layers (REST controllers, upcoming WP-CLI commands, and AI agent endpoints via the WordPress Abilities API) risked duplicating validation, default handling, and business state transitions.
3. The plugin did not expose a unified application service contract or event dispatching mechanism to notify external listeners or WordPress hooks of domain lifecycle events.
4. The Gutenberg block did not leverage the modern WordPress Interactivity API or server-side directive processing, relying on legacy static blocks.
5. Developer onboarding lacked declarative WordPress Playground blueprints for zero-install evaluation.

A comprehensive reorganization is required to align the boilerplate with all 32 agent skills, including Domain-Driven Design (DDD), Object-Oriented Programming (OOP) best practices, GoF/PoEAA design patterns, WordPress Abilities API, Block Interactivity API, and WP-CLI operations.

## Decision

We adopt a **strict Hexagonal (Ports & Adapters) / DDD architecture** with a **Shared Core Application Service**, standardizing across all presentation boundaries:

1. **Pure PHP 8.3 Domain Layer (`src/Settings/Domain/`, `src/Diagnostics/Domain/`):**
   - **Value Objects:** Primitives are encapsulated in immutable Value Objects (`GreetingMessage`, `FeatureFlag`, `Description`, `RestDebug`, `CacheTtl`, and PHP 8.3 backed string enum `DataRetentionPolicy`). Value Objects validate invariants, normalize strings, and throw typed Domain Exceptions.
   - **Aggregate Root:** `PluginSettings` serves as the consistency boundary, encapsulating internal Value Object states, enforcing business transaction limits, and recording Domain Events (`SettingsUpdatedEvent`, `RetentionPolicyChangedEvent`).
   - **Repository Contract:** `SettingsRepositoryInterface` defines the collection-like persistence contract in pure PHP terms, returning domain aggregates rather than raw option arrays.

2. **Application Layer & Shared Core Service (`src/Settings/Application/`, `src/Diagnostics/Application/`):**
   - **CQRS-Lite Pattern:** State mutations are encapsulated in command objects (`UpdateSettingsCommand`), and reads are encapsulated in query objects (`GetSettingsQuery`).
   - **Application Services:** `SettingsApplicationService` and `DiagnosticsService` act as the single source of truth for use case execution, coordinating repositories, validating commands, and publishing domain events.
   - **Event Bus:** An `EventDispatcher` observes aggregate state transitions and dispatches events both to internal in-memory subscribers and to standard WordPress action hooks (`airwp_settings_updated`).

3. **Infrastructure Layer (`src/Settings/Infrastructure/`, `src/Diagnostics/Infrastructure/`, `src/Support/`):**
   - **WordPress Option Storage:** `WordPressSettingsRepository` implements `SettingsRepositoryInterface`, persisting serialized aggregates to `wp_options` under `airwp_settings` with an explicit `autoload => false` policy to prevent options table bloat.
   - **Performance Utilities:** `TransientCache` wraps the WordPress Transients API with strict TTL validation and cache tag clearing.

4. **Unified Presentation Adapters (The Shared Core Pattern):**
   - **REST API (`src/Rest/`):** `SettingsController` is refactored into a thin presentation adapter that parses HTTP requests, calls `SettingsApplicationService`, and formats responses using `SettingsDTO`.
   - **WP-CLI (`src/Cli/`):** `PluginCliCommand` exposes `wp ai-ready settings get/update` and `wp ai-ready doctor`, directly delegating to the shared Application Services.
   - **WordPress Abilities API (`src/Abilities/`):** Exposes plugin operations (`get-settings`, `update-settings`, `get-diagnostics`) to AI agents under category `ai-ready-wp` via `/wp-json/wp-abilities/v1/`.

5. **Gutenberg Interactivity API & Block Patterns (`blocks/`, `patterns/`):**
   - Blocks adopt Block API v3 with `supports.interactivity: true`, declaring client-side stores via `viewScriptModule` (`view.ts`) and server-side directives (`data-wp-interactive`, `data-wp-bind`, `data-wp-on`).
   - Reusable layout templates are registered under `patterns/` as standard Block Patterns.

6. **Playground & Developer Tooling (`blueprint.json`, `wp-cli.yml`):**
   - Declarative `blueprint.json` enables instant browser-based execution on WordPress Playground.

## Rationale

1. **Elimination of Duplicated Business Logic:** By routing REST, WP-CLI, and Abilities API requests through `SettingsApplicationService`, business rules, authorization, and sanitization are implemented once and applied consistently.
2. **Sub-millisecond In-Memory Testing:** Pure domain entities and value objects can be tested exhaustively with PHPUnit in memory without requiring a running WordPress database or slow HTTP mocks.
3. **AI Agent Compatibility:** Exposing domain operations via the WordPress Abilities API makes the plugin natively discoverable and controllable by autonomous AI coding and site management agents.
4. **Resilience to WordPress Core Changes:** The domain model is decoupled from WordPress core APIs. If storage mechanisms or APIs evolve, only infrastructure adapters require updates.

## Consequences

### Positive

- Strict hexagonal separation guarantees testability, maintainability, and clean code standards.
- Fast, deterministic TDD cycles with in-memory domain tests.
- Seamless compatibility with AI agents, WP-CLI pipelines, REST clients, and React admin interfaces.
- Prevents database autoload bloat via explicit option autoloading configurations.

### Negative & Trade-offs

- Increased file count and class overhead (Value Objects, DTOs, Commands, Interfaces).
- Requires developers and AI agents to understand DDD patterns and respect hexagonal boundaries.

### Risks & Mitigations

- **Risk:** Developers or agents might bypass `SettingsApplicationService` and call `update_option()` directly.
  **Mitigation:** `WordPressSettingsRepository` is private to the infrastructure layer, and `phpstan-wordpress` analysis at Level 6+ combined with code reviews prevents rogue `update_option` calls.

## Non-Goals

- Implementing a heavyweight third-party ORM or external framework dependency (Symfony/Laravel).
- Storing high-volume transactional data in `wp_options` (future entities with relational requirements will use Custom Post Types or custom database tables via dedicated ADRs).

## Architectural Constraints

- Domain layer classes must NEVER import WordPress functions, `$wpdb`, or HTTP globals.
- All presentation adapters (REST, WP-CLI, Abilities) must remain thin and delegate exclusively to Application Services.
- Option keys and hook names must retain the established prefix (`airwp_`).

## Verification & Fitness Functions

- **ADR Validator:** `npm run adr:validate` confirms structural and referential integrity of this decision.
- **Pure Unit Tests:** `vendor/bin/phpunit --testsuite=Unit` executes all Value Object and Aggregate tests in memory.
- **Toolchain Tests:** `npm run test:environment`, `npm run test:versioning`, `npm run test:scaffold` pass with zero regressions.
- **Rest Contract Tests:** Bruno suites in `tests/bruno/` verify REST and Abilities API conformance.

## Reconsider When

- WordPress core introduces a native PHP Domain Modeling framework or replaces the Options API with typed schema entities.

## Implementation References

- Domain Model: `src/Settings/Domain/Model/PluginSettings.php`
- Value Objects: `src/Settings/Domain/ValueObject/`
- Application Service: `src/Settings/Application/SettingsApplicationService.php`
- Repository Contract: `src/Settings/Domain/Repository/SettingsRepositoryInterface.php`
- WordPress Repository: `src/Settings/Infrastructure/WordPressSettingsRepository.php`
- Abilities Provider: `src/Abilities/AbilitiesServiceProvider.php`
- CLI Provider: `src/Cli/CliServiceProvider.php`
