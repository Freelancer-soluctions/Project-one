# Containerfile Lint (Hadolint) — investigación e implementación empresarial

> **Estado**: investigación completa (2026-09-27). **Solo documento** — ningún workflow fue modificado.
> **Verificación**: todas las referencias oficiales comprobadas con fetch HTTP el 2026-09-27 (ver §2 y §7).

## 1. Contexto

`project-one` construye una imagen de contenedor desde `apps/server/Dockerfile` (usada en `deploy.yml` L85/L194 y `preview.yml` L82). Estado verificado 2026-09-27:

- `grep -rni hadolint .github/workflows/` → **0 matches**: no existe job de Containerfile lint.
- `find . -name Dockerfile -not -path '*/node_modules/*'` → **1 archivo**: `apps/server/Dockerfile` (build context = raíz del monorepo).
- `security.yml` `dependency-scan` (Trivy, activo, `aquasecurity/trivy-action@0.36.0`) corre `scan-type: fs` **sin input `scanners`** → default de trivy-action = `vuln,secret` (verificado en README oficial). **NO ejecuta `misconfig`** → no cubre lint/misconfig de `Dockerfile`. Cobertura actual de `Dockerfile` en el repo = solo `checkov-iac` (framework `dockerfile` vía `.checkov.yml`).
- Capas vecinas ya activas: SAST (CodeQL/Semgrep), SCA (`dependency-review`, `lockfile-audit`, Trivy), IaC (`checkov-iac`), licencias (`scancode-license-pr-diff`), secretos (`gitleaks`).

**Gap real**: no hay lint de _best practices_ de Dockerfile (ShellCheck sobre `RUN`, pin de versiones, capas consolidadas, registry allowlist). Checkov cubre misconfig de seguridad (CKV*DOCKER*\*); Hadolint cubre higiene/Calidad del Dockerfile — capas complementarias, no sinónimos (§3).

## 2. Referencias oficiales verificadas (2026-09-27)

| Referencia                                          | Estado                    | Verificación                                                                         |
| --------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `github.com/hadolint/hadolint`                      | 200 OK                    | README completo leído; 12.4k stars, GPL-3.0                                          |
| `hadolint.github.io/hadolint` (online linter)       | 200 OK                    | sitio oficial funcional                                                              |
| Última release                                      | **v2.15.1** (31 Jul 2026) | `releases/latest` → tag `v2.15.1`, fix DL3066                                        |
| `hadolint --version` / `--help`                     | OK                        | flags oficiales (§2.1)                                                               |
| `.hadolint.yaml` config                             | OK                        | §2.2 (esquema oficial completo)                                                      |
| `docker run --rm -i hadolint/hadolint < Dockerfile` | OK                        | README oficial (también `ghcr.io/hadolint/hadolint`, variantes `-debian`/`-alpine`)  |
| `hadolint/hadolint-action`                          | 200 OK                    | v3.1.0, inputs §2.3                                                                  |
| `goodwithtech/dockle`                               | 200 OK                    | **3.3k stars**, Apache-2.0 archivo + badge AGPLv3                                    |
| `coveyour/dockle`                                   | **404**                   | corrección: la org correcta es `goodwithtech`, no `coveyour`                         |
| `aquasecurity/trivy-action@0.36.0`                  | OK                        | input `scanners`, default `vuln,secret`, valores `vuln,secret,misconfig,license`     |
| Trivy misconfiguration docs                         | OK                        | "Misconfiguration detection is **not enabled by default** in `image`, `fs` y `repo`" |

### 2.1 CLI Hadolint (extracto oficial de `hadolint --help`)

```text
hadolint [-v|--version] [-c|--config FILENAME] [DOCKERFILE...]
  [--no-fail] [--no-color] [-V|--verbose] [-f|--format ARG]
  [--error|--warning|--info|--style RULECODE] [--ignore RULECODE]
  [--trusted-registry REGISTRY] [--require-label LABELSCHEMA]
  [--strict-labels] [--disable-ignore-pragma]
  [-t|--failure-threshold THRESHOLD]

--format       [tty | json | checkstyle | codeclimate | gitlab_codeclimate | gnu | codacy | sonarqube | sarif | junit]
--failure-threshold  [error | warning | info | style | ignore | none]  (default: info)
```

