# Token Recording Template — OpenCode Eval Baseline

Canonical schema for per-agent, per-phase, per-day token usage. This file is the
**only** schema definition; there is no `token-recording.md` alias.

Rows are appended by [`scripts/eval/record-tokens.mjs`](../../../scripts/eval/record-tokens.mjs)
and stored as **JSONL** under `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl`.

> `tokens/` is **committed** (not gitignored). Only raw run evidence under
> `docs/opencode/eval/runs/` is ignored. Do not write token logs into `runs/`:
> that would gitignore the baseline.

## Row schema

One JSON object per line, keys in this order. Keep the order stable so diffs
stay readable and `record-tokens.mjs` output matches this table.

| Field           | Type           | Required | Allowed values / rules                                                                                             |
| --------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `date`          | string         | yes      | `YYYY-MM-DD` (the workday the usage is attributed to; defaults to today).                                          |
| `agent`         | string enum    | yes      | `orchestrator`, `planner`, `developer`, `reviewer`, `project-manager`, `researcher`.                               |
| `phase`         | string enum    | yes      | `grill-me`, `spec`, `review`, `implement`, `verify`, `commit`, `trello`.                                           |
| `task_id`       | string \| null | no       | `TASK-01` … `TASK-10` when the row belongs to an eval task; `null` for routine work (e.g. the 3-day log).          |
| `run_id`        | string \| null | no       | `A` or `B` when the row belongs to an eval run; `null` for routine work.                                           |
| `input_tokens`  | integer ≥ 0    | yes      | Prompt/context tokens.                                                                                             |
| `output_tokens` | integer ≥ 0    | yes      | Completion tokens.                                                                                                 |
| `total_tokens`  | integer ≥ 0    | yes      | Must equal `input_tokens + output_tokens`; the script rejects a mismatch instead of storing an inconsistent row.   |
| `source`        | string enum    | yes      | `opencode-quota` or `opencode stats`. Mandatory: never blend sources in one aggregate without reporting the split. |
| `notes`         | string \| null | no       | Free text (model, retry, compaction, anomaly). Use `""`/`null` for none.                                           |

## Example lines

```jsonl
{"date":"2026-11-02","agent":"orchestrator","phase":"grill-me","task_id":"TASK-01","run_id":"A","input_tokens":1840,"output_tokens":512,"total_tokens":2352,"source":"opencode stats","notes":"beam-free"}
{"date":"2026-11-02","agent":"developer","phase":"implement","task_id":"TASK-01","run_id":"A","input_tokens":25100,"output_tokens":3900,"total_tokens":29000,"source":"opencode-quota","notes":"two retries on failing test"}
{"date":"2026-11-03","agent":"project-manager","phase":"trello","task_id":null,"run_id":null,"input_tokens":900,"output_tokens":120,"total_tokens":1020,"source":"opencode-quota","notes":"routine backlog triage"}
```

## Recording procedure

1. Pick the day file: `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl`.
2. Read the numbers from the tool for that agent/phase:
   - `opencode-quota` for quota/aggregate usage,
   - `opencode stats` for per-session token counts.
3. Append one row per agent **and** phase combination — do not collapse phases:

   ```bash
   node scripts/eval/record-tokens.mjs \
     --date 2026-11-02 --agent developer --phase implement \
     --task TASK-01 --run A --in 25100 --out 3900 \
     --source opencode-quota --notes "two retries"
   ```

4. Re-read the appended line to confirm (`tail -n 1 <file>`).

The script validates the enums, the date format, non-negative integers, the
`total = input + output` invariant, and creates the parent directory on demand.
It never hits the network and never prints credentials.

## Aggregation

Aggregation is offline and always reports its `source` split:

- **per-agent totals** over the 3 days (`sum(total_tokens)` grouped by `agent`);
- **per-phase totals** (`sum(total_tokens)` grouped by `phase`);
- **per-run totals** for eval runs (`grouped by task_id` + `run_id`).

Add the aggregation command and its output to
`docs/opencode/eval/baseline/token-totals.md`, with the 3 dates and the source
mix stated at the top.
