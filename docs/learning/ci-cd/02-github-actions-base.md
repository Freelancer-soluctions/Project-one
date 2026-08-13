# GitHub Actions Base — Anatomía, Triggers, Runners, Expresiones y Outputs

> **Guía 02 de 5 del nivel Fundamentos** | Prerequisitos: [`00-que-es-cicd.md`](00-que-es-cicd.md) + [`01-git-y-yaml.md`](01-git-y-yaml.md) completadas | Siguiente: [`03-secrets-variables.md`](03-secrets-variables.md)

---

## 🎯 Objetivos de aprendizaje

Al terminar esta guía, serás capaz de:

- ✅ **Explicar la anatomía completa** de un workflow: `workflow` → `jobs` → `steps` y su jerarquía con diagrama
- ✅ **Identificar y configurar los 4 triggers principales**: `push`, `pull_request`, `workflow_dispatch`, `cron` con ejemplos reales del proyecto
- ✅ **Diferenciar runners**: `ubuntu-latest` (GitHub-hosted) vs self-hosted y decidir cuándo usar cada uno
- ✅ **Dominar la sintaxis de expresiones** `${{ }}` y los **5 contextos principales**: `github`, `secrets`, `vars`, `env`, `needs`
- ✅ **Distinguir outputs de job vs step** y pasar datos entre jobs usando `needs.<job_id>.outputs.<name>`
- ✅ **Leer y explicar línea por línea** el workflow real `ci.yml` del proyecto (jobs: `changes` → `quality`/`tests`/`build`, `concurrency`, `permissions`)
- ✅ **Conectar** cada concepto abstracto con su implementación concreta en los 9 workflows del repo

---

## 📋 Prerequisitos

1. ✅ **Guía 00 completada** — Entiendes qué es CI/CD, pipeline stages, shifting left, métricas DORA, y conoces el inventario de 9 workflows del proyecto
2. ✅ **Guía 01 completada** — Dominas flujo de ramas Git, Pull Requests, Conventional Commits, Husky + commitlint, y **sintaxis YAML completa** (escalares, listas, mapas, multilínea, anclas)
3. ✅ **Conceptos Git claros** — Sabes qué es un commit, branch, PR, merge, push; entiendes que los workflows se disparan por eventos Git

> **Si no completaste las guías 00 y 01:** Vuelve a [`00-que-es-cicd.md`](00-que-es-cicd.md) y [`01-git-y-yaml.md`](01-git-y-yaml.md) — los conceptos de pipeline, YAML, y eventos Git se dan por sentados aquí.

---

## 1. Teoría: Anatomía de un Workflow GitHub Actions (Desde Cero)

### 1.1 ¿Qué es un Workflow?

Un **workflow** es un **proceso automatizado configurable** que se ejecuta en la nube de GitHub (o en tus propios servidores) en respuesta a **eventos** (triggers). Piensa en él como una **receta de cocina ejecutable**: defines ingredientes (inputs), pasos (steps), utensilios (runners), y el resultado final (artefactos, deploy, reportes).

> **Analogía**: Si CI/CD es la "línea de montaje", el **workflow** es el **manual de operaciones** de esa línea. Cada archivo `.yml` en `.github/workflows/` = **un manual independiente**.

