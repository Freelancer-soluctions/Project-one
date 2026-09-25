# Tasks

## 1. tsconfig base

- [ ] 1.1 Create root `tsconfig.json` with shared base (`strict: false`, `noEmit`, `skipLibCheck`) and verify `npx tsc --noEmit -p .` parses without "no inputs" errors
- [ ] 1.2 Create `apps/server/tsconfig.json` extending the root config with `include: ["src/**/*"]` and verify `npx tsc --noEmit -p apps/server` runs against server sources
- [ ] 1.3 Confirm no strictness flag is passed only via CLI: `grep -rn "tsc" package.json apps/server/package.json .github/workflows/ci.yml` shows no `--strict`/flag overrides outside tsconfig files
- [ ] 1.4 Record the error baseline before any flag change: `npx tsc --noEmit -p apps/server 2>&1 | wc -l` output documented in the change notes

## 2. Flags strict gradual

- [ ] 2.1 Enable cheap opt-ins first (`noImplicitReturns`, `noFallthroughCasesInSwitch`) in `apps/server/tsconfig.json` and verify `npx tsc --noEmit -p apps/server` delta vs baseline is resolved or accepted
- [ ] 2.2 Enable `noImplicitAny`, fix reported errors (TS7006), and verify the typecheck delta is zero
- [ ] 2.3 Enable `strictNullChecks` plus `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`; fix errors (TS18048, TS2564) and verify `npx tsc --noEmit -p apps/server` passes
- [ ] 2.4 Enable `useUnknownInCatchVariables` and verify Express error middleware narrows `catch (err)` with `err instanceof Error` (no implicit `any` usage of `err`)
- [ ] 2.5 Enable `noUncheckedIndexedAccess` LAST (own step), fix index-access errors (`rows[0]`, `process.env[KEY]`, `req.body[key]`), and verify `npx tsc --noEmit -p apps/server` passes
- [ ] 2.6 Verify no big-bang flip: `grep -n "strict" tsconfig.json apps/server/tsconfig.json` shows `strict: true` only after all prior flags are adopted

## 3. Scripts type-check

- [ ] 3.1 Add root `package.json` script `"type-check": "tsc --noEmit -p apps/server"` and verify `npm run type-check` exits 0 on clean code and non-zero on an injected type error
- [ ] 3.2 Add `"type-check"` script to `apps/server/package.json` and verify `npm run type-check --workspace=apps/server` behaves identically
- [ ] 3.3 Verify `typescript` availability for scripts: root devDependency/workspace resolution confirmed by `npx tsc --version` inside `apps/server`

## 4. lint-staged

- [ ] 4.1 Extend root `package.json` `lint-staged` so `*.ts` files get the TypeScript pipeline (prettier already via `*.{...,ts,...}` glob; add lint/type step as configured) and verify `npx lint-staged --debug` lists the rule for a staged `.ts` file
- [ ] 4.2 Verify a staged `*.ts` file commit runs the pipeline (test commit on a scratch file, confirm output, revert)
- [ ] 4.3 Verify pre-commit does not run a full non-incremental project type check (config inspection: incremental or format/lint only)

## 5. CI server-typecheck / client-typecheck

- [ ] 5.1 In `.github/workflows/ci.yml`, remove `if: false` from `server-typecheck` and replace the `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op..."` step with `npm run type-check`; verify `grep -n "if: false" .github/workflows/ci.yml` no longer matches the `server-typecheck` job (L538)
- [ ] 5.2 Remove `|| echo` fallback from `server-typecheck` and verify `grep -n 'echo "TypeCheck' .github/workflows/ci.yml` returns no matches
- [ ] 5.3 Remove `if: false` from `client-typecheck` (L450) and set its type check step; verify the job is enabled and runs `tsc --noEmit`/`type-check:client`
- [ ] 5.4 Verify `prebuild-quality-complete` `needs` still includes `server-typecheck` and `client-typecheck` (L1099-1105) so failures block the aggregate gate
- [ ] 5.5 Run the workflow through `actionlint` (or `npm run lint` CI script) and verify no YAML/lint errors are introduced

## 6. Doc actualizado

- [ ] 6.1 Update `docs/learning/typescript-strict-check.md` sections 1, 5 and 6 to reflect implemented state (tsconfig files exist, scripts, lint-staged, CI jobs enabled without `if: false`/`|| echo`) and verify claims against the repo with grep
- [ ] 6.2 Remove the corrupted/garbled line in section 6 (stray `etr bounce использовании Паспорт` text) and verify the section reads cleanly
- [ ] 6.3 Verify the doc's flag order matches `apps/server/tsconfig.json` (cheap → family → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess` last)

## 7. Referencias typescriptlang.org

- [ ] 7.1 Verify section 7 of the doc cites `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/tsconfig/` and `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html` (`grep -n "typescriptlang.org" docs/learning/typescript-strict-check.md`)
- [ ] 7.2 Verify the proposal/design/spec artifacts reference official docs for flag semantics and cross-link `docs/learning/typescript-migration-server.md` and `docs/CONTEXT-CICD.md`

## 8. Validación final

- [ ] 8.1 Run `openspec validate typescript-strict-check --strict` (or `openspec validate --changes`) and verify the change passes with the `config-correctness` delta
- [ ] 8.2 Verify full pipeline: `npm run type-check` + `npm run lint` + `npm run format:check` all exit 0
