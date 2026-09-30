# Design

## Context

`eslint.config.js` (flat config, ESLint 9, ESM) tiene hoy un único umbral `complexity: ['error', { max: 20 }]` por workspace (bloque 6) y cero cobertura para `e2e/` (sin script `lint`, sin bloque `files`, sin job CI). `max-lines-per-function` no está configurado. `docs/learning/eslint-configuration.md` cita recuentos de líneas/bloques y una tabla de jobs CI que ya no coinciden con el repo. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- Umbrales de complejidad diferenciados por capa (core 15, utils 10, tests off).
- `max-lines-per-function` activo, exenciones sin `ignorePattern`.
- Workspace `e2e` con lint local + gate CI.
- Docs ES actualizadas + doc nueva de implementación.

**Non-Goals:**

- Migrar a TypeScript o añadir plugins nuevos.
- Definir umbral de complejidad fuera de `apps/*/src` (configs de workspace, `prisma/seed.js`, scripts de tooling): esos ficheros pierden el max 20 legacy y quedan sin la regla; un umbral para ellos sería un change aparte si se necesita.
- Reformatear código existente (solo refactor si una función viola el nuevo umbral).

## Decisions

### D1: Scoping por capa con `files` en vez de `basePath`

**Decisión:** bloques dedicados en `eslint.config.js`:

- core → `files: ['apps/*/src/**/*.{js,jsx}']` — TODO el código de producción bajo `src` de server y client (modules, routes, middleware, socket, bin, components, hooks, services, redux, stories…) — con `complexity: ['error', { max: 15 }]`
- utils → `files: ['apps/**/src/utils/**']` con `complexity: ['error', { max: 10 }]` — override del bloque core; gana por ir después en el array
- tests → `files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'e2e/tests/**']` con `complexity: 'off'` — override final; SIEMPRE el último de los tres bloques (hay `.unit.test.js` dentro de `src/utils/`)
- Se ELIMINAN los dos bloques legacy `complexity: ['error', { max: 20 }]` por workspace (bloque 6 actual, files `apps/client/**` y `apps/server/**`): si quedaran detrás pisarían 15/10 ("último gana") y si quedaran delante dejarían un 20 fantasma en ficheros que ahora son core. El umbral pasa a vivir exclusivamente en los bloques por capa.
  Comentarios `//` en español en cada bloque (qué + por qué). Verificar el merge con `npx eslint --print-config` sobre un fichero de cada capa (core, utils, test).
  **Alternativa descartada:** `basePath` — más limpio para ignores relativos, pero los tests viven repartidos y `files` glob es más explícito y testeable con `--print-config`.
  **Alternativa descartada (core = solo `src/modules/**`):** dejaría sin umbral rutas, middleware, hooks, servicios, componentes… y haría ambiguos los escenarios del delta ("Core code capped at 15", "Client threshold stays aligned"); core = todo `src/` de producción.

### D2: `max-lines-per-function` sin `ignorePattern`

**Decisión:** regla declarada en el bloque core con opciones FIJADAS — `'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }]`:

- `max: 80` — calibración inicial generosa (el default de ESLint es 50); se ajusta SOLO en config, nunca por fichero.
- `skipBlankLines` / `skipComments` — no penalizar código documentado; lo que se mide es lógica efectiva.
  Exenciones (sin `ignorePattern`) por:

1. Bloque `{ files: [...], rules: { 'max-lines-per-function': 'off' } }` para ficheros generados/escritura larga (p. ej. fixtures) si aparecen.
2. `// eslint-disable-next-line max-lines-per-function -- <motivo ES>` para casos puntuales.
   Defensa en profundidad: el bloque de tests declara además `'max-lines-per-function': 'off'` explícito (espeja `complexity: 'off'`; si el glob core se ampliara algún día, los tests siguen exentos).
   **Despliegue FASED (decisión del usuario, revertida tras medir el baseline):** el lint inicial arrojó 104 funciones >80 líneas SOLO en client (mediana 167, p90 404, max 638) frente a 6 en server — refactorizar ~100 componentes es un proyecto, no un "refactor puntual". Por tanto:

- **FASE 1 (este change):** regla activa en server (6 violaciones se refactorizan aquí) y en client solo `complexity`; `apps/client/src/**` queda exento de mlpf mediante un bloque `files` dedicado con comentario ES que documenta la deuda técnica (mecanismo de exención aprobado del propio D2, no `ignorePattern`).
- **FASE 2 (change separado):** extraer handlers/subcomponentes en client y eliminar el bloque de exención para que max 80 aplique a todo el core.
- Los 4 `complexity` de client SÍ se corrigen en Fase 1 (umbral 15 en escala).
  **Por qué no `ignorePattern`:** `ignorePattern` oculta exenciones dentro de la regla (no visibles en `--print-config` por capa, difíciles de auditar); los bloques `files`/`ignores` y los disables con `--` dejan la exención explícita y grep-eable. Además `reportUnusedDisableDirectives` flaggea disables huérfanos.
  **Alternativa descartada:** `ignorePattern` con regex de nombres de fichero (acoplamiento oculto a nombres).
  **Alternativa descartada (opciones sin fijar):** sin `max`/`skip*` pinned, la task 2.1 pasaría con cualquier config arbitraria y el spec no tendría nada verificable.
  **Alternativa descartada (eximir client elevando el umbral):** subir `max` a ~300+ para cubrir el baseline dejaría la regla sin diente; la exención por bloque deja el umbral intacto y la deuda visible en un único punto grepeable.

