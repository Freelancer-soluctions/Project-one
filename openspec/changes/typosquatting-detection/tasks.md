# Tasks

> **IMPLEMENTACIÓN (2026-09-28): grupos 0-3 + docs completados y verificados** (evidencia por
> task). Extras: verificación PyPI de `nono-py 0.16.0` (20 wheels manylinux cp310-cp314, **0
> wheels Windows** → instala sin compilar en ubuntu-latest; Windows exige Docker — confirma la
> degradación advisory del L1); run real del wrapper en Windows = **fallo rápido y seguro** (exit
> 1, error claro de version check, SARIF vacío, sin colgar); 12 categorías SARIF únicas; 50 jobs
> en ci.yml / 8 en scheduled-security.yml; acciónlint 9/9 workflows exit 0. Pendiente: commit de
> prueba real (sesión sin commits) y FASE 2 (diferida).

> **Base:** `docs/learning/typosquatting-detection.md` (referencias verificadas 2026-09-28:
> GuardDog v3.2.0 SARIF solo en `verify`; sin `DataDog/guarddog-action`; Socket requiere
> cuenta/API key y no emite SARIF nativo en CLI). Patrones replicados de
> `pipeline-config-scan` / `iac-scanning` / `sca-lockfile-compliance` / `containerfile-lint`.
>
> **Correcciones de la auditoría (2026-09-28) integradas en las tasks:** (1) GuardDog **no soporta
> config file** → la política como código es el wrapper versionado `scripts/guarddog-verify.sh`
> (grupo 0, antes ausente); (2) la regla `new_install_script` NO existe en v3.2.0 (la de scripts
> npm es `threat-npm-preinstall-script`); (3) `setup-uv@v7` es un tag móvil → SHA-pinned
> `b75a909f75acd358c2196fb9a5f1299a9a8868a4` (v6.7.0, mismo pin que los jobs zizmor, regla A4);
> (4) guards SARIF (`|| true` + `test -s` + `jq -e .` + guard `hashFiles`) en ambos jobs;
> (5) Windows: GuardDog v3.2.0 solo soporta Windows vía Docker → L1 degrada a advisory silencioso
> ahí; (6) rationale semanal = re-evaluación con datos frescos (runners efímeros, sin cache
> persistente); (7) L-refs eliminadas (anclas por nombre de job); (8) el bloque advisory del
> pre-commit ya incluye `actionlint` y `zizmor` → el paso nuevo va tras ellos.

## 0. Política como código — wrapper `scripts/guarddog-verify.sh` (D5)

- [x] 0.1 Crear `scripts/guarddog-verify.sh` versionado y ejecutable: `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` (devDeps excluidas — política explícita), invocación `uvx guarddog==3.2.0 npm verify package.json --output-format sarif` (nunca `latest`, nunca `--no-sandbox`), y sección de `--exclude-rules` selectivas **comentadas por regla** (qué, por qué, hasta cuándo) — FASE 1: ninguna excluida. — ✅ creado (chmod +x, `bash -n` OK) con verificación de versión ANTES del scan (`uvx guarddog==3.2.0 --version` contiene `3.2.0`, si no → exit 1 con error claro) y `exec` al final; reglas npm reales de v3.2.0 documentadas en comentarios (`threat-npm-preinstall-script`, no `new_install_script`)
- [x] 0.2 Verificar que GuardDog no soporta fichero de configuración (README v3.2.0: "Configuration via Environment Variables") → el wrapper es el único punto de política; CODEOWNERS sobre el script. — ✅ verificado en README@v3.2.0; `scripts/` cae bajo la regla `*` de `.github/CODEOWNERS` (core-team)
- [x] 0.3 Los 3 consumidores (jobs CI, pre-commit, validación local) invocan el wrapper — cero flags de política en workflows. — ✅ verificado por parse YAML + grep del hook + doc D6

## 1. Pre-commit advisory (capa L1, `typosquat-guarddog`)

- [x] 1.1 Paso advisory añadido en `.husky/pre-commit` dentro del bloque advisory (**tras `zizmor`**), **fuera** de la cadena `set -e` y protegido con `||`: `(bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif 2>/dev/null) || echo "⚠️ ..."` — sin `exit 1` nuevo; comentario inline documentando la degradación en Windows (GuardDog solo soporta Windows vía Docker). — ✅ L54-60
- [x] 1.2 Reporte local a `.tmp/guarddog.sarif` (`.tmp/` ya gitignored y usado por `npm audit`); resumen final advisory del hook actualizado ("lockfile + IaC + Containerfile + pipeline config + typosquat"). — ✅
- [x] 1.3 Verificación: grep del `||` en la línea, sin `set -e` que la cubra, y simulación con `uvx` ausente → exit 0, solo warning (el `git commit` real queda para la sesión de commits firmados). — ✅ simulación `PATH=/usr/bin:/bin` → GUARDDOG-WARN-PATH-OK, exit 0

