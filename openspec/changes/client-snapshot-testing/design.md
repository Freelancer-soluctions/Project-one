# Design

## Context

`apps/client` corre Vitest **4.1.11** + RTL 16 + MSW 2 + Redux Toolkit, con `pool: 'forks'`, `maxWorkers: 1` en CI, `include` que ya cubre `src/**/*.ui.test.{js,jsx}` y setup global (`tests/setup/setupTest.js`) que fija i18n a `lng: 'en'`, limpieza MSW (`listen/resetHandlers/close`) y mock global de `@tanstack/react-table`. Hoy **0 snapshots** (gap P3). `vitest.config.js` no tiene ninguna clave de snapshot y ningún script npm pasa `-u`. El inventario y la política completa están en `docs/learning/snapshot-testing.md` (fuente de verdad); la motivación, en `proposal.md`. El re-inventarioo de candidatura de **todos** los directorios de `apps/client` (excl. `node_modules`/`dist`/`coverage`) está en la matriz de `spec.md`: 180 ficheros `.jsx` no-test/no-stories evaluados → 83 candidatos (F1=37, F2=20, F3=26), 97 excluidos con razón (incluidos `.storybook/`, `tests/`, `public/`, `src/stories/` y `reports/`, que no aportan componentes UI propios).

Integración en CI (verificado en `.github/workflows/ci.yml`, ronda 3): los tests del cliente corren en el **substage 2D de testing del PRE-BUILD** (STAGE 2) con el job `test-unit-client` (nombre visible `Tests: Unit - Client`), que invoca `npm run test:changed:ci --workspace=apps/client` en scope diff (TIA `--changed origin/main`) o `npm run test:coverage:ci --workspace=apps/client` cuando `shared == 'true'`, `origin/main` no resuelve o el guard de 0 tests cae a suite completa; ambos scripts corren desde la raíz del monorepo, sin working-directory, con los reporters JUnit/JSON a `apps/client/reports/`. GitHub Actions exporta `CI=true` en todos los steps → `update` resuelve `'none'`. `vitest.config.js` aplica `maxWorkers: 1` cuando `CI === 'true'` y `pool: 'forks'` con isolación por defecto. El resultado se reporta con `dorny/test-reporter` y los artefactos `coverage-client`/`flaky-evidence-client`. El agregador `prebuild-unit-tests-complete` (6 jobs, contrato de la spec `ci-prebuild-substage-structure`) lo suma a `ci-complete`. Los jobs `test-unit-client`/`client-coverage` están hoy en FASE 1 (`continue-on-error: true`): fallan el step y reportan, pero no bloquean el merge hasta la calibración FASE 2. El orden de stages es prebuild (2A-2D) → build (`client-build`, hoy `if: false`) → post-build; `client-sonarqube` hace `needs: [client-build, test-unit-client]`.
Restricciones que moldean el diseño:

- En Vitest **no existe `--ci`**; el gate es la config `update`, que con `CI` truthy resuelve a `'none'` y falla en faltante/mismatch/obsoleto.
- `snapshotFormat.plugins` se ignora → normalización solo vía `snapshotSerializers` o `expect.addSnapshotSerializer`.
- Los tests de CI (`test:changed:ci`, `test:coverage:ci`) no deben cambiar comportamiento de escritura.
- Los snapshots deben validarse en el substage de testing prebuild de CI sin añadir jobs ni tocar los `needs` de los agregadores (contrato de `ci-prebuild-substage-structure` = exactamente 6 jobs en `prebuild-unit-tests-complete`).
- En win32 `CI=true ...` solo funciona en git-bash (o vía `cross-env`); los comandos de verificación POSIX del tasks.md se ejecutan en git-bash.

## Goals / Non-Goals

**Goals:**

