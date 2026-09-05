## Why

Automate code review in every PR toward `main` using opencode with free-tier LLM models, giving contributors instant structured feedback without blocking the merge pipeline. Today, PRs receive no automated code review commentary — reviewers must manually inspect every change, which delays feedback and lets issues slip through.

## What Changes

- Add a new GitHub Actions workflow `opencode-review.yml` that runs opencode on PRs and posts a structured review comment.
- The workflow uses `anomalyco/opencode/github` (using `@latest` per official docs — no `v1.0.0` tag exists; SHA-pinned after first successful run for supply chain safety) with `use_github_token: true`, the input `model: groq/gpt-oss-120b` (sets the `MODEL` env var opencode consumes), and scoped permissions (`contents: read`, `pull-requests: write`, `issues: read`). The Groq `gpt-oss-120b` model (free tier, 30 RPM; sustituyó al deprecado `llama-3.3-70b-versatile` el 2026-09-02 tras ser movido a Enterprise-only por Groq) is configured self-contained via `OPENCODE_CONFIG_CONTENT` env var with custom provider JSON (Groq requires `@ai-sdk/openai-compatible` package — it is NOT a built-in provider). El campo `modelID: "openai/gpt-oss-120b"` en la definición del modelo es el ID REAL que la API de Groq acepta (con prefijo `openai/`); sin él, opencode envía la clave `gpt-oss-120b` tal cual y Groq responde 404 (fix 2026-09-04). Fallback: `opencode/free`.
- The workflow triggers on `pull_request` (types: opened, synchronize, reopened) with a custom inline prompt; it excludes fork PRs (`if: github.event.pull_request.head.repo.fork == false`), Dependabot PRs (`if: github.actor != 'dependabot[bot]'`), and draft PRs.
- Introduce a new **GOVERNANCE (PRE-PR/merge)** capability: automated code review commentary that is strictly informational and non-blocking (`continue-on-error: true`).
- The workflow is `disabled_manually` by default and must be explicitly enabled via `gh workflow enable`.
- **BREAKING**: None. This change adds a new workflow; it does not modify existing gates, rulesets, or merge requirements.

## Capabilities

### New Capabilities

- `ci-opencode-code-review`: Automated opencode-based code review commentary on PRs toward `main`, using free-tier models configured via `OPENCODE_CONFIG_CONTENT`, that posts a structured summary comment without blocking merge.

### Modified Capabilities

- _(none)_

## Impact

- **GitHub Actions**: New workflow file `.github/workflows/opencode-review.yml` (separate from `ci.yml`; does not touch existing governance gates).
- **Secrets**: Requires `GROQ_API_KEY` (free at console.groq.com) added to GitHub repo secrets.
- **Permissions**: `contents: read`, `pull-requests: write`, `issues: read` (required for comment posting via the Issues API; `statuses: read` is NOT needed — the action does not post status checks).
- **Concurrency**: Group per PR (`opencode-review-${{ github.event.pull_request.number }}`) with `cancel-in-progress: true` prevents duplicate runs consuming the free-tier rate limit. `timeout-minutes: 10` (job-level property, NOT inside the `concurrency` block) caps execution time.
- **Rate limit**: Fallback to `opencode/free` on Groq exhaustion; if both models are exhausted, posts a rate-limit advisory and exits gracefully.
- **Scope**: GOVERNANCE only — no SECURITY, DEPLOY, or AUDIT items. The review is a non-required informational check; it does not gate merge and does not replace human CODEOWNERS approval.

## OUT-OF-SCOPE / DEFERRED

Per user decision, the following items are explicitly OUT-OF-SCOPE / DEFERRED from this change:

- **Provider/model configuration in `opencode.jsonc`**: The configuration of the Groq provider and model in `opencode.jsonc` is deferred to a future change. This change configures the model self-contained via `OPENCODE_CONFIG_CONTENT` env var (or action input), without depending on `opencode.jsonc`. Fine-grained provider configuration is documented as future work.
- **Fine-grained provider configuration**: Advanced provider settings beyond the inline Groq configuration are deferred to a future change.
