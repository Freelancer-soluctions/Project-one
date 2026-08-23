# 10 — Testing Pipeline: la pirámide de tests en CI

> **Guía 10 de 6 del nivel Intermedio (última)** | Prerequisitos: **Fundamentos (00-04) + Guías 06 (ci.yml), 07 (reusable), 08 (composite) y 09 (caching)** | Anterior: [`09-caching-y-performance.md`](./09-caching-y-performance.md) | Siguiente: [Volver al índice intermedio](./intermedio-README.md)

---

## 🎯 Objetivos de aprendizaje

Al terminar esta guía (y con ella el nivel Intermedio), serás capaz de:

- ✅ **Explicar la pirámide de tests** (unit / integración / E2E) y cómo se distribuye en el CI del proyecto
- ✅ **Explicar el path filtering por workspace**: cómo los outputs de `dorny/paths-filter` deciden qué jobs de test corren
- ✅ **Desglosar los tests unitarios co-locados**: jobs `test-unit-client` y `test-unit-server` con reporter JUnit
- ✅ **Explicar los tests de integración con PostgreSQL real**: service container `postgres:16-alpine`, `prisma migrate deploy`, `DATABASE_URL`, y por qué BD real en vez de mocks
- ✅ **Explicar los smoke tests**: `vitest.smoke.config.js` y el job `test-smoke`
- ✅ **Desglosar los E2E con Playwright**: job `e2e`, Chromium con navegadores cacheados, `playwright test --project=chromium`
- ✅ **Explicar el reporting JUnit al PR**: `dorny/test-reporter@v3` adjuntando check runs y su dependencia con `fetch-depth: 0`
- ✅ **Ver el pipeline de testing completo como un sistema** que une todo lo aprendido en el nivel

---

## 📋 Prerequisitos

1. ✅ **Fundamentos completado (00-04)** — sabes qué es un workflow, job, step, runner, secrets y cómo se declaran
2. ✅ **Guía 06 (`ci.yml`)** — viste los jobs de test en el walkthrough de los 9 jobs (secciones de test-unit, test-integration, test-smoke y e2e)
3. ✅ **Guía 07 (reusable workflows)** — entendiste cómo `quality.yml` se invoca desde `ci.yml` con inputs
4. ✅ **Guía 08 (composite actions)** — sabes qué hace `setup-monorepo` y por qué los jobs la invocan tras el checkout
5. ✅ **Guía 09 (caching)** — entendiste los caches de Vitest y Playwright que aceleran los jobs de test
6. ✅ **`docs/testing-architecture.md`** — el documento de referencia de la estrategia de testing del repo (se lee enlazado, no se duplica)

> **Si no hiciste las guías anteriores**: esta guía asume que ya leíste `ci.yml` (guía 06). Si no, vuelve a [`./06-ci-yml-walkthrough.md`](./06-ci-yml-walkthrough.md) antes de continuar — aquí desglosamos los jobs de test, no los 9 jobs completos.

---

## 1. Teoría: la pirámide de tests

### 1.1 ¿Qué es la pirámide de tests?

La **pirámide de tests** es un modelo de distribución de pruebas propuesto por Mike Cohn que organiza los tests en capas según su velocidad, costo y cantidad:

```mermaid
flowchart TD
    E2E["E2E (Playwright)\n🎯 pocos, lentos, caros"]
    INT["Integración (Vitest + PostgreSQL real)\n🔗 algunos, medianos"]
    UNIT["Unit (Vitest, co-locados)\n⚡ muchos, rápidos, baratos"]

    UNIT --> INT --> E2E

    style E2E fill:#FFCDD2,stroke:#c62828
    style INT fill:#FFE082,stroke:#ef6c00
    style UNIT fill:#C8E6C9,stroke:#2e7d32
```

| Capa            | Qué prueba                                    | Velocidad    | Costo de mantenimiento | Cantidad ideal                      |
| --------------- | --------------------------------------------- | ------------ | ---------------------- | ----------------------------------- |
| **Unit**        | Una función/módulo aislado, sin I/O externa   | Milisegundos | Bajo                   | **Muchos** (la base de la pirámide) |
| **Integración** | Varios módulos colaborando + BD real + HTTP   | Segundos     | Medio                  | **Algunos** (el cuerpo)             |
| **E2E**         | El flujo completo como usuario: UI + API + BD | Minutos      | Alto                   | **Pocos** (la punta)                |

**Por qué tiene forma de pirámide**: quieres MUCHOS tests baratos y rápidos (unit) y POCOS tests caros y lentos (E2E). Si la pirámide se invierte (muchos E2E, pocos unit), el CI se vuelve lento, frágil y caro.

> 📖 **Referencia**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) sección 4 — "Capas de Testing" (4.1 Unit, 4.2 Integration, 4.3 E2E, 4.4 UI/Storybook). Esta guía **enlaza** a ese documento; no lo copia. La sección 3 del mismo doc describe la estrategia global.

### 1.2 La distribución en CI: una pirámide por job

El proyecto traduce la pirámide a **jobs separados** en `ci.yml`. Cada capa tiene su propio job (o dos, por workspace), con su propio time limit y su propio reporte:

| Capa        | Job(s) en `ci.yml` | Runner        | Dependencias externas                         |
| ----------- | ------------------ | ------------- | --------------------------------------------- |
| Unit client | `test-unit-client` | ubuntu-latest | Ninguna (solo deps)                           |
| Unit server | `test-unit-server` | ubuntu-latest | Ninguna (solo deps)                           |
| Integración | `test-integration` | ubuntu-latest | **PostgreSQL 16** (service container)         |
| Smoke       | `test-smoke`       | ubuntu-latest | **PostgreSQL 16** (service container)         |
| E2E         | `e2e`              | ubuntu-latest | **PostgreSQL 16** + **Chromium** (Playwright) |

**Por qué separar por job y no en un solo job**: 1) **paralelismo** — los jobs corren en runners distintos a la vez; 2) **aislamiento de fallos** — un test unit roto no tapa un fallo de integración; 3) **path filtering granular** — si solo cambias el frontend, no corres los tests de integración del server (sección 3); 4) **reportes independientes** — cada capa adjunta su check run al PR (sección 7).

### 1.3 La jerarquía de velocidad: timeouts

Los `timeout-minutes` de cada job reflejan la jerarquía de la pirámide:

| Job                | timeout-minutes | Por qué                                               |
| ------------------ | --------------- | ----------------------------------------------------- |
| `test-unit-client` | 10              | Tests rápidos, suite grande pero sin I/O              |
| `test-unit-server` | 10              | Igual que client                                      |
| `test-integration` | 10              | Incluye arranque de BD + migraciones                  |
| `test-smoke`       | 10              | Suite corta pero con BD real                          |
| `e2e`              | 15              | El más lento: arranca BD + navegador + flujo completo |

> 💡 **Analogía**: si la pirámide es una **escalera**, cada peldaño tiene su propio rellano (job) con su propio límite de tiempo. Subir un peldaño no bloquea los demás — corren en paralelo en runners independientes.

### 1.4 ¿Qué tests corren "siempre" y cuáles "solo cuando toca"?

Gracias al path filtering (sección 3), el CI **no corre todo en cada PR**:

