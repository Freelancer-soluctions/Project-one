# 06 — Walkthrough de `ci.yml`: Los 9 Jobs del Pipeline de CI

> **Guía 06 de 6 del nivel Intermedio** | Prerequisitos: **Nivel Fundamentos completado (guías 00-04) + Guía 05 (Husky git hooks)** | Anterior: [`05-husky-git-hooks.md`](./05-husky-git-hooks.md) | Siguiente: [`07-quality-yml-reusable.md`](./07-quality-yml-reusable.md)

---

## 🎯 Objetivos de aprendizaje

Al terminar esta guía, serás capaz de:

- ✅ **Leer `.github/workflows/ci.yml` línea por línea** y explicar cada uno de sus **9 jobs** (propósito, `needs`, `if`, dependencias)
- ✅ **Explicar el path filtering** con `dorny/paths-filter@v4` (filtros `client`/`server`/`e2e`/`shared`) y cómo sus outputs condicionan el resto del pipeline
- ✅ **Entender el bloque `concurrency`** (`group: pr-<n>`, `cancel-in-progress: true`) y por qué se usa en PRs
- ✅ **Configurar un service container de PostgreSQL 16** con healthcheck (`pg_isready`) y `prisma migrate deploy` antes de los tests
- ✅ **Explicar el reporting JUnit** con Vitest (`--reporter=junit`) + `dorny/test-reporter@v3` adjuntando check runs al PR
- ✅ **Diagnosticar el gotcha `fetch-depth`** (Caso 2 de `docs/workflows-mantenimiento-guia.md`) y por qué `fetch-depth: 0` es opt-in consciente
- ✅ **Razonar sobre el mantenimiento de versiones Node** con el Caso 1 EBADENGINE y el principio `.nvmrc` como única fuente de verdad

---

## 📋 Prerequisitos

1. ✅ **Nivel Fundamentos completado** (guías 00-04) — sabes qué es un workflow, job, step, trigger, runner, secret y un Dockerfile
2. ✅ **Guía 05 (Husky git hooks)** — entiendes el ciclo de vida commit/push y dónde termina lo local vs dónde empieza CI
3. ✅ **Conceptos de testing** — pirámide de tests (unit/integration/E2E), Vitest, Playwright
4. ✅ **YAML** — leer mapas, listas, bloques multilínea (`|`, `>-`), expresiones `${{ }}`

> **Si no completaste Fundamentos o la guía 05:** vuelve a [`./fundamentos-README.md`](./fundamentos-README.md) y a [`./05-husky-git-hooks.md`](./05-husky-git-hooks.md). Esta guía asume fluidez con `actions/checkout`, `actions/setup-node`, `npm ci`, y la estructura básica de un workflow que ya enseñó la guía 02.

---

## 1. Teoría: ¿Qué hace `ci.yml` y por qué tiene 9 jobs?

`ci.yml` es el **workflow de integración continua** del proyecto. Se ejecuta en cada **Pull Request hacia `main`** y orquesta **9 jobs** que cubren el espectro completo de calidad: detección de cambios, calidad de código, tests unitarios, tests de integración, smoke tests, build end-to-end, tests E2E y una guardia anti-zombies.

### 1.1 Los 9 jobs de un vistazo

| #   | Job                     | `needs`   | `if` (cuándo corre)                        | Propósito                                                                  |
| --- | ----------------------- | --------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | `changes`               | —         | siempre                                    | Detectar qué cambió (client/server/e2e/shared) vía `dorny/paths-filter@v4` |
| 2   | `quality`               | `changes` | ( delegado al reusable `quality.yml`)      | Lint + format check + typecheck por workspace (ver guía 07)                |
| 3   | `test-unit-client`      | `changes` | `frontend == 'true' \|\| shared == 'true'` | Tests unitarios del cliente (Vitest + JUnit reporter)                      |
| 4   | `test-unit-server`      | `changes` | `backend == 'true' \|\| shared == 'true'`  | Tests unitarios del servidor                                               |
| 5   | `test-integration`      | `changes` | `backend == 'true' \|\| shared == 'true'`  | Tests de integración con PostgreSQL real (service container)               |
| 6   | `test-smoke`            | `changes` | `backend == 'true' \|\| shared == 'true'`  | Smoke tests del servidor (`test:smoke:ci`)                                 |
| 7   | `build`                 | `changes` | `always()`                                 | Build de todos los workspaces (corre siempre)                              |
| 8   | `e2e`                   | `changes` | `e2e == 'true' \|\| shared == 'true'`      | Tests E2E con Playwright Chromium (navegadores cacheados)                  |
| 9   | `zombie-workflow-guard` | —         | siempre                                    | Verifica que workflows eliminados no reaparezcan                           |

