## 1. Commit-msg DCO Check

- [x] 1.1 Add DCO validation to `.husky/commit-msg` BEFORE existing commitlint — NOTE: the file is currently a bare single line (no shebang/`set -e`), so convert it to a proper multi-line shell script with `#!/bin/sh` + `set -e`; then add DCO grep for `Signed-off-by:` (case-sensitive), skip merge commits (`^Merge` pattern), reject with actionable message if missing; commitlint must still run as the final step
- [x] 1.2 Verify commit-msg hook works: test with signed-off commit (passes), test without signoff (rejected), test merge commit (skipped), test commitlint still runs after DCO passes

## 2. Pre-push DCO Re-check

- [x] 2.1 Add DCO re-check to `.husky/pre-push` BEFORE existing vitest — read each pushed ref from STDIN (`<local-ref> <local-sha> <remote-ref> <remote-sha>`), skip `(delete)` pushes and all-zeros first-push (null-SHA new branch → fall back to `origin/main..HEAD --no-merges`), iterate `$REMOTE_REF..$LOCAL_REF` commits via `git log --no-merges`, grep each for `Signed-off-by:`, reject with per-commit error listing if any fail
- [x] 2.2 Verify pre-push hook works: test with all commits signed-off (passes + vitest runs), test with one unsigned commit (rejected, vitest skipped)

## 3. PR Title Check Script

- [x] 3.1 Create `scripts/hooks/pr-title-check.mjs` — first ensure directory exists (`mkdir -p scripts/hooks`), then validate PR title against Conventional Commits types `[feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert,ops]` + `subjectPattern: ^(?![A-Z]).+$`, accept title as CLI arg or stdin, emit actionable error with example on failure
- [x] 3.2 Verify script works: test valid title (exit 0), invalid type (exit non-zero), uppercase subject (exit non-zero), scope optional, stdin pipe

## 4. Package.json Scripts

- [x] 4.1 Add `"pr:title-check": "node scripts/hooks/pr-title-check.mjs"` and `"pr:create": "PR_TITLE=$(echo \"$@\" | sed -n 's/.*--title \\([^ ]*\\)/\\1/p'); node scripts/hooks/pr-title-check.mjs \"$PR_TITLE\" && gh pr create \"$@\""` to `package.json` scripts — extracting the `--title` value, validating it via `pr:title-check`, then forwarding ALL original args (including `--body`) to `gh pr create` (matches the spec's `--title`/`--body` invocation pattern)
- [x] 4.2 Verify `npm run pr:create -- --title "feat: test"` invokes validation then `gh pr create`

## 5. Documentation

- [x] 5.1 Update `CONTRIBUTING.md` — document `git commit -S -s` convention (both flags: sign + signoff), recommend `git config --global commit.signoff true`, document `npm run pr:create` workflow, AND add `ops` to the Commit Guidelines types list (currently `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert` — missing `ops` which exists in ci.yml)
- [x] 5.2 Update `docs/CONTEXT-CICD.md` — §10.1 hooks TABLE gains DCO columns for `commit-msg` (presence check) + `pre-push` (DCO re-check); add NEW §10.3 subsection for commit-msg/pre-push DCO mechanism detail (NOT §10.2, which covers pre-commit only); perform the SINGLE coherent §11.1 3-layer table update: L1 gains DCO presence, L2 gains DCO re-check, NEW L2.5 row for PR-title wrapper. Do NOT bump header verification date here — that is done once in task 7.3 (the final doc task).

## 6. /commit-all DCO adjustment (git-manager prompt)

- [x] 6.1 Edit `docs/opencode/prompts/git-manager.md` — add behavioral rule under "Behavioral Rules" section requiring `/commit-all` to ALWAYS use `git commit -s` (signoff flag) so every commit includes a `Signed-off-by: Name <email>` trailer matching KineticCafe DCO format (`Signed-off-by:` case-sensitive exact match, trailer matches author/committer identity). Rule MUST reference KineticCafe DCO format and state that `-s` is non-optional even when `git config commit.signoff true` is set (defense-in-depth). Also require `-S` flag (SSH signing) per existing repo convention.
- [x] 6.2 Verify rule wording is consistent with KineticCafe DCO format (`Signed-off-by: Name <email>`, case-sensitive) and cross-references `docs/CONTEXT-CICD.md` §11 shifting-left layer (the rule is a local-layer defense-in-depth complement to CI enforcement)

## 7. Related docs update

- [x] 7.1 Update `docs/learning/ci-cd/01-git-y-yaml.md` — add DCO/signed-commit content: document auto-signoff via `git config --global commit.signoff true`, explain `git commit -S -s` flags (SSH sign + signoff), describe KineticCafe trailer format (`Signed-off-by: Name <email>`), cross-reference local hooks (commit-msg DCO check) and `/commit-all` git-manager rule
- [x] 7.2 Update `docs/learning/ci-cd/05e-pr-metadata-governance.md` — add cross-references to the new local DCO hooks (commit-msg + pre-push re-check from capabilities 1-2) and the `/commit-all` git-manager DCO rule (capability 3); note that DCO is enforced at 3 layers: local hooks (L1/L2), `/commit-all` prompt rule, and CI KineticCafe (L3)
- [x] 7.3 Update `docs/CONTEXT-CICD.md` — add NEW §10.4 subsection documenting the `/commit-all` DCO adjustment (git-manager prompt rule requiring `git commit -s` for KineticCafe DCO compliance). NOTE: §10.3 is created by task 5.2 for the hook mechanism detail; §10.4 is a SEPARATE subsection for the /commit-all prompt rule (do NOT overwrite §10.3). AUGMENT the §11.1 L1 row already updated by task 5.2 to additionally mention auto-signoff config (`git config commit.signoff true`) + the `/commit-all` prompt rule as defense-in-depth (single coherent row, extend 5.2's content, don't reintroduce the row). Bump the header verification date here (once, in this final doc task).
