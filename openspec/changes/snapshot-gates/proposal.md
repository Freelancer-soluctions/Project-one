# Proposal: snapshot-gates

## Why

La auditoría @reviewer (2026-10-28) contra el PRD `PRDS/Snapshot-tests-(Testing Library)-en-un-pipeline-enterprise.md` verificó que la capacidad `client-snapshot-testing` solo materializa **G1** (inmutabilidad por config, `apps/client/vitest.config.js:110`). Los demás gates del PRD viven como **invariante documental, no enforced**: el gate G2 (sin `-u` en CI) es solo doc (`docs/learning/snapshot-testing.md:192`), no existe chequeo de snapshots huérfanos (G5), no hay drift probe recurrente (G6), el tamaño de snapshots no lo regula lint (G4: `vitest/no-large-snapshots` existe en `@vitest/eslint-plugin@^1.6.9` — `package.json:93` — pero no está habilitado; baseline medida: **74/258 entradas `.snap` >50 líneas, máx 138; 19 bloques inline >50, máx 262**), y el checklist de PR no menciona snapshots (G3). Riesgo concreto: `apps/client/package.json:29-30` define `-u`/`--update=new` legítimos solo para uso local, pero **nada impide** que un `-u` entre a un script consumido por CI o a un step de workflow — eso sobreescribiría `update: 'none'` (G1) y convertiría el gate en aprobador automático de cambios de UI, exactamente el anti-patrón central del PRD. La suite hoy es grande (20 ficheros `.snap` — el mayor, 987 líneas; 67 ficheros con snapshots inline) y crece sin techo.

## What Changes

- **G2 — grep gate de `-u` (día uno, blocking a nivel job):** script testeable `scripts/ci/snapshot-update-gate.mjs` (con `*.test.mjs`, patrón repo) que falla si `-u`/`--update`/`updateSnapshots` aparece en los scripts npm consumidos por CI o en steps `run:` de `.github/workflows/*.yml`, con allowlist explícita de `test:snapshot`/`test:snapshot:refresh` (`apps/client/package.json:29-30`). Job standalone en `ci.yml` cableado a `prebuild-tests-complete.needs`.
- **G3 — checklist de PR:** casilla «Snapshots reviewed and explained (if applicable)» en la sección _Pre-merge Checklist_ de `.github/PULL_REQUEST_TEMPLATE.md` (hoy sin mención a snapshots). Sin interacción con las reglas de `scripts/ci/pr-body-lint.mjs` (checkbox no marcada se strippa; secciones requeridas intactas).
- **G4 — `vitest/no-large-snapshots`:** habilitar la regla (existente, hoy inactiva) scoped a artefactos de snapshot, con **job advisory separado `continue-on-error: true` (FASE 1)** para no romper `client-lint` (`apps/client/package.json:19`, `--max-warnings 0`); remediación de los 19 bloques inline >50 líneas y segmentación de las entradas `.snap` más grandes a subárbol; reducir `snapshotFormat.maxOutputLength` desde 100000 (`apps/client/vitest.config.js:109`) solo tras verificar sin truncamiento. Promoción a blocking = PR atómico final tras ventana de calibración (patrón repo).
- **G5 — script de huérfanos:** `scripts/ci/snapshot-orphan-check.mjs` (`.snap` sin fichero de test dueño → exit 1; baseline hoy = 0 huérfanos verificados) + job advisory en `ci.yml` (FASE 1).
- **G6 — drift probe:** job nocturno `nightly-snapshot-drift` en `.github/workflows/nightly-full-suite.yml` (activo, cron `40 2 * * *`, `nightly-full-suite.yml:27`) que corre la suite client con update en el checkout desechable y falla si `git diff`/archivos no tracked muestran cambios (hoy solo existía una task one-shot en el change archivado `2026-10-09-client-snapshot-testing`, task 5.5).
- **G1 (contexto, no trabajo):** se documenta la dependencia de `CI=true` (implícito en GitHub Actions; solo `property-tests` lo declara explícito — `ci.yml:1228`) como residual aceptado. Sin cambios de config.

**No es trabajo de este change (D1/D3):** tocar `continue-on-error` de ningún job FASE 1 (promover `test-unit-client` a blocking ya es task 3.1 de `openspec/changes/ci-testing-gate-promotion/`, prerrequisito 0bis.6 y promoción FASE 2 de los 5 jobs tier-1, ambos CERRADOS el 2026-10-29 — `docs/CONTEXT-CICD.md` §1/§3.1; reactivar el job e2e `if: false` (`ci.yml:2265`); **G7 (regresión visual)** — Non-Goal explícito, change futuro propio.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `client-snapshot-testing`: se añaden los requirements de enforcement de G2-G6 (grep gate de update flags, checklist de PR, límite de tamaño por lint, detección de huérfanos, drift probe nocturno) y se MODIFICA el requirement «Snapshot tests run in the CI prebuild testing substage» para acotar su cláusula «No separate snapshot job SHALL be added» a jobs de **ejecución** de snapshots, permitiendo jobs de higiene (G2/G5) cableados al agregador de testing.

## Impact

- **CI/CD:** `.github/workflows/ci.yml` (+2 jobs: `snapshot-update-gate` bloqueante a nivel job, `client-snapshot-size` advisory FASE 1; +2 entradas en `prebuild-tests-complete.needs`), `.github/workflows/nightly-full-suite.yml` (+1 job nocturno drift probe). Ningún `name:` de job ligado al ruleset 21227644 se toca (CONTEXT-CICD §7.8); ningún job existente cambia `continue-on-error`.
- **Tooling local:** `scripts/ci/snapshot-update-gate.mjs`, `scripts/ci/snapshot-orphan-check.mjs` (+tests `*.test.mjs`), `scripts/ci/snapshot-drift-check.mjs` (o step shell equivalente), `eslint.config.js` (bloque `**/__snapshots__/*.snap` con `vitest/no-large-snapshots`), `package.json` raíz (scripts npm de los gates).
- **Código de test:** `apps/client/src/**/*.ui.test.jsx` (remediación de 19 bloques inline >50 líneas) y `apps/client/src/modules/**/__snapshots__/*.snap` (segmentación de entradas grandes).
- **Docs/templates:** `.github/PULL_REQUEST_TEMPLATE.md` (G3), `docs/learning/snapshot-testing.md` (lockstep: la invariante doc de L192 pasa a estar enforced por G2).
- **Dependencias externas:** `openspec/changes/ci-testing-gate-promotion` (dependencia SATISFECHA 2026-10-29: 0bis.6 cerrado y FASE 2 blocking activa; su ventana de calibración sigue abierta — no tocar sus `continue-on-error` ni su rollback per-job), regla de oro CONTEXT-CICD §7.3 (no activar `if: false`).