- Cambias solo `apps/client/**` → corren unit-client (+ quality client) y build.
- Cambias solo `apps/server/**` → corren unit-server, integración, smoke (+ quality server) y build.
- Cambias solo `e2e/**` → corre el job `e2e`.
- Cambias `package.json`/lockfile/`.github/workflows/**` (shared) → corren **todos** (porque el cambio afecta a todos).

Este es el mecanismo que hace el CI del proyecto **escalable**: más tests no significan necesariamente más tiempo de CI por PR.

---

## 2. El pipeline de testing: los 6 jobs de test en contexto

### 2.1 El flujo completo de ci.yml (los 9 jobs)

```mermaid
flowchart LR
    C["changes\n(paths-filter)"] --> Q["quality"]
    C --> U1["test-unit-client"]
    C --> U2["test-unit-server"]
    C --> I["test-integration"]
    C --> S["test-smoke"]
    C --> B["build"]
    C --> E["e2e"]
    E --> Z["zombie-workflow-guard"]

    style C fill:#BBDEFB,stroke:#1565c0
    style U1 fill:#C8E6C9,stroke:#2e7d32
    style U2 fill:#C8E6C9,stroke:#2e7d32
    style I fill:#C8E6C9,stroke:#2e7d32
    style S fill:#C8E6C9,stroke:#2e7d32
    style E fill:#FFE082,stroke:#ef6c00
```

> 📖 **Referencia**: viste este diagrama en la guía 06 (sección 1.2). Aquí nos enfocamos en los **jobs de test** (unit, integración, smoke, e2e) y el reporting.

### 2.2 La familia de jobs de test

| Job                | Workspace(s)     | Comando real                                          | Dependencia externa      | Reporte                         |
| ------------------ | ---------------- | ----------------------------------------------------- | ------------------------ | ------------------------------- |
| `test-unit-client` | `client-react`   | `npm run test:unit --workspace=client-react`          | —                        | `apps/client/reports/junit.xml` |
| `test-unit-server` | `server-express` | `npm run test:unit --workspace=server-express`        | —                        | `apps/server/reports/junit.xml` |
| `test-integration` | `server-express` | `npm run test:integration --workspace=server-express` | PostgreSQL 16            | `apps/server/reports/junit.xml` |
| `test-smoke`       | `server-express` | `npm run test:smoke:ci --workspace=server-express`    | PostgreSQL 16            | `apps/server/reports/junit.xml` |
| `e2e`              | `e2e`            | `npx playwright test --project=chromium`              | PostgreSQL 16 + Chromium | `e2e/reports/junit-e2e.xml`     |

### 2.3 El patrón común de todos los jobs de test

Los 5 jobs de test siguen exactamente el mismo esqueleto de 4 pasos:

```yaml
# Source: ../../../.github/workflows/ci.yml (patrón de los 5 jobs de test)
steps:
  - uses: actions/checkout@v5
    with:
      fetch-depth: 0 # 1. Clonado completo (Caso 2 — sección 7)

  - uses: ./.github/actions/setup-monorepo # 2. Setup: node + npm ci + cache Vitest

  - name: Run <X> Tests # 3. Ejecutar los tests con reporter JUnit
    run: npm run test:<capa> --workspace=<ws> -- --reporter=junit --outputFile=reports/junit.xml
    shell: bash

  - name: Report <X> Tests # 4. Adjuntar el reporte JUnit al PR
    if: success() || failure()
    uses: dorny/test-reporter@v3
    with:
      name: <X> Tests
      path: <workspace>/reports/junit.xml
      reporter: java-junit
```

Este es el **patrón que tú replicarás** cuando añadas un job de test nuevo: checkout con `fetch-depth: 0` → `setup-monorepo` → correr con `--reporter=junit` → reportar con `dorny/test-reporter@v3`. Las variaciones entre capas están en el **comando** y en las **dependencias externas** (service container).

---

## 3. Path filtering por workspace: qué tests corren

### 3.1 El job `changes` como "semáforo"

El job `changes` es el **semáforo** del pipeline: decide quién corre. Usa `dorny/paths-filter@v4` para detectar qué paths cambiaron en el PR:

