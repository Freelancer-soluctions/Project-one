## 1. Workflow Update

- [ ] 1.1 Open `.github/workflows/opencode-review.yml` for editing
- [ ] 1.2 Remove the step `uses: anomalyco/opencode/github@5d5c35ee71c095464b9eb3c3e991df906f12a152` and its `with:` inputs
- [ ] 1.3 Add new step "Install opencode" with run script that downloads v1.18.31 from `https://github.com/anomalyco/opencode/releases/download/v1.18.31/opencode-linux-x64.zip`, unzips to `$HOME/.opencode/bin`, makes executable, and adds to `GITHUB_PATH`
- [ ] 1.4 Add new step "Run OpenCode AI review" with run script `opencode github run` and environment variables: `MODEL=google/gemini-3.6-flash`, `USE_GITHUB_TOKEN=true`, `GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}`, `OPENCODE_CONFIG_CONTENT` (JSON), `GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}`, `GOOGLE_GENERATIVE_AI_API_KEY=${{ secrets.GEMINI_API_KEY }}`, `GOOGLE_API_KEY=${{ secrets.GEMINI_API_KEY }}`. **Prompt handling**: the `opencode github run` CLI does NOT accept a `--prompt` flag (verified via `opencode github run --help`). The composite action passes the prompt via the `PROMPT` env var (see `github/action.yml` L62: `PROMPT: ${{ inputs.prompt }}`). The inline step MUST set the `PROMPT` env var with the review prompt text (identical to the current `with: prompt:` block). The CLI reads `PROMPT` from environment at runtime.
- [ ] 1.5 Preserve existing job-level settings: `continue-on-error: true`, `timeout-minutes: 10`, concurrency group, `if:` conditions, permissions
- [ ] 1.6 Verify the updated workflow YAML is syntactically valid (run `actionlint` if available)

## 2. Documentation Updates

- [ ] 2.1 Open `docs/CONTEXT-CICD.md` for editing
- [ ] 2.2 Update §3.4, §3.5, and §5.9 workflow inventory: change `opencode-review.yml` from `⛔ disabled_manually` to `✅ active` (audited 2026-09-14 API; inventory now shows 3 active workflows + dependabot config). Also review §5.10 if it references the workflow count — update any narrative that says "SOLO `ci.yml` está habilitado" to reflect the new state (ci.yml + opencode-review.yml + dependabot config = 3 active).
- [ ] 2.3 Update §9.3.8 to document the root-cause analysis (rate-limit bug) and the inline-step fix (replace composite action with install + run steps)
- [ ] 2.4 Ensure the documentation reflects the current runtime state and the fix details

## 3. Verification

- [ ] 3.1 Create a PR draft targeting `main` to trigger the `opencode-review.yml` workflow (it only fires on `pull_request` to `main` with `types: [opened, synchronize, reopened]`). Verify the workflow triggers by checking the Actions tab for the run. Then verify the review comment appears on the PR.
- [ ] 3.2 Verify the job completes without the rate-limit error
- [ ] 3.3 Check that the review comment is informational and non-blocking (does not affect merge requirements)
- [ ] 3.4 Confirm that all existing governance checks (4 required status checks) remain unaffected
- [ ] 3.5 Validate that the workflow still excludes fork PRs, dependabot PRs, and draft PRs

## 4. Final Review

- [ ] 4.1 Review all changes for compliance with repo rules (signed commits, no `--no-verify`, conventional commits)
- [ ] 4.2 Ensure the PR title follows Conventional Commits format (e.g., `fix(ci): replace opencode composite action with inline steps to fix rate-limit bug`)
- [ ] 4.3 Verify the PR includes both workflow and documentation changes in a single commit (or appropriate commits)
