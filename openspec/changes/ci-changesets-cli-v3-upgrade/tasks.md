## 1. Artifacts

- [x] 1.1 Proposal, design, spec delta (`release-workflow-compatibility`, MODIFIED), tasks

## 2. Dependency + config migration

- [x] 2.1 Bump `@changesets/cli` to `^3.0.3` and `@changesets/changelog-github` to `^1.0.1` in root `package.json` devDependencies; `npm install` to refresh the lockfile
- [x] 2.2 Verify the `privatePackages` decision (design D2): check whether today's flow tags private packages (`changeset tag` behavior) and set `.changeset/config.json` to `"privatePackages": true` (version+tag) or `{ "version": true, "tag": false }` accordingly; audit no other config fields need migration (`format` not used, no `pre.json`)
  > D2 resolved 2026-09-22: v2's default was version+tag (per #2186 wording "Set privatePackages to true to opt into versioning and tagging them"); empirically 0 git tags exist because `changeset tag` was never run, not because privates were excluded → `"privatePackages": true` matches today's behavior. Other fields audited: all valid in v3; no `prettier` option, no `pre.json`.
- [x] 2.3 Scratch-run `changeset version` in a temp worktree with a dummy changeset: confirm `apps/client-react/package.json`, `apps/server-express/package.json` (and lockfile) get bumped; revert the worktree
  > Verified 2026-09-22 (worktree at node_modules/.cache/, removed after): CLI v3.0.3 bumped private `client-react` 1.0.0→1.0.1 (workspace + root dep pin), consumed the changeset, no errors. `server-express` untouched (no changeset targeted it) — expected.
- [x] 2.4 `package.json`: `"release": "changeset git-tag"` (#2128 rename); raise root `engines.node` to `>=22.11` (design D5)
- [x] 2.5 Inspect the generated CHANGELOG diff shape from the scratch run (changelog-github 0.7→1.0 compat check, design Risks)
  > changelog-github 1.0.1 output OK: `## 1.0.1` / `### Patch Changes` / summary bullet. GitHub-links require `CHANGELOG_GITHUB_TOKEN`/`GITHUB_TOKEN` env at release time (same as 0.7.x).

## 3. Workflow migration (`.github/workflows/release.yml`)

- [x] 3.1 Bump pin `changesets/action@v1.9.0` → `changesets/action@v2.1.2` (exact tag)
- [x] 3.2 Rename inputs to v2 contract: `version` → `version-script`, `title` → `pr-title`, `commit` → `commit-message`; replace `commitMode: github-api` with explicit `push-with-git-cli: false`; keep `github-token` input
- [x] 3.3 Rewrite the pairing-rule comment: mark the v1→v2 migration done, replace the checklist with the next-upgrade guidance (major moves of `@changesets/cli` or `changesets/action` are breaking — check both release-notes pages; CHANGESETS_OUTPUT only needed if publish mode is added, design D7)

## 4. Validation

- [x] 4.1 `npx actionlint .github/workflows/release.yml` + YAML parse check
- [x] 4.2 `openspec validate ci-changesets-cli-v3-upgrade --strict`
- [x] 4.3 Local smoke: `npx changeset status` runs clean on the branch
  > 2026-09-22: CLI v3.0.3 runs clean (config parses, merge-base OK after `git fetch --deepen=200 origin main` — shallow clone lacked it); exit 1 is the expected "no changesets" business message (fail-loud, #1860).

## 5. Docs sync

- [x] 5.1 `docs/CONTEXT-CICD.md`: §6 actions table (`changesets/action` row → `@v2.1.2` pin), §3.4 release.yml row, and the `release.yml` mention in §9.1 catalog if needed
  > Also §10.x scripts table (`release` → `changeset git-tag`) and a new §9.1 catalog row for this change.
- [x] 5.2 `docs/learning/ci-cd/17-changesets-release-yml.md`: update the YAML snippet, the desglose row, and §9.5 mode table (v2 input names)
  > Plus all `changeset tag` → `changeset git-tag` mentions (scripts table, regla mental, sequence diagrams).

## 6. Deferred verification

- [ ] 6.1 Green `Release` run + "Verified" Release PR observed on the next push to `main` (workflow `disabled_manually`; re-enable or wait for enablement)

## Sequencing

- [x] `openspec/changes/ci-release-action-v2-fix/` archived (2026-09-21 → `archive/2026-09-21-ci-release-action-v2-fix/`); `release-workflow-compatibility` main spec created — this change's MODIFIED delta now targets an existing spec