```yaml
# Source: ../../../.github/workflows/ci.yml (job changes, líneas 15-41)
changes:
  name: Detect Changes
  runs-on: ubuntu-latest
  outputs:
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

**Puntos clave**:

1. **El filtro `client` produce el output `frontend`** — fíjate en el mapeo: el filtro se llama `client` (patrón `apps/client/**`) pero su output se expone como `frontend`. Es una **inconsistencia de nombres real del repo** (el filtro usa `client`, el output usa `frontend`): didácticamente útil para aprender a leer outputs que no siempre coinciden con los nombres de los filtros.
2. **El filtro `shared` captura cambios que afectan a todos**: `package.json`, `package-lock.json` y `.github/workflows/**`. Si cambia el lockfile, todo el mundo se re-instala → todos los jobs corren.
3. **`dorny/paths-filter@v4` hace un diff contra la rama base** del PR (usa el checkout completo, por eso `changes` NO usa `fetch-depth: 0` — con un solo commit basta para el diff contra `origin/main`).

### 3.2 Cómo los outputs condicionan los jobs

Cada job de test declara su condición con `if:` + `needs: changes`:

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-unit-client)
test-unit-client:
  name: Unit Tests - Client
  needs: changes
  if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
```

| Job                | Condición de ejecución | Lógica                              |
| ------------------ | ---------------------- | ----------------------------------- | ----------------- | ---------------------------------------------------- |
| `test-unit-client` | `frontend == 'true'    |                                     | shared == 'true'` | Cambió el client **o** algo compartido               |
| `test-unit-server` | `backend == 'true'     |                                     | shared == 'true'` | Cambió el server **o** algo compartido               |
| `test-integration` | `backend == 'true'     |                                     | shared == 'true'` | Igual que unit-server (el server es el que tiene BD) |
| `test-smoke`       | `backend == 'true'     |                                     | shared == 'true'` | Igual                                                |
| `e2e`              | `e2e == 'true'         |                                     | shared == 'true'` | Cambió e2e **o** algo compartido                     |
| `build`            | `if: always()`         | **Siempre** corre (ver sección 3.4) |

### 3.3 El diagrama de decisión

```mermaid
flowchart TD
    PR["PR contra main"] --> CH["changes\npaths-filter"]
    CH -->|"client/**"| F["frontend: true"]
    CH -->|"server/**"| B["backend: true"]
    CH -->|"e2e/**"| E["e2e: true"]
    CH -->|"package*.json\n.github/workflows"| S["shared: true"]

    F -->|"true"| U1["test-unit-client"]
    B -->|"true"| U2["test-unit-server"]
    B -->|"true"| I["test-integration"]
    B -->|"true"| SM["test-smoke"]
    E -->|"true"| E2E["e2e"]
    S -->|"true"| ALL["todos los jobs"]

    style CH fill:#BBDEFB,stroke:#1565c0
    style ALL fill:#FFE082,stroke:#ef6c00
```

### 3.4 El caso especial de `build`: `if: always()`

El job `build` usa `if: always()` — corre **siempre**, sin importar los outputs de `changes`. ¿Por qué?

```yaml
# Source: ../../../.github/workflows/ci.yml (job build, líneas 207-211)
build:
  name: Build
  needs: changes
  if: always()
```

**Razón**: el build es el **control final de integridad** del repo. Aunque un PR solo toque documentación, el build valida que el monorepo sigue compilando. Además, `if: always()` significa que corre incluso si el job `changes` fallara (p. ej. por un error de paths-filter) — el build actúa como **red de seguridad** que nunca se salta silenciosamente.

> ⚠️ **Ojo**: `if: always()` NO significa "corre solo si algo falló". Significa "corre siempre, sin evaluar el estado de las dependencias". Se combina con `needs: changes` (espera a que `changes` termine) pero ignora su resultado.

---

## 4. Tests unitarios co-locados: `test-unit-client` y `test-unit-server`

### 4.1 El patrón "co-located"

Los tests unitarios del proyecto siguen el patrón **co-located**: el archivo de test vive **junto al archivo que prueba**.

```plaintext
# Server (apps/server/src)
src/modules/events/attendee/
  service.js
  service.unit.test.js          # ✅ co-locado junto al source
  event-rsvp-register.unit.test.js
```

```plaintext
# Client (apps/client/src)
src/components/Button/
  Button.tsx
  Button.test.tsx               # ✅ co-locado (o .unit.test.js según workspace)
```

> 📖 **Referencia**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) sección 8 — "Organización de Tests: Enfoque Híbrido (Consenso 2025-2026)". El repo adoptó el híbrido: unit co-locados + integración centralizados por módulo en `tests/integration/<modulo>/` + E2E en `e2e/tests/`. Las sub-secciones 8.1-8.4 explican la comparación colocated vs centralized y el consenso.

**Por qué co-locar**:

1. **Descubribilidad**: el test está al lado del código que prueba — no hay que adivinar dónde buscar.
2. **Refactor seguro**: mueves el source → mueves su test con él (el diff del PR lo muestra todo).
3. **Fricción mínima**: al abrir un módulo ves sus tests sin navegar a otra carpeta.

### 4.2 Cómo descubre Vitest los tests unitarios

Los scripts de test usan **filtros por substring del nombre de archivo**, no por carpeta:

```json
// Source: apps/server/package.json (scripts de test)
{
  "test:unit": "vitest run \".unit.test.js\"",
  "test:integration": "vitest run \".integration.test.js\""
}
```

Esto funciona con la disposición híbrida: Vitest recorre el árbol y solo ejecuta los archivos cuyo nombre contiene `.unit.test.js` (para unit) o `.integration.test.js` (para integración). No importa si están en `src/` o en `tests/` — el filtro es por patrón de nombre.

> 💡 **Convención de nombres del repo** (de `docs/testing-architecture.md` sección 7): `*.unit.test.js` = unit co-locado; `*.integration.test.js` = integración en `tests/integration/<modulo>/`; `*.test.js` a secas se evita (no comunica intención).

### 4.3 El job `test-unit-client` desglosado

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-unit-client, líneas 51-77)
test-unit-client:
  name: Unit Tests - Client
  needs: changes
  if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read
    checks: write # ← necesario para adjuntar el check run al PR
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

**Desglose paso a paso**:

| Elemento                                             | Qué hace                                          | Por qué                                                                                |
| ---------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `permissions: checks: write`                         | Permiso para crear/actualizar check runs en el PR | `dorny/test-reporter` necesita escribir checks                                         |
| `fetch-depth: 0`                                     | Historial completo del repo                       | Requisito del Caso 2 (sección 7) — sin esto, `test-reporter` puede fallar con exit 128 |
| `setup-monorepo`                                     | Node (.nvmrc) + `npm ci` + cache Vitest           | Setup estándar del repo (guía 08)                                                      |
| `npm run test:unit --workspace=client-react`         | Ejecuta los tests unit del workspace client       | `--workspace` delega al workspace correcto                                             |
| `-- --reporter=junit --outputFile=reports/junit.xml` | Genera el reporte JUnit                           | El `--` extra pasa los flags a Vitest (no a npm)                                       |
| `if: success()                                       |                                                   | failure()`                                                                             | Reporta **incluso si los tests fallan** | Un check run con tests rojos es tan valioso como uno verde |

### 4.4 El job `test-unit-server` — idéntico, otro workspace

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-unit-server, líneas 79-105)
test-unit-server:
  name: Unit Tests - Server
  needs: changes
  if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'
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

    - name: Run Server Unit Tests
      run: npm run test:unit --workspace=server-express -- --reporter=junit --outputFile=reports/junit.xml
      shell: bash

    - name: Report Server Unit Tests
      if: success() || failure()
      uses: dorny/test-reporter@v3
      with:
        name: Server Unit Tests
        path: apps/server/reports/junit.xml
        reporter: java-junit
```

**Diferencias con el client** (solo 3):

1. Workspace: `server-express` en vez de `client-react`.
2. Condición: `backend` en vez de `frontend`.
3. Path del reporte: `apps/server/reports/junit.xml` en vez de `apps/client/...`.

**El resto es idéntico** — ese es el punto: el patrón se repite porque está bien diseñado. Cuando añadas un workspace nuevo, copia este job, cambia 3 líneas y listo.

> 💡 **Por qué los unit tests NO necesitan service container**: los tests unitarios aíslan el módulo (mockean sus dependencias: BD, HTTP, etc.). No tocan PostgreSQL real — eso es trabajo de la capa de integración (sección 5). Sin BD, sin service container, sin `prisma migrate deploy`.

---

## 5. Tests de integración con PostgreSQL real

### 5.1 La diferencia clave con los unit tests

Un test de integración prueba **varios módulos colaborando** y toca **I/O real**: la base de datos. Mientras el test unit mockea el DAO, el test de integración usa **PostgreSQL real** levantado en un service container.

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-integration, líneas 107-128)
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
```

### 5.2 Anatomía del service container

| Bloque                      | Qué define                                                | Detalle                                                                      |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `image: postgres:16-alpine` | Imagen Docker de PostgreSQL 16 (variante alpine = ligera) | La misma versión de producción (ver `docs/cicd-estado-actual.md`)            |
| `ports: ['5432:5432']`      | Mapea el puerto del container al runner                   | El job accede a `localhost:5432`                                             |
| `env`                       | Credenciales de la BD de test                             | `test`/`test`/`project_one_test` — **solo para CI**, nunca las de producción |
| `options`                   | Flags de Docker para el healthcheck                       | `pg_isready` confirma que Postgres acepta conexiones                         |

**El healthcheck es crítico**: GitHub espera a que el container esté "healthy" antes de correr el job. `pg_isready -U test -d project_one_test` verifica que PostgreSQL acepte conexiones con esas credenciales. Sin healthcheck, los tests podrían correr **antes** de que la BD esté lista → fallos intermitentes "flaky" difíciles de diagnosticar.

> 📖 **Referencia**: viste el mismo patrón en la guía 06 (sección 6). Aquí profundizamos en el _por qué_ de la BD real.

### 5.3 `prisma migrate deploy`: el esquema antes que los tests

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-integration, líneas 136-141)
- name: Prisma Migrate Deploy
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
  shell: bash
  working-directory: apps/server
```

**Orden obligatorio**: la BD debe tener el esquema **antes** de correr los tests. `prisma migrate deploy` aplica las migraciones pendientes a la BD de test. Sin este paso, los tests de integración fallarían con tablas inexistentes.

**`DATABASE_URL` apunta al service container**: `postgresql://test:test@localhost:5432/project_one_test` — el mismo `test:test@localhost:5432` del service container. El job pasa la URL como variable de entorno para que Prisma y los tests se conecten a la BD correcta.

> ⚠️ **Por qué `migrate deploy` y no `migrate dev`**: `migrate deploy` solo aplica migraciones existentes (no genera ninguna, no hace seed interactivo) — es la operación correcta para CI. `migrate dev` es para desarrollo local.

### 5.4 Por qué BD real en vez de mocks

| Aspecto                 | Mocks de BD (in-memory, fake)                                                                 | BD real (service container)                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Fidelidad**           | Baja — el mock no replica el comportamiento de PostgreSQL (constraints, transacciones, tipos) | Alta — pruebas contra el motor real                          |
| **Errores que detecta** | Solo los de lógica del código                                                                 | También los de SQL, constraints, migraciones, tipos de datos |
| **Velocidad**           | Rápida                                                                                        | Más lenta (arranque + migraciones)                           |
| **Determinismo**        | Depende de la fidelidad del mock                                                              | Depende de la migración (reproducible)                       |
| **Costo en CI**         | Barato                                                                                        | ~20-40 s extra por job (container + migrate)                 |

**La decisión del repo**: usar **BD real en la capa de integración** porque es ahí donde los bugs de SQL, constraints y migraciones se manifiestan. Los mocks quedan para la capa unit (donde aíslas el módulo). Es la aplicación correcta de la pirámide: mockea en la base, usa lo real en el cuerpo.

> 📖 **Referencia**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) sección 9 — "Estrategia de Mocks" (9.1 Principios, 9.2 Qué se mockea, 9.3 Estrategia por tipo de test). El principio: "no mockees lo que estás probando; mockea lo que no estás probando".

### 5.5 El job `test-integration` completo

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-integration, líneas 129-155)
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

**La diferencia con `test-unit-server` son 2 pasos extra**: el service container (declarado a nivel de job) y `prisma migrate deploy` + `DATABASE_URL`. Todo lo demás — checkout, setup-monorepo, reporter JUnit — es el mismo esqueleto.

---

## 6. Smoke tests: `vitest.smoke.config.js` y el job `test-smoke`

### 6.1 Qué son los smoke tests

Los **smoke tests** son una capa entre integración y E2E: verifican que los **flujos críticos** del sistema funcionan de punta a punta **sin** el costo de un navegador. Son tests de integración "seleccionados" que cubren las APIs más importantes del server.

> 📖 **Referencia**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) sección 12 — "Smoke Testing" (12.1 Qué son, 12.2 Ubicación, 12.3 Ejecución, 12.4 APIs cubiertas, 12.5 Integración CI). Esta guía se enfoca en el job de CI.

**Analogía**: los smoke tests son como **encender el coche y comprobar que el motor arranca** antes de salir a la carretera (E2E). No prueban cada detalle — prueban que el sistema "está vivo" y responde.

### 6.2 La configuración: `vitest.smoke.config.js`

```js
// Source: ../../../apps/server/vitest.smoke.config.js (archivo completo)
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedConfig from '../../vitest.shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      root: __dirname,
      environment: 'node',
      include: ['tests/smoke/**/*.smoke.test.js'],
      testTimeout: 15000,
      hookTimeout: 10000,
      // pool: 'forks', // inherited from shared
      // singleFork: true, // smoke tests don't need strict isolation
    },
  })
);
```

**Desglose**:

| Opción                                        | Qué hace                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `mergeConfig(sharedConfig, ...)`              | Hereda la config compartida del monorepo (`vitest.shared.js`) y añade/sobrescribe |
| `root: __dirname`                             | El root de Vitest es `apps/server` (donde vive este config)                       |
| `environment: 'node'`                         | Entorno Node (no jsdom) — los smoke tests golpean la API real                     |
| `include: ['tests/smoke/**/*.smoke.test.js']` | **Solo** ejecuta los archivos `*.smoke.test.js` en `tests/smoke/`                 |
| `testTimeout: 15000`                          | 15 s por test — los smoke tests pueden incluir esperas de red/BD                  |
| `hookTimeout: 10000`                          | 10 s para hooks (`beforeAll`, `afterAll`) — p. ej. setup de BD                    |

**El `include` es la clave**: este config **no** ejecuta los tests unit ni de integración — solo los smoke. Es un "modo de ejecución" del mismo proyecto Vitest con un subconjunto de archivos.

### 6.3 El job `test-smoke` en `ci.yml`

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-smoke, líneas 157-205)
test-smoke:
  name: Smoke Tests - Server
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

    - name: Run Smoke Tests
      run: npm run test:smoke:ci --workspace=server-express -- --reporter=junit --outputFile=reports/junit.xml
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      shell: bash

    - name: Report Smoke Tests
      if: success() || failure()
      uses: dorny/test-reporter@v3
      with:
        name: Server Smoke Tests
        path: apps/server/reports/junit.xml
        reporter: java-junit
```

