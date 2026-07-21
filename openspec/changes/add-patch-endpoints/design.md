## Context

The backend currently implements 21 route modules with PUT endpoints (providerOrder excluded — see Task 1.2), all using `router.put()` for update operations. This creates an inconsistent REST API where some modules use optional-field Joi schemas on PUT (which should semantically be PATCH). The frontend is forced to send complete objects for every update with no support for partial updates. Analysis in `docs/api-rest-design-analysis.md` identifies: no PATCH support, inconsistent response formats, no 404 handling.

Enterprise REST practice (Microsoft REST Guidelines, GitHub API, Stripe API) recommends dual PUT + PATCH endpoints for proper HTTP verb semantics.

## Goals / Non-Goals

**Goals:**
- Add PATCH endpoints alongside existing PUT in all 23+ backend modules
- Create partial-update Joi schemas (`XxxUpdatePartial`) with all fields optional + `.min(1)`
- Implement conditional DAO `connect` patterns for safe partial updates
- Add frontend RTK Query `patchXxx` mutations per module
- Create shared `useChangedFields` hook for diff-based partial form submissions

**Non-Goals:**
- No changes to existing PUT endpoints or their schemas
- No 404 handling (separate change)
- No response format unification (separate change)

## Decisions

### Decision 1 — Dual endpoints, shared logic

```
PUT  /api/v1/products/{id}  → ProductsUpdate (all required)  → controller.updateById
PATCH /api/v1/products/{id} → ProductsUpdatePartial (optional + min(1)) → controller.updateById
```

Same controller, same service, same DAO. Only the Joi validation schema differs. This minimizes code duplication — the controller, service, and DAO already accept partial data structures; the validation layer is the only blocker.

### Decision 2 — Schema naming convention

```
ProductsUpdate (existing) → for PUT: all fields .required()
ProductsUpdatePartial (new) → for PATCH: all fields .optional() + .min(1)
```

Using the `Partial` suffix consistently across all 23+ modules. The `.min(1)` ensures at least one field is provided, preventing empty-body PATCH requests that would be no-ops.

### Decision 3 — DAO conditional patterns for partial safety

Three patterns exist in the codebase, each requiring different handling:

**Pattern A — Scalar fields (spread pattern):**
Modules like `warehouse`, `inventoryMovement` spread `data` directly into Prisma. These need **zero DAO changes** — Prisma ignores undefined.

**Pattern B — Conditional `connect`:**
```js
...(data.productCategoryId !== undefined && {
  productCategories: { connect: { id: data.productCategoryId } }
})
```

**Pattern C — `deleteMany` + `create` (CRITICAL):**
Found in: `users` (permissions), `sales` (saleDetail), `purchase` (purchaseDetail), `notes` (hashtags).
```js
// UNSAFE for PATCH — runs even when field absent, deleting data
userPermits: {
  deleteMany: {},           // ¡Borra todos los permisos!
  create: data.permissions.map(...) // ¡Crashea si permissions undefined!
}
```
For PATCH, wrap in conditional:
```js
...(data.permissions !== undefined && {
  userPermits: {
    deleteMany: {},
    create: data.permissions.map(...)
  }
})
```

The rule: **if the field is absent from the PATCH body, do nothing. If present, run the full operation.**

### Decision 4 — Frontend: useChangedFields hook

A utility hook that diffs initial vs current form values. Returns `{ changedFields, hasChanges, changedKeys }`.

**Comparison strategy:** Use inline deep equal implementation (avoid external dependency). lodash is not a dependency in `apps/client/package.json` and adding it for a single function is not justified. Implement a simple recursive comparison similar to `fast-deep-equal` pattern.

**Why a hook and not a utility function:** Hooks integrate naturally with React form state; can be memoized with useMemo internally.

### Decision 5 — RTK Query naming convention

```js
useUpdateProductByIdMutation  → PUT (existing, unchanged)
usePatchProductByIdMutation   → PATCH (new)
```

The `patch` verb prefix clearly distinguishes PATCH mutations from existing `update` prefix for PUT. Using `ById` suffix to match the existing convention (`updateXxxById`, `deleteXxxById`).

### Decision 6 — PUT vs PATCH decision rule

The frontend must decide which verb to use per request. The rule is:

