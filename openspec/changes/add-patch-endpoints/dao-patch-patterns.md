# DAO PATCH-safety Pattern Reference

This document describes the three patterns for safely handling partial updates (PATCH) in DAO modules when using Prisma.

## Pattern A — Scalar spread (zero changes)

**Modules:** warehouse, inventoryMovement, payroll, vacation, news, events

These modules spread the `data` object directly into Prisma create/update operations. Since Prisma ignores `undefined` values, no changes are needed for PATCH safety.

Example:
```js
await prisma.warehouse.update({
  where: { id },
  data: { ...data } // Undefined fields are ignored by Prisma
})
```

## Pattern B — Conditional connect

**Modules:** products, stock, clients, employees, providers, expenses, attendance, permission, performanceEvaluation, settings

For scalar relations (foreign keys), we conditionally include the `connect` operation only when the ID field is present in the data.

Example:
```js
...(data.productCategoryId !== undefined && {
  productCategories: { connect: { id: data.productCategoryId } }
})
```

## Pattern C — Conditional deleteMany + create

**Modules:** 
- users (permissions → userPermits)
- sales (saleDetail → saleDetail)
- purchase (purchaseDetail → purchaseDetail)
- notes (hashtags → hashtags)

For array relations that require replacement (delete all existing then create new), we wrap the entire operation in a conditional check for the presence of the array field.

Example:
```js
...(data.permissions !== undefined && {
  userPermits: {
    deleteMany: {},
    create: data.permissions.map(permission => ({ ... }))
  }
})
```

**Critical Safety Note:** Without the conditional check, absent fields would cause:
1. Unintentional deletion of all related records (`deleteMany: {}`)
2. Runtime errors when trying to map over `undefined` (`data.permissions.map(...)`)

The pattern ensures that if the field is absent from the PATCH body, no operation is performed on the relation.