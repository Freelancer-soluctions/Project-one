## ADDED Requirements

### Requirement: retry() wrapper on baseQuery for transient failure resilience

The system SHALL wrap the `axiosPrivateBaseQuery` with `retry()` from `@reduxjs/toolkit/query` to automatically retry failed requests on transient errors.

#### Scenario: baseQuery is wrapped with retry with exponential backoff
- **WHEN** the base query is defined in `axios.js`
- **THEN** `import { retry } from '@reduxjs/toolkit/query'` SHALL be present
- **AND** `axiosPrivateBaseQuery` SHALL be invoked first (it is a function factory), then the returned function SHALL be wrapped with `retry(baseQuery, { maxRetries: 3 })`
- **AND** the wrapper SHALL use exponential backoff with jitter (built into RTK's retry utility)

#### Scenario: Per-endpoint retry opt-out via extraOptions
- **WHEN** a mutation endpoint is non-idempotent (e.g., POST create, DELETE)
- **THEN** the endpoint SHALL set `extraOptions: { maxRetries: 0 }` to disable retry for that specific operation
- **AND** query endpoints SHALL inherit the default `maxRetries: 3` unless explicitly overridden

#### Scenario: retry does not apply to 401/403 errors — selective retry pattern
- **WHEN** the server returns a 401 Unauthorized or 403 Forbidden status
- **THEN** the retry SHALL NOT be attempted (authentication failures are non-transient)
- **AND** the implementation SHALL use a custom selective retry function wrapping `axiosPrivateBaseQuery`
- **AND** the custom function SHALL check `result.error?.status` and call `retry.fail(result.error)` for 401/403 to skip retry
- **AND** the custom function SHALL be wrapped with `retry(selectiveRetry, { maxRetries: 3 })` for all other errors

Implementation:

```js
const selectiveRetry = async (args, api, extraOptions) => {
  const result = await axiosPrivateBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 || result.error?.status === 403) {
    return retry.fail(result.error); // don't retry auth failures
  }
  return result;
};
const baseQueryWithRetry = retry(selectiveRetry, { maxRetries: 3 });
```

---

### Requirement: refetchOnFocus and refetchOnReconnect with setupListeners

The system SHALL enable global `refetchOnFocus: true` and `refetchOnReconnect: true` on the baseApi, backed by `setupListeners(store.dispatch)`.

#### Scenario: Global defaults are set on baseApi
- **WHEN** `baseApi` is created via `createApi()`
- **THEN** `refetchOnFocus: true` SHALL be set
- **AND** `refetchOnReconnect: true` SHALL be set

#### Scenario: setupListeners is called after store creation
- **WHEN** the Redux store is created in `store.js`
- **THEN** `import { setupListeners } from '@reduxjs/toolkit/query'` SHALL be present
- **AND** `setupListeners(store.dispatch)` SHALL be called after `configureStore()`

#### Scenario: Per-query override possible
- **WHEN** a specific query does not need refetch on focus (e.g., static reference data)
- **THEN** the component SHALL pass `{ refetchOnFocus: false }` as the second argument to `useQuery()`
- **AND** the global default SHALL remain `true`

---

### Requirement: serializableCheck uses targeted ignores instead of false

The system SHALL replace `serializableCheck: false` with targeted ignores for known non-serializable redux-persist actions, restoring serialization warnings for all other actions.

#### Scenario: serializableCheck is configured with ignoredActions
- **WHEN** the store middleware is configured in `store.js`
- **THEN** `serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] }` SHALL replace the current `serializableCheck: false`
- **AND** `import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'` SHALL be present

#### Scenario: Non-redux-persist actions are still serialization-checked
- **WHEN** a Redux action not in the ignored list contains non-serializable values (e.g., Date, undefined, Function)
- **THEN** the serializableCheck middleware SHALL warn in the console during development
- **AND** the warning SHALL include the action type and the non-serializable path

---

### Requirement: transformResponse for universal data unwrap

The system SHALL add `transformResponse: (res) => res.data` on endpoints where the API response consistently wraps data in a `data` envelope, eliminating the `data?.data` pattern in components.

#### Scenario: transformResponse is added to list query endpoints
- **WHEN** a query endpoint's API response has the shape `{ data: [...], meta: {...} }` or `{ data: {...} }`
- **AND** all consumers of that endpoint need the `data` property, not the `meta`
- **THEN** the endpoint SHALL define `transformResponse: (response) => response.data`
- **AND** components consuming the endpoint SHALL access `data` directly instead of `data?.data`

#### Scenario: transformResponse is NOT added when meta is needed
- **WHEN** a component needs both `data` and `meta` (e.g., pagination metadata)
- **THEN** `transformResponse` SHALL NOT be added to that endpoint
- **AND** the component SHALL access `data.data` and `data.meta` explicitly

#### Scenario: Existing useQueryData helper is deprecated
- **WHEN** all applicable endpoints have `transformResponse` for data unwrap
- **THEN** the custom `useQueryData` hook at `src/hooks/useQueryData.js` SHALL be marked as deprecated
- **AND** new components SHALL NOT use `useQueryData`
- **AND** existing `useQueryData` usages SHALL be migrated to direct `useQuery` results where `transformResponse` is applied