### 1.2 Jerarquía: Workflow → Job → Step

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW (archivo .yml completo)                               │
│  ├── name: "CI"                                                 │
│  ├── on: { pull_request: { branches: [main] } }  ← TRIGGER      │
│  ├── permissions: { contents: read }                            │
│  ├── concurrency: { group: "...", cancel-in-progress: true }    │
│  └── jobs: {                                                    │
│       ├── changes: {  ← JOB 1 (job_id = "changes")             │
│       │    name: "Detect Changes"                               │
│       │    runs-on: ubuntu-latest  ← RUNNER                     │
│       │    outputs: { frontend: "...", backend: "..." }         │
│       │    steps: [  ← LISTA DE STEPS                           │
│       │      - uses: actions/checkout@v5   ← STEP 1 (action)   │
│       │      - uses: dorny/paths-filter@v4  ← STEP 2 (action)  │
│       │    ]                                                    │
│       │                                                         │
│       ├── quality: {  ← JOB 2 (job_id = "quality")             │
│       │    needs: changes    ← DEPENDE DE changes              │
│       │    uses: ./.github/workflows/quality.yml  ← REUSABLE   │
│       │                                                         │
│       ├── test-unit-client: {  ← JOB 3                          │
│       │    needs: changes                                       │
│       │    if: needs.changes.outputs.frontend == 'true'        │
│       │    runs-on: ubuntu-latest                               │
│       │    steps: [ ... ]                                       │
│       │                                                         │
│       └── ... (más jobs)                                        │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Diagrama Mermaid: Jerarquía Completa

```mermaid
flowchart TD
    subgraph WF [Workflow: .github/workflows/ci.yml]
        direction TB
        ON[on: pull_request → main] --> PERM[permissions: contents: read]
        PERM --> CONC[concurrency: pr-{{PR#}} cancel-in-progress]
        CONC --> JOBS[jobs: mapa de jobs]

        subgraph CHANGES [Job: changes]
            direction TB
            CH_RUN[runs-on: ubuntu-latest]
            CH_OUT[outputs: frontend, backend, e2e, shared]
            CH_STEPS[steps: checkout → paths-filter]
            CH_RUN --> CH_OUT --> CH_STEPS
        end

        subgraph QUALITY [Job: quality]
            direction TB
            QU_NEEDS[needs: changes]
            QU_USES[uses: quality.yml reusable]
            QU_IN[with: run-client, run-server]
            QU_NEEDS --> QU_USES --> QU_IN
        end

        subgraph TESTS [Jobs: test-unit-client, test-unit-server, test-integration, test-smoke, e2e]
            direction TB
            TE_NEEDS[needs: changes]
            TE_IF[if: needs.changes.outputs.X == 'true']
            TE_RUN[runs-on: ubuntu-latest]
            TE_SERV[services: postgres]
            TE_STEPS[steps: checkout → setup-monorepo → test → report]
            TE_NEEDS --> TE_IF --> TE_RUN --> TE_SERV --> TE_STEPS
        end

        subgraph BUILD [Job: build]
            direction TB
            BU_NEEDS[needs: changes]
            BU_IF[if: always()]
            BU_STEPS[steps: checkout → setup-monorepo → npm run build]
            BU_NEEDS --> BU_IF --> BU_STEPS
        end

        subgraph ZOMBIE [Job: zombie-workflow-guard]
            direction TB
            ZO_RUN[runs-on: ubuntu-latest]
            ZO_STEPS[steps: checkout → assert deleted workflows absent]
            ZO_RUN --> ZO_STEPS
        end

        JOBS --> CHANGES
        JOBS --> QUALITY
        JOBS --> TESTS
        JOBS --> BUILD
        JOBS --> ZOMBIE
    end
```

### 1.4 Definiciones Clave

| Concepto     | Qué es                                                      | Analogía                                   | En YAML                   |
| ------------ | ----------------------------------------------------------- | ------------------------------------------ | ------------------------- |
| **Workflow** | Archivo `.yml` completo = una automatización independiente  | Manual de operaciones completo             | Raíz del archivo          |
| **Job**      | Unidad de ejecución paralela/secuecial con su propio runner | Estación de trabajo en la línea            | `jobs.<job_id>`           |
| **Step**     | Paso atómico dentro de un job (action o comando shell)      | Tarea individual en la estación            | `jobs.<job_id>.steps[]`   |
| **Runner**   | Máquina (VM o servidor) que ejecuta los steps               | El obrero que hace el trabajo              | `runs-on:`                |
| **Trigger**  | Evento que inicia el workflow                               | Botón de arranque                          | `on:`                     |
| **Action**   | Unidad reutilizable de código (Docker/JS/Composite)         | Herramienta especializada                  | `uses:`                   |
| **Output**   | Dato que un step/job expone para pasos posteriores          | Resultado que pasa a la siguiente estación | `outputs:` / `set-output` |

---

## 2. Teoría: Triggers (Disparadores) — Cuándo se Ejecuta un Workflow

Los **triggers** definen **qué eventos de GitHub** inician la ejecución. Sin trigger, el workflow nunca corre.

### 2.1 Los 4 Triggers Principales

| Trigger             | Evento GitHub                      | Cuándo usar                                | Sintaxis básica                      |
| ------------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------ |
| `push`              | Commit pusheado a rama/tag         | CI en rama principal, CD automático        | `on: push: branches: [main]`         |
| `pull_request`      | PR abierto, actualizado, reabierto | Validación en PR (tests, lint, security)   | `on: pull_request: branches: [main]` |
| `workflow_dispatch` | Disparo manual desde UI/API        | Deploy manual, re-ejecución, tareas ad-hoc | `on: workflow_dispatch:`             |
| `schedule` (cron)   | Tiempo programado (UTC)            | Scans nocturnos, mantenimiento, reports    | `on: schedule: - cron: '0 3 * * 1'`  |

### 2.2 Ejemplos Reales del Proyecto (Cita de Fuente)

#### A. `push` — `deploy.yml` y `release.yml`

```yaml
# Source: ../../../.github/workflows/deploy.yml (líneas 11-14)
on:
  push:
    branches: [main]
  workflow_dispatch:
```

```yaml
# Source: ../../../.github/workflows/release.yml (líneas 3-5)
on:
  push:
    branches: [main]
```

> **Qué hace**: Al hacer `git push origin main`, se disparan **ambos workflows** en paralelo. `deploy.yml` construye y despliega; `release.yml` gestiona versionado con Changesets.

#### B. `pull_request` — `ci.yml`, `security.yml`, `preview.yml`

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 6-9)
on:
  pull_request:
    branches:
      - main
```

```yaml
# Source: ../../../.github/workflows/security.yml (líneas 3-8)
on:
  workflow_call:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

```yaml
# Source: ../../../.github/workflows/preview.yml (líneas 10-13)
on:
  pull_request:
    types: [opened, reopened, synchronize]
    branches: [main]
  workflow_dispatch:
```

> **Diferencias clave**:
>
> - `ci.yml`: Solo `pull_request` (no `push`) — evita doble ejecución al mergear PR
> - `security.yml`: `pull_request` + `push` + `workflow_call` — escanea en PR, en merge a main, y como reusable
> - `preview.yml`: `types: [opened, reopened, synchronize]` — solo en eventos de PR relevantes, no en `closed` o `labeled`

#### C. `workflow_dispatch` — `deploy.yml`, `preview.yml`, `security.yml`, `ci-enterprise.yml`, `scheduled-security.yml`

```yaml
# Source: ../../../.github/workflows/deploy.yml (líneas 11-14)
on:
  push:
    branches: [main]
  workflow_dispatch:
```

```yaml
# Source: ../../../.github/workflows/ci-enterprise.yml (líneas 3-5)
on:
  workflow_dispatch:
  workflow_call:
```

> **Para qué sirve**: Permite **disparar manualmente** desde:
>
> - Pestaña **Actions** → seleccionar workflow → **Run workflow**
> - API REST: `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`
> - GitHub CLI: `gh workflow run <workflow>`

#### D. `schedule` (cron) — `scheduled-security.yml`

```yaml
# Source: ../../../.github/workflows/scheduled-security.yml (líneas 3-6)
on:
  schedule:
    - cron: '0 3 * * 1' # Monday 03:00 UTC
  workflow_dispatch:
```

> **Formato cron** (UTC, 5 campos): `minuto hora día_mes mes día_semana`
>
> - `'0 3 * * 1'` = Lunes 03:00 UTC (escaneo semanal completo de secretos con Gitleaks)
> - **Zona horaria**: Siempre UTC. Para hora local, convierte (ej. 03:00 UTC = 23:00 CLT / 00:00 CET)

### 2.3 Filtros Avanzados en Triggers

```yaml
# Source: ../../../.github/workflows/preview.yml (líneas 10-13)
on:
  pull_request:
    types: [opened, reopened, synchronize] # Solo estos tipos de evento PR
    branches: [main] # Solo PRs hacia main
    paths: # Opcional: solo si cambian estos paths
      - 'apps/server/**'
      - 'apps/client/**'
```

| Filtro         | Qué filtra                             | Ejemplo                              |
| -------------- | -------------------------------------- | ------------------------------------ |
| `branches`     | Rama destino (PR) o rama origen (push) | `[main]`, `['release/**']`           |
| `types`        | Sub-tipo de evento PR                  | `[opened, synchronize, reopened]`    |
| `paths`        | Archivos modificados (solo push/PR)    | `['apps/server/**', 'package.json']` |
| `paths-ignore` | Excluir paths                          | `['**.md', 'docs/**']`               |

> **Tip**: `paths` en `pull_request` evalúa **diff del PR completo** (base→head). En `push` evalúa **commits nuevos**.

### 2.4 Trigger `workflow_call` — Workflows Reutilizables

```yaml
# Source: ../../../.github/workflows/quality.yml (líneas 3-12)
on:
  workflow_dispatch:
  workflow_call:
    inputs:
      run-client:
        required: true
        type: string
      run-server:
        required: true
        type: string
```

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 43-49)
jobs:
  quality:
    name: Code Quality
    needs: changes
    uses: ./.github/workflows/quality.yml
    with:
      run-client: ${{ needs.changes.outputs.frontend }}
      run-server: ${{ needs.changes.outputs.backend }}
```

> **Concepto**: `workflow_call` permite que **otro workflow invoque a este** como "sub-workflow" (reusable workflow). `ci.yml` llama a `quality.yml` pasando inputs dinámicos según qué código cambió.

---

## 3. Teoría: Runners — Dónde se Ejecuta el Trabajo

El **runner** es la máquina (virtual o física) que ejecuta los steps de un job.

### 3.1 GitHub-Hosted Runners (El Estándar del Proyecto)

```yaml
runs-on: ubuntu-latest
```

| Runner                    | SO                  | Especificaciones (aprox.)   | Cuándo usar                                                            |
| ------------------------- | ------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `ubuntu-latest`           | Ubuntu 22.04/24.04  | 2 vCPU, 7 GB RAM, 14 GB SSD | **Default del proyecto** — Node, Docker, PostgreSQL service containers |
| `ubuntu-22.04`            | Ubuntu 22.04 LTS    | Igual                       | Cuando necesitas versión fija (pinned)                                 |
| `windows-latest`          | Windows Server 2022 | 2 vCPU, 7 GB RAM            | Builds Windows, .NET, pruebas cross-platform                           |
| `macos-latest`            | macOS 13/14         | 3 vCPU, 14 GB RAM           | Builds iOS/macOS, firma de apps                                        |
| `ubuntu-latest` **arm64** | Ubuntu ARM64        | 2 vCPU, 7 GB RAM            | Builds multi-arch (Docker buildx)                                      |

> **En este proyecto**: **Todos los jobs usan `ubuntu-latest`**. No hay runners Windows/macOS ni ARM64 en los 9 workflows actuales.

### 3.2 Self-Hosted Runners (Cuando GitHub-Hosted No Basta)

```yaml
runs-on: [self-hosted, linux, x64, mi-label-custom]
```

| Escenario                    | Por qué self-hosted                                      | Ejemplo                                           |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| **Hardware especializado**   | GPU, ARM bare-metal, FPGA                                | Entrenamiento ML, builds embebidos                |
| **Red privada / VPC**        | Acceso a DB interna, VPN, artifact registry on-prem      | Deploy a k8s on-prem sin exponer IP pública       |
| **Caché persistente masivo** | `node_modules`, capas Docker, Maven/Gradle cache > 10 GB | Monorepos gigantes donde `actions/cache` no basta |
| **Compliance / Seguridad**   | Datos no salen de tu infra, auditoría completa           | Sectores regulados (banca, salud, gov)            |
| **Costos a escala**          | Miles de minutos/día → runner propio más barato          | Equipos grandes con CI constante                  |

> **Trade-off**: Self-hosted = **tú mantienes** (SO, updates, escalado, seguridad, networking). GitHub-hosted = **gratis para públicos, 4000 min/mes privados, cero mantenimiento**.

### 3.3 Runner Groups y Labels (Organización)

```yaml
# Ejemplo conceptual (no en proyecto actual)
runs-on: [self-hosted, linux, x64, gpu, team-backend]
```

- **Labels**: `[self-hosted, linux, x64, gpu]` — capacidades técnicas
- **Runner groups**: Agrupación lógica por equipo/proyecto (UI GitHub: Settings → Actions → Runner groups)

---

## 4. Teoría: Expresiones `${{ }}` y Contextos — El Cerebro Dinámico

Las **expresiones** `${{ ... }}` se evalúan **en runtime** (cuando el workflow corre). Permiten lógica dinámica: condicionales, interpolación, acceso a datos del evento, secrets, variables, outputs previos.

### 4.1 Sintaxis Básica

```yaml
# Interpolación simple
name: 'Build ${{ github.sha }}'

# Condicional (if)
if: ${{ needs.changes.outputs.frontend == 'true' }}

# Acceso a contexto
env:
  NODE_ENV: ${{ vars.NODE_ENV || 'production' }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

> **Regla de oro**: **Siempre** usa `${{ }}` en claves `if:`, `env:`, `with:`, `run:` (cuando interpolas). En `run:` sin interpolación, no es obligatorio pero recomendado para claridad.

### 4.2 Los 5 Contextos Principales (Tabla Comparativa)

| Contexto      | Qué contiene                                        | Ejemplos de uso                                                                                                          | ¿Es secreto?                    |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **`github`**  | Metadatos del evento, repo, run, actor              | `github.event_name`, `github.sha`, `github.ref`, `github.event.pull_request.number`, `github.actor`, `github.repository` | ❌ Público                      |
| **`secrets`** | Secrets configurados en repo/org/environment        | `secrets.GITHUB_TOKEN`, `secrets.AWS_ROLE_ARN`, `secrets.STAGING_DATABASE_URL`                                           | ✅ **NUNCA se loguea** (masked) |
| **`vars`**    | Variables de configuración (repo/org/environment)   | `vars.AWS_ROLE_ARN`, `vars.AWS_REGION`, `vars.AWS_ACCOUNT_ID`, `vars.NODE_ENV`                                           | ❌ Visible en logs              |
| **`env`**     | Variables de entorno definidas en workflow/job/step | `env.NODE_ENV`, `env.DATABASE_URL` (si la definiste)                                                                     | ❌ Visible                      |
| **`needs`**   | Outputs de jobs dependientes (`needs: [job_id]`)    | `needs.changes.outputs.frontend`, `needs.docker-build.outputs.image-tag`                                                 | ❌ Público                      |

### 4.3 Contexto `github` — El Más Rico (Ejemplos Reales)

```yaml
# Source: ../../../.github/workflows/ci.yml (línea 12)
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

```yaml
# Source: ../../../.github/workflows/preview.yml (línea 17)
concurrency:
  group: ${{ github.event_name == 'pull_request' && format('preview-{0}', github.event.pull_request.number) || 'preview-manual' }}
  cancel-in-progress: true
```

```yaml
# Source: ../../../.github/workflows/security.yml (línea 15)
concurrency:
  group: security-${{ github.ref }}
  cancel-in-progress: true
```

| Expresión                            | Qué devuelve                                     | Ejemplo valor                                           |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------- |
| `github.event_name`                  | Nombre del evento trigger                        | `pull_request`, `push`, `workflow_dispatch`, `schedule` |
| `github.sha`                         | SHA completo del commit                          | `a1b2c3d4e5f6...` (40 chars)                            |
| `github.ref`                         | Ref completa (refs/heads/main, refs/tags/v1.0.0) | `refs/heads/main`                                       |
| `github.ref_name`                    | Solo nombre de rama/tag                          | `main`, `v1.0.0`                                        |
| `github.event.pull_request.number`   | Número del PR                                    | `42`                                                    |
| `github.event.pull_request.base.sha` | SHA base del PR                                  | `main` commit SHA                                       |
| `github.event.pull_request.head.sha` | SHA head del PR                                  | commit del feature branch                               |
| `github.actor`                       | Usuario que disparó                              | `juanperez`                                             |
| `github.repository`                  | owner/repo                                       | `mi-org/project-one`                                    |
| `github.server_url`                  | URL base GitHub                                  | `https://github.com`                                    |
| `github.run_id`                      | ID único de la ejecución                         | `1234567890`                                            |
| `github.run_number`                  | Número de ejecución del workflow                 | `15`                                                    |

### 4.4 Contexto `secrets` vs `vars` — Diferencia Crítica

```yaml
# Source: ../../../.github/workflows/deploy.yml (líneas 184-185, 245-246)
- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v6
  with:
    role-to-assume: ${{ vars.AWS_ROLE_ARN }} # Variable (no secreta)
    aws-region: ${{ vars.AWS_REGION || 'us-east-1' }} # Variable con fallback
```

```yaml
# Source: ../../../.github/workflows/deploy.yml (líneas 258-263)
secrets:
  - name: DATABASE_URL
    valueFrom: '${{ secrets.STAGING_DATABASE_URL_SECRET_ARN }}'
  - name: SECRETKEY
    valueFrom: '${{ secrets.STAGING_JWT_SECRET_SECRET_ARN }}'
```

| Característica          | `secrets`                                                    | `vars`                                                                 |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Visibilidad en logs** | **Masked** (reemplazado por `***`)                           | Visible completo                                                       |
| **Uso típico**          | Passwords, tokens, keys, ARNs de secrets, connection strings | ARNs de roles, regions, account IDs, feature flags, config no sensible |
| **Scope**               | Repo / Organization / Environment                            | Repo / Organization / Environment                                      |
| **En `deploy.yml`**     | `STAGING_*_SECRET_ARN`, `PROD_*_SECRET_ARN`                  | `AWS_ROLE_ARN`, `AWS_REGION`, `AWS_ACCOUNT_ID`                         |
| **Gating condicional**  | `if: ${{ secrets.MY_SECRET != '' }}`                         | `if: ${{ vars.AWS_ROLE_ARN != '' }}`                                   |

> **Regla de seguridad**: **NUNCA** pongas datos sensibles en `vars`. **SIEMPRE** usa `secrets` para credenciales, tokens, claves, connection strings. `vars` = configuración no sensible.

### 4.5 Contexto `needs` — Pasar Datos Entre Jobs

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 19-23, 48-49)
jobs:
  changes:
    outputs:
      frontend: ${{ steps.filter.outputs.client }}
      backend: ${{ steps.filter.outputs.server }}
      e2e: ${{ steps.filter.outputs.e2e }}
      shared: ${{ steps.filter.outputs.shared }}

  quality:
    needs: changes
    uses: ./.github/workflows/quality.yml
    with:
      run-client: ${{ needs.changes.outputs.frontend }}
      run-server: ${{ needs.changes.outputs.backend }}
```

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 54, 82, 110, 160, 227)
if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'
if: needs.changes.outputs.e2e == 'true' || needs.changes.outputs.shared == 'true'
```

> **Flujo**: `changes` job → **outputs** → `needs.changes.outputs.<name>` → jobs downstream usan en `if:` y `with:`.

### 4.6 Funciones Comunes en Expresiones

| Función                       | Qué hace                                    | Ejemplo                                                        |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `format('str {0} {1}', a, b)` | Interpolación tipo `printf`                 | `format('pr-{0}', github.event.pull_request.number)` → `pr-42` |
| `contains(search, item)`      | Busca substring/elemento                    | `contains(github.ref, 'main')`                                 |
| `startsWith(str, prefix)`     | Empieza con                                 | `startsWith(github.ref, 'refs/tags/')`                         |
| `endsWith(str, suffix)`       | Termina con                                 | `endsWith(github.ref_name, '-rc')`                             |
| `fromJson(str)`               | Parse JSON string                           | `fromJson('["a","b"]')`                                        |
| `toJson(obj)`                 | Serializa a JSON                            | `toJson(steps.filter.outputs)`                                 |
| `hashFiles(pattern)`          | Hash de archivos (para cache keys)          | `hashFiles('package-lock.json')`                               |
| `success()`                   | Job/step anterior succeeded                 | `if: success()`                                                |
| `failure()`                   | Job/step anterior failed                    | `if: failure()`                                                |
| `always()`                    | Siempre ejecuta (incluso si falló anterior) | `if: always()`                                                 |
| `cancelled()`                 | Workflow fue cancelado                      | `if: cancelled()`                                              |

---

## 5. Teoría: Outputs de Job vs Step — Comunicación Entre Unidades

### 5.1 Output de Step (Dentro del Mismo Job)

Un **step** puede exponer outputs que **otros steps del mismo job** leen via `steps.<step_id>.outputs.<name>`.

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 28-41)
steps:
  - uses: actions/checkout@v5

  - uses: dorny/paths-filter@v4
    id: filter # ← ID OBLIGATORIO para referenciar outputs
    with:
      filters: |
        client:
          - 'apps/client/**'
        server:
          - 'apps/server/**'
        e2e:
          - 'e2e/**'
        shared:
          - 'package.json'
          - 'package-lock.json'
          - '.github/workflows/**'
```

> **Cómo funciona**: La action `dorny/paths-filter@v4` internamente hace `echo "client=true" >> $GITHUB_OUTPUT`. El workflow expone `steps.filter.outputs.client` = `"true"` o `"false"`.

### 5.2 Output de Job (Hacia Jobs Downstream)

Un **job** declara `outputs:` en su definición, mapeando desde step outputs. **Otros jobs** (con `needs:`) leen via `needs.<job_id>.outputs.<name>`.

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 16-23)
jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs: # ← DECLARACIÓN DE JOB OUTPUTS
      frontend: ${{ steps.filter.outputs.client }}
      backend: ${{ steps.filter.outputs.server }}
      e2e: ${{ steps.filter.outputs.e2e }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v5
      - uses: dorny/paths-filter@v4
        id: filter
        with:
          filters: |
            client:
              - 'apps/client/**'
            server:
              - 'apps/server/**'
            e2e:
              - 'e2e/**'
            shared:
              - 'package.json'
              - 'package-lock.json'
              - '.github/workflows/**'
```

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 43-49, 54, 82)
jobs:
  quality:
    needs: changes
    uses: ./.github/workflows/quality.yml
    with:
      run-client: ${{ needs.changes.outputs.frontend }}
      run-server: ${{ needs.changes.outputs.backend }}

  test-unit-client:
    needs: changes
    if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
    ...
