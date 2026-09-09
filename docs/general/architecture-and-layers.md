# Architecture and Layer Boundaries

This document defines the complete repository structure and software architecture for the **WordPress AI Plugin Development Boilerplate**.

It follows **ADR-0009: Tripartite App-Centric Architecture**, establishing three decoupled, highly cohesive tiers under `src/`:

1. **`src/framework/`**: Shared domain-agnostic kernel, DI container, event bus, error mapper, transient cache, and safe template engine.
2. **`src/backend/`**: Pure headless business logic organized by discrete applications (`Settings`, `Diagnostics`, `HelloWorld`), exposing capabilities strictly over REST, WP-CLI, and the WordPress Abilities API.
3. **`src/frontend/`**: Consolidated presentation domain containing React admin apps, Gutenberg blocks with the Interactivity API, block patterns, templates, shared React components/API adapters, and an isolated PHP presentation bridge (`src/frontend/Bridge/`).

---

## 1. Complete Directory Layout

```text
ai-ready-wp-plugin-boilerplate/
├── .cursor/                                 # Cursor IDE configuration & AI instructions
│   ├── rules/                               # Workspace-applied rules (*.mdc)
│   └── skills/                              # Active agent skills (WordPress, engineering, custom)
├── build/                                   # Compiled Webpack output (admin/settings, blocks/hello-world)
├── docs/                                    # Authoritative documentation hub
│   ├── general/                             # Product charter, architecture, ADR guide
│   ├── boilerplate-development/             # Toolchain, testing, versioning, devops
│   ├── feature-development/                 # Guides for authoring domain services, blocks, UI, CLI
│   ├── adr/                                 # Architectural Decision Records (0001-0009 & README.md)
│   ├── api/                                 # OpenAPI specifications (openapi.yaml)
│   └── plans/                               # Phased implementation plans (XX-<name>/)
├── tools/                                   # Operational automation and environment tools
│   ├── agent-skills/                        # Downloader & updater for external agent skills
│   ├── changelog/                           # CLI helper to stage unreleased changelog notes
│   ├── environment/                         # Pre-flight environment verifier CLI and engine
│   ├── rest-tests/                          # Cross-platform Bruno test runner
│   ├── scaffolding/                         # Interactive plugin rebranding & scaffolding CLI and engine
│   ├── versioning/                          # Automated SemVer synchronization CLI and engine
│   └── wp-env/                              # Container environment lifecycle hooks
├── src/                                     # Tripartite Architecture (Governed by ADR-0009)
│   ├── framework/                           # Shared Kernel & Infrastructure (PSR-4: Framework\)
│   │   ├── Container/                       # In-tree micro-container & ServiceProviderInterface
│   │   ├── Kernel/                          # Plugin singleton, Activation, Deactivation, Compatibility
│   │   ├── Event/                           # EventDispatcher & EventDispatcherInterface
│   │   ├── Support/                         # WordPressErrorMapper, TransientCache
│   │   └── View/                            # TemplateRenderer, TemplateRendererInterface
│   │
│   ├── backend/                             # Headless Backend Domain & Delivery (PSR-4: Backend\)
│   │   ├── Apps/                            # App-centric organization
│   │   │   ├── Settings/                    # Settings App (Domain, Application, Infrastructure, Rest, Cli, Abilities)
│   │   │   │   ├── Domain/                  # Value Objects, Aggregate Root, Events, Exceptions, RepositoryInterface
│   │   │   │   ├── Application/             # CQRS Commands, Queries, DTOs, SettingsApplicationService
│   │   │   │   ├── Infrastructure/          # WordPressSettingsRepository, SettingsSchema
│   │   │   │   ├── Rest/                    # SettingsController (/ai-ready-wp/v1/settings)
│   │   │   │   ├── Cli/                     # SettingsCliCommand (wp ai-ready settings-*)
│   │   │   │   ├── Abilities/               # SettingsAbilities (wp_register_ability)
│   │   │   │   └── SettingsBackendServiceProvider.php
│   │   │   ├── Diagnostics/                 # Diagnostics App (Domain, Application, Infrastructure, Rest, Cli, Abilities)
│   │   │   │   ├── Domain/                  # DiagnosticsProviderInterface
│   │   │   │   ├── Application/             # DiagnosticsService & DiagnosticsDTO
│   │   │   │   ├── Infrastructure/          # WordPressDiagnosticsProvider
│   │   │   │   ├── Rest/                    # DiagnosticsController (/ai-ready-wp/v1/diagnostics)
│   │   │   │   ├── Cli/                     # DiagnosticsCliCommand (wp ai-ready doctor)
│   │   │   │   ├── Abilities/               # DiagnosticsAbilities (wp_register_ability)
│   │   │   │   └── DiagnosticsBackendServiceProvider.php
│   │   │   └── HelloWorld/                  # Sample Feature App (Domain, Application, Rest)
│   │   │       ├── Domain/                  # HelloWorldGreeting Value Object
│   │   │       ├── Application/             # HelloWorldService & HelloWorldDTO
│   │   │       ├── Rest/                    # HelloWorldController (/ai-ready-wp/v1/hello)
│   │   │       └── HelloWorldBackendServiceProvider.php
│   │   ├── Cli/                             # Master PluginCliCommand aggregating app CLIs
│   │   └── BackendServiceProvider.php       # Master backend provider booting all app services
│   │
│   └── frontend/                            # Consolidated Presentation Domain
│       ├── apps/                            # Isolated frontend applications and blocks
│       │   ├── settings/                    # Settings React 18 Admin App
│       │   │   ├── react/                   # Mount, App container, WPDS sections, styles
│       │   │   └── templates/               # App-specific mount HTML (admin-settings-root.php)
│       │   └── hello-world/                 # Hello World Block (Block API v3 + Interactivity API)
│       │       ├── edit/                    # Inspector controls & edit component
│       │       ├── save.tsx                 # Interactivity directives (data-wp-interactive)
│       │       ├── view.ts                  # Client store (actions, state)
│       │       ├── block.json               # Metadata API v3 declaration
│       │       ├── style.css                # Scoped block frontend styling
│       │       └── editor.css               # Block editor styling
│       ├── patterns/                        # Block Patterns (interactive-showcase.php, card-feature.php)
│       ├── templates/                       # Shared PHP templates & partials (app-loading.php)
│       ├── shared/                          # Reusable UI primitives, hooks, API client, types
│       │   ├── api/SettingsApiClient.ts     # Repository/Adapter wrapping @wordpress/api-fetch
│       │   ├── components/                  # WPDS primitives (CardLayout, SectionHeader, NoticeBanner)
│       │   ├── hooks/                       # Custom hooks (useSettingsForm, useSettingsApi, useNotice)
│       │   └── types/                       # Shared TypeScript definitions
│       └── Bridge/                          # Architectural PHP Bridge (PSR-4: Frontend\)
│           ├── FrontendServiceProvider.php  # Master frontend provider booting presentation hooks
│           ├── Settings/                    # Settings UI lifecycle hooks (Menu, Assets, Route, Bootstrap)
│           ├── Block/                       # BlockRegistry (dynamic discovery from src/frontend/apps/*/block.json)
│           └── Pattern/                     # PatternRegistry (dynamic discovery from src/frontend/patterns/*.php)
├── tests/                                   # Automated testing pyramid
│   ├── bruno/                               # Git-native Bruno REST API test collection
│   │   ├── 00 Smoke/                        # Health check & REST index
│   │   ├── 03 Settings/                     # Settings schema & mutation endpoints
│   │   ├── 04 Diagnostics/                  # Diagnostics telemetry endpoints
│   │   ├── environments/Local.bru           # Environment variables (Base URL, App Password)
│   │   └── bruno.json                       # Bruno collection root metadata
│   ├── e2e/playwright/                      # Playwright E2E and visual regression suites (POM)
│   ├── js/                                  # Jest + RTL unit tests for TypeScript & React
│   ├── node/environment/                    # Environment checker unit tests
│   ├── node/scaffolding/                    # Scaffolding integration tests
│   ├── node/versioning/                     # Automated version sync integration tests
│   └── phpunit/                             # PHPUnit unit and integration suites
├── tools/                                   # Development scripts and CLI helpers
│   └── wp-env/after-start.mjs               # wp-env post-start automated setup script
├── .editorconfig                            # Shared formatting rules across editors
├── .env.example                             # Environment variable template
├── .markdownlint-cli2.jsonc                 # Markdown quality linter config
├── .wp-env.json                             # WordPress container environment definition
├── AGENTS.md                                # Root instructions for coding agents
├── blueprint.json                           # Declarative WordPress Playground blueprint
├── composer.json                            # PHP dependencies, PSR-4 autoload, WPCS scripts
├── jest.config.js                           # Frontend unit test configuration
├── package.json                             # Node dependencies, scripts, engines constraint
├── phpcs.xml.dist                           # WordPress Coding Standards ruleset
├── phpstan.neon.dist                        # PHPStan Level 6+ static analysis ruleset
├── phpunit.xml.dist                         # PHPUnit testsuites definition
├── playwright.config.ts                     # Playwright runner and visual regression config
├── ai-ready-wp-plugin-boilerplate.php       # Main WordPress plugin bootstrap file
├── tsconfig.json                            # TypeScript compilation configuration
├── uninstall.php                            # Safe de-provisioning & retention policy handler
├── webpack.config.js                        # Multi-entrypoint Webpack configuration
└── wp-cli.yml                               # Apache & WP-CLI runner configuration
```

