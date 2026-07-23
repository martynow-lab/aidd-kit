# Spec validate (AiDD tool)

Validates `.cursor/workspace/active/<feature>/SPEC.md` before `@specify` presents a draft. With no arguments, validates every active feature under `.cursor/workspace/active/`.

## Usage

```bash
npm run spec:validate
npm run spec:validate -- domain-validate-recipe
npm run spec:validate -- .cursor/workspace/active/domain-validate-recipe/SPEC.md
npm run spec:validate -- domain-validate-recipe --json
npm run spec:validate -- domain-validate-recipe --freeze
npm run spec:validate -- domain-validate-recipe --strict
```

| Exit code | Meaning                      |
| --------- | ---------------------------- |
| `0`       | No errors (warnings allowed) |
| `1`       | One or more errors           |
| `2`       | Warnings only                |

## Rules

### Errors (block `@specify` present)

| Rule ID                  | Checks                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `spec-sections`          | Sections 1–7 present                                          |
| `fr-coverage`            | Every `FR-n` referenced by ≥1 `AC-n`                          |
| `ac-fr-refs`             | Every `AC-n` has valid `(FR-n)` refs                          |
| `ac-testable`            | Every `AC-n` uses Given / when / then                         |
| `open-questions`         | No `Q-n` with status `open` when `--freeze`                   |
| `error-message-complete` | Error-code ACs include canonical `message` from table         |
| `error-message-all-fr7`  | Failure ACs for FRs requiring `message` include full messages |
| `multi-error-order`      | Multi-error ACs pin `errors[0]` / `errors[1]` or stable order |
| `eslint-deliverable-ac`  | §6 eslint.config.js GREEN deliverable has matching AC         |
| `pure-module-boundary-ac`| Pure-module SPEC declares import/purity boundaries but no AC does a static boundary scan |

### Warnings

| Rule ID            | Checks                                          |
| ------------------ | ----------------------------------------------- |
| `duplicate-fr-ids` | Duplicate `FR-n` in Requirements                |
| `ec-fr-boundary`   | FR with failure semantics lacks EC boundary row |
| `ac-ec-trace`      | EC row does not reference an `AC-n`             |
| `pure-module-export-ac` | Sole/single-export pure module lacks an export-surface AC (`Object.keys`) |

Use `--strict` to treat warnings as errors.

## ESLint deliverable pattern

When §6 Local Constraints require extending `eslint.config.js`, add an AC that inspects the config file (not only `npm run lint` on a clean module). See `file-persistence` AC-1 for the repo-level pattern.

## Pure-module pattern (`src/domain|state|persist`)

`pure-module-boundary-ac` fires when FRs / Local Constraints reference a `src/domain|state|persist/` path **and** declare import/purity boundaries (e.g. "no DOM", "must not import", "no-restricted-imports", "File System Access"), but no AC verifies it with a static scan. Add a boundary AC (`catalog-state` AC-18 pattern). `pure-module-export-ac` (warning) fires when the SPEC declares a **sole/single** public export but no AC pins it via `Object.keys` (`domain-validate-recipe` AC-20 pattern). Reusable snippets: `.cursor/rules/spec-patterns-by-layer.md`.

## Example output

```text
spec:validate domain-validate-recipe — PASSED (0 errors, 4 warnings)

[W001] ac-ec-trace              EC-4 — EC-4 does not reference an AC-n ...
```
