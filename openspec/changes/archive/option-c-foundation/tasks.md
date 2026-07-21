## 1. Utility Hooks

- [x] 1.1 Create `src/hooks/useQueryData.js` with useMemo-stabilized return
- [x] 1.2 Create `src/hooks/useLoadingState.js` with array.some() aggregation
- [x] 1.3 Export both hooks from `src/hooks/index.js`

## 2. API Definition Bug Fixes

- [x] 2.1 Fix stockAPI: change builder.mutation → builder.query for getStockByProductId
- [x] 2.2 Fix stockAPI exports: add useLazyGetStockByProductIdQuery
- [x] 2.3 Fix inventoryMovementAPI: change data → body in createInventoryMutation
- [x] 2.4 Fix inventoryMovementAPI: change data → body in updateInventoryMovementById

## 3. Verification

- [x] 3.1 Verify `npm run build` passes
- [ ] 3.2 Verify `npm run lint` passes