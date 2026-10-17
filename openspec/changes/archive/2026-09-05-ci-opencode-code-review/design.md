## Context

See proposal.md — Why. The repo already has a governance gate (`ci.yml`) with 4 required checks (verify-signatures, commit-lint, pr-title-lint, dco) on `main`. Only `ci.yml` is enabled; the other 7 workflows are `disabled_manually` (§3.4/§5.9 of CONTEXT-CICD.md). The repo's `opencode.jsonc` already defines a `reviewer` agent (`opencode/ling-3.0-flash-fin-free`) and an `omniroute` provider with `oc/free` — the project already uses the free-tier layer. This change adds a separate workflow that leverages opencode for automated PR commentary.

## Goals / Non-Goals

**Goals:**

- Post an automated opencode review comment on every non-Dependabot, non-fork PR toward `main`.
- Use free-tier models (Google Gemini `gemini-3.6-flash` primary, `opencode/free` fallback) configured self-contained via `OPENCODE_CONFIG_CONTENT`.
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

4. **Self-contained model configuration via `OPENCODE_CONFIG_CONTENT` (Bug #36504)** — Rationale: The `agent` input of `anomalyco/opencode/github` is ignored silently (Bug #36504). The canonical mechanism to configure the model is the `OPENCODE_CONFIG_CONTENT` environment variable, which the action writes as `.opencode/config.json` before executing (deep-merged as "local" scope after project configs, confirmed in `config.ts`). The `prompt` input is required and defines the review instructions. The `model` input works correctly (unlike `agent`). The `GEMINI_API_KEY` secret authenticates the request. The `opencode.jsonc` provider configuration is OUT-OF-SCOPE / DEFERRED per user decision. Workaround for Bug #36504: set `env: OPENCODE_CONFIG_CONTENT` to configure the model/provider, since the `agent` input is ignored. Google Gemini is a **built-in** provider in opencode — no `@ai-sdk/openai-compatible` package, no custom `baseURL`, no custom `apiKey` field needed in the provider definition. The concrete JSON configuration for `OPENCODE_CONFIG_CONTENT`:

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

Authentication is handled via three environment variables that all reference the same GitHub secret `GEMINI_API_KEY`: `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` (required by `@ai-sdk/google`), and `GOOGLE_API_KEY`. No `thinkingConfig` is configured — opencode internally injects `thinkingLevel: high` for gemini-3 models (attempting `thinkingBudget` causes 400 `"only one of thinking budget and thinking level"`).

**Migration history (trazabilidad):**

- 2026-09-02: Initial Groq `llama-3.3-70b-versatile` (deprecated by Groq 2026-08-16, moved to Enterprise-only → 404 with free/developer keys)
- 2026-09-03: Migrated to Groq `gpt-oss-120b` (modelID `openai/gpt-oss-120b` required by Groq API)
- 2026-09-04: Multiple Groq failures (413 TPM, 400 `reasoning_content`, 404 `model_not_found`) → **migrated to Google Gemini** (built-in provider, ~15 RPM free tier, 1M context)
- 2026-09-04: `google/gemini-2.5-flash` configured; fixed `GOOGLE_GENERATIVE_AI_API_KEY` env (Google AI SDK expects this, not `GEMINI_API_KEY`)
- 2026-09-05: `google/gemini-2.5-flash` returned 404 `"no longer available to new users"` → migrated to **`google/gemini-3.6-flash`** (GA July 2026; final configuration)
- 2026-09-05: Removed `thinkingConfig` — `thinkingBudget` (gemini-2.5 param) conflicts with opencode's internal `thinkingLevel` injection for gemini-3 models (400 error)

Alternative: configuring the model in `opencode.jsonc` — rejected because it couples the workflow to repo-level config and Bug #36504 makes the `agent` input unreliable.

5. **Google Gemini `gemini-3.6-flash` as primary model** — Rationale: Built-in provider in opencode (no npm custom packages), ~15 RPM free tier, 1M token context window, thinking mode supported. The model is passed via `OPENCODE_CONFIG_CONTENT`, not via `opencode.jsonc`. The `small_model` is also set to `gemini-3.6-flash` for determinism (prevents the `title` agent from auto-selecting a different model from the catalog).

6. **`opencode/free` as fallback model** — Rationale: If the primary Gemini model is unavailable or rate-limited (HTTP 429), the workflow falls back to `opencode/free` (via omniroute/oc/free, the free-tier model defined in `opencode.jsonc`). If both models are exhausted, the workflow posts a rate-limit advisory and exits gracefully.

7. **`GEMINI_API_KEY` as the secret** — Rationale: Free tier available at https://aistudio.google.com/apikey; no cost to the repo. The secret is referenced via `secrets.GEMINI_API_KEY` (repo-level secret). The workflow maps it to three env vars (`GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_API_KEY`) for compatibility with different Google AI SDK variants (`@ai-sdk/google` expects `GOOGLE_GENERATIVE_AI_API_KEY`). NOTE: secret provisioning is a manual step, not automatable by OpenSpec.

8. **Action handles its own fetch (no `fetch-depth: 0`)** — Rationale: The `anomalyco/opencode/github` composite action performs its own `git fetch` of the PR branch internally. It does NOT require `fetch-depth: 0` on `actions/checkout`. The action also does its own branch fetch, so `fetch-depth: 0` is unnecessary overhead. Alternative: `fetch-depth: 0` — rejected because the action manages its own checkout/fetch.

9. **`concurrency` group per PR + `timeout-minutes: 10`** — Rationale: Free-tier rate limits apply. A `concurrency` group keyed by PR number (`opencode-review-${{ github.event.pull_request.number }}`) with `cancel-in-progress: true` prevents duplicate runs from consuming the rate limit when multiple pushes occur in quick succession. `timeout-minutes: 10` is a **job-level property** (NOT inside the `concurrency` block — verified via GitHub Actions workflow syntax reference: `jobs.<job_id>.timeout-minutes`; the `concurrency` block only accepts `group` and `cancel-in-progress`). No native retry exists → HTTP 429 must be handled gracefully (fallback to `opencode/free`, then rate-limit advisory). Alternative: no concurrency — rejected because rate-limit exhaustion would cause silent failures.

10. **`continue-on-error: true` (non-required, informational)** — Rationale: The opencode review is a GOVERNANCE informativo (non-blocking) check per §7 rule 6 of CONTEXT-CICD. It is NOT a security gate, NOT a build gate, and MUST NOT be added to ruleset 21227644. `continue-on-error: true` ensures that any opencode failure (rate limit, timeout, API error) does not block the PR. The comment is advisory only.

11. **`permissions: { contents: read, pull-requests: write, issues: read }`** — Rationale: The workflow requires `pull-requests: write` to post/update comments via `octokit.issues.updateComment` (without it, the action returns HTTP 403). `contents: read` allows checkout; `issues: read` allows reading PR details for the comment. `id-token: write` is NOT required for `pull_request` triggers (confirmed: only needed for `issue_comment`/OIDC token exchange). `statuses: read` is NOT needed because the action does not post status checks — it posts PR comments via the Issues API. This is the minimal scoped permission set.

12. **`disabled_manually` by default** — Rationale: Per repo convention (§3.4/§5.9), new workflows are `disabled_manually` by default and must be explicitly enabled via `gh workflow enable .github/workflows/opencode-review.yml` or the GitHub UI. The workflow SHALL NOT run until manually enabled, especially until `GEMINI_API_KEY` is provisioned.

13. **Bug #36504 — `OPENCODE_CONFIG_CONTENT` as canonical mechanism** — Rationale: The `agent` input of `anomalyco/opencode/github` is ignored silently (Bug #36504). The canonical mechanism to configure the model is `OPENCODE_CONFIG_CONTENT` env var (or the action's native input). The `prompt` input is required and defines the review instructions. This is a concrete requirement, not a "to be verified" note.

14. **Prompt custom para CI (no reusing `reviewer.md`)** — Rationale: The repo's `.agents/reviewer.md` has an `output-contract` of agente que no aplica a la action `anomalyco/opencode/github`. Define a concise inline prompt (code quality, bugs/edge cases, security, performance, conventions; output in bullets; "LGTM" if no issues) as the `prompt` input of the action.

15. **Comentario único por PR via `octokit.issues.updateComment`** — Rationale: The `anomalyco/opencode/github` action publishes/updates a UNIQUE comment per PR via `octokit.issues.updateComment` (footer with shared session link). It does NOT create inline comments (feature not supported by the action, confirmed in docs — feature request #13918 remains OPEN). It does NOT use `pull_request_review` (API endpoint not used by the action; support for `pull_request_review` event is a feature request, issue #37867 OPEN). The action handles posting and updating natively — no custom script or `peter-evans/create-or-update-comment` needed. Constraint: the action's comment mechanism uses the Issues API, which is why `issues: read` permission is required in addition to `pull-requests: write`.

## Migration History (Groq -> Gemini)

This section preserves the full migration timeline as a traceability record. Groq references outside this block have been replaced with Gemini equivalents.

| Date       | Model                                               | Status     | Reason                                                                                         |
| ---------- | --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| 2026-09-02 | Groq `llama-3.3-70b-versatile`                      | Deprecated | Groq moved to Enterprise-only (2026-08-16); free/developer keys get 404                        |
| 2026-09-02 | Groq `gpt-oss-120b` (modelID `openai/gpt-oss-120b`) | Failed     | 413 TPM limit, 400 `reasoning_content` error                                                   |
| 2026-09-04 | Google Gemini `gemini-2.5-flash` (built-in)         | Failed     | 404 `"no longer available to new users"` for new API keys (2026-09-05)                         |
| 2026-09-05 | Google Gemini `gemini-3.6-flash` (built-in)         | **Active** | GA July 2026; thinkingConfig removed (400 thinking budget/level conflict); final configuration |

**Key fixes during migration:**

- `GOOGLE_GENERATIVE_AI_API_KEY` env var required by `@ai-sdk/google` (not `GEMINI_API_KEY`) -- 3 variants mapped to same secret
- `small_model` fixed to `gemini-3.6-flash` (determinism, prevents auto-selection)
- `thinkingConfig` removed: opencode internally injects `thinkingLevel: 'high'` for gemini-3; `thinkingBudget` is a gemini-2.5 param causing mutual exclusivity error
- ModelID prefix (`openai/gpt-oss-120b`) was Groq-specific; not needed for Gemini (built-in provider)
