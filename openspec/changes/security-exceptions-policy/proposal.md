## Why

The PRD `Análisis-del-stage-SECURITY-estrategias-y-gates` defines maturity level 3 (enterprise) as the target for the prebuild security stage. The stage currently lacks three controls that the PRD identifies as highest-value gaps (§8.10, §8.11):

1. **No security exceptions policy.** Suppressions (inline or in files) have no owner, reason, or expiry date. A suppression without governance is an untracked risk acceptance. The PRD's E6 (exceptions versionadas) requires a versioned file with dueño y caducidad, plus a CI job that fails when an exception expires.
2. **No SLA for vulnerability remediation.** The PRD proposes 7/30/90/best-effort by severity, corroborated by industry (GitLab, Cloudaware, OWASP). Without documented SLAs, remediation is ad hoc.
3. **No monthly metrics review.** Seven metrics are defined (§"Operación: métricas") but none are collected or reviewed. Without metrics, gates become rituals.

These three gaps are the single highest-value missing controls for reaching level 3 enterprise. They are also the most "not directly implementable" items (§8.16 items 4 and 5: custom parser, custom workflow). This change builds them as custom artifacts.

## What Changes

- Create `security/exceptions.yml` — versioned file with schema: `id`, `tool`, `finding`, `scope`, `reason`, `owner`, `created`, `expires`, `ticket`. Every suppression (inline or file) references an exception id.
- Create `security/SLA.md` — documented remediation SLAs (Critical/KEV/exploit: 7 days; High: 30 days; Medium: 90 days; Low: best effort), with clock-start rules, escalation, and exception interaction.
- Create a CI job `security-exceptions-check` in `.github/workflows/ci.yml` (substage 2C, advisory in FASE 1) that parses `security/exceptions.yml` and fails if any exception is expired or malformed.
- Create a monthly metrics workflow `.github/workflows/security-metrics.yml` that collects the seven PRD metrics and opens/updates an issue with results.
- Create runbooks under `docs/runbooks/security/`: `exception-expiry.md`, `secret-incident-response.md` (if not already present), `cve-triage.md`.
- Update `docs/learning/quality-gates.md` and `docs/CONTEXT-CICD.md` to reference the new artifacts.
- Add `security/` to `CODEOWNERS` (if not already present) so changes require review.

## Capabilities

### New Capabilities

- `security-exceptions-policy`: governed exceptions with owner, reason, expiry, and a CI gate that fails on expiry, plus SLA documentation, monthly metrics, and runbooks.

## Impact

- **New files:** `security/exceptions.yml`, `security/SLA.md`, `docs/runbooks/security/*.md`.
- **Workflows:** `.github/workflows/ci.yml` (new job `security-exceptions-check` in substage 2C), `.github/workflows/security-metrics.yml` (new, monthly cron).
- **Repo config:** `.github/CODEOWNERS` (add `security/` entry).
- **Docs:** `docs/learning/quality-gates.md`, `docs/CONTEXT-CICD.md`.
- **Sin cambios en código de aplicación** (backend/frontend/e2e). Sin cambios de schema ni API.
- **Coordinación:** Este change es independiente de los changes de promoción a blocking (pipeline-config-scan, containerfile-lint, etc.). Puede aplicarse en paralelo. Depende de `prebuild-security-aggregator-strict` para que el nuevo job se cablee al agregador (en FASE 2).

## Non-goals

- No se promueven jobs advisory a blocking.
- No se implementa OSV-Scanner ni Snyk (decisión abierta, requiere presupuesto).
- No se habilita push protection (depende del plan de GitHub).
- No se añade TruffleHog (opcional, change futuro).
