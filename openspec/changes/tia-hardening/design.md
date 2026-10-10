# Design — tia-hardening

## Context

Ver `proposal.md` para el _why_. El estado actual que condiciona el diseño:

- `ci.yml` ya resuelve el scope en los jobs `test-unit-client` / `test-unit-server`
  (`Resolve TIA scope` → `scope=changed|full`), aplica cuarentena
  (`scripts/ci/quarantine-exclude.mjs`), ejecuta D7 (0 tests → full ruidoso) y publica
  `reports/tia-scope.txt` que D18 (`client-coverage` / `server-coverage`) lee para evaluar
  thresholds **solo** en `scope=full`.
- `.husky/pre-push` ejecuta `npm run test:changed --workspace=apps/{server,client}` con el mismo
  contrato de selección que CI; su spec `pre-push-scoped-testing` dice literalmente "solo tests
  afectados", unit-only, sin DB ni e2e.
- Los jobs `test-unit-*` están en FASE 1 (`continue-on-error: true`); el change en vuelo
  `ci-testing-gate-promotion` es dueño de quitar ese flag y ya diagnóstico los bloqueantes
  (`isolate: false`, smoke `BASE_URL`).
- `setup-monorepo` cachea `node_modules/.cache` con clave sobre `package-lock.json`
  (`ci-caching`), así que el directorio de cache raíz ya está replicado local↔CI.
- Vitest 4 trae `coverage.changed` (sin usar) y `vitest list --changed --filesOnly` (sin usar);
  no existe histórico de resultados por test más allá de los artefactos JUnit/JSON de los runs.

## Goals / Non-Goals

**Goals:**

- Medir antes de confiar: métrica de selección TIA visible en cada PR, sin cambiar qué corre.
- Subir la precisión de la selección: cobertura limitada al diff, tests previamente fallidos
  inyectados, mapa de dependencias persistente entre máquinas.
- Extender el mismo contrato (`Resolve TIA scope` + D7 + D18) a más tiers y llevar el workflow
  estándar al nivel local con scripts, estado persistente y checklist.
- Dejar la evidencia lista para la promoción FASE 1 → FASE 2 sin tocar el mecanismo de esa
  promoción.

**Non-Goals:**

- Cambiar `.husky/pre-push` o sus requisitos (pertenecen a `pre-push-scoped-testing`) y quitar
  `continue-on-error` de ningún job (pertenence a `ci-testing-gate-promotion`).
- Predecir fallos con ML (predictive test selection): requiere histórico grande y es un nivel
  posterior a tener métrica.
- Reabrir sharding (`ci-testing-gate-promotion` lo cerró con evidencia) ni activar el job `e2e`
  (dueño: `ci-e2e`).
- Introducir Turborepo/Nx en este change: solo se evalúa y se actualiza el ADR con datos.

## Decisions

### D1 — Un contrato de selección, dos ejecutores (CI y local), pre-push intocado

La interfaz compartida son los scripts npm (`test:changed*`, `test:tia*`), no el hook: CI los invoca
con reporters y el hook los invoca limpios, así local y CI no pueden divergir en diff base ni en
filtro. La inyección de previamente fallidos y la auditoría se exponen como scripts **on-demand**
(`test:tia`), no dentro de `test:changed` que sí consume el pre-push.
_Alternativa descartada_: meter inyección/auditoría en el hook — contradice el requirement
"solo tests afectados" de `pre-push-scoped-testing` y añade tiempo al camino con límite SSH de 30 s.

### D2 — Shadow mode = medición advisory en step summary, no un job paralelo

Un step (`scripts/ci/tia-metric.mjs`, patrón de `flaky-metric.mjs`) calcula
`vitest list --changed --filesOnly`, el conteo de ficheros del diff y `numTotalTests` del
`vitest-results.json`, con el denominador T del último full-suite/nightly (artefacto
`tia-history`/`coverage-map`, constante cacheada de fallback), y escribe una tabla markdown en
`$GITHUB_STEP_SUMMARY`
(selección N/T = %, ficheros cambiados, `scope`, `map=hit|miss`, inyectados). Todo con
`|| true`/`if: always()`: la medición nunca voltea el resultado del job.
_Alternativa descartada_: correr el suite completo en paralelo para comparar (≈2× de costo por PR)
— se reserva como auditoría puntual si la métrica shadow levanta sospecha; dashboard/SaaS — sin
infra que mantener, el step summary + la métrica semanal de flakiness bastan.

### D3 — `--coverage.changed=origin/main` solo informa; D18 sigue mandando

