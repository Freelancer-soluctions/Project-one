# License Compliance (SCA / Licencias) — Implementación Profesional / Enterprise

> Verificado 2026-09-25 — referencias oficiales comprobadas (`github.com/fossas/fossa-cli`, `github.com/aboutcode-org/scancode-toolkit`, `docs.fossa.com`, `scancode-toolkit.readthedocs.io`). Correcciones al brief: `deny-licenses` YA configurado (`ci.yml` L765); FOSSA sin SARIF ni PR comments; `fossa.yml` sin campo `experimental`; ScanCode `--csv` deprecado; `scancode.io` 000/301.
>
> **Fuente canónica de la política de licencias: [`docs/learning/license-policy.md`](./license-policy.md)** (change `license-compliance`, 2026-09-25) — deny-list, regla allow/deny mutuamente excluyente, waivers, decisión `fail-on-scopes` y capa L1 local. Este documento describe las capas técnicas; la política vive allí.

---

## 1. Contexto y ubicación en pipeline

**SCA de licencia = análisis de archivo + política**. No es `dependency-review` (que solo lee `package-lock.json` / manifest del PR). Es la capa que verifica qué licencia tiene cada archivo de librería de terceros y que no se introducen copyleft/GPL/AGPL sin consentimiento explícito.

En `project-one`, la capa existe parcialmente:

| Capa                            | Herramienta / Acción                         | Ubicación                        | Estado 2026-09-25                                                                                                                                                                               | Gaps                                                                                                                                                                                       |
| ------------------------------- | -------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Manifest (PR-time)**          | `actions/dependency-review-action@v5`        | `.github/workflows/ci.yml` L765  | ✅ `deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, Proprietary, CC-BY-NC-4.0`; `license-check: true`; `continue-on-error: false`; `comment-summary-in-pr: on-failure` (change `dependency-review`) | Solo manifiesto, no archivo de librería; `fail-on-scopes` = default `runtime` (`development` pendiente de PR de prueba); `security-events: write` sin ejercicio (la acción no emite SARIF) |
| **Filesystem SCA (post-merge)** | Trivy (`security.yml` job `dependency-scan`) | `.github/workflows/security.yml` | ✅ `format: sarif`, `upload-sarif@v4`, `category: trivy`, `exit-code: 1`                                                                                                                        | No hace análisis de licencia de archivo; cubre CVE del filesystem/OS                                                                                                                       |
| **Archivo de librería**         | FOSSA / ScanCode Toolkit                     | —                                | ❌ NO existe                                                                                                                                                                                    | Sin análisis de código fuente de dependencias; sin `SPDX` expression de archivos; sin `copyright` detection                                                                                |
| **Local / pre-commit**          | `scancode` CLI (opc.) / `fossa-cli` (opc.)   | `.husky/` (no configurado)       | ❌ NO existe                                                                                                                                                                                    | No hay check local de licencia antes de commit                                                                                                                                             |

Referencia pipeline: `docs/ci-cd-pipeline-empresarial.md` §23.5 (Dependency Review = PR-time); `docs/learning/dependency-review.md` §1 (§4.2 licencia sin policy → ahora corregido por `dependency-review`); `docs/CONTEXT-CICD.md` §3.4 (workflows activos post `secret-scanning`).

---

## 2. Referencias oficiales verificadas (2026-09-25)

| Fuente / URL                               | Estado                                                                                                                                                      | Nota clave / Corrección                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FOSSA CLI (`fossa-cli`) README / docs      | ✅ `github.com/fossas/fossa-cli` 200; `docs.fossa.com` 200; `docs.fossa.com/docs/cli/references/subcommands/analyze` 200                                    | `fossa-cli` v3.19.3 (release 2026-09-24); `fossa analyze` imprime metadata; `fossa test` exit 1 si hallazgo; `fossa report attribution` soporta `spdx`/`cyclonedx`/`html`; **NO emite SARIF** (corrección breve); `fossa-action` (GitHub App) emite 2 status checks (`License Compliance` + `Security`), NO PR comments                                                      |
| FOSSA config (`fossa.yml`)                 | ✅ `docs.fossa.com/docs/cli/references/files/fossa-yml` 200                                                                                                 | `version`, `project`, `revision.commit/branch`, `targets.only/exclude`, `paths.only/exclude`, `vendoredDependencies`; **NO campo `experimental`** (corrección breve); `apiKey` vía `FOSSA_API_KEY` env                                                                                                                                                                       |
| ScanCode Toolkit                           | ✅ `github.com/aboutcode-org/scancode-toolkit` 200 (301 desde `nexB`)                                                                                       | `scancode-toolkit` v32.5.0 (2026-01-15); `scancode-toolkit.readthedocs.io/en/latest/` 200; CLI ref `/reference/scancode-cli/index.html` 200; `scancode --license --copyright`; formatos `--json-pp`, `--spdx-rdf`, `--spdx-tv`; `--csv` **deprecated** (`issue #3043`) — usar `--json-pp` o `--spdx-tv`; `scancode.io` `https://scancode.io/` → `000/301` (corrección breve) |
| ScanCode license expression                | ✅ `github.com/aboutcode-org/license-expression` 200; `license-expression.readthedocs.io` 200; `spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions` 200 | Motor SPDX (`AND`/`OR`/`WITH`); LicenseDB 32.3.1; usado por ScanCode / REUSE                                                                                                                                                                                                                                                                                                 |
| Dependency Review (GitHub)                 | ✅ `docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review` 200                            | Confirma que `dependency-review-action` NO reemplaza análisis de archivo (FOSSA/ScanCode)                                                                                                                                                                                                                                                                                    |
| `docs/pre-merge-gates-governance.md` §4.12 | ⚠ Corregido                                                                                                                                                 | Enlaza `https://github.com/actions/dependency-review` → 404; correcto: `https://github.com/actions/dependency-review-action`; afirma `fail-on-severity: high` → verificar (action default `low`, repo usa `moderate`)                                                                                                                                                        |

