# Architectural Fitness Function Record

Use this record template when an Architecture Decision Record requires an operational, automated, or continuous verification contract beyond a one-line test command.

---

## 1. Traceability
- **Governing ADR:** [ADR-{{NUMBER}}]({{ADR_PATH}})
- **Title:** {{TITLE}}
- **Status:** Active <!-- Active | Paused | Retired -->
- **Owner / Accountable Role:** {{OWNER}}

---

## 2. Observable Architectural Characteristic
<!-- What specific quality attribute, invariant, or architectural boundary does this fitness function protect? -->
- **Characteristic:** <!-- e.g., Layer boundary isolation, dependency restriction, schema invariant, execution time ceiling -->
- **Claim:** <!-- e.g., Domain classes must never invoke WordPress core functions directly. -->

---

## 3. Boundary & Scope
- **Scope Type:** `Atomic` | `Structural` | `Scenario` | `Holistic`
  - *Atomic:* Single class, function, or configuration property.
  - *Structural:* Architectural layer boundaries, namespace dependencies, circular dependencies.
  - *Scenario:* End-to-end integration flow, retry loop, idempotency contract.
  - *Holistic:* System-wide latency budget, database query count ceiling, memory consumption.
- **Enclosed Targets:** <!-- Paths or namespaces evaluated, e.g. src/Domain/ -->
- **Explicit Exclusions:** <!-- Paths intentionally excluded, e.g. tests/, src/Infrastructure/ -->

---

## 4. Measurement & Verification Contract
- **Tool / Mechanism:** <!-- e.g., PHPStan custom rule / deptrac / PHPUnit Invariant Test / WP-CLI health check -->
- **Execution Command:**
  ```bash
  {{EXECUTION_COMMAND}}
  ```
- **Execution Cadence:** `Pull Request Gate` | `CI Build` | `Nightly / Scheduled` | `Release Gate`
- **Pass / Fail Threshold:** <!-- e.g., 0 violations; execution time <= 5ms; query count <= 2 -->

---

## 5. Escalation & Remediation
- **On Failure Action:** `Block PR / Build` | `Emit Warning & Log Incident` | `Rollback Migration`
- **Remediation Procedure:** <!-- What steps must a developer or agent take if this check fails? -->

---

## 6. Review & Retirement Criteria
- **Next Review Date:** {{NEXT_REVIEW_DATE}}
- **Retirement Trigger:** <!-- When should this fitness function be retired? e.g., "When the legacy order storage adapter is completely removed in v3.0.0" -->
