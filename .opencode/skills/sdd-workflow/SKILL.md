---
name: sdd-workflow
description: >
  The 6 phases of Specification-Driven Development (SDD) and their gates.
  Use when planning or coordinating a feature through exploration, spec,
  review, implementation, verification, and archive. Extracted from
  orchestrator.md (now retired; superseded by main.md).
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# SDD Workflow — 6 Phases and Gates

Specification-Driven Development (SDD) is a 6-phase flow where the
specification precedes the implementation. The **main agent** coordinates the
phases and runs the `/opsx-*` commands directly (and, since `single-main-agent`,
implements Phase 4 itself). `@spec-manager` and `@git-manager` were retired, so
no command-wrapper hop remains; `@planner` merged into `@reviewer`.

## Phase 0 — Interrogation (Relentless /grill-me)

Before Phase 1/2, run `/skill grill-me`: interview the user, walk each branch
of the design tree, resolve dependencies one-by-one. Ask at least 3 critical
questions (one at a time). Do NOT run `/opsx-new` until shared understanding
is confirmed.

Gate: user confirms plan.

## Phase 1 — Exploration

Run `/opsx-explore <topic>` or `/opsx-onboard` directly.
Gather repository and architectural context. No artifacts yet.

## Phase 2 — Specification Creation

Run directly:

- `/opsx-new <change-name>` (scaffold)
- `/opsx-propose <change-name>` (proposal + specs + design + tasks)

Wait for completion before continuing.

## Phase 3 — Specification Review

Delegate to @reviewer: "Review specification for <change-name>".
@reviewer READS only (does not create files) and reports feasibility/issues.
If issues: communicate, clarify, re-run affected workflows.

## Phase 4 — Implementation

**Self-implemented by the main agent** (since `single-main-agent`; the `@developer` agent was retired).
Load `/skill implementation-protocol` and run in **batches of 3-5 tasks**: read `tasks.md` once per change,
implement a contiguous batch in order, mark each `[x]`, report `Batch N Complete: [task IDs and one-line outcome each]`,
and stop.

Gate: review the batch report, then issue the next batch instruction. Do NOT auto-continue, and one task per
invocation is not the norm — only request a smaller batch when a task is unusually large or risky.

Tasks MUST run in `tasks.md` order (1, 2, 3, ...); a batch never skips or reorders. Use
`/opsx-continue` or `/opsx-apply` if workflow continuation is needed.

## Phase 5 — Verification

Run `/opsx-verify` directly and delegate code quality to @reviewer.
Validate implementation against specs before archiving.

## Phase 6 — Archive

Run `/opsx-archive <change-name>` (or bulk-archive) directly.

## Gates Summary

| Phase | Owner                 | Gate to advance                                    |
| ----- | --------------------- | -------------------------------------------------- |
| 0     | main agent            | user confirms shared understanding                 |
| 1     | main agent            | exploration complete                               |
| 2     | main agent            | all artifacts (proposal/specs/design/tasks) exist  |
| 3     | reviewer              | review approved (no critical issues)               |
| 4     | main agent (self)     | all tasks implemented in sequential batches of 3-5 |
| 5     | main agent + reviewer | verification passes                                |
| 6     | main agent            | archive successful                                 |

## Rules

- ALWAYS follow the 6-phase workflow for new features.
- ALWAYS wait for the spec artifacts to exist before starting implementation.
- ALWAYS implement tasks sequentially, in batches of 3-5 per invocation (load `implementation-protocol`).
- ALWAYS verify before archiving.
- Specification phase MUST complete before implementation.
