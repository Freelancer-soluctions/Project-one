## ADDED Requirements

### Requirement: Leaf components fetch their own data

Components that render data from a single API endpoint SHALL declare the `useQuery` call themselves instead of receiving the data as a prop from a parent.

#### Scenario: Query removed from parent page
- **WHEN** a leaf component uses data from a single API endpoint
- **AND** the data passes through one or more intermediate components that don't read it
- **THEN** the `useQuery` call SHALL be removed from the parent page
- **AND** the data prop SHALL be removed from all intermediate components

#### Scenario: Query added to leaf component
- **WHEN** a leaf component previously received data via props
- **AND** the data comes from a single API endpoint
- **THEN** the component SHALL import and use the `use*Query` hook directly
- **AND** the component SHALL handle `isLoading` and `isError` states locally

#### Scenario: Shared data stays in parent
- **WHEN** multiple sibling components need the same fetched data
- **THEN** the query SHALL remain in the common parent
- **AND** the data SHALL be passed down as a prop
- **AND** this scenario SHALL be the exception, not the rule

#### Scenario: Intermediate props are cleaned up
- **WHEN** a prop is no longer needed by any child component
- **THEN** the prop SHALL be removed from the intermediate component's PropTypes/TypeScript interface
- **AND** the prop SHALL NOT be listed in the component's destructured parameters
- **AND** unused imports related to the removed data SHALL be cleaned up

#### Scenario: NotesSummary serves as reference implementation
- **WHEN** implementing co-location in new modules
- **THEN** the `NotesSummary` component at `apps/client/src/modules/home/components/NotesSummary.jsx` SHALL serve as the reference pattern
- **AND** `docs/data-co-location-pattern.md` SHALL be consulted for detailed guidance
