# ADR-0002: In-tree lightweight dependency injection container

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Core Architecture Team & AI Assistants
- **Consulted:** WordPress Plugin Standards Group
- **Informed:** All Contributors

---

## Context

WordPress plugins often suffer from tight coupling, procedural global functions, and untestable hook spaghetti. While enterprise PHP frameworks rely on heavyweight Dependency Injection (DI) containers (such as Symfony DI, PHP-DI, or Laravel Container), bundling these into a standalone WordPress plugin introduces significant risk:

1. Composer dependency conflicts when another active plugin or theme bundles an incompatible version of the same container library.
2. Unnecessary runtime memory overhead and slow cold-start performance in shared hosting environments.
3. Over-engineering for typical plugin bounded contexts.

At the same time, avoiding DI entirely results in untestable static singletons, global state, and difficult-to-mock dependencies in unit tests.

## Decision

We will implement an **in-tree, zero-dependency, lightweight PSR-11 compliant Dependency Injection container** under `src/Bootstrap/Container.php`, coupled with a `ServiceProviderInterface` contract (`src/Bootstrap/ServiceProviderInterface.php`).

All plugin services, controllers, and hook listeners must be registered via dedicated service providers. The root plugin file (`ai-ready-wp-plugin-boilerplate.php`) is strictly a procedural bootstrapping entry point that instantiates the container and boots providers.

## Rationale

1. **Conflict Isolation:** An in-tree class in the plugin's own namespace (`WordPressAI\PluginBoilerplate\Bootstrap\Container`) eliminates all vendor collision and dependency hell.
2. **Instant In-Memory Testing:** Tests can instantiate a fresh, isolated `Container` instance in pure PHPUnit unit tests without loading WordPress core (`ABSPATH`), achieving sub-millisecond execution speeds.
3. **Explicit Lifecycle:** Service providers separate registration (`register()`) from execution (`boot()`), guaranteeing that all dependencies are resolved before WordPress action hooks are attached.
4. **Zero Overhead:** The container is lightweight (~100 LOC), utilizing PHP closures for lazy evaluation.

## Consequences

### Positive

- Strict separation of concerns adhering to Hexagonal/DDD architectural boundaries.
- Services depend on explicit interfaces rather than global state or static singletons.
- Pure unit tests run in-memory without database or WordPress runtime dependencies.
- Zero external Composer runtime dependencies required for the DI kernel.

### Negative & Trade-offs

- No autowiring or reflection-based automatic dependency resolution; dependencies must be explicitly wired in service provider definitions.
- New services require an explicit registration entry in a `ServiceProvider`.

### Risks & Mitigations

- **Risk:** Developers or AI agents might be tempted to call `add_action()` or `add_filter()` directly in the root plugin file or within domain entities.
  **Mitigation:** `AGENTS.md` and `.cursor/rules/adr-evaluation.mdc` strictly prohibit procedural hooks outside dedicated service providers. CI static analysis (PHPCS/PHPStan) flags root-level procedural registrations.

## Non-Goals

- Building a full-blown reflection autowiring framework or compiling container definitions to cache files on disk.
- Exposing the container as a global static accessor (`Container::getInstance()`); the container instance is encapsulated within the plugin bootstrap lifecycle.

## Architectural Constraints

- Domain logic (`src/Domain/`) must remain pure PHP, immutable where applicable, and have zero dependency on the DI container or WordPress APIs.
- Hook attachments must reside exclusively within the `boot()` method of `ServiceProviderInterface` implementations.
- No direct calls to `add_action` or `add_filter` are allowed in the root plugin file.

## Verification & Fitness Functions

- **Unit Test Verification:** `tests/phpunit/unit/Bootstrap/ContainerTest.php` asserts binding registration, singleton resolution, factory resolution, and PSR-11 `NotFoundException` handling.
- **PHPStan Static Analysis:** `composer analyse` verifies that all registered services conform to their declared contracts.

## Reconsider When

- A future PHP or WordPress core initiative standardizes a native, core-provided PSR-11 container implementation that all plugins can reliably share without collision.

## Implementation References

- Container: `src/Bootstrap/Container.php`
- Service Provider Contract: `src/Bootstrap/ServiceProviderInterface.php`
- Core Plugin Provider: `src/Bootstrap/PluginServiceProvider.php`
- Unit Test: `tests/phpunit/unit/Bootstrap/ContainerTest.php`

## Related Decisions

- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** [ADR-0001](0001-record-architecture-decisions.md)
