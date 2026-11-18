# ci-prebuild-substage-structure Delta

## MODIFIED Requirements

### Requirement: prebuild-quality-complete

The `prebuild-quality-complete` aggregator SHALL depend on exactly 15 jobs from Substage 2B CODE QUALITY: `[client-lint, client-format-check, client-typecheck, client-complexity, client-dead-code, client-import-bounds, server-lint, server-format-check, server-typecheck, server-complexity, server-dead-code, server-import-bounds, e2e-lint, root-manifest-guard, openspec-validate]`. (Nota de calibración: la lista base declaraba 15 jobs sin `root-manifest-guard`, que se incorporó al agregador con el change `root-manifest-cleanup` sin actualizar la spec — estado real pre-change: 16 jobs con `actionlint`; post-change: 15.)

#### Scenario: Quality aggregator needs resolution

- **When** `prebuild-quality-complete` runs
- **Then** its `needs` array contains exactly those 15 jobs — no more, no less
- **And** all 15 jobs are from Substage 2B CODE QUALITY
- **And** `e2e-lint` follows the same activation pattern as the other quality jobs: gated on `repo-discovery` output (`e2e == 'true'`), `pull_request` only, and aggregated by the same failure-propagation logic
- **And** `openspec-validate` runs on every `pull_request` (not path-filtered), is aggregated by the same failure-propagation logic, and runs `npx openspec validate --specs --strict` against the canonical specs in `openspec/specs/**`
- **And** the blocking `actionlint` job is no longer a dependency (consolidated into `actionlint-advisory` of substage 2C, per change `ci-supply-chain-hygiene`)

### Requirement: Visual substage delimitation

The CI workflow file SHALL contain commented YAML headers that visually delimit each substage of STAGE 2.

#### Scenario: Inspecting ci.yml STAGE 2

- **When** a developer opens `.github/workflows/ci.yml` and navigates to STAGE 2
- **Then** the following headers are visible as comments before their respective job groups:
  - `# SUBSTAGE 2A: GOVERNANCE — verify-signatures, commit-lint, pr-title-lint, dco, sast`
  - `# SUBSTAGE 2B: CODE QUALITY — lint, format-check, typecheck, complexity, dead-code, import-bounds, e2e-lint, openspec-validate, docs-validation (advisory)`
  - `# SUBSTAGE 2C: SECURITY — dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog`
  - `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke`

#### Scenario: Reading substage 2C header

- **When** a developer reads the `# SUBSTAGE 2C: SECURITY` header
- **Then** all 9 security jobs of the pre-build security block are listed in file order
- **And** the header no longer references `security.yml` (its PR-time security responsibility was absorbed by `ci.yml` since change `secret-scanning`; `security.yml` remains as push-main defense-in-depth per §23.3 mapping)
