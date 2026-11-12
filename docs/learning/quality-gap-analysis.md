# Gap Analysis: Stage Quality (Grupo A) — shift-left y gates enterprise

> Análisis comparativo entre la implementación actual del pipeline de calidad
> (prebuild quality) del repositorio Project One y el PRD
> `PRDS/Stage-Quality-(Grupo-A)-shift-left-y-gates-enterprise.md`. Fecha de
> análisis: 2026-11-11.
>
> **Anotaciones de verificación** (change `ci-quality-gates-blocking-hardening`,
> P2.3): cada claim revisado lleva `[VERIFICADO]` (correcto contra fuente/repo),
> `[MATIZADO]` (correcto con corrección) o `[INCORRECTO]` (falso/desactualizado)
> según `docs/learning/quality-gap-analysis-verification.md`.

---

## 1. Resumen ejecutivo

**Estado global**: el repositorio **ya supera ampliamente** al PRD en madurez
operativa (gates enterprise, agregadores estrictos, path-scoping, SAST,
cobertura merge-gate, TIA, etc.), pero **diverge en varios puntos concretos** de
la especificación del PRD, principalmente porque el repo evolucionó por cambios
posteriores (`quality-gates`, `ci-shifting-left`, `import-boundaries`,
`root-manifest-cleanup`, `sast-shift-left-hooks-parity`,
`ci-testing-gate-promotion`) que no están reflejados en el PRD.

**Hallazgos clave**:

1. **Los jobs de calidad del PRD (Lint, Formato, Tipos, Complejidad, Dead code,
   Import boundaries, Root manifest, Docs) están implementados**, varios incluso
   promovidos a bloqueantes antes de lo que el PRD sugería (complejidad,
   import-bounds, dead-code).
2. **Dead code (knip) es bloqueante en CI, no advisory** como propone el PRD
   (D5). Falta `--production` y `--cache`. Riesgo: bloquea merges por falsos
   positivos de configuración.
3. **TypeScript strict no está activo**: `tsconfig.json` base tiene
   `checkJs: false`, `strict` ausente. PRD exige `strict` en todos los
   proyectos. Gap real (Fase 4 pendiente de migración TS).
4. **Compile-check multilenguaje (Go/Rust)**: no aplica (repo TS/JS).
   Correctamente omitido.
5. **Security del stage**: `npm ci` sin `--ignore-scripts` en `setup-monorepo`
   (gap P0). Actions pinneadas por SHA ✓, `persist-credentials: false` ✓,
   `timeout-minutes` ✓, permisos mínimos ✓. Interpolación `${{ }}` dentro de
   `run:` en agregadores (gap P1).
6. **Agregador `prebuild-quality-complete`**: no trata `skipped` como fail (PRD
   lo exige), y no usa variable de entorno para `needs` (interpolación directa).
   Gap P1.
7. **PR review automation (SonarQube)**: `if: false` (sin credenciales). PRD lo
   deja como advisory con token. Decisión D2 abierta.
8. **Docs/CHANGELOG**: `docs-validation` advisory, solo markdownlint (no vale).
   Alineado con PRD fase 1, pero PRD quiere markdownlint bloqueante. Gap de
   timing (D6).
9. **Monorepo/affected**: path-filter vía `repo-discovery` ✓, `fetch-depth: 0`
   ✓. Turborepo no usado (PRD lo menciona como opción, pero filtros por ruta son
   la recomendación D1). OK.
10. **Observabilidad/SLOs**: métricas parciales (duración advisory, TIA shadow).
    No hay informe semanal consolidado (D8). `quality-policy.md` y
    `quality-exceptions.md` no existen (P1).
11. **Gobernanza**: CODEOWNERS existe y protege `.github/`, workflows, baselines
    parciales. Pero no cubre `eslint.config.*`, `.dependency-cruiser.*`,
    `knip.json`, `eslint-suppressions.json`, `.known-violations.json` como el
    PRD propone (P1). `docs/learning/quality-policy.md` y
    `quality-exceptions.md` ausentes.

