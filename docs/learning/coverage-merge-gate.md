# Coverage Merge Gate — Merge de Artifacts + Check-coverage ([FB])

> **Fecha de investigación:** 2026-10-06
> **Alcance:** concepto (gate post-matriz, orden canónico shard → merge → check-coverage),
> merge de artifacts por herramienta (Vitest blob, Playwright `merge-reports`, nyc/istanbul,
> coverage.py, Jest, JaCoCo, gocovmerge/xcresult), comandos y flags de `check-coverage`,
> best practices empresariales (artifacts, diff-coverage, ratchet, flakiness, monorepo),
> implementación CI (GitHub Actions YAML mínimo, GitLab, Codecov, GitHub Code Quality) y
> **estado actual en este monorepo** (0 matrix/shard, coverage jobs ya post-artifact, FASE 1
> advisory) con gaps y plan priorizado.
> **Audiencia:** Equipo de ingeniería, CI/CD maintainers, QA lead.
> **Status:** ✅ Investigación completa con fuentes oficiales verificadas por fetch
> (vitest.dev, playwright.dev, nyc README, coverage.py 7.16.2, docs.github.com,
> docs.codecov.com, docs.gitlab.com). **Gaps de fuentes: CircleCI, Coveralls y
> Gradle JaCoCo/gocovmerge/xcresult NO se consultaron** (error de transporte en el fetch);
> sus filas van marcadas "no verificado" y su semántica es conocimiento de base — tratar
> con precaución antes de citarla como autoritativa.

---

## 1. Concepto

Un **Coverage Merge Gate** es el job de CI que corre **después** de fusionar los reportes de
todas las shards y **antes** de evaluar cualquier umbral de cobertura. No mide la cobertura de
una shard: la mide **una sola vez**, sobre el conjunto mergeado. Es el eslabón que falta entre
[`test-sharding.md`][sh] (que reparte la suite) y [`coverage-tripwire-floor-ratchet.md`][tr]
(que exige un tripwire sobre la suite completa, regla D18).

> **Orden canónico (irrompible):** `shard → merge → check-coverage`.
> Saltar el merge o evaluar antes de él equivale a gatear cobertura **parcial**: el tripwire
> falla con un falso rojo (cada shard solo ve sus ficheros) o aprueba con un falso verde
> (el agregado no corresponde a la suite completa). Ambos son peores que no tener gate.

### 1.1 Por qué existe

- Con `N` shards, cada job produce un informe de cobertura **incompleto** por diseño: los
  ficheros de otra shard no se ejecutaron y aparecen como "0% cubierto".
- El tripwire/floor ratchet ([`coverage-tripwire-floor-ratchet.md`][tr] §3, D18) está definido
  sobre **totales globales** de workspace. Un total parcial no es comparable con el umbral.
- El gate por tanto tiene tres fases: (1) **descargar** todos los artifacts de shard,
  (2) **merge** del formato nativo (blob / `.nyc_output` / `.coverage.*` / exec),
  (3) **check-coverage** contra el mismo single source of truth que usa el tier local.

### 1.2 Responsabilidades del job gate

| Fase                    | Qué hace                                                        | Falla con                                         |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| 1. Descarga             | `download-artifact` con `pattern: coverage-<ws>-shard-*`        | artifact ausente → `exit 1` (nunca verde parcial) |
| 2. Merge                | `vitest --merge-reports --coverage` / `nyc merge` / `combine`   | formato incompatible, paths no re-mapeados        |
| 3. Check                | `check-coverage` / `check-coverage.mjs` sobre el merged summary | umbral violado → bloquea el merge (FASE 2)        |
| 4. Propagación de fallo | re-lanza el resultado de las shards (`needs.*.result`)          | shard roja → gate rojo (con `if:` no-default)     |

---

## 2. Merge de artifacts por herramienta

