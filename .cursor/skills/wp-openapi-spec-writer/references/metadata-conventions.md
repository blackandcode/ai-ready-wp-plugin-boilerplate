# OpenAPI Metadata Conventions

## Operation IDs

Every operation must have a unique and stable `operationId`.

Use lower camel case and action + resource naming:

- `getPluginSettings`
- `updatePluginSettings`
- `listWidgets`
- `getWidget`
- `createWidget`
- `updateWidget`
- `deleteWidget`
- `runDiagnosticCheck`

Do not encode API version or HTTP verb literally when the action name already expresses it. Avoid implementation class names.

Operation IDs are public tool identifiers: changing them can break generated clients and agents even when the path remains unchanged.

## Summaries

Use short action-oriented summaries:

- `Get plugin settings`
- `Update plugin settings`
- `List widgets`

Avoid repeating namespace/path information.

## Descriptions

Add a description when the endpoint has:

- side effects;
- non-obvious permission requirements;
- eventual consistency;
- destructive behavior;
- important filtering/pagination rules;
- conditional response behavior.

Keep implementation details out of public descriptions.

## Tags

Tags represent stable API domains/resources, usually matching backend app boundaries:

- `Settings`
- `Diagnostics`
- `Hello World`

Do not create a unique tag per endpoint.

## Responses

At minimum document:

1. successful response;
2. permission/auth failure for protected endpoints;
3. validation/domain error where input exists;
4. not-found/conflict responses when the implementation can return them.

Metadata descriptions must match the actual `WP_Error`/mapper status behavior.

## Deprecation

Set `deprecated: true` only when there is an intentional deprecation policy. Describe the replacement in the operation description. Do not remove deprecated endpoints in the same change unless explicitly required.

## Examples

Examples are optional but valuable for complex request/response models. Prefer stable domain-neutral examples that do not expose secrets, real tokens, personally identifiable data, or machine-specific URLs.
