# ADR-{{NUMBER}}: {{TITLE}}

- **Status:** {{STATUS}} <!-- proposed | accepted | rejected | deprecated | superseded -->
- **Date:** {{DATE}}
- **Deciders:** {{DECIDERS}}
- **Consulted:** {{CONSULTED}}
- **Informed:** {{INFORMED}}

---

## Context

<!-- Describe the technical or business problem, current state, and the forces driving this decision. What broke, what is changing, or what constraint requires an architectural choice? -->

## Decision

<!-- State the architectural choice clearly and unambiguously in active voice. What will we do? -->

## Rationale

<!-- Explain why this choice was selected. What makes this the most appropriate approach given our constraints? -->

## Consequences

### Positive
- <!-- Benefit 1 -->
- <!-- Benefit 2 -->

### Negative & Trade-offs
- <!-- Drawback or overhead 1 -->
- <!-- Drawback or overhead 2 -->

### Risks & Mitigations
- **Risk:** <!-- Specific technical or operational risk -->
  **Mitigation:** <!-- How this risk is eliminated or controlled -->

## Non-Goals

<!-- What is explicitly OUT of scope for this decision? What are we intentionally choosing NOT to solve here? -->
- <!-- Non-goal 1 -->

## Architectural Constraints

<!-- Durable invariants that future implementations and coding agents MUST preserve. Keep these durable rather than tied to ephemeral line numbers or transient files. -->
- <!-- Invariant 1: e.g. "All external API writes must route through the PaymentGatewayInterface abstraction." -->
- <!-- Invariant 2: e.g. "All custom tables must be registered through dbDelta with explicit schema versioning." -->

## Verification & Fitness Functions

<!-- How do future engineers or automated agents verify that the system complies with this decision? -->
- **Verification Mechanism:** <!-- e.g., Automated PHPUnit invariant test / Custom PHPCS sniff / PHPStan Level check / WP-CLI health check -->
- **Target Condition:** <!-- e.g., Zero direct calls to external SDK outside Infrastructure adapter / Schema matches version constant -->

## Reconsider When

<!-- Concrete, measurable triggers that invalidate this decision and require drafting a superseding ADR. Avoid vague phrases like "when needed". -->
- <!-- Trigger 1: e.g., "Monthly transaction volume exceeds 500,000 requests" -->
- <!-- Trigger 2: e.g., "WordPress core drops support for PHP 7.4" -->
- <!-- Trigger 3: e.g., "WooCommerce removes legacy order tables completely" -->

## Implementation References

<!-- Non-normative links to entry points, issues, PRs, or design specifications. These provide discoverability but do NOT constitute permanent architectural truth. -->
- **Primary Entry Point:** `{{ENTRY_POINT}}`
- **Issue / PR:** `{{ISSUE_PR}}`

## Related Decisions

<!-- Link to old ADR if replacing one, e.g. [ADR-0001](0001-old.md), or None -->
- **Supersedes:** {{SUPERSEDES}}
- **Superseded by:** {{SUPERSEDED_BY}}
- **Related ADRs:** {{RELATED_ADRS}}
