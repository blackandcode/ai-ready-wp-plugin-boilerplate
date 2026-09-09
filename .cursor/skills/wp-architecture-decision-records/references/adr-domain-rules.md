# Architecture Decision Records (ADR) — Domain Rules and Methodology

This document outlines the foundational principles and domain rules of Architecture Decision Records (ADRs) within professional WordPress plugin development.

---

## 1. What is an Architecture Decision Record?

An **Architecture Decision Record (ADR)** is a lightweight document that captures an architecturally significant decision, the context that required it, the alternatives considered, the trade-offs accepted, and the durable constraints it imposes on the system.

ADRs provide **durable architectural memory**. They explain *why* the codebase is shaped the way it is to future engineers and autonomous AI coding agents who were not present when the choice was made.

---

## 2. What an ADR is NOT

To maintain a high signal-to-noise ratio and prevent architectural documentation drift, an ADR must strictly avoid becoming:

- **Not an Ephemeral Task or Work Order:** An ADR does not track sprint progress, check off developer chores, or dictate temporary refactoring steps. Work items belong in issue trackers or pull requests.
- **Not a Changelog:** An ADR explains *why* an architectural direction was chosen before or as code is written; a changelog records *what* was released to end users.
- **Not a Code Comment:** If an explanation is merely clarifying how a 5-line algorithm works, it belongs in an inline docblock. If it explains why an entire architectural pattern or database abstraction exists, it belongs in an ADR.
- **Not a Generic Technical Specification:** A technical specification details the full API surface of a feature. An ADR captures only the pivotal architectural fork and the rationale for selecting one branch over another.
- **Not File-Path Immutable:** Decisions should not couple invariants to fragile file paths (e.g. "Line 42 of `src/Foo.php`"). Instead, state the durable architectural constraint (e.g. "All external payment calls must route through the `PaymentGatewayInterface`").

---

## 3. The Core Sections of an ADR

Every valid ADR consists of the following components:

1. **Title:** Expressed as an imperative, present-tense action phrase (e.g. `ADR-0004: Adopt Action Scheduler for background processing`).
2. **Metadata Header:** Status, Date (`YYYY-MM-DD`), Deciders, Consulted, and Informed stakeholders.
3. **Context:** The technical or organizational problem, current state of the codebase, and external constraints (e.g. WordPress version compatibility, memory ceiling, hosting environment).
4. **Decision:** The clear, unambiguous choice made, stated in active voice.
5. **Rationale:** The justification for why this option was chosen over alternatives.
6. **Consequences:**
   - *Positive:* Immediate and long-term benefits.
   - *Negative & Trade-offs:* Inherent complexities, operational overhead, or limitations accepted.
   - *Risks & Mitigations:* Failure modes and planned defenses.
7. **Non-Goals:** Explicit boundaries defining what the decision does *not* attempt to solve.
8. **Architectural Constraints:** Durable invariants that future code and agents must preserve.
9. **Verification & Fitness Functions:** Concrete mechanisms (PHPUnit tests, PHPStan rules, PHPCS sniffs, WP-CLI diagnostics) proving that the decision holds.
10. **Reconsider When:** Objective, measurable triggers that invalidate the decision and necessitate a new ADR.
11. **Related Decisions:** Traceability links for supersession and companion ADRs.

---

## 4. Immutability vs. Living Addenda

By default, an accepted ADR is **immutable historical truth**. It records the context, knowledge, and rationale at the moment the decision was made.

- **Forbidden:** Silently modifying an accepted ADR to reverse or alter its architectural conclusion.
- **Permitted Minor Edits:** Correcting typos, fixing broken links, or clarifying ambiguous phrasing without changing the decision outcome.
- **Status Addenda:** When new evidence, benchmarking data, or learnings arrive, append a dated addendum under a `## Status History` or `## Additional Information` section rather than modifying the original decision text.
- **Material Changes:** If an architectural choice is replaced or overturned, a **new ADR** must be created that formally **supersedes** the prior one.

---

## 5. Architectural Traceability

Architectural decisions should be discoverable from both directions:

- **ADR → Code:** The ADR references primary architectural entry points or interfaces under `Implementation References`.
- **Code → ADR:** Key architectural entry points, abstraction boundaries, or non-obvious workarounds cite the governing ADR in docblocks:
  ```php
  /**
   * Dispatches asynchronous webhooks via Action Scheduler.
   *
   * @see docs/adr/0002-adopt-action-scheduler.md [ADR-0002]
   */
  ```
- **Rule of Restraint:** Do NOT scatter ADR comments across every file or method. Reserve code references for primary architectural entry points, public interfaces, and security/performance invariants.
