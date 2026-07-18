## 1. Setup

- [x] 1.1 Create i18n runtime resolver helper for Zod schemas at `apps/client/src/utils/zod-i18n-map.js`
- [x] 1.2 Define validation message key naming convention using module-prefixed flat keys
- [x] 1.3 Set up Zod error map integration with i18n instance in app startup

## 2. Zod Schema Migration

- [x] 2.1 Migrate auth module schema to use translation keys (`apps/client/src/modules/auth/utils/schema.js`)
- [x] 2.2 Migrate notes module schema to use translation keys (`apps/client/src/modules/notes/utils/schema.js`)
- [x] 2.3 Migrate users module schema to use translation keys (`apps/client/src/modules/users/utils/schema.js`)
- [x] 2.4 Migrate products module schema to use translation keys (`apps/client/src/modules/products/utils/schema.js`)
- [x] 2.5 Migrate providers module schema to use translation keys (`apps/client/src/modules/Providers/utils/schema.js`)
- [x] 2.6 Migrate warehouse module schema to use translation keys (`apps/client/src/modules/warehouse/utils/schema.js`)
- [x] 2.7 Migrate stock module schema to use translation keys (`apps/client/src/modules/stock/utils/schema.js`)
- [x] 2.8 Migrate sales module schema to use translation keys (`apps/client/src/modules/sales/utils/schema.js`)
- [x] 2.9 Migrate purchase module schema to use translation keys (`apps/client/src/modules/purchase/utils/schema.js`)
- [x] 2.10 Migrate clients module schema to use translation keys (`apps/client/src/modules/clients/utils/schema.js`)
- [x] 2.11 Migrate employees module schema to use translation keys (`apps/client/src/modules/employees/utils/schema.js`)
- [x] 2.12 Migrate events module schema to use translation keys (`apps/client/src/modules/events/utils/schema.js`)
- [x] 2.13 Migrate expenses module schema to use translation keys (`apps/client/src/modules/expenses/utils/schema.js`)
- [x] 2.14 Migrate payroll module schema to use translation keys (`apps/client/src/modules/payroll/utils/schema.js`)
- [x] 2.15 Migrate performanceEvaluation module schema to use translation keys (`apps/client/src/modules/performanceEvaluation/utils/schema.js`)
- [x] 2.16 Migrate permission module schema to use translation keys (`apps/client/src/modules/permission/utils/schema.js`)
- [x] 2.17 Migrate vacation module schema to use translation keys (`apps/client/src/modules/vacation/utils/schema.js`)
- [x] 2.18 Migrate attendance module schema to use translation keys (`apps/client/src/modules/attendance/utils/schema.js`)
- [x] 2.19 Migrate inventoryMovement module schema to use translation keys (`apps/client/src/modules/inventoryMovement/utils/schema.js`)
- [x] 2.20 Migrate providerOrder module schema to use translation keys (`apps/client/src/modules/providerOrder/utils/schema.js`)
- [x] 2.21 Migrate clientOrder module schema to use translation keys (`apps/client/src/modules/clientOrder/utils/schema.js`)
- [x] 2.22 Migrate settingsProductCategories module schema to use translation keys (`apps/client/src/modules/settingsProductCategories/utils/schema.js`)
- [x] 2.23 Migrate news module schema to use translation keys (`apps/client/src/modules/news/utils/schema.js`)

## 3. Business Module i18n

- [x] 3.1 Scan and migrate hard-coded strings in auth module pages (`apps/client/src/modules/auth/pages/`)
- [x] 3.2 Scan and migrate hard-coded strings in notes module pages (`apps/client/src/modules/notes/pages/`)
- [x] 3.3 Scan and migrate hard-coded strings in users module pages (`apps/client/src/modules/users/pages/`)
- [x] 3.4 Scan and migrate hard-coded strings in products module pages (`apps/client/src/modules/products/pages/`)
- [x] 3.5 Scan and to migrate hard-coded strings in providers module pages (`apps/client/src/modules/providers/pages/`)
- [x] 3.6 Scan and migrate hard-coded strings in warehouse module pages (`apps/client/src/modules/warehouse/pages/`)
- [x] 3.7 Scan and migrate hard-coded strings in stock module pages (`apps/client/src/modules/stock/pages/`)
- [x] 3.8 Scan and migrate hard-coded strings in sales module pages (`apps/client/src/modules/sales/pages/`)
- [x] 3.9 Scan and migrate hard-coded strings in purchase module pages (`apps/client/src/modules/purchase/pages/`)
- [x] 3.10 Scan and migrate hard-coded strings in clients module pages (`apps/client/src/modules/clients/pages/`)
- [x] 3.11 Scan and migrate hard-coded strings in employees module pages (`apps/client/src/modules/employees/pages/`)
- [x] 3.12 Scan and migrate hard-coded strings in events module pages (`apps/client/src/modules/events/pages/`)
- [x] 3.13 Scan and migrate hard-coded strings in expenses module pages (`apps/client/src/modules/expenses/pages/`)
- [x] 3.14 Scan and migrate hard-coded strings in payroll module pages (`apps/client/src/modules/payroll/pages/`)
- [x] 3.15 Scan and migrate hard-coded strings in performanceEvaluation module pages (`apps/client/src/modules/performanceEvaluation/pages/`)
- [x] 3.16 Scan and migrate hard-coded strings in permission module pages (`apps/client/src/modules/permission/pages/`)
- [x] 3.17 Scan and migrate hard-coded strings in vacation module pages (`apps/client/src/modules/vacation/pages/`)
- [x] 3.18 Scan and migrate hard-coded strings in attendance module pages (`apps/client/src/modules/attendance/pages/`)
- [x] 3.19 Scan and migrate hard-coded strings in inventoryMovement module pages (`apps/client/src/modules/inventoryMovement/pages/`)
- [x] 3.20 Scan and migrate hard-coded strings in providerOrder module pages (`apps/client/src/modules/providerOrder/pages/`)
- [x] 3.21 Scan and migrate hard-coded strings in clientOrder module pages (`apps/client/src/modules/clientOrder/pages/`)
- [x] 3.22 Scan and migrate hard-coded strings in settingsProductCategories module pages (`apps/client/src/modules/settingsProductCategories/pages/`)
- [x] 3.23 Scan and migrate hard-coded strings in news module pages (`apps/client/src/modules/news/pages/`)
- [x] 3.24 Scan and migrate hard-coded strings in settings module pages (`apps/client/src/modules/settings/pages/`)
- [x] 3.25 Scan and migrate hard-coded strings in home module pages (`apps/client/src/modules/home/pages/`)

## 4. Locale Files

- [x] 4.1 Add all new Zod validation message keys to `apps/client/src/locale/en.json`
- [x] 4.2 Add all new business module translation keys to `apps/client/src/locale/en.json`
- [x] 4.3 Add all new Zod validation message keys to `apps/client/src/locale/es.json`
- [x] 4.4 Add all new business module translation keys to `apps/client/src/locale/es.json`
- [x] 4.5 Complete ES translations for existing EN keys (extend es.json from 41 lines to match en.json coverage)
- [x] 4.6 Verify es.json coverage matches en.json keys (audit and fill all missing translations)

## 5. Testing

- [x] 5.1 Update test mocks for i18n in `apps/client/src/tests/setup/`
- [x] 5.2 Verify Zod validation messages display in current language (manual or automated test)
- [x] 5.3 Run full test suite (`cd apps/client && npm run test:run`) to ensure no regressions
- [x] 5.4 Run lint check (`cd apps/client && npm run lint`) to ensure code quality