Reglas clave (wiki oficial): `DL3003` (usar WORKDIR, warning), `DL3006` (tag explícito, warning), `DL3007` (no `latest`), `DL3008`/`DL3018`/`DL3016` (pin de versiones apt/apk/npm), `DL3019` (`apk --no-cache`), `DL3059` (RUNs consecutivos → consolidar, info), `DL3026` (solo registry allowlist, error), `DL3025` (CMD/ENTRYPOINT JSON), `DL3002` (no root final), `DL4006` (`pipefail`), más reglas `SC*` de ShellCheck.

Ignorar reglas: CLI (`--ignore`), config (`ignored:`), inline (`# hadolint ignore=DL3006` sobre la línea) o global (`# hadolint global ignore=...`). **`--ignore` en CLI anula la lista del config** (oficial).

### 2.2 `.hadolint.yaml` — esquema oficial (policy-as-code)

Orden de búsqueda (primero que exista, exclusivo): `$PWD/.hadolint.yaml` → `$XDG_CONFIG_HOME/hadolint.yaml` → `$HOME/.config/hadolint.yaml` → `$HOME/.hadolint/hadolint.yaml` → `$HOME/.hadolint.yaml`. Extensiones `yaml|yml`. En Windows `%LOCALAPPDATA%` sustituye a `XDG_CONFIG_HOME`.

```yaml
failure-threshold: warning # error | warning | info | style | ignore | none
format: sarif # tty | json | checkstyle | ... | sarif | junit
ignored:
  - DL3003
  - DL3006
override:
  error: [DL3026]
  warning: [DL3018]
no-color: true
no-fail: false
strict-labels: false
disable-ignore-pragma: false
trustedRegistries:
  - docker.io
  - ghcr.io
label-schema:
  author: text
  version: semver
```

También vía env vars: `HADOLINT_IGNORE`, `HADOLINT_FORMAT`, `HADOLINT_FAILURE_THRESHOLD`, `HADOLINT_TRUSTED_REGISTRIES`, `HADOLINT_NOFAIL`, `NO_COLOR`. Montaje en contenedor: `docker run --rm -i -v "$PWD/.hadolint.yaml:/.hadolint.yaml" hadolint/hadolint < Dockerfile`.

### 2.3 `hadolint/hadolint-action` (v3.1.0) — inputs oficiales

| Input                                  | Default            | Nota                                                            |
| -------------------------------------- | ------------------ | --------------------------------------------------------------- |
| `dockerfile`                           | `./Dockerfile`     | path; en monorepo: `apps/server/Dockerfile`                     |
| `recursive`                            | `false`            | busca Dockerfiles recursivamente                                |
| `config`                               | `./.hadolint.yaml` | política explícita                                              |
| `format`                               | `tty`              | **incluye `sarif`** → upload a Security tab                     |
| `failure-threshold`                    | `info`             | subir a `warning`/`error` para FASE 2                           |
| `ignore`                               | —                  | comma-separated (anula config; preferir config)                 |
| `trusted-registries`                   | —                  | comma-separated                                                 |
| `no-fail`                              | `false`            | no-fail nativo de la action (alternativa a `continue-on-error`) |
| `output-file`                          | `/dev/stdout`      | guardar reporte como artifact                                   |
| `override-error/-warning/-info/-style` | —                  | severidades                                                     |

Resultados también en env `HADOLINT_RESULTS` (para comentario de PR con `actions/github-script`). El repo oficial trae `.pre-commit-hooks.yaml` → compatible con framework `pre-commit`.

## 3. Comparación de herramientas (por qué Hadolint y no otra)

