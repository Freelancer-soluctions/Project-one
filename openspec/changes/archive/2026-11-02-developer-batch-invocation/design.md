# Design

## Context

The developer prompt (`docs/opencode/prompts/developer.md`) currently defines a **per-task** OpenSpec execution protocol: read `tasks.md`, implement Task 1, report completion, wait, then move to Task 2. This produces one developer invocation per task, which does not scale and conflicts with the planned single-main-agent flow (see `openspec/changes/single-main-agent/proposal.md`) where the implementation agent must be invocable in coarser batches.

This change is a **prompt-only** refactor (`skip_specs: true`): no API, dependency, or runtime changes. The only artifact edited is `docs/opencode/prompts/developer.md`, specifically its `## OPENSPEC MODE vs NORMAL MODE` -> `### When OpenSpec is Active` subsection.

Constraints shaping the approach:

- The OpenSpec artifact workflow (`openspec/changes/<name>/tasks.md`) uses `- [ ] X.Y` / `- [x] X.Y` checkboxes parsed by the apply phase; the developer must keep that exact syntax when marking tasks complete.
- Batch size must stay small enough that a single invocation fits comfortably in context and is reviewable (3-5 tasks).
- The protocol must remain deterministic and self-contained so it can be loaded later as an on-demand skill by the single main agent (no orchestrator mediation assumed).
- Verification is behavioral: an OpenSpec change with N tasks should require `ceil(N/5)` (or fewer, never more) developer invocations, each covering a contiguous batch of 3-5 tasks.

## Goals / Non-Goals

**Goals:**

- Replace the per-task execution protocol with a batch invocation protocol (read `tasks.md` once per change, implement 3-5 tasks per invocation, mark `[x]` after each task, wait for next batch instruction).
- Keep the existing `## OPENSPEC MODE vs NORMAL MODE` structure and the disabled output-contract scaffolding untouched.
- Make the batch size, marking, and reporting rules explicit and unambiguous.
- Align wording so the section can be reused verbatim by the future single main agent (phase-agnostic, no orchestrator-specific assumptions).

**Non-Goals:**

- No changes to Normal mode, tool usage policy, guardrails, output contract, or REMEMBER section beyond a one-line alignment.
- No changes to `tasks.md` parsing/format in OpenSpec CLI or to other agents/prompts.
- No new skills, commands, or runtime behavior.
- No change to the number or content of implementation tasks in any existing change.

## Decisions

### Decision 1: Read `tasks.md` once per change, not per task

**Choice:** The developer reads `openspec/changes/[feature]/tasks.md` a single time at the start of the first batch of a change and re-reads it only when explicitly told the file changed. Subsequent batches reuse the in-memory understanding of remaining `[ ]` tasks.

**Rationale:** Eliminates the redundant per-task file reads that the current protocol mandates ("Read tasks.md completely" before every task). Reading once per change is sufficient because tasks are marked `[x]` in place and the developer re-reads only on a stated file change.

**Alternatives considered:**

- Re-read `tasks.md` at the start of every batch — safer against drift but re-introduces a per-invocation file read; rejected because the exit criterion targets invocation count, and re-reading is cheap but not required for correctness.
- Pass the task list inline in the delegation message — rejected: it duplicates source of truth and breaks the "tasks.md is the contract" invariant.

### Decision 2: Batch size of 3-5 tasks

**Choice:** A batch is a contiguous group of 3 to 5 not-yet-completed tasks (`[ ]`) in `tasks.md` order. The developer implements exactly one batch per invocation, then stops and waits.

**Rationale:** 3-5 keeps a single invocation small enough to fit context and be reviewable while cutting invocations by 3-5x. It matches the Phase 1 exit criterion ("1 invocation per batch instead of per task").

**Sizing rules:**

- Default target: 5 tasks per batch when 5 or more remain.
- If fewer than 3 remain, implement all remaining tasks as the final batch (a "short tail" batch is allowed only as the last batch).
- A batch may be smaller than 3 when a task is unusually large or risky and the orchestrator/main agent explicitly requests a smaller batch; otherwise prefer 5.
- Never exceed 5 tasks in one invocation, even if remaining tasks look trivial.
- Tasks are taken in `tasks.md` order; a batch never skips or reorders.

