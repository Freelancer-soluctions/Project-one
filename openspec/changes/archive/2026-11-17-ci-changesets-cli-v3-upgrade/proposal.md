## Why

The repo runs on the `changesets/action@v1.9.0` + `@changesets/cli v2` pairing (the compatibility repair in `ci-release-action-v2-fix`). The v1 line is **maintenance-only** and the v2 line of the action is where active development happens — the pairing rule in `release.yml` (action v1.x ↔ CLI v2; action v2.x ↔ CLI v3) makes the simultaneous CLI v3 + action v2 upgrade the intended long-term path. Staying on v1/CLI-v2 accumulates supply-chain and feature debt for the only workflow that automates releases.

The upgrade surface is small but has **four breaking-change traps** that make it worth its own planned change (researched against `@changesets/cli@3.0.0` release notes, current latest = 3.0.3):

1. **Private packages are no longer versioned by default** (#2186): this monorepo's workspaces are private (`"private": true`); without a config migration, `changeset version` would silently stop bumping them.
2. **`changeset tag` renamed to `changeset git-tag`** (#2128): the repo's `release` script is `"changeset tag"` — it would break.
3. **`changeset version` exits 1 when there are no unreleased changesets** (#1860): the `version:packages` script's failure semantics change in the Release workflow's no-op path.
4. **Node ^22.11 || ^24 || >=26 required** (#1482): `.nvmrc` is currently `22.23.1` ✓, but nothing pins this constraint in CI, so a future `.nvmrc` bump below 22.11 would silently break releases.

## What Changes

- **Dependencies:** bump `@changesets/cli` to `^3.0.3` and `@changesets/changelog-github` to `^1.0.1` (the 0.7.x line targets `@changesets/types` v6 / CLI v2).
- **Config migration (`.changeset/config.json`):** add `"privatePackages": true` (version + tag, matching today's behavior where private workspaces DO get versioned), and audit the remaining fields — `changelog` (array form stays), `commit`, `access`, `baseBranch`, `updateInternalDependencies`, `ignore` are unchanged in v3; the `prettier` option is not used, so no `format` migration needed.
- **Scripts (`package.json`):** `release` → `changeset git-tag` (#2128). `version:packages` (`changeset version && npm install --ignore-scripts`) stays as-is, but the Release workflow's no-op exit-1 behavior (#1860) must be accepted: the action's version step fails the run when the version PR was just merged and no changesets remain — verify that this is benign (the run is a no-op by definition) or guard it.
- **Workflow (`release.yml`):** bump the pin `changesets/action@v1.9.0` → `changesets/action@v2.1.2` (exact tag, current latest v2), rename inputs back to the v2 contract (`version` → `version-script`, `title` → `pr-title`, `commit` → `commit-message`), replace `commitMode: github-api` with `push-with-git-cli: false` (v2 default; set explicitly for parity with the signing spec), keep `github-token` input, and rewrite the pairing-rule comment to the new checklist (the v1→v2 migration this change performs).
- **Docs:** update the pairing-rule comment, `docs/CONTEXT-CICD.md` §6 actions table + §3.4 release.yml row, and guide `17-changesets-release-yml.md` snippet (it mirrors the workflow's current state).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `release-workflow-compatibility` — requirement "changesets/action compatible con @changesets/cli y cableado según su contrato" is MODIFIED: the repo moves to the action v2.x ↔ CLI v3 side of the pairing; adds the no-op exit-1 behavior and the `.nvmrc`/Node-engine constraint as explicit scenarios.

## Impact

- **Code:** root `package.json` (deps + `release` script), `.changeset/config.json`, `.github/workflows/release.yml` (one step + comment), lockfile via install.
- **Behavior:** `changeset version` output identical (with `privatePackages: true`); Release workflow no-op runs now fail the `changesets` step (see design D4 for why this is accepted); `changeset tag` renamed everywhere.
- **Sequencing:** ✅ cleared — `openspec/changes/archive/2026-09-21-ci-release-action-v2-fix/` archived 2026-09-21; the `release-workflow-compatibility` main spec exists and this change's MODIFIED delta targets it.
- **Deferred verification:** green Release run (workflow is `disabled_manually` in GitHub), same as the previous change.
- **Not in scope:** adding a publish mode, snapshot releases, pre-release mode (`.changeset/pre/` new folder layout is irrelevant until used).
