# loading-state-hook Specification

## Purpose
TBD - created by archiving change option-c-foundation. Update Purpose after archive.
## Requirements
### Requirement: Hook aggregates loading states across multiple queries
The system SHALL provide a `useLoadingState` hook that accepts one or more RTK Query state objects via rest parameters and returns aggregated loading and fetching flags using `Array.some()`.

#### Scenario: Single query is loading
- **WHEN** `useLoadingState({ isLoading: true, isFetching: false })` is called
- **THEN** the hook returns `{ isLoading: true, isFetching: false }`

#### Scenario: Multiple queries with mixed loading states
- **WHEN** `useLoadingState({ isLoading: true, isFetching: false }, { isLoading: false, isFetching: true })` is called
- **THEN** the hook returns `{ isLoading: true, isFetching: true }`

#### Scenario: No queries are loading
- **WHEN** `useLoadingState({ isLoading: false, isFetching: false }, { isLoading: false, isFetching: false })` is called
- **THEN** the hook returns `{ isLoading: false, isFetching: false }`

#### Scenario: Single query state argument
- **WHEN** `useLoadingState({ isLoading: false, isFetching: true })` is called with one query state
- **THEN** the hook returns `{ isLoading: false, isFetching: true }`

### Requirement: Returned object is useMemo-stabilized
The system SHALL ensure the returned object reference is stable across renders when input query states have not changed.

#### Scenario: Stabilized return value
- **WHEN** `useLoadingState(queryA, queryB)` is called and neither `queryA` nor `queryB` has changed
- **THEN** the returned object reference SHALL remain the same across renders

### Requirement: Hook handles empty or partial input
The system SHALL handle edge cases where queries have missing or partial state flags.

#### Scenario: Query state with missing isLoading
- **WHEN** `useLoadingState({ isFetching: true })` is called with no `isLoading` property
- **THEN** the hook returns `{ isLoading: false, isFetching: true }`

#### Scenario: No arguments passed
- **WHEN** `useLoadingState()` is called with no arguments
- **THEN** the hook returns `{ isLoading: false, isFetching: false }`

#### Scenario: Null or undefined in arguments
- **WHEN** `useLoadingState(null, { isLoading: true })` is called
- **THEN** the hook returns `{ isLoading: true, isFetching: false }` (skips null/undefined entries)

