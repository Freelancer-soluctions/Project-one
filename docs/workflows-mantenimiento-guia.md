# Guía de Mantenimiento de Workflows

> Documento exhaustivo de mantenimiento para los workflows de GitHub Actions del monorepo **Project One**.
> Última revisión: agosto 2026.
> Audiencia: maintainers del repositorio (ingenieros que revisan, actualizan y depuran CI/CD).

---

## Tabla de contenidos

1. [Filosofía de mantenimiento](#1-filosofía-de-mantenimiento)
2. [Mapa de fuentes de mantenimiento](#2-mapa-de-fuentes-de-mantenimiento)
3. [Casos de ajuste ya resueltos (playbook)](#3-casos-de-ajuste-ya-resueltos-playbook)
4. [Inventario de workflows y composite actions](#4-inventario-de-workflows-y-composite-actions)
5. [Mantenimiento de versiones Node](#5-mantenimiento-de-versiones-node)
6. [Mantenimiento de actions/checkout y fetch-depth](#6-mantenimiento-de-actionscheckout-y-fetch-depth)
7. [Mantenimiento de third-party actions](#7-mantenimiento-de-third-party-actions)
8. [Mantenimiento de pre-commit hooks locales](#8-mantenimiento-de-pre-commit-hooks-locales)
9. [Mantenimiento de Dependabot](#9-mantenimiento-de-dependabot)
10. [Mantenimiento de services containers](#10-mantenimiento-de-services-containers)
11. [Mantenimiento de la composite action setup-monorepo](#11-mantenimiento-de-la-composite-action-setup-monorepo)
12. [Mantenimiento de caching](#12-mantenimiento-de-caching)
13. [Mantenimiento de security workflows](#13-mantenimiento-de-security-workflows)
14. [Mantenimiento de CD/Deploy workflows](#14-mantenimiento-de-cddeploy-workflows)
15. [Mantenimiento de concurrency groups](#15-mantenimiento-de-concurrency-groups)
16. [Mantenimiento de permissions](#16-mantenimiento-de-permissions)
17. [Checklist de mantenimiento trimestral](#17-checklist-de-mantenimiento-trimestral)
18. [Lecciones aprendidas y anti-patrones](#18-lecciones-aprendidas-y-anti-patrones)
19. [Apéndice A — Comandos útiles de mantenimiento](#19-apéndice-a--comandos-útiles-de-mantenimiento)
20. [Referencias](#20-referencias)

---

## 1. Filosofía de mantenimiento

Los workflows de GitHub Actions **son código** y, como todo código, **se pudren** (_rot_) si no se mantienen activamente. Las dependencias de terceros (`uses: action@version`) publican versiones nuevas con correcciones de seguridad; GitHub actualiza los runners y depreciona APIs; las versiones de Node.js entran y salen de LTS; los advisories de seguridad (CVEs) afectan acciones que llevan meses sin actualizarse. El mantenimiento **no es opcional**: es la diferencia entre una CI que "simplemente funciona" y una que falla misteriosamente cada dos semanas obligando al equipo a apagar incendios en lugar de entregar valor. Esta guía documenta **qué** vigilar, **cuándo** hacerlo y **cómo** arreglarlo, basándose en incidentes reales ya sufridos en este repositorio.

---

## 2. Mapa de fuentes de mantenimiento

| Componente              | Archivo(s)                                                  | Tipo de mantenimiento                                                                                   | Frecuencia                                        |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Node version pin**    | `.nvmrc`                                                    | Bump de versión cuando una dependencia sube su floor `engines.node` o sale release de seguridad de Node | Mensual (coincidir con security releases de Node) |
| **Engines floors**      | `package.json` (raíz, `apps/client`, `apps/server`, `e2e`)  | Revisar que `>=20.0.0` siga siendo correcto al cambiar LTS                                              | Cuando cambia Node LTS (abril/octubre)            |
| **Composite action**    | `.github/actions/setup-monorepo/action.yml`                 | Añadir/quitar pasos de setup compartidos por todos los jobs                                             | Trimestral o al añadir herramienta global         |
| **Workflows (12)**      | `.github/workflows/*.yml`                                   | Cambios por-workflow: triggers, jobs, steps, secrets, permissions                                       | Según necesidad (PR-driven)                       |
| **Pre-commit hooks**    | `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push` | Actualizar cuando se añade/quita linter, scanner, test runner                                           | Al cambiar toolchain local                        |
| **Third-party actions** | Todos los `uses:` en workflows y composite action           | Revisar versiones, CVEs, breaking changes                                                               | **Mensual** (auditoría de seguridad)              |
| **Pre-commit timeouts** | `.husky/pre-commit` (bash default 120s)                     | Aumentar timeout si lint-staged + semgrep + gitleaks superan 120s                                       | Cuando se observe timeout falso positivo          |

---

## 3. Casos de ajuste ya resueltos (playbook)

### Caso 1 — EBADENGINE por requisito de `omniroute@3.8.49`

**Síntoma (verbatim CI error):**

```text
npm error EBADENGINE Unsupported engine {
npm error   package: 'omniroute@3.8.49',
npm error   required: { node: '>=22.22.2 <23 || >=24.0.0 <27' },
npm error   current: { node: 'v22.22.0', npm: '10.9.3' }
npm error }
```

**Causa raíz:** `omniroute@3.8.49` (dependencia transitiva) elevó su floor `engines.node` a `>=22.22.2`. El archivo `.nvmrc` del repo tenía `22.22.0`, por lo que `actions/setup-node@v4` instalaba Node 22.22.0 y `npm ci` fallaba con `EBADENGINE`.

**Fix aplicado:**

- **Archivo:** `.nvmrc`
- **Antes:** `22.22.0`
- **Después:** `22.22.2`
- **Commit:** `cf5e1bb` (branch `feature/ai-setup`, 2026-08-05)

**Propagación:** 9 workflows + 1 composite action leen `node-version-file: '.nvmrc'`. Un solo commit actualizó la versión efectiva en **todos** ellos:

- `ci.yml` (jobs: quality, test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e)
- `quality.yml` (reusable)
- `security.yml` (jobs: dependency-scan, sast, sbom, dependency-review)
- `release.yml`
- `deploy.yml` (job: docker-build)
- `preview.yml`
- `.github/actions/setup-monorepo/action.yml` (composite)

**Lección extraída:** **`.nvmrc` es la única fuente de verdad**. Nunca edites `node-version:` workflow por workflow. Un bump en `.nvmrc` + commit + re-run de CI propaga el cambio atómicamente a toda la flota.

---

### Caso 2 — `dorny/test-reporter@v3` exit 128 por shallow checkout

**Síntoma (verbatim CI error):**

```text
Error: The process '/usr/bin/git' failed with exit code 128
fatal: bad revision '...'
##[error] Process completed with exit code 128
```

Ocurría en el step `Report Client Unit Tests` (y análogos) de `ci.yml`. `dorny/test-reporter@v3` necesita el SHA del merge commit del PR para adjuntar el check run; con `fetch-depth: 1` (default de `actions/checkout@v5`) el clon es shallow y ese SHA no existe localmente.

**Causa raíz:** El composite action `.github/actions/setup-monorepo/action.yml` usaba `actions/checkout@v5` sin `fetch-depth: 0`. Seis jobs de `ci.yml` (test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e) invocan ese composite action como primer paso, por lo que **todos** heredaban el shallow clone.

**Fix aplicado:**

- **Archivo:** `.github/actions/setup-monorepo/action.yml`
- **Cambio:** Añadido `with: fetch-depth: 0` al step `Checkout`
- **Commit:** `32d35a8` (branch `feature/ai-setup`, 2026-08-05)

**Antes:**

```yaml
- name: Checkout
  uses: actions/checkout@v5
```

**Después:**

```yaml
- name: Checkout
  uses: actions/checkout@v5
  with:
    fetch-depth: 0
```

**Propagación:** Los 6 jobs de `ci.yml` que usan la composite action (`test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `build`, `e2e`) ahora clonan con historial completo. `release.yml` ya tenía su propio `fetch-depth: 0` explícito. `security.yml` job `secrets` también lo tiene.

**Lección extraída:** **`fetch-depth: 0` es opt-in, no default**. SIEMPRE que un step use `git log`, `git ls-files`, `git diff` contra un SHA, o un reporter tool como `dorny/test-reporter`, el checkout **debe** traer historial completo. No lo pongas "por si acaso" en workflows que no lo necesitan (pierde tiempo de CI).

---

## 4. Inventario de workflows y composite actions

| Workflow / Action              | Archivo                                     | Disparador                                                 | Usa `.nvmrc`             | Notas                                                                                                  |
| ------------------------------ | ------------------------------------------- | ---------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **CI principal**               | `.github/workflows/ci.yml`                  | `pull_request` → `main`                                    | ✅ Sí (vía composite)    | 7 jobs: changes, quality, test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e |
| **Code Quality (reusable)**    | `.github/workflows/quality.yml`             | `workflow_call`, `workflow_dispatch`                       | ✅ Sí                    | Lint + format + typecheck (skipped) por workspace                                                      |
| **Security**                   | `.github/workflows/security.yml`            | `pull_request` → `main`, `push` → `main`, `workflow_call`  | ✅ Sí                    | 5 jobs: dependency-scan, sast, secrets, sbom, dependency-review                                        |
| **Release (Changesets)**       | `.github/workflows/release.yml`             | `push` → `main`                                            | ✅ Sí                    | `fetch-depth: 0` explícito para Changesets                                                             |
| **CD Deploy Pipeline**         | `.github/workflows/deploy.yml`              | `push` → `main`, `workflow_dispatch`                       | ✅ Sí (job docker-build) | 7 jobs: docker-build, ecr-push, deploy-staging, deploy-production + 3 skipped                          |
| **Preview Environments**       | `.github/workflows/preview.yml`             | `pull_request` (opened/reopened/sync), `workflow_dispatch` | ✅ Sí                    | Valida backend con Floci + Postgres efímera                                                            |
| **CI Enterprise**              | `.github/workflows/ci-enterprise.yml`       | `workflow_dispatch`, `workflow_call`                       | ✅ Sí                    | **No aplica a este monorepo** (paths `frontend/`, `backend/` inexistentes)                             |
| **Scheduled Security**         | `.github/workflows/scheduled-security.yml`  | `cron` (Mon 03:00 UTC), `workflow_dispatch`                | ✅ Sí (checkout only)    | Gitleaks full history scan + SARIF upload                                                              |
| **Security Digest**            | `.github/workflows/security-digest.yml`     | `cron` (Mon 03:00 UTC), `workflow_dispatch`                | ✅ Sí (checkout only)    | SBOM + OSV Scanner + digest comment to PR                                                              |
| **Setup Monorepo (composite)** | `.github/actions/setup-monorepo/action.yml` | Invocado por 6 jobs de `ci.yml`                            | ✅ Sí                    | **28 líneas**; checkout (fetch-depth: 0), setup-node, npm ci, cache Vitest                             |

> ⚠️ **Nota sobre `pr-validation.yml`**: Este workflow fue **eliminado** (agosto 2026) como parte de la limpieza de workflows zombie (change `ci-cleanup-enterprise`). Era código muerto intencional con matrix hardcoded `[18.x, 20.x]`. Ver sección 18.

---

## 5. Mantenimiento de versiones Node

### `.nvmrc` = Single Source of Truth

Nueve workflows + la composite action leen la versión de Node desde `.nvmrc` mediante `node-version-file: '.nvmrc'` en `actions/setup-node@v4`. **Este archivo es la única fuente de verdad**. Cuando necesites cambiar la versión de Node en CI:

1. Edita **solo** `.nvmrc` (ej: `22.22.2`)
2. Commit atómico: `chore: bump Node to 22.22.2 in .nvmrc`
3. Push y verifica que CI vuelva a pasar (re-run si necesario)

> ❌ **Anti-pattern**: Editar `node-version:` o `node-version-file:` workflow por workflow. Esto crea deriva, olvidos y errores sutiles. Un solo archivo, un solo commit.

### Cuándo bumpear `.nvmrc`

- Una dependencia (directa o transitiva) sube su `engines.node` floor (como `omniroute@3.8.49` → `>=22.22.2`)
- Sale un **security release** de Node (ej: 22.22.0 → 22.22.2 por CVE)
- Transición de LTS (ej: Node 20 → 22 como LTS activo)

### Relación con `package.json` engines

Todos los `package.json` (raíz, `apps/client`, `apps/server`, `e2e`) declaran `"node": ">=20.0.0"`. **Esto es un floor (mínimo), no un pin exacto**. No necesitan coincidir con `.nvmrc` milimétricamente. La CI controla la versión real via `.nvmrc`; `engines` solo advierte a desarrolladores locales si su Node es demasiado viejo.

### `pr-validation.yml` matrix hardcoded

Este workflow deprecado usa:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Decisión (jul 2026):** Dejar tal cual. Es código muerto intencional; no vale la pena migrarlo a `.nvmrc` ni borrarlo (pierde historial de runs).

---

## 6. Mantenimiento de `actions/checkout` y `fetch-depth`

### Default: shallow clone (`fetch-depth: 1`)

`actions/checkout@v5` por defecto clona solo el último commit (`fetch-depth: 1`). Esto acelera el checkout pero **no trae historial completo**.

### Cuándo NECESITAS `fetch-depth: 0` (historial completo)

| Herramienta / Caso                                            | Por qué necesita historial completo                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `dorny/test-reporter@v3`                                      | Adjunta check runs al PR merge SHA; sin ese SHA falla con exit 128         |
| `changesets/action@v1`                                        | Calcula diffs entre `main` y la rama para versionar; necesita commits base |
| Cualquier `git log`, `git ls-files`, `git diff` contra un SHA | Operan sobre objetos que no existen en shallow clone                       |
| `gitleaks` full history scan (scheduled-security.yml)         | Escanea `--all` refs; requiere todos los commits                           |

### Dónde está `fetch-depth: 0` configurado HOY

| Archivo / Job                               | Línea                  | Propósito                                      |
| ------------------------------------------- | ---------------------- | ---------------------------------------------- |
| `.github/actions/setup-monorepo/action.yml` | Checkout step          | Cubre 6 jobs de `ci.yml` (test-\*, build, e2e) |
| `.github/workflows/release.yml`             | Checkout step          | Changesets necesita diffs                      |
| `.github/workflows/security.yml`            | Job `secrets` checkout | Gitleaks OSS diff scan (`base.sha..head.sha`)  |
| `.github/workflows/scheduled-security.yml`  | Checkout step          | Gitleaks full history (`--all`)                |

### Workflows que NO lo necesitan (y no lo tienen)

- `quality.yml` (lint/format solo necesitan archivos actuales)
- `lint.yml`, `formatter.yml` (standalone, mismo caso)
- `security.yml` jobs: `dependency-scan`, `sast`, `sbom`, `dependency-review` (no tocan git history)
- `deploy.yml` job `docker-build` (solo build de imagen)
- `preview.yml` (smoke tests contra stack efímero, sin git history)

> ❌ **Anti-pattern**: Poner `fetch-depth: 0` "por si acaso" en todos los workflows. Gasta minutos de GitHub Actions y ancho de banda clonado historial que no se usa. **Opt-in consciente**, no default.

---

## 7. Mantenimiento de third-party actions

| Action                                  | Versión usada | Workflow(s)                                    | Cadencia de actualización | Riesgo si se queda vieja                        |
| --------------------------------------- | ------------- | ---------------------------------------------- | ------------------------- | ----------------------------------------------- |
| `actions/checkout`                      | `@v5`         | Todos (12 workflows + composite)               | Mensual (Dependabot)      | Breaking changes en API, CVEs en runner         |
| `actions/setup-node`                    | `@v4`         | Todos los que usan Node                        | Mensual                   | Node versions deprecadas, cache corruption      |
| `actions/cache`                         | `@v4`         | setup-monorepo (Vitest), ci.yml (Playwright)   | Mensual                   | Cache poisoning, key mismatches                 |
| `actions/upload-artifact`               | `@v4`         | security.yml (sbom), security-digest.yml       | Mensual                   | Artifact retention, upload failures             |
| `actions/dependency-review-action`      | `@v4`         | security.yml (dependency-review)               | Mensual                   | False negatives en vuln detection               |
| `dorny/paths-filter`                    | `@v3`         | ci.yml (changes), ci-enterprise.yml            | Trimestral                | Path matching bugs, missed triggers             |
| `dorny/test-reporter`                   | `@v3`         | ci.yml (6 report steps)                        | Mensual                   | Exit 128 si fetch-depth mal; format changes     |
| `github/codeql-action/init`             | `@v4`         | security.yml (sast)                            | Mensual                   | Query pack updates, language support            |
| `github/codeql-action/analyze`          | `@v4`         | security.yml (sast)                            | Mensual                   | SARIF upload failures                           |
| `aquasecurity/trivy-action`             | `@0.33.1`     | security.yml (dependency-scan)                 | Mensual                   | DB de vulns desactualizada → false negatives    |
| `anchore/sbom-action`                   | `@v0.17.2`    | security.yml (sbom), security-digest.yml       | Trimestral                | Formato SBOM roto, CycloneDX incompat           |
| `docker://zricethezav/gitleaks`         | `:v8.22.1`    | security.yml (secrets), scheduled-security.yml | Mensual                   | Regex updates, false positives/negatives        |
| `gitleaks/gitleaks-action`              | `@v2`         | security.yml (secrets - licensed)              | Mensual                   | Requiere licencia `GIT_LEAKS`; breaking changes |
| `changesets/action`                     | `@v1`         | release.yml                                    | Trimestral                | Version bump logic, npm publish failures        |
| `aws-actions/configure-aws-credentials` | `@v4`         | deploy.yml (ecr-push, deploy-\*)               | Mensual                   | OIDC token changes, region support              |
| `aws-actions/amazon-ecr-login`          | `@v2`         | deploy.yml (ecr-push)                          | Trimestral                | ECR API changes, login failures                 |
| `peter-evans/find-comment`              | `@v3`         | preview.yml                                    | Trimestral                | GraphQL API changes, comment not found          |
| `peter-evans/create-or-update-comment`  | `@v4`         | preview.yml                                    | Trimestral                | Permissions, rate limiting                      |

> 💡 **Recomendación:** Configura **Dependabot** (ya existe en `.github/dependabot.yml` con ecosystem `github-actions`) para PRs semanales automáticos. Alternativa manual mensual: `gh api repos/:owner/:repo/actions/workflows --paginate | jq '.workflows[] | .path'` + revisar cada `uses:`.

---

## 8. Mantenimiento de pre-commit hooks locales

### Hooks actuales

| Hook         | Archivo             | Qué hace                                                                                            |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| `pre-commit` | `.husky/pre-commit` | `lint-staged` (prettier+eslint) → paralelizado: `npm run sast:semgrep` + `npm run security:secrets` |
| `commit-msg` | `.husky/commit-msg` | `commitlint --edit $1` (Conventional Commits)                                                       |
| `pre-push`   | `.husky/pre-push`   | `git fetch origin main --depth=1` → `vitest run --changed origin/main` (server + client)            |

### ⚠️ TIMEOUT GOTCHA — bash default 120s

> Durante los commits `cf5e1bb` y `32d35a8`, la ejecución paralela de `lint-staged` + `semgrep` + `gitleaks` en `.husky/pre-commit` **superó el timeout por defecto de bash (120 segundos)**. El hook fallaba con "exit 128" o "timeout" falso positivo, aunque los checks eran correctos.
>
> **Fix:** Reintentar el commit con timeout extendido (ej: `timeout 600 bash -c "git commit ..."` o configurar `husky` con timeout mayor). **No entrar en pánico** — los checks pasan, solo necesitan más tiempo en repos grandes.

### Semgrep baseline

`semgrep` reporta **19 findings pre-existentes** en archivos no relacionados con el cambio actual. Estos son **baseline**, no bloqueadores. **No intentar "arreglar" los 19** a menos que se planifique un sprint dedicado de remediation. El hook solo debe fallar por _nuevos_ findings en archivos staged.

---

## 9. Mantenimiento de Dependabot

El archivo `.github/dependabot.yml` **existe** (auditado agosto 2026) y cubre tres ecosistemas:

- `npm` (raíz, weekly, lunes 03:00 UTC, grupos dev-deps minor/patch)
- `github-actions` (weekly, mismo schedule, prefix `ci`)
- `docker` (`apps/server`, weekly, prefix `ci`)

### Rutina mensual

1. Revisar el **cluster de PRs** que abre Dependabot los lunes
2. **Batch-merge** los de tipo `patch` y `minor` que pasan CI (especialmente `github-actions` y `docker`)
3. Evaluar **major bumps** por separado (leer changelog, testear localmente)
4. Ignorar majors de `react`/`react-dom` (configurado en `ignore:`)

> ⚠️ Si `.github/dependabot.yml` desaparece: recrear con los tres ecosistemas arriba. Sin Dependabot, la carga de actualizar actions manualmente recae 100% en el maintainer.

---

## 10. Mantenimiento de services containers

Tres workflows usan `postgres:16-alpine` como service container:

| Workflow      | Jobs                                    | Database name         |
| ------------- | --------------------------------------- | --------------------- |
| `ci.yml`      | `test-integration`, `test-smoke`, `e2e` | `project_one_test`    |
| `deploy.yml`  | `docker-build`                          | `project_one_cd`      |
| `preview.yml` | `preview`                               | `project_one_preview` |

### Patrón de healthcheck (consistente en los tres)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: <nombre_unico_por_job>
    options: >-
      --health-cmd "pg_isready -U test -d <nombre_unico_por_job>"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Política de versiones

- **Patch releases (16.x.y → 16.x.z):** Bumpear tag en los tres workflows cuando salga patch de seguridad/bugfix. Un solo PR, tres archivos.
- **Major version (16 → 17):** **NO bumpear sin antes** verificar compatibilidad con Prisma (`prisma/client` version). Prisma puede requerir cambios en `schema.prisma` o en el motor de migraciones. Testear en branch aparte antes de mergear.

---

## 11. Mantenimiento de la composite action `setup-monorepo`

**Archivo único:** `.github/actions/setup-monorepo/action.yml` (28 líneas)

### Qué hace (pasos en orden)

1. `actions/checkout@v5` con `fetch-depth: 0`
2. `actions/setup-node@v4` con `node-version-file: '.nvmrc'` + cache npm
3. `npm ci` (install determinístico)
4. `actions/cache@v4` para `node_modules/.cache/vitest` (key: `vitest-${OS}-${hash(package-lock.json)}`)

### Usado por

6 jobs de `ci.yml` como **primer step**: `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `build`, `e2e`.

### Cuándo editar

- Añadir un **nuevo paso de setup que TODOS los 6 jobs necesiten** (ej: instalar Playwright globalmente, setear env vars compartidas, configurar git credentials)

### Cuándo NO editar

- Setup **específico de un job** (ej: `e2e` necesita cache de Playwright browsers → eso va en `ci.yml` job `e2e`, no en la composite)
- Cambios que solo afectan a `quality.yml`, `security.yml`, `deploy.yml`, `preview.yml` (no usan esta composite)

> ⚠️ Cualquier cambio aquí **propaga a 6 jobs simultáneamente**. Testear con `act` local o un PR de prueba antes de mergear a `main`.

---

## 12. Mantenimiento de caching

### Caches actuales

| Cache                   | Definido en                                                                                                | Key                                                                 | Invalida correctamente            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| **npm (node_modules)**  | `actions/setup-node@v4` en quality.yml, security.yml, setup-monorepo, release.yml, deploy.yml, preview.yml | `cache-dependency-path: package-lock.json`                          | ✅ Sí (hash de package-lock.json) |
| **Vitest**              | `.github/actions/setup-monorepo/action.yml` (actions/cache@v4)                                             | `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`     | ✅ Sí                             |
| **Playwright browsers** | `ci.yml` job `e2e` (actions/cache@v4)                                                                      | `playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` | ✅ Sí                             |

### ⚠️ Known Gap — `ci-enterprise.yml` cache miss garantizado

> `ci-enterprise.yml` (job `install`) usa:
>
> ```yaml
> cache-dependency-path: |
>   package-lock.json
>   frontend/package-lock.json
>   backend/package-lock.json
> ```
>
> **Esos paths `frontend/` y `backend/` NO EXISTEN en este monorepo** (usamos `apps/client`, `apps/server`). Resultado: **cache miss en cada run**. Documentado como gap **A3** en `cicd-estado-actual.md`. No arreglar (workflow no aplica a este repo), pero mantener la nota para no copiar el patrón.

---

## 13. Mantenimiento de security workflows

### `security.yml` — 5 jobs

| Job                 | Herramienta                                                                                       | Qué escanea                              | Estado                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `dependency-scan`   | Trivy (`aquasecurity/trivy-action@0.33.1`)                                                        | Filesystem, severidad CRITICAL/HIGH      | ✅ Activo                                         |
| `sast`              | CodeQL (`github/codeql-action/init@v4` + `analyze@v4`)                                            | JavaScript SAST                          | ✅ Activo (autobuild comentado → `npm ci` manual) |
| `secrets`           | Gitleaks OSS (`docker://zricethezav/gitleaks:v8.22.1`) + licensed (`gitleaks/gitleaks-action@v2`) | PR diff + full repo (si licencia)        | ⚠️ Ver nota abajo                                 |
| `sbom`              | `anchore/sbom-action@v0.17.2`                                                                     | CycloneDX JSON → artifact 365 días       | ✅ Activo                                         |
| `dependency-review` | `actions/dependency-review-action@v4`                                                             | PR dependency diff, vuln + license check | ✅ Activo                                         |

### ⚠️ Known Gap — `GIT_LEAKS` secret no configurado

> En `security.yml` líneas 80-87, el job `secrets` tiene dos steps:
>
> 1. Gitleaks OSS (siempre corre, diff scan)
> 2. Gitleaks licensed (`gitleaks/gitleaks-action@v2`) — **solo si `${{ secrets.GIT_LEAKS }} != ''`**
> 3. Warning step — **si secret vacío, imprime `::warning::` y continua**
>
> **Comportamiento actual:** Si `GIT_LEAKS` no está en Settings → Secrets, el licensed scan se salta silenciosamente con warning. **No falla el job**, pero pierdes la detección avanzada. Verificar/rotar este secret trimestralmente.

### `scheduled-security.yml` y `security-digest.yml`

- **`scheduled-security.yml`**: Cron Mon 03:00 UTC. Gitleaks full history (`--all`) → JSON + SARIF → upload artifact + Security tab.
- **`security-digest.yml`**: Mismo cron. SBOM + OSV Scanner (`google/osv-scanner-action@v2.3.8`) → genera digest markdown → opcional comment en PR (input `pull_request_number`).

> 🔍 **TODO:** Inspeccionar ambos durante la próxima ventana de mantenimiento trimestral para confirmar que los cron schedules se ejecutan y los artifacts se generan correctamente. No han sido auditados en profundidad desde su creación.

### CodeQL autobuild comentado

El step `github/codeql-action/autobuild@v4` está comentado en `security.yml` (línea 54-55). El análisis corre tras `npm ci` manual. **Mantener así** — el autobuild a veces falla en monorepos con workspaces; el `npm ci` explícito es más fiable.

---

## 14. Mantenimiento de CD/Deploy workflows

### `deploy.yml` — Pipeline completo (Fase 1 + Fase 2)

| Job                         | Fase        | Gating                                                                  | Qué hace                                                                                             |
| --------------------------- | ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `docker-build`              | 1 (sin AWS) | Siempre                                                                 | Build imagen Docker → valida boot contra Floci + Postgres efímera → smoke tests                      |
| `ecr-push`                  | 2 (con AWS) | `vars.AWS_ROLE_ARN != ''`                                               | OIDC → ECR login → push imagen taggeada por SHA + latest                                             |
| `deploy-staging`            | 2           | `vars.AWS_ROLE_ARN != ''` + `environment: staging`                      | ECS Fargate task def register → force-new-deployment + circuit breaker → health check → remote smoke |
| `deploy-production`         | 2           | `vars.AWS_ROLE_ARN != ''` + `environment: production` (manual approval) | Idem staging pero cluster prod, CPU/memory mayores, health check 5 min                               |
| `ecr-push-skipped`          | —           | `vars.AWS_ROLE_ARN == ''`                                               | `::notice::` visible en UI — Fase 1 learning path                                                    |
| `deploy-staging-skipped`    | —           | `vars.AWS_ROLE_ARN == ''`                                               | `::notice::` — ECS staging no provisto                                                               |
| `deploy-production-skipped` | —           | `vars.AWS_ROLE_ARN == ''`                                               | `::notice::` — ECS prod no provisto                                                                  |

### `preview.yml` — Preview environments en PR

- Disparador: `pull_request` (opened, reopened, synchronize) + `workflow_dispatch`
- Servicios: `floci/floci:1.5.31` (puerto 4566) + `postgres:16-alpine`
- Build imagen Docker del server → Prisma migrate → start container → health check → smoke tests contra Floci (AWS emulator)
- Captura URL de preview Vercel via commit status API
- Publica/actualiza comentario en PR con marker `<!-- preview-environments -->` combinando Vercel URL + backend status

### Maintenance gates (imágenes base)

| Imagen        | Usada en                                   | Versión actual | Política                                                     |
| ------------- | ------------------------------------------ | -------------- | ------------------------------------------------------------ |
| `floci/floci` | `deploy.yml` (docker-build), `preview.yml` | `1.5.31`       | Bumpear cuando Floci publique release (ver GitHub releases)  |
| `postgres`    | `ci.yml`, `deploy.yml`, `preview.yml`      | `16-alpine`    | Ver sección 10 (patch bumps OK, major solo con Prisma check) |

### Secrets inventory (requeridos para Fase 2)

| Secret / Variable                              | Usado en                                   | Descripción                                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vars.AWS_ROLE_ARN`                            | `deploy.yml` (ecr-push, deploy-\*)         | OIDC role ARN para asumir en AWS (gate principal)                                                                                                                             |
| `vars.AWS_ACCOUNT_ID`                          | `deploy.yml` (ecr-push, task defs)         | Account ID para ECR URI                                                                                                                                                       |
| `secrets.STAGING_TASK_EXECUTION_ROLE_ARN`      | `deploy.yml` (deploy-staging)              | ECS task execution role                                                                                                                                                       |
| `secrets.STAGING_TASK_ROLE_ARN`                | `deploy.yml` (deploy-staging)              | ECS task role                                                                                                                                                                 |
| `secrets.STAGING_DATABASE_URL_SECRET_ARN`      | `deploy.yml` (deploy-staging)              | Secrets Manager ARN para DB URL                                                                                                                                               |
| `secrets.STAGING_JWT_SECRET_SECRET_ARN`        | `deploy.yml` (deploy-staging)              | ARN con la SECRETKEY real (env var inyectado: `SECRETKEY` — el ARN conserva el nombre legacy `JWT_SECRET` pero el código lee `SECRETKEY`/`REFRESHSECRETKEY`, NO `JWT_SECRET`) |
| `secrets.STAGING_REFRESH_SECRETKEY_SECRET_ARN` | `deploy.yml` (deploy-staging)              | ARN NUEVO (2026-08-10) con la REFRESHSECRETKEY real                                                                                                                           |
| `secrets.STAGING_AWS_REGION_SECRET_ARN`        | `deploy.yml` (deploy-staging)              | AWS region secret                                                                                                                                                             |
| `secrets.STAGING_URL`                          | `deploy.yml` (deploy-staging health/smoke) | URL pública de staging                                                                                                                                                        |
| `secrets.PROD_*` (equivalentes)                | `deploy.yml` (deploy-production)           | Versiones production de lo anterior                                                                                                                                           |
| `secrets.GITHUB_TOKEN`                         | `preview.yml` (Vercel status, PR comments) | Auto-provisto por GitHub                                                                                                                                                      |
| `secrets.GIT_LEAKS`                            | `security.yml` (secrets job)               | Licencia Gitleaks Pro (opcional)                                                                                                                                              |

> 📝 **Diseño Fase 1:** Cuando `AWS_ROLE_ARN` está vacío (estado actual), los jobs de Fase 2 se saltan con `::notice::` annotations visibles en la UI de Actions (líneas 420-462 de `deploy.yml`). **Es intencional** para el learning path sin AWS. No "arreglar" hasta que se provea infra AWS.

---

## 15. Mantenimiento de concurrency groups

| Workflow                               | Concurrency group                                                      | cancel-in-progress | Notas                                                       |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `ci.yml`                               | `pr-${{ github.event.pull_request.number }}`                           | `true`             | Cancela runs previos del mismo PR al pushear nuevos commits |
| `deploy.yml` (job `docker-build`)      | `deploy-staging`                                                       | `false`            | **No cancelar** build en curso                              |
| `deploy.yml` (job `ecr-push`)          | `deploy-staging`                                                       | `false`            | Mismo grupo que docker-build (secuencial)                   |
| `deploy.yml` (job `deploy-staging`)    | `deploy-staging`                                                       | `false`            | No interrumpir deploy mid-flight                            |
| `deploy.yml` (job `deploy-production`) | `deploy-production`                                                    | `false`            | Manual approval + no cancel                                 |
| `preview.yml`                          | `preview-${{ github.event.pull_request.number }}` (o `preview-manual`) | `true`             | Cancela preview anterior del mismo PR                       |

> ⚠️ **Gotcha:** Si dos PRs distintos **comparten accidentalmente el mismo group name** (ej: bug en la expresión), **uno cancela al otro**. Verificar que las expresiones generan grupos únicos por PR. `deploy-staging` y `deploy-production` son fijos a propósito (solo un deploy a la vez por entorno).

---

## 16. Mantenimiento de permissions

Principio: **mínimo privilegio**. Ningún workflow usa `permissions: write-all`. Cada workflow declara solo los scopes que necesita.

| Workflow                                 | contents | pull-requests | checks  | security-events | id-token | actions |
| ---------------------------------------- | -------- | ------------- | ------- | --------------- | -------- | ------- |
| `ci.yml`                                 | `read`   | `write`       | `write` | —               | —        | —       |
| `quality.yml`                            | `read`   | —             | —       | —               | —        | —       |
| `security.yml`                           | `read`   | —             | —       | `write`         | —        | —       |
| `security.yml` (job `sbom`)              | `read`   | —             | —       | —               | —        | `write` |
| `security.yml` (job `dependency-review`) | `read`   | `write`       | —       | —               | —        | —       |
| `release.yml`                            | `write`  | `write`       | —       | —               | —        | —       |
| `deploy.yml` (root)                      | `read`   | —             | —       | —               | —        | —       |
| `deploy.yml` (job `ecr-push`)            | `read`   | —             | —       | —               | `write`  | —       |
| `deploy.yml` (job `deploy-staging`)      | `read`   | —             | —       | —               | `write`  | —       |
| `deploy.yml` (job `deploy-production`)   | `read`   | —             | —       | —               | `write`  | —       |
| `preview.yml`                            | `read`   | `write`       | —       | —               | —        | —       |
| `scheduled-security.yml`                 | `read`   | —             | —       | `write`         | —        | —       |
| `security-digest.yml`                    | `read`   | `write`\*     | —       | —               | —        | `read`  |

- `security-digest.yml` job `digest` usa `pull-requests: write` solo cuando se pasa input `pull_request_number` (comment en PR).

> 📌 **Patrón observado:** `id-token: write` **solo** en jobs que usan OIDC AWS (`aws-actions/configure-aws-credentials@v4`). `security-events: write` **solo** en jobs SAST/SCA que suben SARIF. `actions: write` **solo** en `sbom` job para upload artifact. No conceder permisos "por si acaso".

---

## 17. Checklist de mantenimiento trimestral

1. **Auditar versiones de third-party actions** — Revisar PRs de Dependabot (`github-actions` ecosystem) o correr `gh api repos/:owner/:repo/actions/workflows --paginate | jq -r '.workflows[].path' | xargs -I{} gh api repos/:owner/:repo/contents/{} | jq -r '.content' | base64 -d | grep 'uses:'` para inventario manual.
2. **Verificar `.nvmrc` vs último Node LTS security release** — `node --version` local vs `.nvmrc` vs [Node.js release schedule](https://nodejs.org/en/about/releases/).
3. **Revisar `package.json` engines.node floors** — Confirmar que `>=20.0.0` sigue siendo correcto (no igualar a `.nvmrc` exacto).
4. **Confirmar que `fetch-depth: 0` sigue siendo necesario** — Revisar si `dorny/test-reporter` u otras tools cambiaron comportamiento (ej: v4 ya no necesita historial).
5. **Correr `act` localmente con un PR de prueba** — `act -j quality -W .github/workflows/quality.yml` (ver Apéndice A) para validar cambios sin gastar minutos de GitHub.
6. **Inspeccionar `.github/dependabot.yml`** — Verificar que los tres ecosistemas (`npm`, `github-actions`, `docker`) siguen configurados y los schedules corren.
7. **Correr `gh run list --limit 50`** — Detectar runs fallidos recurrentes, jobs que flaky, workflows que no se disparan.
8. **Inspeccionar `scheduled-security.yml` y `security-digest.yml`** — Verificar cron schedules (Mon 03:00 UTC), artifacts generados, SARIF subidos a Security tab.
9. **Bumpear imágenes Docker si hay releases** — `postgres:16-alpine` (patch), `floci/floci` (ver GitHub releases).
10. **Revisar secrets rotation** — `AWS_ROLE_ARN`, `GIT_LEAKS`, `STAGING_*`, `PROD_*` — rotar si política de empresa lo exige (ej: cada 90 días).
11. **Documentar nuevos ajustes en esta guía** — Añadir un nuevo "Caso" en **Sección 3** con el mismo formato (Síntoma, Causa, Fix, Propagación, Lección).

---

## 18. Lecciones aprendidas y anti-patrones

- **Editar `.nvmrc` es suficiente; NUNCA editar `node-version:` workflow por workflow** — Un archivo, un commit, propagación atómica a 10 consumidores.
- **`package.json` engines son floors, no pins — NUNCA igualarlos a `.nvmrc` exacto** — `>=20.0.0` permite flexibilidad local; CI fija la versión real via `.nvmrc`.
- **`fetch-depth: 0` es opt-in: SIEMPRE que un step use `git log`, `git ls-files`, o un reporter tool como `dorny/test-reporter`** — No lo pongas "por si acaso"; gasta CI time.
- **Pre-commit hooks pueden superar 120s en bash — esperar 600s antes de asumir failure** — Timeout falso positivo observado en commits `cf5e1bb` y `32d35a8`.
- **Silent exit de subagentes NO significa que la edición falló — verificar archivo directamente con `read`** — El agente puede haber completado la herramienta `write`/`edit` sin emitir mensaje final.
- **Un commit por fix atómico — NUNCA combinar version bump + workflow change en el mismo commit** — `cf5e1bb` (solo `.nvmrc`), `32d35a8` (solo `fetch-depth: 0`). Mezclar oculta causalidad en `git log`.
- **Workflows zombie eliminados (`pr-validation.yml`, `lint.yml`, `formatter.yml`): Borrados en agosto 2026 (change `ci-cleanup-enterprise`)** — Eran código muerto re-introducido por merge; ahora eliminados con regression guard en `ci.yml` que falla si reaparecen. No agregar fixes a código muerto; borrarlo.
- **Typos en cache keys (`cache-dependecy-path`, `cache-depency-path` en `lint.yml`/`formatter.yml`) no rompen pero degradan performance** — Corregir en próximo PR que toque esos archivos.
- **`ci-enterprise.yml` referencia paths inexistentes (`frontend/`, `backend/`) — no copiar sus patrones** — Gap A3 documentado; workflow no aplica a este monorepo.
- **`GIT_LEAKS` secret unset → licensed Gitleaks se salta con warning, no error** — Verificar trimestralmente que el secret existe y es válido; si no, al menos saber que solo corre OSS scan.

---

## 19. Apéndice A — Comandos útiles de mantenimiento

```bash
# Ver últimos 50 runs con status, conclusion, nombre, rama
gh run list --limit 50 --json status,conclusion,name,headBranch

# Ver permisos de Actions a nivel repo
gh api repos/:owner/:repo/actions/permissions

# Verificar archivos tracked bajo .github/
git ls-files .github/

# Runner local act (requiere Docker) — testear job quality sin push
act -j quality -W .github/workflows/quality.yml

# Sanity check Node version local vs .nvmrc
cat .nvmrc && node --version

# Inventario de workflows
gh workflow list

# Auditoría de secrets (nombres, no valores)
gh secret list

# Ver runs de un workflow específico
gh run list --workflow=ci.yml --limit 20

# Re-run fallido
gh run rerun <run-id>

# Ver logs de un job
gh run view <run-id> --log
```

---

## 20. Referencias

- [Estado actual de CI/CD](cicd-estado-actual.md) — Documento base de auditoría
- [Plan de implementación CI/CD](cicd-plan-implementacion.md) — Roadmap de sprints
- [Arquitectura de testing](testing-architecture.md) — Pirámide unit/integration/E2E
- [AWS CD Learning Path](aws-cd-learning-path.md) — Fases Floci → ECS
- [AWS Dev Local con Floci](aws-dev-local-floci.md) — Emulador local
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [dorny/test-reporter issue #67](https://github.com/dorny/test-reporter/issues/67) — fetch-depth context
- [actions/checkout fetch-depth docs](https://github.com/actions/checkout#fetch-depth)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Changesets Documentation](https://github.com/changesets/changesets)

---