| Herramienta                       | Formato por shard                                  | Comando de merge                                                                          | Notas y límites                                                                                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vitest** (blob)                 | `.vitest/blob/*.blob` + `coverage/`                | `vitest run --merge-reports --coverage`                                                   | Requiere `--reporter=blob` en cada shard. Merge regenera el informe completo (json-summary, html, text). `VITEST_BLOB_LABEL` separa entornos (OS/env) en el merge. El merge **necesita `npm ci`** (invoca Vitest). Fuente verificada.            |
| **Playwright** (blob)             | `blob-report/*.mblob`                              | `npx playwright merge-reports --reporter html ./all-blob-reports`                         | Blob incluye shards/traces/screenshots; nombres por shard no colisionan. Merge entre OS distintos exige `--config` con `testDir` explícito. Fuente verificada.                                                                                   |
| **nyc / istanbul** (Jest u otros) | `.nyc_output/*.json` (raw)                         | `nyc merge .nyc_output coverage.json` → `nyc report --reporter=lcov --reporter=cobertura` | `nyc merge` produce **un solo fichero raw** combinado. Alternativa multi-runner: `nyc --silent --no-clean <runner>` + `nyc report` (combina automáticamente). `temp-dir` por defecto `./.nyc_output`. Fuente verificada.                         |
| **coverage.py** (pytest)          | `.coverage.<host>.<pid>.*` (con `--parallel-mode`) | `coverage combine --keep` → `coverage report --fail-under=XX`                             | Los originales **se borran tras combine** salvo `--keep`. Re-mapping entre máquinas vía `[paths]` o `[run] relative_files` — sin eso, paths distintos = 0% combinado. Desde 7.14 los report commands combinan implícitamente. Fuente verificada. |
| **Jest** (`--shard` ≥28)          | `coverage/` (`json` reporter) por shard            | `nyc merge <dirs-de-coverage> merged.json` + `nyc report`                                 | Jest **no trae merge de coverage**: hay que pasar por nyc/istanbul. `--coverageReporters=json` por shard, merge en el job puente. **No verificado en docs esta ronda.**                                                                          |
| **Gradle / JaCoCo**               | `*.exec` + `*.xml` por subproyecto                 | task `JacocoReport` con `executionData = files(...)` (merge multi-exec)                   | El plugin JaCoCo mergea N `executionData` en un único report; multi-módulo: `jacocoMerge`/report aggregating. **No verificado.**                                                                                                                 |
| **Go**                            | `cover-*.out`                                      | `gocovmerge cover1.out cover2.out > merged.out`                                           | `gocovmerge` (wadey/gocovmerge) concatena perfiles; `go tool cover -func` para el total. **No verificado.**                                                                                                                                      |
| **Swift / Xcode**                 | `.xcresult` por shard                              | sin merge nativo consolidado (`xcrun xcresulttool` / `xccov` por bundle)                  | El ecosistema xcresult no expone un merge oficial multi-shard; práctica habitual: `xcrun xccov view --report --json` por bundle y combinar en script, o llvm-cov merge. **No verificado.**                                                       |
| **Cypress**                       | `.nyc_output/` + `coverage/` por runner            | `nyc merge` en job final (mismo caso nyc)                                                 | El plugin `@cypress/code-coverage` emite por runner; con `--parallel` el balanceo es de Cypress Cloud, el merge de coverage sigue siendo responsabilidad del pipeline. **No verificado.**                                                        |

> **Regla transversal:** merge **siempre en un job dedicado de nombre fijo**, con `needs:` sobre
> la matriz y descarga por patrón — nunca "merge adentro de cada shard".

---

## 3. check-coverage — comandos y flags

