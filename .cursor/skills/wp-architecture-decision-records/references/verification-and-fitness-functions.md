# Verification & Architectural Fitness Functions

An architectural decision is only as durable as its verification. Without repeatable checks, architectural decisions suffer from gradual erosion as new contributors and coding agents add code.

---

## 1. The Architectural Fitness Function Concept

An **Architectural Fitness Function** is any automated or repeatable check that provides objective evidence about whether an architectural constraint continues to hold over time.

### Ownership Boundary
- **The ADR owns:** The durable architectural decision, its rationale, the binding constraints, and the link to verification.
- **The Fitness Function owns:** The verification contract (observable characteristic, threshold, command).
- **The Project Tooling owns:** The actual test execution and continuous integration (CI) enforcement.

Do NOT turn an ADR into a script execution log or temporary test runner. State the verification mechanism cleanly and allow CI to enforce it.

---

## 2. Alignment with the Five-Tier Testing Pyramid

For WordPress plugin engineering, fitness functions should align naturally with the project's existing testing tiers:

```text
               ▲
              / \
             /   \      Tier 5: Visual & E2E (Playwright)
            /     \     Verify user-visible architectural flows
           /───────\
          /         \   Tier 4: Contract Tests (Bruno)
         /           \  Verify REST API route & auth contracts
        /─────────────\
       /               \ Tier 3: Frontend Unit (Jest / RTL)
      /                 \ Verify React component invariants
     /───────────────────\
    /                     \ Tier 2: Backend Tests (PHPUnit)
   /                       \ Invariant tests, DB isolation, mock boundaries
  /─────────────────────────\
 /                           \ Tier 1: Static Quality (PHPCS & PHPStan)
/                             \ Enforce prohibited functions, types, namespaces
───────────────────────────────
```

### Tier 1: Static Fitness Functions (PHPStan & PHPCS)
- **Scope:** Fast, compile-time invariant enforcement.
- **Examples:**
  - *PHPStan Custom Rule / Level 6:* Ensure Domain layer classes have zero imports from `WordPress\Core` or `Automattic\WooCommerce`.
  - *PHPCS Custom Sniff:* Disallow direct usage of global `$wpdb` outside designated repository adapters.
  - *Command:* `composer analyse` or `composer lint`

### Tier 2: Backend Invariant Tests (PHPUnit)
- **Scope:** In-memory, sub-millisecond invariant validation.
- **Examples:**
  - *Immutability Verification:* Verify that Value Objects throw exceptions when invalid data is injected.
  - *Mock Isolation:* Verify that domain services execute without accessing WordPress database tables.
  - *Command:* `composer test:unit`

### Tier 3: Contract & REST Verification (Bruno)
- **Scope:** Black-box API contract verification.
- **Examples:**
  - *Namespace & Versioning:* Verify that `/wp-json/my-plugin/v1/resource` adheres to declared JSON schemas and permissions.
  - *Command:* `npm run test:rest`

### Tier 4: Operational Diagnostics (WP-CLI)
- **Scope:** Environment, database schema, and background worker verification.
- **Examples:**
  - Verify that custom database tables exist and match the declared schema version.
  - Verify that Action Scheduler queues have zero fatal failed jobs.
  - *Command:* `wp my-plugin db-check` or `wp action-scheduler status`

---

## 3. Four Scope Levels of Fitness Functions

When selecting a fitness function, use the narrowest scope that can falsify the architectural claim:

1. **Atomic:** A single class, configuration, or function invariant (e.g. "Class `Money` must be immutable").
2. **Structural:** Layer boundaries, circular dependency detection, forbidden imports (e.g. "Domain cannot call Infrastructure").
3. **Scenario:** An end-to-end integration path (e.g. "Payment webhook retries 3 times before dead-letter logging").
4. **Holistic:** System-wide performance or resource ceilings (e.g. "Admin dashboard renders in under 200ms with <= 15 SQL queries").

---

## 4. Proportionality Rule

**Do NOT invent an elaborate fitness function for every ADR.**
- If an architectural constraint can be checked by an existing PHPUnit test or PHPStan rule, simply cite the command:
  ```markdown
  ## Verification & Fitness Functions
  - **Mechanism:** PHPUnit layer isolation test
  - **Command:** `composer test:unit tests/phpunit/unit/Domain/OrderInvariantTest.php`
  ```
- Use a dedicated `assets/fitness-function-record.md` only for high-stakes, cross-cutting, or long-running architectural governance checks.
