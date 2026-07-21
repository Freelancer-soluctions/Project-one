# Architectural Approach & Standards

## Purpose

This document captures the architectural principles, design decisions, and best practice standards adopted across the project. It explains **why** we take certain approaches so that future decisions remain consistent.

This is a living document — as new patterns are adopted or existing ones evolve, update this file to reflect the current architectural stance.

---

## 1. Core Principles

### 1.1 Self-Contained Components

Components that render data should declare their own data dependencies. Avoid prop-drilling data through intermediate components that never read it.

**Why:** Reduces coupling, improves movability, eliminates dead props in intermediaries.

**When to apply:**
- A leaf component uses data from a single API endpoint
- The data passes through ≥1 intermediate component that doesn't use it
- The component appears in only a few places

**When NOT to apply:**
- Multiple siblings share the same data (keep query in parent)
- Parent needs to transform/aggregate before passing down
- Child is a generic presentational component

### 1.2 RTK Query as the Unified Data Layer

All server-state management uses RTK Query. No direct `axios` calls in components, no custom fetch wrappers, no hand-rolled caching.

**Why:** RTK Query provides automatic deduplication, cache invalidation, loading state management, and request lifecycle handling. Custom solutions duplicate this work.

### 1.3 Progressive Enhancement

Adopt patterns as the need arises, not prematurely. Start with the simplest correct approach and add complexity only when the use case demands it.

**Examples:**
- Start with plain `useQuery`; add `selectFromResult` only when list rendering perf becomes a concern
- Start with tag invalidation; add optimistic updates only for high-frequency interactions
- Start with polling; upgrade to WebSocket streaming only when polling volume is problematic

### 1.4 Configuration Centralization

Shared configuration (base URL, retry policy, refetch behavior) lives in one place, not duplicated across 24 module files.

**Why:** Single point of change. No risk of inconsistent config across modules.

---

## 2. Data Co-location Pattern

**Decision:** Components that render data own their data fetching. Avoid passing data fetched in a parent through multiple intermediate components (prop-drilling).

### Before (prop-drilling)

```
Home.jsx
  └── useGetAllCountNotesQuery()  ← Home fetches data for a distant child
       │
       └── SideBar
            └── QuickAccessButton
                 └── NotesSummary  ← receives dataCountNotes as prop
```

Problems:
- `Home.jsx` must know that `NotesSummary` needs `dataCountNotes`
- Moving `NotesSummary` to another route requires updating `Home.jsx`
- Intermediate components (`SideBar`, `QuickAccessButton`) pass props they don't use
- More boilerplate in parent, more props to thread

### After (co-located data)

```
Home.jsx  ← no import from notesAPI
  │
  └── SideBar
       └── QuickAccessButton
            └── NotesSummary
                 └── useGetAllCountNotesQuery({ scope })  ← component owns its data
```

Benefits:
- `NotesSummary` can be rendered anywhere without parent changes
- No unused intermediate props
- Clear data ownership — the component that renders the data declares it
- RTK Query deduplicates identical requests globally — no performance cost

### Implementation pattern

```jsx
// ✅ Self-contained: component fetches its own data
export function NotesSummary({ scope = 'mine' }) {
  const { data, isLoading } = useGetAllCountNotesQuery({ scope });

  if (isLoading) return <LoadingSkeleton />;

  return <div>{/* render data */}</div>;
}
```

```jsx
// ❌ Old pattern: parent fetches, prop-drills down
// Home.jsx
const { data } = useGetAllCountNotesQuery();
return <SideBar dataCountNotes={data} />;

// SideBar.jsx — receives data it never reads
const SideBar = ({ dataCountNotes }) => (
  <QuickAccessButton contentProps={{ dataCountNotes }} />
);
```

### Migration steps

1. Remove `useQuery` call from the parent
2. Remove the prop from all intermediate components
3. Add `useQuery` call in the leaf component
4. Clean up unused imports and PropTypes in intermediate files

---

## 3. RTK Query Standards

### 2.1 Shared `baseApi` Instance

**Decision:** Use a single `createApi` call (`config/baseApi.js`) with shared `baseQuery`, `tagTypes`, and default behavior. All module APIs register via `injectEndpoints`.

