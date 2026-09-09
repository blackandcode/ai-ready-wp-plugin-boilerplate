# WordPress AI Plugin Development Boilerplate

<p align="center">
  <img src="https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/icons/src/library/symbol.svg" width="80" height="80" alt="WordPress AI Boilerplate Logo" />
</p>

<p align="center">
  <strong>The Enterprise-Grade WordPress Plugin Boilerplate Built for AI Coding Agents and Modern Engineering Teams.</strong>
</p>

<p align="center">
  <a href="#quick-start-under-2-minutes"><img src="https://img.shields.io/badge/WordPress-7.0%2B-blue?logo=wordpress&logoColor=white" alt="WordPress 7.0+" /></a>
  <a href="#quick-start-under-2-minutes"><img src="https://img.shields.io/badge/PHP-8.3%2B-purple?logo=php&logoColor=white" alt="PHP 8.3+" /></a>
  <a href="#key-features"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" /></a>
  <a href="docs/README.md#tier-1-static-quality-analysis"><img src="https://img.shields.io/badge/WPCS-Core%20%7C%20Extra%20%7C%20Docs-2271b1" alt="WPCS Compliant" /></a>
  <a href="docs/README.md#tier-1-static-quality-analysis"><img src="https://img.shields.io/badge/PHPStan-Level%206%2B-brightgreen" alt="PHPStan Level 6+" /></a>
  <a href="docs/README.md#5-tier-testing-pyramid"><img src="https://img.shields.io/badge/Testing-5--Tier%20Pyramid-orange" alt="5-Tier Testing Pyramid" /></a>
  <a href="docs/README.md#bundled-agent-skills-and-ai-instructions"><img src="https://img.shields.io/badge/Agentic%20AI-Ready-7928CA?logo=openai&logoColor=white" alt="Agentic AI Ready" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://example.github.io/wordpress-ai-plugin-boilerplate/"><strong>🌐 Marketing Website (Preview)</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://example.github.io/wordpress-ai-plugin-docs/"><strong>📚 Documentation Site (Preview)</strong></a> &nbsp;&bull;&nbsp;
  <a href="docs/README.md"><strong>📖 In-Repo Docs Hub</strong></a>
</p>

---

## Quick Start (Under 2 Minutes)

### 0. Prerequisites: Official WordPress Development Environment

This boilerplate is powered by `@wordpress/env` (`wp-env`), the **[official WordPress local development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/)** maintained by the core WordPress team. Adopting the official standard ensures zero proprietary lock-in, effortless Docker orchestration, and reliable parity with WordPress Core.

Before getting started, make sure your host machine satisfies the official requirements:

- **Docker & Docker Compose** (running via Docker Desktop on macOS/Windows or Docker Engine on Linux/WSL2)
- **Node.js** (`>= 24.16.0`) & **npm** (`>= 11.0.0`)
- **Git**

*(Host PHP >= 8.3 and Composer are optional advisory recommendations for host-level IDE linting and fast unit testing, as WordPress and MariaDB execute fully inside Docker).*

*For step-by-step OS installation instructions (macOS, Windows, WSL2, Linux), consult our [Development Prerequisites Guide](docs/developers/development-prerequisites.md).*

### 1. Clone & Scaffold Your Plugin