El flag entra a `test:changed:ci` de ambos workspaces y produce un `coverage-summary.json`
limitado al diff. En `scope=changed` el job de cobertura invoca
`check-coverage.mjs <ws> --advisory` (flag nuevo, task 2.0: reporta los números con prefijo
`[advisory]` y termina siempre en exit 0), y en el nocturno con el equivalente `|| warning` de
hoy; los thresholds se siguen evaluando únicamente en `scope=full` (nocturno + PR `shared`).
_Alternativa descartada_: evaluar thresholds sobre la cobertura diff-limited — un diff de 3 ficheros
siempre "aprueba" o siempre "suspende" el % global; no es comparable.

**F1 — los thresholds nativos del runner también se anulan en scoped.** `vitest run --coverage`
evalúa `coverage.thresholds` del config contra el informe QUE SEA: con el informe limitado al diff,
un fichero poco cubierto en la PR hace salir 1 al propio job de tests (probado: informe limitado +
floor 99 → `ERROR: Coverage for branches (92.68%) does not meet global threshold (99%)`). El riesgo
existe hoy mismo, antes del change: un run scoped ya produce un informe parcial (probado con
`vitest run --changed origin/main --coverage`: summary con 1 fichero, no la suite completa). Por eso
los runs scoped pasan `--config vitest.scoped.config.js` (task 2.1): un fichero por workspace que
importa el config principal y **reemplaza** `test.coverage.thresholds` por los cuatro globales a 0
(sin globs ni `perFile`); el config principal queda intacto y `coverage:ratchet` sigue operando.
_Mecanismos descartados_: ternario condicional en `vitest.config.js` — rompe el ratchet (probado:
autoUpdate lanza `Unable to parse thresholds from configuration file: Casting
"ConditionalExpression" is not supported`); overrides por CLI (`--coverage.thresholds.<métrica>=0`)
— no llegan a los thresholds-_glob_ sin pasar cada clave-glob literal (`src/hooks/**`,
`src/modules/**/schemas/**`, …) con quoting que varía entre bash y cmd.exe (D11); `mergeConfig` de
overrides — deep-merge conserva los globs del base (probado: el glob sobrevive y solo se pisa el
global), así que habría que reemplazar igualmente; env var con `cross-env` — dependencia nueva
(ausente) contra D11, y el condicional en config cae en el mismo problema de magicast.

### D4 — Historial de fallidos: artefactos ya existentes, N=3, doble ubicación

Fuente de verdad: los `reports/vitest-results.json` / `junit.xml` que ya producen los runs
full-suite (nocturno y `scope=full`). Un paso de consolidación extrae `{testfile, failures,
runId}` de los últimos N=3 runs en `tia-history.json`:

- **CI**: se sube como artefacto (`tia-history`, retención 30 días, patrón de
  `flaky-evidence-*`) y se descarga en los jobs scoped resolviendo el run-id con
  `gh api .../actions/workflows/<full-suite>/runs` + `gh run download` (patrón de
  `flaky-weekly.yml`): `actions/download-artifact` solo lee el run actual sin `run-id`, y
  `restore-keys` es de `actions/cache` — no de los artefactos; ausente → no-op.
- **Local**: el mismo JSON bajo `node_modules/.cache/tia/`, escrito por `test:tia` y reutilizado
  por el audit y por el fail-first.
  La inyección es una **selección en dos fases**, nunca una concatenación de argv: en Vitest 4 los
  ficheros posicionales se intersectan con `--changed`, así que "test:changed:ci + ficheros
  inyectados" los descartaría en silencio (a menudo anulando la selección y disparando D7). Fase 1:
  `vitest list --changed --filesOnly` ∪ `tia-history.mjs <ws> --inject`; fase 2: spawn de vitest
  con la lista explícita resultante y el argv original (reporters, coverage, `--exclude` de
  cuarentena de `quarantine-exclude.mjs`), todo desde el wrapper `node scripts/ci/tia-select.mjs`
  (D11: `$(...)` no funciona en npm scripts bajo cmd.exe). Nunca ejecuta fuera del workspace ni salta
  la cuarentena, y si la unión queda vacía D7 sigue siendo el guard. _Alternativas descartadas_:
  concatenar argv a `test:changed:ci` (la intersección positional ∩ `--changed` silencia los
  inyectados), `--onlyFailures` (no existe en Vitest, es de Jest) y git-commitear el historial
  (ruido de merge y datos de máquina).

### D5 — Coverage-map: artefacto por workspace claveado por `base-sha`, con fallback estático

