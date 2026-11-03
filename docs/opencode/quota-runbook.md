# Quota Runbook — OpenCode Per-Phase Budget

Operating procedure for keeping OpenCode quota consumption predictable across a
month: what the daily budget is, how to decide mid-day whether to keep spending
paid tokens, what to review weekly, when to prune a skill, when to re-evaluate a
model, and how to capture a real baseline before the thresholds are treated as
final.

It is a decision aid, **not a gate**: nothing here blocks a tool call. The only
enforcement layers are the repository's own (permissions, guardrails, hooks, CI).

## 1. Purpose & scope

**In scope:** paid-token consumption of the OpenCode agent workflow —
orchestrator/subagents, per phase (`grill-me`, `spec`, `review`, `implement`,
`verify`, `commit`, `trello`).

**Out of scope:** provider billing disputes, free-tier limits of individual
models, CI runner minutes, storage.

**Use it when** you start a workday, when you are unsure at midday whether to
keep using a paid model, or when you are about to change a model or a skill.

## 2. Key terms & windows

| Term               | Meaning                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `monthly_quota`    | Paid token allowance for the billing month, read from the plan or `opencode-quota`.                 |
| 5-hour window      | Short rolling window some plans impose; its remaining allowance caps the rest of that window.       |
| Weekly window      | Rolling 7-day allowance, when the plan exposes one.                                                 |
| Working day        | Monday-Friday. **22** is the divisor used by the formula; holidays are absorbed by the 15% reserve. |
| `daily_budget`     | Tokens you may spend on paid models today, computed in §3.                                          |
| Consumption        | Tokens spent today ÷ `daily_budget`, evaluated at midday in §4.                                     |
| Phase              | One of `grill-me`, `spec`, `review`, `implement`, `verify`, `commit`, `trello`.                     |
| Paid vs free model | `opencode-go/beam-free` and `*/mimo-*-free` are free; anything billed per token is paid.            |

**Most restrictive window wins:** when the plan exposes several windows, today's
allowance is the **minimum** of their per-day equivalents, never the monthly
formula alone.

## 3. Daily budget

```
daily_budget = (monthly_quota × 0.85) / 22
```

The `0.85` keeps a **15% reserve** for rework, retries and re-runs. The `22` is
working days per month.

### Calculation steps

1. Read `monthly_quota` from the plan or `opencode-quota`.
2. If the plan exposes 5-hour and/or weekly windows, compute each window's daily
   equivalent:
   - weekly: `weekly_quota / 5` (five working days),
   - 5-hour: `window_quota × (working hours per day / 5)`; if you work one
     5-hour block per day, the window quota **is** the daily equivalent.
3. Apply the 0.85 reserve to the monthly figure.
4. Divide by 22.
5. Take the **minimum** of step 3's result and the window equivalents from
   step 2.
6. Record `daily_budget`, the date, and the inputs used in the calibration log
   (§5). Re-compute whenever the plan, rates or model mix change.

### Worked example

Inputs: `monthly_quota = 1,000,000` tokens; weekly window `250,000`; 5-hour
window `120,000`; one 5-hour block per day.

| Step                            | Value      |
| ------------------------------- | ---------- |
| Monthly with reserve            | 850,000    |
| ÷ 22 working days               | **38,636** |
| Weekly equivalent (250,000 ÷ 5) | 50,000     |
| 5-hour equivalent               | 120,000    |
| Minimum                         | **38,636** |

`daily_budget = 38,636` tokens. At midday, 19,318 tokens consumed is 50%.

## 4. Mid-day traffic light

Evaluate at **midday**: `consumption = tokens_spent_today / daily_budget`.

| Band       | Consumption | Action                                                                                                                                          |
| ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Green**  | `< 50%`     | Continue the normal flow with the phase-appropriate model.                                                                                      |
| **Yellow** | `50–70%`    | Move low-risk work (docs, refactors, commits, Trello) to free models; keep implementation on the paid model only if it is on the critical path. |
| **Red**    | `> 70%`     | Free models only for the rest of the day; defer heavy implementation to tomorrow and record the deferral in the active `tasks.md`.              |

**Measurement source:** `opencode-quota` is primary, `opencode stats` secondary.
If they disagree, use the **higher** consumption figure. Free models have their
own rate limits and are not an infinite cushion.

**Sample day:** `daily_budget = 38,636`; by 13:00 you have spent 21,000 tokens
(54%) → **Yellow**: finish the review in progress on the paid reviewer, move the
remaining docs/commit/Trello phases to a free model.

## 5. Budget allocation

Starting split of `daily_budget` — a **starting point**, not a measured fact:

| Share | Phase                                    |
| ----- | ---------------------------------------- |
| 70%   | implementation (Phase 4 model)           |
| 20%   | review (reviewer model)                  |
| 10%   | contingency (rework, retries, surprises) |

**Calibration rule:** after the 3-day baseline (§9), compare actual per-phase
spend to this split. If any phase consistently exceeds its share by **> 20%**,
change the split and log it:

| Date      | Phase | Old share | New share | Evidence                    |
| --------- | ----- | --------- | --------- | --------------------------- |
| _pending_ | —     | —         | —         | 3-day baseline not captured |

## 6. Weekly review

Run once a week (Friday end-of-day or Monday start). Checklist:

1. Pull the week's token log: `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl`
   (committed). Raw run evidence lives in `docs/opencode/eval/runs/`, which is
   gitignored — do not look for token rows there.
2. Compute tokens per phase and per agent from the JSONL rows.
3. Compare paid tokens per task against the Phase 0 baseline; flag any task whose
   paid tokens rose **> 10%**.
