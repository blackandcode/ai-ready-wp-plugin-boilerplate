# WordPress Plugin Architecture Decision Patterns

This reference provides domain-specific patterns and trigger guidance for architectural choices encountered in professional WordPress plugin engineering.

---

## 1. Data Architecture

### Custom MySQL Table vs. Post Meta / Options API
- **The Architectural Fork:** Should plugin entities be stored in standard WordPress tables (`wp_posts`, `wp_postmeta`, `wp_options`) or dedicated custom database tables (`wp_myplugin_items`)?
- **When an ADR is Required:** Always. Creating or altering database tables is difficult to reverse and affects performance, multisite support, and backup sizes.
- **Decision Drivers:**
  - *Query Performance:* Post meta queries (`meta_query`) require expensive `JOIN` operations on large datasets.
  - *Data Volume:* Datasets exceeding 50,000 records benefit significantly from custom indexed tables.
  - *Transactional Integrity:* Standard WordPress options/meta lack atomic foreign keys and transactions.
- **Architectural Invariants to Record:**
  - Explicit table prefixing (`$wpdb->prefix . 'myplugin_...'`).
  - Schema migration strategy: Use WordPress `dbDelta()` with a versioned schema constant (`MYPLUGIN_DB_VERSION`).
  - Strict isolation: Access to custom tables must be encapsulated inside designated Repository classes; direct `$wpdb` calls across the plugin are prohibited.

### Multisite Data Ownership
- **The Architectural Fork:** Should data be isolated per site (`wp_X_myplugin_...`) or centralized globally (`wp_myplugin_...` or site ID columns)?
- **Key Consideration:** Network-wide analytics or licensing vs. strict per-site data tenancy.

---

## 2. Asynchronous Execution & Background Jobs

### Action Scheduler vs. WP-Cron
- **The Architectural Fork:** Managing scheduled or asynchronous tasks using native WordPress WP-Cron (`wp_schedule_event`) vs. Action Scheduler (`as_schedule_single_action`).
- **When an ADR is Required:** Highly recommended when tasks involve financial data, transactional emails, webhooks, or high-volume syncing.
- **Trade-off Analysis:**
  - *WP-Cron:* Built-in to WordPress core, zero external dependencies. However, it depends on web traffic to trigger, easily misses execution windows, lacks built-in retry mechanics, and provides no admin visibility.
  - *Action Scheduler:* High reliability, automatic concurrency management, batching, built-in retry backoff, and full WP-Admin inspection. However, it introduces an external library and creates dedicated database tables (`wp_actionscheduler_*`).
- **Architectural Invariants to Record:**
  - All background actions must be **idempotent** (safe to run multiple times without corrupting state).
  - Actions must receive entity IDs rather than large serialized object payloads in arguments.

---

## 3. Integration & API Surface

### REST API vs. `admin-ajax.php`
- **The Architectural Fork:** Exposing endpoints via WordPress REST API (`register_rest_route()`) vs. legacy AJAX handlers (`wp_ajax_*`).
- **Guidance:** Modern plugins must standardize on the WordPress REST API (`/wp-json/plugin-slug/v1/...`).
- **When an ADR is Required:** Only when breaking changes, namespace versioning strategies, or custom authentication schemes are introduced.

### Webhook Handling & Idempotency
- **The Architectural Fork:** Synchronous webhook processing vs. queued asynchronous dispatch.
- **Architectural Invariants to Record:**
  - Incoming webhooks must immediately validate signatures, return HTTP 200 OK, and enqueue processing to prevent third-party timeouts.
  - A unique idempotency key or event ID must be persisted to block duplicate webhook executions.

---

## 4. Dependencies & PHP Scoping

### Third-Party Composer Packages & PHP-Scoper
- **The Architectural Fork:** Requiring external Composer packages (e.g. AWS SDK, Guzzle, Stripe SDK).
- **The Dependency Conflict Risk:** If two WordPress plugins load different versions of the same Composer package, fatal PHP errors occur.
- **Architectural Invariants to Record:**
  - If a production third-party Composer dependency is introduced, it must be prefixed using `humbug/php-scoper` or bundled safely to prevent namespace collisions.
  - Zero-dependency micro-containers or native WordPress HTTP API (`wp_remote_get`, `wp_remote_post`) should be preferred over heavy framework packages.

---

## 5. WooCommerce Architecture

### High-Performance Order Storage (HPOS) Compatibility
- **The Architectural Fork:** Direct queries to `wp_posts`/`wp_postmeta` vs. WooCommerce CRUD getters/setters (`wc_get_order()`) and custom HPOS tables (`wp_wc_orders`).
- **Architectural Invariants to Record:**
  - Explicitly declare HPOS compatibility in plugin bootstrap (`FeaturesUtil::declare_compatibility('custom_order_tables', ...)`).
  - Direct SQL queries to `wp_posts` with `post_type = 'shop_order'` are strictly forbidden. All access must use WooCommerce repository APIs.

---

## 6. Gutenberg & Block Architecture

### Dynamic Block (Server Rendered) vs. Static Block (Saved Content)
- **The Architectural Fork:** Dynamic rendering in PHP (`render.php`) vs. static HTML serialization in JavaScript (`save()` returning serialized HTML).
- **Decision Drivers:**
  - *Dynamic Rendering:* Necessary when block output depends on dynamic database state, current user capabilities, or frequent markup updates without invalidating past post content.
  - *Static Rendering:* Faster frontend delivery, zero database queries on page load, but requires deprecation migrations if block markup changes.
- **Architectural Invariants to Record:**
  - Blocks with dynamic data must use dynamic rendering with `block.json` declaring `render: "file:./render.php"`.
