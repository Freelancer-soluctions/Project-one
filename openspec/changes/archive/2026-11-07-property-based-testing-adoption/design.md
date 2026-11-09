# Design

## Context

- fast-check fue **purgado** del manifest raíz en `9ae16e8f` (phantom dep): hoy 0
  dependencias, 0 propiedades; docs (`unit-tests-enterprise.md` §23.3, `panorama-resumen.md`:45)
  aún afirman "3.23.2 instalado, 0 usos".
- Stack de tests: Vitest 4.1.11 (root), naming `*.unit.test.js` (server, `tests/unit/` +
  colocated) / `*.unit.test.{js,jsx}` (client); setupFiles `apps/server/tests/setupTest.js`
  y `apps/client/tests/setup/setupTest.js`; ambos configs merged con `vitest.shared.js`;
  `vitest.scoped.config.js` (TIA `test:changed:ci`/`test:tia`) importa el config base y
  spread `base.test` → hereda `setupFiles`.
- Validación: server **Joi — 24 schemas** (22 `src/modules/*/schemas/*.joi.js` +
  `src/utils/joiSchemas/joi.js` + `src/socket/events/schemas.js`); client **zod ^3.23.8 —
  22 schemas** (`src/modules/*/utils/schema.js`; de los 23 ficheros que importan zod,
  `src/config/zod-i18n.js` no es un schema).
- CI: STAGE 2 PRE-Build SUBSTAGE 2D (`test-unit-*` etc., FASE 1 `continue-on-error: true`) →
  agregador `prebuild-unit-tests-complete` con contrato de **exactamente 6 `needs`** (spec
  `ci-prebuild-substage-structure`, verificado por `ci-testing-gate-promotion` y
  `client-snapshot-testing`).
- Ownership en vuelo (nunca duplicar): `ci-testing-gate-promotion` (FASE 1→2, `needs`),
  `ci-test-impact-analysis` (TIA/changed-only — spec canónico
  `openspec/specs/ci-test-impact-analysis/spec.md`), `smart-test-ordering` (sequencer),
  `test-sharding` (matrix), `client-snapshot-testing` (keys vitest.config.js + scripts
  `test:snapshot*`).

## Goals / Non-Goals

**Goals:**

- Reinstalar PBT como devDeps de workspace (server + client), con setup determinista CI/local.
- Primeras propiedades de alto valor: Joi/zod validators, leyes de sorting/paginación,
  invariantes stock/asistencia, monetario bigInt.
- Job CI advisory < 1-2 min en STAGE 2 Prebuild que **no** rompa el contrato de 6 jobs.
- Corrección lockstep de los dos docs desactualizados.

**Non-Goals:**

- Promover ningún test job a FASE 2 blocking (→ `ci-testing-gate-promotion`).
- Model-based testing full state-machine (stock/asistencia se cubren primero con invariantes
  simples; `fc.commands` queda como evolución posterior).
- TIA/changed-only específico para PBT (viaja gratis con los `*.unit.test.*` existentes →
  `ci-test-impact-analysis`), sharding/sequencing de properties (`test-sharding`,
  `smart-test-ordering`).
- Modificar specs existentes salvo el delta puntual de `ci-prebuild-substage-structure`
  (header 2D + enumeración del job nuevo); el resto se citan como constraints, cero deltas.

## Decisions

**D1 — devDeps por workspace, jamás en root; solo `fast-check@4` (sin paquetes auxiliares).**
`fast-check@4` en `apps/server` y `apps/client` como única devDep de PBT; root solo gana el
script delegador `test:pbt` (`--workspaces --if-present`, patrón de
`standardized-test-naming`). Alternativas descartadas:

- **root devDep** → es exactamente el phantom dep purgado en `9ae16e8f`.
- **`zod-fast-check`** → su peer `fast-check: '>2.23.0 <4.0.0'` es incompatible con
  fast-check@4 (y exige zod ^3.18): instalarlo obligaría a anidar un segundo fast-check@3
  (phantom anidado, la misma lección de `9ae16e8f`) o a divergir en majors entre workspaces
  (server @4 / client @3). Se descarta: los arbitraries zod se escriben a mano con
  `fc.record`/`fc.letrec` desde las 22 formas de schema (D6).
