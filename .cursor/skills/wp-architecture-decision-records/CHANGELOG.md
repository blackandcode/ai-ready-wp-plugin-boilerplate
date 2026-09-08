# Changelog — `wp-architecture-decision-records`

All notable changes to the `wp-architecture-decision-records` Agent Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-08

### Added
- Initial release of `wp-architecture-decision-records` Agent Skill.
- Agent Skills specification compliant `SKILL.md` (<500 lines) with progressive disclosure.
- Clean-room synthesis of `skillrecordings/adr-skill`, `architecture-decision-record/architecture-decision-record`, `magnus919/agent-skills`, and `WordPress/agent-skills`.
- Dual-mode workflow (Interactive Socratic mode and Autonomous agentic mode).
- Proactive ADR triggers and anti-spam ADR-worthiness gate.
- Deterministic Node.js ESM tooling (`detect-project.mjs`, `detect-adr-conventions.mjs`, `bootstrap-adrs.mjs`, `new-adr.mjs`, `set-adr-status.mjs`, `validate-adr.mjs`).
- Assets and templates (`adr-simple.md`, `adr-madr.md`, `adr-index.md`, `fitness-function-record.md`).
- Deep reference documentation (`adr-domain-rules.md`, `adr-worthiness.md`, `template-selection.md`, `lifecycle-governance.md`, `verification-and-fitness-functions.md`, `wordpress-plugin-decisions.md`, `wordpress-agent-skills-integration.md`, `project-adaptation.md`, `review-checklist.md`).
- Evaluation test harness (`eval/harness/run.mjs`) and 12 realistic WordPress scenarios covering positive triggers, negative gates, supersession, convention adaptation, and agent-readiness.
- Comprehensive provenance and licensing documentation (`SOURCES.md`).
