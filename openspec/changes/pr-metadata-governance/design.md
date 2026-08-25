# Design: PR Metadata Governance

> **Change**: `pr-metadata-governance` | **Status**: proposed
> **Stack**: PR Title Lint + DCO Sign-off + PR Template
> **Decision log**: 2026-08-25 (research-backed)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI Pipeline (ci.yml)                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ commit-lint  │  │pr-title-lint│  │     dco     │  ← NUEVOS  │
│  │  (existing)  │  │  (P1)       │  │  (P1.5)     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────┐               │
│  │              ci-complete (gate)              │               │
│  │         if: always() + needs: [...]          │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │  PR Template (.github/PULL_REQUEST_TEMPLATE) │  ← NUEVO     │
│  │  + CONTRIBUTING.md guidelines                │  (P2)        │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Ruleset 21227644 (main branch)                     │
│                                                                 │
│  Required checks:                                               │
│  ├── Commit Lint (Conventional Commits)  ← existing            │
│  ├── Verify Commit Signatures            ← existing            │
│  ├── PR Title Lint                       ← NUEVO               │
│  ├── DCO                                 ← NUEVO               │
│  └── ci-complete                         ← existing (gate)     │
│                                                                 │
│  Bypass: NONE (zero actors)                                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Repo Settings (Admin Action)                        │
│                                                                 │
│  squash_merge_commit_title: PR_TITLE          ← CHANGE          │
│  squash_merge_commit_message: COMMIT_MESSAGES ← VERIFY          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Log

### D1: PR Title Lint Tool — amannn/action-semantic-pull-request@v6

**Decision**: Use `amannn/action-semantic-pull-request@v6` for PR title validation.

**Rationale**:

- Most popular semantic PR title lint action (13k+ stars)
- Active maintenance, v6 released 2025
- Configurable types list (matches our commitlint config-conventional)
- Supports `subjectPattern` for additional validation
- Supports `ignoreLabels` for bot/automation bypass

**Alternatives considered**:
| Alternative | Rejected because |
|---|---|
| Custom shell script | More maintenance, less community support |
| commitlint with PR title | commitlint designed for commit messages, not PR titles |
| Danger.js | Overkill for title-only validation |

**Configuration**:

```yaml
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

---

### D2: DCO Tool — KineticCafe/actions-dco@v3.2.0

**Decision**: Use `KineticCafe/actions-dco@v3.2.0` for DCO sign-off validation.

**Rationale**:

- Richest bot handling: `well-known` policy with categories (dependency-updaters, ci-cd, release)
- Handles dependabot email edge case (author = noreply, sign-off = support@github.com)
- TOML config for version control
- Active maintenance, v3.2.0
- GitHub Action (no App installation required)

**Alternatives considered**:
| Alternative | Rejected because |
|---|---|
| probot/dco (DCO App) | DEAD — probot servers shut off ~2024 |
| cncf/dco2 (App) | GitHub App requires installation + permissions; Action is simpler |
| Custom script | More maintenance, must handle dependabot edge cases manually |
| tisonkun/actions-dco | Lower activity, less config richness |

**Configuration**:

```yaml
- uses: KineticCafe/actions-dco@v3.2.0
  with:
    config: |
      [bot]
      policy = "well-known"
      categories = ["dependency-updaters"]
```

**Bot whitelisting logic**:

- `well-known` policy → only bots in known categories are exempt
- `dependency-updaters` category → dependabot[bot], renovate[bot], snyk-bot[bot]
- All other bots → must sign off (strict default)
- Human contributors → must sign off always

---

### D3: Squash Setting — PR_TITLE + COMMIT_MESSAGES

**Decision**: Change `squash_merge_commit_title` from `COMMIT_OR_PR_TITLE` to `PR_TITLE`.

**Rationale**:

- **Consistency**: PR title = squash subject in ALL cases (single + multi-commit)
- **PR Title Lint coverage**: lint validates the title → title becomes commit message → main always receives conventional commits
- **CNCF/LF alignment**: LF recommends squash + DCO with trailer preservation; `COMMIT_MESSAGES` preserves Signed-off-by

**Current state**:

```
squash_merge_commit_title: COMMIT_OR_PR_TITLE
squash_merge_commit_message: COMMIT_MESSAGES
```

**Target state**:

```
squash_merge_commit_title: PR_TITLE
squash_merge_commit_message: COMMIT_MESSAGES
```

**Impact**: Single-commit PRs whose commit message is conventional but PR title is not → PR Title Lint fails. This is DESIRED behavior — forces consistency between PR title and commit message.

---

### D4: CI Pattern — Parallel Jobs, ADD-Only

**Decision**: Add PR Title Lint and DCO as parallel jobs in existing ci.yml.

**Rationale**:

- Follows established CI_MINIMAL pattern (commit-lint, verify-signatures, etc.)
- No `needs` dependency → parallel execution → faster CI
- `ci-complete` gate aggregates all jobs via `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`
- ADD-only principle: never remove or modify existing jobs

**Real ci-complete.needs** (30 jobs, ADD-only):

```yaml
ci-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }} # PRESERVE
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
```

**ci-complete.needs update** (ADD-only, preserve all 30 existing entries):

```yaml
# Only ADD these two lines to the existing needs array:
needs:
  - repo-discovery # existing
  - actionlint # existing
  - commit-lint # existing
  - pr-title-lint # ADD
  - dco # ADD
  - client-lint # existing (if: false)
  - ... (22 more existing entries)
  - verify-signatures # existing
  - zombie-workflow-guard # existing
