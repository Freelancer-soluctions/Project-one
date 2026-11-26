# Tasks

## 1. Schema & Migration

- [x] 1.1 Update `clientOrderDetail.unitPrice` and `providerOrderDetail.estimatedPrice` to `Decimal @db.Decimal(18,2)` and add `total Decimal? @db.Decimal(18,2)` (nullable in expand step) to both orders; verify `prisma validate` passes
- [x] 1.2 Add `expectedDeliveryDate DateTime?` and `deliveredOn DateTime?` to both orders; verify migration SQL generated
- [x] 1.3 Create migration and apply locally; verify columns/types in DB
- [x] 1.4 Backfill `total` for any existing rows (none expected) and contract `total` to NOT NULL; verify
- [x] 1.5 Enable order permission codes in `apps/server/prisma/seed.ts` (uncomment + add `canDeleteClientOrder`/`canDeleteProviderOrder`, assign roles); re-run seed; verify RN-ORD-009 (401/403 paths)

## 2. Server Modules

- [x] 2.1 Create `clientOrder` TS module (dao/service/controller/routes) with details persistence; verify routes registered in `routes/v1/index.ts`
- [x] 2.2 Create `providerOrder` TS module analogously; verify
- [x] 2.3 Implement transactional total recompute on detail writes; verify unit test
- [x] 2.4 Implement status transition validation (RN-ORD-010/011) + deliveredOn auto-set (RN-ORD-005) + ADMIN manual override; verify
- [x] 2.5 Implement conversion flows (`POST /:id/convert`) persisting `saleId`/`purchaseId` in transaction; block delete when linked (409); verify
- [x] 2.6 Strip `saleId`/`purchaseId` from client-writable create/update Joi schemas (only conversion service writes them); verify validation test
- [x] 2.7 Create providerOrder Joi schemas and update clientOrder schemas (add `details[]` required, delivery dates, monetary precision reject >2dp); verify validation tests

## 3. Client

- [x] 3.1 Deduplicate the triplicated `providerOrder` route in `App.jsx` (lines 112, 113, 115); verify build
- [x] 3.2 Build details line-item editor (add/edit/remove rows: productId, quantity, price) in `ClientOrderDialog` and `ProviderOrdersDialog`; extend Zod schemas; verify
- [x] 3.3 Align client RTK types with string-typed Decimal money fields (unitPrice/estimatedPrice/total) and delivery dates; verify typecheck

## 4. Tests

- [x] 4.1 Unit tests for dao/service (totals, transitions, validation); verify pass
- [x] 4.2 Integration tests for endpoints (auth, CRUD, conversion, 409 delete); verify pass
- [x] 4.3 Client mutation/dialog tests (incl. details editor); verify pass
- [x] 4.4 E2E smoke: create client order with details → transition status → assert total/dates in UI; verify e2e run green

## 5. Verification

- [x] 5.1 Run `openspec validate revive-client-provider-orders`; verify no errors
- [x] 5.2 Run full test suite (server unit+integration, client, e2e smoke); verify green
- [x] 5.3 Update RTM in `docs/traceability/revive-client-provider-orders.md`; verify file exists
