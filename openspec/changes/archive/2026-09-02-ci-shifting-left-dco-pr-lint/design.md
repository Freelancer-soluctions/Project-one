## Context

Current git hooks (Husky v9):

- `commit-msg`: runs `npx --no -- commitlint --edit "$1"` — validates Conventional Commits only
- `pre-push`: fetches `origin/main`, runs `vitest run --changed` for server + client — regression tests only

CI (L3) enforces DCO via `KineticCafe/actions-dco@v3.2.0` and PR-title via `amannn/action-semantic-pull-request@v6`. Both are non-bypassable ruleset checks. This change adds local-layer (L1/L2) validation for fast feedback without altering CI behavior.

Additionally, the `/commit-all` slash command (driven by @git-manager system prompt at `docs/opencode/prompts/git-manager.md`) must produce DCO-compliant commits. There is NO separate `.opencode/command/commit-all.md` file — `/commit-all` behavior is defined entirely in the git-manager prompt. The chosen materialization is a prompt-level behavioral rule, not a script wrapper.

## Goals / Non-Goals

**Goals:**

- Catch missing `Signed-off-by` trailers at commit-time (L1) and push-time (L2) — before CI
- Provide local PR title validation (L2.5 wrapper) before `gh pr create`
- Ensure `/commit-all` produces DCO-compliant commits via prompt-level rule (defense-in-depth)
- Preserve all existing hook behavior (commitlint, vitest)
- Win32/Git Bash compatible (no bash-specific features beyond what Husky v9 provides)

**Non-Goals:**

- Changing CI DCO or pr-title-lint behavior (CI remains the final non-bypassable enforcer)
- Implementing a full GPG signature verification locally (that is CI job via `verify-signatures`)
- Replacing commitlint — DCO check is additive, runs before commitlint
- Shifting PR-title validation to commit-time (PR titles do not exist at commit time — honest L2.5 only)
- Creating a script wrapper for `/commit-all` (prompt-level rule is sufficient and minimal)

## Decisions

### 1. DCO check: `grep` for `Signed-off-by:` — NOT `git interpret-trailers`

**Chosen:** Literal `grep` matching `Signed-off-by:` in the commit message file.

**Alternative considered:** `git interpret-trailers --parse` — parses structured trailers properly but requires Git >=2.23 and adds complexity. The DCO check is a fast first-pass; CI KineticCafe action does the authoritative parse.

**Rationale:** `grep` is universally available, zero-dependency, and sufficient for the "is the trailer present?" question. Case-sensitive exact match matches CI strict parsing. The local hook does a full-message grep for presence (NOT position/trailer-section constrained); this is intentionally relaxed compared to CI KineticCafe strict parser, which remains the authoritative enforcer of trailer position and format. False positive risk is negligible since developers do not typically write `Signed-off-by:` in the body.

### 2. Pre-push DCO: read refs from STDIN, iterate commits via `git log --format`

**Chosen:** The pre-push hook reads refs from **STDIN** (each line: `<local-ref> <local-sha> <remote-ref> <remote-sha>`). For each pushed ref:

- Skip `(delete)` pushes (remote-sha equals `(delete)`) — nothing was pushed, DCO not applicable.
- Skip **initial/first-push** to a new branch when remote-sha is all-zeros (`0000...`): the remote ref does not exist yet, so `git log "$REMOTE_REF..$LOCAL_REF"` would error (bad revision). Fall back to iterating `origin/main..HEAD --no-merges` (covers all new branch commits up to the merge-base), or skip and let CI validate if `origin/main` is unavailable.
- Otherwise iterate `git log --no-merges --format="%H" "$REMOTE_REF..$LOCAL_REF"`, then `git log -1 --format="%B" $SHA | grep "Signed-off-by:"` per commit.

**Alternative considered:** Single `git log --format` with combined grep — harder to identify which specific commit failed. Also considered hardcoding `origin/main..HEAD` (like the existing vitest step) — simpler but does not cover partial pushes to a branch already tracking a remote.

**Rationale:** Reading STDIN is how the pre-push hook actually receives pushed refs (Git passes them on stdin, not as shell args) — the previous draft referenced `$REMOTE_REF`/`$LOCAL_REF` without sourcing them. Per-commit iteration provides actionable error messages ("commit abc123 is missing Signed-off-by"). Skipping deletion and null-SHA first pushes avoids false failures. The performance cost is negligible for typical push sizes (<50 commits).

> **Ordering dependency (verified):** the null-SHA first-push fallback (`origin/main..HEAD --no-merges`) depends on `origin/main` being fetched BEFORE the DCO section runs. The existing `.husky/pre-push` already runs `git fetch origin main --depth=1` at the top (line 6) before vitest. Per Decision 5, DCO re-check runs before vitest but AFTER this fetch step — so the fallback resolves correctly. Do NOT move the DCO section above the fetch.

### 3. PR title check: standalone Node script, NOT a git hook

**Chosen:** `scripts/hooks/pr-title-check.mjs` — invoked via `npm run pr:create` wrapper, NOT as a commit-msg hook.