```js
// config/baseApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from './axios';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosPrivateBaseQuery,
  tagTypes: [],  // auto-inference: injectEndpoints registers tag types automatically from endpoint definitions
  endpoints: () => ({}),
});
```

```js
// modules/notes/api/notesAPI.js
import { baseApi } from '../../../config/baseApi';

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({ /* ... */ }),
  overrideExisting: false,
});
```

**Why:**
- Single middleware registration in store
- Global config changes (retry, refetchOnFocus) apply everywhere automatically
- Enables code splitting if needed later

### 2.2 Composite Tags with LIST ID Pattern

**Decision:** Use callback-based `providesTags` returning per-ID tags + a `LIST` sentinel tag. Mutations invalidate specific IDs where possible.

```js
// Query
getProductById: builder.query({
  query: (id) => ({ url: `/products/${id}` }),
  providesTags: (result, error, id) => [{ type: 'Products', id }],
}),

getAllProducts: builder.query({
  query: (params) => ({ url: '/products', params }),
  providesTags: (result) =>
    result
      ? [
          ...result.map(({ id }) => ({ type: 'Products', id })),
          { type: 'Products', id: 'LIST' },
        ]
      : [{ type: 'Products', id: 'LIST' }],
}),

// Mutation
updateProductById: builder.mutation({
  query: ({ id, data }) => ({ url: `/products/${id}`, method: 'PATCH', body: data }),
  invalidatesTags: (result, error, { id }) => [{ type: 'Products', id }],
  // Only refetches that specific product — not the entire list
}),
```

**Why:**
- Plain string tags (`['Products']`) cause blanket refetch of ALL queries on ANY mutation
- Per-ID tags mean editing product #5 only refetches product #5
- `LIST` tag ensures creates/deletes still refresh the list
- Reduces network requests proportional to number of list subscribers

**Migration priority (high-traffic first):**
1. Products, Sales, Stock, Notes
2. Remaining 20 modules

### 2.3 Retry on Transient Failures

**Decision:** Wrap the base query with `retry()` from `@reduxjs/toolkit/query`.

```js
import { retry } from '@reduxjs/toolkit/query';

export const axiosPrivateBaseQueryWithRetry = retry(axiosPrivateBaseQuery, {
  maxRetries: 3,
});
```

**Why:**
- Network blips, DNS timeouts, and temporary backend unavailability are common
- Exponential backoff (600ms → 9600ms with jitter) avoids thundering herd
- No custom retry logic needed per endpoint
- Endpoints can opt out: `extraOptions: { maxRetries: 0 }`

**When to opt out of retry:**
- DELETE operations (retrying could cause unintended side effects)
- Operations where idempotency isn't guaranteed
- Endpoints where stale data is worse than an error

### 2.4 `refetchOnFocus` and `refetchOnReconnect`

**Decision:** Enable globally on `baseApi`.

```js
export const baseApi = createApi({
  baseQuery: ...,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  // ...
});
```

Requires `setupListeners(store.dispatch)` in store setup.

**Why:**
- Users expect fresh data when returning to the app (tab switch → refocus)
- Data may be stale after network reconnection
- Zero effort — one-time config
- Individual queries can override: `useQuery(params, { refetchOnFocus: false })`

### 2.5 `serializableCheck` — Targeted Ignores

**Decision:** Never disable `serializableCheck` globally. Use targeted ignores for known non-serializable values.

```js
getDefaultMiddleware({
  serializableCheck: {
    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
  },
}),
```

**Why:**
- `serializableCheck: false` hides ALL serialization bugs, including legitimate ones
- redux-persist lifecycle actions contain non-serializable values (Promise, Subscription) — these are safe to ignore
- All other actions remain protected
- If a new non-serializable value appears (e.g., Date in payload), the warning helps catch it

### 2.6 `transformResponse` for Data Unwrapping

**Decision:** Normalize response shape at the API boundary, not in components.

```js
getAllProducts: builder.query({
  query: (params) => ({ url: '/products', params }),
  transformResponse: (response) => response.data,
  // Components receive the unwrapped array directly
}),
```

**Why:**
- Eliminates `data?.data` pattern scattered across components
- Eliminates need for `useQueryData` wrapper helper
- Single point of change if API response shape changes