---

## 2. Architectural Invariants Mandated by ADR-0009

1. **Strict REST Communication Boundary:**
   - Frontend components, stores, and templates must **never** invoke backend application services or database repositories directly.
   - All frontend data transactions are routed through the WordPress REST API (`/ai-ready-wp/v1/*`) via `SettingsApiClient`.
2. **Zero Presentation in Backend:**
   - Files in `src/backend/` must never call `add_menu_page()`, `add_submenu_page()`, `wp_enqueue_script()`, or render HTML output.
3. **Frontend PHP Bridge Isolation:**
   - All presentation PHP lifecycle hooks, script enqueuers, bootstrap builders, and dynamic block/pattern registries reside inside `src/frontend/Bridge/` (preventing folder pollution in `src/frontend/`).
4. **App-Centric Modularity:**
   - Features are organized as discrete, cohesive Apps (`Settings`, `Diagnostics`, `HelloWorld`) across both `src/backend/Apps/<App>` and `src/frontend/apps/<app>`.
5. **Shared Framework Purity:**
   - `src/framework/` contains exclusively domain-agnostic infrastructure (DI container, event bus, template engine, error mapper, plugin bootstrap).
6. **Autoloader Symmetry (Composer PSR-4):**
   - Clean, explicit mapping for all three tiers:

     ```json
     {
       "autoload": {
         "psr-4": {
           "AIReady\\WPPluginBoilerplate\\Framework\\": "src/framework/",
           "AIReady\\WPPluginBoilerplate\\Backend\\": "src/backend/",
           "AIReady\\WPPluginBoilerplate\\Frontend\\": "src/frontend/Bridge/"
         }
       }
     }
     ```

