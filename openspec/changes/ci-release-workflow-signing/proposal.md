## Why

The `release.yml` workflow contained SSH commit-signing configuration (`gpg.format`, `user.signingkey`, `commit.gpgsign`) that was **dead code**. `changesets/action@v2` defaults to `push-with-git-cli: false` (REST API mode), where GitHub auto-signs the version commit and Release PR with its web-flow GPG key (id `4AEE18F83AFDEB23`). The SSH config was never executed, and would not have worked even in git-cli mode (only the public key was provisioned in `/tmp`; no private key was loaded into `ssh-agent`).

This false belief was reinforced by the GATE 4.0 spike in `ci-commit-signing`, which tested a raw `git push` (correctly rejected) while changesets actually uses the REST API (auto-signed). That mismatch produced a false confirmation that "release commits would be rejected," which drove unnecessary SSH key generation and dead code in `release.yml`.

## What Changes

- **Documents (does NOT change code)** the discovery that the SSH signing block in `release.yml` is dead code.
- Records the correct signing behavior: changesets API mode auto-signs via the web-flow GPG key; `required_signatures` accepts web-flow signatures (`verified=true`).
- Establishes a guardrail: future developers MUST NOT re-add SSH signing config to `release.yml`.
- Clarifies that the App token (`APP_ID` + `APP_PRIVATE_KEY`) is still required for changesets to push with elevated permissions — only the SSH _signing_ config is dead, not the auth token.
- Code cleanup of the dead SSH config was already completed in the `ci-commit-signing` change; this change is documentation-only.

## Capabilities

This is a documentation-only change. No spec-level behavior changes. `skip_specs: true` is set in `.openspec.yaml`.

### New Capabilities

- (none)

### Modified Capabilities

- (none)

## Impact

- **Documentation only.** No application code, CI workflow code, or dependencies change.
- Affected artifacts: this change's `design.md` (the authoritative record of the dead-code discovery) and cross-references in `ci-commit-signing` / `docs/commit-signing.md`.
- Prevents future regressions where developers re-add non-functional SSH signing config to `release.yml`.