- **`@fast-check/vitest`** → todas las recetas usan `fc.assert` dentro de `it()`; el
  paquete quedaría sin uso y knip (advisory `*-dead-code`) lo reportaría. Si una property
  de 1000 runs en CI supera el timeout por defecto de Vitest, se pasa timeout explícito al
  `it()` (`it(name, fn, 30_000)`) — no requiere el paquete; `test.prop` queda como
  evolución si se necesita timeout-sync estructurado.

**D2 — `configureGlobal` en los setupFiles existentes (no setupFile nuevo ni config nueva).**

```js
import fc from 'fast-check';
fc.configureGlobal({
  numRuns: process.env.CI ? 1000 : 100,
  ...(process.env.CI ? { seed: 42 } : {}),
});
```

Alternativas: (a) `--seed` por script → requiere tocar cada script CI/local y se olvida en
nuevos tests; (b) `vitest.shared.js` → toca ambos workspaces desde root, pero el setupFile ya
es el punto único por workspace y centraliza el `process.env.CI`. Se propaga a todos los
tests vía `readConfigureGlobal()` cuando un test quiera extender sin perder defaults.
**Wiring verificado en todas las variantes de config** (task 1.2): `vitest.config.js`
declara `test.setupFiles`, y los `vitest.scoped.config.js` de TIA importan el base con
`{ ...base.test }` → heredan `setupFiles`; `vitest.smoke.config.js` lo declara aparte.
Sin esta verificación, `configureGlobal` no se aplicaría (silenciosamente) en los runs
scoped `--changed` donde viajan las properties.

**D3 — properties dentro del naming `*.unit.test.js(x)` existente.**
Sin glob, config ni script de descubrimiento nuevo: corren con `test:unit`, viajan con TIA
changed-only y con `test:pbt` (filtro de archivos propio, ver D4). Alternativa (patrón
`.pbt.test.js` separado) descartada: añadiría globs en vitest.config.js — zona de colisión
con `client-snapshot-testing`.

**D4 — `test:pbt` = filtro por subfijo de nombre, mismo runner.**
Las suites de propiedades se nombran `*.properties.unit.test.js(x)` (subfijo delante del
sufijo estándar; sigue calzando el glob `*.unit.test.*` → se descubren solos y cumplen
`standardized-test-naming`). Entonces `apps/*/package.json` define
`"test:pbt": "vitest run \".properties.unit.test\""` y el root delega con
`--workspaces --if-present`. Mismo runner/config/reporters que los unit tests y la
cuarentena `vitest-flaky-reporter.mjs` disponible sin wiring extra. Como `vitest run` sale
1 con 0 ficheros que matcheen, la humo-property **vive en G1** (task 1.5) antes de wirear
CI; si el filtro fallase, el fallback previsto es delegar a `test:unit`. Alternativas
descartadas: naming propio `.pbt.test.js` → exigiría tocar `include` en vitest.config.js
(zona de colisión con `client-snapshot-testing`); runner/jobs separados → pierden reporters,
cuarentena y el viaje gratis con TIA. Colisión con `client-snapshot-testing`: cero — sus
scripts son `test:snapshot*`, este es `test:pbt`.