**Es el mismo esqueleto que `test-integration`** — service container + migrate + tests + reporte — con una sola diferencia: el comando usa `test:smoke:ci` (que apunta a `vitest.smoke.config.js`) en vez de `test:integration`.

### 6.4 ¿Por qué un job separado para smoke y no incluirlos en integración?

| Razón                        | Explicación                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Velocidad de feedback**    | El smoke es una suite corta (15 s por test) que valida los flujos críticos rápido; si el server está roto en lo esencial, lo sabes sin esperar la suite de integración completa |
| **Aislamiento**              | Un fallo de un smoke test crítico (p. ej. health endpoint) se ve como un check run propio "Server Smoke Tests", no enterrado entre 200 tests de integración                     |
| **Iteración**                | El pipeline tiene una "canaria" barata: si el smoke falla, sabes que es un problema de raíz (server + BD), no de un test puntual                                                |
| **Filosofía de la pirámide** | Cada capa es un "por si acaso" del anterior: unit → integración → smoke → e2e. El smoke es el filtro previo al E2E caro                                                         |

---

## 7. E2E con Playwright: el job `e2e`

### 7.1 Qué son los E2E en este repo

Los tests E2E viven en la carpeta `e2e/` del monorepo (top-level, no dentro de un workspace de app) y usan **Playwright**. Prueban el sistema como lo usaría un usuario real: abren el navegador, interactúan con la UI y verifican flujos completos (UI + API + BD).

> 📖 **Referencia**: [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) sección 15 — "E2E Setup Guide (Playwright)": stack (15.1), estructura de tests (15.2), configuración `e2e/playwright.config.js` (15.3), Page Object Model (15.4), ejecución (15.5) y cobertura (15.6).

### 7.2 El job `e2e` desglosado

