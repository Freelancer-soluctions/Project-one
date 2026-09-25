# Configuración de Import Boundaries con Dependency-Cruiser

## 1. Implementación actual (`.dependency-cruiser.cjs` por workspace)

El proyecto `project-one` usa `dependency-cruiser` 18.2.0 con 2 configs por workspace (`apps/client/.dependency-cruiser.cjs`, `apps/server/.dependency-cruiser.cjs`), formato CJS con `IConfiguration` exportado. Cada workspace define `no-circular`, `no-orphans`, `no-cross-workspace-imports` (`from.path`/`to.path`) y `no-controller-to-controller`. El CI (`.github/workflows/ci.yml`) corre `npx dependency-cruiser src --config .dependency-cruiser.cjs` en `client-import-bounds` (activo) y `server-import-bounds` (`if: false` desactivado por defecto).

**Problemas documentados**: las reglas `no-cross-workspace-imports` usan paths como `^apps/client`/`^apps/server`, pero CI ejecuta con `working-directory: apps/*`, por lo que los paths relativos al CWD empiezan en `src/` — **la regla nunca matchea (dead rule)**. No hay config raíz unificada, ni `exclude` global, ni scripts npm (`package.json` no tiene `depcruise`), ni `lint-staged`, ni `e2e`, ni reporte `err-html`.

Referencia: `.github/workflows/ci.yml` (l.508/596), `package.json` (sin scripts depcruise), `apps/client/.dependency-cruiser.cjs`, `apps/server/.dependency-cruiser.cjs`.

## 2. Por qué Dependency-Cruiser

`dependency-cruiser` analiza el grafo de imports (dependencias entre archivos) sin depender de `package.json`. Detecta: ciclos (`no-circular`), orfanos (`no-orphan`), cross-workspace (`forbidden` con `severity`), y exportaciones no alcanzables (`reachable: false`). Complementa `knip` (que busca archivos/exports/deps sin usar): `knip` = limpieza de dependencias; `dependency-cruiser` = arquitectura de imports. Ambos deben coexistir con `knip.jsonc` (workspaces unificados) y `.dependency-cruiser.cjs` (reglas por capa).

Referencia oficial: https://github.com/sverweij/dependency-cruiser (docs `rules-reference.md`, `options-reference.md`, `cli.md`).

## 3. Configuración profesional (`.dependency-cruiser.cjs` raíz)

Config raíz (`.dependency-cruiser.cjs`) con comentarios ES explicativos (`#` no permitido en CJS; usar `//`). Cada bloque explica `QUÉ` (regla) y `POR QUÉ` (decisión). Patrón de secciones:

- `extends: ['dependency-cruiser/configs/recommended']`: base recomendada sin duplicar reglas.
- `$schema`: `https://json.schemastore.org/dependency-cruiser.json` (o `node_modules/dependency-cruiser/src/schema/configuration.schema.json`) — autocompletado y validación en editores.
- `exclude`: `node_modules`, `dist`, `build`, `storybook-static`, `coverage`, `prisma/generated`, `package-lock.json`, `tests/`, `.storybook/`, `.env`, `*.log`.
- `doNotFollow`: `node_modules` (crucea pero no sigue; evita recursión innecesaria).
- `options`: `maxDepth` (límite profundidad grafo; 0 = infinito por defecto; 30 para CI rápido), `tsPreCompilationDeps: true`, `enhancedResolveOptions` (exportsFields/conditionNames/mainFields/alias `@`).
- `forbidden` (reglas con `severity`, `from`, `to`, `comment`):
  - `no-client-to-server`: `from: {path: '^apps/client'}` → `to: {path: '^(apps/server|node_modules/.*/server)'}`, `severity: error`, comentario ES.
  - `no-server-to-client`: inverso, `severity: error`.
  - `no-e2e-to-apps`: `from: {path: '^e2e'}` → `to: {path: '^apps/'}`, `severity: error` (opcional; si `e2e` debe importar fixtures de `client`, usar `allowed` o excluir con `exclude`/`doNotFollow`).
  - `no-circular`: `severity: warn` (client), `error` (server); con `viaNot` para excluir ciclos documentados (deuda 24 ciclos en `client`, ver notas proyecto).
  - `no-orphan`: `severity: warn`; usar `from.pathNot` para excluir tests/fixture/mocks (`\.test\.|\.spec\.|\.stories\.`).
- `allowed` (`allowedSeverity`): `warn` por defecto; solo `allowedSeverity: error` si se quiere bloquear explícito.
- `required`: módulos obligatorios (ej. `client/src/main.jsx` debe importar `client/src/App.jsx` si aplica).

