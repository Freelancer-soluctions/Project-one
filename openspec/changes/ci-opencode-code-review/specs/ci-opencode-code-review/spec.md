## Purpose

Provides an automated opencode-based code review commentary on every PR toward main, using free-tier LLM models, so contributors receive structured feedback without blocking the merge pipeline.

## ADDED Requirements

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

The system SHALL configure the opencode model via the `OPENCODE_CONFIG_CONTENT` environment variable (or the action's native input), passing a Groq-compatible provider inline with the `GROQ_API_KEY` secret. The `agent` input of `anomalyco/opencode/github` SHALL NOT be relied upon (Bug #36504: the `agent` input may be ignored by the action). The model/provider configuration in `opencode.jsonc` is OUT-OF-SCOPE / DEFERRED per user decision.

#### Scenario: Workflow runs with Groq model via OPENCODE_CONFIG_CONTENT

- **WHEN** the `opencode-review.yml` workflow executes
- **THEN** it invokes `anomalyco/opencode/github@latest` (latest documented version; no `v1.0.0` tag exists; SHA-pinned after first successful run) with `use_github_token: true`, setting `OPENCODE_CONFIG_CONTENT` to a custom Groq provider configuration:
  ```json
  {
    "provider": {
      "groq": {
        "npm": "@ai-sdk/openai-compatible",
        "name": "Groq",
        "options": {
          "baseURL": "https://api.groq.com/openai/v1",
          "apiKey": "{env:GROQ_API_KEY}"
        },
        "models": {
          "llama-3.3-70b-versatile": { "name": "Llama 3.3 70B Versatile" }
        }
      }
    },
    "model": "groq/llama-3.3-70b-versatile"
  }
  ```
  and authenticating via the `GROQ_API_KEY` secret

#### Scenario: Fallback model activates on rate-limit exhaustion

- **WHEN** the primary Groq model is unavailable or rate-limited (HTTP 429)
- **THEN** the workflow falls back to `opencode/free` (a valid, non-deprecated opencode free-tier model); if both models are exhausted, the workflow posts a rate-limit advisory and exits gracefully

### Requirement: The workflow uses scoped permissions without statuses

The workflow SHALL define `permissions: { contents: read, pull-requests: write, issues: read }` so that the comment posting action has `pull-requests: write` (without which it returns HTTP 403). `id-token: write` is NOT required for `pull_request` triggers (only needed for `issue_comment`/OIDC token exchange). `statuses: read` is NOT required because the action posts PR comments via the Issues API, not status checks.

#### Scenario: Permissions are sufficient for comment posting

- **WHEN** the workflow posts a review comment
- **THEN** the `pull-requests: write` permission allows the action to post the comment; `contents: read` allows checkout; `issues: read` allows reading PR details for the comment

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

### Requirement: The action handles its own fetch (no fetch-depth: 0)

The `anomalyco/opencode/github` composite action performs its own `git fetch` of the PR branch internally. The workflow SHALL NOT require `fetch-depth: 0` on `actions/checkout`; a default checkout is sufficient.

#### Scenario: Action handles its own checkout/fetch

- **WHEN** the `opencode-review.yml` workflow checks out the repository
- **THEN** it uses `actions/checkout` with default depth; the action manages its own fetch internally

### Requirement: The review posts a unique comment per PR via updateComment

The `anomalyco/opencode/github` action SHALL publish/update a UNIQUE comment per PR via `octokit.issues.updateComment` (with a footer containing a shared session link). It does NOT create inline comments or use `pull_request_review`. A custom script or `peter-evans/create-or-update-comment` is NOT needed.

#### Scenario: Unique comment is posted or updated

- **WHEN** the opencode analysis completes
- **THEN** the action posts a single comment on the PR thread, updating it if it already exists

### Requirement: Concurrency group and timeout are configured

The workflow SHALL define a `concurrency` group keyed by PR number (`opencode-review-${{ github.event.pull_request.number }}`) with `cancel-in-progress: true` and `timeout-minutes: 10` to prevent duplicate runs consuming the free-tier rate limit and cap execution time.

#### Scenario: Duplicate runs are cancelled and execution is bounded

- **WHEN** a new push to the same PR triggers the workflow while a previous run is in progress
- **THEN** the previous run is cancelled by the concurrency group, and execution is capped at 10 minutes

### Requirement: The workflow is disabled_manually by default and must be enabled explicitly

The `opencode-review.yml` workflow SHALL be documented as `disabled_manually` by default (per repo convention §3.4/§5.9 of CONTEXT-CICD.md). It SHALL NOT run in GitHub until explicitly enabled via `gh workflow enable .github/workflows/opencode-review.yml` or the GitHub UI.

#### Scenario: Workflow is disabled by default

- **WHEN** the workflow file is added to the repo
- **THEN** it is in `disabled_manually` state and does not execute on any trigger until manually enabled

#### Scenario: Workflow is enabled after provisioning secrets

- **WHEN** `GROQ_API_KEY` is added to GitHub repo secrets and the workflow is enabled
- **THEN** the workflow executes on qualifying PRs

### Requirement: The action version is documented and will be SHA-pinned

The `anomalyco/opencode/github` action SHALL use `@latest` per official documentation (no stable `v1.0.0` version tag exists in documented releases — verified via Context7). After the first successful run, the action SHALL be pinned to the specific commit SHA for supply chain safety (§5.4).

#### Scenario: Action version is documented

- **WHEN** the workflow references the action
- **THEN** it uses `@latest` initially, with the SHA documented in design.md; the SHA is committed after first successful smoke test

### OUT-OF-SCOPE / DEFERRED

The following items are explicitly OUT-OF-SCOPE / DEFERRED from this change per user decision:

- **Provider/model configuration in `opencode.jsonc`**: The configuration of the Groq provider and model in `opencode.jsonc` is deferred to a future change. This change configures the model self-contained via `OPENCODE_CONFIG_CONTENT` env var (or action input), without depending on `opencode.jsonc`.
- **Fine-grained provider configuration**: Advanced provider settings (rate limits, provider-specific options) are documented as future work, not deliverables of this change.
