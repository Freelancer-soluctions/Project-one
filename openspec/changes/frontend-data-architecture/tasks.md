## Tasks

### 1. Create shared baseApi
- [ ] Create `apps/client/src/config/baseApi.js` with single `createApi()` call
- [ ] Configure shared `baseQuery` (axiosPrivateBaseQuery), `refetchOnFocus: true`, `refetchOnReconnect: true`
- [ ] Use `tagTypes: []` with auto-inference — `injectEndpoints` registers tag types automatically from endpoint definitions
- [ ] Export `api` reference for `injectEndpoints` usage

### 2. Update store.js FIRST (before module migrations)
- [ ] Add `import { api } from '../config/baseApi'`
- [ ] Add `import { setupListeners } from '@reduxjs/toolkit/query'`
- [ ] Add imports: `FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER` from `redux-persist`
- [ ] Replace all individual reducer registrations with `[api.reducerPath]: api.reducer`
- [ ] Replace all 22 individual `.concat(api.middleware)` with single `.concat(api.middleware)`
- [ ] Replace `serializableCheck: false` with `ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]`
- [ ] Add `setupListeners(store.dispatch)` after `configureStore()`
- [ ] Remove all old individual API slice imports from store.js
- [ ] Commit: "feat: create shared baseApi, setupListeners, fix serializableCheck"
- [ ] **Verify app still loads** (even though modules still use standalone createApi — baseApi middleware coexists temporarily)

### 3. Migrate 4 core API slices to injectEndpoints + composite tags (notes, products, sales, stock)
- [ ] Convert `notesAPI.js` from standalone `createApi()` to `api.injectEndpoints()`
- [ ] Apply composite tags: `providesTags` callback with per-ID + LIST pattern on all queries
- [ ] Apply composite tags: `invalidatesTags` callback with ID-targeted pattern on all mutations
- [ ] Remove `reducerPath`, standalone `baseQuery`, standalone `tagTypes` from notesAPI
- [ ] Convert `productsAPI.js` to `api.injectEndpoints()` + composite tags
- [ ] Convert `salesAPI.js` to `api.injectEndpoints()` + composite tags
- [ ] Convert `stockAPI.js` to `api.injectEndpoints()` + composite tags
- [ ] Verify component imports still work (hook exports should be identical)
- [ ] Commit per module (4 commits): "refactor(api): migrate X to injectEndpoints + composite tags"

### 4. Migrate remaining 20 API slices to injectEndpoints + composite tags
- [ ] Migrate attendance, clients, employees, events, expenses, inventoryMovement, news
- [ ] Migrate payroll, performanceEvaluation, permission, providers, providerOrder, purchase
- [ ] Migrate settingsProductCategories, users, vacation, warehouse
- [ ] **Verify** if `clientOrder` module exists at `apps/client/src/modules/clientOrder/` and handle accordingly
- [ ] Handle `homeAPI.js`: either delete (if empty) or migrate to `injectEndpoints` with empty registration
- [ ] Ensure list queries use per-ID + LIST callback pattern
- [ ] Ensure single-item queries use `providesTags: (result, error, arg) => [{ type: 'X', id: arg }]`
- [ ] Ensure create mutations (no id arg) invalidate LIST
- [ ] Ensure update/delete mutations (with id arg) invalidate specific ID
- [ ] Verify all 24 API slices use `injectEndpoints` — no standalone `createApi` calls remain
- [ ] Commit batch

### 5. Add retry() wrapper with selective auth-error handling
- [ ] In `axios.js`: invoke `axiosPrivateBaseQuery` with baseUrl first (it's a function factory)
  ```js
  const rawBaseQuery = axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  });
  ```
- [ ] Implement selective retry: check error status for 401/403, skip retry on auth failures
  ```js
  import { retry } from '@reduxjs/toolkit/query';

  const selectiveRetry = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status === 401 || result.error?.status === 403) {
      return retry.fail(result.error); // don't retry auth failures
    }
    return result;
  };

  export const axiosPrivateBaseQueryWithRetry = retry(selectiveRetry, { maxRetries: 3 });
  ```
- [ ] Update `baseApi.js` to use `axiosPrivateBaseQueryWithRetry` instead of raw `axiosPrivateBaseQuery`
- [ ] Add `extraOptions: { maxRetries: 0 }` to non-idempotent mutation endpoints
- [ ] Commit: "feat: add retry wrapper with selective auth-error handling"

### 6. Add transformResponse for data unwrap
- [ ] Identify endpoints where API response is always `{ data: ... }` envelope
- [ ] Add `transformResponse: (res) => res.data` to those endpoints
- [ ] Mark `useQueryData` hook as deprecated with JSDoc `@deprecated`

### 6a. Update components from `data.data` to `data.*` access pattern
- [ ] Grep for `data.data` access patterns in components consuming transformed endpoints
- [ ] NotesSummary: change `dataCountNotes.data.backlog` → `dataCountNotes.backlog`
- [ ] StockSummary: change `dataCountStock.data.*` → `dataCountStock.*`
- [ ] Notes, UpcomingEvents, filters, and other affected components
- [ ] Migrate existing `useQueryData` usages to direct `useQuery` where transformResponse is applied
- [ ] Commit: "refactor: add transformResponse, update component data access patterns"

### 7. Audit prop-drilled data patterns in codebase
- [ ] Grep for `contentProps` in QuickAccessButton usages
- [ ] Grep for props destructured in intermediate components but only forwarded (look for props named after API data like `dataCount`, `dataStock`, etc.)
- [ ] Grep for `useQuery` calls in page components (pages/) and trace where the result goes
- [ ] Document findings

### 8. Refactor StockSummary to co-located data fetching
- [ ] Move `useGetStockAlertsQuery` from Home.jsx into StockSummary component
- [ ] Include default value `{ data: [] }` fallback in the moved query call
- [ ] Remove `dataCountStock` prop from Home.jsx → SideBar prop chain
- [ ] Remove `dataCountStock` from SideBar.jsx destructuring and PropTypes
- [ ] Verify StockSummary renders independently

### 9. Refactor remaining prop-drilled patterns module by module
- [ ] Check QuickAccessButton popover contentProps patterns
- [ ] Check displaySettings for unused intermediaries
- [ ] Check news module for similar prop-drilling
- [ ] Check all pages/ directory for data fetched but only used by one child

### 10. Clean up orphaned API slices, unused imports, PropTypes
- [ ] Remove `homeAPI.js` entirely (should be empty after migration)
- [ ] Remove unused imports in parent components after refactors
- [ ] Remove unused PropTypes in intermediate components

### 11. Verification
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] All existing tests pass (`npm run test`)
- [ ] Manual smoke test: app loads, data fetches, CRUD operations work
- [ ] Verify `serializableCheck` warnings don't appear for normal operations
- [ ] Verify `setupListeners` doesn't cause duplicate fetches
- [ ] Verify retry doesn't trigger on 401/403 (check network tab on expired token)
