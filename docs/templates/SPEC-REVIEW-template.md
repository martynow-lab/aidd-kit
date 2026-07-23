# SPEC-REVIEW — FEATURE_SLUG

| | |
|---|---|
| **Feature** | `FEATURE_SLUG` |
| **SPEC** | `.cursor/workspace/active/FEATURE_SLUG/SPEC.md` |
| **Date** | YYYY-MM-DD |
| **Reviewer** | spec-reviewer (Stage 3.5) |
| **Verdict** | APPROVE or REVISE |
| **Linter** | `npm run spec:validate -- FEATURE_SLUG` → … |

> Latest Stage 3.5 round only — overwrite on each review. Commit between rounds if prior REVISE must stay in git.

---

### §1 Findings table

| # | Area | SPEC ref | Failure scenario if built as-is | Violated contract |
|---|------|----------|--------------------------------|-------------------|

### §2 Coverage matrix

| FR | AC(s) | Edge case(s) | Status |
|----|-------|--------------|--------|

### §3 Plain-language summary

…

### §4 Verdict

**APPROVE** or **REVISE**

### §5 Fix list *(REVISE only)*

1. …

### §6 Freeze gate reminder

**APPROVE does not freeze.** Outside conductor, only the user freezes (`spec frozen`).
Under `/conductor`, the conductor auto-freezes after APPROVE (and after
`spec:validate --freeze`) — reviewers still must not edit Status.

If the parent is **conductor**, do not instruct a new chat — return the verdict
only; conductor continues the pipeline.

