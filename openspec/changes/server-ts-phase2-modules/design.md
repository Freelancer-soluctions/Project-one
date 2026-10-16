# Design

> Hereda decisiones 1-9 del padre y decisiones 1-7 de `server-ts-phase1-leaves`. Este design cubre solo lo propio de la conversión de módulos.

## Decisión 1 — Orden de riesgo ascendente (del padre, con criterio operativo)

Padre task 3.1: `settings → attendance → news → users → auth → events → resto`. El criterio del orden: dependencias de dominio y superficie de riesgo. `settings` (config simple), `attendance`/`news` (CRUD puro), `users`/`auth` (token/jwt — alto consumo de utils), `events` (el más complejo: stateMachine + attendee + 15 tests colocalizados) — luego el resto alfabético. El `resto` agrupa módulos CRUD homogéneos (clients, employees, expenses, ...) donde el patrón ya está rodado.

## Decisión 2 — Patrón vertical por módulo (no horizontal por capa)

Cada módulo se convierte completo (`dao → service → routes → controller` + test colocalizado) antes de pasar al siguiente. Alternativa descartada: convertir todas las capas de muchos módulos a la vez (horizontal) — rompería la verificabilidad por unidad de dominio y mezclaría rollbacks. El orden INTERNO dentro del módulo es bottom-up (dao primero: es hoja del subgrafo del módulo; controller último).

## Decisión 3 — Código muerto antes que tipos (knip audit)

Antes de convertir `clientOrder` y `providerOrder` (hallazgos knip de Fase 0: `clientOrder` 4 archivos, `providerOrder` 5): ejecutar `npm run knip:server`, verificar que no tienen consumidores vivos (rutas registradas, imports) y ELIMINAR con commit `chore(server): remove dead code <module> (knip)`. Si algún consumidor vivo aparece, se migra normal y se registra la contradicción de knip en tasks. Nunca se tipa código destinado a borrarse.

## Decisión 4 — Tests colocalizados conviven con su módulo

Los 15 tests `.unit.test.js` dentro de `src/modules/` se convierten en el mismo lote que su módulo (imports de dao/service ya `.ts`). Los tests de `tests/` (integration/smoke/orphans/properties/setup) siguen la task 3.2: `setupGlobal`/`setupTest`/`test-server` al final (son dependencia de todo), suites por área. Los filtros vitest substring (`.unit.test`, `.integration.test`) ya cubren `.ts` (Fase 0) — cero cambio de scripts.

## Decisión 5 — Tipado de capas (referencia rápida, detalle en ejecución)

- **dao**: funciones reciben `Prisma.<Model>WhereInput`/`Prisma.<Model>CreateInput` (tipos generados de Prisma Client), devuelven tipos del modelo — sin `any` en payloads.
- **service**: tipos de dominio derivados de dao (`Awaited<ReturnType<typeof dao.fn>>` donde aporte, sin sobre-ingeniería).
- **routes**: `Router` de express; handlers delegan — sin lógica.
- **controller**: `Request`/`Response`/`NextFunction` de express base (SIN `declare global` para `req.user` — llega en Fase 3 con el middleware; aquí se usa cast local documentado si el controller lee `req.user`).
- **stateMachine** (events): transiciones como `Record<Estado, Estado[]>` con `as const` + union de estados.

## Decisión 6 — Verificación por módulo, cierre por change

Gates tras cada módulo: `type-check` + `lint` + `test:unit` + `depcruise:server`. Tras el cierre (routes registry + tests/): los 4 gates + `npm run knip:server` (sin nuevos muertos) + registro del contador `docs/CONTEXT-CICD.md` → `173/236 (Fase 2)` (36 F1 + 137 F2). `test:integration` y `test:smoke` se ejecutan en CI del PR (PostgreSQL no disponible local — conocido desde Fase 0).

## Decisión 7 — Trazabilidad con el padre

Al crear este change: task 3.1 del padre `[x]`. La task 3.2 (tests/) se marca `[x]` al CERRAR este change (no al crearlo). El cierre del change exige tasks 100% `[x]` + gates verdes + validate `--strict`.
