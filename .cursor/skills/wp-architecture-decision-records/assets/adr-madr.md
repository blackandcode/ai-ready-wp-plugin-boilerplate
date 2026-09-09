# ADR-{{NUMBER}}: {{TITLE}}

- **Status:** {{STATUS}} <!-- proposed | accepted | rejected | deprecated | superseded -->
- **Date:** {{DATE}}
- **Deciders:** {{DECIDERS}}
- **Consulted:** {{CONSULTED}}
- **Informed:** {{INFORMED}}

---

## Context and Problem Statement

<!-- What is the problem we are trying to solve? Describe the technical context, current system architecture, and why a decision must be made now. -->

## Decision Drivers

<!-- What forces, constraints, and requirements influence this choice? (e.g., WordPress compatibility, memory limits, database write volume, maintainability, third-party dependency safety) -->
1. <!-- Driver 1: e.g. Zero third-party runtime dependencies -->
2. <!-- Driver 2: e.g. Sub-millisecond execution in unit tests -->
3. <!-- Driver 3: e.g. Compatible with WordPress Multisite and single-site installations -->

## Considered Options

### Option 1: {{OPTION_1_NAME}}
<!-- Brief description of Option 1 -->
- **Good, because:** <!-- Advantage 1 -->
- **Good, because:** <!-- Advantage 2 -->
- **Bad, because:** <!-- Disadvantage 1 -->
- **Bad, because:** <!-- Disadvantage 2 -->

### Option 2: {{OPTION_2_NAME}}
<!-- Brief description of Option 2 -->
- **Good, because:** <!-- Advantage 1 -->
- **Good, because:** <!-- Advantage 2 -->
- **Bad, because:** <!-- Disadvantage 1 -->
- **Bad, because:** <!-- Disadvantage 2 -->

### Option 3: {{OPTION_3_NAME}} <!-- Optional additional option -->
<!-- Brief description of Option 3 -->
- **Good, because:** <!-- Advantage 1 -->
- **Bad, because:** <!-- Disadvantage 1 -->

## Decision Outcome

- **Chosen Option:** {{CHOSEN_OPTION}}
- **Rationale:** <!-- Why did this option win against the decision drivers and constraints compared to the alternatives? -->

## Consequences

### Positive
- <!-- Positive outcome 1 -->
- <!-- Positive outcome 2 -->

### Negative & Trade-offs
- <!-- Trade-off or complexity introduced 1 -->
- <!-- Trade-off or complexity introduced 2 -->

### Risks & Mitigations
- **Risk:** <!-- Identified architectural, operational, or security risk -->
  **Mitigation:** <!-- How the risk is managed or prevented -->

## Non-Goals

<!-- What is explicitly out of scope for this decision? -->
- <!-- Non-goal 1 -->
- <!-- Non-goal 2 -->

## Architectural Constraints

<!-- Durable invariants that future implementations and coding agents MUST preserve. Keep these durable rather than tied to transient files. -->
- <!-- Invariant 1: e.g. "Direct SQL queries outside CustomTableRepository are strictly forbidden." -->
- <!-- Invariant 2: e.g. "All background jobs must be idempotent and accept an execution context." -->

## Verification & Fitness Functions

<!-- Repeatable checks proving compliance with this decision -->
- **Verification Mechanism:** <!-- e.g., PHPUnit Invariant Test / Custom PHPCS Sniff / PHPStan Rule / WP-CLI Audit -->
- **Automated Check:** `{{VERIFICATION_COMMAND}}`
- **Pass Threshold:** <!-- e.g., 0 violations, exit code 0 -->

## Reconsider When

<!-- Concrete, measurable triggers that will cause us to revisit this decision. Avoid vague "when needed". -->
- <!-- Condition 1: e.g., "Queue backlog regularly exceeds 10,000 pending items" -->
- <!-- Condition 2: e.g., "WooCommerce HPOS becomes mandatory and classic post tables are retired" -->

## Implementation References

<!-- Non-normative pointers to code entry points, issues, PRs, or specs. -->
- **Primary Entry Point:** `{{ENTRY_POINT}}`
- **Issue / PR:** `{{ISSUE_PR}}`

## Related Decisions

<!-- Link to old ADR if replacing one, e.g. [ADR-0001](0001-old.md), or None -->
- **Supersedes:** {{SUPERSEDES}}
- **Superseded by:** {{SUPERSEDED_BY}}
- **Related ADRs:** {{RELATED_ADRS}}
