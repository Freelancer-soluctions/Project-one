## Why

The `opencode-review.yml` workflow is currently broken: the `anomalyco/opencode/github` composite action fails on its internal "Get opencode version" step due to GitHub API rate‑limiting (unauthenticated `curl -sf` returns 403/429 on shared runners). With `bash -e -o pipefail`, the fallback `${VERSION:-latest}` is dead code, causing the job to exit 1. Upstream has no fix (issues #32635/#35120/#31387 marked `not_planned`; action pinned to SHA since Dec 2025). The action provides no input to override the version, so the only viable fix is to replace the composite action with inline steps that install a pinned opencode binary directly.

## What Changes

- Replace the `anomalyco/opencode/github` composite action with two inline steps:
  1. **Install opencode** – run the official install script (`curl -fsSL https://opencode.ai/install | bash -s -- --version 1.18.31`) with the binary pinned via `--version` flag; follow with `opencode --version` as fail-fast verification. Trade-off: the install script itself is upstream-mutable (same pattern as actionlint download-script in ci.yml), mitigated by the version pin.
  2. **Run opencode** – execute `opencode github run` with the same env vars (`MODEL`, `USE_GITHUB_TOKEN`, `GITHUB_TOKEN`, `OPENCODE_CONFIG_CONTENT`, `GEMINI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`/`GOOGLE_API_KEY`).
- Preserve all existing workflow behavior: trigger (`pull_request` to `main`), concurrency, timeout, `continue-on‑error: true`, fork/dependabot/draft exclusions, permissions.
- Update documentation in `docs/CONTEXT-CICD.md`:
  - §5.9: mark `opencode-review.yml` as `active` (audited 2026‑09‑14 API; inventory now shows 3 active workflows).
  - §9.3.8: add root‑cause analysis (rate‑limit) and describe the inline‑step fix.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `ci-opencode-code-review`: Replace the composite action with inline steps to avoid the rate‑limit bug; update the "action version" and "action handles fetch" requirements to reflect the new implementation.

## Impact

- **GitHub Actions**: `.github/workflows/opencode-review.yml` – the `uses: anomalyco/opencode/github` step is removed and replaced with two `run` steps (install + execute). The workflow's external behavior (trigger, permissions, concurrency, review output) remains identical.
- **Secrets**: No change – `GEMINI_API_KEY` (and its three env‑var aliases) already exist.
- **Permissions**: No change – `contents: read`, `pull-requests: write`, `issues: read`.
- **Supply chain**: Eliminates the dependency on the third‑party composite action (which itself fetched a binary at runtime). The new steps install a pinned release (v1.18.31) via the official install script; the script is upstream-mutable but the binary version is pinned. Fail-fast `opencode --version` catches install failures immediately.
- **Docs**: `docs/CONTEXT-CICD.md` updated to reflect the current runtime state and the fix.