```

### 5.3 Tabla Comparativa: Step Output vs Job Output

| Aspecto                | **Step Output**                                                      | **Job Output**                                                             |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Dónde se define**    | En el step (action lo escribe a `$GITHUB_OUTPUT`)                    | En `jobs.<job_id>.outputs` (mapa)                                          |
| **Cómo se referencia** | `steps.<step_id>.outputs.<name>`                                     | `needs.<job_id>.outputs.<name>`                                            |
| **Alcance**            | Solo steps **posteriores en el mismo job**                           | Jobs **downstream** que declaran `needs: <job_id>`                         |
| **Persistencia**       | Vida del job                                                         | Vida del workflow run                                                      |
| **Uso típico**         | Pasar datos entre steps (ej. hash de cache, versión, ruta artefacto) | Pasar decisiones de routing (¿correr tests client?), versiones, ARNs, URLs |
| **En `ci.yml`**        | `steps.filter.outputs.client`                                        | `needs.changes.outputs.frontend`                                           |

### 5.4 Patrón Completo: Path Filtering → Conditional Jobs

```mermaid
flowchart LR
    subgraph CHANGES [Job: changes]
        A[checkout] --> B[paths-filter]
        B --> C{¿Qué cambió?}
        C -->|client| D[outputs.frontend=true]
        C -->|server| E[outputs.backend=true]
        C -->|e2e| F[outputs.e2e=true]
        C -->|shared| G[outputs.shared=true]
    end

    subgraph DOWNSTREAM [Jobs dependientes]
        H[quality] --> I[if: needs.changes.outputs.frontend == 'true']
        H --> J[if: needs.changes.outputs.backend == 'true']
        K[test-unit-client] --> I
        L[test-unit-server] --> J
        M[test-integration] --> J
        N[e2e] --> O[if: needs.changes.outputs.e2e == 'true']
    end

    CHANGES --> DOWNSTREAM
