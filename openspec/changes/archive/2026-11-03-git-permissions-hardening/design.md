# Design: git-permissions-hardening

## Context

The `orchestrator` agent in `opencode.jsonc` (lines ~133-147) declares `"bash": "ask"`. Every bash invocation therefore reaches a human prompt, including destructive git operations (`push`, `--force`, `--force-with-lease`, `commit --amend`, `rebase`, `--no-verify`) and safe read-only ones alike. The neurosymbolic guardrails plugin (`.opencode/plugins/neurosymbolic-guardrails.ts`) already blocks the worst cases as a second layer, but the first layer (OpenCode permissions) should deny them deterministically so they never reach a prompt or a shell. See `proposal.md` — Why/What Changes for motivation and scope.

Constraints shaping this design (verified against `docs/opencode/opencode-guide.md` §3.4 and §8.1/§8.2):

- `permission.bash` accepts either a string (`"allow"/"deny"/"ask"/"auto"`) or an object whose **keys are glob patterns matched against the full command string** and whose values are the same four states.
- **First matching rule wins**; `*` is the catch-all. Object key insertion order determines evaluation order.
- Agent permission blocks are **deep-merged** with the global `permission` block (root). The global block in this repo does **not** declare `bash`, so the agent-level value applies with no inheritance conflict.
- `git-manager` (the SCM specialist) keeps `"bash": { "git *": "allow", "*": "deny" }` unchanged; this change touches only `orchestrator`.
- Syntax example from the guide: `"bash": { "git *": "allow", "*": "ask" }`.

## Goals / Non-Goals

**Goals:**

- Replace `orchestrator.permission.bash` (string `"ask"`) with a glob-pattern object.
- Allow without prompting: `openspec *`, `git status`, `git diff --stat`, `git add *`, `git commit *`, `gh *`.
- Deny deterministically: `git push` (and variants), `git commit --amend` (and variants), `git rebase` (and variants), any git command carrying `--no-verify`, and the catch-all `git *`.
- Default any unmatched command to `ask` (prompt), never silent allow.
- Keep the guardrails plugin as the second layer (defense-in-depth); this change adds only the first layer.
- Config-only: no runtime/code changes.

**Non-Goals:**

- No changes to subagent permissions (`git-manager`, `spec-manager`, etc.).
- No changes to the guardrails plugin or to command execution logic.
- No new allow patterns beyond the six listed in the proposal.
- No changes to the global root `permission` block.
- No spec-level behavior changes (`skip_specs: true`).

## Decisions

### D1 — `permission.bash` becomes an object (replacing the string)

The string `"ask"` is all-or-nothing and cannot express per-command rules. OpenCode supports per-command rules only via the glob object form, so the value must change type.

**Before** (`opencode.jsonc`, `agent.orchestrator.permission`, line ~136):

```jsonc
"bash": "ask",
```

**After:** see §Exact configuration below.

### D2 — Minimal, explicit allow-list (six rules)

The orchestrator delegates real SCM work to `@git-manager`; it only needs to read status, stage, commit, run openspec, and run gh. Anything else is not auto-approved.

| Pattern           | Covers                                      |
| ----------------- | ------------------------------------------- |
| `openspec *`      | All openspec CLI invocations                |
| `git status`      | Plain status (exact)                        |
| `git diff --stat` | Stat-only diff (exact)                      |
| `git add *`       | `git add .`, `git add -A`, `git add <path>` |
| `git commit *`    | `git commit -m "..."`, etc.                 |
| `gh *`            | All gh CLI invocations                      |

### D3 — Deny-list for destructive/unsafe git

| Pattern                | Covers                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `git push`             | Bare push (exact, defense-in-depth)                           |
| `git push *`           | `push origin main`, `push --force`, `push --force-with-lease` |
| `git commit --amend`   | Bare amend (exact)                                            |
| `git commit --amend *` | `--amend -m "..."`, `--amend --no-edit`                       |
| `git rebase`           | Bare rebase (exact)                                           |
| `git rebase *`         | `rebase --onto`, interactive rebase                           |
| `git * --no-verify*`   | Any git subcommand carrying `--no-verify` (any position)      |
| `git *`                | Catch-all for every other git invocation                      |

`--force`/`--force-with-lease` are covered by `git push *` (and by the `git *` catch-all if invoked under another form). `--no-verify` is detected by substring match in any position of the command.

### D4 — Default unmatched → `ask`

Unknown commands keep prompting, mirroring the previous `"bash": "ask"` behavior for anything not explicitly listed. They are never silently allowed nor silently rejected.

### D5 — Ordering: deny-specifics before overlapping allows (first-match-wins)

Because the first matching rule wins, a deny that overlaps a broader allow **must appear before** that allow, otherwise the allow swallows it. Concretely:

- `git commit --amend` / `git commit --amend *` deny **before** `git commit *` allow, otherwise `git commit --amend -m "x"` matches the allow and runs.
- `git * --no-verify*` deny **before** `git commit *` / `git add *` allow.
- `git push*` deny before `*` ask (grouped for clarity; no overlap with allows).

This deliberately refines the proposal's literal list order ("allow first, then deny"), which would defeat the amend/no-verify denies under first-match-wins semantics. The proposal's intent (deny destructive ops) is preserved; only the ordering is corrected for correctness.

### D6 — Exact (no-wildcard) variants included for defense-in-depth

