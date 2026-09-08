---
name: wp-architecture-decision-records
description: Record, evaluate, and maintain Architecture Decision Records (ADRs) for WordPress plugin development. Use when proposing, reviewing, updating, superseding, or validating architectural decisions (custom tables, Action Scheduler vs WP-Cron, REST routes, dependencies, WooCommerce HPOS, Gutenberg block rendering) and consulting existing ADRs before implementing changes.
compatibility: Targets WordPress 7.0+ (PHP 7.4.0+ / 8.3+). Requires Node.js >= 18. Composes with wp-plugin-development, wp-wpcli-and-ops, and wp-rest-api.
metadata:
  version: "1.0.0"
  author: "WordPress Plugin Development Ecosystem"
  license: "GPL-2.0-or-later"
---

# WP Architecture Decision Records (ADR)

## When to Use

Use this skill when:
- Evaluating an **architecturally significant decision** in a WordPress plugin (custom database tables, asynchronous background processing, new dependencies, breaking API changes, WooCommerce HPOS integration, Gutenberg rendering models).
- Creating, drafting, or updating an Architecture Decision Record (ADR).
- Consulting existing accepted ADRs before implementing features or refactorings.
- Superseding or deprecating an earlier architectural decision.
- Validating the structural, referential, and lifecycle integrity of an ADR directory.
- Bootstrapping ADR conventions in a repository that lacks them.

## When NOT to Use

Do **NOT** use this skill for:
- Routine bug fixes, typo corrections, or minor styling changes.
- Standard WordPress API usage where no architectural choice exists (e.g. routine `add_action()`, `wp_verify_nonce()`, or `sanitize_text_field()` calls).
- Decisions already mandated by existing accepted ADRs or coding standards.
- Detailed implementation execution of WordPress APIs (compose with `wp-plugin-development` instead).
- General operational CLI commands (compose with `wp-wpcli-and-ops` instead).

---

## Core Philosophy

ADRs are the **durable architectural memory** of the codebase:
1. **Durable Invariants over Ephemeral Plans:** The ADR owns the *why*, the *trade-offs*, the *durable architectural constraints*, and the *verification criteria*. It does not become an ephemeral task checklist tied to fragile line numbers or transient file paths.
2. **Context Before Questions:** Always inspect the repository and existing ADRs before asking the human questions.
3. **Immutability of Accepted Truth:** Accepted decisions are never silently rewritten. Changing an architectural direction requires drafting a new ADR that explicitly supersedes the prior one.
4. **Composition over Duplication:** This skill decides *why* and *what constraints exist*; domain skills (`wp-plugin-development`, `wp-rest-api`) decide *how* to write the WordPress code.

---

## Procedure

### Step 0: Detect Project & ADR Conventions (Deterministic)

Always start by inspecting the project and established ADR conventions using deterministic scripts:

1. **Detect Project Characteristics:**
   ```bash
   node scripts/detect-project.mjs --json
   ```
   *Identifies:* Main plugin file, PHP/WP versions, Composer packages, tooling (PHPCS, PHPStan, PHPUnit), custom tables, Action Scheduler, blocks, and WooCommerce.

2. **Detect Existing ADR Conventions:**
   ```bash
   node scripts/detect-adr-conventions.mjs --json
   ```
   *Identifies:* ADR directory (`docs/adr/`, `docs/decisions/`), numbering style (`0001-` vs `001-`), next sequence number, and index table.

If no ADR infrastructure exists and an ADR is warranted, bootstrap it safely:
```bash
node scripts/bootstrap-adrs.mjs
```
See [Project Adaptation](references/project-adaptation.md).

---

### Step 1: Evaluate the ADR-Worthiness Gate

Before creating an ADR, determine whether the decision is architecturally significant. Classify into one of five states:

- `ADR_REQUIRED`: Cross-cutting, expensive to reverse, data model changes, new dependencies, or security architecture. **Proceed to Step 2.**
- `ADR_RECOMMENDED`: Non-obvious trade-offs with multiple competing options. **Propose to user.**
- `ADR_NOT_NEEDED`: Routine code, minor refactoring, cosmetic fix. **Skip ADR; proceed directly to implementation.**
- `EXISTING_ADR_GOVERNS`: An accepted ADR already mandates this pattern. **Obey its constraints; do not create duplicate.**
- `EXISTING_ADR_MAY_REQUIRE_SUPERSESSION`: The change contradicts an existing accepted decision. **Proceed to Step 7 (Supersession).**

See [ADR-Worthiness Gate](references/adr-worthiness.md) and [WordPress Decisions](references/wordpress-plugin-decisions.md).

---

### Step 2: Architectural Discovery (Context First)

Before interviewing the user, gather facts from the codebase:
- Read active plugin files, dependencies in `composer.json`, and database interactions.
- Check test configurations and existing ADRs in the decision directory.
- Formulate a clear mental model of the technical constraints and forces at play.

---

### Step 3: Capture Intent & Intent Summary Gate

#### In Interactive Workflows (Socratic Mode):
Ask questions **one at a time**, building on answers. Skip anything answered by Step 2:
1. **Title & Trigger:** What are we deciding, and why now?
2. **Constraints:** What WP/PHP versions, performance limits, or backward compatibility constraints bind us?
3. **Considered Options:** What real alternatives were evaluated? What are their core trade-offs?
4. **Architectural Constraints:** What invariants must future coding agents preserve?
5. **Reconsider When:** What concrete, measurable trigger would cause us to revisit this decision?

