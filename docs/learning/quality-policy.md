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

| Gate (job id)                                   | Herramienta                                      | Estado                     | Promoción  | Dueño         | Umbral / ajuste                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------- | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `client-lint` / `server-lint` / `e2e-lint`      | ESLint 9 (`--max-warnings 0 --cache`)            | blocking (PR)              | 2026-09-26 | devops-team   | 0 warnings; `reportUnusedDisableDirectives: 'error'`; `@typescript-eslint/ban-ts-comment`                                     |
| `eslint-v10-advisory`                           | ESLint 10 (`npx --package eslint@10 --no-cache`) | advisory (PR, calibración) | —          | devops-team   | `continue-on-error`; fuera de `prebuild-quality-complete.needs`; promoción bloqueada por plugins upstream (§4.1)              |
| `client-format-check`                           | Prettier `--check`                               | blocking (PR)              | 2026-09-26 | frontend-team | 0 diferencias (globs del script `format:check`)                                                                               |
| `server-format-check`                           | Prettier `--check`                               | blocking (PR)              | 2026-11-12 | backend-team  | 0 diferencias; deuda previa = artefactos generados, ahora en `.prettierignore`                                                |
| `e2e-format-check`                              | Prettier `--check`                               | blocking (PR)              | 2026-11-12 | qa-team       | 0 diferencias; artefactos de Playwright ignorados                                                                             |
| `client-typecheck` / `server-typecheck`         | `tsc --noEmit --tsBuildInfoFile` (+cache)        | blocking (PR)              | 2026-09-26 | devops-team   | 0 errores; tsBuildInfo persistido + cacheado (2026-11-12, §4); `strict` gradual por `server-typescript-migration`             |
| `client-complexity` / `server-complexity`       | ESLint `complexity` / `max-lines-per-function`   | blocking (PR)              | 2026-09-26 | devops-team   | 15 core / 10 utils / off tests; 80 líneas por función                                                                         |
| `client-import-bounds` / `server-import-bounds` | dependency-cruiser 18.7.2 (`err --ignore-known`) | blocking (PR)              | 2026-09-28 | architects    | 0 violaciones `error` nuevas vs baseline; ratchet `--baseline-mode shrink-only` (§3.2)                                        |
| `client-dead-code` / `server-dead-code`         | knip 6.45.1 (`--production --cache`)             | advisory (PR, calibración) | 2026-11-12 | devops-team   | `--no-exit-code --max-issues 0`; ratchet warn→error por tipo (§3.1); promoción a blocking pendiente                           |
| `dead-code-triage` (`scheduled-quality.yml`)    | knip 6.45.1 (modo default)                       | advisory (scheduled)       | —          | devops-team   | Semanal (lun 05:00 UTC); triage humano; reporte artifact 90 días; no toca `ci-complete`                                       |
| `db-contract`                                   | `prisma migrate diff` + shadow DB                | blocking (PR)              | 2026-10-01 | backend-team  | 0 drift schema↔migraciones                                                                                                    |
| `api-contract`                                  | Generación OpenAPI + Spectral                    | blocking (PR)              | 2026-10-01 | backend-team  | 0 errores (`spectral:oas`)                                                                                                    |
| `frontend-budgets`                              | size-limit + Lighthouse CI                       | blocking (PR)              | 2026-10-19 | frontend-team | 204 800 B total; LCP/TBT según presupuesto                                                                                    |
| `root-manifest-guard`                           | `scripts/check-root-manifest.mjs`                | blocking (PR)              | 2026-09-29 | devops-team   | `dependencies ⊆` directos ∪ `manifest-allowlist.json`                                                                         |
| `validate-pipeline`                             | yamllint 1.38.0 + actionlint 1.7.12              | blocking (PR)              | 2026-09-30 | devops-team   | 0 hallazgos en `.github/workflows/**`                                                                                         |
| `openspec-validate`                             | OpenSpec CLI (strict) + `test:scripts`           | blocking (PR)              | 2026-09-26 | architects    | 0 errores; `## Purpose` no-placeholder                                                                                        |
| `docs-validation`                               | markdownlint 0.49 + vale 3.22.0                  | advisory (PR)              | —          | core-team     | Reporte en Step Summary; fase 2 pendiente                                                                                     |
| `sonarqube` (client/server)                     | SonarQube                                        | **inactivo** (D2 diferido) | —          | devops-team   | D2 = diferido (2026-11-12, §4.2); QG "Sonar way" si se activa; parámetros de futura activación: required directo + skip forks |

## 3. Ratchet (solo se baja)

El ratchet es el mecanismo por el que la deuda existente se congela y **nunca
crece**; el contador solo puede bajar:

| Artefacto                         | Mecanismo                                                                                      | Regla de poda                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Warnings de ESLint                | `--max-warnings 0` en todos los scripts `lint`                                                 | Un warning nuevo falla el job; no existe margen que "absorba" deuda                                        |
| Directivas `eslint-disable`       | `reportUnusedDisableDirectives: 'error'`                                                       | Una directiva que deja de suprimir algo falla el lint: se borra, no se acumula                             |
| Violaciones de dependency-cruiser | `.dependency-cruiser-known-violations.json` + `--ignore-known` + `--baseline-mode shrink-only` | El baseline solo se poda (shrink-only); una violación `error` nueva falla aunque el baseline exista (§3.2) |
| Cobertura                         | `.coverage-policy.json` / `.coverage-baseline.json` + `check-coverage.mjs`                     | Los floors suben por PR; una bajada exige baseline auditado (`coverage:baseline:check`)                    |
| Entradas ignoradas de knip        | `knip.jsonc` (`ignore*`)                                                                       | Solo se eliminan al resolver el falso positivo; el crecimiento se revisa en PR                             |
| Severidad de hallazgos de knip    | `knip.jsonc` `rules` (warn→error) + `--max-issues 0`                                           | Un tipo que llega a cero se lockea en `error`; la regresión bloquea al promover (§3.1)                     |
| Allowlist del manifest raíz       | `manifest-allowlist.json`                                                                      | `allow` y `entries` solo se reducen o justifican con issue                                                 |
| Excepciones de seguridad          | `security/exceptions.yml`                                                                      | Caducidad ≤ 90 días; una excepción vencida bloquea (`security-exceptions-check`)                           |

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

| Tipo           | client | server | Clasificación (triage)                                                                                                                                                                                              |
| -------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `files`        | 4      | 1      | shadcn `dropdown-menu`/`radio-group`/`command`/`Loader` solo usados en stories/tests; `rsvp-fixtures.ts` solo en `.unit.test.ts`                                                                                    |
| `dependencies` | 4      | 2      | `@radix-ui/react-dropdown-menu`/`react-radio-group`/`cmdk` (componentes storybook-only); `tailwindcss-animate` (plugin en `tailwind.config.js`, excluido en production); `tsx`/`vite` (build/dev en `dependencies`) |
| `exports`      | 2      | 2      | `AlertDialogTrigger`/`DialogTrigger`, `parseMentions`/`getAllowedNextStates` sin consumidor en src producción                                                                                                       |
| `types`        | 0      | 1      | `ValidTransitions` sin consumidor en src producción                                                                                                                                                                 |

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

## 3.2 Ratchet de import boundaries (dependency-cruiser)

Change `ci-import-boundaries-enforcement` (2026-11-12). dependency-cruiser
**18.7.2** (upgrade desde 18.2.0). El bloqueo es fiable por el mecanismo real del
CLI, no por un flag inexistente:

- **Exit code real:** el CLI principal `depcruise` NO expone `--exit-code`/`-e`
  (ese flag solo existe en el binario `depcruise-fmt`). El gate usa
  `--output-type err --ignore-known`: el reporter `err` devuelve como exit code
  el número de violaciones de severidad `error` (`advisedExitCode`, obligatorio
  desde 18.4.0). Una violación `error` nueva → exit ≠ 0 → job bloquea. Las
  violaciones `warn` no bloquean por diseño (deuda controlada). Verificado:
  baseline conocido pasa (exit 0); una violación `error` nueva bloquea (exit 26
  en prueba con config temporal que promueve `no-circular` a error).
- **Ratchet mecánico:** el script `depcruise:baseline` usa
  `depcruise --baseline --baseline-mode shrink-only` (no el deprecado
  `depcruise-baseline`). `shrink-only` elimina las violaciones corregidas y
  **nunca añade nuevas**: el baseline solo puede bajar. (`--baseline` implica
  `--no-ignore-known --no-cache`.)
- **Gobernanza:** `.dependency-cruiser-known-violations.json` está bajo
  CODEOWNERS (`.github/CODEOWNERS:59`, owner de plataforma — hardening P1.3). El
  baseline **solo se regenera en un PR dedicado** (sin mezclar otros cambios),
  con aprobación del owner. La regeneración poda; no es una vía para "absorber"
  deuda nueva.

**Baseline actual (2026-11-12):** 59 entradas — 50 client (26 `no-circular` +
24 `no-cross-module-client`), 8 server (`no-orphans` de código muerto
knip-ignorado), 1 `not-to-unresolvable` (`error`, stale: `.opencode/plugins/`
fuera del scope `apps/e2e` que se cruisea; `shrink-only` la poda). El scan actual
solo produce violaciones `warn` (0 `error`): 51 known ignoradas + 7 warn nuevas
que `shrink-only` no añade + 8 stale podables.