```

> **Por qué es potente**: **Solo ejecutas lo necesario**. Si el PR solo toca `apps/client/`, `test-unit-server`, `test-integration`, `e2e` se **saltan** (`if:` evalúa `false`). Ahorra minutos de CI y dinero.

---

## 6. Implementación en el Proyecto: Desglose Línea por Línea de `ci.yml`

Ahora diseccionamos **el workflow principal del proyecto** (`ci.yml`) completo, conectando cada línea con los conceptos aprendidos.

> **Archivo fuente**: `../../../.github/workflows/ci.yml` (309 líneas totales)

### 6.1 Header: Metadatos, Permisos, Trigger, Concurrencia

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 1-14)
name: 'CI'

permissions:
  contents: read

on:
  pull_request:
    branches:
      - main

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

| Línea | Qué hace                             | Concepto                                                                                                          |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1     | `name: "CI"`                         | Nombre visible en UI Actions                                                                                      |
| 3-4   | `permissions: contents: read`        | **Mínimo privilegio**: solo lectura de repo. No `checks: write` aquí (se da por job)                              |
| 6-9   | `on: pull_request: branches: [main]` | Trigger: **solo PRs hacia `main`**. No `push` → evita doble run al mergear                                        |
| 11-13 | `concurrency`                        | **Grupo único por PR number**. `cancel-in-progress: true` = cancela run anterior del mismo PR al hacer push nuevo |

> **Por qué `pull_request` y no `push`**: En `push` a `main` (tras merge), `deploy.yml` y `release.yml` toman el control. `ci.yml` valida **antes** de mergear.

### 6.2 Job `changes`: Path Filtering (El Cerebro del Routing)

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 15-41)
jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.client }}
      backend: ${{ steps.filter.outputs.server }}
      e2e: ${{ steps.filter.outputs.e2e }}
      shared: ${{ steps.filter.outputs.shared }}
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v5

      - uses: dorny/paths-filter@v4
        id: filter
        with:
          filters: |
            client:
              - 'apps/client/**'
            server:
              - 'apps/server/**'
            e2e:
              - 'e2e/**'
            shared:
              - 'package.json'
              - 'package-lock.json'
              - '.github/workflows/**'
```

