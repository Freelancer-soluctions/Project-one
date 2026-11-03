# Proposal

## Why

Change `retire-command-wrapper-agents` retired the `spec-manager` and `git-manager` agents (config, prompts, and schemas deleted; guardrails/skills/docs re-pointed to direct execution). Its design declared `skip_specs: true`, so the **main specs were never updated**. Review of that change (2026-11-03) found five main specs still written in terms of the retired agents, e.g. `openspec/specs/local-commit-all-dco/spec.md`:

> "The @git-manager /commit-all command produces…" / "WHEN @git-manager executes /commit-all…"

Those requirements are now **unsatisfiable and untestable**: no such agent exists. Any `/opsx-verify` run against the main specs fails post-retirement. The retirement itself is correct; only the spec text lags.

## What Changes

- Re-point the five drifted main specs from `@git-manager` / `@spec-manager` delegation to **direct execution by the primary agent** (now the `main` agent; the principal runs `/commit-all` and `/opsx-*` directly).
- Preserve each requirement's intent and scenario structure — change only the actor (`@git-manager` → primary agent / direct execution) and any delegation wording.
- Annotate nothing as historical in main specs: main specs describe _current_ behavior, so they must read as current, not as an archive.

**Specs affected (from review):**

1. `openspec/specs/local-commit-all-dco/spec.md`
2. `openspec/specs/empty-response-guard/spec.md`
3. `openspec/specs/prompt-format/spec.md`
4. `openspec/specs/agent-prompt-integration/spec.md`
5. `openspec/specs/output-contract-validation/spec.md`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-commit-all-dco` — actor re-pointed from `@git-manager` to direct execution.
- `empty-response-guard`, `prompt-format`, `agent-prompt-integration`, `output-contract-validation` — retired-agent references re-pointed.

## Impact

- **Affected files:** the five `openspec/specs/**/spec.md` files listed above.
- **No code, config, prompt, or tooling changes** — main-spec text only.
- **No new capabilities; no behavioral change** — this is a spec-drift correction. `skip_specs: false` (this change's whole purpose is spec sync, so the specs ARE the deliverable).
- **Exit criterion:** `grep -rn "@git-manager\|@spec-manager" openspec/specs/` returns zero active-behavior references; each requirement reads in terms of the primary agent; `openspec validate` passes if applicable.

## Note

Created as the follow-up recommended by the review of `retire-command-wrapper-agents` (highPriority #1). Complements, not replaces, `/opsx-sync` (no delta specs to merge — the drift predates delta tracking for these changes).
