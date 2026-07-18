## 1. E2E Testing Setup

- [ ] 1.1 Verify Playwright configuration in e2e/playwright.config.js
- [ ] 1.2 Create e2e/tests/specs/ directory structure
- [ ] 1.3 Create first E2E test: login.spec.js (login flow)
- [ ] 1.4 Create E2E test: logout.spec.js (logout flow)
- [ ] 1.5 Create E2E test: dashboard.spec.js (dashboard access)
- [ ] 1.6 Create E2E test: users-crud.spec.js (user management)
- [ ] 1.7 Create E2E test: sales-view.spec.js (view sales records)

## 2. Smoke Testing Implementation

- [ ] 2.1 Create smoke tests in apps/server/tests/smoke/
- [ ] 2.2 Add server health check test
- [ ] 2.3 Add database connectivity test
- [ ] 2.4 Add authentication endpoint test
- [ ] 2.5 Add critical API endpoints test
- [ ] 2.6 Add test:smoke script to package.json
- [ ] 2.7 Add test:smoke:ci script for CI/CD

## 3. Regression Testing Setup

- [ ] 3.1 Identify core regression test suite (existing unit + integration)
- [ ] 3.2 Create test:regression script in package.json
- [ ] 3.3 Configure pre-commit hook to run regression tests
- [ ] 3.4 Add lint-staged integration for regression in package.json

## 4. Documentation Update

- [ ] 4.1 Update docs/testing-architecture.md - add Section 12: Smoke Testing
- [ ] 4.2 Update docs/testing-architecture.md - add Section 13: Regression Testing
- [ ] 4.3 Update docs/testing-architecture.md - add Section 14: Priority Testing (ERP modules)
- [ ] 4.4 Update docs/testing-architecture.md - add Section 15: E2E Setup Guide
- [ ] 4.5 Update docs/testing-architecture.md - add Section 16: Coverage Targets

## 5. Verification

- [ ] 5.1 Run npm run test:e2e to verify E2E tests work
- [ ] 5.2 Run npm run test:smoke to verify smoke tests work
- [ ] 5.3 Verify regression tests run on pre-commit
- [ ] 5.4 Verify all documentation changes are complete