**When NOT to use:**
- When different consumers need different slices of the response
- Use `selectFromResult` for per-component transformations instead

---

## 4. Pattern Decision Catalog

Each pattern below was evaluated against complexity, impact, and applicability.

### 4.1 Adopted Patterns

| Pattern | Complexity | Impact | Applied Where |
|---------|-----------|--------|---------------|
| Data co-location | Low | Medium | NotesSummary (proving ground), then systematic audit |
| Shared baseApi | Medium | High | All 24 API slices migrate to injectEndpoints |
| Composite tags | Low | High | All 24 API slices adopt LIST ID pattern |
| retry() wrapper | Low | Medium | Single change in baseQuery |
| refetchOnFocus/Reconnect | Low | Medium | Single config in baseApi |
| serializableCheck fixes | Low | Medium | Single change in store.js |
| transformResponse unwrap | Low | Low | Per-endpoint, as applicable |

### 4.2 Candidate Patterns (Not Yet Adopted)

These are documented recommendations for future evaluation:

| Pattern | Complexity | When to Evaluate |
|---------|-----------|-----------------|
| `usePrefetch` for navigation | Low | When user reports navigation latency. Implement on hover/intersection of navigation elements |
| `selectFromResult` for list rendering | Medium | When a list view shows 50+ items and re-render perf is measured as a problem |
| Optimistic updates | High | When implementing high-frequency interactions (reactions, toggles, drag-drop reorder) |
| `pollingInterval` vs WebSocket streaming | Low/High | When real-time data freshness is needed. Start with polling; upgrade to WebSocket if volume demands it |
| Code splitting with `injectEndpoints` | Medium | When the bundle grows large enough that lazy-loading API logic matters |
| `entityAdapter` in `transformResponse` | Medium | When a single collection exceeds ~100 items and O(1) lookups by ID are needed in multiple components |
| Middleware-based side effects (matchers) | Low | When cross-cutting logic (toasts, analytics, navigation after mutations) becomes repetitive in components |

---

## 5. Decision Framework for New Patterns

When evaluating whether to adopt a new pattern or best practice:

1. **Does it solve a real problem?** (Not just "it's a best practice")
2. **What's the migration cost?** (Time, risk, files touched)
3. **Can it be adopted incrementally?** (Per-module vs big-bang)
4. **Is there a simpler alternative?** (Start simple, add complexity only when measured)
5. **Is it reversible?** (Can we undo it without breaking things?)

### Example: Adopting Composite Tags

1. **Problem**: 24 APIs use blanket invalidation → N redundant requests per mutation
2. **Cost**: ~30 min per API slice (24 slices = ~12h total), but can be done incrementally
3. **Incremental**: Yes — each module independently, high-traffic first
4. **Alternative**: Keep blanket invalidation (simpler, but wasteful)
5. **Reversible**: Yes — can revert to plain strings per-slice

**Verdict:** ✅ ADOPT (high impact, low risk, incremental)

### Example: Optimistic Updates

1. **Problem**: No measured UX issue with current CRUD latency
2. **Cost**: High — must handle rollback, race conditions, error states
3. **Incremental**: Yes — per-mutation
4. **Alternative**: Tag invalidation (simpler, reliable)
5. **Reversible**: Yes — revert to plain invalidation

**Verdict:** ⏸️ DEFER until a specific high-frequency interaction (like reactions or toggles) is implemented and latency is measured.

---

## 6. Migration Approach

Systematic changes follow this workflow:

1. **Document** — Write the standard in this document or a pattern-specific doc
2. **Create OpenSpec change** — Track work with proposal, design, tasks, verification
3. **Implement high-traffic first** — Prove the pattern on the most impactful module
4. **Batch remaining** — Apply to remaining modules in parallel where possible
5. **Verify** — Check: lint passes, build succeeds, imports resolve, no regressions
6. **Archive** — Close the change in OpenSpec, update this document with lessons learned

---

## 7. Related Documents

| Document | Covers |
|----------|--------|
| [Code Style](./code-style.md) | Coding conventions and formatting |
| [Testing Architecture](./testing-architecture.md) | Testing strategy and patterns |
| [WebSocket Implementation Guide](./websocket-implementation-guide.md) | Socket communication patterns |
