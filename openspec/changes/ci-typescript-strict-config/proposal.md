# Proposal

## Why

`apps/server` ya está migrado a TypeScript (0 `.js` fuente, `strict: true`), pero la configuración actual hereda `target: ES2022`, `checkJs: false` y `allowJs: true` vestigiales, omite `scripts/`, `prisma/` y los configs de vitest del `include`, y el build es un no-op (`echo 'No build step needed'`). No existe `tsc -b` ni referencias entre proyectos, por lo que no hay compilación real ni salidas reproducibles. El PRD de Stage Build (2026-11-12) define la base compartida estricta y la compilación por proyectos como primera línea de calidad del build.

## What Changes

- Añadir `tsconfig.base.json` en la raíz con la base estricta del PRD: `target: ES2023`, `lib: ["ES2023"]`, `types: ["node"]`, `module`/`moduleResolution: nodenext`, `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`, `forceConsistentCasingInFileNames`, `skipLibCheck`, `resolveJsonModule`, `sourceMap`, `declaration`, `declarationMap`, `composite`, `incremental`. (Lista completa de los 25 flags del PRD §1.)
- Reescribir `apps/server/tsconfig.json` extendiendo la base: `outDir: dist`, `rootDir: src`, `tsBuildInfoFile`, `include: ["src", "scripts", "prisma", "tests"]`, `exclude: node_modules`, sin `allowJs`/`checkJs`.
- Añadir `tsconfig.json` de solución en `apps/server` con `files: []` y `references` (cuando existan paquetes). Para el monorepo actual (un solo paquete) documentar el patrón para futuros paquetes.
- Fijar una sola versión de TypeScript en `devDependencies` raíz y `apps/server`, y `@types/node` en devDeps.
- Sustituir el script `build` no-op por `tsc -b` (y `type-check` sigue siendo `tsc --noEmit`).
- Añadir `dist/` y `.tsbuildinfo` a `.gitignore` y `.dockerignore`.
- Eliminar importes con sufijo `.ts` residuales (5 archivos) a favor de sufijo `.js` (rewriteRelativeImportExtensions).
- **Reglas de uso (PRD §2):** (1) el build es `tsc -b` (noEmitOnError implícito); (2) los paquetes se importan por nombre (`@x/shared` con `exports` en su `package.json`), no con rutas relativas; (3) una sola versión de TypeScript fijada en el lockfile y en `devDependencies` raíz; (4) los `tsconfig` de entornos distintos (Node vs navegador) no se mezclan — cada uno extiende la base y añade su `lib`/`types`; (5) sin `any` implícito ni `@ts-ignore` libres (`@ts-expect-error` con descripción, regla ESLint `ban-ts-comment`); (6) salidas fuera de git (`dist/` y `.tsbuildinfo` en `.gitignore` y `.dockerignore` con `**/dist`).
- **Exclusiones de la base:** `noUnusedLocals` y `noUnusedParameters` NO van en la base (PRD §1: demasiado ruidosos; los lleva ESLint con ratchet).
- **Alternativa type stripping (PRD §"Alternativa"):** Node ejecuta `.ts` nativo (estable desde v24.12/v25.2, activado por defecto desde v22.18), pero solo sintaxis borrable, ignora `tsconfig.json` y exige extensiones en imports. La base ya es compatible, pero se mantiene `tsc` porque produce `dist/` con tipos, mapas y verificación de tipos. Decisión D1 documentada.
- Eliminar comentarios stale en tsconfig y en `ci.yml` (job `server-typecheck`).

## Capabilities

- **New Capabilities**: `ci-typescript-strict-config` (configuración base estricta, compilación por proyectos, reproducibilidad).
- **Modified Capabilities**: (ninguna — es tooling/config, no cambia comportamiento de runtime).

## Impact

- Archivos: `tsconfig.base.json` (nuevo), `apps/server/tsconfig.json`, `apps/server/package.json`, `.gitignore`, `.dockerignore`, `apps/server/src/bin/index.ts`, `apps/server/src/docs/swagger.ts`, `.github/workflows/ci.yml` (comentarios).
- Dependencias: `typescript`, `@types/node` fijados.
- Riesgo: bajo — `noEmit` se mantiene en CI; `tsc -b` solo produce `dist/` localmente y en el build de imagen.

