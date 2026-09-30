# Migración de `apps/server` a TypeScript — Investigación y Plan Incremental

> **Objetivo del documento:** registrar la investigación del codebase de `apps/server` (verificada contra los archivos reales el 2026-09-23) y la estrategia de migración a TypeScript que permite convertir el workspace **sin romper la ejecución** en ningún momento.
> **Estado:** investigación completada; la migración NO ha comenzado. Cada fase de la §4 requiere su change OpenSpec.
> **Fuentes oficiales:** [TS Handbook — Migrating from JS](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html) · [tsconfig reference](https://www.typescriptlang.org/tsconfig/) · [Node ESM + TypeScript](https://nodejs.org/api/typescript.html)

---

## 1. Estado actual del codebase (verificado, 2026-09-23)

| Métrica               | Valor                                                                                                                                                    | Relevancia para la migración                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Archivos JS           | 228 (excl. node_modules/coverage); ~29.000 líneas en `src/`                                                                                              | Migración grande → incremental obligatorio                                                         |
| Estructura            | 24 módulos bajo `src/modules/` con patrón uniforme `controller / dao / routes / schemas / service`                                                       | ✅ Convención repetible → el plan por módulos es trivial de hacer cumplir                          |
| Sistema de módulos    | `"type": "module"` (ESM), **0 `require()`** en `src/`, 1 único `await import()` dinámico (`socket/adapter.js` para `ioredis`/`@socket.io/redis-adapter`) | ✅ ESM puro: compatible nativo con `tsc --noEmit` y con Node en runtime                            |
| **Imports relativos** | **389/389 terminan en `.js`** (cero imports sin extensión)                                                                                               | ✅ Crítico a favor: `moduleResolution: nodenext` funciona sin reescribir un solo import            |
| JSDoc                 | ~2.556 anotaciones (`@param`/`@returns`/`@typedef`) en 208 archivos                                                                                      | Muy valioso: `checkJs: true` genera tipos "gratis"; las anotaciones se convierten en firmas TS 1:1 |
| Prisma Client         | 2 instanciaciones: `src/config/db.js` (con `log` config) y `src/socket/handler.js`                                                                       | El client ya genera `.d.ts` → tipar el acceso a datos es la mayor ganancia con el mínimo esfuerzo  |
| Tests                 | 18 archivos (`*.unit.test.js`, `*.integration.test.js`) + `tests/smoke/`                                                                                 | Los `include` de `vitest.config.js` hay que ampliarlos a `*.ts` en Fase 0                          |
| Entry point           | `src/bin/index.js` → `app.js` → docs/socket/middleware/módulos                                                                                           | El grafo tiene hojas claras → orden de migración bottom-up                                         |
| `import.meta.url`     | 0 usos en `src/`                                                                                                                                         | Sin fricción con `module: nodenext`                                                                |
| Imports de `.json`    | 0                                                                                                                                                        | Sin `resolveJsonModule` necesario                                                                  |
| `process.env.`        | 19 accesos directos                                                                                                                                      | Tipables en Fase 1 con una interfaz `Env` central                                                  |

### 1.1 Grafo de dependencias interno (orden de migración)

```
src/bin/index.js  (entry)
 └─ app.js
     ├─ docs/swagger.js (+ docs/schemas.js — 2.868 líneas, el archivo más grande)
     ├─ middleware/ (12 archivos: index barrel, verifyCsrf, verifyRole, rateLimit, ...)
     ├─ routes.js
     └─ modules/ (24 módulos × controller/dao/routes/schemas/service)
         └─ cada módulo importa → config/db.js, config/dotenv.js, logger/index.js,
            utils/ (19 archivos, joiSchemas 577 líneas), common/crypto/
src/socket/ (22 archivos: adapter.js, handler.js, levels/, events/, rooms.js)
```

**Hojas del grafo** (nada depende de ellas, ellas dependen de terceros): `config/db.js`, `config/dotenv.js`, `config/cors.js`, `config/aws/`, `common/crypto/`, `logger/`. Son el punto de partida natural.

### 1.2 Dependencias de terceros y tipos

| Paquete                                                                                                                                                | ¿Tipos incluidos?                                       | Acción                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `express`                                                                                                                                              | ❌                                                      | Instalar `@types/express` (trae `@types/node` de rebote) — Fase 0                   |
| `socket.io` / `socket.io-client`                                                                                                                       | ✅ incluidos                                            | Nada                                                                                |
| `@prisma/client`                                                                                                                                       | ✅ generado (`prisma generate`)                         | Nada — es la mayor ganancia inmediata                                               |
| `joi`                                                                                                                                                  | ✅ incluidos                                            | Nada                                                                                |
| `winston`                                                                                                                                              | ✅ incluidos                                            | Nada                                                                                |
| `jsonwebtoken`                                                                                                                                         | ✅ via `@types/jsonwebtoken`                            | Instalar — Fase 0                                                                   |
| `bcrypt`                                                                                                                                               | ✅ via `@types/bcrypt`                                  | Instalar — Fase 0                                                                   |
| `knex`                                                                                                                                                 | ❌ sin tipos propios                                    | Ya está en `ignoreDependencies` de knip; decidir `@types/knex` o mantener excepción |
| `swagger-jsdoc` / `swagger-ui-express`                                                                                                                 | ⚠️ `@types/swagger-jsdoc` / `@types/swagger-ui-express` | Instalar — Fase 0                                                                   |
| `zxcvbn`, `cheerio`, `cloudinary`, `ioredis`, `prom-client`, `multer`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `dotenv`, `@aws-sdk/*` | ✅ incluidos o `@types/*` estándar                      | Revisar uno a uno en Fase 0 (`npm i -D @types/<pkg>` según lo que `tsc` pida)       |

---

## 2. Tooling del monorepo que DEBE ajustarse (Fase 0)

La migración toca config de tooling antes de tocar código. Checklist verificado archivo por archivo:

| Archivo                                                    | Estado actual                                                                                                                                                    | Cambio requerido                                                                                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `apps/server/tsconfig.json`                                | **NO existe**                                                                                                                                                    | Crear (§3.1)                                                                                                                                    |
| `.github/workflows/ci.yml` → job `server-typecheck` (L538) | Existe, `if: false`, con el literal `"TypeCheck: no-op until TS migration"` — **la migración ya estaba anticipada**                                              | Quitar `if: false` cuando `tsc --noEmit` pase; comando: `npx tsc --noEmit`                                                                      |
| `eslint.config.js` (raíz)                                  | Bloque backend: `files: ['apps/server/**/*.js']` (globals Node+Vitest corregidos en `eslint-configuration`) y bloque complexity `files: ['apps/server/**/*.js']` | Añadir `.ts` a ambos globs: `'apps/server/**/*.{js,ts}'`; evaluar `parserOptions.project` si se quieren reglas type-aware                       |
| `apps/server/package.json` scripts                         | `lint`: `eslint "**/*.js"`; `format`: `prettier "**/*.{js,json,md}"`; `main: src/bin/index.js`                                                                   | Lint/format → `"{js,ts}"`; `main` sigue apuntando a `.js` hasta convertir el entry (última fase)                                                |
| `knip.jsonc` (raíz) → sección `apps/server`                | `project: ["src/**/*.js", "prisma/**/*.js", "tests/**/*.js"]`                                                                                                    | Añadir `src/**/*.ts`, `tests/**/*.ts` (+ plugin prisma detecta seed)                                                                            |
| `apps/server/.dependency-cruiser.cjs`                      | Reglas `no-circular`, `no-orphans`, `no-cross-workspace-imports` con regex `\\.js$`                                                                              | Ampliar regex a `\\.(js                                                                                                                         | ts)$` |
| `apps/server/vitest.config.js`                             | `include: ['src/**/*.unit.test.js', 'tests/integration/**/*.integration.test.js']`                                                                               | Añadir variantes `.ts`; `vitest` ejecuta TS nativamente (esbuild)                                                                               |
| `.husky/pre-commit` (raíz, via `lint-staged`)              | `*.{js,jsx,cjs,mjs}` (eslint) y `*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}` (prettier)                                                                             | Prettier **ya cubre `.ts`**; eslint de lint-staged necesita `ts` añadido; si no, los `.ts` nuevos no se lintean/formatan (regresión silenciosa) |
| `pre-push` hook                                            | `vitest run --changed origin/main` (server + client)                                                                                                             | Sin cambio — vitest corre `.ts`                                                                                                                 |
| `apps/server/ecosystem.config.js` (PM2)                    | Referencia `src/bin/index.js`                                                                                                                                    | Sin cambio hasta la última fase (entry sigue ejecutándose como `.js` vía node)                                                                  |
| Swagger (`docs/schemas.js`, 2.868 líneas)                  | `swagger-jsdoc` con JSDoc en comentarios                                                                                                                         | No migrar el archivo en Fase 2; los comentarios JSDoc de OpenAPI son strings, no tipos TS                                                       |

---

## 3. Decisiones técnicas recomendadas

### 3.1 `tsconfig.json` propuesto (Fase 0)

```jsonc
{
  "compilerOptions": {
    // Verificación, no compilación: Node ejecuta los .js directamente y los .ts
    // se compilan por herramienta (vitest/esbuild). Sin dist/, sin doble fuente.
    "noEmit": true,
    // Coexistencia JS + TS durante toda la migración (strangler fig)
    "allowJs": true,
    "checkJs": true, // type-checkea también los .js existentes con sus JSDoc
    "target": "es2022",
    "lib": ["es2022"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    // Los 389 imports relativos ya terminan en .js → cero churn de imports
    "types": ["node"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    // Strict se activa POR FLAGS en Fase 3, no de golpe
    "strict": false,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsconfig.server.tsbuildinfo",
  },
  "include": ["src/**/*", "tests/**/*", "prisma/**/*.js"],
  "exclude": ["node_modules", "dist", "coverage", "tests/coverage"],
}
```

**Por qué `module: nodenext`:** los imports con extensión `.js` son la convención correcta para NodeNext — y el repo ya la cumple al 100%. Si en el futuro se quisiera importar `.ts` directamente (`allowImportingTsExtensions`), sería un change aparte con reescritura de 389 imports: no compensa.

**Por qué `noEmit`:** evita el paso de build ("No build step needed for Express" — `npm run build` es un no-op hoy). El runtime sigue siendo Node sobre los `.js` (y sobre los `.ts` via vitest en tests). Si algún día se quiere emitir, es un cambio de scripts `dev/build`, no del código migrado.

### 3.2 Estrategia de conversión por archivo (dos pasos, siempre verde)

```
1. git mv src/config/db.js src/config/db.ts        # renombrar
2. editar: imports .js→mantener, añadir tipos a firmas públicas
3. npx tsc --noEmit && npm run lint && npm run test:changed
4. commit "refactor(server): migrate config/db to TypeScript"
```

Reglas de conversión:

- **Un archivo = un commit** (o un módulo de 5 archivos en un commit cuando el patrón ya esté rodado).
- Los **imports del archivo convertido NO se tocan**: `import ... from './db.js'` sigue válido para resolver `db.ts`?? NO — ojo: con `nodenext`, un import `./db.js` desde un archivo `.js`/`.ts` resuelve a `db.js`/`db.ts` según exista (TS mapea `.js`→`.ts` automáticamente al verificar; en runtime, Node encuentra `db.js` si aún existe o el `.ts` lo ejecuta vitest). **Mientras `allowJs: true` y el archivo coexista convertido, la regla es: quien importa en runtime debe seguir resolviendo el archivo real.** El pattern seguro mientras dure el mix es mantener la extensión `.js` en los imports de los archivos NO convertidos y usar `.ts`/`.js` según el destino en los convertidos — validado por `tsc --noEmit` en cada paso.
- **`@typedef` del archivo migrado muere** en el mismo commit → nace `types.ts` del módulo (o interfaces inline). Nunca dos fuentes de verdad de tipos.
- **Sin `any`** en código nuevo migrado; si un tipo no se puede derivar, `unknown` + narrowing, o `// TODO(types)` tracked en el change.
- **Sin `// @ts-nocheck` salvo excepción justificada** en el change (y con fecha de expiración).

### 3.3 Qué NO hacer

- ❌ Migrar con `rewrite relative imports` masivo (codemod) en un PR gigante — rompe el historial y el blame.
- ❌ Activar `strict: true` en Fase 0 — produciría miles de errores que bloquean el grafo.
- ❌ Migrar `docs/schemas.js` (2.868 líneas de JSDoc OpenAPI en strings) — no aporta tipos; evaluar en Fase 3 separar OpenAPI specs a YAML/JSON.
- ❌ Convertir el entry (`bin/index.js`) antes que sus dependencias — dejaría al archivo principal sin los tipos de todo su árbol.
- ❌ Tocar `prisma/seed.js` en Fase 2 (poco tráfico, cero ganancia; va al final).

---

## 4. Plan incremental por fases (cada fase = changes OpenSpec independientes)

### Fase 0 — Infraestructura (≈1 change, sin convertir código de negocio)

1. `tsconfig.json` según §3.1 + `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/swagger-*` en devDeps.
2. Ampliar globs de tooling (tabla §2): eslint, prettier, knip, dep-cruiser, vitest, lint-staged.
3. Validar `npx tsc --noEmit` con baseline: si `checkJs` revela demasiados errores iniciales en JS puro, arrancar con `checkJs: false` y activarlo como flag en Fase 3 (decisión por volumen de errores medido).
4. Habilitar `server-typecheck` en `ci.yml` (quitar `if: false`) — el job ya existe y su mensaje lo anticipaba.
5. Métrica de progreso: `% de archivos .ts` en `apps/server` (script count en el README del change o en `docs/CONTEXT-CICD.md`).

**Criterio de done:** CI verde con typecheck activo, cero código de negocio convertido, todos los globs de tooling cubriendo `.ts`.

### Fase 1 — Hojas del grafo (mayor ROI, menor riesgo)

Orden: `config/db.js` → `config/dotenv.js` → `config/cors.js` → `config/aws/secrets.js` → `common/crypto/` → `logger/` → `utils/constants/enums.js` → `schemas/` (Joi).

- **`config/db.ts`**: tipar el singleton Prisma y exportar `Prisma` namespace → todos los módulos ganan tipos de models sin tocarlos (`prisma generate` ya emite `.d.ts`).
- **`config/dotenv.ts`**: firmar como `(key: EnvKey) => string` con union type de claves conocidas → elimina los 19 accesos `process.env.*` dispersos.
- **`utils/constants/enums.ts`**: reemplaza `@typedef` string-unions por enums/uniones reales (los DAOs/services los importan — mejora inmediata de autocompletado).

**Criterio de done:** todas las hojas del grafo en `.ts`, `tsc --noEmit` verde, lint verde, tests unitarios verdes.

### Fase 2 — Módulos (el volumen: 24 módulos × 5 archivos)

Orden sugerido por riesgo (menos → más acoplados/importantes): `settings` → `attendance` → `news` → `users` → `auth` → `events` → resto. Patrón por archivo dentro de cada módulo:

1. `schemas/*.ts` (Joi tipado) → 2. `dao.ts` (Prisma types fluyen solos) → 3. `service.ts` → 4. `routes.ts` (`Router` tipado) → 5. `controller.ts` (`Request`/`Response`/`NextFunction` de express).

Cada módulo puede ser un PR independiente: convención idéntica entre módulos = review rápido y bajo riesgo. Los módulos con archivos en `knip.jsonc.ignore` (`clientOrder`, `providerOrder`, `users/constants`) se marcan primero como candidatos a borrar — no migrar código muerto.

**Criterio de done por módulo:** 5 archivos `.ts`, tests del módulo en `.ts` o al menos ejecutándose contra el módulo convertido, `tsc` verde.

### Fase 3 — Núcleo transversal y endurecimiento

1. `middleware/` (12 archivos — `RequestHandler` genérico, tipar `req.user` via `declare global` del namespace Express).
2. `socket/` (22 archivos — `Server`/`Socket` de socket.io ya tipados; el `await import()` dinámico de `adapter.js` se tipa con `import('@socket.io/redis-adapter')`).
3. `app.ts` + `bin/index.ts` al final (actualizar `main`, `ecosystem.config.js`, `nodemon`).
4. Endurecimiento gradual, **un flag por PR**: `noImplicitAny` → `strictNullChecks` → `noUncheckedIndexedAccess` → `strict: true`.
5. Limpieza: borrar restos de JSDoc duplicado por `types.ts` por módulo; evaluar reglas eslint type-aware (`parserOptions.project`).

**Criterio de done:** 0 archivos `.js` en `src/` (salvo exclusiones justificadas), `strict: true` activo, CI con typecheck bloqueante (evaluar quitar `continue-on-error` si lo tuviera).

---

## 5. Riesgos y mitigaciones

| Riesgo                                                | Impacto                                | Mitigación                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `strict` activado de golpe → miles de errores         | Bloquea el grafo, aborta la migración  | `strict: false` en Fase 0; flags uno a uno en Fase 3 (§4 Fase 3.4)                                                                           |
| Mix JS/TS rompe resolución en runtime                 | Servidor no arranca                    | `noEmit` (Node ejecuta `.js` nativo); cada conversión validada con `npm run dev` + smoke antes del commit                                    |
| Imports con extensión mal resueltos entre `.js`/`.ts` | `tsc` falla o Node no encuentra módulo | Regla §3.2 paso 2 + `tsc --noEmit` como gate en cada commit; `nodenext` es la resolución que respeta extensiones                             |
| Tooling que ignora `.ts` (lint/format/knip)           | Regresión silenciosa de calidad        | Fase 0 completa ANTES de convertir el primer archivo (tabla §2 como checklist del change)                                                    |
| Doble fuente de verdad (JSDoc en `.ts` + types)       | Tipos divergentes                      | Regla: `@typedef` muere en el mismo commit que la conversión (§3.2)                                                                          |
| Codebase muerto migrado sin sentido                   | Esfuerzo desperdiciado                 | Los archivos en `knip.jsonc` `ignore` (`clientOrder`, `providerOrder` controllers/dao/routes...) se auditant para borrado ANTES de migrarlos |
| CI se vuelve lento (`tsc` sobre 228+ archivos)        | Feedback lento                         | `incremental: true` + cache (setup-monorepo ya cachea node_modules); medir en Fase 0                                                         |
| Prisma seed y workflows que referencian `.js`         | Scripts rotos                          | `main`/`ecosystem.config.js`/`prisma.seed` se actualizan solo en la última fase                                                              |

---

## 6. Esfuerzo estimado

| Fase        | Alcance                        | Esfuerzo estimado                                       |
| ----------- | ------------------------------ | ------------------------------------------------------- |
| 0 — Infra   | tsconfig, tooling, CI          | 1–2 días (1 change)                                     |
| 1 — Hojas   | ~10 archivos base              | 2–3 días                                                |
| 2 — Módulos | ~100 archivos (20 módulos × 5) | 4–6 semanas a ritmo de 1–2 módulos/día en PRs paralelos |
| 3 — Núcleo  | ~35 archivos + strict          | 2–3 semanas                                             |

> Los módulos con archivos ya identificados como muertos (knip: `clientOrder`, `providerOrder`, etc.) reducen el volumen real de la Fase 2 si se borran antes de migrar.

---

## 7. Fuentes

- TS Handbook — Migrating from JS: <https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html>
- tsconfig reference (`allowJs`, `checkJs`, `nodenext`): <https://www.typescriptlang.org/tsconfig/>
- Node.js TypeScript (ESM, extensiones): <https://nodejs.org/api/typescript.html>
- Verificación local contra el repo (2026-09-23): conteo de archivos/imports/JSDoc, `ci.yml` L538 (`server-typecheck` no-op), `vitest.config.js`, `knip.jsonc`, `.dependency-cruiser.cjs`, `package.json` de `apps/server` y raíz.
