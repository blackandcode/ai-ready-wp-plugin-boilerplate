# ADR-Worthiness Gate & Decision Triggers

Autonomous coding agents and human engineers must evaluate whether a technical choice is **architecturally significant** before drafting an Architecture Decision Record. This gate prevents both silent architectural drift and unmanageable "ADR spam."

---

## 1. The Decision Classification Gate

When evaluating any technical task or proposed code change, the agent must evaluate the decision against five discrete classification states:

| Classification State | Meaning & Required Action |
|---|---|
| `ADR_REQUIRED` | The decision is architecturally significant, expensive to reverse, or introduces a major new dependency/pattern. **Stop implementation and author an ADR immediately.** |
| `ADR_RECOMMENDED` | The decision involves competing trade-offs that future engineers will need to understand. Propose the ADR to the team before proceeding. |
| `ADR_NOT_NEEDED` | The change is an implementation detail, standard WordPress API usage, or routine maintenance. **Proceed with implementation without an ADR.** |
| `EXISTING_ADR_GOVERNS` | A prior accepted ADR already dictates this exact architectural pattern. **Obey the existing ADR's constraints; do not create a duplicate.** |
| `EXISTING_ADR_MAY_REQUIRE_SUPERSESSION` | The proposed change directly contradicts or evolves an existing accepted ADR. **Draft a new ADR that explicitly supersedes the prior record.** |

---

## 2. Positive Criteria: When an ADR is REQUIRED or RECOMMENDED

A technical decision deserves an ADR if it satisfies **at least one** of the following conditions:

1. **High Reversal Cost:** Reversing the decision in 6 months would require extensive refactoring, data migration, or database downtime (e.g. database schema architecture, asynchronous execution model).
2. **Cross-Cutting Impact:** The decision dictates patterns that multiple modules, classes, or future developers must follow (e.g. plugin-wide dependency injection, error-handling conventions, public hook design).
3. **Data Model Architecture:** Introducing custom database tables, schema migration strategies, post meta vs. options trade-offs, or multisite data isolation models.
4. **Significant Dependencies:** Adding a new third-party Composer package, an external JavaScript build pipeline, or an external cloud SDK.
5. **Security Architecture:** Custom capability hierarchies, external token/credential storage, webhook authentication schemes, or customer data isolation boundaries. (Routine nonce/sanitization calls do NOT require an ADR).
6. **External Integration Contracts:** Public REST API namespaces, webhook processing pipelines, or breaking change deprecation policies.
7. **Performance & Scalability:** Custom caching strategies, transient eviction policies, or background batching limits.
8. **Ecosystem Compatibility:** WooCommerce High-Performance Order Storage (HPOS) support vs. legacy post tables; Gutenberg dynamic rendering vs. static block saves.

---

## 3. Negative Criteria: When an ADR is NOT Needed (Anti-Spam Rules)

To prevent cluttering the repository with trivial records, do **NOT** create an ADR for:

- **Routine Bug Fixes:** Correcting logic errors, null pointer checks, or edge-case handling.
- **Cosmetic & Styling Changes:** CSS adjustments, admin layout tweaks conforming to WPDS, or wording updates.
- **Typo & Documentation Fixes:** Correcting spelling in strings or updating inline docblocks.
- **Standard WordPress API Usage:** Calling `register_post_type()`, `add_action()`, `wp_verify_nonce()`, or `sanitize_text_field()` in standard ways where no architectural fork exists.
- **Patch Dependency Updates:** Bumping minor or patch versions of existing dependencies (e.g. updating PHPStan from 1.10.1 to 1.10.2).
- **Internal Refactoring Within Boundaries:** Renaming a private method, extracting a helper function, or restructuring a method body that preserves existing class contracts.
- **Decisions Mandated by Existing Standards:** Choices already mandated by the Product Charter, WordPress Coding Standards (WPCS), or accepted ADRs.

---

## 4. Proactive Agent Triggers

When an autonomous AI agent is executing a coding task and encounters any of the following triggers, it must **pause and surface the architectural decision** rather than silently committing the change:

```text
[TRIGGER ENCOUNTERED]
       │
       ▼
1. About to add a new third-party Composer or npm dependency?
2. About to create a custom database table or run dbDelta()?
3. About to switch from WP-Cron to Action Scheduler or background processing?
4. About to alter a public REST API route schema or authentication model?
5. About to introduce a design pattern that contradicts an accepted ADR?
       │
       ▼
  YES ──► PAUSE: Surface decision to human or draft ADR under ADR-worthiness gate.
   NO ──► PROCEED: Continue implementation under existing standards.
```

### Protocol for Surfacing Proactive Triggers
When surfacing a trigger to the human developer, state:
1. **The Architectural Fork:** "I have reached a point where we need to choose between Action Scheduler and WP-Cron for processing webhooks."
2. **Why it Matters:** "This choice affects task retry durability, database table creation, and execution reliability under high server loads."
3. **Recommendation:** "Based on our reliability requirements, I recommend drafting an ADR for Action Scheduler using the MADR template."
