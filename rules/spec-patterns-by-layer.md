---
description: Stage 3 reusable SPEC patterns by layer. Front-load recurring invariant ACs for pure modules (src/domain|state|persist) so spec review converges in one pass. Attach to @specify (and @spec-reviewer) chats for any pure-module feature.
alwaysApply: false
---

# SPEC patterns by layer (Stage 3)

Recurring `spec-reviewer` REVISE rounds come from re-discovering the **same**
architectural invariants on every pure module. Those invariants are already
proven in frozen specs (`catalog-state` AC-18, `file-persistence` AC-1/AC-29,
`project-bootstrap` AC-8). This rule carries them forward so `@specify` includes
them in the **first** draft and `@spec-reviewer` finds nothing left to escalate.

**This is a checklist, not a paste-everything mandate.** Include an item only
when it applies to the feature; manufacturing an AC for an invariant the feature
cannot violate is itself a defect (see `anti-over-engineering.md` — no ghost
coverage). When in doubt, read the **nearest archived sibling SPEC of the same
layer** and reuse its pattern.

`spec:validate` enforces the two highest-frequency invariants as objective gates:
`pure-module-boundary-ac` (**error** — declares a boundary but no static-scan AC)
and `pure-module-export-ac` (**warning** — declares a sole export but no
`Object.keys` surface AC). Pass them by writing the ACs below, not by removing
the boundary/export wording from §2/§6.

## When to apply

The feature's deliverable lives under `src/domain/**`, `src/state/**`, or
`src/persist/**` (pure logic — no UI). For UI features, skip this rule.

## Before requesting review — resolve contract decisions

A draft that reaches `@spec-reviewer` with an **open** `Q-n` that defines an
FR/AC contract is an automatic REVISE. Decide these in the SPEC (a default with a
flag for the user is fine) before presenting:

- **Module path / file name** — the exact import path tests and callers use
  (e.g. `src/domain/validate-recipe.js`). If an internal split is allowed, name
  the stable entry point.
- **Return / result shape** — exact success and failure shapes (e.g. success is
  exactly `{ valid: true }` with **no** `errors` key, not `{ valid: true, errors: [] }`).
- **Error codes** — a canonical `{ field, code, message }` table when the result
  carries errors; ACs cite the full canonical `message`.

Leave a `Q-n` `open` only when it does **not** define a contract the TEST-PLAN
needs; otherwise resolve or explicitly `deferred` (owner + reason).

## Pure-module invariant ACs

Adapt IDs, paths, and identifiers. Each AC must keep Given / when / then
(`spec:validate ac-testable`). Italic notes state applicability and the proven
source pattern.

```markdown
- [ ] **AC-x** (FR-purity) — Given `src/<layer>/**/*.js` that compose this module,
  when statically reviewed, then there are no imports from forbidden sibling
  layers (per ARCHITECTURE §2/§3 — e.g. domain ⇏ ui/persist/state; state ⇏
  ui/persist; persist ⇏ state/ui/domain), no `export default`, and no
  browser/I-O identifiers (`document`, `window`, `fetch`, `showOpenFilePicker`,
  `showSaveFilePicker`, `createWritable`, `getFile`, `FileSystemFileHandle`,
  `FileSystemHandle`) — except APIs ARCHITECTURE explicitly allows (e.g.
  `crypto.randomUUID`).
  <!-- catalog-state AC-18 pattern. Scope to ALL files the module may split into,
       not a single named file (closes the multi-file-split escape). -->

- [ ] **AC-y** (FR-purity) — Given `eslint.config.js`, when the
  `no-restricted-imports` override for `src/<layer>/**` is inspected, then it
  forbids the disallowed sibling imports at config level (not only by linting a
  clean module file).
  <!-- file-persistence AC-1 pattern. Include only when §6 requires extending
       eslint.config.js — also satisfies spec:validate eslint-deliverable-ac. -->

- [ ] **AC-z** (FR-export) — Given the module namespace import
  (`import * as m from '<path>'`), when inspected, then
  `Object.keys(m).sort()` equals exactly `[<declared public exports>]`.
  <!-- Proves the declared public surface; closes "extra named export" gaps. -->

- [ ] **AC-w** (FR-ignored-fields) — Given an input where a field declared
  "ignored / out of scope" carries a hostile value (wrong type, null, empty),
  when called, then the outcome is unchanged (e.g. still `{ valid: true }`).
  <!-- One AC per class of ignored field. Prevents the "is it really ignored?"
       round for optional/extra fields (e.g. non-number cookTimeMinutes). -->

- [ ] **AC-v** (FR-no-mutation) — Given a deep-frozen **valid** input and a
  deep-frozen **invalid** input, when called, then the function does not throw
  and each input is deep-equal to a snapshot taken before the call.
  <!-- Include only when the function receives an object/array it could mutate. -->
```

## Edge-case floor for pure modules

At minimum cover, where applicable: `null` / `undefined` input, non-object
input, empty/whitespace values, every "ignored" field with a hostile value, and
repeated/idempotent calls. Reference each EC to an `AC-n`.

## Hand-off note

When the pure-module ACs above are present (or explicitly N/A with reason) and
contract decisions are resolved, the draft is ready for an independent Stage 3.5
review. The user still owns the `spec frozen` decision.