```bash
# Clone the repository
git clone https://github.com/wordpress-ai/ai-ready-wp-plugin-boilerplate.git my-awesome-plugin
cd my-awesome-plugin

# (Optional) Automatically verify all environment dependencies
npm run pre-check

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

Your plugin is instantly mounted and running:

- **WordPress Admin:** [http://localhost:8888/wp-admin/](http://localhost:8888/wp-admin/) (`admin` / `password`)
- **Plugin Settings Page:** [http://localhost:8888/wp-admin/admin.php?page=map-settings](http://localhost:8888/wp-admin/admin.php?page=map-settings)
- **REST Endpoint:** [http://localhost:8888/wp-json/my-awesome-plugin/v1/hello](http://localhost:8888/wp-json/my-awesome-plugin/v1/hello)

---

## Why This Boilerplate?

Building WordPress plugins shouldn't feel like stepping back into 2010.

Most WordPress codebases are plagued by legacy procedural spaghetti, global variables, and missing tests. Worse yet, when modern teams bring AI coding assistants (like Cursor, Claude Code, Windsurf, or Codex) into legacy code, the models hallucinate missing hooks, break architectural boundaries, and produce unmaintainable drift.

**The WordPress AI Plugin Development Boilerplate changes that.**

We engineered this boilerplate to deliver the best of both worlds:

- **For Human Developers:** Clean Hexagonal architecture, modern React 18 & Gutenberg components, zero-dependency dependency injection, a lightning-fast local Docker sandbox, and automated release tooling that frees you from tedious boilerplate work.
- **For AI Coding Agents:** Rigid domain boundaries, persistent architectural rules, and 32 pre-bundled agent skills that keep AI assistants strictly on track. AI agents generate production-grade code that compiles, passes WordPress Coding Standards (WPCS), and adheres to your architectural invariants on the very first try.

> Jump in, rebrand your plugin with a single command, and ship enterprise-grade WordPress software with complete confidence.

---

## Key Features

- 🚀 **Instant Scaffolding & Rebranding:** Rebrand your plugin's name, slug, PHP namespace, constants, and React packages in seconds with `npm run scaffold`.
- 🧩 **Clean Tripartite Architecture:** Decouples core framework kernel, headless backend business apps, and presentation layers for modular, testable code.
- 🤖 **Engineered for AI Coding Agents:** 32 bundled agent skills and strict architectural rules guide Cursor, Claude Code, and Windsurf to write zero-drift code.
- 🛡️ **5-Tier Testing Pyramid Out-of-the-Box:** Pre-configured PHPUnit 11 unit/integration tests, Jest + RTL frontend tests, Git-native Bruno REST contract tests, and Playwright visual E2E testing.
- ⚡ **Modern React 18 & Gutenberg Ready:** Features a Block API v3 block with WordPress Interactivity API (`data-wp-*`) and a complete WordPress Design System (WPDS) React admin dashboard.
- 📦 **Automated SemVer & Release Packaging:** Atomic version bumping via CLI (`npm run update-version`) with automated changelog promotion from staged `[Unreleased]` notes.
- 🔄 **Two-Pipeline CI/CD & Provenance:** Automated CI verification on every pull request, with manual release workflows guaranteeing that the tested artifact is the exact released ZIP.
- 📖 **Code-Driven Generated OpenAPI 3.1:** REST controllers act as the single source of truth—generate, validate, and lint OpenAPI specs automatically with zero manual YAML editing.

---

## Automated Scaffolding & Rebranding CLI

Adapt the boilerplate to your plugin identity with zero manual find-and-replace errors.

### Interactive Mode

Run without arguments for a guided interactive setup:

```bash
npm run scaffold
# or
npm run rename
```

### CLI Flag Mode

Automate rebranding directly in CI or terminal scripts:

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

*(For a complete reference of all scaffolding flags and configuration options, consult the [Project Scaffolding CLI Guide](docs/developers/project-scaffolding-cli.md).)*

---

## Documentation & External Sites

Explore our complete documentation ecosystem and live project portals:

- **[In-Repo Documentation Hub](docs/README.md):** Architectural highlights, 5-tier testing details, SemVer mechanics, CI/CD pipeline, ADR registry, and domain specifications.
- **[Official Documentation Site](https://example.github.io/wordpress-ai-plugin-docs/):** *(Placeholder)* Full interactive documentation generated from markdown and hosted on GitHub Pages.
- **[Product Marketing Website](https://example.github.io/wordpress-ai-plugin-boilerplate/):** *(Placeholder)* Visual presentation, feature tour, and live demos hosted on GitHub Pages.

---

## License

This project is licensed under the [MIT License](LICENSE).
