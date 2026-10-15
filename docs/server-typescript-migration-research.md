# Investigación: Migración JS → TS de `apps/server` — Codebase + Internet (2026-10-14)

> **Objetivo del documento:** consolidar (1) el análisis verificado del codebase `apps/server`, (2) la investigación de internet de 2026 sobre runtime TS en Node, estrategias de migración, strict flags, tipos y CI/Docker, y (3) el gap analysis contra el change OpenSpec activo `openspec/changes/server-typescript-migration/`, para cerrar las Fases B y C de la tarea de investigación.
> **Estado:** investigación completada; el change NO fue modificado (correcciones listadas en §5, pendientes de aplicación en Fase D).
> **Complementa (no reemplaza):** [`docs/learning/typescript-migration-server.md`](learning/typescript-migration-server.md) (investigación canónica 2026-09-23) y [`openspec/changes/server-typescript-migration/`](../openspec/changes/server-typescript-migration/README.md).

---

## 1. Resumen ejecutivo

El workspace `apps/server` sigue siendo 100% JavaScript (208 `.js` en `src/`, 29.121 LOC, 0 `.ts`) con las condiciones estructurales favorables ya documentadas (ESM puro, 389/389 imports relativos con `.js`, gate `server-typecheck` activo en CI). La investigación de internet confirma que la **estrategia del change es correcta en lo esencial** (strangler fig con `allowJs` + `noEmit`, conversión por archivo, strict por flags en orden de coste creciente con `noUncheckedIndexedAccess` al final) y coincide con el estado del arte 2025-2026. Sin embargo, revela **dos huecos nuevos y dos errores factuales** que ninguna fase anterior detectó:

1. **El runtime endgame está sin resolver y ahora tiene fecha:** Node 20 (la imagen Docker y el `engines` actual) llegó a **EOL el 2026-04-30**; el type-stripping nativo de TS (la vía "no build step" que el change asume) solo existe en Node ≥22.18 y **exige especificadores `./x.ts` explícitos**, lo que choca frontalmente con la decisión "rewriting imports a `.ts` fuera de scope para siempre". Hace falta una decisión de usuario ANTES de la Fase 3 (§6).
2. **ESLint no puede lintear `.ts` hoy:** no hay parser TypeScript (`typescript-eslint`) en `eslint.config.js` — el change planifica ampliar globs a `{js,ts}` sin añadirlo; el primer archivo convertido revienta lint.
3. **Los filtros de test por substring (`.unit.test.js`) perderían silenciosamente los tests convertidos a `.ts`** — no están en el alcance de la task 1.2.
4. **Errores factuales en `design.md` §8** (lint-staged/eslint "ya cubre ts" — falso) y en el **target de dep-cruiser** (los regex a ampliar no están en `apps/server/.dependency-cruiser.cjs`, sino en la raíz, y ya cubren `(js|ts)`).

Además: `@types/express` debe **pinearse a `^4`** (la task 1.4 no fija versión; hoy publica 5.0.6 y rompe con runtime Express 4), `@typedef` es **0** en todo `src/` (la regla (c) del protocolo de conversión apunta a un anotación inexistente), y `incremental: true` se asume en el design pero no está en ningún tsconfig.

---

## 2. Análisis del codebase (verificado 2026-10-14)

### 2.1 Inventario

