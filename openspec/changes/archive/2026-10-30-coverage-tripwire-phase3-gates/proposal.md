# Proposal

## Why

El coverage tripwire **no emite un veredicto rojo de coverage en el camino real de un PR**, y por eso
no funciona como un tripwire: es un informe.

En un PR normal (cambio acotado a un workspace) `test-unit-client` / `test-unit-server` corren en modo TIA
diff-scoped (`scope=changed`), así que `client-coverage` / `server-coverage` ejecutan
`check-coverage.mjs --advisory` y salen con `exit 0`: **el piso no se evalúa**. El piso solo se evalúa
—y bloquea— en los casos `scope=full` (cambio en rutas `shared`, `origin/main` no resoluble, o el
fallback D7 de cero tests). Y la única corrida de suite completa _garantizada_ (el nocturno
`nightly-full-suite.yml`) evalúa los umbrales con `|| echo "::warning::..."`: es advisory y **no falla el
workflow**. Resultado: un PR que borra los tests de un módulo y deja su cobertura en cero **no recibe
un veredicto rojo de coverage en el pipeline**. El "guard bloqueante de cobertura" del doc (§1) no
existe en el repo. Esta entrega añade un job bloqueante dentro del pipeline y propaga su resultado al
agregador de tests; no modifica el ruleset de GitHub ni promete que ese check por sí solo impida el
merge.

Encima de eso hay tres defectos que hacen que el piso, incluso cuando se evalúa, no signifique lo que
promete:

- **La granularidad es por FORMA DE ÁREA, no por criticidad de negocio.** Los pisos por glob del server
  son `src/modules/**/schemas/**` (22 schemas Joi al 100%), `src/utils/constants/**` y
  `src/utils/pagination/**` — áreas que ya estaban al 100%. En paralelo, `auth`, `permission`, `users`,
  `payroll`, `sales`, `inventoryMovement`, `stock`, `warehouse` y `expenses` suman **55 ficheros fuente
  con cero tests unitarios** y sin ningún piso propio: su cobertura solo cuenta en el agregado global
  (~60%). Un 100% sobre un schema de validación no dice nada de si el cálculo de una nómina es correcto.
- **El invariante "el piso solo sube" es una convención, no una propiedad.** `npm run coverage:ratchet`
  delega la garantía en el `autoUpdate` de Vitest, pero **nada detecta una bajada manual** — y ya ha
  pasado: el piso global del client bajó de `87.02/62.16/69.14/87.7` a `64.44/42.11/52.22/64.82`
  (excepción documentada en `client-snapshot-testing`, 2026-10-09). El doc canónico §3.3 sigue citando
  los números antiguos, y dice que el server está en `42.28/21.75/8.98/42.76` "con cinco globs" cuando
  hoy está en `60.8/64.48/64.81/61.49` con tres.
- **La cobertura mide ejecución, no fuerza de aserción.** No hay ninguna herramienta de mutation testing
  en el repo (0 dependencias en raíz, client, server y e2e), así que un piso se puede cumplir con
  `assert(result)`. El propio doc (§6.2) recomienda mutation testing en módulos críticos y no existe.

## What Changes

Tres pilares implementados en esta entrega; mutation testing y el ratchet programado quedan diferidos a Change B:

**1. Un punto de enforcement de suite completa que falla de forma bloqueante dentro del pipeline
(`coverage-gate-enforcement`).**

- Un job/paso de CI que evalúa el piso **siempre sobre cobertura de suite completa** y cuyo fallo es
  **bloqueante** (propaga al agregador de tests). El lane diff-scoped **no cambia**: D18 sigue
  vigente, una corrida parcial no es comparable con umbrales globales.
- El veredicto se emite desde el **mismo guard** que usa el tier local (`check-coverage.mjs`), sin
  evaluaciones paralelas que puedan discrepar.
- El fallo nombra workspace, métrica, valor medido, umbral y fichero infractor — un rojo accionable, no
  un "coverage below thresholds".

