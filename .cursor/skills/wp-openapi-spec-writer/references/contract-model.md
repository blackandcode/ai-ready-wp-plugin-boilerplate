# Contract Model and Mapping Rules

## Authority model

Use two distinct meanings of "source of truth":

- **Authoring source of truth:** registered WordPress REST route/controller code, controller JSON Schemas, derived endpoint args, and small OpenAPI-only metadata blocks.
- **Authoritative generated consumer reference:** `docs/api/openapi.yaml`.

The generated file is committed because humans, coding agents, tests, and tools need a fast stable contract without booting WordPress. It must never be the place where changes are authored.

## Route mapping

For the configured plugin namespace:

1. Enumerate registered routes from `rest_get_server()->get_routes( $namespace )`.
2. Obtain route-level options/schema from the server.
3. Convert WordPress route regex parameters such as `(?P<id>\d+)` to `{id}`.
4. For each handler method emit one OpenAPI operation.
5. Treat route arguments that appear in the path as `in: path` and `required: true`.
6. Treat GET/DELETE non-path args as query parameters unless explicitly modeled otherwise.
7. For JSON write endpoints, map body fields to `requestBody.content.application/json`.
8. Preserve the current API method set. A generator must not alter runtime routes.

## Schema mapping

WordPress REST schemas use a JSON Schema subset historically aligned with Draft 4. OpenAPI 3.1 uses modern JSON Schema vocabulary. Normalize rather than blindly copying WordPress-only keys.

Preserve compatible keywords such as:

- `type`
- `title`
- `description`
- `properties`
- `required`
- `items`
- `enum`
- `default`
- `format`
- `minimum` / `maximum`
- `minLength` / `maxLength`
- `minItems` / `maxItems`
- `pattern`
- `additionalProperties`
- `oneOf` / `anyOf`

Handle or remove WordPress-only/runtime-only keys deliberately, including context/argument options and validation callbacks that cannot be represented in OpenAPI.

If a constraint cannot be represented faithfully, fail or document an explicit generator limitation. Never silently invent semantics.

## Component naming

Prefer stable PascalCase component names derived from resource schema titles, for example:

- `plugin_settings` -> `PluginSettings`
- `hello_world_response` -> `HelloWorldResponse`

If two schemas resolve to the same component name, fail with a clear collision error instead of suffixing unpredictably.

## Request bodies

For controllers using `$request->get_json_params()`, emit:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/PluginSettings'
```

Only emit form encodings if runtime code actually consumes them.

For partial updates, do not mark every resource property required unless runtime behavior requires full replacement.

## Responses

Use the route/resource schema as the default successful response schema only when runtime response payload actually matches it.

Operation metadata should document material statuses such as:

- `200`, `201`, `204` success variants;
- `400` validation/domain input errors;
- `401` unauthenticated when applicable;
- `403` authenticated but insufficient capability, or repository-specific authorization failures;
- `404` missing resource;
- `409` conflicts where applicable;
- `422` only if the plugin actually uses it;
- `500` only if intentionally part of the documented public contract.

Prefer a reusable error schema when error payload shape is stable.

## Determinism

Generated YAML must be stable:

- sort paths lexically;
- emit methods in a fixed order: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD;
- sort components by name;
- keep property order from the authoritative schema when useful, but never depend on hash iteration instability;
- omit generated timestamps, host-specific paths, random IDs, or environment-specific URLs unless they are intentional variables/placeholders.

The second generation with unchanged code must result in a byte-identical file.
