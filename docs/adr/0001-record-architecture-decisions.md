# ADR-0001: Record architecture decisions

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Development Team & AI Engineering Assistants
- **Consulted:** Architecture Stakeholders
- **Informed:** All Contributors

---

## Context

We need to record architectural, design, and structural decisions made in this WordPress plugin. Without an explicit, durable record of decisions, team members and autonomous AI coding agents lack visibility into past trade-offs, leading to repeated debates, accidental architectural drift, and regressions.

## Decision

We will capture all architecturally significant decisions using Architecture Decision Records (ADRs) stored directly in this repository under the version-controlled decision directory.

## Rationale

Storing ADRs as plain Markdown files in version control keeps architectural rationale co-located with the source code. Both human engineers and AI coding agents can read, verify, and consult past decisions before proposing modifications.

## Consequences

### Positive
- Decisions are documented close to the code, searchable, and version-tracked with Git history.
- AI coding agents can consult existing accepted ADRs to adhere strictly to project invariants.
- Historical context is preserved when developers or agents join the codebase.

### Negative & Trade-offs
- Slight overhead before making major architectural changes (interview, intent capture, review).
- Requires discipline to update statuses when decisions are superseded.

### Risks & Mitigations
- **Risk:** Stale records after refactoring.
  **Mitigation:** The ADR owns durable architectural decisions and invariants, not ephemeral file paths or line numbers.

## Non-Goals
- Recording trivial bug fixes, styling tweaks, cosmetic changes, or routine WordPress hook registrations.
- Serving as a temporary sprint task tracker or detailed work-order document.

## Architectural Constraints
- All architecturally significant changes must reference or create an ADR.
- Accepted ADRs are immutable historical records; modifying a past architectural choice requires drafting a new ADR that explicitly supersedes the prior one.

## Verification & Fitness Functions
- **Verification Mechanism:** Periodic repository audit using `validate-adr.mjs`.
- **Target Condition:** All ADRs have valid frontmatter, non-broken references, and status consistency.

## Reconsider When
- An alternative architectural record standard is officially adopted across the organization.

## Implementation References
- **Directory:** `docs/adr/`
- **Tooling:** `wp-architecture-decision-records` agent skill

## Related Decisions
- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** None
