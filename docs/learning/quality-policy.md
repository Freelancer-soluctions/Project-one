# Política de calidad — registro de gates (Stage Quality)

> Fuente de verdad ejecutable: `.github/workflows/ci.yml`. Este documento es el
> registro auditable de **estado, dueño y umbral** de cada gate; un PR que cambie
> el estado de un gate DEBE actualizar esta tabla en el mismo PR
> (capability `quality-governance`, change `ci-quality-gates-blocking-hardening`).
> Última revisión: 2026-11-12.

## 1. Reglas de la política

1. **Blocking desde el día uno** por defecto: un gate nuevo se calibra en el PR
   que lo introduce y bloquea desde su primer run. Las fases advisory solo se
   usan cuando existe una ventana de calibración explícita con fecha de salida.
2. **Un solo check requerido por stage**: el ruleset de `main` exige el
   agregador (`Prebuild Quality Complete`), no los jobs individuales, para que
   renombrar un job no rompa el merge gate.
3. **Un skipped no es un verde**: `prebuild-quality-complete` falla ante
   `failure`, `cancelled` o `skipped` no autorizado por `repo-discovery`
   (capability `quality-gate-aggregator-strict`). Los jobs PR-only se saltan por
   diseño en `merge_group`/`workflow_dispatch` (autorizado por evento).
4. **Supresiones con costo**: toda excepción (baseline, allowlist, `eslint-disable`,
   entrada de `security/exceptions.yml`) vive en `quality-exceptions.md` con
   motivo, responsable y caducidad.
5. **Tooling aparte del producto**: ESLint, Prettier, TypeScript, knip,
   dependency-cruiser y los pins de actions se actualizan en un PR de
   herramientas agrupado; una versión mayor se prueba antes en un job advisory
   paralelo (§4).
6. **Solo afectado**: los jobs se filtran por `repo-discovery`; `merge_group` y
   `workflow_dispatch` corren la suite completa.

## 2. Registro de gates (estado actual)

| Gate (job id)                                   | Herramienta                                    | Estado                       | Promoción  | Dueño         | Umbral / ajuste                                                                           |
| ----------------------------------------------- | ---------------------------------------------- | ---------------------------- | ---------- | ------------- | ----------------------------------------------------------------------------------------- |
| `client-lint` / `server-lint` / `e2e-lint`      | ESLint 9 (`--max-warnings 0 --cache`)          | blocking (PR)                | 2026-09-26 | devops-team   | 0 warnings; `reportUnusedDisableDirectives: 'error'`; `@typescript-eslint/ban-ts-comment` |
| `client-format-check`                           | Prettier `--check`                             | blocking (PR)                | 2026-09-26 | frontend-team | 0 diferencias (globs del script `format:check`)                                           |
| `server-format-check`                           | Prettier `--check`                             | blocking (PR)                | 2026-11-12 | backend-team  | 0 diferencias; deuda previa = artefactos generados, ahora en `.prettierignore`            |
| `e2e-format-check`                              | Prettier `--check`                             | blocking (PR)                | 2026-11-12 | qa-team       | 0 diferencias; artefactos de Playwright ignorados                                         |
| `client-typecheck` / `server-typecheck`         | `tsc --noEmit`                                 | blocking (PR)                | 2026-09-26 | devops-team   | 0 errores; `strict` gradual por `server-typescript-migration`                             |
| `client-complexity` / `server-complexity`       | ESLint `complexity` / `max-lines-per-function` | blocking (PR)                | 2026-09-26 | devops-team   | 15 core / 10 utils / off tests; 80 líneas por función                                     |
| `client-import-bounds` / `server-import-bounds` | dependency-cruiser 18 (`--ignore-known`)       | blocking (PR)                | 2026-09-28 | architects    | 0 violaciones nuevas vs baseline                                                          |
| `client-dead-code` / `server-dead-code`         | knip 6.45.1 (`--production --cache`)           | advisory (PR, calibración)   | 2026-11-12 | devops-team   | `--no-exit-code --max-issues 0`; ratchet warn→error por tipo (§3.1); promoción a blocking pendiente |
| `dead-code-triage` (`scheduled-quality.yml`)    | knip 6.45.1 (modo default)                     | advisory (scheduled)         | —          | devops-team   | Semanal (lun 05:00 UTC); triage humano; reporte artifact 90 días; no toca `ci-complete`     |
| `db-contract`                                   | `prisma migrate diff` + shadow DB              | blocking (PR)                | 2026-10-01 | backend-team  | 0 drift schema↔migraciones                                                                |
| `api-contract`                                  | Generación OpenAPI + Spectral                  | blocking (PR)                | 2026-10-01 | backend-team  | 0 errores (`spectral:oas`)                                                                |
| `frontend-budgets`                              | size-limit + Lighthouse CI                     | blocking (PR)                | 2026-10-19 | frontend-team | 204 800 B total; LCP/TBT según presupuesto                                                |
| `root-manifest-guard`                           | `scripts/check-root-manifest.mjs`              | blocking (PR)                | 2026-09-29 | devops-team   | `dependencies ⊆` directos ∪ `manifest-allowlist.json`                                     |
| `validate-pipeline`                             | yamllint 1.38.0 + actionlint 1.7.12            | blocking (PR)                | 2026-09-30 | devops-team   | 0 hallazgos en `.github/workflows/**`                                                     |
| `openspec-validate`                             | OpenSpec CLI (strict) + `test:scripts`         | blocking (PR)                | 2026-09-26 | architects    | 0 errores; `## Purpose` no-placeholder                                                    |
| `docs-validation`                               | markdownlint 0.49 + vale 3.22.0                | advisory (PR)                | —          | core-team     | Reporte en Step Summary; fase 2 pendiente                                                 |
| `sonarqube` (client/server)                     | SonarQube                                      | **inactivo** (sin token, D2) | —          | devops-team   | Quality Gate "Sonar way" si se activa                                                     |