---

## 3. Diferencia técnica (3 capas de análisis de licencias / dependencias)

| Capa / Herramienta                                         | Qué analiza                                                                                                                                                                    | Fuente de datos                                                      | Salida                                                                                                                              | Uso en pipeline                                                                                                                          | Limitación clave                                                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Review** (`actions/dependency-review-action`) | Vulnerabilidades + licencias declaradas en `package.json` / `package-lock.json` / `yarn.lock` del **diff PR**                                                                  | Manifiesto del repo (no archivo fuente)                              | JSON/texto + PR comment (`on-failure`)                                                                                              | PR-time (`ci.yml`) blocking (moderate)                                                                                                   | **No analiza archivo de librería**; solo manifiesto; no cubre vendored/embedded; no SARIF                                                                                                 |
| **FOSSA CLI / FOSSA App**                                  | Dependency graph (`fossa analyze`) + archivo de código fuente (`snippet-scan`) + licencia de cada archivo (`fossa report attribution`) + vulnerabilidades (vía plataforma/API) | Código fuente del repo + dependencias resueltas por build + vendored | JSON / `spdx` / `cyclonedx` / HTML / CSV / `markdown`; **NO SARIF**; GitHub App: 2 status checks (`License Compliance`, `Security`) | PR-time (FOSSA App) + full-history (FOSSA CLI en CI/CICD)                                                                                | Requiere `FOSSA_API_KEY`; análisis de snippet requiere `snippet-scan`; no cubre archivo de librería sin `vendoredDependencies` explícito                                                  |
| **ScanCode Toolkit** (`scancode`)                          | Archivo por archivo (source + binary): `license` + `copyright` (líneas) + `package` (manifest) + `classifier`                                                                  | Sistema de archivos (repo + directorios de librerías)                | `--json-pp` / `--spdx-tv` / `--spdx-rdf` / `--cyclonedx` / `--html`; `--license-policy` post-scan; **NO SARIF**; `--csv` deprecated | Pre-commit local (L1) + PR-diff ACMR en `ci.yml` (L2b, FASE 1 advisory → FASE 2 blocking) + audit semanal (L3, `scheduled-security.yml`) | No cubre CVE / vulnerabilidades (solo licencia/copyright); requiere `license-expression` para evaluación; no hay integración nativa con GitHub PR checks (requiere transformación propia) |
| **Trivy (SCA filesystem)**                                 | CVE de archivo / filesystem / OS / contenedor                                                                                                                                  | `npm` / `yarn` / `pnpm` / `gem` / `pip` + filesystem + `Dockerfile`  | SARIF (`format: sarif`) + `upload-sarif@v4`                                                                                         | `security.yml` `dependency-scan`                                                                                                         | **No analiza licencia**; cubre CVE, no licencia; complementario a FOSSA/ScanCode                                                                                                          |

> **Conclusión para `project-one`** (change `license-compliance`, 2026-09-25): las tres capas son **complementarias, no duplicadas**:
>
> - **`dependency-review-action`** (L2, `ci.yml`, blocking): diff del PR sobre el **manifiesto** (`package.json`/lockfile) — vulnerabilidades `>= moderate` + licencia **declarada**; `comment-summary-in-pr: on-failure` publica el resumen. No analiza archivos; no emite SARIF.
> - **Trivy** (`security.yml` job `dependency-scan`, advisory en schedule): **CVE del filesystem/OS** — SARIF a Code Scanning con `category: trivy`. **No analiza licencias**.
> - **ScanCode** (L1 local opcional + L2b PR-diff en `ci.yml` job `scancode-license-pr-diff` [FASE 1 advisory, artifact 14d, deny-list leída de la clave `deny-licenses` del job `dependency-review`] + L3 audit semanal en `scheduled-security.yml` [artifact 90d], advisory): **licencia + copyright por archivo** de librerías (incluye vendored/embedded que el manifiesto no declara). Sin CVE. Ni FOSSA ni `dependency-review-action` emiten SARIF — el SARIF de dependencias del Security tab es de Trivy.
>
> Por qué no se elimina ninguna: el manifiesto no ve código embebido/vendored (gap de ScanCode); el archivo no ve CVE (gap de Trivy); el CVE-filesystem no ve licencias (gap de dependency-review/ScanCode). A ello se suman las capas del change `sca-lockfile-compliance` (2026-09-26), complementarias y sin solape de alcance: **CVE del lockfile resuelto** (jobs `lockfile-audit`/`lockfile-audit-weekly`, npm advisory DB) e **IaC** (jobs `checkov-iac`/`checkov-iac-weekly`, configuración de infraestructura) — ninguna aporta reglas de licencias ni toca la deny-list. Fuente canónica de la política: `docs/learning/license-policy.md`.

