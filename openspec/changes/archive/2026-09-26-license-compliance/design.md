# Design

## Context

Estado verificado 2026-09-25 (fuente: `docs/learning/license-compliance.md`):

| Capa                   | Herramienta                                                                                                                                                                                | Estado                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-time manifest       | `actions/dependency-review-action@v5` en `ci.yml` (L775-806): `license-check: true`, `deny-licenses` (5 entradas), `comment-summary-in-pr: on-failure`, `fail-on-scopes` default `runtime` | ✅ blocking, config hecha por change `dependency-review`                                                                                                               |
| Filesystem CVE         | Trivy en `security.yml` job `dependency-scan` (`format: sarif`, `category: trivy`)                                                                                                         | ✅ **activo desde 2026-09-25** (API `state: active`), modo audit `continue-on-error: true`, **no analiza licencias**                                                   |
| Archivo de librerías   | ScanCode 32.5.0                                                                                                                                                                            | ✅ parcial: audit semanal implementado 2026-09-25 (`scheduled-security.yml` L105, artifact 90d); ❌ falta el job PR-diff en `ci.yml` (dual job, researcher 2026-09-26) |
| Local pre-commit       | `scancode`/`fossa-cli`                                                                                                                                                                     | ❌ no existe                                                                                                                                                           |
| Evidencia semanal / PR | ScanCode artifacts                                                                                                                                                                         | ✅ `scancode-report.json` 90d (2026-09-25); ❌ falta `pr-license-report.json` 14d del job PR-diff                                                                      |

