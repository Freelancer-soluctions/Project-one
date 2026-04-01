# Test Reusable Components - Implementation Tasks

## 1. MSW Infrastructure

- [ ] 1.1 Extend `tests/setup/msw/handlers/handlers.js` with auth handlers (GET `/api/auth/me`, POST `/api/auth/logout`)
- [ ] 1.2 Create MSW fixtures for auth scenarios in `tests/setup/msw/fixtures/`

## 2. Trivial Components (Unit Only)

- [ ] 2.1 Create `loader/Loader.unit.test.jsx`
- [ ] 2.2 Create `loader/Spinner.unit.test.jsx`
- [ ] 2.3 Create `layout/Header.unit.test.jsx`
- [ ] 2.4 Create `layout/Main.unit.test.jsx`
- [ ] 2.5 Create `layout/Footer.unit.test.jsx`
- [ ] 2.6 Create `layout/Layout.unit.test.jsx`

## 3. Simple Components (Unit + Integration)

- [ ] 3.1 Create `backDash/BackDashBoard.unit.test.jsx`
- [ ] 3.2 Create `backDash/BackDashBoard.integration.test.jsx`

## 4. Error Components (Unit + Integration)

- [ ] 4.1 Create `500/InternalServerError.unit.test.jsx`
- [ ] 4.2 Create `500/InternalServerError.integration.test.jsx`

## 5. AlertDialog Component (Unit + Integration)

- [ ] 5.1 Create `alertDialog/AlertDialog.unit.test.jsx`
- [ ] 5.2 Create `alertDialog/AlertDialog.integration.test.jsx`

## 6. QuickAccess Component (Unit + Integration)

- [ ] 6.1 Create `quickAccess/QuickAccess.unit.test.jsx`
- [ ] 6.2 Create `quickAccess/QuickAccess.integration.test.jsx`

## 7. Guards Components (Unit + Integration)

- [ ] 7.1 Create `guards/ProtectedRoutes.unit.test.jsx`
- [ ] 7.2 Create `guards/ProtectedRoutes.integration.test.jsx`
- [ ] 7.3 Create `guards/ProtectedFormRoute.unit.test.jsx`
- [ ] 7.4 Create `guards/ProtectedFormRoute.integration.test.jsx`

## 8. DataTable Components (Unit Only)

- [ ] 8.1 Create `dataTable/DebouncedInput.unit.test.jsx`
- [ ] 8.2 Create `dataTable/Filter.unit.test.jsx`
- [ ] 8.3 Create `dataTable/Pagination.unit.test.jsx`
- [ ] 8.4 Create `dataTable/cellWithTooltip.unit.test.jsx`
- [ ] 8.5 Create `dataTable/dataTable.unit.test.jsx`

## 9. Verification

- [ ] 9.1 Run `npm run test` and verify all tests pass
- [ ] 9.2 Run `npm run test:coverage` and verify coverage report
