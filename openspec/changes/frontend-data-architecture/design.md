## Context

The client app uses RTK Query across 24 API slice files but has two architectural issues:

1. **Prop-drilled data**: Many components receive data via intermediate parents that don't use it. The `NotesSummary` refactor proved the fix: move the query into the leaf component.
2. **Missing RTK Query best practices**: No shared baseApi, plain string tags cause blanket refetching, no retry on transient failures, no refetchOnFocus, serializableCheck disabled globally.

Both issues share the same root cause: the data layer grew organically without centralized patterns.

**Reference:** `docs/architectural-approach.md` — general document explaining the architectural principles (includes the data co-location pattern)

## Goals

- Move `useQuery` calls from parent pages to leaf components where the data is rendered
- Remove unused intermediate props
- Create single `baseApi` with shared config
- Composite tags with LIST ID pattern across all 24 APIs
- Add retry(), refetchOnFocus/Reconnect, setupListeners
- Fix serializableCheck to targeted ignores
- Add transformResponse where applicable

## Non-Goals

- No backend changes
- No changes to Redux state shape or selectors
- No changes to auth logic
- No changes to shared-data-between-siblings (keep parent query when multiple children need it)

## Migration Strategy

To avoid middleware duplication during incremental migration, the store.js update SHALL be completed BEFORE any module migration:

1. Create `baseApi.js` (empty, with `tagTypes: []`)
2. Update `store.js`: add `baseApi.middleware`, replace individual reducer paths with `api.reducer`, add `setupListeners`, fix `serializableCheck`
3. Migrate modules to `injectEndpoints` one at a time — each commit is functional since the store already uses the shared middleware and reducer

This prevents duplicate middleware entries that would occur if modules using `baseApi.middleware` were migrated before the store switch (migrated modules' `.middleware` is `baseApi.middleware`, so concat before the switch would double-register it).

## Decisions

### Decision 1: Co-location enabled by RTKQ deduplication
RTK Query deduplicates identical requests globally. Two components calling `useGetXQuery({ id: 1 })` produce one HTTP request. Moving queries into leaf components has zero network cost.

### Decision 2: baseApi location
Create `apps/client/src/config/baseApi.js` as single `createApi()` with `tagTypes: []` (auto-inference: `injectEndpoints` registers tag types automatically from endpoint definitions). All 24 module APIs use `injectEndpoints`. Single `.concat(api.middleware)` in store.

### Decision 3: Retry configuration
Invoke `axiosPrivateBaseQuery({ baseUrl })` first (it is a function factory, not a raw baseQuery), then wrap the returned function with `retry(baseQuery, { maxRetries: 3 })` with exponential backoff. Non-idempotent endpoints opt out via `extraOptions: { maxRetries: 0 }`.

### Decision 4: Migration execution order
1. Store.js update (baseApi.middleware, reducer, setupListeners, serializableCheck) → 2. Notes, Products, Sales, Stock (high-traffic first) → 3. Remaining 20 modules (batch)

### Decision 5: Store.js migration (executed FIRST)
Before any module migration: replace 22 individual `.concat()` with single `baseApi.middleware`. Replace individual `[notesAPI.reducerPath]: notesAPI.reducer` entries with `[api.reducerPath]: api.reducer`. Add `setupListeners(store.dispatch)`. Fix `serializableCheck: false` → targeted ignores. This is step one because migrated modules' `.middleware` references `baseApi.middleware` — switching store first avoids duplicate registrations.

### Decision 6: transformResponse
Add `transformResponse: (res) => res.data` where API response always wraps in `{ data: ... }`. Skip where `meta` is also needed by consumers.

### Decision 7: Prevent retry on auth errors
The retry wrapper SHALL NOT retry 401 (Unauthorized) or 403 (Forbidden) responses, as these are non-transient. Implement a custom check inside the baseQuery before returning the error shape:

```js
const selectiveRetry = async (args, api, extraOptions) => {
  const result = await axiosPrivateBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 || result.error?.status === 403) {
    return retry.fail(result.error);
  }
  return result;
};
const baseQueryWithRetry = retry(selectiveRetry, { maxRetries: 3 });
```

### Decision 8: Co-location audit-first approach
Grep for props named after API data that pass through intermediaries unchanged. Fix one module at a time.