```yaml
# Source: ../../../.github/workflows/ci.yml (job e2e, líneas 224-286)
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

### 7.3 Los elementos específicos de E2E

| Elemento                    | Qué hace                                                         | Referencia             |
| --------------------------- | ---------------------------------------------------------------- | ---------------------- |
| `timeout-minutes: 15`       | El timeout más alto de los jobs de test (el E2E es el más lento) | Sección 1.3            |
| Service container postgres  | El E2E también necesita BD real (la app guarda datos)            | Sección 5              |
| `prisma migrate deploy`     | El esquema debe estar aplicado antes de que la app arranque      | Sección 5.3            |
| Cache de navegadores        | `~/.cache/ms-playwright` + instalación condicional               | **Guía 09, sección 4** |
| `--project=chromium`        | Solo el proyecto Chromium (no firefox/webkit) — reduce el tiempo | Sección 7.4            |
| `--output=test-results`     | Carpeta donde Playwright guarda resultados/traces                | —                      |
| `working-directory: e2e`    | Todos los comandos de Playwright corren en `e2e/`                | —                      |
| `e2e/reports/junit-e2e.xml` | El reporte JUnit del E2E (configurado en `playwright.config.js`) | Sección 7.4            |

### 7.4 Por qué `--project=chromium` y cómo se genera el JUnit

Playwright permite definir **proyectos** (configuraciones de navegador) en `e2e/playwright.config.js`. El CI ejecuta solo el proyecto `chromium`:

```bash
# En el job e2e (working-directory: e2e)
npx playwright test --project=chromium --output=test-results
```

- **Solo Chromium**: probar 3 navegadores multiplica el tiempo por 3 con poco valor añadido para un monorepo de este tamaño. Chromium es el navegador por defecto y el más representativo.
- **El reporter JUnit** se configura en `playwright.config.js` para que Playwright escriba `reports/junit-e2e.xml` (el mismo formato que Vitest) — así `dorny/test-reporter` consume ambos formatos con el mismo `reporter: java-junit`.

> 💡 **Analogía de la pirámide aplicada**: así como no corres 3 navegadores, tampoco escribes 500 E2E — escribes los flujos críticos (login, CRUD principal, checkout si existiera) y dejas el resto a las capas inferiores, más baratas.

### 7.5 El flujo del job e2e (resumen visual)

```mermaid
flowchart LR
    A[checkout fetch-depth: 0] --> B[setup-monorepo]
    B --> C[prisma migrate deploy]
    C --> D[Cache Playwright Browsers]
    D -->|cache-hit| E[Se salta install]
    D -->|cache-miss| F[playwright install chromium]
    E --> G[Run E2E Tests\nchromium]
    F --> G
    G --> H[Report E2E JUnit]
    style D fill:#FFE082,stroke:#ef6c00
    style G fill:#C8E6C9,stroke:#2e7d32
```

---

## 8. Reporting JUnit al PR: `dorny/test-reporter@v3`

### 8.1 El problema que resuelve

Sin reporting, los resultados de los tests son solo líneas en los logs de cada job. El desarrollador tendría que abrir cada job, expandir el step "Run Tests" y leer el output — lento y propenso a error. **`dorny/test-reporter` resuelve esto**: lee los reportes JUnit generados por Vitest/Playwright y los adjunta como **check runs** directamente en el PR.

```yaml
# Source: ../../../.github/workflows/ci.yml (job test-unit-client, líneas 71-77)
- name: Report Client Unit Tests
  if: success() || failure()
  uses: dorny/test-reporter@v3
  with:
    name: Client Unit Tests
    path: apps/client/reports/junit.xml
    reporter: java-junit
