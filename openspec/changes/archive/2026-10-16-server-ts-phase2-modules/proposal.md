# Proposal

> Change hijo de `openspec/changes/server-typescript-migration/` (tasks 3.1 + 3.2 del padre, creado 2026-10-15). Requiere Fase 1 (`server-ts-phase1-leaves`) completa: los schemas Joi que los módulos importan ya serán `.ts` tipados.

## Why

Los 24 módulos son el grueso del dominio: 116 archivos `src/modules/` restantes tras las hojas (dao/service/routes/controller + tests colocalizados), el registro de rutas (`routes/v1/index.js`) y la suite de tests del workspace (`tests/`, 20 tracked). Convertirlos módulo-a-módulo (patrón vertical) permite:

1. **Verificación por unidad de dominio**: un módulo convertido = sus 4-5 archivos + sus tests movidos juntos → los gates (`type-check`, `lint`, `test:unit`, `depcruise:server`) validan una unidad coherente, no archivos sueltos.
2. **Consumo de tipos de Fase 1**: cada módulo importa sus schemas `.ts` ya tipados — el tipado de dao/service recibe los tipos Joi/constantes sin esfuerzo extra.
3. **Limpieza previa**: knip detectó código muerto (`clientOrder` — 4 archivos, `providerOrder` — 5). Migrar código muerto es desperdicio: se audita y elimina (o justifica su permanencia) ANTES de convertir.
4. **Tests conviven con su módulo** (task 3.2 del padre): convertir `tests/` en el mismo change evita un estado intermedio donde los tests `.js` importan módulos `.ts` con tipos a medias.

## What Changes

- **Orden de riesgo ascendente** (padre task 3.1): `settings` → `attendance` → `news` → `users` → `auth` → `events` → resto (alfabético: clientOrder, clients, employees, expenses, inventoryMovement, notes, payroll, performanceEvaluation, permission, products, providerOrder, providers, purchase, sales, security, stock, vacation, warehouse).
- **Patrón por módulo**: `dao.js` → `service.js` → `routes.js` → `controller.js` (schemas ya `.ts` desde Fase 1) + test colocalizado del módulo en el mismo lote. Un archivo = un commit; el módulo completo = un lote verificado.
- **Extras de módulo**: `events/stateMachine.js` (máquina de estados RSVP — tipado de transiciones), `notes/utils/{colorMapper,index,mentionParser}.js` (+ tests), `users/constants/users.js`, submódulo `events/attendee/*` (4 + tests).
- **Registro de rutas**: `src/routes/v1/index.js` → `.ts` al final del change (importa todos los routes de módulos).
- **Suite de tests** (task 3.2): `tests/setupGlobal.js` (+ `setupGlobal.unit.test.js`), `setupTest.js`, `test-server.js`, `tests/smoke/*` (5), `tests/integration/*` (4), `tests/orphans/*` (3), `tests/unit/*` (4) — total 20; las refs `setupFiles` **y `globalSetup`** de ambas configs vitest se actualizan en el mismo commit que convierte `setupTest.js`/`setupGlobal.js`.
- **Auditoría de código muerto ANTES de migrar**: `npm run knip:server` sobre `clientOrder` y `providerOrder` → eliminar (commit `chore`) o justificar permanencia registrada en tasks.
- **Verificación por lote**: los 4 gates del protocolo tras cada módulo/lote (`type-check`, `lint`, `test:unit`, `depcruise:server`).

**Fuera de alcance**: middleware/, socket/, docs/, utils/ transversales, app.js, bin/index.js (Fase 3); configs raíz (Fase configs del padre).

## Capabilities

### New Capabilities

- `server-ts-module-conversion`: Conversión TypeScript módulo-a-módulo de `apps/server` (Fase 2). Cubre el orden de riesgo ascendente, el patrón vertical por módulo (dao→service→routes→controller + test colocalizado), la auditoría de código muerto previa (knip), la conversión de `tests/` junto a sus módulos y los gates por lote.

## Impact

| File                                                                           | Change                                                                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/settings/*` (4)                                                   | primer lote (menor riesgo)                                                                                                                      |
| `src/modules/{attendance,news,users,auth,events}/*` (38 + tests colocalizados) | lotes 2-6 en orden de riesgo                                                                                                                    |
| `src/modules/*` resto (18 módulos, 78 archivos)                                | lotes 7+                                                                                                                                        |
| `src/routes/v1/index.js` → `.ts`                                               | penúltimo lote                                                                                                                                  |
| `tests/*` (20) → `.ts`                                                         | junto a sus módulos; setup al final de su lote                                                                                                  |
| `knip.jsonc` / `apps/server/package.json`                                      | sin cambios estructurales (globs ya `{js,ts}` desde Fase 0)                                                                                     |
| `docs/CONTEXT-CICD.md` §12.2                                                   | contador → `164/227 (Fase 2 — módulos, 9 muertos eliminados)` al cierre (rama congelada por la auditoría 0.1/0.2: los 9 archivos se eliminaron) |
| change padre                                                                   | tasks 3.1/3.2 marcadas al crear/completar                                                                                                       |

**Riesgos:** (1) `test-server.js`/`setupTest.js` son dependencia de TODA la suite — se convierten al final de su lote con los 4 gates como red; (2) integración necesita PostgreSQL — gates locales usan `test:unit`; `test:integration` se valida en CI del PR; (3) el patrón RequestHandler/`req.user` declarado global llega en Fase 3 — los controllers de Fase 2 tipan req/res con tipos Express base sin `declare global` (sin duplicar la declaración).