| Sección                  | Explicación                                                                 |
| ------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `runs-on: ubuntu-latest` | Runner GitHub-hosted Linux                                                  |
| `outputs:`               | **4 outputs** que jobs downstream leerán via `needs.changes.outputs.<name>` |
| `timeout-minutes: 5`     | Límite de seguridad (job simple, no debe tardar >5 min)                     |
| `actions/checkout@v5`    | Clona el repo (necesario para `paths-filter` analizar diff)                 |
| `dorny/paths-filter@v4`  | Action que evalúa **qué paths cambiaron** en el PR (base→head)              |
| `id: filter`             | **ID obligatorio** para referenciar `steps.filter.outputs.*`                |
| `filters:` (multilínea ` | `)                                                                          | Mapa YAML: clave = output name, valor = lista de glob patterns |

> **Outputs posibles**: `"true"` o `"false"` (strings, no booleanos). Por eso en `if:` se compara `== 'true'`.

### 6.3 Job `quality`: Reusable Workflow Call

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 43-49)
quality:
  name: Code Quality
  needs: changes
  uses: ./.github/workflows/quality.yml
  with:
    run-client: ${{ needs.changes.outputs.frontend }}
    run-server: ${{ needs.changes.outputs.backend }}
```

| Clave                                   | Qué hace                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `needs: changes`                        | Espera a que `changes` termine (y accede a sus outputs)                                |
| `uses: ./.github/workflows/quality.yml` | **Llama a workflow reutilizable** (local path)                                         |
| `with:`                                 | Pasa **inputs** al reusable workflow (`run-client`, `run-server` = `"true"`/`"false"`) |

> **Ventaja**: `quality.yml` se define **una vez** y se reusa. `ci.yml` decide dinámicamente qué lint/typecheck correr.

### 6.4 Jobs de Test: Condicionales Basados en Path Filtering

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 51-78) — test-unit-client
test-unit-client:
  name: Unit Tests - Client
  needs: changes
  if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read
    checks: write
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0

    - uses: ./.github/actions/setup-monorepo

    - name: Run Client Unit Tests
      run: npm run test:unit --workspace=client-react -- --reporter=junit --outputFile=reports/junit.xml
      shell: bash

    - name: Report Client Unit Tests
      if: success() || failure()
      uses: dorny/test-reporter@v3
      with:
        name: Client Unit Tests
        path: apps/client/reports/junit.xml
        reporter: java-junit
```