**Fase 2 (post-limpieza):** cuando la deuda `warn` se limpie, quitar
`--ignore-known` de `depcruise:ci` y regenerar/eliminar el baseline. Promover una
regla `warn` → `error` en `.dependency-cruiser.cjs` la hace bloqueante
inmediatamente (el reporter `err` cuenta sus violaciones).

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
- dependency-cruiser actualizado a **18.7.2** (change
  `ci-import-boundaries-enforcement`, 2026-11-12): `depcruise-baseline` deprecado
  migrado a `depcruise --baseline --baseline-mode shrink-only`; exit code fiable
  vía reporter `err` (el CLI principal no tiene `--exit-code`). Ratchet y
  gobernanza del baseline en §3.2.
- Typecheck con tsBuildInfo cacheado (change `ci-type-check-strict`, 2026-11-12):
  los jobs `client-typecheck`/`server-typecheck` añaden
  `--tsBuildInfoFile .cache/tsc/app.tsbuildinfo` (relativo al `working-directory`)
  y `actions/cache` (clave: lockfile + tsconfigs + fuentes; `restore-keys` parcial).
  `--incremental` no se añade (ya en tsconfig). Sin promesa de speedup: con
  `--noEmit` el tsBuildInfo se escribe pero no acelera (verificación A2); el
  objetivo es cache reutilizable. `strict` ya activo en server (no se toca);
  client fuera de alcance (100% JS sin `checkJs`).

## 4.1 Adopción de ESLint 10 (advisory → promoción)

Change `ci-eslint-v10-upgrade` (2026-11-12). ESLint 9.39.x llegó a EOL el
2026-08-06; el repo sigue en `eslint ^9.39.2` (blocking). Se añade el job
`eslint-v10-advisory` (**FASE 1**) que corre el motor **ESLint 10.14.0** vía
`npx --package eslint@10` sobre client/server/e2e, en paralelo al lint blocking de
v9, con `continue-on-error: true` y **fuera** de `prebuild-quality-complete.needs`
(exento de skipped=fail; no bloquea merges).

**Mecanismo:** `npx --package eslint@10` usa el motor v10 pero resuelve los plugins
del árbol instalado (v9) en runtime — sin devDependency separada (el
`root-manifest-guard` bloquea un segundo `eslint` en el manifiesto raíz).
`--no-cache` evita contaminar la caché de v9 (`.cache/eslint`). Node del repo
(`.nvmrc` 22.23.1) satisface el requisito de v10 (`^20.19 || ^22.13 || >=24`).

**Validación empírica (2026-11-12, eslint@10.14.0):**

- Config flat **compatible**: `eslint --print-config` exit 0 (511 reglas resueltas,
  incl. `react/display-name`); ESLint 10 no removió reglas core.
- `server` (260 archivos) y `e2e` (7): lint **limpio** (exit 0).
- `client`: **crash** (exit 2) — `eslint-plugin-react@7.37.5` llama
  `context.getFilename()`, removido en ESLint 10 (`TypeError … react/display-name`,
  `eslint-plugin-react/lib/util/version.js:31`). No es un defecto de config.

**Promoción BLOQUEADA (FASE 2):** no se promueve hasta que el advisory pase (design
D3). El bloqueo es upstream, no de config ni de umbrales:

- `eslint-plugin-react@7.37.5` (última publicada en npm) peer `eslint … || ^9.7` —
  sin `^10`; usa la API removida `context.getFilename()`.
- `eslint-plugin-jsx-a11y@6.10.2` (última publicada) peer `… || ^9` — sin `^10`.
- `eslint-plugin-react-hooks@7.1.1` ya declara `^10.0.0` (instalado 7.0.1,
  actualizable), pero no desbloquea mientras react/jsx-a11y no soporten v10.

**Criterio de salida de la ventana advisory (§1 regla 1):** cuando
`eslint-plugin-react` y `eslint-plugin-jsx-a11y` publiquen releases compatibles con
ESLint 10 (peer `^10` + uso de `context.filename`), re-correr el advisory; si pasa,
promover en un PR de herramientas: `eslint`/`@eslint/js` a 10.x exacto (sin caret),
`typescript-eslint` compatible, lockfile, crear/regenerar `eslint-suppressions.json`
si cambian los hallazgos (CODEOWNERS ya cubre `/eslint-suppressions.json:60` y
`/eslint.config.*:55`), actualizar la fila de §2 a `blocking` con fecha y retirar el
job advisory. **No se crea baseline de supresiones mientras la promoción esté
bloqueada** (los hallazgos de v10 no son accionables sin los plugins).

