# Tasks

> **Implementación (2026-09-28):** tasks 1-3, 4.1, 5.1, 5.3-5.4 y 6.1-6.4 ejecutadas y verificadas
> (evidencia por task). Referencias verificadas hoy vía README oficial: inputs de
> `hadolint/hadolint-action@v3.1.0` (`dockerfile`, `config`, `format`, `output-file`,
> `failure-threshold`) y esquema `.hadolint.yaml` (`format`/`no-color`/`failure-threshold`/
> `trustedRegistries` válidos como claves de config; gotcha issue #775 confirmado como resuelto
> en schema actual). Pendiente real: 4.2 (commit de prueba — sesión sin commits, pendiente de
> firma SSH) y 5.2 (run real — Docker daemon caído; alternativa: dispatch del weekly en CI).

## 1. Job `containerfile-lint` en `ci.yml` (FASE 1 advisory)

- [x] 1.1 Añadir el job `containerfile-lint` en `.github/workflows/ci.yml` tras `checkov-iac`: `if: github.event_name == 'pull_request'`, `name: "Security: Containerfile Lint (advisory, FASE 1)"`, `needs: repo-discovery`, `runs-on: ubuntu-latest`, `timeout-minutes: 5`, `continue-on-error: true` — ✅ `actionlint` exit 0 en `ci.yml` (validado localmente, no solo en el gate CI)
- [x] 1.2 Paso de lint con `hadolint/hadolint-action@v3.1.0` (`dockerfile: apps/server/Dockerfile`, `config: .hadolint.yaml`, `format: sarif`, `output-file: hadolint.sarif`, `failure-threshold: info`) — ✅ inputs exactos verificados contra README oficial v3.1.0; `grep "ignore:" workflows/` → 0 matches
- [x] 1.3 `permissions` de job con `contents: read` + `security-events: write` (patrón `dependency-review`) y `github/codeql-action/upload-sarif@v4` con `category: hadolint` bajo `if: always() && hashFiles('hadolint.sarif') != ''` — ✅ `grep -c "category: hadolint$" ci.yml` = 1; sin colisión con `trivy`/`codeql`/`semgrep`/`checkov-iac`/`gitleaks`/`hadolint-weekly`
- [x] 1.4 Artifact `hadolint-report-pr` con `actions/upload-artifact@v7`, `path: hadolint.sarif`, `retention-days: 14`, `if-no-files-found: warn`, `if: always()` — ✅ bloque presente
- [x] 1.5 `containerfile-lint` NO está en el `needs` de `prebuild-security-complete` (verificado por parse YAML: needs = `[dependency-review, secrets, scancode-license-pr-diff]`) y `grep -c "^  containerfile-lint:" ci.yml` = 1 (job único)

## 2. Extensión de `scheduled-security.yml` — job `containerfile-lint-weekly` (90d)

- [x] 2.1 Job `containerfile-lint-weekly` añadido tras `checkov-iac-weekly`: `runs-on: ubuntu-latest`, `timeout-minutes: 5`, `continue-on-error: true`, sin dependencia de agregadores — ✅ `actionlint` exit 0; YAML parseado (6 jobs)
- [x] 2.2 Paso de lint con Docker `hadolint/hadolint:v2.15.1` (repo montado en `/io`, config `/io/.hadolint.yaml`, Dockerfile por stdin, SARIF a `/io/hadolint-weekly.sarif`) + upload SARIF `category: hadolint-weekly` con `if: always() && hashFiles(...)` — ✅ `security-events: write` a nivel workflow (L11-12); categorías repo-wide todas únicas (hadolint, hadolint-weekly, checkov-iac, trivy, codeql, semgrep, gitleaks)
- [x] 2.3 Artifact `hadolint-report-weekly` con `retention-days: 90`, `if: always()`, `if-no-files-found: warn` — ✅; jobs `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly`, `notify-failure` intactos (parse YAML + grep)

## 3. `.hadolint.yaml` — policy-as-code

