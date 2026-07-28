## ADDED Requirements

### Requirement: useProductsFilterData returns filter data
The system SHALL provide a shared hook `useProductsFilterData` that wraps 3 filter queries (status, categories, providers) and returns unwrapped arrays with aggregated loading state.

#### Scenario: useProductsFilterData returns correct shape
- **WHEN** `useProductsFilterData` is called in any Products page component
- **THEN** it returns `{ datastatus, dataCategory, dataProviders, isLoadingFilters, isFetchingFilters }`

### Requirement: Products.jsx uses standardized data patterns
The Products.jsx page SHALL use `useProductsFilterData` for filter data, `useQueryData` for the lazy product query, and `useLoadingState` for aggregated loading states.

#### Scenario: Products.jsx renders with useProductsFilterData
- **WHEN** `Products.jsx` renders
- **THEN** it uses `useProductsFilterData` for filter data and `useQueryData` for lazy query
- **THEN** loading states are aggregated via `useLoadingState`

### Requirement: ProductsForms.jsx uses standardized data patterns
The ProductsForms.jsx page SHALL use `useProductsFilterData` for filter data, `useQueryData` for the lazy product attributes query, and `useLoadingState` for aggregated loading states.

#### Scenario: ProductsForms.jsx renders with useProductsFilterData
- **WHEN** `ProductsForms.jsx` renders
- **THEN** it uses `useProductsFilterData` for filter data and `useQueryData` for lazy query
- **THEN** loading states are aggregated via `useLoadingState`

### Requirement: Child components receive plain arrays
Child components (ProductsFiltersForm, ProductBasicInfo, ProductsDatatable) SHALL receive filter data as plain arrays with PropTypes.array, not wrapped response objects.

#### Scenario: ProductsFiltersForm receives arrays
- **WHEN** `ProductsFiltersForm` receives props
- **THEN** `datastatus`, `dataCategory`, and `dataProviders` are arrays (`PropTypes.array`)

#### Scenario: ProductBasicInfo receives arrays
- **WHEN** `ProductBasicInfo` receives props
- **THEN** `datastatus`, `dataCategory`, and `dataProviders` are arrays (`PropTypes.array`)

#### Scenario: ProductsDatatable receives unwrapped data
- **WHEN** `ProductsDatatable` receives `dataProducts`
- **THEN** `dataProducts` is the inner array, not wrapped in a response object

### Requirement: Loading states aggregated via useLoadingState
All Products page components SHALL aggregate their loading and fetching states through the `useLoadingState` foundation utility.

#### Scenario: Loading state aggregation
- **WHEN** any Products page renders
- **THEN** loading states are aggregated via `useLoadingState`
