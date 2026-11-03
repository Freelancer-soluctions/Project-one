# Tasks

## Phase 0 — Baseline (sin cambios de código)

- [ ] 0.1 Verificar el estado actual: Stryker no instalado, sin workflow de ratchet programado, exclusion budget no tracked. Anotar baseline.
- [ ] 0.2 Confirmar que los 4 specs nuevos/modificados y el design están completos.

## Phase 1 — Objective y per-type config schema

- [ ] 1.1 Añadir bloque `objective` (4 métricas) junto a `thresholds` en ambos workspace configs. Verificar que el guard valida `objective >= floor`.
- [ ] 1.2 Añadir soporte de per-type thresholds (`thresholds.unit` / `thresholds.integration`) en el guard con fallback flat. Verificar backward compatibility.
- [ ] 1.3 Añadir selector `--type` al guard (`check-coverage.mjs`). Verificar que nombra el tipo en la salida.
- [ ] 1.4 Añadir tests para objective validation y per-type selection. Verificar que fallan si se revierte.

## Phase 2 — Exclusion budget (advisory)

- [ ] 2.1 Crear `scripts/ci/coverage-exclusion-budget.mjs` que cuente `coverage.exclude` + istanbul-ignore markers. Verificar que reporta counts.
- [ ] 2.2 Crear baseline de exclusiones versionado. Verificar formato.
- [ ] 2.3 Wirear en modo advisory en CI. Verificar que reporta sin fallar.
- [ ] 2.4 Añadir tests para el budget script. Verificar.

## Phase 3 — Mutation testing

- [ ] 3.1 Añadir dependencia Stryker a devDependencies. Verificar instalación.
- [ ] 3.2 Crear config de Stryker scoped a critical paths. Verificar que corre.
- [ ] 3.3 Crear workflow nocturno de mutation testing con baseline recording. Verificar que registra baseline en primera corrida.
- [ ] 3.4 Añadir reporte de supervivientes por nombre + artifact. Verificar.
- [ ] 3.5 Añadir script `mutation:test` para reproducción local. Verificar.

## Phase 4 — Scheduled ratchet

- [ ] 4.1 Crear workflow `coverage-ratchet-monthly.yml` (cron) que proponga PR con floor raises. Verificar que no usa autoUpdate.
- [ ] 4.2 Implementar lógica de detección de PR abierto para evitar duplicados. Verificar.
- [ ] 4.3 Verificar que no-op cuando no hay floors que subir.

## Phase 5 — Exclusion budget blocking

- [ ] 5.1 Transicionar exclusion budget de advisory a blocking (después de calibración). Verificar.
- [ ] 5.2 Añadir excepciones auditables (reason + owner + date). Verificar.

## Phase 6 — Mutation regression blocking

- [ ] 6.1 Activar bloqueo por regresión (después de baseline registrado). Verificar.
- [ ] 6.2 Verificar que timeout/degradación explícita funciona (tool-broken ≠ regresión).

## Phase 7 — Validación

- [ ] 7.1 Ejecutar `openspec validate --change coverage-tripwire-change-b --strict`. Verificar que pasa.
- [ ] 7.2 Ejecutar tests de todos los scripts nuevos. Verificar.
- [ ] 7.3 Ejecutar `npm run docs:lint`. Verificar.
- [ ] 7.4 Sync specs a `openspec/specs/` y archivar el change. Verificar.

## Phase 8 — Critical fixes (C1-C4 from planner review)

- [ ] 8.1 (C1) Mover `objective` y per-type thresholds fuera de `coverage.thresholds` (named export o policy file). Verificar que Vitest no los interpreta como globs.
- [ ] 8.2 (C1) Actualizar guard para leer objective/per-type desde la nueva ubicación. Verificar que el guard valida `objective >= floor`.
- [ ] 8.3 (C2) Redefinir regla no-rewrite: "no CI process rewrites threshold configuration on main or in blocking job"; bot-branch PR es propuesta, no rewrite. Verificar en spec y design.
- [ ] 8.4 (C3) Especificar token strategy (GitHub App token como en release.yml) y firma para bot PRs. Verificar que el commit satisface required_signatures.
- [ ] 8.5 (C4) Crear `stryker-baseline.json` versionado con lifecycle: missing → record + exit 0; corrupt → fail distinct. Verificar ambos casos.
- [ ] 8.6 (m1) Limpiar sección "Deferred capability" del main spec coverage-ratchet-governance (superseded por ADDED requirement). Verificar.