**Alternatives considered:**

- Fixed batch size of exactly 5 — rejected: forces a 1-task tail batch for N not divisible by 5, reintroducing near-per-task invocations for small remainders.
- Adaptive sizing by token estimate — rejected: adds non-determinism and is hard to verify; the 3-5 range is simple and auditable.

### Decision 3: Mark `[x]` immediately after each task

**Choice:** After implementing a task (code written + its own verification passed), the developer edits `tasks.md` to change `- [ ] X.Y` to `- [x] X.Y` **before** moving to the next task in the batch, using the targeted `edit` tool.

**Rationale:** Keeps `tasks.md` as the live source of truth so a crashed/interrupted batch leaves a precise resume point, and so the apply phase's checkbox parser sees progress even mid-batch. Marking only at batch end would lose that granularity.

**Alternatives considered:**

- Mark all tasks in the batch at the end — rejected: loses resume granularity and inflates the diff at once.
- Mark via a separate commit — rejected: out of scope (commit cadence is git-manager's concern).

### Decision 4: Wait for next batch instruction

**Choice:** After completing a batch, the developer reports `Batch N Complete: [summary]` (listing the task IDs and a one-line outcome each) and **stops**, waiting for the orchestrator/main agent to issue the next batch instruction. It does not auto-continue to the next batch.

**Rationale:** Preserves the human/agent review gate between batches and matches the existing "wait for confirmation" spirit, while reducing invocations to one per batch. Auto-continuing would collapse the gate and risk running ahead of review.

**Alternatives considered:**

- Auto-continue until all tasks done — rejected: removes the review gate and contradicts "wait for next batch instruction" in the proposal.

### Decision 5: Phase-agnostic wording

**Choice:** The rewritten section avoids orchestrator-specific phrasing ("wait for confirmation from orchestrator") and instead says "wait for the next batch instruction", so the same text works whether invoked by the orchestrator today or by the single main agent later.

**Rationale:** Aligns with the future single-agent flow without coupling this change to `single-main-agent`'s completion.

## How to modify `developer.md`

Edit only `docs/opencode/prompts/developer.md`, section `## OPENSPEC MODE vs NORMAL MODE` -> `### When OpenSpec is Active`. Replace the `**You MUST:**` numbered list and the `**Task Execution Protocol:**` block with the batch protocol. Leave Normal mode, tool usage policy, guardrails, output contract (disabled), and all other sections untouched. Apply a one-line alignment to the REMEMBER section's first bullet.

## Before/After (OpenSpec mode section)

### Before (current `### When OpenSpec is Active`)

```
### When OpenSpec is Active (Mode: OpenSpec Active)

**You MUST:**

1. ✅ READ openspec/changes/[feature]/tasks.md
2. ✅ IMPLEMENT tasks in the EXACT order specified
3. ✅ FOLLOW the design in design.md strictly
4. ✅ DO NOT skip or reorder tasks without explicit approval
5. ✅ Mark each task as complete before moving to next

**Task Execution Protocol:**

1. Read tasks.md completely
2. Implement Task 1
3. Report completion: "✅ Task 1 Complete: [summary]"
4. Wait for confirmation or move to Task 2
5. Repeat until all tasks done
```

### After (batch protocol)

```
### When OpenSpec is Active (Mode: OpenSpec Active)

**You MUST:**

1. ✅ READ openspec/changes/[feature]/tasks.md once per change (at the start of the first batch); re-read only if told it changed
2. ✅ IMPLEMENT tasks in the EXACT order specified, in contiguous batches of 3-5
3. ✅ FOLLOW the design in design.md strictly
4. ✅ DO NOT skip or reorder tasks without explicit approval
5. ✅ Mark each task as complete (`- [x] X.Y`) immediately after it is implemented and verified, before moving to the next task
6. ✅ Implement exactly ONE batch per invocation, then stop and wait for the next batch instruction

**Batch Invocation Protocol:**

1. Read tasks.md once (first batch only); identify the next 3-5 not-yet-completed (`- [ ]`) tasks in order
2. Implement the first task in the batch (code + its own verification)
3. Mark it complete in tasks.md: change `- [ ] X.Y` to `- [x] X.Y`
4. Repeat steps 2-3 for each remaining task in the batch (3-5 total)
5. Report completion: "Batch N Complete: [task IDs and one-line outcome each]"
6. Stop and wait for the next batch instruction. Do NOT auto-continue to the next batch.

**Batch sizing rules:**

- Default target: 5 tasks per batch when 5 or more remain.
- If fewer than 3 remain, implement all remaining tasks as the final batch (short tail allowed only as the last batch).
- A batch may be smaller than 3 when a task is unusually large or risky and a smaller batch is explicitly requested; otherwise prefer 5.
- Never exceed 5 tasks in one invocation.
- Tasks are taken in tasks.md order; a batch never skips or reorders.
```

### REMEMBER (one-line alignment)

Before:

```
- OpenSpec mode: Follow tasks.md religiously
```

After:

```
- OpenSpec mode: Follow tasks.md in batches of 3-5, marking [x] after each task
```

## Batch sizing (3-5 tasks per batch)

- A **batch** is a contiguous group of 3 to 5 not-yet-completed tasks (`- [ ]`) taken in `tasks.md` order.
- Exactly **one batch per invocation**; the developer stops after the batch and waits.
- Default target is 5 when 5+ remain; a short tail (<3) is permitted only as the final batch.
- A batch may be reduced below 3 only when a task is unusually large/risky and a smaller batch is explicitly requested.
- Never exceed 5 tasks in one invocation, even if they look trivial.

## Marking `[x]` after each task

- Marking happens **immediately after** a task is implemented and its own verification passes — not at batch end.
- Use the targeted `edit` tool to change `- [ ] X.Y` to `- [x] X.Y` (exact checkbox syntax preserved for the apply phase parser).
- Mark before moving to the next task in the batch, so an interrupted batch leaves a precise resume point.
- Do not mark a task complete if its verification failed; report the failure and stop the batch.

## Verification: 1 invocation per batch instead of per task

- Exit criterion: for a change with N tasks, developer invocations = `ceil(N/5)` (or fewer with short tails), never more.
- Each invocation covers a contiguous batch of 3-5 tasks and marks each `[x]` as it goes.
- Behavioral check on a sample change: confirm one developer invocation covers 3-5 tasks, marks them `[x]` in `tasks.md`, and stops with `Batch N Complete: ...` without auto-continuing.
- Negative check: no per-task "✅ Task X Complete" reports or per-task waits remain in the new protocol text.

## Risks / Trade-offs

- **[Risk] Developer marks `[x]` without actually verifying the task** -> Mitigation: protocol states marking happens only after the task's own verification passes; REMEMBER section reinforces "Always write tests".
- **[Risk] Batch drift if `tasks.md` is edited externally mid-change** -> Mitigation: developer re-reads `tasks.md` when told it changed; otherwise trusts the last read.
- **[Risk] A single task spanning multiple files makes a 5-task batch too large** -> Mitigation: sizing rule allows smaller batches when a task is unusually large, with explicit request.
- **[Risk] Output contract (disabled) is not emitted** -> Not applicable: output contracts are disabled in this repo; the protocol's report line is the deliverable.
- **[Trade-off] Fewer invocations vs. less granular review** -> Benefit: 3-5x fewer developer invocations; Cost: review happens per batch, not per task. Mitigated by keeping batches to 3-5.

## Migration Plan

1. Edit `docs/opencode/prompts/developer.md`: replace the `### When OpenSpec is Active` subsection's MUST list and `**Task Execution Protocol:**` block with the batch protocol (Before/After above).
2. Apply the one-line REMEMBER alignment.
3. Leave all other sections untouched (Normal mode, tool usage policy, guardrails, output contract, SELF-VALIDATION).
4. Verify by reading the file and confirming the new protocol text is present and the old per-task steps ("Implement Task 1", "Wait for confirmation or move to Task 2", "Repeat until all tasks done") are gone.
5. Optional behavioral check: on a sample change, confirm one developer invocation covers 3-5 tasks, marks them `[x]`, and stops with `Batch N Complete`.

## Open Questions

None. All decisions needed to write the task list are resolved above.
