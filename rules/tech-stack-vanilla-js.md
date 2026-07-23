---
description: Stack rule for Vanilla JS (ES2022+, Vite) projects — no frameworks, native APIs first. Attach in Stage 1 (Architecture) and Stage 6 (GREEN).
alwaysApply: false
---

# Tech Stack — Vanilla JS

## Stack & runtime

| Item | Value |
|------|-------|
| Language | JavaScript ES2022+ (modules only, no CommonJS in source) |
| Build | Vite (dev server + production build) |
| Frameworks | **None** — native DOM, no virtual DOM layers |
| Target | Evergreen browsers (per ARCHITECTURE "Technical constraints") |
| Package manager | npm (lockfile committed) |

## Directory structure

```text
src/
├── main.js            # entry point, wired in index.html
├── modules/           # one feature = one module (created in Refactor only)
├── styles/            # CSS (plain or PostCSS via Vite)
└── assets/            # static images/fonts
tests/
├── unit/              # Vitest specs: <module>.test.js
└── e2e/               # Playwright specs: <flow>.spec.js
```

- New folders/modules appear only in Refactor (see `anti-over-engineering.md`).

## Naming

| Item | Convention |
|------|-----------|
| Files | `kebab-case.js` |
| Functions / variables | `camelCase`, verbs for functions (`renderList`, `fetchUsers`) |
| Constants | `UPPER_SNAKE_CASE` only for true module-level constants |
| Exports | **Named exports only** — no `export default` |
| DOM hooks | `data-js="*"` attributes for JS selectors; classes are for CSS only |

## Allowed libraries

| Need | Use |
|------|-----|
| DOM, events, storage | Native APIs (`querySelector`, `addEventListener`, `localStorage`) |
| HTTP | Native `fetch` with `async/await` |
| Dates | Native `Intl` / `Date`; `date-fns` only if ARCHITECTURE allows it |
| Build/lint | Vite, ESLint, Prettier |
| Tests | Vitest, Playwright, `@testing-library/dom` (optional) |

## Forbidden

- jQuery — native DOM covers everything
- lodash / underscore — use natives (`Array.prototype.*`, `structuredClone`, optional chaining)
- React, Vue, Svelte, Alpine, or any UI framework — this is a no-framework stack
- `axios` — native `fetch` suffices
- Polyfills for APIs already supported by the project's browser targets
- `.then()` chains where `async/await` works

## Testing tooling

| Level | Tool | Command |
|-------|------|---------|
| Unit / integration | Vitest | `npm test` / `npx vitest run` |
| E2E | Playwright | `npx playwright test` |
| Lint / format | ESLint + Prettier | `npm run lint` / `npm run format` |

- Unit tests live next to the scenario IDs from `TEST-PLAN.md` (reference IDs in test names or comments).
- Test behavior through the public surface (DOM output, return values) — not internals.
- **jsdom bootstrap:** if `main.js` wires click handlers with fire-and-forget `async` work, export a narrow test await hook (e.g. `whenLinkActionDone()`) so tests can flush DOM updates before assertions — do not rely on `setTimeout` guesses.
- **Shell hide / control absence:** when SPEC or TEST-PLAN requires the link shell or `data-js` controls to be absent (`querySelector` → `null`), removing the shell container is not enough if children are reparented elsewhere — set `hidden` on moved nodes or `remove()` them; otherwise happy-path tests can pass while controls remain queryable.

## Security

- **Never** assign untrusted data to `innerHTML` / `insertAdjacentHTML` — use `textContent`, `createElement`, or sanitize explicitly.
- Be CSP-aware: no inline event handlers (`onclick="..."`), no `eval` / `new Function`.
- Validate and encode anything interpolated into URLs (`encodeURIComponent`).
- Secrets never ship to the client; config via Vite `import.meta.env.VITE_*` only for non-sensitive values.
- External links opened via JS: `rel="noopener noreferrer"`.
