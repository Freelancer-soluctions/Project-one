---
name: implementation-protocol
description: Batch execution protocol for implementing tasks from tasks.md (OpenSpec mode vs normal mode, task order, marking complete, tool usage policy) plus the coding-model check. Load before each implementation batch — when implementing tasks from a tasks.md file, when running an implementation batch after /opsx-apply, or when the agent must decide which model to use for coding work.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Implementation Protocol

Load this skill before each implementation batch.

## Coding-model check (Decision 3)

Before starting implementation of any task in `tasks.md` (coding, tests,
refactors — phases 3-4), confirm the active model is the coding model:

- **Coding model**: `opencode/mimo-v2.6-flash-free` — implementation-heavy phases 3-4.
- **Coordination model**: `opencode-go/beam-free` — default on `main` for phases 0-2 and 5-6 (exploration, spec, review, verification, archive).

If the active model is NOT the coding model:

1. Tell the user which model is active and which one is recommended.
2. Ask the user to switch (`/models` → `opencode/mimo-v2.6-flash-free`), or, if they
   prefer to continue on the current model, proceed only after they say so.
3. Do not silently block: model switching is a user action in OpenCode, not an agent tool.

Notes on automatic switching:

- `/opsx-apply` sets `model: opencode/mimo-v2.6-flash-free` in its command
  frontmatter, so sessions started through that command already run on the
  coding model (per OpenCode V2 docs, a command model overrides every other
  model selection).
- In any other entry point (plain prompt, `/opsx-continue`, resumed session),
  no automatic switch happens — this check is the fallback.

## OpenSpec mode vs normal mode

### When OpenSpec is Active (Mode: OpenSpec Active)

**You MUST:**

1. ✅ READ openspec/changes/[feature]/tasks.md once per change (at the start of the first batch); re-read only if told it changed
2. ✅ IMPLEMENT tasks in the EXACT order specified, in contiguous batches of 3-5
3. ✅ FOLLOW the design in design.md strictly
4. ✅ DO NOT skip or reorder tasks without explicit approval
5. ✅ Mark each task `[x]` immediately after it is implemented and verified, before moving to the next task
6. ✅ Work in batches of 3-5 tasks per invocation, then stop and wait for the next batch instruction

**Batch Invocation Protocol:**

1. Read tasks.md completely once per change (first batch only); identify the next batch of 3-5 not-yet-completed (`- [ ]`) tasks in order
2. Implement the first task in the batch (code + its own verification)
3. Mark it `[x]` in tasks.md
4. Repeat steps 2-3 for each remaining task in the batch (3-5 total)
5. Report completion: "Batch N Complete: [task IDs and one-line outcome each]"
6. Wait for the next batch instruction. **Do NOT auto-continue** to the next batch.

**Batch Sizing Rules:**

- Default target: 5 tasks per batch when 5 or more remain.
- If fewer than 3 remain, implement all remaining tasks as the final batch (a short tail is allowed only as the last batch).
- A batch may be smaller than 3 only when a task is unusually large or risky and a smaller batch is explicitly requested; otherwise prefer 5.
- Never exceed 5 tasks in one invocation, even if remaining tasks look trivial.
- Tasks are taken in tasks.md order; a batch never skips or reorders.

**Marking Tasks Complete:**

- Edit tasks.md to change `- [ ] X.Y` to `- [x] X.Y` immediately after the task's own verification passes — not at batch end.
- Use the targeted **edit** tool so the exact checkbox syntax is preserved for the OpenSpec apply phase.
- Mark before moving to the next task in the batch, so an interrupted batch leaves a precise resume point.
- Do not mark a task complete if its verification failed; report the failure and stop the batch.

### When OpenSpec is NOT Active (Mode: Normal)

**You implement based on:**

- Direct instructions from the user
- Your best judgment of implementation details
- Project conventions and standards

## Task execution protocol

Read `tasks.md` once per change; implement in exact order in contiguous batches of 3-5; mark each task `[x]` immediately after its own verification passes; stop after each batch and wait for the next instruction.

## Tool usage policy

### File Operations (write / edit)

- ✅ Use **write** for creating new files
- ✅ Use **edit** for modifying existing files (targeted string replacements)
- ✅ These are your PRIMARY tools for codebase manipulation

### Bash

- ✅ Use **bash** ONLY for running commands: tests, package management, git operations, build scripts, Prisma migrations
- ✅ ALWAYS use the write tool for creating new files and the edit tool for modifying existing files

## REMEMBER

- OpenSpec mode: Follow `tasks.md` in batches of 3-5, marking `[x]` after each task — not one task per invocation, and never auto-continue to the next batch.
