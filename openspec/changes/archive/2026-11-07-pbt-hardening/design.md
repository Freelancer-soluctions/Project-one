# Design: pbt-hardening

## Context

Gaps verificados por el review de PBT (2026-11-05). El gate es blocking (correcto); faltan propiedades de dominio, SUT real, negativas, artefacto en fallo y sync de specs.

## Goals / Non-Goals

**Goals:**

- Cerrar los 5 gaps como cambios definitivos (blocking).
- Sincronizar specs a la postura blocking.

**Non-Goals:**

- No cambiar el gate (ya blocking).

## Decisions

- **D1 — Invariantes de dominio**: crear propiedades sobre SUT disponible. Stock quantity >= 0 se valida vía `stockCreateSchema` (Joi min(0)); no existe helper real de stock/inventory ni lógica de idempotencia en attendance/service.ts, por lo que esos invariantes quedan fuera de alcance salvo que se implemente la lógica de dominio primero.
- **D2 — SUT real**: importar helpers de paginación, stock, dinero en los predicados.
- **D3 — Propiedades negativas**: valores inválidos → rechazados.
- **D4 — Artefacto en fallo**: upload-artifact + reporter junit/json en job property-tests.
- **D5 — Sync de specs**: actualizar delta y main spec a blocking.

## Decisions (CI gaps)

- **D6 — G2 resumen del job**: step `if: failure()` en `property-tests` (ci.yml) que extrae seed/path/counterexample del junit/json y los escribe en `$GITHUB_STEP_SUMMARY`. También subir como artefacto (mitigación de riesgo de irreproducibilidad).
- **D7 — G4 lint de pureza**: regla en `eslint.config.js` con `files: ['**/*.properties.unit.test.*']` y `no-restricted-globals`/`no-restricted-syntax` prohibiendo `Math.random`, `Date.now`, `fetch`, `axios`. Aplicada en CI.
- **D8 — G5 tope de descartes**: `maxSkipsPerRun: 50` en `fc.configureGlobal` de ambos setup files.
- **D9 — G6 regresión fijada**: casilla en `.github/PULL_REQUEST_TEMPLATE.md` Pre-merge Checklist + uso de `examples:` en propiedades existentes.
- **D10 — G7 exploración nocturna**: workflow programado (cron, offset anti-colisión) con `PBT_SEED` aleatoria, `numRuns` 1000-10000, time-box, `issues: write` para crear issue en fallo. Advisory por diseño del PRD (no bloquea merge).
- **D11 — PBT_SEED/PBT_NUMRUNS**: los setup files deben honrar env vars `PBT_SEED` y `PBT_NUMRUNS` con override sobre los defaults (42/1000 CI, 100 local).
