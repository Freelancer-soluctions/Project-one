# server-ts-domain-interfaces

Interfaces de dominio tipadas para los 24 módulos de `apps/server` (post-migración total a TS, 2026-10-18).

**Principio AUTOCONTENIDO:** cada módulo es dueño de sus tipos — `src/modules/<modulo>/types.ts` (imports solo de Prisma/joi/comunes, nunca de otros módulos). Nada de un `types/` global.

**Patrón por módulo** (definido en design §2): `types.ts` con `<Entity>` (shape de fila), `Create<Entity>Input`, `Update<Entity>Input`, `<Entity>Filters` (query), tipos de retorno de service, y contratos de controller (`AuthedRequest` fields usados). Los dao/service/routes/controller importan de `./types.js` — cero cambios de comportamiento, solo tipos.

**Estado actual:** 11 `export interface/type` en todo `src/` (dotenv, stateMachine, users constants, socket/auth, enums, jwt) — los módulos operan con tipos inferidos de Prisma.
