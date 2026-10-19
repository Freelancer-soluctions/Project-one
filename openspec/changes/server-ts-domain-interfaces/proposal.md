# Proposal

> Change hijo de `openspec/changes/server-typescript-migration/`. Requiere migración total completa (2026-10-18: 0 `.js` ejecutables, 235/236 `.ts`). No convierte archivos — **añade los contratos de dominio que la conversión dejó implícitos**.

## Why

La migración total convirtió 235 archivos a `.ts` pero el tipado resultante es **inferido**: los dao/service devuelven `Prisma.<Model>GetPayload`/`Awaited<ReturnType<...>>` sin contratos de dominio explícitos. Verificado (2026-10-18): solo **11 `export interface/type`** en todo `src/` — 0 en los 23 módulos. Consecuencias:

1. **Contratos invisibles**: un cambio de schema de Prisma rompe service/controller en runtime silenciosamente — con interfaces de dominio el compilador lo detecta.
2. **Duplicación de shapes**: cada función re-declara inline su objeto de entrada (params type literals) — mantenimiento triple.
3. **Fronteras de módulo blandas**: sin tipos propios, nada impide que un módulo consuma tipos internos de otro (acoplamiento encubierto).

El principio **autocontenido** (decisión del usuario, 2026-10-18): las interfaces de `notes` viven dentro de `notes` — cada módulo es dueño de su contrato y ningún `types/` global cruza módulos.

## What Changes

- **`src/modules/<modulo>/types.ts`** nuevo por módulo (24 archivos) con: `<Entity>` (shape de fila alineado a Prisma), `Create<Entity>Input`, `Update<Entity>Input`, `<Entity>Filters`/`Query`, y los tipos de resultado del service.
- **Refactor de firmas** (cero comportamiento): dao/service/controller reemplazan type-literals inline por imports de `./types.js`; `Prisma.<Model>WhereInput` se mantiene donde es idiomático Prisma, pero las FRONTERAS públicas (lo que devuelve service / recibe controller) quedan tipadas con el contrato del módulo.
- **Orden**: mismo de riesgo de F2 (settings → attendance → news → users → auth → events → resto) — un módulo = un lote con gates.
- **Regla de dependencia**: `types.ts` SOLO importa de Prisma (`@prisma/client`), joi, y primitivas — **nunca de otro módulo** (verificable con depcruise: regla nueva opcional `module-isolation`).

**Fuera de alcance**: middleware/socket/utils (ya tipados en F3 con sus contratos propios: `RequestHandler`, `AuthenticatedSocket`), cambios de comportamiento, validación runtime de env.

## Capabilities

### New Capabilities

- `server-ts-module-contracts`: Interfaces de dominio autocontenidas por módulo. Cubre la estructura `types.ts` (Entity/Create/Update/Filters + resultados de service), la regla de aislamiento entre módulos (import solo de Prisma/joi/primitivas), el refactor de firmas sin cambio de comportamiento y los gates por lote.

## Impact

| File                                                             | Change                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/modules/*/types.ts` (23 nuevos — 22 dirs + events/attendee) | contrato de dominio del módulo                               |
| `src/modules/*/dao.ts`, `service.ts`, `controller.ts` (72)       | imports de `./types.js` reemplazan type-literals inline      |
| `.dependency-cruiser.cjs` (raíz)                                 | opcional: regla `module-isolation` (tipos no cruzan módulos) |
| `docs/CONTEXT-CICD.md` §12.2                                     | nota de contratos (24/23 módulos con types.ts)               |

**Riesgos**: (1) desalineación Entity↔Prisma schema — mitigada con `satisfies Prisma.<Model>GetPayload<{select: ...}>`-checks o derivación `Prisma.<Model>GetPayload`; (2) churn masivo de imports — mitigado por lote con gates; (3) tentación de `any` en gaps del schema — prohibido por protocolo del padre.
