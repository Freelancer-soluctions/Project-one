# Tasks: quota-budget-runbook

## 1. Runbook document

- [x] 1.1 Create `docs/opencode/quota-runbook.md` with the title block, purpose & audience, prerequisites, and references sections; verify the file exists and renders as valid markdown
- [x] 1.2 Add the "Daily budget" section with the formula `daily_budget = (monthly_quota x 0.85) / 22`, the calculation steps, the multi-window "most restrictive wins" rule, and a worked example; verify the formula and steps are present and unambiguous
- [x] 1.3 Add the "Mid-day traffic light" section with the Green/Yellow/Red bands, their consumption thresholds, and the action for each band; verify each band has a concrete action
- [x] 1.4 Add the "Initial budget allocation" section with the 70/20/10 split and the calibration note; verify the percentages sum to 100%
- [x] 1.5 Add the "Weekly review" section with the checklist and the evidence location; verify all checklist items are present
- [x] 1.6 Add the "Skill pruning" section with the criteria and the removal procedure; verify the criteria are measurable
- [x] 1.7 Add the "Model re-evaluation" section with the triggers and the evaluation procedure; verify the triggers are enumerated
- [x] 1.8 Add the "3-day baseline measurement" section with prep, day 1-3, daily, end-of-day-3, calibrate, and exit-criteria steps; verify the exit criteria are explicit
- [x] 1.9 Add the "Cadence & ownership", "Rollback", and the two appendices (glossary, references); verify the document is self-contained

## 2. Verification

- [x] 2.1 Dry-read the runbook as a second operator and confirm the daily budget can be computed from the document alone; verify no external PRD is required
- [x] 2.2 Confirm all formulas and thresholds are documented and the traffic light bands are actionable mid-day; verify by walking through a sample day
- Omitted 2.3 — Confirm the weekly review checklist fits in under 15 minutes by timing a dry run. Reason: a human timing test; the checklist itself is documented and complete.
- [x] 2.4 Confirm the runbook references the token-recording template path and notes the dependency if absent; verify the path is correct