> 💡 **Analogía**: `ci.yml` es una **línea de montaje con 9 estaciones**. La estación `changes` es el **detector de pedidos** (qué se pide fabricar). Las estaciones 2-8 son **talleres especializados** que solo arrancan si el detector dice que hay trabajo para ellos. La estación 9 es el **guardia de seguridad** que comprueba que nadie reintrodujo herramientas retiradas.

### 1.2 Diagrama de dependencias (`needs`)

```mermaid
flowchart TD
    CHG[changes] --> Q[quality reusable]
    CHG --> TUC[test-unit-client]
    CHG --> TUS[test-unit-server]
    CHG --> TI[test-integration]
    CHG --> TS[test-smoke]
    CHG --> B[build<br/>if: always]
    CHG --> E2E[e2e]
    ZWG[zombie-workflow-guard<br/>sin needs]
    style CHG fill:#FFE082
    style B fill:#CDF0EA
    style ZWG fill:#F8BBD0
```

**Observaciones**:

- `zombie-workflow-guard` **no tiene `needs`** → corre en paralelo desde el inicio (es un guardia independiente).
- `build` usa `if: always()` → corre **aunque los tests anteriores fallen**, para validar que el código al menos compila.
- `quality` se invoca como **reusable workflow** (`uses: ./.github/workflows/quality.yml`) — ver guía 07.
- Todos los jobs de test esperan a `changes` (no entre sí) → pueden correr en **paralelo**.

---

## 2. Cabecera del workflow: `name`, `permissions`, `on`, `concurrency`

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 1-13)
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

### 2.1 `permissions: contents: read`

GitHub Actions asigna por defecto un `GITHUB_TOKEN` con permisos amplios. Aquí se restringe a **solo lectura de contenidos** (`contents: read`) a nivel de workflow, siguiendo el principio de **mínimo privilegio** (¿recuerdas la guía 03?). Los jobs que necesitan escribir check runs (`dorny/test-reporter`) **elevan** el permiso localmente con `permissions: checks: write`.

### 2.2 `on: pull_request` hacia `main`

El trigger es **exclusivamente Pull Request hacia `main`**. No corre en `push` a ramas feature (eso queda para los hooks pre-push de la guía 05), ni en `workflow_dispatch` manual (eso es para `quality.yml`).

### 2.3 `concurrency`: cancela runs obsoletos del mismo PR

