# Clasificación de Changes OpenSpec no archivados

Fecha: 2026-11-16 (análisis). Regla inamovible: **NO se archiva un change que tenga tasks sin completar**. Si el change necesita validación en PR (job/CI/otra validación), se ejecuta **ahora**, sin esperar tiempo.

## Resumen

- Total changes no archivados: 36 (excluye `archive/`)
- Changes con 0 tasks pendientes: 1 (`ci-prebuild-substage-structure-phase2`) — pero tiene error de validación de delta → NO archivable hasta corregir.
- Changes con tasks pendientes: 35
- Changes con error de validación `openspec validate --strict`: 7 (listados abajo)

## Regla de archivado

Un change solo se archiva cuando:

1. `tasks.md` tiene **todas** las tasks `[x]` (0 pendientes).
2. `openspec validate <change> --strict` pasa sin errores.
3. Cualquier validación en PR/CI requerida por sus tasks está ejecutada y evidenciada (no "esperar X días/semanas").

Si una task dice "esperar tiempo" o "post-merge", se ejecuta la validación ahora (PR de prueba, workflow_dispatch, run real) en lugar de esperar.

---

## Categoría A — Archivables (0 pendientes) — verificar validación

| Change                                | Pendientes | validate --strict | Acción                                                                                            |
| ------------------------------------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| ci-prebuild-substage-structure-phase2 | 0/15       | ❌ error delta    | Corregir delta (copiar scenarios "Calibration period", "Promotion to blocking") antes de archivar |

## Categoría B — Pendientes por validación en PR/CI (NO archivar; ejecutar validación ahora)

Changes cuyos tasks pendientes son principalmente "PR de prueba", "workflow_dispatch", "run real en GitHub", "verificar en ruleset", etc.

| Change                                | Pendientes | validate              | Notas                                                                                                                                                     |
| ------------------------------------- | ---------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ci-build-gates                        | 4          | ✅                    | Ejecutar workflow en rama de prueba (3.1), luego añadir required check (3.2/5.3), medir umbral (4.2)                                                      |
| ci-changesets-cli-v3-upgrade          | 1          | ✅                    | Green Release run + Verified Release PR observed                                                                                                          |
| ci-supply-chain-hygiene               | 5          | ⚠️ warning (renumber) | Auditoría deps CVEs (5.1), pinear SHA (5.2), re-ejecutar code-scanning (5.3), verificar Quality: ActionLint no required (4.3), primer run observado (4.4) |
| dependency-review                     | 1          | ⚠️ ambiguo            | PR de prueba con vulnerabilidad bloqueante (post-merge → ahora)                                                                                           |
| sast-weekly-scan                      | 1          | ✅                    | Verificar SARIF en Security tab (post-merge → ahora)                                                                                                      |
| secret-scanning                       | 4          | ✅                    | workflow_dispatch con fallo simulado, añadir a required_status_checks, PR con check roto                                                                  |
| secret-scanning-history-governance    | 5          | ✅                    | PR de prueba con secreto, sync specs, gates de coordinación                                                                                               |
| server-fix-role-permits-authorization | 2          | ✅                    | Sign-off de producto (matriz), cruce inventario                                                                                                           |
| tia-enterprise-gaps                   | 5          | ✅                    | PR de prueba para scope=full, etiqueta, tests fallidos inyectados, merge_group                                                                            |
| smart-test-ordering-ci-verification   | 6          | ⚠️ ambiguo            | PR con test que falla a propósito, verificar TTFF, cuarentena                                                                                             |
| iac-scanning                          | 6          | ✅                    | Primer run estable, baseline, PR con misconfig nueva                                                                                                      |
| ci-shifting-left                      | 14         | ✅                    | Drift real, secret verificado, Lighthouse, required status check, sharding E2E                                                                            |
| ci-scheduled-trivy                    | 12         | ✅                    | Dry-run Trivy/npm audit, workflow_dispatch, verificar SARIF                                                                                               |
| ci-testcontainers                     | 18         | ✅                    | Implementación + verificación en CI (Docker)                                                                                                              |
| ci-security-hardening                 | 7          | ✅                    | Trivy fail-closed pre-check, typecheck script, actionlint, openspec validate                                                                              |
| ci-eslint-v10-upgrade                 | 9          | ✅                    | Promoción ESLint 10, retirar advisory                                                                                                                     |
| docs-changelog-validation             | 10         | ✅                    | Crear configs markdownlint/vale, scripts, job docs-validation                                                                                             |
| cd-aws-deploy-pipeline                | 27         | ✅                    | Deploy real staging/prod, rollback, validación                                                                                                            |
| cd-observability-sentry               | 26         | ✅                    | Implementación Sentry + verificación sin DSN + release dry-run                                                                                            |
| ci-testing-gate-promotion             | 10         | ❌ error delta        | Corregir delta (prebuild-tests-complete) antes                                                                                                            |
| silent-exit-detection-refinement      | 7          | ❌ error delta        | Corregir delta (Silent exit detection) antes                                                                                                              |
| sync-specs-post-retirement            | 10         | ⚠️ info               | Sync specs, grep residual, tests prompt-hygiene                                                                                                           |