**2. Pisos por critical path (`coverage-critical-path-floors`).**

- Una **declaración versionada y revisable** de los caminos críticos (auth, permissions, crypto,
  payroll, ventas, inventario…) con su floor por ruta, en lugar de globs improvisados por forma del
  código.
- Un **nivel de umbral nuevo** (critical path) que el guard evalúa junto al global, al per-file y a los
  globs, y que las specs de granularidad existentes pasan a exigir.
- Un camino crítico **sin tests** es un rojo explícito, no un hueco silencioso dentro de un agregado.

**3. Gobernanza del ratchet (`coverage-ratchet-governance`).**

- Un **baseline versionado** de los pisos contra el que se comprueba que ningún umbral ha bajado, con un
  mecanismo explícito y auditable de excepción (motivo + responsable), en vez de una excepción silenciosa
  en el commit del config.
- El doc canónico deja de citar números escritos a mano: sus cifras se **verifican contra la config**
  (o se generan), para que no vuelva a describir floors que no existen.

**Alcance diferido a Change B:** mutation testing y ratchet programado quedan fuera de esta entrega. No se
añaden herramientas, workflows ni cambios automáticos de thresholds aquí.

## Capabilities

### New Capabilities delivered in this change

- `coverage-gate-enforcement`: la existencia de un punto de enforcement de suite completa cuyo veredicto
  falla de forma bloqueante dentro del pipeline, es único y accionable — el cierre del hueco "el
  tripwire no emite un veredicto de coverage".
- `coverage-critical-path-floors`: la declaración versionada de los caminos críticos de negocio y el
  floor que cada uno debe cumplir, evaluado como nivel de umbral propio.
- `coverage-ratchet-governance`: la propiedad "el piso solo sube" verificada mecánicamente contra un
  baseline versionado, con excepciones auditables, y la documentación canónica sincronizada con la
  configuración real.

### Deferred Capability Contract (Change B)

- `coverage-mutation-testing`: su contrato se conserva para Change B, pero esta entrega no añade la
  herramienta, configuración, ejecución ni gates de mutation testing.

### Modified Capabilities

- `coverage-threshold-granularity`: el contrato de thresholds deja de ser de tres niveles (piso global +
  `perFile` + globs por **forma de área**) y añade un cuarto — el **critical path**, con floor declarado por
  camino de negocio. El guard (`scripts/ci/check-coverage.mjs`) sigue siendo el único evaluador e
  incorpora el nivel critical-path a los que evalúa, de modo que un camino crítico sin tests es un rojo
  explícito y no un hueco silencioso dentro de un agregado.
- `local-coverage-tripwire`: el comando local `coverage:check` deja de ser el espejo del job _advisory_ y
  pasa a ser el espejo del **veredicto bloqueante** de suite completa; y la garantía "el piso solo sube"
  deja de depender de la convención: se apoya en el **baseline versionado** con excepción auditable
  (motivo + responsable), mientras `coverage:ratchet` conserva su semántica de "sube y nunca baja". El
  tier local sigue siendo de suite completa (nunca diff-scoped) y `autoUpdate` sigue prohibido en CI.

## Non-Goals

- **D18 intacto**: la decisión D18 (el umbral de una corrida diff-scoped no se evalúa, porque un total
  parcial no es comparable con umbrales globales) **no se toca**. El lane diff-scoped sigue difiriendo la
  evaluación de umbrales y el guard conserva su deferencia actual; el enforcement nuevo es un punto
  **separado** de suite completa. `ci-test-jobs-activation` conserva D18 intacto.
- **Ningún `continue-on-error`**: este change **no** promociona ni degrada ningún job a FASE 2 y **no**
  reintroduce `continue-on-error` en ningún sitio. La promoción de los jobs de testing es de
  `ci-testing-gate-promotion`, con su propia ventana de calibración. El bloqueo que introduce este change
  es el de un punto **nuevo**, que nace bloqueante por diseño — no es la promoción de un job existente.
