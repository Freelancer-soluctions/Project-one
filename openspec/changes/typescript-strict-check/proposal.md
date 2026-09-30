# Proposal

## Why

`apps/server/` corre sin `tsconfig.json` y sin chequeo de tipos real: `server-typecheck` en CI está apagado (`if: false`) y su paso finge pasar (`|| echo "TypeCheck: no-op..."`), así que regresiones de tipo llegan a main sin detectarse. Se necesita adoptar `strict` de forma gradual y paso a paso en `apps/server/` para ganar seguridad de tipos sin provocar miles de errores de golpe.

## What Changes

- Crear/adoptar `tsconfig.json` (raíz del monorepo) y configuración de `apps/server/` con `strict` **paso a paso**: flags individuales activados en orden, no `strict: true` de una sola vez.
- Orden de adopción: flags baratos primero (`noImplicitReturns`, `noFallthroughCasesInSwitch`), luego familia `strict` (`noImplicitAny` → `strictNullChecks` → `strictBindCallApply`/`strictFunctionTypes`/`strictPropertyInitialization`), `useUnknownInCatchVariables` dentro de la familia `strict`, y `noUncheckedIndexedAccess` **último** (el más costoso: DAOs, `process.env`, `req.body`).
- Scripts `type-check` en `package.json` (raíz y/o `apps/server/`) que ejecuten `tsc --noEmit`.
- `lint-staged` cubra `*.ts` en pre-commit (formato/lint junto al chequeo de tipos).
- CI: `server-typecheck` pasa de estado muerto (`if: false` + `|| echo ... a fallar real`) a job real que falla el PR ante errores de tipo; `client-typecheck` también sin `if: false`.
- Actualizar `docs/learning/typescript-strict-check.md` con el estado resultante (plan, scripts, CI, orden de flags).
- Referencias oficiales `typescriptlang.org` (tsconfig strict, handbook) citadas en doc y artefactos.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `config-correctness`: se extiende más allá de ESLint/Prettier para cubrir la corrección de la configuración de TypeScript: `tsconfig.json` (raíz y `apps/server/`) como fuente única de verdad de los flags `strict`, el orden gradual de adopción de flags, los scripts `type-check` y la obligación de que los jobs CI `server-typecheck`/`client-typecheck` ejerciten el chequeo real.

## Impact

- `tsconfig.json` (raíz) y `apps/server/` (nuevo/ajuste de `tsconfig.json`, posibles correcciones de código al activar flags).
- `package.json` (raíz): scripts `type-check`; bloque `lint-staged` (`*.ts`).
- `apps/server/package.json`: script `type-check` (y `typescript` como devDependency si se invoca `tsc` desde el workspace).
- `.github/workflows/ci.yml`: jobs `server-typecheck` (L538) y `client-typecheck` (L450) — quitar `if: false` y el `|| echo "TypeCheck: no-op..."`; `prebuild-quality-complete` (L1099-1105) ya los referencia en `needs`.
- `docs/learning/typescript-strict-check.md`: actualización con el estado implementado.
- Desarrolladores: pre-commit más estricto; errores de tipo bloquean PRs antes de merge.
