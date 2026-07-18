## ADDED Requirements

### Requirement: Lazy query trigger pattern
The system SHALL use `useLazyGetAllXxxQuery` for data fetching with manual trigger via `useEffect` tied to pagination and filter dependencies.

#### Scenario: Trigger fires on pagination change
- **WHEN** pagination.pageIndex or pagination.pageSize changes
- **THEN** the lazy query trigger SHALL fire with `{ page, limit, ...filters }`

#### Scenario: Trigger fires on filter change
- **WHEN** any filter value changes
- **THEN** the lazy query trigger SHALL fire with updated filters

#### Scenario: useQueryData wraps query state
- **WHEN** the lazy query returns a result
- **THEN** `useQueryData` SHALL extract `data`, `isLoading`, and `isFetching` from the query state

### Requirement: Consistent spinner pattern
The system SHALL use `useLoadingState` to consolidate multiple loading flags into two consolidated values.

#### Scenario: Single loading state from multiple sources
- **WHEN** multiple loading flags exist (query isLoading, mutation isLoadingPut, etc.)
- **THEN** `useLoadingState` SHALL consolidate them into `isLoading` and `isFetching`

#### Scenario: Mutation loading included in spinner
- **WHEN** any CRUD mutation (post, put, delete) is in flight
- **THEN** `isLoadingPost || isLoadingPut || isLoadingDelete` SHALL be combined with query loading

### Requirement: Child components receive plain arrays
Child components SHALL receive data as plain arrays, not RTK Query wrapper objects.

#### Scenario: Datatable receives plain array
- **WHEN** a datatable child component receives data prop
- **THEN** the data SHALL be a plain array without `.data` wrapper access

#### Scenario: Filter form receives plain array
- **WHEN** a filter select/autocomplete child receives options
- **THEN** the options SHALL be a plain array without `.data` wrapper access
