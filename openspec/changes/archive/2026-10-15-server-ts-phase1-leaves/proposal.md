# Proposal

> Change hijo de `openspec/changes/server-typescript-migration/` (task 2.1 del padre, creada 2026-10-15). Fase 0 del padre está COMPLETA y verificada: tooling TS operativo (typescript-eslint, `@types/*` pineadas, `incremental`, include `src+tests`, filtros vitest `.unit.test` sin extensión, globs knip/eslint/complexity en `{js,ts}`), baseline 236 JS / 0 TS, gates verdes (`type-check`/`lint`/`test:unit` 175/175/`depcruise:server`), `checkJs: false` hasta Fase 4 (639 errores medidos).

## Why

`apps/server` tiene 236 archivos `.js`/`.cjs`/`.mjs` que migrar a TS (alcance total: 0 al final). El roadmap del padre ordena la conversión por dependencias: **hojas del grafo primero** — archivos sin imports relativos hacia otros archivos de conversión posterior, o cuyo único dependiente es otro archivo de este mismo change. Convertir las hojas primero:

1. **Minimiza el cascading**: los consumidores (módulos, middleware, socket — fases 2-3) importan archivos ya tipados, por lo que obtienen tipos de forma incremental sin tocar su código.
2. **Mantiene el baseline verde en cada commit**: con `allowJs` + `noEmit` + nodenext, un `.ts` que importa un `.js` (y viceversa) resuelve sin churn de imports (los 389 imports relativos conservan sufijo `.js`).
3. **Maximiza el valor temprano**: los schemas Joi y las constantes (`enums`, `users/constants`) son los tipos de dominio que las fases 2-3 consumirán; `dotenv` gana su firma tipada `(key: EnvKey) => string` (hueco de seguridad runtime identificado en la investigación: 20 accesos `process.env` sin validar).

La investigación canónica (`docs/server-typescript-migration-research.md`, 2026-10-14) y el protocolo del padre (design §5, reglas a-f) validan la conversión archivo-por-archivo como única estrategia sin riesgo de romper ejecución (strangler fig).

## What Changes

- **Convertir 36 archivos hoja a TypeScript** con `git mv` (renombre, no rewrite) + tipado de firma pública:
  - `config/` (5): `db.js` (singleton Prisma tipado), `dotenv.js` (firma `(key: EnvKey) => string`), `cors.js`, `aws/secret-manager.client.js`, `aws/secrets.js`
  - `common/crypto/` (2): `hashValue.js`, `index.js`
  - `logger/` (4): `dev.js`, `uat.js`, `production.js`, `index.js`
  - `utils/constants/enums.js` (1), `utils/joiSchemas/joi.js` (1)
  - schemas de módulos (23): 22 `src/modules/*/schemas/*.joi.js` + `src/modules/events/schemas/event-rsvp.js`
- **Orden por lotes respetando dependencias internas** (design §2): 31 hojas puras primero, 4 archivos dependientes después (`cors`→dotenv, `aws/secrets`→secret-manager.client, `crypto/index`→hashValue, `logger/index`→dev/uat/production+dotenv), `config/db.js` al final (único con dependencia fuera del change: `middleware/encription-prisma-middleware.js`, resoluble vía `allowJs`).
- **Verificación de gates tras cada lote**: `npm run type-check` (raíz), `npm run lint --workspace=server-express`, `cd apps/server && npm run test:unit`, `npm run depcruise:server` — todos verdes antes de avanzar de lote.
- **Protocolo por archivo** (padre design §5): un archivo = un commit vía `git mv`; imports `.js` SE MANTIENEN (nodenext); sin `any` nuevo; JSDoc `@param`/`@returns` se traduce a tipos o se elimina si redundante; el archivo movido muere como `.js` en el mismo commit.
- **Registro de progreso**: contador `docs/CONTEXT-CICD.md` §12.2 actualizado al cierre (`200 JS / 36 TS`), tarea 1.8 del padre anotada.