```

### 8.2 Los 3 inputs clave

| Input      | Valor en el repo                                                                                        | Qué hace                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `name`     | `Client Unit Tests`, `Server Unit Tests`, `Server Integration Tests`, `Server Smoke Tests`, `E2E Tests` | Nombre del check run en el PR (un check por capa)                     |
| `path`     | `apps/client/reports/junit.xml`, `apps/server/reports/junit.xml`, `e2e/reports/junit-e2e.xml`           | Ruta del reporte JUnit dentro del workspace                           |
| `reporter` | `java-junit`                                                                                            | Formato del reporte (JUnit XML es el estándar de Vitest y Playwright) |

### 8.3 El `if: success() || failure()` — reportar incluso los fallos

```yaml
if: success() || failure()
```

Este `if` es **deliberado**: el step de reporting debe correr **incluso si los tests fallaron**. Si usaras solo `if: success()`, los tests rojos no generarían check run y el fallo quedaría solo en los logs. Con `success() || failure()`, el check run muestra exactamente **qué tests fallaron** y por qué.

> 💡 **Esto es "shifting left" aplicado al feedback**: el check run en el PR es más visible que un log; el desarrollador ve el fallo sin salir de la conversación del PR. Es el mismo principio que viste en la guía 00 (etapa de feedback).

### 8.4 El requisito de `checks: write` y el Caso 2 de `fetch-depth`

Dos permisos/config son necesarios para el reporting:

1. **`permissions: checks: write`** — `test-reporter` necesita permiso para crear/actualizar check runs en el PR. Sin este permiso, el step falla con un error de autorización (403).
2. **`fetch-depth: 0`** — el clonado completo. Aquí vive el **Caso 2** de `docs/workflows-mantenimiento-guia.md`: con un clonado shallow (default de `actions/checkout@v5`), `dorny/test-reporter` falla con **exit 128** porque no tiene el historial/refs necesarios. El fix fue `fetch-depth: 0` en los jobs de test.

> 📖 **Referencia**: [`docs/workflows-mantenimiento-guia.md`](../../../docs/workflows-mantenimiento-guia.md) Caso 2 — viste el análisis completo en la guía 06 (sección 10) y la regla "la composite NO hace checkout" en la guía 08 (sección 5.4). Aquí la lección se aplica al reporting.

### 8.5 El pipeline de reporting completo

| Job                | Reporte JUnit                   | Check run en el PR           |
| ------------------ | ------------------------------- | ---------------------------- |
| `test-unit-client` | `apps/client/reports/junit.xml` | **Client Unit Tests**        |
| `test-unit-server` | `apps/server/reports/junit.xml` | **Server Unit Tests**        |
| `test-integration` | `apps/server/reports/junit.xml` | **Server Integration Tests** |
| `test-smoke`       | `apps/server/reports/junit.xml` | **Server Smoke Tests**       |
| `e2e`              | `e2e/reports/junit-e2e.xml`     | **E2E Tests**                |

**Nota**: los jobs de server escriben `reports/junit.xml` en la **misma ruta** (`apps/server/reports/`) pero en **jobs distintos** — no hay colisión porque cada job corre en su propio runner y su propio checkout. El nombre del check run (`name:`) es lo que los distingue en el PR.

### 8.6 Cómo se ve en el PR

Cuando el CI termina, el PR muestra 5 check runs de tests (más los de quality, build y zombie-guard):

```plaintext
✓ Client Unit Tests          (test-unit-client)
✓ Server Unit Tests          (test-unit-server)
✓ Server Integration Tests   (test-integration)
✓ Server Smoke Tests         (test-smoke)
✓ E2E Tests                  (e2e)
```

Cada check run enlaza al detalle: número de tests, fallos, duración. Si un test falla, el check run se marca **✗** y la vista de checks del PR muestra el archivo/línea del fallo sin abrir los logs crudos.

---

## 9. Ejercicios prácticos

> Los ejercicios son de **lectura y reflexión** sobre los archivos reales del repo. No modifican workflows.

### 9.1 Ejercicio 1: Traza un PR por el pipeline de testing

**Objetivo**: predecir qué jobs corren según los archivos cambiados.

1. Abre el último PR mergeado a `main` en GitHub.
2. Mira la pestaña **Files changed** y anota qué paths cambiaron (solo `apps/client/**`? `apps/server/**`? `e2e/**`? `package.json`?).
3. Antes de mirar los checks, predice: ¿cuáles de los 5 jobs de test corrieron?
4. Compara con la pestaña **Checks** del PR.
5. Reflexiona: ¿hubo algún job que corriste de más o de menos respecto a tu predicción? ¿Por qué?

**Pregunta de reflexión**: si un PR cambia solo `docs/learning/ci-cd/10-testing-pipeline.md` (esta guía), ¿corre algún job de test? (Respuesta: no — `docs/**` no está en ningún filtro del job `changes`; solo corren jobs si cambian `apps/`, `e2e/`, `package*.json` o `.github/workflows/**`).

### 9.2 Ejercicio 2: Identifica la capa de cada test en el repo

**Objetivo**: clasificar tests reales del repo según la pirámide.

1. Busca archivos de test en el repo:

```bash
# Unit tests co-locados (server)
find apps/server/src -name "*.unit.test.js" | head -5

# Integration tests centralizados (server)
find apps/server/tests/integration -name "*.integration.test.js" | head -5

# Smoke tests (server)
find apps/server/tests/smoke -name "*.smoke.test.js" | head -5

# E2E (monorepo top-level)
find e2e -name "*.spec.ts" -o -name "*.spec.js" | head -5
```

2. Clasifica cada archivo encontrado en su capa de la pirámide (unit / integración / smoke / E2E).
3. Verifica contra `docs/testing-architecture.md` sección 8 (organización híbrida) que tu clasificación coincide con la convención del repo.

**Pregunta de reflexión**: ¿por qué los unit tests de server están co-locados pero los de integración centralizados en `tests/integration/`? (Respuesta: el enfoque híbrido — unit junto al código para descubribilidad; integración agrupada por módulo porque cruzan módulos y comparten setup de BD).

### 9.3 Ejercicio 3: Explica el `if:` de cada job de test

**Objetivo**: leer condiciones de ejecución sin ayuda.

1. Abre `.github/workflows/ci.yml` y para cada job de test escribe su condición `if:`:

| Job              | `if:` (textual)       | ¿Corre si cambia solo `e2e/tests/foo.spec.ts`? |
| ---------------- | --------------------- | ---------------------------------------------- | ------- | --------------------------------- |
| test-unit-client | `frontend             |                                                | shared` | No (frontend=false, shared=false) |
| test-unit-server | `backend \|\| shared` | No                                             |
| test-integration | `backend \|\| shared` | No                                             |
| test-smoke       | `backend \|\| shared` | No                                             |
| e2e              | `e2e \|\| shared`     | **Sí** (e2e=true)                              |

2. Ahora responde: ¿qué jobs corren si un PR cambia `apps/server/src/modules/events/service.js`? (Respuesta: unit-server, integración, smoke + build + quality-server. El client y e2e NO corren).

### 9.4 Ejercicio 4: Simula un fallo y sigue el check run

**Objetivo**: entender el reporting.

1. (Opcional, en una rama de prueba) Introduce un fallo deliberado en un test unit de server — p. ej. cambia una aserción en un `*.unit.test.js`.
2. Haz commit y push a una rama con PR.
3. Observa: el job `test-unit-server` corre, los tests fallan, y el step **Report Server Unit Tests** (con `if: success() || failure()`) ejecuta y adjunta el check run **Server Unit Tests** en rojo.
4. Abre el check run y verifica que muestra el test fallido con su nombre y mensaje.
5. Revierte el cambio.

**Pregunta de reflexión**: ¿qué habría pasado si el step de reporting usara `if: success()` en vez de `success() || failure()`? (Respuesta: el check run no existiría; el fallo solo estaría en los logs del job).

### 9.5 Ejercicio 5: Mapea los reportes JUnit

**Objetivo**: ver los XML que genera cada capa.

1. Ejecuta localmente los tests unit del server con reporter JUnit:

```bash
cd apps/server && npm run test:unit -- --reporter=junit --outputFile=reports/junit.xml
```

2. Inspecciona el XML generado:

```bash
head -30 apps/server/reports/junit.xml
```

3. Identifica en el XML: el `<testsuites>` raíz, los `<testcase>` (uno por test) y los atributos `name`, `failures`, `errors`.

**Pregunta de reflexión**: ¿por qué el job `test-unit-server` de CI genera el mismo archivo (`reports/junit.xml`) que tú localmente? (Respuesta: es el mismo comando con los mismos flags — el `--workspace=server-express` es solo la delegación de npm; el reporter y el outputFile son idénticos).

---

## 10. Troubleshooting: problemas comunes del pipeline de testing

### 10.1 "Un job de test no corrió — esperaba que corriera"

**Síntoma**: cambiaste código de `apps/client` y `test-unit-client` no aparece en los checks.

**Causas posibles**:

1. **El filtro no matchea** — revisa que el path cambiado esté dentro de `apps/client/**` (p. ej. cambiaste `docs/` o un archivo raíz como `.eslintrc` que no está en los filtros).
2. **El output correcto es otro** — recuerda la inconsistencia del repo: el filtro `client` produce el output `frontend` (sección 3.1). Si miras `needs.changes.outputs.client`, no existe — es `frontend`.
3. **`shared` no se disparó** — si el cambio es solo de código fuente de app, `shared` (que cubre `package*.json` y `.github/workflows/**`) no se activa; es correcto.

**Fix**: verifica en el job `changes` (log del step `filter`) qué outputs quedaron en `true`. Eso te dice exactamente qué paths matchearon.

### 10.2 "El test pasa localmente pero falla en CI"

**Síntoma**: el mismo test es verde en tu máquina y rojo en el job.

**Causas comunes** (de `docs/testing-architecture.md` sección 18 — Cross-Platform):

1. **Diferencias de plataforma** — tu máquina es Windows; el runner es Linux. Paths con `\`, case-sensitivity, o binarios nativos pueden comportarse distinto.
2. **BD no migrada** — en CI la BD del service container arranca vacía; si el test asume datos pre-existentes, falla. El fix es que el test (o su setup) cree los datos, no asumirlos.
3. **Flakiness por timing** — sin `testTimeout` suficiente o con esperas implícitas. Los smoke tests usan `testTimeout: 15000` por esto.
4. **Cache stale** — un cache de Vitest corrupto (guía 09, sección 10.3). Borra la cache y re-ejecuta.

**Diagnóstico**: compara el output del test local vs CI. Si el error es de entorno (conexión, permisos, binarios), es 1 o 2. Si es intermitente, es 3. Si desaparece al borrar cache, es 4.

### 10.3 "test-reporter falla con exit 128"

**Síntoma**: el step `Report <X> Tests` falla con `Process completed with exit code 128`.

**Causa**: es el **Caso 2** — clonado shallow. El job usa `actions/checkout@v5` sin `fetch-depth: 0` y `test-reporter` no tiene los refs necesarios.

**Fix**: añade `fetch-depth: 0` al checkout del job (sección 8.4). Es exactamente el incidente que viste en la guía 06 y la razón por la que los 5 jobs de test clonan completo.

### 10.4 "El service container no arranca / healthcheck falla"

**Síntoma**: el job falla antes de correr los tests con "Container postgres did not start" o el healthcheck nunca pasa.

**Causas posibles**:

1. **Puerto ocupado** — el mapeo `ports: ['5432:5432']` puede chocar en runners con algo escuchando en 5432 (raro en GitHub-hosted, común en `act` local).
2. **Credenciales inconsistentes** — el healthcheck usa `pg_isready -U test -d project_one_test`; si `POSTGRES_DB` o `POSTGRES_USER` no coinciden con el healthcheck, nunca pasa.
3. **Imagen no disponible** — `postgres:16-alpine` debe poder descargarse (en `act` local, requiere pull previo).

**Fix**: verifica que el healthcheck coincida con las env del container (sección 5.2). En `act`, usa `--pull` para forzar la descarga de la imagen.

### 10.5 "Los checks del PR no aparecen"

**Síntoma**: los jobs corren y los tests pasan, pero no hay check runs en el PR.

**Causas posibles**:

1. **Falta `checks: write`** — sin el permiso, `test-reporter` no puede crear check runs (403).
2. **El PR es de un fork** — los forks tienen permisos reducidos; los check runs pueden no adjuntarse igual.
3. **El path del reporte no existe** — si el comando de tests no generó `reports/junit.xml` (p. ej. por un fallo en la instalación de dependencias o en un step anterior), el job no tiene reporte que publicar y `test-reporter` termina sin adjuntar nada.

**Fix**: añade `checks: write` al `permissions` del job (sección 8.3) y verifica que el comando de tests genere el reporte en el path esperado (`reports/junit.xml`). Si el PR es de un fork, los maintainers deben aprobar el workflow run antes de que los check runs se adjunten.

### 10.6 "Los tests corren pero el job `changes` no detectó los cambios"

**Síntoma**: modificaste código en `apps/server` pero el job `test-unit-server` no corrió; el job `changes` reportó `server: false`.

**Causas posibles**:

1. **El filtro no cubre el path** — `dorny/paths-filter` usa globs; si el archivo modificado está fuera de los patrones (p. ej. un `.env` en la raíz o un archivo en `docs/`), el output es `false` por diseño.
2. **Cambios en `shared/`** — si el monorepo tiene un workspace compartido, el filtro debe incluirlo explícitamente; un cambio solo en `shared/` no activa `client` ni `server` a menos que el filtro lo mapee.
3. **El PR apunta a una rama sin base** — `paths-filter` compara contra la base del PR; si la base cambió, los outputs pueden ser inesperados.

**Fix**: revisa los patrones del filtro en el job `changes` (sección 3.1 de la guía 06) y decide si el archivo modificado debería activar el job. Recuerda: **el path filtering es una optimización, no una garantía** — si un cambio puede afectar a un workspace, el filtro debe incluirlo o el job debe correr siempre.

> 💡 **Regla de oro del troubleshooting**: cuando un job de test "no corre", la primera pregunta no es "¿por qué falló?" sino **"¿por qué se decidió que no debía correr?"**. El path filtering y los `if:` condicionales son las dos causas más comunes de "tests que no corren" en este pipeline.

---

## 11. FAQ

### ¿Por qué el proyecto tiene 5 jobs de test separados en vez de uno solo?

Porque cada capa de la pirámide tiene **requisitos de entorno distintos**: los unitarios solo necesitan Node (rápidos, corren en paralelo por workspace), los de integración necesitan PostgreSQL real (service container), los smoke necesitan su propia config, y los E2E necesitan navegadores. Separarlos permite:

- **Path filtering**: cada job puede decidir si corre según los cambios (sección 3).
- **Aislamiento de fallos**: un error de E2E no bloquea los unitarios.
- **Paralelismo**: los 5 jobs corren en runners distintos simultáneamente.

### ¿Por qué los tests de integración usan una BD real en vez de mocks?

Porque los tests de integración validan **el contrato real entre la app y PostgreSQL**: el schema de Prisma, las migraciones (`prisma migrate deploy`), las constraints y las queries. Con mocks no detectarías errores de tipo de columna, constraints violadas o migraciones rotas. La contrapartida es velocidad — por eso solo se usan para la capa de integración y no para todos los tests.

### ¿Por qué el service container es `postgres:16-alpine`?

Porque es la misma versión mayor de PostgreSQL que se usa en producción (declarada en la config de Prisma del repo) y la variante `alpine` es más liviana, lo que acelera el pull en el runner. La consistencia de versión evita el clásico bug de "pasa en CI pero no en prod" por diferencias de BD.

### ¿Qué hace exactamente `prisma migrate deploy` en el service container?

Aplica las migraciones **pendientes** al schema de la BD del container. Es el comando correcto para CI: a diferencia de `prisma migrate dev`, no genera migraciones nuevas ni entra en modo interactivo — solo aplica las que ya existen en el repo. Es la forma de garantizar que los tests corren contra un schema real y actualizado.

### ¿Por qué los tests unitarios corren dos veces (client y server) con la misma config?

No es la misma config — son **configuraciones independientes** aunque compartan el reporter JUnit. `apps/server` y `apps/client` tienen proyectos Vitest separados con sus propios `include`, `coverage` y plugins (p. ej. el plugin React para los tests del client). La separación permite que el path filtering active uno sin el otro.

### ¿El pipeline de testing corre E2E en cada PR?

Solo cuando los archivos relevantes cambian (path filtering con el filtro `e2e`). Si no tocas el frontend, los E2E no corren — ahorra minutos de runner en cada PR. Pero cuando corren, lo hacen contra los **dev servers locales** que Playwright arranca automáticamente vía `webServer` (`npm run dev` en client `:5173` y server `:3000`), no contra un bundle de producción.

### ¿Por qué los E2E usan `--project=chromium` y no los 3 navegadores?

Porque el objetivo es validar el **flujo funcional**, no la compatibilidad cross-browser. Correr solo Chromium reduce el tiempo de E2E a un tercio. La matriz multi-navegador se reserva para cambios críticos de UI o un pipeline separado de release, donde el coste extra está justificado.

### ¿`dorny/test-reporter@v3` es un paso obligatorio o una conveniencia?

Es una conveniencia **muy valiosa**: convierte el XML de JUnit en check runs legibles en el PR (tests pasados, fallidos, duración, flaky). Sin él tendrías que abrir los logs de cada job para ver qué test falló. Es opcional en el sentido de que no afecta al resultado del job (los tests ya corrieron), pero sin él el PR pierde la visibilidad que el equipo usa para aprobar.

---

## 12. Glosario

| Término                     | Definición                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pirámide de tests**       | Modelo que distribuye los tests por capas: muchos unitarios (base), menos de integración, pocos E2E (cima); cada capa es más lenta y frágil pero cubre más integración real. |
| **Test unitario**           | Prueba de una unidad aislada (función, componente, servicio) con mocks de sus dependencias; rápido y determinista.                                                           |
| **Test de integración**     | Prueba que valida la interacción entre módulos con dependencias reales (en este repo, PostgreSQL real vía service container).                                                |
| **Smoke test**              | Prueba rápida de "humo": verifica que las piezas críticas arrancan y responden, sin profundidad; primer filtro antes de correr la suite completa.                            |
| **E2E (End-to-End)**        | Prueba del flujo completo como usuario real, desde la UI (Playwright) contra los dev servers locales que Playwright arranca (`webServer`).                                   |
| **Service container**       | Container de servicio que GitHub Actions levanta junto al job; aquí `postgres:16-alpine` con healthcheck.                                                                    |
| **Healthcheck**             | Comando que GitHub ejecuta periódicamente para saber si el service container está listo (`pg_isready -U test -d project_one_test`).                                          |
| **`prisma migrate deploy`** | Comando no interactivo que aplica las migraciones pendientes al schema de la BD; estándar en CI.                                                                             |
| **Path filtering**          | Técnica que decide si un job corre según los archivos modificados; implementada con `dorny/paths-filter@v4`.                                                                 |
| **JUnit XML**               | Formato XML estándar de reportes de tests (`reports/junit.xml`); consumido por `dorny/test-reporter@v3`.                                                                     |
| **Check run**               | Indicador de estado que GitHub muestra en el PR por cada job (✓/✗ con detalle de tests).                                                                                     |
| **`--project=chromium`**    | Flag de Playwright que limita la ejecución al proyecto Chromium (config en `playwright.config.js`).                                                                          |

---

## 13. Checklist de autoevaluación

Marca cada ítem cuando puedas hacerlo **sin consultar la guía**:

- [ ] Explico la pirámide de tests (unit / integración / smoke / E2E) y dónde vive cada capa en el repo
- [ ] Describo cómo el path filtering decide qué jobs de test corren según `dorny/paths-filter@v4`
- [ ] Explico por qué los tests unitarios están co-localizados y usan reporter JUnit
- [ ] Configuro un service container de PostgreSQL con healthcheck y `prisma migrate deploy`
- [ ] Justifico por qué la integración usa BD real en vez de mocks
- [ ] Explico qué son los smoke tests y por qué `vitest.smoke.config.js` es una config separada
- [ ] Describo el job e2e: Chromium cacheado, `--project=chromium`, dev servers locales (`webServer`)
- [ ] Explico cómo `dorny/test-reporter@v3` adjunta check runs al PR y el requisito de `checks: write`
- [ ] Diagnostico un fallo de `test-reporter` por `fetch-depth` (Caso 2)
- [ ] Diagnostico por qué un job de test "no corrió" (path filtering o `if:` condicional)
- [ ] Sé cuándo un service container no arranca y cómo verificarlo
- [ ] Trazo un PR completo por las 4 capas de tests hasta el reporte final en el PR

---

## 14. Resumen y navegación

### Lo que aprendiste en esta guía

| Concepto                 | Dónde vive en el repo                                   | Sección |
| ------------------------ | ------------------------------------------------------- | ------- |
| **Pirámide de tests**    | `docs/testing-architecture.md` (link, no copia)         | 2       |
| **Path filtering**       | Job `changes` de `ci.yml` (`dorny/paths-filter@v4`)     | 3       |
| **Tests unitarios**      | Jobs `test-unit-client` / `test-unit-server`            | 4       |
| **Tests de integración** | Job `test-integration` + service container postgres     | 5       |
| **Smoke tests**          | `apps/server/vitest.smoke.config.js` + job `test-smoke` | 6       |
| **E2E Playwright**       | Job `e2e` + `playwright.config.js` (Chromium)           | 7       |
| **Reporting JUnit**      | `reports/junit.xml` + `dorny/test-reporter@v3`          | 8       |

### El cierre del nivel Intermedio

Esta guía es la **última del nivel Intermedio**. El hilo que une las 6 guías:

1. **Guía 05 (Husky)**: los tests corren **antes** del commit, localmente, scoped a los cambios (`vitest run --changed`).
2. **Guía 06 (ci.yml)**: los mismos tests corren **en el PR**, orquestados por los 9 jobs de `ci.yml`.
3. **Guía 07 (quality.yml)**: lint, format y typecheck como reusable workflow compartido.
4. **Guía 08 (composite actions)**: `setup-monorepo` — el setup idéntico que los 5 jobs de test comparten.
5. **Guía 09 (caching)**: caches de npm, Vitest y Playwright — por qué los tests corren en minutos y no en media hora.
6. **Guía 10 (testing pipeline)**: las 4 capas de tests, su orquestación en CI y su reporting al PR.

Con esto tienes el **mapa completo del testing en este repo**: sabes qué se testea (las 4 capas), dónde se testea (hooks locales + CI), cómo se decide qué corre (path filtering) y cómo se comunica (check runs). Ese es exactamente el conocimiento que separa a quien "corre tests" de quien **entiende el pipeline de testing**.

> 💡 **Regla mnemotécnica final del nivel**: **"los tests van hacia la izquierda — local con Husky, en el PR con path filtering — y suben la pirámide de abajo hacia arriba solo cuando hace falta"**.

### Siguiente paso: el nivel Avanzado

El nivel **Avanzado** continúa con temas de despliegue y operación (workflows de deploy/preview, release, security y scheduled-security). Cuando lo inicies, verás cómo el pipeline de testing que acabas de dominar se convierte en la **puerta de calidad** que los workflows de despliegue esperan antes de publicar.

---

## 15. Referencias

- [`docs/testing-architecture.md`](../../../docs/testing-architecture.md) — arquitectura de testing del repo (link de referencia de la sección 2, no copia)
- [`docs/workflows-mantenimiento-guia.md`](../../../docs/workflows-mantenimiento-guia.md) — Caso 2 (fetch-depth / test-reporter) y comandos de mantenimiento
- [`docs/cicd-estado-actual.md`](../../../docs/cicd-estado-actual.md) — inventario de workflows y métricas de tiempos de CI
- [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) — jobs `test-unit-*`, `test-integration`, `test-smoke`, `e2e` y `changes`
- [`apps/server/vitest.smoke.config.js`](../../../apps/server/vitest.smoke.config.js) — configuración de los smoke tests
- [Documentación de Playwright](https://playwright.dev/docs/ci) — ejecución en CI, caché de navegadores y reporters
- [Documentación de Vitest](https://vitest.dev/guide/reporters) — reporter JUnit y configuración por proyecto
- [Documentación de `dorny/test-reporter`](https://github.com/dorny/test-reporter) — opciones de publicación de check runs
- [Documentación de `dorny/paths-filter`](https://github.com/dorny/paths-filter) — filtros por paths y outputs
- [GitHub Docs: Service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — healthchecks y red del container

---

> **🏆 Fin del nivel Intermedio** — has completado las 6 guías (05-10). | **Volver al índice del nivel**: [intermedio-README.md](./intermedio-README.md) | **Nivel anterior**: [Fundamentos — README](./fundamentos-README.md) | **Siguiente**: nivel Avanzado (cuando esté publicado)
