# Design

## Context

Ver `proposal.md` — Why. Estado verificado 2026-09-27 (fuente: `docs/learning/containerfile-lint.md`):

- `ci.yml`: `repo-discovery` L20, `dependency-review` L765, `scancode-license-pr-diff` L855, `lockfile-audit` L956, `checkov-iac` L1007, `prebuild-security-complete` L1465 (`needs: [dependency-review, secrets, scancode-license-pr-diff]`). `grep -rni hadolint .github/workflows/` → **0 matches**.
- `security.yml`: `dependency-scan` Trivy `scan-type: fs` sin input `scanners` → default `vuln,secret` (**no** `misconfig`) + `sast` (CodeQL, `category: codeql`) + `semgrep-full-scan` (`category: semgrep`); agregador `needs: [dependency-scan, sast, semgrep-full-scan]`. **Intocado por este change.**
- `scheduled-security.yml`: cron `0 3 * * 1`, `permissions.security-events: write` ya declarado, jobs `gitleaks-full-scan` (30d), `scancode-license-audit` (90d), `lockfile-audit-weekly` (90d), `checkov-iac-weekly` (90d, SARIF `category: checkov-iac`), `notify-failure`.
- 1 Dockerfile: `apps/server/Dockerfile` (build context = raíz del monorepo; usado en `deploy.yml` L85/L194 y `preview.yml` L82).
- `.checkov.yml` ya existe y ya cubre `framework: dockerfile` (hallazgo de la investigación: la capa IaC toca Dockerfile → **separación de capas**, ver D4).
- Hadolint **no está en PATH** localmente; docker CLI presente (daemon caído el 2026-09-27 → hallazgos del doc son _predicción de reglas_).
- `scan-list.txt` **no existe** en el repo (y no se creará).

## Goals / Non-Goals

**Goals:**

- Cero gap de **calidad** de Containerfile: lint de `apps/server/Dockerfile` en pre-build, con evidencia SARIF auditable (14d PR / 90d semanal).
- Shift-left en 3 niveles: pre-commit advisory → PR advisory → semanal auditoría 90d.
- Política como código versionada (`.hadolint.yaml`); evolución `advisory` → `blocking` sin rework.
- Coste marginal ~0: ~5s de job, sin runner dedicado, sin dependencia de `build`, SARIF nativo sin transformadores propios.
- Separación de capas explícita y documentada frente a Trivy, Checkov y SAST (cero duplicación).

**Non-Goals:**

- Bloquear PRs en FASE 1 (taxonomía `quality-gates.md`: blocking solo tras 2-4 semanas sin FP).
- Reemplazar o modificar `security.yml` (Trivy), `checkov-iac`, `.checkov.yml`, `dependency-review`, `lockfile-audit`, `scancode-license-pr-diff` ni `security-digest.yml`.
- Añadir `--scanners misconfig` a Trivy (duplicaría a Checkov) o `framework: dockerfile` a Checkov (ya está).
- Añadir Dockle (requiere imagen construida → coste de build, descartado FASE 1) o KICS.
- Modificar `apps/server/Dockerfile` (salvo remediación explícita de findings en FASE 2) ni listas `deny-licenses`/`allow-licenses`.
- Crear `scan-list.txt` ni tocar `dependabot.yml`.

## Decisions

### Diagrama — integración en `ci.yml` (paralelo a dependency-review y lockfile-audit)

```
ci.yml (pull_request)                             scheduled-security.yml (cron 0 3 * * 1)
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ repo-discovery (L20)                         │  │ gitleaks-full-scan      (30d, advisory) │
│      │                                       │  │ scancode-license-audit  (90d, advisory) │
│      ├─► sast / Semgrep diff (L408)          │  │ lockfile-audit-weekly   (90d, advisory) │
│      ├─► dependency-review (L765)            │  │ checkov-iac-weekly      (90d, advisory) │
│      ├─► secrets (L808)                      │  │ containerfile-lint-weekly (NUEVO, 90d)   │
│      ├─► scancode-license-pr-diff (L855)     │  │   continue-on-error: true, SARIF        │
│      ├─► lockfile-audit   (L956)             │  │   category: hadolint-weekly             │
│      ├─► checkov-iac      (L1007)            │  │ notify-failure                         │
│      └─► containerfile-lint (NUEVO) ◄─PARAL. │  └──────────────────────────────────────────┘
│            continue-on-error: true (FASE 1), │
│            hadolint-action@v3.1.0,           │
│            config: .hadolint.yaml, sarif,    │
│            category: hadolint,               │
│            artifact 14d, timeout 5m          │
│            (sin dependencia de build)        │
│      ▼                                       │
│ prebuild-security-complete (L1465)           │
│   needs: [dependency-review, secrets,        │
│           scancode-license-pr-diff]          │
│   FASE 2: + containerfile-lint (+ lockfile-  │
│   audit/checkov-iac si esos changes así lo   │
│   deciden en su dueñía)                      │
└──────────────────────────────────────────────┘
```

