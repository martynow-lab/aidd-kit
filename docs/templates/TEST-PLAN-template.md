---
feature: FEATURE_SLUG
status: draft
date: YYYY-MM-DD
spec: SPEC.md

slices:
  - id: s6-01
    order: 1
    testFile: tests/unit/REPLACE_ME.test.js
    scenarios:
      - SC-001
    targetFiles:
      - src/REPLACE_ME.js
    priority:
      SC-001: P0
    doneWhen:
      - SC-001

# Add one entry per §7 row. Copy the pattern above.
# doneWhen: P0 only. scenarios: all priorities.

manualChecklist: []
# Uncomment and fill if manual scenarios exist:
# manualChecklist:
#   - id: MC-001
#     scenarios: [SC-NNN]
#     status: not-implemented

doneCriteria:
  redComplete:
    automatedTestFiles: 0        # update to §7 row count
    manualChecklistStatus: not-implemented
  greenComplete:
    p0Scenarios: []              # flat union of all doneWhen arrays
    manualChecklist: []          # P0 MC-n IDs only
---

# TEST-PLAN — FEATURE_SLUG

| | |
|---|---|
| **Feature** | `FEATURE_SLUG` |
| **Status** | `draft` |
| **Date** | YYYY-MM-DD |
| **SPEC** | [SPEC.md](SPEC.md) |
| **Architecture** | [ARCHITECTURE.md §8](../../../docs/ARCHITECTURE.md#8-testing-standards) |

> Stage 4 output. Verification strategy **before** production scaffold code (Stage 5 RED).
> Every AC from SPEC has ≥1 scenario. **X% negative/failure** (N of M scenarios).

---

## 1. Scope

### In scope

<!-- List SPEC FR/AC refs and what is being verified in this feature -->

### Out of scope for this slice

<!-- Explicit deferrals: other features, non-functional, manual-only items with reason -->

---

## 2. Verification mix

| Category | Count | Share |
|----------|------:|------:|
| **Positive (happy path)** | — | —% |
| **Negative / failure** | — | **—%** |
| **Total scenarios** | — | 100% |

| Priority | Count | Stage 5–6 gate |
|----------|------:|----------------|
| **P0** | — | Must be green before Stage 7 |
| **P1** | — | Desirable in same PR; may defer with SPEC note |
| **P2** | — | — |

| Check type | Automated | Manual |
|------------|----------:|-------:|
| Unit / integration (Vitest) | — | 0 |
| E2E (Playwright) | — | 0 |
| Shell / CLI smoke | — | 0 |
| Manual / QA | 0 | — |

---

## 3. Scenario table

| ID | AC | Description | Category | Type | Priority | Automation |
|----|-----|-------------|----------|------|----------|------------|
| SC-001 | AC-1 | **Given** …, **when** …, **then** … | — | positive/negative | P0 | Unit — `tests/unit/…test.js` |

<!-- Follow Given/When/Then. One row per observable behaviour. -->
<!-- Negative scenarios: permission denied, missing data, invalid input, network error -->

**Negative scenarios (N):** SC-NNN, SC-NNN…

---

## 4. AC traceability matrix

| AC | SPEC requirement | Scenario IDs | Primary automation |
|----|------------------|--------------|-------------------|
| AC-1 | FR-1 — … | SC-001 | `….test.js` |

---

## 5. Manual checklist

<!-- Remove this section entirely if no manual scenarios -->

Plan definition for manual scenarios. Stage 5 RED materializes this table into `MANUAL-CHECKLIST.md` (items marked **not implemented** until Stage 6 GREEN).

| ID | Scenario | Steps | Expected | Maps to |
|----|----------|-------|----------|---------|
| MC-001 | … | … | … | SC-NNN |

---

## 6. Edge cases (SPEC §4)

| EC | Scenario | Covered by | Notes |
|----|----------|------------|-------|
| EC-1 | … | SC-NNN | … |

---

## 7. Stage 5 RED — implementation order

Implement **tests and checklists only** (no production scaffold).
Expected initial state: P0 automated tests **fail** for the correct reason.

| Order | Test file / artifact | Scenarios | Technique |
|------:|----------------------|-----------|-----------|
| 1 | `tests/unit/….test.js` | SC-001 | … |

<!-- Order by dependency: tests with fewer production deps come first -->
<!-- This table must match slices[] in front matter 1:1 -->

**RED commit message:** `test(FEATURE_SLUG): add failing specs per TEST-PLAN`

---

## 8. Done criteria

### Stage 5 RED complete when

- [ ] All P0 automated test files from §7 exist and **fail** for expected reasons
- [ ] `MANUAL-CHECKLIST.md` created from §5 (if manual scenarios exist); items marked **not implemented**
- [ ] Tests-only commit created

### Stage 6 GREEN complete when

- [ ] All **P0** scenarios pass
- [ ] Manual checklist P0 items pass on target environment
- [ ] Every SPEC AC verifiable by behaviour
- [ ] `npm run check` and `npm test` green

### Stage 7 revizor gate

- Traceability matrix (§4) has no gaps: each AC → scenario → test file
- Negative scenarios are not skipped or stubbed to always-pass

---

## 9. Commands reference

| Command | Scenarios |
|---------|-----------|
| `npm test` | — |
| `npm run check` | — |
