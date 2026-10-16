# Tasks

> Protocolo heredado del padre (design §5, reglas a-f): `git mv` + imports `.js` intactos + sin `any` nuevo + JSDoc selectivo + un archivo = un commit. Orden (design §1): middleware → socket + docs → utils → app → bin + switch runtime. Gates tras cada sub-lote: `npm run type-check` + `npm run lint --workspace=server-express` + `cd apps/server && npm run test:unit` + `npm run depcruise:server`. Un archivo = un commit.

## 1. middleware/ (12 archivos)

- [ ] 1.1 `verifyToken.js` → `.ts` + **`declare global`** para `Request.user` (tipo del payload JWT — design §5); las lecturas DIRECTAS de `process.env` en middleware (que NO pasan por dotenv — F1 §4 las dejó fuera de `EnvKey`) se tipan con `NodeJS.ProcessEnv`/tipos propios donde ya existan; reordenarlas hacia dotenv queda FUERA de alcance (change de seguridad aparte — F1 decisión 4)
- [ ] 1.2 `errorHandler.js` → `.ts` con firma `(err: unknown, ...)` + narrowing `instanceof Error` (pre-adapta `useUnknownInCatchVariables`, Fase 4)
- [ ] 1.3 `handleCatchErrorAsync` está en utils (lote 4) — aquí: `validateSchema`, `validatePathParam`, `validateNumericPathParam`, `validateQueryParams` → `.ts` (tipos express + joi `ValidationResult`)
- [ ] 1.4 `verifyRole.js`, `verifyCsrf.js`, `rateLimit.js`, `csp-report-handle.js`, `encription-prisma-middleware.js` → `.ts` (tipos Prisma middleware)
- [ ] 1.5 `middleware/index.js` → `index.ts` (barrel) + **Gates sub-lote middleware** + registrar `req.user` global verificado con un controller de Fase 2

## 2. socket/ (22) + docs/ (2)

- [ ] 2.1 `socket/handler.js`, `auth.js`, `rooms.js`, `rateLimiter.js`, `notificationBus.js`, `adapter.js` → `.ts` (`AuthenticatedSocket` con `socket.data` — design §2; 2ª instancia Prisma ya singleton-izada en Fase 1)
- [ ] 2.2 `socket/events/{schemas,mentionEvents}.js` + `socket/monitor/{metrics,middleware}.js` → `.ts`
- [ ] 2.3 `socket/levels/*` (12 archivos documento-ejecutable: level-01→08, dos level-09 hardening client+server, level-10, level-11) → `.ts` con tipado mínimo de superficie (sub-lote mecánico)
- [ ] 2.4 `docs/swagger.js` → `.ts`
- [ ] 2.5 `docs/schemas.js` → `.ts` (2.868 LOC — sub-lote mecánico aislado, design §4)
- [ ] 2.6 **Gates sub-lote socket+docs**

## 3. utils/ restantes (17)

- [ ] 3.1 `utils/jwt/createToken.js` → `.ts` (jsonwebtoken `SignOptions`/`Secret`), `utils/bcrypt/encrypt.js` → `.ts` (`Promise<string>`)
- [ ] 3.2 `utils/{cloudinary,multer,pagination,csrftoken, helmet/helmet.config}` → `.ts` (5)
- [ ] 3.3 `utils/prisma/{dao,prisma-query,prisma-dinamic-service/service,sanitizePrismaMessage(+test)}` → `.ts` (5 — `dao`/`prisma-query` con tipos Prisma genéricos)
- [ ] 3.4 `utils/responses&Errors/{errors,globalErrorResponse,globalResponse,handleCatchErrorAsync}` + su test colocalizado `errorHandler.unit.test.js` → `.ts` (5 archivos — la firma de errores alinea con el errorHandler de 1.2)
- [ ] 3.5 **Gates sub-lote utils**

## 4. app + bin + switch runtime (padre task 4.1)

- [ ] 4.1 `src/app.js` → `app.ts` (composición middleware/routes tipada)
- [ ] 4.2 Instalar `tsx` en **`dependencies`** de `apps/server/package.json` (no devDeps — Dockerfile `prune --omit=dev`)
- [ ] 4.3 `src/bin/index.js` → `bin/index.ts` (**ÚLTIMO archivo .js de src/**) — mismo arranque: dotenv → express → socket → server.listen
- [ ] 4.4 Script `dev`: nodemon → `tsx watch src/bin/index.ts`; verificar arranque dev real
- [ ] 4.5 `ecosystem.config.js`: `script` → `tsx src/bin/index.ts` — **verificación PM2 real en cluster mode**; si falla: migración explícita a `exec_mode: 'fork'` documentada aquí con justificación (design §3)
- [ ] 4.6 `Dockerfile`: `CMD ["node","src/bin/index.js"]` → `CMD ["tsx","src/bin/index.ts"]` — build+run Docker si daemon disponible (si no: validación en CI del PR, limitación registrada)
- [ ] 4.7 **Gates sub-lote app/bin + smoke de arranque** (`node`/`tsx` up, health endpoint responde)

## 5. Cierre y registro

- [ ] 5.1 Cierre de src/: `git ls-files 'apps/server/src/*.js' 'apps/server/src/**/*.js'` → **0**; contador `docs/CONTEXT-CICD.md` §12.2 → `228/236 (Fase 3 — src en 0 .js)`; anotar task 1.8 del padre
- [ ] 5.2 Limpieza de casts locales de `req.user` en controllers de Fase 2 → tipo global (design §5); grep sin casts residuales
- [ ] 5.3 Sin `any` nuevos (`grep -rn ": any" apps/server/src --include="*.ts"`); imports `.js` intactos
- [ ] 5.4 `npx openspec validate server-ts-phase3-core --strict` → PASS; registrar las evidencias PM2/Docker en la task 4.1 del padre (ya `[x]` por creación — se completa con la ejecución real)
