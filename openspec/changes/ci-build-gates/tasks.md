# Tasks

> **Estado (2026-11-13):** implementación local completa. **12/16** tareas hechas;
> **4 BLOQUEADAS** (3.1, 3.2, 4.2, 5.3) por dependencias externas: ≥1 run real de
> GitHub que reporte `Build Complete`, escritura sobre el ruleset de `main`
> (estado compartido → confirmación del usuario), y medición de tamaño/duración
> con Docker daemon (no disponible en este entorno). El change queda **ACTIVO**
> (sin archivar) hasta cerrar esas tareas. Validación local: actionlint 0,
> yamllint 0, `openspec validate ci-build-gates --strict` válido; programa jq del
> agregador verificado con jq 1.8.2 contra 11 escenarios (11/11).

## 1. Agregador estricto

- [x] 1.1 Reescribir `build-complete` en `ci.yml`: `if: always()`, evaluar resultados explícitamente (failure/cancelled/skipped no autorizado → rojo).
  - Evidencia: `build-complete` reescrito en [ci.yml:3787](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3787) (`if: ${{ always() }}`, `name: Build Complete` congelado, `timeout-minutes: 5`, `needs: [repo-discovery, client-build, server-build]`). Step `Check for failures` evalúa `toJSON(needs)` por `env` con `jq` (patrón canónico de `prebuild-security-complete`, PRD regla #5): `failure`/`cancelled` → rojo; `skipped` → rojo salvo autorización de `repo-discovery`. Sin cláusula `CI_MINIMAL` (P2-3).
  - Verificación: programa jq idéntico al simulado localmente con jq 1.8.2 → **11/11** escenarios correctos (all-success, client failure, server cancelled, docs-only PR ambos skipped, client/server PR mixto, prebuild-rojo con skip no autorizado, merge_group skip, outputs ausentes fail-closed, repo-discovery failure, shared=true ambos skipped). actionlint + yamllint exit 0.
- [x] 1.2 Documentar la regla: un `skipped` solo se acepta si una salida de detección de cambios lo autoriza.
  - Evidencia: implementado en el jq (`skip_authorized` sobre `repo-discovery.outputs.client/server/shared`, fail-closed `in_scope($v): if $v == null then true else $v == "true" end`) y documentado en `docs/learning/quality-gates.md` §9.3 (incl. merge_group/dispatch = suite completa, ningún skip autorizado).
- [x] 1.3 Añadir `timeout-minutes` a `client-build`, `server-build`, `build-complete`.
  - Evidencia: `client-build` `timeout-minutes: 10` ([ci.yml:3027](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3027)); `server-build` `timeout-minutes: 10` ([ci.yml:3057](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3057)); `build-complete` `timeout-minutes: 5` ([ci.yml:3800](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3800)).

## 2. Triggers y merge queue

- [x] 2.1 Añadir `merge_group` trigger a `ci.yml` (si hay cola de merge).
  - Evidencia: `merge_group: {}` ya presente en [ci.yml:10](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L10) (verificado, no requirió cambio). `build.yml:32` también lo declara. La cola de merge está activa en el ruleset 21227644 (regla `merge_queue`, ALLGREEN).
- [x] 2.2 Verificar que los checks obligatorios no quedan pending en merge queue.
  - Evidencia (verificación estática): los 3 contextos required del ruleset 21227644 —`Governance: PR Body Lint` (pr-metadata.yml), `Prebuild Governance Complete` y `Prebuild Security Complete` (ci.yml)— pertenecen a workflows que declaran `merge_group` (pr-metadata.yml y ci.yml:10). Por tanto se reportan en la cola y no quedan pending. `Build Complete` (ci.yml) y los jobs de build.yml también corren en `merge_group`. La confirmación empírica en cola real acompaña a task 3.1 (bloqueada).

## 3. Ruleset

- [ ] 3.1 Ejecutar el workflow en una rama de prueba para que `build-complete` se reporte ≥1 vez. — ⏳ BLOQUEADO: requiere un run real en GitHub (rama de prueba + PR/push). No ejecutable en este entorno local; el check `Build Complete` debe reportarse al menos una vez antes de poder exigirse (si no, queda Pending permanente).
- [ ] 3.2 Añadir `build-complete` al ruleset 21227644 como required check (GET → modify → PUT, nunca PATCH). — ⏳ BLOQUEADO: depende de 3.1 (≥1 run real) y es una escritura sobre estado compartido (ruleset de `main`) que requiere confirmación del usuario. Procedimiento documentado en `quality-gates.md` §9.7: contexto = `name:` del job **`Build Complete`** (no el id), `integration_id` 15368, GET → modify → PUT (nunca PATCH).
- [x] 3.3 Documentar el rollback (quitar el contexto del ruleset).
  - Evidencia: `docs/learning/quality-gates.md` §9.7 — rollback = mismo GET → modify → PUT eliminando el contexto `Build Complete` de `required_status_checks`; reversible, no toca el workflow (solo el binding); desbloquea la cola si el binding causa Pending permanente.

## 4. Gates y documentación

- [x] 4.1 Documentar G1-G7 con niveles inicial en `docs/learning/quality-gates.md` (criterio, código de salida/resultado de job, consecuencia, nivel inicial — PRD §Gates tabla).
  - Evidencia: `quality-gates.md` §9.2 (tabla G1-G7: criterio · job/workflow · señal exit-code/`needs.*.result` · consecuencia · nivel inicial). G1-G3 blocking, G4 advisory 2-4 semanas, G5/G6/G7 advisory. §9.1 aclara la topología de dos workflows (ci.yml tier compilación + build.yml tier imagen) y que G2-G7 son advisory a nivel de merge hasta vincular build.yml. §4.1 actualizado (client-build/server-build con comandos reales).
- [ ] 4.2 Definir el umbral de tamaño de imagen (G7) y de duración (G6) tras medir. — ⏳ BLOQUEADO: requiere medición en el primer build real con Docker daemon (no disponible) / run real de build.yml. Documentado en §9.8: dónde se medirá (G7 `docker image inspect .Size`; G6 duración de jobs, techo duro actual `timeout-minutes` 15/30/20) y que el umbral se fija tras una línea base, no a ojo.
- [x] 4.3 Documentar el proceso de excepciones (vulnerabilidades aceptadas con fecha de caducidad, motivo y responsable).
  - Evidencia: `quality-gates.md` §9.6 — registro canónico `security/exceptions.yml` (`tool: trivy`, `expires <= created + 90d`, validado por `security-exceptions-check`), allowlist `.trivyignore` (cableado pendiente de la promoción de G4), y registro EX-3 (`quality-exceptions.md`: motivo/responsable/caducidad, una excepción por PR, poda al resolver la causa raíz). Nunca `|| echo` ni `continue-on-error` silencioso.
- [x] 4.4 Documentar las 3 reglas de "Comportamiento ante fallo" (PRD §Gates): orden de ejecución (build antes de image), sin reintentos automáticos, publicar ≠ promover.
  - Evidencia: `quality-gates.md` §9.5 — (1) `build` (G1) antes de `image` (G2-G5), `needs` en cadena; (2) sin reintentos automáticos, reintento manual solo para infraestructura (`gh run rerun --failed`); (3) publicar ≠ promover (tag provisional `type=sha` con G3 pero G4 pendiente; promoción exige G3+G4 verde).
- [x] 4.5 Documentar la semántica Pending vs job omitido por `if` (PRD §Gates "Check obligatorio") — razón de ser de `if: always()`.
  - Evidencia: `quality-gates.md` §9.4 — workflow omitido por filtro → Pending (bloquea); job omitido por `if:` → Success (skip no es fallo). Por eso el agregador usa `if: always()` + evaluación explícita de `needs.*.result` (no confía en el verde implícito). Enlaza con §8.7.

## 5. Gaps del reviewer (2026-11-12)

- [x] 5.1 Reescribir `build-complete` para que falle ante `failure`, `cancelled` y `skipped` no autorizado (hoy emite verde "succeeded or skipped" — verde vacío).
  - Evidencia: idéntico a 1.1 (mismo agregador estricto, [ci.yml:3787](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3787)). El verde vacío "succeeded or skipped" quedó eliminado; jq verificado 11/11.
- [x] 5.2 Desactivar `if: false` en `client-build` y `server-build` (Stage 3 apagado) o documentar la decisión de no-op para server.
  - Evidencia: **ambos activados** con compilación real (opción "activar", no la de no-op). `client-build` ([ci.yml:3009](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3009)): `npm run build --workspace=apps/client`, path-scoped `client || shared` + verdict de los 4 prebuild. `server-build` ([ci.yml:3040](file:///C:/Users/user/Desktop/Programacion/Node-express-nest/project-one/.github/workflows/ci.yml#L3040)): `npx tsc -p apps/server/tsconfig.build.json` vía `setup-monorepo` con `prisma: 'true'`, path-scoped `server || shared` + 4 prebuild. El no-op D8 del server quedó **obsoleto** tras la migración TS + Dockerfile multi-stage (el server emite JS); documentado en §9.1/§4.1. Sin `if: false` en ninguno.
- [ ] 5.3 Añadir `build-complete` al ruleset de `main` como required check tras ≥1 run real (GET → modify → PUT, nunca PATCH). — ⏳ BLOQUEADO: idéntico a 3.2 (depende de 3.1 + confirmación del usuario por escritura en estado compartido). Procedimiento y rollback en §9.7.
