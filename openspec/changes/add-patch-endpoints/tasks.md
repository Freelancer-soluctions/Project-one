# Tasks: Add PATCH Endpoints

## Group 1: Backend Shared
- [ ] 1.1 Create DAO PATCH-safety pattern reference doc (3 patterns: scalar spread, conditional connect, conditional deleteMany+create)
- [ ] 1.2 Process providerOrder: PATCH route + schema + DAO safety + frontend mutation (simple module, few relations)

## Group 2: Simple modules (no/few relations, spread-pattern DAOs)
- [ ] 2.1 Process news: PATCH route + partial schema + DAO safety + frontend `usePatchNewByIdMutation`
- [ ] 2.2 Process events: PATCH route + partial schema + DAO safety + frontend `usePatchEventByIdMutation`
- [ ] 2.3 Process notes: PATCH for `/notes/:id` and `/notes/hashtags/:id` only. Omit `/notecolumn` (column-move is RPC action, not resource update). 2 new mutations: `usePatchNoteByIdMutation`, `usePatchHashtagByIdMutation`
- [ ] 2.4 Process payroll: PATCH route + partial schema + DAO safety + frontend `usePatchPayrollByIdMutation`

## Group 3: Medium modules (some FK relations)
- [ ] 3.1 Process clients: PATCH route + partial schema + DAO safety + frontend `usePatchClientByIdMutation`
- [ ] 3.2 Process employees: PATCH route + partial schema + DAO safety + frontend `usePatchEmployeeByIdMutation`
- [ ] 3.3 Process providers: PATCH route + partial schema + DAO safety + frontend `usePatchProviderByIdMutation`
- [ ] 3.4 Process expenses: PATCH route + partial schema + DAO safety + frontend `usePatchExpenseByIdMutation`
- [ ] 3.5 Process attendance: PATCH route + partial schema + DAO safety + frontend `usePatchAttendanceByIdMutation`

## Group 4: Complex modules (many FK relations — needs conditional connect)
- [ ] 4.1 Process products: PATCH route + partial schema + DAO safety + frontend `usePatchProductByIdMutation`
- [ ] 4.2 Process inventoryMovement: PATCH route + partial schema + DAO safety + frontend `usePatchInventoryMovementByIdMutation`
- [ ] 4.3 Process stock: PATCH route + partial schema + DAO safety + frontend `usePatchStockByIdMutation`
- [ ] 4.4 Process permission: PATCH route + partial schema + DAO safety + frontend `usePatchPermissionByIdMutation`
- [ ] 4.5 Process performanceEvaluation: PATCH route + partial schema + DAO safety + frontend `usePatchPerformanceEvaluationByIdMutation`

## Group 5: Most complex modules (nested relations + deleteMany patterns)
- [ ] 5.1 Process purchase: PATCH route + partial schema + DAO safety (conditional deleteMany for purchaseDetail) + frontend `usePatchPurchaseByIdMutation`
- [ ] 5.2 Process sales: PATCH route + partial schema + DAO safety (conditional deleteMany for saleDetail) + frontend `usePatchSaleByIdMutation`
- [ ] 5.3 Process users: PATCH route + partial schema + DAO safety (conditional deleteMany for userPermits) + frontend `usePatchUserByIdMutation`
- [ ] 5.4 Process settings: PATCH route + partial schema + DAO safety + frontend `usePatchCategoryByIdMutation`
- [ ] 5.5 Process warehouse: PATCH route + partial schema + DAO safety (spread-pattern, zero DAO changes) + frontend `usePatchWarehouseByIdMutation`
- [ ] 5.6 Process vacation: PATCH route + partial schema + DAO safety + frontend `usePatchVacationByIdMutation`

## Group 6: Frontend Shared
- [ ] 6.1 Create useChangedFields hook at apps/client/src/hooks/useChangedFields.js (inline deep equal, no external deps)
- [ ] 6.2 Export from apps/client/src/hooks/index.js

## Group 7: Verification
- [ ] 7.1 Verify backend npm run build passes
- [ ] 7.2 Verify frontend npm run build passes
- [ ] 7.3 Manual smoke test: verify PATCH endpoint with single-field update on one module per group
- [ ] 7.4 Verify PUT endpoints still work (regression check)

## Group 8: Bug Fix — Remove `id` from dialog mappedValues

- [x] 8.1 Remove `id` from `mappedValues` in 19 dialog files + fix useEffect guard in 5 unprotected files
- [x] 8.2 Regression check: verify PATCH/PUT still works after removing `id` from form reset
- [x] 8.3 Verify POST creation works for events, news, warehouse, settingsProductCategories, stock
