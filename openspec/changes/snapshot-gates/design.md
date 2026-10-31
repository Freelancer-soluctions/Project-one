# Design: snapshot-gates

## Context

G1 ya vive en `apps/client/vitest.config.js:110` (`update: process.env.CI ? 'none' : 'new'`) y la suite snapshot es grande y estable: 20 ficheros `.snap` (mayor: 987 líneas en `StockDatatable`), 67 ficheros con snapshots inline, 0 huérfanos (verificado 2026-10-28). El plugin que permite G4 está instalado pero inactivo (`@vitest/eslint-plugin@^1.6.9`, `package.json:93`; verificado por runtime que `vitest.configs.recommended` solo trae `no-interpolation-in-snapshots` y `require-local-test-context-for-concurrent-snapshots`). Las invariantes G2/G5 son doc-only (`docs/learning/snapshot-testing.md:192,195,198`) y G6 existía solo como task one-shot del change archivado `2026-10-09-client-snapshot-testing` (task 5.5, que ya probó el patrón de grep anclado y el flujo stale-snapshot). La motivación completa está en `proposal.md` (Why). Restricciones del entorno (CONTEXT-CICD §7): el ruleset 21227644 solo exige 2 contextos y sus `name:` son intocables; los jobs `if: false` (e2e: `ci.yml:2265`) pertenecen a diseño incremental; y la substage 2D es FASE 2 **blocking desde 2026-10-29** (change `ci-testing-gate-promotion`: 0bis.6 cerrado con integration/smoke verdes — runs 40263036010/40263939374 — y `continue-on-error` retirado de los 5 tier-1, verificado en `ci.yml:460-465` y `docs/CONTEXT-CICD.md` §1/§3.1). G1 (`update: 'none'` sobre `test-unit-client`) es por tanto gate bloqueante real HOY. La dependencia externa de la D8 queda satisfecha; lo que no se toca es el rollback per-job de ese change (design D9 ajeno).

## Goals / Non-Goals

**Goals:**

- Hacer enforced (no doc-only) los gates G2-G6 del PRD sobre la capacidad `client-snapshot-testing`, con el patrón de calibración advisory → blocking del repo.
- Cero regresión de los checks requeridos (`Prebuild Governance Complete`, `Governance: PR Body Lint`) y de `client-lint` durante todo el rollout.
- Trazabilidad: cada gate con su script testeable (`*.test.mjs`, patrón `scripts/ci/`) y su verificación en CI.

**Non-Goals:**

- **G7 (regresión visual)**: explícitamente fuera (D3 grill-me); requiere reactivar el job e2e `if: false` (`ci.yml:2265`), prohibido por §7.3 sin su propio change.
- Tocar `continue-on-error` de cualquier job FASE 1 (pertenecen a `ci-testing-gate-promotion`, D1 grill-me).
- Activar cualquier job `if: false` o añadir/renombrar bindings del ruleset 21227644 (§7.8).
- Cambiar `test.update`/`snapshotFormat` más allá de la reducción de presupuesto verificada (G1 permanece como está).
- Añadir reglas nuevas a `scripts/ci/pr-body-lint.mjs` para la casilla G3 (es gate humano, PRD G3).

## Decisions

**D1 — Un change, una capability, higiene ≠ ejecución.** G2-G6 van todos en el delta de `client-snapshot-testing`: comparten superficie de enforcement (scripts `package.json`, `ci.yml` substage testing, eslint del cliente) y el PRD los trata como una capability de gates. La cláusula del main spec «No separate snapshot job SHALL be added» (`openspec/specs/client-snapshot-testing/spec.md:47-49`) se MODIFICA acotándola a jobs de **ejecución**; los jobs de higiene (G2, y G5/G4 como advisory) quedan permitidos con condiciones explícitas. Alternativa: dos changes (enforcement vs remediación de tamaño) — rechazada: fragmenta un mismo contrato de comportamiento y complica la secuencia de calibración (D2 grill-me: change único por capability).

