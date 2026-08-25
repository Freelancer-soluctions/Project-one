# Delta Spec: PR Metadata Governance

> **Change**: `pr-metadata-governance` | **Status**: proposed
> **Stack**: PR Title Lint + DCO Sign-off + PR Template
> **Depends on**: ci-commit-lint-governance (commit-lint + signing already active)

---

## REQ-001: PR Title Lint Validation

**Priority**: P1
**Component**: `.github/workflows/ci.yml`

### Scenario: Valid PR title

```gherkin
GIVEN a pull request is opened or synchronized
AND the PR title follows Conventional Commits format (`type(scope): description`)
WHEN the `PR Title Lint` job runs
THEN the job succeeds
AND the status check `PR Title Lint` reports success
```

### Scenario: Invalid PR title

```gherkin
GIVEN a pull request is opened or synchronized
AND the PR title does NOT follow Conventional Commits format
WHEN the `PR Title Lint` job runs
THEN the job fails
AND the status check `PR Title Lint` reports failure
AND the PR cannot be merged (required check in ruleset 21227644)
```

### Scenario: PR title with valid type but missing description

```gherkin
GIVEN a pull request with title "feat:"
WHEN the `PR Title Lint` job runs
THEN the job fails with error indicating missing description
```

### Scenario: PR title with invalid type

