# Proposal

## Why

The orchestrator agent currently has `"bash": "ask"` with no command-level restrictions, so any bash invocation — including destructive git operations (`push`, `--force`, `--force-with-lease`, `commit --amend`, `rebase`, `--no-verify`) — is only gated by a human prompt. The neurosymbolic guardrails plugin already blocks the worst cases as a second layer, but the first layer (OpenCode permissions) should deny them deterministically so they never reach a prompt or a shell. Today the orchestrator can also run arbitrary `git`/`gh` commands without a clear allow-list, which blurs the boundary between the orchestrator (which delegates SCM work to `@git-manager`) and the SCM specialist.

## What Changes

- Add a `permission.bash` object to the `orchestrator` agent in `opencode.jsonc` (replacing the bare `"bash": "ask"`), using OpenCode's glob-pattern permission syntax. Syntax verified against `docs/opencode/opencode-guide.md` §8.1/§8.2: keys are glob patterns matched against the full command string, values are `allow`/`deny`/`ask`/`auto`; the first matching rule wins; `*` is the catch-all.
  - **Allow**:
    - `openspec *`
    - `git status`
    - `git diff --stat`
    - `git add *`
    - `git commit *`
    - `gh *`
  - **Deny** the rest of git:
    - `git push` (bare form, no args)
    - `git push *` (covers `push`, `--force`, `--force-with-lease`)
    - `git commit --amend` (bare form, no args)
    - `git commit --amend *`
    - `git rebase` (bare form, no args)
    - `git rebase *`
    - `git * --no-verify*`
    - catch-all `git *` → `deny`
  - Default any unmatched command to `ask` (`*` → `ask`) so unknown invocations still prompt rather than silently run.
  - Total: 6 allow + 9 deny = 15 patterns (first-match-wins ordering per design.md D2).
- Ordering: specific allow rules first, then specific deny rules, then `git *` → `deny`, then `*` → `ask`.
- Keep the guardrails plugin as the second layer; this change only adds the first layer (permissions).
- No runtime/code changes: config-only.

## Capabilities

### New Capabilities

<!-- None — this is a permissions/config change with no spec-level behavior. -->

### Modified Capabilities

<!-- None — no existing capability requirements change. -->

## Impact

- **Affected file**: `opencode.jsonc` — `agent.orchestrator.permission.bash` block only. _(Amended 2026-11-03: the `orchestrator` agent was subsequently retired by `single-main-agent`; the object was **re-homed to `agent.main.permission.bash`** after review caught the regression.)_
- **Affected agent**: `orchestrator` (primary) → now `main` (primary successor). Subagents (`git-manager`, `spec-manager`, etc.) are untouched; their bash permissions remain as configured.
- **⚠️ Re-homing requirement**: if the primary agent holding this object is ever renamed or removed, the 15-pattern `permission.bash` object **must be migrated to the successor primary agent in the same change** or the hardening is silently lost (exactly what happened when `single-main-agent` retired `orchestrator`; caught in review, fixed by `single-main-agent` task 4.7). Any future agent-retirement change must grep for this object first.
- **Dependencies/systems**: OpenCode permission glob syntax (verified against `docs/opencode/opencode-guide.md` §8.1/§8.2 and the official config reference). No new dependencies.
- **Behavior**: destructive git operations are denied at the permission layer before a prompt or shell execution; allowed read-only/commit commands run without prompting; everything else still asks.
- **Risk**: low — config-only; the guardrails plugin remains as defense-in-depth. Rollback is reverting the `bash` block to `"ask"`.
- **Observation (out of scope)**: `agent.project-manager` carries `"bash": "allow"` (unconditional full bash on a subagent). Untouched by this change; flagged for a future permissions review.
