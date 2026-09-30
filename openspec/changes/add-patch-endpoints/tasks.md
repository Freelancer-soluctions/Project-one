# Tasks: Add PATCH Endpoints

> **AUDITORÍA (2026-09-27):** verificación 1:1 contra código. Cobertura PATCH: **21/21 módulos**
> del plan tienen `router.patch` (providerOrder, news, events, notes ×4, payroll, clients,
> employees, providers, expenses, attendance, products, inventoryMovement, stock, permission,
> performanceEvaluation, purchase, sales, users, settings ×2, warehouse, vacation) + 22 mutaciones
> client con `method: 'PATCH'`. Hook `useChangedFields` creado (6.1/6.2): `src/hooks/`
> con `{ changedFields, changedKeys, hasChanges }` (deep-equal inline, sin deps; Decision 4
> cumplida incluido `changedKeys`) + 11 tests unitarios verdes + export en hooks/index.js.
> Doc de patrones DAO (1.1): `docs/learning/patch-dao-safety-patterns.md` (Patrones A/B/C con
> ejemplos reales; guards verificados en users ×16, sales ×4, purchase, notes). Builds: client
> `vite build` ✓ (17.6s) tras fix de build del bump tiptap del triage (peers
> `@tiptap/extensions`/`@tiptap/suggestion` declarados — regresión detectada por el gate 7.2);
> server build n/a (echo). **DESVÍO DEL DESIGN documentado**: el design especificaba "dual
> PUT+PATCH" (Decision 5) pero la implementación reemplazó PUT por PATCH en toda la línea
> (0 `router.put` en módulos, mutaciones `updateXxxById` usan `method: 'PATCH'`, ver
> design.md §Desvío). Pendientes: 7.3 smoke manual, 7.4 regresión PUT (ya n/a por el desvío),
> 11.x-style smoke per-group. El change permanece ACTIVO para smoke test manual.

## Group 1: Backend Shared

- [x] 1.1 Create DAO PATCH-safety pattern reference doc (3 patterns: scalar spread, conditional connect, conditional deleteMany+create)
- [x] 1.2 Process providerOrder: PATCH route + schema + DAO safety + frontend mutation (simple module, few relations)

## Group 2: Simple modules (no/few relations, spread-pattern DAOs)

- [x] 2.1 Process news: PATCH route + partial schema + DAO safety + frontend `usePatchNewByIdMutation`
- [x] 2.2 Process events: PATCH route + partial schema + DAO safety + frontend `usePatchEventByIdMutation`
- [x] 2.3 Process notes: PATCH for `/notes/:id` and `/notes/hashtags/:id` only. Omit `/notecolumn` (column-move is RPC action, not resource update). 2 new mutations: `usePatchNoteByIdMutation`, `usePatchHashtagByIdMutation`
- [x] 2.4 Process payroll: PATCH route + partial schema + DAO safety + frontend `usePatchPayrollByIdMutation`

## Group 3: Medium modules (some FK relations)

- [x] 3.1 Process clients: PATCH route + partial schema + DAO safety + frontend `usePatchClientByIdMutation`
- [x] 3.2 Process employees: PATCH route + partial schema + DAO safety + frontend `usePatchEmployeeByIdMutation`
- [x] 3.3 Process providers: PATCH route + partial schema + DAO safety + frontend `usePatchProviderByIdMutation`
- [x] 3.4 Process expenses: PATCH route + partial schema + DAO safety + frontend `usePatchExpenseByIdMutation`
- [x] 3.5 Process attendance: PATCH route + partial schema + DAO safety + frontend `usePatchAttendanceByIdMutation`

## Group 4: Complex modules (many FK relations — needs conditional connect)

- [x] 4.1 Process products: PATCH route + partial schema + DAO safety + frontend `usePatchProductByIdMutation`
- [x] 4.2 Process inventoryMovement: PATCH route + partial schema + DAO safety + frontend `usePatchInventoryMovementByIdMutation`
- [x] 4.3 Process stock: PATCH route + partial schema + DAO safety + frontend `usePatchStockByIdMutation`
- [x] 4.4 Process permission: PATCH route + partial schema + DAO safety + frontend `usePatchPermissionByIdMutation`
- [x] 4.5 Process performanceEvaluation: PATCH route + partial schema + DAO safety + frontend `usePatchPerformanceEvaluationByIdMutation`

## Group 5: Most complex modules (nested relations + deleteMany patterns)

- [x] 5.1 Process purchase: PATCH route + partial schema + DAO safety (conditional deleteMany for purchaseDetail) + frontend `usePatchPurchaseByIdMutation`
- [x] 5.2 Process sales: PATCH route + partial schema + DAO safety (conditional deleteMany for saleDetail) + frontend `usePatchSaleByIdMutation`
- [x] 5.3 Process users: PATCH route + partial schema + DAO safety (conditional deleteMany for userPermits) + frontend `usePatchUserByIdMutation`
- [x] 5.4 Process settings: PATCH route + partial schema + DAO safety + frontend `usePatchCategoryByIdMutation`
- [x] 5.5 Process warehouse: PATCH route + partial schema + DAO safety (spread-pattern, zero DAO changes) + frontend `usePatchWarehouseByIdMutation`
- [x] 5.6 Process vacation: PATCH route + partial schema + DAO safety + frontend `usePatchVacationByIdMutation`

## Group 6: Frontend Shared

- [x] 6.1 Create useChangedFields hook at apps/client/src/hooks/useChangedFields.js (inline deep equal, no external deps)
- [x] 6.2 Export from apps/client/src/hooks/index.js

## Group 7: Verification

- [x] 7.1 Verify backend npm run build passes
- [x] 7.2 Verify frontend npm run build passes
- [ ] 7.3 Manual smoke test: verify PATCH endpoint with single-field update on one module per group
- [ ] 7.4 Verify PUT endpoints still work (regression check)

## Group 8: Bug Fix — Remove `id` from dialog mappedValues

- [x] 8.1 Remove `id` from `mappedValues` in 19 dialog files + fix useEffect guard in 5 unprotected files
- [x] 8.2 Regression check: verify PATCH/PUT still works after removing `id` from form reset
- [x] 8.3 Verify POST creation works for events, news, warehouse, settingsProductCategories, stock
