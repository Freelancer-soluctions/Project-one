## Context

The `opencode-review.yml` workflow uses the `anomalyco/opencode/github` composite action (SHA-pinned at `5d5c35ee71c095464b9eb3c3e991df906f12a152`). This action has a known bug: its internal "Get opencode version" step uses an unauthenticated GitHub API call (`curl -sf`) that fails with 403/429 on shared runners due to rate limiting (60 requests/hour/IP). With `bash -e -o pipefail`, the fallback `${VERSION:-latest}` is dead code, causing the job to exit 1. Upstream issues (#32635/#35120/#31387) are marked `not_planned` with no patches since Dec 2025, and the action provides no input to override the version. The fix replaces the composite action with inline steps that install a pinned opencode binary directly.

## MODIFIED Requirements

### Requirement: The workflow handles its own fetch (no fetch-depth: 0)

The workflow SHALL perform its own `git fetch` of the PR branch internally (e.g., via `git fetch origin +refs/pull/<number>/merge`). The workflow SHALL NOT require `fetch-depth: 0` on `actions/checkout`; a default checkout is sufficient.

#### Scenario: Workflow handles its own checkout/fetch

- **WHEN** the `opencode-review.yml` workflow checks out the repository
- **THEN** it uses `actions/checkout` with default depth; the workflow manages its own fetch internally

### Requirement: The opencode binary version is pinned

The opencode binary version SHALL be pinned to a specific release version (v1.18.31) in the install step for supply chain safety (§5.4). The install step SHALL download the binary from `https://github.com/anomalyco/opencode/releases/download/v1.18.31/opencode-linux-x64.zip` and place it in `$HOME/.opencode/bin`.

#### Scenario: Pinned binary version is installed

- **WHEN** the `opencode-review.yml` workflow runs the install step
- **THEN** it downloads opencode `v1.18.31` from the official release URL and adds the binary to `GITHUB_PATH`

### Requirement: The prompt is passed via PROMPT environment variable

The workflow SHALL pass the review prompt to `opencode github run` via the `PROMPT` environment variable. The CLI does NOT accept a `--prompt` flag (verified via `opencode github run --help`); the composite action passes the prompt via the `PROMPT` env var (see `github/action.yml` L62). The inline step MUST set the `PROMPT` env var with the review prompt text identical to the current `with: prompt:` block.

#### Scenario: Prompt is passed to opencode CLI

- **WHEN** the `opencode-review.yml` workflow runs the "Run OpenCode AI review" step
- **THEN** the `PROMPT` environment variable contains the review prompt text, and `opencode github run` reads it from the environment
