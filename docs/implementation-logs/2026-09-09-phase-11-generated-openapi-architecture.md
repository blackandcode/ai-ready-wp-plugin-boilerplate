# Implementation Audit Log: Phase 11 — Generated OpenAPI 3.1 Architecture

- **Date:** 2026-09-09
- **Governing ADR:** [ADR-0011: Generated OpenAPI 3.1 specification from WordPress REST controllers](../adr/0011-generated-openapi-specification-from-wordpress-rest-controllers.md) (superseding [ADR-0004](../adr/0004-contract-first-rest-api-specification.md))
- **Status:** Completed
- **Version Status:** Staged under `## [Unreleased]` in `CHANGELOG.md` (Version `1.1.0`; manual bump via `npm run update-version:minor` or `npm run update-version:patch` when ready)

---

## 1. Executive Summary

Evolved the plugin's REST and OpenAPI architecture from hand-authored contracts to a **Code-Driven Generated OpenAPI 3.1 Architecture**, ensuring:

1. **Single Authoring Source of Truth:** WordPress `WP_REST_Controller` implementations, standard JSON schemas (`get_item_schema()`), and route-level `openapi` operation metadata serve as the single source of truth for all endpoint definitions.
2. **Deterministic, In-Tree Generator Engine:** Built a pure PHP generation pipeline (`src/framework/Rest/OpenApi/`) leveraging `symfony/yaml` that inspects routes, normalizes paths (`{param}`), converts Draft-4 schemas to OpenAPI 3.1, extracts reusable components, and atomically writes byte-identical YAML to `docs/api/openapi.yaml`.
3. **Automated Quality & Drift Gates:** Introduced `wp ai-ready openapi check` (`npm run openapi:check`) to enforce zero drift against live routes, and integrated `@redocly/cli` (`npm run openapi:lint`) into GitHub Actions CI (`_release-readiness.yml`).
4. **Development-Only Live REST Spec Endpoint:** Implemented `GET /wp-json/ai-ready-wp-dev/v1/openapi` gated strictly by `wp_is_development_mode( 'plugin' )` and `manage_options` capability.
5. **In-Admin Interactive API Reference Tab:** Integrated a dedicated "API Reference" tab into the Settings React application powered by a code-split, lazy-loaded Scalar viewer component (`@scalar/api-reference-react`), eliminating public CDN dependencies while maintaining a slim bundle footprint (main settings bundle remains ~23 KiB).

---

## 2. Pre-Implementation Checklist Status

- [x] Phase 1: Refactor Settings, HelloWorld, and Diagnostics controllers with route-level schema, derived args, and OpenAPI metadata.
- [x] Phase 2: Install `symfony/yaml` and implement OpenAPI generator, inspector, converter, normalizer, validator, factory, and YAML writer.
- [x] Phase 3: Implement WP-CLI openapi commands (`generate`, `check`) and package.json convenience scripts.
- [x] Phase 4: Configure `@redocly/cli`, `redocly.yaml`, and `openapi:lint` CI gate.
- [x] Phase 5: Implement development-only live spec endpoint `/ai-ready-wp-dev/v1/openapi` with development mode gating.
- [x] Phase 6: Add API Reference tab and lazy-loaded viewer to Settings React app gated by plugin development mode.
- [x] Phase 7: Draft ADR-0011, supersede ADR-0004, update documentation, and regenerate `docs/api/openapi.yaml`.
- [x] Phase 8: Add unit and integration tests across PHPUnit and Jest, and run full verification suite.

---

## 3. Files Created and Modified

### Created Files