---

## 4. Estado actual verificado en `project-one`

### 4.1 Config existente (verified 2026-09-25)

```bash
# ci.yml L765-787 (blocking dependency-review)
grep -A 10 "dependency-review:" .github/workflows/ci.yml
# Resultado: fail-on-severity: moderate, vulnerability-check: true, license-check: true,
# deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, Proprietary, CC-BY-NC-4.0,
# allow-ghsas: "", comment-summary-in-pr: on-failure (change dependency-review),
# fail-on-scopes: default runtime (decisión comentada en el job, change dependency-review)
# continue-on-error: false, if: pull_request

# .github/dependabot.yml (verified)
# npm weekly lunes 03:00 UTC, groups dev-dependencies, ignore react/react-dom, limit 10

# docs/learning/dependency-review.md (verificado 2026-09-25)
# §4.2: policy de licencia reconocida como gap (pero deny-licenses YA configurado)
# §4.3: waivers no documentados (allow-ghsas vacío)
# §5: roadmap (P1: policy doc, P2: groups/dependabot, P3: evaluation)
```

**Corrección al brief anterior**: `license-check: true` **YA tiene** `deny-licenses` configurado (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `Proprietary`, `CC-BY-NC-4.0`). El gap real **no es la política de manifiesto** (eso está hecho por `dependency-review` 2026-09-25), sino la **falta de análisis de archivo de librerías** (FOSSA/ScanCode), la **falta de documentación de la política** (`docs/` no explica la lista de deny/allow), y la **falta de `comment-summary-in-pr: on-failure`** (UX de PR).

### 4.2 Gaps confirmados

1. **Sin FOSSA / ScanCode**: `grep -rni "fossa\|scancode\|scan-code" .github/workflows/ package.json .husky/ docs/ 2>/dev/null` → solo referencias en `docs/learning/dependency-review.md` (creado hoy) y `openspec/changes/dependency-review/`; **cero ejecución en pipeline**.
2. **Sin `.fossa.yml`** ni `.scancode.yml`: glob vacío.
3. **`license-check: true` sin explicación documentada**: `docs/learning/dependency-review.md` §4.2 describe la falta, pero no hay política escrita (`LICENSE_POLICY.md` o similar).
4. ~~**`comment-summary-in-pr: never`** (default)~~ → **RESUELTO** (change `dependency-review`, 2026-09-25): `on-failure` configurado y ejerciendo `pull-requests: write`.
5. **`development` scope**: no evaluado; `devDependencies` con vulnerabilidades o licencias inapropiadas pueden pasar si solo `runtime` está en `fail-on-scopes`.
6. **`security-events: write` sin ejercicio**: la acción no emite SARIF, por lo que no se usa para upload a Code Scanning. Usar solo para integración futura (si la acción evoluciona) o para `comment-summary` vía `pull-requests: write`.
7. ~~**`docs/pre-merge-gates-governance.md` §4.12**: afirma `fail-on-severity` default `high`~~ → **RESUELTO** (changes `dependency-review` + `license-compliance`): corregido a `low` con nota fechada; enlace L661 apunta a `github.com/actions/dependency-review-action`.
8. ~~**`quality-gates.md` §2**: falta fila `dependency-review`~~ → **RESUELTO** (change `dependency-review`): fila `blocking (PR)` presente; la fila del audit `scancode-license-audit` (`advisory (scheduled)`) la añade el change `license-compliance`.
9. **`Trivy` vs `dependency-review` duplicación potencial**: `security.yml` `dependency-scan` (Trivy fs, CVE) y `ci.yml` `dependency-review` (manifest, vuln+licencia). No es duplicado real (cobertura complementaria) pero debe ser documentado para evitar confusión.

---

## 5. Implementación enterprise (pipeline 3-capas para licencias / dependencias)

### 5.1 L1 — Pre-commit (local, antes de commit)

