## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` defines license compliance as one of the nine security jobs in substage 2C. The repo already has a `scancode-license-pr-diff` job (ScanCode 32.5.0) running advisory in FASE 1, wired to the aggregator. However, there is no OpenSpec change governing its promotion to blocking, the confirmation of the deny-list based on the ERP's distribution model, or the triage rule for `unknown` licenses.

Deep internet research (§8.4 of `docs/research/prebuild-security-stage-analysis.md`) confirms that:

- ScanCode supports `--json-pp` (CSV deprecated #3043, as the PRD says).
- License risk depends on distribution model: GPL activates on distribution, AGPL also on network service. SaaS vs on-prem vs image delivery changes risk.
- The repo's deny-list (GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0) is a reasonable default but must be confirmed against the ERP's distribution model.
- `unknown` licenses become noise if nobody reviews them; a triage SLA and 4 clean weeks are needed before blocking.

This change governs the deny-list confirmation, the `unknown` triage rule, and the promotion to blocking, following the PRD's Phase 4.

## What Changes

- Confirm the deny-list based on the ERP's distribution model (SaaS vs on-prem vs image). Document the decision in the existing `docs/learning/license-policy.md` (not a new file).
- Define a triage process for `unknown` licenses (`LicenseRef-scancode-unknown*`): ticket + 30-day deadline, escalation after 30 days, block after 4 clean weeks + deny-list confirmed.
- Promote `scancode-license-pr-diff` to blocking: remove `continue-on-error: true`, make the evaluate step exit non-zero on deny-list violations, rename job. (The job is already in `prebuild-security-complete.needs`.)
- Add a MODIFIED delta on `license-compliance` to reconcile the "unknown never blocks" invariant with the new escalation rule.
- Update `docs/learning/quality-gates.md` taxonomy.

## Capabilities

### New Capabilities

- `scancode-license`: deny-list confirmation by distribution model, `unknown` triage rule, promotion to blocking.

## Impact

- **Workflow:** `.github/workflows/ci.yml` — `scancode-license-pr-diff` job (promotion gated on deny-list confirmation + 4 clean weeks). Evaluate step modified to fail on violations.
- **Docs:** `docs/learning/quality-gates.md`, `docs/learning/license-policy.md` (distribution-model decision added).
- **Specs:** `openspec/specs/license-compliance` (MODIFIED delta to reconcile unknown rule).
- **Sin cambios en código de aplicación.** Sin cambios de schema ni API.
- **Coordinación:** Depende de `prebuild-security-aggregator-strict` (Phase 0) para el wiring. Requiere decisión del owner sobre el modelo de distribución del ERP.

## Non-implementable / manual items

- Owner decision on distribution model (SaaS/on-prem/image) — required before deny-list confirmation.
- Ticket creation for unknown licenses: manual (issue template) or via automation (not specified).
- 4-week calibration tracking: manual observation.
- SARIF emission: ScanCode does not emit SARIF natively; findings go to artifact/log only.
