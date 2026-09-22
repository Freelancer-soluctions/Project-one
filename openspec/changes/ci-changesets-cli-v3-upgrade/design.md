## Context

`release.yml` currently runs the maintenance-only pairing `changesets/action@v1.9.0` + `@changesets/cli ^2.31.0` (pinned in `ci-release-action-v2-fix` after the mutable `@v2` tag broke the pipeline). The action v2 line requires CLI v3 (`validateChangesetsCliVersion` in the action's source), and CLI v3's 3.0.0 release notes contain four changes that touch this repo's exact configuration. This change migrates the repo to the supported pairing in one atomic move — the pairing rule (action v1.x ↔ CLI v2; v2.x ↔ CLI v3) forbids half-migrations, which is precisely how the 2026-08-12→09-21 outage happened.

## Goals / Non-Goals

**Goals**

- Move to the actively developed pairing (`action@v2.1.2` pin + `@changesets/cli ^3.0.3`) with zero behavioral regression in versioning output.
- Preserve web-flow auto-signing semantics (API mode) and the `github-token` input wiring (both unchanged on the v2 side).
- Encode the newly discovered breaking-change traps (private packages, `git-tag` rename, no-op exit 1, Node floor) as durable guardrails in spec + docs.

**Non-Goals**

- Adding a publish mode / npm publishing (repo releases tags only).
- Enabling the workflow in GitHub or observing the green run (separate ops step, tracked as deferred task).
- Adopting pre-release/snapshot workflows or the new `pre/` folder layout.

## Decisions

### D1 — Atomic upgrade, exact pin `changesets/action@v2.1.2`

Same rationale as D1 of `ci-release-action-v2-fix`: the mutable-major-tag hazard already burned the pipeline once. `v2.1.2` is the current latest v2 tag (includes #729: version commits always switch/reset branch — closer to git-cli parity). Half-migrations (CLI v3 with action v1, or action v2 with CLI v2) are the forbidden states; tasks pair the bumps so they can't land separately (single PR).

### D2 — `privatePackages: true` restores today's behavior

CLI v3 #2186: private packages are no longer versioned by default. Every workspace in this monorepo (`client-react`, `server-express`, `e2e` — all `"private": true`) is versioned by `changeset version` today. Without `"privatePackages": true` in `.changeset/config.json`, the next release would silently skip all version bumps — the most dangerous trap of this upgrade. `"privatePackages": { "version": true, "tag": false }` would version without tagging; `true` (version + tag) matches the previous default (`changeset tag` created tags for private packages? — verify during implementation: if today's `release` script tags all packages, keep `true`; if tags were never created for private packages, use `{ "version": true }`). Default of this plan: `"privatePackages": true` pending verification in task 2.2.

### D3 — `release` script → `changeset git-tag`

#2128 renamed the command. `"release": "changeset git-tag"` is the direct replacement. (The script is currently manual/`npm run release`; the Release workflow does not call it.)

### D4 — Accept (and document) the no-op exit 1

#1860: `changeset version` exits 1 with no unreleased changesets. In the Release workflow, this happens only after the version PR merge consumed all changesets (the workflow runs again on the version commit's push). The action's own `runVersion` is invoked only when `readChangesetState` found changesets, so the version script should not hit the no-op path in practice — but if it does (race), the run fails visibly instead of silently no-op'ing. Accepted: fail-loud beats fail-silent; the concurrency group serializes runs. Do NOT add `|| true` masking.

### D5 — Node floor: document, don't enforce a new mechanism

CLI v3 requires `node ^22.11 || ^24 || >=26` and `npm >=10.9.0` (engines). `.nvmrc` = `22.23.1` ✓. The repo's `engines.node` is `>=20.0.0` — now weaker than the CLI's. Raise root `engines.node` to `>=22.11` to make the constraint explicit and let `engine-strict`/npm warn; do not add a CI node-version check beyond `.nvmrc` (the workflow already installs per `.nvmrc`).

### D6 — No spec rewrite, a MODIFIED delta on the existing capability

The `release-workflow-compatibility` requirement already encodes the pairing invariant; this change flips the repo to the v2 side and adds the two new guardrails (no-op exit 1; Node floor). MODIFIED carries all four scenarios updated (input names, `push-with-git-cli: false`, pairing comment rewrite). Sequencing: apply only after `ci-release-action-v2-fix` archives (its delta creates the main spec).

### D7 — CHANGESETS_OUTPUT is not needed for version mode

The action v2 README's CHANGESETS_OUTPUT guidance (#678) applies to publish mode (published-packages detection) and, per CLI 3.0.0 #2129, to `status`/`publish`/`git-tag` output capture. The repo runs version-only (no `publish-script`), so no env plumbing is added. If a publish mode is ever added, pass `CHANGESETS_OUTPUT` down to the CLI invocations then.

## Risks / Trade-offs

- [Risk] `privatePackages` default change silently stops versioning private workspaces → Mitigation: D2 config migration + task 2.3 verifies the version PR touches `apps/*/package.json` files.
- [Risk] No-op exit 1 fails a benign run → Mitigation: D4 analysis; the run after a version-PR merge is a no-op by design and a red run there is cosmetic, not blocking (required checks are PR-scoped).
- [Risk] changelog format drift (`@changesets/changelog-github` 0.7→1.0) → Mitigation: task 2.4 inspects the generated CHANGELOG diff in the version PR; changelog content is advisory, not contractual.
- [Risk] The capability spec this delta modifies does not exist until `ci-release-action-v2-fix` archives → Mitigation: sequencing note in proposal; validate passes today because the delta parses standalone; sync/archive is deferred.
- [Risk] Deferred green-run verification again → Mitigation: same deferred-task pattern as the fix change (workflow still `disabled_manually`).

## Verification

- `npm ls @changesets/cli` shows 3.x; `npm run version:packages` on a scratch changeset produces the expected workspace bumps (including private packages) — exercised in a temp worktree, then reverted.
- `npx actionlint .github/workflows/release.yml` + YAML parse.
- `openspec validate ci-changesets-cli-v3-upgrade --strict`.
- [Deferred] Green `Release` run + Release PR "Verified" on the next push to `main` once enabled.
