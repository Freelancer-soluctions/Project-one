# Tasks

> Cada fix = un commit con tests de regresión. Gates por fix (type-check/lint/test:unit/depcruise). Los gates específicos 1.4/2.4/3.4 se consolidan en §4.
>
> **Desviación de naming (aplicada):** las suites nuevas se llaman `<x>.unit.test.ts`, no `<x>.test.ts`. El script
> `test:unit` del workspace es `vitest run ".unit.test"` y `vitest.config.ts` incluye solo `**/*.unit.test.{js,ts}`:
> un `verifyRole.test.ts` **no correría** en el gate. Archivos reales: `src/middleware/verifyRole.unit.test.ts`,
> `src/modules/settings/settings-patch-display.unit.test.ts`, `src/config/dotenv.unit.test.ts`.

## 1. Fix req.userRole (security) — AMBAS factories, 3 caminos (design §1)

- [x] 1.1 Verificar consumers de `GET /events?showDeleted=true` en el frontend + confirmar que events/routes L243 monta `checkRoleAuthOrPermisssion` y enumerar sus 3 caminos de éxito (tabla design §1)
  - Confirmado: `grep -rn showDeleted apps/client/src` → **0 matches** (ningún consumer del frontend envía el parámetro; el fix no rompe ninguna pantalla).
  - Confirmado: `events/routes.ts` monta `checkRoleAuthOrPermisssion({ allowedRoles: [ADMIN, MANAGER, USER], permissions: [canViewEvents] })` → el camino real de `GET /events` es la factory de 3 caminos, no `checkRoleAuth`.
- [x] 1.2 Asignar `req.userRole` en TODOS los caminos de éxito de AMBAS factories: `checkRoleAuth` (1 camino) y `checkRoleAuthOrPermisssion` (3 caminos: ADMIN-shortcircuit, permissions-vacío, permiso-concedido — con `userRoleCode`). El tipo global ya existe en verifyToken.ts (nada que añadir)
  - `src/middleware/verifyRole.ts`: 4 asignaciones (`req.userRole = userRole` / `req.userRole = userRoleCode`). El `declare global` de `verifyToken.ts` L31-32 ya declaraba `userRole?: string` — no se tocó.
- [x] 1.2b **Hallazgo extra (bloqueaba el fix):** el guard del controller comparaba contra el literal `'ADMIN'`, no contra el código real (`ROLESCODES.ADMIN === 'C01'`). Asignar `req.userRole = 'C01'` habría dejado el endpoint **peor** (403 incluso al ADMIN). Corregido en `modules/events/controller.ts` con `ROLESCODES.ADMIN` + comentario del porqué.
- [x] 1.3 Tests de regresión (suite nueva `middleware/verifyRole.unit.test.ts`): ADMIN → `req.userRole === 'C01'` y allow; USER → asignado y 403 según guard; cubrir los 3 caminos de `checkRoleAuthOrPermisssion`
  - 12 tests: `checkRoleAuth` (allow + 403 + 401), los 3 caminos de `checkRoleAuthOrPermisssion` (assert de `req.userRole`), y el guard real del controller con `C01`/`C02`/`undefined` (fail-closed).
- [x] 1.4 Gates (consolidados en §4)

## 2. Fix PATCH settings display (endpoint roto) — aplanado en service, create NO se toca (design §2)

- [x] 2.1 Confirmar el diagnóstico: PATCH roto (controller pasa DTO crudo), create correcto (service ya aplana L67-69)
  - `controller.ts` L173: `updateData.displayOptions = displayOptions` → `dao.patchSettingsById(id, data)` → `prisma.settings.update`. `service.createOrUpdateSettingsDisplay` L67-69 sí despliega `{ ...displayOptions }`. Create intacto.
- [x] 2.2 Aplanar en el service (`patchSettingsById`): convertir `displayOptions` anidado → columnas planas (`displayEvents`...`displayStock`) **preservando `language`** si viene en el mismo PATCH
  - `settings/service.ts`: `{ ...(language !== undefined && { language }), ...(displayOptions !== undefined && { ...displayOptions }) }`.
  - Tipo nuevo `PatchSettingData` en `settings/types.ts` (8 columnas + `language?`) y `dao.patchSettingsById` lo exige en vez de `Prisma.settingsUpdateInput` → una clave inexistente ya no puede colarse.
  - `updatedOn` **no** se setea (follow-up de §4.2, fuera de alcance).
- [x] 2.3 Test de regresión (suite nueva `modules/settings`): PATCH con `language + displayOptions` juntos → prisma.settings.update recibe SOLO columnas planas + language (mock dao)
  - `src/modules/settings/settings-patch-display.unit.test.ts`: 5 tests (ambos campos, las 8 columnas, solo language, solo display, sin `updatedOn`), con `expect(payload).not.toHaveProperty('displayOptions')`.
- [x] 2.4 Gates (consolidados en §4)

## 3. Fix dotenv — Opción C: `requireEnv` para keys críticas (design §3)

- [x] 3.0 Crear `design.md` (este archivo) — ANTES de implementar 3.x
- [x] 3.1 Añadir `requireEnv(key: CriticalEnvKey): string` (throw `❌ Missing required env var: ${key}` en acceso) a `config/dotenv.ts` + tipo `CriticalEnvKey` (SECRETKEY, REFRESHSECRETKEY, AES_GCM_KEY, ALGORITHM)
  - Throw perezoso (al acceder, no al importar) → blast radius = call-site, no el suite completo.
