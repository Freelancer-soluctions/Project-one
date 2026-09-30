# Patrones DAO de seguridad para PATCH (referencia)

> Change OpenSpec: `add-patch-endpoints` (task 1.1). Base de la decisión:
> `openspec/changes/add-patch-endpoints/design.md` (Decision 3). Verificado contra
> el código real (2026-09-27): 21 módulos con `router.patch`, 22 mutaciones client.

Regla única de los tres patrones: **si el campo no viene en el body del PATCH, no se
toca nada; si viene, se ejecuta la operación completa.** Prisma ignora `undefined`
en escalares, pero NO en operaciones de relación (`deleteMany: {}` corre siempre).

## Patrón A — Campos escalares (spread)

Módulos: `warehouse`, `inventoryMovement` y cualquier DAO que haga spread directo.

```js
// Cero cambios de DAO necesarios: Prisma ignora undefined en escalares.
const updated = await prisma.warehouse.update({
  where: { id },
  data: { ...data },
});
```

## Patrón B — `connect` condicional

Relaciones FK simples (`productCategories`, `providers`, etc.):

```js
// Solo conecta si el campo vino en el body del PATCH.
...(data.productCategoryId !== undefined && {
  productCategories: { connect: { id: data.productCategoryId } },
}),
```

## Patrón C — `deleteMany` + `create` condicional (CRÍTICO)

Módulos afectados: `users` (userPermits), `sales` (saleDetail),
`purchase` (purchaseDetail), `notes` (hashtags).

Sin guard, `deleteMany: {}` borra TODAS las filas hijas aunque el PATCH solo
cambie, por ejemplo, el nombre:

```js
// ⚠️ INSEGURO para PATCH — corre aunque el campo no venga:
userPermits: {
  deleteMany: {},                    // ¡Borra todos los permisos!
  create: data.permissions.map(...), // ¡Crashea si permissions es undefined!
}
```

Guard correcto:

```js
// ✅ SEGURO — la relación solo se toca si el campo vino en el body.
...(data.permissions !== undefined && {
  userPermits: {
    deleteMany: {},
    create: data.permissions.map((p) => ({ ...p })),
  },
}),
```

## Cómo decidir qué patrón aplica a un módulo

1. Buscar el `update` del DAO del módulo.
2. Si solo hay escalares en `data` → Patrón A (no tocar DAO).
3. Si hay `connect`/`set` de FKs → Patrón B (envolver cada una en condicional).
4. Si hay `deleteMany` + `create` de relaciones anidadas → Patrón C (guard
   obligatorio alrededor de toda la operación de relación).
