---
description: RED/GREEN discipline for Stage 5–6 — strict TDD order, YAGNI in GREEN, structure only in Refactor. Attach to every RED and GREEN chat.
alwaysApply: false
---

# Anti-Over-Engineering (TDD)

Global baseline for feature work: strict RED (Stage 5) → GREEN (Stage 6) → Refactor (end of Stage 6 after green, or a separate short chat with the same tests — per WORKFLOW). YAGNI in GREEN, structure only in Refactor.

The verification contract is `.cursor/workspace/active/<feature>/TEST-PLAN.md`. For commands, globs, and stack-specific APIs follow the matching `tech-stack-*.md` rule in `.cursor/rules/` (e.g. `tech-stack-vanilla-js.md`, `tech-stack-astro-js.md`, `tech-stack-wp-classic-theme.md`, `tech-stack-wp-plugin.md`). **This rule wins during GREEN (Stage 6)** when guidance conflicts.

## A. Non-negotiable order

- No production changes for **new behavior** until RED (Stage 5) is verified (fail for the **expected** reason).
- One failing test → one GREEN change set. No "while I'm here" files.
- Forbidden: implementing the **next** test's code during GREEN for the **current** test.

## B. Strict YAGNI and KISS (GREEN, Stage 6)

Banned unless the **current failing test assertion** requires it:

- Interfaces or abstract types used only for "flexibility"
- Generic factories, strategy/registry/plugin patterns
- Dependency injection containers or constructor injection for untested collaborators
- Config objects, constants files, or env wrappers for a single call site
- New folders, barrel `index.ts`, or shared `utils/` / `helpers/` under production source trees

**Allowed in GREEN:** inline logic, duplication, hardcoded literals, `if` chains, direct DOM/API calls — if that is the shortest path to green.

**Refactor phase only:** extract function, **new production file**, introduce types/interfaces, dedupe, rename — Rule of Three: only when **three or more tests** or **three or more call sites** share the same duplication (not two).

**No new production files in GREEN.** All GREEN code goes into the **existing module under test** (the file the failing test imports or exercises). Creating `utils.ts`, `services/`, or splitting "because it doesn't fit" is **Refactor** after green tests exist.

## C. Bare-minimum GREEN checklist

Before saving production code:

1. Does every new production line trace to a failing assertion?
2. Could any new symbol be deleted without breaking the new test? If yes, delete it.
3. Is there any code path not executed by the new test? Remove it (no ghost code).
4. Am I optimizing or "cleaning up" before Refactor? Revert that.
5. Did I add or import a package not already in `package.json` / `composer.json`? If yes, revert unless the user explicitly approved or the current failing test proves it essential (see §H).

## D. No ghost code

- No unused exports, private helpers, TODO stubs, or "will need soon" utilities.
- No error-handling branches unless the **current** test asserts that branch.
- **Side-effect sync helpers** (clamp, invalidate, recompute): call only from mutation paths where the helper's precondition can actually change. Example: do not call `clampCookStepIndex()` from `addRecipe` — adding a recipe cannot shrink the selected recipe's step count.
- Test helpers: only in shared test helper dirs when **≥3 test files** would duplicate the same setup (Rule of Three — do not extract on the second test alone).

## E. Code metrics — Refactor-phase targets only

**GREEN exception:** Metrics are **not** GREEN constraints. In GREEN, a **50-line hardcoded function** in a single file is acceptable if it is the shortest path to pass the test. Do **not** split functions early to satisfy line limits — that is Refactor work.

Apply **only in Refactor** (or when touching code already green):

| Metric | Refactor target |
| ------ | ---------------- |
| Function body (excluding blank/comments) | ≤ 25 lines |
| Nesting depth (`if` / `for` / `try`) | ≤ 3 levels |
| Parameters per function | ≤ 4 |
| Responsibilities | One outward behavior per function; split when Refactor metrics are exceeded |

## F. Refactor vs optimization

- **Refactor:** structure/readability with identical behavior (tests unchanged).
- **Forbidden in Refactor without a new failing test:** performance tuning, caching, memoization, algorithm swap.

## G. Conflict resolution

If project stack or architecture rules suggest layering, **this rule wins during GREEN (Stage 6)**; apply layering in Refactor when tests prove need.

## H. Minimal dependencies

Default stack is lean: use what the project already has. Treat every new dependency as guilty until a failing test proves otherwise.

**Order of preference (try top first):**

1. Language/platform built-ins and APIs already allowed by the project's `tech-stack-*.md` rule and ARCHITECTURE
2. **Same file:** duplicate or inline a few lines in the module under test — do **not** copy patterns across production files in GREEN (cross-file reuse = Refactor trigger)
3. **Already in manifest** (`package.json`, `composer.json`, etc.): use existing deps in a new test or module context — **no extra approval**
4. **New** devDependency — only for test/build/lint infrastructure the failing test needs and nothing in the manifest covers
5. New **production** dependency — last resort

**GREEN phase — banned without explicit user approval:**

- Installing packages because a test "might" need them later
- Utility libraries for one call site when native code or 5–10 lines suffice
- Polyfills or legacy shims unless the **current** test documents an unsupported API on the project's target
- App code importing packages only meant for tests

**When a new dependency is allowed:**

- A **failing test** cannot be satisfied reasonably with built-ins and existing deps
- State package name, why built-ins failed, and that no smaller in-repo solution exists
- Prefer packages already in the manifest before adding another name

**Refactor phase:** do not add dependencies to "clean up" code; removing unused deps is encouraged without a new test.

## I. Escape hatch — test scoped too large

If GREEN "requires" infrastructure that violates this rule (storage wrapper, DI, new file, new package) **before any green test exists**, the **RED test is too big** — do not bend the rules.

1. **Split RED:** smaller failing tests, each demanding one slice of behavior (update `TEST-PLAN.md` scenarios if scope changes).
2. **GREEN each slice** in the module under test with the dumbest code that passes.
3. **Refactor** toward shared infrastructure only when **three+** tests or call sites justify extraction.

Legitimate complexity still flows RED → GREEN → Refactor; this hatch fixes **test design**, not permission to skip GREEN minimalism.