**Puntos clave repetidos en todos los test jobs**:

| Patrón                                      | Qué hace                                          | Por qué                           |
| ------------------------------------------- | ------------------------------------------------- | --------------------------------- |
| `needs: changes`                            | Depende de path filtering                         | Accede a outputs para `if:`       |
| `if: needs.changes.outputs.X == 'true' ...` | **Salta job si no hay cambios relevantes**        | Ahorra CI minutos                 |
| `permissions: checks: write`                | Permite subir test results (JUnit) a Checks tab   | `dorny/test-reporter` lo necesita |
| `fetch-depth: 0`                            | Historial completo (necesario para algunos tools) | `changesets`, análisis de diff    |
| `setup-monorepo` (composite action)         | Instala deps, cachea, configura Node              | DRY: usado en 8+ jobs             |
| `dorny/test-reporter@v3`                    | Publica JUnit en GitHub Checks UI                 | Visibilidad inmediata en PR       |

> **Jobs de test en `ci.yml`**: `test-unit-client`, `test-unit-server`, `test-integration`, `test-smoke`, `e2e` — **todos** usan el mismo patrón `needs: changes` + `if:` condicional.

### 6.5 Job `test-integration` y `test-smoke`: Service Containers (PostgreSQL)

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 107-155) — test-integration (extracto)
test-integration:
  name: Integration Tests - Server
  needs: changes
  if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read
    checks: write
  services:
    postgres:
      image: postgres:16-alpine
      ports: ['5432:5432']
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_test
      options: >-
        --health-cmd "pg_isready -U test -d project_one_test"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0

    - uses: ./.github/actions/setup-monorepo

    - name: Prisma Migrate Deploy
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      shell: bash
      working-directory: apps/server

    - name: Run Integration Tests
      run: npm run test:integration --workspace=server-express -- --reporter=junit --outputFile=reports/junit.xml
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      shell: bash

    - name: Report Integration Tests
      if: success() || failure()
      uses: dorny/test-reporter@v3
      with:
        name: Server Integration Tests
        path: apps/server/reports/junit.xml
        reporter: java-junit
```

| Concepto                         | Explicación                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `services:`                      | **Contenedores de servicio** (sidecars) que corren junto al job. Aquí: PostgreSQL 16 efímero |
| `ports: ['5432:5432']`           | Mapea puerto contenedor → host (localhost:5432 accesible desde steps)                        |
| `options:` (health check)        | Docker health check: `pg_isready` cada 10s. Job **espera a healthy** antes de steps          |
| `working-directory: apps/server` | Cambia directorio de trabajo para comandos Prisma/npm                                        |
| `DATABASE_URL` env               | Apunta al service container `localhost:5432` (no host real)                                  |

> **`test-smoke`** (líneas 157-205) es **idéntico** pero corre `npm run test:smoke:ci` (tests de humo rápidos vs integración completa).

### 6.6 Job `build`: Always Runs (Incluso Si Tests Fallan)

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 207-222)
build:
  name: Build
  needs: changes
  if: always()
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0

    - uses: ./.github/actions/setup-monorepo

    - name: Build All Workspaces
      run: npm run build --ws --if-present
      shell: bash
```

| Clave                             | Qué hace                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `if: always()`                    | **Ejecuta SIEMPRE** (salvo cancelación), incluso si `changes` falló o tests fallaron |
| Sin `permissions:`                | Hereda `permissions: contents: read` del workflow root (suficiente para build)       |
| `npm run build --ws --if-present` | Build de **todos los workspaces** (client + server) que tengan script `build`        |

> **Por qué `always()`**: Queremos el artefacto de build (para debug, análisis de bundle size, etc.) aunque tests fallen. El build **no bloquea** el PR (no hay `checks: write` ni reporte).