| Herramienta         | Comando / flags                                                                                                                                                                      | Granularidad                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **nyc**             | `nyc check-coverage --lines 80 --branches 80 --functions 80 --statements 80 [--per-file]`                                                                                            | aggregate o `--per-file`                                      |
| **nyc (config)**    | `"check-coverage": true` + `lines/branches/functions/statements` en `.nycrc` / `nyc.config.js`                                                                                       | igual; `per-file: true`                                       |
| **istanbul**        | `istanbul check-coverage --lines --branches --functions --statements`                                                                                                                | aggregate                                                     |
| **coverage.py**     | `coverage report --fail-under=75` (tras `coverage combine`)                                                                                                                          | total; con `--fail-under` en `coverage html`/`xml` igualmente |
| **lcov / genhtml**  | `lcov --summary` para medir; el gate real se hace con `diff-lcov`/`check-coverage` scripts o parseo del resumen (no hay flag universal `--fail-under` en lcov)                       | por fichero vía `lcov --list`                                 |
| **Vitest (nativo)** | `coverage.thresholds: { statements, branches, functions, lines }` + globs + `perFile: true` en `vitest.config.js`; evalúa al final del run (también en `--merge-reports --coverage`) | global + glob + perFile                                       |
| **Jest (nativo)**   | `coverageThreshold` en config (global o por glob)                                                                                                                                    | aggregate o glob                                              |

Notas de semántica:

- **Umbrales por tipo:** `lines` y `statements` suelen ir juntos (V8 los aproxima), `branches`
  siempre por debajo (es la métrica más dura), `functions` el más ruidoso en código pequeño.
  Fijar los cuatro, no solo `lines`.
- **Umbrales negativos:** en Vitest, un umbral negativo significa "como mucho N elementos sin
  cubrir", no un porcentaje.
- **`autoUpdate: false` siempre en CI** — ver §4.4 y [`coverage-tripwire-floor-ratchet.md`][tr] §5.7.
- En este repo el gate ejecutable único es `scripts/ci/check-coverage.mjs` (lee thresholds del
  propio `vitest.config.js` y `coverage-summary.json`), invocado por CI y por `npm run coverage:check`.

---

## 4. Best practices empresariales

### 4.1 Un solo gate, solo post-merge

- El **único** required check de cobertura es el job merge-gate. Exigir cobertura por shard
  crea N checks huérfanos al cambiar N (mismo argumento que [`test-sharding.md`][sh] §3.2).
- `fail-fast: false` en la matriz: todas las shards corren; el veredicto se emite en el gate.
- El gate **propaga** el fallo de las shards (nunca las oculta) y **valida presencia** de cada
  artifact antes de medir (un artifact ausente = error, no 0%).

### 4.2 Subida de artifacts entre jobs

- **Nombres únicos por shard**: `actions/upload-artifact` v4+ es **inmutable**; dos shards
  subiendo `coverage-client` a la vez → solo gana una. Patrón: `coverage-client-shard-${{ matrix.shard }}`.
- `if: always()` (o `${{ !cancelled() }}`) en el upload: los runs que más necesitan el informe
  son los que fallan.
- `retention-days` corto para artifacts de shard (1-7 días) y mayor para el merged final
  (14-30) — controla coste de almacenamiento.
- Descarga con `pattern` + `merge-multiple: true` para colapsar shards en un directorio.
- `download-artifact` valida el `digest` del upload: corrupción detectada como warning en el job.

### 4.3 Total vs diff-coverage

| Métrica                 | Qué mide                                  | Cuándo gatearla                          |
| ----------------------- | ----------------------------------------- | ---------------------------------------- |
| **Total coverage**      | todo el código del workspace (post-merge) | tripwire/piso absoluto — D18, full suite |
| **Diff/patch coverage** | solo líneas cambiadas en el PR            | el gate real de "calidad del diff"       |
| **Per-file / glob**     | áreas críticas (`perFile: true`)          | granularidad alta sobre floor bajo       |

- Codecov: `codecov/project` (total, con `target: auto` + `threshold` de tolerancia) vs
  `codecov/patch` (solo diff). Practica: **project con target auto + threshold pequeño** (no
  congelar el total), **patch con target alto** (código nuevo bien testado).
- Coveralls/SonarQube equivalentes: SonarQube gatea _new code_ ≥80% (el quality gate
  autoritativo, inactivo en este repo — ver [`quality-gates.md`][qg]).

### 4.4 Ratchet y D18 (relación con el tripwire)

