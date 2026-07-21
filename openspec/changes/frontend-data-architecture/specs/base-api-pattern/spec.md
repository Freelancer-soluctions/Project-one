## ADDED Requirements

### Requirement: Shared baseApi with injectEndpoints pattern

The system SHALL create a single shared `baseApi` using `createApi()` at `apps/client/src/config/baseApi.js`. All 24 existing API slices SHALL be migrated to use the `injectEndpoints()` pattern, registering their endpoints onto the shared `baseApi` instead of creating independent API instances.

#### Scenario: baseApi is created with shared defaults
- **WHEN** the application initializes
- **THEN** a shared `api` object SHALL be created via `createApi()` with a single `reducerPath: 'api'`, the shared `baseQuery`, `refetchOnFocus: true`, `refetchOnReconnect: true`, and all required `tagTypes` declared upfront
- **AND** the `api` object SHALL be exported from `apps/client/src/config/baseApi.js`

#### Scenario: Module APIs use injectEndpoints instead of standalone createApi
- **WHEN** a module API file (e.g., `productsAPI.js`) is loaded
- **THEN** it SHALL import `api` from `@/config/baseApi` and call `api.injectEndpoints({ endpoints: (builder) => ({ ... }) })` instead of calling `createApi()` independently
- **AND** it SHALL NOT define its own `reducerPath`, `baseQuery`, `refetchOnFocus`, or `refetchOnReconnect` — these SHALL be inherited from `baseApi`

#### Scenario: All 24 module APIs are migrated
- **WHEN** the migration is complete
- **THEN** all 24 existing API slice files SHALL use `api.injectEndpoints()` and SHALL NOT contain standalone `createApi()` calls
- **AND** the following modules SHALL be migrated: auth, attendance, clients, employees, events, expenses, home, inventoryMovement, news, notes, payroll, performanceEvaluation, permission, products, providers, providerOrder, purchase, sales, settings, settingsProductCategories, stock, users, vacation, warehouse
- **AND** the `clientOrder` module (if separate from `providerOrder`) SHALL also be migrated

#### Scenario: Injected endpoints are accessible under baseApi
- **WHEN** all endpoints are injected via `injectEndpoints`
- **THEN** the generated hooks (e.g., `useGetAllProductsQuery`, `useCreateSaleMutation`) SHALL be exported from the module API file
- **AND** the hooks SHALL work identically to standalone `createApi()` generated hooks

### Requirement: Store.js uses baseApi.middleware instead of individual .concat() calls

The store configuration SHALL replace all 22 individual `.concat(api.middleware)` calls with a single `.concat(api.middleware)` call using the shared `baseApi` reference.

#### Scenario: Single middleware registration replaces 22 individual concats
- **WHEN** `store.js` is configured
- **THEN** the `middleware` array SHALL contain exactly one `.concat(api.middleware)` call for RTK Query middleware
- **AND** the individual `.concat(newsApi.middleware)`, `.concat(notesApi.middleware)`, and 20 other per-module middleware calls SHALL be removed

#### Scenario: Reducer registration uses single api.reducerPath
- **WHEN** the root reducer is built
- **THEN** the RTK Query reducers SHALL be registered under the single key `[api.reducerPath]: api.reducer` (i.e., `api: api.reducer`)
- **AND** all individual `[notesApi.reducerPath]: notesApi.reducer`, `[productsApi.reducerPath]: productsApi.reducer`, and 22 other per-module reducer entries SHALL be removed

#### Scenario: Non-RTK reducers remain unchanged
- **WHEN** the root reducer is updated
- **THEN** non-RTK reducers (e.g., `auth`, `settings`) SHALL remain registered as before
- **AND** `redux-persist` configuration (`persistConfig`, `persistReducer`, `persistStore`) SHALL remain unchanged

### Requirement: setupListeners(store.dispatch) is active

The system SHALL call `setupListeners(store.dispatch)` from `@reduxjs/toolkit/query` after store creation to enable refetch-on-focus and refetch-on-reconnect behavior.

#### Scenario: setupListeners is called after store creation
- **WHEN** the store is created
- **THEN** `setupListeners(store.dispatch)` SHALL be called
- **AND** the import `import { setupListeners } from '@reduxjs/toolkit/query'` SHALL be present in `store.js`

#### Scenario: refetchOnFocus and refetchOnReconnect are effective
- **WHEN** the user switches away from the tab and returns (focus regained)
- **THEN** any stale RTK Query data SHALL automatically refetch
- **WHEN** the browser regains network connectivity after being offline
- **THEN** any stale RTK Query data SHALL automatically refetch
