# Proposal

## Why

El gate `dependency-review` cubre solo el **manifiesto** (`package.json`/lockfile) y Trivy cubre CVE de filesystem, pero **no existe análisis de archivo de librerías** (FOSSA/ScanCode), **no hay política de licencias escrita** (`deny-licenses` está configurado en `ci.yml` L793 pero sin doc propia), **no hay auditoría semanal con evidencia** (artifact), y quedan **enlaces rotos** en `docs/pre-merge-gates-governance.md` (L661 → `actions/dependency-review` 404; L824 afirma default `high`, real es `low`). Gaps confirmados en `docs/learning/license-compliance.md` (§4.2, verificado 2026-09-25). **Researcher scancode 32.5.0 (2026-09-26)** confirma el gap de cobertura: `dependency-review` solo evalúa manifiestos/lockfiles del diff — los archivos fuente/vendor añadidos en un PR no se escanean hasta el audit semanal → solución **dual job** (semanal + PR-diff).

## What Changes

- **Doc de política de licencias**: nuevo `docs/learning/license-policy.md` — lista deny (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `Proprietary`, `CC-BY-NC-4.0`), regla allow/deny mutuamente excluyente, waivers (`allow-ghsas` vacío), expresiones SPDX, y cómo validar localmente; enlazado desde `license-compliance.md`, `dependency-review.md` y `quality-gates.md`.
- **Capa L1 local (opcional)**: `.scancode.yml` (`--license --copyright --only-findings`, `--json-pp` — `--csv` está deprecado) + comando pre-commit documentado; sin hook bloqueante obligatorio en `.husky/`.
- **Capa L3 audit semanal**: job `scancode-license-audit` en `.github/workflows/scheduled-security.yml` (cron lunes 03:00 UTC) en modo **advisory** (`continue-on-error: true`), sube `scancode-report.json` como artifact con `retention-days: 90`; sin `required_status_checks`. **No se reemplaza con el PR-diff: ambos jobs son necesarios** (semanal = repo completo + evidencia longitudinal 90d; PR-diff = tiempo de PR 14d).
- **Capa L2b PR-diff (dual job)**: job `scancode-license-pr-diff` en `.github/workflows/ci.yml` (`pull_request`): lista de archivos vía `git diff --name-only --diff-filter=ACMR` (Added/Copied/Modified/Renamed), ScanCode `aboutcode/scancode-toolkit:32.5.0` con `--license --copyright --only-findings --json-pp` (nunca `--csv`, deprecado — issue #3043), evaluación contra la **deny-list unificada de `ci.yml` L795** (la misma línea que usa `dependency-review`), artifact `pr-license-report.json` con `retention-days: 14`.
- **Fases advisory → blocking**: FASE 1 `continue-on-error: true` (advisory) → FASE 2 blocking gradual (2-4 semanas de runs limpios, removiendo el flag de a un check); `LicenseRef-scancode-unknown*` (licencia no determinable por ScanCode) se clasifica como **warning** y nunca bloquea, tampoco en FASE 2.
- **Taxonomía**: fila `scancode-license-audit` (`advisory`) en `docs/learning/quality-gates.md` §2, coherente con la fila `dependency-review` (`blocking (PR)`) ya existente, más la fila `scancode-license-pr-diff` (`advisory (PR, fase 1)` → `blocking (PR)` al pasar a FASE 2).
- **L2 verificado/persistido**: `comment-summary-in-pr: on-failure` y decisión `fail-on-scopes` (`runtime` mantenido, `development` documentado como pendiente) deben quedar explícitos en `ci.yml` y explicados en la doc de política.
- **Fix de doc**: `pre-merge-gates-governance.md` L661 → `https://github.com/actions/dependency-review-action`; L824 `(high)` → `(low)`.
- **Doc de separación de capas**: Trivy (CVE filesystem, SARIF `category: trivy`) vs `dependency-review` (diff PR sobre manifiesto, vuln+licencia, sin SARIF) vs `scancode` (archivo de librería, licencia/copyright, sin CVE) — complementarias, no duplicadas; el PR-diff **no duplica** `dependency-review` (manifiesto en `ci.yml` L765, deny-list L795): dual = semanal 90d (repo completo) + PR-diff ACMR 14d + deny-list unificada L795.
- **`security-events: write` documentado**: `dependency-review-action` no emite SARIF (el SARIF existente es de Trivy); el permiso queda como oportunidad futura, no error.
- **Correcciones de research aplicadas a doc**: FOSSA sin SARIF; FOSSA App = 2 status checks, no PR comments; `scancode.io` → fuentes canónicas GitHub/RTD; `fossa.yml` sin campo `experimental`.

Fuera de alcance: **NO** se implementa código de aplicación, **NO** se introduce FOSSA (requiere `FOSSA_API_KEY` + GitHub App; se deja como alternativa documentada), **NO** se añade hook bloqueante de pre-commit.

## Capabilities

### New Capabilities

- `license-compliance`: gobernanza de cumplimiento de licencias en **4 capas** con cobertura dual de escaneo (semanal repo completo → artifact 90d + PR-diff → artifact 14d) — (1) política documentada + resumen en PR + scopes de fallo (gate `dependency-review` existente, verificado, no duplicado), (2) L1 local `.scancode.yml` advisory, (3) L2b PR-diff `scancode-license-pr-diff` en `ci.yml` (FASE 1 advisory → FASE 2 blocking gradual), (4) L3 audit semanal `scancode-license-audit` con retención de evidencia; más taxonomía `blocking/advisory`, separación de capas y corrección de enlaces/umbrales en docs de gobernanza.

### Modified Capabilities

<!-- ninguno — `ci-supply-chain-security` ya declara el bloqueo por vulnerabilidad/licencia del PR; este change añade la capa de archivo/audit + documentación de política sin alterar ese contrato -->

## Impact

- `docs/learning/license-policy.md` (nuevo), `docs/learning/license-compliance.md` (§4.3/§5/§6), `docs/learning/dependency-review.md` (enlaces a política), `docs/learning/quality-gates.md` §2 y §4.4 (filas advisory: `scancode-license-audit` → `advisory (scheduled)` y `scancode-license-pr-diff` → `advisory (PR, fase 1)` que pasa a `blocking (PR)` en FASE 2; la fila `dependency-review` = `blocking (PR)` se referencia, no se duplica), `docs/pre-merge-gates-governance.md` L661/L824, `docs/CONTEXT-CICD.md` §3.4 si lista workflows.
- `.github/workflows/scheduled-security.yml`: job nuevo `scancode-license-audit` (+ artifact 90d).
- `.scancode.yml` (nuevo, config de escaneo local).
- `.github/workflows/ci.yml`: job nuevo `scancode-license-pr-diff` (diff `ACMR`, artifact 14d, FASE 1 advisory) + verificación/comentario del bloque `dependency-review` (deny-list unificada en L795).
- Desarrolladores: ven política escrita y resumen en PR; audit semanal genera evidencia auditable (90 días).
- Sin cambios de código de aplicación ni de reglas de commit/firma existentes.
