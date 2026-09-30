# client-component-testing Specification

## Purpose

Cobertura de tests para los componentes reutilizables de `apps/client/src/components/` (excluyendo `ui/` shadcn): unit tests co-localizados por componente, integration tests para los que tocan Redux/Router/API vía MSW, convenciones de naming `*.unit.test.jsx` / `*.integration.test.jsx`, y handlers auth de MSW compartidos. Permite refactorizar con confianza y detectar regresiones en la capa de presentación.

## Requirements

### Requirement: All reusable components SHALL have unit tests

Each reusable component (excluding `ui/` shadcn components) SHALL have a corresponding `.unit.test.jsx` file co-located with the component, covering: `500/InternalServerError`, `alertDialog/AlertDialogComponent`, `backDash/BackDashBoard`, `dataTable/` (DataTable, Filter, Pagination, CellWithTooltip, DebouncedInput), `guards/` (ProtectedRoutes, ProtectedFormRoute), `layout/` (Layout, Main, Header, Footer), `loader/` (Loader, Spinner), and `quickAccess/QuickAccessButton`.

Unit tests SHALL use `vi.mock` for external dependencies, SHALL NOT use MSW, and SHALL NOT use a real Redux store.

#### Scenario: Component renders its expected UI

- **WHEN** a reusable component is rendered in isolation with required props
- **THEN** the unit test asserts the expected DOM output without external services

#### Scenario: Coverage across the component folders

- **WHEN** the test suite runs over `apps/client/src/components/`
- **THEN** every folder listed in the scope has at least one unit test file

### Requirement: Components with external dependencies SHALL have integration tests

Components that interact with Redux, Router, or API calls SHALL have a corresponding `.integration.test.jsx` file. Integration tests SHALL use MSW for API mocking, a real Redux store, and a real Router (`MemoryRouter`).

#### Scenario: Guard checks auth state through the real store

- **WHEN** `ProtectedRoutes` renders with an unauthenticated Redux state
- **THEN** the integration test asserts the redirect behavior through the real store

#### Scenario: API-backed components receive mocked HTTP

- **WHEN** an integration test mounts a component that fetches data
- **THEN** MSW intercepts the request and the component renders from the mocked response

### Requirement: Test patterns SHALL follow existing conventions

Tests SHALL follow the patterns established in `apps/client/src/components/404/NotFound.*.test.jsx` and `docs/testing-architecture.md`: unit tests named `*.unit.test.jsx`, integration tests named `*.integration.test.jsx`.

#### Scenario: Naming convention holds

- **WHEN** new test files are added for reusable components
- **THEN** unit tests end in `.unit.test.jsx` and integration tests end in `.integration.test.jsx`

### Requirement: MSW handlers SHALL be extended for auth scenarios

The existing `tests/setup/msw/handlers/handlers.js` SHALL be extended with auth-related handlers needed for guard integration tests: `GET /api/auth/me` returning user data and `POST /api/auth/logout` returning success.

#### Scenario: Auth handlers answer guard requests

- **WHEN** an integration test exercises a guard that queries the session
- **THEN** the MSW auth handlers (`/api/auth/me`, `/api/auth/logout`) respond with fixture data