El mapa (grafo test→ficheros de la última corrida full-suite, con la anotación de cobertura suite
que Vitest ya emite) se serializa desde el propio run y se publica como artefacto
`coverage-map-<workspace>-<base-sha>`; el job scoped resuelve el run-id cuyo artefacto coincide
con su `origin/main` (`gh api .../actions/workflows/<full-suite>/runs` + `gh run download`, patrón
de `flaky-weekly.yml`) — `actions/download-artifact` solo lee el run actual sin `run-id` y
`restore-keys` pertenece a `actions/cache`, no a los artefactos. Consumo best-effort: `hit` → la
selección parte del mapa grabado; `miss`/corrupto → se reconstruye desde el grafo de imports del
checkout y se registra `map=miss`. Nunca bloquea, y D7 sigue detrás. El consumidor vive en un
script compartido (`scripts/ci/tia-select.mjs`, que además es el único dueño de la selección en
dos fases de D4) usado por CI y por `test:tia` local, para que mapa e inyección tengan un solo
lector.
_Por qué artefacto y no `actions/cache`_: sí se puede — `actions/cache` admite claves deterministas
(`tia-history-<ws>-<base-sha>` + `restore-keys`), la excusa anterior ("no permite clave
determinista") era falsa —, pero se descarta porque las entradas de cache son evictables (7 días
sin uso y cuota del repo) y aquí hace falta retención nombrada y versionada por `base-sha`
(artefactos con 30 días), y el repo ya tiene validado el patrón cross-run con `gh api` +
`gh run download` (`flaky-weekly.yml`).

### D6 — Orden de extensión de tiers: integration primero, e2e condicionado

El job `test-integration` ya existe con service container; se le añade el mismo
`Resolve TIA scope` + D7 (selección `vitest run ".integration.test.js" --changed origin/main`) y
el artefacto `tia-scope.txt` propio. El e2e **no** se toca hasta que `ci-e2e` levante
`if: false` — en ese momento hereda el contrato tal cual. La activación del scoping en integration
se documenta con su duración medida (métrica shadow) para poder revertir a full si no aporta.
`test-smoke` queda fuera a propósito: es el tier de critical-path (~17 tests) y se ejecuta
completo siempre — full-suite por diseño, sin scoping TIA.

### D7 — Fail-first con `BaseSequencer` sobre `tia-history.json` (design D7; no confundir con el guard D7 de 0 tests del repo)

`sequence.sequencer` apunta a un sequencer propio que ordena los ficheros seleccionados por
tasa de fallo reciente (del mismo historial de D4) y, sin historial, por ruta estable. Solo reordena:
la selección es idéntica, y el nightly corre **sin** orden impuesto — opt-out explícito
(`TIA_SEQUENCER=stable` en `nightly-full-suite.yml` o gate en la config; una config shared de
`sequence.sequencer` ordenaría también el nocturno y lo pondría en contradicción con este
diseño) — para no enmascarar order-dependence (que este repo ya sufrió con `isolate: false`,
grupo 0 de `ci-testing-gate-promotion`).

### D8 — FASE 1 → FASE 2: reparto de propiedad con `ci-testing-gate-promotion`

| Pieza                                                                           | Dueño                                  |
| ------------------------------------------------------------------------------- | -------------------------------------- |
| Quitar `continue-on-error: true` de los 6 jobs + lockstep en `quality-gates.md` | `ci-testing-gate-promotion` (en vuelo) |
| Producir y registrar la métrica TIA de la ventana de calibración                | **este change**                        |

Este change solo define la precondición (evidencia registrada antes de promover) y la produce; si
la promoción llega primero, la evidencia se registra de forma retroactiva desde los step summaries
retenidos. Ninguno de los dos toca los safety nets (nocturno, `shared`, D7).

### D9 — Remote cache: declarar inputs consistentes primero, Turborepo es una decisión posterior

Antes de cualquier cache remota, el hash que invalida el test scope debe ser el mismo que invalida
el build: lockfile, `package.json` de cada workspace, configs de Vitest/ESLint, workflows,
`.dependency-cruiser.cjs` y env declarados como inputs; `outputs` declarados para lo reutilizable.
Ese criterio se fija en la evaluación del ADR (`docs/adr/turborepo-evaluation.md`, hoy
_Proposed_): se actualiza con la métrica shadow (cuánto se re-ejecuta hoy sin necesidad) y con la
lista de inputs/outputs ya alineados, y la decisión `adoptar / no-adoptar` queda registrada
ahí. _Alternativa descartada_: meter turbo en este change — añadiría un orquestador mientras medimos
lo que ya tenemos.

