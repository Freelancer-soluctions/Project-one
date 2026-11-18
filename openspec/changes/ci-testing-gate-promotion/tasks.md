# Tasks — Calibración y promoción de los gates de testing a FASE 2

Continuación de `ci-testing-pipeline-reactivation` (archivado 2026-10-03), que dejó los jobs de testing en FASE 1
advisory — 5 de ellos llevaban `continue-on-error: true` (`test-unit-client`, `test-unit-server`,
`client-coverage`, `server-coverage`, `property-tests`) y `test-integration`/`test-smoke` no lo llevan.
Todo lo que aquí aparece ya existía como tarea abierta en aquel change y se traslada con su estado real; el número de
tarea original va en la nota para poder rastrearlo. Ver `design.md` D1-D9.

Convención: cada grupo cierra con una verificación (`x.V`). Orden tras la ampliación 2026-10-28 (design.md D9): 0ter
(reparación de enforcers de cobertura, pasos 1-3) → 3 (promoción: quitar COE + agregador) → 1 (ventana de
calibración, sobre los jobs ya blocking) → 2 (guard local, independiente, puede ir en paralelo) → 4-5 (verificaciones
y cierre). La numeración de los grupos preexistentes se conserva para no romper los cross-refs de `design.md` ni los
de otros changes que citan estas tareas; el orden de ejecución es el de esta frase.

| Grupo | Rol nuevo tras la ampliación 2026-10-28                             |
| ----- | ------------------------------------------------------------------- |
| 0ter  | Reparación de los enforcers de cobertura (pasos 1-3)                |
| 3     | Promoción (quitar COE de los 5 jobs + topología real del agregador) |
| 1     | Ventana de calibración (sobre los jobs ya en rojo visible)          |
| 2     | Guard local de cero tests (independiente, puede ir en paralelo)     |
| 4-5   | Verificación con corridas reales y cierre                           |

Los grupos 0 y 0bis son los prerrequisitos preexistentes (0bis.6 era prerrequisito de la ventana; cerrado 2026-10-26).

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

## 0bis. Segundo bloqueante, mismo día — `test-smoke` nunca había podido pasar

Descubierto mientras verificaba el grupo 0. **Es una causa raíz distinta**, aunque el síntoma inicial (exit 1 sin detalle) era el mismo.

- [x] 0bis.1 Diagnosticar `Tests: Smoke - Server` y `Tests: Integration - Server`. Los dos fallaban en los 4 runs
      previos, incluido `1bc7d3d4` (anterior a toda mi intervención). No era el `isolate: false` del grupo 0.
- [x] 0bis.2 Hallazgo: `createRequest()` (`tests/smoke/helpers/request.js`) decide entre app in-process y remoto
      con `if (process.env.BASE_URL)`. Pero **Vite inyecta `process.env.BASE_URL` con el valor de su opción `base`**,
      cuyo default es `"/"` (`const BASE_URL = resolvedBase` en `vite/dist/node/chunks/config.js`). El guard es
      por tanto **siempre verdadero**, y `request("/")` es una URL relativa que superagent no resuelve →
      `ECONNREFUSED` en 14 de 17 smoke tests. Verificado con un probe que imprimía el valor.
- [x] 0bis.3 Fix: el guard valida que `BASE_URL` sea una URL `http(s)` **absoluta**, no solo truthy. Así `"/"`, `""` y
      cualquier valor no absoluto caen a la rama in-process, que es la que funciona. Smoke: **4/4 (16 passed, 1
      skipped)**.
- [x] 0bis.4 Integration: el mismo `exit 1` local era `Authentication failed` por credenciales de mi Postgres local
      (`projectOne:123456@...projectoneDB_test`, no `test:test@...project_one_test`). Con las credenciales correctas:
      **4/4**. En CI el service container crea `test:test`, así que el job de integration debería quedar verde con el
      fix del reporter — a confirmar en el siguiente run.
- [x] 0bis.5 Visibilidad: los steps usaban solo `--reporter=junit`, que **silencia la salida de fallos** y deja un
      `exit code 1` sin diagnóstico. Añadido `--reporter=default` a `test-integration` y `test-smoke`. Costó 4 runs
      de lectura de logs deducir la causa.
