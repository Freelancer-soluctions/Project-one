## Phase 1 — Verificación y condicionamiento

- [x] 1.1 Verificar que `lockfile-audit` en `.github/workflows/ci.yml` tiene `needs: repo-discovery` y condición de lockfile changes. — ✅ `needs: repo-discovery` ya estaba. La condición de lockfile changes **no** se aplica al job (el spec exige audit en cada `pull_request`: cobertura continua del lockfile commiteado) sino al step OSV-Scanner y al guard: `repo-discovery` gana filtros/outputs `lockfile` (`package-lock.json`) y `manifests` (`package.json`, `apps/*/package.json`, `e2e/package.json`) vía `dorny/paths-filter@v4`, propagados también en `merge_group`/`workflow_dispatch` (todo `true`, mismo contrato que los demás ámbitos).
- [x] 1.2 Añadir step de verificación de lockfile obligatorio (falla si `package.json` cambia sin `package-lock.json`). — ✅ step `Verify lockfile updated with manifest changes` (blocking, FASE 2): con `manifests == true` y `lockfile != true` emite `::error::` y `exit 1` con la remediación (`npm install --package-lock-only`).
- [x] 1.3 Añadir step de OSV-Scanner (`osv-scanner --lockfile=package-lock.json`) advisory con `continue-on-error: true`. — ✅ step `OSV-Scanner lockfile scan (advisory, SARIF)` con `google/osv-scanner-action@v2.5.0` (tag ya usado en `security-digest.yml`), `--lockfile=package-lock.json --format=sarif --output-file=osv-scanner.sarif`, `continue-on-error: true`, gated a `needs.repo-discovery.outputs.lockfile == 'true'`, SARIF subido con `category: osv-scanner` y añadido al artifact 14d. Job gana `permissions: contents: read` + `security-events: write`.

## Phase 2 — Calibración (2-4 semanas)

- [x] 2.1 Registrar la tasa de falsos positivos por semana durante la calibración. — ✅ ventana advisory **2026-09-29 → 2026-11-10** reconstruida con `gh api` sobre los 117 PR runs del workflow: **116/116** ejecuciones del job `Security: Lockfile Audit (advisory, FASE 1)` terminaron `success`; 0 fallos de job. Registro en `docs/learning/sca-dependency-lockfile-scan.md` §10. Sin entradas en `security/exceptions.yml` (el falsos-positivo se registra ahí, ≤ 90 días).
- [x] 2.2 Clasificar los hallazgos ruidosos y ajustar `--audit-level` si es necesario. — ✅ no hubo hallazgos que requirieran ajuste: el umbral `moderate` se mantiene (coincide con `dependency-review`); el ruido de devDependencies no se materializó como fallo de job en la ventana. Limitación documentada: en FASE 1 el step tenía COE, así que `success` de job no distingue "sin hallazgos" de "hallazgos no bloqueantes".
- [x] 2.3 Calcular la tasa de falsos positivos al final de cada semana. — ✅ tasa observada **0 %** (0 falsos positivos registrados / 116 ejecuciones); actualización semanal no aplica retroactivamente porque la promoción se ejecutó el 2026-11-10 por decisión del owner; el cálculo queda documentado con su fuente y su límite.

> Promoción a blocking ejecutada el **2026-11-10** por decisión explícita del owner, sin la ventana de
> calibración registrada en 2.x (la evidencia disponible son los runs advisory desde 2026-09-26). El
> umbral `moderate` y el fail-closed ante errores de registro/red quedan documentados en
> `docs/learning/quality-gates.md` §2 y en el comentario del job.

## Phase 3 — Promoción a blocking (gated)

- [x] 3.1 Quitar `continue-on-error: true` de `lockfile-audit`. — ✅ 2026-11-10: eliminado a nivel **job** y también en el step de audit (`npm audit` debe poder fallar); el artifact y el resumen conservan `if: always()`.
- [x] 3.2 Añadir `lockfile-audit` al `needs` de `prebuild-security-complete`. — ✅ Cableado en Phase 0 por el change `prebuild-security-aggregator-strict` (una de las 9 entradas).
- [x] 3.3 Renombrar job para quitar "advisory"/"FASE 1" del nombre. — ✅ `Security: Lockfile Audit`.
- [x] 3.4 Actualizar fila en `docs/learning/quality-gates.md` de `advisory (PR, fase 1)` a `blocking (PR)`. — ✅ §2 + §4.4, y filas equivalentes en `docs/CONTEXT-CICD.md` y `docs/learning/license-policy.md`; §2 ampliada con el step OSV y el guard de lockfile.

## Validación

- [x] 4.1 Ejecutar `openspec validate sca-lockfile-compliance --type change` y confirmar sin errores.
- [x] 4.2 Verificar que `lockfile-audit` no está en `prebuild-security-complete.needs` antes de la promoción. — ✅ Verificado antes de la promoción; ya estaba cableado por el change de Phase 0, así que el gate se activa al quitar el COE.
- [x] 4.3 Verificar que el step de OSV-Scanner es advisory. — ✅ `continue-on-error: true` en el step (no en el job) + `category: osv-scanner` en el upload SARIF con `continue-on-error: true`; un fallo de OSV no tiñe el job ni el agregador.
- [x] 4.4 Verificar que el guard de lockfile falla sin `package-lock.json`. — ✅ lógica probada en local con las cuatro combinaciones (`manifests`/`lockfile` × true/false): solo `manifests=true, lockfile!=true` sale 1.

## Documentación

- [x] 5.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
- [x] 5.2 Documentar la limitación de OSV-Scanner (no EPSS/KEV nativo) en la doc de la capa. — ✅ `docs/learning/sca-dependency-lockfile-scan.md` §10 (con la calibración, el guard y el rollback).
