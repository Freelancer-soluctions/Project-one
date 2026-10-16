# Tasks

> Patrón por módulo (design §2): `dao → service → routes → controller` + test colocalizado, un archivo = un commit, gates tras cada módulo (design §6): `npm run type-check` + `npm run lint --workspace=server-express` + `cd apps/server && npm run test:unit` + `npm run depcruise:server`. Schemas de módulos YA convertidos (Fase 1). Prohibido avanzar de módulo con gates rojos.

## 0. Auditoría de código muerto (ANTES de migrar)

- [ ] 0.1 `npm run knip:server` sobre `clientOrder` (4 archivos) — si sin consumidores vivos: ELIMINAR (`chore(server): remove dead code clientOrder (knip)`); si con consumidores: migrar normal y registrar la contradicción de knip aquí
- [ ] 0.2 Ídem `providerOrder` (5 archivos)

## 1. Módulos en orden de riesgo ascendente (padre task 3.1)

- [ ] 1.1 `settings` (controller, dao, routes, service) — primer lote, CRUD simple
- [ ] 1.2 `attendance` (4 archivos)
- [ ] 1.3 `news` (4 archivos)
- [ ] 1.4 `users` (4 archivos + `constants/users.js` → `.ts` con `as const`)
- [ ] 1.5 `auth` (4 archivos — consume `utils/jwt`/`bcrypt` aún `.js` vía allowJs; registrar fricciones de tipos)
- [ ] 1.6 `events` (el más complejo: controller/dao/routes/service + `stateMachine.js` → transiciones `as const` + unions + submódulo `attendee` (4) + 12 tests colocalizados (7 events + 5 attendee))
- [ ] 1.7 Resto alfabético (patrón ya rodado): `clients`, `employees`, `expenses`, `inventoryMovement`, `notes` (incluye `utils/{colorMapper,index,mentionParser}.js` + 2 tests colocalizados), `payroll`, `performanceEvaluation`, `permission`, `products`, `providers`, `purchase`, `sales`, `security` (solo `routes.js`), `stock`, `vacation`, `warehouse` — más `clientOrder`/`providerOrder` si sobrevivieron a la auditoría 0.1/0.2
- [ ] 1.8 **Regla de gates**: registrar aquí la evidencia de gates por módulo (o por mini-lote de 3-4 módulos del grupo `resto`) — exit 0 en los 4 gates; conteo acumulado `.ts` anotado

## 2. Registro de rutas

- [ ] 2.1 `src/routes/v1/index.js` → `index.ts` (importa los routes de los 24 módulos ya `.ts`; verificar que el app monta el router sin cambios)

## 3. Suite de tests del workspace (padre task 3.2)

- [ ] 3.1 `tests/setupGlobal.js` (+ su test), `tests/setupTest.js`, `tests/test-server.js` → `.ts` — actualizar `setupFiles: ['./tests/setupTest.js']` en `vitest.config.js`/`vitest.smoke.config.js` en el mismo commit; verificar `test:unit` completo
- [ ] 3.2 `tests/smoke/*` (auth, database, endpoints, health + `helpers/request.js`) → `.ts` (5)
- [ ] 3.3 `tests/integration/*` (4) → `.ts` — ejecutar `test:integration` en CI del PR (PostgreSQL no disponible local, conocido)
- [ ] 3.4 `tests/orphans/*` (3) + `tests/unit/{manual-test,properties/*}` (4) → `.ts` — evaluar si `manual-test.js` y `orphans/*` son código muerto (knip) y eliminar en vez de convertir si procede (registrar decisión)
- [ ] 3.5 **Gates de cierre de tests**: `type-check` + `lint` + `test:unit` (175 tests → mismos en `.ts`) + `depcruise:server` exit 0

## 4. Cierre y registro

- [ ] 4.1 Contador `docs/CONTEXT-CICD.md` §12.2 → `173/236 (Fase 2 — módulos)` con fecha; anotar task 1.8 del padre con el delta
- [ ] 4.2 Verificación de no-regresión: `npm run knip:server` sin muertos nuevos; `grep -rn ": any" apps/server/src --include="*.ts"` → sin `any` nuevos; imports `.js` intactos
- [ ] 4.3 Marcar task 3.2 del padre `[x]` + `npx openspec validate server-ts-phase2-modules --strict` → PASS
