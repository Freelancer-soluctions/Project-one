# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `SalaryType` enum and `salaryType` column on employees (default MONTHLY); verify `prisma validate`
- [ ] 1.2 Create migration and apply locally; verify

## 2. Backend

- [ ] 2.1 Update employee types/Joi/controller for salaryType; verify
- [ ] 2.2 Implement payroll computation in payroll service (MONTHLY/HOURLY/PER_PROJECT); verify
- [ ] 2.3 Update payroll Joi (make totalPayment optional/ignored; extraHours required for HOURLY); verify
- [ ] 2.4 Update client zod payroll schema (totalPayment optional) + PayrollDialog; verify
- [ ] 2.5 Update OpenAPI; verify

## 3. Frontend

- [ ] 3.1 Employee zod schema: add `salaryType` enum (MONTHLY/HOURLY/PER_PROJECT); verify
- [ ] 3.2 EmployeesDialog: add salaryType to mapRowToFormValues + getEmptyFormValues + SalaryTypeSelectField rendered in buildEmployeeFields; verify
- [ ] 3.3 Payroll zod: make totalPayment optional; add conditional extraHours requirement for HOURLY; verify
- [ ] 3.4 PayrollDialog: remove totalPayment from toSubmissionValues + EMPTY_FORM_VALUES; make totalPayment read-only/display-only; display employee salaryType from dataEmployees; conditional extraHours; verify
- [ ] 3.5 Add frontend salaryType enum list (like months in payroll/utils/enums.js) for Select options; verify
- [ ] 3.6 i18n keys in en.json/es.json (salary_type, monthly, hourly, per_project, zod.employees.salaryType, adjust zod.payroll.totalPayment); verify
- [ ] 3.7 Update UI test fixtures/snapshots for salaryType (EmployeesDialog, EmployeesDatatable, PayrollDatatable); verify

## 4. Tests

- [ ] 4.1 Unit tests for payroll computation; verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate employee-salary-type`; verify no errors
- [ ] 5.2 Run full test suite; verify green
