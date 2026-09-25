# Proposal

## Why

Umbrales de complejidad planos (max 20 para todo) dan feedback débil: código core admite demasiadas ramas, utilidades no se diferencian, y tests arrastran reglas de producción. Además el workspace `e2e` no tiene lint (gap: script `lint` ausente, sin bloque en `eslint.config.js`, sin job en CI) y `docs/learning/eslint-configuration.md` tiene líneas desactualizadas (recuentos de líneas/bloques del config, estado de los jobs `*-complexity`).

## What Changes

- Umbrales de `complexity` por capa en `eslint.config.js`: **core 15** (todo código de producción bajo `apps/*/src`), **utils 10**, **tests off**, eliminando los dos bloques legacy max 20; con comentarios en español que documentan qué y por qué.
- Añadir `max-lines-per-function` **sin** usar la opción `ignorePattern` — `['error', { max: 80, skipBlankLines: true, skipComments: true }]` en el bloque core; las exenciones se resuelven con bloques `files`/`ignores` de Flat Config, `off` en tests, o con `eslint-disable` documentado.
- Añadir script `lint` al workspace `e2e`, bloque de config correspondiente en `eslint.config.js` y job `e2e-lint` en `.github/workflows/ci.yml`.
- Actualizar `docs/learning/eslint-configuration.md` (líneas desactualizadas: §2 recuentos, §4.5 tabla de jobs CI, refs de umbrales).
- Crear `docs/learning/eslint-complexity-configuration.md` (español) explicando la implementación por capas.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `config-correctness`: los requirements de umbral de complejidad pasan de un único max 20 por workspace a umbrales por capa (core 15 = todo `src` de producción / utils 10 / tests off), se añade `max-lines-per-function` sin `ignorePattern`, y se formaliza el lint del workspace `e2e` (script + bloque + job CI).
- `ci-prebuild-substage-structure`: el agregador `prebuild-quality-complete` pasa de depender de exactamente 13 jobs de la Substage 2B a 14 (se añade `e2e-lint`).

## Impact

- `eslint.config.js` (bloques complexity + nuevo bloque e2e + max-lines-per-function).
- `e2e/package.json` (script `lint`).
- `.github/workflows/ci.yml` (job `e2e-lint` en Substage 2B; añadido a los `needs` del agregador `prebuild-quality-complete`, 13 → 14 jobs).
- `docs/learning/eslint-configuration.md` (edición de líneas obsoletas).
- `docs/learning/eslint-complexity-configuration.md` (nuevo, ES).
- Posible refactor puntual si alguna función core supera 15 o utils supera 10 (mitigado con ajuste o `eslint-disable` justificado).
