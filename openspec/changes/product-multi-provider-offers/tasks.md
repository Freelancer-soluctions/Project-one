# Tasks

## 1. Schema & Migration

- [ ] 1.1 Add `productProviderOffer` model + nullable `primaryOfferId` FK on products + make legacy `productProviderId` nullable (Int?); verify `prisma validate`
- [ ] 1.2 Create migration and apply locally; verify
- [ ] 1.3 Backfill one offer per product from legacy field; verify
- [ ] 1.4 Regenerate Prisma client; verify

## 2. Backend

- [ ] 2.1 Create offer CRUD endpoints (add/remove/set primary) + dao/service/controller/routes; verify
- [ ] 2.2 Update product types/Joi/read paths (prefer primary offer, fallback); verify
- [ ] 2.3 Update product create/update to write offers; verify
- [ ] 2.4 Update stock dao valuation (primary offer cost fallback); verify
- [ ] 2.5 Update OpenAPI/schemas.ts; run openapi:generate; verify

## 3. Frontend

- [ ] 3.1a Offer editor component: add/remove/set primary/active per offer; verify
- [ ] 3.1b Form state: dynamic offer list + dirty tracking; verify
- [ ] 3.1c 409/duplicate-provider handling in editor; verify
- [ ] 3.2 RTK Query offer endpoints + hooks + cache tags in productsAPI.js; verify
- [ ] 3.3 Rewrite toProductPayload (ProductsForms.jsx) to send offers array; decide top-level price/cost semantics; verify
- [ ] 3.4 ProductsDatatable: primary provider/offer columns + fixtures + snapshots; verify
- [ ] 3.5 Zod offers array validation + fieldLimits for offer fields; verify
- [ ] 3.6 i18n keys (en/es) for offer editor labels/placeholders/validation; verify
- [ ] 3.7 Provider filter semantics for multi-provider products (ProductsFiltersForm); verify
- [ ] 3.8 Stock frontend alignment (StockDatatable/StockDialog fields) with valuation change; verify
- [ ] 3.9 Frontend unit/integration tests for offer editor + datatable; verify

## 4. Tests

- [ ] 4.1 Update integration tests (product seeding with offers); verify pass
- [ ] 4.2 Unit tests for offer CRUD/primary; verify pass

## 5. Verification

- [ ] 5.1 Run `openspec validate product-multi-provider-offers`; verify no errors
- [ ] 5.2 Run full test suite; verify green
