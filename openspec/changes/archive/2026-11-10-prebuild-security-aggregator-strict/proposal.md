## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` defines the target enterprise state (maturity level 3) for the prebuild security stage. Today the stage is at level 1-2: the aggregator `prebuild-security-complete` only `needs: [dependency-review, secrets, scancode-license-pr-diff]`, excludes six advisory jobs, and treats `skipped` as success for all but `secrets`. Without a strict aggregator, no later blocking change (SAST, SCA, licenses, Hadolint, IaC, typosquatting) actually protects the merge — a skipped or cancelled job silently passes.

Phase 0 of the PRD adoption plan is precisely this: "Agregador `security-complete` y reglas de agregador estricto (G7). Sin esto, ningún bloqueo posterior protege nada."

This change makes the aggregator strict and lays the wiring for all nine security jobs, so subsequent phases can promote advisory jobs to blocking by simply adding them to `needs` and removing `continue-on-error`.

## What Changes

- Make `prebuild-security-complete` fail on any result that is not `success` (`failure`, `cancelled`, `skipped`) using `if: always()` and an explicit jq evaluation over `needs`.
- Add all nine security jobs of substage 2C to `prebuild-security-complete.needs`: `dependency-review`, `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`.
- Add anti-skip guards scoped per job: `secrets` (already exists), `dependency-review` (must run on every PR), and `scancode-license-pr-diff` (only when the PR has ACMR changes). On `pull_request`, conditional jobs (Hadolint, IaC, typosquatting, actionlint-advisory, zizmor-advisory, lockfile-audit) are authorized to skip only via a change-detection check computed inside the aggregator step (no extra `needs` entry, to preserve the "exactly 9" contract). On `merge_group` and `workflow_dispatch`, skips of PR-only jobs are pre-authorized by event type.
- Pass `needs` through `env` (not interpolation) in the evaluation step, per PRD rule #5.
- Keep the aggregator name frozen (`Prebuild Security Complete`) so the ruleset binding remains stable.
- Update `docs/learning/quality-gates.md` to reflect the new `needs` contract and the strict anti-skip policy.

## Capabilities

### Modified Capabilities

- `ci-prebuild-substage-structure`: the `prebuild-security-complete` needs contract and anti-skip behavior.

## Non-goals

- No se promueven jobs advisory a blocking en este change (eso es Fase 1-5, cada uno en su propio change).
- No se cambia el ruleset de GitHub (binding de `Prebuild Security Complete` se hace como task separada cuando el owner lo decida, siguiendo el patrón de `secret-scanning` task 6.2).
- No se añade `security/exceptions.yml` ni SLA doc (changes posteriores).

## Impact

- **Workflow:** `.github/workflows/ci.yml` — `prebuild-security-complete` aggregator block (currently ~L3028).
- **Docs:** `docs/learning/quality-gates.md` (taxonomía de gates) and `docs/CONTEXT-CICD.md` (si aplica).
- **Sin cambios en código de aplicación** (backend/frontend/e2e). Sin cambios de schema ni API.
- **Coordinación:** Este change es prerequisito de las fases siguientes (pipeline-config-scan, containerfile-lint, iac-scanning, typosquatting-detection, sca-lockfile-compliance, scancode-license). Esos changes promueven sus jobs a blocking; este change solo hace el agregador estricto y los cablea.
