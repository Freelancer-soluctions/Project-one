# Test Sharding — Distribuir Suites entre Runners (fast feedback [FB])

> **Fecha de investigación:** 2026-10-06  
> **Alcance:** concepto (sharding vs parallelism vs selección TIA vs orden), semántica por
> herramienta (Vitest `--shard` + blob + merge-reports, Playwright, Jest, pytest, Gradle, Cypress),
> plataformas CI (GitHub Actions matrix, CircleCI, Buildkite, GitLab, Travis), patrones CI +
> métricas y **estado actual en este monorepo** (0 matrix/shard, agregador de 6 jobs, `maxWorkers: 1`,
> FASE 1) con gaps y plan priorizado.  
> **Audiencia:** Equipo de ingeniería, CI/CD maintainers, QA lead.  
> **Status:** ✅ Investigación completa + **rollout decidido (N/A) por el change `test-sharding`**:
> la duración medida (`test-unit-client` ≈ 2m20s en CI / **205 s** local serializado; `test-unit-server`
> ≈ 4 s) queda **bajo el umbral de activación de 5 min**, así que la matriz N=2 queda **dormida**
> (`0 strategy.matrix` en `ci.yml`) y solo se activa si nueva evidencia medida cruza el umbral. Es
> un cierre deliberado: la implementación sigue condicionada al **Coverage Merge Gate** y al
> umbral > 5-8 min, con ownership coordinado para no duplicar `tia-hardening` ni
> `smart-test-ordering` (ver §5.1).

---

## 1. Conceptos

**Test sharding** es partir la suite en subconjuntos disjuntos (shards) y ejecutar cada uno en un
runner distinto **en paralelo**, de modo que el **wall-time** de la corrida baje de `T` a
aproximadamente `T/N` más overhead. A diferencia de la selección, sharding **no salta tests**: la
unión de todas las shards es exactamente la suite completa.

> El objetivo es **acortar el wall-time del tier PR** ([FB] fast feedback), no el TTFF: si la
> suite entera tarda 12 min, con 3 shards tarda ~4 min + setup, pero el primer fallo aparece
> cuando termina la shard que lo contiene — el TTFF depende del **balanceo y del orden dentro de
> la shard**, no del sharding per se (coherente con [`smart-test-ordering.md`][sto] §3.4).

### 1.1 Cuatro mecanismos que suelen confundirse

| Mecanismo                 | Pregunta que resuelve                       | ¿Cambia qué corre? | Ejemplo en este repo / industria                                |
| ------------------------- | ------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| **Selección** (TIA)       | ¿_Qué_ tests ejecutar?                      | Sí (subconjunto)   | `vitest --changed`, guard D7 ([`test-impact-analysis.md`][tia]) |
| **Orden** (fail-first)    | ¿_En qué orden_ ejecutar los seleccionados? | No (solo reordena) | `sequence.sequencer` (propiedad de `tia-hardening`)             |
| **Sharding** (este doc)   | ¿_En qué runner_ ejecutar cada parte?       | No (reparte todo)  | `vitest --shard=k/N` + GH matrix                                |
| **Paralelismo intra-job** | ¿Cuántos workers dentro de un runner?       | No (mismo proceso) | `maxWorkers: 1` en CI (este repo), `--workers`/`-n`             |

Sharding y paralelismo se combinan: cada shard corre con sus propios workers; sharding reparte
**entre máquinas**, el pool reparte **dentro de la máquina**. TIA se aplica **primero** (menos
tests) y **después** se sharda el subconjunto seleccionado — al revés no tiene sentido (shardear
la suite completa para luego descartar la mayoría).

### 1.2 Semántica de Vitest `--shard=<index>/<count>`

Verificada en la fuente (`BaseSequencer.shard()`, `packages/vitest/src/node/sequencers/`):

- **Parte ARCHIVOS, no casos**: con 1000 ficheros, `--shard=1/4` ejecuta 250 ficheros sin importar
  cuántos casos contengan (los ficheros grandes desbalancean la shard).
