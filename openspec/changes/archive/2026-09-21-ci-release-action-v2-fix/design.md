## Context

`release.yml` is the only workflow that lets automation create commits/PRs. Since the `changesets/action@v2` pin landed, both most recent release runs (2026-08-23) failed at startup: the action requires `@changesets/cli` v3 while the monorepo pins v2 — and the v2 line additionally rejects the repo's `env: GITHUB_TOKEN` App-token wiring. Full analysis: `openspec/changes/archive/2026-09-21-ci-release-workflow-signing/design.md` D7. This change restores a working release pipeline with the smallest possible blast radius.

## Goals / Non-Goals

**Goals**

- Release runs go green again (no startup abort, no token mismatch).
- Keep the signing semantics already corrected in `ci-release-workflow-signing`: API mode, web-flow auto-signing, no runner-side SSH signing config.
- Make the next action/CLI upgrade obvious (documented pairing rule in the workflow).

**Non-Goals**

- Upgrading `@changesets/cli` to v3 (deferred; needs regression testing of `changeset version` + changelog generation).
- Changing the GitHub App setup, secrets, or the `Verify Commit Signature` step.
- Re-enabling the workflow in GitHub (still `disabled_manually`; separate ops decision).

## Decisions

### D1 — Pin `changesets/action@v1.9.0` (exact tag), not `@v1`, not `@v2`

- `@v2` requires CLI v3 → cannot work with the installed CLI v2.
- `@v1` (floating) works today, but the incident that caused this change was a mutable major tag moving to an incompatible line; exact pins remove that hazard for the action that already burned us once.
- `v1.9.0` is the latest v1 tag — a current maintenance release (node24 runtime, `github-token` input present), not a stale artifact.

### D2 — v1 input names: `version`, `title`, `commit`

v2 renamed inputs (`version-script`, `pr-title`, `commit-message`); v1 does not know the new names. `release.yml` is reverted to the v1 names. When the repo later upgrades to action v2 + CLI v3, the names must be renamed back (noted in the workflow comment).

### D3 — `commitMode: github-api` explicitly

v1's `commitMode` defaults to `git-cli` (unlike v2's `push-with-git-cli: false` default). git-cli mode would create unsigned local commits via the Git CLI — harmless for `main`'s ruleset (only the squash-merge lands on `main`, which is web-flow signed), but it diverges from the corrected signing behavior. Explicit `github-api` keeps web-flow auto-signing under v1 and matches v2's default, so behavior is identical across both lines.

### D4 — Token via `github-token` input; `env: GITHUB_TOKEN` removed

- v1.9.0: `process.env.GITHUB_TOKEN || core.getInput("github-token")` — with the env var unset, the input is used.
- v2.x: `getRequiredInput("github-token")` — with the env var unset, no mismatch throw; the input is used.
- Wiring the App token via the input satisfies both contracts simultaneously and fulfills the SHALL in the `ci-release-workflow-signing` spec delta ("NUNCA únicamente vía la variable de entorno `GITHUB_TOKEN`").

### D5 — Keep the GitHub App and the `Verify Commit Signature` step

The App token is optional per D7 of `ci-release-workflow-signing` (preference: PR attribution, default token stays unprivileged), and the verify step consumes it via `GH_TOKEN`. Removing the App would be a separate decision with no urgency; keeping it preserves the last-known-good shape of the workflow.

## Risks / Trade-offs

- [Risk] Exact pin must be bumped manually on the future CLI v3 upgrade. → Mitigation: pairing rule + rename checklist documented as a comment directly in `release.yml`.
- [Risk] Green-run confirmation is deferred (workflow is `disabled_manually` in GitHub). → Mitigation: unchecked task in `tasks.md`; local `actionlint` + YAML validation done now; the fix restores the exact configuration class of the pre-2026-08-12 green runs.
- [Risk] v1 line is maintenance-only and will not receive new features. → Accepted: releases only need `version` mode; the v2/CLI-v3 upgrade is the intended long-term path.

## Verification

- `npx actionlint .github/workflows/release.yml` passes.
- YAML parses (`js-yaml`).
- v1.9.0 source confirms the token precedence (`env GITHUB_TOKEN || input github-token`) and `commitMode` values (`git-cli` | `github-api`).
- `openspec validate ci-release-action-v2-fix --strict` passes.
- [Deferred] Green `Release` run on the next push to `main` once the workflow is enabled.
