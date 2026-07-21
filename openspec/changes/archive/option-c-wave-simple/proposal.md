## Why

After proving the pattern in Products module, extend `useQueryData` and `useLoadingState` to 4 simpler modules. Clients, Employees, Attendance, and Expenses all share the same pattern: 1 lazy query with pagination/filters + CRUD mutations. They all have manual `useEffect` trigger patterns, 5-flag manual spinner chains, and `.data` extraction scattered in child components.

## What Changes

- Migrate Clients module to useQueryData + useLoadingState + clean `.data` from children
- Migrate Employees module to useQueryData + useLoadingState + clean `.data` from children
- Migrate Attendance module to useQueryData + useLoadingState + clean `.data` from children
- Migrate Expenses module to useQueryData + useLoadingState + clean `.data` from children

## Capabilities

### New Capabilities
- `loading-state-hook`: Shared consistent pattern for lazy query triggers, loading state consolidation, and clean data access in child components

### Modified Capabilities
<!-- No existing spec-level behavior changes; implementation details only -->

## Impact

- 4 modules: Clients, Employees, Attendance, Expenses
- 4 pages (one per module)
- ~8 child components receiving clean arrays instead of `.data` access
- RTK Query hooks updated to useQueryData/useLoadingState patterns
