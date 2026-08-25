# Tasks: PR Metadata Governance

> **Change**: `pr-metadata-governance` | **Status**: proposed (REVIEWED — planner fixes applied)
> **Estimated**: 8 tasks + 2 admin tasks
> **Dependencies**: ci-commit-lint-governance (commit-lint + signing active)
> **Planner review**: 5 critical issues fixed (ci-complete.needs, CI_MINIMAL guard, Admin-2 API, merge_group coverage, dependabot title lint)

---

## Task 1: Add PR Title Lint Job to ci.yml

**Priority**: P1 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add a parallel job `pr-title-lint` to ci.yml using `amannn/action-semantic-pull-request@v6`. Handles both `pull_request` and `merge_group` events.

### Implementation

```yaml
pr-title-lint:
  name: PR Title Lint
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read
  steps:
    # PR events: validate PR title against Conventional Commits
    - name: Lint PR title
      if: github.event_name == 'pull_request'
      uses: amannn/action-semantic-pull-request@v6
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
        ignoreLabels: |
          bot
          ignore-semantic-pull-request
    # Merge queue: squash commit title already validated by commitlint --last
    - name: Skip on merge_group (covered by commitlint)
      if: github.event_name == 'merge_group'
      run: echo "✅ Merge queue — squash commit title validated by commitlint"
  # Phase 1: non-blocking. Remove after team adjusts (1 sprint).
  continue-on-error: true
```

**Notes**:

- `subjectPattern` REMOVED — was stricter than commitlint (`^[A-Z]` rejection). PR title lint validates TYPE only; commitlint handles full message format.
- `merge_group` step emits success — required check is satisfiable in merge queue.
- `continue-on-error: true` for Phase 1 rollout (remove in Phase 2).

### Acceptance

- [x] Job exists in ci.yml
- [x] Job is parallel (no `needs` dependency)
- [x] Job has `permissions: pull-requests: read`
- [x] Handles both `pull_request` and `merge_group` events
- [x] Types list matches `@commitlint/config-conventional`
- [x] Job name is exactly `PR Title Lint`
- [x] `continue-on-error: true` present (Phase 1)

---

## Task 2: Add DCO Job to ci.yml

**Priority**: P1.5 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add a parallel job `dco` to ci.yml using `KineticCafe/actions-dco@v3.2.0`. Handles both `pull_request` and `merge_group` events.

### Implementation

```yaml
dco:
  name: DCO
  runs-on: ubuntu-latest
  permissions:
    contents: read
    pull-requests: read
  steps:
    # PR events: validate Signed-off-by on all commits
    - name: DCO sign-off check
      if: github.event_name == 'pull_request'
      uses: KineticCafe/actions-dco@v3.2.0
      with:
        config: |
          [bot]
          policy = "well-known"
          categories = ["dependency-updaters"]
    # Merge queue: DCO is a PR-level check; squash commit doesn't carry individual trailers
    - name: Skip on merge_group (PR-level check)
      if: github.event_name == 'merge_group'
      run: echo "✅ Merge queue — DCO validated at PR level"
  # Phase 1: non-blocking. Remove after team adjusts (1 sprint).
  continue-on-error: true
```

**Notes**:

- `merge_group` step emits success — required check is satisfiable in merge queue.
- `well-known` policy whitelists dependabot[bot], renovate[bot], snyk-bot[bot].
- `continue-on-error: true` for Phase 1 rollout (remove in Phase 2).

### Acceptance

- [x] Job exists in ci.yml
- [x] Job is parallel (no `needs` dependency)
- [x] Job has `permissions: contents: read`
- [x] Handles both `pull_request` and `merge_group` events
- [x] Config TOML uses `well-known` policy
- [x] `dependency-updaters` category covers dependabot[bot]
- [x] Job name is exactly `DCO`
- [x] `continue-on-error: true` present (Phase 1)

---

## Task 3: Update ci-complete Gate

**Priority**: P1 | **Effort**: S | **Component**: `.github/workflows/ci.yml`

### Description

Add `pr-title-lint` and `dco` to the `needs` array of the `ci-complete` job. **ADD-ONLY** — do NOT remove or modify existing entries.

### Current ci-complete (real)

