# Tasks: snapshot-gates

## 0. Baseline y prerrequisitos de verificación

- [ ] 0.1 Confirmar la baseline de tamaño con un recuento reproducible (script one-off o comando `node`): entradas `.snap` >50 líneas y bloques inline >50 en `apps/client/src/**/*.ui.test.jsx`; verificar que el recuento es consistente con la auditoría (74/258 entradas `.snap`, máx 138; 19 inline, máx 262) y registrar el comando usado en `design.md` o en el PR
- [ ] 0.2 Verificar la baseline de huérfanos con el check correcto (owner = hermano del directorio `__snapshots__/`, no el interior): ejecutar el bucle de comprobación sobre los 20 `.snap` de `apps/client/src` y confirmar 0 huérfanos y 20/20 dueños con `toMatchSnapshot`
- [ ] 0.3 Verificar que `vitest.configs.recommended` sigue sin incluir `vitest/no-large-snapshots` (runtime check con `node -e`) y que `@vitest/eslint-plugin` sigue instalado en la raíz, para confirmar que la regla existe y está inactiva antes de tocar nada

## 1. G2 — grep gate de update flags (bloqueante a nivel job)

- [ ] 1.1 Crear `scripts/ci/snapshot-update-gate.mjs`: escanea `package.json` raíz + `apps/*/package.json` (scripts npm) y `.github/workflows/*.yml` (steps `run:`) con el patrón anclado `-u([ =]|$)|--update|updateSnapshots`; allowlist explícita `test:snapshot` y `test:snapshot:refresh` de `apps/client/package.json`; imprime fichero/script offending y exit 1 ante match; exit 0 cuando limpio
- [ ] 1.2 Crear `scripts/ci/snapshot-update-gate.test.mjs` (vitest, patrón `pr-body-lint.test.mjs`) con fixtures temporales: caso negativo (`--max-warnings`, `-url`, texto en comentario de YAML), positivo en script npm, positivo en `run:` de workflow, y allowlist de los 2 scripts locales; verificar `npm run test:unit` desde raíz o el runner de scripts correspondiente pasa con los tests nuevos
- [ ] 1.3 Añadir script npm raíz (p.ej. `snapshot:update-gate`) que ejecute el gate desde la raíz del monorepo; verificar localmente `npm run snapshot:update-gate` → exit 0 sobre el estado actual del repo
- [ ] 1.4 Añadir el job `snapshot-update-gate` a `.github/workflows/ci.yml`: `name: 'Quality: Snapshot Update Gate'`, `needs: repo-discovery`, corriendo en TODOS los PRs a main sin filtro de cliente (precedente `zombie-workflow-guard`: el gate es higiene de repo — scripts de cualquier workspace y steps de workflows — y es barato), SIN `continue-on-error`, checkout + `setup-monorepo` + ejecución del script; verificar con `actionlint`/`zizmor` locales que el YAML es válido
- [ ] 1.5 Añadir `- snapshot-update-gate` a `prebuild-tests-complete.needs` (tras `property-tests`, `ci.yml:2562`) y actualizar el comentario del agregador; verificar que el `if` de veredicto del agregador no cambia y que el escenario «aggregator contracts» del delta spec (`needs` exacto con 6 miembros) se cumple leyendo el YAML
- [ ] 1.6 Prueba negativa del gate en CI: abrir el PR del change y verificar que el job corre verde; en un commit de prueba local (no push) inyectar `-u` en un workflow y confirmar que el script falla nombrando el fichero; revertir

## 2. G3 — checklist de PR

- [ ] 2.1 Añadir a `.github/PULL_REQUEST_TEMPLATE.md`, dentro de _Pre-merge Checklist_ (L35-40), la casilla `- [ ] Snapshots reviewed and explained (if applicable)`; no añadir `##` nuevo ni tocar las secciones requeridas
- [ ] 2.2 Ejecutar `node scripts/ci/pr-body-lint.mjs` (o su runner de tests `scripts/ci/pr-body-lint.test.mjs`) y verificar que la verificación de secciones requeridas (`Summary`, `Related Issue`, `How Has This Been Tested?`) sigue pasando con el template modificado

## 3. G5 — gate de snapshots huérfanos (advisory FASE 1)