- **Mutation testing y ratchet programado diferidos**: se reservan para Change B; no se añaden dependencias,
  ejecución nocturna de mutantes ni workflow mensual de propuesta de floors en este change.
- **SonarQube fuera**: no se toca `sonarqube` ni su `if: false` (diseño incremental de CI, §3.1 de
  `docs/CONTEXT-CICD.md`). El code-coverage que reporta SonarQube no es el piso de este change, y
  evaluarlo en paralelo reintroduciría justo el defecto que este change cierra: dos evaluadores que
  pueden discrepar.
- **TIA y sharding sin cambios**: ni la selección de tests affected (`vitest run --changed`), ni
  `coverage.changed`, ni el número de shards, ni la fusión de reportes (`coverage-merge-gate`) se tocan.
  Son de `tia-hardening` y `coverage-merge-gate`.
- **No se reescriben las suites de tests de los módulos críticos**: declarar un critical path **no**
  implica escribir sus tests. El floor se declara al valor que el módulo ya cumple hoy, o se marca
  explícitamente como exento hasta que exista cobertura; la redacción de tests es trabajo de otro change.
  Este change acota la **declaración y la evaluación**, no la producción de cobertura.
- **Sin conflictos de capabilities con `ci-testing-gate-promotion` ni `tia-hardening`**: este change no
  crea ni modifica ninguna capability que esos dos changes en vuelo también toquen. Las tres
  capabilities nuevas entregadas (`coverage-gate-enforcement`, `coverage-critical-path-floors`,
  `coverage-ratchet-governance`) son nuevas; `coverage-mutation-testing` queda como contrato diferido
  a Change B. Las dos capabilities modificadas (`coverage-threshold-granularity`,
  `local-coverage-tripwire`) no son propiedad de ninguno de los dos.
- **El ruleset de GitHub no se toca**: el nuevo veredicto bloqueante propaga dentro del repo (agregador de
  tests → `CI Complete`). Vincularlo como required status check del ruleset 21227644 es una decisión de
  gobernanza fuera del alcance de este change.

## Impact

- `scripts/ci/check-coverage.mjs` (+ `check-coverage.test.mjs`) — evalúa el nivel **critical-path** junto
  a global / `perFile` / globs; salida accionable (workspace, métrica, valor medido, umbral y fichero
  infractor); comprobación de que ningún umbral ha bajado respecto al baseline.
- `scripts/ci/coverage-critical-paths.mjs` y `scripts/ci/coverage-baseline.mjs` (nuevos) — cargan y validan
  la **declaración versionada** de caminos críticos y sus floors, y el baseline del ratchet con el formato
  de excepciones auditables (motivo + responsable).
- `apps/client/vitest.config.js`, `apps/server/vitest.config.js` — floors de critical path declarados en el
  config de cada workspace (fuente de verdad única de umbrales) y valor del baseline versionado.
- `.github/workflows/ci.yml` — nuevo punto de enforcement de **suite completa** con veredicto bloqueante
  que propaga al agregador de tests; el lane diff-scoped no cambia.
- `.github/workflows/nightly-full-suite.yml` — los steps `Report coverage thresholds (advisory)` dejan de
  tragarse el fallo con `|| echo "::warning::..."` y pasan a evaluar el piso de suite completa de forma
  estricta. Mutation testing y su cadencia quedan diferidos a Change B.
- `package.json` (raíz) — scripts de verificación del baseline y de cifras del documento canónico.
- `docs/learning/coverage-tripwire-floor-ratchet.md` — sus cifras se **verifican contra la config** en vez
  de escribirse a mano (§3.3), más el nivel critical-path, el punto de enforcement y la paridad local↔CI.
- **Sin cambios**: `.husky/*`, `vitest.shared.js`, la selección TIA, los `continue-on-error`, el ruleset de
  GitHub y los changes `ci-testing-gate-promotion` / `tia-hardening` en vuelo.
