# Design

## Context

Operational runbook for quota management in the OpenSpec-driven orchestrator workflow. No behavioral or code change: this change ships a single markdown document at `docs/opencode/quota-runbook.md` (plus a reuse of the token-recording template from the sibling `opencode-eval-baseline` change). See `proposal.md` for motivation and scope.

Constraints that shape this design:

- Docs-only: zero edits to workflows, hooks, config, agent prompts, or application code (`skip_specs: true`).
- Must be usable by a single operator mid-journey (mid-day traffic light) without re-reading the whole factorization plan.
- Must be reproducible: a second operator can follow the 3-day baseline process and obtain comparable numbers.
- Depends on existing tooling only: `opencode-quota`, `opencode stats` (where available), and the token-recording template from `opencode-eval-baseline` (`docs/opencode/eval/token-recording-template.md`). No new instrumentation.
- The factorization plan (Fases 0-6) defines the per-phase model mix and the daily budget; this runbook turns those into an operating procedure. It does not redefine them.

## Goals / Non-Goals

**Goals:**

- Define a fixed, sectioned on-disk layout for the runbook so every operator finds the same information in the same place.
- Define the daily budget formula with explicit calculation steps and the "most restrictive window wins" rule.
- Define the mid-day traffic light with concrete bands and actions.
- Define the weekly token-per-phase review checklist and skill-pruning criteria.
- Define model re-evaluation triggers.
- Define a 3-day baseline measurement process with concrete steps, inputs, and exit criteria.
- Define the initial budget allocation (70/20/10) marked as a starting point to be calibrated.

**Non-Goals:**

- No automation: the runbook is a human procedure, not a script or CI job.
- No spec-level requirements (`skip_specs: true`); no capability is added or changed.
- No redefinition of the factorization plan's phases or model mix; the runbook references them.
- No new config, hooks, or workflows.
- No enforcement mechanism: the traffic light is a decision aid, not a gate.

## Decisions

### D1 - Single runbook document, sectioned by cadence

