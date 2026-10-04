# Tasks — Calibración y promoción de los gates de testing a FASE 2

Continuación de `ci-testing-pipeline-reactivation` (archivado 2026-10-03), que dejó los 6 jobs en FASE 1 advisory.
Todo lo que aquí aparece ya existía como tarea abierta en aquel change y se traslada con su estado real; el número de
tarea original va en la nota para poder rastrearlo. Ver `design.md` D1-D6.

Convención: cada grupo cierra con una verificación (`x.V`). Orden: 1 (calibración) → 2 (guard local) → 3 (promoción);
el grupo 4 es verificacion de corridas reales y se cierra cuando la ventana haya producido datos.

## 0. Bloqueante descubierto 2026-10-03 — contaminación de mocks bajo `isolate: false`

**Este grupo es prerrequisito del grupo 3.** Antes de promover los gates a blocking hay que poder confiar en que un
rojo significa un defecto y no un artefacto del arnés de test.

- [x] 0.1 Diagnosticar los 4 jobs rojos del PR #138 (`Tests: Unit - Server`, `Tests: Integration - Server`,
      `Tests: Smoke - Server`, `Quality: Server Coverage`). Los 4 fallos son **preexistentes** (ya fallaban en los runs
      `7bba30b5` y `ece67e3c`, anteriores al renombrado de jobs) y son **una sola causa**, no cuatro:
      `TypeError: prisma.events.findUnique is not a function` y `No "findAttendeeById" export is defined on the
  "./dao.js" mock`.
- [x] 0.2 Reproducir en local: `npx vitest run ".unit.test.js"` en verde (16/16), pero con `CI=true` en rojo
      (6 ficheros, 49 tests). La condición `process.env.CI === 'true'` activa `isolate: false`.
- [x] 0.3 Aislar el mecanismo: con el registro de módulos compartido, el `vi.mock` del PRIMER fichero de test del
      worker se cachea y pisa al de los siguientes. Cada fichero declaraba solo el subconjunto de exports que
      exercise — 4, 7, 8, 8 y 11 frente a los **12** reales de `attendee/dao.js` —, así que el resultado dependía del
      ORDEN de ejecución. Probado aislando parejas (`event-rsvp-promote` + `event-rsvp-admin`): juntos fallan,
      separados pasan.
- [x] 0.4 Corregir en la raíz: eliminar `isolate: false` de `apps/server/vitest.config.js` y de
      `apps/client/vitest.config.js`. El cliente no sufría el síntoma (26/26 con y sin) pero arrastraba la misma
      trampa, y mantener la divergencia dejaría la spec mintiendo.
- [x] 0.5 Lockstep documental: requirement nuevo "Vitest CI runs keep module isolation" en
      `openspec/specs/ci-flaky-retry/spec.md` (con el coste medido), y `docs/learning/unit-tests-enterprise.md` §6 y
      §7.5, que ya describían `isolate: false` como _"causa típica de order-dependence"_ — el diagnóstico estaba
      escrito, solo no aplicado. `openspec/changes/ci-testcontainers/` cita la config en 3 sitios; su tarea 4.2
      (verificar compatibilidad con Testcontainers) sigue abierta y es donde corresponde re-verificar.
- [x] 0.V Verificación: server unit **16/16 (161 tests)** con `CI=true`, server integration **4/4**, client unit
      **26/26 (41 tests)**, y `Flaky-reporter: 161 tests, 0 con retry, 0 flaky` (antes `41 con retry`, que era el
      sintoma visible de la reejecución fallida). Coste medido: +3.2s (1.2s → 4.4s) sobre un job de ~2m20s (~2%).

## 1. Ventana de calibración (migrada de 3.1-3.2)

- [ ] 1.1 Ventana de calibración de 2-4 semanas sobre `ci.yml` real. En CADA corrida, triar el fallo explícitamente
      según design.md D3: test rojo → corregir el test; `timeout-minutes` insuficiente → ajustar con la duración medida;
      infraestructura → corregir la infra. Prohibido subir retries para silenciar (D3): los retries de `retry: 2` y
      `retries: 2` existen para exponer flakiness en el reporte, no para ocultarla.
- [ ] 1.2 Registrar la duración por job en la tabla de 1.3 (workspace, job, duración, nº de corridas, desviación
      típica). Es la evidencia que ajusta los `timeout-minutes` (D5).
- [ ] 1.3 Tabla de evidencia (rellenar durante la ventana):

  | Workspace | Job                | Duraciones observadas | `timeout-minutes` actual | ¿Ajustar? |
  | --------- | ------------------ | --------------------- | ------------------------ | --------- |
  | server    | `test-unit-server` | _(por completar)_     | 15                       |           |
  | server    | `test-integration` | _(por completar)_     | _(por completar)_        |           |
  | server    | `test-smoke`       | _(por completar)_     | _(por completar)_        |           |
  | client    | `test-unit-client` | _(por completar)_     | 15                       |           |
  | client    | `client-coverage`  | _(por completar)_     | 5                        |           |
  | server    | `server-coverage`  | _(por completar)_     | 5                        |           |

  Baseline local de referencia (2026-10-03, no sustituye la medición en runners): server full 5-6s / 218 tests;
  client full 14s / 26 ficheros.