Alineado con `docs/ci-cd-pipeline-empresarial.md` **§23.3** (Stage 2 Security en paralelo, pre-build: SAST + SCA + IaC + calidad de artefactos de build) y §29 (Containerización). `containerfile-lint` compite en la misma banda paralela que `dependency-review` y `lockfile-audit`, sin tocar ninguna dependencia existente.

### D1 — Alcance: docs + CI, nunca código de aplicación

Capa de Containerfile lint toca solo `.hadolint.yaml`, `ci.yml`/`scheduled-security.yml`, `.husky/pre-commit` (advisory) y docs. **No** modifica `apps/server/Dockerfile` salvo remediación explícita de findings en FASE 2. _Alternativas_: (a) meter Hadolint en `security.yml` → rechazada: corre en `push`/`schedule`, no PR-time, y mezclaría `category` con `category: trivy`; (b) usar `trivy fs --scanners misconfig` → rechazada: duplicaría `checkov-iac` (que ya escanea Dockerfile); (c) Dockle post-build → rechazada FASE 1: exige `docker build` (minutos de CI) y no aplica pre-build.

### D2 — 3 capas: L1 local (pre-commit advisory), L2 PR (`containerfile-lint` advisory), L3 audit (semanal 90d)

Misma estructura que `sca-lockfile-compliance` (lockfile) e `iac-scanning` (Checkov): el hallazgo llega al dev en el commit, en el PR y como evidencia semanal. El PR job corre **siempre** (1 Dockerfile, ~5s): el filtro `git diff --name-only --diff-filter=ACMR <base> <head>` (patrón de `scancode-license-pr-diff`, `ci.yml` L869) queda como **opción** — con `scan-list.txt` inexistente nunca se referencia un listado de archivos.

### D3 — Taxonomía `advisory` → `blocking` y `quality-gates.md` como registro único

**FASE 1**: `continue-on-error: true` a nivel job + artifact 14d (PR) / 90d (semanal) + `category: hadolint` única + **fuera** de `prebuild-security-complete.needs`. **FASE 2** (tras 2-4 semanas de runs limpios): quitar `continue-on-error`, fijar `failure-threshold: warning` (`.hadolint.yaml`), añadir `containerfile-lint` al `needs` de `prebuild-security-complete` (L1465, anclado **por nombre de job**; el agregador ya interpreta `needs.*.result` con `always()`, sin rediseño) y actualizar la fila en `quality-gates.md` §2/§4.4. **Retroceso**: un solo revert (re-añadir el flag y quitar la línea del `needs`). _Umbral_: el default `info` haría fallar `DL3059` (info, capas) → por eso FASE 1 advisory y `warning` como umbral de blocking.

### D4 — Complementariedad, cero duplicación (separación de capas)

- **Hadolint** = _cómo está escrito_ el Containerfile (calidad: ShellCheck sobre `RUN`, pin apk/npm, capas, WORKDIR, `--trusted-registry`) → este change.
- **Trivy** (`security.yml`, `category: trivy`) = CVE + secretos → **intocado**; NO se añade `--scanners misconfig` (el valor `config` del brief no existe; `config` es subcommand, scanner = `misconfig`).
- **Checkov** (`checkov-iac`, `framework: dockerfile`, `.checkov.yml`) = IaC policy (CKV*DOCKER*\*) → **intocado**: ya cubre Dockerfile como infra; este change NO repite esa fila en `quality-gates.md`.
- **Semgrep/CodeQL** (`category: semgrep`/`codeql`) = SAST → no toca Dockerfile.

Solape documentado (CKV_DOCKER_2/4 ≈ DL3006/DL3057): aceptado y anotado en `quality-gates.md` para no duplicar filas. Sin cambios en `deny-licenses` (Hadolint no es gate de licencias; GPL-3.0 del binario = uso en CI, no distribución de código fuente).

### D5 — Policy-as-code en `.hadolint.yaml`, no flags en workflows

Ignoras/overrides/`trustedRegistries`/umbral viven en el config versionado en raíz; workflows solo lo referencian (`config:`) y pre-commit/validación local lo auto-leen del cwd. Igual que `.checkov.yml`. **`--ignore` de CLI anula la lista del config** (oficial) → prohibido en jobs. Pre-commit advisory **siempre** fuera de la cadena `set -e` (nunca escala a blocking — regla "deuda histórica no bloquea commits", misma figura que `checkov`/`lockfile` en `.husky/pre-commit` L37-41).

### D6 — Validación local obligatoria antes de merge

