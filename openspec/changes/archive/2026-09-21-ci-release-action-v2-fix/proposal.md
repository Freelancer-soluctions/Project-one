## Why

The `Release` workflow (`release.yml`) has been **failing on every run since 2026-08-23** (runs `32609462623`, `32609700337`) with:

```
Error: This version of the Changesets action is designed to work with Changesets CLI v3.
Changesets CLI v2 is not supported; use Changesets action v1 instead.
```

Root causes, both introduced when the repo pinned `changesets/action@v2` while the monorepo still has `@changesets/cli ^2.31.0`:

1. **CLI incompatibility:** `changesets/action@v2` requires `@changesets/cli` v3 (v2.0.0 release note #699). The repo uses CLI v2 → the action aborts at startup. The mutable `@v2` tag moved under the pinned major reference after the last green run (2026-08-11).
2. **Token contract change:** `changesets/action@v2` removed support for the `GITHUB_TOKEN` environment variable (#674) and **throws** when `env: GITHUB_TOKEN` differs from the `github-token` input. `release.yml` passes the App token via `env:` and sets no input, so even after fixing (1), every run would fail with `The GITHUB_TOKEN environment variable is set and does not match the "github-token" input`.

Releases are blocked until this is repaired. (Analysis recorded in `openspec/changes/archive/2026-09-21-ci-release-workflow-signing/design.md`, D7.)

## What Changes

- **Pin `changesets/action@v1.9.0`** (exact tag, latest v1 maintenance release — compatible with the installed `@changesets/cli` v2, per the action's own error guidance). The pin carries an inline comment documenting the pairing rule (action v1.x ↔ CLI v2; action v2.x ↔ CLI v3) so the next upgrade pairs both majors.
- **Rename the inputs to the v1 contract:** `version-script` → `version`, `pr-title` → `title`, `commit-message` → `commit` (v2 renamed them; v1 does not know the new names).
- **Set `commitMode: github-api` explicitly** — v1's default is `git-cli`; API mode keeps the web-flow GPG auto-signing behavior (Verified badges, `required_signatures` compliance) documented in `ci-release-workflow-signing`.
- **Move the token wiring to the `github-token` input** and drop the `env: GITHUB_TOKEN` block — this is the contract shared by v1.9.0+ (input supported) and v2.x (input required), so the wiring survives the future v2/CLI-v3 upgrade unchanged.
- No dependency changes (`@changesets/cli` stays on v2); no changes to the App token step or the `Verify Commit Signature` step.

## Capabilities

### New Capabilities

- `release-workflow-compatibility` — release.yml keeps `changesets/action` version compatible with the installed `@changesets/cli` major, wires the token per the action's contract, and runs in API mode.

### Modified Capabilities

- (none)

## Impact

- **Code:** `.github/workflows/release.yml` only (one step edited). No application code, no dependencies, no other workflows.
- **Docs:** `docs/CONTEXT-CICD.md` actions-version table + change catalog entries.
- **Verification:** `actionlint` + YAML parse locally. The final green release run is deferred until the workflow is re-enabled in GitHub (`disabled_manually`) or the next push to `main` — tracked as an unchecked task.
- Alternative considered and deferred: upgrading `@changesets/cli` to v3 (forward-looking but requires regression-testing `changeset version`/changelog generation; better as its own change).
