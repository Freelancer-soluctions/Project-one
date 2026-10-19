# Design

> Hereda el protocolo del padre (un archivo = un commit, sin `any`, gates por lote). Este design define el patrón `types.ts` y la regla de aislamiento.

## Decisión 1 — `types.ts` autocontenido: estructura canónica

Cada módulo recibe `src/modules/<modulo>/types.ts` con EXACTAMENTE estas secciones (en orden):

```ts
// 1. Entidad — shape de fila, derivado de Prisma (fuente de verdad del schema)
export type <Entity> = Prisma.<Model>GetPayload<object>;

// 2. Inputs de escritura — lo que el service RECIBE (no Prisma.CreateInput crudo)
export interface Create<Entity>Input { /* campos del body validado por Joi */ }
export interface Update<Entity>Input extends Partial<Create<Entity>Input> {}

// 3. Query/filtros — lo que controller extrae de req.query
export interface <Entity>Filters { page?: number; limit?: number; searchQuery?: string; /* ... */ }

// 4. Resultados de service — las fronteras públicas
export interface <Entity>ServiceResult { data: <Entity>[]; total: number; page: number; pageSize: number; }
```

Reglas: (a) `<Entity>` se DERIVA de Prisma (`GetPayload`) — nunca duplicado a mano (si el schema cambia, el tipo cambia solo); (b) los Inputs son interfaces ESCRITAS a mano (contrato de API, no derivado — el Joi valida en runtime, la interfaz documenta); (c) nada de tipos de OTROS módulos.

## Decisión 2 — Regla de aislamiento entre módulos (autocontenido = verificable)

`types.ts` SOLO puede importar: `@prisma/client`, `joi`, tipos de `src/utils/constants/enums.js`, y primitivas. **Prohibido importar de otro `modules/*`.** Verificación: (a) grep en el gate del lote (`grep -rn "from '\.\./" apps/server/src/modules/*/types.ts` → solo `../../utils/constants`); (b) opcional-posterior: regla dependency-cruiser `module-isolation` (no bloqueante este change — se propone, no se implementa, para no mezclar).

Casos límite: submódulo `events/attendee` recibe SU propio `types.ts` (es módulo de facto); módulos sin dao (security: solo routes) reciben types mínimos de su superficie; `notes/utils/*` (colorMapper, mentionParser) — tipos viven en `notes/types.ts` (el util es interno del módulo).

## Decisión 3 — Refactor de firmas: fronteras sí, Prisma-idiomático también

- **dao.ts**: parámetros tipados con `<Entity>Filters`/Inputs del módulo; el `where` interno sigue siendo `Prisma.<Model>WhereInput` (idiomático Prisma, NO se abstrae).
- **service.ts**: firmas públicas → Inputs/Filters/ServiceResult del módulo; los tipos intermedios inferidos se dejan.
- **controller.ts**: `req.body`/`req.query` casteados UNA vez a los Inputs/Filters del módulo (`req.body as CreateXInput` — cast controlado documentado, sin `any`).
- **routes.ts**: sin cambios (delega).
- Tests colocalizados: imports de types opcionales (solo si el test lo aprovecha) — no obligatorio en este change.

## Decisión 4 — Un módulo = un lote = un commit de types + N commits de refactor

Commit 1: `feat(server): add <modulo> domain types (types.ts)`. Commits siguientes: refactor de dao/service/controller por archivo (`refactor(server): type <modulo> <layer> with domain types`). Gates tras el módulo completo (los 4). Si un gate falla, el módulo se revierte entero (los commits son atómicos por archivo, el lote por módulo).

## Decisión 5 — Orden y riesgo

Mismo orden de F2: settings (patrón de referencia — CRUD puro) → attendance → news → users → auth → events (el más grande: + attendee + stateMachine ya tipado) → resto alfabético (19). El primer módulo valida el patrón ANTES de replicarlo; si el patrón necesita ajuste, se ajusta en settings y se re-revisa el design antes de continuar.

## Decisión 6 — Cierre y métrica

Cierre: 24/24 módulos con `types.ts` (verifiable: `ls apps/server/src/modules/*/types.ts | wc -l` ≥ 24 con attendee), 0 `any` nuevos, gates verdes, contador en `docs/CONTEXT-CICD.md` §12.2 ("24/24 módulos con contratos de dominio"), `validate --strict` PASS.
