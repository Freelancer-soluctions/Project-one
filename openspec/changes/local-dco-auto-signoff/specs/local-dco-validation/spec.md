# Spec Delta — local-dco-validation

## ADDED Requirements

### Requirement: prepare-commit-msg hook auto-injects the DCO trailer

The repository SHALL provide a `prepare-commit-msg` git hook (`.husky/prepare-commit-msg`) that
automatically appends the canonical `Signed-off-by: Name <email>` trailer to every commit message it
processes, so the trailer is guaranteed by construction before `commit-msg` validates it, instead of
depending on developer memory of the explicit `-s` flag. The machine-local `commit.signoff`
configuration emits no trailer (it is a no-op), so it was never a dependency; the real dependency
this hook removes is developer memory of `-s`.

#### Scenario: Normal commit receives the trailer automatically

- **WHEN** a developer runs a plain `git commit` (editor flow) without passing `-s`
- **THEN** the hook SHALL append exactly one `Signed-off-by:` trailer built from the git identity before the editor opens or before commit-msg runs
- **AND** the commit-msg presence check SHALL find the trailer and proceed to commitlint

#### Scenario: Message-from-file commit receives the trailer

- **WHEN** a commit is created with an explicit message source (e.g. `git commit -F <file>` or a template)
- **THEN** the hook SHALL append the trailer to that message as well

#### Scenario: amend receives the trailer

- **WHEN** a developer amends a commit whose message lacks the trailer (e.g. created with `--no-verify` earlier)
- **THEN** the hook SHALL append the trailer to the amended message

### Requirement: Auto-signoff is idempotent

The hook SHALL never duplicate the trailer: if the message already contains a case-sensitive
`Signed-off-by:` string, the hook SHALL leave the message unchanged. This keeps the repository
convention `git commit -S -s` fully compatible — explicit signoff is honored, not doubled — and the
hook's grep guard is the mechanism that prevents duplication regardless of the signoff source (the
`commit.signoff` config convention is a no-op that emits no trailer and therefore provides no
compatibility of its own to rely on).

#### Scenario: Explicit -s does not duplicate

- **WHEN** a developer runs `git commit -S -s` (the repository convention) and prepare-commit-msg runs
- **THEN** the hook SHALL detect the existing `Signed-off-by:` trailer and add nothing
- **AND** the resulting commit message SHALL contain exactly one trailer

#### Scenario: Amend of an already-signed commit does not duplicate

- **WHEN** a developer runs `git commit --amend --no-edit` on a commit that already carries the trailer
- **THEN** the hook SHALL leave the message unchanged and no second trailer SHALL appear

#### Scenario: Replay of a signed message does not duplicate

- **WHEN** a commit message that already contains `Signed-off-by:` is replayed through a hook invocation (e.g. cherry-pick or rebase with editing)
- **THEN** the hook SHALL add no additional trailer

### Requirement: Merge commits are exempt from auto-signoff

The hook SHALL skip injection only for merge commits, detected via the hook source argument
(`$2` == `merge`). All other sources — `message`, `template`, `squash`, `commit`, and the no-source
plain-commit invocation — SHALL receive auto-signoff (subject to the idempotency rule).

#### Scenario: Merge commit is skipped

- **WHEN** the hook is invoked for a merge commit (source `merge`)
- **THEN** the hook SHALL not modify the message and SHALL exit 0
- **AND** commit-msg SHALL skip DCO validation for that merge commit as it does today

#### Scenario: Concluding a --no-commit merge with plain git commit (accepted deviation)

- **WHEN** a developer concludes a `git merge --no-commit` with a plain `git commit`, which invokes prepare-commit-msg with no source argument so the `$2` == `merge` guard does not trigger
- **THEN** the hook MAY append the trailer to that merge commit's message (unless one is already present)
- **AND** this deviation from the "merge commits are exempt" intent is accepted behaviour: it is harmless because every validation layer exempts merge commits — commit-msg skips messages matching `^Merge `, and the CI enforcement tooling (KineticCafe) also exempts merge commits

#### Scenario: squash and fixup sources receive signoff

- **WHEN** the hook is invoked with source `squash` (e.g. `git commit --squash <commit>`)
- **THEN** the hook SHALL append the trailer (unless one is already present)

#### Scenario: Plain and message sources receive signoff

- **WHEN** the hook is invoked with source `commit`, `message`, or `template`, or with no source argument
- **THEN** the hook SHALL append the trailer (unless one is already present)

### Requirement: Auto-signoff uses the real git identity

The hook SHALL derive the trailer identity from the committer identity git itself would use —
resolved via `git var GIT_COMMITTER_IDENT`, behaviourally identical to `git commit -s`, which signs
as the COMMITTER — stripping the trailing `<timestamp> <tz>` to yield the canonical
`Signed-off-by: Name <email>` form. When the committer identity is unresolvable, the hook SHALL
fall back to the author identity (`git var GIT_AUTHOR_IDENT`). When neither identity resolves, the
hook SHALL leave the message untouched and exit 0. It SHALL NOT use a hardcoded or placeholder
identity, and it SHALL honour git identity overrides for whichever identity is used:
`GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` for the primary committer identity, and
`GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` when the author fallback applies.