4. Compare the actual phase split to the 70/20/10 allocation; note the drift.
5. List the skills loaded this week and their load counts.
6. Apply the pruning criteria in §7.
7. Check the re-evaluation triggers in §8; schedule any that fired.
8. Write a short review note: date, numbers, actions taken, next week's focus.
9. Update the calibration log in §5 if the split changed.

Token-per-phase table to fill in:

| Phase     | Week tokens | Share | vs 70/20/10 |
| --------- | ----------- | ----- | ----------- |
| grill-me  |             |       |             |
| spec      |             |       |             |
| review    |             |       |             |
| implement |             |       |             |
| verify    |             |       |             |
| commit    |             |       |             |
| trello    |             |       |             |

## 7. Skill pruning

A skill is a **candidate** when any of these holds over the review window:

- loaded **0 times** in two consecutive weeks;
- loaded but produced no observable change in output quality (same verdict, no
  finding attributable to it);
- duplicates content already covered by another skill or by CI/Husky (lint,
  format, type checks);
- its load cost exceeds its benefit — no eval task requires it.

**Procedure:** mark it a candidate in the review note → remove it from the skill
registry in its **own commit** (one skill per commit, reversible) → re-run the
affected eval tasks → keep the removal only if the eval does not regress.

## 8. Model re-evaluation

Re-evaluate the reviewer model and the Phase 4 implementation model when any of:

- plan rates or available models change (release, price change, deprecation);
- a model's eval pass rate drops below baseline for two consecutive weeks;
- paid tokens per task rise **> 20%** vs baseline without a scope increase;
- a free model becomes capable enough to pass the Phase 4 eval;
- **quarterly**, regardless of triggers.

**Procedure:** re-run the relevant eval tasks with the candidate, compare quality
score and tokens per approved task, and switch only if quality is equal or better
**and** cost per approved task is lower. Record the decision and its date.

## 9. 3-day baseline process

Purpose: replace the assumptions in §4 and §5 with measured numbers.

**Inputs:** `opencode-quota` (primary), `opencode stats` (secondary), the token
schema in `docs/opencode/eval/token-recording-template.md`, and
`scripts/eval/record-tokens.mjs` to append rows.

1. **Prep (day 0):** confirm `opencode-quota` works; note `monthly_quota` and the
   window structure; ensure git signing and hooks are active so the measured work
   is representative.
2. **Days 1-3:** run three **ordinary** workdays (not eval-only days). For each
   agent/phase combination append one row:
   ```bash
   node scripts/eval/record-tokens.mjs --date YYYY-MM-DD \
     --agent developer --phase implement --in <n> --out <n> \
     --source opencode-quota --notes "<note>"
   ```
   Columns: `date, agent, phase, task_id, run_id, input_tokens, output_tokens,
total_tokens, source, notes`.
3. **Each day at midday:** compute `consumption / daily_budget` as a dry run of
   §4 and note the band. Do not change behavior — this is capture only.
4. **End of day 3:** aggregate tokens per phase and per agent; compute mean and
   range across the three days.
5. **Calibrate:** if the measured split differs from 70/20/10 by more than 20% in
   any phase, set the new split and the new traffic-light thresholds, and log both
   in §5 with the date.
6. **Exit criteria:** three consecutive workdays recorded; per-agent and
   per-phase totals computed; thresholds and split calibrated or explicitly
   confirmed as-is; token log and a short baseline note saved.

If `docs/opencode/eval/token-recording-template.md` is missing, use the column
list inlined in step 2 as the fallback schema and note the dependency.

## 10. Cadence & ownership

| Cadence   | Task                            | Owner                 | Artifact                                            |
| --------- | ------------------------------- | --------------------- | --------------------------------------------------- |
| Daily     | Midday traffic-light check (§4) | Operator on duty      | Note in the day's work log                          |
| Weekly    | Review + pruning check (§6)     | Operator on duty      | Weekly review note                                  |
| On change | Model/rates re-evaluation (§8)  | Repository maintainer | Decision note + date                                |
| Quarterly | Sanity re-evaluation (§8)       | Repository maintainer | Decision note + date                                |
| Once      | 3-day baseline (§9)             | Operator on duty      | `docs/opencode/eval/tokens/*.jsonl` + baseline note |

Escalation: if the plan's quota cannot cover the current month even at Red, stop
paid usage and raise it with the maintainer before spending further.

## 11. Rollback

The runbook has no runtime consumers. Roll back by reverting the commit that adds
this file. Calibration-log entries are history: revert them with the same commit
only if the measurement that produced them was wrong, and say so in the note.

## 12. Quick reference card

```
daily_budget = (monthly_quota × 0.85) / 22     [min over plan windows]
midday: <50% green | 50-70% yellow (low-risk → free) | >70% red (free only)
split:  70% implement / 20% review / 10% contingency   [calibrate after baseline]
weekly: tokens per phase vs baseline, prune unused skills, check model triggers
```

## Appendix A — Glossary

- **Paid token:** a token billed by the provider, as opposed to a free-model token.
- **Reserve (15%):** allowance deliberately left unspent to absorb rework.
- **Band:** the Green/Yellow/Red classification from §4.
- **Calibration log:** the table in §5 recording split/threshold changes and their evidence.
- **Baseline note:** the short summary produced at the end of §9.

## Appendix B — References

- `docs/opencode/eval/token-recording-template.md` — canonical row schema (this
  runbook does not redefine it).
- `scripts/eval/record-tokens.mjs` — validates and appends token rows.
- `docs/opencode/eval/rubric.md` — quality scoring used by the eval tasks.
- Factorization plan PRD (`PRDS/Plan-de-acción-factorización-de-subagentes-en-OpenCode.md`)
  — defines the per-phase model mix this runbook operationalizes.
