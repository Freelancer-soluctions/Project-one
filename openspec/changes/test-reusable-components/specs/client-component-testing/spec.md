# Client Component Testing

## Overview

This spec defines the testing requirements for reusable components in `apps/client/src/components/`.

## ADDED Requirements

### Requirement: All reusable components SHALL have unit tests

Each reusable component (excluding `ui/` shadcn components) SHALL have a corresponding `.unit.test.jsx` file co-located with the component.

**Scope:**

- `500/InternalServerError`
- `alertDialog/AlertDialogComponent`
- `backDash/BackDashBoard`
- `dataTable/` (DataTable, Filter, Pagination, CellWithTooltip, DebouncedInput)
- `guards/` (ProtectedRoutes, ProtectedFormRoute)
- `layout/` (Layout, Main, Header, Footer)
- `loader/` (Loader, Spinner)
- `quickAccess/QuickAccessButton`

**Implementation:**

- Unit tests SHALL use `vi.mock` for external dependencies
- Unit tests SHALL NOT use MSW
- Unit tests SHALL NOT use real Redux store

### Requirement: Components with external dependencies SHALL have integration tests

Components that interact with Redux, Router, or API calls SHALL have a corresponding `.integration.test.jsx` file.

**Scope:**

- `guards/ProtectedRoutes` - integration with Redux auth state
- `guards/ProtectedFormRoute` - integration with React Router state
- `alertDialog/AlertDialogComponent` - integration with Radix Dialog
- `quickAccess/QuickAccessButton` - integration with Radix Popover

**Implementation:**

- Integration tests SHALL use MSW for API mocking
- Integration tests SHALL use real Redux store
- Integration tests SHALL use real Router (MemoryRouter)

### Requirement: Test patterns SHALL follow existing conventions

Tests SHALL follow the patterns established in:

- `apps/client/src/components/404/NotFound.unit.test.jsx`
- `apps/client/src/components/404/NotFound.integration.test.jsx`
- `docs/testing-architecture.md`

**Naming:**

- Unit tests: `*.unit.test.jsx`
- Integration tests: `*.integration.test.jsx`

### Requirement: MSW handlers SHALL be extended for auth scenarios

The existing `tests/setup/msw/handlers/handlers.js` SHALL be extended with auth-related handlers needed for `ProtectedRoutes` integration tests.

**Required handlers:**

- GET `/api/auth/me` - returns user data
- POST `/api/auth/logout` - returns success