`hadolint apps/server/Dockerfile` (o `docker run ... < Dockerfile`) como paso documentado pre-merge: hallazgos → corregir el Dockerfile o registrar `# hadolint ignore=DLxxxx` con justificación inline (auditable en el diff). Misma figura D6 que `sca-lockfile-compliance`/`iac-scanning`. Con Hadolint fuera de PATH el paso canónico es `docker pull hadolint/hadolint:v2.15.1` + montaje de `.hadolint.yaml`.

## Risks / Trade-offs

- **Hadolint no está en PATH** (verificado 2026-09-27) → mitigación: `docker pull hadolint/hadolint:v2.15.1` + `docker run --rm -i -v "$PWD/.hadolint.yaml:/.hadolint.yaml" hadolint/hadolint:v2.15.1 < apps/server/Dockerfile`, o binario local pinneado a `v2.15.1`; en CI la action `hadolint/hadolint-action@v3.1.0` lo instala (no depende del PATH del runner).
- **`scan-list.txt` inexistente** (y no se creará) → el job NUNCA lee listados; selección opcional solo con `git diff --name-only --diff-filter=ACMR` (patrón `scancode-license-pr-diff` L869) o, en FASE 1, corre siempre (1 Dockerfile, ~5s).
- **Hadolint SARIF nativo** (`--format sarif` / input `format: sarif`) → sin transformación JSON→SARIF propia; si la action no escribiera el archivo, alternativa `docker run ... hadolint --format sarif` (el `if-no-files-found: warn` evita romper el job).
- **Ruido inicial predicho** (`DL3018` apk sin pin, `DL3059` 4 RUN consecutivos): default `failure-threshold: info` haría fallar el job → FASE 1 `continue-on-error: true` + revisión de `ignored:` antes de FASE 2 (umbral `warning`).
- **Solape parcial con `checkov-iac`** (ambos miran Dockerfile) → mitigación D4: Hadolint = calidad, Checkov = policy; documentar en `quality-gates.md` sin duplicar filas; no tocar `.checkov.yml`.
- **Action third-party** → pin `hadolint/hadolint-action@v3.1.0` (o SHA), mismo criterio supply-chain que el resto; `actionlint` (`ci.yml` L661) valida el workflow → mantenerlo limpio.
- **`upload-sarif` exige `security-events: write`** → declararlo a nivel job en `ci.yml` (patrón `dependency-review` L770-773); en `scheduled-security.yml` ya está a nivel workflow.
- **Categorías SARIF duplicadas** → `category: hadolint` (PR) y `category: hadolint-weekly` (semanal), únicas frente a `trivy`/`codeql`/`semgrep`/`checkov-iac`; grep de unicidad tras implementar.
- **Licencia GPL-3.0 del binario** → ejecución en CI (no distribución de fuente) es segura; no incorporar código fuente al repo.
- **Daemon Docker local caído** (2026-09-27) → validación local bloqueada hasta restaurarlo; alternativa CI o binario. No bloquea la creación de artifacts de este change.
- **Doble definición de job con otros changes** → dueño único (este change) + `grep -c "containerfile-lint:" ci.yml == 1`.

## Migration Plan

1. **`.hadolint.yaml` en raíz** (policy-as-code): `format: sarif`, `failure-threshold: info` (FASE 1) / `warning` (FASE 2), `trustedRegistries: [docker.io, ghcr.io]`, `ignored:` selectivos solo tras revisar el Dockerfile.
2. **Job `containerfile-lint` en `ci.yml`** (advisory FASE 1): tras `checkov-iac` (L1007), `needs: repo-discovery`, `timeout-minutes: 5`, `continue-on-error: true`, action + artifact 14d + SARIF `category: hadolint` + `permissions: security-events: write`.
3. **Job `containerfile-lint-weekly` en `scheduled-security.yml`**: patrón `checkov-iac-weekly` (artifact 90d, `category: hadolint-weekly`, `continue-on-error: true`, sin agregador).
4. **Pre-commit advisory** en `.husky/pre-commit` (bloque advisory, tras `checkov`): `hadolint -c .hadolint.yaml --failure-threshold warning apps/server/Dockerfile` protegido con `||`.
5. **Validación local** con `docker pull hadolint/hadolint:v2.15.1` (binario fuera de PATH) + `actionlint`/`openspec validate containerfile-lint --strict`.
6. **Docs**: filas `containerfile-lint` y `containerfile-lint-weekly` en `quality-gates.md` §2 + §4.4; capa en `license-policy.md` §6; estado en `containerfile-lint.md` §8 y nota de separación de capas en `iac-scanning.md`.
7. **FASE 2 (diferida)**: 2-4 semanas limpias → `failure-threshold: warning`, quitar `continue-on-error`, añadir a `prebuild-security-complete.needs` (L1465), opcional baseline `fail-on-new`.
8. **Rollback**: revert del commit que añade el job (FASE 1) o re-añadir `continue-on-error` + quitar la línea del `needs` (FASE 2); ningún estado intermedio rompe el agregador.
