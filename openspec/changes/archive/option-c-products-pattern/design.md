# Design: Products Module Pattern Standardization

## Context
The Products module currently has duplicated filter query declarations across `Products.jsx` and `ProductsForms.jsx`. Each page independently calls `useGetAllProductsStatusQuery`, `useGetAllProductCategoriesQuery`, and `useGetAllProvidersFiltersQuery`. Child components receive full RTK Query response objects (`{ data, isLoading, isFetching, ... }`) and extract `.data` internally, creating inconsistency. Spinner logic uses manual boolean chains with 11+ flags.

## Goals / Non-Goals

**Goals:**
- Eliminate duplicate filter query declarations by creating a shared hook
- Standardize `.data` extraction using existing foundation utilities (`useQueryData`)
- Aggregate loading/fetching states with `useLoadingState` instead of manual chains
- Child components receive plain arrays, not wrapped response objects

**Non-Goals:**
- No mutation logic is moved (mutations stay in page components)
- No cross-module changes
- No behavioral changes to the product CRUD operations

## Decisions

### 1. Shared hook for filter data
`useProductsFilterData()` wraps exactly 3 queries: status, categories, providers.
Returns `{ datastatus, dataCategory, dataProviders, isLoadingFilters, isFetchingFilters }`.
Each data field is an unwrapped array (not `{ data: [...] }`).

### 2. useQueryData for lazy queries
Products.jsx lazy query: `useQueryData(useLazyGetAllProductsQuery())`.
ProductsForms.jsx lazy query: `useQueryData(useLazyGetAllProductAttributesQuery())`.
This standardizes `.data` extraction.

**Important — ProductsForms side effect:** The current `useLazyGetAllProductAttributesQuery` has an `onQueryStarted` callback that updates local `attributes` state. After migrating to `useQueryData`, this callback is lost. Replace it with a `useEffect` that syncs the query result to local state:

```js
const [getProductAttributes, queryState] = useLazyGetAllProductAttributesQuery();
const { data: dataAttributes } = useQueryData(queryState);

useEffect(() => {
  if (dataAttributes?.length > 0) {
    setAttributes(dataAttributes);
  }
}, [dataAttributes]);
```

### 3. useLoadingState for spinner aggregation
Replace manual `(isLoadingA || isLoadingB || ...)` chains with `useLoadingState([...])`.

**Important — Separate query vs mutation loading:** In ProductsForms.jsx, the spinner chain mixes query loading (3 flags: `isLoadingCategory, isLoadingProviders, isLoadingStatus, isLoadingAttributes`) with mutation loading (5 flags: `isLoadingPost, isLoadingPut, isLoadingDelete, isLoadingDeleteAttribute, isLoadingSaveAttributes`). Mutations have `isLoading` but not `isFetching` — they represent write operations, not data fetching.

Use `useLoadingState` only for query loading states. Keep mutation flags as separate `||` chain since they represent different semantics:

```js
// Products.jsx — all flags are query-related
const { isLoading, isFetching } = useLoadingState([productsQuery, filtersData]);

// ProductsForms.jsx — split queries from mutations
const { isLoading: isLoadingFilters, isFetching: isFetchingFilters } = useLoadingState([filtersData, attributesQuery]);
const isLoadingMutations = isLoadingPost || isLoadingPut || isLoadingDelete || isLoadingDeleteAttribute || isLoadingSaveAttributes;
```

### 4. Child components receive plain arrays
ProductsFiltersForm: PropTypes object→array, access `datastatus.map(...)` not `datastatus?.data.map(...)`.
ProductBasicInfo: same change.
ProductsDatatable: `const { dataList, total } = dataProducts.data` becomes `const { dataList, total } = dataProducts`.

### 5. Mutations stay in page components
No mutations are moved to hooks — they stay in Products.jsx/ProductsForms.jsx.

## Risks / Trade-offs

- **Risk**: Existing tests may reference `.data` paths → Mitigation: Update test mocks and assertions in tandem with component changes
- **Risk**: `useLoadingState` behavior differs from manual chains → Mitigation: Verify loading state aggregation matches exact boolean logic of current chains
- **Risk**: ProductsForms `onQueryStarted` callback lost after migration → Mitigation: Replace with `useEffect` sync (see Decision 2)
- **Risk**: Task execution order can break intermediate state (parent before child) → Mitigation: Execute children-first order defined in tasks.md
- **Trade-off**: Creating a shared hook adds indirection but eliminates 6 redundant query declarations
- **Trade-off**: Splitting query vs mutation loading in ProductsForms adds clarity but means `useLoadingState` isn't used for every flag
