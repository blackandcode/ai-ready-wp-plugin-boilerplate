# Settings App REST API Contracts

This document specifies the REST API endpoints, schemas, authorization requirements, and error responses for the Settings App.

Governed by **ADR-0011: Generated OpenAPI 3.1 Specification from WordPress REST Controllers**.

---

## 1. Endpoints Overview

- **Base URL:** `/wp-json/ai-ready-wp/v1`
- **Authentication:** WordPress Cookie Nonce (`X-WP-Nonce`) or Application Passwords (`Authorization: Basic ...`).
- **Capability Required:** `manage_options`.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/settings` | Retrieve current plugin settings. | Yes (`manage_options`) |
| `POST` | `/settings` | Update plugin settings. | Yes (`manage_options`) |

---

## 2. `GET /settings`

Retrieves the current saved configuration.

### Response `200 OK`

```json
{
  "general": {
    "greeting_message": "Hello from AI-Ready WP Plugin Boilerplate!",
    "enable_feature": true,
    "description": "A modern WordPress plugin powered by AI workflows."
  },
  "advanced": {
    "rest_debug": false,
    "cache_ttl": 3600
  },
  "data_retention": {
    "uninstall_action": "keep_all"
  }
}
```

---

## 3. `POST /settings`

Updates one or more settings fields. Partial updates are supported.

### Request Body

```json
{
  "general": {
    "greeting_message": "Welcome to our upgraded site!",
    "enable_feature": false
  },
  "advanced": {
    "cache_ttl": 7200
  }
}
```

### Parameter Validation Rules

- `general.greeting_message`: String, 1–255 characters, required if `general` is present.
- `general.enable_feature`: Boolean.
- `general.description`: String, max 500 characters.
- `advanced.rest_debug`: Boolean.
- `advanced.cache_ttl`: Integer between 60 and 86400.
- `data_retention.uninstall_action`: String enum (`keep_all` or `delete_all`).

### Response `200 OK`

Returns the complete updated settings object.

### Error Responses

#### `400 Bad Request`

Returned when input validation fails:

```json
{
  "code": "airwp_invalid_setting",
  "message": "Greeting message exceeds 255 characters.",
  "data": {
    "status": 400
  }
}
```

#### `401 Unauthorized` / `403 Forbidden`

Returned when authentication is missing or user lacks `manage_options`:

```json
{
  "code": "rest_forbidden",
  "message": "Sorry, you are not allowed to do that.",
  "data": {
    "status": 403
  }
}
```
