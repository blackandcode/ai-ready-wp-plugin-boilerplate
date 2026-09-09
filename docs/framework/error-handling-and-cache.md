# Error Handling & Caching Utilities

This document details cross-cutting utilities provided in `src/framework/Support/`: the exception-to-`WP_Error` mapper (`WordPressErrorMapper`) and the transient caching utility (`TransientCache`).

---

## 1. Exception to `WP_Error` Mapping (`WordPressErrorMapper`)

### 1.1 Architectural Rationale

Domain and application services in Hexagonal DDD communicate failure by throwing typed PHP exceptions (`InvalidSettingException`, `InvalidArgumentException`, `RuntimeException`).

However, the WordPress REST API and core hooks expect responses to return `WP_Error` instances with HTTP status codes.

`WordPressErrorMapper` bridges this boundary cleanly, translating exceptions into standardized `WP_Error` responses:

```mermaid
flowchart LR
    Domain["Domain / Application Service"] -->|"throws Throwable"| Controller["REST Controller"]
    Controller -->|"WordPressErrorMapper::to_wp_error($e)"| Mapper["WordPressErrorMapper"]
    Mapper -->|"returns WP_Error(code, message, status)"| RestServer["WP_REST_Server"]
```

### 1.2 Mapping Rules

- **Domain Validation Exceptions (`*Invalid*`, `InvalidSettingException`):** Maps to `airwp_invalid_setting` with HTTP status **400 Bad Request**.
- **`InvalidArgumentException`:** Maps to `airwp_invalid_argument` with HTTP status **400 Bad Request**.
- **`RuntimeException`:** Maps to `airwp_runtime_error` with HTTP status **500 Internal Server Error**.
- **Fallback / Unexpected `Throwable`:** Maps to `airwp_internal_error` with HTTP status **500 Internal Server Error** and safe default message.

### 1.3 Usage Example

In a REST controller:

```php
try {
    $dto = $this->service->update_settings( $command );
    return new WP_REST_Response( $dto->to_array(), 200 );
} catch ( Throwable $exception ) {
    return WordPressErrorMapper::to_wp_error( $exception );
}
```

---

## 2. Transient Caching Utility (`TransientCache`)

### 2.1 Architectural Invariants

WordPress transients are subject to strict limitations:

- **Max Key Length:** Database transient option keys are limited in length (exceeding 45 characters with prefixes can truncate or corrupt).
- **TTL Bounds:** Storing unbounded or negative TTL values leads to perpetual cache lock-in or unpredictable expiration.

`TransientCache` enforces safety around the WordPress Transients API:

- **Key Normalization & Hashing:** Automatically prefixes keys with `airwp_`. If the key exceeds `MAX_KEY_LENGTH` (45 characters), it deterministically falls back to `airwp_` + `md5($key)`.
- **TTL Clamping:** Clamps minimum TTL to 1 second and maximum TTL to 30 days (`2592000` seconds).
- **Graceful WordPress Isolation:** Checks `function_exists('get_transient')` so unit tests can run safely without bootstrapping WordPress.

### 2.2 Usage Example

```php
use AIReady\WPPluginBoilerplate\Framework\Support\Cache\TransientCache;

// Storing data with 1-hour TTL
TransientCache::set( 'diagnostics_report', $data, 3600 );

// Retrieving data
$cached = TransientCache::get( 'diagnostics_report' );
if ( false !== $cached ) {
    return $cached;
}

// Deleting cached entry
TransientCache::delete( 'diagnostics_report' );
```

---

## 3. Coding Agent Rules

1. **Never Expose Internal Traces in Production:** `WordPressErrorMapper` sanitizes unknown exceptions to prevent leaking database credentials or stack traces to external API consumers.
2. **Always Use `build_key()` for Transients:** Never invoke `set_transient()` or `get_transient()` with raw un-prefixed string literals.
3. **Handle Missing Cache Gracefully:** Transients in WordPress are ephemeral and may be flushed at any time by object caching drops (Redis/Memcached). Always implement a fallback compute path when `TransientCache::get()` returns `false`.
