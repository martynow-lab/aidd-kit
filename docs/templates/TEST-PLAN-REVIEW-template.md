# TEST-PLAN-REVIEW — FEATURE_SLUG

| | |
|---|---|
| **Feature** | `FEATURE_SLUG` |
| **TEST-PLAN** | `.cursor/workspace/active/FEATURE_SLUG/TEST-PLAN.md` |
| **SPEC** | `.cursor/workspace/active/FEATURE_SLUG/SPEC.md` |
| **Date** | YYYY-MM-DD |
| **Reviewer** | test-plan-reviewer (Stage 4.5) |
| **Verdict** | APPROVE or REVISE |

> Latest Stage 4.5 round only — overwrite on each review. Commit between rounds if prior REVISE must stay in git.

---

### §1 Findings table

| # | Area | TEST-PLAN ref | Failure scenario if RED/GREEN proceeds as-is | Violated contract |
|---|------|---------------|----------------------------------------------|-------------------|

### §2 Traceability matrix

| AC | Scenario(s) | Planned automation | Status |
|----|-------------|-------------------|--------|

### §3 Verification mix summary

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total scenarios | … | — | — |
| Negative / failure | … (…%) | ≥40% | pass / **fail** |
| P0 scenarios | … | all ACs covered at P0 or justified deferral | pass / **fail** |

### §4 Plain-language summary

…

### §5 Verdict

**APPROVE** or **REVISE**

### §6 Fix list *(REVISE only)*

1. …

### §7 Approval gate reminder

**APPROVE does not freeze.** Outside conductor, only the user freezes
(`test plan frozen`) before RED. Under `/conductor`, the conductor auto-freezes
after APPROVE — reviewers still must not edit Status.

If the parent is **conductor**, do not instruct a new chat — return the verdict
only; conductor continues the pipeline.

