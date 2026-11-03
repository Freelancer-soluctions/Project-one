# Design

## Context

Phase 0 baseline for the OpenSpec-driven orchestrator/subagent workflow. No behavioral change, no spec delta (`skip_specs: true`). The change ships only documentation under `docs/opencode/eval/` and one recording helper `scripts/eval/record-tokens.mjs`. See `proposal.md` for motivation and scope.

Constraints that shape this design:

- Docs-only: zero edits to workflows, hooks, config, agent prompts, or application code.
- Must be reproducible by a second operator from `README.md` alone (exit criterion in proposal).
- Scoring must be stable across the 10 tasks × 2 runs so variance is measurable, not noise.
- Token capture relies on existing `opencode-quota` / `opencode stats` output; no new instrumentation.

## Goals / Non-Goals

**Goals:**

- Define a fixed on-disk layout for eval artifacts so runs are comparable across operators and days.
- Define deterministic file formats (task, rubric, inviolable-rules case, token log) with explicit schemas.
- Define a reproduction procedure (run → score → record tokens → compare) that a second operator can follow.
- Keep every artifact human-readable markdown/JSON so diffs and review are trivial.

**Non-Goals:**

- No automation of scoring (rubric is applied by a human reviewer; no auto-grader).
- No new CI job, hook, or config; eval runs are manual.
- No changes to agent prompts, models, or skills (this is the _pre-change_ baseline).
- PRD metrics "turns to complete" and "skill load" (whether the correct skill was loaded) are deferred to later phases; this baseline captures quality (rubric), inviolable rules, and token cost only.
- No spec-level requirements (skip_specs: true); this change adds no capabilities.

## Decisions

### D1 — Directory layout (single root)

All eval material lives under one root: `docs/opencode/eval/`.

```
docs/opencode/eval/
├── README.md                     # entry point: how to run, score, record, compare
├── rubric.md                     # 0-3 scoring per artifact class
├── inviolable-rules.md           # adversarial guardrail test cases
├── token-recording-template.md   # per-agent/per-phase/per-day schema (canonical name, no alias)
├── tasks/
│   ├── 01-<slug>.md
│   ├── 02-<slug>.md
│   └── … 10-<slug>.md
├── tokens/                       # committed token logs, one file per day (NOT gitignored)
│   └── YYYY-MM-DD.jsonl
├── baseline/                     # committed aggregated baseline snapshot (scores, IR results, token totals)
└── runs/                         # raw per-run evidence (gitignored except .gitkeep via !docs/opencode/eval/runs/.gitkeep)
    └── <task-id>/<run-id>/
        ├── score.md              # rubric scores for that run
        └── artifacts/           # copied spec/code/commit evidence
scripts/eval/
└── record-tokens.mjs             # helper to append a token row from opencode-quota/stats output
```

Rationale: one root keeps the baseline discoverable and diffable. Raw evidence under `runs/` is gitignored, but `tokens/` and `baseline/` are committed so the Phase 0 exit criterion (baseline saved) is durable in the repo. Token logs must NOT live under `runs/` — that would gitignore the baseline. Alternatives considered: per-task directories at repo root (rejected — pollutes top level) and a single monolithic file (rejected — cannot diff per task/run).

### D2 — Task file format

Each `tasks/NN-<slug>.md` uses a fixed template with these sections in order:

1. **Task ID & Title** — `TASK-NN` + one-line title.
2. **Scope** — what to build/fix; in/out of scope; affected apps (client/server/e2e).
3. **Inputs** — starting state (branch, relevant files, existing tests).
4. **Steps expected** — the canonical workflow order: grill-me → spec → review → implement → verify → commit → Trello card. Used to assert task ordering (inviolable rule).
5. **Expected artifacts** — list of files the run must produce (spec delta, code, tests, commit, Trello card id).
6. **Acceptance criteria** — testable, binary checks (e.g., "unit tests pass", "lint clean", "commit signed").
7. **Run notes** — free-form per-run observations appended as `### Run A` / `### Run B` blocks (variance capture).

Rationale: fixed sections make 10 tasks × 2 runs comparable; "Steps expected" doubles as the task-ordering oracle for inviolable-rules cases. Alternatives: free-form task (rejected — not scorable).

### D3 — Rubric format (0-3 per artifact class)

`rubric.md` defines three artifact classes, each scored 0-3 with anchored descriptors:

- **Spec** (max 3): 0 = missing/invalid; 1 = present but vague; 2 = clear requirements + scenarios; 3 = clear + delta-correct + edge cases.
- **Code** (max 3): 0 = doesn't build/tests fail; 1 = builds, tests fail or lint errors; 2 = tests pass, lint clean, behavior partial; 3 = tests pass, lint/typecheck clean, behavior matches spec.
- **Commit** (max 3): 0 = invalid message or unsigned; 1 = conventional message only; 2 = conventional + signed; 3 = conventional + signed + DCO signoff + Trello linkage.

