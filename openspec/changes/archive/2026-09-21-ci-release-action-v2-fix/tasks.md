## 1. Artifacts

- [x] 1.1 Proposal, design, spec delta (`release-workflow-compatibility`), tasks

## 2. Workflow repair (`.github/workflows/release.yml`)

- [x] 2.1 Pin `changesets/action@v1.9.0` (exact tag) with a comment documenting the action-major ↔ `@changesets/cli`-major pairing rule and the v1→v2 input-rename checklist
- [x] 2.2 Rename inputs to the v1 contract: `version-script` → `version`, `pr-title` → `title`, `commit-message` → `commit`
- [x] 2.3 Add `commitMode: github-api` (v1 default is `git-cli`; keep web-flow auto-signing)
- [x] 2.4 Move the App token to `with: github-token:` and remove the `env: GITHUB_TOKEN` block

## 3. Validation

- [x] 3.1 `npx actionlint .github/workflows/release.yml` passes
- [x] 3.2 YAML parse check (`js-yaml`)
- [x] 3.3 `openspec validate ci-release-action-v2-fix --strict` passes

## 4. Deferred verification

- [ ] 4.1 Green `Release` run observed on the next push to `main` (workflow is `disabled_manually` in GitHub; re-enable or wait for enablement) — confirm no `Changesets CLI v2 is not supported` error and no `GITHUB_TOKEN` mismatch, and the Release PR/version commit shows "Verified"
