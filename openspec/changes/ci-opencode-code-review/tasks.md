## 1. Workflow Implementation

- [ ] 1.1 Create `.github/workflows/opencode-review.yml` with trigger `pull_request` (types: opened, synchronize, reopened) and a SINGLE combined `if:` condition at job level: `if: github.event.pull_request.head.repo.fork == false && github.actor != 'dependabot[bot]' && github.event.pull_request.draft == false` (Context7 verified: `if:` is a job-level property; multiple conditions MUST be combined with `&&` in ONE `if:` expression, NOT as separate `if:` blocks)
- [ ] 1.2 Configure `actions/checkout` with default depth (the `anomalyco/opencode/github` action handles its own fetch; no `fetch-depth: 0` required)
- [ ] 1.3 Add `anomalyco/opencode/github@latest` step (official docs use `@latest`; no `v1.0.0` tag exists — pin to a specific SHA after first successful run for supply chain safety) with `use_github_token: true`, `OPENCODE_CONFIG_CONTENT` env var (Groq provider inline — see concrete JSON in task 2.2), and `GROQ_API_KEY` secret
- [ ] 1.4 Configure `permissions: { contents: read, pull-requests: write, issues: read }` at workflow level (required for `pull-requests: write` to avoid HTTP 403; `id-token: write` NOT needed for `pull_request` triggers; `statuses: read` NOT needed — the action posts PR comments via the Issues API, not status checks)
- [ ] 1.5 Configure `concurrency` group per PR (`opencode-review-${{ github.event.pull_request.number }}`, `cancel-in-progress: true`) at job level + set `timeout-minutes: 10` as a separate job-level property (NOT inside the `concurrency` block — `concurrency` only accepts `group` and `cancel-in-progress` per GitHub Actions schema)
- [ ] 1.6 Set `continue-on-error: true` (NO-required, informational — the opencode review is a GOVERNANCE informativo per §7 rule 6; it does NOT block merge)
- [ ] 1.7 Define a concise inline CI prompt (code quality, bugs/edge cases, security, performance, conventions; output in bullets; "LGTM" if no issues) as the `prompt` input — do NOT reuse `.agents/reviewer.md` (its `output-contract` does not apply to `anomalyco/opencode/github`)
- [ ] 1.8 Implement structured comment output via `octokit.issues.updateComment` (the `anomalyco/opencode/github` action handles posting/updating a UNIQUE comment per PR natively — no custom script or `peter-evans/create-or-update-comment` needed)
- [ ] 1.9 Run `npx actionlint` locally to validate the new workflow YAML syntax
- [ ] 1.10 Smoke test with a PR: verify the comment appears/updates and does NOT block merge

## 2. Secret and Configuration

- [ ] 2.1 Add `GROQ_API_KEY` to GitHub repo secrets (free tier from console.groq.com)
- [ ] 2.2 Configure `OPENCODE_CONFIG_CONTENT` env var with the following Groq provider configuration (Groq is NOT a built-in provider — requires `@ai-sdk/openai-compatible` package):

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

- [ ] 2.3 Document fallback model (`opencode/free`) and rate-limit exhaustion behavior (Groq-only or fallback to `opencode/free`; if both exhausted, post rate-limit advisory and exit gracefully)

## 3. GitHub Enablement

- [ ] 3.1 Document `opencode-review.yml` as `disabled_manually` by default (per §3.4/§5.9 convention)
- [ ] 3.2 Enable workflow after provisioning `GROQ_API_KEY` (`gh workflow enable .github/workflows/opencode-review.yml` or UI → Actions → Enable)
- [ ] 3.3 Verify the workflow triggers on a test PR and posts a structured comment

## 4. Documentation

- [ ] 4.1 Document the workflow purpose, model configuration (via `OPENCODE_CONFIG_CONTENT`), and non-blocking nature in repo CI/CD docs
- [ ] 4.2 Note the prompt-injection risk and the advisory-only nature of the review in any contributor guidelines
- [ ] 4.3 Document the pinned action version (`anomalyco/opencode/github@latest` → SHA-pinned after first successful run) and supply chain considerations (§5.4)
- [ ] 4.4 Document the `disabled_manually` toggle state and enablement procedure

## 5. Documentation Update

- [ ] 5.1 Update `docs/CONTEXT-CICD.md` §5.9 inventory table to add `opencode-review.yml` as `disabled_manually` (new workflow, GOVERNANCE domain) — do not edit the file directly here; register as a follow-up documentation task
- [ ] 5.2 Update `docs/CONTEXT-CICD.md` §9.3 to document the new non-required informational check (opencode review) — register as a follow-up documentation task
