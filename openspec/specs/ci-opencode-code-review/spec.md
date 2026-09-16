# ci-opencode-code-review Specification

## Purpose

Provides an automated opencode-based code review commentary on every PR toward main, using free-tier LLM models, so contributors receive structured feedback without blocking the merge pipeline.

## Requirements

### Requirement: The workflow runs on PRs toward main and posts a review comment

The system SHALL execute the `opencode-review.yml` workflow on pull requests targeting `main` and post a structured review comment on the PR.

#### Scenario: PR triggers the workflow

- **WHEN** a pull request is opened, synchronized, or reopened toward `main`
- **THEN** the `opencode-review.yml` workflow runs and posts a review comment on the PR

#### Scenario: Fork PRs are excluded

- **WHEN** a pull request originates from a fork (`github.event.pull_request.head.repo.fork == true`)
- **THEN** the `opencode-review.yml` workflow does NOT execute (`if: github.event.pull_request.head.repo.fork == false`)

#### Scenario: Concurrency cancels duplicate runs

- **WHEN** multiple pushes occur for the same PR within a short interval
- **THEN** only the latest run completes; earlier runs are cancelled by the concurrency group to avoid consuming the free-tier rate limit

### Requirement: The workflow configures the model self-contained via OPENCODE_CONFIG_CONTENT (Bug #36504)

The system SHALL configure the opencode model via the `OPENCODE_CONFIG_CONTENT` environment variable, using Google Gemini as a built-in provider with the `GEMINI_API_KEY` secret. The workflow SHALL use inline steps (no third-party composite action since fix 2026-09-14, change `ci-opencode-review-fix`): an `Install opencode` step using the official install script (`curl -fsSL https://opencode.ai/install | bash -s -- --version 1.18.31`) with fail-fast `opencode --version` verification, followed by `opencode github run` with env `MODEL`, `USE_GITHUB_TOKEN`, `GITHUB_TOKEN`, `PROMPT` and `OPENCODE_CONFIG_CONTENT`. The model/provider configuration in `opencode.jsonc` is OUT-OF-SCOPE / DEFERRED per user decision.

#### Scenario: Workflow runs with Gemini model via OPENCODE_CONFIG_CONTENT

- **WHEN** the `opencode-review.yml` workflow executes
- **THEN** it runs the inline steps (fix 2026-09-14; the former `anomalyco/opencode/github@5d5c35ee71c095464b9eb3c3e991df906f12a152` composite action was removed because its internal `Get opencode version` step failed on unauthenticated GitHub API rate-limit, upstream `not_planned`): (1) `Install opencode` installs the pinned binary v1.18.31 via the official install script and verifies with `opencode --version`; (2) `Run OpenCode AI review` executes `opencode github run` with `MODEL=google/gemini-3.6-flash`, `USE_GITHUB_TOKEN=true`, `PROMPT` (review prompt text — the CLI reads it from env, no `--prompt` flag), setting `OPENCODE_CONFIG_CONTENT` to the Google Gemini built-in provider configuration:
  ```json
  {
    "model": "google/gemini-3.6-flash",
    "small_model": "google/gemini-3.6-flash",
    "provider": {
      "google": {
        "models": {
          "gemini-3.6-flash": {}
        }
      }
    }
  }
  ```
  and authenticating via the `GEMINI_API_KEY` secret (mapped to three env vars: `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_API_KEY` for Google AI SDK compatibility)

#### Scenario: Fallback model activates on rate-limit exhaustion

- **WHEN** the primary Gemini model is unavailable or rate-limited (HTTP 429)
- **THEN** the workflow falls back to `opencode/free` (a valid, non-deprecated opencode free-tier model); if both models are exhausted, the workflow posts a rate-limit advisory and exits gracefully

### Requirement: The workflow uses scoped permissions without statuses

The workflow SHALL define `permissions: { contents: read, pull-requests: write, issues: read }` so that the `opencode github run` step has `pull-requests: write` (without which it returns HTTP 403). `id-token: write` is NOT required for `pull_request` triggers (only needed for `issue_comment`/OIDC token exchange). `statuses: read` is NOT required because the CLI posts PR comments via the Issues API, not status checks.

#### Scenario: Permissions are sufficient for comment posting

- **WHEN** the workflow posts a review comment
- **THEN** the `pull-requests: write` permission allows the CLI to post the comment; `contents: read` allows checkout; `issues: read` allows reading PR details for the comment

### Requirement: The review is non-required and informational; it does not approve or block merge

