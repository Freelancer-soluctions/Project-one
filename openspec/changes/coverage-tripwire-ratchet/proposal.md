# Proposal

## Why

El coverage tripwire existe **solo en CI**. `.husky/pre-push` corre `test:changed` sin `--coverage` y
`pre-commit` tiene cero referencias a coverage, así que un desarrollador no tiene forma de ejecutar el
gate antes de subir: descubre la regresión en un job que es FASE 1 advisory, es decir, después de
empezar a hacer cambios y sin que nada lo detenga. El piso es decorativo desde el punto de vista del
quien escribe el código.

El documento que describe esta estrategia (`docs/learning/coverage-tripwire-floor-ratchet.md`) se
contradice a sí mismo: su §6.1 defendería "floor bajo, granularidad alta", pero su §3.3 marca
`perFile`/glob como _pendiente_ y la implementación real solo tiene un piso global por workspace
(client 84/49/63/85, server 39/18/7/39). La práctica enterprise que el propio doc recomienda no está
implementada.

Además hay dos defectos concretos que hacen que el gate actual mienta:

- **El guard no ve la config granular.** `scripts/ci/check-coverage.mjs` solo lee `summary.total` y
  thresholds planos. Vitest 4.1.11 sí soporta `thresholds.perFile` y thresholds por glob de forma
  nativa; si alguien los configura, Vitest falla la corrida mientras el guard imprime `✅`. Dos
  aplicaciones del mismo gate discrepando.
- **El ratchet —la propiedad que define a esta estrategia— no es accionable.** `autoUpdate` está
  documentado pero no hay ningún comando que lo invoque, así que los pisos solo pueden bajar.

## What Changes

**Tier local (la brecha principal):**

- **`coverage:check` en la raíz**: un comando que corre la suite completa con coverage en ambos
  workspaces y pasa después `check-coverage.mjs` — el espejo local de los jobs `*-coverage`. Es
  barato: las suites miden 5-6s (server) y 14s (client), así que el gate real cuesta ~30s y no
  justifica el trato de "solo nightly".
- **`coverage:ratchet`**: acción local explícita que sube los pisos con `autoUpdate` de Vitest. El
  piso solo sube, y **nunca** en CI (la spec `ci-test-jobs-activation` ya prohíbe `autoUpdate` en CI;
  esto no lo toca).
- **Workflow documentado + tabla de paridad local↔CI**, para que el developer sepa qué comando
  replica cada job y cuál no, en vez de deducirlo.

**Granularidad (§3.3):**

- **Thresholds `perFile` y por glob** en los configs de workspace, **bajo** el piso global existente —
  floor bajo + granularidad alta, que es lo que §6.1 ya defendía.
- **`check-coverage.mjs` los evalúa** desde `coverage-summary.json`, que ya trae una entrada por
  archivo junto a `total`. Requiere normalizar las claves: hoy son **rutas absolutas del SO** (en
  Windows, con backslashes), que no casan con globs de estilo `src/utils/**`.

**Documentación:**

- Reestructurar el doc con **CI y local como dos tracks en paralelo**, en lugar de local como
  accesorio de un §5 que es íntegramente CI.
- Corregir el cross-reference roto en `docs/learning/unit-tests-enterprise.md:377`, que apunta a
  `docs/learning/ci-cd/coverage-tripwire-floor-ratchet.md` cuando el archivo vive en
  `docs/learning/`.

## Capabilities

### New Capabilities

- `local-coverage-tripwire`: el tripwire en el nivel del desarrollador — comando de verificación de
  suite completa con paridad con los jobs de CI, comando de ratchet que eleva pisos, workflow local
  documentado y la tabla de paridad local↔CI.
- `coverage-threshold-granularity`: la forma del contrato de thresholds — piso global más `perFile` y
  globs, y la obligación de que el guard evalué los tres niveles para no contradecir a Vitest.

### Modified Capabilities

- Ninguna. `ci-test-jobs-activation` es la dueña del contrato de artefacto y del guard en CI (y de D18);
  este change **extiende** lo que el guard evalúa sin alterar el flujo del artefacto, el
  `reportsDirectory` por workspace ni el diferimiento de D18. Ver _Non-Goals_.

## Non-Goals

- **Promoción FASE 1 → FASE 2** (quitar `continue-on-error`): es de `ci-testing-gate-promotion`, junto
  con su ventana de calibración. Aquí no se toca ningún `continue-on-error`.
- **Selección TIA y `coverage.changed`**: es de `tia-hardening`.
- **Sharding y Coverage Merge Gate**: sigue `N/A` con evidencia en `ci-testing-gate-promotion` (las
  suites miden 5-6s y 14s, muy por debajo de un umbral de activación de 5-8 min).
- **Cobertura en `.husky/pre-push`**: deliberadamente fuera. `pre-push` corre TIA diff-scoped, y bajo
  D18 un run parcial no puede evaluar umbrales globales; atar el gate ahí produciría un falso verde.
  El tier local es el comando explícito, no el hook.
- **Activación de `e2e`**: es otro change.

## Impact

- `package.json` (raíz) — `coverage:check`, `coverage:ratchet`.
- `apps/client/vitest.config.js`, `apps/server/vitest.config.js` — `perFile` y globs bajo el piso
  global; `autoUpdate` referenciado por el script de ratchet.
- `scripts/ci/check-coverage.mjs` — evalúa `perFile` y globs; normaliza claves de ruta a relativas al
  workspace con separadores `/` antes de casar globs.
- `.github/workflows/ci.yml` — sin cambios de flujo: los jobs `*-coverage` siguen invocando el mismo
  guard. El cambio es que el guard ahora puede fallar por granularidad, no solo por total.
- `docs/learning/coverage-tripwire-floor-ratchet.md` — reestructurado en tracks CI/local.
- `docs/learning/unit-tests-enterprise.md` — cross-reference corregido.
- **Sin cambios**: `.husky/*`, `vitest.shared.js`, los `continue-on-error`, y los changes
  `ci-testing-gate-promotion` / `tia-hardening` en vuelo.
