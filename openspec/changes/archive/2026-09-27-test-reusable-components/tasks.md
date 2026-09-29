# Test Reusable Components - Implementation Tasks

> **AUDITORÍA POST-HOC (2026-09-27, change verificado antes de archivar):** los 27 tasks
> estaban implementados desde el lote de agosto pero nunca marcados. Verificación 1:1 contra
> código: handlers auth en handlers.js (L12/L14), fixtures/auth.js, 23 test files en las 8
> carpetas objetivo (loader 2, layout 4, backDash 2, 500 2, alertDialog 2, quickAccess 2,
> guards 4, dataTable 5). Suite completa: 30/30 tests verdes (2026-09-27). Coverage global del
> proyecto queda bajo thresholds pre-existentes (functions 61.84% vs 63%, branches 44.28% vs
> 49%) — gap project-wide, no de este change. Header actualizado y tasks marcados con esta
> auditoría como evidencia.

## 1. MSW Infrastructure

- [x] 1.1 Extend `tests/setup/msw/handlers/handlers.js` with auth handlers (GET `/api/auth/me`, POST `/api/auth/logout`)
- [x] 1.2 Create MSW fixtures for auth scenarios in `tests/setup/msw/fixtures/`

## 2. Trivial Components (Unit Only)

- [x] 2.1 Create `loader/Loader.unit.test.jsx`
- [x] 2.2 Create `loader/Spinner.unit.test.jsx`
- [x] 2.3 Create `layout/Header.unit.test.jsx`
- [x] 2.4 Create `layout/Main.unit.test.jsx`
- [x] 2.5 Create `layout/Footer.unit.test.jsx`
- [x] 2.6 Create `layout/Layout.unit.test.jsx`

## 3. Simple Components (Unit + Integration)

- [x] 3.1 Create `backDash/BackDashBoard.unit.test.jsx`
- [x] 3.2 Create `backDash/BackDashBoard.integration.test.jsx`

## 4. Error Components (Unit + Integration)

- [x] 4.1 Create `500/InternalServerError.unit.test.jsx`
- [x] 4.2 Create `500/InternalServerError.integration.test.jsx`

## 5. AlertDialog Component (Unit + Integration)

- [x] 5.1 Create `alertDialog/AlertDialog.unit.test.jsx`
- [x] 5.2 Create `alertDialog/AlertDialog.integration.test.jsx`

## 6. QuickAccess Component (Unit + Integration)

- [x] 6.1 Create `quickAccess/QuickAccess.unit.test.jsx`
- [x] 6.2 Create `quickAccess/QuickAccess.integration.test.jsx`

## 7. Guards Components (Unit + Integration)

- [x] 7.1 Create `guards/ProtectedRoutes.unit.test.jsx`
- [x] 7.2 Create `guards/ProtectedRoutes.integration.test.jsx`
- [x] 7.3 Create `guards/ProtectedFormRoute.unit.test.jsx`
- [x] 7.4 Create `guards/ProtectedFormRoute.integration.test.jsx`

## 8. DataTable Components (Unit Only)

- [x] 8.1 Create `dataTable/DebouncedInput.unit.test.jsx`
- [x] 8.2 Create `dataTable/Filter.unit.test.jsx`
- [x] 8.3 Create `dataTable/Pagination.unit.test.jsx`
- [x] 8.4 Create `dataTable/cellWithTooltip.unit.test.jsx`
- [x] 8.5 Create `dataTable/dataTable.unit.test.jsx`

## 9. Verification

- [x] 9.1 Run `npm run test` and verify all tests pass
- [x] 9.2 Run `npm run test:coverage` and verify coverage report
