# Proposal

## Why

`tsconfig.base.json` actual tiene solo 16 opciones y le faltan ~13 flags del PRD §1 (entre ellos `noEmitOnError`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `noImplicitOverride`). La task 1.1 del change archivado `ci-typescript-strict-config` se marcó completada afirmando "los flags del PRD" pero el entregable no los cumple: los 3 errores tipo probados del PRD (TS1294 enum, TS2322 índice, TS1484 import de tipo) NO disparan hoy. Sin `noEmitOnError`, tsc puede emitir `dist/` con errores de tipos (riesgo directo de runtime).

## What Changes

- Completar `tsconfig.base.json` con los 13 flags ausentes del PRD §1: `lib: ["ES2023"]`, `types: ["node"]`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`, `composite`, `incremental`, `noEmitOnError: true`.
- Verificar que `tsc -b` sigue pasando (EXIT 0) tras añadir los flags.
- Verificar que los fixtures B2/B3/B4 disparan TS1294/TS2322/TS1484.
- Corregir la task archivada 1.1 como divergencia (nota en el change).

## Capabilities

- **New Capabilities**: `ci-typescript-strict-flags`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `tsconfig.base.json` (raíz).
- Riesgo: medio — los flags nuevos pueden revelar errores de tipos existentes; validar con `tsc -b` y `npm run type-check` antes de commitear.
- **Alcance real (2026-11-18):** el riesgo se materializó: 115 errores en 55 archivos de `apps/server` (62 TS4111, 35 de `exactOptionalPropertyTypes`, 13 TS2322/TS2532/TS2412). Se corrigieron sin desactivar flags; ver «Resultado de la verificación» en `tasks.md`.
