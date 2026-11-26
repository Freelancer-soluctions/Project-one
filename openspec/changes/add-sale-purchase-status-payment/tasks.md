# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `saleStatus` and `purchaseStatus` enums and `status/paymentMethod/paidAt/invoiceNumber` columns (nullable expand); verify `prisma validate`
- [ ] 1.2 Backfill existing rows to PAID; contract `status` to NOT NULL; verify migration

## 2. Server

- [ ] 2.1 Implement state machine for sale/purchase transitions (reuse events/stateMachine.ts pattern); verify unit tests
- [ ] 2.2 Update create/update service to handle paymentMethod/invoiceNumber; add `PATCH /:id/status` transition endpoint (status not client-settable on create); auto-set paidAt; verify
- [ ] 2.3 Implement cancel flow writing compensating ADJUSTMENT movements (idempotent guard: cannot cancel twice); verify integration
- [ ] 2.4 Update Joi schemas (create/update/filters) for both modules; verify validation tests
- [ ] 2.5 Update dao where-clauses for status filter; verify

## 3. Docs & Client

- [ ] 3.1 Update OpenAPI schemas.ts for sale/purchase; verify
- [ ] 3.2 Align client types/filters with new fields; verify typecheck

## 4. Tests

- [ ] 4.1 Unit tests for state machine; verify pass
- [ ] 4.2 Integration tests for cancel-reversal; verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate add-sale-purchase-status-payment`; verify no errors
- [ ] 5.2 Run full test suite; verify green
