# Agent-Readiness Review Checklist

Before an Architecture Decision Record is finalized or submitted for human acceptance, the drafting agent must perform an **Agent-Readiness Review**.

The objective of this review is to ensure the ADR is **self-contained, actionable, and durable** so that future engineers and AI agents can execute work under its guidance without guessing or introducing architectural regressions.

---

## 1. The Nine Quality Checkpoints

### 1. Title & Metadata Completeness
- [ ] Title is an imperative, present-tense action phrase (e.g. `Adopt Action Scheduler for background jobs`).
- [ ] Status is a valid lifecycle state (`proposed`, `accepted`, `rejected`, `deprecated`, `superseded`).
- [ ] Date is in `YYYY-MM-DD` format.
- [ ] Deciders/Owners are identified.

### 2. Context & Problem Statement
- [ ] Explains *why now* — what broke, what changed, or what business/technical constraint prompted the decision?
- [ ] Self-contained: Does not rely on unwritten tribal knowledge or private Slack conversations.
- [ ] Cites actual repository context (e.g. current WordPress versions, hosting constraints, high table query volume).

### 3. Clear, Active Decision
- [ ] Stated in clear, active voice ("We will adopt Action Scheduler..." rather than "Maybe we should consider...").
- [ ] Concrete and actionable: Specifies the architectural pattern or technology clearly.

### 4. Honest Rationale & Real Trade-offs
- [ ] Explains why the selected option won against the decision drivers.
- [ ] Consequence section honestly admits drawbacks, operational overhead, and risks.
- [ ] If MADR: Alternatives are genuine candidates, not fabricated strawmen.

### 5. Explicit Non-Goals
- [ ] Lists at least one explicit non-goal to protect future implementations from scope creep.

### 6. Durable Architectural Constraints
- [ ] Articulates non-negotiable invariants that all future implementations and agents must preserve.
- [ ] **Durable Invariant Rule:** Invariants must NOT be tied to fragile line numbers or transient file paths that break upon normal refactoring.

### 7. Verifiable Fitness Functions
- [ ] Identifies an automated or repeatable verification mechanism (PHPUnit test, PHPCS sniff, PHPStan level, WP-CLI check).
- [ ] Cites an executable command (e.g. `composer test:unit`) and an unambiguous pass/fail condition.

### 8. Concrete Reconsideration Triggers
- [ ] Specifies objective, measurable triggers that will cause the team to revisit the decision.
- [ ] Zero vague phrases (e.g. ❌ "Reconsider when needed").

### 9. Supersession & Referential Integrity
- [ ] If superseding an earlier ADR: old ADR is linked via `Supersedes:` and updated to `superseded` with `Superseded by:`.
- [ ] All internal Markdown links resolve to real files on disk.

---

## 2. Review Summary Output Format

When presenting the review to a human or logging the pre-flight check, format the report as follows:

```markdown
### Pre-Flight ADR Review: ADR-{{NUMBER}}

✅ **Passes:**
- Context is self-contained and reflects repository PHP/WP constraints.
- Architectural constraints define clear invariants for future agents.
- Verification command is executable and testable.
- Reconsideration condition contains measurable traffic thresholds.

⚠️ **Gaps Found:**
- [Gap 1]: Non-goals section was empty. Suggested fix: Add "Out of scope: Synchronizing WooCommerce orders in real-time."
- [Gap 2]: Considered Options only listed 1 candidate. Suggested fix: Document why native WP-Cron was evaluated and rejected.

**Recommendation:** Ship it / Fix gaps first / Needs more intent discovery
```
