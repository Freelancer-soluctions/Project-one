# Proposal: pbt-candidate-locations

## Why

El change `pbt-hardening` cerró gaps de cobertura y spec drift, pero la adopción de PBT en el repo es aún parcial: solo 4 archivos de properties (3 server, 1 client) con 12 propiedades en total. El análisis del researcher (2026-11-06) identificó ~25 candidatos adicionales distribuidos en utils, parsers, schemas, services y store, priorizados por valor y testabilidad.

## What Changes

- Catalogar candidatos por capa (utils, parsers, schemas, services, store) en `docs/pbt-candidate-analysis.md`.
- Priorizar: alta (utils/parsers), media (schemas/services), baja (store).
- Implementar propiedades sobre SUT reales (no reimplementar lógica), incluyendo negativas.
- Mantener gate blocking, numRuns 100/1000, seed 42 en CI.

## Capabilities

### New Capabilities

- `pbt-candidate-locations`: catálogo de ubicaciones para PBT en el repo.

### Modified Capabilities

_(ninguna)_

## Impact

- `apps/server/src/utils/`, `apps/server/src/modules/*/schemas/`, `apps/server/src/modules/events/`, `apps/client/src/utils/`, `apps/client/src/modules/`, `apps/client/src/store/`.
- Archivos `*.property.test.*` nuevos.