```yaml
ci-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }}
  name: CI Complete
  runs-on: ubuntu-latest
  needs:
    - repo-discovery
    - actionlint
    - commit-lint
    - client-lint
    - client-format-check
    - client-typecheck
    - client-complexity
    - client-dead-code
    - client-import-bounds
    - server-lint
    - server-format-check
    - server-typecheck
    - server-complexity
    - server-dead-code
    - server-import-bounds
    - client-build
    - server-build
    - client-sonarqube
    - server-sonarqube
    - client-coverage
    - server-coverage
    - client-depcheck
    - server-depcheck
    - test-unit-client
    - test-unit-server
    - test-integration
    - test-smoke
    - e2e
    - verify-signatures
    - zombie-workflow-guard
```

### Target ci-complete (after change)

```yaml
ci-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }} # PRESERVE existing guard
  name: CI Complete
  runs-on: ubuntu-latest
  needs:
    - repo-discovery
    - actionlint
    - commit-lint
    - pr-title-lint # ADD
    - dco # ADD
    - client-lint
    - client-format-check
    - client-typecheck
    - client-complexity
    - client-dead-code
    - client-import-bounds
    - server-lint
    - server-format-check
    - server-typecheck
    - server-complexity
    - server-dead-code
    - server-import-bounds
    - client-build
    - server-build
    - client-sonarqube
    - server-sonarqube
    - client-coverage
    - server-coverage
    - client-depcheck
    - server-depcheck
    - test-unit-client
    - test-unit-server
    - test-integration
    - test-smoke
    - e2e
    - verify-signatures
    - zombie-workflow-guard
  steps:
    - name: Check for failures
      run: |
        if [[ "${{ contains(needs.*.result, 'failure') }}" == "true" ]]; then
          echo "❌ One or more upstream jobs failed"
          exit 1
        fi
        if [[ "${{ contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
          echo "⚠️ One or more upstream jobs were cancelled — skipping ci-complete"
          exit 0
        fi
        echo "✅ All upstream jobs succeeded or were skipped"
```

**Critical**: The `if` condition MUST remain `${{ vars.CI_MINIMAL != 'true' && always() }}`. The step logic MUST use the existing `contains(needs.*.result, ...)` pattern — do NOT replace with per-job result checks.

### Acceptance

- [x] `pr-title-lint` added to `needs` array
- [x] `dco` added to `needs` array
- [x] ALL existing entries preserved (30 jobs)
- [x] `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` PRESERVED
- [x] Gate logic uses `contains(needs.*.result, ...)` pattern (existing)

---

## Task 4: Configure dependabot.yml for Conventional Commits

**Priority**: P1 | **Effort**: XS | **Component**: `.github/dependabot.yml`

### Description

Add `commit-message: prefix: "fix"` to the npm ecosystem in dependabot.yml. Without this, dependabot npm PRs have titles like "Bump axios from 1.0 to 1.1" which fail PR Title Lint.

### Current state

```yaml
# npm ecosystem — NO commit-message prefix
- package-ecosystem: 'npm'
  directory: '/'
  schedule:
    interval: 'weekly'
  # ... no commit-message section
```

### Target state

```yaml
- package-ecosystem: 'npm'
  directory: '/'
  schedule:
    interval: 'weekly'
    day: 'monday'
    time: '03:00'
    timezone: 'UTC'
  open-pull-requests-limit: 10
  labels:
    - 'dependencies'
    - 'automated'
  commit-message:
    prefix: 'fix' # ADD — makes titles Conventional Commits
  groups:
    # ... existing groups unchanged
```

**Note**: `github-actions` and `docker` ecosystems already have `commit-message: prefix: "ci"`. Only `npm` is missing.

### Acceptance

- [x] `commit-message: prefix: "fix"` added to npm ecosystem
- [x] All other dependabot.yml content unchanged
- [x] PR titles will now be "fix(deps): bump axios from 1.0 to 1.1"

---

## Task 5: Create PR Template

**Priority**: P2 | **Effort**: S | **Component**: `.github/PULL_REQUEST_TEMPLATE.md`

### Description

Create `.github/PULL_REQUEST_TEMPLATE.md` with 6 sections.

### Implementation