| Métrica                                       | Valor                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.js` en `src/`                               | **208 archivos / 29.121 LOC**                                                                                                                                         |
| `.js` en `tests/`                             | **23 archivos / 2.045 LOC**                                                                                                                                           |
| `.ts` en `apps/server`                        | **0**                                                                                                                                                                 |
| Total `.js` (excl. `node_modules`/`coverage`) | 236 (208 src + 23 tests + 4 root configs + `prisma/seed.js`)                                                                                                          |
| Configs root                                  | `vitest.config.js` (111 LOC), `ecosystem.config.js` (54), `test-sanitize.js` (43), `vitest.smoke.config.js` (26), `.dependency-cruiser.cjs` (24), `test-sanitize.mjs` |
| Scripts                                       | `scripts/preview-smoke.mjs` (1 archivo)                                                                                                                               |
| Módulos de negocio                            | **24** (`src/modules/*`)                                                                                                                                              |

**Desglose `src/` por directorio (archivos / LOC):**

| Directorio        | Archivos | LOC    | Notas                                                       |
| ----------------- | -------- | ------ | ----------------------------------------------------------- |
| `src/modules/`    | 139      | 20.194 | 24 módulos, patrón controller/dao/routes/schemas/service    |
| `src/socket/`     | 22       | 2.381  | incluye `adapter.js` con 1 `await import()` dinámico        |
| `src/utils/`      | 19       | 2.038  | `joiSchemas` 577 LOC                                        |
| `src/middleware/` | 12       | 1.154  |                                                             |
| `src/docs/`       | 2        | 2.899  | `schemas.js` = 2.868 (OpenAPI JSDoc en strings — no migrar) |
| `src/config/`     | 5        | 96     | hojas del grafo                                             |
| `src/logger/`     | 4        | 146    | hojas del grafo                                             |
| `src/common/`     | 2        | 6      |                                                             |
| `src/routes/`     | 1        | 49     |                                                             |
| `src/bin/`        | 1        | 45     | entry point `index.js`                                      |
| `src/app.js`      | 1        | —      | raíz de la app                                              |

> El baseline "228 JS files" del change es un conteo anterior; el conteo exacto de hoy es **236 `.js`** (o 208 si solo se mira `src/`). Actualizar al cierre de Fase 0 (task 1.8).

### 2.2 Verificaciones de conversibilidad

| Verificación                          | Resultado                                                                                                                                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"type": "module"` (ESM)              | ✅ sí                                                                                                                                                                                                             |
| `require()` reales en `src/`          | **0** (1 comentario en `logger/dev.js` + 1 snippet en README de `socket/levels/`)                                                                                                                                 |
| `import.meta` / `__dirname` en `src/` | **0** — solo en configs de vitest y 2 archivos de `tests/` (patrón `fileURLToPath` ya ESM-safe)                                                                                                                   |
| Imports relativos con `.js`           | 389/389 (doc canónico, sin cambio)                                                                                                                                                                                |
| Instancias `new PrismaClient`         | **2** ✅ coincide con el proposal: `src/config/db.js` (con `log`) y `src/socket/handler.js` (sin opciones)                                                                                                        |
| Anotaciones JSDoc en `src/`           | `@param` **2.099** + `@returns` **491** = **2.590** en 93 archivos (~2.556 del doc canónico)                                                                                                                      |
| `@typedef` en `src/`                  | **0** ❌ — la regla (c) del protocolo ("el `@typedef` muere en el commit de conversión") no aplica a ningún archivo actual; verificar origen del claim canónico                                                   |
| `@type` (JSDoc) en `src/`             | **0**                                                                                                                                                                                                             |
| `process.env.*` en `src/`             | **20** accesos (19 dot-access + 1 bracket en `config/dotenv.js:17`); distintos: `NODE_ENV` 13, `AWS_ENDPOINT_URL` 2, `SECRET_NAME`, `REDIS_URL`, `ENABLE_SMOKE_ROUTE`, `AWS_REGION` — proposal dice 19 (drift +1) |
| Entry point                           | `src/bin/index.js` referenciado en: `package.json` (`main` + `dev` nodemon), `ecosystem.config.js:20` (PM2), **`Dockerfile:53` (CMD)**, comentarios doc (`socket/adapter.js`, `socket/levels/level-11-scale.js`)  |
| Decorators / sintaxis experimental TS | 0 (JS puro)                                                                                                                                                                                                       |

### 2.3 Toolchain y CI (estado verificado hoy)

| Pieza                               | Estado actual                                                                                                                                                                                                           | ¿Listo para `.ts`?                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------- | --------------------- |
| `tsconfig.json` raíz                | `target ES2022`, `module/moduleResolution: nodenext`, `allowJs`, `checkJs: false`, `noEmit`, `skipLibCheck`, `esModuleInterop`, `resolveJsonModule`; **sin `strict`, sin `incremental`, sin `types`**                   | Parcial                                                                                           |
| `apps/server/tsconfig.json`         | `extends` raíz, `include: ["src/**/*"]` (los `tests/` NO entran al typecheck), `exclude: node_modules`                                                                                                                  | Parcial                                                                                           |
| CI `server-typecheck` (ci.yml L568) | **ACTIVO**, `npx tsc --noEmit` con `working-directory: apps/server`, sin `if: false` ni `\|\| echo`; en `needs` de `prebuild-quality-complete` (L1777)                                                                  | ✅                                                                                                |
| Script raíz `type-check`            | `tsc --noEmit -p apps/server` (package.json L80)                                                                                                                                                                        | ✅                                                                                                |
| TypeScript                          | **5.9.3** (root devDep)                                                                                                                                                                                                 | ✅                                                                                                |
| ESLint flat config                  | ESLint 9.39; bloque backend `files: ['apps/server/**/*.js']` (L121); complexity core `apps/*/src/**/*.{js,jsx}` (L383); tests `**/*.test.{js,jsx}` (L419). **Sin parser TypeScript, sin `typescript-eslint`**           | ❌ **Bloqueante**                                                                                 |
| lint-staged (raíz)                  | prettier `*.{js,jsx,ts,tsx,cjs,mjs,...}` ✅; **eslint `*.{js,jsx,cjs,mjs}` sin `ts`** ❌; depcruise `*.{js,jsx,ts,tsx,cjs,mjs}` ✅                                                                                      | ❌ (eslint)                                                                                       |
| knip (`knip.jsonc` sección server)  | `project: ["src/**/*.js","prisma/**/*.js","tests/**/*.js"]` — ampliable; ignore lista dead code (`clientOrder`×4, `providerOrder`×5, `users/constants`, etc.)                                                           | Ampliación task 1.2 ✅                                                                            |
| dependency-cruiser                  | v18.2.0; config server = `extends` de la raíz (sin regexes propias); la \*\*raíz ya cubre `(js                                                                                                                          | ts)`** en controller (L130/133), dao (L146), orphans/configs (L177); `tsPreCompilationDeps: true` | ✅ casi listo |
| Vitest                              | v4 (server ^4.0.18, root ^4.1.11); corre `.ts` nativamente (esbuild); `include` = 3 globs **solo `.js`**; **scripts `test:unit`/`test:integration` filtran por substring `".unit.test.js"` / `".integration.test.js"`** | ❌ doble gap (globs + filtros npm)                                                                |
| Husky                               | `pre-commit` = lint-staged + SAST + secrets; `commit-msg` = DCO + commitlint                                                                                                                                            | ✅                                                                                                |
| `apps/server/package.json` scripts  | `lint: eslint "**/*.js"`; `format: prettier "**/*.{js,json,md}"`; `build` = no-op; `dev` = `nodemon src/bin/index.js`; `prisma.seed = node prisma/seed.js`                                                              | Ampliable task 1.2                                                                                |
| Docker                              | `node:20-alpine` (⚠️ EOL), single-stage, `CMD ["node", "src/bin/index.js"]`, sin build step                                                                                                                             | Ver §6                                                                                            |
| `@types/*`                          | **No instaladas** ni declaradas: `@types/express                                                                                                                                                                        | jsonwebtoken                                                                                      | bcrypt        | swagger-\*`ausentes;`@types/node` presente solo como transitive | task 1.4 pendiente ✅ |