### 6.7 Job `e2e`: Playwright con Cache de Browsers

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 224-286) — extracto clave
e2e:
  name: E2E Tests
  needs: changes
  if: needs.changes.outputs.e2e == 'true' || needs.changes.outputs.shared == 'true'
  runs-on: ubuntu-latest
  timeout-minutes: 15
  permissions:
    contents: read
    checks: write
  services:
    postgres:
      image: postgres:16-alpine
      ports: ['5432:5432']
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_test
      options: >-
        --health-cmd "pg_isready -U test -d project_one_test"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0

    - uses: ./.github/actions/setup-monorepo

    - name: Prisma Migrate Deploy
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      shell: bash
      working-directory: apps/server

    - name: Cache Playwright Browsers
      id: cache-playwright
      uses: actions/cache@v5
      with:
        path: ~/.cache/ms-playwright
        key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

    - name: Install Playwright with System Dependencies
      if: steps.cache-playwright.outputs.cache-hit != 'true'
      run: npx playwright install --with-deps chromium
      shell: bash
      working-directory: e2e

    - name: Run E2E Tests
      run: npx playwright test --project=chromium --output=test-results
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      shell: bash
      working-directory: e2e

    - name: Report E2E Tests
      if: success() || failure()
      uses: dorny/test-reporter@v3
      with:
        name: E2E Tests
        path: e2e/reports/junit-e2e.xml
        reporter: java-junit
```

| Patrón                                                                   | Qué hace                                            | Por qué importa                     |
| ------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------- |
| `actions/cache@v5`                                                       | Cachea `~/.cache/ms-playwright` (binarios Chromium) | Evita descargar ~150 MB cada run    |
| `key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` | Cache key por OS + lockfile hash                    | Invalida cache solo si cambian deps |
| `if: steps.cache-playwright.outputs.cache-hit != 'true'`                 | Solo instala si **cache miss**                      | Ahorra ~2-3 min en cache hit        |
| `npx playwright install --with-deps chromium`                            | Instala Chromium + deps sistema                     | Necesario en runner limpio          |

### 6.8 Job `zombie-workflow-guard`: Guardia Anti-Zombies

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 288-309)
zombie-workflow-guard:
  name: Zombie Workflow Guard
  runs-on: ubuntu-latest
  timeout-minutes: 2
  steps:
    - uses: actions/checkout@v5

    - name: Assert deleted workflows are absent
      run: |
        if test -f .github/workflows/pr-validation.yml; then
          echo "❌ Zombie workflow pr-validation.yml found - should have been deleted"
          exit 1
        fi
        if test -f .github/workflows/lint.yml; then
          echo "❌ Zombie workflow lint.yml found - should have been deleted"
          exit 1
        fi
        if test -f .github/workflows/formatter.yml; then
          echo "❌ Zombie workflow formatter.yml found - should have been deleted"
          exit 1
        fi
        echo "✅ All zombie workflows confirmed absent"
```

> **Propósito**: **Previene regressions** — asegura que workflows eliminados en limpieza (agosto 2026) no reaparezcan por error (ej. merge conflict mal resuelto). Corre **sin `needs`** → en paralelo con todo, rápido (2 min).

---

## 7. Vistazo a Otros Workflows: Patrones de Trigger/Runner/Context en el Repo

### 7.1 `ci-enterprise.yml` — 8 Jobs, `workflow_dispatch` + `workflow_call`

```yaml
# Source: ../../../.github/workflows/ci-enterprise.yml (líneas 1-15, 16-35)
name: 'Fintech PR CI'

on:
  workflow_dispatch:
  workflow_call:

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  security-events: write

jobs:
  changes: ... # Job 1: paths-filter (frontend/backend only)
  install: ... # Job 2: npm ci (needs: changes)
  lint: ... # Job 3: needs: install
  type-check: ... # Job 4: needs: install
  test: ... # Job 5: needs: install (coverage ≥ 80%)
  build: ... # Job 6: needs: test
  dependency-audit: # Job 7: needs: install (npm audit high)
  codeql: ... # Job 8: needs: install (CodeQL SAST)
```

| Diferencia vs `ci.yml`                                                             | Qué implica                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `on: workflow_dispatch + workflow_call`                                            | **No corre automático** en PR. Se invoca manual o desde otro workflow   |
| `permissions: pull-requests: write, security-events: write`                        | Necesario para CodeQL SARIF upload + PR comments                        |
| 8 jobs en **secuencia lineal** (install → lint/type-check/test/build/audit/codeql) | Pipeline enterprise estricto, sin path filtering granular por tipo test |
| `dorny/paths-filter@v3` (no v4)                                                    | Versión anterior, solo `frontend`/`backend` outputs                     |

### 7.2 `security.yml` — Multi-Job Security Pipeline

```yaml
# Source: ../../../.github/workflows/security.yml (líneas 3-16)
on:
  workflow_call:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

concurrency:
  group: security-${{ github.ref }}
  cancel-in-progress: true

jobs:
  dependency-scan: ... # Trivy SCA (fs scan, SARIF upload)
  sast: ... # CodeQL (JS + Actions)
  secrets: ... # Gitleaks (PR diff only: if: github.event_name == 'pull_request')
  sbom: ... # CycloneDX SBOM (artifact upload 365 días)
  dependency-review: ... # GitHub Dependency Review (PR only)
```

> **Contextos usados**: `github.event_name` en `if:` para `secrets` y `dependency-review` (solo PR). `github.ref` en `concurrency.group`.

### 7.3 `scheduled-security.yml` — Cron Semanal + `workflow_dispatch`

```yaml
# Source: ../../../.github/workflows/scheduled-security.yml (líneas 3-10)
on:
  schedule:
    - cron: '0 3 * * 1' # Monday 03:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  security-events: write

jobs:
  gitleaks-full-scan: ... # fetch-depth: 0, --log-opts="--all" (historial completo)
  notify-failure: # needs: gitleaks-full-scan, if: failure(), crea GitHub Issue
```

> **Diferencia clave vs `security.yml`**: `gitleaks-full-scan` usa `--log-opts="--all"` (historial **completo** del repo) vs `security.yml` usa diff del PR (`base.sha..head.sha`). El cron corre **semanal** para detectar secretos en historial viejo.

### 7.4 `preview.yml` — Concurrencia Dinámica por PR Number

