# Typosquatted Package Detection (Socket / GuardDog) — Implementación Profesional / Enterprise

> Verificado 2026-09-28 — referencias oficiales comprobadas (github.com/DataDog/guarddog, docs.datadoghq.com/integrations/guarddog, github.com/SocketDev/socket-cli, docs.socket.dev). Estado del repo verificado: **sin capa de detección de typosquats hoy** (grep -rni "socket|guarddog" .github/workflows/ + package.json = 0 matches de herramienta; solo socket.io/\* librerías websocket, sin relación con socket.dev). Implementación previa consultada: [`docs/learning/pipeline-config-scan.md`](./pipeline-config-scan.md) (actionlint/zizmor), [`docs/learning/iac-scanning.md`](./iac-scanning.md), [`docs/learning/sca-dependency-lockfile-scan.md`](./sca-dependency-lockfile-scan.md), [`docs/learning/containerfile-lint.md`](./containerfile-lint.md), [`docs/learning/quality-gates.md`](./quality-gates.md), [`docs/learning/license-policy.md`](./license-policy.md). Proyecto: monorepo `project-one` (Node/Express + React); `security.yml` activa `dependency-scan` Trivy + `sbom`; `ci.yml` L765 `dependency-review`; `scheduled-security.yml` `scancode-license-audit`; `prebuild-security-complete` L1513 `needs [dependency-review, secrets, scancode-license-pr-diff]`.
>
> **Nota:** Este documento cubre la detección de typosquatting / dependency confusion en paquetes npm/PyPI/etc., no código fuente (SAST) ni dependencias con CVE (SCA) ni config de pipelines (zizmor/actionlint). Es capa transversal de `DevSecOps` (§20 pipeline).

---

## 1. Contexto y ubicación en pipeline

**Typosquatting / Package Confusion** = ataque a la cadena de suministro donde un paquete malicioso usa un nombre similar al de un paquete popular (ej. `lodb` por `lodash`, `request` por `reqeust`, homoglyphs Unicode). npm audit / Trivy no cubren 0-day sin CVE; dependency-review solo revisa manifiesto PR; lockfile-audit revisa lockfile CVE; none cubre typosquatting de metadatos + YARA.

En `docs/ci-cd-pipeline-empresarial.md` §23.3 `Stage 2` (`Security`): SAST + SCA + IaC + Pipeline Config Scan van en paralelo (pre-build). Typosquatting detection se ubica en la misma capa de **seguridad pre-build**, junto a `dependency-review`, `lockfile-audit`, `actionlint/zizmor` y `security.yml` `dependency-scan`. No reemplaza a ninguno; complementario.

Estado verificado (`project-one`):

- `.github/workflows/ci.yml`: job `actionlint` bloqueante L659-673; `dependency-review` L765; sin jobs typosquatting (0 matches).
- `package.json`: sin dependencias `socket`/`guarddog`; `socket.io/*` son librerías websocket (sin relación).
- `scheduled-security.yml`: `scancode-license-audit` + `checkov-iac-weekly` + otros.
- Directorios `.github/workflows/`: 9 workflows activos (misma lista de pipeline-config-scan.md).

---

## 2. Referencias oficiales verificadas (2026-09-28)

