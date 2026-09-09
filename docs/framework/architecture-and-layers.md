# Architecture and Layer Boundaries

This document defines the complete repository structure and software architecture for the **WordPress AI Plugin Development Boilerplate**.

It follows **ADR-0009: Tripartite App-Centric Architecture**, establishing three decoupled, highly cohesive tiers under `src/`:

1. **`src/framework/`**: Shared domain-agnostic kernel, DI container, event bus, error mapper, transient cache, safe template engine, and code-driven OpenAPI generator pipeline.
2. **`src/backend/`**: Pure headless business logic organized by discrete applications (`Settings`, `Diagnostics`, `HelloWorld`, `Developer`), exposing capabilities strictly over REST, WP-CLI, and the WordPress Abilities API.
3. **`src/frontend/`**: Consolidated presentation domain containing React admin apps, Gutenberg blocks with the Interactivity API, block patterns, templates, shared React components/API adapters, and an isolated PHP presentation bridge (`src/frontend/Bridge/`).

---

## 1. Directory Structure

```text
ai-ready-wp-plugin-boilerplate/
├── .cursor/                                 # Cursor IDE configuration & AI instructions
│   ├── rules/                               # Workspace-applied rules (*.mdc)
│   └── skills/                              # Active agent skills (WordPress, engineering, custom)
├── .github/                                 # CI/CD pipelines & release automation (ADR-0010)
│   ├── workflows/
│   │   ├── _release-readiness.yml           # Reusable release-readiness verification gate
│   │   ├── ci.yml                           # PR and push CI pipeline
│   │   └── release.yml                      # Manual release dispatch with Sigstore provenance
│   └── dependabot.yml                       # Dependency automation with commit-SHA pinning
├── build/                                   # Compiled Webpack output (admin/settings, blocks/hello-world)
├── docs/                                    # Documentation Hub
│   ├── framework/                           # Framework kernel, charter, architecture, DI, lifecycle, bridge
│   ├── testing/                             # 5-tier testing pyramid & release contract validation
│   ├── apps/                                # Technical specifications by app (settings, hello-world, diagnostics, developer)
│   ├── developers/                          # Developer onboarding, CLI commands, coding standards, scaffolding
│   ├── specifications/                      # Functional specifications by app and phased implementation plans
│   ├── api/                                 # Generated OpenAPI 3.1 specification (openapi.yaml)
│   ├── devops/                              # Two-Pipeline CI/CD, package contracts, and distribution guides
│   ├── adr/                                 # Architecture Decision Records (0001-0011 & README.md)
│   └── implementation-logs/                 # Historical audit logs from completed phases
├── tools/                                   # Operational automation and release tooling
│   ├── agent-skills/                        # Downloader & updater for external agent skills
│   ├── changelog/                           # CLI helper to stage unreleased changelog notes
│   ├── environment/                         # Pre-flight environment verifier CLI and engine
│   ├── release/                             # In-tree release packaging, validation, and contract linters
│   ├── rest-tests/                          # Cross-platform Bruno test runner
│   ├── scaffolding/                         # Interactive plugin rebranding CLI and engine
│   ├── versioning/                          # Automated SemVer synchronization CLI and engine
│   └── wp-env/                              # Container environment lifecycle hooks
├── src/                                     # Tripartite Architecture (Governed by ADR-0009)
│   ├── framework/                           # Shared Kernel & Infrastructure (PSR-4: Framework\)
│   │   ├── Container/                       # In-tree micro-container & ServiceProviderInterface
│   │   ├── Kernel/                          # Plugin singleton, Activation, Deactivation, Compatibility
│   │   ├── Event/                           # EventDispatcher & EventDispatcherInterface
│   │   ├── Support/                         # WordPressErrorMapper, TransientCache
│   │   ├── View/                            # TemplateRenderer, TemplateRendererInterface
│   │   └── Rest/OpenApi/                    # OpenApiGenerator, RouteInspector, DocumentFactory, YamlWriter
│   │
│   ├── backend/                             # Headless Backend Domain & Delivery (PSR-4: Backend\)
│   │   ├── Apps/                            # App-centric organization
│   │   │   ├── Settings/                    # Settings App (Domain, Application, Infrastructure, Rest, Cli, Abilities)
│   │   │   ├── Diagnostics/                 # Diagnostics App (Domain, Application, Infrastructure, Rest, Cli, Abilities)
│   │   │   ├── HelloWorld/                  # Sample Feature App (Domain, Application, Rest)
│   │   │   └── Developer/                   # Dev Tools App (Live OpenAPI route gated by development mode)
│   │   ├── Cli/                             # Master PluginCliCommand & OpenApiCliCommand
│   │   └── BackendServiceProvider.php       # Master backend provider booting all app services
│   │
│   └── frontend/                            # Consolidated Presentation Domain
│       ├── apps/                            # Isolated frontend applications and blocks
│       │   ├── settings/                    # Settings React 18 Admin App
│       │   └── hello-world/                 # Hello World Block (Block API v3 + Interactivity API)
│       ├── patterns/                        # Block Patterns (interactive-showcase.php, card-feature.php)
│       ├── templates/                       # Shared PHP templates & partials (app-loading.php)
│       ├── shared/                          # Reusable UI primitives, hooks, API client, types
│       └── Bridge/                          # Architectural PHP Bridge (PSR-4: Frontend\)
│           ├── FrontendServiceProvider.php  # Master frontend coordinator aggregating app providers & registries
│           ├── Settings/                    # Settings UI hooks (Menu, Assets, Route, Bootstrap)
│           ├── Block/                       # Dynamic BlockRegistry scanning apps/*/block.json
│           └── Pattern/                     # Dynamic PatternRegistry scanning patterns/*.php
└── tests/                                   # Automated 5-tier testing pyramid
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
   - Features are organized as discrete, cohesive Apps (`Settings`, `Diagnostics`, `HelloWorld`, `Developer`) across both `src/backend/Apps/<App>` and `src/frontend/apps/<app>`.
5. **Shared Framework Purity:**
   - `src/framework/` contains exclusively domain-agnostic infrastructure (DI container, event bus, template engine, error mapper, plugin bootstrap, OpenAPI generator pipeline).
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
        DevRest["DevOpenApiController (/openapi - dev mode only)"]
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
        subgraph AppDev [Developer App]
            DevService["OpenApiGenerator Service"]
        end
    end

    subgraph Framework [Shared Framework (src/framework/)]
        Container["DI Container"]
        EventBus["EventDispatcher"]
        TemplateEng["TemplateRenderer"]
        OpenApiGen["OpenApiGenerator Engine"]
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
    DevRest --> OpenApiGen
```