#### Scenario: Configured identity produces the canonical trailer

- **WHEN** `user.name` and `user.email` are configured and a commit is created
- **THEN** the appended trailer SHALL be exactly `Signed-off-by: <user.name> <user.email>`, matching `git var GIT_COMMITTER_IDENT` with the trailing `<timestamp> <tz>` stripped

#### Scenario: Environment-overridden committer identity is honored

- **WHEN** `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL` are set in the environment
- **THEN** the appended trailer SHALL use those values, proving the identity comes from git's committer resolution rather than from static config reading

#### Scenario: Author identity is used only as fallback

- **WHEN** the committer identity is unresolvable but `git var GIT_AUTHOR_IDENT` resolves (e.g. `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` are set while the committer identity is missing)
- **THEN** the hook SHALL append the trailer built from the author identity

### Requirement: Auto-signoff never blocks a commit

The hook SHALL only repair messages, never reject them: it SHALL exit 0 on every path, including
when it cannot determine the identity or the message file, leaving the message unchanged in that
case. Rejection for a missing trailer remains exclusively in commit-msg (which exits non-zero with
guidance).

#### Scenario: Undeterminable identity degrades gracefully

- **WHEN** the hook cannot resolve a committer name/email and no fallback author identity resolves (e.g. git identity misconfigured)
- **THEN** it SHALL exit 0 without modifying the message and without failing the commit
- **AND** commit-msg SHALL still run and SHALL reject the commit if the trailer is absent, preserving the authoritative failure path

#### Scenario: Hook failure never aborts the commit flow

- **WHEN** any internal condition prevents injection (unreadable message file, missing git executable for identity resolution)
- **THEN** the hook SHALL exit 0 and the commit flow SHALL continue to commit-msg unchanged

### Requirement: Auto-signoff hook is POSIX-portable across platforms

The hook SHALL be implemented in portable POSIX shell (sh/bash) that behaves identically under Git
Bash/MSYS2 on Windows, macOS, and Linux — no platform-specific binaries, paths, or bash-only
syntax — so every developer machine of the team gets the same auto-signoff behavior.

#### Scenario: Windows Git Bash commit is signed off

- **WHEN** a developer on Windows commits through Git Bash/MSYS2
- **THEN** the hook SHALL append the trailer in the same canonical form as on macOS/Linux and exit 0

#### Scenario: macOS and Linux commits are signed off

- **WHEN** a developer on macOS or Linux commits
- **THEN** the hook SHALL behave identically to the Windows case (same trailer, same idempotency, same merge skip)

#### Scenario: Platform-specific impossibility exits 0

- **WHEN** a platform-specific condition makes injection impossible
- **THEN** the hook SHALL exit 0 rather than breaking the commit flow, deferring to commit-msg validation

### Requirement: commit-msg is the single local DCO validation gate

The `commit-msg` hook's DCO presence validation SHALL be preserved unchanged in behaviour and SHALL
be the ONLY local DCO validation layer: the merge skip (`^Merge ` first-line pattern), the
case-sensitive grep for `Signed-off-by:`, and the non-zero exit all stay byte-identical to the
current hook. Only the guidance text emitted on failure, and the non-behavioral layer label in the header comment (`# DCO check (L1)` -> `# DCO check (L2)`), MAY be corrected (it SHALL stop recommending
the no-op `git config --global commit.signoff true` and SHALL give actionable signoff instructions
plus a note about auto-signoff) without altering that logic. Auto-signoff (`prepare-commit-msg`)
plus this gate provide defense-in-depth at commit time; no other local hook validates DCO, and the
CI `DCO` check remains the authoritative, non-bypassable backstop. Hook ordering (DCO validation
before commitlint) is asserted separately by the requirement "commit-msg runs DCO validation before
commitlint".

#### Scenario: commit-msg still rejects a missing trailer

- **WHEN** a commit message reaches commit-msg without a `Signed-off-by:` trailer (e.g. prepare-commit-msg could not determine an identity)
- **THEN** commit-msg SHALL reject the commit with guidance instructing the developer to sign off with `-s` and exit non-zero

#### Scenario: Merge commits still skip the presence check

- **WHEN** the commit message's first line matches the merge pattern `^Merge `
- **THEN** commit-msg SHALL skip DCO validation and proceed directly to commitlint

#### Scenario: Guidance corrected without changing the validation logic

- **WHEN** commit-msg rejects a commit for a missing trailer
- **THEN** the merge skip by `^Merge `, the case-sensitive grep and the non-zero exit SHALL be byte-identical to the pre-change hook
- **AND** the emitted guidance SHALL instruct `git commit -s` / `git commit --amend -s` with a note about automatic signoff instead of recommending the no-op `commit.signoff` configuration