**D2 — G2 como job propio bloqueante a nivel job, cableado al agregador.** `snapshot-update-gate`: job standalone (checkout + setup-monorepo + `node scripts/ci/snapshot-update-gate.mjs`), **sin** `continue-on-error`, con el mismo `if` path-scoped que `client-dead-code` (`ci.yml:1794`), y con **una** entrada nueva en `prebuild-tests-complete.needs` (hoy 5 miembros, `ci.yml:2547+`). Alternativas: (a) step dentro de `client-lint` — rechazada: mezcla concerns y un rename/fallo de lint enmascararía el gate; (b) solo pre-commit — rechazada: el PRD lo classifica como gate de PR con falsos positivos nulos, y el pre-commit local es evadible (`HUSKY=0`); (c) job sin cablear a `needs` — rechazado: no propagaría veredicto (patrón `sast` solo aplica cuando hay bindeo ruleset, aquí no lo hay). El agregador tolera `skipped` (su `if` de veredicto solo falla ante `failure`/`cancelled`), así que los PRs de server/e2e no se afectan.

**D3 — G2: allowlist explícita versionada, patrón anclado.** El gate escanea `apps/*/package.json` + raíz (scripts npm) y todos los `.github/workflows/*.yml` (`run:` steps) con el patrón `-u([ =]|$)|--update|updateSnapshots` — literalmente el grep que la task 5.5d del change archivado ya ejecutó con éxito (evita falsos positivos en substrings `-u`). Allowlist = exactamente `test:snapshot` y `test:snapshot:refresh` de `apps/client/package.json:29-30`. Sin env/label/input de escape: la única exención es editar la allowlist en un PR revisado (spec: «cannot be silently bypassed»). El script se autotestea (`scripts/ci/snapshot-update-gate.test.mjs`) con fixtures temporales, patrón `tia-select.test.mjs`/`pr-body-lint.test.mjs`.

**D4 — G4 incremental: solo `.snap` ahora, inline en la promoción.** `vitest/no-large-snapshots` (`maxSize: 50`, `inlineMaxSize: 50`) se habilita en `eslint.config.js` scoped a `**/__snapshots__/*.snap` (bloque nuevo con `plugins: { vitest }`), y corre en el job advisory `client-snapshot-size` (`continue-on-error: true`, **fuera** de todos los `needs`, precedente `docs-validation`/`lockfile-audit`). `client-lint` no cambia: su glob `**/*.{js,jsx}` (`apps/client/package.json:19`) no matchea `.snap`, y las 19 violaciones inline >50 líneas (máx 262) se remedian en este change pero la regla inline se activa **solo** en el PR de promoción (con `--max-warnings 0`, un `warn` inline prematuro bloquearía `client-lint` hoy). Alternativas rechazadas: (a) regla `warn` en el bloque client actual — rompe `client-lint` inmediatamente; (b) baseline `allowedSnapshots` de 74 entradas — congela deuda y envejece mal; (c) reducir `maxOutputLength` primero — con `update: 'none'` en CI una serialización que excede el presupuesto trunca y **falla** la suite (marcador `…`, commentario `vitest.config.js:105-108`), así que el orden es segmentar → reducir → verificar.

**D5 — G5 como step del mismo job advisory.** El check de huérfanos (`scripts/ci/snapshot-orphan-check.mjs`, exit 1 ante `.snap` sin dueño hermano `__snapshots__/<name>.snap` → `<name>` con matcher, verificado con el check correcto hoy: 20/20 con dueño) corre como step adicional de `client-snapshot-size`: un solo checkout para G4+G5, dos veredictos separados por step name, menos jobs que mantener. El spec permite «companion step or job»; se elige step.

**D6 — G6 como job propio en el nightly.** `nightly-snapshot-drift` (nuevo job en `nightly-full-suite.yml`, que ya corre `40 2 * * *`, L27): setup normal → `npm run test:snapshot:refresh --workspace=apps/client` (el comando local allowlistado, invocado explícitamente) → `git diff --exit-code` + `git status --porcelain` filtrado a artefactos de snapshot → exit 1 con la lista de ficheros en el log. Alternativa: step dentro de `nightly-client` — rechazada: su veredicto ya carga coverage advisory, TIA history y coverage-map; el drift merece semántica aislada (mismo racional que D7 de `coverage-tripwire-stage-2d` separó el nocturno del `ci.yml`). Al ser workflow de schedule, jamás entra en `needs` ni en checks de PR (spec: «never reaches the merge path»).

