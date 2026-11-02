---
name: git-workflow
description: >
  Conventional Commits, Trunk-Based Development, and atomic commits for this
  repository. Use when creating commits, branches, or PRs. Extracted from the
  retired git-manager.md prompt; this skill is now the source of truth.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Git Workflow — Conventional Commits, TBD, Atomic Commits

This repository follows Trunk-Based Development (TBD), Conventional Commits,
git hooks, Semgrep validations, and repository protections.

## Trunk-Based Development

- Short-lived feature branches off `main`.
- Integrate frequently; keep changes small.
- Linear history required (squash/rebase/merge allowed).
- No long-lived feature branches.

## Conventional Commits

Format: `type(scope): description`

There are two validators with **different rules** — a string can pass one and fail the other:

| Context         | Validator                                                                   | Allowed types                                                          | Subject rule                                                      |
| --------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Commit messages | `commitlint` (`@commitlint/config-conventional`) via `.husky/commit-msg`    | build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test | must NOT be sentence-case, start-case, pascal-case, or upper-case |
| PR titles       | `amannn/action-semantic-pull-request` (`.github/workflows/pr-metadata.yml`) | the 11 above **+ `ops`**                                               | must start lowercase (`^(?![A-Z]).+$`)                            |

⚠️ `ops` is accepted in **PR titles only**. `ops: ...` fails the commit-msg hook (`type-enum`), so never use it in a commit.

- Scope is optional in both (`requireScope: false`); empty scope is allowed (`chore: bump deps`).
- Breaking changes: append `!` after type/scope (`feat(api)!:`) or add a `BREAKING CHANGE:` footer.
- Footer format: `Signed-off-by: Name <email>` (DCO) + optional `Closes #N` / `Refs #N`.
- Body: wrap at 72 chars, explain WHY not WHAT. Footer: one blank line after body, then trailers.

Examples:

- `feat(auth): add JWT authentication middleware`
- `fix(server): handle missing env var in dotenv`
- `chore(ci): bump action versions`
- `feat(api)!: remove deprecated v1 endpoints`
- `feat(auth): add OAuth2 support\n\nBREAKING CHANGE: removes basic auth`

## Atomic Commits

- One logical change per commit.
- Keep commits focused and reviewable.
- Create new commits; NEVER rewrite history, force push, or bypass hooks.
- Use `git commit -S -s` (SSH signing + DCO signoff) — `-s` is non-optional.

## DCO (Developer Certificate of Origin)

Every non-merge commit MUST include `Signed-off-by: Name <email>` trailer.
CI check `DCO` (KineticCafe, required + blocking) enforces presence.
Local: `.husky/prepare-commit-msg` auto-signs; `commit-msg` validates presence.
Hook reference: `.husky/commit-msg` runs `grep -q 'Signed-off-by:'` on the message.

## Safety Rules

- NEVER use `--no-verify`.
- NEVER bypass hooks or protections.
- NEVER force push or rewrite history.
- Run git/`gh` operations directly (principal), within the restricted bash allowlist (`git status`, `git diff --stat`, `git add *`, `git commit *`, `gh *`; force push, amend, rebase and `--no-verify` denied).
- Use bash `git` for version control; `gh` only for GitHub API ops.

## Commit Workflow

1. Stage focused changes (`git add <files>`).
2. Commit with conventional message + signing: `git commit -S -s -m "type(scope): desc"`.
3. Push; open PR with conventional title.