- El merge gate es **requisito previo** del ratchet: sin merge, `coverage:ratchet` mediría un
  parcial y **bajaría el piso**. Ver [`coverage-tripwire-floor-ratchet.md`][tr] §5.7 y §6.4.
- Bajar un umbral a mano solo con justificación explícita en el PR (tests + config juntos);
  `autoUpdate` jamás en CI.
- D18: el tripwire solo evalúa cobertura de **full suite**; corridas TIA/diff-scoped suben el
  artifact con `--advisory` y difieren el umbral. El merge gate respeta lo mismo: si el scope
  no es `full`, mergea y reporta, pero no bloquea.

### 4.5 Flakiness y retries

- Los retries (Vitest `retry`, Playwright `retries`) se aplican **dentro** de cada shard; la
  evidencia flaky (`flaky-retries.json`) se sube **por shard** y se agrega en el gate.
- Riesgo: un intento fallido + retry exitoso puede **inflar** la cobertura (el código se ejecutó
  en ambos intentos). Mitigación: excluir del gate los tests en cuarentena
  (`.github/flaky-quarantine.yml` → `quarantine-exclude.mjs`) y no contar corridas de tests
  retryeados como evidencia de calidad del diff.
- Un flaky en una shard contamina el gate global: la cuarentena debe aplicar **antes** de shardar.

### 4.6 Monorepo: merge por paquete + total

- Merge y check **por workspace** (client, server) y opcionalmente un total agregado.
- Codecov: **flags** (`-F client`, `-F server`) con `paths:` por paquete; 1 upload = 1 flag
  (subir un reporte multi-paquete con N flags duplica cobertura en cada flag).
- `flag_management.default_rules` con `carryforward: true` para paquetes no tocados en el commit.
- Umbrales por glob en `vitest.config.js` (ya implementados en este repo, ver [tr] §3.3).

### 4.7 Coste: tamaño, compresión, paralelismo

- `coverage-final.json` / `.nyc_output` crecen con el tamaño del repo; los HTML consumen mucho.
  Subir solo `coverage-summary.json` + `lcov.info`/`cobertura.xml` en shards; el HTML merged en
  un artifact final con retención larga.
- Cada shard paga el setup completo: N shards = N × setup (ver fórmulas de [sh] §1.3). El gate
  añade 1 runner más (barato: sin tests, solo merge + check).
- Plugins de compresión del uploader (Codecov comprime en cliente) reducen tiempo de subida.

---

## 5. Implementación CI

### 5.1 GitHub Actions — matriz + gate final (mínimo funcional)

```yaml
jobs:
  test-shard:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/setup-monorepo
      - name: Run shard ${{ matrix.shard }}/3
        run: npm run test:coverage:ci --workspace=apps/client -- --shard=${{ matrix.shard }}/3 --reporter=blob
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: coverage-client-shard-${{ matrix.shard }} # inmutable: índice POR shard
          path: apps/client/coverage/
          retention-days: 3
          if-no-files-found: warn

  coverage-merge-gate: # job de nombre FIJO = required check
    needs: [test-shard]
    if: ${{ !cancelled() }} # NUNCA el if por defecto: debe correr si una shard falla
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/setup-monorepo
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-client-shard-*
          merge-multiple: true
          path: apps/client/coverage/
      - name: Fail if any shard artifact is missing
        run: |
          test -f apps/client/coverage/coverage-summary.json || {
            echo "::error::coverage artifact missing — merged gate would read partial data"; exit 1; }
      - name: Merge blob reports + coverage
        run: npx vitest --merge-reports --coverage --reporter=blob
      - name: Check coverage (único gate, post-merge)
        run: node scripts/ci/check-coverage.mjs apps/client
      - name: Propagate shard failure
        if: ${{ contains(needs.test-shard.result, 'failure') }}
        run: echo "::error::one or more shards failed"; exit 1
```

Claves: `fail-fast: false`; artifact con **índice de shard**; `if: ${{ !cancelled() }}` en upload
y en el gate; validación de presencia **antes** de medir; propagación explícita del fallo de la
matriz; **un solo** required check con nombre fijo.

