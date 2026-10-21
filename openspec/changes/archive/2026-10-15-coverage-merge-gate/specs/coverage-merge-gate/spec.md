# Spec Delta

## Purpose

Fusiona los reportes de cobertura de todas las shards de un workspace en una única cobertura completa y evalúa los thresholds globales exactamente una vez, post-merge, de modo que el tripwire de cobertura nunca vea datos parciales con N shards y el required check sea un puente de nombre fijo estable.

## ADDED Requirements

### Requirement: Gate post-merge se ejecuta cuando una shard falla, y nunca tras cancelación explícita

El puente de cobertura de cada workspace (job de nombre fijo, `client-coverage`/`server-coverage`) SHALL ejecutarse siempre que su matriz de tests haya corrido, **incluyendo cuando alguna shard haya fallado**, usando un `if` que nunca sea el default `success()`: `${{ !cancelled() && needs.test-unit-<ws>.result != 'skipped' }}`. El fallo de cualquier shard SHALL provocar el fallo del puente: nunca se permite un verde parcial ocultando shards rojas. El puente SHALL **NO** ejecutarse tras una cancelación explícita del usuario (el `if` excluye `cancelled()`), de modo que no se gasta un runner en un run que el usuario descartó ni se deja un required check colgado.

#### Scenario: Una shard falla y el gate aun corre

- **WHEN** `test-unit-client` tiene N shards y al menos una termina en `failure`
- **THEN** `client-coverage` se ejecuta igualmente (el `if` `${{ !cancelled() && needs.test-unit-client.result != 'skipped' }}` evalúa verdadero para `result: failure`) y su paso de propagación evalúa `needs.test-unit-client.result == 'failure'` y termina con `exit 1`

#### Scenario: Run cancelado por el usuario

- **WHEN** el usuario cancela el workflow antes de que termine la matriz
- **THEN** `client-coverage` no se ejecuta (el `if` excluye cancelación explícita) y no deja un required check colgado

### Requirement: Descarga por patrón de todos los artifacts de shard

El puente SHALL descargar **todos** los artifacts de cobertura de las shards del workspace con un patrón (`coverage-<ws>-shard-*`) y `merge-multiple: true` hacia `apps/<ws>/`, restaurando por completo `apps/<ws>/.vitest-reports/` (los blobs del reporter blob de Vitest 4: `blob-<index>-<count>.json`) y `apps/<ws>/coverage/`. Cada shard SHALL subir su artifact con `path` multilínea que cubra `apps/<ws>/coverage/` **y** `apps/<ws>/.vitest-reports/` (LCA = `apps/<ws>`, de modo que las rutas relativas se conserven en el artifact) con `include-hidden-files: true` (`.vitest-reports/` es directorio oculto y `upload-artifact@v4+` lo excluiría por defecto). Los nombres de artifact de shard SHALL incluir el índice de shard para evitar la colisión de nombres que `upload-artifact@v4+` resuelve descartando duplicados.

#### Scenario: N=2 shards suben artifacts con índice

- **WHEN** `test-unit-client` corre con `matrix.shard: [1, 2]` y ambas suben `coverage-client-shard-1` y `coverage-client-shard-2` (cada uno con `apps/client/coverage/` y `apps/client/.vitest-reports/`)
- **THEN** el puente descarga ambos por patrón `coverage-client-shard-*` con `merge-multiple: true` hacia `apps/client/`, restaurando `.vitest-reports/` y `coverage/` sin colisión

#### Scenario: N=1 (estado actual, sin matriz)

- **WHEN** el job de tests es single-runner y sube un único artifact `coverage-client-shard-1`
- **THEN** el patrón `coverage-client-shard-*` lo captura y el puente opera idéntico a con N>1 (sin rama especial que pueda romperse al pasar a matriz)

### Requirement: Validación de presencia por shard antes de medir

Antes de ejecutar cualquier merge o evaluación, el puente SHALL verificar dos entradas distintas: (1) el directorio de blobs `.vitest-reports/` del workspace existe y no está vacío tras la descarga (**entrada del merge**), y (2) `coverage-summary.json` del directorio de coverage existe (**entrada del gate**). Cada ausencia SHALL fallar el job con un `::error::` explícito y un mensaje distinto según la entrada faltante; nunca se evalúa un 0% derivado de un merge parcial. El guard N=0 SHALL distinguir: upstream salteado → el puente **se salta** (propagación vía `if`, sin `::error::`); upstream corrió pero artifacts/blobs ausentes → `::error::` + `exit 1`. En ningún caso se mergeará vacío ni se emitirá verde con cobertura 0%.

#### Scenario: Artefacto de shard ausente