---

## 2. Tabla resumen por job del PRD

| Job PRD                     | Herramienta        | Estado en repo                                   | Gate actual                     | Diferencia vs PRD                                                                                                                      | Prioridad         |
| --------------------------- | ------------------ | ------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Lint                        | ESLint             | ✅ Implementado (client/server/e2e)              | Blocking                        | `--max-warnings` no visible en CI (delega a workspace scripts); sin `--cache`/`--cache-strategy content`; sin SARIF                    | P1                |
| Formato                     | Prettier           | ✅ Parcial (client blocking, server `if: false`) | Mixto                           | Server format-check desactivado (deuda); PRD quiere bloqueante                                                                         | P1                |
| Tipos                       | tsc                | ✅ Implementado (sin strict)                     | Blocking                        | `strict` ausente en tsconfig; no incremental/tsBuildInfo; solo compile, no tipos reales                                                | P0 (TS migration) |
| Compile-check multilenguaje | go vet/cargo check | ➖ N/A (repo TS/JS)                              | —                               | Correctamente omitido                                                                                                                  | —                 |
| Complejidad                 | ESLint rules       | ✅ Implementado                                  | Blocking                        | PRD quiere advisory→blocking; repo ya blocking. OK pero sin ratchet documentado                                                        | P2                |
| Dead code                   | knip               | ✅ Implementado                                  | Blocking (debería ser advisory) | PRD: advisory + `--production --cache --no-exit-code`; repo: blocking, default mode, sin cache                                         | P0                |
| Import boundaries           | dependency-cruiser | ✅ Implementado (ambos workspaces)               | Blocking                        | Baseline `.dependency-cruiser-known-violations.json` (nombre difiere del PRD `.known-violations.json`); CODEOWNERS no protege baseline | P1                |
| Root manifest guard         | Script propio      | ✅ Implementado                                  | Blocking (path-scoped)          | Allowlist en código (ALLOWLIST array vacío), no archivo versionado separado; PRD quiere archivo + CODEOWNERS                           | P2                |
| PR review automation        | SonarQube          | ❌ Inactivo (`if: false`)                        | —                               | Sin credenciales (D2)                                                                                                                  | P2                |
| Docs y CHANGELOG            | markdownlint/vale  | ✅ Parcial (advisory)                            | Advisory                        | Solo markdownlint, no vale; no en aggregator needs                                                                                     | P1                |

---

## 3. Detalle por job

### 3.1 Lint (ESLint)

- **Estado**: Implementado en `client-lint`, `server-lint`, `e2e-lint`, todos
  blocking, path-scoped.
- **Diferencias vs PRD**:
  - CI ejecuta `npm run lint --workspace=...`, que delega al script del
    workspace; no aplica las banderas del PRD
    (`--max-warnings 0 --cache --cache-location .cache/eslint/ --cache-strategy content`).
    El `--max-warnings 0` vive en los scripts de workspace (verificar), pero la
    caché de ESLint no se usa → corridas más lentas.
  - No hay paso de subida SARIF / anotaciones en PR (PRD §Lint).
  - `linterOptions.reportUnusedDisableDirectives` no está en `error` en
    `eslint.config.js` (PRD §Lint).
  - ESLint 9.39.x: PRD advierte que v9 llegó a EOL el 2026-08-06. Considerar
    upgrade a v10 (PRD probó con 10.14). **[VERIFICADO]** — v9 EOL start
    2026-08-06; v10.14.0 es la última (verificación A1).
- **Acciones**: P1 — añadir flags de caché al script `lint` de workspaces; P2 —
  SARIF upload; P2 — subir `reportUnusedDisableDirectives` a error.

### 3.2 Formato (Prettier)

- **Estado**: `client-format-check` blocking; `server-format-check` `if: false`
  (deuda).
- **Diferencias**: Server no pasa format:check limpio. PRD quiere bloqueante en
  ambos. `.prettierrc.yaml` con `endOfLine: lf` ✓ (alineado con PRD CRLF).