**Intent Summary Confirmation Gate:** Before drafting, present a structured summary:
> **Intent Summary for ADR:**
> - **Title:** {Action Title}
> - **Trigger:** {Why now}
> - **Decision & Rationale:** {Chosen option and justification}
> - **Alternatives Rejected:** {Alternative 1 vs Alternative 2}
> - **Architectural Constraints:** {Binding invariants}
> - **Verification:** {Executable test command}
> - **Reconsider When:** {Measurable trigger}
>
> *Confirm to proceed with drafting.*

#### In Autonomous Agent Workflows:
If running autonomously, inspect the codebase, populate the intent structure directly from repository evidence, and clearly document any unresolved assumptions under `Context`.

---

### Step 4: Select Template

Select the smallest template that fulfills the architectural requirements:
- **`adr-simple.md` (Default):** Use for single-rationale or consensus architectural choices.
- **`adr-madr.md`:** Use when comparing 2 or more serious options with explicit decision drivers and pros/cons.

See [Template Selection Guide](references/template-selection.md).

---

### Step 5: Draft the ADR File

Generate the ADR file deterministically:
```bash
node scripts/new-adr.mjs \
  --title "Adopt Action Scheduler for Background Jobs" \
  --template madr \
  --status proposed \
  --update-index
```

Fill out all template sections completely. Ensure:
- Context contains forces, constraints, and trigger.
- Non-goals explicitly scope the boundary.
- Architectural Constraints contain durable rules, not transient file paths.
- Verification commands are valid and testable.
- Reconsideration triggers are concrete and measurable.

---

### Step 6: Validate & Pre-Flight Review

1. **Deterministic Validation:**
   ```bash
   node scripts/validate-adr.mjs --strict
   ```
   Verifies: Metadata, numbering consistency, valid status, required sections, no unreplaced placeholders, no broken links, and index synchronization.

2. **Semantic Agent-Readiness Review:**
   Review against [Review Checklist](references/review-checklist.md). Confirm that an agent with only the ADR and the codebase can comply with the decision without guessing.

---

### Step 7: Lifecycle & Supersession Management

When a decision is approved, change its status:
```bash
node scripts/set-adr-status.mjs --adr 0002 --status accepted --update-index
```

When replacing an accepted decision with a new one:
1. Draft the new ADR (`ADR-0004`).
2. Execute bidirectional supersession linking:
   ```bash
   node scripts/set-adr-status.mjs \
     --adr 0002 \
     --status superseded \
     --superseded-by 0004 \
     --reason "WP-Cron failed under traffic spikes; Action Scheduler provides queue backoff" \
     --update-index
   ```
3. In `ADR-0004`, record `- **Supersedes:** [ADR-0002](0002-old-decision.md)`.

See [Lifecycle Governance](references/lifecycle-governance.md).

---

### Step 8: Consulting ADRs Before Implementation (Read Workflow)

Before starting any feature or refactoring:
1. Scan `docs/adr/README.md` (or run `detect-adr-conventions.mjs`).
2. Read all `accepted` ADRs governing the area (data storage, queues, APIs, auth).
3. Treat accepted ADR `Architectural Constraints` as non-negotiable invariants.
4. Compose with companion WordPress skills for implementation:
   - For hooks & lifecycle: consult `wp-plugin-development`.
   - For WP-CLI commands & migrations: consult `wp-wpcli-and-ops`.
   - For REST routes: consult `wp-rest-api`.
   - For block rendering: consult `wp-block-development`.

See [WordPress Skills Integration](references/wordpress-agent-skills-integration.md).

---

## Verification

After executing this skill, verify:
- `validate-adr.mjs` exits with code `0`.
- ADR status accurately reflects team agreement (`proposed`, `accepted`, `superseded`).
- Index file (`README.md`) table matches all ADR files on disk.
- Verification command cited in the ADR passes in the project CI environment.

---

## Failure Modes & Escalation

| Failure Mode | Root Cause | Resolution |
|---|---|---|
| Broken supersession links | Manual filename edits without updating references | Run `node scripts/validate-adr.mjs` and repair link paths |
| Numbering collision | Two parallel branches created ADR with same number | Run `node scripts/detect-adr-conventions.mjs` and renumber the newer record |
| ADR Spam | Trivial changes generating records | Enforce [ADR-Worthiness Gate](references/adr-worthiness.md); reject non-architectural proposals |
| Outdated file paths in ADR | Transient files recorded as permanent invariants | Move paths to `Implementation References`; state durable invariants instead |

---

## Reference Links (1-Hop)

- [Domain Rules & Principles](references/adr-domain-rules.md) — Core ADR concepts and boundary separation.
- [ADR-Worthiness Gate](references/adr-worthiness.md) — Decision gates and anti-spam heuristics.
- [Template Selection Guide](references/template-selection.md) — Simple vs. MADR evaluation rules.
- [Lifecycle Governance](references/lifecycle-governance.md) — Status transitions, supersession, and amendments.
- [Verification & Fitness Functions](references/verification-and-fitness-functions.md) — Testing pyramid alignment and repeatable evidence.
- [WordPress Plugin Decisions](references/wordpress-plugin-decisions.md) — Custom tables, queues, REST, blocks, HPOS.
- [WordPress Skills Integration](references/wordpress-agent-skills-integration.md) — Interoperability with core WordPress skills.
- [Project Adaptation](references/project-adaptation.md) — Discovering and respecting custom repo conventions.
- [Review Checklist](references/review-checklist.md) — Agent-readiness pre-flight checkpoints.
