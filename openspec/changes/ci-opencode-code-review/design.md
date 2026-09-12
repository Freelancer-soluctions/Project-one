## Context

See proposal.md — Why. The repo already has a governance gate (`ci.yml`) with 4 required checks (verify-signatures, commit-lint, pr-title-lint, dco) on `main`. Only `ci.yml` is enabled; the other 7 workflows are `disabled_manually` (§3.4/§5.9 of CONTEXT-CICD.md). The repo's `opencode.jsonc` already defines a `reviewer` agent (`opencode/ling-3.0-flash-fin-free`) and an `omniroute` provider with `oc/free` — the project already uses the free-tier layer. This change adds a separate workflow that leverages opencode for automated PR commentary.

## Goals / Non-Goals

**Goals:**

- Post an automated opencode review comment on every non-Dependabot, non-fork PR toward `main`.
- Use free-tier models (Groq `llama-3.3-70b-versatile` primary, `opencode/free` fallback) configured self-contained via `OPENCODE_CONFIG_CONTENT`.
- Keep the workflow strictly informational — never block merge or substitute human approval.

**Non-Goals:**

- Do NOT modify `ci.yml` or any existing workflow.
- Do NOT add a new required status check or ruleset binding.
- Do NOT implement SECURITY, DEPLOY, or AUDIT functionality (GOVERNANCE-only domain per §7 rule 4).
- Do NOT enable any `disabled_manually` workflow — this is a new, separate workflow file.
- Do NOT configure providers/models in `opencode.jsonc` — that is OUT-OF-SCOPE / DEFERRED.

## Decisions

1. **New separate workflow file (`opencode-review.yml`)** — Rationale: Keeps governance (`ci.yml`) untouched and avoids coupling with the existing gate pipeline. The new workflow is independent and can be enabled/disabled separately. Alternative considered: adding a job to `ci.yml` — rejected because it would couple review logic with governance gates and risk breaking the existing 4-check binding.

2. **`anomalyco/opencode/github@latest` action** — Rationale: The official documentation and examples exclusively reference `@latest` as the version tag. No `v1.0.0` tag exists in the documented releases (verified via Context7). For supply chain safety (§5.4), the action SHALL be pinned to a specific commit SHA of the `@latest` ref once the workflow is enabled (e.g., `anomalyco/opencode/github@<sha>`). During initial setup, `@latest` is used to match official examples. Alternative: `@v1.0.0` — rejected because this tag does not exist in the action's documentation.

3. **`pull_request` trigger (opened, synchronize, reopened)** — Rationale: The `anomalyco/opencode/github` action supports the `pull_request` event with the `prompt` input (confirmed in official docs at opencode.ai/docs/github). The `assertPayloadKeyword()` guard applies only to `issue_comment`/`pull_request_review_comment` triggers — it does NOT apply to `pull_request`. Therefore `pull_request` with types `opened`, `synchronize`, `reopened` is the correct trigger. Alternative: `issue_comment` — rejected because it requires a comment to be posted first (not automatic on PR open/sync).

