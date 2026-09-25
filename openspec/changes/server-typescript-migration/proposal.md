# Proposal

## Why

`apps/server` is the largest JS-only workspace (228 files, ~29k lines, 24 modules) while the client already runs React 18 + Vite with native TS support. The canonical research document `docs/learning/typescript-migration-server.md` (2026-09-23) verified the codebase is unusually well positioned for migration: pure ESM (`"type": "module"`, zero `require()`), **389/389 relative imports already end in `.js`** (the exact convention `moduleResolution: nodenext` expects — zero import churn), ~2,556 JSDoc annotations that `checkJs` can type-check today, and a CI job `server-typecheck` that already exists in `.github/workflows/ci.yml` (L538) disabled with `if: false` and the literal message "TypeCheck: no-op until TS migration" — the migration was anticipated by the architecture but never executed.

Meanwhile, runtime type-safety gaps are real: 19 scattered `process.env.*` accesses without validation, two hand-rolled Prisma client instantiations, and type-less Express handlers across all 24 modules. Doing this incrementally (strangler fig with `allowJs` + `noEmit`) is the only way to migrate 228 files without ever breaking execution: Node keeps running the `.js` sources while TypeScript verifies, and each converted file is an independent, revertible commit.

## What Changes

- **Create `apps/server/tsconfig.json`** — `allowJs` + `checkJs` (evaluated; fall back to `checkJs: false` if the baseline error volume is too high), `noEmit`, `module: nodenext`, `moduleResolution: nodenext`, `strict: false` (flags enabled one-by-one in the final phase), `incremental`
- **Install missing type packages** in `apps/server` devDependencies: `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/swagger-jsdoc`, `@types/swagger-ui-express` (+ any `@types/*` the baseline `tsc --noEmit` run demands)
- **Extend `.ts` coverage across the toolchain BEFORE converting any file** — eslint flat-config backend/complexity blocks, server `lint`/`format` scripts, root `knip.jsonc` server section, `.dependency-cruiser.cjs` regexes, `vitest.config.js` includes, root `lint-staged` eslint glob
- **Enable the `server-typecheck` CI job** — remove `if: false` and the "no-op until TS migration" placeholder; the job runs `npx tsc --noEmit` as a quality gate
- **Establish the conversion protocol** (documented in the change and the canonical doc): one file = one commit via `git mv` + type the public signatures; `@typedef` of a converted file dies in the same commit (replaced by `types.ts` or inline interfaces); no new `any`; `@ts-nocheck` only as a justified, tracked exception
- **Track progress with a `.ts`/total file counter** in `docs/CONTEXT-CICD.md` (updated per phase)

**Explicitly out of scope for this change** (subsequent changes per phase): converting any source file (Phases 1–3), activating `strict` flags, migrating `bin/index.js` entry, rewriting imports to `.ts` extensions.

## Capabilities

### New Capabilities

- `server-typescript-incremental-migration`: Incremental TypeScript migration of the `apps/server` workspace. Covers Phase 0 infrastructure (tsconfig with `allowJs`/`noEmit`/`nodenext`, type packages, `.ts` toolchain coverage, enabled `server-typecheck` CI gate), the per-file conversion protocol that guarantees a green build at every commit, and the phased rollout order (graph leaves → modules → transversal core) with strict-mode hardening at the end.

## Impact

| File                                           | Change                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ----- |
| `apps/server/tsconfig.json`                    | **New** — verification-only TS config (see above)                               |
| `apps/server/package.json`                     | devDeps: `@types/*` packages; `lint`/`format` scripts gain `ts`                 |
| `.github/workflows/ci.yml`                     | `server-typecheck`: remove `if: false`; command `npx tsc --noEmit`              |
| `eslint.config.js`                             | Backend + complexity blocks: `apps/server/**/*.js` → `{js,ts}`                  |
| `knip.jsonc`                                   | `apps/server` section: add `src/**/*.ts`, `tests/**/*.ts` to `project`          |
| `apps/server/.dependency-cruiser.cjs`          | Rule path regexes: `\\.js$` → `\\.(js                                           | ts)$` |
| `apps/server/vitest.config.js`                 | `include` globs gain `*.ts` variants                                            |
| `package.json` (root)                          | `lint-staged` eslint glob gains `ts` (prettier already covers `ts`)             |
| `docs/CONTEXT-CICD.md`                         | §1 status table: `server-typecheck` → Activo; progress-metrics note             |
| `docs/learning/typescript-migration-server.md` | Research doc linked as canonical reference; gains the conversion-protocol recap |

**Risks:**

- `checkJs: true` over 228 legacy files may surface a large error baseline → decision gate inside task 1.3: if volume blocks CI, start with `checkJs: false` and defer to Phase 3 (recorded in the change)
- Widening tooling globs (knip, dep-cruiser, eslint) may surface new findings on `.ts` files that don't exist yet — zero-cost today, guards the first conversion
- `tsc --noEmit` adds CI time over a growing file count → `incremental: true` + existing node_modules cache; measured in task 1.5
- Enabling `server-typecheck` fails the pipeline if the baseline is not clean → the task sequence makes the baseline green BEFORE the CI job is enabled

**Baseline (recorded for the change):** 228 JS files / 0 TS; imports `.js`-suffixed 389/389; `server-typecheck` job present, disabled, no-op.
