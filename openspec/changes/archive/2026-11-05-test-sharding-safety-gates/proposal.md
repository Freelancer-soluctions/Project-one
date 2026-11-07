# Proposal: test-sharding-safety-gates

## Why

El PRD de Test Sharding define gates de seguridad que son independientes del sharding en sí y que faltan hoy: `forbidOnly`/`allowOnly` (RI-10), comando local reproducible `--shard=2/4` (RI-9), y gate de conteo de tests (A5). Sin `forbidOnly`, un `.only` olvidado reduce la suite sin que nadie lo note.

## What Changes

- Añadir `allowOnly: false` en CI a los configs de Vitest (client y server).
- Añadir `forbidOnly: !!process.env.CI` al config de Playwright.
- Documentar el comando local `--shard=2/4` en `docs/learning/test-sharding.md`.
- Añadir un gate de conteo de tests (serial vs shardeado) cuando se active el sharding.

## Capabilities

### New Capabilities

- `test-sharding-safety-gates`: gates de seguridad RI-9, RI-10 y A5.

### Modified Capabilities

_(ninguna)_

## Impact

- `apps/client/vitest.config.js`, `apps/server/vitest.config.ts`, `e2e/playwright.config.js`.
- `docs/learning/test-sharding.md`.
