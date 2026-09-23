## Why

The `release.yml` workflow contained SSH commit-signing configuration (`gpg.format`, `user.signingkey`, `commit.gpgsign`) that was **dead code**. `changesets/action@v2` defaults to `push-with-git-cli: false` (REST API mode), where GitHub auto-signs the version commit and Release PR with its web-flow GPG key (id `4AEE18F83AFDEB23`). The SSH config was never executed, and would not have worked even in git-cli mode (only the public key was provisioned in `/tmp`; no private key was loaded into `ssh-agent`).

This false belief was reinforced by the GATE 4.0 spike in `ci-commit-signing`, which tested a raw `git push` (correctly rejected) while changesets actually uses the REST API (auto-signed). That mismatch produced a false confirmation that "release commits would be rejected," which drove unnecessary SSH key generation and dead code in `release.yml`.

**Correction (2026-09-21 review):** the same unverified-premise pattern affected this change's own original D7. As wired, the App token is **also** dead code: `changesets/action@v2` removed support for the `GITHUB_TOKEN` environment variable (v2.0.0 release note #674) and throws when `env: GITHUB_TOKEN` differs from the `github-token` input — which `release.yml` never sets. Independently, the release pipeline is currently broken: the repo pins `@changesets/cli ^2.31.0` (CLI v2) while `changesets/action@v2` requires CLI v3, and the two most recent release runs (2026-08-23) failed with `Changesets CLI v2 is not supported`. Additionally, the live spec `commit-signing-release-migration` still mandates the App-SSH approach its own conditional note said to discard; this change now fixes it via a spec delta instead of `skip_specs: true`.

## What Changes

- Documents (does NOT change code) the discovery that the SSH signing block in `release.yml` is dead code.
- Records the correct signing behavior: changesets API mode auto-signs via the web-flow GPG key; `required_signatures` accepts web-flow signatures (`verified=true`).
- Establishes a guardrail: future developers MUST NOT re-add SSH signing config to `release.yml`.
- **Corrects the earlier claim that the App token "is still required":** as wired (`env: GITHUB_TOKEN`, no `github-token` input), the App token never reaches the action and will cause a hard failure once the CLI mismatch is fixed. The token is optional (a preference for PR attribution), not necessary. Repairing `release.yml` itself is code and is tracked as a separate change (`ci-release-action-v2-fix`).
- **Corrects the live spec** `commit-signing-release-migration` via a spec delta (REMOVED old App-SSH requirement, ADDED corrected API-mode requirement), replacing `skip_specs: true`.
- Code cleanup of the dead SSH config was already completed in the `ci-commit-signing` change; this change remains documentation-only (no code or workflow changes).

## Capabilities

This is a documentation-only change (no code). It modifies one existing capability spec to remove the invalidated requirement.

### New Capabilities

- (none)

### Modified Capabilities

- `commit-signing-release-migration` — requirement "release.yml produce commits Verified vía GitHub App SSH" is replaced: changesets API mode needs no runner-side signing; commits are web-flow auto-signed (Verified) and pass `required_signatures`. The App token is optional (wired via `github-token` input if used); `release.yml` MUST NOT re-add SSH signing config.

## Impact

- **Documentation only.** No application code, CI workflow code, or dependencies change.
- Affected artifacts: this change's `design.md` (authoritative record incl. the D7 correction), the spec delta for `commit-signing-release-migration` (syncs to `openspec/specs/commit-signing-release-migration/spec.md`), and cross-references in `ci-commit-signing` (archived: `openspec/changes/archive/2026-08-26-ci-commit-signing/`) and the commit-signing docs (`docs/learning/ci-cd/05b-commit-signing.md`, `05c-ci-commit-signing-implementation.md`).
- Prevents future regressions where developers re-add non-functional SSH signing config to `release.yml` or re-derive the App-token necessity from the uncorrected spec.
- Out of scope: repairing `release.yml` (changesets CLI v2↔action v2 breakage; `github-token` input wiring) — tracked separately.