- [ ] 3.1 Crear `scripts/ci/snapshot-orphan-check.mjs`: para cada `.snap` bajo `apps/client/src/**/__snapshots__/`, verificar que el dueño hermano (`__snapshots__/<name>.snap` → `<name>` en el padre del directorio) existe y referencia `toMatchSnapshot`/`toMatchInlineSnapshot`; exit 1 con la lista de huérfanos, exit 0 si limpio
- [ ] 3.2 Crear `scripts/ci/snapshot-orphan-check.test.mjs` con fixtures temporales: snapshot con dueño (pasa), snapshot sin dueño (falla nombrando el `.snap`), dueño sin matcher (falla); ejecutar los tests y verificar que pasan
- [ ] 3.3 Ejecutar el script sobre el repo real y verificar exit 0 con los 20 `.snap` actuales (baseline limpia, coincide con 0.2)
- [ ] 3.4 Añadir step `Check snapshot orphans (advisory)` al job `client-snapshot-size` (ver 4.4) con `continue-on-error: true` a nivel job; verificar que el step reporta findings en el log sin teñir el agregador

## 4. G4 — límite de tamaño por lint (advisory FASE 1) + remediación + presupuesto

- [ ] 4.1 Habilitar `vitest/no-large-snapshots: ['warn', { maxSize: 50, inlineMaxSize: 50 }]` en `eslint.config.js` en un bloque scoped a `**/__snapshots__/*.snap` (registrar el plugin `vitest` en ese bloque); NO tocar el bloque client existente (`apps/client/**/*.{js,jsx}`); verificar `npx eslint "apps/client/src/**/__snapshots__/*.snap"` localmente reporta las entradas >50 sin romper `npm run lint --workspace=apps/client` (glob no matchea `.snap`)
- [ ] 4.2 Añadir script npm raíz `snapshot:size-check` que ejecute eslint sobre los `.snap` con la config raíz; verificar exit code distinto de 0 cuando hay hallazgos (esperado hoy: hallazgos = baseline deuda) y documentar el conteo en el PR
- [ ] 4.3 Remediar los 19 bloques inline >50 líneas (máx 262) en `apps/client/src/**/*.ui.test.jsx`: reducir a subtree/estado específico (regla F1/F3 del main spec); verificar `npm run test:run --workspace=apps/client` verde y diff de snapshots revisado
- [ ] 4.4 Añadir el job `client-snapshot-size` a `.github/workflows/ci.yml`: `name: 'Quality: Client Snapshot Size (advisory, FASE 1)'`, `needs: repo-discovery`, `if` path-scoped client PRs (idéntico a `client-dead-code`, `ci.yml:1794`), `continue-on-error: true`, checkout + `setup-monorepo` + `npm run snapshot:size-check` + el step de huérfanos (3.4); NO añadirlo a ningún `needs` de agregador; verificar YAML con actionlint y que `prebuild-tests-complete.needs` NO lo contiene
- [ ] 4.5 Segmentar las entradas `.snap` más grandes por módulo en PRs revisables (orden por tamaño: Stock 987, Users/Payroll/Employees 857, Permission 795, Products 790, Attendance 723...): acotar el snapshot a la subtree de la tabla; verificar por módulo: tests verdes, `snapshot:size-check` con un hallazgo menos, y casilla G3 del template marcada en cada PR
- [ ] 4.6 Cuando no queden hallazgos de tamaño, reducir `snapshotFormat.maxOutputLength` en `apps/client/vitest.config.js:109` de 100000 a un valor candidato (25000-50000) y correr la suite client completa localmente (`npm run test:run --workspace=apps/client`); verificar cero marcadores de truncamiento (`…`) en snapshots generados; si hay truncamiento, revertir el presupuesto y segmentar las entradas implicadas antes de reintentar (D7)

## 5. G6 — drift probe nocturno

