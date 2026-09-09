# OpenAPI 3.1 Generator Engine (`src/framework/Rest/OpenApi/`)

This document details the architecture, processing pipeline, and deterministic serialization mechanics of the in-tree OpenAPI 3.1 generator engine under `src/framework/Rest/OpenApi/`.

Governed by **ADR-0011: Generated OpenAPI 3.1 Specification from WordPress REST Controllers** (superseding ADR-0004).

---

## 1. Architectural Overview

Instead of maintaining a hand-written OpenAPI specification file prone to drift, the boilerplate employs a **Code-Driven Generated OpenAPI 3.1 Architecture**. Registered WordPress `WP_REST_Controller` implementations, standard JSON schemas (`get_item_schema()`), and controller endpoint arguments act as the **Single Source of Truth**.

```mermaid
flowchart TD
    subgraph WP_REST [WordPress REST Subsystem]
        Server["WP_REST_Server (rest_api_init)"]
        Controllers["WP_REST_Controller Instances (Settings, HelloWorld, Diagnostics)"]
    end

    subgraph Engine [OpenAPI Generator Pipeline (src/framework/Rest/OpenApi/)]
        Facade["OpenApiGenerator"]
        Inspector["WordPressRouteInspector"]
        Normalizer["OpenApiPathNormalizer"]
        Validator["OpenApiMetadataValidator"]
        Factory["OpenApiDocumentFactory"]
        Writer["OpenApiYamlWriter (Symfony YAML)"]
    end

    subgraph Outputs [Target Artifacts]
        StaticDoc["docs/api/openapi.yaml (Committed Reference)"]
        DevRoute["GET /wp-json/ai-ready-wp-dev/v1/openapi (Admin Viewer)"]
    end

    Controllers --> Server
    Facade --> Inspector
    Inspector -->|"extracts routes for namespace"| Server
    Inspector --> Normalizer
    Normalizer -->|"transforms regex to templates"| Factory
    Factory --> Validator
    Factory --> Writer
    Writer -->|"atomic write"| StaticDoc
    Facade -->|"serves JSON"| DevRoute
```

---

## 2. Pipeline Components

### 2.1 `OpenApiGenerator` (Facade)

The central coordinator exposing:

- `generate( string $route_namespace, array $config = [] ): array`: Generates the live OpenAPI 3.1 document as a strongly structured PHP array.
- `generate_and_write( string $output_path, string $route_namespace ): array`: Generates the document, executes atomic write to disk, and returns execution metrics.
- `verify_drift( string $file_path, string $route_namespace ): bool`: Compares live generated YAML against the file on disk byte-for-byte.

### 2.2 `WordPressRouteInspector`

Introspects `$wp_rest_server->get_routes()` for a given namespace prefix (default: `ai-ready-wp/v1`):

- Filters out non-matching route namespaces.
- Extracts HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
- Parses argument schemas (`args`), required constraints, and permission callbacks.
- Extracts custom `openapi` metadata provided by controllers.

### 2.3 `OpenApiPathNormalizer`

WordPress routes use PCRE regex patterns (e.g., `/(?P<id>[\d]+)`). OpenAPI requires RFC 6570 URI templates (e.g., `/{id}`).

`OpenApiPathNormalizer`:

- Strips the namespace prefix (`ai-ready-wp/v1`).
- Replaces named regex groups (`(?P<param>[^/]+)`) with `{param}` path templates.
- Automatically generates matching `in: path` parameter definitions with appropriate schema types (integer vs string).

### 2.4 `OpenApiDocumentFactory`

Assembles the root OpenAPI 3.1 specification object:

- `openapi: 3.1.0`
- `info`: Title, description, version, license.
- `paths`: Sorted alphabetically for deterministic output.
- `components.schemas`: Reusable JSON schema components derived from controller item schemas.
- `components.securitySchemes`: Application Passwords and WordPress Nonce definitions.

### 2.5 `OpenApiYamlWriter`

Converts the assembled document array into YAML format using `Symfony\Component\Yaml\Yaml`:

- **Byte-for-Byte Determinism:** Uses fixed indentation (2 spaces), object-as-map flags, and alphabetized keys.
- **Canonical Header:** Prepends a strict `# GENERATED FILE - DO NOT EDIT` header.
- **Atomic File Writes:** Writes to a temporary file (`.tmp`) before renaming, preventing file corruption or partial reads.

---

## 3. Drift Verification & CI Gate

The generator engine guarantees that the committed `docs/api/openapi.yaml` never drifts from PHP code:

```bash
# Verify byte-identical synchronization
wp ai-ready openapi check
```

If any developer modifies a route parameter or response schema without regenerating the specification, `openapi check` exits with a non-zero code and displays the exact diff, blocking CI pull request merges.

---

## 4. Coding Agent Rules

1. **Never Edit `docs/api/openapi.yaml` by Hand:** Always run `npm run openapi:generate` (or `wp-env run cli wp ai-ready openapi generate`) after altering REST controllers.
2. **Author Schemas in PHP Controllers:** Define parameter types, minimum/maximum values, sanitization callbacks, and descriptions inside `get_item_schema()` or route `args` arrays in `WP_REST_Controller`.
3. **Preserve Determinism:** When modifying `OpenApiDocumentFactory` or `OpenApiPathNormalizer`, ensure all keys and path lists remain deterministically sorted. Never insert dynamic timestamps or local machine paths into generated output.