```yaml
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Qué hace**:

- **`group: pr-<n>`**: agrupa todas las ejecuciones del workflow para el **mismo PR** (identificado por `github.event.pull_request.number`).
- **`cancel-in-progress: true`**: si llega un nuevo push al PR mientras un run anterior está en curso, **se cancela el anterior** y arranca el nuevo.

**Por qué importa**:

- Sin esto, cada `git push --force` al PR encolaría un run nuevo detrás del anterior → desperdicio de minutos de CI y check runs duplicados.
- Con esto, el feedback es **siempre del estado más reciente** del PR.

> ⚠️ **No uses `cancel-in-progress: true` en workflows de `deploy`** — cancelar un deploy a mitad podría dejar infra en estado inconsistente. Aquí es seguro porque es CI (sin side effects beyond check runs).

---

## 3. Job `changes` — El detector de cambios

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 16-41)
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

### 3.1 `dorny/paths-filter@v4`: path filtering

La action [`dorny/paths-filter`](https://github.com/dorny/paths-filter) compara los archivos modificados en el PR contra una lista de **filtros** (globs) y produce un **output booleano** por filtro (`'true'` o `'false'`).

**Filtros definidos**:

| Filtro   | Paths                                                       | Output del step `filter`      |
| -------- | ----------------------------------------------------------- | ----------------------------- |
| `client` | `apps/client/**`                                            | `steps.filter.outputs.client` |
| `server` | `apps/server/**`                                            | `steps.filter.outputs.server` |
| `e2e`    | `e2e/**`                                                    | `steps.filter.outputs.e2e`    |
| `shared` | `package.json`, `package-lock.json`, `.github/workflows/**` | `steps.filter.outputs.shared` |

### 3.2 Outputs del job `changes`: renombrado frontend/backend

```yaml
outputs:
  frontend: ${{ steps.filter.outputs.client }}
  backend: ${{ steps.filter.outputs.server }}
  e2e: ${{ steps.filter.outputs.e2e }}
  shared: ${{ steps.filter.outputs.shared }}
```

> 💡 **Detalle didáctico — naming discrepancy**: el `id: filter` produce outputs llamados **`client`** y **`server`**, pero el job `changes` los **renombra** a **`frontend`** y **`backend`** al exponerlos a los jobs downstream. Verás `needs.changes.outputs.frontend` (no `.client`) en todos los `if:` condicionales. Es una convención del repo: los filtros usan nombres de **carpetas** (`client`/`server`) y los outputs del job usan nombres **semánticos** (`frontend`/`backend`). Si no lo sabes, te confunde al leer los `if:` — por eso se explica aquí.

### 3.3 Otra naming discrepancy: workspaces npm vs paths filesystem

En los jobs de test verás `--workspace=client-react` y `--workspace=server-express`. Estos son los **nombres declarados en `package.json` raíz** (campo `workspaces` con `name` de cada subpaquete). Los paths correspondientes son `apps/client` y `apps/server`. La tabla:

| Workspace npm (`name` en subpaquete) | Path filesystem | Filtro `paths-filter` | Output `changes` |
| ------------------------------------ | --------------- | --------------------- | ---------------- |
| `client-react`                       | `apps/client/`  | `client`              | `frontend`       |
| `server-express`                     | `apps/server/`  | `server`              | `backend`        |

> 📖 **Referencia**: `package.json` raíz, campo `workspaces`. Esta discrepancia de naming es deuda técnica conocida del repo — no te sorprendas si en `ci-enterprise.yml` (guía 09) verás paths distintos (`frontend/`/`backend/`) que no existen aquí.

---

## 4. Job `quality` — Reusable workflow (adelanto guía 07)

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

**Qué hace**:

- **`uses: ./.github/workflows/quality.yml`**: invoca un **workflow reutilizable** del propio repo (no es una action, es un workflow completo).
- **`with:`**: pasa **inputs** al workflow reutilizable (`run-client`, `run-server`) con los outputs de `changes`.
- El workflow `quality.yml` ejecuta lint + format check + typecheck por workspace según esos inputs.

> 📖 **Detalle profundo en la guía 07** ([`07-quality-yml-reusable.md`](./07-quality-yml-reusable.md)) — qué es `workflow_call`, cómo se definen inputs en `quality.yml`, y la distinción reusable workflow vs composite action.

---

## 5. Jobs `test-unit-client` y `test-unit-server` — Tests unitarios co-locados

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 51-78, client; 79-105, server)
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

### 5.1 Desglose del patrón (idéntico en server, con variantes)

| Elemento          | Client                                                                                          | Server                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `if:` condicional | `needs.changes.outputs.frontend == 'true' \|\| needs.changes.outputs.shared == 'true'`          | `backend == 'true' \|\| shared == 'true'`                        |
| `checkout`        | `actions/checkout@v5` con **`fetch-depth: 0`**                                                  | idem                                                             |
| Setup             | `uses: ./.github/actions/setup-monorepo` (composite — ver guía 08)                              | idem                                                             |
| Comando test      | `npm run test:unit --workspace=client-react -- --reporter=junit --outputFile=reports/junit.xml` | `--workspace=server-express ...`                                 |
| Reporte           | `dorny/test-reporter@v3` con `name: Client Unit Tests`, `path: apps/client/reports/junit.xml`   | `name: Server Unit Tests`, `path: apps/server/reports/junit.xml` |
| `permissions` job | `contents: read, checks: write`                                                                 | idem                                                             |
| `if:` del reporte | `success() \|\| failure()`                                                                      | idem                                                             |

### 5.2 ¿Por qué `fetch-depth: 0`? (Gotcha Caso 2, ver sección 10)

Todos los jobs que usan `dorny/test-reporter@v3` hacen `checkout@v5` con **`fetch-depth: 0`** (historial completo, no shallow). Esto se explica en profundidad en la sección 10 (gotcha fetch-depth) — adelanto: el reporter necesita el **merge commit SHA del PR**, que no está disponible con el shallow checkout por defecto (`fetch-depth: 1`).

### 5.3 `if: success() || failure()` en el step de reporte

```yaml
- name: Report Unit Tests
  if: success() || failure()
  uses: dorny/test-reporter@v3
```

`success() || failure()` significa: **ejecuta este step tanto si los tests pasaron como si fallaron**. El único caso en que se omite es si el step de tests fue **cancelado**. La lógica: quieres ver el reporte de tests **fallidos** en el PR para diagnosticarlos, no solo el de los exitosos.

> ⚠️ Si pusieras `if: success()` (sin `|| failure()`), un PR que rompe tests no vería el detalle del failure en la pestaña Checks — tendrías que descargar los logs del runner. **`success() || failure()` es el patrón correcto para reporters de tests.**

### 5.4 `permissions: checks: write` a nivel job

El workflow restringe a `contents: read` arriba, pero `dorny/test-reporter` necesita **escribir check runs** en el PR. El job eleva el permiso localmente:

```yaml
permissions:
  contents: read
  checks: write
```

Sin `checks: write`, el reporter fallaría con 403 al intentar adjuntar el check run. **Mínimo privilegio**: solo los jobs que reportan elevan este permiso.

---

## 6. Jobs `test-integration` y `test-smoke` — Service container PostgreSQL real

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 107-155, integration; 157-205, smoke)
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

### 6.1 Service container `postgres:16-alpine`

GitHub Actions soporta **service containers** — contenedores Docker arrancados junto al job, accesibles en `localhost`. Aquí se arranca **PostgreSQL 16** con config determinista:

| Config              | Valor                                    | Por qué                                                          |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `image`             | `postgres:16-alpine`                     | 16 = versión objetivo del repo; `alpine` = imagen mínima (~80MB) |
| `ports`             | `['5432:5432']`                          | Expone el 5432 del container al runner en `localhost:5432`       |
| `POSTGRES_USER`     | `test`                                   | Usuario de BD determinista (no `postgres` default)               |
| `POSTGRES_PASSWORD` | `test`                                   | Password determinista — no es un secreto real (es CI efímero)    |
| `POSTGRES_DB`       | `project_one_test`                       | BD creada al arrancar el container                               |
| `--health-cmd`      | `pg_isready -U test -d project_one_test` | Comando que comprueba que Postgres responde                      |
| `--health-interval` | `10s`                                    | Comprueba cada 10s                                               |
| `--health-timeout`  | `5s`                                     | timeout por chequeo                                              |
| `--health-retries`  | `5`                                      | 5 fallos consecutivos → container marcado unhealthy → job falla  |

> 💡 **Por qué healthcheck importa**: sin `--health-cmd`, el job empezaría a correr tests **antes** de que Postgres termine de arrancar (puede tardar 3-5s). Los tests fallarían con "connection refused" — falso positivo. El healthcheck garantiza que Postgres está **realmente listo** antes de cualquier step.

### 6.2 `DATABASE_URL` y `prisma migrate deploy`

```yaml
- name: Prisma Migrate Deploy
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
  shell: bash
  working-directory: apps/server
```

- **`DATABASE_URL`**: construido con usuario/password/BD del service container. `localhost` funciona porque el container está en la misma red que el runner.
- **`prisma migrate deploy`**: aplica las migraciones pendientes de `apps/server/prisma/migrations/` a la BD. Es **idempotente** (no aplica migraciones ya aplicadas). Necesario antes de tests porque los tests de integración asumen el schema actual.
- **`working-directory: apps/server`**: Prisma busca `schema.prisma` en el cwd, que está en `apps/server`.

### 6.3 Smoke tests: `test:smoke:ci` (no `test:smoke`)

El job `test-smoke` es **idéntico a `test-integration`** salvo por el comando:

```yaml
- name: Run Smoke Tests
  run: npm run test:smoke:ci --workspace=server-express -- --reporter=junit --outputFile=reports/junit.xml
```

> ⚠️ **Detalle**: el script npm es **`test:smoke:ci`** (variante CI con reporter y config adecuadas para JUnit), no `test:smoke`. Si lo citas mal en una guía o lo invocas localmente, tendrás resultados distintos. Ver `apps/server/package.json` para la definición del script.

### 6.4 ¿Por qué BD real y no mocks?

Los tests de integración y smoke verifican interacción **real con Postgres** — queries SQL, migraciones, constraints, transacciones. Mocks no capturarían:

- Errores de tipo en columnas (p. ej. `Integer` donde Prisma espera `String`)
- Comportamiento de `ON DELETE CASCADE`
- Casos límite de constraints (`UNIQUE`, `FOREIGN KEY`)
- Drift entre `schema.prisma` y migraciones

> 📖 **Pirámide de tests en profundidad**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) — cobertura unit/integration/e2e y por qué se integra con BD real.

---

## 7. Job `build` — `if: always()`

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

### 7.1 `if: always()` — corre aunque los tests fallen

Por defecto, un job con `needs: changes` **se salta** si algún job upstream falló. `if: always()` lo **fuerza a correr sin importar el estado de los jobs anteriores**.

**Por qué aquí**:

- Aunque `test-unit-server` rompa, quieres saber si el código **al menos compila** (`npm run build`).
- Un PR con tests failing pero build passing es distinto (en prioridad de fix) de uno con build failing — el build failing bloquea todo, el test failing puede ser un caso aislado.

### 7.2 `npm run build --ws --if-present`

- **`--ws`** (`--workspaces`): ejecuta el script `build` en **todos los workspaces** (`apps/client`, `apps/server`).
- **`--if-present`**: no falla si un workspace **no tiene** script `build` (p. ej. `e2e` no lo tiene).

Patrón seguro para monorepos heterogéneos — no obligas a cada workspace a definir `build`.

---

## 8. Job `e2e` — Playwright Chromium cacheado

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 224-286)
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

### 8.1 Service container + prisma migrate (igual que integration)

El job `e2e` reutiliza el patrón de `test-integration`: Postgres real + `prisma migrate deploy`. Los E2E prueban la app **completa** contra BD real (ver guía 10).

### 8.2 Cache de navegadores Playwright

```yaml
- name: Cache Playwright Browsers
  id: cache-playwright
  uses: actions/cache@v5
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

- **`path: ~/.cache/ms-playwright`**: donde Playwright guarda Chromium (~300MB).
- **`key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`**: key compuesta por OS + hash del lockfile. Si cambian deps (p. ej. Playwright versión), el hash cambia → cache miss → reinstall.
- **`id: cache-playwright`**: expone `steps.cache-playwright.outputs.cache-hit` para el step siguiente.

### 8.3 Instalación condicional

```yaml
- name: Install Playwright with System Dependencies
  if: steps.cache-playwright.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
  working-directory: e2e
```

- **`if: steps.cache-playwright.outputs.cache-hit != 'true'`**: solo instala si **NO** se restauró el cache. Si hit, se salta (ahorra ~30s de `playwright install`).
- **`--with-deps`**: instala dependencias sistema de Linux para Chromium (librerías gráficas, fuentes).
- **`chromium`**: solo navegador Chromium, no Firefox/WebKit (más rápido, suficiente para CI).

> 📖 **Estrategia de cache en profundidad**: guía 09 ([`09-caching-y-performance.md`](./09-caching-y-performance.md)) — reglas de invalidación, `restore-keys`, lifetime del cache.

### 8.4 Comando de tests E2E

```yaml
- name: Run E2E Tests
  run: npx playwright test --project=chromium --output=test-results
  working-directory: e2e
```

- **`--project=chromium`**: ejecuta solo el project `chromium` definido en `playwright.config.js`.
- **`--output=test-results`**: reporta resultados a `e2e/test-results/`.
- **`working-directory: e2e`**: el config y los tests viven en `e2e/`, no en la raíz.

### 8.5 Path de reporter distinto: `junit-e2e.xml`

```yaml
path: e2e/reports/junit-e2e.xml
```

A diferencia de los tests unit/integration/smoke (que reportan a `apps/*/reports/junit.xml`), el E2E reporta a `e2e/reports/junit-e2e.xml` — distinto archivo para no colisionar con reportes de server en el mismo path.

---

## 9. Job `zombie-workflow-guard` — Guardia anti-zombies

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

### 9.1 ¿Qué es un "zombie workflow"?

Un **zombie workflow** es un archivo `.github/workflows/*.yml` que **se eliminó** (consolidado en `ci.yml` o removido por redundancy) pero que alguien podría **reintroducir por accidente** en un merge. Cada zombie workflow duplicaría runs de CI, generarían check runs fantasmas y romperían la gobernanza.

Los workflows eliminados que se vigilan:

- `pr-validation.yml` — consolidado en `ci.yml`
- `lint.yml` — consolidado en `quality.yml`
- `formatter.yml` — consolidado en `quality.yml`

### 9.2 Sin `needs` — corre en paralelo

El job **no declara `needs`** → GitHub Actions lo arranca **en paralelo** desde el inicio del run, junto con `changes`. Es un guardia que no necesita esperar a nadie.

### 9.3 Implementación `test -f` + `exit 1`

```bash
if test -f .github/workflows/<zombie>.yml; then
  echo "❌ Zombie workflow <zombie>.yml found - should have been deleted"
  exit 1
fi
```

- **`test -f`**: comprueba si el archivo existe (`-f` = es un archivo regular).
- Si existe → `echo` mensaje + `exit 1` → job falla → PR bloqueado.
- Si no existe → sigue al siguiente chequeo.
- Tras los 3 chequeos, si ninguno falló → `echo "✅ All zombie workflows confirmed absent"` y job pasa.

> 💡 **Lección de gobernanza**: este job es **codified policy** — expresa en código una decisión del equipo ("no queremos estos workflows") y la hace cumplir automáticamente. Mejor que un comentario en `docs/` que nadie lee.

---

## 10. Gotcha `fetch-depth` — Caso 2 de `docs/workflows-mantenimiento-guia.md`

### 10.1 El síntoma

```
Run dorny/test-reporter@v3
❌ Error: Exit code 128
Error: fatal: --merge-base object 7a3b9c2... not found in shallow clone
```

`dorny/test-reporter@v3` falla con **exit 128** al intentar adjuntar el check run al PR.

### 10.2 La causa

Por defecto, `actions/checkout@v5` hace **shallow clone** (`fetch-depth: 1`) — solo el último commit del PR, **sin historial**. Para adjuntar el check run al PR, `test-reporter` necesita el **merge commit SHA del PR**, que se calcula con `git merge-base HEAD origin/main`. Ese SHA **no está** en un shallow clone.

### 10.3 El fix: `fetch-depth: 0`

```yaml
- uses: actions/checkout@v5
  with:
    fetch-depth: 0
```

**`fetch-depth: 0`** = historial completo (no shallow). El reporter puede entonces encontrar el merge base.

### 10.4 ¿Por qué opt-in y no default?

`fetch-depth: 0` tiene **costo**: el checkout tarda más (descarga toda la historia). En repos pequeños es despreciable, en repos grandes puede añadir 10-30s. Por eso es **opt-in consciente**: solo se pone `fetch-depth: 0` en los jobs que **realmente lo necesitan** (los que usan `dorny/test-reporter` para adjuntar resultados al PR). No es "por si acaso" — es una decisión informada por la dependencia del reporter.

| Job                       | `fetch-depth`            | ¿Por qué?                                                         |
| ------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `changes`                 | (default 1)              | Solo necesita el diff del PR, `paths-filter` funciona con shallow |
| `quality` (reusable)      | delegado a `quality.yml` | ver guía 07                                                       |
| `test-unit-client/server` | `0`                      | usa `dorny/test-reporter`                                         |
| `test-integration/smoke`  | `0`                      | usa `dorny/test-reporter`                                         |
| `build`                   | `0`                      | aunque no reporta, mantiene patrón para futuros reporters         |
| `e2e`                     | `0`                      | usa `dorny/test-reporter`                                         |
| `zombie-workflow-guard`   | (default 1)              | Solo hace `test -f`, no necesita historial                        |

> 📖 **Detalle histórico del incidente**: [`docs/workflows-mantenimiento-guia.md`](../../../docs/workflows-mantenimiento-guia.md) § "Caso 2 — fetch-depth 128" — incidente real documentado, fix aplicado workflow por workflow.

---

## 11. Caso 1 EBADENGINE — `.nvmrc` como única fuente de verdad

### 11.1 El incidente

En agosto 2026, una dependencia `omniroute@3.8.49` elevó su requisito `engines.node` a `>=22.22.2`. El repo tenía `.nvmrc` con `22.22.0`. Al instalar dependencias, npm lanzó:

```
npm ERR! EBADENGINE
required: {"node":">=22.22.2"}
actual:   {"node":"22.22.0"}
```

CI empezó a fallar en `npm ci` en workflows que fijaban `node-version: 22.22.0` hardcoded.

### 11.2 El fix commit `cf5e1bb`

El fix (commit `cf5e1bb`) actualizó `.nvmrc` a `22.23.1` (versión que cumple `>=22.22.2`) — **un solo cambio centralizado**.

### 11.3 El principio: `.nvmrc` es la única fuente de verdad

Si cada workflow tuviera su propio `node-version: 22.22.0` hardcoded, actualizar Node requeriría editar **N workflows** (drift inevitable: uno se queda atrás, CI falla misteriosamente). Con `.nvmrc` + `setup-node` leyéndolo:

```yaml
- uses: actions/setup-node@v5
  with:
    node-version-file: '.nvmrc'
```

**Un solo punto de actualización** (`.nvmrc`). Todos los workflows referencian ese archivo.

### 11.4 Anti-patrón a evitar

```yaml
# ❌ MAL: hardcode node-version por workflow
- uses: actions/setup-node@v5
  with:
    node-version: 22.22.0 # drift con .nvmrc
```

```yaml
# ✅ BIEN: leer de .nvmrc
- uses: actions/setup-node@v5
  with:
    node-version-file: '.nvmrc'
```

> 📖 **Contexto completo**: [`docs/workflows-mantenimiento-guia.md`](../../../docs/workflows-mantenimiento-guia.md) §3 "Caso 1 — EBADENGINE". Ver también la composite `setup-monorepo` (guía 08) que implementa el patrón correcto.

---

## 12. Reporting JUnit — Vitest + `dorny/test-reporter`

### 12.1 Generar reporte JUnit en Vitest

```bash
npm run test:unit --workspace=server-express -- --reporter=junit --outputFile=reports/junit.xml
```

- **`--reporter=junit`**: formato JUnit XML (estándar que GitHub entiende).
- **`--outputFile=reports/junit.xml`**: archivo donde se escribe el reporte.

Vitest escribe algo parecido a:

```xml
<testsuites>
  <testsuite name="src/modules/users/dao.unit.test.js" tests="4" failures="0" errors="0" time="0.234">
    <testcase classname="dao.unit" name="should find user by id" time="0.054"/>
    ...
  </testsuite>
</testsuites>
```

### 12.2 Adjuntar al PR con `dorny/test-reporter@v3`

```yaml
- name: Report Tests
  if: success() || failure()
  uses: dorny/test-reporter@v3
  with:
    name: Server Unit Tests
    path: apps/server/reports/junit.xml
    reporter: java-junit
```

- **`name`**: nombre del check run visible en la pestaña Checks del PR.
- **`path`**: dónde está el XML.
- **`reporter: java-junit`**: el formato JUnit (Vitest genera JUnit compatible).

El reporter crea un **check run** en el PR con tabla de tests pasados/fallidos, tiempo por suite, y errores detallados. Sin `fetch-depth: 0` (ver sección 10), falla con exit 128.

---

## 13. Ejercicios prácticos

### Ejercicio 1: Traza un PR que solo toca `apps/client/src/Button.tsx`

¿Qué jobs corren? (Respuesta: `changes` (output `frontend=true`), `quality` (run-client), `test-unit-client`, `build`, `zombie-workflow-guard`. **No** corren `test-unit-server`, `test-integration`, `test-smoke`, `e2e` porque `backend=false` y `e2e=false`).

### Ejercicio 2: Traza un PR que solo toca `.github/workflows/ci.yml`

`paths-filter` incluye `.github/workflows/**` en el filtro `shared` → `shared=true`. **Todo** corre (todos los `if:` incluyen `|| shared == 'true'`). Es deliberado: si cambias CI, quieres testearlo todo.

### Ejercicio 3: Diagnostica un `test-reporter` fallido con exit 128

PR aparentemente normal pero los reporters fallan. Síntoma: "fatal: --merge-base ... not found in shallow clone". Causa: `fetch-depth: 1` (default). Fix: añadir `fetch-depth: 0` al `checkout` del job afectado. Ver sección 10.

### Ejercicio 4: Simula el incidente EBADENGINE

```bash
# 1. Modifica .nvmrc a una versión vieja (p. ej. 18.0.0)
echo "18.0.0" > .nvmrc

# 2. npm ci en local con Node 22
npx npm ci
# ¿Aparece EBADENGINE? ¿Por qué?

# 3. Restaura
git checkout .nvmrc
```

---

## ❓ Preguntas frecuentes (FAQ)

### ¿Por qué `zombie-workflow-guard` no tiene `needs`?

Es un guardia independiente. Sin `needs`, GitHub lo arranca en paralelo desde el inicio — feedback más rápido. Si tuviera `needs: changes`, esperaría al detector de cambios (innecesario: solo hace `test -f`, no usa outputs de `changes`).

### ¿Por qué `build` usa `if: always()` y los tests no?

`build` valida que el código compila. Aunque los tests fallen, saber que compila te dice que el bloqueo es **lógica** (no sintaxis). Los tests unit/integration no usan `if: always()` porque si `changes` dice "no hay trabajo para este workspace", se saltan (patrón correcto — no correrlos sería desperdicio).

### ¿Puedo añadir un sexto output de `paths-filter`?

Sí — `dorny/paths-filter` soporta N filtros. Definirías un nuevo filtro (p. ej. `docs: ['docs/**']`) y un nuevo output en el job `changes` (`docs: ${{ steps.filter.outputs.docs }}`). Los jobs downstream usarían `if: needs.changes.outputs.docs == 'true'`.

### ¿Por qué `postgres:16-alpine` y no `postgres:16`?

`alpine` es la variante mínima (musl libc, sin utilidades extra). Arranca más rápido (~1s vs ~3s) y ocupa menos disco. Suficiente para CI donde solo necesitas el servidor Postgres. Para depuración local con shell tools, `postgres:16` ( Debian-based) sería más cómodo.

### ¿Por qué `POSTGRES_PASSWORD: test` si no es secreto?

En CI efímero, la BD se destruye al terminar el job. No hay riesgo de fuga — el container no sale del runner. Usar un valor fijo determinista simplifica la config (no necesitas `secrets.POSTGRES_PASSWORD`). **Nunca** uses este patrón para una BD persistente o compartida — ahí sí necesitas secrets.

---

## 📖 Glosario: `ci.yml`

| Término                        | Definición                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **`paths-filter`**             | Action `dorny/paths-filter@v4` — compara archivos modificados vs filtros y produce outputs booleanos |
| **`needs`**                    | Declara dependencias entre jobs — un job espera a que sus `needs` terminen                           |
| **`if` condicional**           | Expresión que decide si un job/step corre (`needs.changes.outputs.frontend == 'true'`)               |
| **`always()`**                 | Función que fuerza un job a correr sin importar el estado de sus `needs`                             |
| **`success() \|\| failure()`** | Patrón para reporters — corre tanto si tests pasan como fallan                                       |
| **`concurrency`**              | Bloque que agrupa runs y cancela obsoletos (`cancel-in-progress: true`)                              |
| **`service container`**        | Contenedor Docker arrancado junto al job (p. ej. Postgres)                                           |
| **`fetch-depth`**              | Cuántos commits trae `checkout` (`1` = shallow, `0` = full) — `test-reporter` requiere `0`           |
| **`paths-filter` output**      | Booleano `'true'/'false'` producido por filtro                                                       |
| **`zombie workflow`**          | Workflow eliminado que no debe reaparecer — vigilado por `zombie-workflow-guard`                     |
| **`EBADENGINE`**               | Error npm cuando `engines.node` de una dep no cumple con versión instalada                           |
| **`.nvmrc` SSOT**              | Principio: `.nvmrc` es la única fuente de Node versión, workflows la leen no la hardcodean           |
| **JUnit reporter**             | Formato XML estándar para resultados de tests                                                        |
| **`dorny/test-reporter`**      | Action que adjunta reportes JUnit como check runs al PR                                              |

---

## ✅ Checklist de completitud: Guía 06

Antes de pasar a la siguiente guía, verifica que puedes:

- [ ] Listar los 9 jobs de `ci.yml` con su `needs` y `if` de memoria
- [ ] Explicar `concurrency.group: pr-<n>` + `cancel-in-progress: true`
- [ ] Desglosar `dorny/paths-filter@v4` y el renombrado `client`→`frontend`/`server`→`backend` en outputs
- [ ] Explicar la naming discrepancy workspaces npm (`client-react`/`server-express`) vs paths (`apps/client`/`apps/server`)
- [ ] Explicar el job `quality` como reusable workflow (`uses:` vs `run:`)
- [ ] Desglosar un job de test (checkout, composite setup-monorepo, test command, reporter) con `if: success() || failure()` y `permissions: checks: write`
- [ ] Configurar un service container `postgres:16-alpine` con healthcheck `pg_isready`
- [ ] Explicar `prisma migrate deploy` antes de tests y por qué `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_test`
- [ ] Diferenciar `test:integration` vs `test:smoke:ci` (script CI específico)
- [ ] Explicar `build` con `if: always()` y `npm run build --ws --if-present`
- [ ] Desglosar el cache de Playwright y la instalación condicional (`if: cache-hit != 'true'`)
- [ ] Explicar `zombie-workflow-guard`: sin `needs`, `test -f`, corrige gobernanza anti-zombies
- [ ] Diagnosticar el gotcha fetch-depth (exit 128, shallow clone, fix `fetch-depth: 0`)
- [ ] Explicar el Caso 1 EBADENGINE y el principio `.nvmrc` SSOT

---

## 🔙 Anterior

> **[`./05-husky-git-hooks.md`](./05-husky-git-hooks.md)** — Hooks locales pre-commit/commit-msg/pre-push

## ➡️ Siguiente

> **[`./07-quality-yml-reusable.md`](./07-quality-yml-reusable.md)** — Workflows reutilizables con `workflow_call`: `quality.yml` línea por línea, inputs `run-client`/`run-server`, distinción reusable workflow vs composite action, y el gotcha typecheck-skipped (D8).

## 🏠 Índice

> **[`./intermedio-README.md`](./intermedio-README.md)** — Índice del nivel Intermedio (guías 05-10)

---

_Parte del cambio OpenSpec `learning-cicd-intermedio` — Nivel Intermedio, Guía 06 de 6_