- **Herramienta**: `scancode` CLI (`scancode --license --copyright --only-findings --ignore .scancode-ignore`) sobre `node_modules/` o `vendor/` (si existe), o `fossa-cli` (`fossa analyze --format json`) sobre repo completo.
- **Configuración**: `.scancode.yml` (o `.scancode-ignore`) → `--only-findings`; `--license-score` opcional; `SPDX` expression para `license-expression`.
- **Bloqueo**: si `scancode` encuentra `license` sin match a política (`deny-licenses`) y no está en allowlist → exit 1 → bloquea commit.
- **Ventajas**: feedback inmediato, sin costo de CI; detecta archivo no declarado en manifest.
- **Limitaciones**: lento en repos grandes (`node_modules/`); requiere `scancode` instalado localmente (o `docker run aboutcode-org/scancode-toolkit`).

### 5.2 L2 — PR-time (CI, diff-scoped)

- **Herramienta existente**: `dependency-review-action@v5` (ya implementado en `ci.yml`). **Mejoras propuestas**:
  - `comment-summary-in-pr: on-failure` (o `always`) → PR muestra resultados.
  - `fail-on-scopes: [runtime, development]` → cubre `devDependencies` activos.
  - Documentar política (`docs/learning/license-compliance.md` esta sección).
- **Herramienta complementaria**: si se requiere análisis de archivo de librerías en PR (ej. `vendor/` o `node_modules/` con archivos modificados), usar `scancode` en un job de CI (`scancode` sobre directorio de dependencias, con `continue-on-error: true` + `upload-sarif` si se transforma). **Nota**: hoy no es necesario para `project-one` (no hay `vendor/`); usar si se introduce código embedded.

### 5.2 L3 — Full-history / Weekly Audit (post-merge / cron)

> **IMPLEMENTADO (change `license-compliance`, 2026-09-25):** job **`scancode-license-audit`** en `.github/workflows/scheduled-security.yml` — cron lunes 03:00 UTC (heredado del workflow) + `workflow_dispatch` para disparo manual; modo **advisory**: `continue-on-error: true` en el scan step (hallazgos no fallan el job), Docker `aboutcode/scancode-toolkit:32.5.0` con `--license --copyright --only-findings --json-pp` (sin `--csv`, deprecado); artifact `scancode-report.json` con `retention-days: 90` + `if: always()`; sin `needs` de agregadores ni `required_status_checks` (taxonomía `advisory (scheduled)` en `quality-gates.md` §2). Findings → revisión manual/issues (el resumen de licencias se imprime en el log del run; deny-list → `docs/learning/license-policy.md`).

- **Herramienta**: `scancode` en `scheduled-security.yml` (job `scancode-license-audit`, arriba). FOSSA descartado: requiere `FOSSA_API_KEY` + GitHub App (2 status checks, sin PR comments) y tampoco emite SARIF; ruta de migración documentada abajo.
- **Configuración**:
  - `fossa-cli`: `fossa analyze --output json --tee-output`; `fossa test --format json`; `fossa report attribution --format spdx-json` → artifact `fossa-report.json`; upload a `security-events` o almacenar como artifact `retention-days: 90`; `continue-on-error: true` (audit, no bloquea release).
  - `scancode`: `scancode --license --copyright --json-pp --ignore .scancode-ignore .` → artifact `scancode-report.json`; `if: always()`.
- **Taxonomía**: `advisory` (no bloqueante); findings generan issues (`notify-failure` o paso `github-script`) con `due-date`; no requiere `required_status_checks`.

---

## 6. Roadmap (documentado, con referencias de docs existentes)

| Fase                       | Tarea                                                                                                                                                                                                                                                               | Archivo                                    | Referencia                                                                                      | Estado                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Fase 1** (docs + config) | Documentar `deny-licenses` / `allow-licenses` en `docs/learning/license-policy.md` (creado); agregar fila `dependency-review` a `quality-gates.md` (hecho por change `dependency-review`); corregir `pre-merge-gates-governance.md` L661 y §4.12 (`low`, no `high`) | `docs/learning/`                           | `docs/learning/license-policy.md`; `quality-gates.md` §2; `pre-merge-gates-governance.md` §4.12 | ✅ HECHO (change `license-compliance` + `dependency-review`, 2026-09-25) |
| **Fase 2** (CI config)     | `ci.yml`: `comment-summary-in-pr: on-failure` (hecho); `fail-on-scopes` decisión `runtime` documentada (hecho); política enlazada desde el job                                                                                                                      | `.github/workflows/ci.yml`                 | `dependency-review.md` §4.1 / §4.2; `license-policy.md` §4                                      | ✅ HECHO (change `dependency-review`, 2026-09-25)                        |
| **Fase 3** (audit / full)  | `scheduled-security.yml`: job `scancode-license-audit` (advisory, artifact `scancode-report.json` 90d); FOSSA descartado (requiere `FOSSA_API_KEY` + GitHub App); no requiere `required_status_checks`                                                              | `.github/workflows/scheduled-security.yml` | `license-policy.md` §6; `sast-implementation.md` §2                                             | ✅ HECHO (change `license-compliance`, 2026-09-25)                       |

---

## 7. Correcciones al brief / notas