| File | Purpose |
|:---|:---|
| `docs/adr/0011-generated-openapi-specification-from-wordpress-rest-controllers.md` | Architecture Decision Record establishing code-driven OpenAPI generation. |
| `redocly.yaml` | Redocly CLI configuration targeting `docs/api/openapi.yaml`. |
| `src/framework/Rest/OpenApi/OpenApiGenerator.php` | Generator facade orchestrating inspection, document creation, drift checking, and writing. |
| `src/framework/Rest/OpenApi/WordPressRouteInspector.php` | Introspects registered WordPress REST routes and schemas without executing handlers. |
| `src/framework/Rest/OpenApi/OpenApiPathNormalizer.php` | Normalizes WordPress regex route patterns to OpenAPI `{param}` path templates. |
| `src/framework/Rest/OpenApi/WordPressSchemaConverter.php` | Converts WordPress Draft-4 JSON schemas to OpenAPI 3.1 and extracts components. |
| `src/framework/Rest/OpenApi/OpenApiMetadataValidator.php` | Validates route handler OpenAPI metadata blocks (operationId, summary, tags, responses). |
| `src/framework/Rest/OpenApi/OpenApiDocumentFactory.php` | Assembles complete OpenAPI 3.1 document with deterministic lexical sorting. |
| `src/framework/Rest/OpenApi/OpenApiYamlWriter.php` | Serializes OpenAPI document to YAML with atomic writes and standard header. |
| `src/framework/Rest/OpenApi/Exception/OpenApiValidationException.php` | Custom exception for OpenAPI validation errors. |
| `src/backend/Cli/OpenApiCliCommand.php` | WP-CLI commands (`wp ai-ready openapi generate` and `wp ai-ready openapi check`). |
| `src/backend/Apps/Developer/DeveloperBackendServiceProvider.php` | Service provider gating developer routes and capabilities by development mode. |
| `src/backend/Apps/Developer/Rest/DevOpenApiController.php` | REST controller exposing live generated OpenAPI spec in development mode. |
| `src/frontend/apps/settings/react/components/ApiReferenceSection.tsx` | React section component fetching and rendering OpenAPI spec with retry/loading states. |
| `src/frontend/apps/settings/react/components/ApiReferenceViewer.tsx` | Code-split wrapper around `@scalar/api-reference-react`. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/OpenApiPathNormalizerTest.php` | Unit tests for route regex to path template conversion. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/WordPressSchemaConverterTest.php` | Unit tests for schema conversion and component extraction. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/OpenApiMetadataValidatorTest.php` | Unit tests for metadata validation and operationId constraints. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/OpenApiYamlWriterTest.php` | Unit tests for YAML dumping and atomic file writes. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/OpenApiDocumentFactoryTest.php` | Unit tests for document structure assembly and deterministic sorting. |
| `tests/phpunit/unit/Framework/Rest/OpenApi/OpenApiDriftTest.php` | Unit tests for drift checking against live routes and disk files. |
| `tests/phpunit/unit/Backend/Apps/Developer/DeveloperBackendServiceProviderTest.php` | Unit tests for developer provider lifecycle. |
| `tests/js/apps/settings/ApiReferenceSection.test.tsx` | Jest tests for API reference component loading, error, retry, and viewer states. |

### Modified Files

| File | Changes Made |
|:---|:---|
| `composer.json` | Added `symfony/yaml:^7.4` to `require-dev`. |
| `package.json` | Added `@redocly/cli` and `@scalar/api-reference-react` to `devDependencies`, added `openapi:generate`, `openapi:check`, and `openapi:lint` scripts. |
| `webpack.config.js` | Configured Webpack chunking (`chunkFilename: '[name].js'`, `publicPath: 'auto'`) for code splitting. |
| `src/backend/BackendServiceProvider.php` | Registered `OpenApiCliCommand` and `DeveloperBackendServiceProvider`. |
| `src/backend/Cli/PluginCliCommand.php` | Added subcommands and aliases for `openapi generate` and `openapi check`. |
| `src/backend/Apps/Settings/Rest/SettingsController.php` | Added route-level schema, derived write args, enriched schemas, and OpenAPI metadata. |
| `src/backend/Apps/HelloWorld/Rest/HelloWorldController.php` | Added route-level schema, enriched schema, and OpenAPI metadata. |
| `src/backend/Apps/Diagnostics/Rest/DiagnosticsController.php` | Added route-level schema, enriched schema, and OpenAPI metadata. |
| `src/frontend/Bridge/Apps/Settings/SettingsBootstrapData.php` | Added `development` payload with `pluginMode` and `openApiEndpoint`. |
| `src/frontend/shared/types/index.ts` | Added `DevelopmentToolsData` and `development` property to `AirwpBootstrapData`. |
| `src/frontend/apps/settings/react/components/SettingsShell.tsx` | Added conditional "API Reference" tab and hidden footer on API Reference tab. |
| `src/frontend/apps/settings/react/styles/settings.css` | Added styling for API Reference section, developer banner, and loader. |
| `docs/api/openapi.yaml` | Regenerated complete, deterministic OpenAPI 3.1 specification. |
| `docs/adr/0004-contract-first-rest-api-specification.md` | Marked as superseded by ADR-0011. |
| `docs/adr/README.md` | Indexed ADR-0011 and updated ADR-0004 status. |
| `docs/feature-development/rest-api-and-contracts.md` | Documented code-driven OpenAPI generation and controller patterns. |
| `docs/boilerplate-development/agent-skills.md` | Documented `wp-openapi-spec-writer` in-tree custom skill. |
| `.github/workflows/_release-readiness.yml` | Added `npm run openapi:lint` quality gate. |
| `AGENTS.md` | Added invariant 10 prohibiting manual editing of `docs/api/openapi.yaml`. |
| `MANIFEST.md` | Updated file inventory with all new classes, components, and tests. |
| `CHANGELOG.md` | Recorded all changes under `## [Unreleased]`. |

