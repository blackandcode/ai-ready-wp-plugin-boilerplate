# Architecture Decision Records

This directory contains the **Architecture Decision Records (ADRs)** for this project.

ADRs capture significant architectural decisions, their context, rationale, consequences, durable constraints, and verification mechanisms. They represent the **durable architectural memory** of the codebase.

---

## Decision Lifecycle

Decisions move through the following lifecycle states:

- **Proposed:** The ADR is currently under review and open for feedback. It does not yet constrain production implementation.
- **Accepted:** The ADR has been approved. Its architectural constraints and invariants are binding on all future code and AI agents.
- **Rejected:** The ADR was evaluated and declined. The record remains intact as historical documentation of why the approach was not taken.
- **Deprecated:** The decision is no longer enforced or relevant, but has not been directly superseded by a single replacement record.
- **Superseded:** A newer accepted ADR has replaced this decision. The record links forward to its replacement, and the replacement links back.

---

## Architectural Decision Log

| Number | Title | Status | Date | Supersedes / Superseded by |
| :---: | :--- | :---: | :---: | :--- |
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-08 | — |
| [ADR-0002](0002-in-tree-lightweight-dependency-injection-container.md) | In-tree lightweight dependency injection container | Accepted | 2026-09-08 | — |
| [ADR-0003](0003-gutenberg-block-api-v3-standard.md) | Gutenberg Block API v3 standard | Accepted | 2026-09-08 | — |
| [ADR-0004](0004-contract-first-rest-api-specification.md) | Contract-first REST API specification | Superseded | 2026-09-08 | Superseded by [ADR-0011](0011-generated-openapi-specification-from-wordpress-rest-controllers.md) |
| [ADR-0005](0005-wpds-admin-card-and-sidebar-architecture.md) | WPDS admin card and sidebar architecture | Accepted | 2026-09-08 | — |
| [ADR-0006](0006-automated-project-scaffolding-cli.md) | Automated project scaffolding CLI | Accepted | 2026-09-08 | — |
| [ADR-0007](0007-hexagonal-domain-reorganization-and-skills-integration.md) | Hexagonal domain reorganization and skills integration | Accepted | 2026-09-08 | — |
| [ADR-0008](0008-frontend-architecture-and-component-design-patterns.md) | Frontend architecture and component design patterns | Accepted | 2026-09-09 | — |
| [ADR-0009](0009-tripartite-app-centric-architecture.md) | Tripartite App-Centric Architecture (Framework, Backend, Frontend Bridge) | Accepted | 2026-09-09 | — |
| [ADR-0010](0010-two-pipeline-ci-cd-and-release-readiness-architecture.md) | Two-Pipeline CI/CD and Release Readiness Architecture | Accepted | 2026-09-09 | — |
| [ADR-0011](0011-generated-openapi-specification-from-wordpress-rest-controllers.md) | Generated OpenAPI 3.1 specification from WordPress REST controllers | Accepted | 2026-09-09 | Supersedes [ADR-0004](0004-contract-first-rest-api-specification.md) |

---

## How to Propose an ADR

1. Check whether an existing accepted ADR already governs the architectural area.
2. Determine if the decision is **architecturally significant** (cross-cutting, difficult to reverse, data-model significant, security/performance sensitive).
3. Run the creation script or activate the `wp-architecture-decision-records` agent skill:

   ```bash
   npm run adr:new -- -t "Your Decision Title"
   ```

4. Complete the intent capture and review checklist before submitting for team or agent consensus.
