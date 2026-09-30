# Configuración de Import Boundaries con Dependency-Cruiser

> **Estado (2026-09-25):** IMPLEMENTADO por el change `import-boundaries`. Config raíz como única
> fuente de verdad, scripts `depcruise:*`, jobs CI `*-import-bounds` activos (gate + report),
> `lint-staged` en pre-commit y baseline gradual. Este documento es la referencia canónica del
> flujo: qué regla existe, por qué, dónde se aplica y cómo operarla.

## 1. Implementación actual

`dependency-cruiser` 18.2.0 (devDependency raíz, pin exacto) valida el grafo de imports del
monorepo con **una sola configuración fuente de verdad**:

| Archivo                                     | Rol                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **`.dependency-cruiser.cjs`** (raíz)        | Única fuente de verdad: `$schema`, `extends: ['dependency-cruiser/configs/recommended']`, reglas `forbidden` por capa, `options` globales |
| `apps/client/.dependency-cruiser.cjs`       | Capa fina: solo `extends: ['../../.dependency-cruiser.cjs']` (sin reglas duplicadas)                                                      |
| `apps/server/.dependency-cruiser.cjs`       | Capa fina: solo `extends: ['../../.dependency-cruiser.cjs']` (sin reglas duplicadas)                                                      |
| `apps/client/webpack.depcruise.config.cjs`  | Resolve-only: alias `@` del client (`@/...` → `apps/client/src/...`). NO es un build config; Vite no lo lee                               |
| `.dependency-cruiser-known-violations.json` | Baseline fase 1 (violaciones conocidas), generado por `npm run depcruise:baseline`                                                        |
| `reports/.gitkeep`                          | Directorio de salida de `npm run depcruise:report` (contenido gitignored)                                                                 |

**Problema histórico resuelto (dead-rule):** antes de este change, cada workspace tenía su propio
config con reglas `no-cross-workspace-imports` cuyos paths usaban `^apps/client`/`^apps/server`,
pero el CI corría con `working-directory: apps/*`, de modo que los paths relativos al CWD empezaban
en `src/` y **las reglas nunca matcheaban**. Hoy todo corre desde la RAÍZ (`npm run depcruise:*` y
los jobs CI sin `working-directory`), por lo que los paths `^apps/...` y `^e2e/...` matchean.

**Por qué webpack config y no `--ts-config`:** dependency-cruiser lee los `paths` del
tsConfig/jsconfig vía `parseJsonConfigFileContent` de TypeScript, que resuelve los globs `include`
contra el CWD actual. Con CWD=raíz, `apps/client/jsconfig.json` matchea 0 archivos
(error TS18003). El alias se resuelve entonces vía `options.webpackConfig`
(`apps/client/webpack.depcruise.config.cjs`, sección `resolve.alias` con `__dirname`), que es
independiente del CWD. `jsconfig.json` queda como referencia del editor, sin `include`.

## 2. Por qué Dependency-Cruiser

`dependency-cruiser` analiza el grafo de imports (dependencias entre archivos) sin depender de
`package.json`. Detecta: ciclos (`no-circular`), huérfanos (`no-orphans`), cross-workspace
(`forbidden` con `severity`) e imports no resolubles (`not-to-unresolvable`).

- **knip** (`knip.jsonc`): limpieza de dependencias — archivos/exports/deps sin usar.
- **dependency-cruiser** (`.dependency-cruiser.cjs`): arquitectura de imports — boundaries y capas.
- **eslint** (`eslint.config.js`): calidad de código por archivo (complejidad, estilo). Los
  límites de import son propiedad **exclusiva** de dependency-cruiser: `eslint-plugin-import`
  permanece desinstalado (decisión registrada en `docs/learning/eslint-configuration.md`).

Coherencia knip ↔ depcruise: los archivos muertos que knip ignora en `ignore` (p. ej.
`apps/server/src/utils/prisma-dinamic-service/`) están excluidos del grafo en
`options.exclude` del config raíz — ambos tools ven el mismo código.

Referencia oficial: <https://github.com/sverweij/dependency-cruiser> (docs `rules-reference.md`,
`options-reference.md`, `cli.md`).

