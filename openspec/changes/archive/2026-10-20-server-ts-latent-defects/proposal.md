# Proposal

> Change de bugs descubierto por la migración TS (change `server-typescript-migration`, Fase 4/6 — los bugs quedaron REGISTRADOS, no fijados, por la regla zero-behavior-change de ese change; ver tasks 3.4 de `server-ts-domain-interfaces` y notas de `server-ts-express-contracts`).

## Why

La migración a TypeScript tipó el código sin alterar su comportamiento — lo que destapó **defectos latentes de runtime** que existían idénticos antes de la migración (verificados byte-a-byte en HEAD por @planner). Al activar `strict: true` estos defectos ahora son visibles en el compilador o en la semántica del tipo:

1. **`req.userRole` se lee pero NADIE lo asigna**: `events/controller.ts` L52 evalúa `showDeleted && req.userRole !== 'ADMIN'` — `verifyRole.ts` usa una const LOCAL (`userRole`) y nunca asigna `req.userRole` → el valor SIEMPRE es `undefined` → `undefined !== 'ADMIN'` es `true` → cualquier usuario autenticado puede pedir `showDeleted=true` (filtrado de eventos borrados sin check de rol).
2. **PATCH `/settings/:id` con payload anidado inválido**: el controller construye `updateData.displayOptions = displayOptions` (objeto anidado) y lo pasa a `prisma.settings.update` — pero el modelo `settings` tiene **columnas planas** (`displayEvents`, `displayNotes`, ...) → Prisma rechaza `displayOptions` en runtime → el endpoint PATCH de display settings está roto.
3. **Contrato de `dotenv` con `strict`**: la firma `(key: EnvKey): string` oculta que `process.env[key]` puede ser `undefined` — con `strictNullChecks` el fix actual (`?? ''`) enmascara configuración faltante (ej. `SECRETKEY` ausente produciría firma JWT vacía en vez de fallar ruidoso).

## What Changes

- **Fix 1 (security)**: `verifyRole.ts` asigna `req.userRole = userRole` tras verificar el rol (el `declare global` de `server-ts-express-contracts` ya declara la prop). Comportamiento resultante: el guard `showDeleted` de events pasa a funcionar como se documentó (JSDoc del controller). **Nota**: esto PUEDE restringir acceso previamente sin-check — revisar consumers del endpoint `GET /events?showDeleted=true` antes del fix.
- **Fix 2 (endpoint roto)**: `settings/controller.ts` (PATCH display) aplana `displayOptions` a las columnas del modelo (`displayEvents: displayOptions.displayEvents, ...`) antes de pasar al dao; o el dao acepta el anidado y lo despliega. Alinear con `SettingDisplayInput` de `settings/types.ts`.
- **Fix 3 (dotenv honesto)**: cambiar la firma a `(key: EnvKey): string | undefined` + normalizar los consumers (los 23 call-sites) — o mantener `?? ''` solo para keys con default seguro y lanzar `Error` para las críticas (`SECRETKEY`, `AES_GCM_KEY`). Decisión de diseño en el change.
- **Tests de regresión** por fix (unit, con mocks existentes).

## Capabilities

### New Capabilities

- `server-ts-latent-defects`: corrección de los defectos latentes descubiertos por la migración TS. Cubre el setter de `req.userRole` en `verifyRole`, el aplanado del payload PATCH de settings, y la política de dotenv ante config faltante (crítica vs opcional).

## Impact

| File                                                                        | Change                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/middleware/verifyRole.ts`                                              | asignar `req.userRole` (fix 1)                                           |
| `src/modules/events/controller.ts`                                          | guard `showDeleted` pasa a operar (fix 1 — revisar tests que lo mockean) |
| `src/modules/settings/controller.ts` + `service.ts` + `dao.ts` + `types.ts` | aplanar displayOptions (fix 2)                                           |
| `src/config/dotenv.ts` + 23 call-sites                                      | política undefined (fix 3)                                               |
| `docs/CONTEXT-CICD.md`                                                      | nota de fixes aplicados                                                  |

**Riesgos**: fix 1 cambia comportamiento visible (endpoint showDeleted pasa a filtrar por rol real) — requiere decisión de producto confirmada por el JSDoc/documentación existente; fix 2 corrige un endpoint roto (ningún consumer funcional hoy).
