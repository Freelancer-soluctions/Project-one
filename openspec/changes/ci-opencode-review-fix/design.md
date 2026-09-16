## Context

The `opencode-review.yml` workflow currently uses the `anomalyco/opencode/github` composite action (SHA-pinned at `5d5c35ee71c095464b9eb3c3e991df906f12a152`). This action has a known bug: its internal "Get opencode version" step uses an unauthenticated GitHub API call (`curl -sf`) that fails with 403/429 on shared runners due to rate limiting (60 requests/hour/IP). With `bash -e -o pipefail`, the fallback `${VERSION:-latest}` is dead code, causing the job to exit 1. Upstream issues (#32635/#35120/#31387) are marked `not_planned` with no patches since Dec 2025, and the action provides no input to override the version.

The workflow is now ACTIVE in GitHub (audited 2026-09-14 API; inventory shows 3 active workflows) and posts advisory code review comments on PRs toward `main` using Google Gemini 3.6 Flash. The fix must preserve all external behavior while eliminating the broken version-detection step.

## Goals / Non-Goals

**Goals:**

- Replace the composite action with inline steps that install a pinned opencode binary directly.
- Maintain identical workflow behavior: trigger, permissions, concurrency, timeout, `continue-on-error: true`, fork/dependabot/draft exclusions.
- Update documentation in `docs/CONTEXT-CICD.md` to reflect the fix and current runtime state (workflow ACTIVE, §5.9; root-cause + fix, §9.3.8).
- Preserve supply-chain safety by pinning the opencode binary version to a specific release (v1.18.31).

**Non-Goals:**

- Changing the model, prompt, or review output format.
- Modifying the workflow's advisory-only nature (non-blocking, no merge gating).
- Updating the `anomalyco/opencode/github` action itself (upstream has no fix).
- Adding new secrets or permissions.
- Changing the concurrency group or timeout settings.

## Decisions

**Decision 1: Inline steps vs. forking the composite action**

- **Chosen:** Replace the composite action with two `run` steps (install + run).
- **Rationale:** The action's version-detection bug is unfixable without upstream changes. Inline steps give full control over the installation process, eliminate the rate-limit issue, and remove the third‑party action dependency (reducing supply‑chain surface).
- **Alternatives considered:**
  1. Fork the action and patch the version‑detection step — rejected because it introduces maintenance burden and still depends on the action's other internal logic.
  2. Use a different third‑party action — no suitable alternative exists that provides the same opencode integration.
  3. Wait for upstream fix — indefinite; the workflow is broken today.

**Decision 2: Pinning the opencode binary version**

- **Chosen:** Use the official install script (`curl -fsSL https://opencode.ai/install | bash -s -- --version 1.18.31`) with the `--version` flag to pin the binary to v1.18.31. Follow with `opencode --version` as fail-fast verification.
- **Rationale:** The official install script handles OS/arch detection, extraction, and PATH setup in a single step. The `--version` flag pins the binary for reproducibility and supply‑chain safety. This is the same upstream-mutable script trade-off used by actionlint in ci.yml; it is mitigated by the version pin and fail-fast verification.
- **Alternatives considered:**
  1. Direct download from GitHub releases (`opencode-linux-x64.zip`) — rejected because it requires manual OS/arch detection, extraction, permissions, and PATH setup; the install script encapsulates all of this.
  2. Use `OPENCODE_VERSION` env var — the install script may support this, but we cannot guarantee availability on GitHub runners. The `--version` flag is simpler and more reliable.
  3. Use `latest` tag — reintroduces the same dynamic‑version problem we are fixing.

**Decision 3: Installation location**

- **Chosen:** Let the install script handle placement (defaults to `$HOME/.opencode/bin`); the binary is added to `GITHUB_PATH` or the script's default PATH mechanism.
- **Rationale:** The official install script manages its own installation location; no manual PATH manipulation is needed. Follows the conventional location used by the opencode installer.
- **Alternatives considered:**
  1. Install to `/usr/local/bin` — requires `sudo`, adds complexity.
  2. Install to `$RUNNER_TOOL_CACHE` — overkill for a single binary.

**Decision 4: Run command**

- **Chosen:** Execute `opencode github run` with the same env vars as before (`MODEL`, `USE_GITHUB_TOKEN`, `GITHUB_TOKEN`, `OPENCODE_CONFIG_CONTENT`, `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_API_KEY`). Additionally, set the `PROMPT` env var with the review prompt text (the composite action passes the prompt via `PROMPT` env var; the CLI reads it from environment).
- **Rationale:** Preserves identical behavior; the `opencode github run` subcommand is the official entrypoint for GitHub Actions integration. The `PROMPT` env var is the mechanism the composite action uses to pass the prompt to the CLI (verified via `github/action.yml` L62).

## Risks / Trade-offs

**Risk: Install script may change or become unavailable**
→ Mitigation: Pin to a specific version (v1.18.31) via `--version` flag; fail-fast `opencode --version` catches install failures immediately. The install script is upstream-mutable (same trade-off as actionlint download-script in ci.yml), but the binary version is pinned. Monitor the opencode repository for deprecation notices.

**Risk: Binary compatibility – the pinned version may not support all features**
→ Mitigation: v1.18.31 is the latest stable release (verified). If a newer version is required, update the `--version` flag and test locally before merging.

**Risk: Removal of the composite action may lose future upstream improvements**
→ Mitigation: The action is unmaintained (issues closed as `not_planned`). The inline approach gives us full control and can be updated independently.

**Risk: Docs update may be missed**
→ Mitigation: Include doc updates as explicit tasks in tasks.md; verify before archiving.

**Risk: CLI surface may require flags not present in the action**
→ `opencode github run` does NOT accept `--prompt`, `--config`, or `--model` flags (verified via `opencode github run --help`). The composite action passes these via env vars (`PROMPT`, `MODEL`, `OPENCODE_CONFIG_CONTENT`). The inline step MUST replicate this env-var-based interface. Verify CLI surface in task 1.4 before closing the run step — if future opencode versions add CLI flags, the env vars should still work (backward compatible).

## Migration Plan

1. **Create PR** with the updated `opencode-review.yml` (inline steps) and doc changes.
2. **Verify** the workflow runs on the PR (it should post a review comment as before).
3. **Merge** after the 4 required governance checks pass.
4. **Monitor** the next few PRs to ensure the review comment appears and the job completes successfully.
5. **Rollback** if needed by reverting to the previous SHA-pinned composite action (though it will be broken again).

## Open Questions

_(None – all decisions are resolved.)_