## 2. Job PR `typosquat-guarddog` en `ci.yml` (capa L2, FASE 1 advisory)

- [x] 2.1 Job `typosquat-guarddog` añadido en `.github/workflows/ci.yml` en la banda pre-build SECURITY (tras `zizmor-advisory`): `if: github.event_name == 'pull_request'`, `name: "Security: Typosquat GuardDog (advisory, FASE 1)"`, `needs: repo-discovery`, `runs-on: ubuntu-latest`, `timeout-minutes: 10`, `continue-on-error: true` (nivel job). — ✅ parse YAML: ci.yml = 50 jobs, job con job-COE + permisos + timeout 10
- [x] 2.2 Pasos: `actions/checkout@v5` → `astral-sh/setup-uv@b75a909f75acd358c2196fb9a5f1299a9a8868a4` (SHA v6.7.0, nunca `@v*`) → wrapper (verificación de versión dentro) → `bash scripts/guarddog-verify.sh > guarddog.sarif || true` → `test -s` + `jq -e .` (SARIF no vacío y parseable antes de subirlo). — ✅ verificado por parse YAML; **justificación de viabilidad verificada en PyPI**: `nono-py 0.16.0` (dep del sandbox) publica 20 wheels manylinux cp310-cp314 → instalación sin compilar en ubuntu-latest
- [x] 2.3 `permissions` de job con `contents: read` + `security-events: write` y `github/codeql-action/upload-sarif@v4` con `category: guarddog` bajo `if: always() && hashFiles('guarddog.sarif') != ''` (única frente a las 10 categorías existentes). — ✅ 12 categorías repo-wide, todas únicas
- [x] 2.4 Artifact `guarddog-report-pr` con `actions/upload-artifact`, `path: guarddog.sarif`, `retention-days: 14`, `if-no-files-found: warn`, `if: always()`. — ✅
- [x] 2.5 `typosquat-guarddog` NO añadido al `needs` de `prebuild-security-complete` (parse YAML: sigue `[dependency-review, secrets, scancode-license-pr-diff]`); `actionlint` 9/9 workflows exit 0 (per-file — quirk Windows con dir-args); `grep -c "^  typosquat-guarddog:" ci.yml` = 1. — ✅

### Nota de auditoría (2026-09-29 — falsos positivos del job en PR #133)

El run de CI del PR #133 reportó `ERROR: Package/Version X not on NPM` para 5 entradas
(`client-react`, `e2e`, `string-width-cjs`, `strip-ansi-cjs`, `wrap-ansi-cjs`). Causa raíz
**no está en esta change** sino en el manifest raíz de `main`, aplanado con ~700 entradas
en `dependencies` que incluían (a) los nombres internos de los workspaces
(`client-react`, `e2e`, `server-express` — paquetes `private` inexistentes en el registro,
con agravante de colisión: `e2e`/`server-express` SÍ existen en NPM de terceros) y (b) los
aliases internos de `@isaacs/cliui` (`string-width-cjs` etc., real `npm:string-width@4.2.3`
según lockfile) promovidos indebidamente a la raíz. El aplanado rompió también el
`--output-format sarif` documentado en esta spec (el wrapper nunca lo tuvo: 1 commit).
Corrección aplicada en el PR #133: se eliminaron las 6 entradas espurias de
`dependencies` (los workspaces siguen linkeados vía `workspaces`/lockfile y cliui sigue
recibiendo sus `-cjs`) y el wrapper recupera `--output-format sarif` (alineado con la spec
L1/L2/L3 de esta change). Adicionalmente verificado: GuardDog v3.0.x resolvía aliases
`npm:` (`NPM_ALIAS_PATTERN`), v3.1.0/v3.2.0 perdieron esa capacidad (regresión upstream
sin release con fix a la fecha) — dejar de pixear aliases en manifests y limpiar el
aplanado evita depender de ese comportamiento.

## 3. Job semanal `guarddog-weekly` en `scheduled-security.yml` (capa L3)

- [x] 3.1 Job `guarddog-weekly` añadido tras `zizmor-weekly`: trigger del workflow (schedule + workflow_dispatch ya existentes), `continue-on-error: true`, sin dependencia de agregadores, `timeout-minutes: 10`. — ✅ parse YAML: scheduled = 8 jobs
- [x] 3.2 Pasos checkout + mismo setup-uv SHA-pinned + wrapper (verificación de versión dentro) + `test -s` + `jq -e .` (re-evaluación semanal con datos frescos de top-packages; runners efímeros, sin cache persistente). — ✅
- [x] 3.3 Upload SARIF `category: guarddog-weekly` con `if: always() && hashFiles(...)` + artifact `guarddog-weekly` 90d; jobs vecinos (`gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly`, `containerfile-lint-weekly`, `zizmor-weekly`, `notify-failure`) intactos (solo inserción). — ✅
