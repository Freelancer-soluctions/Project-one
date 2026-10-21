# Tasks

> Protocolo heredado del padre (design §5, reglas a-f): `git mv` + imports `.js` intactos + sin `any` nuevo + JSDoc selectivo + un archivo = un commit. Orden (design §1): middleware → socket + docs → utils → app → bin + switch runtime. Gates tras cada sub-lote: `npm run type-check` + `npm run lint --workspace=server-express` + `cd apps/server && npm run test:unit` + `npm run depcruise:server`. Un archivo = un commit.

## 1. middleware/ (12 archivos)

- [x] 1.1 `verifyToken.js` → `.ts` + **`declare global`** para `Request.user` (tipo del payload JWT — design §5); las lecturas DIRECTAS de `process.env` en middleware (que NO pasan por dotenv — F1 §4 las dejó fuera de `EnvKey`) se tipan con `NodeJS.ProcessEnv`/tipos propios donde ya existan; reordenarlas hacia dotenv queda FUERA de alcance (change de seguridad aparte — F1 decisión 4)
- [x] 1.2 `errorHandler.js` → `.ts` con firma `(err: unknown, ...)` + narrowing `instanceof Error` (pre-adapta `useUnknownInCatchVariables`, Fase 4)
- [x] 1.3 `handleCatchErrorAsync` está en utils (lote 4) — aquí: `validateSchema`, `validatePathParam`, `validateNumericPathParam`, `validateQueryParams` → `.ts` (tipos express + joi `ValidationResult`)
- [x] 1.4 `verifyRole.js`, `verifyCsrf.js`, `rateLimit.js`, `csp-report-handle.js`, `encription-prisma-middleware.js` → `.ts` (tipos Prisma middleware)
- [x] 1.5 `middleware/index.js` → `index.ts` (barrel) + **Gates sub-lote middleware** + registrar `req.user` global verificado con un controller de Fase 2

## 2. socket/ (22) + docs/ (2)

- [x] 2.1 `socket/handler.js`, `auth.js`, `rooms.js`, `rateLimiter.js`, `notificationBus.js`, `adapter.js` → `.ts` (`AuthenticatedSocket` con `socket.data` — design §2; 2ª instancia Prisma ya singleton-izada en Fase 1)
- [x] 2.2 `socket/events/{schemas,mentionEvents}.js` + `socket/monitor/{metrics,middleware}.js` → `.ts`
- [x] 2.3 `socket/levels/*` (12 archivos documento-ejecutable: level-01→08, dos level-09 hardening client+server, level-10, level-11) → `.ts` con tipado mínimo de superficie (sub-lote mecánico)
- [x] 2.4 `docs/swagger.js` → `.ts`
- [x] 2.5 `docs/schemas.js` → `.ts` (2.868 LOC — sub-lote mecánico aislado, design §4)
- [x] 2.6 **Gates sub-lote socket+docs**

## 3. utils/ restantes (17)

- [x] 3.1 `utils/jwt/createToken.js` → `.ts` (jsonwebtoken `SignOptions`/`Secret`), `utils/bcrypt/encrypt.js` → `.ts` (`Promise<string>`)
- [x] 3.2 `utils/{cloudinary,multer,pagination,csrftoken, helmet/helmet.config}` → `.ts` (5)
- [x] 3.3 `utils/prisma/{dao,prisma-query,prisma-dinamic-service/service,sanitizePrismaMessage(+test)}` → `.ts` (5 — `dao`/`prisma-query` con tipos Prisma genéricos)
- [x] 3.4 `utils/responses&Errors/{errors,globalErrorResponse,globalResponse,handleCatchErrorAsync}` + su test colocalizado `errorHandler.unit.test.js` → `.ts` (5 archivos — la firma de errores alinea con el errorHandler de 1.2)
- [x] 3.5 **Gates sub-lote utils**

## 4. app + bin + switch runtime (padre task 4.1)

- [x] 4.1 `src/app.js` → `app.ts` (composición middleware/routes tipada)
- [x] 4.2 Instalar `tsx` en **`dependencies`** de `apps/server/package.json` (no devDeps — Dockerfile `prune --omit=dev`)
- [x] 4.3 `src/bin/index.js` → `bin/index.ts` (**ÚLTIMO archivo .js de src/**) — mismo arranque: dotenv → express → socket → server.listen
- [x] 4.4 Script `dev`: nodemon → `tsx watch src/bin/index.ts`
- [x] 4.5 `ecosystem.config.js`: `script` → `tsx src/bin/index.ts`
- [x] 4.6 `Dockerfile`: `CMD ["node","src/bin/index.js"]` → `CMD ["tsx","src/bin/index.ts"]`
- [x] 4.7 **Gates sub-lote app/bin + smoke de arranque** (`node`/`tsx` up, health endpoint responde) **VERIFICADO REAL (2026-10-15):** `npx tsx src/bin/index.ts` → listening :3000 + docs API montados + exit 0; adicionalmente PM2 cluster (4 workers online) sirvió tráfico (docs 301). 4.5 nota: la solución PM2+tsx en cluster quedó materializada como `ecosystem.config.json` (data pura) con `script: src/bin/index.ts` + `node_args: --import tsx` — cluster real verificado (fork no necesario).

## 5. Cierre y registro

- [x] 5.1 Cierre de src/: `git ls-files 'apps/server/src/*.js' 'apps/server/src/**/*.js'` → **0**
- [x] 5.2 Verificación de los accesos a `req.user` contra el tipo global
- [x] 5.3 Sin `any` nuevos (`grep -rn ": any" apps/server/src --include="*.ts"`); imports `.js` intactos **NOTA:** la única excepción `any` de src/ vive en `utils/prisma/prisma-model.ts` (boundary deliberado de acceso dinámico a modelos, documentado en código como EXCEPCIÓN) — el grep de 5.3 excluye este boundary documentado
- [x] 5.4 `npx openspec validate server-ts-phase3-core --strict` → PASS
