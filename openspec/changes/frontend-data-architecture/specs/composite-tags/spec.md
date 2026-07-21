## ADDED Requirements

### Requirement: Composite tags with LIST ID pattern replace plain string tags

All 24 API slices SHALL replace their plain string `providesTags` and `invalidatesTags` declarations with the composite tag pattern using per-ID + LIST tags for granular cache invalidation.

#### Scenario: Query providesTags returns per-ID and LIST tags
- **WHEN** a query endpoint provides tags using `providesTags` as a callback function
- **THEN** when the query returns results, the function SHALL return an array containing one `{ type: 'X', id: item.id }` tag per result item plus one `{ type: 'X', id: 'LIST' }` tag
- **AND** when the query returns no results (falsy), the function SHALL return `[{ type: 'X', id: 'LIST' }]`

#### Scenario: Mutation invalidatesTags targets specific ID
- **WHEN** a mutation endpoint (e.g., `updateProductById`) is called with an argument that has an `id` property
- **THEN** the `invalidatesTags` callback SHALL return `[{ type: 'X', id: arg.id }]` to invalidate only that specific item's cache entry
- **AND** the `LIST` tag SHALL NOT be invalidated for targeted updates

#### Scenario: Create/delete mutations invalidate LIST tag
- **WHEN** a mutation endpoint creates or deletes entities and the argument does not have a specific entity `id`
- **THEN** the `invalidatesTags` callback SHALL return `[{ type: 'X', id: 'LIST' }]` to force a full list refetch
- **AND** the callback SHALL handle the case where `arg?.id` is undefined by falling back to `'LIST'`

#### Scenario: Tag types use auto-inference from injectEndpoints
- **WHEN** composite tags reference a type (e.g., `{ type: 'Products', id: 5 }`)
- **THEN** the `baseApi` SHALL declare `tagTypes: []` (empty array) to enable auto-inference
- **AND** each module's `injectEndpoints()` call SHALL automatically register its tag types in the shared `baseApi`
- **AND** this eliminates the need for a manually maintained list — `injectEndpoints` infers tag types from endpoint definitions automatically

### Requirement: Four core API slices are migrated first (notes, products, sales, stock)

The Notes, Products, Sales, and Stock API slices SHALL be migrated to composite tags in the first phase, prioritized by traffic volume and complexity.

#### Scenario: Notes API uses composite tags for all endpoints
- **WHEN** the Notes API slice is migrated to `injectEndpoints`
- **THEN** all query endpoints (`getAllNotes`, `getAllCountNotes`) SHALL use `providesTags: (result) => result ? [...result.map((n) => ({ type: 'Notes', id: n.id })), { type: 'Notes', id: 'LIST' }] : [{ type: 'Notes', id: 'LIST' }]`
- **AND** all mutation endpoints (`createNote`, `updateNoteById`, `deleteNoteById`) SHALL use `invalidatesTags: (result, error, arg) => arg?.id ? [{ type: 'Notes', id: arg.id }] : [{ type: 'Notes', id: 'LIST' }]`

#### Scenario: Products API uses composite tags for all endpoints
- **WHEN** the Products API slice is migrated
- **THEN** `getAllProducts`, `getAllProductsFilters` SHALL use `providesTags` with per-ID + LIST pattern
- **AND** `createProduct`, `updateProductById`, `deleteProductById` (and similar mutations) SHALL use `invalidatesTags` with ID-targeted pattern

#### Scenario: Sales API uses composite tags for all endpoints
- **WHEN** the Sales API slice is migrated
- **THEN** `getAllSales` SHALL use `providesTags` with per-ID + LIST pattern for `'Sales'`
- **AND** `createSale`, `deleteSaleById`, `deleteSaleDetailById` SHALL use `invalidatesTags` with ID-targeted pattern

#### Scenario: Stock API uses composite tags for all endpoints
- **WHEN** the Stock API slice is migrated
- **THEN** `getAllStock` SHALL use `providesTags` with per-ID + LIST pattern for `'Stock'`
- **AND** `createStock`, `deleteStockById`, `updateStockById` SHALL use `invalidatesTags` with ID-targeted pattern

### Requirement: Remaining 20 API slices are migrated second

After the four core slices are verified, the remaining 20 API slices SHALL be migrated to composite tags in a batch phase.

#### Scenario: All remaining slices match the composite tag pattern
- **WHEN** the remaining 20 API slices are migrated in batch
- **THEN** each slice SHALL follow the same `providesTags` callback pattern with per-ID + LIST tags for queries
- **AND** each slice SHALL follow the same `invalidatesTags` callback pattern with ID-targeted logic for mutations
- **AND** queries that return single items (not lists) SHALL use `providesTags: (result, error, arg) => [{ type: 'X', id: arg?.id ?? 'LIST' }]`

#### Scenario: Slices with no arguments in mutations use LIST fallback
- **WHEN** a mutation endpoint has no `arg.id` to target (e.g., a bare POST create)
- **THEN** the `invalidatesTags` SHALL default to `[{ type: 'X', id: 'LIST' }]` to invalidate the full list cache