4. **Self-contained model configuration via `OPENCODE_CONFIG_CONTENT` (Bug #36504)** — Rationale: The `agent` input of `anomalyco/opencode/github` is ignored silently (Bug #36504). The canonical mechanism to configure the model is the `OPENCODE_CONFIG_CONTENT` environment variable, which the action writes as `.opencode/config.json` before executing (deep-merged as "local" scope after project configs, confirmed in `config.ts`). The `prompt` input is required and defines the review instructions. The `model` input works correctly (unlike `agent`). The `GROQ_API_KEY` secret authenticates the request. The `opencode.jsonc` provider configuration is OUT-OF-SCOPE / DEFERRED per user decision. Workaround for Bug #36504: set `env: OPENCODE_CONFIG_CONTENT` to configure the model/provider, since the `agent` input is ignored. Groq is NOT a built-in provider (built-ins: anthropic, openai, google, mistral, etc.) — it requires custom provider configuration via `@ai-sdk/openai-compatible`. The concrete JSON configuration for `OPENCODE_CONFIG_CONTENT`:

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
        "llama-3.3-70b-versatile": {
          "name": "Llama 3.3 70B Versatile"
        }
      }
    }
  },
  "model": "groq/llama-3.3-70b-versatile"
}
```

Alternative: configuring the model in `opencode.jsonc` — rejected because it couples the workflow to repo-level config and Bug #36504 makes the `agent` input unreliable.

5. **Groq `llama-3.3-70b-versatile` as primary model** — Rationale: Free tier with 30 RPM, sufficient for PR review workloads. The model is passed via `OPENCODE_CONFIG_CONTENT`, not via `opencode.jsonc`.

6. **`opencode/free` as fallback model** — Rationale: `opencode/deepseek-v4-flash-free` is deprecated and removed as fallback. `opencode/free` is a valid, non-deprecated opencode free-tier model. If the primary Groq model is unavailable or rate-limited (HTTP 429), the workflow falls back to `opencode/free`. If both models are exhausted, the workflow posts a rate-limit advisory and exits gracefully.

7. **`GROQ_API_KEY` as the secret** — Rationale: Free tier available at console.groq.com; no cost to the repo. The secret is referenced via `secrets.GROQ_API_KEY` (repo-level secret).

8. **Action handles its own fetch (no `fetch-depth: 0`)** — Rationale: The `anomalyco/opencode/github` composite action performs its own `git fetch` of the PR branch internally. It does NOT require `fetch-depth: 0` on `actions/checkout`. The action also does its own branch fetch, so `fetch-depth: 0` is unnecessary overhead. Alternative: `fetch-depth: 0` — rejected because the action manages its own checkout/fetch.

9. **`concurrency` group per PR + `timeout-minutes: 10`** — Rationale: Groq free tier is limited to 30 RPM. A `concurrency` group keyed by PR number (`opencode-review-${{ github.event.pull_request.number }}`) with `cancel-in-progress: true` prevents duplicate runs from consuming the rate limit when multiple pushes occur in quick succession. `timeout-minutes: 10` is a **job-level property** (NOT inside the `concurrency` block — verified via GitHub Actions workflow syntax reference: `jobs.<job_id>.timeout-minutes`; the `concurrency` block only accepts `group` and `cancel-in-progress`). No native retry exists → HTTP 429 must be handled gracefully (fallback to `opencode/free`, then rate-limit advisory). Alternative: no concurrency — rejected because rate-limit exhaustion would cause silent failures.

10. **`continue-on-error: true` (non-required, informational)** — Rationale: The opencode review is a GOVERNANCE informativo (non-blocking) check per §7 rule 6 of CONTEXT-CICD. It is NOT a security gate, NOT a build gate, and MUST NOT be added to ruleset 21227644. `continue-on-error: true` ensures that any opencode failure (rate limit, timeout, API error) does not block the PR. The comment is advisory only.

11. **`permissions: { contents: read, pull-requests: write, issues: read }`** — Rationale: The workflow requires `pull-requests: write` to post/update comments via `octokit.issues.updateComment` (without it, the action returns HTTP 403). `contents: read` allows checkout; `issues: read` allows reading PR details for the comment. `id-token: write` is NOT required for `pull_request` triggers (confirmed: only needed for `issue_comment`/OIDC token exchange). `statuses: read` is NOT needed because the action does not post status checks — it posts PR comments via the Issues API. This is the minimal scoped permission set.

12. **`disabled_manually` by default** — Rationale: Per repo convention (§3.4/§5.9), new workflows are `disabled_manually` by default and must be explicitly enabled via `gh workflow enable .github/workflows/opencode-review.yml` or the GitHub UI. The workflow SHALL NOT run until manually enabled, especially until `GROQ_API_KEY` is provisioned.

13. **Bug #36504 — `OPENCODE_CONFIG_CONTENT` as canonical mechanism** — Rationale: The `agent` input of `anomalyco/opencode/github` is ignored silently (Bug #36504). The canonical mechanism to configure the model is `OPENCODE_CONFIG_CONTENT` env var (or the action's native input). The `prompt` input is required and defines the review instructions. This is a concrete requirement, not a "to be verified" note.

14. **Prompt custom para CI (no reusing `reviewer.md`)** — Rationale: The repo's `.agents/reviewer.md` has an `output-contract` of agente que no aplica a la action `anomalyco/opencode/github`. Define a concise inline prompt (code quality, bugs/edge cases, security, performance, conventions; output in bullets; "LGTM" if no issues) as the `prompt` input of the action.

15. **Comentario único por PR via `octokit.issues.updateComment`** — Rationale: The `anomalyco/opencode/github` action publishes/updates a UNIQUE comment per PR via `octokit.issues.updateComment` (footer with shared session link). It does NOT create inline comments (feature not supported by the action, confirmed in docs — feature request #13918 remains OPEN). It does NOT use `pull_request_review` (API endpoint not used by the action; support for `pull_request_review` event is a feature request, issue #37867 OPEN). The action handles posting and updating natively — no custom script or `peter-evans/create-or-update-comment` needed. Constraint: the action's comment mechanism uses the Issues API, which is why `issues: read` permission is required in addition to `pull-requests: write`.
