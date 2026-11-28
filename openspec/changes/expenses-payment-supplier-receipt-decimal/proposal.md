# Proposal

## Why

`expenses` has `total: Float` (should be Decimal for money), no `paymentMethod`, no supplier/vendor (to whom paid), and no `receiptUrl` (attachment). Money precision is wrong; there is no traceability of who was paid or how, and no link to the payment evidence.

## What Changes

- Change `total` from `Float` to `Decimal(18,2)`.
- Add `paymentMethod paymentMethod?` (reuse existing enum).
- Add `providerId Int?` FK to `productProviders` (nullable).
- Add `receiptUrl String?` (URL to payment evidence; file-upload infrastructure is out of scope — URL-only in v1).
- Update encryption? none (no new sensitive fields).
- Update backend (types/dao/service/joi/controller/routes/openapi) and frontend (Zod/dialog/datatable/filters/fieldLimits/i18n/snapshots).

## Non-goals

- No file-upload infrastructure (receiptUrl is a URL string in v1).
- No payroll integration (expenses SALARIES category does not feed payroll).
- No status workflow (expenses has no status column today; `expenseCategory` is a category, not a status).

## Capabilities

### New Capabilities

- `expenses-payment-supplier-receipt`: payment method, supplier, receipt URL, Decimal total.

### Modified Capabilities

- (none)

## Impact

- **DB**: type change + 3 nullable columns + FK.
- **API/UI**: additive (old clients ignore new fields) except total type (Decimal serialized as string).
- **Risk**: migration type cast; frontend parsing.

## Riesgos

- R1: `DOUBLE PRECISION → NUMERIC` cast can fail on NaN/extreme precision.
- R2: frontend expects number for total; must parse Decimal string.
- R3: no expenses tests exist (0% coverage).

## Dependencias

- `productProviders` model (supplier catalog).
- Existing `paymentMethod` enum.
