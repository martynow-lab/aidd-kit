---
description: Stack rule for WordPress plugins (PHP 8.x) — hooks architecture, prefixing, nonces/capabilities, uninstall hygiene. Attach in Stage 1 (Architecture) and Stage 6 (GREEN).
alwaysApply: false
---

# Tech Stack — WordPress Plugin

## Stack & runtime

| Item | Value |
|------|-------|
| Language | PHP 8.x; namespaces preferred over function prefixes where autoloading exists |
| Platform | WordPress latest stable; declare `Requires at least` / `Requires PHP` in the header |
| Architecture | Hooks-based: register actions/filters, no logic at file load time |
| Autoload | Composer PSR-4 (`includes/`) or manual requires for small plugins |
| Coding standard | WordPress Coding Standards (PHPCS with `WordPress` ruleset) |

## Directory structure

```text
plugin-slug/
├── plugin-slug.php      # main file: plugin header + bootstrap only
├── uninstall.php        # cleanup: options, tables, cron, transients
├── includes/            # core classes/functions (shared logic)
├── admin/               # admin-only screens, settings, assets
├── public/              # front-end hooks, shortcodes, assets
└── languages/           # .pot / .po / .mo
```

- Main file: header, constants, requires, hook registration — nothing else.
- New subfolders appear in Refactor only (see `anti-over-engineering.md`).

## Naming

| Item | Convention |
|------|-----------|
| Everything global | Unique prefix (`myplugin_`) **or** namespace `MyPlugin\` — functions, classes, hooks, options, transients, meta keys, script handles, DB tables |
| Custom hooks | `myplugin_{event}` (actions), `myplugin_{value}` (filters) |
| Options | Single array option `myplugin_settings` over many scalar options |
| Text domain | Plugin slug, matches the header `Text Domain` |

## Allowed libraries

| Need | Use |
|------|-----|
| Data | Options API / post meta first; custom tables **only** for high-volume relational data justified in ARCHITECTURE |
| Queries | `WP_Query`, core APIs; `$wpdb` only when no core API exists |
| HTTP | `wp_remote_get` / `wp_remote_post` |
| AJAX / endpoints | REST API (`register_rest_route`) preferred over `admin-ajax.php` |
| Scheduling | WP-Cron (`wp_schedule_event`) |
| Dev tooling | Composer dev-deps: PHPUnit, Brain Monkey, PHPCS (WPCS), PHPStan |

## Forbidden

- **Closing `?>` tag in pure-PHP files**
- `eval()`, `create_function()`, `extract()`
- Direct `$_GET` / `$_POST` / `$_REQUEST` / `$_SERVER` use without sanitization (and nonce verification for state changes)
- Raw SQL without `$wpdb->prepare()` — no string-interpolated queries, ever
- Form/AJAX/REST handlers without **both** a nonce check and a capability check
- Loading plugin assets on every admin/front page — enqueue conditionally
- Bundling other plugins or TGMPA-style forced installs

## Testing tooling

| Level | Tool | When |
|-------|------|------|
| Unit (isolated) | PHPUnit + Brain Monkey (mock WP functions) | Pure logic in `includes/` |
| Integration | PHPUnit + WP test suite (`wp-env` / `wp scaffold plugin-tests`) | Hooks, DB, REST endpoints |
| Lint | PHPCS with WPCS ruleset | Every commit |
| Manual checklist | `MANUAL-CHECKLIST.md` from TEST-PLAN | Admin UI, activation/deactivation/uninstall flows |

- Always test activation, deactivation, and uninstall paths — at minimum as manual P0 scenarios in `TEST-PLAN.md`.

## Security

- **Every** form, AJAX, and REST handler: verify nonce (`check_ajax_referer` / `wp_verify_nonce` / REST nonce) **and** capability (`current_user_can()`); REST routes need a real `permission_callback` (never `__return_true` for state changes).
- Sanitize all input (`sanitize_text_field`, `absint`, `sanitize_key`, …); escape all output (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`).
- `$wpdb->prepare()` for any raw SQL with variables; `%i` for identifiers where supported.
- `uninstall.php` (or uninstall hook) removes options, custom tables, cron events, transients — leave no orphans.
- i18n every user-facing string with the plugin text domain; load via `load_plugin_textdomain` if needed.
- Guard direct file access: `defined( 'ABSPATH' ) || exit;` at the top of every PHP file.
- No secrets in code or options shipped to the client; capability-gate any settings that store credentials.
