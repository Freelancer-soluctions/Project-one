# Proposal

## Why

The factorization plan (Fases 0–6) moves the project onto a per-phase model mix and a per-task token budget, but nothing today turns that into an operating procedure: there is no daily budget formula, no mid-day traffic-light decision rule, no weekly token-per-phase review, and no documented baseline-measurement process. Without these, quota consumption is judged by anecdote and the monthly quota runs out before month-end, or paid tokens are spent on tasks that free models could handle. This change captures the operational runbook so quota management becomes a repeatable, measurable routine rather than ad-hoc judgment.

## What Changes

- **Add an operational quota runbook** at `docs/opencode/quota-runbook.md` documenting:
  - **Daily budget formula**: `daily_budget = (monthly_quota × 0.85) / 22 working days`, with the 15% reserve for rework and the note that the most restrictive window (5-hour/weekly/monthly) wins when the plan has multiple windows.
  - **Mid-day traffic light** (evaluated at midday against the daily budget): <50% → continue normal flow; 50–70% → move low-risk tasks (docs, refactors, commits) to free models; >70% → free models only for the rest of the day, heavy implementation deferred to tomorrow.
  - **Weekly review of tokens per phase**, comparing paid tokens per task against the Phase 0 baseline and pruning skills that are not used.
  - **Model re-evaluation triggers**: re-evaluate the reviewer model and the Phase-4 implementation model whenever rates or available models change.
  - **3-day baseline measurement process** using `opencode-quota` (and `opencode stats` where available), recording per-agent tokens across 3 normal workdays with the existing token-recording template.
- **Initial budget allocation guidance**: 70% implementation / 20% review / 10% contingency, marked as a starting point to be calibrated with measured data.

## Capabilities

### New Capabilities

None — this is a docs-only operational runbook with no spec-level behavior changes (`skip_specs: true` in `.openspec.yaml`).

### Modified Capabilities

None — no existing capability's requirements change.

## Impact

- **New files**: `docs/opencode/quota-runbook.md` (and, if useful, a small measurement checklist reusing `docs/opencode/eval/token-recording-template.md`).
- **No affected code, APIs, dependencies, or systems**: documentation only. No CI/CD, hooks, config, or runtime changes.
- **Exit criterion**: runbook committed. The 3-day baseline capture with `opencode-quota` and the weekly review cadence are **deferred operational follow-ups** (3 real workdays required; tracked in runbook §9 calibration log as "pending"). The runbook ships with provisional thresholds that become final only after the baseline is captured.