Referencia config: `dependency-cruiser` docs `rules-reference.md`, `options-reference.md`. Comentario `Decisión:` en CJS: `// Decisión: severity error para cross-workspace porque fuga de capas rompe arquitectura monorepo; warn para circular porque deuda existente (client 24 ciclos) requiere baseline gradual.`.

## 4. Integración profesional

### 4.1 Pre-commit (shifting-left)

En `.husky/pre-commit`: ejecutar `npm exec lint-staged`. En `package.json` (`lint-staged`):

```json
"*.{js,jsx,cjs,mjs}": ["prettier --write", "eslint --fix --max-warnings 0 --no-warn-ignored", "depcruise --config .dependency-cruiser.cjs --output-type err-long"],
```

Nota: `lint-staged` pasa solo archivos staged a `depcruise`; `dependency-cruiser` acepta archivos individuales y cruza su grafo (verifica cross-workspace si CWD = root). `--output-type err-long` muestra `comment` legible por violación (`name`, `severity`, `comment`). Sin `--max-warnings`: equivalente es `severity` + `exclude`; sin `--no-warn-ignored`: equivalente es `exclude` (archivo fuera del grafo, cero mensajes).

Baseline fase 1: `npm run depcruise-baseline` (o `npx depcruise-baseline --config .dependency-cruiser.cjs`) genera `.dependency-cruiser-baseline.json`; luego CI con `--ignore-known` no bloquea violaciones conocidas. Tras limpiar deuda (ciclos `client` con `viaNot`, fixtures), se quita `--ignore-known` y se pasa `severity` a `error` para nuevas.

### 4.2 CI (`.github/workflows/ci.yml`)

Jobs existentes: `client-import-bounds` (activo, bloqueante vía agregador `prebuild-quality-complete`), `server-import-bounds` (`if: false`, debe activarse).

- **Gate** (`block`): `npm run depcruise:ci -- --output-type err` → exit = nº errores. Separación correcta con `format:check` (prettier) ya existente.
- **Report** (`no-block`): `if: always()`, `npm run depcruise:report -- --output-type err-html -f report.html` + `actions/upload-artifact`. No debe ser `if: failure()` porque queremos reporte incluso con éxito (para inspección de grafo).
- **Cache**: `npm run depcruise:ci -- --cache` + `actions/cache` de `node_modules`.
- **Filtro `shared` (`repo-discovery`)**: añadir `.dependency-cruiser.cjs` y `apps/*/.dependency-cruiser.cjs` para que cambios de configuración disparen ambos jobs.
- **No renombrar jobs**: `client-import-bounds`/`server-import-bounds` mantienen ids (spec `ci-prebuild-substage-structure` fija 13 jobs con `needs` l.716/733 + agregadores l.1085/1091).
- **Fase 1 no-blocking**: `continue-on-error: true` (patrón `*-dead-code`) o usar `severity: warn` + `--ignore-known`. Fase 2 (`error` + quitar `continue-on-error`) tras limpiar deuda.

Referencia CI: `docs/CONTEXT-CICD.md` (§13.4 tabla configs, estados jobs), `.github/workflows/ci.yml` (l.508/596).

## 5. Pipeline / Proyecto

1. **Editor**: `.dependency-cruiser.cjs` + `$schema` → autocompletado de reglas y opciones; `comment` explica cada `forbidden`/`allowed`. No hay `format-on-save` automático (no es prettier), pero el editor valida con `JSON` schema.
2. **Pre-commit (`lint-staged`)**: `depcruise --output-type err-long` sobre staged files → detecta violaciones antes del push; baseline (`--ignore-known`) evita rojo masivo inicial; `severity: warn` en fase 1.
3. **CI (`client-import-bounds`/`server-import-bounds`)**: gate `err` bloquea PR con `error` (cross-workspace, `not-to-dev-dep`, `circular` si se activa `error`); report `err-html` guarda grafo para inspección; `--cache` acelera; `shared` filter mantiene sincronía.
4. **Rollback / Reversión**: `git revert <sha>` de cambio `import-boundaries`; `dependency-cruiser` no modifica código fuente (solo analiza) → rollback = restaurar `.dependency-cruiser.cjs` o quitar reglas nuevas.
5. **Comparación con `knip.jsonc`**: `knip.jsonc` (root) unifica `workspaces` (`.`/`client`/`server`/`e2e`) y analiza `unused`/`exports`/`dependencies`; `dependency-cruiser` analiza el grafo de imports entre archivos. Ambos deben ser coherentes: `knip` ignora archivos en `ignoreDependencies`/`ignoreIssues`; `dependency-cruiser` los excluye con `exclude`. Si `knip` muestra un archivo `unused`, `dependency-cruiser` podría mostrarlo como `unreachable` (`reachable: false`) — usar ambos como señales de limpieza.

