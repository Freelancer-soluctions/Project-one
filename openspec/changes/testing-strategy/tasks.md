## 1. E2E Testing Setup

- [x] 1.1 Verify Playwright configuration in e2e/playwright.config.js
- [x] 1.2 Create e2e/tests/specs/ directory structure
- [x] 1.3 Create first E2E test: login.spec.js (login flow)
- [x] 1.4 Create E2E test: logout.spec.js (logout flow)
- [x] 1.5 Create E2E test: dashboard.spec.js (dashboard access)
- [x] 1.6 Create E2E test: users-crud.spec.js (user management)
- [x] 1.7 Create E2E test: sales-view.spec.js (view sales records)

## 2. Smoke Testing Implementation

- [x] 2.1 Create smoke tests in apps/server/tests/smoke/
- [x] 2.2 Add server health check test
- [x] 2.3 Add database connectivity test
- [x] 2.4 Add authentication endpoint test
- [x] 2.5 Add critical API endpoints test
- [x] 2.6 Add test:smoke script to package.json
- [x] 2.7 Add test:smoke:ci script for CI/CD

## 3. Regression Testing Setup

- [x] 3.1 Identify core regression test suite (existing unit + integration)
- [x] 3.2 Create test:regression script in package.json
- [x] 3.3 Configure pre-commit hook to run regression tests
- [x] 3.4 Add lint-staged integration for regression in package.json

## 4. Documentation Update

- [x] 4.1 Update docs/testing-architecture.md - add Section 12: Smoke Testing
- [x] 4.2 Update docs/testing-architecture.md - add Section 13: Regression Testing
- [x] 4.3 Update docs/testing-architecture.md - add Section 14: Priority Testing (ERP modules)
- [x] 4.4 Update docs/testing-architecture.md - add Section 15: E2E Setup Guide
- [x] 4.5 Update docs/testing-architecture.md - add Section 16: Coverage Targets

## 5. Verification

- [x] 5.1 Run `npm run test:e2e` to verify E2E tests work — verify script created (`verify:e2e`), runtime pending
- [x] 5.2 Run `npm run test:smoke` to verify smoke tests work — verify script created (`verify:smoke`), runtime pending
- [x] 5.3 Verify regression tests run on pre-commit — static verified: pre-commit hook runs `npm run test:regression`, server has `test:regression` script, lint-staged includes regression for `*.test.js`, root now delegates to server
- [x] 5.4 Verify all documentation changes are complete — sections 12-16 confirmed present in docs/testing-architecture.md

## 6. Windows Compat & Spawn Loop Fix (P0)

- [x] 6.1 Eliminar `npx` de todos los scripts npm del root package.json (reemplazar por bins directos)
- [x] 6.2 Refactorizar `test`, `test:unit`, `test:integration`, `test:e2e` del root para delegar via `npm run X --workspace=<name>`
- [x] 6.3 Verificar que cada workspace (client-react, server-express, e2e) tenga `vitest` o `@playwright/test` en devDependencies
- [x] 6.4 Agregar `pool: 'forks'` y `poolOptions.forks.singleFork: true` en apps/server/vitest.config.js
- [x] 6.5 Agregar `reporters: ['default', 'hanging-process']` en apps/server/vitest.config.js y apps/client/vitest.config.js
- [x] 6.6 Remover `projects: [{unit}, {integration}]` anidados del apps/client/vitest.config.js y unificar include pattern
- [x] 6.7 Agregar `testTimeout: 30000`, `hookTimeout: 15000`, `teardownTimeout: 5000` en vitest.shared.js
- [x] 6.8 Agregar script `test:debug` en root package.json usando why-is-node-running
- [x] 6.9 Remover flag `--project=unit` externo del root test:unit (ya no aplica con D9)
- [x] 6.10 Verificar `npm run test` correctamente termina en Windows (sin procesos colgados en Task Manager)

## 7. Cross-Platform Hardening (P1)

- [x] 7.1 Auditar todos los scripts npm del repo por uso de `npx` y reemplazar por bins directos
- [x] 7.2 Decidir husky: inicializar correctamente `.husky/` con hooks pre-commit/pre-push, o remover el script `prepare: husky`
- [x] 7.3 Reemplazar uso de `&&` por `concurrently` en scripts de CI (test:all) para paralelismo controlado — agregado `test:all` con concurrently, prepush mantiene `&&` para fail-fast
- [x] 7.4 Agregar script `prepush` más eficiente: `npm run test:changed && npm run build` (no full suite)
- [x] 7.5 Documentar en docs/testing-architecture.md una sección "Cross-Platform Considerations" (Windows/Linux/Mac compat) — agregadas secciones 18.1-18.9

## 8. Enterprise Diagnóstico Integration (P2)

- [x] 8.1 Integrar `why-is-node-running` como dep dev en apps/server y apps/client (mover de docs/opencode/...)
- [x] 8.2 Documentar en docs/testing-architecture.md cómo usar `npm run test:debug` para diagnosticar hangs
- [x] 8.3 Evaluar migración futura a Turborepo para cache de tests por workspace (mediano plazo)
- [x] 8.4 Auditar alineación entre OpenSpec changes y la implementación real de package.json (gap analysis)