- **Determinista por SHA-1**: cada path (relativo a `root`) se hashea con SHA-1, la lista se ordena
  por hash y se toma un rango contiguo con `calculateShardRange` (distribución pareja del
  remainder — commit `7b48995`/PR #8288, jul-2025; antes, `ceil` podía dejar una shard vacía).
  El mismo `k/N` asigna **siempre el mismo fichero a la misma shard** → reproducible entre runs.
- **La shard ANTECEDE al sort**: `shard()` se ejecuta antes que `sort()` del sequencer, por lo que
  el fail-first (`failed first → longer first`) solo reordena **dentro** de cada shard. El orden
  no puede mover un fallo a otra shard ni "adelantarlo" por encima del reparto.
- **Incompatible con `--watch`**; funciona con pool `forks` o `threads` (el sharding es previo al
  pool) y con `--changed` (la selección TIA filtra primero, luego se sharda el resto).
- **Coverage**: cada shard genera cobertura **parcial**; el merge nativo es
  `vitest --merge-reports --coverage` (blob reporter) — sin merge, cualquier gate de coverage
  (tripwire ratchet D18) mide cobertura incompleta y miente.

### 1.3 Fórmulas de coste y balanceo

- **Wall-time**: `s + (T / w) * m` — `s` = setup por runner (checkout, caché, `npm ci`), `T` =
  suite serial, `w` = workers totales (shards × workers/shard), `m` = fracción que retiene la
  shard más lenta (straggler). Si `m >> 1/N`, las demás shards terminan y esperan.
- **Minutos facturados**: `N * (s + T/w)` — más shards = menos wall-time pero **más coste**: el
  setup `s` se paga `N` veces. Con `s=90s` y `T=6 min`, pasar de 1 a 4 shards ahorra ~4.5 min de
  wall-time pero añade ~4.5 min de compute total solo en setups.
- **Overhead de sharding**: solo es rentable cuando `T >> s`. Regla práctica: shardar cuando la
  suite supera **5-8 min** (por debajo, el overhead de N setups cancela la ganancia).
- **Criterio de balance aceptable**: shards dentro del **10-15%** entre sí; si una shard tarda el
  triple, el reparto por conteo falló y hay que re-balancear por duración (custom sequencer o
  split externo por timings).

> **Corolario [FB]**: sharding acorta el wall-time del tier PR, pero el TTFF lo siguen moviendo el
> orden y la selección. Sharding + TIA + fail-first se multiplican: seleccionar poco (TIA),
> repartir en N (sharding) y ordenar dentro de la shard (fail-first) son capas independientes.

---

## 2. Herramientas y plataformas

| Herramienta / plataforma     | Mecanismo de sharding / split                                                                                                                          | Granularidad                                | Notas y límites                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest `--shard=k/N`**     | `--shard=k/N --reporter=blob` por runner + `vitest --merge-reports --coverage` (junit/HTML tras merge)                                                 | Fichero (SHA-1)                             | `VITEST_BLOB_LABEL` para etiquetar OS/env en el merge; no con `--watch`; cobertura parcial por shard → merge obligatorio                              |
| **Playwright `--shard=x/y`** | `--shard=x/y` + `reporter: blob` + `npx playwright merge-reports ./blob-report`                                                                        | Fichero; **test** con `fullyParallel: true` | `fullyParallel` da balance a nivel de test (recomendado en CI); `--workers` es paralelismo intra-shard, independiente del shard                       |
| **Jest `--shard`**           | Nativo desde **Jest 28**: `--shard=k/N` (1-based) vía `testSequencer.shard()`; antes: sequencer custom `CI_NODE_INDEX/TOTAL`, `testPathIgnorePatterns` | Fichero                                     | Requiere sequencer con `shard`; Knapsack reparte por timings; Sentry balancea por duración histórica con default **p50 = 1500 ms** por test sin datos |
| **CircleCI**                 | `parallelism: N` + `circleci tests run --split-by=timings\|filesize\|name` (JUnit alimenta timings)                                                    | Fichero/clase/test                          | **Dynamic test splitting** reasigna batches a nodos listos → mitiga stragglers y cold start; fallback a nombre sin datos                              |
| **Buildkite**                | `parallelism: N` por step (`BUILDKITE_PARALLEL_JOB/_COUNT`) + Test Engine Client (bktec)                                                               | Variable                                    | bktec hace split inteligente + gestión de flakiness; Knapsack/Shardy como alternativas                                                                |
| **GitLab CI**                | `parallel: matrix:` (N jobs idénticos con variable) + script propio por índice                                                                         | A definir en script                         | El split es user-land (no hay CLI nativo de timings)                                                                                                  |
| **Travis CI**                | Build matrix con `CI_NODE_INDEX/TOTAL` + Knapsack (`rake knapsack:rspec` etc.)                                                                         | Fichero                                     | Knapsack balancea por historial de duraciones                                                                                                         |
| **Cypress**                  | `cypress run --record --parallel` → Cypress Cloud hace **load-balancing dinámico** (un spec a la vez por máquina)                                      | Spec file                                   | Requiere `--record` + `--ci-build-id`; specs de duración similar para mejor balance; orquestación en la nube, no split estático                       |
| **pytest**                   | `pytest-split` (`--splits N --group k`, `.test_durations` persistido; `duration_based_chunks` / `least_duration`)                                      | Test                                        | `pytest-xdist -n auto` es paralelismo **intra-máquina** (schedulers `load`, `loadscope`, `loadfile`, `worksteal`), no sharding entre runners          |
| **Gradle / JVM**             | `maxParallelForks` (intra-máquina) + **Develocity Test Distribution** (particiones balanceadas por historial en agentes remotos)                       | Clase/partición                             | Estado estático compartido rompe con forks/distribución (`forkEvery` como mitigación); particiones = un JVM cada una                                  |
| **.NET / VSTest**            | Splitting externo en la matriz CI (Microsoft Test Impact/TIA para selección; VSTest no trae `--shard`)                                                 | Fichero/ensamblado                          | El reparto se hace con lista de tests + `dotnet test --filter` o herramientas de splitting de terceros                                                |
| **Go**                       | `go test -v $(go list ./... \| circleci tests split --split-by=timings)`                                                                               | Paquete                                     | `go test -parallel` es concurrencia **dentro** de un proceso; el sharding entre runners se hace con el split del CI                                   |

---

## 3. Patrones CI y métricas

### 3.1 Patrón base: GH Actions matrix + merge job (único required check)

```yaml
jobs:
  test-unit-client:
    name: 'Tests: Unit - Client (${{ matrix.shard }}/2)'
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false # una shard roja no cancela las demás: panorama completo
      matrix:
        shard: [1, 2] # N fijo en un solo sitio (evita drift índice/total)
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup-monorepo
      - name: Run shard
        run: npm run test:coverage:ci --workspace=apps/client -- --shard=${{ matrix.shard }}/2 --reporter=blob
      - uses: actions/upload-artifact@v7
        if: always() # el artefacto del shard que falló también se sube
        with:
          name: coverage-client-shard-${{ matrix.shard }} # nombre POR shard (inmutable)
          path: apps/client/coverage/
          if-no-files-found: warn

  test-unit-client-merge: # job puente con nombre FIJO = required check
    needs: [test-unit-client]
    if: always() # si no, se salta justo cuando una shard falló
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v7 # merge-multiple por nombre con patrón
      - run: npx vitest --merge-reports --coverage # regenera coverage COMPLETO
      - name: Fail the gate when any shard failed
        run: |
          if [[ "${{ contains(needs.test-unit-client.result, 'failure') }}" == "true" ]]; then
            echo "::error::One or more client shards failed"; exit 1
          fi
```

Claves del patrón:

1. **`fail-fast: false`**: todas las shards corren; el fracaso se evalúa en el merge.
2. **Artefactos con nombre por shard**: `actions/upload-artifact` es **inmutable** — dos shards
   subiendo `coverage-client` a la vez hacen que solo gane una (el resto falla).
3. **Job merge con `if: always()`**: con el `if:` por defecto heredado (`success()`), el merge se
   **salta** justo cuando hay fallos, que es cuando el informe importa.
4. **Un solo required check con nombre fijo** (el merge/agregador). Exigir `Shard 1/2`, `2/2`…
   rompe branch protection en cuanto cambia N: el check viejo nunca volverá a reportar.
5. **Retries/cuarentena por shard**: los retries de Vitest (`retry`) y la exclusión de cuarentena
   (`quarantine-exclude.mjs`) aplican **dentro** de cada shard; la evidencia flaky
   (`flaky-evidence-*`) debe coleccionarse por shard y agregarse en el merge.

### 3.2 Anti-patrones

| Anti-patrón                                          | Consecuencia                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Required check por cada shard                        | Ruido en branch protection + check huérfano al cambiar N                                                 |
| `N` excesivo (shard count muy alto)                  | Facturación `N*(s+T/w)`: el setup se repite N veces; punto de retorno rápido                             |
| Sharding sin merge de coverage                       | Tripwire/ratchet (D18) mide cobertura parcial → falso rojo o verde injustificado                         |
| Shards con estado compartido (DB, ficheros globales) | Corridas disjuntas no aíslan: colisionan en la misma DB/lock; exige DB por shard o tests auto-contenidos |
| Artefactos con nombre colisionado (sin índice)       | `upload-artifact` inmutable → solo un shard sube, el resto falla                                         |
| Job merge con `if:` por defecto                      | Se salta cuando una shard falla (el merge es exactamente lo que se necesita entonces)                    |
| Ignorar retries/cuarentena por shard                 | Un flaky en una shard contamina el gate global sin pase por cuarentena                                   |
| Reparto por conteo con outliers de duración          | La shard con el fichero largo fija el wall-time (straggler); balanceo por hash no es balanceo temporal   |
| Shardar suites con order-dependence oculta           | Cada shard ve un subconjunto: dependencias entre ficheros estallan de forma no determinista              |

### 3.3 Métricas a publicar

| Métrica                        | Definición / objetivo                                                           | Cómo medirla en CI                      |
| ------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------- |
| **Wall-time por tier**         | Duración total del tier PR antes/después de shardar                             | Tiempos de job en la UI de GH           |
| **Balanceo (máx/mín)**         | Ratio entre la shard más lenta y la más rápida; objetivo **< 1.10-1.15**        | Duración por job de la matriz           |
| **Straggler share (`m`)**      | Fracción del wall-time que aporta la última shard a terminar                    | `m = shard_max * N / T_total`           |
| **Overhead %**                 | `(N * s) / wall-time` — cuánto del coste es setup repetido                      | Tiempos de step de setup vs test        |
| **Coste (minutos facturados)** | `N * (s + T/w)` — comparar con el ahorro de wall-time antes de subir N          | Suma de minutos de job de la matriz     |
| **TTFF**                       | **NO** mejora por sharding solo; medir aparte (ownership `smart-test-ordering`) | Step summary de primer fallo            |
| **Cobertura merged**           | Coverage total tras `--merge-reports --coverage` = base real del tripwire       | `coverage-summary.json` en el job merge |

---

## 4. Estado actual en este repo + recetas

### 4.1 Estado actual (audit)

- **0 matrix / 0 `--shard` en `.github/workflows/ci.yml`**: los jobs de test son single-runner.
- **STAGE 2 prebuild = exactamente 6 jobs** consumidos por el agregador
  `prebuild-unit-tests-complete`: `test-unit-client`, `test-unit-server`, `test-integration`,
  `test-smoke`, `client-coverage`, `server-coverage` → a su vez `ci-complete` (required check
  único). **El contrato es `needs` de 6 entradas**: añadir N shards como `needs` directos rompe
  el contrato y ensucia el agregador.
- **`timeout-minutes: 10`** en jobs de test unit; `continue-on-error: true` (FASE 1 advisory) en
  `test-unit-*` y `*-coverage` — ventana de calibración en [`quality-gates.md`][qg].
- **`maxWorkers: 1` en CI** (`apps/*/vitest.config.js`, condicionado a `CI=true`) + `retry: 2` en
  server: los tests corren serializados por job → el wall-time actual es `T` puro, sin paralelismo
  intra-job que amortigüe el sharding.
- **TIA (D7) selecciona ANTES**: `test:changed:ci` con fallback a suite completa si 0 tests;
  sharding aplicaría **después** de la selección (sobre el subconjunto ya filtrado).
- **Cuarentena** (`.github/flaky-quarantine.yml` → `quarantine-exclude.mjs`) y **coverage en jobs
  separados** (`client-coverage`/`server-coverage` con D18: thresholds solo en full suite).
- **Instrumentación de duración (change `test-sharding`, G1.1)**: `test-unit-client` y
  `test-unit-server` añaden dos steps advisory (`Mark test step start` + `Report test step duration`,
  `if: always()`, append-only) que publican el wall-time del step de tests en el step summary —
  exactamente la medición que exige el umbral de §4.2, sin matriz y sin cambiar el run.

### 4.2 Prerequisitos antes de tocar nada

1. **Coverage Merge Gate (unit-tests-enterprise §23.6)** — **obligatorio ANTES** de habilitar
   sharding: sin job de merge, el tripwire ratchet miente con cobertura parcial por shard.
2. **Umbral de duración**: sharding solo si la suite supera **5-8 min** (§2.4, P2). Medir primero:
   si `test-unit-client` sigue en pocos minutos, sharding es coste puro.
3. **No tocar `sequence.sequencer`**: propiedad de `tia-hardening` (selección + sequencer + D7).
   El sharding vive en el workflow y en los flags de CLI, no en la config de sequencer.
4. **Decisión medida (change `test-sharding`, G2)**: con la evidencia actual (CI ≈ 2m20s; local
   serializado 205 s en cliente y ≈ 4 s en servidor) la decisión es **N/A** ⇒ no aterriza ninguna
   matriz y la capacidad queda dormida. Se re-evalúa solo cuando la medición del step advisory
   (punto 3.1) cruce la banda de 5-8 min.

### 4.3 Receta: matrix shard para `test-unit-client` preservando el contrato de 6 jobs

Patrón recomendado: **job matriz + job puente con nombre fijo** — el agregador sigue viendo 6
`needs`; el puente absorbe la matriz y hace el merge.

```yaml
test-unit-client:
  # Mismo id de job → `needs: [test-unit-client, ...]` del agregador NO cambia.
  if: (needs.repo-discovery.outputs.client == 'true' || needs.repo-discovery.outputs.shared == 'true') && github.event_name == 'pull_request'
  continue-on-error: true # FASE 1 advisory
  name: 'Tests: Unit - Client'
  needs: repo-discovery
  runs-on: ubuntu-latest
  timeout-minutes: 10
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2] # N=2 advisory; subir N solo si el umbral lo justifica
  permissions:
    contents: read
    checks: write
  steps:
    - uses: actions/checkout@v5
      with: { fetch-depth: 0 }
    - uses: ./.github/actions/setup-monorepo
    # TIA (D7) + cuarentena (D9) IGUAL que hoy: seleccionar ANTES, shardar después.
    - name: Resolve TIA scope (diff-scoped vs full suite)
      id: tia
      run: # … idéntico al actual: scope=changed|full …
    - name: Derive quarantine exclusions
      id: quarantine
      run: echo "args=$(node scripts/ci/quarantine-exclude.mjs --format=argv)" >> "$GITHUB_OUTPUT"
    - name: Run Client Unit Tests (shard ${{ matrix.shard }}/2)
      run: |
        # blob + coverage por shard; la selección TIA ya filtró la lista de ficheros
        npm run test:changed:ci --workspace=apps/client -- \
          ${{ steps.quarantine.outputs.args }} \
          --shard=${{ matrix.shard }}/2 --reporter=blob
      shell: bash
    - uses: actions/upload-artifact@v7
      if: always()
      with:
        name: coverage-client-shard-${{ matrix.shard }}
        path: apps/client/coverage/
        if-no-files-found: warn
    - uses: actions/upload-artifact@v7
      if: always()
      with:
        name: flaky-evidence-client-shard-${{ matrix.shard }}
        path: |
          apps/client/reports/junit.xml
          apps/client/reports/vitest-results.json
          apps/client/reports/flaky-retries.json
          apps/client/reports/tia-scope.txt
        retention-days: 30
        if-no-files-found: warn

# Puente merge: nombre FIJO, une shards y regenera coverage COMPLETO antes de D18.
# (Si el agregador exige 6 needs, este job se lista en el needs de client-coverage
#  o se le da salida propia — en cualquier caso: agregar EL PUENTE, no N shards.)
test-unit-client-merge:
  if: always()
  needs: [test-unit-client]
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - uses: actions/checkout@v5
    - uses: ./.github/actions/setup-monorepo
    - uses: actions/download-artifact@v7
      with:
        pattern: coverage-client-shard-*
        merge-multiple: true
        path: apps/client/coverage/
    - name: Merge blob reports + coverage
      run: npx vitest --merge-reports --coverage --reporter=junit
    - name: Propagate shard failure
      run: |
        if [[ "${{ contains(needs.test-unit-client.result, 'failure') }}" == "true" ]]; then
          echo "::error::One or more client shards failed"; exit 1
        fi
```

Notas de la receta:

- **Junit por shard** para `dorny/test-reporter` (nombre `Client Unit Tests (k/2)` por shard) o
  merge de junit en el puente para un único informe.
- **D18 / tripwire**: `client-coverage` descarga **los dos** artifacts de shard y solo entonces
  `check-coverage.mjs` ve cobertura completa — si la descarga falla, ya existe el error
  "coverage artifact missing" que impide un verde con cobertura parcial.
- **`--merge-reports` necesita `npm ci`** (mismo `setup-monorepo`) porque invoca Vitest.
- **Nightly** (`nightly-full-suite.yml`): candidato natural a shards N>2 (sin prisa de wall-time,
  sí de coste) — pero solo tras el Coverage Merge Gate.
- **Shards con TIA**: en modo `scope=changed` la selección puede dejar pocos ficheros; con
  subconjunto pequeño, **desactivar sharding** (N=1 efectivo) en vez de repartir 2 tests en 2
  runners. Receta: condicionar `matrix.shard` a `scope=full` (job setup que emita la matriz
  dinámica vía `fromJSON`).

---

## 5. Gaps y plan priorizado

| #   | Gap / tarea                                                                                      | Prioridad | Esfuerzo | Dueño (evitar colisión)                                  |
| --- | ------------------------------------------------------------------------------------------------ | --------- | -------- | -------------------------------------------------------- |
| 1   | **Coverage Merge Gate** (requisito previo)                                                       | P1        | Medio    | CI maintainers — diseño en `unit-tests-enterprise` §23.6 |
| 2   | **Medir duración real** de `test-unit-*` (¿> 5-8 min?)                                           | P1        | Bajo     | CI maintainers (step summary de tiempos)                 |
| 3   | Matrix shard **N=2 advisory** en `test-unit-client` (FASE 1 `continue-on-error`)                 | P2        | Medio    | CI maintainers — este doc                                |
| 4   | Job `merge-reports` + coverage merged (blob → `--merge-reports --coverage`)                      | P2        | Medio    | Depende de (1); CI maintainers                           |
| 5   | Required-check = **agregador/puente de nombre fijo** (no por shard)                              | P2        | Bajo     | Coordinar con ruleset de `ci-complete`                   |
| 6   | **Shards después de TIA**: matriz dinámica condicionada a `scope=full` (selección → luego shard) | P3        | Medio    | Depende de `tia-hardening` (D7)                          |
| 7   | Balanceo por duración (custom sequencer user-land, issue #9184)                                  | P3        | Alto     | Tras `tia-hardening` (sequencer)                         |

**Coordinación con changes en vuelo (no duplicar ownership):**

- `tia-hardening` — selection + sequencer (D7, fail-first): este doc **no** toca
  `sequence.sequencer` ni la lógica de selección; sharding solo añade flags de CLI y matriz en
  el workflow.
- `smart-test-ordering` — TTFF, métrica de shuffle, historial: ya advierte que **shards mejoran
  wall-time, no TTFF** (§3.4). Las métricas de TTFF quedan fuera de este doc (su propiedad).
- `client-snapshot-testing` — snapshots: los snapshots y updates no deben partirse entre shards
  sin merge de informes (riesgo de carrera al actualizar snapshots en una shard).
- Umbral y gate previo: [`unit-tests-enterprise.md`][ute] §2.4 (P2, > 5-8 min) y §2.6 / §23.6
  (Coverage Merge Gate obligatorio antes de sharding) — **respetar ese orden**.

### 5.1 Estado del rollout — change `test-sharding` (2026-10-13)

- **G1 (siempre, sin matriz)**: instrumentación de duración desplegada en ambos jobs unit
  (`ci.yml`); verificación del prerequisito **Coverage Merge Gate** (§23.6: el gate por workspace
  existe, el merge de shards no existe y queda diseñado); auditoría de ownership (este change solo
  toca `ci.yml` — `sequence.sequencer`, selección D7, cuarentena y configs de cliente intactos).
- **G2 (decisión, gate duro)**: **N/A**. Umbral: >8 min en 3 corridas ⇒ PROCEED; <5 min ⇒ N/A.
  Evidencia: `test-unit-client` ≈ **2m20s** en CI (documentado) y **205 s** de suite serializada
  medida en local (`CI=true`, `maxWorkers: 1`); `test-unit-server` ≈ **4 s**. Ambos por debajo del
  umbral ⇒ **no aterriza ninguna matriz** y la capacidad queda dormida (gaps 3-5 en N/A).
- **Estado del prerequisito**: merge de shards **ausente por diseño** (N/A hasta que exista
  sharding); sin él, habilitar matriz haría que el tripwire D18 mintiera con cobertura parcial.
- **Follow-up**: la tabla de Evidencia del change registrará ≥3 corridas reales de CI; si alguna
  cruza el umbral, se abre G3 (matriz N=2 `test-unit-client` + puente único de nombre fijo, sin
  tocar el contrato de 6 `needs`).

---

## 6. Referencias

### Documentación oficial y fuentes

- Vitest — Improving Performance (sharding + blob + merge-reports):
  <https://vitest.dev/guide/improving-performance>
- Vitest — CLI (`--shard`, `--merge-reports`): <https://vitest.dev/guide/cli>
- Vitest — `sequence.sequencer` (shard antes que sort): <https://vitest.dev/config/sequence>
- Vitest — Features (sharding con coverage): <https://vitest.dev/guide/features>
- Vitest — `BaseSequencer.ts` (SHA-1 + `calculateShardRange`):
  <https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/sequencers/BaseSequencer.ts>
- Vitest — commit #8288 (reparto parejo de shards, jul-2025):
  <https://github.com/vitest-dev/vitest/commit/7b489959a>
- Playwright — Sharding (`--shard=x/y`, blob, merge-reports, fullyParallel):
  <https://playwright.dev/docs/test-sharding>
- Playwright — Parallelism (`--workers`, locks de recursos compartidos):
  <https://playwright.dev/docs/test-parallel>
- Jest — CLI Options (`--shard` desde v28): <https://jestjs.io/docs/29.7/cli>
- Jest — Issue #11252 (built-in shard support, sequencer custom):
  <https://github.com/jestjs/jest/issues/11252>
- CircleCI — Test splitting and parallelism (`--split-by=timings`):
  <https://circleci.com/docs/guides/optimize/parallelism-faster-jobs/>
- CircleCI — Dynamic test splitting (mitigación de stragglers/cold start):
  <https://circleci.com/docs/guides/test/use-dynamic-test-splitting/>
- Buildkite — Parallel builds (`parallelism`, bktec):
  <https://buildkite.com/docs/pipelines/best-practices/parallel-builds>
- GitLab — Matrix expressions (`parallel:matrix`): <https://docs.gitlab.com/ci/yaml/matrix_expressions/>
- Travis — Speeding up the build (matrix + Knapsack): <https://docs.travis-ci.com/user/speeding-up-the-build/>
- Cypress — Parallelization (load-balancing en la nube):
  <https://docs.cypress.io/cloud/features/smart-orchestration/parallelization>
- pytest-split (durations, algoritmos de split): <https://pypi.org/project/pytest-split/>
- pytest-xdist (how it works, schedulers): <https://pytest-xdist.readthedocs.io/en/stable/how-it-works.html>
- Develocity — Test Distribution (Gradle/Maven): <https://docs.develocity.ai/test-distribution/current/>
- Nx — Reliable CI (coste de agents estáticos, flakiness a escala):
  <https://nx.dev/blog/reliable-ci-a-new-execution-model-fixing-both-flakiness-and-slowness>
- Buildkite — How top software companies reduce build times (splitting + flaky):
  <https://buildkite.com/resources/blog/how-the-worlds-leading-software-companies-reduce-build-times-through-efficient-testing/>

### Documentación interna del proyecto

- [`docs/learning/test-impact-analysis.md`][tia] (selección TIA; D7 — seleccionar ANTES de shardar)
- [`docs/learning/smart-test-ordering.md`][sto] (§3.4 — shards mueven wall-time, no TTFF)
- [`docs/ci-cd-pipeline-empresarial.md`][emp] ("Test sharding — distribuir suites entre runners [FB]",
  diagrama §~2830 y tabla de optimizaciones ~línea 3410)
- [`docs/learning/quality-gates.md`][qg] (FASE 1 → FASE 2; `continue-on-error` advisory)
- [`docs/learning/unit-tests-enterprise.md`][ute] (§2.4 sharding P2 > 5-8 min, §2.6 Coverage Merge Gate)
- Change en vuelo: [`openspec/changes/tia-hardening/design.md`][tiah-design] (selection + sequencer)
- Flujos de trabajo: [`.github/workflows/ci.yml`][ci] (STAGE 2 prebuild, agregador de 6 jobs) ·
  [`.github/workflows/nightly-full-suite.yml`][nightly]

[tia]: test-impact-analysis.md
[sto]: smart-test-ordering.md
[emp]: ../ci-cd-pipeline-empresarial.md
[qg]: quality-gates.md
[ute]: unit-tests-enterprise.md
[tiah-design]: ../../openspec/changes/tia-hardening/design.md
[ci]: ../../.github/workflows/ci.yml
[nightly]: ../../.github/workflows/nightly-full-suite.yml