- **Corrección breve (FOSSA)**: FOSSA `fossa-cli` no emite SARIF. EL SARIF existente (`security.yml` `upload-sarif@v4` con `category: trivy`) viene de **Trivy**, no FOSSA. Si se quiere SARIF de licencia, se debe transformar `fossa report attribution --format spdx-json` → SARIF con transformador propio o usar ScanCode con `--spdx-tv` + transformación. **No esperar SARIF de FOSSA**.
- **Corrección breve (FOSSA App)**: FOSSA GitHub App emite **dos status checks** (`License Compliance`, `Security`) — NO hace PR comments (`comment-summary-in-pr` es función de `dependency-review-action`). No confundir roles.
- **Corrección breve (ScanCode)**: `scancode.io` no resuelve (`000/301`); usar `github.com/aboutcode-org/scancode-toolkit` + `scancode-toolkit.readthedocs.io` como fuentes canónicas.
- **Corrección breve (ScanCode)**: `--csv` está deprecado (issue 3043); usar `--json-pp` o `--spdx-tv`.
- **Corrección breve (`fossa.yml`)**: NO hay campo `experimental`; las opciones experimentales son flags CLI (`--snippet-scan`, `--x-vendetta`, `--experimental-*`).
- **Corrección breve (`dependency-review.md` referencia)**: `docs/learning/dependency-review.md` §4.2 confirma `deny-licenses` configurado; el brief decía "sin policy" — **corregido por investigación previa** (`dependency-review` change 2026-09-25). La política existe; el gap es **documentación + análisis de archivo**.

---

## 8. Referencias verificadas (2026-09-25)

- `https://github.com/fossas/fossa-cli` ✅ 200; `README.md` ✅; `docs/references/subcommands/analyze.md` ✅; `test.md` ✅; `fossa-yml.md` ✅
- `https://docs.fossa.com/` ✅ 200; `docs/cli` ✅; `docs/project-setup/pr-checks` ✅
- `https://github.com/aboutcode-org/scancode-toolkit` ✅ 200; `scancode-toolkit.readthedocs.io/en/latest/` ✅; `/reference/scancode-cli/index.html` ✅; `cli-post-scan-options.html` ✅
- `https://scancode-toolkit.readthedocs.io/en/latest/cli-reference/output-format.html` ❌ 404 → uso `/reference/scancode-cli/index.html`
- `https://scancode.io/` ❌ 000/301 → uso GitHub/RTD como canónicas
- `https://github.com/aboutcode-org/license-expression` ✅ 200; `license-expression.readthedocs.io` ✅
- `https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions` ✅ 200
- `https://github.com/actions/dependency-review-action` ✅ 200
- `https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review` ✅ 200

---

## 9. ¿Por qué PR-diff y por qué no full-file para SCA? (verified 2026-09-26)

> Alcance de esta sección: análisis de la decisión **PR-diff vs full-file** para SCA/Licencias. No repite §1-§8 (eso ya está cubierto). Fuentes re-verificadas 2026-09-26 (§9.8).

### 9.1 Mecánica exacta de `dependency-review-action` en PR-diff