## 3. Ratchet (solo se baja)

El ratchet es el mecanismo por el que la deuda existente se congela y **nunca
crece**; el contador solo puede bajar:

| Artefacto                         | Mecanismo                                                                  | Regla de poda                                                                           |
| --------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Warnings de ESLint                | `--max-warnings 0` en todos los scripts `lint`                             | Un warning nuevo falla el job; no existe margen que "absorba" deuda                     |
| Directivas `eslint-disable`       | `reportUnusedDisableDirectives: 'error'`                                   | Una directiva que deja de suprimir algo falla el lint: se borra, no se acumula          |
| Violaciones de dependency-cruiser | `.dependency-cruiser-known-violations.json` + `--ignore-known`             | El baseline solo se poda; una violación nueva falla aunque el baseline exista           |
| Cobertura                         | `.coverage-policy.json` / `.coverage-baseline.json` + `check-coverage.mjs` | Los floors suben por PR; una bajada exige baseline auditado (`coverage:baseline:check`) |
| Entradas ignoradas de knip        | `knip.jsonc` (`ignore*`)                                                   | Solo se eliminan al resolver el falso positivo; el crecimiento se revisa en PR          |
| Severidad de hallazgos de knip    | `knip.jsonc` `rules` (warn→error) + `--max-issues 0`                       | Un tipo que llega a cero se lockea en `error`; la regresión bloquea al promover (§3.1)  |
| Allowlist del manifest raíz       | `manifest-allowlist.json`                                                  | `allow` y `entries` solo se reducen o justifican con issue                              |
| Excepciones de seguridad          | `security/exceptions.yml`                                                  | Caducidad ≤ 90 días; una excepción vencida bloquea (`security-exceptions-check`)        |

## 3.1 Ratchet de knip (calibración → blocking)

Change `ci-dead-code-advisory-calibration` (2026-11-12). knip 6.45.1 corre en dos
modos con el mismo `knip.jsonc` (single-source, scripts root `knip:ci` /
`knip:ci:scheduled`):

- **PR** (`client-dead-code` / `server-dead-code`): `--production --cache
  --no-exit-code --max-issues 0 --reporter json`. Solo código de producción +
  dependencies. **Advisory durante la calibración** (`--no-exit-code` → exit 0).
- **Scheduled** (`dead-code-triage`, lunes 05:00 UTC): modo default (incluye
  tests/stories/config/devDependencies → más hallazgos). Advisory permanente para
  triage; reporte markdown+JSON como artifact (90 días). No es required check.