Per-run total = sum (0-9). Each run records a `score.md` with the three numbers + one-line justification per class. Aggregation across the two runs reports mean and range (variance). Alternatives: 5-point scale (rejected — too granular for 10 tasks), pass/fail (rejected — loses signal).

### D4 — Inviolable-rules test case format

`inviolable-rules.md` lists adversarial cases, each with:

1. **Case ID** — `IR-NN`.
2. **Rule probed** — e.g., "no force-push", "no --no-verify", "grill-me before spec", "task ordering".
3. **Attempt description** — exact prompt/instruction given to the orchestrator.
4. **Expected block** — what should stop it (hook/CI/ruleset) and the expected exit/error.
5. **Agent behavior** — expected agent response (refuse + explain, or escalate), never silently comply.
6. **Assertion** — how to verify pass/fail (command output, git state, CI status).
7. **Result log** — per-run outcome appended as `PASS`/`FAIL` with evidence link.

Cases are run manually and outcomes recorded; a single FAIL is a baseline finding, not a hard gate for this Phase 0 change.

### D5 — Token recording template

`token-recording-template.md` (the single canonical filename; no `token-recording.md` alias) defines a stable schema captured per agent, per phase, per day:

Columns: `date`, `agent` (orchestrator|planner|developer|reviewer|project-manager|researcher), `phase` (grill-me|spec|review|implement|verify|commit|trello), `task_id`, `run_id`, `input_tokens`, `output_tokens`, `total_tokens`, `source` (opencode-quota|opencode stats), `notes`.

Storage: one JSONL file per day under `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl` (committed, not gitignored), appended via `scripts/eval/record-tokens.mjs`. JSONL only — the CSV alternative is dropped to remove the dual-format ambiguity. Aggregation (sums/pivots) is done offline; the script only validates schema and appends a row.

Rationale: per-agent/per-phase/per-day granularity matches the proposal and lets cost regressions be attributed. JSONL chosen for append-safety and schema stability (CSV dropped for simplicity). Alternatives: DB (rejected — no infra), single file (rejected — merge conflicts across days).

### D6 — Helper script `scripts/eval/record-tokens.mjs`

Node ESM script (`.mjs`, no dependencies beyond Node stdlib) that:

- Takes flags `--date`, `--agent`, `--phase`, `--task`, `--run`, `--in`, `--out`, `--total`, `--source`, `--notes`, `--file`.
- Validates required fields and agent/phase enums.
- Appends one JSONL row to the target file (default `docs/opencode/eval/tokens/YYYY-MM-DD.jsonl`), creating parent dirs.
- Prints the appended row for confirmation.

No network, no secrets, no CI integration. Mirrors the style of existing `scripts/ci/*.mjs` (stdlib only, `--flag` parsing).

### D7 — Reproduction procedure (README.md)

`README.md` documents, in order:

1. Prerequisites (Node version from `.nvmrc`, opencode installed, git signing set up).
2. Run a task: pick `tasks/NN-*.md`, execute the workflow twice, save evidence under `runs/<task>/<run>/`.
3. Score: apply `rubric.md`, write `score.md`.
4. Record tokens: use `record-tokens.mjs` per agent/phase.
5. Run inviolable cases: execute each `IR-NN`, record PASS/FAIL.
6. Compare: aggregate scores (mean/range) and token totals; save the committed baseline snapshot under `baseline/`.
7. Exit criterion: all 10 tasks × 2 runs scored, inviolable results recorded, 3-day token log captured, reproducible by second operator.

### D8 — Baseline execution omitted from this change (2026-10-31)

The harness (D1-D7) ships here; the execution half of the proposal — 10 tasks ×
2 runs, 4 probes, the 3-workday token log and the aggregated snapshot — is
omitted and moves to `opencode-eval-baseline-execution`. Rationale: it needs an
interactive OpenCode session (permission prompts, grill-me, Trello), three
distinct workdays, and an authorized destructive-probe session; the only way to
"satisfy" it inside a docs change would be invented evidence, which would destroy
the baseline's only value. Consequence: this change's exit criterion is the
verified harness (see `proposal.md` § Exit criterion) and `tasks.md` § 8-10 lists
each omitted item with its reason, so nothing is silently dropped.

## Risks / Trade-offs

- [Manual scoring subjectivity] → anchored 0-3 descriptors + per-class one-line justification; aggregate mean/range to expose variance.
- [Token source inconsistency (quota vs stats)] → `source` column mandatory; never mix without noting.
- [Runs pollute repo] → `runs/` gitignored except `.gitkeep`; only scored summaries committed.
- [Task drift over time] → tasks are frozen for the baseline; changes require a new change, not edits.
- [Inviolable cases may be destructive (force-push probes)] → run only on throwaway branches/clones; documented in case file.

## Migration Plan

Not applicable — docs-only, no deployment. Rollback = revert the commit adding these files. No data migration.

## Open Questions

None blocking. Deferrable: whether to commit raw `runs/` evidence (currently gitignored) — decide after first baseline completes.