- **Acciones**: P1 — activar `server-format-check` tras limpiar formato server
  (FASE 2).

### 3.3 Tipos (TypeScript)

- **Estado**: `client-typecheck`/`server-typecheck` blocking, ejecutan
  `npx tsc --noEmit`.
- **Diferencias**:
  - `tsconfig.json` base: `strict` ausente, `checkJs: false`. PRD exige `strict`
    en todos los proyectos.
  - No usa `--incremental --tsBuildInfoFile` (PRD §Tipos). **[MATIZADO]** —
    `incremental: true` YA está en `tsconfig.json`; con `--noEmit` el
    `.tsbuildinfo` se escribe pero **no acelera** el typecheck (verificación
    A2/B5).
  - Server no tiene `tsconfig.json` propio en raíz de apps/server? CI usa
    `working-directory: apps/server` con `npx tsc --noEmit` (busca tsconfig en
    ese dir). Verificar.
  - `@ts-ignore` no prohibido (PRD: usar `ban-ts-comment`). Verificar regla en
    eslint.
- **Acciones**: P0 (ligado a migración TS) — activar `strict` gradualmente;
  añadir tsBuildInfo cache.

### 3.4 Compile-check multilenguaje

- **Estado**: N/A. Repo es TS/JS. Correctamente omitido (PRD dice omitir si no
  aplica).

### 3.5 Complejidad

- **Estado**: `client-complexity`/`server-complexity` blocking, ejecutan
  `npx eslint "src/**/*.{js,jsx|ts}"` sin `--rule` (umbrales desde config: 15
  core / 10 utils / off tests).
- **Diferencias**: PRD quiere advisory primero. Repo ya blocking (promovido).
  Umbrales no medidos sobre código real (D3 abierto). `max-lines-per-function`
  80 (PRD menciona `max-lines-per-rule` que no existe — confirmado en PRD).
- **Acciones**: P2 — documentar umbrales medidos en `quality-policy.md`;
  considerar ratchet con contador.

### 3.6 Dead code (knip)

- **Estado**: `client-dead-code`/`server-dead-code` blocking (sin
  `continue-on-error`), ejecutan
  `npx knip --workspace=... --no-progress [--reporter json]`.
- **Diferencias**:
  - PRD: advisory en PR, `--production --cache`, `--no-exit-code` hasta decidir
    nivel (D5).
  - Repo: blocking, modo default (no `--production`), sin `--cache`. Alto riesgo
    de bloquear por falsos positivos de config. **[INCORRECTO — versión]** — el
    repo instala knip **6.32.2**, no la última (6.45.1, 13 releases por
    delante); los flags `--production/--cache/--no-exit-code` existen, pero
    deben validarse tras el upgrade (verificación A3/B6).
  - Config `knip.jsonc` muy elaborada con
    `ignore`/`ignoreDependencies`/`ignoreIssues` (PRD advierte que `ignore` crea
    puntos ciegos).
- **Acciones**: P0 — revertir a advisory (`continue-on-error: true`) o añadir
  `--no-exit-code` hasta calibrar; añadir `--production` para PR y modo default
  en scheduled; añadir `--cache`.

### 3.7 Import boundaries (dependency-cruiser)

- **Estado**: `client-import-bounds`/`server-import-bounds` blocking, con
  baseline `--ignore-known`.
- **Diferencias**: Baseline file se llama
  `.dependency-cruiser-known-violations.json` (repo) vs `.known-violations.json`
  (PRD). CODEOWNERS no incluye el baseline file (PRD EX-1). Reglas alineadas
  (client-not-server, no circular, no cross-module). **[MATIZADO]** —
  `depcruise-baseline` está deprecado desde 18.3.0 (usar `--baseline`); el
  reporter `err` sale con el número de violaciones, no con "exit 1/2"
  (verificación B7).
- **Acciones**: P1 — añadir baseline a CODEOWNERS; documentar en
  `quality-policy.md`.

### 3.8 Root manifest guard

