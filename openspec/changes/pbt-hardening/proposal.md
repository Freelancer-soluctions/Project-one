# Proposal: pbt-hardening

## Why

El change `property-based-testing-adoption` está implementado y el gate es blocking, pero la cobertura de propiedades es parcial y los specs están desactualizados (dicen advisory, es blocking). Gaps verificados por el review (2026-11-05):

1. Invariantes de dominio ausentes: stock ≥ 0, idempotencia check-in/out (task 2.2 marcada [x] falsamente).
2. Properties sin SUT real: paginación reimplementada en el test, `money` = conmutatividad genérica de bigInt.
3. Sin propiedades negativas (solo se afirma que valores válidos pasan).
4. Sin artefacto en fallo ni reporter estructurado (task 3.1).
5. Drift de specs: delta y main spec dicen advisory, implementación es blocking.

## What Changes

- Añadir invariantes de dominio (stock, idempotencia) sobre SUT reales.
- Reapuntar sort/pagination/money a helpers reales del repo.
- Añadir propiedades negativas (valores inválidos → rechazados).
- Añadir upload-artifact en fallo + reporter junit/json al job property-tests.
- Sincronizar specs a la postura blocking real.
- Archivar el change original `property-based-testing-adoption`.

## Capabilities

### New Capabilities

- `pbt-hardening`: cierre de gaps de cobertura y spec drift de PBT.

### Modified Capabilities

_(ninguna)_

## Impact

- `apps/server/tests/unit/properties/*.properties.unit.test.ts`
- `apps/client/src/properties/*.properties.unit.test.js`
- `.github/workflows/ci.yml` (job property-tests)
- `openspec/specs/property-based-testing/`, `openspec/specs/ci-prebuild-substage-structure/`