---

## 3. Hallazgos de internet (con fuentes)

### 3.1 Runtime TS en Node 2025/2026 — type-stripping nativo vs tsx/ts-node

- Type stripping está **habilitado por defecto desde Node 22.18.0 y 23.6.0**, sin warning experimental desde 22.18/24.3, y **estable desde 24.12.0 / 25.2.0**. `--experimental-transform-types` (enums, namespaces, parameter properties) se añadió en 22.7 y **se eliminó en Node 26.0.0** (erasable-syntax-only o precompilar). <br> <sub>https://nodejs.org/api/typescript.html · https://codewithnodejs.com/running-typescript-natively-in-node-js-22-24-and-26/</sub>
- **Los especificadores de import deben llevar la extensión real**: `import './file.ts'`, no `'./file'` ni `'./file.js'` — Node no reescribe `.js`→`.ts`. `allowImportingTsExtensions` permite a `tsc` verificar esos specifiers. <br> <sub>https://nodejs.org/api/typescript.html</sub>
- Sintaxis que exige emisión (enum, namespace con runtime, parameter properties, decorators, `import =`) → error **`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`**. Node **ignora `tsconfig.json`** y **no typechequea** (tsc sigue siendo obligatorio en CI). `.tsx` no soportado. <br> <sub>https://nodejs.org/learn/typescript/run-natively · https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html</sub>
- Config base recomendada por Node (TS 5.8+): `noEmit`, `target: esnext`, `module: nodenext`, **`rewriteRelativeImportExtensions`**, **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**. <br> <sub>https://nodejs.org/api/typescript.html</sub>
- **Node 20 EOL: 2026-04-30** (ya EOL ~5.5 meses); Node 22 = Maintenance LTS hasta **2027-04-30**; Node 24 = Active LTS hasta **2028-04-30**; Node 26 = Current. La guía oficial recomienda saltar de 20 directo a LTS. <br> <sub>https://nodejs.org/en/about/eol · https://github.com/nodejs/release/blob/main/README.md · https://nodejs.org/en/blog/announcements/node-18-eol-support</sub>
- **tsx** es el runner recomendado por la propia doc de Node para "full TypeScript support" (respeta tsconfig, transforma toda la sintaxis); se registra con `node --import tsx` (el `--loader` está deprecado desde Node 20.6). No typechequea → `tsc --noEmit` separado. `ts-node` sigue vivo pero su ESM loader depende de APIs experimentales "que Node romperá" (su propio README lo desaconseja para producción). <br> <sub>https://nodejs.org/learn/typescript/run · https://tsx.hirok.io/dev-api/node-cli · https://github.com/TypeStrong/ts-node</sub>

### 3.2 TS 5.7+ `rewriteRelativeImportExtensions` + `allowImportingTsExtensions`

- TS 5.7 añadió `rewriteRelativeImportExtensions`: reescribe `./foo.ts` → `./foo.js` **solo al emitir**; combinado con `allowImportingTsExtensions` (válido con `noEmit`, nuestro caso) permite escribir `.ts` y verificar sin emitir — el combo "in-place run + compile opcional". Maduro en TS 5.9 (la versión del repo). <br> <sub>https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html · https://www.typescriptlang.org/tsconfig/allowImportingTsExtensions.html · https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html</sub>
- Node publica un **codemod oficial de una sola pasada** `.js`→`.ts` en specifiers (verifica que el destino existe; respeta archivos ambiguos) — precisamente la operación que el change declara "out of scope forever". <br> <sub>https://nodejs.org/learn/userland-migrations/correct-ts-specifiers</sub>
- `tsc --init` en TS 5.9 ya genera `nodenext` + `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` — el set "moderno" por defecto. <br> <sub>https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html</sub>
- TypeScript 6.0 (transición a 7.0/Go) será "largamente compatible" con 5.9 — no hay urgencia por upgrades de compiler. <br> <sub>https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/</sub>

### 3.3 typescript-eslint con ESLint 9 (flat config)

