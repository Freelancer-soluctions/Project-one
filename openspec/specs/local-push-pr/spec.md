# local-push-pr Specification

## Purpose

The `/push-pr` slash command pushes the current branch to `origin` and opens a pull request to `main` with a Conventional Commits-compliant title, enforcing Trunk-Based Development preconditions and never creating duplicate PRs or commits.

## Requirements

### Requirement: Command refuses to run on main, with no new commits, or with a dirty working directory

The `/push-pr` command SHALL inspect repository state first — running `git fetch origin main` to refresh `refs/remotes/origin/main` (the remote-tracking ref, NOT the local `main` ref) BEFORE computing any commit range, then `git status --short`, `git branch --show-current`, and `git log --oneline origin/main..HEAD` — and SHALL abort before pushing or creating a PR when any of the following holds: the current branch is `main`, there are zero commits in `origin/main..HEAD`, or `git status --short` reports a non-empty working directory. The commit range SHALL always be `origin/main..HEAD` (never `main..HEAD`), so it reflects the state of `origin/main` regardless of a stale or absent local `main`. If `git fetch origin main` fails (for example, `origin` unreachable), the command SHALL abort at the inspection step, print the fetch error verbatim, and SHALL NOT attempt a push. On abort it SHALL report which precondition failed.

#### Scenario: Run while on main

- **WHEN** the current branch is `main`
- **THEN** the command SHALL abort without pushing or creating a PR and report that PRs must not be opened from `main`

#### Scenario: No commits ahead of main

- **WHEN** the current branch is not `main` but `origin/main..HEAD` contains zero commits
- **THEN** the command SHALL abort without pushing or creating a PR and report that there are no new commits

#### Scenario: Uncommitted changes present

- **WHEN** `git status --short` outputs at least one line
- **THEN** the command SHALL abort without pushing or creating a PR and report the working directory is dirty (suggest `/commit-all` first)

#### Scenario: Stale local main

- **WHEN** the local `main` ref is stale (behind `origin/main`) or absent when the command starts
- **THEN** the command SHALL run `git fetch origin main`, which refreshes `refs/remotes/origin/main` (NOT local `main`), and compute the range as `origin/main..HEAD`, so both the zero-commits abort and the title derivation reflect the remote state regardless of the stale or absent local `main`

#### Scenario: Fetch fails before any push

- **WHEN** `git fetch origin main` exits non-zero (for example, `origin` unreachable)
- **THEN** the command SHALL abort at the inspection step, print the fetch error verbatim, and SHALL NOT attempt a push or PR creation

### Requirement: Existing PR is detected and not duplicated

Before creating a PR, the command SHALL check for an existing pull request for the current branch with `gh pr view --json url,state` BEFORE pushing. Only a PR in `open` state SHALL block creation: the command SHALL push the branch during existing-PR handling, SHALL NOT derive or validate a title, SHALL NOT run `gh pr create`, SHALL skip steps 4-7 (push, derive title, validate title, create PR), and SHALL proceed to step 8 (report the PR URL). A PR in `closed` or `merged` state SHALL NOT block creation: the command SHALL fall through to steps 4-7 — push the branch, derive the title, validate it, and only then create a NEW pull request — and SHALL NOT create a PR inline during existing-PR detection before title validation (title validation precedes any `gh pr create`). When no PR exists, the command SHALL continue to step 4 (push) and proceed through steps 5-7 (derive title, validate title, create PR), then step 8 (report the PR URL).

#### Scenario: PR already open for branch

- **WHEN** `gh pr view --json url,state` returns an open PR for the current branch
- **THEN** the command SHALL push the current branch during existing-PR handling, skip steps 4-7 (the push already happened; no title derivation, no validation, no PR creation), proceed to step 8 to report the existing PR URL from `gh pr view --json url,state`, and SHALL NOT invoke `gh pr create`

#### Scenario: No PR exists yet

- **WHEN** `gh pr view --json url,state` reports no PR for the current branch
- **THEN** the command SHALL continue to step 4 (push), proceed through steps 5-7 (derive title, validate title, create PR), and finish at step 8 (report the PR URL)

#### Scenario: Closed or merged PR exists for branch

- **WHEN** `gh pr view --json url,state` returns a PR in `closed` or `merged` state for the current branch
- **THEN** the command SHALL fall through to steps 4-7 (push, derive title, validate title, create a NEW PR), with title validation completed BEFORE any `gh pr create`, and SHALL NOT treat the closed/merged PR as the branch's PR

### Requirement: gh failures other than "no PR found" abort before pushing

The command SHALL use `gh pr view --json url,state` as both the existing-PR check and the `gh` availability/authentication gate, executed BEFORE `git push -u origin HEAD`. If `gh pr view` fails for any reason other than the "no PR found" outcome (for example: `gh` is not installed, the CLI is not authenticated, or the network is unreachable), the command SHALL abort with an actionable error BEFORE pushing. Disambiguation SHALL be output-text based over the COMBINED stdout AND stderr of `gh pr view`: only output containing the exact phrase `no pull requests found for branch` together with the current branch name SHALL be treated as "no PR exists"; every other failure SHALL run `gh auth status` to produce an actionable diagnosis (install the GitHub CLI / run `gh auth login`) and then abort. An authentication or CLI failure SHALL NEVER be treated as "no PR exists".

#### Scenario: gh missing, unauthenticated, or network failure

- **WHEN** `gh pr view --json url,state` exits non-zero and its combined stdout and stderr do NOT contain the exact phrase `no pull requests found for branch` together with the current branch name (e.g. `gh` uninstalled, `gh auth status` failing, network down)
- **THEN** the command SHALL abort BEFORE running `git push -u origin HEAD`, SHALL print an actionable error including the `gh auth status` result, and SHALL NOT treat the failure as evidence that no PR exists