| Fuente / URL                                   | Estado                                                                                                                | Nota clave / Corrección                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GuardDog (`github.com/DataDog/guarddog`)       | ✅ 200 HTML                                                                                                           | v3.2.0 (2026-08-12), Apache-2.0, 1.2k stars, mantenido DataDog. Ecosistemas: npm, PyPI, go, crates, rubygems, GitHub Actions (JS), VSCode. Reglas typosquatting (threat.metadata.typosquatting, severity high), `threat-npm-dependency-confusion` (self-referencing deps / DNS exfil), `threat-runtime-obfuscation-unicode` (homoglyphs), `deceptive_author`, `unclaimed_maintainer_email_domain`, `new_install_script`, `provenance_regression`, `risky_new_dependency`. Motor risk-based (severity 30% / attack-chain 20% / specificity 30% / sophistication 20%).             |
| GuardDog RULES.md                              | ✅ 200                                                                                                                | `typosquatting` = 'named closely to a highly popular package'; `typosquat-uses` (en zizmor, distinto de GuardDog).                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GuardDog flags                                 | ✅ README                                                                                                             | `guarddog npm verify package.json --output-format=sarif > guarddog.sarif` (SARIF SOLO en `verify`); `--output-format=json` en TODOS los comandos; `--rules`/`--exclude-rules`; `--version X`; `--include-dev-dependencies` (devDeps EXCLUIDAS por defecto); `--no-sandbox` (sandbox Landlock/Seatbelt OBLIGATORIO por defecto; si no hay sandbox el scan falla); `--log-level debug`.                                                                                                                                                                                            |
| GuardDog GitHub Action                         | ❌ 404 (`DataDog/guarddog-action` no existe)                                                                          | Patrón oficial documentado en README = workflow inline: `astral-sh/setup-uv@v7` + `uvx guarddog pypi verify ... --output-format sarif --exclude-rules repository_integrity_mismatch > guarddog.sarif` + `github/codeql-action/upload-sarif` con `category: guarddog-builtin`. Repo local usa upload-sarif@v4 (no @v3 del ejemplo) → adoptar v4 + categoría propia `guarddog`.                                                                                                                                                                                                    |
| GuardDog docs                                  | ❌ `docs.datadoghq.com/guarddog/` 404                                                                                 | URL oficial válida: `docs.datadoghq.com/integrations/guarddog/` (integración Datadog Agent, distinta del CLI). Fuente primaria = README + RULES.md + WRITING_RULES.md; blog: securitylabs.datadoghq.com/articles/guarddog-3-0-release/.                                                                                                                                                                                                                                                                                                                                          |
| Socket CLI (`github.com/SocketDev/socket-cli`) | ✅ 200 HTML                                                                                                           | branch main = 2.x prerelease. Install: `pnpm add --global socket@prerelease` (2.x), npm `@socketsecurity/cli` latest=1.2.1 (verificado hoy) y paquete npm `socket` latest=1.2.1, pypi `socketsecurity` (binario `socketcli`). Comandos: `socket ci` (alias de `socket scan create --report`; exit != 0 si no pasa security+license policy; requiere token con full-scans:create, full-scans:list, security-policy:read; org desde SOCKET_CLI_ORG_SLUG o config), `socket scan create --report --json`, `socket package npm/express@4.18.0`.                                      |
| Socket output                                  | ✅ docs.socket.dev                                                                                                    | flags `--json` y `--markdown` en scan create/report/diff — SIN flag SARIF nativo en CLI (docs actualizados 2026-09-23). Ruta SARIF/Code-Scanning = vía GitHub App (no emite SARIF; emite comments/check runs) o conversión propia JSON→SARIF.                                                                                                                                                                                                                                                                                                                                    |
| Socket GitHub Action                           | ❌ `SocketDev/socket-github-action` / `socketsecurity/socket-github-action` 404 (org SocketSecurity = 0 public repos) | Integración oficial 1 = GitHub App 'Socket for GitHub' (PR alerts + check runs, gratis para OSS). Integración oficial 2 = workflow inline docs.socket.dev/docs/socket-for-github-actions: `pip install socketsecurity --upgrade` + env `SOCKET_SECURITY_API_KEY` + `socketcli --target-path $GITHUB_WORKSPACE --scm github --pr-number N`.                                                                                                                                                                                                                                       |
| Socket policy-as-code                          | ✅ docs.socket.dev/docs/socket-yml                                                                                    | `socket.yml` (o `socket.yaml`) en raíz — `version: 2` OBLIGATORIO; claves: `projectIgnorePaths`, `triggerPaths` (p.ej. package.json + package-lock.json → solo ahí PR alerts; ideal monorepo), `issueRules` (mapa de issues: `didYouMean: true/false`, malware, installScripts...; DEPRECATED → repository labels), `githubApp.{enabled,pullRequestAlertsEnabled,dependencyOverviewEnabled,ignoreUsers,disableCommentsAndCheckRuns}`. Org-level: Policies = ordered rules con acciones block/warn/monitor/ignore, gestionables por Security Policy API (security-policy:update). |
| Socket typosquat reglas                        | ✅ socket.dev/alerts/didYouMean                                                                                       | alertas `didYouMean` = 'Possible typosquat attack' y `gptDidYouMean` = 'AI-detected possible typosquat' (distingue IA de revisión humana); categoría Supply Chain Risk. Taxonomía confusion/combosquatting/homoglyphs (USENIX'23 'Beyond Typosquatting', Neupane et al.) NO expuesta como knobs configurables — Socket la aplica internamente; blog oficial 2023-11-24 confirma detección en GitHub App + CLI ('safe npm' bloquea antes de escribir a disco).                                                                                                                    |
| Comparativa Socket vs GuardDog                 | —                                                                                                                     | Socket = SaaS SCA de comportamiento (70+ signals, PR comments, dashboard, API quota 1 scan/unidad, requiere cuenta+API key; alcance: malware, typosquatting, install scripts, telemetry, licencias, reachability Enterprise; FREE $0/1000 scans OSS, Team $25/dev, Business $50/dev, Socket Firewall gratis). GuardDog = CLI OSS offline-first (YARA sobre código + metadata, sin cuenta ni API key, SARIF directo a Code Scanning, risk scoring, sandbox), cobertura solo detección de paquetes maliciosos/typosquat — sin CVE, sin licencias, sin dashboard.                   |
| No duplicación                                 | —                                                                                                                     | Capa nueva SOLO typosquat/malicious-package metadata+YARA. Trivy `category: trivy` (security.yml, CVE/secret, NO tocar) ≠ dependency-review (manifest PR diff) ≠ lockfile-audit (npm audit CVE lockfile) ≠ checkov-iac ≠ hadolint (`category: hadolint`/`hadolint-weekly`) ≠ actionlint/zizmor. npm advisories → ya cubiertos por lockfile-audit; typosquat NO lo cubre npm audit (0-day sin CVE).                                                                                                                                                                               |
| Patrón enterprise ya presente                  | —                                                                                                                     | L1 pre-commit advisory DESPUÉS del gate bloqueante en .husky/pre-commit, siempre `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |     | true`/ fuera de la cadena`set -e`(nunca escala a blocking); L2 PR job en ci.yml con`if: github.event_name == 'pull_request'`, `continue-on-error: true`a nivel JOB (actions/toolkit#581 → agregador ve success),`permissions: security-events: write`, upload-sarif category única, artifact `retention-days: 14`con`if: always()`; L3 semanal en scheduled-security.yml con artifact 90d + category única (`...-weekly`); diff-scope OBLIGATORIO: `git diff --name-only --diff-filter=ACMR base head`(scan-list.txt prohibido). FASE 2 blocking: quitar continue-on-error + añadir job al`needs`de`prebuild-security-complete` (ci.yml L1513) + fila en quality-gates.md, solo tras 2-4 semanas de runs limpios (taxonomía D2/D3 de iac-scanning/containerfile-lint). |
| Versiones pinneadas recomendadas               | —                                                                                                                     | GuardDog `v3.2.0` (pip `guarddog==3.2.0` o imagen `ghcr.io/datadog/guarddog:v3.2.0` o `uvx guarddog==3.2.0`), setup-uv@v7 + codeql-action/upload-sarif@v4 + actions/upload-artifact@v7 + actions/checkout@v5 (convención del repo). Socket CLI `@socketsecurity/cli@1.2.1` o imagen/pin de release, `socketcli` de pypi con versión fija. Nunca `latest`.                                                                                                                                                                                                                        |

---

## 3. Herramientas — comparación profesional

| Característica                     | GuardDog (recomendado FASE 1)                                                                           | Socket (alternativa posterior)                                                                                                                                                               | Observación para `project-one`                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| **Lenguaje / framework**           | Python 3.10+ (pip/uvx)                                                                                  | Node.js (CLI 2.x prerelease) / npm pypi                                                                                                                                                      | Ambos ligeros, sin dependencias externas.                                                                           |
| **Reglas (policies)**              | ~14 reglas typosquatting/dependency-confusion/homoglyphs/malware (RULES.md v3)                          | didYouMean + gptDidYouMean (IA) + installScripts + malware + licenses + reachability (Enterprise)                                                                                            | GuardDog más focalizado en typosquat; Socket más amplio en comportamiento.                                          |
| **Salida**                         | JSON (todos los comandos) + SARIF (SOLO `verify`)                                                       | JSON / Markdown (scan create/report/diff) — SIN SARIF nativo en CLI                                                                                                                          | GuardDog SARIF directo a Code Scanning; Socket vía GitHub App (comments/check runs) o conversión JSON→SARIF propia. |
| **Integración GitHub Action**      | ❌ No existe `DataDog/guarddog-action` (404). Patrón: workflow inline con setup-uv + uvx + upload-sarif | ❌ No existen `SocketDev/socket-github-action` ni `socketsecurity/socket-github-action` (404). Patrón: GitHub App (gratis OSS) o workflow inline con socketcli + env SOCKET_SECURITY_API_KEY | Ambas requieren workflow inline; GuardDog más simple (sin token).                                                   |
| **Continuación en error (fase 1)** | `continue-on-error: true` (nivel job)                                                                   | `continue-on-error: true` (nivel job)                                                                                                                                                        | Ambos soportan advisory → blocking gradual.                                                                         |
| **Evidence / artefacto**           | `upload-artifact` (JSON / SARIF / 14d)                                                                  | GitHub App check runs + comment (sin artefacto SARIF nativo)                                                                                                                                 | Alineado con `scheduled-security.yml` (90d) y `ci.yml` (14d).                                                       |
| **Pre-commit / local**             | `uvx guarddog==3.2.0 npm verify package.json --output-format sarif                                      |                                                                                                                                                                                              | true` (advisory)                                                                                                    | `socket ci` (requiere token con full-scans:create) | Recomendado GuardDog por no requerir cuenta/API key. |
| **Cosmética / ruido**              | Medio (reglas typosquatting pueden flaggear paquetes populares sin pin exacto)                          | Bajo (IA + didYouMean, pero requiere cuenta)                                                                                                                                                 | Requiere `exclude-rules` selectivo para reducir ruido.                                                              |
| **Pricing**                        | OSS / gratis (sin cuenta)                                                                               | FREE $0/1000 scans OSS; Team $25/dev; Business $50/dev                                                                                                                                       | GuardDog = elección práctica FASE 1; Socket como capa opcional posterior (requiere decisión de negocio).            |

**Recomendación para `project-one`:** Implementar GuardDog v3.2.0 como capa primaria de typosquatting en FASE 1 (CLI OSS, sin credenciales, SARIF nativo en verify, reglas typosquatting/dependency-confusion/homoglyphs verificadas en RULES.md). Socket como capa opcional posterior (GitHub App gratis si el repo es OSS, o `socket ci` si hay SOCKET_SECURITY_API_KEY) — requiere decisión de cuenta/cuota y no emite SARIF nativo en CLI.

---

## 4. Implementación empresarial / profesional — patrones

### 4.1 L1 Pre-commit advisory (local, shift-left)

```bash
# .husky/pre-commit (advisory, no bloqueante, fuera de la cadena set -e)
uvx guarddog==3.2.0 npm verify package.json --output-format sarif --exclude-rules typosquatting > .tmp/guarddog.sarif || true
# (el reporte queda en .tmp/ para visibilidad; nunca escala a blocking)
```

- **No debe ser bloqueante** (`|| true` fuera de `set -e`) porque deuda histórica requiere remediación planificada (similar a `sast-implementation.md` §3.1 L3 Full-history).

### 4.2 L2 PR-time advisory (ci.yml)

```yaml
# .github/workflows/ci.yml — job typosquat-guarddog (advisory, continue-on-error)
typosquat-guarddog:
  name: Typosquat GuardDog (PR advisory)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request' && needs.repo-discovery.outputs.shared == 'true'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write
  continue-on-error: true # FASE 1 advisory
  steps:
    - uses: actions/checkout@v5
    - name: Setup uv (pinned)
      uses: astral-sh/setup-uv@v7
      with:
        uv-version: '0.4.5'
    - name: Install GuardDog (pinned)
      run: uvx guarddog==3.2.0 --version
    - name: GuardDog verify (SARIF)
      run: uvx guarddog==3.2.0 npm verify package.json --output-format sarif --exclude-rules typosquatting > guarddog.sarif
    - name: Upload SARIF (evidencia 14d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: guarddog.sarif
        category: guarddog
    - name: Upload JSON artifact (14d advisory)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: guarddog-report-pr
        path: guarddog.sarif
        retention-days: 14
```

- **Fase 1 (advisory)**: `continue-on-error: true` implícito (job no bloqueante porque no está en `prebuild-security-complete.needs`). Artefacto 14d PR; feedback al PR vía PR comment (opcional, requiere script que publique comentario con los hallazgos). No bloquea `prebuild-security-complete`.

### 4.3 L3 Semanal / full repo (auditoría, evidencia 90d)

```yaml
# .github/workflows/scheduled-security.yml — extender existente
guarddog-weekly:
  name: GuardDog Weekly (typosquat advisory)
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'
  needs: []
  permissions:
    contents: read
    security-events: write
  continue-on-error: true
  steps:
    - uses: actions/checkout@v5
    - name: Setup uv (pinned)
      uses: astral-sh/setup-uv@v7
      with:
        uv-version: '0.4.5'
    - name: GuardDog Weekly (advisory, artefact SARIF)
      run: uvx guarddog==3.2.0 npm verify package.json --output-format sarif --exclude-rules typosquatting > guarddog-weekly.sarif
    - name: Upload SARIF (evidencia 90d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: guarddog-weekly.sarif
        category: guarddog-weekly
    - name: Upload JSON artifact (90d)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: guarddog-weekly
        path: guarddog-weekly.sarif
        retention-days: 90
```

- **Coherencia con `scancode-license-audit`**: ambos semanales, 90d, `continue-on-error: true`; no duplican (uno analiza licencias, otro typosquatting).

### 4.4 Política como código (config versionado)

```yaml
# .guarddog.yml (o equivalente) — policy-as-code
exclude_rules:
  - typosquatting # ajustar según tolerancia del repo
include_dev_dependencies: false # devDeps EXCLUIDAS por defecto
```

- Versionado en repo (no hardcodeado en workflows); CODEOWNERS para actualización de reglas.

### 4.5 Validación local antes de merge

```bash
# Verificar que no haya introducido nuevos hallazgos de alto nivel
uvx guarddog==3.2.0 npm verify package.json --output-format sarif --exclude-rules typosquatting > .tmp/guarddog.sarif
jq -e '.runs[0].results | length == 0' .tmp/guarddog.sarif
# Si alguno falla (exit != 0) → revisar y corregir antes de merge; no usar --no-fail ni forzar merge sin revisión.
```

---

## 5. Decisiones propuestas para `project-one` (coherentes con pipeline existente)

1. **D1 — No reemplazar capas existentes**: Trivy `security.yml` (`category: trivy`) ≠ dependency-review ≠ lockfile-audit ≠ checkov-iac ≠ hadolint ≠ actionlint/zizmor. Capa nueva exclusiva typosquat/malware metadata+YARA.
2. **D2 — 3 capas**: L1 pre-commit advisory (`|| true` fuera de la cadena `set -e`, reporte a .tmp/), L2 job PR `typosquat-guarddog` (`continue-on-error: true` job-level, category `guarddog`, artifact 14d, `if: always()`), L3 `guarddog-weekly` en `scheduled-security.yml` (artifact 90d, category `guarddog-weekly`).
3. **D3 — Taxonomía advisory→blocking**: FASE 2 quitar `continue-on-error` y añadir a `prebuild-security-complete.needs` (ci.yml L1513) solo tras 2-4 semanas sin FP; actualizar `quality-gates.md`.
4. **D4 — Complementariedad/cero duplicación**: GuardDog typosquat ≠ Trivy CVE ≠ dependency-review manifest ≠ npm audit lockfile; no añadir scanners a Trivy; no tocar dependabot.yml.
5. **D5 — Policy-as-code**: flags/reglas en config versionado (`.guarddog.yml`/script `scripts/` o `socket.yml` v2 con `triggerPaths` package manifests si se adopta Socket), no hardcodeados en workflows; CODEOWNERS.
6. **D6 — Validación local pre-merge**: `uvx guarddog==3.2.0 npm verify package.json --output-format sarif > .tmp/guarddog.sarif` debe salir limpio antes de merge; hallazgos → triar/excluir con justificación versionada.

> **Nota:** D1-D6 replican exactamente la taxonomía `quality-gates.md` y los cambios `pipeline-config-scan` / `iac-scanning` / `sca-lockfile-compliance` / `containerfile-lint`: `advisory` → `blocking` tras período sin falsos positivos y con baseline.

---

## 6. Limitaciones y riesgos (corporativo)

| Riesgo                                                                                                                                 | Impacto                                                                      | Mitigación / Documento                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GuardDog verify requiere red (descarga del registry) + sandbox (OK en ubuntu-latest)                                                   | Falta de conectividad → job falla                                            | Verificar runner tiene salida a registry npm; sandbox Landlock/Seatbelt activo por defecto (mitiga CVE-2022-23530/31, CVE-2026-22870/871).                                                                                                |
| devDeps excluidas por defecto (`--include-dev-dependencies` no set)                                                                    | Gap en dev dependencies                                                      | Añadir flag `--include-dev-dependencies` si el repo usa devDeps críticos; otherwise documentar exclusión.                                                                                                                                 |
| SARIF solo en `verify` (issue 'Support SARIF output in scan commands')                                                                 | Falta evidencia SARIF en `scan`/`ci`                                         | Usar `verify` (no `scan`/`ci`) para FASE 1/2; parse SARIF con `jq` para gating FASE 2.                                                                                                                                                    |
| FP gestionados en discussions #177                                                                                                     | Ruido en FASE 1                                                              | FASE 1 advisory permite acumular FP y ajustar `--exclude-rules` antes de FASE 2 blocking.                                                                                                                                                 |
| Top-packages cache local (regla typosquat depende de él) → refrescar en CI semanal                                                     | Cache stale → falsos negativos                                               | `guarddog-weekly` actualiza cache cada semana; documentar en migration step.                                                                                                                                                              |
| Socket exige cuenta+token+cuota, sin SARIF nativo, issueRules deprecated → repository labels                                           | Complejidad de integración + coste                                           | Socket como capa opcional posterior (GitHub App gratis si OSS); decisión de negocio requerida.                                                                                                                                            |
| Storage/permisos/fork                                                                                                                  | Coste de almacenamiento; pero cada uno < 50 KB                               | `retention-days: 90`; usar `actions/upload-artifact` con nombres diferenciados (`guarddog-report-pr`, `guarddog-weekly`).                                                                                                                 |
| No hay `Dockerfile` en algunos workflows → `zizmor` audit `unpinned-images` puede estar vacío                                          | No es riesgo, solo información                                               | Mantener el audit para futuros workflows que usen imágenes.                                                                                                                                                                               |
| `actionlint` y `zizmor` son independientes; un PR con cambios en `.github/workflows/*.yaml` dispara ambos jobs                         | Tiempo de CI; pero pre-build paralelo (`repo-discovery` DAG) mantiene rápido | Ambos jobs son ligeros (<2 s cada uno); el overhead es mínimo.                                                                                                                                                                            |
| `checkov-iac` ya escanea `Dockerfile` (framework `dockerfile`) → posible solapamiento con `hadolint` (ver cambio `containerfile-lint`) | Solapamiento de capacidades (IaC vs calidad Dockerfile)                      | Documentar claramente: `checkov-iac` = política de IaC (seguridad de infraestructura); `hadolint` = calidad de `Dockerfile` (best practices). Aquí, `GuardDog` = detección de typosquatting en paquetes npm/PyPI (no IaC, no Dockerfile). |

---

## 7. Fuentes (verificadas esta sesión / referencias internas)

- `github.com/DataDog/guarddog` (200 HTML); `RULES.md` v3; `v3.2.0` release (2026-08-12).
- `github.com/SocketDev/socket-cli` (200 HTML); `docs.socket.dev/docs/socket-ci`; `docs.socket.dev/docs/socket-scan`; `docs.socket.dev/docs/socket-yml`; `docs.socket.dev/docs/policies`; `docs.socket.dev/docs/socket-for-github-actions`.
- `securitylabs.datadoghq.com/articles/guarddog-3-0-release/`; `docs.datadoghq.com/integrations/guarddog/`.
- `socket.dev/alerts/didYouMean`; `socket.dev/blog/how-socket-combats-insidious-typosquatting-supply-chain-attacks`; `socket.dev/pricing`.
- `cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html`; `owasp.org/www-project-top-10-ci-cd-security-risks/CICD-SEC-03-Dependency-Chain-Abuse`.
- `csrc.nist.gov/pubs/sp/800/218/final`; `slsa.dev/spec/v1.0/requirements`; `github.com/advisories`.
- `usenix.org/system/files/sec23_slides_neupane.pdf` (Beyond Typosquatting, Neupane et al.).
- Referencias internas: `docs/learning/pipeline-config-scan.md` (actionlint/zizmor); `docs/learning/iac-scanning.md` (IaC Scanning); `docs/learning/sca-dependency-lockfile-scan.md` (Lockfile CVE); `docs/learning/containerfile-lint.md` (Hadolint Dockerfile lint); `docs/ci-cd-pipeline-empresarial.md` §23.3; `.github/workflows/ci.yml` L659-673 (actionlint bloqueante); `.github/actionlint.yaml`; `.github/workflows/security.yml`; `.github/workflows/scheduled-security.yml`; `.husky/pre-commit` L4-45 (advisory).

---

## 8. Estado del documento

- Creado: `docs/learning/typosquatting-detection.md` (2026-09-28)
- Revisión cruzada: coherente con `pipeline-config-scan.md` (patrones de FASE 1/2, artefactos 14d/90d, categoría SARIF única, política como código `.guarddog.yml`, `.github/zizmor.yml` opcional); no duplica `dependency-review.md` (manifest PR-time) ni `license-compliance.md` (archivo + licencia); complementa `sca-dependency-lockfile-scan.md` (CVE lockfile) y `iac-scanning.md` (IaC infra) con capa de detección de typosquatting en paquetes npm/PyPI.
- Siguiente paso propuesto (fuera de doc): crear los jobs `typosquat-guarddog` en `ci.yml`; crear los jobs semanal en `scheduled-security.yml`; añadir `.guarddog.yml` si se desea; validar `prebuild-security-complete.needs`; documentar filas en `quality-gates.md`; archivar `change` `typosquatting-detection` si se activa.
- **IMPLEMENTADO (change `typosquatting-detection`, 2026-09-28):** wrapper versionado `scripts/guarddog-verify.sh` (única política — **corrección verificada: GuardDog no soporta config files, solo env vars + flags CLI**, por lo que el `.guarddog.yml` propuesto inicialmente era un fichero muerto; el wrapper fija pin `3.2.0` con verificación de versión, `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` y exclusiones justificadas — FASE 1: ninguna) + job PR `typosquat-guarddog` en `ci.yml` (FASE 1 advisory: `continue-on-error: true`, `setup-uv` SHA-pinned `b75a909f…` v6.7.0, SARIF `category: guarddog`, artifact 14d, guards `\|\| true`/`test -s`/`jq -e .`/`hashFiles`, fuera de `prebuild-security-complete.needs`) + job semanal `guarddog-weekly` en `scheduled-security.yml` (SARIF `category: guarddog-weekly`, artifact 90d, re-evaluación semanal con datos frescos de top-packages — runners efímeros, sin cache persistente) + paso advisory en `.husky/pre-commit` tras `zizmor` (degrada silencioso en Windows — **verificado empíricamente**: `uvx guarddog==3.2.0` falla al compilar `nono-py 0.16.0` en Windows, que NO publica wheels win — solo manylinux; en runners ubuntu-latest instala sin compilar); filas en `quality-gates.md` §2/§4.4, capa en `license-policy.md` §6, nota de separación en `sca-dependency-lockfile-scan.md` §9; CODEOWNERS sobre `scripts/` vía `.github/` (devops-team).
- **Pendiente**: primer run real en CI (los runs locales en Windows fallan por plataforma — comportamiento seguro del wrapper: exit 1 con error claro, sin SARIF); FASE 2 (diferida): clasificar ruido en el wrapper → 2-4 semanas sin FP → quitar `continue-on-error` + `prebuild-security-complete.needs`.
