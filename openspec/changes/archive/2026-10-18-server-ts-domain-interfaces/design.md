# Design

> Hereda el protocolo del padre (un archivo = un commit, sin `any`, gates por lote). Este design define el patrón `types.ts` y la regla de aislamiento.

## Decisión 1 — `types.ts` autocontenido: estructura canónica

Cada módulo recibe `src/modules/<modulo>/types.ts` con estas secciones (en orden). **Precedencia (enmendado tras validar el patrón en settings, 2026-10-18):** el shape de `ServiceResult` ESPEJA la respuesta real existente del módulo — la regla zero-behavior-change prima sobre la uniformidad de la plantilla; y los Inputs de API (body Joi) se separan de los payloads de persistencia del dao (`Data`) cuando el módulo los distingue:

```ts
// 1. Entidad — shape de fila, derivado de Prisma (fuente de verdad del schema)
export type <Entity> = Prisma.<Model>GetPayload<object>;

// 2. Inputs de escritura — lo que el service RECIBE (contrato de API, escrito a mano)
export interface Create<Entity>Input { /* campos del body validado por Joi */ }
export interface Update<Entity>Input extends Partial<Create<Entity>Input> {}
// (si el dao necesita un payload de persistencia distinto del body:
//  <Entity><Layer>Data — p.ej. SettingLanguageData con createdOn/updatedOn)

// 3. Query/filtros — lo que controller extrae de req.query
export interface <Entity>Filters { page?: number; limit?: number; searchQuery?: string; /* ... */ }

// 4. Resultados de service — ESPEJAN la respuesta real del módulo
//    (settings: { dataList, total } — NO forzar { data, total, page, pageSize })
export interface <Entity>ServiceResult { /* shape real del módulo */ }
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

**Inventario real (verificado por @planner 2026-10-18): 23 módulos** — 22 directorios en `src/modules/` + submódulo `events/attendee`. Cierre: `find apps/server/src/modules -name types.ts | wc -l` ≥ 23 (el glob `*/types.ts` NO incluye attendee), 0 `any` nuevos, gates verdes, contador en `docs/CONTEXT-CICD.md` §12.2 ("23/23 módulos con contratos de dominio"), `validate --strict` PASS. Excepción: `security` (solo routes) recibe types mínimos de su superficie — no Entity/Inputs/Filters completos.
