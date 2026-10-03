---
description: Push current branch and open a PR to main with a validated Conventional Commits title
---

Push current branch and open a PR to `main`.

Optional title override: `$ARGUMENTS`

Rules:

- This command NEVER creates commits. It only pushes existing commits and opens a PR. Commit creation stays in `/commit-all`.
- Do not use `--no-verify` on any git command.
- Do not amend commits. Do not reword commits.
- Do not bypass repository protections: no hook skipping, no protection bypass, no force-push.
- Force-push is forbidden anywhere in this flow (`--force`, `-f`, `--force-with-lease`, or any equivalent flag SHALL NOT be used; they are named here only to forbid them).
- Do not revert existing changes.

Flow:

1. Inspect repository state first (refresh remote state BEFORE computing the range):
   - `git fetch origin main` (refreshes `refs/remotes/origin/main`, NOT local `main`; if it exits non-zero → abort here, print the fetch error verbatim, do NOT push)
   - `git branch --show-current`
   - `git status --short`
   - `git log --oneline origin/main..HEAD` (computed AFTER the fetch; newest-first ordering)

2. Abort before any push or PR creation when any precondition fails (report which one):
   - Current branch is `main` → stop. Report that PRs must not be opened from `main`.
   - Zero commits in `origin/main..HEAD` (range computed after the fetch) → stop. Report that there are no new commits ahead of `main`.
   - `git status --short` outputs at least one line (dirty working directory) → stop. Report the working directory is dirty and suggest running `/commit-all` first.

3. Check for an existing PR AND gate `gh` availability BEFORE pushing:
   - Run `gh pr view --json url,state` for the current branch.
   - Disambiguation is output-text based over COMBINED stdout AND stderr: ONLY output containing `gh`'s exact phrase `no pull requests found for branch` together with the current branch name means "no PR exists" (`gh` prints to stderr; wording varies by version) → continue to step 4 (push) and proceed through steps 5-7 (derive title, validate title, create PR).
   - If `gh pr view` returns a PR in `open` state → push the branch with `git push -u origin HEAD`, report the existing PR URL from `gh pr view --json url,state`, then SKIP to step 8 (report) — do NOT run steps 4-7 (never create a duplicate PR).
   - If `gh pr view` returns a PR in `closed` or `merged` state → push is allowed — continue to step 4 and proceed through steps 5-7 (derive title, validate, create NEW PR). A closed/merged PR does not count as the branch's PR. Title MUST be validated before any `gh pr create`.
   - If `gh pr view` fails for ANY other reason (`gh` not installed, not authenticated, network unreachable — anything that is not the exact phrase `no pull requests found for branch` + current branch name (checked in COMBINED stdout+stderr)) → run `gh auth status` for diagnosis, abort BEFORE pushing with an actionable error (install the GitHub CLI / run `gh auth login` plus the `gh auth status` output), and NEVER treat the failure as "no PR exists".

4. Push the current branch with upstream tracking (only after all abort conditions in step 2 and the PR/`gh` gate in step 3 have passed):
   - `git push -u origin HEAD`
   - If `git push -u origin HEAD` fails (non-fast-forward rejection or `origin` unreachable) → stop, print the push error verbatim, do NOT create a PR, and do NOT force-push.

5. Derive the PR title:
   - If `$ARGUMENTS` is non-empty (e.g. `/push-pr feat: add push command`) → the title is `$ARGUMENTS` verbatim.
   - Otherwise → the title is the subject of the MOST RECENT commit in `origin/main..HEAD`, i.e. the first line (newest-first) of `git log --oneline origin/main..HEAD`, with the leading short hash stripped (`<short-hash> <subject>` → subject only; e.g. `<hash> fix: handle empty branch` → title `fix: handle empty branch`).
   - Allowed types (mirrors CI job `pr-title-lint` in `.github/workflows/ci.yml`): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `ops`. Scope is optional (`type: desc` or `type(scope): desc`). Subject must not start with an uppercase letter (`^(?![A-Z]).+$`).

6. Validate the title before creating the PR:
   - From the repository root: `npm run pr:title-check -- "<title>"` (the script lives only in the root `package.json`, so it fails from a workspace subdir; quote the multi-word title so it survives as a single argument, including on Windows).
   - If validation fails → abort without creating the PR and report the title-check error message (fix the title via `$ARGUMENTS` or fix the commit message — amend is forbidden, so use a fresh commit via `/commit-all`).
   - Note: the branch is already pushed at this point by design; a title failure leaves a pushed branch without a PR — recover by re-running the command with a valid title.

7. Build the PR body and create the PR:
   - Read the contents of `.github/PULL_REQUEST_TEMPLATE.md` (if the file is absent, degrade to the commit list alone and report it).
   - Append the list of new commits in `origin/main..HEAD` as short hash plus subject lines (`git log --oneline origin/main..HEAD`).
   - Write the combined body (template sections followed by the commit list) to a temp file.
   - Create the PR with `gh pr create --base main --title "<title>" --body-file "<path>"` — `--base main` is explicit, the body is passed via `--body-file "<path>"` (quoted — temp path may contain spaces on win32) and NOT inline `--body` so multi-line content survives shell quoting on Windows. Quote the multi-word `--title` value so it survives as a single argument.

8. Report the resulting PR URL (last step):
   - New PR → report the URL printed by `gh pr create`.
   - Existing open PR (step 3) → report the URL returned by `gh pr view --json url,state`.
