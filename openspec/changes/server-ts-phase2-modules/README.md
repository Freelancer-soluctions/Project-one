# server-ts-phase2-modules

Fase 2 de la migración TS (hijo de `server-typescript-migration`, task 3.1/3.2). Predecesor: `server-ts-phase1-leaves` (36 hojas: schemas Joi ya `.ts`).

**Alcance — 137 archivos:**

- 24 módulos `src/modules/` — 116 archivos restantes (schemas ya en Fase 1): por módulo `dao → service → routes → controller` + tests colocalizados + extras (`events/stateMachine.js`, `notes/utils/*`, `users/constants/users.js`, submódulo `events/attendee/*`)
- `src/routes/v1/index.js` (registro de rutas)
- `tests/` (20 tracked): setup, smoke, integration, orphans, properties

**Orden de riesgo ascendente** (task 3.1 del padre): settings → attendance → news → users → auth → events → resto.

**Prerrequisito:** auditar/eliminar código muerto knip (`clientOrder`, `providerOrder`) ANTES de migrar esos módulos.
