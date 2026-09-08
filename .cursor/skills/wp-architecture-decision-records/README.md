# WP Architecture Decision Records (`wp-architecture-decision-records`)

> **The architectural memory for WordPress plugin development.**  
> Capture, evaluate, and maintain Architecture Decision Records (ADRs) with zero-dependency deterministic tooling for human developers and autonomous AI coding agents.

[![License: GPL v2+](https://img.shields.io/badge/License-GPL%20v2%2B-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-99%2F99%20passing-brightgreen.svg)](eval/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](package.json)
[![WordPress](https://img.shields.io/badge/WordPress-7.0%2B-blue.svg)](SKILL.md)

---

## Quick Navigation

- [1. For First Readers: What is an ADR & Why Use This?](#1-for-first-readers-what-is-an-adr--why-use-this)
- [2. Where Are ADR Specifications Written & Stored?](#2-where-are-adr-specifications-written--stored)
- [3. How Does This Skill Function?](#3-how-does-this-skill-function)
- [4. Developer Quick Reference (CLI Commands)](#4-developer-quick-reference-cli-commands)
- [5. AI Agent Guide (Triggers & Consumption)](#5-ai-agent-guide-triggers--consumption)
- [6. Directory Structure & References](#6-directory-structure--references)

---

## 1. For First Readers: What is an ADR & Why Use This?

An **Architecture Decision Record (ADR)** is a short, version-controlled document that records a significant technical choice made in a software project, along with its context, rationale, trade-offs, and consequences.

In WordPress plugin development, codebases easily accumulate technical debt and silent regressions:
- *Why did we choose Action Scheduler instead of native `wp_schedule_event()`?*
- *Why do we have a custom database table instead of standard post meta?*
- *What invariant must never be broken when refactoring our payment webhooks?*

Without ADRs, newly onboarded developers and AI coding agents make uninformed assumptions, rewrite working solutions, or break critical architectural constraints.

### Key Benefits
- **Durable Architectural Memory:** Records *why* choices were made so future contributors don't guess.
- **Architectural Invariants, Not Ephemeral Checklists:** Keeps durable rules (e.g. *"All custom queries must route through the Repository layer"*) separate from fragile, transient file line numbers.
- **No ADR Spam:** A built-in decision gate filters out routine bug fixes, typos, and standard WordPress API calls (`add_action()`, `sanitize_text_field()`).
- **Zero External Dependencies:** Built with pure Node.js ESM scripts that work out of the box in any CI/CD environment.

---

## 2. Where Are ADR Specifications Written & Stored?

The skill automatically adapts to existing repository conventions without requiring proprietary config files.

```text
your-plugin-repo/
├── docs/adr/                          <── Primary ADR directory (auto-detected)
│   ├── README.md                      <── Synchronized Index / Registry table
│   ├── 0001-record-architecture-decisions.md
│   ├── 0002-adopt-action-scheduler.md
│   └── 0003-custom-table-audit-logs.md
```

### 1. Storage Directory
The skill inspects the repository and uses the first existing directory found:
1. `docs/adr/` *(Default greenfield location)*
2. `docs/decisions/`
3. `adr/`
4. `decisions/`
5. Custom directory passed via `--dir <path>`

### 2. File Naming Convention
ADRs are stored as individual Markdown files using sequential zero-padded numbers and a lowercase imperative slug:
- Format: `####-kebab-case-title.md` (e.g., `docs/adr/0002-adopt-action-scheduler.md`).
- If a project already uses 3 digits (`001-slug.md`) or unnumbered files (`slug.md`), the skill automatically matches that convention.

### 3. Registry & Index Table
All decisions are indexed in `docs/adr/README.md` (or `index.md`). The index table tracks:
| ADR | Title | Status | Date | Relations |
|---|---|---|---|---|
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-08 | — |
| [ADR-0002](0002-adopt-action-scheduler.md) | Adopt Action Scheduler | Superseded | 2026-09-08 | Superseded by ADR-0004 |

### 4. Inside an ADR: What Gets Written?
Each generated ADR file captures structured architectural specifications:
- **Header Metadata:** Number, Title, Status (`proposed`, `accepted`, `rejected`, `deprecated`, `superseded`), Date, Deciders, and Stakeholders.
- **Context & Problem Statement:** What problem or forces triggered this choice?
- **Decision & Rationale:** The active choice made and why alternatives were rejected.
- **Consequences:** Positive benefits, negative trade-offs, and risk mitigations.
- **Non-Goals:** Explicit boundaries of what this decision deliberately does not solve.
- **Architectural Constraints:** Binding invariants future human/AI engineers must preserve.
- **Verification & Fitness Functions:** Repeatable automated tests or sniff commands proving compliance.
- **Reconsider When:** Measurable, objective triggers to revisit or supersede the decision.
- **Related Decisions:** Bidirectional links (`Supersedes` and `Superseded by`).

---

## 3. How Does This Skill Function?

The skill operates as a deterministic decision and verification pipeline:

```text
[Proposed Architectural Change]
             │
             ▼
   Step 0: Convention & Project Discovery   (detect-project.mjs, detect-adr-conventions.mjs)
             │
             ▼
   Step 1: ADR-Worthiness Gate              (Classifies decision: REQUIRED, NOT_NEEDED, etc.)
        ├── ADR_NOT_NEEDED ────────────────► Skip ADR; proceed straight to coding
        ├── EXISTING_ADR_GOVERNS ──────────► Enforce existing constraints; do not duplicate
        │
        ▼ (If REQUIRED or RECOMMENDED)
   Step 2: Context Discovery                (Inspect codebase, composer.json, WP/PHP versions)
             │
             ▼
   Step 3: Capture Intent & Confirmation    (Intent Summary: trigger, options, invariants)
             │
             ▼
   Step 4: Select Template                  (Simple single-rationale vs MADR multi-option)
             │
             ▼
   Step 5: Draft ADR File                   (new-adr.mjs creates file & updates README index)
             │
             ▼
   Step 6: Integrity Validation             (validate-adr.mjs checks links, placeholders)
             │
             ▼
   Step 7: Consensus & Lifecycle            (set-adr-status.mjs marks accepted or superseded)
             │
             ▼
   Step 8: Implementation Guardrails        (Domain coding skills write PHP/JS within invariants)
```

### Lifecycle States
ADRs transition predictably through five standard states:
1. `proposed` — Under peer/team review; not yet binding.
2. `accepted` — Approved; its architectural constraints are now non-negotiable invariants.
3. `rejected` — Evaluated and declined; documents why the idea was not adopted.
4. `deprecated` — No longer enforced, but not directly replaced.
5. `superseded` — Replaced by a newer ADR; linked bidirectionally (`ADR-0002` points to `ADR-0004`, and `ADR-0004` points back to `ADR-0002`).

### Separation of Concerns: Decide vs. Implement
- **This Skill (`wp-architecture-decision-records`):** Decides *why* and defines the *architectural invariants* (e.g. *"All payment writes must route through PaymentGatewayInterface"*).
- **Domain Skills (`wp-plugin-development`, `wp-rest-api`, `wp-wpcli-and-ops`):** Implement the actual PHP, React, SQL, and WP-CLI code that adheres to those invariants.

---

## 4. Developer Quick Reference (CLI Commands)

All scripts run with Node.js >= 18 with **zero npm dependencies**:

### 1. Initialize ADR System in a Project
If your plugin repository does not have an ADR directory yet:
```bash
node scripts/bootstrap-adrs.mjs
```
*Creates `docs/adr/`, initial `README.md` index, and foundational `ADR-0001`.*

### 2. Create a New ADR
Generate a new record with automatic numbering, title slugging, and index table update:
```bash
# Simple format (default - single rationale)
node scripts/new-adr.mjs \
  --title "Use Custom Database Table for Webhook Logs" \
  --template simple \
  --status proposed \
  --update-index

# MADR format (comparing multiple alternatives with trade-offs)
node scripts/new-adr.mjs \
  --title "Adopt Action Scheduler for Background Jobs" \
  --template madr \
  --status proposed \
  --update-index
```

### 3. Validate Integrity (Pre-Commit / CI Check)
Check for missing sections, leftover placeholders (`{{...}}`), broken supersession links, and index drift:
```bash
node scripts/validate-adr.mjs --strict
```

### 4. Accept or Supersede an ADR
Update status once a team agrees or when replacing an earlier architectural decision:
```bash
# Accept a proposed ADR:
node scripts/set-adr-status.mjs --adr 0002 --status accepted --update-index

# Supersede an accepted ADR with bidirectional linking:
node scripts/set-adr-status.mjs \
  --adr 0002 \
  --status superseded \
  --superseded-by 0004 \
  --reason "Reconsider trigger reached: daily queue volume exceeded 100,000 jobs" \
  --update-index
```

---

## 5. AI Agent Guide (Triggers & Consumption)

Autonomous AI coding agents (Cursor, Claude Code, GitHub Copilot, Codex) integrate with this skill via the [Agent Skills standard](https://agentskills.io/specification).

### When an Agent Must Activate This Skill (Proactive Triggers)
AI agents must pause code implementation and invoke this skill when encountering:
1. **Data Model Changes:** Creating custom database tables, using `dbDelta()`, or moving data between post meta and options.
2. **Background Processing:** Choosing between Action Scheduler, native WP-Cron, or external workers.
3. **New Dependencies:** Introducing Composer packages, external JavaScript packages, or cloud SDKs.
4. **Public Contracts:** Adding breaking REST API route changes or deprecating public WordPress hooks.
5. **Ecosystem Compatibility:** Supporting WooCommerce HPOS vs. legacy post tables; Gutenberg server-side `render.php` vs. static block saves.

### Anti-Spam Gate: When NOT to Create an ADR
Agents must **skip** creating an ADR for:
- Routine bug fixes, typo fixes, or adding unit tests.
- Standard WordPress API usage (`add_action()`, `wp_verify_nonce()`, `sanitize_text_field()`).
- Minor/patch dependency updates in `composer.json` or `package.json`.
- Internal refactorings that preserve existing class and hook boundaries.

### Agent Read Workflow (Before Implementing Code)
1. **Check Existing Decisions:** Look in `docs/adr/README.md`.
2. **Read Governing ADRs:** If an accepted ADR governs the area (e.g. data storage), treat its `Architectural Constraints` as non-negotiable rules.
3. **Never Silently Rewrite Decisions:** If the requested feature contradicts an accepted ADR, the agent must notify the user and draft a superseding ADR instead of editing the old file.

---

## 6. Directory Structure & References

```text
wp-architecture-decision-records/
├── SKILL.md                              # Main agent skill definition (< 500 lines)
├── README.md                             # This guide
├── package.json                          # NPM test definition
├── LICENSE                               # GPL-2.0-or-later
├── scripts/                              # Deterministic zero-dependency toolchain
│   ├── detect-project.mjs                # Inspects plugin PHP/WP versions & stack
│   ├── detect-adr-conventions.mjs        # Scans existing ADR folder & numbering style
│   ├── bootstrap-adrs.mjs                # Initial setup for repos without ADRs
│   ├── new-adr.mjs                       # Numbering collision-free ADR generator
│   ├── set-adr-status.mjs                # Lifecycle & bidirectional supersession manager
│   └── validate-adr.mjs                  # Integrity validator (structure, links, index)
├── assets/                               # ADR Templates
│   ├── adr-simple.md                     # Lean single-rationale template (default)
│   ├── adr-madr.md                       # Multi-option evaluation template
│   └── adr-index.md                      # Index table scaffold
├── references/                           # Detailed technical manuals (1-hop references)
│   ├── adr-worthiness.md                 # Decision gates & anti-spam heuristics
│   ├── template-selection.md             # Simple vs. MADR decision guide
│   ├── lifecycle-governance.md           # States & supersession workflow
│   ├── wordpress-plugin-decisions.md     # WordPress specific decision patterns
│   ├── wordpress-agent-skills-integration.md # Interoperability with coding skills
│   ├── project-adaptation.md             # Custom repo convention discovery
│   ├── verification-and-fitness-functions.md # Testing & invariant checks
│   └── review-checklist.md               # Agent-readiness review checklist
└── eval/                                 # 12 automated evaluation scenarios
    ├── harness/run.mjs                   # Automated test harness runner
    └── scenarios/                        # Declarative scenario definitions
```

### Reference Documentation
For in-depth guides, consult the reference documents in `references/`:
- [ADR-Worthiness Gate & Decision Triggers](references/adr-worthiness.md)
- [Template Selection Guide](references/template-selection.md)
- [Lifecycle Governance & Supersession](references/lifecycle-governance.md)
- [WordPress Plugin Architectural Decisions](references/wordpress-plugin-decisions.md)
- [Project Adaptation & Convention Discovery](references/project-adaptation.md)
- [Verification & Fitness Functions](references/verification-and-fitness-functions.md)
- [Review Checklist](references/review-checklist.md)

---

## Running the Evaluation Suite

Verify complete skill compliance, reference links, and deterministic script execution:
```bash
npm test
```

---

## License & Provenance

- **License:** GNU General Public License v2.0 or later ([GPL-2.0-or-later](LICENSE)).
- **Provenance:** Documented in [SOURCES.md](SOURCES.md). Clean-room synthesis conforming to the [Agent Skills standard](https://agentskills.io/specification).
