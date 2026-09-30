# Design

## Context

Hoy no existe ningún `tsconfig.json` en el repo (raíz ni workspaces), pero `typescript@5.9.3` ya está en `dependencies` de raíz y CI ya tiene los jobs cableados:

- `.github/workflows/ci.yml`: `server-typecheck` (L538) y `client-typecheck` (L450) existen, están en `needs` de `prebuild-quality-complete` (L1099-1105), pero ambos llevan `if: false # Disabled for incremental CI` y su paso es `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op until TS migration"` — es decir, nunca fallan.
- `package.json` raíz no tiene script `type-check` (solo el paquete dev `type-check@0.4.0`, no relacionado). `lint-staged` raíz cubre `*.{js,jsx,ts,tsx,...}` con `prettier` pero solo `*.{js,jsx,cjs,mjs}` con `eslint` — nada de `tsc`.
- `docs/learning/typescript-strict-check.md` ya documenta el plan de flags y referencias; debe actualizarse al estado resultante.

Ver proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- Chequeo de tipos real y bloqueante para `apps/server/` en local (scripts + lint-staged) y en CI.
- Adopción gradual de `strict`: un flag (o sub-grupo) por paso, con baseline medible.
- Un `tsconfig.json` raíz como base compartida y configuración de `apps/server/` que la extienda.

**Non-Goals:**

- Completar la migración `.js` → `.ts` de `apps/server/` (change `server-typescript-migration`).
- Activar `strict: true` de una sola vez.
- Activar `noUncheckedIndexedAccess` en esta fase (quedó definido como **último** flag).
- Cambiar `eslint.config.js` o `eslint.config.js`-globs más allá de lo necesario para `*.ts`.

## Decisions

### D1: `tsconfig.json` arranca con `strict: false` y sube gradual flag a flag

Se crea `tsconfig.json` raíz (base: `strict: false`, `noEmit`, `skipLibCheck`, `module`/`moduleResolution` compatibles con el stack actual) y `apps/server/tsconfig.json` con `"extends"` + `include: ["src/**/*"]`. Los flags strict se habilitan **uno a uno** en orden de costo creciente:

1. Baratos: `noImplicitReturns`, `noFallthroughCasesInSwitch`.
2. Familia `strict`: `noImplicitAny` → `strictNullChecks` → `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`.
3. `useUnknownInCatchVariables` (familia `strict`, fase 3 — `catch (err): unknown` exige `instanceof Error` en middleware Express).
4. **Último**: `noUncheckedIndexedAccess` (DAOs Prisma `rows[0]`, `process.env[KEY]`, `req.body[key]` — el más costoso).

Alternativa descartada: `strict: true` directo → miles de errores (`TS7006`, `TS18048`, `TS2564`) y PR inreviewable. Alternativa descartada: no crear `tsconfig.json` y dejar `tsc` con flags CLI → sin fuente única de verdad, CI y local divergen (mismo problema de drift que `server-complexity` vs `eslint.config.js`).

Rationale: un flag por paso permite baseline (`tsc --noEmit 2>&1 | wc -l` antes/después) y rollback por flag.

### D2: scripts `type-check` + `lint-staged` cubre `*.ts`

- `package.json` raíz: `"type-check": "tsc --noEmit -p apps/server"` (y `type-check:client` cuando `apps/client` tenga `tsconfig`). `apps/server/package.json`: script espejo `type-check` para `npm run type-check --workspace=apps/server`.
- `lint-staged` raíz: añadir `*.ts` al pipeline (`prettier --write` ya lo cubre por el glob `*.{...,ts,tsx,...}`; añadir `tsc --noEmit` / `eslint` para `*.ts`). Como `tsc --noEmit` suelto no valida el proyecto completo, la validación total vive en `type-check` (pre-push/CI) y en lint-staged se usa la forma incremental (`tsc --noEmit --incremental -p apps/server`) o se limita a formato/lint, decisión tomada en tasks.

Alternativa descartada: solo CI → el developer se entera tarde (feedback tardío). Alternativa descartada: `tsc --noEmit` completo en cada commit → lento; se mantiene en pre-push/CI.

### D3: CI `server-typecheck` y `client-typecheck` sin `if: false`

En `.github/workflows/ci.yml`:

- `server-typecheck`: quitar `if: false`, reemplazar el paso `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op until TS migration"` por `npm run type-check` (falla real ante errores), manteniendo `needs: repo-discovery`, `timeout-minutes` y `working-directory`/workspace correspondiente.
- `client-typecheck`: mismo tratamiento (sin `if: false`; paso `npm run type-check:client` cuando exista `tsconfig` de cliente).
- `prebuild-quality-complete` ya incluye ambos jobs en `needs` (L1099-1105) → el job agregador pasa a ser gate real.

Fase de transición: si al activar el job quedan errores heredados, se usa baseline o `continue-on-error: true` **temporal** documentado — nunca el patrón `|| echo`, que oculta fallos y hace que el job siempre sea verde. `|| echo` es equivalente a `if: false` en efecto (nunca falla), por eso se retira en esta change.

### D4: referencias oficiales `typescriptlang.org` como fuente de verdad documental

`docs/learning/typescript-strict-check.md` (actualizado) y los artefactos citan `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/`, `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html` y release notes TS 6.0 como referencias normativas de flags y defaults; los docs internos (`docs/learning/typescript-migration-server.md`, `docs/CONTEXT-CICD.md`) quedan enlazados como contexto de proyecto. Rationale: los defaults de flags cambian entre versiones (p.ej. `strict: true` por defecto en TS 6.0) — citar la fuente evita doc obsoleto.

## Risks / Trade-offs

- [Activar `server-typecheck` real falla PRs con errores heredados] → baseline previo con `tsc --noEmit 2>&1 | wc -l`; fase de transición documentada; nunca `|| echo`.
- [`lint-staged` con `tsc` completo ralentiza commits] → chequeo incremental en pre-commit; validación total en `type-check`/CI.
- [`noImplicitAny` choca con migración `.js` → `.ts` pendiente] → orden fijado: no se activa hasta que `typescript-migration-server` avance; flags se habilitan por PR.
- [`noUncheckedIndexedAccess` rompe muchos DAOs] → queda **último**, con PR propio y baseline.
- [Docs quedan desincronizados de `ci.yml`/`tsconfig`] → grupo de tasks de documentación con verificación grep-eable (referencias `typescriptlang.org`, líneas de CI).

## Migration Plan

1. Crear `tsconfig.json` raíz + `apps/server/tsconfig.json` (`strict: false`), scripts `type-check`.
2. Baseline de errores; activar flags baratos y familia `strict` por pasos, corrigiendo código por flag.
3. Encender `server-typecheck`/`client-typecheck` en CI (sin `if: false`, sin `|| echo`).
4. Activar `lint-staged` para `*.ts`.
5. Actualizar doc + referencias; validar con `openspec validate`.

Rollback: cada flag es revertible por commit; el job CI puede volver a `if: false` solo como último recurso documentado (no es el estado deseado de esta change).

## Open Questions

- `typescript` se mueve de `dependencies` a `devDependencies` en raíz, o se añade como `devDependency` en `apps/server/`: resolver en tasks con el resto del wiring (no cambia specs ni alcance).