- [x] 3.2 Migrar las ~10 llamadas críticas a `requireEnv`: SECRETKEY (verifyToken, socket/auth, createToken×2), REFRESHSECRETKEY (createToken×2), AES_GCM_KEY (prisma-query L11 — el agujero silencioso; encription-middleware ya tiene guard), ALGORITHM
  - 9 call-sites: `middleware/verifyToken.ts` (SECRETKEY, + typo `dontenv` eliminado), `socket/auth.ts`, `utils/jwt/createToken.ts` ×4, `utils/prisma/prisma-query.ts` (AES_GCM_KEY + ALGORITHM), `middleware/encription-prisma-middleware.ts` (AES_GCM_KEY + ALGORITHM; el guard manual pasó a `requireEnv`, que además nombra la key).
  - Los ~14 consumidores opcionales siguen con `dotenv()` + su default propio.
- [x] 3.3 Test: `.env.test` commiteado ya tiene las críticas → test que `requireEnv('SECRETKEY')` retorna valor en test env y `requireEnv` lanza con el nombre de la key si ausente
  - `src/config/dotenv.unit.test.ts`: 5 tests (valor presente, falta, vacío, throw perezoso en import dinámico, contraste con `dotenv()` opcional).
- [x] 3.4 Gates (consolidados en §4)

## 4. Cierre

- [x] 4.0 Gates por fix (ejecutar en cada commit de fix): `npm run type-check` EXIT 0 · `npx eslint "src/**/*.ts" --max-warnings 0` 0 · `npm run test:unit` 175+ · `npm run depcruise:server` 0 errores
  - `type-check` → exit 0 · `eslint` → exit 0 · `test:unit` → **23 archivos, 197 tests** (baseline 175 + 22 nuevos) exit 0 · `depcruise` → **0 errors**, 7 warnings `no-orphans` preexistentes (ninguno de los archivos tocados)
  - **Contra-prueba del requisito "el test falla con el comportamiento pre-fix":** revertidos temporalmente los 4 cambios (quitar las asignaciones de `req.userRole`, volver al literal `'ADMIN'`, devolver el DTO crudo en `patchSettingsById`, `requireEnv` sin throw) → **11 tests fallan**, incluido `ADMIN (C01) con showDeleted=true: 200` (prueba de que el literal habría rechazado al ADMIN). Restaurado: diff idéntico al estado del fix (128 insertions / 30 deletions) y 197/197 en verde.
- [x] 4.1 `openspec validate server-ts-latent-defects --strict` → PASS + nota en `docs/CONTEXT-CICD.md` (bugs latentes corregidos)
  - Validate → `Change 'server-ts-latent-defects' is valid` (exit 0). Nota: §9.4 "Bugs latentes del server corregidos (2026-10-20)".
- [x] 4.2 Follow-ups registrados (fuera de alcance): patchSettingsById sin updatedOn; checkRoleAuthOrPermisssion L98 sin guard de userId (403 vs 401)
  - Registrados en `design.md` §4. El de `updatedOn` queda además fijado por un test (`no setea updatedOn`) para que se note al implementarlo.
- [x] 4.3 **Trasladado y resuelto en `server-fix-role-permits-authorization` (2026-10-20):** el hallazgo preexistente de `verifyRole.ts` L136-141 — el DAO devuelve `permits`, no `rolePermits`, así que `rolePermissions` era siempre `[]` y cualquier rol no-ADMIN era rechazado en rutas con `permissions` no vacío. Corregido en el change propio (fix + 4 tests del camino 3); **merge pendiente del sign-off de la matriz `userPermits` de producción** (task 1.1 de ese change), porque el fix cambia autorización en runtime. El hash del commit se anota en `openspec/changes/server-fix-role-permits-authorization/tasks.md` al commitear.

---

## Follow-up vivo al archivar (2026-10-20)

> Archive ejecutado con 17/18 tasks. **4.3 NO es trabajo perdido**: el CLI archivó el change con el warning
> `1 incomplete task(s) found. Continuing due to --yes flag.`

- [ ] **4.3 viaja como follow-up vivo** — hallazgo **pre-existente** (no introducido por este change):
      `apps/server/src/middleware/verifyRole.ts` L141-153. El DAO devuelve `permits`, pero el código lee `rolePermits`,
      así que `rolePermissions` es siempre `[]` y cualquier rol no-ADMIN es rechazado (403) en rutas con `permissions`
      no vacío (p. ej. `GET /events` vía `checkRoleAuthOrPermisssion`).
  - **Por qué queda abierta:** corregirla **altera autorización en runtime** (USER/MANAGER pasarían de 403 a
    permitido/denegado según el permiso real). No es un fix mecánico: exige **decisión de producto** sobre la matriz
    de permisos por rol + un **change OpenSpec propio** con su matriz de tests.
  - **Estado al archivar:** sin implementar. Los otros 3 fixes de este change (req.userRole, PATCH settings
    displayOptions, `requireEnv`) están implementados, con tests de regresión y verificados por @reviewer
    (197/197 tests, gates verdes).
  - **Cierre (2026-10-20):** implementado en `openspec/changes/server-fix-role-permits-authorization`
    (`verifyRole.ts` lee `user.permits`; 201/201 tests; inventario de 102 rutas afectadas). No mergeado: falta el
    gate de producto 1.1 de ese change.
  - **Trazabilidad:** registrado en §4.2/design §4 y en `docs/CONTEXT-CICD.md` §9.4.
