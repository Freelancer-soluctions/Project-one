# Regression Test Suite — Core Modules Definition

This document defines the **core regression test suite** for the server-express backend. The regression suite runs on every pre-commit hook to prevent regressions in critical business functionality.

---

## 🎯 Suite Composition

The regression test suite = **Unit Tests + Integration Tests** for **Critical Modules** (priority 1) and **Business Modules** (priority 2).

> **Current State (2025-07-28):** Critical modules (sales, payroll, users) do **not yet have tests**. The regression suite currently falls back to running the **full unit test suite** (`*.unit.test.js`) + available integration tests. This is the "minimal viable" regression suite. As tests are added to critical modules, the suite will automatically include them.

---

## 📋 Priority 1 — Critical Modules (Must Pass)

| Module | Path | Unit Tests | Integration Tests | Status |
|--------|------|------------|-------------------|--------|
| **Sales** | `src/modules/sales/` | ❌ None yet | ❌ None yet | ⚠️ Needs tests |
| **Payroll** | `src/modules/payroll/` | ❌ None yet | ❌ None yet | ⚠️ Needs tests |
| **Users** | `src/modules/users/` | ❌ None yet | ❌ None yet | ⚠️ Needs tests |

> **Fallback behavior:** Until these modules have tests, the regression suite runs ALL unit tests (`src/**/*.unit.test.js`) + ALL integration tests (`tests/integration/**/*.integration.test.js`).

---

## 📋 Priority 2 — Business Modules (Should Pass)

| Module | Path | Unit Tests | Integration Tests | Status |
|--------|------|------------|-------------------|--------|
| Inventory | `src/modules/inventory/` / `stock/` / `warehouse/` | ❌ | ❌ | ⚠️ Needs tests |
| Employees | `src/modules/employees/` | ❌ | ❌ | ⚠️ Needs tests |
| Attendance | `src/modules/attendance/` | ❌ | ❌ | ⚠️ Needs tests |
| Clients | `src/modules/clients/` | ❌ | ❌ | ⚠️ Needs tests |
| Products | `src/modules/products/` | ❌ | ❌ | ⚠️ Needs tests |
| Providers | `src/modules/providers/` | ❌ | ❌ | ⚠️ Needs tests |
| Events | `src/modules/events/` | ✅ 12 tests | ✅ 2 tests (events/) | ✅ Covered |
| Notes | `src/modules/notes/` | ✅ 2 tests | ✅ 2 tests (notes/) | ✅ Covered |

---

## 📋 Currently Covered (Existing Tests)

| Module | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| Events | 12 (RSVP, DAO, Service, Validation) | 2 (Combined filters, Soft delete) |
| Notes | 2 (Mention parser, Mentions utils) | 2 (Mentions) |

> **Note:** Unit tests are colocated with source (`src/modules/**/*.unit.test.js`). Integration tests are grouped by module in `tests/integration/<module>/`.

---

## 🚀 Running the Regression Suite

```bash
# From root (delegates to server workspace)
npm run test:regression

# From server workspace directly
npm run test:regression
```

The script runs:
```bash
vitest run --config apps/server/vitest.config.js \
  "src/**/*.unit.test.js" \
  "tests/integration/**/*.integration.test.js"
```

---

## 🔧 Pre-Commit Integration

The regression suite runs automatically on `git commit` via `.husky/pre-commit`:

```bash
# Regression tests (fast suite)
npm run test:regression || { echo "❌ Regression tests failed."; exit 1; }
```

**Runs in parallel** with SAST (Semgrep) and secret detection (Gitleaks) — not sequentially.

---

## 📝 Adding Tests to Critical Modules

When adding tests to critical modules (sales, payroll, users), place them in the standard locations:

- **Unit tests** → `src/modules/<module>/<feature>.unit.test.js` (colocated)
- **Integration tests** → `tests/integration/<module>/<feature>.integration.test.js`

They will be **automatically picked up** by the regression suite — no script changes needed.

---

## 📚 Related

- [Testing Architecture](../../docs/testing-architecture.md) — Hybrid test organization
- [Vitest Config](../../apps/server/vitest.config.js) — Test discovery patterns
- [Pre-commit Hook](../../.husky/pre-commit) — Hook orchestration