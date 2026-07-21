## Why

This change unifies two previously separate efforts:
1. **Data co-location pattern** — Components own their data fetching instead of receiving it via prop-drilling
2. **RTK Query optimizations** — Shared baseApi, composite tags, retry, refetchOnFocus, serializableCheck, transformResponse

**Why**: Components that render data should declare their own data dependencies. RTK Query deduplication makes co-location free. Combined with official RTK Query recommendations (composite tags, retry, refetchOnFocus), this reduces network requests, improves UX, and makes components self-contained.

## What changes

1. Move `useQuery` calls from parent pages into leaf components (eliminating prop-drilling)
2. Create shared `baseApi` — single `createApi()` with `injectEndpoints` for all 24 module APIs
3. Composite tags with LIST ID pattern — granular cache invalidation
4. `retry()` wrapper on baseQuery — resilience against transient failures
5. `setupListeners` + `refetchOnFocus: true` + `refetchOnReconnect: true` — fresh data on tab return
6. `serializableCheck` — replace `false` with targeted ignores for redux-persist
7. `transformResponse` — unwrap `data` envelope at API boundary

## Impact

- **Network**: fewer redundant requests
- **UX**: fresher data on tab return, resilience to network blips
- **Components**: self-contained, movable, testable
- **Safety**: serialization warnings catch bugs
