# Design Decisions for `wp-architecture-decision-records`

This document records the architectural and design decisions made while engineering the `wp-architecture-decision-records` skill itself.

---

## DECISION-001: Separation of Architectural Invariant from Implementation Task List

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** `skillrecordings/adr-skill` advocates embedding granular implementation plans directly into the ADR (exact file paths, exact line changes, specific task lists). While beneficial for single-session autonomous task runners, this creates severe brittleness: an ADR becomes outdated as soon as files are moved or refactored during normal development.
- **Decision:** The ADR owns the **durable architectural decision**, its rationale, architectural invariants, non-goals, and verification criteria. File paths and PR links may be included under a dedicated `Implementation References` section, but they are explicitly designated as non-normative references rather than permanent architectural truth.
- **Consequences:**
  - *Positive:* ADRs remain durable across refactorings and outlive individual file structures.
  - *Positive:* Clean boundary between durable architectural memory and ephemeral work management (e.g., GitHub Issues, sprint boards).
  - *Trade-off:* Agents must consult the codebase architecture (or domain skills) to map invariants to specific files if paths change over time.

---

## DECISION-002: Composition with WordPress Domain Skills instead of Knowledge Duplication

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** WordPress has dedicated agent skills such as `wp-plugin-development`, `wp-wpcli-and-ops`, `wp-rest-api`, `wp-block-development`, and `wp-performance`. Copying WordPress API documentation (e.g. how to call `current_user_can()`, register post types, or use `$wpdb->prepare()`) into this skill would cause massive maintenance duplication and violate the single source of truth.
- **Decision:** The ADR skill governs the **WHY and WHAT** (architectural decision, trade-offs, constraints, verification threshold). It delegates the **HOW** (exact WordPress API usage, security sanitization patterns, hook execution order) to the corresponding WordPress domain skills via explicit composition rules.
- **Consequences:**
  - *Positive:* `SKILL.md` stays lean, procedural, and well within the 500-line limit mandated by the Agent Skills specification.
  - *Positive:* Upstream improvements to WordPress domain skills automatically benefit ADR implementation without re-syncing.
  - *Trade-off:* The agent operating the skill must know how to invoke or compose with companion skills when executing an accepted ADR.

---

## DECISION-003: Two Canonical ADR Templates (Simple vs. MADR)

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** The ADR community repository provides 11 different templates (Nygard, MADR, Tyree & Akerman, Planguage, ITD, Business Case, etc.). Providing too many templates leads to agent prompt bloat, template choice confusion, and inconsistent documentation within a single plugin repository.
- **Decision:** Standardize on two core templates:
  1. `adr-simple.md` (Nygard-inspired, streamlined for decisions with an obvious consensus or single dominant rationale).
  2. `adr-madr.md` (MADR-inspired, structured for multi-option evaluations where competing trade-offs, decision drivers, and pros/cons must be rigorously documented).
- **Consequences:**
  - *Positive:* Predictable parsing, deterministic validation, and simple adoption.
  - *Positive:* Covers 99% of WordPress engineering decisions without cognitive overhead.

---

## DECISION-004: Proactive Agent Triggers with Anti-Spam Gate

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** Autonomous coding agents frequently make silent architectural choices (e.g., adding an unvetted Composer package, switching from WP-Cron to custom background loops, creating ad-hoc database tables) without consulting humans. Conversely, naive agent ADR prompts can cause "ADR spam" by proposing records for routine refactorings, typo fixes, or standard nonce checks.
- **Decision:** Define explicit, deterministic trigger conditions:
  - An ADR is **REQUIRED/RECOMMENDED** only for cross-cutting, difficult-to-reverse, security-critical, data-model altering, or new dependency additions.
  - An ADR is **FORBIDDEN/SKIPPED** for routine API usage, bug fixes, cosmetic edits, and choices already governed by accepted ADRs or coding standards.
- **Consequences:**
  - *Positive:* Prevents silent architectural drift while blocking ADR bloat.
  - *Positive:* Enables agents to surface architectural branch points naturally during implementation.

---

## DECISION-005: Architectural Fitness Functions for Continuous Evidence

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** Architectural decisions frequently suffer from "architectural erosion" where the team forgets a decision and accidentally reintroduces prohibited patterns. Magnus919 provides a model for connecting ADR claims to verification.
- **Decision:** Incorporate lightweight **Architectural Fitness Functions**. Each ADR includes a `Verification` section defining observable characteristics and verification mechanisms (e.g. PHPCS custom sniffs, PHPStan level checks, PHPUnit invariants, WP-CLI diagnostics, or Playwright contract tests).
- **Consequences:**
  - *Positive:* Architectural claims become testable and falsifiable.
  - *Positive:* Future agents can automatically test compliance with past ADRs.

---

## DECISION-006: Deterministic Node.js ESM Tooling with Zero External Dependencies

- **Status:** Accepted
- **Date:** 2026-09-08
- **Context:** Scripts for detecting conventions, generating files, updating indexes, and validating ADRs must run across Linux, macOS, and Windows without requiring `npm install` of third-party libraries.
- **Decision:** Implement all scripts in native Node.js ESM (`.mjs`) using only Node core modules (`node:fs`, `node:path`, `node:child_process`, `node:os`, `node:process`). All path manipulation uses POSIX normalization, and all file operations support `--dry-run` and structured `--json` output.
- **Consequences:**
  - *Positive:* Fast, portable, sub-millisecond execution with zero install footprint.
  - *Positive:* Safe execution without network dependencies.