- Setup mínimo oficial: instalar **un solo paquete `typescript-eslint`** (+ `@eslint/js`, `eslint`, `typescript`) y usar `defineConfig` con `tseslint.configs.recommended`; los paquetes sueltos `@typescript-eslint/parser` y `.../eslint-plugin` **no se instalan por separado en ESLint 9** (incluidos como deps del meta-paquete). <br> <sub>https://typescript-eslint.io/getting-started/ · https://typescript-eslint.io/packages/typescript-eslint/</sub>
- Las configs compartidas ya declaran parser y plugin — sin `languageOptions.parser` manual. **Typed linting** (`projectService: true`, `recommendedTypeChecked`) es opcional y debe posponerse (puede fallar con `checkJs` y archivos `.js` no incluidos en el tsconfig); para Fase 0 basta `recommended` sin tipo. <br> <sub>https://typescript-eslint.io/getting-started/typed-linting</sub>
- `eslint.configs.recommended` + `tseslint.configs.recommended` restringido con `files: ['**/*.{js,ts}']` evita aplicar el parser TS a otros filetypes. <br> <sub>https://typescript-eslint.io/getting-started/</sub>

### 3.4 Estrategia de migración: gradual vs big-bang (estado 2025-2026)

- **Estudio académico (Politowski et al., 102 proyectos GitHub)**: la mayoría migra de forma "sudden" (big-bang) sin reemplazar todo el JS; se identificaron 5 estrategias de "sudden" a gradual; la migración reduce issues de type-safety/maintainability pero **aumenta complejidad cognitiva** — el riesgo del big-bang es real. <br> <sub>https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5614285</sub>
- **Stripe (3.7M LOC Flow→TS en un PR)**: big-bang con codemod propio (heredado de Airtable), `@ts-expect-error` masivo depurado de 97k→37k supresiones, project references por memoria, actualización de TODA la toolchain (ESLint/Jest/Webpack) antes del merge — validación que nuestro Fase 0 sistematiza. Contra: requiere equipo dedicado y control total del tooling. <br> <sub>https://stripe.dev/blog/migrating-to-typescript</sub>
- **WorkMade (160k LOC, Express + GraphQL, 6 semanas, zero downtime)**: branch dedicada con renombrado masivo + rebase periódico, tipado incremental de módulos críticos, CI en cada rebase, `ts-migrate` + `jscodeshift`, monitorización en staging antes del corte. Caso Express más parecido al nuestro. <br> <sub>https://benhowdle.im/migrating-js-to-ts-zero-downtime.html</sub>
- **Consenso de guías 2025 incremental**: `allowJs` + `checkJs` **scoped** (por directorio o `// @ts-check` por archivo, no global — global ahoga con ruido de `node_modules`), JSDoc primero y rename después (separable en 2 commits), strict por flags uno a uno con `tsc --noEmit 2>&1 | wc -l` de baseline, **`strictNullChecks` al final**, CI que impide regresiones del baseline. <br> <sub>https://codezup.com/migrating-from-javascript-to-typescript-guide/ · https://devcerts.org/blog/migrating-javascript-to-typescript-without-stopping-delivery · https://typescript.page/migrate-large-js-to-typescript</sub>
- **Codemods JSDoc→TS**: `cspotcode/js-to-ts-codemods` (jscodeshift, convierte anotaciones JSDoc→TS), `microsoft/ts-fix` (aplica el codefix "convert JSDoc typedef" a todo el proyecto), `ts-migrate` (Airbnb — pero inserta `any` grosero, inservible para nuestro "no new any"), TS quick-fix integrado (`fixJSDocTypes` — no borra el JSDoc). El handbook oficial sigue recomendando rename manual + arreglar errores. <br> <sub>https://github.com/cspotcode/js-to-ts-codemods · https://github.com/microsoft/TypeScript/issues/19285 · https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html</sub>

### 3.5 Orden de flags strict (validado con fuentes oficiales)

- **tsconfig reference** (normativa): `strict` activa toda la familia; los opt-ins fuera de la familia son `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, etc. <br> <sub>https://www.typescriptlang.org/tsconfig/ · https://www.typescriptlang.org/tsconfig/strict</sub>
- **`noUncheckedIndexedAccess` NO forma parte de `strict` por decisión deliberada** (microsoft/TypeScript#49169: "overwhelmingly false positives" en codebases existentes) → debe ser un paso propio y tardío: **el orden del change está confirmado por la fuente oficial**. <br> <sub>https://github.com/microsoft/TypeScript/issues/49169 · https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html</sub>
- **Handbook "Migrating from JS"**: `allowJs` → beneficios inmediatos con `noImplicitReturns`/`noFallthroughCasesInSwitch` → `noImplicitAny` **antes de modificar archivos** → `strictNullChecks` como paso mayor. El orden del change (cheap → familia → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess` → `strict: true` consolidador) es coherente con todo lo anterior. <br> <sub>https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html</sub>
- Nota: desde TS 5.6 `strict` incluye también `strictBuiltinIteratorReturn` — el "consolidador" task 5.7 (`strict: true`) lo absorbe automáticamente; no requiere task extra.
- Práctica de referencia: guía de settings strict de Sentry (qué errores trae cada flag y cómo responder). <br> <sub>https://develop.sentry.dev/frontend/strict-typescript-settings-guide/</sub>

### 3.6 `@types/*` — Express 4 vs 5, jsonwebtoken, bcrypt

