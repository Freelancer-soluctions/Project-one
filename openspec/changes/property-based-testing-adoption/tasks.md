# Tasks

> Gated sequencing: cada grupo G(N+1) NO empieza hasta que G(N) esté verificado
> (`openspec show` no aplica aquí — la verificación es la del último task del grupo).
> Labels: `[LOCAL]` = verificable en win32 git-bash sin CI · `[CI]` = requiere corrida de
> PR/workflow. Cada task trae verificación inline.

## G1 — Dependencias + setup + scripts + humo-property (fundación)

- [ ] 1.1 `devDependencies` de PBT por workspace — solo `fast-check` (sin helpers):
      `npm install -D fast-check@4 --workspace=apps/server` y
      `npm install -D fast-check@4 --workspace=apps/client`; **NO** instalar
      `zod-fast-check` (peer `fast-check: '>2.23.0 <4.0.0'` incompatible con fc@4) ni
      `@fast-check/vitest` (sin uso — todas las recetas usan `fc.assert`; ver D1)
      **[LOCAL]** — Verificación:
      `grep -E '"fast-check"' apps/server/package.json apps/client/package.json` →
      **2 matches** bajo `devDependencies`;
      `grep -E '"(@fast-check/vitest|zod-fast-check)"' apps/server/package.json
  apps/client/package.json` → **0 matches**; `grep '"fast-check"' package.json`
      (root) → **0 matches** (contrato anti-phantom-dep de `9ae16e8f`); `npm ls fast-check`
      desde cada workspace resuelve sin `UNMET` ni phantom.
- [ ] 1.2 Bloque `fc.configureGlobal` en los setupFiles existentes
      (`apps/server/tests/setupTest.js`, `apps/client/tests/setup/setupTest.js`):
      `numRuns: process.env.CI ? 1000 : 100` + `...(process.env.CI ? { seed: 42 } : {})`,
      preservando lo que ya hay en cada archivo (dotenv / MSW) **[LOCAL]** —
      Verificación: (a) wiring en TODAS las variantes de config:
      `grep -n "setupFiles" apps/server/vitest.config.js apps/client/vitest.config.js`
      → 1 match por config base (más `apps/server/vitest.smoke.config.js` → 1), y
      `grep -n "\.\.\.base.test" apps/server/vitest.scoped.config.js
  apps/client/vitest.scoped.config.js` → el spread hereda `setupFiles`, así que los
      runs TIA scoped (`test:changed:ci`/`test:tia`) también aplican `configureGlobal`
      (si algún config no lo hereda, declararlo explícito — D2); (b) valores: script
      temporal que importa el setupFile con y sin `CI` y lee
      `fc.readConfigureGlobal().numRuns` (1000 con CI, 100 sin);
      (c) `CI=true npx vitest run <un *.unit.test.js existente>` desde cada workspace →
      0 failures nuevas en la suite existente.
- [ ] 1.3 Scripts `test:pbt`: en `apps/server/package.json` y
      `apps/client/package.json` → `"test:pbt": "vitest run \".properties.unit.test\""`;
      en root `package.json` → `"test:pbt": "npm run test:pbt --workspaces --if-present"`
      (patrón `--workspaces --if-present` de `standardized-test-naming`) **[LOCAL]** —
      Verificación (solo greps aquí): los tres scripts con su valor exacto, y los scripts
      `test:snapshot*` de `apps/client/package.json` intactos:
      `grep -c 'test:snapshot' apps/client/package.json` → 2. El exit 0 funcional de
      `npm run test:pbt` se valida en 1.5 — `vitest run` sale 1 con 0 ficheros matching
      (la humo-property llega en 1.5; invertiría el gate si se exigiera aquí).
- [ ] 1.4 Sin regresiones por el setup: `npm run test:unit --workspace=apps/server` y
      `--workspace=apps/client` siguen en verde (0 regresiones por el bloque
      `configureGlobal`) **[LOCAL]** — Verificación: ambos exit 0.
