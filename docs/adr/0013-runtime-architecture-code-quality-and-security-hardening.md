# ADR-0013: Runtime Architecture, Code Quality and Security Hardening

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** WordPress Core Specialists, Security Guild, API Architects
- **Informed:** All Contributors
- **Amends / Extends:** [ADR-0003](0003-gutenberg-block-api-v3-standard.md), [ADR-0007](0007-hexagonal-domain-reorganization-and-skills-integration.md), [ADR-0009](0009-tripartite-app-centric-architecture.md), [ADR-0011](0011-generated-openapi-specification-from-wordpress-rest-controllers.md)

---

## Context and Problem Statement

As the boilerplate evolved to support modern agentic AI workflows, several architectural and security liabilities emerged across runtime initialization, developer tooling integration, block registration, and endpoint authorization:

1. **Entangled Runtime and Development Subsystems:** Developer tools (`DevOpenApiController`, `DeveloperBackendServiceProvider`, `OpenApiCliCommand`) were registered through runtime aggregates (`BackendServiceProvider`, `PluginCliCommand`), relying on runtime conditionals or `class_exists()` guards. In development repositories, classes always exist, meaning broken autoloading configurations could cause features to silently disappear rather than fail visibly.
2. **Missing Development Mode Abstraction:** Procedural checks (`wp_is_development_mode( 'plugin' )`, `wp_get_development_mode()`) were scattered across controllers, service providers, admin menus, and CLI commands rather than unified behind a single injectable infrastructure abstraction.
3. **Development Mode Misused as Authorization Boundary:** Development mode checks determine whether developer features and routes should be registered at all, but must never substitute for explicit user capability checks (`current_user_can()`) and nonce/REST authentication.
4. **Custom Block Discovery vs. WordPress Native APIs:** Block registration relied on manual `glob()` filesystem scanning across source directories (`src/frontend/apps/*/block.json`) with development fallback branches. Because the boilerplate baseline is WordPress 7.1+ (minimum 6.8+ required), WordPress provides a native metadata collection API (`wp_register_block_types_from_metadata_collection()`) that eliminates filesystem traversal and dual runtime paths.
5. **Inverted OpenAPI Dependency Graph:** The OpenAPI generator and YAML dumping pipeline resided in `src/framework/Rest/OpenApi/`, creating risk that runtime controllers or framework classes depend on developer generation tools rather than treating OpenAPI generation as an external consumer of runtime REST declarations.
6. **Unpredictable Provider Lifecycles:** Service providers occasionally performed hook registrations or context-specific work during instantiation rather than cleanly separating container registration (`register()`) from hook attachment (`boot()`).

---

## Decision Drivers

1. **Strict One-Way Dependency Isolation:** `Runtime` and `Framework` must never depend on or import classes from `Development`. `Development` may consume `Runtime` and `Framework`.
2. **Authoritative Development Mode Contract:** Provide a clean `DevelopmentMode` interface and concrete WordPress/test adapters so that environment decisions are centralized and deterministically testable in memory.
3. **Explicit Authorization Invariant:** Development mode controls feature availability, never authorization. Every REST route must enforce a non-empty `permission_callback` checking WordPress capabilities regardless of development mode.
4. **Native WordPress Block Metadata Collection:** Use WordPress 6.8+ `wp_register_block_types_from_metadata_collection()` with a compiled `build/blocks-manifest.php` and co-located assets, removing all custom `glob()` scanning and source-tree fallbacks.
5. **Context-Specific Initialization:** Hooks and services must be registered strictly within their applicable runtime context (Admin, REST, WP-CLI, Blocks, Frontend).
6. **Machine-Enforced Architecture Guardrails:** Automated PHPUnit and static tests must enforce dependency boundaries, route authorization, and security invariants.

---

## Decision Outcome

We adopt a comprehensive **Runtime Architecture, Code Quality, and Security Hardening** model across the plugin boilerplate:

### 1. Composition Root and DevelopmentMode Abstraction

We introduce a pure interface and adapters in `src/framework/Environment/`:

- `DevelopmentMode`: Defines `is_plugin_development(): bool` and `get_mode(): string`.
- `WordPressDevelopmentMode`: Concrete implementation invoking WordPress core environment APIs.
- `FakeDevelopmentMode`: Test double enabling deterministic unit testing of both enabled and disabled development environments without touching `wp-config.php`.

