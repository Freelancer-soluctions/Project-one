# Tasks

> Patrón (design §1-§3): `types.ts` nuevo + refactor de firmas de dao/service/controller con imports de `./types.js`. Un módulo = un lote (gates: type-check/lint/test:unit/depcruise). Un archivo = un commit. Prohibido `any`; prohibido importar tipos de otro módulo (design §2). Orden de riesgo (design §5).

## 1. Módulo patrón de referencia

- [ ] 1.1 `settings`: `types.ts` (Setting entity derivada de Prisma + Create/Update/Filters + ServiceResult) + refactor dao/service/controller + gates verdes — **validar el patrón aquí antes de replicar**; si el patrón cambia, actualizar design §1 y re-revisar

## 2. Módulos de riesgo (mismo orden que F2)

- [ ] 2.1 `attendance` (types.ts + refactor + gates)
- [ ] 2.2 `news` (idem)
- [ ] 2.3 `users` (idem — incluye `constants/users.ts` ya tipado: sus exports se re-exportan/referencian desde users/types.ts sin moverlos)
- [ ] 2.4 `auth` (idem — AuthPayload/TokenPair alineados a `utils/jwt/createToken.ts` existente, import de utils permitido)
- [ ] 2.5 `events` (idem — el mayor: events + submódulo `attendee/types.ts` propio + alineación con `stateMachine.ts` ya tipado)
- [ ] 2.6 resto alfabético: `clients`, `employees`, `expenses`, `inventoryMovement`, `notes` (+ utils internos en notes/types.ts), `payroll`, `performanceEvaluation`, `permission`, `products`, `providers`, `purchase`, `sales`, `security` (types mínimos de routes), `stock`, `vacation`, `warehouse` — gates cada 3-4 módulos, evidencia registrada aquí

## 3. Cierre

- [ ] 3.1 Verificación de aislamiento: `grep -rn "from '\.\./\.\./" apps/server/src/modules/*/types.ts` → solo imports de `utils/constants` permitidos; 0 tipos cruzando módulos
- [ ] 3.2 Verificación de no-regresión: `grep -rn ": any" apps/server/src/modules --include="*.ts"` → 0 nuevos; los 4 gates verdes en suite completa; `npm run depcruise:server` 0 errores
- [ ] 3.3 Contador `docs/CONTEXT-CICD.md` §12.2: "24/24 módulos con contratos de dominio (types.ts)" + `npx openspec validate server-ts-domain-interfaces --strict` → PASS