## 3. Reglas por capa

Todas las reglas viven en el config raíz. Severidades: `error` = bloquea PR (exit ≠ 0 en
`--output-type err`), `warn` = visible pero no bloquea (deuda controlada, en baseline).

| Regla                         | Severidad | From                                                       | To                                          | Comentario                                                                 |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `no-client-to-server`         | error     | `^apps/client/`                                            | `^apps/server/`                             | Comunicación client→server solo por HTTP/WS contra la API                  |
| `no-server-to-client`         | error     | `^apps/server/`                                            | `^apps/client/`                             | React/DOM no existen en Node; duplicar o extraer paquete compartido        |
| `no-e2e-to-apps`              | error     | `^e2e/`                                                    | `^apps/`                                    | Los tests E2E ejercitan el sistema desplegado, no importan código de apps  |
| `no-circular-server`          | error     | `^apps/server/`                                            | `circular: true`                            | El server no tolera ciclos (inicialización CJS + acoplamiento de capas)    |
| `no-circular`                 | warn      | todo menos `^apps/server/`                                 | `circular: true`                            | Deuda conocida del client (~24 ciclos vía `config/axios → redux/store`)    |
| `no-cross-module-client`      | warn      | `^apps/client/src/modules/([^/]+)/`                        | `^apps/client/src/modules/` ≠ `$1`          | Compartir vía `src/components`, `src/hooks`, `src/services`, `src/utils`   |
| `no-redux-in-components`      | warn      | `^apps/client/src/components/`                             | `^apps/client/src/redux/`                   | Usar hooks (useQueryData, useLoadingState) en vez del store directo        |
| `no-controller-to-controller` | warn      | `^apps/server/src/modules/([^/]+)/.*controller\.(js\|ts)$` | controllers de OTRO módulo (`$1`)           | Compartir vía services/utils; regex `(js\|ts)` coordinado con TS-migration |
| `no-dao-in-routes`            | warn      | `^apps/server/src/routes/`                                 | `^apps/server/src/modules/.*dao\.(js\|ts)$` | Las rutas pasan por la capa service, nunca al DAO directo                  |
| `not-to-dev-dep`              | error     | todo menos `*\.(test\|spec\|stories)\.*`                   | `dependencyTypes: ['npm-dev']`              | El runtime no puede depender de devDependencies                            |
| `no-orphans`                  | warn      | `orphan: true` (excluye tests/stories/configs)             | —                                           | Módulo que nadie importa: eliminarlo o integrarlo                          |

Notas de implementación:

- **`extends` merge:** las reglas con el mismo `name` se fusionan por nombre y los atributos del
  config extendido **ganan** (así el client hereda `no-circular` de `recommended` y lo baja a
  `warn`; el server añade `no-circular-server` con `error`). Al reemplazar el `from` de
  `no-orphans` hay que re-declarar sus exclusiones de archivos de configuración (dotfiles,
  `.d.ts`, tsconfig, babel/webpack configs), acopladas a la v18.
- **Placeholders `$1`:** el `to.path` puede interpolar grupos del `from.path` con `$1`, y matchea
  contra el path **resuelto**. La variante histórica con `\1` era inválida en JavaScript (referencia
  octal) y no matcheaba nada. Para "mismo módulo" se usa `pathNot: '^apps/client/src/modules/$1/'`
  — el lookahead `(?!$1/)` en `to.path` NO funciona porque `$1` se sustituye antes de compilar.
- **`no-orphans` del client:** además de las exclusiones globales, excluye
  `src/{hooks,services,lib,redux}/` (infraestructura de bajo nivel entryless por diseño, falsos
  positivos documentados por knip).
- **`exclude` vs `ignore`:** `options.exclude` saca módulos del grafo **sin generar mensajes**;
  el `ignore` de `--ignore-known` silencia violaciones ya registradas en el baseline; el
  `--max-warnings 0` de ESLint no tiene equivalente (el control fino aquí es `severity` +
  `exclude` + baseline).

## 4. Scripts npm (siempre desde la raíz)

