# WordPress Agent Skills Integration & Composition

This document defines how `wp-architecture-decision-records` integrates cleanly with the broader WordPress Agent Skills ecosystem through **composition rather than duplication**.

---

## 1. The Separation of Responsibilities

```text
┌────────────────────────────────────────────────────────┐
│            wp-architecture-decision-records            │
│  Governs WHY an architectural choice was made and      │
│  WHAT durable constraints must be enforced.            │
└───────────────────────────┬────────────────────────────┘
                            │
               Delegates HOW to implement:
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
│     wp-plugin-   │ │  wp-wpcli-  │ │   wp-rest-api    │
│    development   │ │   and-ops   │ │                  │
│ Core hooks, data │ │ Diagnostics │ │ Endpoint routes, │
│ access, security │ │  migrations │ │ permissions      │
└──────────────────┘ └─────────────┘ └──────────────────┘
```

The core principle:
- **`wp-architecture-decision-records` owns:** Rationale, trade-offs, non-goals, architectural boundaries, and verification criteria.
- **WordPress Domain Skills own:** WordPress API procedures, hook registration, capability validation code, and command execution.

---

## 2. Skill Interoperability Mapping

### With `wp-plugin-development`
- **When to compose:** When an accepted ADR mandates a plugin lifecycle behavior (activation migration, database schema creation) or security architecture.
- **Example Composition:**
  - *ADR Record:* "ADR-0003: Use versioned schema migrations via dbDelta() during plugin activation."
  - *Delegation to `wp-plugin-development`:* The agent loads `wp-plugin-development` to inspect `register_activation_hook()`, sanitize schema strings, and ensure rewrite rules are not flushed incorrectly.

### With `wp-wpcli-and-ops`
- **When to compose:** When an ADR defines an operational interface, maintenance routine, or migration command.
- **Example Composition:**
  - *ADR Record:* "ADR-0004: All batch data migrations must be executable offline via WP-CLI."
  - *Delegation to `wp-wpcli-and-ops`:* The agent loads `wp-wpcli-and-ops` to scaffold the command using `WP_CLI::add_command()`, handle progress bars, and support dry-run flags.

### With `wp-rest-api`
- **When to compose:** When an ADR dictates API namespace versioning or authentication contracts.
- **Example Composition:**
  - *ADR Record:* "ADR-0005: All public webhook endpoints must live under `/wp-json/my-plugin/v1/webhooks` with HMAC-SHA256 signature verification."
  - *Delegation to `wp-rest-api`:* The agent loads `wp-rest-api` to register routes, attach `permission_callback`, and define JSON Schema validation.

### With `wp-block-development`
- **When to compose:** When an ADR establishes block rendering strategy (server-rendered dynamic blocks vs. static HTML saves).
- **Example Composition:**
  - *ADR Record:* "ADR-0006: Use dynamic server rendering for analytics blocks to prevent post markup invalidation."
  - *Delegation to `wp-block-development`:* The agent loads `wp-block-development` to configure `block.json` with `render: "file:./render.php"`.

### With `wp-performance`
- **When to compose:** When an ADR sets caching rules or query performance budgets.
- **Example Composition:**
  - *ADR Record:* "ADR-0007: Cache external API responses in WordPress Transients for 15 minutes with stale-while-revalidate."
  - *Delegation to `wp-performance`:* The agent loads `wp-performance` to inspect transient autoloading bloat and profile SQL query counts.

---

## 3. Autonomous Agent Routing Protocol

When an agent is implementing an accepted ADR:

1. **Read the ADR first:** Extract the `Architectural Constraints` and `Verification & Fitness Functions`.
2. **Identify domain technology:** Does the ADR touch WordPress hooks, REST routes, WP-CLI, or blocks?
3. **Invoke corresponding skill:**
   - If WordPress hooks / security / lifecycle: consult `wp-plugin-development`.
   - If WP-CLI / database operations: consult `wp-wpcli-and-ops`.
   - If REST routes: consult `wp-rest-api`.
4. **Implement under constraints:** Ensure the implementation satisfies the ADR invariants without introducing prohibited shortcuts.
5. **Execute verification:** Run the verification command specified in the ADR.
