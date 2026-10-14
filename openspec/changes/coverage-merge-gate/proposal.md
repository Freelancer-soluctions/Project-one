# Proposal

## Why

Con 0 shards hoy, `client-coverage`/`server-coverage` son mini-gates que descargan **un** artifact de nombre plano y evalúan thresholds directamente — un patrón que se rompe en el momento en que `test-unit-*` se convierta en matriz (cada shard produciría cobertura parcial y el tripwire D18 mentiría con falsos rojos/verdes). `ci-test-sharding` ya declara el Coverage Merge Gate como **requisito previo duro** antes de sharding, y `coverage-tripwire-floor-ratchet` §6.4 exige merge post-shard antes de medir; ninguno de los dos tiene implementación. Este change formaliza ese gate ahora, mientras N=1, para que la matriz N=2 sea un cambio de configuración y no un rediseño.

## What Changes

- **Gap d — Coverage Merge Gate formal**: los jobs `client-coverage`/`server-coverage` se convierten en **puentes de nombre fijo** capaces de N shards. `if: ${{ !cancelled() && needs.test-unit-<ws>.result != 'skipped' }}` (nunca el default `success()`, que se salta justo cuando una shard falló; y nunca tras cancelación explícita del usuario), descarga con `pattern: coverage-<ws>-shard-*` + `merge-multiple: true`, **validación de presencia** por shard antes de medir (`test -f ... || exit 1`), merge (`vitest run --merge-reports --coverage`) y sólo entonces `scripts/ci/check-coverage.mjs`. Propagación explícita del fallo de la matriz (`contains(needs.*.result, 'failure')`).
- **Gap a — blob reporter condicional a CI**: añadir `blob` a `coverage.reporter` (o `--reporter=blob` en los scripts `*:ci`) **sólo cuando `CI=true`**, para que `--shard` sea operante sin contaminar el tier local. Sin esto no hay nada que mergear (anti-patrón #2).
- **Gap b — índice de shard en el nombre de artifact**: migrar de nombres planos (`coverage-client`/`coverage-server`) a `coverage-<ws>-shard-${{ matrix.shard }}`. `upload-artifact@v4+` es inmutable: dos shards subiendo `coverage-client` a la vez → sólo gana una. Con N=1 el índice es estable (`shard-1`).
- **Gap c — unificar majors de artifact**: el workflow mezcla `upload-artifact@v7` (jobs de test) con `download-artifact@v4` (coverage/sonar). Alinear a un mismo major para eliminar la ambigüedad de comportamiento entre upload/download.
- **Guard N=0**: si la matriz se desactiva (o TIA deja el scope en `changed` y se colapsa a N=1 efectivo), el gate no debe evaluar un merge vacío — verificar presencia del artifact único o fallar con mensaje claro.
- **Consumidores de `coverage-<ws>`**: `server-sonarqube` y `client-sonarqube` (ambos hoy `if: false`) descargan `coverage-server`/`coverage-client` por nombre plano; se actualiza el patrón de descarga en ambos a `coverage-<ws>-shard-*` + `merge-multiple: true` para no dejar un consumidor roto.

## Capabilities

### New Capabilities

- `coverage-merge-gate`: contrato del puente de nombre fijo que fusiona los reports de cobertura de todas las shards de un workspace y evalúa los thresholds globales **una sola vez**, post-merge, antes del agregador. Cubre: ejecución post-matriz (`!cancelled()`), validación de presencia por shard, orden canónico shard → merge → check-coverage, propagación del fallo de shards, guard N=0, y comportamiento D18 (advisory en diff-scoped, bloqueante en full).

### Modified Capabilities

<!-- Ninguna: la capacidad `ci-test-sharding` ya DECLARA el merge gate como prerrequisito (req. 2) sin definirlo; este change lo implementa como capacidad nueva. El contrato de 6 `needs` del agregador y los nombres de job no cambian. -->

## Impact

- `.github/workflows/ci.yml`: jobs `client-coverage`, `server-coverage` (descarga por patrón, merge, presencia, propagación); `test-unit-client`, `test-unit-server` (nombre de artifact con índice de shard); `server-sonarqube` y `client-sonarqube` (ambos `if: false`; patrón de descarga actualizado a `coverage-<ws>-shard-*` + `merge-multiple`).
- `vitest.shared.js` / `apps/*/package.json`: `blob` reporter condicionado a `CI=true` en los scripts `*:ci`.
- `scripts/ci/check-coverage.mjs`: sin cambio de API — se invoca igual post-merge (lee thresholds del `vitest.config.js` como single source of truth).
- Coordinación: `ci-test-sharding` (tarea 1 = este change, prerrequisito de la matriz N=2), `quality-gates` (FASE 1 COE → FASE 2, **no** tocado aquí), `coverage-tripwire-ratchet` (el ratchet sólo puede medir post-merge, §6.4), `tia-hardening` (`sequence.sequencer` **intacto**).
