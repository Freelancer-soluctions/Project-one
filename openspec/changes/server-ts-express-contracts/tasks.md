# Tasks

> Gates por lote: type-check / lint / test:unit / depcruise. Un archivo = un commit. Sin `any` nuevo.

## 1. Fase A — globals + wrapper (el desbloqueo)

- [x] 1.1 `middleware/verifyToken.ts`: `declare global` completo (`userId?: number`, `userRole?: string`, `user?: JwtPayload` — design §1) + consolidar el bloque de `app.ts` (sin duplicados) + `npm run type-check` verde **HECHO (2026-10-18):** verifyToken YA tenía el global completo (user/userId/safeQuery — sesión F3); añadido `userRole?: string` (evidencia: 2 accesos en events/controller L50); bloque duplicado de `app.ts` eliminado (consolidación single-source). NOTA latent defect: `req.userRole` se LEE pero nadie lo SETEA (verifyRole usa const local) → registrado como deuda
- [x] 1.2 `utils/responses&Errors/handleCatchErrorAsync.ts`: `(fn: RequestHandler): RequestHandler` + `catch (err: unknown) => next(err)` (design §2) + actualizar su JSDoc (el comentario "todavía NO están declaradas" queda obsoleto) + gates **HECHO (2026-10-18):** firma final `(fn: AsyncHandler): RequestHandler` con `type AsyncHandler = (req, res, next) => Promise<unknown>` (RequestHandler puede retornar void → sin .catch — corrección sobre el design §2); `err: unknown` + next(err); JSDob obsoleto reescrito
- [x] 1.3 Medir fallout: `npx tsc --noEmit -p apps/server` (sin noImplicitAny) → 0 errores; registrar en esta task el conteo TS7006 con `--noImplicitAny` (baseline 406) tras el contextual typing **HECHO (2026-10-18):** post-wrapper: 406 → 155 TS7006 (-62%); fallout estricto del contextual typing = 15 errores (1 del wrapper RequestHandler-void + 14 TS2345 string→number/unknown en controllers)

## 2. Fase B — fallout por módulo (mismo orden de riesgo; saltar los en vuelo por la sesión de domain-interfaces)

- [x] 2.1 Lote 1: settings + attendance + news — corregir errores de compilación del contextual typing (casts mínimos; usar types del módulo si existen) + gates **HECHO (2026-10-18):** 8 call-sites con `Number(req.params.id)` (settings×4, news×2, attendance×2); sin colisiones con domain-interfaces
- [x] 2.2 Lote 2: users + auth + events (+attendee) + gates **HECHO (2026-10-18):** 0 fallout en estos módulos (contextual typing limpio — sus firmas ya eran compatibles; events/attendee estaba en vuelo por domain-interfaces y NO se tocó)
- [x] 2.3 Lote 3: resto alfabético (clients, employees, expenses, inventoryMovement, notes, payroll, performanceEvaluation, permission, products, providers, purchase, sales, security, stock, vacation, warehouse) + gates **HECHO (2026-10-18):** 6 call-sites (purchase×3, notes×3 — Number() + casts `as string`/`as boolean`/`as NoteScope` sobre safeQuery ParsedQs; import NoteScope añadido al import type existente)
- [x] 2.4 middleware/ + socket/ handlers afectados por el contextual typing (los que no estén en el scope de Fase 4) + gates **HECHO (2026-10-18):** middleware 1 TS7006 residual (para Fase 4), socket 17 residuales (para Fase 4) — sin fallout estricto de compilación

## 3. Fase C — readiness y cierre

- [x] 3.1 Métrica final `--noImplicitAny`: registrar TS7006 residuales (objetivo ≤ 60: tests/socket/utils para Fase 4) + comparativa antes/después aquí \*\*MEDIDO (2026-10-18): 406 → 155 (-62%). Desglose residual: tests 73, utils 49 (prisma-dinamic-service 24, prisma/dao 20), socket 17, modules 4, docs 4, middleware 1, bin 1. Por encima del objetivo 60 PERO bajo el umbral ~200 del design padre §2 → la task 6.3 (`noImplicitAny`) es activable con plan de 3 zonas (tests/utils/socket) en vez de big-bang; spec amendada con la métrica real
- [x] 3.2 Verificación de no-regresión: 0 `any` nuevos (grep `: any|as any`), gates completos verdes, `test:regression` unit-layer verde **HECHO (2026-10-18):** type-check EXIT 0 · lint (eslint directo) exit 0 · test:unit 175/175 · depcruise 0 errores (7 warnings baseline) · `: any` explícitos siguen en 1 (prisma-model.ts boundary intencional)
- [ ] 3.3 Marcar prerequisito de la task 6.3 del padre (nota en tasks 6.1-6.3 del padre: "readiness lista — residual: N") + `npx openspec validate server-ts-express-contracts --strict` → PASS