- [x] 0bis.V Requirement "Remote smoke target requires an absolute http(s) BASE_URL" en `openspec/specs/
smoke-testing/`, con los 3 scenarios (Vite default, target remoto real, y diagnosabilidad desde el log).
- [x] 0bis.6 **Confirmado en GitHub CI — prerrequisito de la ventana satisfecho.** Los dos jobs pasaron en dos
      corridas PR contra `main@0a94d77` (2026-10-26): [PR #159, run 40263036010](https://github.com/Freelancer-soluctions/Project-one/actions/runs/40263036010)
      — `test-integration` SUCCESS (2m26s), `test-smoke` SUCCESS (2m06s); [PR #160, run 40263939374](https://github.com/Freelancer-soluctions/Project-one/actions/runs/40263939374)
      — `test-integration` SUCCESS (2m10s), `test-smoke` SUCCESS (2m20s). Los workflows completos tuvieron otros
      jobs fallidos (incluidos typecheck/docs y, en PR #159, dependency review); esos fallos no corresponden a estos
      dos jobs. Nota de alcance: `ci-prebuild-improvement-v5` no tiene ref publicada ni corrida propia en Actions,
      así que esta evidencia confirma el comportamiento en la base `main`, no un run del HEAD local.

## 0ter. Tres pre-requisitos técnicos de los enforcers de cobertura (añadidos 2026-10-28)

**Estado actualizado 2026-10-29:** cobertura guard strict verificada localmente en ambos workspaces; cobertura
client 71.32/50.12/60.89/71.76 y server unit-only 63.95/65.66/68.23/64.72 (S/B/F/L). El gate local
`coverage:check` está alineado ahora con los comandos que alimentan los artefactos de CI. Una property-based test
client hallada por el rerun completo tenía `fc.date()` capaz de generar `Invalid Date`; el generador ahora excluye
esa fecha inválida (`noInvalidDate: true`).

**Prerrequisito del grupo 3, como el 0.** Baseline medido el 2026-10-28: server unit 24 ficheros, **209/209 tests**,
0 flaky, 0 retry, 11.21s, cobertura 63.95/65.66/68.23/64.72, gate estricto **EXIT=0**; client unit 114 ficheros,
**198/198 tests**, 0 flaky, 85.17s, cobertura 66.69/45.36/56.76/67.18, pero gate estricto **FALLA** (paso 1). PBT:
client 1 fichero/2 tests, server 3 ficheros/7 tests, ambos EXIT=0 — refuta la hipótesis de verde vacío. El ruleset
21227644 (API 2026-10-28) no exige ningún contexto de tests. Fuente normativa del orden de adopción:
`PRDS/Unit-tests-en-CI-CD-estrategias-prácticas-y-gates-enterprise.md`.

### Paso 1 — Reparar el per-file del client (bloqueante previo a quitar COE)

- [x] 0ter.1 Reproducir la evidencia: en la corrida baseline 2026-10-28, `node scripts/ci/check-coverage.mjs
apps/client` dio **EXIT=1** con 27 breaches per-file en `src/hooks/**`. La cobertura nueva del 2026-10-29
      tras los tests de hooks queda 95/88.63/96.55/95.59 para el glob y todos sus 10 ficheros cumplen los mínimos.
- [x] 0ter.2 Decisión D7: camino **A**, añadir tests hasta que cada fichero cumpla los umbrales existentes; no bajar
      ningún umbral. El PR incluye las pruebas nuevas.
- [x] 0ter.3 Añadidos tests unitarios para `useFetch`, `useLoadingState`, `useQueryData`, `useUserSettings`,
      `useInitializeI18n`, `MentionCountProvider` y `useSocket`; `useFetch` tenía además un bug real (`.finally`
      invocaba `setLoading(false)` inmediatamente en vez de pasar un callback), corregido junto con su prueba.
- [x] 0ter.4 El agregado de `src/hooks/**` subió de ~39.1/44.31/40.35/36.07 al baseline a 95/88.63/96.55/95.59
      (S/B/F/L); margen no depende ya de centésimas.
- [x] 0ter.5 Verificación strict fresca 2026-10-29: `node scripts/ci/check-coverage.mjs apps/client` → **EXIT=0**;
      los 10 ficheros del glob pasan todos sus mínimos.

### Paso 2 — Unificar el enforcer per-file (decisión de diseño)

- [x] 0ter.6 Confirmado en Vitest 4.1.11: `perFile` se lee top-level; `resolveGlobThresholds` descarta el
      `perFile` anidado en globs. La cobertura fresca demuestra el caso: Vitest evalúa el agregado del glob, mientras
      el script enforcer comprueba cada fichero.
- [x] 0ter.7 Decisión D8: **(b)** `check-coverage.mjs` es el enforcer per-file único; se conserva `perFile: true`
      dentro de los globs como declaración para el guard, sabiendo que Vitest 4.1.11 lo ignora en esa ubicación.

- [x] 0ter.8 Corregida en lockstep la documentación del config y del guard, y el claim erróneo de
      `coverage-tripwire-ratchet` (`proposal.md`, `design.md`). Los umbrales `perFile` dentro de los globs se
      describen como enforced por el guard, no por Vitest.
- [x] 0ter.9 Cobertura fresca 2026-10-29: un único veredicto per-file externo; ambos workspaces strict pasan y sus
      reportes no presentan discrepancia de mínimos. `npm run coverage:check` regenera ambos reportes usando la
      suite que emplea CI en cada workspace (client `test:coverage`, server `test:coverage:unit`) y sale 0.

- [x] 0ter.10 Baseline 2026-10-28: `src/utils/multer/**` y `src/modules/security/**` no matcheaban ficheros
      instrumentados en la suite unitaria.
- [x] 0ter.11 Decisión D7: retirar los dos umbrales inobservables; no hay tests unitarios pertinentes actualmente.
- [x] 0ter.12 Verificación fresca 2026-10-29: server unit 24/24 ficheros y 209/209 tests pasa; el guard estricto
      sale **EXIT=0** y el reporte no contiene `no files matched`.

### 0ter.V Verificación del grupo

- [x] 0ter.V Client y server pasan coverage strict fresco; decisiones D7/D8/globs server registradas; docs del
      enforcer corregidos. El requisito de coverage previo a promoción queda satisfecho.

### Hallazgos medidos 2026-10-28 — registrados, fuera de alcance

- El seed de Postgres falla en `globalSetup` con warning y **no aborta** (`apps/server/tests/setupGlobal.ts:48-65`
  imprime "Seed script exited with code ..." y continúa): ruido para las suites unit, que no necesitan DB. Fuera de
  alcance de este change.
- La property-based testing corre doble: en el job unit Y en `property-tests`, en ambos workspaces (client 1
  fichero/2 tests, server 3 ficheros/7 tests, ambos EXIT=0). Hallazgo menor, fuera de alcance.

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
  | server    | `test-unit-server` | _(por completar)_     | 10                       |           |
  | server    | `test-integration` | 2m26s, 2m10s (n=2)    | 10                       | No        |
  | server    | `test-smoke`       | 2m06s, 2m20s (n=2)    | 10                       | No        |
  | client    | `test-unit-client` | _(por completar)_     | 10                       |           |
  | client    | `client-coverage`  | _(por completar)_     | 5                        |           |
  | server    | `server-coverage`  | _(por completar)_     | 5                        |           |
  | both      | `property-tests`   | _(por completar)_     | 5                        |           |

  Baseline local de referencia (2026-10-03, no sustituye la medición en runners): server full 5-6s / 218 tests;
  client full 14s / 26 ficheros. **Delta vs baseline nuevo (medido 2026-10-28):** server 209 tests / 24 ficheros y
  client 198 tests / 114 ficheros — los conteos de 2026-10-03 (218 tests, 26 ficheros) son de otro universo y no
  deben confundirse con la medición que alimenta esta tabla.

  Medición real de runners (2026-10-26, jobs verdes; duración = `completedAt - startedAt`, incluye setup de
  contenedores y checkout): `test-integration` 146s ([run 40263036010](https://github.com/Freelancer-soluctions/Project-one/actions/runs/40263036010)) y
  130s ([run 40263939374](https://github.com/Freelancer-soluctions/Project-one/actions/runs/40263939374)); `test-smoke` 126s y
  140s en los mismos runs. Dispersión de 16s y 14s (≈11% y 10%) sobre timeout de 10 min (600s): el job más lento
  usa el 24,3% del límite, holgura de 4x, así que subir `timeout-minutes` no está justificado con esta muestra.
  `n=2` por job: la fila no cierra 1.V, que exige ≥3 corridas por workspace.

- [ ] 1.V Verificación: la tabla de 1.3 tiene al menos 3 corridas por workspace y cada fallo observado de la
      ventana está triado según D3 con su resolución.

## 2. Guard de cero tests en el gate local (migrada de 8.8)

**Estado 2026-10-29: guard implementado y cubierto con pruebas locales.** La corrida real del hook queda
pendiente de ejercitarse en un push con cambio sin tests relacionados.

- [x] 2.1 Decisión: reporter JSON, según elección del usuario. `.husky/pre-push` delega a
      `scripts/ci/pre-push-tests.mjs`, que limpia el reporte previo, corre `test:changed` con JSON y comprueba
      `numTotalTests`; cero tests o reporte ausente/inválido activa el fallback a `test:unit` completo. Un fallo del
      run scoped se propaga sin fallback, y también se propaga el fallo del full suite.
- [x] 2.V Tests del runner cubren cero tests, reporte ausente/inválido, scoped con tests, fallo scoped, fallo de full
      suite y workspace desconocido. `npx vitest run --config vitest.scripts.config.js scripts/ci/pre-push-tests.test.mjs`
      pasa.

## 3. Promoción a FASE 2 (migrada de 3.3)

- [x] 3.1 Quitar `continue-on-error: true` de los **5 jobs que aún lo llevan** en un único PR (design.md D2: nunca
      a medias, porque el `needs` del agregador es transitivo): `test-unit-client` (`ci.yml:471`),
      `test-unit-server` (`:767`), `client-coverage` (`:1056`), `server-coverage` (`:1149`) y `property-tests`
      (`:1220`) — los 5 `needs` de `prebuild-tests-complete` (`ci.yml:2552-2562`). `test-integration` (`:2100`) y
      `test-smoke` (`:2207`) **no se tocan**: no llevan COE y ya bloquean sus agregadores. El comentario
      `ci.yml:2557-2561` ("ALL 5 tier-1 members carry COE … promotion belongs to this change") queda coherente con
      este alcance y **debe actualizarse en el PR de promoción** (tras quitar los COE describe un estado falso). PBT
      medido en verde 2026-10-28 (client 2 tests, server 7). **Prerrequisitos:** grupos 0 y 0ter ya cerrados; **0bis.6 está pendiente en CI** y es prerrequisito de esta task: hasta confirmar los jobs de integration/smoke
      verdes en GitHub, no retirar los COE ni activar la promoción. El grupo 0 evita rojos por contaminación de mocks;
      el grupo 0ter asegura que la cobertura strict fresca pasa sin deuda pre-existente.
      **Implementado 2026-10-29:** 0bis.6 cerrado con evidencia de CI (runs 40263036010 y 40263939374); los 5 flags
      retirados en el mismo cambio de `ci.yml` (más el comentario del header del substage 2D, las notas de cada job y
      el bloque `prebuild-tests-complete.needs`); `test-integration`/`test-smoke` intactos.

- [x] 3.2 Lockstep documental en el MISMO PR (requirement del delta `ci-test-jobs-activation`): §2 y §4.2 de
      `docs/learning/quality-gates.md` reflejan el estado blocking real una vez quitado COE; `docs/CONTEXT-CICD.md`
      §3.3/§10.6 reflejan la promoción y el guard local.
      **Hecho 2026-10-29:** `quality-gates.md` — fila `coverage` reclasificada a blocking/FASE 2 activa y bullets de
      `test-unit-*`, `client/server-coverage` y `property-tests` reescritos; `CONTEXT-CICD.md` — tabla §1
      (`test-unit-*`, `coverage`, `property-tests` = FASE 2 blocking; `test-integration`/`test-smoke` = verificado en
      CI), bullet de §3.1 y fila nueva en la tabla de §3.3 (esa tabla no enumeraba los jobs tier-1); §10.6 ya
      documentaba el guard local desde la task 2. Además, para no dejar afirmaciones falsas fuera de esos dos ficheros:
      `docs/learning/unit-tests-enterprise.md` §5.1 (decía "promoción pendiente"; también era la línea que rompía
      `docs:lint`), la fila `e` y el plan de `docs/learning/coverage-merge-gate.md`, y notas fechadas en
      `docs/learning/panorama-resumen.md` y `docs/learning/ci-cd/24-dag-infraestructura.md`, cuyas tablas son fotos de
      2026-10-01 y se conservan como histórico.
- [x] 3.3 Confirmar la topología real del agregador: `prebuild-tests-complete.needs` sigue con exactamente los
      **5** ids (`test-unit-client`, `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests`,
      `ci.yml:2552-2562`) y **ningún check renombrado** (Regla 8: `docs/CONTEXT-CICD.md` §3.2 — renombrar rompe el
      binding del ruleset 21227644). Cadenas a verificar: tier-1 (los 5 promovidos) → `prebuild-tests-complete` →
      `ci-complete`; `test-integration`/`test-smoke` → `postbuild-tests-complete` (`ci.yml:2609-2613`) →
      `ci-complete`.
      **Verificado 2026-10-29 (tras la edición):** `prebuild-tests-complete.needs` = `test-unit-client`,
      `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests` (exactamente 5, sin renombrados);
      `postbuild-tests-complete.needs` = `build-complete`, `test-integration`, `test-smoke`, `e2e`; `ci-complete.needs`
      = los 9 de siempre (4 subagregadores + 3 de stage + `zombie-workflow-guard` + `repo-discovery`). Los `name:` de
      los 5 jobs conservan el texto que ya consumían los runs (`Tests: Unit - Client/Server`, `Quality: Client/Server
Coverage`, `Tests: Property Tests`), así que ningún check cambia de identidad (Regla 8).
- [x] 3.4 Registrar el binding futuro de gobernanza (decisión del usuario — **fuera del alcance de este change**):
      añadir un contexto de tests (`CI Complete` o los agregados de testing) al ruleset 21227644 es un **change
      futuro de gobernanza**. Queda constancia aquí: precedente = body-lint FASE 3, vía GET → modificar → PUT,
      nunca PATCH (`docs/CONTEXT-CICD.md` §5.1/§9.3.4); **Regla 8**: el `name:` exacto es el contrato
      (`docs/CONTEXT-CICD.md` §3.2) y renombrar rompe el binding. Mientras ese binding no exista, la promoción
      produce solo **rojo visible**, no merge bloqueado (ruleset con 2 contextos, ninguno de tests — API 2026-10-28).
- [x] 3.5 Registrar el plan de rollback de la promoción (decisión del usuario): si la tasa de flakes de la ventana
      (grupo 1) lo exige, reponer `continue-on-error: true` **por job** en un PR con causa registrada — análogo al
      rollback documentado del FASE 2 de SAST (`ci.yml:415-416`). Se anota en la evidencia de 1.3 con su motivo;
      no es un fallback silencioso (design.md D9).
- [ ] 3.V Verificación: un PR con un test rojo deliberado → `test-unit-*` FAILURE → `prebuild-tests-complete`
      FAILURE → `ci-complete` FAILURE — **rojo visible en el PR** (la cadena de integration/smoke se verifica
      igual: `test-integration`/`test-smoke` FAILURE → `postbuild-tests-complete` FAILURE); un PR en verde → ambos
      SUCCESS. **No** se verifica "merge bloqueado": hasta el binding futuro (3.4) GitHub no impide el merge.
      Registrar el enlace al PR de prueba en este `tasks.md`.

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

- [x] 5.1 `openspec validate ci-testing-gate-promotion --strict` y `openspec validate --specs --strict` exit 0.
      **Verificado 2026-10-29:** `Change 'ci-testing-gate-promotion' is valid` (exit 0) y `145 passed, 0 failed`.
      El delta creció a tres bloques: ADDED `FASE 2 blocking promotion`, ADDED `Coverage enforcer integrity` y
      MODIFIED `FASE 1 advisory activation` (`ci-test-jobs-activation`), más un delta nuevo
      `specs/ci-prebuild-substage-structure/spec.md` con MODIFIED `prebuild-tests-complete`. Sin los MODIFIED, al
      archivar habría quedado una spec afirmando a la vez que los jobs llevan y no llevan `continue-on-error`
      (dos requirements en conflicto en `ci-test-jobs-activation`, y el escalón tier-1 "vacuo" en
      `ci-prebuild-substage-structure`). El validador exige copiar los scenarios existentes en un MODIFIED: el
      título `property-tests is recorded but not made blocking` se conserva y su cuerpo describe el contrato
      contrario, con la razón anotada en el propio requirement.
- [x] 5.2 `actionlint` exit 0 en `ci.yml` y `nightly-full-suite.yml`; `npm run docs:lint` exit 0.
      **Verificado 2026-10-29:** `actionlint` exit 0 en ambos workflows; `npm run docs:lint` exit 0. El único hallazgo
      previo era un MD013 preexistente en `docs/learning/unit-tests-enterprise.md:368` (163 > 120), en una línea del
      commit `0a94d774` de `main` que además describía la promoción como pendiente: reescrita en este lockstep.
- [ ] 5.V Verificación: spec `ci-test-jobs-activation` en `openspec/specs/` con el requirement de FASE 2 ya
      sincronizado y los docs de lockstep reflejando blocking.