- [ ] 1.5 GATE G1 — humo-property server (movida desde G2: el filtro `test:pbt` necesita
      ≥1 fichero para no salir con 1): `apps/server/tests/unit/properties/
  money.properties.unit.test.js` siguiendo la receta §5.3 (`fc.bigInt` minor units,
      conmutatividad de `addMoney`/autoinversión — si el módulo `money.js` no existe,
      elegir el helper monetario real del repo o crear la propiedad sobre la lógica de
      `sales`/`payroll` que sí exista) **[LOCAL]** — Verificación:
      `npm run test:pbt` (root) y `npm run test:pbt --workspace=apps/server` → ≥1
      property, exit 0 (cierra el check funcional de 1.3); y rompiendo deliberadamente la
      propiedad (invertir la aserción) → falla con counterexample + `seed`/`path` en el
      log; revertir.

## G2 — Primeras propiedades

- [ ] 2.1 Server Joi-driven: `*.properties.unit.test.js` con el arbitraries
      `.map(cand => schema.validate(cand, {convert:true, stripUnknown:true}).value)`
      para ≥2 schemas reales (`stock.joi.js`, `attendance.joi.js`) — predicado: siempre
      `schema.validate(value).error === undefined` **[LOCAL]** —
      Verificación: `npm run test:pbt --workspace=apps/server` exit 0; property que
      evalúe un valor NO parseado debe fallar (prueba negativa manual → revertir).
- [ ] 2.2 Server lógica pura + invariantes: sorting (orden/permutación/idempotencia),
      paginación (unión = input, sin solape), **stock >= 0** (restock/sell sobre helper
      real de `stock`/`inventoryMovement`), **asistencia idempotente** (check-in/out doble
      no cambia estado) **[LOCAL]** — Verificación: `npm run test:pbt` exit 0; mutar un
      operador del SUT (p.ej. `>=` → `>` en stock) → la propiedad correspondiente falla;
      revertir.
- [ ] 2.3 Client zod con arbitraries escritos a mano: `apps/client`
      `*.properties.unit.test.js` con `fc.record`/`fc.letrec` espejando las formas de
      ≥2 schemas reales (`stock`, `expenses`) → `safeParse(v).success === true`; **sin**
      `zod-fast-check` (peer incompatible con fast-check@4 — ver D1) **[LOCAL]** —
      Verificación: `npm run test:pbt --workspace=apps/client` exit 0;
      `grep -rn "zod-fast-check" apps/client/src apps/client/package.json` → 0 matches.
- [ ] 2.4 Revisión de calidad de propiedades (spec §"Quality standards"): sin mutación de
      inputs en predicados, constraints > `.filter`, sin `try/catch→true`, sin
      propiedades tautológicas, `fc.bigInt` (no `fc.double`) en dinero — grep de
      anti-patrones **[LOCAL]** — Verificación:
      `grep -rn "fc.double()" apps/*/tests/**/properties apps/client/src 2>/dev/null | grep -i money`
      → 0; `grep -rn "catch" apps/**/properties/*.unit.test.*` → 0 tautológicos; revisión
      manual de cada predicado contra §4.5 (checklist en el PR).
- [ ] 2.5 GATE G2 — ambas suites completas: `npm run test:unit` server + client exit 0
      (properties incluidas por el glob) y `npm run test:pbt` en root exit 0 con ≥2
      tests por workspace **[LOCAL]**.

## G3 — CI advisory wiring (STAGE 2 PRE-Build, sin romper el contrato de 6 jobs)

- [ ] 3.1 Nuevo job `property-tests` en `.github/workflows/ci.yml` dentro del bloque
      SUBSTAGE 2D: `name: 'Tests: Property Tests'` (prefijo `Tests:` exigido por
      `ci-prebuild-substage-structure`), `if:` con el mismo filtro `repo-discovery` +
      `github.event_name == 'pull_request'`, `continue-on-error: true` (FASE 1),
      `needs: repo-discovery` (sin enlazarlo en ningún otro `needs`), `timeout-minutes: 5`
      (presupuesto < 1-2 min), `CI=true` (seed 42 + numRuns 1000 por setupFile), paso
      `npm run test:pbt` con log completo (sin truncar seed/path) y upload de log como
      artefacto en `if: failure()`; **actualizar el header** a
      `# SUBSTAGE 2D: UNIT TESTING — test-unit-client, test-unit-server, test-integration, test-smoke, property-tests`
      (delta MODIFIED de `ci-prebuild-substage-structure` — lockstep verificado en G4)
      **[CI]** — Verificación: `grep -A8 "property-tests:" .github/workflows/ci.yml`
      muestra `name: 'Tests: Property Tests'`, `continue-on-error: true` y
      `timeout-minutes: 5`; `grep "SUBSTAGE 2D:" .github/workflows/ci.yml` enumera
      `property-tests` y coincide literalmente con el delta MODIFIED; YAML válido:
      `npx actionlint .github/workflows/ci.yml` (o `actionlint` del repo) exit 0.