| Script                       | Qué hace                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run depcruise`          | Grafo combinado (client + server + e2e) con el config raíz — diagnóstico                       |
| `npm run depcruise:client`   | Solo `apps/client/src`                                                                         |
| `npm run depcruise:server`   | Solo `apps/server/src`                                                                         |
| `npm run depcruise:ci`       | Gate CI: `--output-type err --ignore-known` (exit = nº de errores **nuevos**)                  |
| `npm run depcruise:report`   | Reporte standalone: `--output-type err-html -f reports/dependency-cruiser.html --ignore-known` |
| `npm run depcruise:baseline` | Regenera `.dependency-cruiser-known-violations.json` (alias de `depcruise-baseline`)           |

El alias `@` se resuelve vía `options.webpackConfig` (config raíz), así que **no hay flags
`--ts-config` ni `working-directory`**: todos los comandos funcionan idénticos en local y CI.

Baseline fase 1: el baseline contiene las 58 violaciones conocidas (50 client: 24 ciclos
`no-circular` + cross-module/orphans; 8 server: orphans de código muerto knip-ignorado).
`--ignore-known` las descuenta; **las violaciones `error` nuevas sí bloquean** (verificado: un
import temporal client→server produce `error no-client-to-server` y exit 1 incluso con
`--ignore-known`). Cuando la deuda se limpie, quitar `--ignore-known` de `depcruise:ci` y
regenerar/eliminar el baseline (fase 2).

## 5. Integración profesional (4 capas)

### 5.1 Pre-commit (shifting-left)

`lint-staged` (en `package.json`, invocado por `.husky/pre-commit`):

```json
"*.{js,jsx,ts,tsx,cjs,mjs}": "depcruise --config .dependency-cruiser.cjs --output-type err-long --ignore-known"
```

`lint-staged` pasa solo los archivos staged; dependency-cruiser los cruza contra su grafo completo
(el baseline `--ignore-known` evita bloquear por deuda conocida). `--output-type err-long` imprime
el `comment` de la regla violada — mensaje accionable antes del push. Como el hook corre desde la
raíz, los paths `^apps/...` matchean.

### 5.2 CI (`.github/workflows/ci.yml`)

- `client-import-bounds` (activo desde 2026-09-25): gate
  `npm run depcruise:client -- --output-type err --ignore-known` + report
  `npm run depcruise:report` (`if: always()`, `continue-on-error: true`) +
  `actions/upload-artifact` (`dependency-cruiser-report-client`, retención 7 días).
- `server-import-bounds` (activado por este change, antes `if: false`): mismo patrón con
  `depcruise:server` y artefacto `dependency-cruiser-report-server`.
- Ambos corren **sin `working-directory`** (CWD = raíz) y se disparan vía el path-filter `shared`
  de `repo-discovery`, que incluye `.dependency-cruiser.cjs`, `apps/client/.dependency-cruiser.cjs`
  y `apps/server/.dependency-cruiser.cjs` (cambiar el config dispara ambos jobs).
- **No renombrar los jobs**: los ids están fijados por `openspec/specs/ci-prebuild-substage-structure/spec.md`
  (15 jobs en `prebuild-quality-complete.needs`) y los agregadores dependen de ellos.

### 5.3 Editor

El `$schema` (`https://json.schemastore.org/dependency-cruiser.json`) más el JSDoc
`@type {import('dependency-cruiser').IConfiguration}` dan autocompletado/validación en el editor.

### 5.4 Rollback

`git revert` del commit del change: dependency-cruiser no modifica código fuente (solo analiza);
revertir restaura configs/scripts/CI. Las reglas y severidades también se ajustan en caliente
editando `.dependency-cruiser.cjs` (p. ej. bajar una regla a `warn` mientras se limpia deuda).

## 6. Pipeline completo

1. **Editor**: `$schema` + JSDoc → autocompletado; el `comment` de cada regla documenta el POR QUÉ.
2. **Pre-commit (lint-staged)**: `err-long` sobre archivos staged con `--ignore-known` → feedback
   inmediato, cero ruido de deuda conocida.
3. **CI gate**: `depcruise:client`/`depcruise:server` con `--output-type err --ignore-known` →
   exit ≠ 0 solo por violaciones `error` nuevas (cross-workspace, dev-deps, ciclos de server).