The review SHALL be a non-required check that posts a summary comment only. It SHALL NOT approve the PR, SHALL NOT count toward `required_approving_review_count=1` of ruleset 21227644, and SHALL NOT substitute human CODEOWNERS approval. `continue-on-error: true` SHALL be set so that any opencode failure (rate limit, timeout, API error) does not block the PR.

#### Scenario: Review comment does not gate merge

- **WHEN** the opencode review completes and posts its comment
- **THEN** the comment is informational only; the PR can still be merged without the review, and the comment does not count toward the required approving review count

#### Scenario: Bot approval is not possible

- **WHEN** the opencode agent finishes its analysis
- **THEN** it posts a verdict (issues, suggestions, summary) but does NOT submit an approval; the `current_user_can_bypass: never` rule and CODEOWNERS review requirement remain enforced by the ruleset

### Requirement: Dependabot PRs are excluded from the review

The system SHALL skip the opencode review for PRs created by `dependabot[bot]`.

#### Scenario: Dependabot PR is ignored

- **WHEN** a pull request is opened by `dependabot[bot]`
- **THEN** the `opencode-review.yml` workflow does not execute (`if: github.actor != 'dependabot[bot]'`)

### Requirement: The CLI handles its own fetch (no fetch-depth: 0)

The `opencode github run` CLI performs its own `git fetch` of the PR branch internally. The workflow SHALL NOT require `fetch-depth: 0` on `actions/checkout`; a default checkout is sufficient.

#### Scenario: CLI handles its own checkout/fetch

- **WHEN** the `opencode-review.yml` workflow checks out the repository
- **THEN** it uses `actions/checkout` with default depth; the opencode CLI manages its own fetch internally

### Requirement: The review posts a unique comment per PR via updateComment

The `opencode github run` CLI SHALL publish/update a UNIQUE comment per PR via `octokit.issues.updateComment` (with a footer containing a shared session link). It does NOT create inline comments or use `pull_request_review`. A custom script or `peter-evans/create-or-update-comment` is NOT needed.

#### Scenario: Unique comment is posted or updated

- **WHEN** the opencode analysis completes
- **THEN** the CLI posts a single comment on the PR thread, updating it if it already exists

### Requirement: Concurrency group and timeout are configured

The workflow SHALL define a `concurrency` group keyed by PR number (`opencode-review-${{ github.event.pull_request.number }}`) with `cancel-in-progress: true` and `timeout-minutes: 10` to prevent duplicate runs consuming the free-tier rate limit and cap execution time.

#### Scenario: Duplicate runs are cancelled and execution is bounded

- **WHEN** a new push to the same PR triggers the workflow while a previous run is in progress
- **THEN** the previous run is cancelled by the concurrency group, and execution is capped at 10 minutes

### Requirement: The workflow is ACTIVE (enabled 2026-09-14)

The `opencode-review.yml` workflow SHALL be documented as **ACTIVE** in GitHub (enabled 2026-09-14 after provisioning `GEMINI_API_KEY`; audited via `actions/workflows` API; see CONTEXT-CICD.md §3.4/§5.9). It runs on qualifying PRs toward `main` as an advisory, non-blocking review.

#### Scenario: Workflow runs when enabled

- **WHEN** `GEMINI_API_KEY` is present in GitHub repo secrets and the workflow is enabled
- **THEN** the workflow executes on qualifying PRs

#### Scenario: Historical disabled state

- **WHEN** the workflow file was first added to the repo (2026-09-02)
- **THEN** it was in `disabled_manually` state and did not execute on any trigger until manually enabled via `gh workflow enable .github/workflows/opencode-review.yml` or the GitHub UI (enablement completed 2026-09-14)

### Requirement: The opencode binary version is pinned (no composite action since 2026-09-14)

The opencode binary SHALL be pinned to a specific release for supply chain safety (§5.4). Current pin: **v1.18.31**, installed via the official install script (`curl -fsSL https://opencode.ai/install | bash -s -- --version 1.18.31`) with the `--version` flag. This is the same upstream-mutable script trade-off used by actionlint in ci.yml; it is mitigated by the version pin and fail-fast `opencode --version` verification. Historical pin (superseded 2026-09-14 by change `ci-opencode-review-fix`): `anomalyco/opencode/github@5d5c35ee71c095464b9eb3c3e991df906f12a152` (SHA-pinned, verified 2026-09-04; removed because its `Get opencode version` step failed on unauthenticated API rate-limit).

#### Scenario: Binary version is installed and verified

- **WHEN** the workflow installs opencode
- **THEN** it installs the pinned v1.18.31 release via the official install script and verifies the binary with `opencode --version`
