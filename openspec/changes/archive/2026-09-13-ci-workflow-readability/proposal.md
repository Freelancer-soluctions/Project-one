## Why

`.github/workflows/ci.yml` is 1066 lines with job blocks scattered across the file without clear logical grouping. Section headers use inconsistent naming (e.g., `STAGE 1: INICIACIÓN`, `STAGE 2: PRE-BUILD QUALITY`, `STAGE 5: CI-COMPLETE`) that collides with the canonical pipeline diagram `docs/ci-cd-pipeline-empresarial.md` §23.3 (L2700-3186). This makes the file hard to navigate, hard to explain to new contributors, and creates confusion when cross-referencing the diagram vs. the actual file. The SAST job (Semgrep) currently sits between dependency-review and ci-complete — visually isolated from the 4 ruleset checks it logically belongs with.

## What Changes

- **Reorder job blocks** in `ci.yml` to match the 11-stage pipeline sequence defined in §23.3 of `docs/ci-cd-pipeline-empresarial.md`
- **Rename section headers** to use the exact stage names from the diagram (e.g., `STAGE 1: INICIACIÓN` → `ENTRY`, `STAGE 2: PRE-BUILD QUALITY` → `STAGE 2: PRE-BUILD — VALIDATE`)
- **Move SAST job** (`sast`) from its current position near L757 into the `STAGE 2: PRE-BUILD — VALIDATE` block alongside the 4 ruleset checks (verify-signatures, commit-lint, pr-title-lint, dco) — SAST is GOVERNANCE per §9.3.9 of CONTEXT-CICD.md
- **Add commented placeholder sections** for stages that live in other workflows (STAGE 5–11: ARTIFACT & SIGN, DEPLOY STAGING, POST-DEPLOY, PERFORMANCE, APPROVAL, DEPLOY PRODUCTION, MONITOR)
- **Rename the ci-complete section header** from `STAGE 5: CI-COMPLETE` to `AGGREGATOR — CI Complete`
- **NO behavior changes**: all `needs:`, `if:`, `continue-on-error:`, job `name:` values, and `ci-complete.needs` array remain byte-identical

## Capabilities

### New Capabilities

None — this is a pure refactor with no spec-level behavior changes. `skip_specs: true` set in `.openspec.yaml`.

### Modified Capabilities

None.

## Impact

- **Files modified**: `.github/workflows/ci.yml` (reorder + header renames only)
- **Files NOT modified**: job names, `ci-complete.needs`, `.github/workflows/deploy.yml`, `security.yml`, or any other workflow
- **Behavioral impact**: Zero — same triggers, same execution order, same gates, same checks
- **Risk**: Very low — structural refactor only; `git diff` will show large file changes but no logic changes
- **Rollback**: Simple `git revert` since it's a single commit
