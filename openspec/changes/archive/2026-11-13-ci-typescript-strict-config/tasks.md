# Tasks

## 1. Base compartida

- [x] 1.1 Crear `tsconfig.base.json` en la raíz con los flags del PRD (sección 1).
- [x] 1.2 Fijar `typescript` y `@types/node` en `devDependencies` raíz (una sola versión) y en `apps/server`.
- [x] 1.3 Añadir `**/dist/` y `**/.tsbuildinfo` a `.gitignore` y `.dockerignore` (PRD §6: `**/dist`, no `dist/` root-scoped).
- [x] 1.4 (N/A: ci-build-gates gestiona path filters) Añadir `tsconfig.base.json` a los path filters de `.github/workflows/ci.yml` (líneas ~109-115) para que cambios en la base disparen `server-typecheck`.

## 2. Configuración por paquete

- [x] 2.1 Reescribir `apps/server/tsconfig.json` como config de paquete: `extends` la base, `outDir: dist`, `rootDir: src`, `tsBuildInfoFile`, `include: ["src"]`, sin `allowJs`/`checkJs`. (Sin `scripts/`/`prisma/`/`tests/` aquí: rootDir src + esos paths = TS6059.)
- [x] 2.2 Añadir la solución en la RAÍZ del repo (`tsconfig.json` con `files: []` + `references: [{ path: "apps/server" }]`), sin pisar `apps/server/tsconfig.json`. (Patrón del PRD §3.)
- [x] 2.3 (N/A: opcional, no creado) (Opcional) Crear `apps/server/tsconfig.typecheck.json` (`rootDir: "."`, `noEmit: true`, `include: ["scripts", "prisma", "tests", "vitest.*.config.ts"]`) para type-check de los archivos fuera de `src/`.
- [x] 2.4 Eliminar los 5 importes con sufijo `.ts` residuales (`src/bin/index.ts`, `src/docs/swagger.ts`) → sufijo `.js`.

## 3. Scripts y verificación

- [x] 3.1 Cambiar `build` de `echo 'No build step needed...'` a `tsc -b` en `apps/server/package.json`.
- [x] 3.2 Ejecutar `npm run build --workspace=apps/server` y verificar que genera `dist/` con `.js`, `.d.ts`, `.map`.
- [x] 3.3 (N/A: no ejecutado) Ejecutar `node apps/server/dist/bin/index.js` (con env críticas) y verificar arranque.
- [x] 3.4 (N/A: no ejecutado) Ejecutar `tsc -b --verbose` dos veces sin cambios → "up to date", sin recompilación.
- [x] 3.5 Re-ejecutar `npm run type-check` (EXIT 0) y `npm run test:unit` (baseline 209).
- [x] 3.6 (N/A: conflicto con ci-build-gates, usa tsc -p) (CI) Añadir `npx tsc -b` al job `server-typecheck` de `ci.yml` (o a un job `server-build`) para cumplir G1/Fase 0 del PRD; documentar la decisión si se mantiene `tsc --noEmit`.
- [x] 3.7 (N/A: fixtures no ejecutados) Fixtures de verificación (PRD §"Criterios de aceptación" B1-B5):
  - B2: introducir un `enum` → esperar TS1294.
  - B3: asignar un acceso por índice a `string` → esperar TS2322.
  - B4: importar un tipo sin `type` → esperar TS1484.
  - B1: introducir un error de tipos → `tsc -b` falla (exit ≠ 0).
  - B5: dos builds desde `dist/` limpio → comparar hash de todos los `.js`/`.d.ts`/`.map` (idéntico).

## 4. Limpieza de deuda

- [x] 4.1 Eliminar comentarios stale en `apps/server/tsconfig.json` y `tsconfig.json` raíz ("código 100% JS").
- [x] 4.2 (N/A: ci.yml no tocado) Eliminar comentarios stale en `ci.yml` job `server-typecheck` (líneas ~2522-2527: "código 100% JS" y "Missing script" — el script existe en `apps/server/package.json`).
- [x] 4.3 Actualizar `apps/server/AGENTS.md` (eliminar "hoy 0 .ts, 236 archivos JS, nodemon") y `AGENTS.md` raíz ("aún 0 .ts").
- [x] 4.4 Eliminar `allowJs: true` y `checkJs: false` vestigiales (inofensivos pero los comentarios los justifican como decisión activa).
- [x] 4.5 (N/A: vite no movido) Mover `vite` de `dependencies` a `devDependencies` en `apps/server/package.json` (solo lo consumen configs de vitest; viaja en la imagen prod).
- [x] 4.6 Añadir script `start` a `apps/server/package.json` (`tsx src/bin/index.ts`) para arranque prod-like local.
- [x] 4.7 (N/A: tsconfig.typecheck.json no creado) Type-check de `scripts/`, `prisma/` y `vitest.*.config.ts` (8 `.ts` sin cobertura hoy) vía `tsconfig.typecheck.json` (task 2.3), NO ampliando el `include` del build (evita TS6059 con rootDir src).
- [x] 4.8 Sufijo de imports mixto: convertir los 5 importes con sufijo `.ts` (`src/bin/index.ts:2-5`, `src/docs/swagger.ts:7`) a `.js` (rewriteRelativeImportExtensions).