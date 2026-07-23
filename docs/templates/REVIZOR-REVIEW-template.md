# REVIZOR-REVIEW — FEATURE_SLUG

| | |
|---|---|
| **Feature** | `FEATURE_SLUG` |
| **SPEC** | `.cursor/workspace/active/FEATURE_SLUG/SPEC.md` |
| **TEST-PLAN** | `.cursor/workspace/active/FEATURE_SLUG/TEST-PLAN.md` |
| **Date** | YYYY-MM-DD |
| **Reviewer** | revizor (Stage 7) |
| **Verdict** | PASS or REFACTOR |

> Latest Stage 7 round only — overwrite on each review. Commit between rounds if prior REFACTOR must stay in git (`docs(FEATURE_SLUG): REVIZOR …`).

---

### 1. Findings table

| # | Area | File:lines | Reproduction / failing condition | Violated rule or spec item |
|---|------|-----------|----------------------------------|---------------------------|

### 2. Traceability matrix

| AC | TEST-PLAN scenario | Test file / case | Status |
|----|--------------------|------------------|--------|

### 2b. Regression / full suite

| Gate | Command | Result | Evidence |
|------|---------|--------|----------|
| Full unit suite | `npm test` | pass / fail | |
| Check (format/lint/types) | `npm run check` | pass / fail | |
| Sibling supersedence | TEST-PLAN §1.1 files (if any) | updated / N/A / gap | |

- [ ] Full `npm test` green (feature-only Vitest is **not** enough for PASS)
- [ ] `npm run check` green
- [ ] Sibling files from TEST-PLAN §1.1 updated in this PR (or N/A — no supersedence)

### 3. Plain-language summary

…

### 4. Verdict

**PASS** or **REFACTOR**

*(On REFACTOR: numbered fix list for a new Stage 6 chat.)*

---

## Manual acceptance gate

A revizor **PASS does not replace the manual acceptance gate**. Before Stage 8, the user must personally walk through every AC in SPEC by using the feature. Confirm this report already recorded full-suite green before unlocking Stage 8.