## Categoría C — Pendientes de implementación (código/config) + validación

| Change                              | Pendientes | validate                          | Notas                                   |
| ----------------------------------- | ---------- | --------------------------------- | --------------------------------------- |
| add-event-reminders                 | 38         | ❌ sin deltas                     | Implementación BullMQ + tests           |
| add-event-rsvp                      | 13         | ✅                                | Verificación pendiente                  |
| add-patch-endpoints                 | 2          | ✅                                | Smoke test manual PATCH + regresión PUT |
| add-sse-notification-infrastructure | 76         | ✅ (info)                         | Implementación SSE + tests              |
| adjust-global-rate-limit            | 56         | ✅                                | Implementación + tests                  |
| frontend-data-architecture          | 71         | ✅                                | Implementación + tests                  |
| learning-cicd-profesional           | 61         | ✅                                | Contenido + validación                  |
| mcp-proxy-semantic-activation       | 14         | ✅                                | Implementación                          |
| pbt-candidate-locations             | 21         | ✅                                | Implementación PBT                      |
| 2026-04-19-document-system-modules  | 23         | ❌ sin deltas + metadata inválida | Corregir metadata (.openspec.yaml)      |
| single-main-agent                   | 34         | ✅                                | Implementación agent unification        |
| merge-planner-into-reviewer         | 24         | ✅                                | Implementación + eval                   |
| add-ical-export                     | 0?         | ✅                                | 3/4 artifacts (falta tasks? verificar)  |
| silent-exit-detection-refinement    | 7          | ❌ error delta                    | (listado también en B)                  |

## Errores de validación a corregir (bloquean archivado incluso si tasks se completan)

1. `2026-04-19-document-system-modules`: metadata inválida (schema esperado string) + sin deltas → set `skip_specs: true` o añadir deltas; corregir `.openspec.yaml`.
2. `add-event-reminders`: sin deltas → set `skip_specs: true` o añadir deltas.
3. `ci-prebuild-substage-structure-phase2`: delta MODIFIED omite scenarios "Calibration period", "Promotion to blocking" → copiarlos.
4. `ci-testing-gate-promotion`: delta MODIFIED "prebuild-tests-complete" omite "property-tests is blocking" → copiarlo.
5. `silent-exit-detection-refinement`: delta MODIFIED "Silent exit detection" omite 3 scenarios → copiarlos.
6. `sync-specs-post-retirement`: prompt-format MODIFIED header "Legacy h1 REMEMBER heading is normalized" no encontrado → ajustar header.
7. `dependency-review`, `smart-test-ordering-ci-verification`: ambiguo change+spec → usar `openspec change validate`.

## Acciones ejecutadas en esta sesión

- `actionlint` sobre `.github/workflows/`: ✅ sin errores.
- `openspec validate --strict` sobre todos los changes: resultados arriba.
- Clasificación generada.

## Próximos pasos (sin archivar ninguno con pendientes)

1. Para cada change en Categoría B/C, ejecutar las validaciones de PR citadas en sus tasks (PR de prueba, workflow_dispatch, etc.) y marcar `[x]`.
2. Corregir los 7 errores de validación de deltas.
3. Solo archivar cuando 0 pendientes + validate OK + validación PR evidenciada.
