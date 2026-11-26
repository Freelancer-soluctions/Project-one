# Design

## Context

See proposal.md. Current `sale`/`purchase` models (schema.prisma:488,515) store only `total`. Existing patterns: `orderStatus` enum on orders, payroll/expenses status enums, events/stateMachine.ts transitions.

## Goals / Non-Goals

**Goals:** Add status/payment/invoice to sale & purchase; cancel-with-reversal; filters.
**Non-Goals:** Full accounting ledger, multi-currency, partial payments, tax.

## Decisions

### D1 — Dedicated enums

New `saleStatus` and `purchaseStatus` (not reusing `orderStatus` whose SHIPPED/RECEIVED don't fit a sale). `paymentMethod` enum: CASH, CARD, TRANSFER, OTHER.

### D2 — Cancel over delete

Replace hard delete with status=CANCELLED + compensating ADJUSTMENT movements (only when linked movements exist); keep delete for admin cleanup. Sale/purchase creation does NOT create inventory movements (out of scope; inventory is managed via the separate inventoryMovement module).

### D3 — Backfill defaults

Existing rows → PAID (preserve historical revenue reports).

### D4 — invoiceNumber uniqueness

Global unique on sale; per-supplier on purchase (confirm during impl).

## Risks / Trade-offs

- [Cancel-reversal double counting] → only write compensating movements when movements exist; idempotent transition guard.
- [Backfill hides unpaid history] → documented in proposal.

## Migration Plan

1. Add enums + nullable columns with defaults.
2. Backfill existing rows to PAID.
3. Contract: make status NOT NULL.

Rollback: manual SQL (Prisma no auto-down).

## Threat Model

Auth fail-closed; input validation via Joi; no PII beyond refs.
