# Design

## Context

See proposal.md — Why. Current state: `clientOrder`/`providerOrder` Prisma models exist but money columns are `Float`, no `total`/delivery dates, `saleId`/`purchaseId` never persisted, and the server module was deleted (never mounted). Frontend (`apps/client/src/modules/clientOrder`, `providerOrder`) already wired to `/api/v1/...`.

## Goals / Non-Goals

**Goals:**

- Revive both order modules in TS following layered architecture (routes → controller → service → dao).
- Fix monetary types and add total + delivery dates + conversion links.
- Transactional total maintenance.
- Auth/permission enforcement consistent with other modules.

**Non-Goals:**

- Invoicing/tax/discounts (out of product scope).
- Multi-currency, partial shipments.

## Decisions

### D1 — Monetary type: Decimal(18,2)

Use `Decimal @db.Decimal(18,2)` for `unitPrice`, `estimatedPrice`, and `total`, matching `sale`/`purchase`/`products`. Alternative (Float) rejected: IEEE-754 rounding and lossy conversion to sale/purchase.

### D2 — Total stored, not computed on read

Store `total` and recompute in the same transaction as detail writes. Alternative (compute on read) rejected: audit consistency and conversion snapshot.

### D3 — Delivery dates nullable

`expectedDeliveryDate DateTime?` and `deliveredOn DateTime?`. `deliveredOn` auto-set on transition to RECEIVED/COMPLETED; manual override allowed for ADMIN.

### D4 — Conversion link persistence

Conversion is triggered by `POST /api/v1/clientOrder/:id/convert` (creates a `sale`, sets `clientOrder.saleId`) and `POST /api/v1/providerOrder/:id/convert` (creates a `purchase`, sets `providerOrder.purchaseId`), both within a transaction; block delete when linked (409). Only the conversion service writes these links.

### D5 — Status transitions validated server-side

Allowed transitions: PENDING→PROCESSING→SHIPPED→RECEIVED→COMPLETED; any→CANCELLED (except COMPLETED). Enforced in service.

## Risks / Trade-offs

- [Float→Decimal migration on stray rows] → cast `::DECIMAL(18,2)`; data volume effectively zero.
- [Prisma Decimal serializes to JSON string] → client RTK types/Zod/DataTable must treat money as string; conversion via Decimal.js on client.
- [RBAC permissions may not exist] → verify seed; add `clientOrder`/`providerOrder` permission codes if missing.
- [Frontend API assumes shapes] → keep response shape aligned with existing client RTK (camelCase).

## Migration Plan (expand/contract)

1. Add new columns (`total`, `expectedDeliveryDate`, `deliveredOn`) as nullable with defaults.
2. Alter `unitPrice`/`estimatedPrice` type to DECIMAL (expand).
3. Deploy server module.
4. Backfill totals for any existing rows (none expected).
5. Contract: make `total` NOT NULL after backfill.

Rollback: Prisma has no automatic down migrations; rollback is a manual SQL script restoring Float columns (or forward-fix), acceptable given zero data volume.

## Threat Model

- Auth: all endpoints behind `verifyToken` + `checkRoleAuthOrPermisssion`. Fail-closed.
- Input: Joi validation for `details[]`, quantities, monetary precision; prevent negative prices.
- Data: no PII in orders beyond client/supplier refs; audit fields createdBy/updatedBy.
- Concurrency: total recomputed within transaction; optimistic locking not added (out of scope).

## Open Questions

- None blocking. Permission code naming to confirm during implementation.