**Ajuste researcher (2026-09-26)**: el diagrama 23.3 (`docs/ci-cd-pipeline-empresarial.md` L2841-2851, actualizado por el orchestrator) ya documenta el diseño **dual job** (scancode 32.5.0: semanal repo completo + PR-diff `ci.yml` vía `git diff --diff-filter=ACMR`, deny-list unificada (clave `deny-licenses` del job `dependency-review` en `ci.yml`), artifact 90d/14d, FASE 1 advisory → FASE 2 blocking gradual, `LicenseRef-scancode-unknown*` = warning, `--csv` deprecado #3043, gap de `dependency-review` cubierto). Este design se ajusta a ese hallazgo.

Docs con gaps: `license-policy` no existe (solo `dependency-review.md` §4.2 que describe la lista); `pre-merge-gates-governance.md` L661 enlace 404 y L824 `(high)` residual; `quality-gates.md` §2 ya tiene fila `dependency-review` pero no fila para el audit nuevo.

Constraint: regla del repo — un change no mezcla stages (pre-merge vs scheduled/post-merge) y no toca código de aplicación. Ver `AGENTS.md` + `docs/pre-merge-gates-governance.md`.

## Goals / Non-Goals

**Goals:**

- Política de licencias escrita y enlazada (fuente única de verdad para `deny-licenses`).
- Tercera capa de análisis en modo **dual job**: licencia **por archivo** (ScanCode) — audit semanal advisory con evidencia 90d + PR-diff advisory (FASE 1) con evidencia 14d, evaluados sobre la deny-list unificada (clave `deny-licenses` del job `dependency-review` en `ci.yml`).
- Taxonomía `blocking`/`advisory` completa en `quality-gates.md`.
- Docs de gobernanza sin enlaces rotos ni umbrales incorrectos.

**Non-Goals:**

- NO FOSSA en CI (requiere `FOSSA_API_KEY`, plan/suscripción, GitHub App con 2 status checks y sin PR comments) — documentado como alternativa, no implementado.
- NO hook de pre-commit bloqueante en `.husky/` (ScanCode es lento sobre `node_modules/`; el riesgo de romper el workflow de commits del equipo no se asume en este change).
- NO transformador SPDX→SARIF propio (FOSSA y ScanCode no emiten SARIF; el SARIF existente es de Trivy).
- NO cambios en `deny-licenses` existente ni en `fail-on-severity: moderate`.
- NO tocar `security.yml` (re-habilitado 2026-09-25, API `state: active`; su `dependency-scan` corre en modo audit `continue-on-error: true` y así se documenta — la separación Trivy/dependency-review solo se documenta, no se reconfigura).
- NO eliminar el audit semanal en favor del PR-diff: ambos jobs son necesarios (D4).
- NO clasificar `LicenseRef-scancode-unknown*` como deny: es warning y no bloquea en ninguna fase.

## Decisions

### D1 — Alcance: documentación + config de CI, nunca código de aplicación

Todos los artefactos son docs (`.md`), config YAML de workflows y `.scancode.yml`. La lógica de negocio y los scripts existentes (`scripts/security/generate-security-digest.mjs` con `LICENSE_DENY_LIST`) no se tocan.

- _Alternativa descartada_: añadir script propio de validación de licencias → innecesario: `dependency-review-action` ya evalúa la deny-list en PR, ScanCode la evalúa en audit; un tercer evaluador duplicaría lógica y crearía un cuarto punto de drift.

### D2 — Pipeline de 3 capas (L1 local, L2 PR, L3 audit)

- **L1 pre-commit (advisory, opcional)**: `scancode --license --copyright --only-findings --json-pp` con `.scancode.yml`; invocación manual/documented (y opcional en hook futuro). Sin bloqueo automático. _Por qué no `fossa-cli` local_: `fossa analyze` requiere `FOSSA_API_KEY` y sube datos al servicio; ScanCode corre offline.
- **L2 PR-time (blocking)**: `dependency-review-action@v5` ya implementado; este change solo persiste/verifica `comment-summary-in-pr: on-failure` y documenta la decisión `fail-on-scopes` (default `runtime` mantenido; `development` pendiente de prueba controlada). _Por qué no subir L1 a blocking_: no hay integración nativa GitHub PR checks con ScanCode (requiere transformación propia) y el repo no tiene `vendor/` — el delta de manifiesto ya cubre el 95% del riesgo PR-time.
- **L2b PR-diff (ScanCode en `ci.yml`, FASE 1 advisory)**: job `scancode-license-pr-diff` en `pull_request` — la lista de entrada la forma `git diff --name-only --diff-filter=ACMR` (Added/Copied/Modified/Renamed; los borrados no aportan contenido licenciable), ScanCode `aboutcode/scancode-toolkit:32.5.0` (`--license --copyright --only-findings --json-pp`), evaluación por regex contra la deny-list unificada (clave `deny-licenses` del job `dependency-review` en `ci.yml`), artifact `pr-license-report.json` con `retention-days: 14`, `continue-on-error: true` (FASE 1). `LicenseRef-scancode-unknown*` → **warning**, nunca bloquea. Sin `scan-list.txt` estático: la lista vive en el diff.
- **L3 full/weekly (advisory)**: job `scancode-license-audit` en `scheduled-security.yml` (cron `0 3 * * 1`, ya existente) siguiendo el patrón de audit-mode de `gitleaks-full-scan` (`continue-on-error: true` + `upload-artifact` + `retention-days`); report `--json-pp` con retención 90 días; findings → issues manuales (sin `required_status_checks`).
- _Alternativa descartada_: `fossa-cli` en L3 → pospuesto por `FOSSA_API_KEY` + ausencia de SARIF (corregido: FOSSA **no** emite SARIF) y porque ScanCode cubre archivo+copyright sin dependencia de servicio externo. Se documenta la ruta de migración (`fossa analyze --output json` + `fossa report attribution --format spdx-json`).

### D3 — Taxonomía `blocking`/`advisory` y `quality-gates.md` como registro único

- `dependency-review` (L2) → `blocking (PR)` (ya en fila existente; se referencia, no se duplica).
- `scancode-license-audit` (L3) → `advisory (scheduled)`: `continue-on-error: true`, sin `needs` en `ci-complete`, sin ruleset; su fallo alimenta `notify-failure`/issues, no bloquea merge ni release.
- Regla: toda capa nueva de seguridad declarada en `quality-gates.md` §2 **antes** de considerarse activa; el audit no entra a `required_status_checks` (GitHub solo permite checks que corren en PR y este corre por cron).
- Doc de política (`license-policy.md`) es la fuente única: la deny-list de `ci.yml`, la de `generate-security-digest.mjs` y la de ScanCode policy apuntan a la misma lista — si divergen, se documenta cuál manda (`ci.yml` para el gate PR).

### D4 — Dual job: semanal + PR-diff son complementarios, no sustitutivos

`dependency-review` (L2, job `dependency-review` en `ci.yml`, clave `deny-licenses`) solo lee manifiestos/lockfiles del diff → gap: los archivos fuente/vendor añadidos en un PR pasan sin escanear hasta el cron semanal. **El PR-diff no duplica `dependency-review`**: aquél evalúa la declaración del manifiesto (vuln + licencia, blocking); éste escanea el **contenido de los archivos** del diff con ScanCode (licencia/copyright por archivo, advisory en FASE 1) — fuentes de datos distintas, misma deny-list unificada. El PR-diff (L2b) cierra ese gap en tiempo de PR; el audit semanal (L3) conserva la cobertura del repo completo (legado, ramas, cambios no hechos vía PR) y la evidencia longitudinal (drift/90d). **Decisión explícita: el job semanal NO se reemplaza por el PR-diff; ambos conviven** (artifact 90d semanal / 14d PR).

- _Alternativa descartada_: dejar solo el PR-diff → pierde cobertura fuera de PR y la evidencia auditable de retención larga.

### D5 — Arranque advisory y bloqueo gradual (FASE 1 → FASE 2)

- FASE 1: `continue-on-error: true` en los escaneos ScanCode; hallazgos visibles (log + artifact) sin bloquear; se mide la tasa de falsos positivos durante 2-4 semanas.
- FASE 2: remoción gradual de `continue-on-error` (un check por PR), solo cuando `LicenseRef-scancode-unknown*` esté confirmado como warning (nunca como deny) y la deny-list esté triada; actualizar `quality-gates.md` y `license-policy.md` al cambiar de fase.
- Precedente interno: early-abort SAST y `dependency-review` arrancan non-blocking → blocking tras evidencia (diagrama 23.3, L2819/L2850).

## Risks / Trade-offs

- [ScanCode lento sobre `node_modules/` en L1] → `--only-findings` + `.scancode-ignore`; L1 es manual/opcional, jamás en el hook default de este change.
- [Drift entre 3 listas deny (`ci.yml`, `generate-security-digest.mjs`, doc)] → `license-policy.md` declara fuente única + task de verificación por grep de coherencia.
- [Overlap con change in-flight `dependency-review` (comment-summary, fail-on-scopes, fila quality-gates)] → este change **verifica/persiste** esos puntos en vez de reconfigurarlos; si `dependency-review` los cierra primero, los tasks de verificación quedan cumplidos sin conflicto.
- [Audit advisory se ignora] → artifact con retención 90d + `notify-failure` existente en `scheduled-security.yml` ya notifica fallos; se enlaza el artifact desde la doc.
- [PR-diff solo ve el diff → no detecta licencias preexistentes] → por eso el semanal sigue siendo obligatorio (D4); el PR-diff se documenta como capa adicional, no como cobertura total.
- [`LicenseRef-scancode-unknown*` tratado como deny en FASE 2 → falsos positivos bloqueantes] → regla fija en spec: clasificación `warning` permanente, jamás bloquea por indeterminación.
- [Validación local: `scancode` no está instalado en PATH y no existe `scan-list.txt` en el repo] → no bloquea el diseño: la lista del PR-diff es el output de `git diff --diff-filter=ACMR`; la validación local usa la imagen Docker `aboutcode/scancode-toolkit:32.5.0` (misma versión pinnada que CI; Docker 29.0.1 disponible).
- [Diagrama 23.3 cita `--spdx-tv` en el dual job pero el job semanal implementado solo usa `--json-pp`] → **RESUELTO (2026-09-26, task 8.5)**: no se añade `--spdx-tv` a los jobs; `--json-pp` es la evidencia machine-readable que los steps de resumen parsean en ambos jobs; SPDX/RDF solo aporta valor al remitir evidencia a OSADL (futuro). Diagrama actualizado en consecuencia.
- [Enlace roto reaparece] → task final con grep de verificación de URLs canónicas (`dependency-review-action`, GitHub/RTD de ScanCode, no `scancode.io`).

## Migration Plan

1. Docs primero (policy, fixes de enlaces, taxonomía) — sin riesgo, reversible por revert de PR.
2. `.scancode.yml` + doc L1 — config nueva, no afecta pipelines existentes.
3. Job L3 en `scheduled-security.yml` — se valida con `workflow_dispatch` (trigger ya presente) antes del primer cron; rollback = borrar el job.
4. Verificación final: `actionlint`, `openspec validate --strict`, greps de coherencia.
5. Job PR-diff en `ci.yml` (FASE 1 advisory): validado en un PR de prueba; artifact 14d; rollback = borrar el job.
6. Ventana de medición 2-4 semanas → FASE 2 blocking gradual (task 8.4), actualizando `quality-gates.md`.
7. Validación local reproducible: `docker run aboutcode/scancode-toolkit:32.5.0` sobre un diff `ACMR` de prueba (equivale al job PR-diff) cuando haya que reproducir hallazgos.

## Open Questions

- `fail-on-scopes: development` — depende de un PR de prueba controlada; queda documentado como pendiente en `license-policy.md`, no bloquea este change (ya está fuera de alcance de implementación aquí).
- Incluir el audit L3 en `security-digest.yml` semanal — deferrable; no cambia specs ni task breakdown (task de seguimiento opcional).