| Herramienta               | Qué analiza                                                                                                 | Input                    | Repo/estado                                                     | Encaje en project-one                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Hadolint** (Haskell)    | Sintaxis/AST del **Dockerfile** + ShellCheck en `RUN`; best practices (pin, capas, WORKDIR, tags, registry) | `Dockerfile` (pre-build) | `hadolint/hadolint`, v2.15.1, 12.4k ★, activo                   | **Elegido**: lint de Containerfile en pre-build, advisory FASE 1                                                |
| **Dockle** (Go)           | **Imagen ya construida**: CIS Docker Benchmark + best practice post-build (USER, cache, capas)              | imagen Docker            | `goodwithtech/dockle` (NO `coveyour` → 404), 3.3k ★             | Alternativa: requiere `docker build` (coste CI); complementaría, no sustituye                                   |
| **Trivy** (Go, Aqua)      | `fs`: CVE + secretos; `--scanners misconfig`: IaC/Dockerfile misconfig (CKV\_\*)                            | repo/imagen              | ya activo en `security.yml` (`category: trivy`)                 | **NO duplicar**: ya cubre CVE/secretos. Su `misconfig` sí cubriría Dockerfile pero solapa con Checkov ya activo |
| **Checkov** (Bridgecrew)  | IaC Policy-as-Code (Dockerfile/TF/K8s), CKV\_\*                                                             | repo                     | ya activo: `checkov-iac` (PR, 14d) + `checkov-iac-weekly` (90d) | **NO duplicar**: capa de seguridad/IaC; Hadolint = capa de calidad de Containerfile                             |
| **KICS** (Checkmarx)      | IaC misconfig (multi-engine)                                                                                | repo                     | no instalado (design `iac-scanning` D7: condicional)            | Solo si crece K8s/Pulumi                                                                                        |
| **SAST** (Semgrep/CodeQL) | Código de aplicación (JS/TS)                                                                                | código                   | ya activo (`security.yml`, `category: codeql`/`semgrep`)        | No toca Dockerfile                                                                                              |

**Corrección de premisa**: el valor `--scanners vuln,secret,config` del brief **no existe**; el valor correcto es **`misconfig`** (`config` es el _subcommand_ `trivy config`, no un scanner). Ejemplo correcto: `trivy fs --scanners vuln,misconfig,secret .`. Dado que `security.yml` corre solo `vuln,secret`, Trivy hoy **no** linta el Dockerfile — pero añadir `misconfig` ahí duplicaría a `checkov-iac` (decisión: no tocar `security.yml`).

**Diferencia de capas (resumen)**: Hadolint = _cómo está escrito_ el Containerfile (calidad/best practice, pre-build, milisegundos). Trivy = _qué vulnerabilidades/secretos_ hay (SCA/secrets). Checkov/KICS = _si la infra cumple policy_ (IaC). Semgrep/CodeQL = _si el código tiene vulnerabilidades_ (SAST).

## 4. Implementación profesional (patrón recomendado)

Cuatro puntos, alineados con los patrones ya existentes en `ci.yml`/`scheduled-security.yml`:

### 4.1 Pre-commit local (advisory, nunca bloquea)

Tras el gate bloqueante de `.husky/pre-commit` (lint-staged + SAST + secrets), junto a los pasos advisory de lockfile/checkov:

```sh
echo "🐳 Containerfile lint (advisory)..."
(command -v hadolint >/dev/null 2>&1 && hadolint apps/server/Dockerfile) || echo "⚠️  hadolint no disponible o findings — advisory, no bloquea (política: .hadolint.yaml)"
```

Protegido con `||` (mismo patrón que checkov: tool ausente o findings no interrumpen). Alternativa: hook `pre-commit` framework vía `.pre-commit-hooks.yaml` oficial.

### 4.2 PR-time job en `ci.yml` (FASE 1 advisory)

Patrón calcado de `lockfile-audit`/`checkov-iac` (substage SECURITY):

