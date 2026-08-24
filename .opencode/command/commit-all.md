---
description: Group changes into Conventional Commits
---

Group all current changes into meaningful Conventional Commits.

Optional context for commit messages: `$ARGUMENTS`

Rules:

- First inspect the full repository state:
  - `git status --short`
  - `git diff --stat`
  - `git diff`
  - `git log --oneline -10`

- Identify related file groups by intent.
- Create multiple commits when there are independent changes.
- Do not mix unrelated changes in the same commit.

- Follow the Conventional Commits specification:
  - `type(scope): description`

- Allowed types:
  - feat
  - fix
  - refactor
  - docs
  - test
  - chore
  - build
  - ci
  - perf
  - style
  - revert

- If `$ARGUMENTS` is not empty, use it as additional context when appropriate.

- Respect existing repository security mechanisms such as:
  - git hooks
  - semgrep
  - .gitignore
  - secret scanners

- Do not bypass repository protections.
- Do not revert existing changes.
- Do not use `--no-verify`.
- Do not amend commits.
- ALWAYS sign every commit with `git commit -S` — this repo enforces signed
  commits (ruleset required_signatures). Plain `git commit` is forbidden.
- If signing fails because the SSH agent has no key loaded (`ssh-add -l`
  fails or passphrase prompt in non-interactive shell), do NOT fall back to
  unsigned commits: leave changes staged and output the exact
  `git commit -S -m "..."` commands for the user to run interactively.

Flow:

1. Show the proposed commit plan with files grouped by Conventional Commit intent.
2. If grouping is clear, continue automatically.
3. If there is real ambiguity, ask before committing.
4. For each group:
   - Add only the files for that group using:
     `git add <files>`
   - Create the signed commit using Conventional Commit format:
     `git commit -S -m "type(scope): description"`
5. When finished, summarize the commits created (with hashes and signature
   status).