- [ ] 3.2 Sin puente y sin tocar el agregador: `pbt-advisory-bridge` NO se crea —
      `property-tests` reporta su propio check y no entra en el `needs` de ningún job;
      **prohibido** añadir un 7.º id a `prebuild-unit-tests-complete.needs` **[CI]** —
      Verificación (extracción robusta del bloque — `grep -A9` imprime solo 5 de los 6
      ids y `-A10` es mínimo frágil ante cualquier línea nueva del job):
      `awk '/^  prebuild-unit-tests-complete:$/{f=1} f && /^    steps:$/{exit} f && /^      - /{print $2}' .github/workflows/ci.yml | sort`
      → exactamente **6 líneas** (`wc -l` → 6) iguales a la lista ordenada esperada
      `client-coverage server-coverage test-integration test-smoke test-unit-client
  server-coverage`... [ver nota: diff contra
      `client-coverage server-coverage test-integration test-smoke test-unit-client
      test-unit-server`]; y `grep -cE "^      - property-tests$" .github/workflows/ci.yml`
      → **0** (no aparece en ningún `needs`); y ningún `continue-on-error` de los 6 jobs
      existentes fue modificado:
      `git diff origin/main -- .github/workflows/ci.yml | grep "^-.*continue-on-error"`
      → 0 eliminaciones (solo líneas del job nuevo).
- [ ] 3.3 Presupuesto y anti-patrones CI: property roja deliberada en un PR de prueba →
      job `property-tests` (título `Tests: Property Tests`) FAILURE reportado con
      `seed`+`path` visibles, pipeline NO bloqueado (advisory), y el rojo NO pasa a ningún
      `needs` — sin puente `pbt-advisory-bridge` ni `::notice::` derivado de
      `needs.*.result` (no verificado bajo job-level `continue-on-error`);
      `prebuild-unit-tests-complete` y `ci-complete` siguen verdes **[CI]** —
      Verificación: PR de prueba con una property roja → job rojo con counterexample en
      log completo (sin truncar), agregador verde, CI completo verde, y el grep de 3.2
      (`grep -cE "^      - property-tests$"` → 0) tras el PR; revertir la property.
      Además: seed fija — misma corrida dos veces produce el mismo resultado
      (grep `seed: 42` efectivo vía `CI=true`).
- [ ] 3.4 GATE G3 — grep integral de no-colisión: ningún cambio a TIA (`test:changed*`),
      sequencer, matrix/sharding, ni scripts `test:snapshot*`; sin bridge
      `pbt-advisory-bridge` **[CI]** — Verificación:
      `git diff origin/main -- .github/workflows/ci.yml apps/server/package.json
  apps/client/package.json` → solo adiciones PBT (job `property-tests`, header 2D,
      scripts `test:pbt`, devDep `fast-check`); 0 diffs en `test:changed*`,
      `test:coverage*`, `test:snapshot*`;
      `grep -c "pbt-advisory-bridge" .github/workflows/ci.yml` → **0**.

## G4 — Docs lockstep (corregir afirmaciones desactualizadas)

- [ ] 4.1 `docs/learning/unit-tests-enterprise.md`: línea 29 y tabla línea 329
      (`fast-check@3.23.2 instalado, 0 usos` → estado real: 4.x devDeps por workspace +
      primeras properties) y task list §23.3 línea 356 (P2 parcialmente/resuelto →
      "adopción en marcha / G1-G2 aplicados") **[LOCAL]** — Verificación:
      `grep -n "3.23.2" docs/learning/unit-tests-enterprise.md` → **0 matches**;
      `grep -n "fast-check@4" docs/learning/unit-tests-enterprise.md` → ≥1 match.