### 5.2 Cobertura nativa de GitHub (sin SaaS)

```yaml
- name: Upload coverage report
  if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository
  uses: actions/upload-code-coverage@v1
  with:
    file: apps/client/coverage/cobertura.xml # Cobertura XML
    language: JavaScript
    label: code-coverage/client
```

Requiere `permissions: { code-quality: write }` y checkout del `head.sha` para mapear líneas al
diff. El bot `github-code-quality[bot]` comenta % total + diff por fichero en el PR.

### 5.3 GitLab CI — dos mecanismos que no son intercambiables

| Keyword                             | Entrada                         | Produce                                                       | Falla con                       |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| `coverage:` (regex)                 | string sobre el **log** del job | % en widget, badge, historial, `Coverage-Check` approval rule | "sin porcentaje" si no matchea  |
| `artifacts:reports:coverage_report` | XML Cobertura/JaCoCo del job    | anotación línea a línea **solo en ficheros del diff**         | salto silencioso de anotaciones |

Con matriz (`parallel: matrix:`) cada job sube su reporte; el widget `%` sale del regex del log
— genera **ambos desde la misma corrida** o el widget y el diff discrepan.

### 5.4 Codecov — flags, project vs patch

```yaml
coverage:
  status:
    project:
      default: { target: auto, threshold: 1% } # tolera caídas ruidosas del total
    patch:
      default: { target: 90% } # diff-coverage estricto
flags:
  client: { paths: ['apps/client/**'], carryforward: true }
  server: { paths: ['apps/server/**'], carryforward: true }
```

Upload por job: `codecov -f apps/client/coverage/lcov.info -F client`. Merge automático en el
SaaS (sin setup); notificaciones diferidas hasta subir todos los reports. Coveralls equivalente
usa modo parallel + webhook de finish (no verificado en esta ronda).

---

## 6. Errores comunes (top failure modes)

| #   | Anti-patrón                                       | Consecuencia                                                               | Mitigación                                                                            |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | **Gatear cobertura por shard**                    | N checks huérfanos + métrica parcial siempre errónea                       | único gate post-merge, nombre fijo                                                    |
| 2   | **`--shard` sin `--reporter=blob`**               | no hay con qué mergear (Vitest) o informes no fusionables                  | blob reporter condicionado a CI                                                       |
| 3   | **Formatos incompatibles en el mismo merge**      | json-summary + lcov + cobertura sin transformar → merge corrupto           | elegir un formato canónico y regenerar el resto post-merge                            |
| 4   | **Paths absolutos sin re-mapeo**                  | al mergear entre runners, los ficheros no casan → 0% o ficheros duplicados | `[paths]`/`relative_files` (coverage.py), raíz común, `--config testDir` (Playwright) |
| 5   | **Shard vacía / artifact ausente evaluado**       | cobertura parcial interpretada como real → falso rojo/verde                | `test -f ... \|\| exit 1` antes de medir; TIA sin tests → fallback full suite (D7)    |
| 6   | **Job merge con `if:` por defecto (`success()`)** | se salta justo cuando una shard falló — cuando el informe importa          | `if: ${{ !cancelled() }}` / `always()`                                                |
| 7   | **Retries/cuarentena ignorados al mergear**       | flaky infla cobertura; evidencia fragmentada por shard                     | subir evidencia por shard, agregar en gate, excluir cuarentena                        |
| 8   | **`autoUpdate` del ratchet en CI**                | el piso se reescribe sobre un subset TIA (D18) y baja                      | `autoUpdate: false` en CI; ratchet solo local vía PR                                  |
| 9   | **Colisión de nombres de artifact**               | upload-artifact inmutable → solo un shard sube                             | `coverage-<ws>-shard-${{ matrix.shard }}`                                             |
| 10  | **Requere checks por shard en branch protection** | check huérfano al cambiar N                                                | required check = agregador/puente de nombre fijo                                      |

---