**D7 — Reducción de presupuesto condicionada a evidencia.** `snapshotFormat.maxOutputLength` (100000, `vitest.config.js:109`) baja (objetivo orientativo 25000-50000) solo tras una corrida full-suite con el presupuesto candidato y cero marcadores de truncamiento; si hay truncamiento, se segmentan antes las entradas implicadas y se reintenta. Sin ratchet automático: la decisión es por evidencia, no por script.

**D8 — Promoción atómica, condicionada y diferida.** El paso final (quitar `continue-on-error` de `client-snapshot-size`, activar la regla inline en el bloque client de `eslint.config.js`, mover la taxonomía a blocking en `docs/learning/quality-gates.md` §2) es **un PR atómico** que solo se abre con: (i) ventana ≥2 semanas de advisory limpio, (ii) dependencia `ci-testing-gate-promotion` verificada satisfecha (2026-10-29: 5 tier-1 sin COE — solo queda la ventana de calibración de este change), (iii) drift nightly estable. Si queda hallazgo, la ventana se extiende con la razón registrada (precedente: `ci-testing-gate-promotion` D2; `typosquatting-detection`).

## Risks / Trade-offs

- [Falso positivo de G2 por substring `-u`] → patrón anclado probado en producción por la task 5.5d archivada; tests unitarios del script con casos negativos (`--max-warnings`, URLs, `-url`).
- [Confusión sobre cuándo «bloquea» G2: hoy solo 2 checks ruleset bloquean merge] → el job es rojo y propaga `prebuild-tests-complete` → `build-complete` → `ci-complete`; el step summary lo explica explícitamente y la fuerza de merge efectiva llega con la promoción del pipeline (fuera de este change).
- [Drift nightly ruido por entorno (fonts, ICU)] → la determinismidad ya está asegurada por fixtures/frozen time/i18n `en` (main spec, escenario «CI runs are deterministic»); el drift real se triagea como hallazgo, nunca se «arregla» de noche; FASE advisory.
- [Remediación G4 (19 inline + entradas `.snap` >50) con diff grande] → se reparte por módulo en PRs revisables; la casilla G3 del template obliga a explicar cada cambio de snapshot.
- [Reducción de presupuesto rompe Datatables grandes] → verificación de marcadores de truncamiento antes de aceptar; revert del presupuesto sin tocar snapshots.
- [`skipped` del job path-scoped en PRs de server enmascara el gate] → mismo trade-off aceptado por `client-lint`/`client-dead-code` (CONTEXT-CICD §3.3): el gate solo aplica donde hay superficie snapshot; los workflows (`run:` steps) se escanean en TODOS los PRs porque un `-u` puede entrar por un cambio `shared`.

## Migration Plan

1. **PR-A (gates + advisory barato):** G2 (script+test+job+entrada en `needs`), G3 (template), G5 (script+step), G4 (regla scoped `.snap` + job advisory), lockstep docs. Rollback: revert puro (sin datos, sin baselines).
2. **PR-B1..Bn (remediación, por módulo):** los 19 bloques inline >50 → subtree snapshots; segmentación de entradas `.snap` >50 (empezando por Stock 987/Users/Payroll/Employees 857); reducción de presupuesto cuando la verificación salga limpia (D7).
3. **Calibración:** ≥2 semanas de `client-snapshot-size` y `nightly-snapshot-drift` limpios; triaje de cualquier hallazgo.
4. **PR-D (promoción atómica, D8):** condicionado solo a la ventana de calibración de este change (la dependencia externa `ci-testing-gate-promotion` está satisfecha desde 2026-10-29); quita COE + activa inline + docs. Rollback de D: reponer `continue-on-error: true` por job en un PR con causa registrada (precedente `ci-testing-gate-promotion` D2).

## Open Questions

- ¿Ventana de calibración de 2 o 4 semanas? La spec fija el mínimo (≥2); se decide al cierre con la carga real de hallazgos, sin tocar specs ni tasks.
- ¿En la promoción, G4/G5 se quedan en un job blocking propio o se pliegan a `client-lint`? El spec permite las dos formas («or folds the check into `client-lint`»); se decide en PR-D según el ruido del job.
