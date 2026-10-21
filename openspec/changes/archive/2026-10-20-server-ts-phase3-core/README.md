# server-ts-phase3-core

Fase 3 de la migración TS (hijo de `server-typescript-migration`, task 4.1). Predecesores: Fase 1 (36 hojas) + Fase 2 (137 módulos/tests) completos.

**Alcance — 55 archivos + switch de runtime:**

- `src/middleware/` (12) — `RequestHandler` genérico + `declare global` para `req.user`
- `src/socket/` (22) — handlers, auth, rooms, rateLimiter, notificationBus, monitor, levels
- `src/docs/` (2) — swagger + schemas
- `src/utils/` restantes (17) — jwt, bcrypt, cloudinary, multer, pagination, helmet, csrftoken, prisma utils, responses&Errors (+2 tests colocalizados)
- `src/app.js` → `app.ts`
- `src/bin/index.js` → `bin/index.ts` (**ÚLTIMO archivo**) + **switch runtime a `tsx`** (decisión 9 del padre): PM2 (`ecosystem.config.js` → script `tsx`, verificación cluster/fork), nodemon, Dockerfile `CMD ["tsx","src/bin/index.ts"]`, `tsx` en `dependencies` (Docker hace `npm prune --omit=dev`)

Al cierre de Fase 3: `src/` con **0 `.js`** (208 → 0). Solo quedan los 8 configs/prisma/scripts (Fase configs del padre).