- **WHEN** la matriz declara N=2 pero sólo llega 1 artifact (o ninguno) tras la descarga
- **THEN** el paso de validación termina con `exit 1` y un `::error::` que indica "coverage artifact missing" sin llegar a `check-coverage.mjs`

#### Scenario: Upstream salteado — el puente se salta

- **WHEN** `test-unit-client` termina con `result: 'skipped'` (matriz desactivada o condición que excluye el test job)
- **THEN** `client-coverage` NO se ejecuta (el `if` hereda el skip por `needs.test-unit-client.result != 'skipped'`) y no emite `::error::` alguno. Este es el **único** outcome de este caso

#### Scenario: Upstream corrió pero faltan artifacts o blobs

- **WHEN** `test-unit-client` corrió (`result` distinto de `skipped`) pero tras la descarga falta `coverage-summary.json` o `.vitest-reports/` está vacío
- **THEN** el puente termina con `exit 1` y un `::error::` de mensaje distinto según la entrada faltante (blobs para el merge vs summary para el gate), sin llegar nunca a mergear ni a evaluar cobertura vacía. Este es el **único** outcome de este caso

### Requirement: Orden canónico shard → merge → check-coverage

El puente SHALL respetar el orden irrompible: (1) descargar artifacts, (2) mergear el formato nativo de las shards (`vitest --merge-reports --coverage`) regenerando el informe completo, (3) sólo entonces invocar `scripts/ci/check-coverage.mjs` sobre el summary mergeado. El paso de merge SHALL ejecutarse con `working-directory: apps/<ws>` para que la root de config de Vitest, el directorio de blobs (default de `--merge-reports` = `.vitest-reports` relativo al cwd) y el `reportsDirectory` de coverage resuelvan sin flags extra, y SHALL invocarse **sin** `--reporter=blob` (el merge no ejecuta tests; el flag escribiría un blob espurio). El merge requiere la misma instalación de dependencias que los tests (invoca Vitest). La evaluación de thresholds SHALL usar el mismo single source of truth que el tier local (`vitest.config.js` vía `check-coverage.mjs`), con `autoUpdate` nunca habilitado en CI.

#### Scenario: Merge regenera cobertura completa

- **WHEN** llegan N artifacts con blobs en `.vitest-reports/` (`blob-<i>-<n>.json`) y directorios de coverage por shard
- **THEN** el paso de merge ejecuta `vitest --merge-reports --coverage` con `working-directory: apps/client` y regenera `coverage-summary.json` completo correspondiente a la suite union de las shards

#### Scenario: check-coverage corre sólo post-merge

- **WHEN** el merge termina correctamente
- **THEN** se invoca `node scripts/ci/check-coverage.mjs <workspace> [reports-dir]` sobre el summary mergeado, no sobre la cobertura de una shard individual

### Requirement: Scoping D18 preservado (advisory en diff-scoped, bloqueante en full)

El puente SHALL respetar D18: si el scope TIA de la corrida no es `full` (carril diff-scoped), el gate reporta cobertura en modo `--advisory` y no bloquea el merge; si el scope es `full`, evalúa los thresholds de forma bloqueante. La detección de scope se mantiene por propagación del `tia-scope.txt` ya existente.

#### Scenario: Carril diff-scoped (TIA `changed`)

- **WHEN** `tia-scope.txt` indica scope `changed`
- **THEN** el puente ejecuta `check-coverage.mjs --advisory`, emite un `::notice::` de umbral diferido y termina en éxito sin bloquear

#### Scenario: Carril full-suite

- **WHEN** `tia-scope.txt` indica scope `full` (o está ausente, default `full`)
- **THEN** el puente ejecuta `check-coverage.mjs` sin `--advisory` y un umbral violado falla el job

### Requirement: Blob reporter disponible sólo en CI

El reporter `blob` de Vitest SHALL estar habilitado únicamente cuando la corrida es de CI (`CI=true`), por flag en los scripts `*:ci`. El tier local (desarrollo, `npm run test:coverage`) no SHALL escribir blobs ni cambiar sus reporters actuales.

#### Scenario: Corrida local sin blobs

- **WHEN** un desarrollador ejecuta `npm run test:coverage` en un workspace con `CI` sin definir
- **THEN** los reporters son los actuales (`text`, `json-summary`, `html` en `coverage.reporter`) y no se genera ningún directorio `.vitest-reports/` con blobs

#### Scenario: Corrida CI escribe blobs por shard

- **WHEN** el job de tests corre en GitHub Actions (`CI=true`) con `--shard=k/N`
- **THEN** cada shard escribe sus blobs en `.vitest-reports/` (Vitest 4.1.11: `blob-<index>-<count>.json`; el default de `--merge-reports` es `.vitest-reports` relativo al cwd) además del coverage, y el artefacto subido lo incluye (`include-hidden-files: true`, directorio oculto)