- Declarar la política de escritura de snapshots en config (local `'new'`, CI `'none'`) de forma imposible de "optimizar" sin leer el código.
- Dar scripts npm explícitos para crear/refrescar snapshots sin tocar los scripts de CI.
- 83 ficheros con snapshot determinista: 37 en F1, 20 en F2, 26 en F3 (inline para componentes pequeños, `.snap` externo para tablas).
- Cerrar el gap P3 con métrica y checklist de review actualizados.
- Dejar por escrito la clasificación de cada directorio de `apps/client` (matriz en `spec.md`) para que la cobertura no dependa de la memoria de nadie.

**Non-Goals:**

- Regresión visual de píxeles (Chromatic/Browser Mode) — fase F4 opcional, fuera de este cambio.
- Snapshot en pages, formularios interactivos con estado de validación (RHF/zod o no: `SettingsProductsCategoryForm`), guards, editores tiptap (`TiptapEditor`/`MenuBar`: exigen mock de la instancia `Editor`) ni superficies cuyo markup se deriva de estado Redux vivo (se mantienen con RTL assertions existentes). `SideBar` (Redux solo despacha `logout`), `NotesCard` y `MentionList` quedan fuera de estas non-goals: sus renders son deterministas por props/fixture y entran en F3.
- Snapshot en stories de Storybook (`src/stories/`), configuración `.storybook/`, infraestructura `tests/` ni assets `public/` — no son componentes de producto (documentado en la matriz).
- Añadir `snapshotSerializers` globales: solo si un tipo ruidoso (fechas, `Uint8Array`) aparece repetido en diffs reales.
- Modificar los `include`/umbrales de cobertura existentes o los scripts de CI.

## Decisions

**D1 — Config declarada vs default implícito.** Se escribe `update: process.env.CI ? 'none' : 'new'` explícito aunque Vitest ya lo resuelve así por defecto. _Alternativa:_ dejar el default → rechazada porque el comportamiento correcto debe ser visible en review y anclado al doc; un cambio futuro de default o un `-u` añadido a mano no pasaría desapercibido.

**D2 — `snapshotFormat.maxOutputLength: 10000`.** Presupuesto de salida por snapshot: un snapshot gigante es un snapshot que nadie revisa. El presupuesto se verifica empíricamente en la tarea 1.1 (render de >10 000 caracteres sin marcador de truncado antes de F2; si trunca, se sube a 100000). _Alternativa:_ sin límite → rechazada; el truncado por defecto ya existe, pero fijarlo explícitamente comunica el límite de tamaño que exige el checklist (<100 líneas por snapshot tras render).

**D3 — Dos scripts, responsabilidades separadas.** `test:snapshot` = `vitest run --update=new` (crea faltantes, no toca nada más; seguro por defecto, ideal para primeras ejecuciones y para CI local de pre-push) y `test:snapshot:refresh` = `vitest run -u` (refresco completo tras un cambio de UI esperado). _Alternativa:_ un solo script con `-u` → rechazada: mezclaría "crear" con "sobrescribir" y aumentaría el riesgo de regenerar sin revisar. Los scripts de CI no se tocan (invariante del spec).

**D4 — Inline por defecto, `.snap` externo solo para tablas.** `toMatchInlineSnapshot` para <~50 líneas (el diff vive en el test, sin fichero paralelo que olvidar); `toMatchSnapshot` para los 20 Datatables no vacíos (54–137 líneas) donde el inline inflaría el test y concentraría conflictos de merge en un `.snap` único. _Alternativa:_ todo externo → rechazada por el riesgo de "olvidar" revisar el fichero `.snap`; _alternativa:_ todo inline → rechazada por conflictos de edición en merges paralelos.

**D5 — Sufijo `*.ui.test.jsx` para todos los tests de snapshot.** Ya está en `include`; evita un sufijo nuevo que exija tocar config y mantiene una sola convención de naming (spec `standardized-test-naming`). _Alternativa:_ `*.snapshot.test.jsx` → rechazada: rompe el inventario de suites existente y obligaría a cambiar `include`.

