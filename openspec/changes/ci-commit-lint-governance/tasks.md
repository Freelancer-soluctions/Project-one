## 1. Fix Local Hook

- [ ] 1.1 Fix `.husky/commit-msg`: change `commitlint --edit $1` to `npx --no -- commitlint --edit "$1"`
- [ ] 1.2 Verify hook works locally: run `git commit --allow-empty -m "bad message"` and confirm it fails

## 2. Add CI commit-lint Job (Incremental CI — DO NOT activate other jobs)

- [ ] 2.1 Add `commit-lint` job to `.github/workflows/ci.yml` with steps: (a) `actions/checkout@v5` with `fetch-depth: 0`, (b) `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: npm`, (c) `run: npm ci`, (d) run commitlint per event (see 2.2)
- [ ] 2.2 Per-event commitlint invocation: `pull_request` → `npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose`; `merge_group` → `npx commitlint --last --verbose` (use step-level `if:` conditions or a single shell if/else)
- [ ] 2.3 Set `permissions: contents: read, pull-requests: read` on the job
- [ ] 2.4 Verify NO other disabled jobs are activated or modified (quality, unit, smoke, integration, e2e, build)
- [ ] 2.5 Validate YAML with `js-yaml` before committing
- [ ] 2.6 Add `commit-lint` to `ci-complete` job's `needs` list (full-CI aggregator consistency)

## 3. Verification (Incremental CI)

- [ ] 3.1 Run `actionlint` on the modified workflow file
- [ ] 3.2 Local dry-run validation: `npx commitlint --from=HEAD~3 --to=HEAD --verbose` (validates config + config-conventional resolution before relying on CI)
- [ ] 3.3 Verify commit-lint job appears in CI workflow runs
- [ ] 3.4 Verify disabled jobs remain disabled (grep for `if: false` or conditional patterns)
- [ ] 3.5 Register commit-lint as a required status check in the GitHub branch-protection ruleset (manual step) AND document the procedure
