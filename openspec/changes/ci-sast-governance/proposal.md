## Why

The CI pipeline lacks a SAST (Static Application Security Testing) governance gate. Today, Semgrep exists only as a local pre-commit hook (`semgrep-staged.ps1` via Docker) and in `security.yml`/`scheduled-security.yml` — both `disabled_manually` in GitHub. The only workflow running on PRs is `ci.yml`, which has 4 governance checks (signatures, commit-lint, pr-title-lint, DCO) and `dependency-review`, but zero SAST. This means code with ERROR-severity security findings (SQL injection, command injection, XSS, prototype pollution) can merge to `main` without any automated static analysis.

**Why NOT local config scope:** The local pre-commit hook is already implemented (`npm run sast:semgrep` → `scripts/security/semgrep-staged.ps1` → Docker `semgrep/semgrep`). It works for staged files. The `.semgrep/.semgrep.yml` config file and `.semgrepignore` are local dev tools, not pipeline governance. Activating packs in `.semgrep.yml` or expanding `.semgrepignore` is local config tuning — it does NOT close the governance gap. The gap is that NO SAST job exists in `ci.yml` (the only enabled workflow on GitHub).

## What Changes

- **New `sast` job in `.github/workflows/ci.yml`**: runs `semgrep/semgrep` Docker image (tag `1.176.1`) with `--baseline-commit` diff-scoped scan on every PR. Passes packs inline via `--config p/...` flags (zero local file changes). Fails on `--severity ERROR` findings. Non-blocking in F1 (continue-on-error: true), blocking in F2 (after ≥1 successful run, manual ruleset PATCH).
- **Documentation updates**: docs/CONTEXT-CICD.md (§3.3 table, §9.3.9 sub-section, §3.1 note), docs/ci-cd-pipeline-empresarial.md (§23.3/§23.4).

## Capabilities

### New Capabilities

- `sast-governance-gate`: Semgrep SAST as a CI governance gate in ci.yml — diff-scoped, severity-filtered, inline packs (no local config dependency), phased from non-blocking to blocking with ruleset binding.

### Modified Capabilities

- `ruleset-expansion`: (DEFERRED to F2) Add "SAST (Semgrep)" as the 5th required status check in ruleset 21227644 — only after ≥1 successful non-blocking F1 run. This change documents the F2 procedure but does NOT execute it.

## OUT-OF-SCOPE (excluded from this change)

| Item                                                                      | Why out-of-scope                                                                                                                                                   | Where it lives                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Local Semgrep config activation (`.semgrep/.semgrep.yml` uncomment packs) | Local dev config, not pipeline governance. Pre-commit hook already works.                                                                                          | Future local config change      |
| `.semgrepignore` expansion                                                | Local dev tool, not pipeline concern.                                                                                                                              | Future local config change      |
| Weekly full scan (`sast-full` job in `scheduled-security.yml`)            | Domain SECURITY, not GOVERNANCE. Rule 4: one change, one domain. `scheduled-security.yml` is `disabled_manually` — separate change to enable + add SAST full scan. | Future change (SECURITY domain) |
| SARIF upload to Security tab                                              | Requires `security-events: write` permission + GHAS. Out of scope for governance gate.                                                                             | F3 future change                |

## Impact

- **Files modified**: `.github/workflows/ci.yml` (new job), `docs/CONTEXT-CICD.md` (§3.3, §9.3.9, §3.1), `docs/ci-cd-pipeline-empresarial.md` (§23.3/§23.4).
- **Dependencies**: `semgrep/semgrep:1.176.1` Docker image (pinned tag). No npm dependencies added.
- **GitHub config**: ruleset PATCH required as manual admin step AFTER ≥1 successful F1 run (F2, not part of this implementation).
- **Risk**: F1 non-blocking — false positives won't block merge. F2 transition requires ≥1 clean run before ruleset binding.
