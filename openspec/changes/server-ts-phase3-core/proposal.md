# Proposal

> Change hijo de `openspec/changes/server-typescript-migration/` (task 4.1 del padre, creado 2026-10-15). Requiere Fase 2 (`server-ts-phase2-modules`) completa: middleware/socket consumen controllers/services ya `.ts`.

## Why

El núcleo transversal (middleware, socket, utils compartidas, app, bin) es la última capa `.js` de `src/` — 55 archivos. Convertirlo al final:

1. **Sus dependencias ya son `.ts`**: middleware envuelve controllers tipados, socket importa services/schemas `.ts`, utils consume Prisma/Express tipados — el tipado fluye hacia arriba sin casts.
2. **Es donde vive la tipificación estructural**: `declare global` para `req.user` (verificación JWT), `RequestHandler` genérico de error, tipos de socket.io (`Server`/`Socket`/`AuthenticatedSocket`) — decisiones que las fases 1-2 dejaron pendientes conscientemente.
3. **`bin/index.ts` es el ÚLTIMO archivo** y dispara el **switch de runtime a `tsx`** (decisión 9 del padre): PM2, nodemon y Dockerfile pasan de `node src/bin/index.js` a `tsx src/bin/index.ts`. Hasta ese commit, el entry sigue siendo `.js` y el runtime no cambia (Fases 0-2 sin riesgo de arranque).

## What Changes

- **middleware/ (12)** → `.ts`: `RequestHandler` genérico, `declare global { namespace Express { interface Request { user?: ... } } }` en `verifyToken`/`index`, errorHandler con narrowing `instanceof Error` (prepara `useUnknownInCatchVariables` de Fase 4), rateLimit/validate*/verify* con tipos express+joi.
- **socket/ (22)** → `.ts`: `Server`/`Socket` de socket.io, `AuthenticatedSocket` (interfaz propia), handlers/rooms/rateLimiter/notificationBus/monitor tipados; `socket/levels/*` (11, documentos ejecutables) con mínimo tipado de superficie.
- **docs/ (2)** → `.ts`: `swagger.js` + `schemas.js` (2.868 LOC — tipos de definiciones OpenAPI, sin reescribir el contenido).
- **utils/ restantes (17)** → `.ts`: `jwt/createToken` (tipos jsonwebtoken `SignOptions`), `bcrypt/encrypt` (Promise<string>), `cloudinary`, `multer`, `pagination`, `helmet/helmet.config`, `csrftoken`, `prisma/{dao,prisma-query,prisma-dinamic-service/service,sanitizePrismaMessage(+test)}`, `responses&Errors/{errors,globalErrorResponse,globalResponse,handleCatchErrorAsync(+test)}`.
- **`app.js` → `app.ts`**: composición de middleware/routes tipada.
- **`bin/index.js` → `bin/index.ts` + switch runtime**: `tsx src/bin/index.ts` en PM2/nodemon/Dockerfile (ver design §3); `tsx` en `dependencies` de `apps/server/package.json`; **verificación de arranque real** PM2 (cluster o fork — decisión documentada) y Docker (daemon permitting).
- **Verificación por lote**: los 4 gates tras cada sub-lote; cierre con suite completa + CI.

**Fuera de alcance**: los 8 configs/prisma/scripts root del workspace (Fase configs del padre, secciones 5.x).

## Capabilities

### New Capabilities

- `server-ts-core-conversion`: Conversión TypeScript del núcleo transversal de `apps/server` (Fase 3) y switch del runtime a `tsx`. Cubre el tipado estructural (Express `declare global`, RequestHandler genérico, socket.io AuthenticatedSocket), el orden middleware→socket/docs/utils→app→bin, la migración del entry con runtime `tsx` en PM2/nodemon/Docker, y el cierre de `src/` a 0 `.js`.

## Impact

| File                                    | Change                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `src/middleware/*` (12) → `.ts`         | lote 1 — `declare global req.user`, errorHandler narrowing                |
| `src/socket/*` (22) → `.ts`             | lote 2 — tipos socket.io                                                  |
| `src/docs/*` (2) → `.ts`                | lote 3                                                                    |
| `src/utils/*` restantes (17) → `.ts`    | lote 4                                                                    |
| `src/app.js` → `.ts`                    | lote 5                                                                    |
| `src/bin/index.js` → `.ts`              | ÚLTIMO — switch runtime tsx                                               |
| `apps/server/package.json`              | `tsx` en `dependencies` (no devDeps — `npm prune --omit=dev`)             |
| `apps/server/ecosystem.config.js`       | `script` → `tsx src/bin/index.ts` (+ decisión cluster/fork)               |
| `apps/server/package.json` script `dev` | nodemon → `tsx watch src/bin/index.ts`                                    |
| `apps/server/Dockerfile`                | `CMD ["node","src/bin/index.js"]` → `CMD ["tsx","src/bin/index.ts"]`      |
| `docs/CONTEXT-CICD.md` §12.2            | contador → `228/236 (Fase 3 — src en 0 .js)` al cierre                    |
| change padre                            | task 4.1 marcada al crear; verificación PM2/Docker registrada al ejecutar |

**Riesgos:** (1) PM2 cluster + tsx es frágil (histórico conocido) — verificación real obligatoria o migración explícita a fork mode documentada; (2) Docker build no verificable localmente (daemon caído en el entorno actual) — validación en CI del PR; (3) `docs/schemas.js` (2.868 LOC) es mecánico pero voluminoso — sub-lote propio; (4) `req.user` global cambia el tipado de TODOS los controllers de Fase 2 — el `declare global` debe coincidir con el payload del JWT verificado.