All operational content lives in one file: `docs/opencode/quota-runbook.md`. Sections are ordered by cadence (daily -> mid-day -> weekly -> on-change -> baseline), so an operator opening the file during the day lands on the relevant section first.

    docs/opencode/quota-runbook.md
    ├── 0. Prerequisites            (access to opencode-quota, template, script, rubric, hooks)
    ├── 1. Purpose & scope          (what this is, what it isn't, links)
    ├── 2. Key terms & windows      (monthly quota, 5h/weekly/monthly windows, working days)
    ├── 3. Daily budget             (formula + calculation steps + example)
    ├── 4. Mid-day traffic light    (bands + actions)
    ├── 5. Budget allocation        (70/20/10 starting point)
    ├── 6. Weekly review            (checklist + token-per-phase table)
    ├── 7. Skill pruning criteria   (when to remove a skill)
    ├── 8. Model re-evaluation      (triggers + procedure)
    ├── 9. 3-day baseline process   (steps + inputs + exit criteria)
    ├── 10. Cadence & ownership     (who does what, when)
    ├── 11. Rollback                (how to revert thresholds)
    ├── 12. Quick reference card    (one-page cheat sheet)
    └── Appends A/B                (templates)

Rationale: one file keeps the runbook discoverable and diffable; cadence-ordered sections minimize lookup time during a workday. Alternatives: split into per-cadence files (rejected - fragments the routine and risks drift), or embed in the factorization plan PRD (rejected - PRDs are planning artifacts, not operating procedures).

### D2 - Daily budget formula with "most restrictive window wins"

Formula (from the factorization plan, restated as the operative rule):

    daily_budget = (monthly_quota x 0.85) / 22 working days

- `monthly_quota`: the plan's monthly token allowance (paid tokens).
- `0.85`: leaves a 15% reserve for rework/retries.
- `22`: working days per month (Mon-Fri).
- When the plan exposes multiple windows (5-hour, weekly, monthly), the daily budget is further capped by the most restrictive window: compute the per-day equivalent of each window and take the minimum. The monthly formula is the default only when no shorter window is more restrictive.

Calculation steps (documented as a numbered procedure):

1. Read the monthly allowance from the plan (`opencode-quota` or plan docs).
2. If multiple windows exist, compute each window's daily equivalent and take the minimum.
3. Apply the 0.85 reserve.
4. Divide by 22 working days.
5. Record the resulting `daily_budget` (in tokens) and the date it was computed.
6. Re-compute whenever the plan or rates change.

Rationale: stating the procedure, not just the formula, makes the number reproducible. Alternatives: a spreadsheet (rejected - not version-controlled), a script (rejected - out of scope; runbook is docs-only).

### D3 - Traffic light bands and actions

Evaluated at midday against the daily budget (tokens consumed so far today / daily_budget):

| Band   | Consumption | Action                                                                                                                             |
| ------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Green  | < 50%       | Continue normal flow (phase-appropriate models).                                                                                   |
| Yellow | 50-70%      | Move low-risk tasks (docs, refactors, commits) to free models; keep implementation on the paid model only if on the critical path. |
| Red    | > 70%       | Free models only for the rest of the day; defer heavy implementation to tomorrow; record the deferral in `tasks.md`.               |

Measurement source: `opencode-quota` (primary) and `opencode stats` (secondary, where available). If the two disagree, use the higher consumption figure (conservative). Note that free models have their own limits and are not an infinite cushion.

Rationale: three bands keep the decision binary-ish and actionable; the midday timing catches drift before it becomes a month-end shortfall. Alternatives: hourly checks (rejected - too noisy), end-of-day only (rejected - too late to correct).

### D4 - Budget allocation (starting point)

Initial split of the daily budget, to be calibrated with measured data:

- 70% implementation (Phase 4 model)
- 20% review (reviewer model)
- 10% contingency (rework, retries, unexpected)

Marked explicitly as a starting point. Calibration rule: after the 3-day baseline, compare actual per-phase spend to the split; if a phase consistently exceeds its share by >20%, adjust the split and record the new values and date in the runbook's "calibration log" subsection.

### D5 - Weekly review checklist

Run once per week (recommended: Friday end-of-day or Monday start). Checklist:

1. Pull the week's token log (`docs/opencode/eval/runs/tokens/` or wherever the operator stores it).
2. Compute tokens per phase (grill-me/spec/review/implement/verify/commit/trello) and per agent.
3. Compare paid tokens per task against the Phase 0 baseline; flag any task whose paid tokens rose >10%.
4. Compare actual phase split to the 70/20/10 allocation; note drift.
5. Review skill usage: list skills loaded this week and their load count.
6. Apply skill-pruning criteria (D6).
7. Check model re-evaluation triggers (D7); if any fired, schedule re-evaluation.
8. Record findings in a short "weekly review" note (date, numbers, actions taken, next week's focus).
9. Update the calibration log if the budget split changed.

Rationale: a checklist (not a narrative) keeps the review fast and repeatable. Alternatives: a script (rejected - docs-only scope).

### D6 - Skill pruning criteria

A skill is a pruning candidate when any of the following holds (measured over the weekly review window):

- Loaded 0 times in the last 2 consecutive weeks.
- Loaded but produced no observable change in output quality (reviewer verdict unchanged, no finding attributed to it).
- Duplicates content already covered by another skill or by CI/Husky (e.g., lint/format checks).
- Its load cost (tokens) exceeds its benefit (no task in the eval set requires it).

Pruning procedure: mark the skill as "candidate" in the weekly review note, remove from the skill registry in a separate commit (one skill per commit, reversible), re-run the eval for the affected tasks, and keep the removal only if the eval does not regress.

Rationale: conservative (2 weeks, eval-gated) to avoid removing a skill that is rarely but critically used. Alternatives: immediate removal (rejected - too risky).

### D7 - Model re-evaluation triggers

Re-evaluate the reviewer model and the Phase-4 implementation model when any of:

- Plan rates or available models change (new model released, price change, deprecation).
- A model's eval pass rate drops below the baseline for 2 consecutive weeks.
- Paid tokens per task rise >20% vs baseline without a corresponding scope increase.
- A free model becomes capable enough to pass the Phase-4 eval (cost opportunity).
- Quarterly, regardless of triggers (calendar-based sanity check).

Procedure: re-run the relevant eval tasks with the candidate model, compare quality score and tokens per approved task, and switch only if quality is equal or better AND cost per approved task is lower. Record the decision and date.

### D8 - 3-day baseline measurement process

Purpose: capture a real consumption baseline before fixing thresholds (traffic light, allocation) or choosing models.

Inputs: `opencode-quota` (primary), `opencode stats` (secondary where available), the token-recording template from `opencode-eval-baseline`, and the eval task set.

Steps:

1. **Prep (day 0):** confirm `opencode-quota` works and note the monthly allowance and window structure; create the token log file for day 1 using the template schema; ensure git signing and hooks are active (so measured work is representative).
2. **Day 1-3:** run 3 normal workdays. For each, record per agent, per phase, per task: input/output/total tokens and source. Use the recording template columns: `date, agent, phase, task_id, run_id, input_tokens, output_tokens, total_tokens, source, notes`.
3. **Daily (each day):** at midday, compute consumption / daily_budget as a dry run of the traffic light and note the band; do not change behavior yet (baseline capture only).
4. **End of day 3:** aggregate tokens per phase and per agent; compute mean and range across the 3 days; compare to the 70/20/10 split.
5. **Calibrate:** set the traffic-light thresholds and budget split from the measured data if the measured split differs from 70/20/10 by >20% in any phase; record the calibrated values and date in the calibration log.
6. **Exit criteria:** 3 consecutive workdays recorded; per-agent and per-phase totals computed; thresholds and split calibrated or explicitly confirmed as-is; results saved (token log + a short baseline summary note).

Rationale: 3 days is the minimum to see variance; using the existing template keeps the baseline comparable with the eval baseline change. Alternatives: 1 day (rejected - no variance), 1 week (rejected - delays the runbook's usefulness).

### D9 - Reuse of the token-recording template

The runbook does not redefine the token schema; it references `docs/opencode/eval/token-recording-template.md` (from `opencode-eval-baseline`). If that file is not yet present, the runbook includes the column list inline as a fallback and notes the dependency. This keeps the two changes consistent and avoids schema drift.

## Risks / Trade-offs

- [Operator forgets midday check] -> quick-reference card at the end of the runbook; the traffic light is a habit, not a gate. Mitigation: pin the card or add a calendar reminder.
- [Quota source inconsistency (quota vs stats)] -> use the higher figure (conservative); `source` column is mandatory.
- [Thresholds set before baseline] -> traffic light and allocation are explicitly marked as starting points; calibration step (D8) is required before treating them as final.
- [Free models mistaken for infinite cushion] -> runbook states free models have their own limits.
- [Runbook drifts from factorization plan] -> runbook references the plan and does not redefine phases/models; changes to the plan should trigger a runbook review.
- [Baseline never captured] -> exit criterion requires it; weekly review cannot be calibrated without it.

## Migration Plan

Not applicable - docs-only, no deployment. Rollback = revert the commit adding `docs/opencode/quota-runbook.md`. No data migration. The runbook has no runtime consumers.

## Open Questions

None blocking. Deferrable:

- Whether to add a tiny helper script to compute the daily budget from plan inputs (would mirror `scripts/eval/record-tokens.mjs`); deferred to avoid scope creep and because the formula is simple. If added later, it belongs in `scripts/opencode/` or `scripts/eval/`.
- Whether the weekly review note lives in the runbook (appendix) or in a separate `docs/opencode/reviews/` directory; deferred until the first review is run.
