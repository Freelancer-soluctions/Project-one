# Tasks

> Fases 2–4 del plan (`docs/learning/typescript-migration-server.md` §4): las fases de CONVERSIÓN son changes separados; este change cubre **Fase 0 — Infraestructura** (verificada contra el árbol) y **Fase 4 — Strict gradual** (absorbida de `typescript-strict-check`, dueño único). Ver `design.md` decisiones 1-8.

## 1. Phase 0 — TypeScript Infrastructure (verificar estado existente + cerrar gaps)

- [ ] 1.1 Verificar el tsconfig existente contra el objetivo Fase 0: `apps/server/tsconfig.json` extiende la raíz, `include: ["src/**/*"]`, `noEmit: true`, `allowJs: true`, `module/moduleResolution: nodenext`, `strict` ausente — `npx tsc --showConfig -p apps/server` confirma la config efectiva y `npm run dev --workspace=apps/server` arranca sin cambios
- [ ] 1.2 Ampliar cobertura `.ts` del toolchain ANTES de convertir código: bloques backend + complexity de `eslint.config.js` (`apps/server/**/*.{js,ts}`), scripts `lint`/`format` de `apps/server/package.json`, sección `apps/server` de `knip.jsonc` (`src/**/*.ts`, `tests/**/*.ts`), regexes de `apps/server/.dependency-cruiser.cjs`, `include` de `apps/server/vitest.config.js` — verificar que eslint/knip/dep-cruiser no producen findings nuevos sobre el codebase 100% JS (`lint-staged` raíz ya cubre `ts` en sus globs: verificado 2026-10-01)
- [ ] 1.3 Medir baseline de errores con `checkJs: true` temporal sobre los 228 JS con `npx tsc --noEmit` desde `apps/server` y decidir según el umbral del design §2 (≤~200 errores asumibles → activar `checkJs: true` permanente; si no, mantener `checkJs: false` y reevaluar en Fase 4) — registrar el número exacto de errores y la decisión aquí
- [ ] 1.4 Instalar `@types/express @types/jsonwebtoken @types/bcrypt @types/swagger-jsdoc @types/swagger-ui-express` (+ las que la medición de 1.3 demande) como devDeps de `apps/server` — verificar que el run de 1.3 no reporta `Cannot find module ... or its corresponding type declarations` para las deps runtime
- [ ] 1.5 Verificar el gate CI ya activo (design §3): el paso de `server-typecheck` corre el comando real sin `if: false` ni fallback `|| echo` (grep); `client-typecheck` igualmente activo; ambos siguen en `prebuild-quality-complete.needs`; medir el delta de duración de `tsc --noEmit` con `incremental: true`
- [ ] 1.6 Verificar scripts `type-check` existentes: raíz (`tsc --noEmit -p apps/server`) y añadir/confirmar el equivalente en `apps/server/package.json` — exit 0 en código limpio y non-zero con un error de tipo inyectado
- [ ] 1.7 Registrar el protocolo de conversión (design §5) en `docs/learning/typescript-migration-server.md` (recap con las 6 reglas) y actualizar `docs/CONTEXT-CICD.md` §1 (`server-typecheck` → Activo) + nota de métrica de progreso (`% archivos .ts` por fase)
- [ ] 1.8 Registrar métrica baseline del change: `228 JS / 0 TS`, imports `.js`-sufijados `389/389`, job `server-typecheck` activo con baseline verde — actualizar esta línea al cierre de la Fase 0 con los valores finales

## 2. Fase 1 — Hojas del grafo (change separado)

- [ ] 2.1 Crear change OpenSpec `server-ts-phase1-leaves` cubriendo: `config/db.ts` (singleton Prisma tipado), `config/dotenv.ts` (firma `(key: EnvKey) => string`), `config/cors.ts`, `config/aws/*.ts`, `common/crypto/*.ts`, `logger/*.ts`, `utils/constants/enums.ts`, `schemas/*.ts` — cada archivo según el protocolo de conversión (design §5)

## 3. Fase 2 — Módulos (change separado)

