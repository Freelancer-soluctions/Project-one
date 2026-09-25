# Tasks

> Fases 2–4 del plan (`docs/learning/typescript-migration-server.md` §4) son changes separados. Este change cubre **Fase 0 — Infraestructura**.

## 1. Phase 0 — TypeScript Infrastructure

- [ ] 1.1 Crear `apps/server/tsconfig.json` según design §1 (`allowJs: true`, `checkJs: true` inicial, `noEmit: true`, `target: es2022`, `module/moduleResolution: nodenext`, `types: ["node"]`, `strict: false`, `incremental: true`) — verificar con `npx tsc --showConfig -p apps/server` y confirmar que `npm run dev --workspace=apps/server` sigue arrancando sin cambios
  - →
- [ ] 1.2 Ampliar cobertura `.ts` del toolchain ANTES de convertir código: bloques backend + complexity de `eslint.config.js` (`apps/server/**/*.{js,ts}`), scripts `lint`/`format` de `apps/server/package.json`, sección `apps/server` de `knip.jsonc` (`src/**/*.ts`, `tests/**/*.ts`), regexes de `apps/server/.dependency-cruiser.cjs`, `include` de `apps/server/vitest.config.js`, glob eslint de `lint-staged` en `package.json` raíz (prettier ya cubre `ts`) — verificar que eslint/knip/dep-cruiser no producen findings nuevos sobre el codebase 100% JS
  - →
- [ ] 1.3 Medir baseline de errores de `checkJs` sobre los 228 JS con `npx tsc --noEmit` desde `apps/server` y decidir según el umbral del design §2 (continuar con `checkJs: true` si el volumen es asumible; si no, `checkJs: false` como flag de Fase 3) — registrar el número exacto de errores y la decisión aquí
  - →
- [ ] 1.4 Instalar `@types/express @types/jsonwebtoken @types/bcrypt @types/swagger-jsdoc @types/swagger-ui-express` (+ las que la medición de 1.3 demande) como devDeps de `apps/server` — verificar que el run de 1.3 no reporta `Cannot find module ... or its corresponding type declarations` para las deps runtime
  - →
- [ ] 1.5 Habilitar el job `server-typecheck` en `.github/workflows/ci.yml` (quitar `if: false` y el placeholder "TypeCheck: no-op until TS migration"; comando `npx tsc --noEmit`) SOLO cuando el run local esté verde — verificar con actionlint y simulando el paso del job localmente
  - →
- [ ] 1.6 Registrar el protocolo de conversión (design §5) en `docs/learning/typescript-migration-server.md` (recap con las 6 reglas) y actualizar `docs/CONTEXT-CICD.md` §1 (`server-typecheck` → Activo) + nota de métrica de progreso (`% archivos .ts` por fase)
  - →
- [ ] 1.7 Registrar métrica baseline del change: `228 JS / 0 TS`, imports `.js`-sufijados `389/389`, job `server-typecheck` presente-disabled → presente-activo — actualizar esta línea al cierre de la Fase 0 con los valores finales
  - →

## 2. Fase 1 — Hojas del grafo (change separado)

- [ ] 2.1 Crear change OpenSpec `server-ts-phase1-leaves` cubriendo: `config/db.ts` (singleton Prisma tipado), `config/dotenv.ts` (firma `(key: EnvKey) => string`), `config/cors.ts`, `config/aws/*.ts`, `common/crypto/*.ts`, `logger/*.ts`, `utils/constants/enums.ts`, `schemas/*.ts` — cada archivo según el protocolo de conversión (design §5)

## 3. Fase 2 — Módulos (change separado)

- [ ] 3.1 Crear change OpenSpec `server-ts-phase2-modules` cubriendo los 24 módulos en orden de riesgo ascendente (settings → attendance → news → users → auth → events → resto), patrón por módulo: schemas → dao → service → routes → controller; auditar para borrado el código muerto de knip (`clientOrder`, `providerOrder`) antes de migrarlo

## 4. Fase 3 — Núcleo transversal y strict (change separado)

- [ ] 4.1 Crear change OpenSpec `server-ts-phase3-core` cubriendo: `middleware/` (12 archivos, `RequestHandler` genérico + `declare global` para `req.user`), `socket/` (22 archivos), `app.ts` + `bin/index.ts` al final (actualizar `main`, `ecosystem.config.js`, nodemon), y endurecimiento strict un flag por change (`noImplicitAny` → `strictNullChecks` → `noUncheckedIndexedAccess` → `strict: true`)
