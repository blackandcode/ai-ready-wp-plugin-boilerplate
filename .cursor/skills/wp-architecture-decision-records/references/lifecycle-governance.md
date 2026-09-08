# ADR Lifecycle and Governance

Architectural decisions evolve over time. This document outlines the status lifecycle, amendment rules, supersession workflows, and governance processes for Architecture Decision Records.

---

## 1. Lifecycle State Machine

```text
                  ┌────────────┐
                  │  Proposed  │
                  └──────┬─────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
      ┌───────────┐             ┌──────────┐
      │ Accepted  │             │ Rejected │
      └─────┬─────┘             └──────────┘
            │
      ┌─────┴─────────────────┐
      ▼                       ▼
┌────────────┐         ┌────────────┐
│ Superseded │         │ Deprecated │
│ (by ADR-X) │         └────────────┘
└────────────┘
```

### State Definitions:
1. **Proposed:** The ADR is currently under review by the engineering team or lead agent. It articulates a problem, considered options, and a proposed decision. It is **not yet binding**.
2. **Accepted:** The ADR has been approved by decision stakeholders. Its architectural constraints and invariants are **immediately binding** on all future code and AI agents.
3. **Rejected:** The proposed decision was formally evaluated and rejected. The record is preserved permanently in the decision log to prevent re-litigating the same proposal in the future.
4. **Deprecated:** The decision is no longer enforced (e.g. the feature was sunset, or WordPress core deprecated the underlying API), but was not directly replaced by a single successor ADR.
5. **Superseded:** A new architectural decision has replaced this record. The superseded record must link to its replacement, and the replacement must link back.

---

## 2. Supersession Workflow (Replacing an ADR)

When a previously accepted architectural decision must be changed or replaced, **never overwrite the original decision text**. Follow this deterministic supersession procedure:

### Step 1: Create the New ADR
Create the new ADR (e.g. `0004-replace-wp-cron-with-action-scheduler.md`) describing the new context, problem, options, and rationale. Set its status to `proposed` or `accepted`.

### Step 2: Establish Bidirectional Traceability Links
- In the **New ADR** (`ADR-0004`), record the link under `Related Decisions`:
  ```markdown
  - **Supersedes:** [ADR-0002](0002-use-wp-cron-for-background-tasks.md)
  ```
- In the **Old ADR** (`ADR-0002`), update its status and add the successor link:
  ```markdown
  - **Status:** superseded
  - **Superseded by:** [ADR-0004](0004-replace-wp-cron-with-action-scheduler.md)
  ```

### Step 3: Use Automated Tooling
Automate this transition deterministically using `scripts/set-adr-status.mjs`:
```bash
node scripts/set-adr-status.mjs \
  --adr 0002 \
  --status superseded \
  --superseded-by 0004 \
  --reason "WP-Cron failed to reliably trigger on low-traffic customer sites" \
  --update-index
```

### Step 4: Synchronize the Decision Index
Ensure the table in `README.md` (or `index.md`) reflects the updated statuses:
```markdown
| [ADR-0002](0002-use-wp-cron-for-background-tasks.md) | Use WP-Cron for background tasks | Superseded | 2026-01-10 | Superseded by [ADR-0004](0004-replace-wp-cron-with-action-scheduler.md) |
| [ADR-0004](0004-replace-wp-cron-with-action-scheduler.md) | Adopt Action Scheduler | Accepted | 2026-09-08 | Supersedes [ADR-0002](0002-use-wp-cron-for-background-tasks.md) |
```

---

## 3. Amendment Policy: Preserving Historical Truth

Accepted ADRs represent the architectural reality and constraints at a specific point in time.

- **Immutable by Default:** Do not retroactively rewrite context, options, or rationale.
- **Allowed Living Addenda:** If new operational learnings or benchmarking metrics emerge that do not change the core decision, append them under a dated addendum:
  ```markdown
  ## Status History
  ### 2026-09-08 (Benchmark Update)
  - Production benchmark showed Action Scheduler processed 120,000 tasks with zero dropped webhooks.
  ```

---

## 4. Reconsideration Governance

Every accepted ADR must define explicit, objective triggers under `## Reconsider When`.

### Good Reconsideration Triggers:
- "Reconsider when daily order synchronization volume exceeds 50,000 records."
- "Reconsider when WordPress core officially bundles SQLite or custom table APIs."
- "Reconsider when the minimum supported PHP version moves to 8.4."

### Forbidden Vague Triggers:
- ❌ "Reconsider when needed."
- ❌ "Revisit in the future."
- ❌ "Subject to team preference."