```

---

### D5: Ruleset — Required Checks with Zero Bypass

**Decision**: Register `PR Title Lint` and `DCO` as required checks in ruleset 21227644.

**Rationale**:

- Zero bypass actors = no exceptions for anyone (including admins)
- Required checks enforce governance at merge time
- DCO skip (for bots) is handled at the Action level (well-known policy) → GitHub sees `success` (skipped) → merge allowed

**Ruleset 21227644 after change**:

```
Required status checks:
  ├── Verify Commit Signatures          ← existing
  ├── Commit Lint (Conventional Commits) ← existing
  ├── PR Title Lint                     ← NEW
  ├── DCO                               ← NEW
  └── ci-complete                       ← existing (gate)

Bypass actors: NONE
```

**Dependabot flow**:

1. dependabot opens PR → DCO job runs → bot detected → SKIPPED (well-known policy)
2. GitHub evaluates required check `DCO` → sees `success` (skipped = success)
3. PR Title Lint runs normally → validates PR title (dependabot titles follow convention)
4. All checks pass → merge allowed

---

### D6: Body Enforcement — Template + Culture (No Automation)

**Decision**: PR template provides structure; enforcement via review culture + CODEOWNERS.

**Rationale**:

- GitHub cannot natively enforce PR body content
- Danger.js or custom validation = maintenance burden + fragile (template changes break validation)
- Enterprise standard: template + review culture + CODEOWNERS is sufficient
- SOC2/ISO auditors look for CONSISTENCY, not automation

**Implementation**:

1. `.github/PULL_REQUEST_TEMPLATE.md` → pre-fills PR body
2. CODEOWNERS → ensures reviews happen
3. CONTRIBUTING.md → documents expectations
4. Review culture → reviewers enforce template usage

---

### D7: Rollout Strategy — continue-on-error → Active

**Decision**: Deploy PR Title Lint and DCO as `continue-on-error: true` first, then activate.

**Rationale**:

- Same pattern used for commit-lint rollout (05d)
- Allows validation without blocking merges
- Team adjusts to new requirements
- After 1 sprint: remove `continue-on-error`, register in ruleset

**Rollout phases**:

```
Phase 1 (Week 1-2): continue-on-error: true
  → Jobs run, report pass/fail, but don't block merge
  → Team sees failures, adjusts workflow

Phase 2 (Week 3): Remove continue-on-error
  → Jobs become real checks

Phase 3 (Week 3): Register in ruleset 21227644
  → Required checks → blocking
  → Admin changes squash setting to PR_TITLE
```

---

### D8: Merge Queue Strategy — Neutral Success on merge_group

**Decision**: Both `pr-title-lint` and `dco` emit neutral success on `merge_group` events.

**Rationale**:

- Required checks must be satisfiable in the merge queue; otherwise all merges via merge queue are blocked
- `pr-title-lint`: squash commit title is already validated by `commitlint --last` (which runs on `merge_group`); no need to re-validate
- `dco`: DCO is a PR-level check (validates individual commits); squash commit doesn't carry individual `Signed-off-by` trailers; validation already happened at PR level
- Pattern matches `verify-signatures` (runs on both events with different logic per event)

**Implementation**:

```yaml
# pr-title-lint
steps:
  - name: Lint PR title
    if: github.event_name == 'pull_request'
    uses: amannn/action-semantic-pull-request@v6
    # ...
  - name: Skip on merge_group (covered by commitlint)
    if: github.event_name == 'merge_group'
    run: echo "✅ Merge queue — squash commit title validated by commitlint"

# dco
steps:
  - name: DCO sign-off check
    if: github.event_name == 'pull_request'
    uses: KineticCafe/actions-dco@v3.2.0
    # ...
  - name: Skip on merge_group (PR-level check)
    if: github.event_name == 'merge_group'
    run: echo "✅ Merge queue — DCO validated at PR level"
```

**Flow**:

```
PR → merge queue → merge_group event
  ├── commitlint: validates squash commit title (--last) ✅
  ├── pr-title-lint: emits success (already covered by commitlint) ✅
  ├── dco: emits success (already validated at PR level) ✅
  └── verify-signatures: validates squash commit signature ✅
```

---

## Integration Points

| System                           | Integration               | Direction            |
| -------------------------------- | ------------------------- | -------------------- |
| commitlint (05d)                 | Parallel, independent     | ← same ci.yml        |
| SSH signing (05c)                | Parallel, independent     | ← ruleset 21227644   |
| ruleset 21227644                 | Required checks added     | → GitHub             |
| ci-complete gate                 | Needs array updated       | → ci-complete        |
| CONTRIBUTING.md                  | New PR guidelines section | → contributors       |
| .github/PULL_REQUEST_TEMPLATE.md | New file                  | → PR form            |
| CODEOWNERS (optional)            | New file                  | → review assignments |

---

## Risks & Mitigations

| Risk                                 | Impact                                | Mitigation                                                                   |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| Dependabot PRs blocked by DCO        | High — no dependency updates          | Bot whitelist via well-known policy (Task 2)                                 |
| Dependabot PRs blocked by Title Lint | High — no dependency updates          | Add `commit-message: prefix: "fix"` to dependabot.yml npm ecosystem (Task 4) |
| PR Title Lint false positives        | Medium — contributor friction         | `ignoreLabels` for bots, clear docs                                          |
| Squash trailer loss                  | High — DCO provenance gap             | Verify COMMIT_MESSAGES setting before rollout                                |
| Ruleset deadlock                     | High — all PRs blocked                | Rollout with continue-on-error first                                         |
| Job name mismatch                    | Critical — checks never trigger       | Exact name matching between job and ruleset                                  |
| Merge queue blocking                 | High — all merge-queue merges blocked | Neutral success on merge_group (D8)                                          |
| Admin-2 partial PATCH                | Critical — deletes existing rules     | GET→modify→PUT approach (tasks.md Admin-2)                                   |
