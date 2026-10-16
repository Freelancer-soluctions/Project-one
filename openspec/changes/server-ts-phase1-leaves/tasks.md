# Tasks

> Protocolo por archivo (padre design §5): `git mv x.js x.ts` + tipar firma pública + imports `.js` intactos + sin `any` nuevo + un archivo = un commit + JSDoc redundante eliminada. Verificación de lote = design §6 (4 gates). NO marcar un lote como completo sin sus gates verdes.

## 1. Lote 1 — Hojas puras (31 archivos, commits individuales)

- [ ] 1.1 `config/dotenv.js` → `dotenv.ts` con firma `(key: EnvKey) => string`; `EnvKey` = unión de las keys pasadas a `dotenv()` — extraer con `grep -rn "dotenv('" src` (23 call sites, 14 keys; NO de las lecturas directas `process.env` — design §4) — sin validación runtime nueva
- [ ] 1.2 `config/aws/secret-manager.client.js` → `.ts` (tipos AWS SDK; `GetSecretValueCommandOutput`/client tipado en la superficie pública)
- [ ] 1.3 `common/crypto/hashValue.js` → `.ts` (tipos `node:crypto`; firma de `hashValue` explícita)
- [ ] 1.4 `logger/{dev,uat,production}.js` → `.ts` (3 commits; tipos winston: `Logger`, `transport`; `format`/`transports` sin `any`)
- [ ] 1.5 `utils/constants/enums.js` → `enums.ts` con `as const` + unions derivadas (design §3 — SIN `enum` TS runtime); verificar que los valores exportados no cambian
- [ ] 1.6 `utils/joiSchemas/joi.js` → `joi.ts` (tipos `Joi` del paquete; exportaciones intactas)
- [ ] 1.7 Convertir los 22 schemas de módulos `src/modules/*/schemas/*.joi.js` → `*.joi.ts` (un archivo = un commit; tipos `Joi.ObjectSchema`/`Joi.StringSchema`/etc. según exportación; mantener nombres de exportaciones idénticos)
- [ ] 1.8 Convertir `src/modules/events/schemas/event-rsvp.js` → `event-rsvp.ts` (mismo patrón 1.7)
- [ ] 1.9 **Gates Lote 1**: `npm run type-check` + `npm run lint --workspace=server-express` + `cd apps/server && npm run test:unit` + `npm run depcruise:server` — todos exit 0; registrar aquí el conteo `.ts` acumulado (esperado: 31)

## 2. Lote 2 — Dependientes internos (4 archivos; sus dependencias ya son `.ts`)

- [ ] 2.1 `config/cors.js` → `cors.ts` (importa `./dotenv.js` ya `.ts` — el import RELATIVO se actualiza a `./dotenv.js` igual: nodenext resuelve `.js`→`.ts`; verificar)
- [ ] 2.2 `config/aws/secrets.js` → `secrets.ts` (depende de `./secret-manager.client.js` ya `.ts`)
- [ ] 2.3 `common/crypto/index.js` → `index.ts` (`export * from './hashValue.js'` — re-export tipado, barrel sin `any`)
- [ ] 2.4 `logger/index.js` → `index.ts` (importa los 3 loggers `.ts` + `../config/dotenv.js`; selección por `NODE_ENV` tipada)
- [ ] 2.5 **Gates Lote 2**: los 4 gates exit 0; conteo acumulado registrado (esperado: 35)

## 3. Lote 3 — Dependiente externo (1 archivo)

- [ ] 3.1 `config/db.js` → `db.ts` (singleton Prisma tipado: `PrismaClient` + `encryptionMiddleware` importado desde `../middleware/encription-prisma-middleware.js` aún `.js` — resoluble vía `allowJs`, sin emit; registrar aquí cualquier fricción de tipos inferidos del `.js`)
- [ ] 3.2 **Gates Lote 3 + cierre de conversión**: los 4 gates exit 0; `npx tsc --noEmit -p apps/server` sin errores en los 36 `.ts`; `git ls-files` confirmación: **36 `.ts`** en `src/`, `.js` restantes = 200 (`208 src - 36 + 20 tests + 8 configs/prisma/scripts`)

## 4. Cierre y registro

- [ ] 4.1 Actualizar contador de `docs/CONTEXT-CICD.md` §12.2: `0/236` → `36/236 (Fase 1 — hojas)` con fecha; anotar la task 1.8 del change padre con el delta (`36 TS / 200 JS`)
- [ ] 4.2 Verificación de no-regresión de protocolo: `grep -rn ": any" apps/server/src --include="*.ts"` → 0 resultados nuevos (solo los que existieran por inferencia JS — registrar los hallados); los 390 imports `.js`-sufijados SIN churn (389 estáticos `from` + 1 dinámico `import()` en `errorHandler.unit.test.js` — el baseline del padre contaba los 389 estáticos; los que apuntan a archivos convertidos resuelven vía nodenext — verificado por type-check de los lotes)
- [ ] 4.3 Confirmar task 2.1 del padre marcada `[x]` (mismo commit de creación de este change) y ejecutar `npx openspec validate server-ts-phase1-leaves --strict` → PASS
