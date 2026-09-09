# ADR Template Selection Guide

This skill standardizes on **two primary ADR templates** to balance speed, readability, and depth without inducing template confusion or analysis paralysis.

---

## 1. Quick Selection Matrix

| Criterion | `adr-simple.md` (Simple / Nygard) | `adr-madr.md` (MADR Multi-Option) |
|---|:---:|:---:|
| **Decision Complexity** | Low to Moderate | High / Multi-faceted |
| **Number of Realistic Options** | 1 dominant approach (vs. status quo) | 2 or more serious competing options |
| **Trade-off Severity** | Straightforward, consensus choice | Non-obvious trade-offs requiring side-by-side analysis |
| **Decision Drivers** | Implicit or straightforward | Explicit, numbered decision drivers |
| **Typical Use Cases** | Adopting a standard pattern; defining plugin directory structure; setting minimum PHP version | Choosing background task library (Action Scheduler vs. WP-Cron); Custom DB Table vs. Post Meta; REST API Auth model |
| **Overhead** | Minimal (~2-3 minutes to author) | Moderate (~5-10 minutes to analyze & author) |

---

## 2. When to Use `adr-simple.md`

Use `adr-simple.md` as the **default** for most architectural decisions.

### Characteristics:
- **Nygard-inspired structure:** Focuses on Context, Decision, Rationale, Consequences, Architectural Constraints, and Verification.
- Does not require formal tabular comparison of rejected candidates.
- Best when the choice is a natural evolution or an industry-standard best practice where alternative options are either trivial or unviable.

### Typical Scenarios:
- Standardizing on strict PSR-4 autoloading in WordPress plugin development.
- Adopting a central Dependency Injection container for service providers.
- Deciding to mandate PHP 8.3+ and WordPress 7.0+ as the runtime baseline.
- Enforcing WordPress Coding Standards (WPCS) with specific PHPCS rulesets.

---

## 3. When to Use `adr-madr.md`

Use `adr-madr.md` when the decision involves **multiple valid paths with distinct trade-offs** and stakeholders need to review why candidate options were rejected.

### Characteristics:
- **MADR-inspired structure:** Features explicit `Decision Drivers`, structured `Considered Options` (with per-option "Good, because..." and "Bad, because..." bullets), and an explicit `Decision Outcome`.
- Ideal for controversial choices or decisions where future developers are likely to ask, "Why didn't we just use X instead?"

### Typical Scenarios:
- **Asynchronous Execution:** Choosing between WP-Cron, Action Scheduler, custom database queue, or an external cloud worker.
- **Data Architecture:** Choosing between WordPress Custom Post Types, Post Meta, WordPress Options, or custom MySQL tables with `dbDelta()`.
- **Payment Gateway Integration:** Choosing between direct synchronous API calls, webhook queuing, or third-party client SDKs.
- **Frontend Architecture in WP Admin:** Choosing between native React (`@wordpress/element` / `@wordpress/components`), vanilla JavaScript, or Alpine.js.

---

## 4. Anti-Patterns to Avoid

- **Do NOT use MADR for trivial decisions:** Forcing a multi-option evaluation on an obvious architectural choice results in fabricated "strawman" options that waste engineering time.
- **Do NOT omit Architectural Constraints in Simple ADRs:** Even a simple decision must establish the binding invariants that future code and AI agents must follow.
- **Do NOT introduce esoteric template formats:** Avoid importing enterprise formats (e.g. Tyree & Akerman, Planguage, arc42) unless an external enterprise governance standard mandates them. Simple and MADR cover over 98% of plugin engineering needs.
