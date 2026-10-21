# Spec Delta

> **Delta sobre `openspec/specs/sast-governance-gate/spec.md` (228 líneas leídas).** Cinco requirements pasan a
> MODIFIED con su bloque completo copiado (requirement + todos sus scenarios, con los títulos originales intactos
> por exigencia del validador), más cuatro ADDED para la delegación al script compartido y la graduación FASE 1 →
> FASE 2. Los demás requirements de la capability **no cambian** y por eso no se repiten: _SAST job runs on every
> pull request_ (el `name:` y el trigger se conservan), _Severity-filtered gate_, _Exclusions inline (no
> .semgrepignore dependency)_, _Custom rules versioned in repo with tests_, _Snapshot of custom rules_, _No SARIF
> upload in governance gate_, _Concurrency with PR-scoped group_, _Timeout protection_, _No CI_MINIMAL gate_.
>
> **Reconciliación de drift factual (verificada contra `.github/workflows/ci.yml` L409-424, 2026-10-19).** El spec
> vigente describía una implementación que **nunca existió**: decía `semgrep ci --baseline-commit <base_sha>`
> cuando el YAML ejecuta `semgrep scan --baseline-commit <base_sha> … --error` (`semgrep ci` no soporta
> `--severity` ni `--fail-on` — issue #5075 wontfix, y `--fail-on` tampoco existe en `scan`); y titulaba un
> requirement _"Inline packs (no local config dependency)"_ afirmando que el job NO referencia ninguna config local,
> cuando el YAML **sí** pasa `--config .semgrep/rules` (reglas custom versionadas, con fixtures, que la propia
> capability reclama en otros dos requirements). El drift se corrige aquí; **los títulos se conservan** por paridad
> con el spec original y porque el validador exige que un bloque MODIFIED no omita scenarios existentes — mismo
> precedente que `openspec/changes/local-commit-signature-gate/specs/commit-signing-enforcement/spec.md`
> (título `Bypass de Admin en emergencia` conservado, contenido reconciliado). El requirement _Custom rules
> severity ERROR_ entra en la lista MODIFIED por el mismo motivo: su texto cita la flag inexistente
> `--fail-on error`.
>
> **Reescritura de FASE 2.** El spec vigente prometía FASE 2 = _required status check en el ruleset 21227644_. El
> alcance cerrado con el usuario es otro: FASE 2 = quitar `continue-on-error` y añadir `sast` a
> `prebuild-governance-complete.needs` (RF-CI-04). El ruleset 21227644 **no se toca** en este change; si en el
> futuro se quisiera bindear el check, el nombre exacto a usar es `Governance: SAST (Semgrep)` (§3.2/§9.3.9 de
> `docs/CONTEXT-CICD.md`), y ese binding requeriría su propio change de gobernanza.

## MODIFIED Requirements

### Requirement: Diff-scoped scanning via baseline commit

The SAST scan SHALL analyze only the diff between the PR base and head commits, not the entire codebase. The scan
SHALL use `semgrep scan --baseline-commit <base_sha>` (with `fetch-depth: 0` on checkout) and SHALL obtain that
command from the shared script `scripts/sast-diff.mjs` rather than from an inline command line in the job. The
`semgrep ci` subcommand SHALL NOT be used: it does not support `--severity` or `--fail-on` (upstream issue #5075),
and its preset behaviour conflicts with the severity-filtered gate.

#### Scenario: Scan covers only PR changes

- **WHEN** a PR modifies 3 files out of 500
- **THEN** Semgrep scans only the diff of those 3 files against baseline rules, not all 500

#### Scenario: Full codebase on first PR

- **WHEN** a PR targets a baseline with no prior Semgrep scan history
- **THEN** Semgrep falls back to scanning the full diff (baseline commit behavior)

#### Scenario: Job does not embed the scan command

- **WHEN** the `sast` job's scan step is inspected
- **THEN** it runs `SAST_MODE=ci node scripts/sast-diff.mjs`
- **AND** it contains no inline `docker run … semgrep …` invocation

### Requirement: Inline packs (no local config dependency)

The scan SHALL use packs as its governing rule set, with every `--config p/...` flag: `p/owasp-top-ten`,
`p/security-audit`, `p/secrets`, `p/nodejs`, `p/expressjs`, `p/sql-injection`, `p/command-injection`, `p/react`,
`p/xss`. The pack list SHALL be defined in exactly one place — the shared script `scripts/sast-diff.mjs` — and used
verbatim by both the hook and the job; the job SHALL NOT maintain a pack list of its own. The scan SHALL also load
the versioned custom rules via `--config .semgrep/rules`, passed **before** the packs so local rules keep priority.
The job SHALL NOT reference `.semgrep/.semgrep.yml` (the legacy single-file config, whose packs are commented out).

`## Purpose` note: the capability Purpose states the scan uses inline packs with **no local config dependency**.
That sentence is stale twice over — the job has always passed `--config .semgrep/rules`, and the capability itself
reclaims versioned custom rules in two other requirements. A delta over an existing capability cannot carry a
`## Purpose`, so the correction is owned by the documentation task of this change (task 7.6).

#### Scenario: Packs resolve from Semgrep registry

- **WHEN** the scan runs
- **THEN** it loads the nine rule packs from the Semgrep registry via `--config p/...` flags
- **AND** those flags come from the shared script, not from the workflow file

#### Scenario: Local config file ignored by CI

- **WHEN** `.semgrep/.semgrep.yml` is modified (e.g., uncommenting packs, adding rules)
- **THEN** the CI job behavior is unchanged (it uses the packs and `.semgrep/rules/` from the shared script, not that file)

### Requirement: Phased rollout — F1 non-blocking, F2 blocking

The job SHALL be deployed in two phases **within the same change**, whose calibration window stays open for 2-4
weeks of real runs:

- **F1**: `continue-on-error: true` (non-blocking) — the finding is reported, retained as a 14-day artifact and
  left visible in the job log, without blocking merges.
- **F2**: remove `continue-on-error` and add `sast` to `prebuild-governance-complete.needs`, so a new ERROR
  finding fails the governance aggregator. The ruleset 21227644 is NOT modified: binding
  `Governance: SAST (Semgrep)` as a required status check is out of scope for this change.

F2 SHALL NOT be applied until the graduation criterion recorded in the workflow file is met.

`## Purpose` note: the capability Purpose describes F2 as **blocking in F2 after ruleset binding**. That is not the
agreed scope: F2 is `continue-on-error` removal plus inclusion in `prebuild-governance-complete.needs`, and the
ruleset 21227644 is not touched. The correction is owned by the documentation task of this change (task 7.6).

#### Scenario: F1 mode — finding does not block merge

- **WHEN** the job has `continue-on-error: true` (F1)
- **AND** the scan finds an ERROR severity issue
- **THEN** the job reports failure but the PR merge is not blocked

#### Scenario: F2 mode — finding blocks merge

- **WHEN** the job has `continue-on-error` removed (F2)
- **AND** `sast` is listed in `prebuild-governance-complete.needs`
- **AND** the scan finds an ERROR severity issue
- **THEN** the PR merge is blocked until the finding is resolved

#### Scenario: F2 is not applied ahead of its criterion

- **WHEN** the calibration window has not satisfied the documented graduation criterion
- **THEN** `continue-on-error: true` remains in place and `sast` is absent from
  `prebuild-governance-complete.needs`

### Requirement: Custom rules severity ERROR (coherent with gate)

All custom rules SHALL use `severity: ERROR` to maintain coherence with the governance gate filter
(`--severity ERROR --error`). Rules with lower severity would be invisible to the gate and provide false
confidence. The flag in force is `--error`; `--fail-on error` does not exist in `semgrep scan` and SHALL NOT be
referenced.

#### Scenario: Custom rule severity matches gate filter

- **WHEN** a custom rule in `.semgrep/rules/` fires on code in a PR diff
- **THEN** its `severity: ERROR` is caught by `--severity ERROR --error` and causes the job to fail

### Requirement: No ci-complete coupling

The SAST job SHALL NOT be listed directly in `ci-complete.needs` in either phase. SAST is a standalone governance
gate, not part of the quality/build aggregation. The direct-coupling prohibition is scoped to FASE 1 below; FASE 2
reaches `CI Complete` only **transitively**, through `prebuild-governance-complete`, which is the intended effect and
does not amount to a direct coupling (`CI Complete` is not a ruleset status check).

#### Scenario: ci-complete does not depend on sast

- **WHEN** `ci-complete` evaluates its `needs:` array while FASE 1 is in force
- **THEN** `sast` is NOT in the list (SAST failure does not cause `ci-complete` to fail on its own account)
- **AND** `sast` is absent from every aggregator `needs:` list

#### Scenario: FASE 2 — failure propagates transitively, by design

- **WHEN** `ci-complete` evaluates its `needs:` array after FASE 2 has been applied
- **THEN** `sast` is STILL not listed directly
- **AND** `ci-complete` nevertheless fails when `sast` fails, because `prebuild-governance-complete` is in its
  `needs:` and that aggregator now includes `sast`

## ADDED Requirements

### Requirement: CI job delegates the scan to the shared script

The `sast` job SHALL run the scan exclusively through `scripts/sast-diff.mjs` with `SAST_MODE=ci`, so that the CI
gate and the local `pre-push` gate share one implementation, one Semgrep version, one pack list and one exclusion
list. The job SHALL keep its name (`Governance: SAST (Semgrep)`), its `timeout-minutes: 15`, its
`if: github.event_name == 'pull_request'` condition, its `permissions: contents: read` and its participation in the
`ci.yml` concurrency group. The step's exit code SHALL be the script's exit code.

#### Scenario: Job invokes the script in CI mode

- **WHEN** the `sast` job runs on a pull request
- **THEN** its scan step runs `SAST_MODE=ci node scripts/sast-diff.mjs`
- **AND** the job keeps its name, timeout, trigger condition, permissions and concurrency participation

#### Scenario: Tool failure propagates in CI mode

- **WHEN** the shared script cannot run the scan in CI mode
- **THEN** the step's non-zero exit code is propagated to the job (fail-closed)

### Requirement: FASE 1 keeps the result as a 14-day artifact

While FASE 1 is in force, the job SHALL retain the scan result as a build artifact with a retention of 14 days, so
the calibration window accumulates evidence even though the finding does not block. The artifact SHALL be uploaded
with `if: always()` and an explicit behaviour when no file is produced, and the job SHALL keep
`continue-on-error: true`.

#### Scenario: Finding in F1 produces an artifact

- **WHEN** the scan reports a new ERROR finding during FASE 1
- **THEN** the PR is not blocked
- **AND** the scan result is available as an artifact retained for 14 days

#### Scenario: Clean run does not break the upload

- **WHEN** the scan produces no report file
- **THEN** the upload step does not fail the job (`if-no-files-found` handled explicitly)

### Requirement: Graduation criterion documented in the workflow

The graduation criterion from FASE 1 to FASE 2 SHALL be written as a comment in `.github/workflows/ci.yml`, next to
the `sast` job, so the two-phase rollout is discoverable without reading the change. The criterion SHALL state the
calibration window (2-4 weeks) and the condition (no untriaged false positives), and SHALL be updated in lockstep
with the shared calibration-window section of `docs/learning/quality-gates.md`.

#### Scenario: Criterion is visible in the workflow

- **WHEN** a maintainer opens the `sast` job definition
- **THEN** a comment states the FASE 1/FASE 2 split, the 2-4 week window and the graduation condition

#### Scenario: Criterion stays consistent with the calibration section

- **WHEN** the criterion changes
- **THEN** the same wording is reflected in the single calibration-window section of
  `docs/learning/quality-gates.md` (no second window is opened by this change)

### Requirement: FASE 2 promotion is deferred inside this change

The promotion requirement (remove `continue-on-error`, add `sast` to `prebuild-governance-complete.needs`) SHALL
remain in force as part of this change rather than being written off as out of scope. Its implementation tasks
SHALL be explicitly marked as deferred until the graduation criterion is met, and the change stays open across the
calibration window.

#### Scenario: Deferred tasks are explicit

- **WHEN** the change's task list is reviewed
- **THEN** the FASE 2 tasks appear in their own group, marked as deferred pending the calibration window

#### Scenario: Promotion is reversible

- **WHEN** FASE 2 has been applied and the criterion is later found not to hold
- **THEN** restoring `continue-on-error: true` and removing `sast` from
  `prebuild-governance-complete.needs` returns the gate to FASE 1 with no other change