```yaml
containerfile-lint:
  if: github.event_name == 'pull_request'
  name: 'Security: Containerfile Lint (advisory, FASE 1)'
  needs: repo-discovery
  runs-on: ubuntu-latest
  timeout-minutes: 5
  continue-on-error: true # FASE 1: advisory (actions/toolkit#581 → agregador ve success)
  steps:
    - uses: actions/checkout@v5
    - name: Run Hadolint (SARIF)
      id: hadolint
      uses: hadolint/hadolint-action@v3.1.0
      with:
        dockerfile: apps/server/Dockerfile
        config: .hadolint.yaml
        format: sarif
        output-file: hadolint.sarif
        failure-threshold: info
    - name: Upload Hadolint SARIF artifact (retention 14d)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: hadolint-report-pr
        path: hadolint.sarif
        retention-days: 14
        if-no-files-found: warn
    - name: Upload Hadolint SARIF to Security tab
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: hadolint.sarif
        category: hadolint # único — NO colisionar con category: trivy/codeql/semgrep/checkov-iac
```

- **Variantes equivalentes** (si se evita la action): `docker run --rm -i hadolint/hadolint < apps/server/Dockerfile` (stdin; para config montar `-v $PWD/.hadolint.yaml:/.hadolint.yaml`) o binario pinneado a `v2.15.1`.
- **Gate**: `actionlint` (`ci.yml` L661) valida el workflow → mantenerlo limpio.
- **Scope Dockerfile**: opcional filtro `git diff --name-only --diff-filter=ACMR base head` (patrón ya usado en `scancode-license-pr-diff`, `ci.yml` L869) para saltar el job si el diff no toca `Dockerfile`; con 1 Dockerfile y ~5s de ejecución, ejecución siempre es aceptablemente barata.

### 4.3 Job semanal (evidencia 90d)

En `scheduled-security.yml` (cron `0 3 * * 1` ya existente), patrón `checkov-iac-weekly`:

- `continue-on-error: true`, sin ruta blocking, sin agregador.
- Artifact `hadolint-report-weekly` con `retention-days: 90` + `if: always()` + `if-no-files-found: warn`.
- SARIF `category: hadolint-weekly` (no colisiona con `category: trivy` ni `checkov-iac`).

### 4.4 `.hadolint.yaml` en raíz (policy-as-code)

- Política versionada = auditable (mismo argumento que `.checkov.yml`/`license-policy.md`).
- Sugerencia inicial de ignoras **selectivas** (solo tras revisar el Dockerfile): `DL3003` (`cd` en `RUN`), `DL3006` si se decide otro mecanismo de pin de tag. **No ignorar en bloque**: `DL3018`/`DL3019` (apk), `DL3016` (npm), `DL3059` (capas), `DL3026`+`trustedRegistries`, `DL3025`, `DL3002`.
- `trustedRegistries: [docker.io, ghcr.io]` → activa `DL3026` (error) sobre `FROM`.

**Hallazgos esperados en `apps/server/Dockerfile`** (predicción de reglas, **no ejecutado**: daemon Docker local caído el 2026-09-27):

- `DL3018` (warning): `apk add --no-cache openssl` sin pin de versión.
- `DL3059` (info): 4 `RUN` consecutivos (`apk add`, `npm ci`, `npx prisma generate`, `npm prune`) → consolidar o justificar (capas de cache intencionales).
- `DL3016`/`DL3006`/`DL3007`: probablemente OK (`FROM node:20-alpine` tag explícito, `npm ci`).
- ⚠️ `failure-threshold` default = `info` → **DL3059 (info) haría fallar el job**; por eso FASE 1 advisory + subir umbral a `warning` en FASE 2 si se prefieren ignorar findings de capas.

### 4.5 Validación local antes de merge (comando canónico)

```bash
hadolint --version                                   # esperado v2.15.1
hadolint apps/server/Dockerfile                      # usa .hadolint.yaml del cwd
# salida SARIF para revisión:
hadolint --format sarif --output hadolint.sarif apps/server/Dockerfile
# alternativa sin instalar (imagen pinneada, como el job semanal):
docker pull hadolint/hadolint:v2.15.1
docker run --rm -i -v "$PWD":/io hadolint/hadolint:v2.15.1 \
  hadolint --config /io/.hadolint.yaml - < apps/server/Dockerfile
```