4. **CI report**: `err-html` `if: always()` + upload-artifact → grafo inspeccionable en la UI
   (el reporte usa el grafo combinado client+server+e2e).

## 7. Coordinación con otros changes

- **`server-typescript-migration`** (activo): los regex de las reglas de server ya cubren
  `(js|ts)` (`no-controller-to-controller`, `no-dao-in-routes`) y la raíz activa
  `tsPreCompilationDeps: true` — cuando exista `apps/server/tsconfig.json` bastará añadir
  `options.tsConfig.fileName` en `apps/server/.dependency-cruiser.cjs`.
- **`eslint-configuration`** (archivado): `eslint-plugin-import` desinstalado — dependency-cruiser
  es dueño único de boundaries (no reinstalar).
- **`knip-consolidation`** (archivado): coherencia knip ↔ depcruise en archivos muertos (ver §2).
- **`docs-changelog-validation`**: este doc sigue las convenciones de `docs/learning/`
  (markdownlint-cli + vale).

## 8. Referencias oficiales

- <https://github.com/sverweij/dependency-cruiser/blob/master/doc/rules-reference.md>
- <https://github.com/sverweij/dependency-cruiser/blob/master/doc/options-reference.md>
- <https://github.com/sverweij/dependency-cruiser/blob/master/doc/cli.md>
- <https://dependency-cruiser.org/>
- Schema local: `node_modules/dependency-cruiser/src/schema/configuration.schema.mjs` (el validador
  real de v18; `enhancedResolveOptions.alias` NO existe en el schema — el alias va por webpackConfig)
- Base recomendada: `node_modules/dependency-cruiser/configs/recommended.cjs`

## 9. Comparación con `knip.jsonc` y `eslint.config.js`

| Tool                 | Unidad de análisis              | Detecta                                             | No detecta                                                         |
| -------------------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `knip` (knip.jsonc)  | archivos, exports, dependencias | código muerto, deps sin uso, exports no consumidos  | dirección/arquitectura de imports                                  |
| `dependency-cruiser` | grafo de imports                | ciclos, orphans, boundaries cruzadas, no-resolubles | deps de package.json sin usar                                      |
| `eslint`             | archivo (AST)                   | complejidad, estilo, bugs por patrón                | relaciones entre archivos (salvo plugins de import, desinstalados) |

Los tres se complementan: knip = limpieza, dependency-cruiser = arquitectura, eslint = calidad.
Señales cruzadas: si knip marca un archivo `unused`, dependency-cruiser lo mostrará como orphan —
coordinar ambos (`ignore` de knip ↔ `exclude` de depcruise) para que vean lo mismo.

## 10. Glosario

- **Boundary**: límite entre módulos/capas (client ↔ server ↔ e2e; módulos internos).
- **Orphan**: módulo que nadie importa.
- **Circular**: ciclo de dependencias (A → B → C → A).
- **Severity**: `error` bloquea (gate), `warn` advierte (deuda), `info` informativo, `ignore` silencio.
- **Baseline**: `.dependency-cruiser-known-violations.json`; con `--ignore-known` las violaciones
  registradas no se reportan ni bloquean.
- **Shifting-left**: mover verificaciones lo más temprano posible (editor → pre-commit → CI).
- **Gate**: step/job que bloquea el PR si su exit code ≠ 0.
- **Report**: salida no-bloqueante (`if: always()` + `continue-on-error`) para inspección.

## 11. Operación práctica

```bash
# Ver TODAS las violaciones (incluidas las del baseline):
npx depcruise apps/client/src apps/server/src e2e/tests --config .dependency-cruiser.cjs --output-type err --no-ignore-known

# Ver el grafo combinado en el navegador:
npm run depcruise:report && start reports/dependency-cruiser.html

# Simular un bloqueo (true positive):
# crear apps/client/src/tmp.js con: import x from '../../server/src/config/db.js';
npm run depcruise:client -- --output-type err --ignore-known   # → exit 1, error no-client-to-server

# Tras limpiar deuda (fase 2):
rm .dependency-cruiser-known-violations.json
# y quitar --ignore-known del script depcruise:ci en package.json
```