A pattern such as `git push *` requires a trailing space + content, so a bare `git push` would not match it and would fall through to the `git *` deny (correct, but dependent on catch-all placement). Adding the exact variants (`git push`, `git commit --amend`, `git rebase`) removes that dependency. Same for amend and rebase.

## Exact permission.bash configuration (copy-paste ready)

```jsonc
"bash": {
  "git push": "deny",
  "git push *": "deny",
  "git commit --amend": "deny",
  "git commit --amend *": "deny",
  "git rebase": "deny",
  "git rebase *": "deny",
  "git * --no-verify*": "deny",
  "openspec *": "allow",
  "git status": "allow",
  "git diff --stat": "allow",
  "git add *": "allow",
  "git commit *": "allow",
  "gh *": "allow",
  "git *": "deny",
  "*": "ask"
}
```

Diff against `opencode.jsonc` (replaces line ~136 `"bash": "ask",`):

```diff
-         "bash": "ask",
+         "bash": {
+           "git push": "deny",
+           "git push *": "deny",
+           "git commit --amend": "deny",
+           "git commit --amend *": "deny",
+           "git rebase": "deny",
+           "git rebase *": "deny",
+           "git * --no-verify*": "deny",
+           "openspec *": "allow",
+           "git status": "allow",
+           "git diff --stat": "allow",
+           "git add *": "allow",
+           "git commit *": "allow",
+           "gh *": "allow",
+           "git *": "deny",
+           "*": "ask"
+         },
```

## Verification of pattern syntax against OpenCode permissions docs

Verified against `docs/opencode/opencode-guide.md`:

- §3.4 — `permission.bash` accepts `allow/deny/ask/auto` or a glob object `{"git *": "allow", "*": "deny"}`. Object form used here. OK.
- §8.1 — keys are glob patterns matched against the full command string; `*` is the catch-all. All keys are globs. OK.
- §8.2 — states `allow`/`deny`/`ask`/`auto` are valid. Only `allow`/`deny`/`ask` used. OK.
- First matching rule wins (proposal + guide example ordering). Deny-specifics ordered before overlapping allows (D5). OK.

Match matrix (command → first matching pattern → outcome):

| Command                         | First match            | Outcome |
| ------------------------------- | ---------------------- | ------- |
| `git status`                    | `git status`           | allow   |
| `git diff --stat`               | `git diff --stat`      | allow   |
| `git add .`                     | `git add *`            | allow   |
| `git commit -m "feat: x"`       | `git commit *`         | allow   |
| `openspec validate foo`         | `openspec *`           | allow   |
| `gh issue list`                 | `gh *`                 | allow   |
| `git push`                      | `git push`             | deny    |
| `git push origin main`          | `git push *`           | deny    |
| `git push --force`              | `git push *`           | deny    |
| `git push --force-with-lease`   | `git push *`           | deny    |
| `git commit --amend`            | `git commit --amend`   | deny    |
| `git commit --amend -m "x"`     | `git commit --amend *` | deny    |
| `git rebase main`               | `git rebase *`         | deny    |
| `git commit -m "x" --no-verify` | `git * --no-verify*`   | deny    |
| `git push --no-verify`          | `git push *`           | deny    |
| `git log --oneline`             | `git *`                | deny    |
| `npm install`                   | `*`                    | ask     |
| `node --version`                | `*`                    | ask     |

Note: `git push --no-verify` matches `git push *` first (position 2) and is still denied. No case falls through to allow.

## Risks / Trade-offs

- [Risk] Pattern syntax error leaves a destructive op allowed → Mitigation: verify against guide §8.1/§8.2 (done above) and run `openspec validate git-permissions-hardening` plus a smoke test after applying.
- [Risk] Over-blocking legitimate git subcommands (e.g. `git log`, `git diff` without `--stat`) → Mitigation: default unmatched is `ask`, not `deny`, and the orchestrator delegates real SCM to `@git-manager`; only the catch-all `git *` denies, which is intended.
- [Risk] `git -C <dir> status` does not match `git status` and is denied by `git *` → Mitigation: orchestrator operates in repo root; if subdirectory git is needed, delegate to `@git-manager` (which retains full git allow).
- [Risk] JSONC edit could introduce syntax errors → Mitigation: validate with `opencode debug config` / OpenCode startup; diff review before commit.
- [Risk] `*` glob semantics for multi-word commands → Mitigation: guide example confirms `"git *"` matches full command strings like `git commit -m "x"`; verified in match matrix.

## Migration Plan

1. Edit `opencode.jsonc`: replace `"bash": "ask",` in `agent.orchestrator.permission` with the object from §Exact configuration.
2. Validate JSONC parses (`opencode debug config` exits 0).
3. Smoke test:
   - Safe commands (`git status`, `git diff --stat`, `git add .`, `git commit -m "test"`, `gh issue list`, `openspec validate ...`) run without an approval prompt.
   - Destructive commands (`git push`, `git commit --amend`, `git rebase`, `git commit --no-verify`, `git push --force`) are denied.
   - Unmatched commands (`npm install`, `node --version`) prompt for approval.
4. Commit with Conventional Commits: `feat(permissions): add bash permission patterns to orchestrator agent`.
5. Rollback: revert the single-file change (restore `"bash": "ask"`).

## Open Questions

None. All decisions are fully specified by the proposal plus the first-match-wins correction documented in D5. No deferrable unknowns remain.
