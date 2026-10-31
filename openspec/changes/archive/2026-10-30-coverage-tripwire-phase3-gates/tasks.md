# Tasks

## Atomic PR 1 — Phase 0–2: Baseline, critical paths y ratchet

> Esta entrega cierra las fases 0–3 y 5–6. La Fase 2.5 (ratchet programado) y la Fase 4 (mutation testing) se difieren a Change B y no se implementan aquí.

## Phase 0 — Baseline (sin cambios de código)

- [x] 0.1 Ejecutar `npm run coverage:check` en ambos workspaces y guardar la salida como baseline de exit codes (verde). Verificar que el comando y sus exit codes quedan anotados para comparar en fases posteriores.
- [x] 0.2 Medir por módulo la cobertura desde `coverage-summary.json` (entradas por archivo) e identificar los 9 módulos críticos sin tests (`auth`, `permission`, `users`, `payroll`, `sales`, `inventoryMovement`, `stock`, `warehouse`, `expenses`) con su recuento de ficheros fuente. Verificar que la lista y los números medidos quedan en el PR.

## Phase 1 — Pisos por critical path

- [x] 1.1 Crear `scripts/ci/coverage-critical-paths.mjs` que cargue y valide la declaración versionada de caminos críticos (path → floor por métrica). Verificar que falla si un path carece de floor.
- [x] 1.2 Crear el fichero de política versionada de critical paths (p. ej. `.coverage-critical-paths.json`) con floors medidos donde existan (o `exempt` con reason + owner + expiry). Verificar que el script lo valida.
- [x] 1.3 Crear explícitamente las 55 entradas exentas (9 módulos críticos × sus archivos fuente medidos), cada una con motivo, responsable y fecha de expiración. Verificar recuento exacto, unicidad y metadatos completos.
- [x] 1.4 Extender `scripts/ci/check-coverage.mjs` para evaluar el nivel critical-path junto a global / perFile / globs. Verificar que un camino crítico sin tests es un rojo explícito.
- [x] 1.5 Añadir tests en `scripts/ci/check-coverage.test.mjs` para: per-file breach, successful glob match, negative threshold, path normalization, critical-path breach. Verificar que fallan si se revierte la implementación. (14 tests entre las suites de coverage guard y policy.)

## Phase 2 — Gobernanza del ratchet

- [x] 2.1 Crear `scripts/ci/coverage-baseline.mjs` que lea el baseline versionado y detecte umbrales bajados sin excepción auditable. Verificar que un lowering sin excepción falla.
- [x] 2.2 Crear el fichero de baseline versionado (p. ej. `.coverage-baseline.json`) con los pisos actuales y la excepción grandfathered del client (`87.02/… → 64.44/…`, motivo + responsable). Verificar formato.
- [x] 2.3 Añadir entradas en `.github/CODEOWNERS` para `apps/*/vitest.config.*` y `scripts/ci/check-coverage.mjs` bajo devops-team. Verificar que un PR que toque esos archivos requiere review de devops-team.
- [x] 2.4 Crear job `coverage-floor-guard` en `.github/workflows/ci.yml` que ejecute el baseline check y propague al agregador de tests. Verificar que un PR que baje un umbral falla.
- [x] 2.5 **Diferido a Change B (sin implementación en este change):** el ratchet programado no se añade ni modifica thresholds dentro de un job bloqueante.
- [x] 2.6 Añadir script de verificación de cifras del doc canónico (`docs/learning/coverage-tripwire-floor-ratchet.md`) contra la config. Verificar que cifras desactualizadas fallan.

## Phase 3 — Punto de enforcement bloqueante

- [x] 3.1 Crear job `coverage-full-gate` en `.github/workflows/ci.yml` que evalúe el piso sobre cobertura de suite completa y propague al agregador de tests. Verificar que un floor rojo bloquea.
- [x] 3.2 Ajustar `nightly-full-suite.yml` para que los steps `Report coverage thresholds (advisory)` dejen de tragarse el fallo (`|| echo "::warning::…"`) y pasen a evaluar el piso bloqueante. Verificar que un rojo falla el nocturno.
- [x] 3.3 Verificar que el lane diff-scoped (D18) no cambia: `check-coverage.mjs --advisory` sigue difiriendo. Verificado por los tests de contrato del guard y sin cambios en el lane TIA.

## Phase 4 — Mutation testing (Diferido a Change B; no implementar aquí)

- [x] 4.1 **Diferido a Change B (sin implementación en este change):** no se añade dependencia de mutation testing.
- [x] 4.2 **Diferido a Change B (sin implementación en este change):** no se añade configuración de mutation testing.
- [x] 4.3 **Diferido a Change B (sin implementación en este change):** no se añade mutation testing al workflow nocturno.

## Phase 5 — Paridad local + docs

- [x] 5.1 Verificar que `npm run coverage:check` es el espejo del veredicto bloqueante de suite completa. Verificado: suite completa verde y tests del guard confirman exit 1 para floor rojo.
- [x] 5.2 Actualizar `docs/learning/coverage-tripwire-floor-ratchet.md` §3.3 con cifras verificadas contra la config y el nivel critical-path. Verificado por `coverage:docs:verify`.
- [x] 5.3 Actualizar `docs/learning/coverage-tripwire-floor-ratchet.md` con el punto de enforcement y la paridad local↔CI.

## Phase 6 — Validación

- [x] 6.1 Reordenado desde Phase 0: ejecutar `openspec validate --change coverage-tripwire-phase3-gates --strict`. Verificar que pasa.
- [x] 6.2 Ejecutar `npm run docs:lint` sobre los docs tocados. Verificar que no introduce errores nuevos.
- [x] 6.3 Confirmar que ningún `continue-on-error` fue modificado y que `prebuild-tests-complete.needs` solo añade los dos nuevos jobs. Verificar con diff.
- [x] 6.4 Sincronizar los delta specs implementados con `openspec/specs/` usando `openspec sync` y validar los specs.
- [x] 6.5 Archivar el change completado con `openspec archive` una vez cerradas todas las fases y validaciones.