- **`@types/express` publica hoy 5.0.6** (DefinitelyTyped). Con runtime `express@^4.19.2` **hay que pinear `@types/express@^4.17.21`**: un rango `*`/sin pin resuelve a tipos v5 → errores TS2769, retorno `Response` incompatible con `void | Promise<void>`, etc. (incidente conocidísimo: expressjs/express#5987). **La task 1.4 del change no fija versión → debe corregirse.** <br> <sub>https://registry.npmjs.org/@types/express · https://github.com/expressjs/express/issues/5987 · https://github.com/DefinitelyTyped/DefinitelyTyped/pull/70563 · https://github.com/DefinitelyTyped/DefinitelyTyped/pull/71249</sub>
- **`jsonwebtoken` NO incluye tipos**: sigue necesitándose `@types/jsonwebtoken` (9.0.x, en DT; `expiresIn` tipado vía `ms.StringValue` desde 9.0.8). <br> <sub>https://github.com/DefinitelyTyped/DefinitelyTyped/pull/71721</sub>
- **`bcrypt@6` NO incluye tipos**: `@types/bcrypt@6.0.0` (DT, deps: `@types/node`). No hay motivo para bcryptjs (cambio de librería = fuera de alcance). <br> <sub>https://canirequire.com/package/bcrypt/ · https://www.npmjs.com/package/@types/bcrypt</sub>
- `swagger-jsdoc`/`swagger-ui-express`: siguen en DT (`@types/swagger-jsdoc`, `@types/swagger-ui-express` — esta última arrastra `@types/express*`, otro motivo más para pinear express a `^4`).

### 3.7 Prisma + TS

- **Singleton obligatorio**: una única instancia de `PrismaClient` en toda la app (cada instancia = un pool de conexiones; patrón `globalThis` en dev). El repo tiene **2 instancias** — `config/db.js` y `socket/handler.js` — consolidar en `config/db.ts` (Fase 1) es la mayor ganancia de la migración. <br> <sub>https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management · https://www.prisma.io/docs/orm/more/troubleshooting/nextjs</sub>
- Los tipos generados (`.d.ts` en `node_modules/.prisma/client` con `prisma-client-js`, vía `postinstall: prisma generate`) fluyen sin configuración adicional con `allowJs`/`skipLibCheck`. <br> <sub>https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction</sub>
- **Prisma 7 (nov-2025)**: ESM-first, cliente rust-free, `output` obligatorio fuera de `node_modules`, driver adapters obligatorios, **eliminó el postinstall hook** (el `postinstall: prisma generate` del repo habría que hacerlo explícito al upgrades) y ofrece `importFileExtension = "ts"` para runtimes tsx. Upgrade de Prisma 5→7 es **fuerza mayor aparte** (5.x sigue funcionando) — no acoplarlo a esta migración. <br> <sub>https://www.prisma.io/changelog/2025-11-19-prisma-orm-7 · https://github.com/prisma/skills/blob/main/prisma-upgrade-v7/references/esm-support.md</sub>

### 3.8 Vitest 4 + TS

- Vitest ejecuta TS nativamente (Vite/esbuild) — **sin tipo-checking** en runtime; el typecheck queda en `tsc --noEmit` (ya activo). No existe opción `tsconfig` por invocación: usa el tsconfig del proyecto. <br> <sub>https://vitest.dev/config/ · https://github.com/vitest-dev/vitest/discussions/1291</sub>
- `test.include` default es `['**/*.{test,spec}.?(c|m)[jt]s?(x)']` — **los globs actuales del repo filtran `.js` explícitamente** y deben ganar variantes `.ts` (task 1.2 ✅), **y los filtros CLI por substring de `package.json` (`".unit.test.js"`, `".integration.test.js"`) excluirían los tests convertidos** (gap nuevo, §5). <br> <sub>https://vitest.dev/config/include · https://vitest.dev/guide/cli</sub>
- Modo `typecheck` (tsc dentro de vitest) existe pero es redundante con el job `server-typecheck` — no adoptar. <br> <sub>https://vitest.dev/config/typecheck</sub>

### 3.9 Docker / CI con TS

- Patrón CI 2025-2026: **job `typecheck` (`tsc --noEmit`) en paralelo al job `build`** (bundler/esbuild), `needs` en deploy — el typecheck nunca emite; el build nunca typechequea. Nuestro `server-typecheck` ya es exactamente el primer job; el "build" sigue siendo no-op mientras no haya emit. <br> <sub>https://nodejs.codeguides.io/linting-formatting/typecheck-in-ci/ · https://jsmanifest.com/typescript-noemit-type-only-builds</sub>
- Docker multi-stage TS clásico: `deps → build (tsc) → prod (node dist/main.js)`; alternativa sin build: imagen Node ≥22.18+ con strip-types nativo. En ambos casos, **`node:20-alpine` debe cambiarse** (EOL + sin strip-types). <br> <sub>https://nodejs.codeguides.io/docker/multi-stage-builds/ · https://nodejs.codeguides.io/typescript-node/typescript-to-node-pipeline/</sub>
- Cuidado con `bcrypt` (nativo): compilar en la stage Linux de build, no localmente. <br> <sub>https://nodejs.codeguides.io/docker/multi-stage-builds/</sub>

---

## 4. Gap analysis: hallazgos vs change actual

| #   | Hallazgo                                                                                                                                              | ¿Cubre el change?                                                                                                                                                     | Gravedad                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------- |
| 1   | **ESLint sin parser TS** (`typescript-eslint` ausente)                                                                                                | ❌ task 1.2 amplía globs a `{js,ts}` sin instalar parser → primer `.ts` = `Parsing error` en lint, contradice el spec "First converted file is covered by every gate" | **Alta — bloqueante Fase 0**                                                   |
| 2   | **Filtro de tests por substring `.unit.test.js`**                                                                                                     | ❌ task 1.2 no toca scripts `test:unit`/`test:integration`/`test:changed` → tests convertidos no se ejecutan (pérdida silenciosa)                                     | **Alta**                                                                       |
| 3   | **Runtime endgame: Node 20 EOL + strip-types exige `.ts` specifiers**                                                                                 | ❌ design lo declara Non-Goal ("Node ejecuta los `.js` nativos" solo cierta mientras queden `.js`); no resuelve cómo corre `bin/index.ts` (§6 de este doc)            | **Alta — decisión de usuario**                                                 |
| 4   | **`design.md` §8 falso**: afirma "eslint [de lint-staged] ya lista `ts` en sus globs — verificado 2026-10-01"                                         | ❌ real: `"*.{js,jsx,cjs,mjs}"` (confirmado en `docs/code-style.md` L72); task 5.8 fallaría tal como está escrita                                                     | **Media — error factual**                                                      |
| 5   | **Target de dep-cruiser equivocado** (task 1.2/impact: `apps/server/.dependency-cruiser.cjs`)                                                         | ❌ ese archivo no tiene regexes (solo `extends`); la raíz ya cubre `(js                                                                                               | ts)`; lo único real: añadir `options.tsConfig.fileName` en server si se quiere | **Media — error factual** |
| 6   | **Dockerfile `CMD ["node","src/bin/index.js"]` ausente** de impact/tasks 4.1                                                                          | ❌ tasks 4.1 menciona `main`/`ecosystem`/nodemon pero no Dockerfile ni compose → Fase 3 rompe el contenedor                                                           | **Media**                                                                      |
| 7   | **`@types/express` sin pinear `^4`** (task 1.4)                                                                                                       | ❌ instalar `@types/express` sin versión tira 5.0.6 → ruido de errores ajenos al baseline 1.3                                                                         | **Media**                                                                      |
| 8   | **`incremental: true` no existe** en tsconfig (design §1 y task 1.5 lo asumen)                                                                        | Parcial — ningún task lo añade explícitamente                                                                                                                         | Baja                                                                           |
| 9   | **`include` del server tsconfig = solo `src/**/\*`\*\*                                                                                                | ❌ tests convertidos a `.ts` (Fase 2 done: "tests del módulo en `.ts`") quedarían sin typecheck                                                                       | Baja                                                                           |
| 10  | **Baseline numérico desfasado**: "228 JS" vs 236 reales; `@typedef`=0 vs claim "2.556 ... `@typedef`"; `process.env` 19 vs 20; tests "18" vs 23 `.js` | Parcial — task 1.8 pide registrar baseline pero no lista estas correcciones                                                                                           | Baja                                                                           |
| 11  | **`@types/node` solo transitive** (no declarado)                                                                                                      | ❌ task 1.4 no lo lista (lo traerá `@types/express`, pero conviene declararlo)                                                                                        | Baja                                                                           |
| 12  | Orden de strict flags                                                                                                                                 | ✅ **validado** con tsconfig reference + TS#49169 + handbook — sin cambios                                                                                            | OK                                                                             |
| 13  | Strangler fig `allowJs+noEmit`, conversión por archivo, job CI activo, vitest esbuild, knip/dep-cruiser ampliables                                    | ✅ coherente con state of the art 2025-2026 — sin cambios                                                                                                             | OK                                                                             |

---

## 5. Riesgos

| Riesgo                                                                                                                                                                                                                                                             | Impacto                                                                           | Mitigación / nota                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Race runtime (el mayor)**: `engines >=20` + `node:20-alpine` EOL (2026-04-30) + noEmit + "imports `.js` forever" → al convertir el entry en Fase 3, `node src/bin/index.ts` no arranca en Node 20 (sin strip-types) y en Node ≥22 falla por los specifiers `.js` | Server no despliega en Fase 3                                                     | **Decisión de usuario (§6)** antes de Fase 3; upgrade de Node 20→22/24 independiente por seguridad (hacer ya en Fase 0)         |
| ESLint sin parser TS                                                                                                                                                                                                                                               | Gate lint rojo en el primer `.ts`, o peor: globs no ampliados y `.ts` sin lintear | Añadir `typescript-eslint` a task 1.2 (gap 1)                                                                                   |
| Tests `.ts` fuera de los filtros/substrings                                                                                                                                                                                                                        | Suite verde con tests no ejecutados (falso verde)                                 | Ampliar filtros npm + globs `include` en task 1.2 (gap 2)                                                                       |
| `@types/express@5` contra runtime Express 4                                                                                                                                                                                                                        | Cientos de errores ajenos → decide mal el gate `checkJs` 1.3                      | Pinear `^4.17.21` (gap 7)                                                                                                       |
| `checkJs: true` global sobre 208 files                                                                                                                                                                                                                             | Wall of errores (incluido ruido de `node_modules` si `include` lo coge)           | Mantener el gate de decisión del design §2; alternativa validada: `// @ts-check` por archivo/dirigido (codezup/typescript.page) |
| Codemod JSDoc→TS automatizado                                                                                                                                                                                                                                      | Los disponibles insertan `any` (ts-migrate) o no borran JSDoc                     | Mantener el protocolo manual del change (1 archivo = 1 commit); `ts-fix`/`js-to-ts-codemods` solo como asistente opcional       |
| Doble fuente de tipos (JSDoc + `types.ts`)                                                                                                                                                                                                                         | Tipos divergentes                                                                 | Regla (c) válida, pero con `@typedef`=0 la regla hoy es vacía — reencuadrar como "migrar `@param`/`@returns` a firmas TS"       |
| CI se enrosca con `tsc` creciente                                                                                                                                                                                                                                  | Feedback lento                                                                    | Añadir `incremental: true` (gap 8) + cache existente                                                                            |
| `strict: true` de golpe                                                                                                                                                                                                                                            | Miles de errores                                                                  | Orden ya validado (§3.5) — sin cambios                                                                                          |

---

## 6. Recomendación final y plan por fase

### 6.1 Decisión PENDIENTE DE USUARIO — runtime endgame (bloquea Fase 3, no las Fases 0-2)

Las Fases 0-2 **no se bloquean**: mientras exista al menos un `.js` en el grafo de arranque, Node ejecuta `.js` nativos y todo el plan vigente funciona. La decisión solo se necesita **antes de convertir `app.js`/`bin/index.js`**.

| Opción                                                                                 | Cómo                                                                                           | Pros                                                                                                                                                                                                                   | Contras                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. `tsx` como runtime** (`node --import tsx src/bin/index.ts` en PM2/Docker/nodemon) | Mantener `noEmit` + **389 imports `.js` intactos** (tsx resuelve `.js`→`.ts` como Vite/vitest) | ✅ cero build step (respeta el Non-Goal actual); ✅ cero rewrite de imports; ✅ soporta enums/transform completo; ✅ funciona en Node ≥18; cambios localizados: `ecosystem.config.js`, `Dockerfile` CMD, `dev`, `main` | ❌ dependencia runtime nueva; ❌ arranque con overhead de loader; ❌ no typechequea (ya lo hace CI); ❌ "otro loader" que la doc de Node moderna considera prescindible en ≥22.18                                                                                                                                      |
| **B. Upgrade Node ≥22.18 (ideal 24 LTS) + strip-types nativo**                         | `node src/bin/index.ts` con `erasableSyntaxOnly` + `verbatimModuleSyntax` + specifiers `.ts`   | ✅ cero dependencias; ✅ estable (24.12+); ✅ resuelve de paso el **EOL de Node 20** (riesgo de seguridad real, hoy); ✅ camino de futuro oficial                                                                      | ❌ **requiere reabrir la decisión "imports `.js` forever"**: codemod único `.js`→`.ts` (codemod oficial Node disponible); ❌ sin enums/namespaces/decorators (verificar — el repo es JS puro, probablemente erasable al 100%); ❌ `transform-types` desaparece en Node 26; ❌ tocar Dockerfile/engines de todas formas |
| **C. Build step (`tsc`/esbuild → `dist/`)**                                            | Multi-stage Docker `deps→build→prod`, PM2 sobre `dist/`                                        | ✅ runtime JS clásico sin loaders; ✅ patrón estándar documentado (§3.9); ✅ alineado con TS 6/7                                                                                                                       | ❌ rompe el Non-Goal actual: doble fuente de verdad, toca `dev`/`build`/`main`/PM2/Docker/e2e, riesgo de "build olvidado"; ❌ más trabajo que A/B                                                                                                                                                                      |

**Recomendación del researcher:** **corto plazo → A (tsx)** para no reabrir decisiones ni reescribir imports durante las Fases 1-2; **paralelamente, sí o sí upgrade de Node 20→22/24 en Fase 0** por EOL (independiente de TS). Reevaluar B en la Fase 3: si el codebase es 100% erasable-syntax (medible con `erasableSyntaxOnly`), B queda preferente a medio plazo (cero dependencias, soporte oficial); A es el puente más seguro. C solo si se decide apostar por dist/ por otras razones.

### 6.2 Plan validado por fases (con correcciones pendientes marcadas — Fase D)

**Fase 0 — Infraestructura (1 change, sin convertir código)** — orden y alcance del change validados, con estos ajustes:

1. Task 1.1/1.3/1.5: sin cambios; **+ añadir `incremental: true` (y opcional `tsBuildInfoFile`)** al medir (gap 8).
2. Task 1.2 — ampliar a: eslint (bloques backend L121 + complexity L383 + tests L419) **CON `typescript-eslint` instalado y config `tseslint.configs.recommended` acotada a `files` server** (gap 1); `lint`/`format` scripts; knip; vitest `include` **+ filtros substring de `test:*` scripts** (gap 2); dep-cruiser → apuntar a la raíz/verificación, no al config server (gap 5); lint-staged → **añadir `ts` al glob de eslint** (gap 4).
3. Task 1.4 — **pinear `@types/express@^4.17.21`**, + `@types/jsonwebtoken`, `@types/bcrypt@^6`, `@types/swagger-*`, **+ `@types/node` declarado** (gaps 7, 11).
4. **Nueva task:** upgrade de runtime (`engines`, `Dockerfile` base image) Node 20→22/24 — por EOL, no por TS; **+ añadir `Dockerfile` a la tabla de impact** (gap 6).
5. Task 1.8 — actualizar baseline a **236 `.js` (208 src / 23 tests)**, `@typedef=0`, `process.env=20` (gap 10); reencuadrar regla (c) del protocolo (design §5) sin `@typedef`.

**Fases 1-3 — Conversión** (changes separados `server-ts-phase*`): sin cambios estructurales. **+** al abrir la Fase 1: decidir ampliar `include` del tsconfig a `tests/**` cuando los primeros tests pasen a `.ts` (gap 9). `docs/schemas.js` fuera de alcance confirmado.

**Fase 4 — Strict gradual**: orden **validado sin cambios** (§3.5). Mantener `strict: true` como consolidador final (absorbe `strictBuiltinIteratorReturn`).

**Gate previo a Fase 3**: resolver la decisión de §6.1 (usuario) → actualizar `design.md` (Non-Goals + tasks 4.1) en la Fase D.

---

## 7. Cross-links

- Investigación canónica previa: [`docs/learning/typescript-migration-server.md`](learning/typescript-migration-server.md)
- Change afectado (pendiente de correcciones §4-§5): [`openspec/changes/server-typescript-migration/`](../openspec/changes/server-typescript-migration/README.md) — `proposal.md`, `design.md`, `tasks.md`, `specs/server-typescript-incremental-migration/spec.md`, `specs/config-correctness/spec.md`
- Estado CI/CD y métricas de progreso: [`docs/CONTEXT-CICD.md`](CONTEXT-CICD.md)
- Glosario de tooling (incluye el glob real de lint-staged): [`docs/code-style.md`](code-style.md)
- Strict flags doc absorbido: [`docs/learning/typescript-strict-check.md`](learning/typescript-strict-check.md)

## 8. Fuentes

**Node.js / runtime TS**

- <https://nodejs.org/api/typescript.html>
- <https://nodejs.org/learn/typescript/run-natively>
- <https://nodejs.org/learn/typescript/run>
- <https://nodejs.org/learn/userland-migrations/correct-ts-specifiers>
- <https://nodejs.org/en/about/eol>
- <https://github.com/nodejs/release/blob/main/README.md>
- <https://nodejs.org/en/blog/announcements/node-18-eol-support>
- <https://codewithnodejs.com/running-typescript-natively-in-node-js-22-24-and-26/>
- <https://tsx.hirok.io/dev-api/node-cli>
- <https://github.com/TypeStrong/ts-node>

**TypeScript**

- <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html>
- <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html>
- <https://www.typescriptlang.org/tsconfig/allowImportingTsExtensions.html>
- <https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html>
- <https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html>
- <https://www.typescriptlang.org/tsconfig/strict>
- <https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html>
- <https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html>
- <https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/>
- <https://github.com/microsoft/TypeScript/issues/49169>
- <https://github.com/microsoft/TypeScript/issues/19285>
- <https://github.com/cspotcode/js-to-ts-codemods>

**Lint / tooling**

- <https://typescript-eslint.io/getting-started/>
- <https://typescript-eslint.io/packages/typescript-eslint/>
- <https://typescript-eslint.io/getting-started/typed-linting>
- <https://eslint.org/docs/latest/use/configure/migration-guide>

**Migración (casos y guías)**

- <https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5614285>
- <https://stripe.dev/blog/migrating-to-typescript>
- <https://benhowdle.im/migrating-js-to-ts-zero-downtime.html>
- <https://codezup.com/migrating-from-javascript-to-typescript-guide/>
- <https://devcerts.org/blog/migrating-javascript-to-typescript-without-stopping-delivery>
- <https://typescript.page/migrate-large-js-to-typescript>
- <https://develop.sentry.dev/frontend/strict-typescript-settings-guide/>

**Tipos / Prisma / Vitest / Docker**

- <https://registry.npmjs.org/@types/express>
- <https://github.com/expressjs/express/issues/5987>
- <https://github.com/DefinitelyTyped/DefinitelyTyped/pull/70563>
- <https://github.com/DefinitelyTyped/DefinitelyTyped/pull/71721>
- <https://www.npmjs.com/package/@types/bcrypt>
- <https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management>
- <https://www.prisma.io/changelog/2025-11-19-prisma-orm-7>
- <https://github.com/prisma/skills/blob/main/prisma-upgrade-v7/references/esm-support.md>
- <https://vitest.dev/config/include>
- <https://vitest.dev/config/typecheck>
- <https://nodejs.codeguides.io/docker/multi-stage-builds/>
- <https://nodejs.codeguides.io/linting-formatting/typecheck-in-ci/>
- <https://nodejs.codeguides.io/typescript-node/typescript-to-node-pipeline/>
- <https://jsmanifest.com/typescript-noemit-type-only-builds>

> **Verificación local** (2026-10-14): conteos de archivos/LOC/imports/JSDoc/`process.env`, lectura de `package.json` (raíz y server), `tsconfig.json` (raíz y server), `eslint.config.js`, `knip.jsonc`, `.dependency-cruiser.cjs` (raíz y server), `vitest.config.js`, `.husky/*`, `.github/workflows/ci.yml` (L568, L1777), `Dockerfile`, `docs/code-style.md` y del change completo.
