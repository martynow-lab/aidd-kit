---
description: Stack rule for WordPress classic themes (PHP 8.x) — template hierarchy, escaping, enqueue, i18n. Attach in Stage 1 (Architecture) and Stage 6 (GREEN).
alwaysApply: false
---

# Tech Stack — WordPress Classic Theme

## Stack & runtime

| Item | Value |
|------|-------|
| Language | PHP 8.x (typed where practical), modern JS for front-end assets |
| Platform | WordPress latest stable, classic (non-block) theme |
| Templating | WP template hierarchy (`index.php`, `single.php`, `archive-*.php`, `template-parts/`) |
| Build | Vite or wp-scripts for assets if the theme has a build step (per ARCHITECTURE) |
| Coding standard | WordPress Coding Standards (PHPCS with `WordPress` ruleset) |

## Directory structure

```text
theme/
├── style.css            # theme header
├── functions.php        # bootstrap only: requires inc/ modules
├── inc/                 # one concern per file: setup.php, enqueue.php, menus.php, …
├── template-parts/      # get_template_part() partials
├── assets/
│   ├── src/             # source JS/CSS
│   └── dist/            # built assets (enqueued)
└── languages/           # .pot / .po / .mo
```

- `functions.php` contains **only** `require` statements for `inc/` modules — no logic.
- New `inc/` modules appear in Refactor only (see `anti-over-engineering.md`).

## Naming

| Item | Convention |
|------|-----------|
| Functions / hooks | `{theme_slug}_` prefix on every function, hook, handle, option |
| Files | `kebab-case.php`; template parts `template-parts/{slug}/{part}.php` |
| Text domain | One text domain = theme slug, declared in `style.css` |
| Script/style handles | `{theme_slug}-{name}` |

## Allowed libraries

| Need | Use |
|------|-----|
| Queries | `WP_Query`, `get_posts`, core template tags |
| HTTP | `wp_remote_get` / `wp_remote_post` |
| Front-end JS | Vanilla ES2022+ modules |
| Fields | ACF only if ARCHITECTURE allows it |
| Dev tooling | PHPCS (WPCS), PHPStan, Composer dev-deps |

## Forbidden

- Direct DB queries (`$wpdb`) when `WP_Query` or core APIs cover the need
- Hardcoded `<script>` / `<link>` tags — **`wp_enqueue_scripts` only**
- jQuery as a dependency in **new** code — use vanilla JS
- TGMPA-style bundled/required plugins inside the theme
- Plugin-territory functionality (CPTs, shortcodes with business logic) hardwired into the theme — flag it for a plugin instead
- `query_posts()`, `extract()`, `eval()`

## Testing tooling

| Level | Tool | When |
|-------|------|------|
| Unit (pure PHP helpers) | PHPUnit or Pest (+ Brain Monkey for WP functions) | Logic in `inc/` |
| Lint | PHPCS with WPCS ruleset | Every commit |
| Static analysis | PHPStan (wp extensions) | Where configured |
| Manual checklist | `MANUAL-CHECKLIST.md` from TEST-PLAN | Admin screens, visual/template output, responsive |

- WP admin and visual rendering are usually **manual** scenarios in `TEST-PLAN.md` — keep an executable checklist, do not fake-automate them.

## Security

- **Escape on output, every time:** `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()` for rich content. No raw `echo` of dynamic data.
- **Sanitize on input:** `sanitize_text_field()`, `sanitize_email()`, `absint()`, etc., before saving or using request data.
- Nonces (`wp_nonce_field` / `check_admin_referer`) for any theme form handling.
- i18n every user-facing string: `__()`, `_e()`, `esc_html__()` with the theme text domain.
- Never trust `$_GET` / `$_POST` / `$_REQUEST` directly — sanitize first.
- No secrets/API keys committed in theme files; use constants from `wp-config.php` or options.
