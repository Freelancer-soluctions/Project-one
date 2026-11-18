# Proposal

## Why

`ci-testing-pipeline-reactivation` dejó los jobs de testing de STAGE 2 corriendo en **FASE 1 advisory**: ejecutan de
verdad, publican artefactos y anotan el PR, y **5** de ellos **llevaban** `continue-on-error: true` —
`test-unit-client` (`ci.yml:471`), `test-unit-server` (`:767`), `client-coverage` (`:1056`), `server-coverage`
(`:1149`) y `property-tests` (`:1220`) —, así que su fallo se absorbía a nivel de job; `test-integration` (`:2100`)
y `test-smoke` (`:2207`) no lo llevan y **ya bloquean** sus agregadores. El COE de los 5 fue retirado el 2026-10-29
(task 3.1), así que un rojo de esos jobs ya propaga a `prebuild-tests-complete`. Aun así, ningún contexto de tests es
required en el ruleset 21227644 (API 2026-10-28), así que un test rojo **no bloquea el merge** por ningún camino.

Eso fue deliberado y correcto: reactivar gates sin haber visto fallos reales convierte el primer flake de
infraestructura en un bloqueo que empuja al developer a `--no-verify`. Pero un gate que avisa y no bloquea tiene un
coste propio: cada PR depende de que alguien lea los logs a mano para saber si estaba rojo. Eso no es gobernanza,
es cortesía.

Este change recoge lo que quedó fuera del anterior **a propósito**: la ventana de calibración y la promoción a
FASE 2. Se separó porque no es "implementación pendiente" — es esperar a que la realidad ocurra, con su propio riesgo
y su propia evidencia.

**Ampliación 2026-10-28 — medición de baseline y tres pre-requisitos técnicos.** Una medición completa de ambas
suites el 2026-10-28 encontró los tests en verde pero el gate de cobertura estricto del client en rojo, y dos
defectos de configuración de umbrales (un enforcer per-file duplicado que se contradice, y dos globs de umbral que
nada verifica). Promover los 5 jobs que aún llevaban `continue-on-error` a blocking en ese estado dejaría el agregador `prebuild-tests-complete` en rojo por cobertura rota, no por tests
rojos — un rojo que no significa lo que dice significar, que es el mismo fallo que el grupo 0 ya corrigió para los
mocks.

Baseline medido el 2026-10-28 (evidencia que justifica la calibración y la ampliación):

| Workspace | Suite | Ficheros | Tests   | Flaky/retry | Duración | Cobertura (S/B/F/L)     | Gate estricto                               |
| --------- | ----- | -------- | ------- | ----------- | -------- | ----------------------- | ------------------------------------------- |
| server    | unit  | 24       | 209/209 | 0 / 0       | 11.21s   | 63.95/65.66/68.23/64.72 | ✅ EXIT=0                                   |
| client    | unit  | 114      | 198/198 | 0           | 85.17s   | 66.69/45.36/56.76/67.18 | ❌ FALLA (27 breaches per-file, ver paso 1) |
| client    | PBT   | 1        | 2       | —           | —        | —                       | ✅ EXIT=0                                   |
| server    | PBT   | 3        | 7       | —           | —        | —                       | ✅ EXIT=0                                   |

Los conteos de PBT refutan la hipótesis de verde vacío: ambos workspaces corren tests de verdad. El ruleset
21227644 (API 2026-10-28) no tiene ningún required context de tests, así que hoy nada bloquea por tests — el riesgo
de la promoción es real y completo. **Decisión del usuario registrada:** la promoción produce **rojo visible** (el
job en FAILURE y el agregador de su cadena en rojo) y el binding de un contexto de tests al ruleset 21227644 queda
como **change futuro de gobernanza** (`tasks.md` 3.4; precedente body-lint FASE 3, `docs/CONTEXT-CICD.md`
§3.2/§5.1).