**D6 — Determinismidad por fixture local, no por serializer global.** Fechas con `vi.setSystemTime`, red con `server.use()` por test (el `resetHandlers` global ya corre en `afterEach`), uuid normalizados con `replace()`/property matchers. Los fixtures viven dentro del fichero de test. _Alternativa:_ mock global de `Date` en setup → rechazada: afectaría a tests no-snapshot y ocultaría la fuente de no-determinism.

**D7 — Segmentación de subárbol como regla de tamaño.** En componentes compuestos (`form`, `command`, `dropdown-menu`, `select`, `calendar`, Datatables) se snapshottea el trigger/tabla (`container.querySelector('table')`), nunca el árbol de página ni menús abiertos con animación. Evita diffs de cientos de líneas (anti-goal) sin perder la señal de regresión.

**D8 — Tailwind: sí se cubren las clases.** Se acepta que cambios de `tailwind.config`/`tailwind-merge` rompan snapshots de `components/ui/*`: es exactamente la señal que se busca al tocar el design system. _Alternativa:_ serializer que normalice `class="..."` → deferred: solo si el ruido llega a costar más que la señal (abre `Open Questions` sin cambiar specs).

**D9 — Matriz de candidatura por directorio, auditable y reconciliada.** La decisión de "qué entra" se toma una vez y se congela en la matriz de `spec.md` (directorio → ficheros auditados → candidatos → razón de exclusión), con conteos exactos F1=37, F2=20, F3=26 (=83) que `proposal.md`, `design.md`, `spec.md` y `tasks.md` deben reflejar idénticos. _Alternativa:_ decidir caso a caso durante la implementación → rechazada: reproduce el "silently omitted" que motivó la expansión de alcance y hace imposible revisar el porqué de cada exclusión. Un directorio nuevo se clasifica en la matriz antes de merger snapshots para él (scenario del spec).

**D10 — Los snapshots validan en el substage 2D prebuild existente, sin wiring nuevo (ronda 3, directiva de usuario: "usable en CI, en el substage de testing prebuild").** La validación de snapshots vive donde ya viven todos los tests del cliente: el job `test-unit-client` de SUBSTAGE 2D, vía sus scripts `test:changed:ci` (diff-scoped) y `test:coverage:ci` (full suite). No se crea un job `test-snapshot`, no se toca ningún `needs` de agregadores ni ningún nombre de check, y el orden de stages (prebuild → build → artefacto) queda intacto. _Alternativa:_ job dedicado de snapshots wireado a `prebuild-unit-tests-complete.needs` → rechazada: violaría el contrato "exactamente 6 jobs" de la spec `ci-prebuild-substage-structure`, añadiría un checkout + `npm ci` (~1-2 min) para una suite que ya corre en el mismo substage, y obligaría a re-nombrar/agregar checks del ruleset. _Alternativa:_ ejecutar snapshots en un step de build o post-build → rechazada: el substage de testing prebuild es el gate antes de compilar; un snapshot roto debe fallar antes del build, y moverlo después rompería "prebuild → build → artefacto". El gate se asegura verificando (task 5.5) que (a) `CI=true` llega al job, (b) `update` resuelve `'none'`, (c) un mismatch hace fallar el step, y (d) ningún step/script invocado contiene `-u`/`--update`. _Nota de coverage:_ `test:changed:ci` y `test:coverage:ci` pasan ambos `--coverage`, de modo que cada fichero de snapshot (inline o `.snap`) suma líneas cubiertas al recuento total y los umbrales existentes (84/49/63/85) siguen siendo **suelos (floors)**: añadir snapshots solo puede subir la cobertura medida, nunca reproducir un fallo del gate de coverage por añadir tests.

## Risks / Trade-offs