- [ ] 4.2 `docs/learning/panorama-resumen.md` línea 45: `dep fast-check 3.23.2
  (package.json:341) instalada, 0 usos` → estado real (workspace devDeps, propiedades
      presentes, root sin phantom dep) **[LOCAL]** — Verificación:
      `grep -n "3.23.2" docs/learning/panorama-resumen.md` → 0 matches; la línea nueva
      coincide con `npm ls fast-check` y `grep -rn "fc.property" apps | wc -l` > 0.
- [ ] 4.3 Cross-links del doc de investigación: verificar que los estados "corregir" de
      §6 (`unit-tests-enterprise.md` §23.3, `panorama-resumen.md`) quedaron cumplidos y
      citar la nueva capability `property-based-testing` en `docs/testing-architecture.md`
      (sección de estilos de test) **[LOCAL]** — Verificación:
      `grep -n "property-based" docs/testing-architecture.md` → ≥1 match.
- [ ] 4.4 GATE G4 — verificación cruzada doc↔repo↔spec: las cifras de las tablas
      (versión, # workspaces con dep, # properties) coinciden con la realidad del repo, y
      las cifras de schemas citadas en proposal/design son exactas: **24 Joi** (22
      `*.joi.js` de módulo + `utils/joiSchemas/joi.js` + `socket/events/schemas.js`) y
      **22 zod** (23 ficheros que importan zod menos `zod-i18n.js`); además el header
      SUBSTAGE 2D de ci.yml coincide literalmente con el delta MODIFIED de
      `ci-prebuild-substage-structure` **[LOCAL]** — Verificación:
      comandos de 4.1/4.2 + `grep -rln "fc.assert\|fc.property" apps | wc -l` ≥ 4
      archivos + `test "$(find apps/server/src -name '*.joi.js' | wc -l)" = 22` (24 con
      utils/socket) + `grep -rl "from 'zod'" apps/client/src --include='*.js' | wc -l`
      → 23 (22 schemas sin zod-i18n) + `grep "SUBSTAGE 2D:" .github/workflows/ci.yml` →
      termina en `, property-tests`.

## G5 — Verificación final

- [ ] 5.1 Suites locales completas: `npm run test:unit` (server y client) y
      `npm run test:pbt` (root) exit 0 **[LOCAL]** — Verificación: salida de los tres
      comandos con ≥1 property ejecutada por workspace (grep `.properties.unit.test` en
      el reporter).
- [ ] 5.2 Contratos de ownership intactos: `needs` de `prebuild-unit-tests-complete` = 6
      ids (misma extracción robusta por `awk` del task 3.2 — **no** `grep -A9`, que
      imprime solo 5 ids); 0 diffs sobre TIA/sequencer/sharding/snapshot; devDeps
      `fast-check` solo en workspaces y 0 helpers (`zod-fast-check`/`@fast-check/vitest`)
      **[LOCAL]** — Verificación: los greps de 3.2/3.4/1.1 en el diff final del branch:
      0 violaciones.
- [ ] 5.3 Corrida CI real del branch: job `property-tests` advisory verde en STAGE 2
      PRE-Build con duración < 2 min, `prebuild-unit-tests-complete` verde con 6 needs
      **[CI]** — Verificación: pestaña de checks del PR → tiempo del job + log con
      numRuns 1000/seed 42 efectivos; el check `Tests: Property Tests` aparece como
      entrada propia y en ningún `needs`.
- [ ] 5.4 Replay de un fallo: provocar una property roja en CI, copiar `seed`+`path` del
      log, reproducirla local pasándolos a `fc.assert(prop, { seed, path, endOnFailure:
  true })` (o `fc.configureGlobal({ seed, path })` temporal en un setupFile /
      bloque del propio test) — **nunca** por flags CLI: Vitest 4.1.11 no tiene
      `--seed`/`--path` y fast-check no los lee → mismo counterexample; revertir
      **[CI]/[LOCAL]** — Verificación: counterexample idéntico local y en CI.
- [ ] 5.5 `openspec validate property-based-testing-adoption --strict` → PASS
      **[LOCAL]** — Verificación: comando exit 0, 0 errores; `openspec status --change
  property-based-testing-adoption` → todos los artifacts `done`.
