# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `userId Int? @unique` FK on employees → users; verify `prisma validate`
- [ ] 1.2 Create migration with backfill by email; verify

## 2. Backend

- [ ] 2.1 Add link/unlink/create-account endpoints + service/dao; verify
- [ ] 2.2 Add `/employees/me` endpoint; verify
- [ ] 2.3 Update employee types (EmployeeListRow: userId/hasAccount/linkedUserName), dao raw SQL (join users for login status), Joi, schemas-shift-left ResponseGetEmployee; verify
- [ ] 2.4 Add `canLinkEmployeeUser` to PERMISSIONCODES enum (enums.ts) and seed rows in prisma/seed.ts; verify seed runs and a MANAGER with the code can link
- [ ] 2.5 Update OpenAPI; verify

## 3. Frontend

- [ ] 3.1 employeesApi.js: add linkEmployeeUser, unlinkEmployeeUser, createEmployeeUserAccount, getEmployeeMe mutations/queries + hooks + tag invalidation; verify
- [ ] 3.2 EmployeeDialog: login-status indicator + link/unlink/create-account actions; handle 403 feedback; verify
- [ ] 3.3 EmployeesDatatable: login/account column (accessor + cell renderer + header key); verify
- [ ] 3.4 EmployeesFiltersForm: optional filter by linked/unlinked (or mark out of scope); verify
- [ ] 3.5 Create-account UX: password + role inputs (and/or link-existing-user select), validation schema (EmployeeSchema extension), i18n zod keys; verify
- [ ] 3.6 i18n keys (en.json + es.json): login_status, has_account, no_account, linked_user, link_user, unlink_user, create_account, account_created, plus zod messages; verify
- [ ] 3.7 fieldLimits: verify/add any new fields (or state none needed); verify
- [ ] 3.8 UI tests: update EmployeesDialog.ui.test.jsx mocks and EmployeesDatatable.ui.test.jsx fixtures; regenerate snapshots; verify

## 4. Tests

- [ ] 4.1 Integration tests for link/unlink/me; verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate employee-user-linkage`; verify no errors
- [ ] 5.2 Run full test suite; verify green