- [ ] 3.1 Crear change OpenSpec `server-ts-phase2-modules` cubriendo los 24 módulos en orden de riesgo ascendente (settings → attendance → news → users → auth → events → resto), patrón por módulo: schemas → dao → service → routes → controller; auditar para borrado el código muerto de knip (`clientOrder`, `providerOrder`) antes de migrarlo

## 4. Fase 3 — Núcleo transversal (change separado)

- [ ] 4.1 Crear change OpenSpec `server-ts-phase3-core` cubriendo: `middleware/` (12 archivos, `RequestHandler` genérico + `declare global` para `req.user`), `socket/` (22 archivos), `app.ts` + `bin/index.ts` al final (actualizar `main`, `ecosystem.config.js`, nodemon)

## 5. Fase 4 — Strict gradual (absorbido de `typescript-strict-check`, dueño único)

- [ ] 5.1 Registrar el baseline de errores de `tsc --noEmit -p apps/server` antes del primer flag (número exacto en este archivo); prohibición operativa: ningún flag de strictness por CLI fuera de `tsconfig.json` (grep de `--strict`/flags en `package.json` y ci.yml)
- [ ] 5.2 Cheap opt-ins primero: activar `noImplicitReturns` + `noFallthroughCasesInSwitch` en `apps/server/tsconfig.json` y resolver el delta de errores a 0 contra el baseline de 5.1
- [ ] 5.3 Activar `noImplicitAny`, corregir los errores reportados (TS7006) y verificar delta 0
- [ ] 5.4 Activar `strictNullChecks` + `strictBindCallApply` + `strictFunctionTypes` + `strictPropertyInitialization`; corregir errores (TS18048, TS2564) y verificar `tsc --noEmit` verde
- [ ] 5.5 Activar `useUnknownInCatchVariables` y verificar que el middleware de errores de Express hace narrowing `catch (err)` con `err instanceof Error` (sin `any` implícito)
- [ ] 5.6 Activar `noUncheckedIndexedAccess` AL FINAL (paso propio): corregir accesos indexados (`rows[0]`, `process.env[KEY]`, `req.body[key]`) y verificar verde
- [ ] 5.7 Activar `strict: true` como consolidación SOLO cuando todos los flags anteriores estén adoptados y verificados (sin big-bang: a este punto el flag solo consolida lo ya activo) — `grep -n "strict" tsconfig.json apps/server/tsconfig.json` muestra la secuencia completa
- [ ] 5.8 Verificar lint-staged `*.ts` (design §8): staged `.ts` pasa por prettier + eslint + depcruise sin typecheck completo de proyecto en el hot path; `npx lint-staged --debug` lista la regla

## 6. Documentación y cierre

- [ ] 6.1 Actualizar `docs/learning/typescript-strict-check.md` (documento absorbido) a la sección 1, 5 y 6: tsconfigs existentes, orden de flags de Fase 4, scripts, lint-staged y jobs CI activos sin `if: false`/`|| echo` — claims verificados contra el repo con grep
- [ ] 6.2 Limpiar la línea corrupta de la sección 6 del doc (stray `etr bounce использовании Паспорт`) y verificar que la sección se lee limpia
- [ ] 6.3 Verificar que el orden de flags del doc coincide con `apps/server/tsconfig.json` (cheap → familia → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess` último)
- [ ] 6.4 Verificar referencias oficiales en la sección 7 del doc: `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/`, `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html` + cross-links a `typescript-migration-server.md` y `docs/CONTEXT-CICD.md`
- [ ] 6.5 Confirmar supersede completo: `openspec list` ya NO muestra `typescript-strict-check`; `grep -rn "typescript-strict-check" openspec/specs/ openspec/changes/` solo devuelve las notas de absorción de ESTE change, `archive/` (historia inmutable) y los comentarios históricos de `tsconfig*.json` (se actualizan al tocar cada archivo)
- [ ] 6.6 Validación final: `openspec validate server-typescript-migration --strict` y `openspec validate --specs --strict` exit 0; pipeline completo `npm run type-check` + `npm run lint` + `npm run format:check` exit 0; actionlint exit 0 sobre ci.yml
