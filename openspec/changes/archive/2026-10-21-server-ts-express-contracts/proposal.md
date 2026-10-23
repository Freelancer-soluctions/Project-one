# Proposal

> Change hijo de `openspec/changes/server-typescript-migration/` (prerrequisito de la Fase 4, task 6.3 `noImplicitAny`). Requiere migración total (✓ 2026-10-18) y convive con `server-ts-domain-interfaces` (tipos de dominio por módulo).

## Why

Los 125 handlers de controllers tienen `(req, res)` **implicit-any**: 406 TS7006 ocultos bajo `noImplicitAny: false` (medido 2026-10-18). Causa raíz en cadena: (1) el wrapper `handleCatchErrorAsync(fn)` tiene `fn` sin tipo — su JSDoc documenta que tipearlo antes de tener las props globales obligaría a castear en los ~125 handlers; (2) el `declare global` de F3 está incompleto (`user?: JwtPayload` declarado, pero `req.userId`/`req.userRole` — que los controllers usan — NO); (3) sin wrapper tipado no hay contextual typing, y sin contextual typing los handlers siguen JS-style.

La secuencia de desbloqueo es determinista: **globals completos → wrapper `RequestHandler` → contextual typing gratis en los 125 handlers → fallout acotado por módulo**. Sin esto, la Fase 4 (task 6.3 `noImplicitAny`) explotaría con 406 errores de golpe.

## What Changes

- **`declare global` completo** en `middleware/verifyToken.ts` (y consolidación con el de `app.ts`): `userId?: number`, `userRole?: string`, `user?: JwtPayload` — el contrato del payload verificado, evidencia-based (95 accesos a `req.user`, `req.userId` en 23 ficheros).
- **`handleCatchErrorAsync(fn: RequestHandler): RequestHandler`** — el wrapper tipado; contextual typing tipa los handlers en sus call-sites sin tocarlos.
- **Fallout acotado**: corrección de errores de compilación que el contextual typing destape (accesos a props no declaradas, destructuring de `req.query` ParsedQs → casts mínimos o tipos del módulo si `domain-interfaces` ya los aportó), módulo a módulo con gates.
- **`catch (err)` → `unknown`** en el wrapper (alineado con errorHandler de F3; prepara `useUnknownInCatchVariables`, Fase 4-6.5).
- **NoImplicitAny-readiness**: métrica TS7006 antes/después registrada en tasks (objetivo: 406 → ≤ 60, restantes en tests/utils/socket que quedan para Fase 4).

**Fuera de alcance**: activar `noImplicitAny` (Fase 4-6.3 del padre), socket/utils/tests residual (Fase 4), refactor de Inputs de dominio (change `server-ts-domain-interfaces`, en vuelo).

## Capabilities

### New Capabilities

- `server-ts-express-boundary`: Contratos Express del server. Cubre la augmentación global completa de `Request` (userId/userRole/user), el wrapper `handleCatchErrorAsync` tipado con `RequestHandler` (contextual typing para todos los handlers), la resolución del fallout de compilación por módulo y la métrica de readiness para `noImplicitAny`.

## Impact

| File                                                  | Change                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/middleware/verifyToken.ts`                       | `declare global` completo (userId, userRole, user)                        |
| `src/app.ts`                                          | consolidación del declare global existente (sin duplicados)               |
| `src/utils/responses&Errors/handleCatchErrorAsync.ts` | `fn: RequestHandler` + `catch (err: unknown)`                             |
| 125 handlers (controllers)                            | contextual typing por inferencia; casts mínimos donde el fallout lo exija |
| Fase 4 del padre                                      | task 6.3 desbloqueada (readiness ≤ 60 TS7006 residuales)                  |

**Riesgos**: (1) el contextual typing puede destapar errores en handlers que accedían props inexistentes — fallout por módulo, gates por lote; (2) colisión con la sesión paralela de `server-ts-domain-interfaces` (mismo archivos) — coordinación por lote, commits atómicos por módulo; (3) `req.query` ParsedQs puede exigir casts en handlers que pasan query a services — los casts usan los tipos del módulo cuando existen.
