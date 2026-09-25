# ci-prebuild-substage-structure Delta

## MODIFIED Requirements

### Requirement: prebuild-quality-complete

The `prebuild-quality-complete` aggregator SHALL depend on exactly 14 jobs from Substage 2B CODE QUALITY: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, e2e-lint, actionlint]`.

#### Scenario: Quality aggregator needs resolution

- **WHEN** `prebuild-quality-complete` runs
- **THEN** its `needs` array contains exactly those 14 jobs — no more, no less
- **AND** all 14 jobs are from Substage 2B CODE QUALITY
- **AND** `e2e-lint` follows the same activation pattern as the other quality jobs: gated on `repo-discovery` output (`e2e == 'true'`), `pull_request` only, and aggregated by the same failure-propagation logic

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, actionlint`
  - `# SUBSTAGE 2C: SECURITY — dependency-review (+ security.yml when enabled)`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server`
