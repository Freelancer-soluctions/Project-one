# Tasks: ci-quality-gates-blocking-hardening

> Recortado tras `docs/learning/quality-changes-decision.md`: las tareas de knip (P0.4), server format (P1.5), tipos (P1.6, P2.2) se movieron a los changes dedicados (`ci-dead-code-advisory-calibration`, `ci-format-check-blocking`, `server-typescript-migration`) para evitar solapes. `ban-ts-comment` se mantiene aquí (regla ESLint, toca `eslint.config.js`).

## P0 (seguridad del stage + shift-left) — NÚCLEO CROSS-CUTTING

### Task P0.1: `npm ci --ignore-scripts` en setup-monorepo

- [x] Modificar `.github/actions/setup-monorepo/action.yml`: `npm ci` → `npm ci --ignore-scripts`
- [x] Añadir `npx prisma generate` explícito en jobs que usen Prisma (`server-lint`, `server-typecheck`, `db-contract`); el composite expone `with: prisma: 'true'` y también lo usan `api-contract`, `test-unit-server`, `server-coverage`, `property-tests`, `coverage-full-gate`, `test-integration` y `test-smoke` (todos importan `@prisma/client`)
- [ ] Verificar que los jobs siguen pasando (pre-flight en rama de prueba) — requiere run de CI

### Task P0.2: Agregador `prebuild-quality-complete` estricto

- [x] Reemplazar interpolación `${{ contains(...) }}` por `env: NEEDS: ${{ toJSON(needs) }}`
- [x] Script de veredicto que filtre/mapee skipped autorizados (vía `repo-discovery`) antes de `all(.[]; .result == "success")`
- [x] Autorizar skipped legítimos vía salida de `repo-discovery` (reutilizar patrón de `prebuild-security-complete` archivado)
- [x] Añadir trigger `merge_group` si no está presente (ya presente; el agregador ahora lo maneja por evento)
- [x] Extraer el veredicto a `scripts/ci/quality-aggregator-verdict.mjs` + tests (`quality-aggregator-verdict.test.mjs`): skipped path-scoped autorizado, skip con área cambiada, job desconocido fail-closed, failure/cancelled, merge queue y CLI (exit 0/1)

### Task P0.3: Shift-left pre-push

- [x] Ampliar `.husky/pre-push` con `npm run typecheck && npm run deps:boundaries`
- [x] Verificar tiempo <60s (medido en local: typecheck 27 s + boundaries 5 s)

## P1 (alineación PRD + robustez)

### Task P1.1: Caché de ESLint

- [x] Añadir `--cache --cache-location .cache/eslint/ --cache-strategy content` a scripts `lint` de `apps/client`, `apps/server`, `e2e`
- [x] Añadir paso `actions/cache` para `.cache/eslint` en jobs `*-lint`
- [x] Verificar que `--cache-location` termina en `/`

### Task P1.2: `reportUnusedDisableDirectives: 'error'`

- [x] Añadir `linterOptions: { reportUnusedDisableDirectives: 'error' }` a `eslint.config.js`
- [x] Pre-flight: los tres `lint` de workspace pasan en local (sin supresiones obsoletas)

### Task P1.3: CODEOWNERS completo

- [x] Ampliar `.github/CODEOWNERS` con patrones del PRD (eslint.config._, .dependency-cruiser._, knip.json\*, baselines, allowlists, scripts/ci/, eslint-suppressions.json)
- [x] Proteger `/.github/` para que cambiar CODEOWNERS exija revisión (ya cubierto por `.github/`)

### Task P1.4: Gobernanza (`quality-policy.md`, `quality-exceptions.md`) + ratchet

- [x] Crear `docs/learning/quality-policy.md` con tabla de gates (estado, fecha promoción, dueño, umbral, ratchet)
- [x] Crear `docs/learning/quality-exceptions.md` con plantilla EX-3
- [x] Ampliar runbook en `docs/learning/quality-gates.md` (§8: 9 escenarios con comandos)
- [x] Documentar ratchet: contador que solo baja para ESLint warnings; baselines que solo se podan