### D3: Lint de e2e

**Decisión:**

1. `"lint": "eslint \"tests/**/*.js\" playwright.config.js --max-warnings 0"` en `e2e/package.json` (idéntica a task 3.1: cubre specs + page objects + la config de Playwright; el bloque de config matchea todo `e2e/**/*.js` de todos modos).
2. Bloque `files: ['e2e/**/*.js', 'e2e/*.js']` en `eslint.config.js` con `languageOptions` de Node (`...globals.node`) para `playwright.config.js` y specs.
3. Job `e2e-lint` en `.github/workflows/ci.yml` (Substage 2B), mismo patrón que `client-lint`/`server-lint` (`repo-discovery` cond, `setup-monorepo`, `--max-warnings 0`), añadido a los `needs` del agregador `prebuild-quality-complete` (único punto de agregación hacia `ci-complete` y el ruleset; en `ci.yml` NO existen "gates de staging").
   **Alternativa descartada:** incluir e2e en el glob raíz de otro workspace — mezcla ownership y rompe feedback por workspace.

### D4: Docs

- `docs/learning/eslint-configuration.md`: edición quirúrgica, sin reescribir el doc, pero cubriendo TODAS las líneas que el change deja obsoletas:
  - §2: recuentos ("235 líneas"/"8 elementos" → reales de `wc -l`/longitud del array) y los RANGOS DE LÍNEA de todos los bloques (Bloque 1: 29–39, Bloque 3: 57–88, Bloque 4: 94–155, Bloque 5: 161–205, Bloque 6: 211–225, Bloque 7: 234) — insertar los bloques de capa desplaza todo lo posterior y el Bloque 6 se sustituye por los bloques por capa.
  - §1.2 árbol de bloques y §1.3 diagrama de flujo (citaban "complexity max 20").
  - §3.8 ejemplo de reglas (`complexity: ['error', { max: 20 }]`) → ejemplo por capas.
  - §4.2 nota "Añadir nuevos workspaces (p. ej. e2e/ con Playwright)" → pasa a describir el bloque e2e ya existente (script + bloque + job).
  - §4.5 tabla de jobs CI (añadir `e2e-lint`, umbrales reales por capa) y refs de umbral 20 (§2, §4.5, §4.8).
- `docs/learning/eslint-complexity-configuration.md`: doc nueva en español: modelo mental por capas, tabla de umbrales, por qué sin `ignorePattern`, flujo e2e lint (script → bloque → job), y cómo cambiar umbrales (solo en config).

## Risks / Trade-offs

- [Bajar core 20→15 sobre TODO `src` de producción rompe lint en funcs existentes] → Ejecutar `npm run lint` antes de cerrar; refactor mínimo o `eslint-disable` documentado como último recurso.
- [mlpf max 80 en client afectaría a 104 funciones (mediana 167 líneas)] → Mitigado con despliegue fased: Fase 1 exime `apps/client/src/**` vía bloque `files` documentado; Fase 2 (change aparte) refactoriza y elimina la exención.
- [Tests con `complexity: 'off'` ocultan código patológico] → Aceptado: tests son código declarativo; la señal útil está en producción. Mitigación: `max-lines-per-function` también off en tests, otras reglas siguen activas.
- [Globs de capa solapados (hay `.unit.test.js` dentro de `src/utils/`)] → Orden MANDATORIO del array: core → utils → tests (el último define la regla en merge); verificar con `npx eslint --print-config` sobre un fichero de cada capa.
- [Ficheros fuera de `apps/*/src` (seed, scripts, configs) pierden el umbral 20 legacy] → Aceptado y documentado en Non-Goals: código de arranque/tooling, no lógica de dominio; `--print-config apps/server/prisma/seed.js` debe mostrar `complexity` sin definir.
- [Job `e2e-lint` alarga CI] → timeout-minutes: 5, sin navegador (solo lint estático).

## Migration Plan

1. Sustituir los dos bloques legacy max 20 por los bloques de capa (core → utils → tests, en ese orden) + `max-lines-per-function` en `eslint.config.js` (comentarios ES).
2. Añadir bloque e2e + script `lint` en `e2e/package.json`.
3. `npm run lint` en todos los workspaces → corregir violaciones (refactor o disables justificados).
4. Añadir job `e2e-lint` a `ci.yml` y a los `needs` de `prebuild-quality-complete` (13 → 14 jobs; el capability `ci-prebuild-substage-structure` fija ese `needs` en exactamente 13, por lo que este change debe llevar también su delta).
5. Actualizar doc existente + crear doc nueva.
6. Rollback: revert de `eslint.config.js` + `e2e/package.json` + `ci.yml` (sin datos persistentes).

## Open Questions

- ¿Mantener `client-complexity`/`server-complexity` como jobs separados o delegar todo en los jobs `*-lint` (que ya heredan la config)? No bloquea: los umbrales viven en config de todos modos; decisión de granularidad de CI puede posponerse.
