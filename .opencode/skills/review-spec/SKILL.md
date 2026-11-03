---
name: review-spec
description: >
  Specification review checklist for OpenSpec changes: proposal clarity,
  delta specs, design soundness, and task atomicity/order. Use when performing
  a specification review, in SDD mode or on any proposal/spec/design/tasks set.
  Extracted from the planner SDD review steps (planner.md, since retired —
  merged into reviewer.md).
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Review Spec — Specification Review Checklist

Load this skill when performing a specification review: the spec review of an
OpenSpec change, or any proposal/spec/design/tasks set handed to you for
feasibility review.

READ ONLY. Do not create or edit artifacts under `openspec/`. Report findings
conversationally, to the caller reading your final message.

## The five review steps

Each artifact feeds the next: the proposal gives context for the specs, the
specs inform the design, and the design generates the tasks. Review in order.

1. **proposal.md** — Does it state the problem and the solution clearly? Is the
   scope bounded, and are non-goals stated?
2. **specs/** (delta specs) — Are requirements testable and complete
   (WHEN/THEN or equivalent)? Is anything contradictory or missing?
3. **design.md** — Is the architecture sound? Any missing components
   (migration, config, permissions, error paths)? Are decisions justified with
   alternatives?
4. **tasks.md** — Are tasks atomic, in dependency order, and free of missing
   steps? Is every requirement covered by at least one task? Is there a
   verification task?
5. **Feedback** — conversational, no file edits: strengths, suggestions, and
   concrete amendments (task ID + change + reason).

## Feasibility flags

Blocking (report as `criticalIssues`):

- A requirement that cannot be implemented with the existing stack or schema.
- A design that references components, models, or endpoints that do not exist.
- Tasks ordered so an early task depends on a later one.

Advisory (report as `suggestions`):

- Missing rate limiting, input validation, or error handling on a new surface.
- Missing migration or rollback step.
- Ambiguous acceptance criteria that two implementers would read differently.

## Output shape

- `verdict`: `APPROVED` or `NEEDS CHANGES` — always present.
- `criticalIssues`: `{ issue, impact, recommendation }`, each naming the
  artifact and the section it comes from.
- `suggestions`: `{ suggestion, rationale }`.
- `taskAmendments`: `{ taskId, change, reason }` when `tasks.md` needs edits.
- `designAlignment`: `ALIGNED` | `PARTIAL` | `MISALIGNED`.
- `riskAssessment`: `LOW` | `MEDIUM` | `HIGH`.

## Review failures to avoid

- Reviewing the design before confirming the proposal's problem statement.
- Accepting tasks that restate the design instead of producing a verifiable
  state change.
- Reporting "looks good" without naming the artifact and section checked.
