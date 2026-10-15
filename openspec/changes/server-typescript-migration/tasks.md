# Tasks

> Fases 2–4 del plan (`docs/learning/typescript-migration-server.md` §4): las fases de CONVERSIÓN son changes separados; este change cubre **Fase 0 — Infraestructura** (verificada contra el árbol) y **Fase 4 — Strict gradual** (absorbida de `typescript-strict-check`, dueño único). Ver `design.md` decisiones 1-9.

## 1. Phase 0 — TypeScript Infrastructure (verificar estado existente + cerrar gaps)

- [ ] 1.1 Verificar el tsconfig existente contra el objetivo Fase 0: `apps/server/tsconfig.json` extiende la raíz, `include` hoy `["src/**/*"]` → objetivo `["src/**/*", "tests/**/*"]` (añadir `tests/**/*` para cubrir los tests convertidos a `.ts`), `noEmit: true`, `allowJs: true`, `module/moduleResolution: nodenext`, `strict` ausente — `npx tsc --showConfig -p apps/server` confirma la config efectiva y `npm run dev --workspace=apps/server` arranca sin cambios
- [ ] 1.2 Ampliar cobertura `.ts` del toolchain ANTES de convertir código: bloques backend + complexity de `eslint.config.js` (`apps/server/**/*.{js,ts}` — parser `typescript-eslint` y bloque `tests` en tarea 1.9), scripts `lint`/`format` de `apps/server/package.json`, sección `apps/server` de `knip.jsonc` (`src/**/*.ts`, `tests/**/*.ts`), regexes de `.dependency-cruiser.cjs` **RAÍZ** (las regexes `(js|ts)` viven AHÍ y ya cubren `.ts` — no-op en el config server, que solo `extends`; añadir `options.tsConfig.fileName` apuntando a `apps/server/tsconfig.json` en `apps/server/.dependency-cruiser.cjs`), `include` de `apps/server/vitest.config.js` — verificar que eslint/knip/dep-cruiser no producen findings nuevos sobre el codebase 100% JS (`lint-staged` raíz: prettier y depcruise YA cubren `ts` en sus globs; el step de eslint NO — glob `*.{js,jsx,cjs,mjs}` sin `ts`, cierre en tarea 1.9; verificado 2026-10-14)
- [ ] 1.3 Medir baseline de errores con `checkJs: true` temporal sobre los 236 JS (208 `src/` + 23 `tests/` + 8 configs/prisma/scripts) con `npx tsc --noEmit` desde `apps/server` y decidir según el umbral del design §2 (≤~200 errores asumibles → activar `checkJs: true` permanente; si no, mantener `checkJs: false` y reevaluar en Fase 4) — registrar el número exacto de errores y la decisión aquí
- [ ] 1.4 Instalar `@types/node` (hoy NO declarado) + `@types/express@^4.17.21` (**PIN obligatorio**: `latest` es 5.0.6, es para express@5 y contaminaría los tipos de express@4) + `@types/jsonwebtoken @types/bcrypt @types/swagger-jsdoc @types/swagger-ui-express` (+ las que la medición de 1.3 demande) como devDeps de `apps/server` — verificar que el run de 1.3 no reporta `Cannot find module ... or its corresponding type declarations` para las deps runtime
- [ ] 1.5 Verificar el gate CI ya activo (design §3): el paso de `server-typecheck` corre el comando real sin `if: false` ni fallback `|| echo` (grep); `client-typecheck` igualmente activo; ambos siguen en `prebuild-quality-complete.needs`; añadir `incremental: true` a los dos `tsconfig.json` (raíz y `apps/server`, hoy AUSENTE — design decisión 1) y medir el delta de duración de `tsc --noEmit` con y sin el flag
- [ ] 1.6 Verificar scripts `type-check` existentes: raíz (`tsc --noEmit -p apps/server`) y añadir/confirmar el equivalente en `apps/server/package.json` — exit 0 en código limpio y non-zero con un error de tipo inyectado
- [ ] 1.7 Registrar el protocolo de conversión (design §5) en `docs/learning/typescript-migration-server.md` (recap con las 6 reglas) y actualizar `docs/CONTEXT-CICD.md` §1 (`server-typecheck` → Activo) + nota de métrica de progreso (`% archivos .ts` por fase)
- [ ] 1.8 Registrar métrica baseline del change: `236 JS / 0 TS` (208 `src/` + 23 `tests/` + 8 configs/prisma/scripts), imports `.js`-sufijados `389/389`, job `server-typecheck` activo con baseline verde; JSDoc: ~2.586 bloques (2.099 `@param`, 487 `@returns`) y **`@typedef`/`@type` = 0** — la regla (c) del protocolo (muerte del `@typedef` al convertir) aplica a 0 archivos hoy; actualizar esta línea al cierre de la Fase 0 con los valores finales
- [ ] 1.9 Instalar y configurar `typescript-eslint` (paquete único con `defineConfig`, sin paquetes `@typescript-eslint/*` sueltos) en `eslint.config.js`: presets `recommended` **acotados** a `files: ["apps/server/**/*.{js,ts}"]` (y el bloque `tests`), SIN typed-linting (`projectService`/`parserOptions.project`) en Fase 0 — parser + reglas sintácticas solamente; ampliar los bloques backend + complexity + tests de eslint a `{js,ts}` y verificar `npm run lint` verde con 0 archivos `.ts` hoy y sin findings nuevos sobre el codebase 100% JS (cierra también el step de eslint de `lint-staged` raíz, glob `*.{js,jsx,cjs,mjs}` → añadir `ts`, ver design §8)
- [ ] 1.10 Ampliar los filtros de vitest de `apps/server/package.json` (`test:unit`, `test:integration`, `test:changed`): substring `.unit.test.js`/`.integration.test.js` → `.{js,ts}` (p. ej. `.unit.test.{js,ts}`) — hoy los tests convertidos a `.ts` NO corren en estos filtros (gap C2); verificar que ambos filtros listan/ejecutan los tests tras el cambio y que `npm run type-check` sigue verde
- [ ] 1.11 Upgrade de Node (independiente de la migración TS; Node 20 EOL 2026-04-30): engines `>=20` → `>=22` (o 24 LTS) en `package.json` raíz + workspaces y `FROM node:20-alpine` → `node:22-alpine`/`node:24-alpine` en `apps/server/Dockerfile` (+ imágenes equivalentes en `docker-compose*.yml` y CI) — verificar build Docker, `npm run build`/`type-check` y pipeline verdes

