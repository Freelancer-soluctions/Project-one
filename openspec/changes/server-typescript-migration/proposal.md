# Proposal

> **Change unificado (2026-10-01):** absorbe el change `typescript-strict-check` (0/28, nunca implementado). Su infraestructura base ya existe en el árbol (creada por el change `quality-gates`: `tsconfig.json` raíz + `apps/server/tsconfig.json`, script `type-check`, job `server-typecheck` ACTIVO sin `if: false` ni `|| echo` — verificado 2026-10-01), por lo que sus tasks de infraestructura quedaron stale. Su valor único —el **orden gradual de flags `strict`**, la cobertura `lint-staged` de `*.ts` y el lockstep documental con referencias `typescriptlang.org`— vive ahora aquí como **Fase 4**, dueño único del orden de adopción. La carpeta `openspec/changes/typescript-strict-check/` se elimina.

## Why

`apps/server` is the largest JS-only workspace (228 files, ~29k lines, 24 modules) while the client already runs React 18 + Vite with native TS support. The canonical research document `docs/learning/typescript-migration-server.md` (2026-09-23) verified the codebase is unusually well positioned for migration: pure ESM (`"type": "module"`, zero `require()`), **389/389 relative imports already end in `.js`** (the exact convention `moduleResolution: nodenext` expects — zero import churn), ~2,556 JSDoc annotations that `checkJs` can type-check today, and a CI job `server-typecheck` that already exists in `.github/workflows/ci.yml` **enabled** (the `quality-gates` change already removed `if: false` and the "TypeCheck: no-op until TS migration" placeholder). The migration was anticipated by the architecture; what remains is the conversion itself and the strict-mode hardening.

Meanwhile, runtime type-safety gaps are real: 19 scattered `process.env.*` accesses without validation, two hand-rolled Prisma client instantiations, and type-less Express handlers across all 24 modules. Doing this incrementally (strangler fig with `allowJs` + `noEmit`) is the only way to migrate 228 files without ever breaking execution: Node keeps running the `.js` sources while TypeScript verifies, and each converted file is an independent, revertible commit.

The duplicated change `typescript-strict-check` planned exactly the complementary half: a **gradual, ordered adoption of strict flags** (cheap flags first, `strict` family next, `noUncheckedIndexedAccess` last) instead of a big-bang `strict: true`, plus `lint-staged` coverage for `*.ts` and doc/official-reference lockstep. Owning both halves in one change removes the duplicated activation tasks (already done by `quality-gates`) and gives the migration a single, ordered path from Phase 0 tooling to full strict.

## What Changes

- **Create `apps/server/tsconfig.json`** — ~~`allowJs` + `checkJs`~~ **YA EXISTE (change `quality-gates`)**: verificación-only (`noEmit`, `allowJs`, `module/moduleResolution: nodenext`, `checkJs: false`, `strict` ausente). Este change la evalúa contra su objetivo Fase 0 (`checkJs: true` con gate de decisión) en la tarea 1.3.
- **Install missing type packages** in `apps/server` devDependencies: `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/swagger-jsdoc`, `@types/swagger-ui-express` (+ any `@types/*` the baseline `tsc --noEmit` run demands)
- **Extend `.ts` coverage across the toolchain BEFORE converting any file** — eslint flat-config backend/complexity blocks, server `lint`/`format` scripts, root `knip.jsonc` server section, `.dependency-cruiser.cjs` regexes, `vitest.config.js` includes, root `lint-staged` eslint glob
- **~~Enable the `server-typecheck` CI job~~ HECHO** — el job ya corre como quality gate (`quality-gates` lo activó con el comando real, sin placeholder); el orden "baseline verde antes de gate" ya se consumó; este change solo verifica que el baseline se mantiene verde al ampliar `checkJs`
- **Establish the conversion protocol** (documented in the change and the canonical doc): one file = one commit via `git mv` + type the public signatures; `@typedef` of a converted file dies in the same commit (replaced by `types.ts` or inline interfaces); no new `any`; `@ts-nocheck` only as a justified, tracked exception
- **Gradual strict-flag adoption (absorbed from `typescript-strict-check`) as Phase 4**: cheap opt-ins first (`noImplicitReturns`, `noFallthroughCasesInSwitch`), then the `strict` family (`noImplicitAny` → `strictNullChecks` con `strictBindCallApply`/`strictFunctionTypes`/`strictPropertyInitialization`), then `useUnknownInCatchVariables`, and `noUncheckedIndexedAccess` **last** — one flag per step, each with a `tsc --noEmit` error baseline before/after; `strict: true` never flipped while error-producing flags remain unadopted; strictness flags live ONLY in `tsconfig.json` (no ad-hoc CLI flags in scripts/CI)
- **lint-staged `*.ts` pipeline (absorbed)**: format via the existing prettier glob + lint/depcruise steps so staged TypeScript files are processed at pre-commit time, while full-project checking stays in `type-check` and CI
- **Doc + official references (absorbed)**: `docs/learning/typescript-strict-check.md` updated to the implemented state and citing `typescriptlang.org` (tsconfig `strict`, flag list, handbook) as normative flag-semantics references, cross-linked with `docs/learning/typescript-migration-server.md`
- **Track progress with a `.ts`/total file counter** in `docs/CONTEXT-CICD.md` (updated per phase)