## 7. Estado en este monorepo + gaps + plan priorizado

> **Actualización 2026-10-13 — change `coverage-merge-gate`:** los gaps **a, b, c y d están
> cerrados** (implementados con N=1, no-op observable). Los coverage jobs son ahora **puentes de
> nombre fijo** operativos con matriz: descarga por patrón `coverage-<ws>-shard-*` +
> `merge-multiple`, validación de presencia (blobs + summary) ANTES de medir, `vitest
--merge-reports --coverage` y sólo entonces `check-coverage.mjs`, con propagación explícita del
> fallo de shards. Quedan abiertos **e** (FASE 1 COE, `quality-gates`) y **f** (fuentes no
> consultadas), y la matriz N=2 sigue **dormida** (`test-sharding` G2 = N/A).

### 7.1 Estado actual (audit verificado 2026-10-06; puente operativo 2026-10-13)

- **0 matrix / 0 `--shard` en `.github/workflows/ci.yml`**: todos los jobs de test son
  single-runner. Ver [`test-sharding.md`][sh] §4.1.
- **STAGE 2 = exactamente 6 jobs** → agregador `prebuild-unit-tests-complete` → `ci-complete`
  (required check único): `test-unit-client`, `test-unit-server`, `test-integration`,
  `test-smoke`, `client-coverage`, `server-coverage`.
- **Los coverage jobs YA son mini-merge-gates** (post-artifact, pre-D18) — y desde 2026-10-13
  son los **puentes del merge gate**:
  - `client-coverage` (needs `test-unit-client`) descarga **por patrón**
    `coverage-client-shard-*` con `merge-multiple: true` hacia `apps/client/`, **valida** las dos
    entradas (`.vitest-reports/` no vacío = entrada del merge; `coverage-summary.json` = entrada
    del gate) con `::error::` distintos, ejecuta `vitest --merge-reports --coverage` con
    `working-directory: apps/client` (sin `--reporter=blob`), lee `tia-scope.txt` y aplica D18:
    `full` → `node scripts/ci/check-coverage.mjs apps/client`; `changed` → `--advisory` +
    `exit 0`. Al final, `Propagate shard failure` (`contains(needs.…result, 'failure')`).
  - `server-coverage` idem con `apps/server/.vitest-reports/`,
    `apps/server/tests/coverage/` y `check-coverage.mjs apps/server apps/server/tests/coverage`.
  - `if: ${{ !cancelled() && needs.test-unit-<ws>.result != 'skipped' }}` — corre cuando una shard
    falla, no tras cancelación, e hereda el skip sin emitir un `::error::` falso (D2/D4).
  - Ambos con `continue-on-error: true` (**FASE 1 advisory**, change
    `coverage-tripwire-stage-2d`): informan pero **no bloquean** (por `actions/toolkit#581`,
    `needs.<job>.result` reporta `success` cuando el job-COE falla → el agregador no frena).
- **Blob reporter: solo en CI.** `--reporter=blob` añadido a los scripts `*:ci` de ambos
  workspaces (gap a cerrado); el tier local (`test:coverage`) **no** genera `.vitest-reports/`.
  Verificado en local: con `CI=true` escribe `apps/<ws>/.vitest-reports/blob.json` y sin `CI`
  no crea el directorio.
- **Merge ejecutado localmente (N=1):** `vitest --merge-reports --coverage` regenera el
  `coverage-summary.json` **incluso borrando `coverage/` antes** (lee los blobs), y con N=1 los
  totales son **idénticos** a los pre-merge (no-op observable). Sin blobs, `--merge-reports`
  lanza `ENOENT scandir .vitest-reports` — por eso la validación va ANTES (D4).
