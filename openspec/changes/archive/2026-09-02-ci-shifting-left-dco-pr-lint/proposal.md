## Why

DCO (`Signed-off-by`) and PR-title-lint are currently enforced ONLY at CI (L3), causing slow feedback loops. A developer discovers DCO/PR-title failure minutes after push — a wasted CI round-trip. Recently observed: PR failing DCO because commits missing `Signed-off-by` trailer, caught only after CI run. Shift validation to local git hooks for instant feedback; CI stays as final non-bypassable enforcement. Additionally, the `/commit-all` slash command (driven by @git-manager's system prompt) must also produce DCO-compliant commits as defense-in-depth — `git config commit.signoff true` is not guaranteed across all machines/CI runners.

## What Changes

1. **`.husky/commit-msg`** — Add DCO check (`grep` for `Signed-off-by: Name <email>`, presence anywhere in message) BEFORE existing commitlint. Skip merge commits. Position/trailer-section is NOT enforced locally (CI's KineticCafe strict parser is the authoritative enforcer).
2. **`.husky/pre-push`** — Add DCO re-check over pushed commits read from STDIN (`$REMOTE_REF..$LOCAL_REF`, `--no-merges`, skip deletion/null-SHA first-push) BEFORE existing vitest scoped regression tests.
3. **`scripts/hooks/pr-title-check.mjs`** — NEW Node script validating PR title against Conventional Commits types `[feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert,ops]` + `subjectPattern: ^(?![A-Z]).+$` (mirror of ci.yml pr-title-lint config).
4. **`package.json`** — Add scripts `pr:create` (validates title then `gh pr create`) + `pr:title-check`.
5. **`CONTRIBUTING.md`** — Document `git commit -S -s` convention + `npm run pr:create` workflow.
6. **`docs/CONTEXT-CICD.md`** — Update §10.1 hooks table (commit-msg gains DCO, pre-push gains DCO re-check), §10.2 mechanism detail, §11.1 3-layer table (L1 gains DCO, L2 gains DCO re-check, NEW L2.5 row for PR-title wrapper). Bump header verification date.
7. **`docs/opencode/prompts/git-manager.md`** — Add behavioral rule under "Behavioral Rules" requiring `/commit-all` to ALWAYS use `git commit -s` (signoff flag) so commits include a `Signed-off-by: Name <email>` trailer matching KineticCafe DCO format. Defense-in-depth: even if `git config commit.signoff true` is set, the rule ensures the flag is explicit. **NOT a script wrapper** — materialized as a prompt-level instruction.
8. **Docs (3 files)** — Update `docs/learning/ci-cd/01-git-y-yaml.md` (add DCO/signed-commit content: auto-signoff config, `git commit -S -s`, KineticCafe trailer format), `docs/learning/ci-cd/05e-pr-metadata-governance.md` (add cross-reference to new local DCO hooks + `/commit-all` rule), `docs/CONTEXT-CICD.md` (add §10.3 for `/commit-all` adjustment, update §11.1 L1 to mention auto-signoff + `/commit-all` rule).

## Capabilities

### New Capabilities

- `local-dco-validation`: Local DCO trailer validation in commit-msg and pre-push hooks — fast first-pass `Signed-off-by` check catching missing trailers before push, complementing CI's KineticCafe enforcement.
- `local-pr-title-check`: Local PR title validation wrapper — Node script mirroring ci.yml `pr-title-lint` config, invoked via `npm run pr:create` before `gh pr create`, providing instant feedback on PR title Conventional Commits compliance.
- `local-commit-all-dco`: `/commit-all` DCO adjustment via git-manager prompt rule — behavioral instruction in `docs/opencode/prompts/git-manager.md` requiring `git commit -s` for KineticCafe-compliant `Signed-off-by` trailers on every commit, defense-in-depth against absent auto-signoff config.

### Modified Capabilities

_(None — CI behavior is unchanged; this change adds local-layer capabilities only.)_

## Impact

**Files modified:**

- `.husky/commit-msg` — DCO check added before commitlint
- `.husky/pre-push` — DCO re-check added before vitest
- `package.json` — new scripts `pr:create`, `pr:title-check`
- `docs/opencode/prompts/git-manager.md` — new behavioral rule for DCO/KineticCafe commit trailer

**Files created:**

- `scripts/hooks/pr-title-check.mjs` — PR title validation script

**Docs updated:**

- `CONTRIBUTING.md` — signing/signoff convention + pr:create workflow
- `docs/CONTEXT-CICD.md` — §10/§11 updates for shifted-left hooks + §10.3 for `/commit-all` adjustment
- `docs/learning/ci-cd/01-git-y-yaml.md` — DCO/signed-commit content (auto-signoff, `-S -s`, KineticCafe format)
- `docs/learning/ci-cd/05e-pr-metadata-governance.md` — cross-references to local DCO hooks + `/commit-all` rule

**Dependencies:** None new — uses only `grep`, Node.js (already available), and `gh` CLI (already in use).

**Breaking changes:** None — hooks are additive; existing `commit-msg` (commitlint) and `pre-push` (vitest) behavior preserved.