Referencia `knip.jsonc`: `docs/learning/knip-configuration.md`; `docs/CONTEXT-CICD.md` (§13.4).

## 6. Referencias oficiales

- `https://github.com/sverweij/dependency-cruiser/blob/master/doc/rules-reference.md`
- `https://github.com/sverweij/dependency-cruiser/blob/master/doc/options-reference.md`
- `https://github.com/sverweij/dependency-cruiser/blob/master/doc/cli.md`
- Config JSON schema: `node_modules/dependency-cruiser/src/schema/configuration.schema.json`
- `package.json` `dependency-cruiser` 18.2.0 (pin exacto, sin `^`, para reproducibilidad del grafo)

## 7. Tabla de reglas (Markdown)

| Regla               | Severidad                     | From          | To            | Comentario ES                                                                               |
| ------------------- | ----------------------------- | ------------- | ------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| no-client-to-server | error                         | ^apps/client/ | ^(apps/server | node_modules/.\*/server)                                                                    | Evita fugas de capa client→server sin contrato explícito |
| no-server-to-client | error                         | ^apps/server/ | ^apps/client/ | Evita fugas de capa server→client sin contrato explícito                                    |
| no-e2e-to-apps      | error                         | ^e2e/         | ^apps/        | e2e solo importa fixtures de test, no código de aplicación                                  |
| no-circular         | warn (client), error (server) | any           | any           | Evita dependencias circulares; viaNot para excluir ciclos documentados (deuda 24 en client) |
| no-orphan           | warn                          | any           | any           | Evita archivos no requeridos por ningún entrypoint; excluye tests/mocks/stories             |
| not-to-dev-dep      | error                         | any           | any           | Runtime no debe depender de devDependencies                                                 |
| not-to-unresolvable | error                         | any           | any           | Evita imports que no pueden resolverse (error de build)                                     |

## 8. Notas de implementación (para change `import-boundaries`)

- Coordinación con `server-typescript-migration`: regexes `.ts` y `tsconfig.json` server → `import-boundaries` amplía regexes `.js$`→`\.(js|ts)$` en `.dependency-cruiser.cjs`; config `client` mantiene `jsconfig.json` (`--ts-config apps/client/jsconfig.json`).
- `eslint-plugin-import`: no reinstalar (desinstalado, decision registrada en `docs/learning/eslint-configuration.md` l.529 — `dependency-cruiser` es dueño único de boundaries).
- `e2e`: si `e2e` debe importar `client`/`server` (ej. fixtures de datos), usar `allowed` o `exclude`; si no, `no-e2e-to-apps` error + `options.exclude`. En proyecto hoy: Playwright no importa código de apps → regla `error` es segura.
- Fase 1: `continue-on-error: true` + `warn` + `--ignore-known`; fase 2: quitar `continue-on-error`, `severity: error`, sin `--ignore-known`. Reporte `err-html` debe mantenerse siempre (no-blocking) para inspección de grafo.
- **Ejemplo de uso de baseline**: tras generar `.dependency-cruiser-baseline.json`, ejecutar `npx depcruise --config .dependency-cruiser.cjs --output-type err --ignore-known .` para validar solo nuevas violaciones.
- **Configuración de cache en CI**: usar `actions/cache` con clave `dependency-cruiser-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` para acelerar ejecuciones posteriores.
- **Integración con TypeScript**: para proyectos TS, usar `--ts-config` o `enhancedResolveOptions.alias` para resolver `@` y `baseUrl`; en monorepo, cada workspace puede tener su propio `tsconfig.json` o `jsconfig.json`.
- **Comparación con otras herramientas**: vs `madge` (detecta ciclos pero sin reglas por capa), vs `dependency-check` (enfocado en vulnerabilidades de seguridad), `dependency-cruiser` brinda control fino de boundaries con severidad y reporte.

## 9. Pipeline completo (4 capas)