#### Scenario: No other local hook rejects for a missing trailer

- **WHEN** any local hook other than commit-msg runs (`pre-commit`, `prepare-commit-msg`, `pre-push`)
- **THEN** none of them SHALL reject a commit or a push because a `Signed-off-by:` trailer is missing - prepare-commit-msg only repairs, pre-push does not inspect trailers, and commit-msg is the sole local rejection path for a missing trailer

### Requirement: pre-push does not validate DCO

The `pre-push` hook SHALL NOT inspect commits for `Signed-off-by:` trailers — the push-time DCO
re-check is removed entirely. `pre-push` SHALL retain the `git fetch origin main` step and the
`origin/main` existence guard, because the scoped tests are selected with `--changed origin/main`
and depend on that ref existing locally and being current, and it SHALL still run those scoped
tests, still rejecting the push when they fail. Local DCO validation is therefore delegated to
`commit-msg` (the single local gate) and, authoritatively and unbypassably, to the CI `DCO` check.

#### Scenario: Push with commits missing trailers is not blocked by pre-push

- **WHEN** a push contains non-merge commits whose messages lack `Signed-off-by:` trailers (e.g. commits that entered local history without passing through the hooks)
- **THEN** `pre-push` SHALL NOT reject the push for the missing trailers and SHALL proceed to the scoped tests
- **AND** DCO enforcement for those commits SHALL be delegated to the CI `DCO` check, which rejects them authoritatively

#### Scenario: Fetch and origin/main guard remain in place

- **WHEN** `pre-push` runs
- **THEN** it SHALL execute `git fetch origin main` and the `origin/main` existence guard before the scoped tests, because the scoped test selection (`--changed origin/main`) requires that ref to exist locally and be current

#### Scenario: Scoped tests still gate the push

- **WHEN** the scoped tests fail in `pre-push`
- **THEN** `pre-push` SHALL exit non-zero and block the push
- **AND** this blocking SHALL be independent of any DCO inspection, which `pre-push` no longer performs

### Requirement: commit-msg runs DCO validation before commitlint

The `commit-msg` hook SHALL run DCO validation BEFORE commitlint: when DCO validation passes,
commitlint SHALL execute as the next step; when DCO validation fails, commitlint SHALL NOT run and
the commit SHALL be rejected. This ordering constraint belongs to `commit-msg` alone - `pre-push`
performs no DCO validation, so no DCO-to-vitest ordering exists.

#### Scenario: DCO passes commitlint runs

- **WHEN** DCO check passes in commit-msg
- **THEN** commitlint SHALL execute as the next step

#### Scenario: DCO fails commitlint skipped

- **WHEN** DCO check fails in commit-msg
- **THEN** commitlint SHALL NOT execute and the commit SHALL be rejected

## REMOVED Requirements

### Requirement: Hook preserves existing commitlint behavior

**Reason**: The requirement existed to pin two orderings: DCO validation before commitlint in `commit-msg`, and the DCO re-check before the scoped vitest tests in `pre-push`. `pre-push` no longer performs any DCO validation, so no DCO-to-vitest ordering exists to preserve; only the commit-msg ordering survives and it now has a dedicated requirement. Dropping the `DCO passes vitest runs` and `DCO fails vitest skipped` scenarios is deliberate - they describe the deleted push-time re-check.

**Migration**: The surviving `commit-msg` ordering (DCO validation before commitlint; commitlint not run when DCO fails) is asserted by the ADDED requirement "commit-msg runs DCO validation before commitlint". The scoped tests keep running in `pre-push` unconditionally with respect to DCO (covered by the `pre-push-scoped-testing` capability), and DCO remains enforced by `commit-msg` locally and by the CI `DCO` check authoritatively.

### Requirement: pre-push hook re-validates DCO over pushed commit range

**Reason**: The push-time re-check duplicated the `commit-msg` presence validation for every locally-created commit and paid a `git fetch` plus a per-commit log walk over the push range on every push, while `--no-verify` never suppresses `prepare-commit-msg` — so commits created locally are already signed by construction and the redundant second local gate bought little. User decision (scope change superseding the earlier decision to keep it): local DCO validation collapses to the single `commit-msg` gate; CI remains the authoritative backstop.

**Migration**: The DCO block of `.husky/pre-push` is deleted; the hook keeps `git fetch origin main`, the `origin/main` existence guard and the scoped tests (their behaviour is covered by `pre-push-scoped-testing` and is unchanged). Missing trailers are caught at commit time by `commit-msg` and authoritatively by the CI `DCO` check (KineticCafe, ruleset 21227644). Commits that enter local history without passing through the hooks (cherry-pick from a foreign branch, `HUSKY=0`, hooks disabled, commits predating this change, tools that bypass hooks) are covered only by CI — an accepted residual risk documented by the ADDED requirements "commit-msg is the single local DCO validation gate" and "pre-push does not validate DCO" and by the `dco-documentation` capability.