```markdown
## Summary

<!-- What does this PR do and why? Link to context if needed. -->

## Type / Scope

<!-- Check all that apply: -->

- [ ] Client (React/Vite)
- [ ] Server (Express/Prisma)
- [ ] E2E (Playwright)
- [ ] Shared/Config
- [ ] CI/CD

## Related Issue

<!-- Required for traceability. Use "Closes #<number>" to auto-close on merge. -->

Closes #

## How Has This Been Tested?

<!-- Describe the tests you ran. Provide reproducibility steps if manual. -->

- [ ] Unit tests (vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Manual testing
- [ ] N/A (docs/config only)

## Screenshots (if applicable)

<!-- Add screenshots or screen recordings for UI changes. Remove this section if not applicable. -->

## Pre-merge Checklist

- [ ] `Signed-off-by` present in all commits (`git commit -s`)
- [ ] Tests pass locally (`npm run test`)
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or documented in Summary)
- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) format
```

### Acceptance

- [x] `.github/PULL_REQUEST_TEMPLATE.md` exists
- [x] All 6 sections present
- [x] Checklist includes `Signed-off-by` reminder
- [x] HTML comments used for guidance
- [x] PR title format reminder in checklist

---

## Task 6: Create CODEOWNERS

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

- [x] `.github/CODEOWNERS` exists
- [x] Default owner defined (`*`)
- [x] Component-specific owners defined
- [x] Team names match GitHub teams

---

## Task 7: Update CONTRIBUTING.md

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

- [x] CONTRIBUTING.md exists or is created
- [x] PR title format documented
- [x] DCO requirement documented
- [x] PR template usage documented
- [x] Review process documented

---

## Task 8: Create Learning Doc 05e

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

**⚠️ CRITICAL**: Do NOT use partial PATCH — it would DELETE existing required checks. Use GET → modify → PUT.

**Via UI** (recommended): Repo Settings → Rules → Rulesets → Ruleset 21227644 → Edit → Required status checks → Add:

1. `PR Title Lint`
2. `DCO`

**Via API** (safe approach):

```bash
# Step 1: GET current ruleset
gh api repos/Freelancer-soluctions/Project-one/rulesets/21227644 > /tmp/ruleset.json

# Step 2: Append new checks to required_status_checks
# (use jq to add PR Title Lint and DCO to existing array)
jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks += [{"context":"PR Title Lint"},{"context":"DCO"}]' /tmp/ruleset.json > /tmp/ruleset-updated.json

# Step 3: PUT full updated ruleset
gh api repos/Freelancer-soluctions/Project-one/rulesets/21227644 \
  --method PUT \
  --input /tmp/ruleset-updated.json
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
Phase 1 (CI jobs + dependabot):
  Task 1: PR Title Lint job         ← ci.yml (with merge_group + continue-on-error)
  Task 2: DCO job                   ← ci.yml (with merge_group + continue-on-error)
  Task 3: ci-complete gate update   ← ci.yml (ADD-only, preserve CI_MINIMAL guard)
  Task 4: dependabot.yml fix        ← .github/dependabot.yml
  (commit all four as single atomic commit)

Phase 2 (Admin):
  Admin-1: Change squash setting    ← manual
  Admin-2: Register ruleset checks  ← manual (GET→PUT, not PATCH)

Phase 3 (Templates & Docs):
  Task 5: PR Template               ← .github/
  Task 6: CODEOWNERS                ← .github/
  Task 7: CONTRIBUTING.md           ← root
  (commit as single atomic commit)

Phase 4 (Verification):
  - Verify PR Title Lint job runs on test PR
  - Verify DCO job runs on test PR
  - Verify ci-complete aggregates correctly
  - Verify ruleset checks are enforced
  - Verify dependabot PR titles are Conventional Commits
```

---

## Rollout

```
Week 1-2: continue-on-error: true (both new jobs)
  → Team adjusts, sees failures without blocking
  → dependabot.yml fix ensures dependency PRs pass title lint

Week 3: Remove continue-on-error
  → Jobs become real checks

Week 3: Admin actions
  → squash setting changed (Admin-1)
  → ruleset checks registered (Admin-2, GET→PUT)

Week 4: Full enforcement
  → All checks required
  → All documentation complete
```