- [Conflictos de merge en snapshots inline amplios] → mantener snapshots cortos (<~50 líneas), un componente por matcher; segmentar subárbol (D7).
- [Ruido de clases Tailwind al cambiar tokens → "darwinismo" de `-u"] → exigir diff revisado (`git diff`) antes de commitear y checklist de review; prohibir `-u` en CI (spec) convierte cada regeneración en PR visible.
- [`pool: 'forks'` + `isolate` requiere fixtures locales] → fixtures por test, nunca mutables globales; si un test comparte fixture, se congela con `Object.freeze`/estructura nueva.
- [Snapshots obsoletos al renombrar/borrar tests] → CI falla por `update: 'none'`; el flujo es `-u` local + commitear el borrado en el mismo PR.
- [Snapshots creados localmente sin commitear] → el `update: 'new'` local crea faltantes que en CI (`update: 'none'`) rompen el pipeline → checklist exige commitear antes de push (scenario del spec).
- [Cobertura: tests de snapshot añaden líneas testeadas] → los thresholds (84/49/63/85) son mínimos; no se relajan ni se suben en este cambio.
- [Volumen de trabajo: 83 ficheros (37 F1 + 20 F2 + 26 F3)] → secuenciación por fases F0→F1→F2→F3 con tareas pequeñas e independientes (tasks.md); cada tarea cabe en una invocación.
- [Tiempo de ejecución: 83 ficheros de snapshot añaden tiempo al job `test-unit-client` (timeout 10 min, `maxWorkers: 1` en CI)] → los snapshots de F1/F3 son inline y ligeros (subárboles <~50 líneas) y F2 usa 3 filas por tabla; si el job se acerca al timeout, la mitigación es acotar el scope diff (ya existente) o subir el `timeout-minutes` del job — NO paralelizar más allá de `maxWorkers: 1` ni desactivar snapshots.
- [Scope diff (TIA): un PR que solo cambia `.snap` o un test de snapshot sin tocar el componente selecciona 0 tests vía `--changed`] → el guard D7 del propio job detecta `numTotalTests == 0` y cae a la suite completa (`test:coverage:ci`), validando todos los snapshots; verificarlo en la task 5.5 con un PR de prueba que solo toque un `.snap`.
- [El job corre con `continue-on-error: true` (FASE 1): un mismatch reporta pero no bloquea el merge] → se documenta como FASE 1/FASE 2 del pipeline (calibración existente, fuera del alcance de este cambio); el spec exige que el STEP falle y que la evidencia (log + JUnit + artefactos) sea visible, no que bloquee hoy.
- [`pool: 'forks'` + `maxWorkers: 1` en CI: el determinismo depende de fixtures, no del paralelismo] → fixtures locales congeladas por test (D6), `vi.setSystemTime`, i18n `'en'`, MSW `server.use()`; ningún snapshot comparte estado mutable entre ficheros.
- [Dos ficheros se llaman `ClientOrderDatatable.jsx`] → las tareas F2 rutas de módulo completas (`modules/clientOrder` vs `modules/providerOrder`) y el fichero vacío de `providerOrder` se resuelve en la tarea 3.1 antes de snapshottear.

## Migration Plan

1. **F0** (config + scripts + docs): despliegue trivial, no afecta a suites existentes (hoy no hay snapshots); rollback = quitar las dos claves y los dos scripts. Incluye la verificación empírica del presupuesto de 10 000 caracteres antes de F2.
2. **F1→F3**: adición pura de ficheros de test y artefactos; cada fase es un PR independiente verde en local y CI sin flags de update (el fichero throwaway de F0 se borra al final de la tarea 1.4, antes de F1). Rollback por fase = revert del PR (los `.snap` quedan huérfanos y Vitest los reporta como obsoletos → se borran en el revert).
3. La métrica de `unit-tests-enterprise.md` se actualiza al cerrar F1; el resto de docs al cierre de F3.

## Open Questions

- Si el ruido de clases Tailwind llega a molestar en review, ¿serializador propio que normalice `class`? No afecta a specs ni al desglose de tareas: se decide tras F1 con la experiencia real.
- ¿Subir `maxOutputLength` a 100000 de entrada? Decisión tomada en la tarea 1.1 con datos: solo si el render empírico >10 000 caracteres trunca.