## 2. Fase 1 — Hojas del grafo (change separado)

- [ ] 2.1 Crear change OpenSpec `server-ts-phase1-leaves` cubriendo: `config/db.ts` (singleton Prisma tipado), `config/dotenv.ts` (firma `(key: EnvKey) => string`), `config/cors.ts`, `config/aws/*.ts`, `common/crypto/*.ts`, `logger/*.ts`, `utils/constants/enums.ts`, `schemas/*.ts` — cada archivo según el protocolo de conversión (design §5)

## 3. Fase 2 — Módulos (change separado)

- [ ] 3.1 Crear change OpenSpec `server-ts-phase2-modules` cubriendo los 24 módulos en orden de riesgo ascendente (settings → attendance → news → users → auth → events → resto), patrón por módulo: schemas → dao → service → routes → controller; auditar para borrado el código muerto de knip (`clientOrder`, `providerOrder`) antes de migrarlo

## 4. Fase 3 — Núcleo transversal (change separado)

- [ ] 4.1 Crear change OpenSpec `server-ts-phase3-core` cubriendo: `middleware/` (12 archivos, `RequestHandler` genérico + `declare global` para `req.user`), `socket/` (22 archivos), `app.ts` + `bin/index.ts` al final con el **switch de runtime a `tsx`** (decisión 9): `main`, `ecosystem.config.js` (PM2: `script` → `tsx src/bin/index.ts`), nodemon (script dev → `tsx src/bin/index.ts`) y `apps/server/Dockerfile` (`CMD ["node", "src/bin/index.js"]` → `CMD ["tsx", "src/bin/index.ts"]`), verificando que `tsx` está en **`dependencies`** (no devDeps) de `apps/server/package.json` — el Dockerfile hace `npm prune --omit=dev`; arranque real con PM2/Docker antes de cerrar

## 5. Fase configs — Conversión de configuraciones y scripts (cierre a 0 `.js`/`.cjs`/`.mjs` en `apps/server`)