Comando canónico ejecutado en el job semanal (`scheduled-security.yml`,
`containerfile-lint-weekly`) con `--format sarif --output /io/hadolint-weekly.sarif`.
Misma figura "D6" que `sca-lockfile-compliance`/`iac-scanning`: hallazgos → corregir Dockerfile o registrar `# hadolint ignore=DLxxxx` con justificación inline (auditable en el diff).

Misma figura "D6" que `sca-lockfile-compliance`/`iac-scanning`: hallazgos → corregir Dockerfile o registrar `# hadolint ignore=DLxxxx` con justificación inline (auditable en el diff).

## 5. Decisiones propuestas (D1–D6)

Coherentes con `openspec/changes/archive/2026-09-27-sca-lockfile-compliance/design.md` (D1–D6) e `openspec/changes/iac-scanning/design.md` (D1–D7):

- **D1 — Alcance: docs + CI, nunca código de aplicación.** Containerfile lint solo toca `.hadolint.yaml`, `ci.yml`/`scheduled-security.yml`, `.husky/pre-commit` (advisory) y docs. No modifica `apps/server/Dockerfile` salvo remediación explícita de findings en FASE 2.
- **D2 — 3 capas: L1 local (pre-commit advisory), L2 PR (`containerfile-lint` advisory), L3 audit (semanal 90d).** Misma estructura que lockfile/IaC.
- **D3 — Taxonomía `advisory` → `blocking` y `quality-gates.md` como registro único.** FASE 1: `continue-on-error: true` a nivel job + artifact 14d (PR) / 90d (semanal) + `category: hadolint` único. FASE 2: quitar `continue-on-error`, subir `failure-threshold: warning` y añadir el job a `needs` de `prebuild-security-complete` (bloqueo gradual en el agregador existente) solo tras 2–4 semanas de runs limpios; actualizar fila en `quality-gates.md` §2/§4.4.
- **D4 — Complementariedad, cero duplicación.** Hadolint (calidad Containerfile) ≠ Trivy (`security.yml`, CVE/secretos, **sin tocar**, `category: trivy` intacto) ≠ Checkov (`checkov-iac`, misconfig IaC, **sin tocar**) ≠ SAST. **No** añadir `--scanners misconfig` a Trivy (duplicaría Checkov). **No** tocar `dependabot.yml`.
- **D5 — Policy-as-code en `.hadolint.yaml`, no flags en workflows.** Ignoras/overrides/trustedRegistries viven en el config versionado; workflows solo referencian (`config:`). Igual que `.checkov.yml`. Pre-commit advisory **siempre** fuera de la cadena `set -e` (nunca escala a blocking — regla "deuda histórica no bloquea commits").
- **D6 — Validación local obligatoria antes de merge.** `hadolint apps/server/Dockerfile` (o `docker run ... < Dockerfile`) como paso documentado pre-merge; hallazgos → corregir o `# hadolint ignore=` justificado.

## 6. Limitaciones y riesgos

1. **Solape parcial con `checkov-iac`**: ambos miran `Dockerfile` (CKV*DOCKER_2/4 ≈ DL3006/DL3057). Mitigación: Hadolint como capa de \_calidad* con reglas propias (ShellCheck, pin apk/npm, capas, `--trusted-registry`) y Checkov como capa de _policy de seguridad_; documentar la separación en `quality-gates.md` para no duplicar filas.
2. **Ruido inicial** (`DL3059`, `DL3018` predichos): subiría el PR a "failed" sin FASE 1 → por eso `continue-on-error: true` + revisión de ignoras antes de FASE 2.
3. **`--ignore` anula el config**: si algún job pasa `ignore:` inline, silencia la política del repo → preferir solo `.hadolint.yaml`.
4. **Licencia GPL-3.0 del binario**: uso en CI (ejecución, no distribución) es seguro; evitar incorporar código fuente al repo.
5. **Dockle requiere imagen construida** → añade minutos de build y no aplica pre-build; descartado en FASE 1 (documentado como alternativa).
6. **Action third-party**: pinneear `hadolint/hadolint-action@v3.1.0` (o SHA) — mismo criterio supply-chain que el resto del repo (Conventional Commits + firmado no aplican a actions, pero sí `actionlint` + pin de versión).
7. **Daemon Docker local no disponible** el 2026-09-27 → hallazgos del §4.4 son _predicción de reglas_, requieren `hadolint` ejecutado para confirmar.
8. **`git diff` no aplica** si el Dockerfile vive siempre en árbol: con 1 Dockerfile el costo de correr siempre es menor que el de la lógica de filtrado (decisión: correr siempre en PR; filtrado opcional).

