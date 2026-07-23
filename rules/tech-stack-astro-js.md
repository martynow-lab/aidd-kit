---
description: Stack rule for Astro projects — islands architecture, minimal client JS, content collections. Attach in Stage 1 (Architecture) and Stage 6 (GREEN).
alwaysApply: false
---

# Tech Stack — Astro

## Stack & runtime

| Item | Value |
|------|-------|
| Framework | Astro (latest stable) |
| Language | TypeScript preferred (`.ts`, `.astro` with typed frontmatter); plain JS only if ARCHITECTURE says so |
| Rendering | Static-first; SSR only when ARCHITECTURE requires it |
| Client JS | Islands only — zero JS by default |
| Package manager | npm (lockfile committed) |

## Directory structure

```text
src/
├── pages/             # file-based routing (.astro, .md)
├── layouts/           # shared page shells
├── components/        # .astro components; islands live here too
├── content/           # content collections + config.ts schemas
├── lib/               # pure TS helpers (created in Refactor only)
└── styles/            # global CSS; prefer scoped styles in components
tests/
├── unit/              # Vitest: <module>.test.ts
└── e2e/               # Playwright: <flow>.spec.ts
```

## Naming

| Item | Convention |
|------|-----------|
| Components | `PascalCase.astro` |
| Pages / content | `kebab-case` |
| TS modules | `kebab-case.ts`, `camelCase` symbols |
| Exports | **Named exports only** in `.ts` modules |
| Collections | Singular schema, plural folder (`src/content/posts/`) |

## Allowed libraries

| Need | Use |
|------|-----|
| Structured content | Astro content collections (`astro:content`) with zod schemas |
| Images | `astro:assets` (`<Image />`) |
| HTTP (build/SSR) | Native `fetch` with `async/await` |
| Styling | Scoped component styles; Tailwind only if ARCHITECTURE allows |
| Tests | Vitest, Playwright, Astro Container API for component tests |

## Forbidden

- Heavy client-side state libraries (Redux, MobX, Zustand, TanStack Query) — islands should own local state; `nanostores` only if ARCHITECTURE allows
- React/Vue/Svelte islands **unless justified in ARCHITECTURE** — default to plain `.astro` + small vanilla scripts
- `client:load` / `client:only` sprinkled "just in case" — every `client:*` directive must be justified by interactive behavior in SPEC; prefer `client:visible` / `client:idle`
- jQuery, lodash, axios — natives cover these
- Markdown/content parsing libraries when content collections already handle it

## Testing tooling

| Level | Tool | Command |
|-------|------|---------|
| Unit (helpers, schemas) | Vitest | `npm test` / `npx vitest run` |
| Component | Vitest + Astro Container API | `npx vitest run` |
| E2E | Playwright against `astro preview` | `npx playwright test` |
| Lint / format | ESLint (+ astro plugin) + Prettier | `npm run lint` |
| Types | `astro check` | `npx astro check` |

- Map tests to scenario IDs from `TEST-PLAN.md`.
- E2E covers rendered pages and island hydration — assert visible behavior, not implementation.

## Security

- Env vars only via `import.meta.env`; secrets must **not** carry the `PUBLIC_` prefix and must never appear in client-side code or islands.
- No untrusted data through `set:html` — escape by default (Astro does), sanitize explicitly when raw HTML is unavoidable.
- Validate external/CMS data with zod schemas at the collection or fetch boundary.
- SSR endpoints (`src/pages/**/*.ts`): validate input, return correct status codes, never echo secrets in errors.
- No inline `eval`-style code; keep CSP-compatible output.