- [x] 3.1 `.hadolint.yaml` creado en la raíz con `format: sarif`, `failure-threshold: info` (FASE 1), `no-color: true`, `trustedRegistries: [docker.io, ghcr.io]` (activa `DL3026`), `ignored: []` — ✅ YAML válido (parse node/yaml); versionado en git
- [x] 3.2 `apps/server/Dockerfile` revisado: `DL3003`/`DL3006` NO aplican (sin `cd` en RUN; `node:20-alpine` taggeado) → sin ignora; hallazgos previstos `DL3018` (warning, apk sin pin) y `DL3059`×2 (info, RUN consecutivos) **no ignorados** (deuda FASE 2, documentado en comentarios del config) — ✅ cero `--ignore`/`ignore:` inline en workflows
- [x] 3.3 Consumo conjunto verificado: job PR vía input `config`, weekly vía montaje `/io`, pre-commit y validación local auto-leen del cwd (`$PWD/.hadolint.yaml` es la 1ª ubicación de búsqueda oficial)

## 4. Pre-commit advisory (fuera de la cadena `set -e`)

- [x] 4.1 Paso añadido en `.husky/pre-commit` tras checkov: `(command -v hadolint >/dev/null 2>&1 && hadolint -c .hadolint.yaml --failure-threshold warning apps/server/Dockerfile) || echo "⚠️ hadolint no disponible o findings — advisory, no bloquea (política: .hadolint.yaml)"` — ✅ grep confirma el `||`; sin `exit 1` nuevo; resumen final actualizado a "lockfile + IaC + Containerfile"
- [ ] 4.2 Commit de prueba — línea replicada interactivamente (tool ausente → exit 0, solo warning, commit no afectado); la ejecución dentro de un `git commit` real queda pendiente de la sesión de commits con firma SSH (nunca bloquea: capa advisory)

## 5. Validación local (Hadolint v2.15.1)

- [x] 5.1 Disponibilidad comprobada: `hadolint` NO está en PATH (estado esperado) y `docker pull hadolint/hadolint:v2.15.1` bloqueado por daemon Docker caído — ✅ bloqueo registrado (mitigación: validar en CI o binario local pinneado)
- [ ] 5.2 Run real del lint (SARIF + hallazgos reales) — pendiente de Docker daemon o del primer run del job en CI; predicción a validar/refutar: `DL3018`, `DL3059`×2
- [x] 5.3 `openspec validate containerfile-lint --strict` → válido; `actionlint` sobre ambos workflows → exit 0; `grep -rn "category: " .github/workflows/` confirma categorías únicas (7 categorías, sin colisiones)
- [x] 5.4 Comando canónico documentado en `docs/learning/containerfile-lint.md` §4.5 (con imagen pinneada `v2.15.1`, igual que el weekly); paths protegidos intactos por este change (`security.yml`/`dependabot.yml` solo tienen el diff preexistente de `sca-lockfile-compliance`; `.checkov.yml` sin tocar; sin `scan-list.txt`)

## 6. Documentación — `quality-gates.md`, `license-policy.md` y estados

- [x] 6.1 Fila `containerfile-lint` añadida en `quality-gates.md` §2 tras `checkov-iac` (taxonomía `advisory (PR, fase 1)` → `blocking (PR)` en FASE 2; evidencia: artifact 14d, `category: hadolint`, `continue-on-error: true`, fuera del agregador) — ✅ sin duplicar filas existentes
- [x] 6.2 Filas `containerfile-lint` y `containerfile-lint-weekly` añadidas en §4.4 — ✅ filas `lockfile-audit`/`checkov-iac[-weekly]` intactas
- [x] 6.3 Capa "(calidad Containerfile)" añadida en `license-policy.md` §6 (Hadolint no es gate de licencias; `deny-licenses` intacto) — ✅ §1-§5 sin cambios
- [x] 6.4 `containerfile-lint.md` §8 actualizado (implementación ✅ + pendientes) y nota de separación de capas añadida en `iac-scanning.md` §2 (Checkov = IaC policy vs Hadolint = calidad Dockerfile; celda IaC de la tabla corregida: ya NO "❌ NO implementado") — ✅ `npm run docs:lint`: 0 violaciones nuevas en las líneas tocadas (baseline legacy intacto); prettier aplicado