---

## 4. Verification Results

| Quality Gate | Command | Result |
|:---|:---|:---|
| OpenAPI Drift Check | `npm run openapi:check` | **PASS** — Specification matches live routes byte-for-byte. |
| Redocly OpenAPI Lint | `npm run openapi:lint` | **PASS** — Specification is valid OpenAPI 3.1 with 0 errors/warnings. |
| PHPUnit Unit Tests | `composer test` | **PASS** — 72 tests, 184 assertions (sub-millisecond in-memory execution). |
| WordPress Coding Standards | `composer lint` | **PASS** — 78 files checked, 0 errors, 0 warnings (`WordPress-Core`, `WordPress-Extra`, `WordPress-Docs`). |
| PHPStan Static Analysis | `composer analyse` | **PASS** — Level 6+ with `szepeviktor/phpstan-wordpress`, 0 errors. |
| Frontend Jest Unit Tests | `npm run test:unit` | **PASS** — 11 test suites, 33 tests passed. |
| Complete Node Test Matrix | `npm run test` | **PASS** — 76 total tests (unit, scaffold, versioning, environment, release). |
| JavaScript / CSS / MD Lint | `npm run lint` | **PASS** — 0 issues across JS, CSS, 106 markdown files, and GitHub Actions. |
| Production Asset Build | `npm run build` | **PASS** — Settings bundle: 23 KiB; Scalar viewer code-split into on-demand chunk. |
| ADR Referential Integrity | `npm run adr:validate -- --strict` | **PASS** — 11/11 ADRs passed strict validation. |

---

## 5. Post-Implementation Specification Comparison

| Feature Area | Initial Specification | Implemented Reality | Drift Notes |
|:---|:---|:---|:---|
| Authoring Model | Hand-edited contract-first YAML | Code-driven from PHP `WP_REST_Controller` | Eliminates drift between docs and runtime. |
| Route Schemas | Controller-level `get_item_schema()` | Route-level option (`schema` callback) + derived args | Follows standard WordPress REST Server routing. |
| OpenAPI Specification | OpenAPI 3.1 hand-written | Generated OpenAPI 3.1 with reusable components | Nested titled schemas extracted into `components/schemas`. |
| WP-CLI Commands | None | `wp ai-ready openapi generate` & `check` | Supports automated generation and CI drift verification. |
| Spec Linting | None | `@redocly/cli` via `npm run openapi:lint` | Integrated into GitHub Actions CI pipeline. |
| Live Dev Endpoint | None | `GET /wp-json/ai-ready-wp-dev/v1/openapi` | Gated by `wp_is_development_mode('plugin')` and capability. |
| Admin Viewer | None | "API Reference" tab in Settings React app | Uses code-split `@scalar/api-reference-react` chunk. |
| Documentation & ADR | ADR-0004 (contract-first) | ADR-0011 accepted, ADR-0004 superseded | Synchronized across charter, rules, and manifest. |
