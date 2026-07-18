# Design: Simple Wave — RTK Query Pattern Standardization

## Context
4 modules (Clients, Employees, Attendance, Expenses) share a similar pattern: 1 lazy query with pagination/filters + CRUD mutations. Attendance additionally has a secondary non-lazy query (`useGetAllEmployeesFiltersQuery`) for a filter dropdown. Each has manual `useEffect` for triggering queries, 5-flag manual spinner chains mixing query + mutation loading, and `.data` extraction in child components.

## Goals
- Standardize all 4 modules to use useQueryData + useLoadingState
- Child components receive plain arrays, not response objects
- Split query loading from mutation loading in spinners

## Non-Goals
- No behavioral changes
- No cross-module refactors
- No test additions

## Decisions

### 1. Consistent lazy query pattern
Most modules use the same pattern:
```js
const [trigger, queryState] = useLazyGetAllXxxQuery();
const { data: dataItems, isLoading, isFetching } = useQueryData(queryState);

useEffect(() => {
  trigger({ page: pagination.pageIndex + 1, limit: pagination.pageSize, ...filters });
}, [pagination.pageIndex, pagination.pageSize, filters, trigger]);
```

**Exception — Attendance:** Has 2 queries (lazy attendance + regular employees for filters). Both use `useQueryData`:
```js
const [trigger, queryState] = useLazyGetAllAttendanceQuery();
const { data: dataAttendance, isLoading: isLoadingAtt, isFetching: isFetchingAtt } = useQueryData(queryState);

const { data: dataEmployees, isLoading: isLoadingEmp, isFetching: isFetchingEmp } = useQueryData(useGetAllEmployeesFiltersQuery());
```

### 2. Consistent spinner pattern
Queries use `useLoadingState`, mutations stay as `||`:
```js
// Standard (1 query)
const { isLoading: isLoadingAny, isFetching: isFetchingAny } = useLoadingState([{ isLoading, isFetching }]);

// Attendance (2 queries)
const { isLoading: isLoadingAny, isFetching: isFetchingAny } = useLoadingState([
  { isLoading: isLoadingAtt, isFetching: isFetchingAtt },
  { isLoading: isLoadingEmp, isFetching: isFetchingEmp },
]);

const isLoadingMutations = isLoadingPost || isLoadingPut || isLoadingDelete;
```

### 3. Child components receive plain arrays
Same as Products migration. Datatables and filter forms access arrays directly.

## Risks
- Clients/Employees/Expenses/Attendance have no test coverage → manual smoke test needed
- Child component .data access may be missed → grep verification required per module