- **Estado**: `root-manifest-guard` blocking, path-scoped a `shared`.
- **Diferencias**: Allowlist está inline en el script (`ALLOWLIST = []`), no en
  archivo versionado separado. PRD quiere archivo `manifest-allowlist.json` con
  motivo/responsable/issue y CODEOWNERS.
- **Acciones**: P2 — extraer allowlist a archivo versionado con schema.

### 3.9 PR review automation (SonarQube)

- **Estado**: `client-sonarqube`/`server-sonarqube` `if: false` (sin
  credenciales).
- **Diferencias**: PRD quiere Sonar Quality Gate sobre código nuevo como único
  bloqueante de revisores IA. No hay token (D2 abierto).
- **Acciones**: P2 — decidir D2; si se activa, usar `pull_request` (no
  `pull_request_target`) y token.

### 3.10 Docs y CHANGELOG

- **Estado**: `docs-validation` advisory, solo markdownlint,
  `continue-on-error: true`, no en aggregator needs.
- **Diferencias**: PRD quiere markdownlint bloqueante, vale warning. Vale no se
  ejecuta en CI (`docs:vale` solo local). PRD también quiere validación de
  CHANGELOG si hay herramienta de release (changesets existe → candidato).
  **[MATIZADO]** — vale **solo falla con alerts de nivel `error`**:
  `MinAlertLevel` y `--minAlertLevel` no convierten warnings en fallo
  (verificación B9). Adoptado como advisory (P1.5 de este change).
- **Acciones**: P1 — añadir vale en advisory; P2 — promover markdownlint a
  blocking cuando docs/ esté limpio; P2 — validar CHANGELOG con changesets.

---

## 4. Estrategias enterprise del PRD

| Estrategia PRD         | Estado en repo | Nota                                                                                                                           |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Advisory → blocking    | ✅ Aplicado    | Muchos gates ya promovidos (complexity, import-bounds, db-contract, api-contract, frontend-budgets, SAST, coverage, tests)     |
| Ratchet                | ⚠️ Parcial     | dependency-cruiser baseline ✓; knip sin ratchet explícito (usa ignore); ESLint sin `--suppress-all`/`eslint-suppressions.json` |
| Código nuevo, no total | ⚠️ Parcial     | Sonar inactivo; complejidad aplica a todo el código (no solo nuevo)                                                            |
| Solo afectado          | ✅ Aplicado    | `repo-discovery` con path-filter + merge_group/dispatch full suite                                                             |
| Cachés                 | ⚠️ Parcial     | Vitest cache ✓, npm cache ✓; ESLint cache ✗, tsc incremental cache ✗                                                           |
| Supresiones con costo  | ⚠️ Parcial     | `reportUnusedDisableDirectives` no en error; baselines no bajo CODEOWNERS completo                                             |
| Versiones fijadas      | ✅ Aplicado    | Actions por SHA ✓; deps con versiones exactas mayormente ✓ (eslint ^9.39.2 con caret)                                          |

---

## 5. Gates de estructura

| Requisito PRD                              | Estado en repo | Nota                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Un solo check requerido                    | ⚠️ Parcial     | Ruleset requiere `Governance: PR Body Lint` + `Prebuild Governance Complete` (2 contextos), no un único `quality-complete`. PRD propone un único agregador.                                                                                                                                                              |
| Agregador estricto (skipped = fail)        | ❌ No          | `prebuild-quality-complete` solo verifica `failure`/`cancelled`, no `skipped`. PRD quiere skipped fail salvo autorizado por change detection. **[MATIZADO]** — un job `skipped` por condición reporta `Success` (no bloquea); un workflow `skipped` por path-filter queda `Pending` y sí bloquea (verificación C11/D17). |
| Agregador usa env var (no interpolación)   | ❌ No          | Usa `${{ contains(...) }}` directo en `run:` (riesgo template injection). PRD quiere `env: NEEDS: ${{ toJSON(needs) }}`. **[MATIZADO]** — `needs.*.result` es un valor controlado; el riesgo de inyección es bajo. La env var es best practice y se aplica igualmente (P0.2).                                            |
| Lo caro espera (`needs: quality-complete`) | ✅ Aplicado    | Build/test jobs declaran `needs: prebuild-*`                                                                                                                                                                                                                                                                             |
| Hermanos sin cancelar (paralelo)           | ✅ Aplicado    | Lint/format/tipos en paralelo; concurrency por PR cancela corridas viejas                                                                                                                                                                                                                                                |
| Merge queue (`merge_group`)                | ✅ Aplicado    | Trigger presente                                                                                                                                                                                                                                                                                                         |
| CODEOWNERS protegido                       | ⚠️ Parcial     | `.github/` protegido, pero no `eslint.config.*`, `.dependency-cruiser.*`, `knip.json`, baselines, allowlists                                                                                                                                                                                                             |

