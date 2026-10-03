# Tasks

## 1. Command File Scaffold

- [x] 1.1 Create `.opencode/command/push-pr.md` with YAML frontmatter containing a non-empty `description:` and verify the file exists with frontmatter present (first lines match `---` / `description: ...`)
- [x] 1.2 Add the invocation header text ("Push current branch and open a PR to `main`" + `Optional title override: $ARGUMENTS`) and verify it appears above the Rules section
- [x] 1.3 Add the inherited safety rules block (`--no-verify` forbidden, amend forbidden, hooks bypass forbidden, force-push forbidden, no commits created) and verify each rule line is present verbatim

## 2. Inspection and Abort Preconditions

- [x] 2.1 Add the inspection step (`git status --short`, `git branch --show-current`, `git log --oneline origin/main..HEAD` after `git fetch origin main`) and verify all four commands are listed, with `git fetch origin main` BEFORE `git log --oneline origin/main..HEAD`
- [x] 2.2 Add abort-on-`main` condition (HEAD == `main` → stop with message) and verify the branch check appears before any push step
- [x] 2.3 Add abort-on-zero-commits condition (`origin/main..HEAD` empty → stop with message) and verify the commit-count check references `git log --oneline origin/main..HEAD` computed after the fetch
- [x] 2.4 Add abort-on-dirty condition (`git status --short` non-empty → stop, suggest `/commit-all`) and verify it precedes the PR check step

## 3. Existing PR Detection and Push

- [x] 3.1 Add existing-PR detection via `gh pr view --json url,state` and verify the branch states: only an `open` PR blocks creation (push only + report URL, do not create another); a `closed`/`merged` PR for the branch → push and create a NEW PR
- [x] 3.2 Add the push step `git push -u origin HEAD` and verify it appears only after all abort conditions and the PR check
- [x] 3.3 Elevate push-failure handling: add the stop condition (non-fast-forward rejection or `origin` unreachable -> stop, print push error verbatim, no PR created, NO force-push) to `.opencode/command/push-pr.md` AND to `specs/local-push-pr/spec.md` as a scenario; verify no git command in the command file uses a force-push flag (`--force`, `-f`, `--force-with-lease`), and that the spec/tasks mention those flags only in prose stating they are forbidden
- [x] 3.4 Add `gh` failure handling to the command file (ONLY the `gh` "no pull requests found" message means "no PR exists"; any other `gh pr view` failure — uninstalled, unauthenticated, network — → run `gh auth status` and abort with an actionable error BEFORE the push step) and verify the abort precedes task 3.2's push step

## 4. Title Derivation and Validation

- [x] 4.1 Add title precedence rule (`$ARGUMENTS` if non-empty, else subject of the MOST RECENT commit — first line of `git log --oneline origin/main..HEAD`, newest-first) and verify both branches are described
- [x] 4.2 Add validation step `npm run pr:title-check -- "<title>"` with abort-on-invalid behavior and verify the abort message instructs fixing the title or commit message
- [x] 4.3 Cross-check the allowed types/lowercase-subject rule reference against `.github/workflows/ci.yml` job `pr-title-lint` (line 349) and verify consistency (no listed type missing from CI)

## 5. PR Body and Creation

- [x] 5.1 Add body construction from `.github/PULL_REQUEST_TEMPLATE.md` plus appended commit list (`git log --oneline origin/main..HEAD`, hash + subject) and verify both parts are required in the body
- [x] 5.2 Add creation step `gh pr create --base main --title "<title>" --body-file "<path>"` and verify (a) `--base main` is explicit, (b) the body built in 5.1 is passed via `--body-file "<path>"` and NOT inline `--body` (Windows quoting), and (c) the body contains the template sections plus the commit list
- [x] 5.3 Add final reporting step that outputs the PR URL (new or existing) and verify the report step is last in the flow

## 6. Verification

- [x] 6.1 Dry-run the abort paths on a scratch branch (on `main`, 0 commits ahead, dirty tree) and verify each aborts with its specific message and performs no push — static check executed 2026-10-03 (dynamic push/PR run prohibited by delegation)
- [x] 6.2 Verify idempotency: run the command twice against a branch with an open PR and verify the second run reports the existing URL without `gh pr create`; also verify a `closed`/`merged` PR for the branch triggers a NEW PR creation — static check of command flow executed 2026-10-03 (dynamic run prohibited by delegation)
- [x] 6.3 Verify title flow end-to-end: invalid `$ARGUMENTS` title aborts with `pr-title-check` error; valid derived title from the most recent `origin/main..HEAD` commit passes — executed 2026-10-03: valid argument title, invalid title, and derived latest-commit subject all verified live
- [x] 6.4 Run `openspec validate push-pr --strict` and verify the change passes with zero errors — executed 2026-10-03 (zero errors)
- [x] 6.5 Verify `gh` failure handling: with `gh` uninstalled or `gh auth status` failing, verify the command aborts with an actionable message BEFORE pushing and never treats the failure as "no PR exists" (only the "no pull requests found" text continues the flow) — static check executed 2026-10-03 (no gh invocation permitted)
- [x] 6.6 On win32, verify multi-word title quoting end-to-end: a multi-word title survives as a single argument through `npm run pr:title-check -- "<title>"` and then through `gh pr create` (or `npm run pr:create`), with the PR created with the full intact title — executed 2026-10-03 on win32: title-check leg verified live; `gh pr create` leg verified statically (network-mutating run prohibited)