## 7. Fuentes

- https://github.com/hadolint/hadolint (README + `--help` + esquema config + reglas) — 200 OK 2026-09-27
- https://hadolint.github.io/hadolint (linter online) — 200 OK 2026-09-27
- https://github.com/hadolint/hadolint/releases/tag/v2.15.1 (latest release)
- https://github.com/hadolint/hadolint-action (inputs oficiales, v3.1.0)
- https://github.com/goodwithtech/dockle (Dockle real; `coveyour/dockle` → 404)
- https://aquasecurity.github.io/trivy/latest/docs/scanner/misconfiguration/ (misconfig no default en fs/image/repo)
- https://github.com/aquasecurity/trivy-action (input `scanners`, default `vuln,secret`)
- Repo: `.github/workflows/{ci.yml,security.yml,scheduled-security.yml}`, `.husky/pre-commit`, `.checkov.yml`, `apps/server/Dockerfile`, `docs/learning/quality-gates.md`, `openspec/changes/iac-scanning/`, `openspec/changes/archive/2026-09-27-sca-lockfile-compliance/`

## 8. Estado

- **Investigación**: ✅ completa (2026-09-27). Referencias oficiales verificadas; 2 correcciones de premisa (org de Dockle; valor `--scanners misconfig`).
- **Implementación**: ✅ **completa (2026-09-28, change `containerfile-lint`)** — job `containerfile-lint` en `ci.yml` (FASE 1 advisory: `continue-on-error: true`, `hadolint-action@v3.1.0`, `config: .hadolint.yaml`, `format: sarif`, artifact `hadolint-report-pr` 14d, SARIF `category: hadolint`, fuera de `prebuild-security-complete.needs`) + job `containerfile-lint-weekly` en `scheduled-security.yml` (docker `hadolint/hadolint:v2.15.1`, SARIF `category: hadolint-weekly`, artifact 90d) + política `.hadolint.yaml` en raíz (`failure-threshold: info`, `trustedRegistries: [docker.io, ghcr.io]`, `ignored: []` con revisión documentada del Dockerfile) + paso advisory en `.husky/pre-commit` (tras checkov, fuera de la cadena `set -e`). Verificación: `actionlint` exit 0 en ambos workflows, YAML parseado (ci.yml = 47 jobs, scheduled = 6), greps de unicidad OK; `openspec validate containerfile-lint --strict` → válido.
- **Pendiente**: run real de hadolint (Docker daemon caído — validar en CI o al reactivar Docker; hallazgos previstos DL3018/DL3059×2 sin ignorar, deuda para FASE 2); FASE 2 (diferida): umbral `warning` + `prebuild-security-complete.needs` tras 2-4 semanas de runs limpios.
- **Nota de posición (change `ci-security-substage-alignment`, 2026-09-30):** los 3 jobs advisory `actionlint-advisory`,
  `zizmor-advisory` y `typosquat-guarddog` quedan definidos inmediatamente después de `containerfile-lint`, al cierre del
  bloque security 2C de `ci.yml` (orden del diagrama `ci-cd-pipeline-empresarial.md` §23.3; reubicación física pura, sin
  cambios de semántica).
- **Intacto**: `security.yml` (`category: trivy`), `dependabot.yml`, `.checkov.yml`, `checkov-iac`; no se creó `scan-list.txt`.
