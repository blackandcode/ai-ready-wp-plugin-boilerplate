# Phased Implementation Plans Directory

This directory contains implementation phase plans for the plugin.

Following the **Phased Implementation Methodology** ([docs/specifications/phased-workflow-guide.md](../phased-workflow-guide.md)), each major feature is planned as an isolated vertical slice captured in a single, comprehensive plan document covering:

1. **Architectural Governance & ADR Gate:** Evaluation against accepted ADRs (`docs/adr/`) and pre-implementation triggers.
2. **Functional Specification:** Problem statement, Jobs-to-be-Done (JTBD), user workflows, permission model, and explicit in-scope / out-of-scope boundaries.
3. **Technical Specification:** Pure domain models, concrete infrastructure repositories, DI service provider registration, REST API controllers with code-generated OpenAPI schemas, and WPDS React components.
4. **Five-Tier Testing Pyramid & Acceptance Criteria:** Linting/static analysis, PHPUnit unit tests, Jest UI tests, Bruno REST contract tests, Playwright E2E tests, and discrete acceptance checklists.
5. **Execution Roadmap & Agent Guidance:** Phased implementation tasks, agent prompt guidelines, and post-phase documentation/versioning closeout routines.

---

## Templates & Active Plans

- [feature-plan-template.md](feature-plan-template.md): Canonical single-document template to duplicate or reference when planning a new feature or major architectural expansion.
