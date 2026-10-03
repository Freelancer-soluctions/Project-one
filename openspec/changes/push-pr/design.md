# Design

## Context

The repo already has local PR tooling: `scripts/hooks/pr-title-check.js` (Conventional Commits type + lowercase-subject validation, mirrors CI `pr-title-lint` in `.github/workflows/ci.yml` line 349), `scripts/hooks/pr-create.js` (`npm run pr:create` wrapper that validates the title then invokes `gh pr create` with argv re-quoting for win32), and `.github/PULL_REQUEST_TEMPLATE.md`. `/commit-all` (`.opencode/command/commit-all.md`) creates signed, DCO-signed commits and forbids `--no-verify`, amending, and hook bypasses. What is missing is a single command that goes from "commits exist locally" to "PR open on `main`" while enforcing repo workflow rules. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- One command (`/push-pr`) that pushes the current branch and opens a PR to `main` with a validated Conventional Commits title.
- Deterministic abort behavior (no side effects on precondition or `gh`-availability failure).
- Idempotency: re-running never creates a duplicate PR.

**Non-Goals:**

- Creating/amending commits (stays in `/commit-all`).
- Squashing, rebasing, branch deletion, or merging.
- Modifying `pr-title-check.js`, `pr:create`, CI workflows, or the PR template.
- Handling multi-repo or non-`main` base branches.

## Decisions

1. **Abort-before-side-effect ordering: inspect (incl. `git fetch origin main`) → abort checks → existing-PR/`gh` availability check → push → title → create.**
   Rationale: inspection runs `git fetch origin main` FIRST (which refreshes `refs/remotes/origin/main` — NOT the local `main` ref), then all cheap local checks (`git status --short`, `git branch --show-current`, `git log --oneline origin/main..HEAD`) run before any push or `gh` call, and the `gh pr view` gate runs before the push, so precondition failures and `gh` failures leave no side effects at all. The commit range is always `origin/main..HEAD` (never `main..HEAD`), so a stale or absent local `main` cannot distort the zero-commits abort or the title derivation; if the fetch itself fails (`origin` unreachable), the command aborts at inspection with the fetch error verbatim. Known residual partial state: title validation and PR creation happen AFTER the push, so a title-check or `gh pr create` failure DOES leave a pushed branch without a PR — deliberate, and covered by Risks below (recoverable by re-running the command; the branch state is never silently altered). Alternative considered: push first then validate everything — rejected because it widens that window to all failures and wastes network round-trips.

2. **Title source precedence: `$ARGUMENTS` > subject of the MOST RECENT commit in `origin/main..HEAD` (first line of `git log --oneline origin/main..HEAD`, newest-first, leading short hash stripped: `<short-hash> <subject>` → subject only).**
   Rationale: explicit intent wins; falling back to the newest commit's subject keeps zero-argument runs ergonomic and mirrors how a branch's leading commit summarizes the change. Alternative: derive from branch name — rejected because branch names rarely match Conventional Commits format and would usually fail validation.

3. **Validate via `npm run pr:title-check -- "<title>"` (run from the repository root — the script exists only in the root `package.json` of this monorepo) before `gh pr create`, aborting on failure.**
   Rationale: reuses the exact validator CI's `pr-title-lint` job uses (single source of truth, shifting-left). Alternative: call `npm run pr:create` which wraps validation + `gh pr create` — acceptable, but the command flow specifies `gh pr create --base main --title "<title>" --body-file "<path>"` directly so the title check is an explicit, independently abortable step; `pr:create` remains a valid implementation shortcut in tasks if quoting on Windows is simpler.

4. **Existing-PR detection with `gh pr view --json url,state` before creation, doubling as the `gh` availability gate.**
   Rationale: makes the command idempotent across retries (e.g., PR already created in a previous run). ONLY an `open` state PR suppresses creation (push during existing-PR handling, skip steps 4-7, report at step 8); a `closed`/`merged` PR for the branch does not block — the command falls through to the normal flow (step 4 push → step 5 derive title → step 6 validate → step 7 create a NEW PR), never creating a PR inline before title validation. Disambiguation is text-based over the COMBINED stdout and stderr of `gh pr view`: only output containing the exact phrase `no pull requests found for branch` plus the current branch name means "no PR exists"; any other `gh pr view` failure (uninstalled, unauthenticated, network) runs `gh auth status` and aborts BEFORE the push with an actionable error, never masquerading as "no PR exists". Alternative: `gh pr list --head` — equivalent, but `gh pr view` on the current branch gives a single unambiguous result.

5. **PR body = template contents + appended commit list (hash + subject from `origin/main..HEAD`), passed via a quoted `--body-file "<path>"`.**
   Rationale: the template's checklists stay intact for the author to fill, while the commit list gives reviewers instant traceability without manual copy-paste; `--body-file "<path>"` (path quoted — win32 paths may contain spaces) avoids shell-quoting the multi-line body inline (Windows/cmd would split it). Alternative: generate a fully synthetic body — rejected because it would drop the repo's checklist governance.

6. **Command file is prompt-only (markdown slash command), no new executable.**
   Rationale: matches existing `.opencode/command/*.md` conventions (`commit-all.md`); logic is a fixed shell sequence an agent can execute deterministically. Alternative: write `scripts/hooks/push-pr.js` — rejected as unnecessary indirection over plain git/gh commands, adding maintenance surface for no behavior gain.

## Risks / Trade-offs

- [`gh pr view` fails: not installed, not authenticated, or network down] → detected BEFORE the push; the command runs `gh auth status`, prints an actionable error, and stops with zero side effects (never mistaken for "no PR exists"). Verified by task 6.5.
- [`gh pr create` fails after a successful push] → the branch is pushed but no PR exists; reported verbatim, recoverable by re-running the command (idempotent by design). This is the residual partial state decision 1 accepts.
- [`origin` unreachable or push rejected (non-fast-forward)] → push error surfaces verbatim; the command stops before PR creation and does not force-push (force would be a protection bypass). An unreachable `origin` is also caught earlier: if `git fetch origin main` fails at inspection, the command aborts there with the fetch error verbatim and never reaches the push.
- [Title derived from the most recent commit is invalid Conventional Commits] → explicit abort with the `pr-title-check` error; the branch is already pushed at that point (title runs after push by design), so the user re-runs with `$ARGUMENTS` or fixes the commit message (via `/commit-all` on a fresh commit — amend is forbidden).
- [`main` not present locally / stale local `main`] → `main..HEAD` would be wrong (or fail with "ambiguous argument") because `git fetch origin main` updates `refs/remotes/origin/main`, NOT local `main`; mitigation: the range is always computed as `origin/main..HEAD` after the fetch, so the zero-commits abort and title derivation reflect remote state regardless of a stale or absent local `main`.
- [Template file absent or moved] → body construction degrades to the commit list alone; not a blocker, reported in output.
- [Windows quoting of multi-word `--title` and multi-line body values] → title re-quoting already solved by `pr-create.js` (argv round-trip), body passed via a quoted `--body-file "<path>"` instead of inline `--body`; task 6.6 verifies the multi-word title round-trip end-to-end on win32.

## Migration Plan

Purely additive: create `.opencode/command/push-pr.md`. Rollback = delete the file. No data, schema, or CI changes.

## Open Questions

- None material: base branch (`main`), title precedence (most recent commit subject), existing-PR blocking (only `open` blocks; `closed`/`merged` → new PR via steps 4-7 with title validation before any `gh pr create`), abort conditions, and idempotency were resolved in Phase 0.