- [ ] 1.V Verificación: la tabla de 1.3 tiene al menos 3 corridas por workspace y cada fallo observado de la
      ventana está triado según D3 con su resolución.

## 2. Guard de cero tests en el gate local (migrada de 8.8)

- [ ] 2.1 Cerrar el hueco que dejó el guard D7 de CI: `.husky/pre-push` ejecuta `npm run test:changed` y Vitest
      imprime `No test files found` saliendo con **código 0**, así que un diff sin tests relacionados da un falso verde
      local. El impacto está acotado (CI lo vuelve a comprobar y cae a suite completa) pero erosiona la confianza en la
      capa shifting-left. Decisión de diseño pendiente (design.md D4): cómo emiten los scripts la señal de "ejecuté al
      menos un test" — reporter JSON, o un flag explícito.
- [ ] 2.V Verificación: un diff que solo toca un archivo sin test relacionado → el hook NO da verde vacío (falla con
      mensaje accionable o cae a suite completa); un diff con tests relacionados → el hook pasa.

## 3. Promoción a FASE 2 (migrada de 3.3)

- [ ] 3.1 Quitar `continue-on-error: true` de los **6** jobs en un único PR (design.md D2: nunca a medias, porque
      el `needs` del agregador es transitivo). Jobs: `test-unit-client`, `test-unit-server`, `test-integration`,
      `test-smoke`, `client-coverage`, `server-coverage`. **Prerrequisito: grupo 0 cerrado** — antes de esto,
      `test-unit-server` fallaba en rojo por contaminación de mocks, no por defectos del código, y promover un gate
      cuyo rojo no significa nada bloquearía todos los PRs del equipo.
- [ ] 3.2 Lockstep documental en el MISMO PR (requirement del delta `ci-test-jobs-activation`): §2 y §4.2 de
      `docs/learning/quality-gates.md` pasan advisory → blocking, sin filas `if: false` obsoletas; `docs/CONTEXT-CICD.md`
      §3.3 (tabla de jobs habilitados) y §10.6 (nota del hueco 8.8, ya cerrado por el grupo 2).
- [ ] 3.3 Confirmar que `prebuild-unit-tests-complete.needs` sigue con exactamente los 6 ids y que **ningún check
      renombrado** (restricción dura del ruleset 21227644).
- [ ] 3.V Verificación: un PR con un test rojo deliberado → `test-unit-*` FAILURE → `prebuild-unit-tests-complete`
      FAILURE → `ci-complete` FAILURE y **merge bloqueado**; un PR en verde → ambos SUCCESS. Registrar el enlace al PR de
      prueba en este `tasks.md`.

## 4. Verificaciones de corridas reales (migradas de 4.V y 5.V)

- [ ] 4.1 **4.V de `ci-testing-pipeline-reactivation`**: PR que cambia un solo módulo client → el job corre solo los
      tests afectados (verificado en local: 26 → 1 fichero); PR que solo toca `package-lock.json` → suite completa en
      ambos jobs; un PR diff-scoped NO evalúa thresholds con cobertura parcial (guard diferido, D18); la corrida nocturna
      aparece en la pestaña Actions con su resultado.
- [ ] 4.2 **5.V de `ci-testing-pipeline-reactivation`**: la métrica semanal corre sobre datos reales (candidatos con
      % y conteos, "insufficient data", share de quarantine con alerta al ≥1%); una entrada temporal en
      `.github/flaky-quarantine.yml` → el run bloqueante la excluye y lo dice en el reporte, **el nocturno la ejecuta**
      (no pasa por `quarantine-exclude`); quitarla → vuelve a bloquear.
- [ ] 4.3 Verificar el guard D7 de cero tests en CI con un PR real que toque un archivo sin test relacionado: el job
      cae a suite completa y emite `::warning::` (no verde vacío).
- [ ] 4.V Verificación: las tres anteriores con evidencia enlazada (URL de los runs) en este `tasks.md`.

## 5. Cierre del change

- [ ] 5.1 `openspec validate ci-testing-gate-promotion --strict` y `openspec validate --specs --strict` exit 0.
- [ ] 5.2 `actionlint` exit 0 en `ci.yml` y `nightly-full-suite.yml`; `npm run docs:lint` exit 0.
- [ ] 5.V Verificación: spec `ci-test-jobs-activation` en `openspec/specs/` con el requirement de FASE 2 ya
      sincronizado y los docs de lockstep reflejando blocking.
