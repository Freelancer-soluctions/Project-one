# Proposal

## Why

`employees` has no FK to `users`. An employee and their login account are disconnected; the system cannot tell whether an employee has access, nor support self-service ("my profile/payroll"). Correlation is only possible via the shared unique `email`, but it is not enforced.

## What Changes

- Add nullable `userId Int? @unique` FK on `employees` → `users` (nullable: not every employee has an account).
- Backfill `userId` by matching email.
- New endpoints to link/unlink/create a user account for an employee.
- New permission codes for self-service and account management.
- Optional `/employees/me` endpoint returning the authenticated user's employee record.
- Frontend: login-status indicator + link/create-account action in EmployeeDialog; datatable column.

## Non-goals

- No catalog entities (separate change).
- No salaryType (separate change).
- No full user-management redesign.

## Capabilities

### New Capabilities

- `employee-user-linkage`: link employees to user accounts, self-service access.

### Modified Capabilities

- (none)

## Impact

- **DB**: nullable unique FK + backfill by email.
- **API**: link/unlink/create-account endpoints; optional `/me`.
- **RBAC**: new permission codes; self-service scoping.
- **Frontend**: EmployeeDialog login status + actions; datatable column.
- **Risk**: RBAC blast radius; encryption raw-SQL joins.

## Riesgos

- R1: backfill by email assumes 1:1 email uniqueness (both unique — safe).
- R2: raw SQL joins to users must keep decryptResults working.
- R3: self-service must not leak encrypted salary/dni.

## Dependencias

- RBAC permission assignment pattern.
