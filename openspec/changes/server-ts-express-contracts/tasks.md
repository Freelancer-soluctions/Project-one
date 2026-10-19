# Tasks

> Gates por lote: type-check / lint / test:unit / depcruise. Un archivo = un commit. Sin `any` nuevo.

## 1. Fase A — globals + wrapper (el desbloqueo)

- [ ] 1.1 `middleware/verifyToken.ts`: `declare global` completo (`userId?: number`, `userRole?: string`, `user?: JwtPayload` — design §1) + consolidar el bloque de `app.ts` (sin duplicados) + `npm run type-check` verde
- [ ] 1.2 `utils/responses&Errors/handleCatchErrorAsync.ts`: `(fn: RequestHandler): RequestHandler` + `catch (err: unknown) => next(err)` (design §2) + actualizar su JSDoc (el comentario "todavía NO están declaradas" queda obsoleto) + gates
- [ ] 1.3 Medir fallout: `npx tsc --noEmit -p apps/server` (sin noImplicitAny) → 0 errores; registrar en esta task el conteo TS7006 con `--noImplicitAny` (baseline 406) tras el contextual typing

## 2. Fase B — fallout por módulo (mismo orden de riesgo; saltar los en vuelo por la sesión de domain-interfaces)

- [ ] 2.1 Lote 1: settings + attendance + news — corregir errores de compilación del contextual typing (casts mínimos; usar types del módulo si existen) + gates
- [ ] 2.2 Lote 2: users + auth + events (+attendee) + gates
- [ ] 2.3 Lote 3: resto alfabético (clients, employees, expenses, inventoryMovement, notes, payroll, performanceEvaluation, permission, products, providers, purchase, sales, security, stock, vacation, warehouse) + gates
- [ ] 2.4 middleware/ + socket/ handlers afectados por el contextual typing (los que no estén en el scope de Fase 4) + gates

## 3. Fase C — readiness y cierre

- [ ] 3.1 Métrica final `--noImplicitAny`: registrar TS7006 residuales (objetivo ≤ 60: tests/socket/utils para Fase 4) + comparativa antes/después aquí
- [ ] 3.2 Verificación de no-regresión: 0 `any` nuevos (grep `: any|as any`), gates completos verdes, `test:regression` unit-layer verde
- [ ] 3.3 Marcar prerequisito de la task 6.3 del padre (nota en tasks 6.1-6.3 del padre: "readiness lista — residual: N") + `npx openspec validate server-ts-express-contracts --strict` → PASS