```gherkin
GIVEN a pull request with title "feature: add login"
WHEN the `PR Title Lint` job runs
THEN the job fails with error indicating invalid type
AND suggests valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

### Scenario: Bot-authored PR (dependabot)

```gherkin
GIVEN a pull request authored by `dependabot[bot]`
WHEN the `PR Title Lint` job runs
THEN the job executes normally (bots are NOT exempt from title lint)
AND the PR title must still follow Conventional Commits
```

### Acceptance Criteria

| ID      | Criterion                                                   | Status |
| ------- | ----------------------------------------------------------- | ------ |
| AC-001a | Job `pr-title-lint` exists in ci.yml                        | ⬜     |
| AC-001b | Job is parallel (no `needs` dependency)                     | ⬜     |
| AC-001c | Uses `amannn/action-semantic-pull-request@v6`               | ⬜     |
| AC-001d | Types match `@commitlint/config-conventional`               | ⬜     |
| AC-001e | `requireScope: false`                                       | ⬜     |
| AC-001f | `subjectPattern` rejects capital-first                      | ⬜     |
| AC-001g | Registered as required check in ruleset 21227644            | ⬜     |
| AC-001h | Rollout: `continue-on-error: true` first cycle, then Active | ⬜     |

---

## REQ-002: DCO Sign-off Enforcement

**Priority**: P1.5
**Component**: `.github/workflows/ci.yml`

### Scenario: PR with all commits signed off

```gherkin
GIVEN a pull request with commits
AND every commit contains `Signed-off-by: Name <email>` trailer
AND the email matches the commit author email
WHEN the `DCO` job runs
THEN the job succeeds
AND the status check `DCO` reports success
```

### Scenario: PR with unsigned commit

```gherkin
GIVEN a pull request with a commit missing `Signed-off-by` trailer
WHEN the `DCO` job runs
THEN the job fails
AND the status check `DCO` reports failure
AND the PR cannot be merged (required check in ruleset 21227644)
AND the error message identifies the specific commit(s) missing sign-off
```

### Scenario: PR with wrong sign-off email

```gherkin
GIVEN a pull request with commits
AND a commit has `Signed-off-by: DevJuan <wrong@email.com>`
AND the commit author is `DevJuan <juan@empresa.com>`
WHEN the `DCO` job runs
THEN the job fails
AND the error identifies the email mismatch
```

### Scenario: Dependabot PR

```gherkin
GIVEN a pull request authored by `dependabot[bot]`
WHEN the `DCO` job runs
THEN the job is SKIPPED (bot is whitelisted via `well-known` policy)
AND the status check `DCO` reports success (not required for this PR)
```

### Scenario: Merge commits in PR

```gherkin
GIVEN a pull request containing merge commits (e.g., from `Update branch` button)
WHEN the `DCO` job runs
THEN merge commits are SKIPPED (default behavior)
AND only non-merge commits are validated for `Signed-off-by`
```

### Scenario: Squash-merge preserves trailers

```gherkin
GIVEN a PR with signed-off commits merged via squash
AND repo setting `squash_merge_commit_message` is `COMMIT_MESSAGES`
WHEN the squash commit is created on main
THEN the `Signed-off-by` trailers from original commits are PRESERVED in the squash commit body
```

### Acceptance Criteria

| ID      | Criterion                                                                       | Status |
| ------- | ------------------------------------------------------------------------------- | ------ |
| AC-002a | Job `dco` exists in ci.yml                                                      | ⬜     |
| AC-002b | Job is parallel (no `needs` dependency)                                         | ⬜     |
| AC-002c | Uses `KineticCafe/actions-dco@v3.2.0`                                           | ⬜     |
| AC-002d | Config TOML: `[bot] policy = "well-known" categories = ["dependency-updaters"]` | ⬜     |
| AC-002e | Validates ALL commits in PR (base..head range)                                  | ⬜     |
| AC-002f | Skips merge commits (default behavior)                                          | ⬜     |
| AC-002g | Email matching: sign-off email == author email (case-insensitive)               | ⬜     |
| AC-002h | Registered as required check in ruleset 21227644                                | ⬜     |
| AC-002i | Rollout: `continue-on-error: true` first cycle, then Active                     | ⬜     |

---

## REQ-003: Squash Setting Configuration

**Priority**: P1 (admin action)
**Component**: GitHub repo settings (manual)

### Scenario: Squash merge uses PR title

```gherkin
GIVEN a PR is merged via squash
AND repo setting `squash_merge_commit_title` is `PR_TITLE`
AND repo setting `squash_merge_commit_message` is `COMMIT_MESSAGES`
WHEN the squash commit is created on main
THEN the commit subject equals the PR title
AND the commit body contains the original commit messages
AND `Signed-off-by` trailers are preserved in the body
```

### Scenario: Single-commit PR squash

```gherkin
GIVEN a PR with a single commit
AND the PR title follows Conventional Commits
AND repo setting `squash_merge_commit_title` is `PR_TITLE`
WHEN the PR is merged via squash
THEN the commit subject equals the PR title (NOT the original commit message)
AND `PR Title Lint` validated the title before merge
AND `commit-lint` validated the commit message in the commit-msg hook
```

### Acceptance Criteria

| ID      | Criterion                                                                   | Status      |
| ------- | --------------------------------------------------------------------------- | ----------- |
| AC-003a | `squash_merge_commit_title` changed from `COMMIT_OR_PR_TITLE` to `PR_TITLE` | ⬜ (admin)  |
| AC-003b | `squash_merge_commit_message` confirmed as `COMMIT_MESSAGES`                | ⬜ (verify) |
| AC-003c | Documented in CONTRIBUTING.md that PR title = final commit message          | ⬜          |

---

## REQ-004: PR Template

**Priority**: P2
**Component**: `.github/PULL_REQUEST_TEMPLATE.md`

### Scenario: PR created with template

```gherkin
GIVEN a contributor creates a new pull request
WHEN the PR form loads
THEN the body is pre-filled with the template structure
AND the template includes: Summary, Type/Scope, Related Issue, Testing, Screenshots, Checklist
```

### Scenario: PR created with empty template

```gherkin
GIVEN a contributor creates a new pull request
AND does NOT fill in any template sections
WHEN the PR is submitted
THEN the PR is created (GitHub does not enforce template content)
AND reviewers are notified via CODEOWNERS review requirement
```

### Scenario: PR with linked issue

```gherkin
GIVEN a PR with `Closes #123` in the body
WHEN a reviewer opens the PR
THEN they can see the linked issue
AND the issue is auto-closed when the PR merges (GitHub native behavior)
```

### Acceptance Criteria

| ID      | Criterion                                   | Status |
| ------- | ------------------------------------------- | ------ |
| AC-004a | `.github/PULL_REQUEST_TEMPLATE.md` exists   | ⬜     |
| AC-004b | Template includes all 6 sections            | ⬜     |
| AC-004c | Checklist includes `Signed-off-by` reminder | ⬜     |
| AC-004d | Template uses HTML comments for guidance    | ⬜     |
| AC-004e | CONTRIBUTING.md updated with PR guidelines  | ⬜     |

---

## REQ-005: CI Composition

**Priority**: P1
**Component**: `.github/workflows/ci.yml`

### Scenario: CI_MINIMAL (PR)

```gherkin
GIVEN a pull request event
WHEN ci.yml runs
THEN it executes: commit-lint, pr-title-lint, dco, security-sast, e2e-backend, client-unit, server-unit, server-integration
AND all jobs run in PARALLEL (no `needs` dependency)
AND ci-complete waits for ALL jobs via `if: always()` + `needs: [...]`
```

### Scenario: CI_COMPLETE gate

```gherkin
GIVEN all CI jobs have completed
WHEN the `ci-complete` job evaluates
THEN it checks `needs.*.result` for each job
AND if ALL results are `success` or `skipped` → ci-complete succeeds
AND if ANY result is `failure` or `cancelled` → ci-complete fails
```

### Scenario: PR Title Lint job in CI_MINIMAL

```gherkin
GIVEN a pull request event
WHEN ci.yml runs
THEN the `pr-title-lint` job is included in CI_MINIMAL
AND the job name is `PR Title Lint` (exact string for ruleset)
AND the job has `permissions: pull-requests: read`
AND the job only runs on `pull_request` events
```

### Scenario: DCO job in CI_MINIMAL

```gherkin
GIVEN a pull request event
WHEN ci.yml runs
THEN the `dco` job is included in CI_MINIMAL
AND the job name is `DCO` (exact string for ruleset)
AND the job has `permissions: contents: read`
AND the job only runs on `pull_request` events
```

### Acceptance Criteria

| ID      | Criterion                                                | Status |
| ------- | -------------------------------------------------------- | ------ |
| AC-005a | `pr-title-lint` job added to ci.yml                      | ⬜     |
| AC-005b | `dco` job added to ci.yml                                | ⬜     |
| AC-005c | Both jobs are parallel (no `needs`)                      | ⬜     |
| AC-005d | Both jobs added to `ci-complete.needs` array             | ⬜     |
| AC-005e | `pr-title-lint` has `permissions: pull-requests: read`   | ⬜     |
| AC-005f | `dco` has `permissions: contents: read`                  | ⬜     |
| AC-005g | Both jobs have `if: github.event_name == 'pull_request'` | ⬜     |
| AC-005h | Job names exactly match required check names in ruleset  | ⬜     |

---

## REQ-006: Ruleset Update

**Priority**: P1 (admin action)
**Component**: GitHub ruleset 21227644

### Scenario: Ruleset includes PR Title Lint

```gherkin
GIVEN ruleset 21227644 on branch `main`
WHEN a PR targets main
THEN `PR Title Lint` is a required status check
AND the check must pass before merge is allowed
```

### Scenario: Ruleset includes DCO

```gherkin
GIVEN ruleset 21227644 on branch `main`
WHEN a PR targets main
THEN `DCO` is a required status check
AND the check must pass before merge is allowed
```

### Scenario: Dependabot PR bypasses DCO

```gherkin
GIVEN ruleset 21227644 on branch `main`
AND dependabot PR has DCO check skipped (whitelisted in action config)
WHEN the merge is attempted
THEN GitHub sees the DCO check as `success` (skipped = success for required checks)
AND the merge is allowed
```

### Acceptance Criteria

| ID      | Criterion                                                      | Status      |
| ------- | -------------------------------------------------------------- | ----------- |
| AC-006a | `PR Title Lint` added to ruleset 21227644 required checks      | ⬜ (admin)  |
| AC-006b | `DCO` added to ruleset 21227644 required checks                | ⬜ (admin)  |
| AC-006c | Zero bypass actors maintained                                  | ⬜ (admin)  |
| AC-006d | Verify: dependabot PRs still mergeable (DCO skipped = success) | ⬜ (verify) |

---

## REQ-007: Documentation

**Priority**: P2
**Component**: `CONTRIBUTING.md`

### Scenario: Contributor reads PR guidelines

```gherkin
GIVEN a contributor opens CONTRIBUTING.md
WHEN they read the PR section
THEN they find: PR title format, DCO requirement (`git commit -s`), template usage, review process
```

### Scenario: Contributor sees DCO requirement

```gherkin
GIVEN a contributor reads CONTRIBUTING.md
WHEN they reach the DCO section
THEN they find: what DCO is, why it's required, how to sign off (`git commit -s`), dependabot exemption
```

### Acceptance Criteria

| ID      | Criterion                                               | Status |
| ------- | ------------------------------------------------------- | ------ |
| AC-007a | CONTRIBUTING.md exists or is created                    | ⬜     |
| AC-007b | PR title format documented (Conventional Commits)       | ⬜     |
| AC-007c | DCO sign-off requirement documented                     | ⬜     |
| AC-007d | PR template usage documented                            | ⬜     |
| AC-007e | Review process documented (CODEOWNERS, required checks) | ⬜     |