**Explicitly out of scope for this change** (subsequent changes per phase): bulk-converting modules is IN scope as phases 2-3 of THIS change's roadmap but executed as separate changes (`server-ts-phase1-leaves`, `server-ts-phase2-modules`, `server-ts-phase3-core`) — see tasks; migrating `bin/index.js` entry stays in the phase-3 change; rewriting imports to `.ts` extensions remains out of scope forever (nodenext convention).

## Capabilities

### New Capabilities

- `server-typescript-incremental-migration`: Incremental TypeScript migration of the `apps/server` workspace. Covers Phase 0 infrastructure (verification-only tsconfig, type packages, `.ts` toolchain coverage, the already-enabled `server-typecheck` CI gate), the per-file conversion protocol that guarantees a green build at every commit, the phased rollout order (graph leaves → modules → transversal core), and the **gradual strict-mode hardening** (ordered per-flag adoption owned by this change, absorbed from `typescript-strict-check`).

### Modified Capabilities

- `config-correctness`: se extiende para cubrir la corrección de la configuración de TypeScript en lo NO cubierto por la migración: `tsconfig.json` como fuente única de verdad de los flags de strictness (prohibidos los overrides por CLI), el **orden gradual de adopción de flags** (cheap → familia `strict` → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess` al final, sin big-bang), los scripts `type-check` y la cobertura `lint-staged` de `*.ts`, y la obligación de que los jobs CI `server-typecheck`/`client-typecheck` ejerciten el chequeo real (sin `if: false`, sin `|| echo`).

## Impact

| File                                           | Change                                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --- | ----- |
| `apps/server/tsconfig.json`                    | **Existe** (`quality-gates`); este change evalúa `checkJs: true` (gate de decisión) y aplica flags strict en Fase 4              |
| `tsconfig.json` (raíz)                         | **Existe** (`quality-gates`); sigue como base compartida; fuente única de strictness                                             |
| `apps/server/package.json`                     | devDeps: `@types/*`; `lint`/`format` scripts gain `ts`; script `type-check` (verificar que existe)                               |
| `.github/workflows/ci.yml`                     | ~~`server-typecheck`: remove `if: false`~~ **ya activo** (`quality-gates`); solo verificación de que el paso no lleva fallback ` |     | echo` |
| `eslint.config.js`                             | Backend + complexity blocks: `apps/server/**/*.js` → `{js,ts}`                                                                   |
| `knip.jsonc`                                   | `apps/server` section: add `src/**/*.ts`, `tests/**/*.ts` to `project`                                                           |
| `apps/server/.dependency-cruiser.cjs`          | Rule path regexes: `\.js$` → `\.(js\|ts)$`                                                                                       |
| `apps/server/vitest.config.js`                 | `include` globs gain `*.ts` variants                                                                                             |
| `package.json` (root)                          | `lint-staged`: confirmar/especificar pipeline de `*.ts` (prettier ya cubre `ts`; añadir step lint/depcruise si falta)            |
| `docs/CONTEXT-CICD.md`                         | §1 status table: `server-typecheck` → Activo (hecho); progress-metrics note (`% archivos .ts` por fase)                          |
| `docs/learning/typescript-migration-server.md` | Research doc linked as canonical reference; gains the conversion-protocol recap                                                  |
| `docs/learning/typescript-strict-check.md`     | (absorbido) actualizado al estado implementado con orden de flags y referencias `typescriptlang.org`                             |

**Risks:**

- `checkJs: true` over 228 legacy files may surface a large error baseline → decision gate inside task 1.3: if volume blocks CI, stay at `checkJs: false` and defer to the strict phase (recorded in the change)
- Widening tooling globs (knip, dep-cruiser, eslint) may surface new findings on `.ts` files that don't exist yet — zero-cost today, guards the first conversion
- `tsc --noEmit` adds CI time over a growing file count → `incremental: true` + existing node_modules cache; measured in task 1.5
- Strict flags revelan errores acumulados en código convertido → el orden gradual (cheap → family → last) acota cada paso a un baseline medible; un flag = un PR revertible
- Enabling strict flags breaks the green `server-typecheck` gate mid-migration → cada flag entra solo cuando su delta de errores llega a 0; el orden de tareas lo garantiza

**Baseline (recorded for the change, updated 2026-10-01):** 228 JS files / 0 TS; imports `.js`-suffixed 389/389; `server-typecheck` job presente y ACTIVO (calidad gates), baseline verde; `tsconfig.json` raíz + server existentes con `checkJs: false`.