---

## 6. Seguridad del stage Quality

| Control PRD                                         | Estado | Nota                                                                                                                                                                           |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permisos mínimos (`permissions: {}` + read por job) | ✅     | Workflow-level `contents: read`                                                                                                                                                |
| `persist-credentials: false`                        | ✅     | En todos los quality jobs                                                                                                                                                      |
| Actions por SHA                                     | ✅     | Todas pinneadas                                                                                                                                                                |
| Sin template injection                              | ⚠️     | Agregadores interpolan `${{ }}` en `run:` (P1). **[MATIZADO]** — valores controlados por GitHub; la interpolación es un riesgo bajo, no un P0 de seguridad (verificación C10). |
| Triggers seguros (`pull_request`)                   | ✅     | Quality jobs corren en `pull_request`                                                                                                                                          |
| Sin `pull_request_target` con checkout de PR        | ✅     | No se usa                                                                                                                                                                      |
| `npm ci --ignore-scripts`                           | ❌     | `setup-monorepo` usa `npm ci` sin `--ignore-scripts` (P0)                                                                                                                      |
| `timeout-minutes` por job                           | ✅     | Presente                                                                                                                                                                       |
| zizmor sobre workflows                              | ✅     | Job `zizmor-advisory` blocking                                                                                                                                                 |

---

## 7. Monorepo/multilenguaje

| Requisito PRD                                    | Estado      | Nota                                                                     |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------ |
| Un job por área                                  | ✅          | client/server/e2e separados                                              |
| Affected detection                               | ✅          | `repo-discovery` con dorny/paths-filter                                  |
| `fetch-depth: 0`                                 | ✅          | En quality jobs                                                          |
| Turborepo `--affected`                           | ➖ No usado | PRD lo menciona como opción; repo usa path-filter (recomendación D1). OK |
| TypeScript por proyecto (tsconfig por workspace) | ⚠️          | Client/server tienen tsconfig? Verificar; base compartida en raíz        |

---

## 8. Observabilidad/SLOs

| Requisito PRD                                                                                 | Estado     | Nota                                                                 |
| --------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| Duración por percentil                                                                        | ⚠️ Parcial | Step advisory de duración en test-unit-\* (G1.1), no en quality jobs |
| Tasa de fallo por causa                                                                       | ❌ No      | No implementado                                                      |
| MTTR de main                                                                                  | ❌ No      | D8 abierto                                                           |
| Métricas propias del stage (estado gate, tamaño baselines, excepciones, cache-hit, hallazgos) | ⚠️ Parcial | TIA shadow metric, TTFF metric; no hay informe semanal consolidado   |
| Step Summary                                                                                  | ✅         | Varios jobs publican summary                                         |

---

## 9. Runbook y gobernanza

| Requisito PRD                                                   | Estado     | Nota                                                                                                  |
| --------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `docs/learning/quality-policy.md`                               | ❌ Ausente | PRD lo exige como registro de estado de gates                                                         |
| `docs/learning/quality-exceptions.md`                           | ❌ Ausente | PRD EX-3                                                                                              |
| Runbook en quality-gates.md                                     | ⚠️ Parcial | `quality-gates.md` documenta gates pero no runbook completo (revertir, falsos positivos, etc.)        |
| CODEOWNERS completo (baselines/allowlists/config)               | ⚠️ Parcial | Falta eslint.config, depcruiser, knip, baselines, allowlists, scripts/ci                              |
| Política de actualización de herramientas (Dependabot/Renovate) | ⚠️         | Dependabot existe (ajustado por sca-lockfile-compliance); PRD quiere agrupación en PR de herramientas |

