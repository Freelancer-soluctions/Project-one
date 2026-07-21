# Tasks: Simple Wave

## Group 1: Clients

- [x] 1.1 Update Clients.jsx: useQueryData + useLoadingState
- [ ] 1.2 Update ClientsDatatable.jsx: remove .data access, PropTypes array
- [ ] 1.3 Update ClientsFiltersForm.jsx: remove .data access, PropTypes array (if it has filter queries)
- [ ] 1.4 Update ClientsDialog.jsx: remove .data access (if any)

## Group 2: Employees

- [ ] 2.1 Update Employees.jsx: useQueryData + useLoadingState
- [ ] 2.2 Update EmployeesDatatable.jsx: remove .data access, PropTypes array
- [ ] 2.3 Update EmployeesFiltersForm.jsx: review (no .data access expected)
- [ ] 2.4 Update EmployeesDialog.jsx: review (no .data access expected)

## Group 3: Attendance

- [ ] 3.1 Update Attendance.jsx: useQueryData for BOTH attendance + employees queries; useLoadingState with 2 inputs
- [ ] 3.2 Update AttendanceDatatable.jsx: remove .data access, PropTypes array
- [ ] 3.3 Update AttendanceFiltersForm.jsx: review (already receives array — no change expected)
- [ ] 3.4 Update AttendanceDialog.jsx: review (already receives array — no change expected)

## Group 4: Expenses

- [ ] 4.1 Update Expenses.jsx: useQueryData + useLoadingState
- [ ] 4.2 Update ExpensesDatatable.jsx: remove .data access, PropTypes array
- [ ] 4.3 Update ExpensesFiltersForm.jsx: review (no .data access expected)
- [ ] 4.4 Update ExpensesDialog.jsx: review (no .data access expected)

## Group 5: Verification

- [ ] 5.1 Verify no `.data` access remains: `rg --no-heading '\.data' apps/client/src/modules/{clients,employees,attendance,expenses}/`
- [ ] 5.2 Verify npm run build passes
