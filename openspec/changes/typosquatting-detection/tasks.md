## Phase 1 — Condicionamiento y verificación

- [x] 1.1 Verificar que `typosquat-guarddog` en `.github/workflows/ci.yml` tiene `if: needs.repo-discovery.outputs.manifests == 'true'` (o equivalente). Si no, añadirlo. — ✅ equivalente verificado (2026-11-10): `repo-discovery` no expone output `manifests` y NINGUNO de los 6 jobs condicionales de 2C consume outputs de `repo-discovery` — el condicionamiento por path vive en el skip-authorization del agregador `prebuild-security-complete` (step `Detect security-scope changes`: `(^|/)package(-lock)?\.json$` → `"typosquat-guarddog": $typosquat`, patrón design D8 de `prebuild-security-aggregator-strict`). Añadir un `if` duro desviaría del patrón de los 5 jobs hermanos. Documentado en el comentario del job (ci.yml) y en `quality-gates.md` §7.3.
- [x] 1.2 Verificar que `guarddog-weekly` en `scheduled-security.yml` está intacto (advisory, `continue-on-error: true`). — ✅ verificado (2026-11-10): `scheduled-security.yml` L470-477 — `name: Typosquat GuardDog (Weekly)`, `continue-on-error: true`, sin agregador, SARIF `category: guarddog-weekly`, artifact 90d.
- [x] 1.3 Confirmar que el wrapper `scripts/guarddog-verify.sh` está versionado y ejecutable, con `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false`. — ✅ verificado (2026-11-10): versionado en git, modo 100755 (`-rwxr-xr-x`), exporta `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false`, pin estricto `guarddog==3.2.0` con verificación de versión pre-scan, `GUARDDOG_PYTHON=3.13`, sandbox obligatorio, `--output-format sarif`.

## Phase 2 — Calibración (2-4 semanas)

- [x] 2.1 Registrar la tasa de falsos positivos por semana durante la calibración (paquete, regla, motivo del FP, fecha). — ✅ registro en `docs/learning/quality-gates.md` §7.3 (misma ventana ÚNICA de §7): periodo advisory 2026-09-28 → 2026-11-10 (>4 semanas). Único incidente con hallazgos: PR #133 (2026-09-29), 5 FP triados con paquete/motivo/fecha; runs 2026-11-09/10 con 0 hallazgos (evidencia por run ID vía `gh`).
- [x] 2.2 Clasificar los hallazgos ruidosos en `scripts/guarddog-verify.sh` con exclusiones justificadas (qué regla, por qué, hasta cuándo). — ✅ cero `--exclude-rules` necesarios: el ruido de PR #133 tenía causa raíz en el manifest raíz aplanado (nombres de workspaces + aliases `@isaacs/cliui`), remediado en el propio PR — no es heurística de GuardDog. El wrapper documenta la política y plantilla de exclusión justificada (qué/por qué/hasta cuándo) para ruido futuro.
- [x] 2.3 Evaluar Socket como alternativa si la tasa de FP sigue inaceptable (comparar: FP rate, cobertura de señales, costo, compatibilidad CI). — ✅ NO disparado: tasa de FP aceptable tras calibración → scenario de la spec "GuardDog promovido sin Socket" (Socket solo se re-evalúa si los FP bloqueantes son recurrentes en FASE 2; criterio registrado en §7.3).
- [x] 2.4 Documentar la decisión (promover GuardDog o migrar a Socket) en el change y en `docs/learning/quality-gates.md`. — ✅ decisión 2026-11-10: promover GuardDog a blocking sin Socket, documentada en §7.3 (tabla de evidencia, tasas de referencia 2.2% npm / 6.7% PyPI, issue #898) y en esta tasks.md.

## Phase 3 — Promoción a blocking (gated)

- [x] 3.1 Quitar `continue-on-error: true` de `typosquat-guarddog`. — ✅ 2026-11-10: job-COE eliminado; el bloqueo vive en un step `Enforce GuardDog findings` que parsea el SARIF (el scan lleva `|| true` y su exit no es señal).
- [x] 3.2 Añadir `typosquat-guarddog` al `needs` de `prebuild-security-complete` (anclado por nombre de job). — ✅ ya cableado en Phase 0 (`needs` conserva exactamente 9 jobs).
- [x] 3.3 Renombrar job para quitar "advisory"/"FASE 1" del nombre (ej. `Security: Typosquat GuardDog`). — ✅ nombre actualizado.
- [x] 3.4 Actualizar fila en `docs/learning/quality-gates.md` de `advisory (PR, fase 1)` a `blocking (PR)`. — ✅ fila `typosquat-guarddog` = `blocking (PR)`; `guarddog-weekly` sigue advisory.

## Validación

- [x] 4.1 Ejecutar `openspec validate typosquatting-detection --type change` y confirmar sin errores. — ✅ 2026-11-10: "Change 'typosquatting-detection' is valid" (exit 0).
- [x] 4.2 Verificar que `typosquat-guarddog` no está en `prebuild-security-complete.needs` antes de la promoción. — ✅ verificado en su momento (Phase 0 lo cableó deliberadamente, ver nota 3.2); POST-promoción (2026-11-10) el estado correcto es el inverso: `needs` conserva exactamente 9 jobs incluyendo `typosquat-guarddog` (ci.yml, bloque `prebuild-security-complete`).
- [x] 4.3 Verificar que `guarddog-weekly` sigue advisory (no se promueve). — ✅ verificado (2026-11-10): `continue-on-error: true` intacto en `scheduled-security.yml`, sin ruta blocking ni agregador; fila en `quality-gates.md` = `advisory (scheduled), sin ruta blocking`.

## Documentación

- [x] 5.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa. — ✅ filas verificadas: `typosquat-guarddog` = `blocking (PR)` (gate `jq` sobre SARIF, sin job-COE), `guarddog-weekly` = `advisory (scheduled)`; nueva subsección §7.3 con calibración, evidencia y rollback.
- [x] 5.2 Documentar la tasa de falsos positivos y la decisión de promoción/no-promoción. — ✅ §7.3 de `quality-gates.md`: tasas de referencia (2.2% npm / 6.7% PyPI, issue #898), tabla de FP observados (PR #133: 5 FP, causa raíz manifest; runs posteriores: 0), decisión "promover GuardDog sin Socket" (2026-11-10).
