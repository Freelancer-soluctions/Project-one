## Why

RTK Query data access across 25+ modules is inconsistent and error-prone. The `.data` extraction pattern (`const data = result?.data?.data`) is duplicated 105+ times across the codebase, making refactoring risky. Spinner aggregation (`isLoadingA || isLoadingB || isFetchingC`) is manually repeated in every page component, a constant source of missed states.

Two bugs exist in API definitions:
1. **stockAPI** uses `builder.mutation` for `getStockByProductId` — a GET endpoint that should be a `builder.query` with proper caching.
2. **inventoryMovementAPI** passes payload via the `data` property instead of `body` in create/update mutations, silently dropping the request body.

These are foundational quality-of-life improvements with zero consumer-facing changes.

## What Changes

- **Create `src/hooks/useQueryData.js`** — Standardizes `.data` extraction from RTK Query results. Accepts any query result + optional default value. Returns `{data, isLoading, isFetching, isError, error}` with `useMemo` stabilization to prevent unnecessary re-renders.
- **Create `src/hooks/useLoadingState.js`** — Aggregates loading/fetching flags across multiple queries. Accepts array of query states. Returns `{isLoading, isFetching}` using `Array.some()` aggregation.
- **Export both hooks from `src/hooks/index.js`** — Public API surface for all hook consumers.
- **Fix stockAPI**: Change `getStockByProductId` from `builder.mutation` to `builder.query` — correct semantics for a GET endpoint. Add `useLazyGetStockByProductIdQuery` export.
- **Fix inventoryMovementAPI**: Change `data` → `body` in `createInventoryMutation` and `updateInventoryMovementById` so payload is not silently dropped.

## Capabilities

### New Capabilities

- `query-data-hook`: Standardized RTK Query result extraction with useMemo-stabilized return values and default value support
- `loading-state-hook`: Multi-query loading/fetching state aggregation via Array.some()
- `api-bug-fixes`: Correct API endpoint definitions — mutation→query for stockAPI GET, data→body for inventoryMovementAPI mutations

### Modified Capabilities

None — these are new utility hooks and mechanical bug fixes. Existing specs are unchanged.

## Impact

- **No consumer changes** in this change — zero page components are modified
- `src/hooks/`: 2 new files + 1 modified index export
- `src/services/`: 2 API definition files patched (stockAPI, inventoryMovementAPI)
- No dependency changes, no breaking API changes, no migration needed
- Build and lint must pass with no errors