- **Stack de tests:** Vitest `^4.1.11`, provider `v8` (`@vitest/coverage-v8`),
  reporters `['text','json-summary','html']` en `vitest.shared.js`. **NO hay `blob` reporter**
  configurado → `--shard` sería inoperante hoy (anti-patrón #2).
- **Gate ejecutable único:** `scripts/ci/check-coverage.mjs` (lee thresholds del
  `vitest.config.js` como single source of truth), + `npm run coverage:check` y
  `npm run coverage:ratchet` en la raíz (paridad local ↔ CI).
- **Sin Codecov/Coveralls/SonarQube activos**: `client-sonarqube`/`server-sonarqube` están en
  `if: false` (sin `SONAR_TOKEN`).

### 7.2 Gaps

| #   | Gap                                                                                 | Detalle                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | ✅ **Cerrado 2026-10-13** — Blob reporter condicional a CI                          | `--reporter=blob` en los scripts `*:ci` de `apps/client` y `apps/server` (D5: flag en scripts, no en `vitest.shared.js`); el tier local no genera blobs                                                                             |
| b   | ✅ **Cerrado 2026-10-13** — Índice de shard en nombre de artifact                   | uploads ahora `coverage-<ws>-shard-1` (literal con N=1; `shard-${{ matrix.shard }}` al habilitar matriz) + `include-hidden-files: true` + `retention-days: 3`                                                                       |
| c   | ✅ **Cerrado 2026-10-13** — Unificar `upload-artifact`/`download-artifact`          | los 7 `download-artifact` pasan de `@v4` a `@v7` (inputs `pattern`/`merge-multiple`/`path` verificados en el `action.yml` de `v7`); además `@v4` ya emitía el warning de deprecación de Node 20                                     |
| d   | ✅ **Cerrado 2026-10-13** — Puente de nombre fijo como gate post-merge antes de D18 | el puente **es** el coverage job existente (D1, no hay job nuevo): descarga por patrón → validación (blobs + summary) → `--merge-reports --coverage` → `check-coverage.mjs` → propagación                                           |
| e   | **FASE 1 COE impide bloqueo real**                                                  | `continue-on-error: true` en `test-unit-*` y `*-coverage` = advisory; FASE 2 = retirar COE tras 2-4 semanas de runs limpios ([`quality-gates.md`][qg]). La propagación (D7) ya está implementada y se activa sola al retirar el COE |
| f   | **Fuentes no consultadas**                                                          | CircleCI, Coveralls y JaCoCo/gocovmerge/xcresult sin verificar (§2 y §5 con marcas "no verificado")                                                                                                                                 |

### 7.3 Plan priorizado

| #   | Tarea                                                                                                                                                                                                                                                   | Prioridad | Esfuerzo | Dependencias / dueño                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- | ----------------------------------------------------------- |
| 1   | **Cierre de FASE 1**: quitar `continue-on-error` de los 4 jobs → gate real                                                                                                                                                                              | P1        | Bajo     | [`quality-gates.md`][qg], ventana 2-4 semanas               |
| 2   | ✅ **Hecho 2026-10-13** — Unificar majors de artifact (gap c)                                                                                                                                                                                           | P1        | Bajo     | CI maintainers                                              |
| 3   | ✅ **Hecho 2026-10-13** — Validación "artifact presente por constructo" + guard N=0 (blobs vacíos ⇒ `::error::` distinto al del summary)                                                                                                                | P1        | Bajo     | CI maintainers                                              |
| 4   | ✅ **Hecho 2026-10-13** — **Coverage Merge Gate formal** (gap d): el puente ES el coverage job (D1, sin job nuevo) con `if: ${{ !cancelled() && … != 'skipped' }}`, patrón + `merge-multiple`, `--merge-reports --coverage`, luego `check-coverage.mjs` | P2        | Medio    | satisface [sh] §5 tarea 1 (prerrequisito de la matriz)      |
| 5   | ✅ **Hecho 2026-10-13** — Blob reporter en CI (gap a) + artifact con índice (gap b)                                                                                                                                                                     | P2        | Bajo     | junto con (4)                                               |
| 6   | Matrix shard N=2 advisory en `test-unit-client` usando el gate de (4) — **el prerequisito ya está satisfecho**, pero el umbral de duración sigue en N/A ([sh] §5.1: suite 145-166 s, job 259-282 s < 5 min)                                             | P2        | Medio    | (4) ✅; umbral de duración > 5-8 min ([sh] §2.4) ❌         |
| 7   | Diff-coverage (patch) como segundo status — local o SaaS                                                                                                                                                                                                | P3        | Medio    | opcional: Codecov `codecov/patch` o script sobre `git diff` |
| 8   | Verificar fuentes faltantes (CircleCI/Coveralls/JaCoCo) y actualizar §2/§5                                                                                                                                                                              | P3        | Bajo     | este doc                                                    |

**Coordinación:** el gate es requisito previo declarado de sharding ([sh] §5 tarea 1) y de la
FASE 2 de los gates ([qg]); el ratchet solo puede medir post-merge ([tr] §6.4). Ownership:
CI maintainers — no tocar `sequence.sequencer` (propiedad de `tia-hardening`).

---

## 8. Referencias

### Documentación oficial (verificada por fetch, 2026-10-06)

- Vitest — Improving Performance (sharding + blob + `--merge-reports` + `VITEST_BLOB_LABEL`):
  <https://vitest.dev/guide/improving-performance>
- Vitest — Coverage (providers, thresholds): <https://vitest.dev/guide/coverage>
- Vitest — CLI (`--shard`, `--merge-reports`): <https://vitest.dev/guide/cli>
- Playwright — Sharding (`--shard`, blob, `merge-reports`, GH Actions example):
  <https://playwright.dev/docs/test-sharding>
- nyc — README (check-coverage, thresholds, `per-file`, `temp-dir`, `nyc merge`, `--no-clean`):
  <https://github.com/istanbuljs/nyc>
- coverage.py — Combining data files (`combine --keep`, `[paths]`, `relative_files`):
  <https://coverage.readthedocs.io/en/7.16.2/commands/cmd_combine.html>
- GitHub Actions — Storing workflow data as artifacts (inmutabilidad, digest, retention):
  <https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts>
- GitHub — Setting up code coverage (`actions/upload-code-coverage@v1`, Cobertura XML):
  <https://docs.github.com/en/code-security/how-tos/maintain-quality-code/set-up-code-coverage>
- Codecov — Merging Reports: <https://docs.codecov.com/docs/merging-reports.md>
- Codecov — Flags (monorepo, 1 upload = 1 flag): <https://docs.codecov.com/docs/flags.md>
- Codecov — Status Checks (`codecov/project` vs `codecov/patch`, targets, thresholds):
  <https://docs.codecov.com/docs/commit-status.md>
- GitLab — Code coverage (`coverage:` regex vs `artifacts:reports:coverage_report`):
  <https://docs.gitlab.com/ci/testing/code_coverage/>

### Fuentes no consultadas (gap de esta ronda)

- CircleCI — Collect test coverage (URL canónica no resolvió)
- Coveralls — Parallel builds (transport error)
- Gradle JaCoCo plugin, gocovmerge, xcresulttool/xccov (no verificados)

### Documentación interna del proyecto

- [`docs/learning/test-sharding.md`][sh] (sharding, receta de job puente, anti-patrones)
- [`docs/learning/quality-gates.md`][qg] (FASE 1 → FASE 2, `continue-on-error` advisory)
- [`docs/learning/coverage-tripwire-floor-ratchet.md`][tr] (tripwire, D18, ratchet local,
  §6.4 sharding + Coverage Merge Gate)
- [`docs/learning/unit-tests-enterprise.md`][ute] (§2.6 / §23.6 — Coverage Merge Gate)
- [`.github/workflows/ci.yml`][ci] (STAGE 2, `client-coverage`/`server-coverage`, agregador)
- `scripts/ci/check-coverage.mjs` · `vitest.shared.js` · `apps/*/vitest.config.js`

[sh]: test-sharding.md
[qg]: quality-gates.md
[tr]: coverage-tripwire-floor-ratchet.md
[ute]: unit-tests-enterprise.md
[ci]: ../../.github/workflows/ci.yml