Fuente normativa de gates y orden de adopción:
`PRDS/Unit-tests-en-CI-CD-estrategias-prácticas-y-gates-enterprise.md` — el orden de adopción ("tests en verde y
tests que corrieron, luego ... umbrales por módulo crítico", línea 96) y el anti-patrón "Bajar el umbral para que
pase. Si el umbral se mueve, queda registrado en el PR que lo mueve, con justificación" (línea 190) enmarcan los
pasos 1-3.

## What Changes

- **Ventana de calibración** sobre corridas reales de `ci.yml` en GitHub: cada fallo se tria explícitamente (test
  rojo → corregir el test; timeout → ajustar con la duración medida; infraestructura → corregir la infra, nunca
  reintentar en silencio). Se registra la duración por job. **Prerrequisito real, no solo verificación:** el verde
  de `test-integration`/`test-smoke` en CI (tarea 0bis.6).
- **Promoción a FASE 2**: quitar `continue-on-error: true` de los **5 jobs que aún lo llevaban** — `test-unit-client`,
  `test-unit-server`, `client-coverage`, `server-coverage` y `property-tests` (los 5 `needs` de
  `prebuild-tests-complete`, `ci.yml:2552-2562`) — en un único PR; `test-integration` y `test-smoke` ya bloquean y
  no se tocan. Efecto: FAILURE en el job promovido y rojo en el agregador de su cadena
  (`prebuild-tests-complete` → `ci-complete`), **sin prometer merge-blocked** (ruleset sin contextos de tests, API
  2026-10-28; binding futuro en `tasks.md` 3.4). El cambio de estado se documenta en lockstep en
  `docs/learning/quality-gates.md` §2 y §4.2.
- **Guard de "cero tests" en el gate local** (tarea 8.8 de `ci-testing-pipeline-reactivation`): resuelto localmente
  con `scripts/ci/pre-push-tests.mjs`, que lee el reporter JSON de Vitest y cae a suite unitaria completa si la
  selección cambió cero tests o el reporte falta/no se puede parsear; el cambio no oculta un fallo scoped.
- **Cierre de `4.V` y `5.V`** del change anterior, que solo se pueden observar con corridas reales.
- **Paso 1 — Reparación per-file del client, completada localmente**: se eligió **A**, añadir tests sin bajar
  umbrales. Las pruebas unitarias de siete hooks/providers llevaron `src/hooks/**` a 95/88.63/96.55/95.59
  (S/B/F/L); los 10 ficheros pasan los mínimos actuales y el guard strict fresco sale EXIT=0. Se corrigió también
  el bug en `useFetch` que ejecutaba `setLoading(false)` inmediatamente.
- **Paso 2 — Enforcer per-file único, completado**: Vitest 4.1.11 descarta `perFile` dentro de globs;
  `check-coverage.mjs` queda como enforcer per-file único. Se corrigieron sus comentarios y configs para describir
  esa semántica; tests del guard cubren el caso de globs sin archivos.
- **Paso 3 — Globs muertos del server, completado**: retirados los umbrales `src/utils/multer/**` y
  `src/modules/security/**`, que no tienen archivos instrumentados en la suite unitaria. Suite fresh server
  209/209 y gate strict EXIT=0 sin warning `no files matched`.
- **Estado y secuencia**: reparación de enforcers, guard local y coverage strict están implementados y verificados
  en local; el prerrequisito 0bis.6 se confirmó en GitHub (runs 40263036010 y 40263939374, 2026-10-26) y los 5
  `continue-on-error` fueron retirados el 2026-10-29 (task 3.1). El único pendiente del change es la ventana de
  calibración (grupo 1) y las verificaciones 3.V/4.V/5.V.

## Non-Goals

- **Sharding**: cerrado como `N/A` con evidencia en `ci-testing-pipeline-reactivation` (tarea 6.0). Las suites
  miden 5-6s (server) y 14s (client) frente a un umbral de activación de 5-8 min. No se reabre sin evidencia nueva.
- **E2E**: el job `e2e` sigue `if: false`; su activación es otro change (`ci-e2e` contract ya está especificado).
- **TIA evidence coordination**: este change recoge la evidencia TIA (shadow metric, coverage.changed, inyección de
  fallidos) que alimenta el grupo de promoción `ci-testing-gate-promotion`. Ambos cambios editan
  `docs/learning/quality-gates.md` (ventana de calibración lockstep) y `.github/workflows/ci.yml` (steps advisory de
  este change vs. quitar `continue-on-error` del otro), así que hay que secuenciar los PRs o resolver el merge — ver
  documentación §7.1.
- **Coordinación `coverage-tripwire-ratchet`**: se corrigió su proposal/design junto con el presente change; ambos
  documents ahora distinguen `perFile` top-level (Vitest) del `perFile` anidado en globs (enforced solo por
  `check-coverage.mjs`). Si los PRs se separan, integrar esa corrección documental en lockstep para evitar reintroducir
  la afirmación ya refutada.
- **Diff coverage / cobertura de solo el código nuevo**: el gate de este change es global. El guard diferido D18 ya
  protege los runs diff-scoped (umbral no evaluado contra totales parciales); añadir diff coverage es otro change.
- **Mutation testing (Stryker)**: es el último escalón del orden de adopción del PRD (línea 96), después de
  estabilizar los umbrales por módulo crítico — que es exactamente lo que los pasos 1-3 ponen en orden. No se abre
  aquí.
- **`merge_group`**: sin merge queue activa, el trigger es dead code (ya recortado en la spec de
  `ci-test-jobs-activation`, decisión D17). No se reabre aquí.
- **Token de Sonar y cambios en el ruleset 21227644**: añadir required contexts de tests al ruleset es una decisión
  de gobernanza separada — hoy el ruleset exige 2 contextos, ninguno de tests (API 2026-10-28). Queda **registrado
  como change futuro de gobernanza en `tasks.md` 3.4** (precedente body-lint FASE 3; Regla 8 de
  `docs/CONTEXT-CICD.md` §3.2: renombrar rompe el binding), sin abrir ese frente aquí.
- **`coverage.include` como cierre del denominador (deuda registrada, cross-ref)**: el requirement "cada glob
  matchea ≥1 fichero instrumentado" está acotado al universo full-suite actual; sin `coverage.include` el
  denominador varía según qué suite importe qué ficheros — exactamente lo que pasó con `src/utils/multer/**` y
  `src/modules/security/**`. `coverage.include` es el cierre definitivo; su follow-up está anotado en
  `apps/client/vitest.config.js:49`.
- Cambios de comportamiento en TIA, quarantine o métrica semanal: ya están implementados y verificados.
- **Hallazgos medidos 2026-10-28, registrados pero fuera de alcance**: el seed de Postgres falla en `globalSetup`
  con warning sin abortar (`apps/server/tests/setupGlobal.ts:48-65`) — ruido para las suites unit, que no necesitan
  DB; y la property-based testing corre doble (en el job unit Y en `property-tests`, en ambos workspaces). Ninguno
  toca el gate de promoción.

## Impact

- `openspec/specs/ci-test-jobs-activation` — el delta especifica la promoción FASE 2 y el requisito de integridad
  del enforcer antes de promover; la spec canónica se sincroniza al cierre, no antes.
- `openspec/specs/ci-prebuild-substage-structure` — delta MODIFIED de `prebuild-tests-complete`: el requirement
  afirmaba que los 5 miembros llevan `continue-on-error` y que el escalón tier-1 era vacuo; ahora describe el estado
  blocking.
- `openspec/specs/ci-test-jobs-activation` (MODIFIED) — el requirement "FASE 1 advisory activation" pasa a
  histórica; sin ese bloque la spec quedaría afirmando a la vez que los jobs llevan y no llevan COE.
- `.github/workflows/ci.yml` — **hecho 2026-10-29**: `continue-on-error: true` retirado de los 5 jobs
  (`test-unit-client`, `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests`) junto con el
  comentario del agregador y las notas de cada job; `test-integration`/`test-smoke` no se tocan.
- `.husky/pre-push` — guard de cero tests.
- `apps/client/vitest.config.js` — reparación de los umbrales `src/hooks/**` (paso 1) y corrección del comentario
  de per-file (paso 2).
- `scripts/ci/check-coverage.mjs` — corrección del docstring de simetría con Vitest, si la decisión D8 deja al
  script como único enforcer per-file (paso 2).
- `apps/server/vitest.config.ts` — retiro de los 2 globs muertos, o tests que los instrumenten (paso 3).
- `docs/learning/quality-gates.md` — documenta los 5 jobs (incluido coverage) como `blocking (fase 2)` activos.
- `docs/CONTEXT-CICD.md` §3.3 / §10.6 — tabla de jobs y hueco del hook.
- Ruleset 21227644 — **sin cambios en este change**; el binding de un contexto de tests queda registrado como
  change futuro de gobernanza (`tasks.md` 3.4).

## Capabilities

### New Capabilities

- Ninguna: este change **completa** `ci-test-jobs-activation` con su segunda fase.

### Modified Capabilities

- `ci-test-jobs-activation`: añade el requirement de promoción a FASE 2 blocking (ya descrito arriba), el
  requirement de integridad del enforcer de cobertura previo a la promoción (pasos 1-3) y convierte "FASE 1 advisory
  activation" en postura histórica.
- `ci-prebuild-substage-structure`: MODIFIED de `prebuild-tests-complete` (los 5 miembros son blocking; el escalón
  tier-1 deja de ser vacuo).

### Removed Capabilities

- Ninguna.