1. **Editor (opcional)**: autocompletado de reglas via `$schema` en `.dependency-cruiser.cjs`; comentarios explicativos en CJS/JS.
2. **Pre-commit (shifting-left)**: `lint-staged` ejecuta `depcruise --config .dependency-cruiser.cjs --output-type err-long` sobre archivos staged; detecta violaciones antes del push; baseline (`depcruise-baseline.json` + `--ignore-known`) en fase 1 evita bloqueo por deuda conocida.
3. **CI (gate)**: `client-import-bounds` y `server-import-bounds` ejecutan `depcruise --config .dependency-cruiser.cjs --output-type err`; exit code distinto de 0 bloquea el PR (solo violaciones `severity: error`).
4. **CI (report)**: job/step `if: always()` ejecuta `depcruise --config .dependency-cruiser.cjs --output-type err-html -f report.html` + `actions/upload-artifact`; reporte disponible en UI de GitHub Actions para inspección de grafo y tendencias.

## 10. Comparación con `knip.jsonc` y `eslint.config.js`

- `knip.jsonc`: analiza archivos sin usar, exports sin usar, dependencias innecesarias en `package.json`; trabaja a nivel de archivos y paquetes.
- `dependency-cruiser`: analiza el grafo de imports entre archivos; detecta ciclos, orfanos, boundaries cruzadas, alcance.
- `eslint.config.js`: analiza calidad y estilo de código (complexity, formato, mejores prácticas); no analiza dependencias entre archivos.
- Los tres se complementan: `knip` para limpieza de paquetes, `dependency-cruiser` para arquitectura de imports, `eslint` para calidad de código.

## 11. Referencias a documentación existente

- `docs/learning/knip-configuration.md`: explica trabajo con workspaces y detección de código muerto.
- `docs/CONTEXT-CICD.md` (§13.4): tabla de herramientas de calidad y estados de jobs CI.
- `docs/learning/eslint-configuration.md` (l.529): ownership de import boundaries asignado a `dependency-cruiser` (no a `eslint-plugin-import`).
- `docs/learning/typescript-migration-server.md` (l.69): regexes para detección de archivos `.ts` en change activo `server-typescript-migration`.

## 12. Próximos pasos (post-implementación)

- Medir baseline actual: `npx depcruise --config .dependency-cruiser.cjs --output-type err .` para ver violaciones iniciales.
- Generar baseline: `npx depcruise-baseline --config .dependency-cruiser.cjs` o `npx depcruise --config .dependency-cruiser.cjs --output-type baseline .dependency-cruiser-baseline.json`.
- Fase 1: activar `server-import-bounds` con `continue-on-error: true` y `severity: warn` en rules (o usar `--ignore-known`).
- Revisar deuda: ciclos documentados en `client` (24 ciclos vía `modules/*/api → config/axios → redux/store`), fixtures en `tests/`.
- Fase 2: tras limpiar deuda, quitar `continue-on-error` y cambiar `severity` a `error` para reglas críticas.
- Mantener reporte `err-html` en CI para inspección de grafo y evolución de dependencias.

## 13. Glosario

- **Boundary**: límite entre módulos o capas (ej. client vs server).
- **Entrypoint**: archivo desde el cual comienza el análisis (ej. `src/main.jsx`, `src/bin/index.js`).
- **Orphan**: módulo no requerido por ningún entrypoint.
- **Unreachable**: módulo que no puede alcanzarse desde ningún entrypoint (similar a orphan pero considerando el grafo completo).
- **Circular**: ciclo de dependencias (A → B → C → A).
- **Severity**: nivel de importancia de una violación (`error` bloquea, `warn` advertencia, `info` informativo).
- **Baseline**: archivo JSON con violaciones conocidas que se ignoran en ejecuciones posteriores (`--ignore-known`).
- **Shifting-left**: mover verificaciones temprano en el ciclo de desarrollo (pre-commit antes de CI).
- **Gate**: trabajo CI que bloquea el PR si falla (exit code ≠ 0).
- **Report**: trabajo CI que genera artefacto sin bloquear (siempre se ejecuta, `if: always()`).

## 14. Conclusión

La implementación profesional de import boundaries con `dependency-cruiser` en un monorepo requiere: configuración raíz única con `$schema` y `extends`, reglas por capa con severidad adecuada, integración en shifting-left (`lint-staged` + baseline), CI separado en gate (`err`) y report (`err-html`), documentación canónica en español, y coordinación con cambios relacionados (ej. `server-typescript-migration`). Este enfoque garantiza que la arquitectura del monorepo se mantenga intencional y visible, evitando fugas de capas y dependencias no deseadas, mientras permite una adopción gradual mediante baseline y fases de severidad.

Referencias adicionales: https://dependency-cruiser.org/, https://github.com/sverweij/dependency-cruiser#readme.
