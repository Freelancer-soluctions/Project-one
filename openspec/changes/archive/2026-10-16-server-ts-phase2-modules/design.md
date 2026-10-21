# Design

> Hereda decisiones 1-9 del padre y decisiones 1-7 de `server-ts-phase1-leaves`. Este design cubre solo lo propio de la conversión de módulos.

## Decisión 1 — Orden de riesgo ascendente (del padre, con criterio operativo)

Padre task 3.1: `settings → attendance → news → users → auth → events → resto`. El criterio del orden: dependencias de dominio y superficie de riesgo. `settings` (config simple), `attendance`/`news` (CRUD puro), `users`/`auth` (token/jwt — alto consumo de utils), `events` (el más complejo: stateMachine + attendee + 15 tests colocalizados) — luego el resto alfabético. El `resto` agrupa módulos CRUD homogéneos (clients, employees, expenses, ...) donde el patrón ya está rodado.

## Decisión 2 — Patrón vertical por módulo (no horizontal por capa)

Cada módulo se convierte completo (`dao → service → routes → controller` + test colocalizado) antes de pasar al siguiente. Alternativa descartada: convertir todas las capas de muchos módulos a la vez (horizontal) — rompería la verificabilidad por unidad de dominio y mezclaría rollbacks. El orden INTERNO dentro del módulo es bottom-up (dao primero: es hoja del subgrafo del módulo; controller último).

## Decisión 3 — Código muerto antes que tipos (knip audit)

`clientOrder` (4 archivos) y `providerOrder` (5) están **suprimidos** en `knip.jsonc` (`workspaces.apps.server.ignore`) — `knip:server` NO los reporta, así que la auditoría usa evidencia directa: (1) `grep` de consumidores en `src/`, (2) verificación de que `src/routes/v1/index.js` registra 23 módulos (sin clientOrder ni providerOrder). Verificación previa (2026-10-15): cero imports → muerte confirmada. Si algún consumidor vivo apareciera al ejecutar: se migra normal y se registra la contradicción en tasks. **Nunca se tipa código destinado a borrarse.** Consecuencia aritmética (condicional): con borrado de los 9, F2 convierte 128 (no 137) y el total global pasa a 227 → contador de cierre `164/227`; sin borrado, `173/236`. La rama elegida se congela al ejecutar 0.1/0.2 y se propaga a task 4.1, a la task 1.8 del padre y a la Fase configs del padre (8 restantes → 227+8=235 o 236).

## Decisión 4 — Tests colocalizados conviven con su módulo

Los 14 tests `.unit.test.js` dentro de `src/modules/` (12 de events incl. attendee + 2 de notes) se convierten en el mismo lote que su módulo (imports de dao/service ya `.ts`). Los tests de `tests/` (integration/smoke/orphans/properties/setup) siguen la task 3.2: `setupGlobal`/`setupTest`/`test-server` al final (son dependencia de todo — OJO `globalSetup` de ambas configs vitest), suites por área. Los filtros vitest substring (`.unit.test`, `.integration.test`) ya cubren `.ts` (Fase 0) — cero cambio de scripts.

## Decisión 5 — Tipado de capas (referencia rápida, detalle en ejecución)

- **dao**: funciones reciben `Prisma.<Model>WhereInput`/`Prisma.<Model>CreateInput` (tipos generados de Prisma Client), devuelven tipos del modelo — sin `any` en payloads.
- **service**: tipos de dominio derivados de dao (`Awaited<ReturnType<typeof dao.fn>>` donde aporte, sin sobre-ingeniería).
- **routes**: `Router` de express; handlers delegan — sin lógica.
- **controller**: `Request`/`Response`/`NextFunction` de express base (SIN `declare global` para `req.user` — llega en Fase 3 con el middleware; aquí se usa cast local documentado si el controller lee `req.user`).
- **stateMachine** (events): transiciones como `Record<Estado, Estado[]>` con `as const` + union de estados.

## Decisión 6 — Verificación por módulo, cierre por change

Gates tras cada módulo: `type-check` + `lint` + `test:unit` + `depcruise:server`. Tras el cierre (routes registry + tests/): los 4 gates + `npm run knip:server` (sin nuevos muertos) + registro del contador `docs/CONTEXT-CICD.md` → `164/227 (Fase 2 — módulos, 9 muertos eliminados)` (36 F1 + 128 F2; **rama congelada al ejecutar 0.1/0.2: los 9 archivos se eliminaron**, ver decisión 3) — la otra rama habría sido `173/236` (36 F1 + 137 F2). `test:integration` y `test:smoke` se ejecutan en CI del PR (PostgreSQL no disponible local — conocido desde Fase 0).

## Decisión 7 — Trazabilidad con el padre

Al crear este change: task 3.1 del padre `[x]`. La task 3.2 (tests/) se marca `[x]` al CERRAR este change (no al crearlo). El cierre del change exige tasks 100% `[x]` + gates verdes + validate `--strict`.