---

## 10. Decisiones abiertas D1-D13 — estado en el repo

| #   | Decisión                           | Estado en repo                                                                                                             |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| D1  | Ejecución solo afectado            | ✅ Resuelto: filtros por ruta (`repo-discovery`)                                                                           |
| D2  | SonarQube y forks                  | ❌ Abierto: Sonar inactivo (`if: false`), sin credenciales                                                                 |
| D3  | Umbrales de complejidad            | ⚠️ Parcial: umbrales fijados (15/10) pero no medidos sobre código real; documentados en eslint-complexity-configuration.md |
| D4  | Mecanismo de ratchet               | ⚠️ Parcial: baseline en depcruiser; knip sin ratchet; ESLint sin supresiones masivas                                       |
| D5  | Nivel del gate de dead code        | ❌ Abierto: repo lo tiene bloqueante (contrario a recomendación advisory)                                                  |
| D6  | vale                               | ⚠️ Parcial: configurado (`.vale.ini`) pero no ejecutado en CI; D6 abierto                                                  |
| D7  | Aprobación de excepciones          | ⚠️ Parcial: CODEOWNERS con equipos; riesgo de un solo mantenedor no documentado como aceptado                              |
| D8  | Métricas del stage                 | ❌ Abierto: no hay informe semanal consolidado ni meta de MTTR                                                             |
| D9  | Retención de evidencia             | ❌ Abierto: sin plazo fijado (artifacts tienen 7-90 días)                                                                  |
| D10 | Reglas warn vs supresiones masivas | ⚠️ Parcial: varias reglas en warn con ratchet via --max-warnings; sin supresiones masivas                                  |
| D11 | Gate de drift de Prisma            | ✅ Resuelto: `db-contract` blocking (migrate diff)                                                                         |
| D12 | Revisión automática por IA         | ✅ Resuelto: CodeRabbit/DeepSource no son required checks (solo Sonar candidato, inactivo)                                 |
| D13 | Gate de i18n                       | ❌ No aplicado (repo tiene i18n pero no gate)                                                                              |

---

## 11. Recomendaciones priorizadas

### P0 (bloqueantes de calidad / seguridad)

1. **`npm ci --ignore-scripts`** en `setup-monorepo` (o paso explícito de
   `prisma generate` en jobs que lo necesiten). Riesgo de ejecución de scripts
   de lifecycle en CI.
2. **Dead code (knip) de blocking a advisory**: añadir `continue-on-error: true`
   o `--no-exit-code` hasta calibrar config (D5). Añadir `--production` para PR
   y modo default en scheduled, más `--cache`.
3. **TypeScript strict**: activar `strict` gradualmente (Fase 4 de migración
   TS); añadir `--incremental --tsBuildInfoFile` y cache en CI. **[MATIZADO]** —
   no prometer speedup: con `noEmit` el tsbuildinfo no acelera el typecheck
   (verificación A2/B5); `incremental` ya está activo.

### P1 (alineación con PRD / robustez)

1. **Agregador `prebuild-quality-complete`**: tratar `skipped` como fail salvo
   autorizado por `repo-discovery`; pasar `needs` por env var
   (`NEEDS: ${{ toJSON(needs) }}`) en lugar de interpolación.
2. **ESLint cache**: añadir
   `--cache --cache-location .cache/eslint/ --cache-strategy content` al script
   `lint` de workspaces y cachear en CI.
3. **`linterOptions.reportUnusedDisableDirectives: 'error'`** en
   `eslint.config.js`.
