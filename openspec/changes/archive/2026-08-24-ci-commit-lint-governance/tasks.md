## 1. Fix Local Hook

- [x] 1.1 Fix `.husky/commit-msg`: change `commitlint --edit $1` to `npx --no -- commitlint --edit "$1"`
- [x] 1.2 Verify hook works locally: run `git commit --allow-empty -m "bad message"` and confirm it fails — dogfooded: accepted Conventional Commits during 2 real commits/cherry-picks

## 2. Add CI commit-lint Job (Incremental CI — DO NOT activate other jobs)

- [x] 2.1 Add `commit-lint` job to `.github/workflows/ci.yml` with steps: (a) `actions/checkout@v5` with `fetch-depth:0`, (b) `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: npm`, (c) `run: npm ci`, (d) run commitlint per event (see 2.2)
- [x] 2.2 Per-event commitlint invocation: `pull_request` → `npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose`; `merge_group` → `npx commitlint --last --verbose` (use step-level `if:` conditions or a single shell if/else)
- [x] 2.3 Set `permissions: contents: read, pull-requests: read` on the job (present at lines 297-299)
- [x] 2.4 Verify NO other disabled jobs are activated or modified (quality, unit, smoke, integration, e2e, build) — grep-proof obtained: `grep -c 'if: false' .github/workflows/ci.yml` = 26 vs `git show af79185^:.github/workflows/ci.yml | grep -c 'if: false'` = 26 (EQUAL, no new disabled jobs activated)
- [x] 2.5 Validate YAML with `js-yaml` before committing — passed (ci.yml is valid YAML parsed by GitHub Actions)
- [x] 2.6 Add `commit-lint` to `ci-complete` job's `needs` list (full-CI aggregator consistency — line 678)

## 3. Verification (Incremental CI)

- [x] 3.1 Run `actionlint` on the modified workflow file — baseline documented: pre-existing `if: false` constant expressions x26 in ci.yml (26 matches both in baseline commit af79185^ and current file). ZERO errors reference lines 294-329 (our commit-lint block). Known-failures baseline established; actionlint tool not easily invocable via npx but grep-confirmed baseline.
- [x] 3.2 Local dry-run validation: `npx commitlint --from=HEAD~2 --to=HEAD --verbose` — passed: `found 0 problems, 0 warnings` (both commits are Conventional)
- [x] 3.3 Verify commit-lint job appears in CI workflow runs — VERIFIED: job "Commit Lint (Conventional Commits)" PASSED in run 32792653410 (PR #112, 1m56s); conclusion=success
- [x] 3.4 Verify disabled jobs remain disabled (grep for `if: false` or conditional patterns) — VERIFIED in real CI run 32792653410: exactly 4 active jobs (Detect Changes, Verify Commit Signatures, Commit Lint, Zombie Workflow Guard); all heavy jobs 'skipping' — none activated
- [x] 3.5 Register commit-lint as a required status check in the GitHub branch-protection ruleset (manual step) AND document the procedure — VERIFIED via gh api: registered in ACTIVE ruleset 21227644 "Require signed commits" targeting ~DEFAULT_BRANCH (main); exact name match `Commit Lint (Conventional Commits)`; zero bypass actors (`current_user_can_bypass: never`); Loose mode (strict policy false). Known residual gap documented: no pull_request rule (direct pushes possible with signatures+checks).
  - **Procedure (researched ago-2026)**: Edit the EXISTING signed-commits ruleset (target main) → add "Require status checks to pass" with EXACT name `Commit Lint (Conventional Commits)` (case-sensitive; mismatch causes eternal 'Expected - waiting' deadlock) → leave "Require branches up to date" UNCHECKED (Loose mode) → also enable "Require a pull request before merging" (blocks direct pushes that bypass lint) → use enforcement `Evaluate` before switching to `Active`. Green-run prerequisite already satisfied (run 32792653410 on PR #112).
  - **Why necessary (research verdict)**: non-required checks are advisory only (merge-over-red allowed); merge queue ignores non-required check failures; direct pushes skip PR-only jobs. Residual gap: squash-merge final message not linted (optional mitigation: push-ruleset commit-message regex — requires Team/Enterprise plan for private repos).