### D10 — Métrica sin infraestructura nueva

Step summary por job + una línea agregada en la métrica semanal existente (`flaky-metric.mjs`
publica ya en el summary): % medio de suite seleccionado, nº de fallbacks D7, `map=hit/miss`.
Nada de dashboards ni servicios externos.

### D11 — Compatibilidad Windows y orden de scripts

Los scripts nuevos se expresan como `vitest ...` invocado por npm (mismo patrón que
`test:changed`, ya probado en el hook bajo Windows); los `.mjs` nuevos usan `node` puro y rutas
`path`, sin bash, para que `test:tia:audit` funcione en local Windows y en runner Ubuntu sin
ramas condicionales. Por eso la selección con inyección no se expresa con `$(...)` dentro del
script npm (falla bajo cmd.exe): pasa por `node scripts/ci/tia-select.mjs`, que spawnea vitest con
el argv computado.

## Risks / Trade-offs

- [El step summary añade tiempo al job] → el audit usa `--filesOnly` (no ejecuta tests) y se mide
  su duración en la tarea de verificación; si supera unos segundos, se calcula sobre el diff ya
  resuelto sin invocar Vitest.
- [`coverage.changed` puede ocultar una caída de cobertura en un PR] → D18 intacto: thresholds solo
  en full, y el nocturno advisory sigue publicando el % global.
- [El propio runner se pone rojo con el informe limitado (F1)] → runs scoped con
  `vitest.scoped.config.js` (thresholds a 0, sin globs) + guard `--advisory`; los thresholds se
  evalúan solo en full. Verificado empíricamente: mismos floors sobre informe limitado → exit 1 sin
  el config scoped y exit 0 con él.
- [El historial reintroduce ruido (flaky inyectado en cada PR)] → N=3 acotado, se inyectan solo
  ficheros con fallo real en `main`, la cuarentena sigue excluyéndolos, y el inyectado se reporta
  aparte en la métrica para poder detectarlo.
- [Dos changes compiten por `continue-on-error`] → D8 reparte la propiedad; este change nunca edita
  esas líneas.
- [Mapa envejecido = selección confiada] → clave por `base-sha` + validación del artefacto al
  consumir; cualquier duda cae a `map=miss` (estático) y de ahí a D7.
- [Scoppear integration/e2e alarga o acorta demasiado el tier PR] → se activa midiendo: la métrica
  shadow del job integration decide si se queda scoped o vuelve a full; e2e ni se toca.
- [Fail-first oculta order-dependence] → orden determinista sin historial + nightly full suite sin
  sequencer propio.

## Migration Plan

1. **Medición** (D2, D10): sin cambio de comportamiento — solo steps advisory.
2. **Quick win** (D3): `--coverage.changed` + validación advisory de `check-coverage.mjs`.
3. **Inyección** (D4): historial publicado por full-suite, consumido best-effort (no-op sin artefacto).
4. **Mapa persistente** (D5): primero solo publicación, después consumo con fallback (dos PRs).
5. **Tiers y orden** (D6, D7): integration scoped y `BaseSequencer`, cada uno con su verificación.
6. **Evidencia** (D8): registro en `quality-gates.md` → la promoción la ejecuta el otro change.
7. **Evaluación de cache** (D9): ADR actualizado con datos, decisión registrada.

Rollback: cada paso es un script/flag reversible por PR; ningún safety net se retira en el
camino, y si un paso degrada el feedback loop basta con quitar su línea (la selección base
`--changed` queda siempre operativa).

## Verification log

Evidencia local recogida al implementar (la evidencia de runs de CI queda como
pending-CI en `tasks.md`):

| Task | Evidencia                                                                       | Resultado                                                                           |
| ---- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1.4  | Duración de `node scripts/ci/tia-metric.mjs apps/client --format=md` (cwd raíz) | **1.1 s** (< 5 s ⇒ se mantiene `vitest list`, sin sustitución por diff ya resuelto) |

## Open Questions

- **N del historial** (3): se ajusta con la métrica sin tocar specs (el requirement solo pide
  "configurable, default 3").
- **Umbral de duración para mantener `test-integration` scoped**: se decide con la métrica
  recogida en la tarea de verificación de esa fase; el contrato de scope ya está especificado.
- **Profundidad del mapa (fichero de test → ficheros fuente vs. nivel por test)**: el artefacto
  permite evolucionar sin cambiar el contrato; el primer incremento usa el grafo que Vitest ya
  resuelve en la corrida full-suite.