## 4.2 Decisión D2 — SonarQube PR analysis (diferido)

Change `ci-pr-review-automation` (2026-11-12). **D2 = mantener SonarQube inactivo
(diferido).** Los jobs `client-sonarqube`/`server-sonarqube` siguen con `if: false`
en `ci.yml`; no existe `SONAR_TOKEN`/`SONAR_HOST_URL` en los secrets del repo
(verificado por API 2026-09-26). No se activa sin credenciales ni instancia Sonar
(Non-Goal del change).

**Justificación (D2, mitad 1 — valor):** las capas blocking actuales ya cubren el
merge gate: ESLint (lint + complexity + `ban-ts-comment`), Prettier, typecheck,
import-bounds, cobertura per-file (`check-coverage.mjs`) y security
(dependency-review, lockfile-audit, ScanCode, Semgrep SAST, GuardDog, gitleaks).
Sonar aportaría cobertura sobre código nuevo, duplicación, security hotspots y
rating de mantenibilidad como capa unificada, pero hoy no hay presupuesto/infra
para una instancia Sonar ni token. Se difiere hasta que exista infraestructura;
reevaluar cuando se provisione SonarCloud o SonarQube propio.

**D2 mitad 2 — nube vs propio:** sin decidir (diferido). Cuando se active, elegir
SonarCloud (nube, `SONAR_HOST_URL=https://sonarcloud.io`) o SonarQube self-hosted
(`SONAR_HOST_URL` propio); afecta el secret `SONAR_HOST_URL` y el provisioning.

**Parámetros elegidos para una futura activación** (decididos ahora, no se aplican
hasta que D2 = activar + credenciales presentes):

- **Enforcement: required directo** (blocking desde día 1 con pre-flight), no
  advisory-first. El PRD recomienda advisory, pero se elige required directo (doc
  de decisión). Requiere un PR de prueba que confirme el nombre del check
  `SonarQube Code Analysis` antes de bindear al ruleset.
- **Forks: skip con guard** `if: github.event.pull_request.head.repo.full_name ==
github.repository` (patrón de `archive/2026-09-21-ci-quality-dag`). El job no
  corre en PRs de fork (no reciben secretos) → nunca rojo/no-reportado.
- **Mecanismo del check:** action `SonarSource/sonar-quality-gate-check` sobre el
  scan existente (`sonarqube-scan-action`), **sin** `continue-on-error` para
  required directo. Reconcilia con `quality-gates.md:29` (que documenta el enfoque
  advisory con action + COE): al activar en required directo se quita el COE. Un
  check por workspace (client/server), consistente con los jobs actuales.
- **Reportería en merge queue:** el check `SonarQube Code Analysis` lo emite la
  integración Sonar↔GitHub ligada al PR; en el commit sintético de `merge_group`
  no hay PR → no reporta. Por eso el required check del ruleset sigue siendo el
  agregador existente (`CI Complete` / `Postbuild Analysis Complete`), **no** el
  check de Sonar directo. Los jobs Sonar serían PR-only y se saltan en
  `merge_group` (skip autorizado por evento, §1 regla 3).

**Quality Gate (si se activa):** "Sonar way" sobre código nuevo — 0 issues nuevos,
80% cobertura, 3% duplicación, security hotspots revisados. Matices: modo MQR
(Multi-Quality Rule), fudge factor ≥20 líneas, y el solape cobertura-QG vs stage de
testing debe vivir en un solo lugar (que la condición de cobertura no se duplique
entre Sonar y `check-coverage.mjs`).

**Revisores IA (CodeRabbit/DeepSource): NO instalados.** No hay `.coderabbit.yaml`
ni `.deepsource.toml` en el repo; solo aparecen como candidatos en el PRD.
`quality-gap-analysis.md:319` (D12) ya los registra como no-required. Si se
instalan en el futuro, permanecerán como asesores (comentarios, warning, sin check
requerido); sus checks no se añaden al ruleset.

**Estado:** diferido. La fila `sonarqube` de §2 permanece `inactivo`. La activación
(Fase 2 del change) requiere D2 = activar + credenciales presentes; hasta entonces
no se ejecuta. Fecha de la decisión: **2026-11-12**.

## 5. Referencias

- `docs/learning/quality-gates.md` — taxonomía, semántica y **runbook** (§8).
- `docs/learning/quality-exceptions.md` — registro EX-3 de excepciones.
- `docs/learning/quality-gap-analysis.md` y su verificación.
- `openspec/specs/quality-governance/spec.md` — requisitos normativos.
