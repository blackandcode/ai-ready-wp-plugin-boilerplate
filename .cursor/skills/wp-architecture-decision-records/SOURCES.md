# Sources, Provenance, and Licensing

This document records the provenance, licensing review, adopted concepts, intentionally rejected concepts, and clean-room implementation status for the `wp-architecture-decision-records` agent skill.

---

## 1. Upstream Source Repositories Reviewed

### Source 1: `skillrecordings/adr-skill`
- **Repository URL:** [https://github.com/skillrecordings/adr-skill](https://github.com/skillrecordings/adr-skill)
- **Commit SHA Reviewed:** `2fc2269f83b0d17b2a134ae644a8c0a08cb19e07`
- **Applicable License:** **None provided (All Rights Reserved)**.
  - *Legal Status:* Because no open-source license is granted in the repository, no code, templates, or text may be copied directly.
  - *Implementation Status:* **Clean-room conceptual synthesis only**. All scripts, templates, prompts, and documentation are independently authored.
- **Concepts Adopted:**
  - Codebase scanning prior to asking questions (context before interview).
  - Socratic intent capture (interviewing one question at a time).
  - Intent-summary validation gate prior to drafting.
  - Proactive ADR triggers for agents (surfacing architectural branch points during active coding).
  - Structured agent-readiness review checklist.
  - Two-tier template selection (Simple vs. MADR-style).
  - Deterministic helper scripts for scaffolding, status mutation, and convention detection.
- **Concepts Intentionally Rejected:**
  - *Coupling the ADR to granular implementation task planning ("which files to touch, which tests to write"):* Rejected because it turns the ADR into an ephemeral work order that breaks upon routine refactoring. Replaced by durable architectural constraints + optional implementation references.
  - *Hardcoding node-only scripts without cross-platform safety checks:* Replaced with robust ES modules using standard Node.js APIs (`node:fs`, `node:path`, `node:process`) and Windows/Linux path normalization.

---

### Source 2: `architecture-decision-record/architecture-decision-record`
- **Repository URL:** [https://github.com/architecture-decision-record/architecture-decision-record](https://github.com/architecture-decision-record/architecture-decision-record)
- **Relevant Subdirectory:** `skills/architecture-decision-record-skill/`
- **Commit SHA Reviewed:** `a1c44c07a46c4440964d62b1276ceb48cad9edb7`
- **Applicable License:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** for original repository content; individual historical templates under respective author terms.
  - *Legal Status:* CC BY-NC-SA 4.0 restricts commercial reuse and requires ShareAlike licensing. None of its text or files can be included or copied directly into a commercial or GPL development ecosystem.
  - *Implementation Status:* **Independent reimplementation of domain methodology**.
- **Concepts Adopted:**
  - Explicit ADR-worthiness gate (architecturally significant, expensive/risky to reverse, cross-cutting impact).
  - Nygard-inspired format as the lean default for normal decisions.
  - MADR for structured multi-option evaluation with drivers and trade-offs.
  - Historical integrity: ADRs are immutable once accepted; changes require formal supersession with bidirectional linking (`Supersedes: ADR-XXXX` / `Superseded by: ADR-YYYY`).
  - Imperative, present-tense verb phrase naming conventions (`choose-database.md`, `adopt-action-scheduler.md`).
- **Concepts Intentionally Rejected:**
  - *11 disparate template variants (Tyree & Akerman, Alexandrian, Planguage, ITD, etc.):* Rejected to avoid analysis paralysis and agent confusion. Only Simple and MADR are supported by default.
  - *Unstructured freeform ADRs without deterministic metadata or checkable constraints.*

---

### Source 3: `magnus919/agent-skills`
- **Repository URL:** [https://github.com/magnus919/agent-skills](https://github.com/magnus919/agent-skills)
- **Relevant Skill Directory:** `adr-authoring/`
- **Commit SHA Reviewed:** `addad8601879f5e1eeef2b45da2d6c348ac331e0`
- **Applicable License:** **MIT License** (Copyright 2026 Magnus Hedemark).
  - *Legal Status:* Permissive open source.
  - *Implementation Status:* **Conceptual synthesis and independent adaptation**.
- **Concepts Adopted:**
  - Architectural fitness functions: connecting architectural claims to durable, repeatable verification mechanisms.
  - Strict boundary separation: The ADR owns the durable decision; the fitness function owns the verification contract; the project toolchain (PHPCS, PHPUnit, Playwright, Bruno) owns execution.
  - Clear separation between Proposal, Decision Authority, and Implementation Evidence.
  - Reconsideration conditions: requiring concrete, measurable triggers ("Reconsider when...") rather than vague phrases.
  - Decision sustainability criteria: ensuring the ADR survives organizational and codebase evolution.
- **Concepts Intentionally Rejected:**
  - *Artifact Pyramids documentation hierarchy (`adr-to-pyramid-mapping.md`, L1/L2/L3 layering):* Rejected as an unnecessary abstraction layer for WordPress plugin development.
  - *Heavy Python/devcontainer dependencies:* Replaced with zero-dependency Node.js ESM scripts matching the WordPress ecosystem.

---

### Source 4: `WordPress/agent-skills`
- **Repository URL:** [https://github.com/WordPress/agent-skills](https://github.com/WordPress/agent-skills)
- **Relevant Skills & Docs:**
  - `skills/wordpress-router/`
  - `skills/wp-project-triage/`
  - `skills/wp-plugin-development/`
  - `skills/wp-wpcli-and-ops/`
  - `docs/authoring-guide.md`
  - `docs/compatibility-policy.md`
  - `eval/harness/run.mjs`
- **Commit SHA Reviewed:** `d87ee6916e740c7960b6959220c0481a41b320c7`
- **Applicable License:** **GNU General Public License v2.0 or later (GPL-2.0-or-later)**.
- **Concepts Adopted:**
  - Progressive disclosure principle: `SKILL.md` kept short (<500 lines) and strictly procedural, with deep references one level deep (`references/`).
  - Clean skill composition: `wp-architecture-decision-records` defines the *why* and architectural invariants; WordPress domain skills (`wp-plugin-development`, `wp-wpcli-and-ops`, `wp-performance`) define the *how*.
  - Deterministic detection scripts returning structured JSON triage output.
  - Declarative evaluation scenarios and runner structure.
  - WordPress compatibility baseline: WordPress 7.0+, PHP 7.4.0+ (and modern boilerplate PHP 8.3+).
- **Duplication Avoided:**
  - No duplicated WordPress API guides (no copies of how to call `current_user_can()`, `wp_verify_nonce()`, or `$wpdb->prepare()`). Interoperability is achieved via documented composition and skill routing.

---

### Source 5: `Agent Skills Specification`
- **Specification URL:** [https://agentskills.io/specification](https://agentskills.io/specification)
- **Version/Date:** 2026-09 Specification
- **Requirements Satisfied:**
  - `SKILL.md` frontmatter with `name`, `description`, `compatibility`, `metadata`.
  - Directory structure (`references/`, `scripts/`, `assets/`, `eval/`).
  - Shallow reference hierarchy (no nested multi-hop chains).
  - Validation against specification constraints.

---

## 2. Licensing Summary Table

| Source | Commit SHA | License | Permitted Use | Our Implementation Approach |
|---|---|---|---|---|
| `skillrecordings/adr-skill` | `2fc2269` | None (All Rights Reserved) | No reproduction permitted | Conceptual synthesis only; 100% clean-room independent code & text |
| `architecture-decision-record` | `a1c44c0` | CC BY-NC-SA 4.0 | Non-commercial, share-alike | Methodology synthesized; all templates & guides independently written |
| `magnus919/agent-skills` | `addad86` | MIT | Permissive | Fitness function concepts adapted cleanly; no pyramid coupling |
| `WordPress/agent-skills` | `d87ee69` | GPL-2.0-or-later | Open source / GPLv2+ | Direct ecosystem compatibility via composition; no duplicate code |
| `wp-architecture-decision-records` | *Current* | GPL-2.0-or-later | WordPress compatible | Clean-room synthesis combining the best of all sources |
