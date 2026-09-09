# WordPress AI Plugin Development Boilerplate

<p align="center">
  <img src="https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/icons/src/library/symbol.svg" width="80" height="80" alt="WordPress AI Boilerplate Logo" />
</p>

<p align="center">
  <strong>The Enterprise-Grade WordPress Plugin Boilerplate Built for AI Coding Agents and Modern Engineering Teams.</strong>
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/WordPress-7.0%2B-blue?logo=wordpress&logoColor=white" alt="WordPress 7.0+" /></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/PHP-8.3%2B-purple?logo=php&logoColor=white" alt="PHP 8.3+" /></a>
  <a href="#react-18-wpds-admin-application"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" /></a>
  <a href="#coding-standards-and-static-analysis"><img src="https://img.shields.io/badge/WPCS-Core%20%7C%20Extra%20%7C%20Docs-2271b1" alt="WPCS Compliant" /></a>
  <a href="#coding-standards-and-static-analysis"><img src="https://img.shields.io/badge/PHPStan-Level%206%2B-brightgreen" alt="PHPStan Level 6+" /></a>
  <a href="#5-tier-testing-pyramid"><img src="https://img.shields.io/badge/Testing-5--Tier%20Pyramid-orange" alt="5-Tier Testing Pyramid" /></a>
  <a href="#bundled-agent-skills-and-ai-instructions"><img src="https://img.shields.io/badge/Agentic%20AI-Ready-7928CA?logo=openai&logoColor=white" alt="Agentic AI Ready" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPL--2.0--or--later-green.svg" alt="GPL-2.0 License" /></a>
</p>

---

## Why This Boilerplate?

Building production-ready WordPress plugins in the modern era shouldn't mean legacy procedural spaghetti, loose arrays, or missing test suites. Nor should using AI coding assistants (Cursor, Claude Code, Codex, Windsurf) result in hallucinated code, broken file references, or inconsistent architectures.

**The WordPress AI Plugin Development Boilerplate** codifies modern software engineering craftsmanship, clean architecture, and agentic AI best practices into a single, fully-tested, zero-drift distribution.

It provides an instant foundation containing:

- **Tripartite Architecture (ADR-0009):** Decoupled into `src/framework/` (shared kernel/container/events/views), `src/backend/` (pure headless business logic by apps), and `src/frontend/` (React apps, Gutenberg blocks, Interactivity API, patterns, templates, and PHP bridge).
- **Strict REST API Boundary:** Frontend React components and interactive blocks communicate with the backend exclusively via `/ai-ready-wp/v1/*` REST endpoints.
- **Zero-Dependency DI Kernel:** Micro Dependency Injection `Container` with `ServiceProviderRegistry` avoiding heavy framework lock-in.
- **Modern Gutenberg Block (Block API v3 + Interactivity API):** Hello World block with client store (`view.ts`), directives (`data-wp-interactive`, `data-wp-on--click`), live editing, and block patterns.
- **Unified Multi-Channel Presentation (Shared Core):** REST API, custom WP-CLI commands (`wp ai-ready settings-get`, `doctor`), and official WordPress Abilities API endpoints for AI agents.
- **WordPress Design System (WPDS) React 18 Admin:** Card panels, vertical sidebar tab navigation with `@wordpress/icons`, dirty form tracking, and reusable shared modules (`src/frontend/shared/`).
- **Automated Project Scaffolding CLI (`npm run scaffold`):** One-click rebranding that atomically renames slugs, namespaces, constants, files, and text domains.
- **Automated Semantic Versioning (`npm run update-version`):** Coordinated SemVer bumps with changelog promotion and decision logging.
- **5-Tier Testing Pyramid:** PHPUnit 11 unit/integration tests, Jest + React Testing Library, Git-native Bruno REST tests, and Playwright visual regression.
- **WordPress Playground & Developer Sandbox:** Instant zero-install evaluation via `blueprint.json` and containerized WordPress (latest) / PHP 8.3 sandbox via `wp-env`.
- **Durable Architectural Memory (ADRs):** 9 accepted Architecture Decision Records under `docs/adr/` with dedicated ADR CLI tooling and pre-planning agent gates.
- **32 Bundled Agent Skills & Persistent Rules:** Equipping AI agents with deep WordPress APIs, core engineering craftsmanship domain knowledge (DDD, OOP, Design Patterns, TDD, Refactoring), and WordPress Architecture Decision Records (ADRs).

---

## Architectural Highlights