**Rationale:** PR titles do not exist at commit time. This is an honest L2.5 wrapper: a convenience script that validates before `gh pr create`. CI remains the enforcer. Making it a commit hook would be architecturally dishonest (cannot validate what does not exist yet).

### 4. Merge commit skip pattern

**Chosen:** Skip DCO for commits where the first line matches merge commit pattern (`^Merge `) OR when `--no-merges` flag handles it in pre-push.

**Rationale:** Merge commits from GitHub do not carry individual `Signed-off-by` trailers. The `--no-merges` flag in pre-push handles this cleanly. In commit-msg, the `^Merge` pattern check is a safety net. Note: this pattern also covers the case where a merge commit is itself the target being processed (not just its parents) — low-impact since merge commits never carry signoff.

### 5. Hook placement: DCO BEFORE commitlint, DCO BEFORE vitest

**Chosen:** DCO validation runs first in both hooks. If DCO fails, downstream tools (commitlint, vitest) are skipped.

**Rationale:** Fail fast. If the commit is missing DCO, there is no value in running commitlint or vitest. Also prevents developer confusion from multiple simultaneous errors.

### 6. `git config commit.signoff true` recommendation, NOT enforcement

**Chosen:** Document recommendation in CONTRIBUTING.md. Do NOT auto-set in hooks (would silently modify user git config).

**Rationale:** Auto-modifying global git config is intrusive. Developer awareness via docs is the right approach; the hook catches misses.

### 7. /commit-all DCO rule lives in git-manager prompt, documented not scripted

**Chosen:** The DCO rule for `/commit-all` lives in TWO materialization points (defense-in-depth): (a) a behavioral rule in `docs/opencode/prompts/git-manager.md` (the system prompt that defines `/commit-all` behavior) requiring `git commit -S -s` for KineticCafe-compliant `Signed-off-by` trailers, and (b) the slash command file `.opencode/command/commit-all.md`, which DOES exist and contains the same `git commit -S -s` DCO rule (added 2026-09-02). NO standalone script, NO wrapper.

> **Traceability note (post-implementation correction):** The original design stated "NO `.opencode/command/commit-all.md` file (verified: glob found no such file)". That verification was a **false negative** — the glob tool did not match hidden `.opencode` paths on Windows; the file existed (verified via `read`, 75 lines, containing the `-S -s` rule). The real gap was that the command file lacked the DCO trailer rule, which was fixed on 2026-09-02. Canonical record: `docs/CONTEXT-CICD.md` §10.4 (two materialization points) and §10.5 (auto-signoff convention).

**Alternative considered:** A shell script wrapper (`scripts/hooks/commit-all.sh`) that wraps `git commit` with forced `-s` flag — rejected because: (a) more surface area to maintain, (b) `git-manager.md` and `.opencode/command/commit-all.md` already define the commit behavior, (c) a prompt/command rule is sufficient since `git commit -m` is the base operation and adding `-s` is a single flag change, (d) the rule is self-documenting in both the prompt and the command file.

**Rationale:** `/commit-all` behavior is materialized as a prompt-level and command-level behavioral rule: "ALWAYS use `git commit -S -s`" (SSH sign + signoff). This is defense-in-depth: even though `git config commit.signoff true` makes `-s` automatic, the config may be absent on other machines, fresh clones, or CI runners. The explicit flag ensures KineticCafe DCO compliance (`Signed-off-by: Name <email>`, case-sensitive, matching author/committer identity) regardless of local git config. Minimal surface: one rule addition to existing prompt and command file, no new files or dependencies.

**Goal:** Ensure `/commit-all` produces DCO-compliant commits as defense-in-depth against absent auto-signoff config.

**Non-Goal:** Creating a separate script or hook for `/commit-all` — the prompt rule is sufficient and minimal.

## Risks / Trade-offs

- **[Greedy grep false positive]** -- grep Signed-off-by could match text in commit body. Mitigation: extremely rare in practice; CI KineticCafe is the authoritative check. The local check is explicitly a fast first-pass, not a replacement.
- **[Git Bash compat on Windows]** -- git log with --format works in Git Bash on Win32. Mitigation: tested with Husky v9 shell execution on Windows. No bash-specific features beyond basic shell.
- **[Performance on large pushes]** -- Per-commit iteration could be slow for very large pushes (>100 commits). Mitigation: typical pushes are small; the check is O(n) grep calls, each <1ms. Acceptable trade-off for catching DCO issues early.
- **[PR title check drift from CI]** -- The local script could drift from ci.yml config over time. Mitigation: both are simple type lists + regex. Document the canonical source (ci.yml pr-title-lint) in the script header comment. Low risk of divergent evolution.
- **[Prompt rule drift from CI DCO]** -- The git-manager prompt rule for -s flag could become stale if CI KineticCafe format changes. Mitigation: the rule references ci.yml DCO config as the canonical source; any CI format change would require updating both the prompt rule and CI. Low risk: KineticCafe format is stable and well-defined, and git-manager.md explicitly cross-references ci.yml as authoritative.