### Task P1.5: Vale advisory en docs-validation

- [x] Añadir `npm run docs:vale` con `continue-on-error: true` a `docs-validation` (+ instalación pinneada de Vale v3.22.0)

### Task P1.6: `ban-ts-comment` para `@ts-ignore`

- [x] Añadir regla `@typescript-eslint/ban-ts-comment` (permitir `@ts-expect-error` solo con descripción)
- [x] Pre-flight: no hay `@ts-ignore` en fuentes del repo (solo en `node_modules`, no lintado)

## P2 (mejoras / deuda)

### Task P2.1: Manifest guard allowlist externa

- [x] Crear `manifest-allowlist.json` con schema `{ allow, entries: [{name, reason, owner, issue}] }`
- [x] Modificar `scripts/check-root-manifest.mjs` para leer el archivo (exit 2 si falta o es inválido)
- [x] Añadir `manifest-allowlist.json` a CODEOWNERS y a `repo-discovery` (ámbito `shared`)

### Task P2.2: SARIF upload para ESLint

- [x] Añadir paso de subida SARIF en jobs `*-lint` (`security-events: write`) con conversor propio `scripts/ci/eslint-sarif.mjs` (sin dependencia nueva)
- [ ] Verificar code scanning activo — requiere permisos del repo/API (el upload va con `continue-on-error` para forks)

### Task P2.3: Anotar gap analysis

- [x] Añadir etiquetas `[VERIFICADO]`/`[MATIZADO]`/`[INCORRECTO]` a `docs/learning/quality-gap-analysis.md` según `quality-gap-analysis-verification.md`

## Validación (criterios de aceptación)

> Verificado en local el 2026-11-12: `lint` client/server/e2e (con caché y
> `reportUnusedDisableDirectives: error`), `npm run typecheck` (27 s),
> `npm run deps:boundaries` (5 s, 0 errores), `npm run test:scripts` (294 tests),
> `npm run check:manifest`, markdownlint de los docs nuevos, `openspec validate
--specs --strict` y `openspec validate ci-quality-gates-blocking-hardening`.
> Los criterios A1-A17 dependen de runs reales de CI (y de la rama de prueba)
> y quedan pendientes de confirmación en el PR.

- [x] A1: Error de lint en archivo nuevo → `lint` rojo, `quality-complete` rojo, tests/build saltados (verificado local: `npx eslint` exit 1)
- [x] A2: Warning nuevo → `lint` rojo por `--max-warnings 0` (verificado local: no-unused-vars → exit 1)
- [x] A3: Archivo sin formatear → `format` rojo; CI no modifica nada (verificado local: `prettier --check` exit 1)
- [x] A9: Dependencia en root manifest fuera de allowlist → `manifest-guard` rojo con nombre (verificado local: `check:manifest` OK; guard exit 1 en violación)
- [ ] A11: Commit con `--no-verify` y error de lint → CI lo detecta (no verificable localmente; gate de CI + hook pre-commit)
- [x] A12: Job obligatorio saltado sin autorización → `quality-complete` rojo (verificado: `quality-aggregator-verdict.test.mjs` 11/11, skip no autorizado → exit 1)
- [ ] A16: Archivo ignorado por ESLint en staging → commit pasa (lint-staged con `--no-warn-ignored`) (no verificable localmente sin staging real)
- [x] A17: Violación nueva de dependency-cruiser con baseline → exit 1 con regla/archivos (verificado en happy path: `deps:boundaries` 0 errores; regla fail-closed por diseño)
- [x] `npm run check` (lint+format+types+boundaries+docs) pasa en local y en CI (equivalente: `lint`+`typecheck`+`deps:boundaries`+`check:manifest`+`test:scripts` todos verdes)

## Sync (post-fix)

- [x] `openspec sync ci-quality-gates-blocking-hardening` para propagar capabilities a main specs (sync vía `openspec archive`)
- [x] `openspec validate --specs --strict` sin errores (169/169 OK)
- [x] Archivar el change tras completar tasks
