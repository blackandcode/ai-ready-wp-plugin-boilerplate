# Specifications & Phased Implementation Hub

Welcome to the **Specifications Hub** for the **WordPress AI Plugin Development Boilerplate**.

This directory houses the functional specifications for the plugin's applications (`apps/`) as well as phased implementation plans (`plans/`).

---

## 1. Directory Structure

```mermaid
flowchart TD
    Specs["docs/specifications/"] --> Apps["docs/specifications/apps/\nFunctional Specifications by App"]
    Specs --> Plans["docs/specifications/plans/\nPhased Implementation Plans"]
    Specs --> Guide["phased-workflow-guide.md\nVertical Slices & Plan Anatomy"]

    Apps --> AppSettings["apps/settings/\nSettings Admin UX & Workflows"]
    Apps --> AppHello["apps/hello-world/\nBlock Editor & Frontend Behavior"]
    Apps --> AppDiag["apps/diagnostics/\nHealth Telemetry & CLI Doctor"]
    Apps --> AppDev["apps/developer/\nIn-Admin OpenAPI Viewer Spec"]

    Plans --> Starter["plans/feature-plan-template.md\nUnified Feature Plan Template"]
```

---

## 2. Contents & Guides

- [phased-workflow-guide.md](phased-workflow-guide.md): The vertical slice decomposition methodology, unified feature plan anatomy, pre/post-implementation logging, and acceptance verification gates.
- [apps/](apps/README.md): Functional specifications for each app:
  - [apps/settings/](apps/settings/README.md): Functional specification for the Settings application.
  - [apps/hello-world/](apps/hello-world/README.md): Functional specification for the Hello World Gutenberg block.
  - [apps/diagnostics/](apps/diagnostics/README.md): Functional specification for the Diagnostics subsystem.
  - [apps/developer/](apps/developer/README.md): Functional specification for Developer Tools & API Reference viewer.
- [plans/](plans/README.md): Directory of phased sprint blueprints and starter templates:
  - [plans/feature-plan-template.md](plans/feature-plan-template.md): Canonical single-document template for planning new features.

---

## 3. Coding Agent Guidance

1. **Functional vs. Technical Specifications:** Functional specs in `docs/specifications/apps/` define *what* the user experiences (user stories, UI states, validation rules, error feedback). Technical specs in `docs/apps/` define *how* it is implemented in PHP and TypeScript.
2. **Feature Planning Invariant:** When creating plans for a new feature, follow the unified template in `plans/feature-plan-template.md` and the methodology in `phased-workflow-guide.md`.
3. **Pre-Implementation Logging:** Before writing code in an implementation phase, create a pre-implementation log in `docs/implementation-logs/YYYY-MM-DD-phase-XX-*.md`.