```yaml
# Source: ../../../.github/workflows/preview.yml (líneas 16-18)
concurrency:
  group: ${{ github.event_name == 'pull_request' && format('preview-{0}', github.event.pull_request.number) || 'preview-manual' }}
  cancel-in-progress: true
```

> **Expresión avanzada**: `github.event_name == 'pull_request' ? format('preview-{0}', github.event.pull_request.number) : 'preview-manual'`. Permite **un entorno preview por PR** + runs manuales separados.

### 7.5 `deploy.yml` — Gating con `vars.AWS_ROLE_ARN`, Environments, Job-Level Concurrency

```yaml
# Source: ../../../.github/workflows/deploy.yml (líneas 160-170, 207-219)
ecr-push:
  needs: docker-build
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  permissions:
    id-token: write # ← OBLIGATORIO para OIDC (aws-actions/configure-aws-credentials)
    contents: read

deploy-staging:
  needs: ecr-push
  environment: staging # ← Environment protection rules (approval, secrets)
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  permissions:
    id-token: write
    contents: read
```

| Patrón                                      | Qué hace                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `if: ${{ vars.AWS_ROLE_ARN != '' }}`        | **Gating**: job solo corre si variable configurada (infra AWS existe)                                               |
| `permissions: id-token: write`              | Requerido para **OIDC** (assume role AWS sin credentials estáticas)                                                 |
| `environment: staging/production`           | Vincula job a **GitHub Environment** → secrets aislados, protection rules                                           |
| `concurrency` a **nivel job** (no workflow) | `deploy-staging` y `deploy-production` tienen grupos separados → pueden correr en paralelo si son de runs distintos |

### 7.6 `release.yml` — Changesets, `permissions: contents: write`

```yaml
# Source: ../../../.github/workflows/release.yml (líneas 3-13, 32-38)
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    steps:
      - uses: changesets/action@v2
        with:
          version-script: npm run version:packages
          pr-title: 'chore: version packages' # ← PR title REAL
          commit-message: 'chore: version packages'
```

> **Detalles**: `contents: write` = necesario para crear tags, releases, commitear version bump. `cancel-in-progress: false` = no cancelar release en curso. PR title real: **"chore: version packages"**.

---

## 8. Resumen: Mapa Mental de Conceptos Clave

| Concepto               | Definición Rápida                                 | Ejemplo en Proyecto                                                                                 |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Workflow**           | Archivo `.yml` en `.github/workflows/`            | `ci.yml`, `deploy.yml`, `security.yml` (9 total)                                                    |
| **Job**                | Unidad de ejecución con runner propio             | `changes`, `quality`, `test-unit-client`, `build`, `e2e`                                            |
| **Step**               | Acción (`uses:`) o comando (`run:`) dentro de job | `actions/checkout@v5`, `npm run test:unit`                                                          |
| **Trigger**            | Evento que inicia workflow                        | `pull_request` (ci), `push` (deploy), `schedule` (scheduled-security), `workflow_dispatch` (manual) |
| **Runner**             | Máquina que ejecuta                               | `ubuntu-latest` (todos los jobs del proyecto)                                                       |
| **Expresión `${{ }}`** | Evaluación dinámica en runtime                    | `${{ github.event.pull_request.number }}`, `${{ needs.changes.outputs.frontend }}`                  |
| **Contexto `github`**  | Metadatos del evento/run                          | `github.sha`, `github.ref`, `github.actor`                                                          |
| **Contexto `secrets`** | Credenciales (masked en logs)                     | `secrets.GITHUB_TOKEN`, `secrets.STAGING_DATABASE_URL`                                              |
| **Contexto `vars`**    | Config no sensible                                | `vars.AWS_ROLE_ARN`, `vars.AWS_REGION`                                                              |
| **Contexto `needs`**   | Outputs de jobs upstream                          | `needs.changes.outputs.frontend`                                                                    |
| **Step Output**        | Dato de step para steps posteriores               | `steps.filter.outputs.client`                                                                       |
| **Job Output**         | Dato de job para jobs downstream                  | `needs.changes.outputs.frontend`                                                                    |
| **`if:` condicional**  | Salta job/step si false                           | `if: needs.changes.outputs.frontend == 'true'`                                                      |
| **`needs:`**           | Dependencia entre jobs                            | `needs: changes` → job espera a `changes`                                                           |
| **`concurrency`**      | Control de runs paralelos                         | `group: pr-${{...}}`, `cancel-in-progress: true`                                                    |
| **`permissions`**      | Token GITHUB_TOKEN scope                          | `contents: read`, `checks: write`, `id-token: write`                                                |
| **`services:`**        | Contenedores sidecar (DB, Redis)                  | `postgres:16-alpine` en test jobs                                                                   |
| **Reusable workflow**  | `uses: ./.github/workflows/quality.yml`           | `quality` job en `ci.yml`                                                                           |
| **Composite action**   | `uses: ./.github/actions/setup-monorepo`          | Setup Node + cache + install (DRY)                                                                  |

---

## 9. Siguiente Guía

▶️ ** [`03-secrets-variables.md`](03-secrets-variables.md) ** — Profundizaremos en **Secrets vs Variables de GitHub**, **Environments** (staging/production), **Principio de Mínimo Privilegio**, y el **uso real en el proyecto**: gating con `vars.AWS_ROLE_ARN`, secrets `STAGING_*`/`PROD_*` para ECS task definitions, y referencias a [`../../workflows-mantenimiento-guia.md`](../../workflows-mantenimiento-guia.md) para anti-patterns y casos resueltos.

> 💡 **Por qué este orden**: Entender expresiones y contextos (`github`, `secrets`, `vars`, `needs`) **antes** de ver cómo se configuran y protegen los secrets/variables en GitHub UI y se consumen en workflows.

---

## 🔙 Guía Anterior

> **[01-git-y-yaml.md](./01-git-y-yaml.md)** — Flujo de ramas Git, Pull Requests, Conventional Commits (Husky + commitlint real), sintaxis YAML completa (escalares, listas, mapas, multilínea, anclas).

## 🏠 Volver al Índice

> **[README.md](./README.md)** — Roadmap completo del nivel Fundamentos y navegación a niveles Intermedio/Avanzado/Profesional.

---

_Guía 02 de 5 — Nivel Fundamentos — Cambio OpenSpec `learning-cicd-fundamentos`_