**Mecánica del ratchet** (knip 6.45.1, `run-cli.js`): el exit 1 solo cuenta los
tipos con `rules[type] === 'error'` (`totalErrorCount`) y falla si
`totalErrorCount > --max-issues`. `--no-exit-code` anula el exit mientras se
calibra. Con `--max-issues 0`, cualquier hallazgo de un tipo lockeado en `error`
bloquea al promover.

**Baseline production (2026-11-12)** — client 10 / server 6 hallazgos, todos
clasificados como assets de dev-time que el lente `--production` expone y default
oculta (no dead code confirmado):

| Tipo | client | server | Clasificación (triage) |
| ---- | ------ | ------ | ---------------------- |
| `files` | 4 | 1 | shadcn `dropdown-menu`/`radio-group`/`command`/`Loader` solo usados en stories/tests; `rsvp-fixtures.ts` solo en `.unit.test.ts` |
| `dependencies` | 4 | 2 | `@radix-ui/react-dropdown-menu`/`react-radio-group`/`cmdk` (componentes storybook-only); `tailwindcss-animate` (plugin en `tailwind.config.js`, excluido en production); `tsx`/`vite` (build/dev en `dependencies`) |
| `exports` | 2 | 2 | `AlertDialogTrigger`/`DialogTrigger`, `parseMentions`/`getAllowedNextStates` sin consumidor en src producción |
| `types` | 0 | 1 | `ValidTransitions` sin consumidor en src producción |

**Estado actual de `rules`** (ratchet inicial):

- `warn` (con hallazgos en production, triage pendiente): `files`, `dependencies`,
  `exports`, `types`.
- `error` (en cero en ambos modos, lockeados): `devDependencies`, `binaries`,
  `enumMembers`, `namespaceMembers`, `optionalPeerDependencies`, `unlisted`,
  `unresolved`.
- `off`: `duplicates` (ruido estructural).

**Procedimiento de promoción** (por tipo, gradual — no se bloquea el legado de golpe):

1. Triage humano de los hallazgos `warn` de un tipo: dead code real → borrar en PR;
   asset de dev-time / FP de config → modelar con justificación por entrada en
   `knip.jsonc` (no `ignore` masivo).
2. Cuando el tipo llega a **cero** en production, cambiar su severidad a `error`
   en `knip.jsonc` `rules` y registrar la fecha en esta sección.
3. Cuando todos los tipos estén en `error` y el baseline sea 0, quitar
   `--no-exit-code` del script `knip:ci` (el gate pasa a **blocking estricto**,
   `--max-issues 0`). Actualizar la fila de §2 a `blocking (PR)` con fecha.
4. La promoción se hace en un PR de herramientas (§4) que actualice este documento
   en el mismo PR (capability `quality-governance`).

> Nota: el hint de knip "Remove redundant pattern" sobre los entries
> `src/main.jsx!` / `src/bin/index.ts!` aparece solo en modo **default** (el plugin
> vite ya detecta el entry). En **production** los entries con sufijo `!` son
> load-bearing (`WorkspaceWorker.getProductionEntryFilePatterns` solo usa los
> patterns con `!`); no se eliminan.

## 4. Política de actualización de herramientas

- ESLint, Prettier, TypeScript, knip, dependency-cruiser, markdownlint y los
  pins de actions se actualizan en **un PR de herramientas agrupado**
  (Dependabot/Renovate), nunca mezclado con código de producto.
- **Versión mayor** (p. ej. ESLint 9 → 10): primero un job advisory paralelo con
  la versión nueva; si cambian los hallazgos, el baseline se regenera en ese
  mismo PR de herramientas y el cambio se anota en `quality-exceptions.md`.
- Los pins de actions se mantienen por SHA (política `zizmor` `hash-pin`).
- knip actualizado a **6.45.1** (change `ci-dead-code-advisory-calibration`,
  2026-11-12): flags `--production`/`--cache`/`--no-exit-code`/`--max-issues`
  validados en la versión instalada; `$schema` de `knip.jsonc` pineado a 6.45.1
  (spec `knip-config-single-source`). Ratchet y promoción en §3.1.

## 5. Referencias

- `docs/learning/quality-gates.md` — taxonomía, semántica y **runbook** (§8).
- `docs/learning/quality-exceptions.md` — registro EX-3 de excepciones.
- `docs/learning/quality-gap-analysis.md` y su verificación.
- `openspec/specs/quality-governance/spec.md` — requisitos normativos.