- [ ] 5.1 Convertir `vitest.config.js` + `vitest.smoke.config.js` → `.ts` (renombre + imports tipados; verificar `test:unit`, `test:integration` y el run smoke con las configs nuevas)
- [ ] 5.2 Convertir `ecosystem.config.js` → `.ts` SOLO si PM2 + `tsx` lo soporta (verificar `pm2 start` real sobre el config `.ts`); si no, mantener `.js` y documentarlo como excepción única justificada
- [ ] 5.3 Convertir `prisma/seed.js` → TS y ejecutarlo con `tsx` (actualizar la entrada `seed` de `prisma/package.json`/`package.json` que lo referencie)
- [ ] 5.4 Convertir `scripts/preview-smoke.mjs` → `.ts` ejecutado con `tsx`
- [ ] 5.5 `test-sanitize.js`/`.mjs` → convertir a `.ts` o ELIMINAR — **decisión pendiente**: registrar aquí la opción elegida y su justificación
- [ ] 5.6 `apps/server/.dependency-cruiser.cjs` → verificar si dep-cruiser soporta config `.ts`; si sí, convertirlo; si no, documentarlo como la **única excepción** `.cjs` del workspace (con nota en este change)
- [ ] 5.7 Verificar el cierre: `git ls-files 'apps/server/**/*.js' 'apps/server/**/*.cjs' 'apps/server/**/*.mjs'` → 0 (o solo excepciones documentadas en 5.2/5.6) y actualizar la métrica de la tarea 1.8 con el conteo final `0 JS / N TS`

## 6. Fase 4 — Strict gradual (absorbido de `typescript-strict-check`, dueño único)

- [ ] 6.1 Registrar el baseline de errores de `tsc --noEmit -p apps/server` antes del primer flag (número exacto en este archivo); prohibición operativa: ningún flag de strictness por CLI fuera de `tsconfig.json` (grep de `--strict`/flags en `package.json` y ci.yml)
- [ ] 6.2 Cheap opt-ins primero: activar `noImplicitReturns` + `noFallthroughCasesInSwitch` en `apps/server/tsconfig.json` y resolver el delta de errores a 0 contra el baseline de 6.1
- [ ] 6.3 Activar `noImplicitAny`, corregir los errores reportados (TS7006) y verificar delta 0
- [ ] 6.4 Activar `strictNullChecks` + `strictBindCallApply` + `strictFunctionTypes` + `strictPropertyInitialization`; corregir errores (TS18048, TS2564) y verificar `tsc --noEmit` verde
- [ ] 6.5 Activar `useUnknownInCatchVariables` y verificar que el middleware de errores de Express hace narrowing `catch (err)` con `err instanceof Error` (sin `any` implícito)
- [ ] 6.6 Activar `noUncheckedIndexedAccess` AL FINAL (paso propio): corregir accesos indexados (`rows[0]`, `process.env[KEY]`, `req.body[key]`) y verificar verde
- [ ] 6.7 Activar `strict: true` como consolidación SOLO cuando todos los flags anteriores estén adoptados y verificados (sin big-bang: a este punto el flag solo consolida lo ya activo) — `grep -n "strict" tsconfig.json apps/server/tsconfig.json` muestra la secuencia completa
- [ ] 6.8 Verificar lint-staged `*.ts` (design §8): staged `.ts` pasa por prettier + eslint + depcruise sin typecheck completo de proyecto en el hot path; `npx lint-staged --debug` lista la regla

## 7. Documentación y cierre

- [ ] 7.1 Actualizar `docs/learning/typescript-strict-check.md` (documento absorbido) a la sección 1, 5 y 6: tsconfigs existentes, orden de flags de Fase 4, scripts, lint-staged y jobs CI activos sin `if: false`/`|| echo` — claims verificados contra el repo con grep
- [ ] 7.2 Limpiar la línea corrupta de la sección 6 del doc (stray `etr bounce использовании Паспорт`) y verificar que la sección se lee limpia
- [ ] 7.3 Verificar que el orden de flags del doc coincide con `apps/server/tsconfig.json` (cheap → familia → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess` último)
- [ ] 7.4 Verificar referencias oficiales en la sección 7 del doc: `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/`, `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html` + cross-links a `typescript-migration-server.md` y `docs/CONTEXT-CICD.md`
- [ ] 7.5 Confirmar supersede completo: `openspec list` ya NO muestra `typescript-strict-check`; `grep -rn "typescript-strict-check" openspec/specs/ openspec/changes/` solo devuelve las notas de absorción de ESTE change, `archive/` (historia inmutable) y los comentarios históricos de `tsconfig*.json` (se actualizan al tocar cada archivo)
- [ ] 7.6 Validación final: `openspec validate server-typescript-migration --strict` y `openspec validate --specs --strict` exit 0; pipeline completo `npm run type-check` + `npm run lint` + `npm run format:check` exit 0; actionlint exit 0 sobre ci.yml