The plugin composition root (`src/framework/Kernel/Plugin.php`) binds `DevelopmentMode` into the DI container and uses it to conditionally register development providers:

```php
$development_mode = new WordPressDevelopmentMode();
$this->container->instance( DevelopmentMode::class, $development_mode );

$this->registry = new ServiceProviderRegistry( $this->container );
$this->registry->add_provider( new BackendServiceProvider() );
$this->registry->add_provider( new FrontendServiceProvider() );

if ( $development_mode->is_plugin_development() ) {
    $this->registry->add_provider( new DevelopmentServiceProvider() );
}
```

We explicitly forbid using `class_exists()` to conditionally load development services.

### 2. Quadripartite Architecture and Isolated Development Subsystem

The architectural organization expands from tripartite to a decoupled quadripartite structure:

```text
src/
├── framework/       # Shared kernel, DI container, event bus, development-mode contract
├── backend/         # Pure headless business logic and runtime REST controllers
├── development/     # Development-only REST endpoints, OpenAPI generators, and dev CLI
└── frontend/        # Presentation layer (Bridge/, apps/, blocks/, patterns/)
```

Composer autoloading reflects this boundary:

- `AIReady\WPPluginBoilerplate\Framework\` -> `src/framework/`
- `AIReady\WPPluginBoilerplate\Backend\` -> `src/backend/`
- `AIReady\WPPluginBoilerplate\Development\` -> `src/development/`
- `AIReady\WPPluginBoilerplate\Frontend\` -> `src/frontend/Bridge/`

Allowed Dependencies:

- `Runtime -> Framework`
- `Development -> Runtime`
- `Development -> Framework`

Strictly Forbidden Dependencies:

- `Framework -> Runtime`
- `Framework -> Development`
- `Runtime -> Development`

### 3. Separation of OpenAPI Declaration from Generation

- **Runtime REST Controllers:** Declare HTTP methods, capability checks (`permission_callback`), argument validation schemas (`args`), and standard OpenAPI operation metadata (`operationId`, `summary`, `tags`, `responses`). They contain zero imports of OpenAPI generator classes or YAML writers.
- **Development OpenAPI Pipeline:** Resides entirely in `src/development/OpenApi/`. It introspects registered runtime routes on demand via WP-CLI (`wp ai-ready openapi generate`) or the development endpoint (`GET /ai-ready-wp-dev/v1/openapi`), dumping deterministic YAML.

### 4. Native WordPress Block Metadata Collection (WordPress 6.8+ / 7.1+)

- `BlockRegistry` becomes a thin adapter delegating directly to `wp_register_block_types_from_metadata_collection( $blocks_path, $manifest_path )`.
- Custom `glob()` traversal, source tree inspection (`src/frontend/apps/*/block.json`), and development fallback branches are completely removed.
- The build pipeline (`@wordpress/scripts build-blocks-manifest`) generates `build/blocks-manifest.php` compiling metadata for all blocks with co-located build assets.

### 5. Global Security Baseline and REST Authorization Invariants

- **Authorization:** Every registered REST route must have an explicit `permission_callback`. For public endpoints, `__return_true` is declared explicitly; for privileged endpoints, `current_user_can( 'manage_options' )` is mandatory. Development endpoints require `manage_options` capability unconditionally.
- **REST Schemas:** Mutating endpoints (`POST`, `PUT`, `PATCH`) declare explicit argument schemas with `validate_callback` and `sanitize_callback` so WordPress validates types and boundaries before invoking controllers.
- **Input Safety:** Wholesale access to `$_POST`, `$_GET`, or `$_REQUEST` is prohibited. Code must read specific named keys and apply `wp_unslash()` followed by type-appropriate sanitization.
- **Database Safety:** All dynamic SQL must be parameterized through `$wpdb->prepare()`.
- **Output Safety:** Dynamic data rendered in PHP templates is late-escaped using `esc_html()`, `esc_attr()`, `esc_url()`, or `wp_kses_post()`.

### 6. Predictable Service Provider Lifecycle

- Constructors take only injected dependencies; they perform zero side effects, no database queries, and no hook attachments.
- `register()` binds interfaces and services into the DI container.
- `boot()` attaches WordPress hooks scoped strictly to the current execution context (`admin_menu`, `rest_api_init`, `init`, or `defined( 'WP_CLI' ) && WP_CLI`).

---

## Consequences

### Positive

- **Deterministic Architecture:** Eliminates silent feature disappearance caused by `class_exists()` guards.
- **Smaller Production Attack Surface:** When plugin development mode is off, development routes, tools, and CLI commands are never registered.
- **Native WordPress Performance:** Utilizing `wp_register_block_types_from_metadata_collection()` improves block loading performance and adheres to canonical WordPress standards.
- **Machine-Verifiable Compliance:** Automated architectural tests in PHPUnit fail CI if forbidden dependencies or missing REST permission callbacks are introduced.

### Negative & Trade-offs

- Requires generating `build/blocks-manifest.php` during the build step before blocks can be registered.
- Developers must explicitly set `WP_DEVELOPMENT_MODE` to `plugin` or `all` in `wp-config.php` to access dev tools and live OpenAPI endpoints.

## Architectural Constraints

1. **One-Way Subsystem Dependency:** `Framework` core components must never depend on `Backend` or `Development`. `Backend` (Runtime) must never depend on `Development`. `Frontend\Bridge` must never depend on `Development`.
2. **Development Mode Never Authorizes:** `DevelopmentMode` determines feature availability and route registration; it must never be used as an authorization check. All privileged endpoints must enforce `current_user_can()`.
3. **No Side Effects in Service Provider Constructors:** Service provider constructors must perform zero side effects, no database queries, and no hook attachments. Container bindings occur in `register()`; hook attachments occur in `boot()`.
4. **Native Block Metadata Collection:** Block registration must use `wp_register_block_types_from_metadata_collection` with `build/blocks-manifest.php`. No `glob()` filesystem scans or source directory inspection.
5. **Zero OpenAPI Generator Runtime Leakage:** Runtime REST controllers must never import or depend on `OpenApiGenerator` or `Symfony\Component\Yaml\Yaml`.

## Verification & Fitness Functions

- **Dependency Direction Architecture Tests:** `vendor/bin/phpunit tests/phpunit/unit/Architecture/DependencyDirectionTest.php`
- **Development Isolation Architecture Tests:** `vendor/bin/phpunit tests/phpunit/unit/Architecture/DevelopmentIsolationTest.php`
- **REST Security Contract Tests:** `vendor/bin/phpunit tests/phpunit/unit/Architecture/RestSecurityContractTest.php`
- **Block Registry Architecture Tests:** `vendor/bin/phpunit tests/phpunit/unit/Architecture/BlockRegistryTest.php`
- **Deterministic Security Baseline Audit:** `npm run lint:security` (`tools/security/audit-security-baseline.mjs`)
- **OpenAPI Drift & Lint Checks:** `npm run openapi:check` and `npm run openapi:lint`
- **Local Quality Gate:** `npm run check` (all 6 CI-parity checks exit with code `0`)

## Reconsider When

- WordPress Core introduces an alternative first-party dependency injection or service provider lifecycle container.
- WordPress Core deprecates `wp_register_block_types_from_metadata_collection` in favor of a newer block manifest paradigm.

## Implementation References

- **Development Mode Abstraction:** `src/framework/Environment/DevelopmentMode.php`
- **Development Subsystem:** `src/development/`
- **Architecture Unit Tests:** `tests/phpunit/unit/Architecture/`
- **Security Baseline Tool:** `tools/security/audit-security-baseline.mjs`
- **Native Block Registry:** `src/frontend/Bridge/Registry/BlockRegistry.php`

## Related Decisions

- **Amends:**
  - [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md) — In-tree lightweight dependency injection container
  - [ADR-0003](0003-gutenberg-block-api-v3-standard.md) — Gutenberg Block API v3 standard
  - [ADR-0009](0009-tripartite-app-centric-architecture.md) — Tripartite App-Centric Architecture
  - [ADR-0011](0011-generated-openapi-specification-from-wordpress-rest-controllers.md) — Generated OpenAPI specification from WordPress REST controllers