#### Scenario: gh reports no PR for this branch

- **WHEN** `gh pr view --json url,state` exits non-zero and its combined stdout and stderr contain the exact phrase `no pull requests found for branch` together with the current branch name
- **THEN** the command SHALL treat it as "no PR exists" and continue to the push and title steps

### Requirement: Command pushes the current branch with upstream tracking

The command SHALL push the current branch to `origin` using exactly `git push -u origin HEAD`, setting the upstream to the current branch regardless of branch name. The command SHALL NOT push when any abort precondition has failed. Force-push SHALL be forbidden anywhere in the flow: the command SHALL NOT invoke `git push` with `--force`, `-f`, `--force-with-lease`, or any equivalent force flag. If `git push -u origin HEAD` fails (non-fast-forward rejection or `origin` unreachable), the command SHALL stop, print the push error verbatim, and SHALL NOT create a PR.

#### Scenario: First push of a new branch

- **WHEN** preconditions pass and the branch has no upstream yet
- **THEN** the command SHALL run `git push -u origin HEAD` so the upstream is set

#### Scenario: Subsequent push of an existing branch

- **WHEN** preconditions pass and the branch already has an upstream on `origin`
- **THEN** the command SHALL push the current branch commits to `origin`

#### Scenario: Push fails

- **WHEN** `git push -u origin HEAD` fails (non-fast-forward rejection or `origin` is unreachable)
- **THEN** the command SHALL stop, print the push error verbatim, SHALL NOT force-push, and SHALL NOT run `gh pr create`

### Requirement: PR title is derived from arguments or the most recent new commit and validated before use

The PR title SHALL be `$ARGUMENTS` when the command was invoked with non-empty arguments; otherwise it SHALL be the subject of the MOST RECENT commit in `origin/main..HEAD`, i.e. the first line of `git log --oneline origin/main..HEAD` (newest-first ordering) with the leading short hash stripped (`<short-hash> <subject>` → subject only). The derived title SHALL be validated with `npm run pr:title-check -- "<title>"` — executed from the repository root, since this monorepo defines the `pr:title-check` script only in the root `package.json` — before any PR is created; if validation fails, the command SHALL abort without creating the PR and SHALL report the validation error.

#### Scenario: Explicit argument used as title

- **WHEN** `/push-pr feat: add push command` is invoked with non-empty arguments
- **THEN** the title SHALL be `feat: add push command` (subject to validation)

#### Scenario: Title derived from most recent commit

- **WHEN** no arguments are passed and the first line of `git log --oneline origin/main..HEAD` (the most recent commit) is `<short-hash> fix: handle empty branch`
- **THEN** the title SHALL be `fix: handle empty branch` (the leading short hash stripped, subject only)

#### Scenario: Derived title fails validation

- **WHEN** the derived title fails `npm run pr:title-check` (run from the repository root)
- **THEN** the command SHALL abort without creating the PR and SHALL report the title-check error message

### Requirement: PR body combines the repository template with the new commit list

The command SHALL build the PR body from the contents of `.github/PULL_REQUEST_TEMPLATE.md` and SHALL append the list of commits in `origin/main..HEAD` as short hash plus subject lines. The body SHALL be passed to `gh pr create --base main --title "<title>" --body-file "<path>"` via a quoted `--body-file "<path>"` argument (never inline `--body`), so multi-line, multi-word content survives shell quoting — including on Windows, where the temp file path may contain spaces.

#### Scenario: Body includes template and commits

- **WHEN** preconditions pass, no existing PR is found, and the title validates
- **THEN** the PR body SHALL contain the sections from `.github/PULL_REQUEST_TEMPLATE.md` followed by the hash and subject of each commit in `origin/main..HEAD`

#### Scenario: PR created against main

- **WHEN** the command runs to completion
- **THEN** `gh pr create` SHALL be invoked with `--base main`, the validated `--title`, and a quoted `--body-file "<path>"` carrying the body built from the template plus commit list

### Requirement: Command never creates commits and never bypasses repository protections

The `/push-pr` command SHALL NOT create, amend, or reword commits. It SHALL NOT use `--no-verify`, SHALL NOT skip git hooks, SHALL NOT force-push, and SHALL NOT bypass any repository protection; the frontmatter of the command file SHALL include a non-empty `description:` field.

#### Scenario: Commits already present

- **WHEN** the command runs with valid preconditions
- **THEN** it SHALL only push existing commits and open a PR, performing no `git commit` invocation

#### Scenario: Hook bypass attempts forbidden

- **WHEN** the command's instructions are executed
- **THEN** no git command SHALL include `--no-verify` or any hook-skipping equivalent, and no commit SHALL be amended

#### Scenario: Force-push flag forbidden

- **WHEN** the command reaches the push step
- **THEN** the invoked push SHALL be exactly `git push -u origin HEAD`, with no `--force`, `-f`, `--force-with-lease`, or equivalent flag anywhere in the flow

### Requirement: Command reports the resulting PR URL

After a successful push and PR creation (or detection of an existing PR), the command SHALL report the PR URL to the caller as step 8, the final step of the flow.

#### Scenario: New PR created

- **WHEN** `gh pr create` succeeds
- **THEN** the command SHALL report the URL printed by `gh pr create`

#### Scenario: Existing PR reported

- **WHEN** an open PR already existed for the branch
- **THEN** the command SHALL report the URL returned by `gh pr view --json url,state`