4. **Activar `server-format-check`** tras limpiar formato server.
5. **Añadir vale en advisory** en `docs-validation`.
6. **CODEOWNERS**: añadir patrones para `eslint.config.*`,
   `.dependency-cruiser.*`, `knip.json*`,
   `.known-violations.json`/`.dependency-cruiser-known-violations.json`,
   `eslint-suppressions.json`, `scripts/ci/`, baselines y allowlists.
7. **Shift-left pre-push**: añadir
   `npm run typecheck && npm run deps:boundaries` al hook `pre-push` (además de
   SAST/tests).
8. **Crear `docs/learning/quality-policy.md`** y
   `docs/learning/quality-exceptions.md` (EX-3).

### P2 (mejoras / deuda)

1. **ESLint 9 → 10**: v9 EOL; plan de upgrade con job advisory paralelo.
2. **TypeScript 5.9 → 6.0**: PRD probó con 6.0.3; evaluar.
3. **SARIF upload** para ESLint anotaciones en PR (`security-events: write`).
4. **Root manifest guard**: extraer allowlist a archivo versionado con
   reason/responsable/issue.
5. **SonarQube**: decidir D2; si se activa, token + `pull_request` (no
   `pull_request_target`).
6. **Promover markdownlint a blocking** cuando docs/ esté limpio (fase 2).
7. **Validación de CHANGELOG** con changesets (PRD §Docs).
8. **Informe semanal de métricas** (D8): `gh run list --json` publicado en Step
   Summary.
9. **Ratchet documentado**: contador de warnings, `eslint-suppressions.json` con
   CODEOWNERS.

---

## 12. Quick wins (bajo esfuerzo, alto impacto)

1. Cambiar `npm ci` → `npm ci --ignore-scripts` en `setup-monorepo` (1 línea).
2. Añadir `continue-on-error: true` a `client-dead-code`/`server-dead-code`
   (revertir a advisory) hasta calibrar knip.
3. Añadir baselines y configs a `.github/CODEOWNERS` (copiar bloque del PRD).
4. Crear `docs/learning/quality-policy.md` vacío con tabla de gates (plantilla
   del PRD §Gobernanza).
5. Añadir `--cache --cache-strategy content` al script `lint` de workspaces.
6. Subir `reportUnusedDisableDirectives` a `'error'` en eslint config.
7. Añadir vale en advisory al job `docs-validation`.

---

## 13. Esfuerzo estimado

| Bloque                                    | Esfuerzo    | Notas                                     |
| ----------------------------------------- | ----------- | ----------------------------------------- |
| P0 (3 items)                              | 2-3 días    | Principalmente migración TS (ya en curso) |
| P1 (8 items)                              | 1 semana    | Config + CODEOWNERS + hooks               |
| P2 (9 items)                              | 2-3 semanas | Upgrades de versiones, Sonar, métricas    |
| Documentación (policy/exceptions/runbook) | 2-3 días    | Plantillas del PRD                        |

---

## 14. Conclusión

El repo está **más avanzado que el PRD** en gates enterprise (agregadores,
path-scoping, SAST, cobertura, TIA), pero **el PRD sigue siendo útil como
checklist** de items no cubiertos: strict TS, knip advisory, cache de
ESLint/tsc, CODEOWNERS completo, quality-policy/exceptions, agregador strict con
skipped, `npm ci --ignore-scripts`, y métricas/SLOs. La mayor parte de los gaps
son de **configuración y documentación**, no de arquitectura. Recomiendo abordar
P0 esta semana y P1 en el siguiente sprint.

---

_Nota: este reporte se generó como análisis estático (sin ejecutar comandos).
Para validar los hallazgos de "strict ausente", "knip sin --production", etc.,
conviene ejecutar los scripts correspondientes en una rama de verificación._

_Estado 2026-11-12: el change `ci-quality-gates-blocking-hardening` implementó
P0 (`--ignore-scripts` + agregador strict + pre-push), los P1 de lint/gobernanza
y los P2 de allowlist/SARIF. knip, formato server, tipos y docs/CHANGELOG
quedaron en changes dedicados (ver
`docs/learning/quality-changes-decision.md`)._
