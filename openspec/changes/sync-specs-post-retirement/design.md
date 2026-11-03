# Design: sync-specs-post-retirement

## Context

Change `retire-command-wrapper-agents` removed the `spec-manager` and `git-manager` agents but declared `skip_specs: true`, so the main specs under `openspec/specs/` were never re-pointed. Review (2026-11-03) confirmed **5 specs** still describe behavior in terms of agents (or prompt files) that no longer exist.

Verified drift inventory (2026-11-03, `grep -rn "git-manager\|spec-manager" openspec/specs/`):

| Spec                                 | Matches                                                    | Nature                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `local-commit-all-dco/spec.md`       | 3 (`@git-manager`)                                         | actor in Purpose + 2 scenarios                                                                                   |
| `empty-response-guard/spec.md`       | 6 (purpose + requirement title + 3 scenarios + rule count) | references `spec-manager.md`/`git-manager.md`/`orchestrator.md`/`developer.md` prompt files, several **deleted** |
| `agent-prompt-integration/spec.md`   | 1 (`spec.md:11`)                                           | enumerates 8 prompt files incl. 4 deleted                                                                        |
| `output-contract-validation/spec.md` | 1 (`spec.md:577`)                                          | example lists `git-manager`                                                                                      |
| `prompt-format/spec.md`              | 1 (`spec.md:66`)                                           | scenario checks `spec-manager.md` + `git-manager.md`                                                             |

Note: these specs also name `orchestrator.md`, `developer.md`, `planner.md` — deleted by `single-main-agent` / `merge-planner-into-reviewer`. This change scopes to the **retired wrapper agents** (`spec-manager`, `git-manager`) per its proposal; where a requirement enumerates _all_ prompt files, the enumeration must be brought to the current 4-prompt set (`main`, `reviewer`, `researcher`, `project-manager`) in the same edit, since the same sentence cannot be half-stale.

## Goals / Non-Goals

**Goals:**

- Remove every `@git-manager` / `@spec-manager` actor and every reference to their deleted prompt files from the main specs.
- Preserve requirement intent and scenario structure verbatim except for the actor/enumeration wording.
- Leave each spec describing **current** behavior (main specs are not an archive — no historical footnotes).

**Non-Goals:**

- No code, config, prompt, or tooling changes.
- No new capabilities; no behavior change — this is spec-drift correction only.
- Not a general re-audit of every spec for other staleness (e.g. legacy token counts); only the retired-agent drift named above.

## Decisions

### D1 — Actor replacement, not requirement rewrite

For `local-commit-all-dco`: replace `@git-manager` with "the primary agent" (the principal runs `/commit-all` directly since `single-main-agent`). Keep every SHALL statement and scenario condition/expectation identical otherwise. Rationale: the DCO/-S -s rule is unchanged; only who executes it changed.

### D2 — Enumeration updates for prompt-set specs

For `empty-response-guard`, `agent-prompt-integration`, `prompt-format`: the requirement enumerates prompt files. Rewrite the enumeration to the current set (`main`, `reviewer`, `researcher`, `project-manager`) and **delete scenarios that test a file that no longer exists** (e.g. `spec-manager.md` CRITICAL RULES scenario, `git-manager.md` sandwich scenario). Rationale: a scenario whose subject file is gone cannot be satisfied; keeping it guarantees a verify failure. Scenarios covering surviving prompts stay.

### D3 — Rule-count adjustments

`empty-response-guard:53` says "43 legacy behavioral rules (orchestrator 26 + git-manager 9 + project-manager 8)". With orchestrator and git-manager retired, the decomposition no longer applies. Replace with a count-neutral statement ("legacy behavioral rules SHALL remain intact under `## Behavioral Rules` for every prompt that has such a block") rather than asserting a number that will drift again. Rationale: exact counts of prompt internals are brittle; the invariant is "don't drop them", not "there are exactly N".

### D4 — Example lists become topology-neutral

`output-contract-validation:577` uses "(e.g., developer, researcher, git-manager)" as an illustrative agent list. Replace with current agents (`main`, `researcher`, `reviewer`). The scenario's point is _rapid successive task calls across different agents_, not the specific names.

## Risks / Trade-offs

- [Scenario deletion hides lost coverage] → only scenarios whose subject **file was deleted** are removed; the guard invariant itself is covered by the surviving scenarios in the same requirement.
- [Count-neutral wording is weaker] → accepted: a drifting exact count is worse than a stable invariant; the hook/prompt tests still enforce the concrete presence.
- [Scope creep into full spec audit] → Non-Goal; other staleness stays out unless it blocks the grep exit criterion.

## Migration Plan

Docs/specs only. Rollback = revert the commit(s) editing `openspec/specs/**/spec.md`. No deployment, no data.

## Open Questions

None blocking. Deferred: whether a broader "spec staleness" audit should follow once `single-main-agent` lands (specs naming `orchestrator`/`developer` outside the 5 above were not inventoried here).
