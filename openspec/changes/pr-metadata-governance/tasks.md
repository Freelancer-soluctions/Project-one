# Tasks: PR Metadata Governance

> **Change**: `pr-metadata-governance` | **Status**: proposed
> **Estimated**: 7 tasks + 2 admin tasks
> **Dependencies**: ci-commit-lint-governance (commit-lint + signing active)

---

## Task 1: Add PR Title Lint Job to ci.yml

**Priority**: P1 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add a parallel job `pr-title-lint` to ci.yml using `amannn/action-semantic-pull-request@v6`. The job validates that PR titles follow Conventional Commits format.

### Implementation

```yaml
pr-title-lint:
  name: PR Title Lint
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read
  if: github.event_name == 'pull_request'
  steps:
    - uses: amannn/action-semantic-pull-request@v6
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        types: |
          feat
          fix
          docs
          style
          refactor
          perf
          test
          build
          ci
          chore
          revert
        requireScope: false
        subjectPattern: ^(?![A-Z]).+$
        ignoreLabels: |
          bot
          ignore-semantic-pull-request
```

### Acceptance

- [ ] Job exists in ci.yml
- [ ] Job is parallel (no `needs` dependency)
- [ ] Job has `permissions: pull-requests: read`
- [ ] Job only runs on `pull_request` events
- [ ] Types list matches `@commitlint/config-conventional`
- [ ] Job name is exactly `PR Title Lint`

---

## Task 2: Add DCO Job to ci.yml

**Priority**: P1.5 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add a parallel job `dco` to ci.yml using `KineticCafe/actions-dco@v3.2.0`. The job validates that all commits in the PR have `Signed-off-by` trailers with matching author emails.

### Implementation

```yaml
dco:
  name: DCO
  runs-on: ubuntu-latest
  permissions:
    contents: read
  if: github.event_name == 'pull_request'
  steps:
    - uses: KineticCafe/actions-dco@v3.2.0
      with:
        config: |
          [bot]
          policy = "well-known"
          categories = ["dependency-updaters"]
```

### Acceptance

- [ ] Job exists in ci.yml
- [ ] Job is parallel (no `needs` dependency)
- [ ] Job has `permissions: contents: read`
- [ ] Job only runs on `pull_request` events
- [ ] Config TOML uses `well-known` policy
- [ ] `dependency-updaters` category covers dependabot[bot]
- [ ] Job name is exactly `DCO`

---

## Task 3: Update ci-complete Gate

**Priority**: P1 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add `pr-title-lint` and `dco` to the `needs` array of the `ci-complete` job.

### Implementation

```yaml
ci-complete:
  name: CI Complete
  runs-on: ubuntu-latest
  if: always()
  needs:
    - commit-lint
    - pr-title-lint # ADD
    - dco # ADD
    - security-sast
    - e2e-backend
    - client-unit
    - server-unit
    - server-integration
  steps:
    - name: Check all jobs
      run: |
        if [[ "${{ needs.commit-lint.result }}" != "success" && "${{ needs.commit-lint.result }}" != "skipped" ]]; then
          echo "❌ commit-lint: ${{ needs.commit-lint.result }}"
          exit 1
        fi
        if [[ "${{ needs.pr-title-lint.result }}" != "success" && "${{ needs.pr-title-lint.result }}" != "skipped" ]]; then
          echo "❌ pr-title-lint: ${{ needs.pr-title-lint.result }}"
          exit 1
        fi
        if [[ "${{ needs.dco.result }}" != "success" && "${{ needs.dco.result }}" != "skipped" ]]; then
          echo "❌ dco: ${{ needs.dco.result }}"
          exit 1
        fi
        # ... existing checks ...
        echo "✅ All jobs passed"
```

### Acceptance

- [ ] `pr-title-lint` added to `needs` array
- [ ] `dco` added to `needs` array
- [ ] `ci-complete.needs` array contains all 9 jobs
- [ ] Gate logic checks both new jobs

---

## Task 4: Create PR Template

**Priority**: P2 | **Effort**: S | **Component**: `.github/PULL_REQUEST_TEMPLATE.md`

### Description

Create `.github/PULL_REQUEST_TEMPLATE.md` with 6 sections: Summary, Type/Scope, Related Issue, Testing, Screenshots, Checklist.

### Implementation

See REQ-004 spec for template content. Key sections:

- Summary (what + why)
- Type/Scope (checkboxes: client/server/e2e/shared/ci)
- Related Issue (Closes #)
- How Has This Been Tested? (checkboxes: unit/integration/e2e/manual/N/A)
- Screenshots (if applicable)
- Pre-merge Checklist (Signed-off-by, tests, docs, breaking changes)

### Acceptance

- [ ] `.github/PULL_REQUEST_TEMPLATE.md` exists
- [ ] All 6 sections present
- [ ] Checklist includes `Signed-off-by` reminder
- [ ] HTML comments used for guidance

---

## Task 5: Create CODEOWNERS

**Priority**: P2 | **Effort**: S | **Component**: `.github/CODEOWNERS`

### Description

Create `.github/CODEOWNERS` to define review boundaries for monorepo components.

### Implementation

```
# Default: @Freelancer-soluctions/core-team
*                           @Freelancer-soluctions/core-team

# Client
apps/client/                @Freelancer-soluctions/frontend-team

# Server
apps/server/                @Freelancer-soluctions/backend-team

# CI/CD
.github/                    @Freelancer-soluctions/devops-team
.github/workflows/          @Freelancer-soluctions/devops-team

# E2E
apps/e2e/                   @Freelancer-soluctions/qa-team

# OpenSpec
openspec/                   @Freelancer-soluctions/architects

# Learning docs
docs/learning/              @Freelancer-soluctions/core-team
```

### Acceptance

- [ ] `.github/CODEOWNERS` exists
- [ ] Default owner defined (`*`)
- [ ] Component-specific owners defined
- [ ] Team names match GitHub teams

---

## Task 6: Update CONTRIBUTING.md

**Priority**: P2 | **Effort**: M | **Component**: `CONTRIBUTING.md`

### Description

Add PR metadata governance section to CONTRIBUTING.md covering: PR title format, DCO requirement, template usage, review process.

### Implementation

New sections:

```markdown
## Pull Request Guidelines

### PR Title Format

Follow Conventional Commits: `type(scope): description`

- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Scope: client, server, e2e, shared, config (optional)
- Description: lowercase, no period, imperative mood

### DCO Sign-off (Required)

All commits must include `Signed-off-by: Your Name <your@email.com>`

- Use `git commit -s` to auto-add the trailer
- Email must match your Git author email
- Exemption: dependabot and other automated bots

### PR Template

Use the provided PR template when creating PRs. Include:

- Summary of changes
- Type/scope classification
- Link to related issue
- Testing evidence
- Screenshots (if UI changes)
- Pre-merge checklist

### Review Process

- CODEOWNERS defines required reviewers per component
- All required status checks must pass
- Signed commits required (SSH/GPG)
```

### Acceptance

- [ ] CONTRIBUTING.md exists or is created
- [ ] PR title format documented
- [ ] DCO requirement documented
- [ ] PR template usage documented
- [ ] Review process documented

---

## Task 7: Create Learning Doc 05e

**Priority**: P2 | **Effort**: M | **Component**: `docs/learning/ci-cd/05e-pr-metadata-governance.md`

**Status**: ✅ DONE (commit `128a0e8`)

### Description

Research brief covering DCO, PR title lint, templates, squash interaction, enterprise compliance.

---

## Admin Tasks (Manual)

These tasks require admin access to GitHub repo settings. Cannot be automated via CI.

### Admin-1: Change Squash Setting

**Priority**: P1 | **Effort**: XS | **Component**: GitHub repo settings

**Action**: Change `squash_merge_commit_title` from `COMMIT_OR_PR_TITLE` to `PR_TITLE`.

**Via UI**: Repo Settings → General → Pull Requests → "Allow squash merging" → Default commit message → "Pull request title"

**Via API**:

```bash
gh api repos/Freelancer-soluctions/Project-one \
  --method PATCH \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=COMMIT_MESSAGES
```

**Verify**:

```bash
gh api repos/Freelancer-soluctions/Project-one \
  --jq '.squash_merge_commit_title'
# Expected: "PR_TITLE"
```

---

### Admin-2: Register Required Checks in Ruleset

**Priority**: P1 | **Effort**: S | **Component**: GitHub ruleset 21227644

**Action**: Add `PR Title Lint` and `DCO` to ruleset 21227644 as required status checks.

**Via UI**: Repo Settings → Rules → Rulesets → Ruleset 21227644 → Edit → Required status checks → Add:

1. `PR Title Lint`
2. `DCO`

**Via API** (if available):

```bash
gh api repos/Freelancer-soluctions/Project-one/rulesets/21227644 \
  --method PATCH \
  -f "conditions[][ref_name_filter][include]=refs/heads/main" \
  -f "rules[][type]=required_status_checks" \
  -f "rules[][parameters][required_status_checks][0][context]=PR Title Lint" \
  -f "rules[][parameters][required_status_checks][1][context]=DCO"
```

**Verify**:

```bash
gh api repos/Freelancer-soluctions/Project-one/rulesets/21227644 \
  --jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'
# Expected: Verify Commit Signatures, Commit Lint (Conventional Commits), PR Title Lint, DCO
```

---

## Execution Order

```
Phase 1 (CI jobs):
  Task 1: PR Title Lint job         ← ci.yml
  Task 2: DCO job                   ← ci.yml
  Task 3: ci-complete gate update   ← ci.yml
  (commit all three as single atomic commit)

Phase 2 (Admin):
  Admin-1: Change squash setting    ← manual
  Admin-2: Register ruleset checks  ← manual

Phase 3 (Templates & Docs):
  Task 4: PR Template               ← .github/
  Task 5: CODEOWNERS                ← .github/
  Task 6: CONTRIBUTING.md           ← root
  (commit as single atomic commit)

Phase 4 (Verification):
  - Verify PR Title Lint job runs on test PR
  - Verify DCO job runs on test PR
  - Verify ci-complete aggregates correctly
  - Verify ruleset checks are enforced
```

---

## Rollout

```
Week 1-2: continue-on-error: true (both new jobs)
  → Team adjusts, sees failures without blocking

Week 3: Remove continue-on-error
  → Jobs become real checks

Week 3: Admin actions
  → squash setting changed
  → ruleset checks registered

Week 4: Full enforcement
  → All checks required
  → All documentation complete
```