| Scenario | Verb | Reason |
|----------|------|--------|
| Form has initial data + detects changed fields | **PATCH** | Send only the diff — smaller payload, explicit intent, avoids accidental overwrites |
| Form sends complete object (create-form, bulk operations) | **PUT** | Full replacement semantics — all fields are intentionally set |
| First-time save or no initial data to diff against | **PUT** | No baseline for diff; sending complete object is correct |
| Changed fields include relational deletes/recreates | **PATCH** | The diff naturally detects these; DAO handles them via conditional patterns |
| Only 1 field changed | **PATCH** | Optimal — minimal payload, clear intent |
| All fields changed | **Either** | Both are semantically correct. PATCH preferred for consistency with the hook pattern |

**Implementation rule in code:**
```js
// If useChangedFields is available and hasChanges:
//   → PATCH with changedFields
// Otherwise:
//   → PUT with full object

const { changedFields, hasChanges } = useChangedFields(initialValues, formValues);

if (editing && hasChanges) {
  await patchProductById({ id, data: changedFields });
} else if (editing) {
  await updateProductById({ id, data: formValues });
} else {
  await createProduct(formValues);
}
```

**Why not always PATCH?** PUT guarantees idempotency and full replacement. When the frontend has the complete object (e.g., after loading from GET and modifying), PUT is semantically correct. PATCH optimizes for payload size and intent clarity when the diff is meaningful. Both are valid; the frontend chooses based on context.

## Risks / Trade-offs

- **Risk**: PATCH might fail where PUT succeeds due to `undefined` fields hitting Prisma non-null constraints. **Mitigation**: All PATCH schemas use `.optional()` + `undefined` checks in DAO with conditional connect patterns.
- **Risk**: `deleteMany` + `create` patterns in DAOs (Users, Sales, Purchase, Notes) will **silently delete data** if the field is absent from PATCH body. **Mitigation**: Wrap these operations in `if (data.field !== undefined)` checks. Documented in Decision 3 Pattern C.
- **Risk**: Increased API surface doubles the number of update endpoints. **Mitigation**: Shared route handler logic means zero new controller/service/DAO code — only schema + route registration.
- **Risk**: PATCH inherits the inconsistent response format from each module's PUT (some return message, some return resource). **Mitigation**: Acceptable as scoping decision. PATCH responses match whatever the module's PUT returns.
- **Risk**: Frontend form submissions might accidentally use PATCH where PUT is expected. **Mitigation**: PUT endpoints remain unchanged; PATCH is additive only. Forms that need full updates continue using existing PUT mutations. Decision 6 provides clear rules for verb selection.

## Post-Implementation Bug: `id` field leaks into POST creation payload

**Discovered**: 2026-06-08, after implementation complete.

**Root cause**: 19 dialog useEffect blocks include `id: selectedRow.id || ''` in `mappedValues` passed to `form.reset()`. When creating a new record, `selectedRow` is `{}` (truthy but no id), so `id: ''` gets inserted into form state. On submit in creation mode, the form data (including `id: ''`) is sent to POST endpoint. Backend `validateSchema` middleware uses Joi with `allowUnknown: false`, rejecting the unexpected `id` field.

**Affected modules (5 with bug active):**
- `events/EventDialog.jsx` — guard is `if (event)` without `?.id`
- `warehouse/WarehouseDialog.jsx` — guard is `if (selectedRow)` without `?.id`
- `news/NewsDialog.jsx` — guard is `if (selectedRow)` without `?.id`
- `settingsProductCategories/...` — guard is `if (selectedRow)` without `?.id`
- `stock/StockDialog.jsx` — guard is `if (selectedRow.id)` (crashes if null)

**14 additional files** already have `if (selectedRow?.id)` guard so the bug doesn't manifest, but still include unnecessary `id` in mappedValues.

**Fix**: 
1. Remove `id` from `mappedValues` in all 19 dialog files
2. Fix useEffect guard in the 5 unprotected files to use `if (selectedRow?.id)`
3. No impact on update flow — `id` is never a dirty field (no corresponding UI input), and edit mode uses `pickDirty` which only extracts dirty fields

**Proof of safety**: `InventoryMovementDialog.jsx` already omits `id` from mappedValues and works correctly for both create and update.
