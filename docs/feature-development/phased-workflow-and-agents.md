# Phased Execution and Agent Workflow

AI coding agents are most effective when guided by tight constraints, clear boundaries, and deterministic verification gates.

This guide outlines the **Phased Implementation Methodology**, the **4-Document Phase Anatomy**, and the **Implementation Logging Lifecycle** defined in `AGENTS.md` and `.cursor/rules/post-phase-documentation.mdc`.

---

## 1. Why Phased Execution?

When given large, ambiguous prompts (e.g., *"Build an e-commerce plugin with settings, cart, and stripe payments"*), AI agents frequently:

- Attempt to generate hundreds of files at once, exceeding context limits.
- Invent inconsistent architecture patterns between frontend and backend.
- Omit test harnesses, documentation, or security capabilities.
- Silently break existing code.

The **Phased Execution Model** solves this by decomposing plugin development into sequential, vertical slices:

```mermaid
flowchart TD
    Charter["Authoritative Charter (docs/general/product-charter.md)"] --> PhaseFolder["Phase Plan (docs/plans/XX-<name>/)"]
    PhaseFolder --> PreLog["1. Pre-Implementation Log (docs/implementation-logs/)"]
    PreLog --> CodeAndTests["2. TDD Implementation & Five-Tier Tests"]
    CodeAndTests --> Gate["3. Acceptance Verification Gate"]
    Gate --> VersionSync["4. Automated SemVer Bump (npm run update-version)"]
    VersionSync --> PostLog["5. Post-Implementation Finalization & Decision Log"]
```

---

## 2. The Authoritative Product Charter

Before any code or plan is authored, consult:  
[docs/general/product-charter.md](../general/product-charter.md)

### Core Charter Rules

1. **Single Source of Truth:** Resolves all architectural disputes and open product questions.
2. **Conflict Invariant:** If any document, specification, or prompt conflicts with the charter, **the charter wins**, and the conflicting document must be corrected immediately.
3. **Core Identity Declarations:**
   - Product name and technical prefixes (e.g., `airwp`, `ai-ready-wp`).
   - Minimum supported versions: WordPress 7.0, PHP 8.3.
   - Core design boundaries: storage model, editor strategy, permissions, and security policies.

---

## 3. The 4-Document Phase Anatomy (`docs/plans/XX-<name>/`)

Every implementation phase lives in its own directory under `docs/plans/` and consists of exactly **four structured documents**:

```text
docs/plans/02-rest-api-settings-and-contracts/
├── README.md               # Scope, dependencies, deliverables, exclusions
├── technical-spec.md       # Implementation boundaries, schemas, classes, DTOs
├── tests-and-acceptance.md # Unit/integration/Bruno/Playwright acceptance criteria
└── master-prompt.md        # Standalone prompt for the executing AI agent
```

### 3.1 `README.md`

- **Functional Scope:** Exactly what features are in scope for this phase.
- **Dependencies:** Which prior phases must be finalized before this phase begins.
- **Explicit Exclusions:** Explicitly lists what is **NOT** to be implemented yet (prevents agents from implementing future phases prematurely).

### 3.2 `technical-spec.md`

- Concrete technical blueprint: namespaces, class names, file paths, database schemas, REST endpoints, and DTO contracts.
- Boundaries between domain logic, persistence, and presentation.

### 3.3 `tests-and-acceptance.md`

- Explicit test requirements across the pyramid:
  - Which PHPUnit unit tests and integration tests must pass.
  - Which Bruno REST `.bru` requests must be added and passing.
  - Which Jest unit tests and Playwright browser specs must pass.
  - Specific exit criteria that define phase completion.

### 3.4 `master-prompt.md`

- A self-contained prompt written specifically for an AI coding agent.
- Includes context pointers, relevant skills to load, instructions, and verification checklists.

---

## 4. Phase Implementation Logging (`docs/implementation-logs/`)

For every phase, the agent manages an audit log under `docs/implementation-logs/YYYY-MM-DD-phase-XX-<short-name>.md`:

### Step 1: Pre-Implementation (Phase Start)

At the start of a phase, create the file with the pre-implementation checklist extracted from `technical-spec.md` and `tests-and-acceptance.md`:

```markdown
# Implementation Report — Phase 02: REST API, Settings, and Contracts

**Date:** 2026-08-01  
**Phase ID:** Phase 02  
**Status:** In Progress  

## 1. Pre-Implementation Checklist
- [ ] Review `docs/plans/02-rest-api-settings-and-contracts/` spec
- [ ] Implement Commands and Queries under `src/Settings/Application/`
- [ ] Implement REST Controllers under `src/Rest/Controller/`
- [ ] Add Bruno test requests under `bruno/03 Settings/`
- [ ] Ensure all PHPUnit and Bruno tests pass
```

### Step 2: Post-Implementation (Phase Finalization)

Once code and tests are complete, finalize the report:

1. Mark all checklist items as completed: `- [x]`.
2. Record **Key Decisions & Architecture Outcomes** (and references to new ADRs).
3. Record all **Files Created & Modified**.
4. Record **Verification Results & Test Artifacts** (test counts, pass rates).
5. Complete the **Post-Implementation Summary vs Initial Spec** table.