- **NO es un escaneo de archivos.** Docs oficiales: _"The action uses the dependency review REST API to get the diff of dependency changes between the base commit and head commit"_ (`docs.github.com/.../about-dependency-review` ✅ 200). README: _"supported by an API endpoint that diffs the dependencies between any two revisions on your default branch"_ (`github.com/actions/dependency-review-action` ✅ 200).
- **Input = dependency graph** (`package.json` / `package-lock.json` / `yarn.lock`) ya computado por GitHub. **NO usa `git --log-opts`, NO corre `git diff` sobre el árbol de archivos, NO ve `node_modules/`** (que además no está commiteado). La diferencia clave es `base..head` sobre el **grafo de dependencias**, no sobre el **árbol de archivos completo**.
- **Solo aplica si el PR toca manifests/lockfiles**: _"For pull requests that contain changes to package manifests or lock files, you can display a dependency review"_. Un PR solo-documentación → sin diff de dependencias → gate pasa sin evaluar nada (correcto, pero no es "escaneo del repo").
- **Licencias declaradas, no leídas de archivo**: vienen de ClearlyDefined. `OTHER` se convierte a `LicenseRef-clearlydefined-OTHER` (SPDX válido) → una deny-list escrita como `GPL-3.0, AGPL-3.0, ...` **no matchea** esa forma de licencia (falso negativo silencioso). Además README: _"If we can't detect the license for a dependency we will inform you, but the action won't fail"_.
- **GitHub Enterprise Server no soporta license check** (la API de GHES no devuelve licencia) — README, nota `*`.
- **`deny-licenses` está marcado como deprecated** en el README actual (2026-09-26): _"⚠️ This option is deprecated for possible removal in the next major release"_ → tracking issue [#938](https://github.com/actions/dependency-review-action/issues/938) (abierto 2025-06-06, hoy **cerrado `not planned`**, label `Stale`). `allow-licenses` y `deny-licenses` son mutuamente excluyentes. **Riesgo directo para `project-one`**: `ci.yml` L765 depende de `deny-licenses`.

### 9.2 Por qué SÍ implementar PR-diff (`dependency-review` / FOSSA PR checks)

1. **Feedback rápido**: la acción es una llamada REST al dependency graph — sin `npm ci`, sin Docker, sin escaneo de archivos → segundos de job. Shift-left real (resultado antes de merge, no días después en cron).
2. **Bloqueo pre-merge**: con `required status checks` / ruleset, la verificación **impide merge** de dependencias con vulnerabilidad `>= moderate` o licencia denegada (README: _"A failed check blocks a pull request from being merged when the repository owner requires the dependency review check to pass"_). Un gate en `scheduled-security.yml` **no puede bloquear nada** (es post-merge/advisory).
3. **Cubre transitivos**: el diff del lockfile detecta vulnerabilidad introducida **indirectamente** (bump de un directo que arrastra un transitive vulnerable) — escaneo de archivos no detecta CVEs.
4. **Coste ~0**: no consume runner minutes de escaneo pesado; escala a todas las repos de la org (`enforce dependency review` como required workflow, docs.github).
5. **FOSSA PR checks existen y son bloqueantes**: 2 status checks (`License Compliance`, `Security`) que fallan si el PR introduce **nuevas** violaciones (`docs.fossa.com/docs/project-setup/pr-checks` ✅ 200, updated 2026-09-22).

### 9.3 Por qué NO implementar FOSSA/ScanCode full-file en PR-diff

1. **Coste de rendimiento**: ScanCode sobre `node_modules` completo = minutos a decenas de minutos por PR (cifras §9.6). Rompe el objetivo de feedback rápido del PR gate.
2. **False positives manifest vs archivo**: el manifiesto declara licencia `X`, el archivo real puede traer `LICENSE` distinto, código vendored/embebido, o `node_modules` con licencias agregadas no declaradas. Inversamente, escanear archivo sobre archivos **del diff** produce ruido: un archivo modificado que siempre violó la política (sin baseline) falla cada PR → "ruido fatigue" → el gate se desactiva.
3. **Duplicación con `scheduled-security.yml`**: `scancode-license-audit` (L105, advisory, cron lunes 03:00 UTC, `--license --copyright --only-findings --json-pp`, artifact 90d `if: always()`) **ya cubre el repo completo**. Un job ScanCode en PR duplicaría el mismo análisis con peor UX (sin artifact acumulado).
4. **`security.yml` / `scheduled-security.yml` con historial `disabled_manually`**: un control que no corre no es gate (decisión registrada en `docs/ci-cd-pipeline-empresarial.md` L3346). Rehabilitados por `secret-scanning` (2026-09-25, `sast-implementation.md` §10 anota `state: active` verificado por API) — **pero** la lección se mantiene: no mover el gate primario a workflows con historial de deshabilitación manual; verificar estado por API antes de depender de ellos.
5. **`security-events: write` sin usar**: `dependency-review-action` no emite SARIF (README sin output SARIF; solo `comment-content` / `dependency-changes` outputs). El permiso queda expandido sin ejercicio → superficie de permiso muerta (ya registrado en §4.2.6).
6. **`scancode-toolkit` sin SARIF**: formatos oficiales `--json-pp` / `--spdx-tv` / `--spdx-rdf` / `--cyclonedx` (RTD, verified) — **no hay `--sarif`**. Sin transformador propio no alimenta el Security tab ni code-scanning → comentar hallazgos en PR requiere harness propio.
7. **`fossa-cli` sin SARIF**: `fossa report` formatos = `csv`, `cyclonedx-json/xml`, `html`, `json`, `markdown`, `spdx`, `spdx-json`, `text` (docs.fossa.com `report` ✅ 200) — **sin SARIF**. Además exige `FOSSA_API_KEY` + subida de revisiones al servidor para cualquier diff.
8. **Gap archivo vs manifest real pero post-merge**: el manifiesto no ve vendored/embebido (gap de ScanCode) y ScanCode no ve CVE (gap de Trivy/dependency-review). Ese gap **no se cierra en PR** sin infraestructura propia; se cubre con el audit semanal advisory (§5.2 L3).

### 9.4 ¿Existe `--baseline-commit` / `--diff` para PR?

| Tool                            | ¿Diff nativo?                                                                                                                                                                                                     | Evidencia (2026-09-26)                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `fossa analyze`                 | **NO** — sin flag de baseline/diff. Flags = `--only-path/--exclude-path`, `--only-target/--exclude-target`, `--branch/-b`, `--revision/-r` (override manual)                                                      | `docs.fossa.com/docs/cli/references/subcommands/analyze` ✅ 200                      |
| `fossa test`                    | **SÍ**: `fossa test --diff <REVISION>` → _"only report new issues observed with the current revision that weren't already reported on the specified `<REVISION>`"_ (`fossa test --revision 34021e --diff v2.0.0`) | `docs.fossa.com/docs/cli/references/subcommands/test` ✅ 200                         |
| `fossa` PR checks               | **SÍ** (plataforma, no CLI): 2 status checks bloqueando PRs con issues nuevas                                                                                                                                     | `docs.fossa.com/docs/project-setup/pr-checks` ✅ 200                                 |
| `scancode-toolkit`              | **NO** — sin `--diff`, sin `--baseline-commit`, sin integración git. Lista completa de opciones (basic/core/output/filter/pre-scan/post-scan) sin flag de diff                                                    | `scancode-toolkit.readthedocs.io/en/latest/reference/scancode-cli/index.html` ✅ 200 |
| `scancode ... cli-options.html` | — **404** → usar `index.html` como referencia canónica                                                                                                                                                            | `.../reference/scancode-cli/cli-options.html` ❌ 404                                 |

Matiz clave: `fossa test --diff` **no es diff de archivos** — es diff **server-side entre revisiones ya subidas** (requiere `fossa analyze` previo + `FOSSA_API_KEY` + ambas revisiones en FOSSA). Escopar ScanCode a un PR exige infraestructura propia: `git diff --name-only origin/base...HEAD` → pasar esa lista como paths de `scancode` (y aun así, sin baseline de política, los archivos pre-existentes violadores generan ruido).

Atajos de ScanCode que **no** son diff: `--from-json` (reusa/mergea scans JSON existentes), `--use-cached-results` (cache), `--only-findings` (**filtra la salida**, NO omite el escaneo de archivos — el costo por archivo se paga igual).

### 9.5 Diferencia clave: `base..head` (manifest) vs full `node_modules`

|                                    | PR-diff (dependency-review)        | Full-file (ScanCode/FOSSA)                          |
| ---------------------------------- | ---------------------------------- | --------------------------------------------------- |
| Alcance                            | grafo de dependencias `base..head` | árbol de archivos (repo + `node_modules` si existe) |
| ¿Detecta CVE nuevo?                | SÍ (GH Advisory)                   | NO (ScanCode no cubre CVE)                          |
| ¿Detecta licencia real de archivo? | NO (solo declarada)                | SÍ (incluye vendored)                               |
| ¿Bloquea merge?                    | SÍ (required check)                | Solo si se vuelve blocking + comments propios       |
| Coste por PR                       | ~segundos (REST)                   | minutos–decenas de minutos (§9.6)                   |
| SARIF                              | NO                                 | NO (ambos) → Security tab solo recibe Trivy         |

### 9.6 Rendimiento comparado (fuentes verificadas)

| Escenario                                                                    | Cifra                                                                                                                                                                           | Fuente (2026-09-26)                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `dependency-review-action` (PR)                                              | llamada REST al dependency graph; sin install ni escaneo → job de segundos                                                                                                      | README + docs.github ✅ 200                                                 |
| ScanCode repo grande (~200 MB, 35.692 archivos), 6 procesos                  | `scan: 1190.02s`, **`total: 1207.72s` ≈ 20 min**                                                                                                                                | GitHub issue `aboutcode-org/scancode-toolkit` **#4508** ✅ 200 (2025-08-05) |
| ScanCode throughput (1 proceso, doc examples)                                | **~1.4–1.6 files/s** (43 archivos en ~29–33 s)                                                                                                                                  | RTD `cli-core-options.html` ✅ 200                                          |
| ScanCode full scan histórico (v1.3.1, single-thread, obsoleto)               | 195.676 archivos → **16.7 h**                                                                                                                                                   | RTD `misc/perf_report` (reporte 2015) ✅ 200                                |
| ScanCode CLI sobre imagen 500 MB (`-clipeu -n5`)                             | **"a couple hours"** (vs 5 días en scancode.io single-process)                                                                                                                  | `github.com/aboutcode-org/scancode.io` issue **#70** ✅ 200                 |
| Estado del arte                                                              | iniciativa `fast-scan` abierta: _"Feedback from community users often include complaints about the speed of scans"_; benchmarks oficiales en `aboutcode-org/scancode-benchmark` | issue **#4070** ✅ 200 (2025)                                               |
| `node_modules` de app React (estimación, sin fuente oficial)                 | típicamente 30k–60k archivos → con lo anterior, **~10–40 min** por PR si se escanea full                                                                                        | estimación derivada de las filas anteriores                                 |
| ScanCode solo archivos del diff (`git diff --name-only` + `--only-findings`) | proporcional a archivos tocados → **segundos–minutos**; `--only-findings` reduce tamaño de salida, el ahorro real viene de escanear **menos archivos**                          | RTD `cli-output-control-and-filter-options.html` ✅ 200                     |

Conclusión numérica: full-file en PR cuesta **2 órdenes de magnitud** más que el gate manifest actual; diff-scoped es viable pero requiere el harness manual descrito en §9.4.

### 9.7 Estado en `project-one` y veredicto (2026-09-26)

**Estado verificado** (grep, sin editar workflows): `ci.yml` L765 `dependency-review:` → `actions/dependency-review-action@v5`, `security-events: write` (L773), `deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, Proprietary, CC-BY-NC-4.0` (L795), `fail-on-scopes` default `runtime` mantenido (L801-805), `security-events: read` en otro job (L815), `dependency-review` en `ci-complete` (L1270); `scheduled-security.yml` L105 `scancode-license-audit` con `continue-on-error: true` (L114), `--only-findings --json-pp` (L117-121), artifact `if: always()` + `retention-days: 90` (L124-129); `tasks.md` 6.1 ✅; `.scancode.yml` presente.

**Veredicto**:

1. **MANTENER `dependency-review` en PR-diff** (blocking, `moderate`): coste ~0, único mecanismo capaz de **bloquear merge** por CVE/licencia declarada. Es el gate correcto para PR.
2. **NO añadir FOSSA/ScanCode full-file en PR**: duplicaría `scancode-license-audit` (scheduled, advisory), costaría 10-40 min/PR, y ni FOSSA ni ScanCode emiten SARIF → sin ganancia de reporting.
3. **MANTENER el audit semanal full-file** como única capa de archivo (advisory): es donde el full-file **sí** justifica su coste (sin presión de latencia de PR).
4. **No usar `security-events: write` para esta acción**: sin SARIF no hay upload; retirar el permiso o reservarlo para cuando exista transformador propio (decision de workflow → fuera de alcance de este doc).
5. **Watch items**: (a) deprecación de `deny-licenses` (#938) → evaluar migración a `allow-licenses` + `allow-dependencies-licenses` (waivers) alineado con `license-policy.md`; (b) deny-list no matchea `LicenseRef-clearlydefined-OTHER` → añadirlo explícitamente si se quiere cubrir licencias no-SPDX; (c) `fail-on-scopes: development` pendiente de PR de prueba (ya documentado §4.2.5).
6. **Si algún día se introduce `vendor/` o código embebido**: evaluar job PR-diff-scoped con `git diff --name-only` → `scancode <paths> --license --only-findings --json-pp`, `continue-on-error: true` (advisory), no blocking. Coste proporcional al diff, no al repo.

### 9.8 Fuentes verificadas (2026-09-26)

- `https://github.com/actions/dependency-review-action` ✅ 200 — README: API diff `base..head`, config options, `deny-licenses` deprecated, sin SARIF
- `https://github.com/actions/dependency-review-action/issues/938` ✅ 200 — deprecación `deny-licenses` (2025-06-06, hoy `Closed as not planned`, `Stale`)
- `https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review` ✅ 200 (1er intento → transport error; reintento OK)
- `https://docs.fossa.com/docs/cli/references/subcommands/analyze` ✅ 200 (updated 2026-09-22) — sin flag diff/baseline
- `https://docs.fossa.com/docs/cli/references/subcommands/test` ✅ 200 — `fossa test --diff <REVISION>`
- `https://docs.fossa.com/docs/cli/references/subcommands/report` ✅ 200 — formatos de reporte, sin SARIF
- `https://docs.fossa.com/docs/project-setup/pr-checks` ✅ 200 (updated 2026-09-22) — 2 status checks bloqueantes
- `https://scancode-toolkit.readthedocs.io/en/latest/reference/scancode-cli/index.html` ✅ 200 — lista completa de CLI options, sin `--diff`/`--baseline-commit`
- `https://scancode-toolkit.readthedocs.io/en/latest/reference/scancode-cli/cli-options.html` ❌ 404 → usar `index.html`
- `https://github.com/aboutcode-org/scancode-toolkit/issues/4508` ✅ 200 — 35.692 archivos / ~200 MB → 1207 s (6 procesos)
- `https://github.com/aboutcode-org/scancode-toolkit/issues/4070` ✅ 200 — `fast-scan`, quejas de rendimiento + `scancode-benchmark`
- `https://github.com/aboutcode-org/scancode.io/issues/70` ✅ 200 — 500 MB → horas vía CLI `-n5`
- `https://scancode-toolkit.readthedocs.io/en/latest/reference/scancode-cli/cli-core-options.html` ✅ 200 — throughput ~1.4-1.6 files/s, `--from-json`, `--use-cached-results`
- `https://scancode-toolkit.readthedocs.io/en/latest/reference/scancode-cli/cli-output-control-and-filter-options.html` ✅ 200 — `--only-findings` (filtra salida)
- Verificación local (grep, 2026-09-26): `.github/workflows/ci.yml` L765-815/L1270; `.github/workflows/scheduled-security.yml` L105-150; change `license-compliance` archivado en `openspec/changes/archive/2026-09-26-license-compliance/tasks.md` (tarea 6.1); `.scancode.yml`; `docs/learning/quality-gates.md` L25

---

> Cuerpo del documento creado en `docs/learning/license-compliance.md`. No se editó ningún workflow, `package.json`, `.fossa.yml`, `.scancode.yml` ni se protegió ninguna regla existente. Gaps documentados con referencias oficiales; roadmap para fase 1-3 definido. §9 añadida 2026-09-26 (investigación PR-diff vs full-file, sin tocar workflows ni código de aplicación).