**D5 — Job CI advisory standalone: sin bridge y sin tocar los 6 `needs`.**
Nuevo job `property-tests` (SUBSTAGE 2D) con `name: 'Tests: Property Tests'` (prefijo
`Tests:` exigido por `ci-prebuild-substage-structure`), `continue-on-error: true` (FASE 1,
patrón idéntico a los 6 jobs), `if:` con el mismo filtro `repo-discovery` + `pull_request`,
`needs: repo-discovery`, seed 42 por `CI=true` y `timeout-minutes: 5` (presupuesto < 1-2
min). El job **no entra en el `needs` de ningún job** (tampoco del agregador
`prebuild-unit-tests-complete`): el contrato de exactamente 6 `needs` queda intacto
job-only y el resultado PBT se ve como check propio advisory. Descartado el puente
`pbt-advisory-bridge`: notificar desde `needs.*.result` no está verificado bajo job-level
`continue-on-error`, y un job extra obligaría a documentar nombre/promoción como excepción
en `ci-prebuild-substage-structure`. El header `# SUBSTAGE 2D: UNIT TESTING — …` se amplía
para enumerar `property-tests` y el escenario de prefijos `Tests:` lo incluye — delta
MODIFIED de `ci-prebuild-substage-structure` incluido en este change (lockstep verificado
en G3 y G4). FASE 2 para el PBT queda fuera: cuando `ci-testing-gate-promotion` promocione,
decide si el job advisory pasa a bloqueante.

**D6 — Receta Joi-driven y zod escrita a mano, sin helpers compartidos nuevos.**
Server: arbitraries candidatos `.map(cand => schema.validate(cand, {convert:true,
stripUnknown:true}).value)` por schema (receta §3.5.1) sobre los 24 Joi — helpers locales
en el test, no una librería de arbitraries (evita over-engineering; se extrae solo si se
repite 3+ veces). Client: arbitraries a mano con `fc.record`/`fc.letrec` espejando las
formas de los 22 schema zod (`schema.safeParse(v).success === true`) — `zod-fast-check`
descartado por D1 (peer incompatible con fast-check@4). Monedas: `fc.bigInt` minor units
siempre.

## Risks / Trade-offs

- [Property demasiado lenta rompe el presupuesto < 1-2 min] → `numRuns` 1000/100 central,
  revisión de duración por property en G3; si una excede, dividirla, bajar runs (nunca
  `numRuns` enorme en PR) o timeout explícito en el `it()` (D1).
- [Filtro `.properties.unit.test` vacío → `vitest run` sin tests falla con exit 1] → la
  humo-property vive en G1 (task 1.5, gate de cierre del grupo) antes de wirear CI;
  verificar `npm run test:pbt` exit 0 ahí mismo.
- [Phantom dep recurrente si alguien añade fast-check al root, o reintroduce
  `zod-fast-check`/`@fast-check/vitest`] → verificación G5 (tasks 1.1/5.2): grep de
  `"fast-check"` en root → 0 matches, y de helpers en workspaces → 0 matches.
- [Property flaky ensucia CI advisory] → misma vía de cuarentena que los tests flaky
  (`vitest-flaky-reporter.mjs`), retry silencioso prohibido por spec.
- [Colisión de ownership en ci.yml] → los tasks de G3 solo añaden el job standalone (sin
  bridge, sin `needs` nuevos) y verifican que `needs` = 6 y que ningún
  `continue-on-error`/TIA/sequencer/sharding existente cambió.
- [Docs/specs quedan desincronizados tras archive] → G4 es condición de verificación (grep
  de la frase desactualizada → 0 matches; header 2D ↔ delta MODIFIED).

## Migration Plan

1. G1 (deps + setup + scripts + humo-property) → commit: los suites existentes no cambian
   de comportamiento (solo aparece `configureGlobal`; la humo-property prueba el filtro
   `test:pbt`).
2. G2 (primeras properties) → corren local primero (`test:pbt`), luego en CI con el resto.
3. G3 (job advisory) → PR con el job standalone + header 2D; rollback = eliminar el job y
   revertir el header (los 6 jobs y el agregador jamás se tocaron, así que rollback es
   quirúrgico).
4. G4 (docs) + G5 (verificación global).
   Rollback general: quitar devDeps + scripts + job; las properties se eliminan por archivo.

## Open Questions

- ¿Debe `test:pbt` incluir también la suite completa como fallback (alias de `test:unit`)
  en lugar del filtro por subfijo? No cambia specs ni task breakdown: D4 lo resuelve con el
  filtro + humo-property en G1; si el filtro falla en G1 se usa el fallback ya previsto.