---

## 3. Communication Flow & REST Boundary

```mermaid
flowchart TD
    subgraph BrowserClient [Browser / Admin Client]
        AdminReact["Settings React App (src/frontend/apps/settings/react/)"]
        BlockView["Interactivity Client Store (src/frontend/apps/hello-world/view.ts)"]
    end

    subgraph RestAdapter [Frontend API Client Adapter]
        ApiClient["SettingsApiClient (src/frontend/shared/api/)"]
    end

    subgraph RestApiBoundary [WordPress REST API Boundary (/ai-ready-wp/v1/*)]
        SettingsRest["SettingsController (/settings)"]
        DiagRest["DiagnosticsController (/diagnostics)"]
        HelloRest["HelloWorldController (/hello)"]
    end

    subgraph BackendApps [Backend Headless Apps (src/backend/Apps/)]
        subgraph AppSettings [Settings App]
            SettingsAppService["SettingsApplicationService"]
            SettingsDomain["PluginSettings Aggregate"]
            SettingsRepo["WordPressSettingsRepository"]
        end
        subgraph AppDiag [Diagnostics App]
            DiagService["DiagnosticsService"]
            DiagProvider["WordPressDiagnosticsProvider"]
        end
        subgraph AppHello [HelloWorld App]
            HelloService["HelloWorldService"]
            HelloDomain["HelloWorldGreeting VO"]
        end
    end

    subgraph Framework [Shared Framework (src/framework/)]
        Container["DI Container"]
        EventBus["EventDispatcher"]
        TemplateEng["TemplateRenderer"]
    end

    AdminReact -->|"calls via @wordpress/api-fetch"| ApiClient
    ApiClient -->|"HTTP REST JSON"| RestApiBoundary
    SettingsRest --> SettingsAppService
    SettingsAppService --> SettingsDomain
    SettingsAppService --> SettingsRepo
    SettingsAppService --> EventBus
    DiagRest --> DiagService
    DiagService --> DiagProvider
    HelloRest --> HelloService
    HelloService --> HelloDomain
```
