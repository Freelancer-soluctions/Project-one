# Design

## Context

See proposal.md. No FK exists today; correlation only via unique email.

## Goals / Non-Goals

**Goals:** nullable unique userId FK, backfill by email, link/unlink/create-account endpoints, /me self-service.
**Non-Goals:** catalogs, salaryType, full user-management redesign.

## Decisions

### D1 — Nullable unique FK on employees

`userId Int? @unique` on employees → users. Nullable because not every employee has an account.

### D2 — Backfill by email

Migration matches employee.email to user.email (both unique), using case-insensitive comparison (LOWER) to avoid silent mismatches.

### D3 — Self-service scoping

`/employees/me` resolves employee via userId = req.userId; returns 404 if none. Reuses existing auth middleware.

### D4 — Permissions

New codes: `canLinkEmployeeUser`. The `/employees/me` self-service endpoint requires only authentication (no specific permit) — `canViewOwnEmployee` is not introduced.

## Risks / Trade-offs

- [Raw SQL joins to users] → keep decryptResults working.
- [Leak of encrypted fields] → ensure /me returns only authorized fields per role.
- [1:1 uniqueness] → unique constraint enforced at DB.

## Frontend Impact

- employeesApi.js: new mutations/queries + hooks + tag invalidation.
- EmployeeDialog: login-status indicator + link/unlink/create-account actions; 403 handling.
- EmployeesDatatable: login/account column.
- EmployeesFiltersForm: optional linked/unlinked filter (or out of scope).
- Create-account UX: password + role inputs, validation schema, i18n.
- i18n keys (en/es) for login status/actions/zod messages.
- fieldLimits: verify/add (or state none).
- UI tests: update mocks/fixtures + regenerate snapshots.

## Scope clarifications

- `/employees/me` has no frontend consumer in v1 (backend-only); "my profile" is a future change.
- UsersDialog/Datatable showing linked employee is a non-goal in v1.

## Migration Plan

Add nullable column → backfill → (optional) keep nullable (never contract, since not all employees have accounts).

Rollback: manual SQL.

## Threat Model

Auth fail-closed; self-service must not bypass RBAC for sensitive fields.
