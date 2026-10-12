# Proposal

## Why

El repo declaró property-based testing (PBT) como gap P2 pero fast-check fue purgado como
phantom dep (commit `9ae16e8f`): hoy hay **0 dependencias de PBT, 0 propiedades y docs
desactualizados** que afirman "`fast-check@3.23.2` instalado, 0 usos"
(`docs/learning/unit-tests-enterprise.md` §23.3:329, `docs/learning/panorama-resumen.md`:45).
Sin reinstalación no existe ninguna propiedad que cubra invariantes de dominio (stock >= 0,
asistencia idempotente, cálculo monetario en minor units), parsers ni round-trips de
validadores Joi/zod — precisamente las clases de bug que los unit tests example-based no
detectan. La investigación `docs/learning/property-based-testing.md` (§5) deja el plan de
adopción en 5 pasos listo para ejecutar.

## What Changes

- **Reinstalar PBT**: `fast-check@4.x` como única devDep de PBT en los workspaces que
  generen properties (server, client) — nunca en el manifest raíz (evita repetir el phantom
  dep purgado en `9ae16e8f`). Sin paquetes auxiliares: `zod-fast-check` queda descartado
  (su peer `fast-check: '>2.23.0 <4.0.0'` es incompatible con fast-check@4 → forzaría un
  fast-check@3 anidado — misma lección de `9ae16e8f` — o divergencia de majors entre
  workspaces) y `@fast-check/vitest` queda descartado (todas las recetas usan `fc.assert`
  dentro de `it()`; el paquete quedaría sin uso y knip lo reportaría). Los arbitraries zod
  se escriben a mano con `fc.record`/`fc.letrec` desde las **22** formas de schema del
  cliente (los 23 ficheros que importan zod menos `zod-i18n.js`, que no es un schema).
- **Setup global**: `fc.configureGlobal({ numRuns: process.env.CI ? 1000 : 100, ...(CI ?
{ seed: 42 } : {}) })` en el setupFile de cada workspace (patrón de la §4.2 del doc),
  heredado también por los `vitest.scoped.config.js` de TIA (`--changed`), sin tocar cada
  test.
- **Script `test:pbt`** en `apps/server/package.json` y `apps/client/package.json` (no
  colisiona con los `test:snapshot*` de `client-snapshot-testing`) + alias root `test:pbt`
  delegando con `--workspaces --if-present` (std `standardized-test-naming`).
- **Primeras propiedades** en naming `*.unit.test.js(x)` existente: server — Joi-driven
  arbitrary (§3.5.1) sobre los **24** validators Joi reales (22 `*.joi.js` de módulo +
  `utils/joiSchemas/joi.js` + `socket/events/schemas.js`) + lógica pura (sorting/
  paginación, stock >= 0, asistencia idempotente, monetario `fc.bigInt`); client — zod
  round-trip con arbitraries escritos a mano (§3.5.2).
- **CI advisory**: nuevo job `property-tests` en STAGE 2 PRE-Build (SUBSTAGE 2D, `name:
'Tests: Property Tests'`, patrón FASE 1 `continue-on-error: true`, presupuesto < 1-2 min,
  seed 42) **standalone**: no entra en el `needs` de ningún job, así que el contrato de
  exactamente 6 jobs del agregador `prebuild-unit-tests-complete` queda intacto job-only y
  el resultado se ve como check propio advisory — sin bridge (`pbt-advisory-bridge`
  descartado: notificar desde `needs.*.result` no está verificado bajo job-level
  `continue-on-error`). El header `# SUBSTAGE 2D: UNIT TESTING` se amplía para enumerar el
  job (delta MODIFIED de `ci-prebuild-substage-structure`, lockstep en G3/G4).
- **Docs lockstep**: corregir la afirmación desactualizada en
  `unit-tests-enterprise.md` §23.3 (líneas 29, 329, 356) y `panorama-resumen.md`:45
  ("3.23.2 instalado" -> estado real de reinstalación + propiedades).

## Capabilities

### New Capabilities

- `property-based-testing`: adopción de PBT — instalación/versión de dependencias (solo
  `fast-check@4` por workspace, sin helpers), setup global determinista (numRuns 100/1000,
  seed 42 en CI, aplicado en todas las variantes de config), calidad de propiedades
  (fuertes, sin mutación de inputs, constraints > filter, `fc.bigInt` para dinero), wiring
  CI advisory standalone con presupuesto < 1-2 min y presupuesto de reproducibilidad
  (replay vía `fc.assert({seed, path, endOnFailure: true})`, nunca por flags CLI de Vitest
  — cuarentena de flaky properties, retry silencioso prohibido).

### Modified Capabilities

- `ci-prebuild-substage-structure`: el header `# SUBSTAGE 2D: UNIT TESTING` enumera el
  nuevo job `property-tests` y el escenario de prefijos `Tests:` lo incluye en la
  enumeración de SUBSTAGE 2D. Los `needs` del agregador (6 jobs), los `name:`/`if`/
  `continue-on-error` de los jobs existentes y la composición de los demás substages
  quedan intactos.

## Impact

- **Dependencias**: `apps/server/package.json`, `apps/client/package.json` (+ lockfile) —
  `fast-check@4` como devDep de cada workspace; el root `package.json` solo gana el alias
  `test:pbt` delegado.
- **Setup**: `apps/server/tests/setupTest.js`, `apps/client/tests/setup/setupTest.js` —
  bloque `fc.configureGlobal` condicionado a `process.env.CI` (heredado por los
  `vitest.scoped.config.js` vía spread de `base.test`).
- **Tests nuevos**: primeras suites de propiedades colocadas junto al código / en
  `tests/unit/` según el naming vigente (ambos workspaces ya coleccionan `*.unit.test.*`
  por glob).
- **CI**: `.github/workflows/ci.yml` — job advisory nuevo en SUBSTAGE 2D (name `Tests:
Property Tests`, header 2D enumerado; sin bridge — no entra en ningún `needs`); **no** se
  tocan `continue-on-error`/FASE 1 de los 6 jobs existentes (ownership
  `ci-testing-gate-promotion`), ni TIA/changed-only (spec canónico
  `openspec/specs/ci-test-impact-analysis/spec.md`), ni sequencer/ordering
  (`smart-test-ordering`), ni matrix/sharding (`test-sharding`), ni scripts/keys de
  snapshot (`client-snapshot-testing`).
- **Docs**: `unit-tests-enterprise.md`, `panorama-resumen.md` (corrección lockstep);
  el gap P2 de §23.3 pasa de "sin implementar" a "adopción en marcha".