**Fuera de alcance** (fases 2-3 y configs del padre): `middleware/` (12), `socket/` (22), `docs/` (2), `utils/responses&Errors/`, `utils/csrftoken/`, `utils/multer/`, `utils/prisma/`, `app.js`, `bin/index.js`, `tests/` (20), configs raíz del workspace (8), `prisma/seed.js`, `scripts/`. Los archivos hoja del grafo NO incluidos en la lista del padre (`utils/csrftoken/csrfToken.js`, `utils/multer/multer.js`, `utils/prisma/sanitizePrismaMessage.js`, `utils/responses&Errors/*`, `socket/events/schemas.js`, `docs/schemas.js`, `docs/swagger.js`, middleware standalone, `socket/levels/*`, `socket/monitor/*`) quedan asignados a sus fases del padre para no mezclar límites.

## Capabilities

### New Capabilities

- `server-ts-leaf-conversion`: Conversión TypeScript de los archivos hoja del grafo de `apps/server` (Fase 1). Cubre la selección exacta de 36 archivos, el orden de lotes por dependencia interna, la regla de no-cascading (imports `.js` intactos, consumidores JS intactos), los gates obligatorios por lote y el registro del contador de progreso al cierre.

## Impact

| File                                                                                       | Change                                                                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `apps/server/src/config/dotenv.js` → `.ts`                                                 | `git mv` + firma `(key: EnvKey) => string` (unión de las keys usadas)                                               |
| `apps/server/src/config/aws/secret-manager.client.js` → `.ts`                              | `git mv` + tipos AWS SDK                                                                                            |
| `apps/server/src/common/crypto/hashValue.js` → `.ts`                                       | `git mv` + tipos node:crypto                                                                                        |
| `apps/server/src/logger/{dev,uat,production}.js` → `.ts`                                   | `git mv` + tipos winston                                                                                            |
| `apps/server/src/utils/constants/enums.js` → `.ts`                                         | `git mv` + `as const` / unions (sin enums TS runtime — `erasableSyntaxOnly` compatible con el endgame)              |
| `apps/server/src/utils/joiSchemas/joi.js` → `.ts`                                          | `git mv` + tipos joi                                                                                                |
| `apps/server/src/modules/*/schemas/*.joi.js` (22) + `events/schemas/event-rsvp.js` → `.ts` | `git mv` + tipos Joi.ObjectSchema/etc.                                                                              |
| `apps/server/src/config/cors.js` → `.ts`                                                   | `git mv` (lote 2, depende de dotenv)                                                                                |
| `apps/server/src/config/aws/secrets.js` → `.ts`                                            | `git mv` (lote 2)                                                                                                   |
| `apps/server/src/common/crypto/index.js` → `.ts`                                           | `git mv` (lote 2)                                                                                                   |
| `apps/server/src/logger/index.js` → `.ts`                                                  | `git mv` (lote 2)                                                                                                   |
| `apps/server/src/config/db.js` → `.ts`                                                     | `git mv` (último, lote 3 — importa `middleware/encription-prisma-middleware.js` aún `.js`, resoluble vía `allowJs`) |
| `openspec/changes/server-typescript-migration/tasks.md`                                    | task 2.1 marcada `[x]` al crear este change                                                                         |
| `docs/CONTEXT-CICD.md` §12.2                                                               | contador `0/236` → `36/236` al cierre                                                                               |

**Riesgos:** (1) `db.js` arrastra tipos inferidos de un `.js` de middleware — aceptable, sin emit; (2) schemas Joi renombrados exigen que los 389 imports `.js`-sufijados de consumidores sigan resolviendo — con nodenext, `./schemas/attendance.joi.js` resuelve a `attendance.joi.ts` automáticamente (allowJs); verificado por lote con `type-check`; (3) tests colocados (`*.unit.test.js` junto a schemas) importan schemas — mismos imports `.js` siguen resolviendo.