- [ ] 5.1 Añadir el job `nightly-snapshot-drift` a `.github/workflows/nightly-full-suite.yml`: `name: Nightly - Snapshot Drift Probe`, checkout (fetch-depth 0) + `setup-monorepo`, step `npm run test:snapshot:refresh --workspace=apps/client` (update deliberado en el checkout desechable), luego step `git diff --exit-code` + chequeo de no-trackeados (`git status --porcelain` filtrado a artefactos de snapshot: `.snap`, `*.ui.test.jsx`) con exit 1 y la lista de ficheros en el log; verificar YAML con actionlint y que el job NO está en ningún `needs` de `ci.yml`
- [ ] 5.2 Prueba negativa del drift probe: en rama local, ejecutar el flujo del job (refresh + diff) tras alterar un `.snap` committeado; verificar que el diff sale rojo nombrando el fichero; revertir
- [ ] 5.3 Verificar que una corrida real limpia deja el checkout sin cambios: ejecutar localmente `npm run test:snapshot:refresh --workspace=apps/client` y confirmar `git status --porcelain` sin artefactos de snapshot (si aparecen, es drift real → investigar antes de mergear el change)

## 6. Lockstep documental

- [ ] 6.1 Actualizar `docs/learning/snapshot-testing.md` §5.3 (L190-198): la invariante «Nunca `-u` en scripts que corre CI» (L192) pasa a estar enforced por `snapshot-update-gate` (referenciar el gate y su allowlist); documentar G3-G6 con sus jobs y semántica advisory; verificar que el doc no contradice el estado de los jobs tras el PR-A
- [ ] 6.2 Añadir los 2 jobs nuevos a `docs/CONTEXT-CICD.md` §3.3 (tabla de jobs de `ci.yml`) y §9 (catálogo de implementaciones), con su taxonomía advisory/blocking según fase; verificar coherencia con el YAML del PR-A
- [ ] 6.3 Documentar en `docs/learning/snapshot-testing.md` la dependencia residual de G1: `test.update` confía en `CI=true` (implícito en GitHub Actions; solo `property-tests` lo declara explícito en `ci.yml:1228`); verificación: el párrafo existe y no propone cambios de config (residual aceptado, decisión registrada)

## 7. Calibración y promoción atómica (condicionada a dependencia externa)

- [ ] 7.1 Registrar la apertura de la ventana de calibración (fecha del merge de PR-A) en el resumen del change o en `docs/learning/quality-gates.md` §7; verificar que la fecha queda escrita en un fichero versionado
- [ ] 7.2 Verificar por grep que la dependencia externa `ci-testing-gate-promotion` sigue satisfecha al abrir el PR de promoción (los 5 tier-1 de `ci.yml` SIN `continue-on-error`, FASE 2 desde 2026-10-29 — `docs/CONTEXT-CICD.md` §1/§3.1) y registrar la verificación; la promoción de este change depende SOLO de su propia ventana de calibración (7.1/7.3). Si algún tier-1 hubiera recuperado su COE por rollback per-job de ese change, NO abrir el PR de promoción y registrar la espera (cross-ref D1/D8)
- [ ] 7.3 Tras ≥2 semanas con `client-snapshot-size` y `nightly-snapshot-drift` limpios (verificar en el historial de runs de GitHub), abrir el PR atómico de promoción: quitar `continue-on-error: true` de `client-snapshot-size`, extender `vitest/no-large-snapshots` al bloque client para `*.ui.test.jsx` inline (error), y actualizar la taxonomía en `docs/learning/quality-gates.md` §2; verificar: `npm run lint --workspace=apps/client` verde con la regla inline activa y el job rojo ante una violación inducida en prueba
- [ ] 7.4 Si la calibración cierra con hallazgos pendientes, extender la ventana con la razón registrada en el doc de gates (no promover); verificar que la razón queda escrita y que ningún `continue-on-error` fue tocado prematuramente

## 8. Validación final del change

- [ ] 8.1 Ejecutar `openspec validate snapshot-gates --strict` desde la raíz y verificar exit 0
- [ ] 8.2 Verificar `openspec status --change snapshot-gates` reporta `proposal`, `specs`, `design`, `tasks` completos (0 faltantes en el required set)
- [ ] 8.3 Auditoría de restricciones: grep final confirma (a) ningún `name:` de job del ruleset 21227644 modificado, (b) ningún job existente con `if: false` activado, (c) ningún `continue-on-error` existente modificado (los únicos COE nuevos son los de los jobs advisory de este change), (d) `prebuild-tests-complete.needs` contiene exactamente los 6 miembros del delta spec
