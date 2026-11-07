# Design: pbt-candidate-locations

## Context

Análisis del researcher (2026-11-06) identificó ~25 candidatos para PBT distribuidos en 5 capas. La infraestructura PBT ya existe (fast-check, setup global, gate blocking, numRuns/seeds).

## Goals / Non-Goals

**Goals:**

- Catalogar candidatos por capa y prioridad.
- Definir invariantes propuestas por candidato.
- Establecer estrategia (numRuns, seeds, gate, archivos).

**Non-Goals:**

- No implementar código en este change (solo catálogo y plan); la implementación va en changes separados por capa.

## Decisions

- **D1 — Priorización**: alta (utils, parsers), media (schemas, services), baja (store).
- **D2 — Testabilidad**: solo funciones puras/semi-puras; async-DB dependientes excluidas.
- **D3 — Naming**: `*.properties.unit.test.*` (server: `tests/unit/properties/`, client: `src/properties/` o colocado), coherente con los scripts `test:unit`/`test:pbt` y los archivos existentes.
- **D4 — Semi-pura**: una función es semi-pura si no accede a DB/IO y sus dependencias de entorno (sessionStorage, cheerio, Intl) son inyectables o mockeables en el test. Funciones async con I/O real se excluyen.
- **D4 — Gate**: blocking (ya implementado en `property-tests` job).