```mermaid
flowchart TD
    subgraph Framework ["1. Shared Kernel & DI (src/framework/)"]
        Plugin["Plugin Singleton (Plugin.php)"] --> Container["Container (DI)"]
        Plugin --> Registry["ServiceProviderRegistry"]
    end

    subgraph BackendApps ["2. Headless Backend Apps (src/backend/Apps/)"]
        BackendProv["BackendServiceProvider"]
        SettingsApp["Settings (Domain, Application, Rest, Cli, Abilities)"]
        DiagApp["Diagnostics (Domain, Application, Rest, Cli, Abilities)"]
        HelloApp["HelloWorld (Domain, Application, Rest)"]
        BackendProv --> SettingsApp
        BackendProv --> DiagApp
        BackendProv --> HelloApp
    end

    subgraph FrontendPresentation ["3. Presentation Domain (src/frontend/)"]
        FrontendProv["FrontendServiceProvider (src/frontend/Bridge/)"]
        SettingsAdmin["Settings React App (src/frontend/apps/settings/react/)"]
        HelloBlock["Hello World Block (src/frontend/apps/hello-world/)"]
        Patterns["Block Patterns & Shell Templates"]
        FrontendProv --> SettingsAdmin
        FrontendProv --> HelloBlock
        FrontendProv --> Patterns
    end

    subgraph AutomationAndQuality ["4. Automation & Five-Tier Quality"]
        ScaffoldCLI["Scaffolding CLI (npm run scaffold)"]
        VersionCLI["Versioning Engine (npm run update-version)"]
        TestPyramid["PHPUnit + Jest + Bruno + Playwright"]
    end
```

---

## Quick Start (Under 2 Minutes)

### 0. Verify Development Prerequisites

Before starting, verify that your local environment (Node.js >= 24.16, npm >= 11, Docker, Compose v2, and Git) meets all requirements:

```bash
npm run pre-check
```

If you encounter missing requirements or need installation instructions for macOS, Windows native, WSL2, or Linux, consult the [Development Prerequisites Guide](docs/boilerplate-development/development-prerequisites.md).

### 1. Clone & Scaffold Your New Plugin

```bash
# Clone the boilerplate
git clone https://github.com/wordpress-ai/ai-ready-wp-plugin-boilerplate.git my-awesome-plugin
cd my-awesome-plugin

# Rebrand the plugin with your project name, slug, and PHP namespace
npm run scaffold -- \
  --name "My Awesome Plugin" \
  --slug "my-awesome-plugin" \
  --namespace "MyVendor\AwesomePlugin" \
  --prefix "MAP_" \
  --author "My Company"
```

### 2. Launch Local Environment (`wp-env`)

```bash
# Install dependencies
npm install
composer install

# Start containerized WordPress (latest + PHP 8.3)
npm run env:start

# Compile frontend assets
npm run build
```

Your plugin is instantly mounted and active at:

- **WordPress Admin:** [http://localhost:8888/wp-admin/](http://localhost:8888/wp-admin/) (`admin` / `password`)
- **Plugin Settings Page:** [http://localhost:8888/wp-admin/admin.php?page=map-settings](http://localhost:8888/wp-admin/admin.php?page=map-settings)
- **REST Endpoint:** [http://localhost:8888/wp-json/my-awesome-plugin/v1/hello](http://localhost:8888/wp-json/my-awesome-plugin/v1/hello)

---

## Automated Scaffolding & Rebranding CLI

Adapt the boilerplate to your plugin identity with zero manual find-and-replace errors.

### Interactive Mode

Run without arguments for guided interactive prompts:

```bash
npm run scaffold
# or
npm run rename
```

### CLI Flag Mode

```bash
npm run scaffold -- \
  --name "Diagram Flow" \
  --slug "diagram-flow" \
  --namespace "WebFalcon\DiagramFlow" \
  --prefix "DF_" \
  --author "WebFalcon" \
  --rest-namespace "df/v1" \
  --block-name "df/diagram"
```

#### Supported Scaffolding Options

| Flag | Description | Default |
| --- | --- | --- |
| `--name <string>` | Plugin display name | `"AI-Ready WP Plugin Boilerplate"` |
| `--slug <string>` | Plugin slug & directory name | Derived from name |
| `--namespace <string>` | PSR-4 PHP namespace | Derived from author + slug |
| `--prefix <string>` | PHP constant prefix (must end with `_`) | Derived from slug (e.g. `DF_`) |
| `--author <string>` | Plugin author / vendor | `"Plugin Developer"` |
| `--text-domain <string>` | Translation text domain | Defaults to slug |
| `--rest-namespace <string>` | REST API route namespace | `<slug>/v1` |
| `--block-name <string>` | Gutenberg block identifier | `<slug>/hello-world` |
| `--dry-run` | Preview all planned replacements without writing | `false` |

---

## 5-Tier Testing Pyramid

Every tier is pre-wired and tested out of the box:

```mermaid
flowchart TD
    T5["Tier 5: Playwright Browser & Visual Regression (Real Chromium)"] --> T4["Tier 4: Bruno REST E2E Contracts (Git-Native .bru)"]
    T4 --> T3["Tier 3: Jest & React Testing Library (Frontend Units)"]
    T3 --> T2["Tier 2: PHPUnit Unit & Integration (PHP Domain & APIs)"]
    T2 --> T1["Tier 1: Static Quality (WPCS, PHPStan Level 6+, Linters)"]
```

| Tier | Category | Runner / Tool | Command |
| --- | --- | --- | --- |
| **Tier 1** | Static Quality | WPCS + PHPStan L6 + ESLint + Markdownlint | `composer lint && composer analyse && npm run lint` |
| **Tier 2** | PHP Unit & Integration | PHPUnit 11 | `composer test` |
| **Tier 3** | Frontend Unit | Jest + React Testing Library | `npm run test:unit` |
| **Tier 4** | REST Contract E2E | Bruno CLI (`@usebruno/cli`) | `npm run test:rest` |
| **Tier 5** | Browser & Visual E2E | Playwright with Screenshot Diffing | `npm run test:e2e` |

---

## Automated Semantic Versioning & Unreleased Changelog

Changing version numbers is **never a manual text edit**. The boilerplate provides atomic release management directly via CLI parameters—completely decoupled from `.env`:

```bash
# Automated SemVer bumps:
npm run update-version:patch    # 1.0.1 -> 1.0.1 (maintenance fixes & refactoring)
npm run update-version:minor    # 1.0.1 -> 1.1.0 (new features & phase completions)
npm run update-version:major    # 1.0.1 -> 2.0.0 (breaking changes & major baseline)

# Explicit target version with optional custom notes & decision rationale:
npm run update-version -- 1.2.0 -m "Release highlights" -d "Approved v1.2.0 release"

# Dry run preview (inspect planned changes without writing files):
npm run update-version:dry-run
npm run update-version -- patch --dry-run
```

### Continuous Unreleased Changelog & 95% Automated Packaging

1. **Continuous Staging (`npm run changelog:add`):**
   Record descriptive bullet points under `## [Unreleased]` in `CHANGELOG.md` on every feature or fix:

   ```bash
   npm run changelog:add -- -t Added "Added optimistic concurrency tokens to settings REST route"
   npm run changelog:add -- -t Fixed "Fixed CSS overflow issue on mobile admin sidebar"
   ```

2. **95% Automated Release Packaging:**
   When `npm run update-version` executes, it automatically extracts all items staged under `## [Unreleased]`, converts them into the new release header `## [X.Y.Z] - YYYY-MM-DD`, and inserts a fresh, clean `## [Unreleased]` section. In 95% of cases, no manual release notes writing is necessary.

### Manual Developer Preference vs AI Agent Workflow

- **Human Developers (Manual Preferred):** Developers can work iteratively, stage notes with `npm run changelog:add`, and manually trigger releases whenever ready.
- **AI Coding Agents (Prompt-Aware):** Agents inspect the user's initial prompt. If and only if the user explicitly requested a version bump (e.g. "bump version", "release v1.1.0"), the agent executes `npm run update-version`. Otherwise, the agent strictly logs changes under `## [Unreleased]` and leaves release execution to the developer.

### What `npm run update-version` coordinates atomically

1. Updates `package.json` and `package-lock.json` root versions without touching external dependencies.
2. Updates `composer.json` version.
3. Updates WordPress plugin header `Version: X.Y.Z` and `AIRWP_VERSION` constant.
4. Updates `readme.txt` `Stable tag: X.Y.Z`.
5. Promotes `CHANGELOG.md` `[Unreleased]` items into the formal release header (`## [X.Y.Z] - YYYY-MM-DD`).
6. Enforces PHP version comparison ordering (`version_compare`).

For deep-dive documentation, see [Versioning & Release Lifecycle](docs/boilerplate-development/versioning-and-releases.md).

---

## Architecture Decision Records (ADRs)

Architectural decisions are captured under `docs/adr/` as immutable historical records with explicit invariants, trade-offs, and verification criteria. Ephemeral phase plans (`docs/plans/`) govern *how* to build features, while ADRs define the durable architectural boundaries.

| Command | Purpose | Example |
| --- | --- | --- |
| `npm run adr:new` | Scaffolds a new ADR with sequential numbering and auto-updates the index | `npm run adr:new -- -t "Cache REST Endpoints" --template simple` |
| `npm run adr:validate` | Validates markdown schema, YAML frontmatter, and cross-references | `npm run adr:validate -- --strict` |
| `npm run adr:status` | Updates the status of an existing ADR (`accepted`, `deprecated`, `superseded`) | `npm run adr:status -- --file docs/adr/0002-xyz.md --status superseded --by 0005` |
| `npm run adr:detect` | Detects WordPress project architecture, dependencies, and ADR conventions | `npm run adr:detect` |

For full lifecycle details and the pre-planning evaluation gate, see [Architecture Decision Records Guide](docs/general/architecture-decision-records-guide.md) and the [ADR Index](docs/adr/README.md).

---

## Bundled Agent Skills and AI Instructions

The boilerplate includes full instruction sets for AI coding agents:

- **`.cursor/rules/`**:
  - `adr-evaluation.mdc`: Pre-planning and in-session ADR evaluation gate enforcing architectural invariants.
  - `wp-admin-ui-ux.mdc`: Persistent visual design standards, WPDS token enforcement, and visual regression loops.
  - `post-phase-documentation.mdc`: Phase completion checklists, implementation logs, and version bumps.
- **`.cursor/skills/`**: 32 bundled skills covering WordPress core APIs, block creation, REST design, OOP principles, Domain-Driven Design, GoF design patterns, TDD, Architecture Decision Records (ADRs), and test harnesses.
- **`AGENTS.md`**: Universal marching orders for AI agents across Cursor, Claude Code, Codex, and Windsurf.

---

## Complete Documentation Index

Browse the master documentation index in the **[Documentation Hub](docs/README.md)** or explore each category directly:

### General Foundations & Architecture (`docs/general/`)

- [Product Charter & Architectural Invariants](docs/general/product-charter.md)
- [Architecture & Layer Boundaries](docs/general/architecture-and-layers.md)
- [Architecture Decision Records (ADRs) Guide](docs/general/architecture-decision-records-guide.md)

### Boilerplate Development & Operations (`docs/boilerplate-development/`)

- [Environment & Containerized Toolchain](docs/boilerplate-development/environment-and-toolchain.md)
- [Development Prerequisites & Setup](docs/boilerplate-development/development-prerequisites.md)
- [Coding Standards & Static Analysis](docs/boilerplate-development/coding-standards.md)
- [Testing Strategy & Test Harnesses](docs/boilerplate-development/testing-strategy.md)
- [Project Scaffolding & Rebranding CLI](docs/boilerplate-development/project-scaffolding-cli.md)
- [Versioning & Release Lifecycle](docs/boilerplate-development/versioning-and-releases.md)
- [Agent Skills & Sync Script](docs/boilerplate-development/agent-skills.md)
- [Configuration Templates Reference](docs/boilerplate-development/configuration-reference.md)
- [Command Catalog](docs/boilerplate-development/command-catalog.md)
- [Project Bootstrap Checklist](docs/boilerplate-development/bootstrap-checklist.md)
- [Cursor Playwright MCP Integration](docs/boilerplate-development/cursor-playwright-mcp.md)

### Feature Development Guides (`docs/feature-development/`)

- [Phased Execution & Agent Workflow](docs/feature-development/phased-workflow-and-agents.md)
- [Domain & Application Services](docs/feature-development/domain-and-application-services.md)
- [REST API & Contracts (OpenAPI & Bruno)](docs/feature-development/rest-api-and-contracts.md)
- [WordPress Admin UI/UX Standards](docs/feature-development/admin-ui-ux-standards.md)
- [Blocks & Interactivity API](docs/feature-development/blocks-and-interactivity.md)
- [WP-CLI Commands & Operations](docs/feature-development/wp-cli-commands.md)
- [WordPress Abilities API (AI Agents)](docs/feature-development/abilities-api.md)

### Preserved Registries & Specifications

- [Architecture Decision Records Index](docs/adr/README.md)
- [OpenAPI 3.1 Specification](docs/api/openapi.yaml)

---

## License

This project is licensed under the [GNU General Public License v2.0 or later](https://www.gnu.org/licenses/gpl-2.0.html).
