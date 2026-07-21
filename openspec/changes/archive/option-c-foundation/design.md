## Context

RTK Query is used across 25+ modules for data fetching. Two common patterns have become friction points:

1. **Nested `.data` extraction**: RTK Query wraps server responses in a `{data, ...}` envelope. When the server returns `{ data: [...] }`, consumers must write `result?.data?.data` — duplicated 105+ times.
2. **Manual loading aggregation**: Pages with multiple queries manually chain `isLoading` flags (`isLoadingA || isLoadingB || isFetchingC`), leading to missed states and inconsistent UX.

Two API definition bugs degrade correctness:
- `stockAPI` incorrectly uses `builder.mutation` for a GET endpoint, losing caching benefits.
- `inventoryMovementAPI` uses `data` instead of `body` in mutation definitions, silently dropping payload.

## Goals / Non-Goals

**Goals:**
- Provide a generic `useQueryData` hook that unwraps RTK Query results with `useMemo` stabilization
- Provide a generic `useLoadingState` hook that aggregates loading/fetching states via `Array.some()`
- Export both from `src/hooks/index.js` as the public API
- Fix `getStockByProductId` to be a proper query (builder.query + useLazy export)
- Fix inventoryMovementAPI mutations to use `body` instead of `data`

**Non-Goals:**
- No existing page components are modified — zero consumer impact
- No domain-specific logic in utility hooks (pure generic helpers)
- No test additions in this change (utility hooks are trivial wrappers)
- No migration of existing consumers — that is a follow-up change

## Decisions

1. **useQueryData signature**: `useQueryData(result, defaultValue?)` — accepts any RTK Query result object and optional default value. Returns `{data, isLoading, isFetching, isError, error}`. Uses `useMemo` to stabilize the returned object and prevent unnecessary re-renders. `data` is the unwrapped inner value (`result.data`) if it exists, else `defaultValue`, else `undefined`.

2. **useLoadingState signature**: `useLoadingState(...queryStates)` — rest parameter accepting one or more RTK Query state objects. Returns `{isLoading, isFetching}` where each boolean is `true` if ANY of the input queries have that flag set (`Array.some()`). Uses `useMemo` for stability.

3. **No domain logic in utilities**: Both hooks operate purely on RTK Query result shapes. No knowledge of API endpoints, data shapes, or business logic — making them reusable across the entire codebase.

4. **Single export point**: Both hooks exported from `src/hooks/index.js` via `export { useQueryData, useLoadingState } from './...'`.

5. **Bug fixes are mechanical**: 
   - stockAPI: Change `builder.mutation({ query: () => ({ method: 'GET', url: ... }) })` to `builder.query({ query: () => ({ method: 'GET', url: ... }) })` and add `useLazyGetStockByProductIdQuery` to the destructured exports.
   - inventoryMovementAPI: Change `data: payload` to `body: payload` in both create and update mutation definitions. No behavioral changes beyond correctness.

## Risks / Trade-offs

- [Low Risk] **useQueryData hides the raw RTK Query result** — if a consumer needs `originalArgs`, `endpointName`, or other metadata, they must use the raw result directly. Mitigation: The hook returns the full query state minus the unwrapped `data`, so `error`, `isLoading`, etc. are still available.
- [Low Risk] **useLoadingState treats all queries equally** — no priority or weighting. Mitigation: For pages where one query's loading state should dominate, consumers compose manually (rare use case).
- [No Risk] **Bug fixes are pure mechanical changes** — mutation→query doesn't change runtime behavior for a GET endpoint; `data`→`body` only affects serialization (previously silently empty).
