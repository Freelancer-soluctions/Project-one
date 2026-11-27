# Tasks

## 1. Completar la base

- [x] 1.1 Añadir a `tsconfig.base.json`: `target: "ES2023"`, `lib: ["ES2023"]`, `types: ["node"]`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`, `composite`, `incremental`, `noEmitOnError: true`.
- [x] 1.2 Ejecutar `npm run type-check` (EXIT 0 esperado) y `npm run build --workspace=apps/server` (EXIT 0, genera dist/).
- [x] 1.3 Ejecutar `npm run test:unit` (baseline 209) — sin regresiones.

## 2. Verificación de los fixtures del PRD

- [x] 2.1 Introducir un `enum` → esperar TS1294.
- [x] 2.2 Asignar un acceso por índice a `string` → esperar TS2322.
- [x] 2.3 Importar un tipo sin `type` → esperar TS1484.
- [x] 2.4 Introducir un error de tipos → `tsc -b` termina con exit 1 y no emite dist/ (noEmitOnError).

## 3. Limpieza

- [x] 3.1 Anotar en el change archivado `ci-typescript-strict-config` la divergencia (task 1.1 marcada completada sin cumplir los flags).

## Resultado de la verificación (2026-11-18)

- Flags aplicados en `tsconfig.base.json` (TypeScript 5.9.3 del repo, no 7.0.2 del PRD).
- `npm run type-check` → EXIT 0; `npm run build --workspace=server-express` (`tsc -b` desde `dist/` y `.cache/tsc` vacíos) → EXIT 0 con `dist/bin/index.js`.
- `npm run test:unit` → 28 archivos / 251 tests en verde (el baseline de 209 quedó desactualizado; no hay regresiones).
- Fixtures en `apps/server/src/__ts_strict_fixtures__/` (temporales, eliminados después): `enum` → TS1294, `Record<string, number>['a']` asignado a `string` → TS2322, import de `EventFilters` sin `type` → TS1484; `tsc -b` con ese error sale con exit 1 y no crea `dist/`.
- **Alcance real mayor que el propuesto:** activar los flags reveló 115 errores de tipos en 55 archivos de `apps/server` (54 archivos modificados: 13 de ellos con error solo indirecto vía `types.ts`, y 11 `types.ts` más un test tocados sin error directo). Se corrigieron sin desactivar ningún flag:
  - 62 × TS4111 (`noPropertyAccessFromIndexSignature`): accesos `obj.prop` → `obj['prop']` sobre `process.env`, `req.query`, `req.params`, cookies y registros "crudos" (cambio solo sintáctico).
  - 35 × TS2375/TS2379/TS2412 (`exactOptionalPropertyTypes`): en los DTOs de entrada/filtros del dominio se declaró `prop?: T | undefined` (el `undefined` significa "no provisto"); en los literales que van a Prisma y en tipos de resultado se omite la clave con `...(x !== undefined && { x })`, preservando el runtime.
  - 7 × TS2322, 6 × TS2532 (`noUncheckedIndexedAccess`) y 5 × TS2412 restantes, resueltos con chequeos de `undefined` explícitos (o `[0]!` en un test).
  - Sin cambios de comportamiento: no se añadieron `await`, defaults ni coerciones nuevas; el único `as` añadido (`state` en `users/dao.ts`) preserva un gap preexistente documentado.
