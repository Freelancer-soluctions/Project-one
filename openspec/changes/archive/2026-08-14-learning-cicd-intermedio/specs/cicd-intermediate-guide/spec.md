## Purpose

Define el contrato de contenido, estructura y estilo pedagógico de las 6 guías del nivel Intermedio (05-10) de la ruta de aprendizaje de CI/CD, para que un desarrollador Junior que completó el nivel Fundamentos pueda leer, comprender y modificar los workflows reales del proyecto y sus git hooks de Husky.

## ADDED Requirements

### Requirement: Guías del nivel Intermedio

El nivel Intermedio SHALL contener exactamente 6 guías markdown en `docs/learning/ci-cd/`: `05-husky-git-hooks.md`, `06-ci-yml-walkthrough.md`, `07-quality-yml-reusable.md`, `08-composite-actions.md`, `09-caching-y-performance.md` y `10-testing-pipeline.md`.

#### Scenario: Existen las 6 guías

- **WHEN** se inspecciona el directorio `docs/learning/ci-cd/`
- **THEN** existen los 6 archivos de guía con los nombres exactos especificados

#### Scenario: La numeración continúa a Fundamentos

- **WHEN** se listan los archivos del nivel Intermedio
- **THEN** la numeración de las guías continúa la secuencia del nivel Fundamentos (00-04) con los números 05-10

#### Scenario: No hay guías fuera del nivel

- **WHEN** se listan los archivos del nivel Intermedio
- **THEN** no existen guías de niveles superiores (avanzado, profesional) en este directorio

### Requirement: Estructura obligatoria de cada guía

Cada guía SHALL seguir la estructura: objetivos de aprendizaje, prerequisitos (mencionando que se debe haber completado el nivel Fundamentos 00-04), sección de teoría desde cero, sección de walkthrough de la implementación real en el proyecto con snippets citando la ruta fuente, resumen y enlace a la siguiente guía.

#### Scenario: La guía abre con objetivos y prerequisitos

- **WHEN** se lee el inicio de cualquier guía del nivel
- **THEN** contiene una sección de objetivos de aprendizaje y una sección de prerequisitos antes del contenido teórico

#### Scenario: Los prerequisitos indican haber completado Fundamentos

- **WHEN** se lee la sección de prerequisitos
- **THEN** indica que el lector debe haber completado las guías 00-04 del nivel Fundamentos (y que se asume conocimiento de CI/CD, GitHub Actions, secrets/variables, YAML y Docker básico)

#### Scenario: La guía conecta teoría con implementación real

- **WHEN** se recorre el cuerpo de la guía
- **THEN** contiene una sección de teoría desde cero y una sección de walkthrough que muestra la implementación real en el proyecto con snippets de código que citan la ruta fuente

#### Scenario: La guía cierra con resumen y navegación

- **WHEN** se lee el final de cualquier guía
- **THEN** contiene un resumen de lo aprendido y un enlace a la siguiente guía del nivel (o al índice intermedio si es la última)

### Requirement: Contenido didáctico de 05-husky-git-hooks

La guía `05-husky-git-hooks.md` SHALL explicar los git hooks de Husky del proyecto: pre-commit (lint-staged + Semgrep + Gitleaks en paralelo), commit-msg (commitlint + Conventional Commits) y pre-push (`vitest run --changed origin/main` con tests scoped), citando `.husky/pre-commit`, `.husky/commit-msg` y `.husky/pre-push`.

#### Scenario: Explica qué es un git hook y Husky

- **WHEN** un lector que completó Fundamentos lee la guía
- **THEN** entiende qué es un git hook, cómo Husky los gestiona y cuáles usa el proyecto

#### Scenario: Desglosa el pre-commit

- **WHEN** la guía trata el hook pre-commit
- **THEN** explica lint-staged (config en `package.json` raíz), la ejecución en paralelo de Semgrep (`npm run sast:semgrep`) y Gitleaks (`npm run security:secrets`) con `&` + `wait`, citando `.husky/pre-commit`

#### Scenario: Advierte del pre-commit Windows/Docker-céntrico

- **WHEN** la guía 05 detalla el hook pre-commit
- **THEN** menciona que `npm run sast:semgrep` ejecuta `scripts/security/semgrep-staged.ps1` (PowerShell + `docker run semgrep/semgrep:latest`) — un lector en macOS/Linux/WSL verá fallar el hook sin entender por qué si no se explica

#### Scenario: Cubre el gotcha del timeout de bash 120s

- **WHEN** la guía trata los problemas conocidos del pre-commit
- **THEN** explica el gotcha del timeout por defecto de bash (120 segundos) que provocó falsos positivos de timeout en los commits `cf5e1bb` y `32d35a8`, y la mitigación (reintentar con timeout extendido, p. ej. `timeout 600 bash -c "git commit ..."`), referenciando `docs/workflows-mantenimiento-guia.md`

#### Scenario: Explica el baseline de Semgrep

- **WHEN** la guía trata los resultados de Semgrep
- **THEN** explica que Semgrep reporta 19 findings pre-existentes que son baseline (no bloqueadores) y que el hook solo debe fallar por findings nuevos en archivos staged

#### Scenario: Desglosa el commit-msg

- **WHEN** la guía trata el hook commit-msg
- **THEN** explica `commitlint --edit $1` y cómo se relaciona con Conventional Commits citando `.husky/commit-msg`

#### Scenario: Desglosa el pre-push

- **WHEN** la guía trata el hook pre-push
- **THEN** explica `git fetch origin main --depth=1` y `vitest run --changed origin/main` (server y client) como tests scoped previos al push, citando `.husky/pre-push`

### Requirement: Contenido didáctico de 06-ci-yml-walkthrough

La guía `06-ci-yml-walkthrough.md` SHALL hacer un walkthrough profundo de `.github/workflows/ci.yml`: los 9 jobs (changes, quality, test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e, zombie-workflow-guard), `dorny/paths-filter@v4` para path filtering, `concurrency` con `cancel-in-progress`, service container de PostgreSQL 16 con healthcheck, reporter JUnit con `dorny/test-reporter@v3` y el gotcha de `fetch-depth` (Caso 2 de `docs/workflows-mantenimiento-guia.md`).

#### Scenario: Explica la anatomía completa del workflow

- **WHEN** se recorre la guía
- **THEN** explica cada uno de los 9 jobs de `ci.yml` con su propósito, condiciones de ejecución (`needs`, `if`) y dependencias, citando el archivo real

#### Scenario: Explica el path filtering

- **WHEN** la guía trata el job `changes`
- **THEN** explica `dorny/paths-filter` con los filtros reales (client/server/e2e/shared) y cómo sus outputs condicionan los demás jobs

#### Scenario: Explica concurrency

- **WHEN** la guía trata el bloque `concurrency`
- **THEN** explica `group` y `cancel-in-progress: true` y por qué se usa en PRs

#### Scenario: Explica el service container de PostgreSQL

- **WHEN** la guía trata los jobs de integración/smoke/e2e
- **THEN** explica el service container `postgres:16-alpine` con healthcheck (`pg_isready`), puertos, env y por qué se usa `prisma migrate deploy` antes de los tests

#### Scenario: Explica el reporting JUnit

- **WHEN** la guía trata el reporting de tests
- **THEN** explica el reporter JUnit de Vitest (`--reporter=junit --outputFile=reports/junit.xml`) y `dorny/test-reporter@v3` adjuntando check runs al PR

#### Scenario: Cubre el gotcha de fetch-depth

- **WHEN** la guía trata `actions/checkout` con `fetch-depth: 0`
- **THEN** explica el Caso 2 de `docs/workflows-mantenimiento-guia.md` (exit 128 de `dorny/test-reporter` con shallow checkout) y por qué `fetch-depth: 0` es opt-in y no default

#### Scenario: Cubre el mantenimiento de versiones Node (Caso 1, .nvmrc SSOT)

- **WHEN** la guía explica el mantenimiento de versiones Node
- **THEN** cubre el Caso 1 de `docs/workflows-mantenimiento-guia.md` §3: el incidente EBADENGINE (`omniroute@3.8.49` elevó `engines.node` a `>=22.22.2`, `.nvmrc` tenía `22.22.0`, fix en commit `cf5e1bb`) y el principio de que `.nvmrc` es la ÚNICA fuente de verdad — editar `node-version:` workflow-por-workflow es un anti-patrón

### Requirement: Contenido didáctico de 07-quality-yml-reusable

La guía `07-quality-yml-reusable.md` SHALL explicar los workflows reutilizables vía `workflow_call`: el concepto, cómo `ci.yml` invoca `.github/workflows/quality.yml` con inputs (`run-client`, `run-server`), y la distinción entre reusable workflow y composite action.

#### Scenario: Explica el concepto de reusable workflow

- **WHEN** un lector lee la guía
- **THEN** entiende qué es un workflow reutilizable, para qué sirve `workflow_call` y cuándo conviene usarlo

#### Scenario: Desglosa quality.yml

- **WHEN** la guía trata el archivo real
- **THEN** desglosa `.github/workflows/quality.yml` línea por línea: inputs, permissions, jobs (lint + format check por workspace, typecheck), citando la ruta fuente

#### Scenario: Explica la invocación desde ci.yml

- **WHEN** la guía trata la invocación
- **THEN** muestra cómo el job `quality` de `ci.yml` usa `uses: ./.github/workflows/quality.yml` con `with: run-client/run-server` pasando los outputs del job `changes`

#### Scenario: Distingue reusable de composite

- **WHEN** la guía compara los dos mecanismos
- **THEN** presenta una tabla comparativa reusable workflow vs composite action (dónde viven, cómo se invocan, cuándo usar cada uno) que incluye la fila "¿quién hace checkout?" — quality.yml hace su propio checkout (workflow completo) vs setup-monorepo NO hace checkout (composite = steps del job invocador) — reforzando la lección del Caso 2, y anticipa la guía 08

### Requirement: Contenido didáctico de 08-composite-actions

La guía `08-composite-actions.md` SHALL explicar las composite actions y hacer un walkthrough de `.github/actions/setup-monorepo/action.yml`: setup-node con `.nvmrc`, `npm ci`, cache de Vitest, la regla "la composite NO hace checkout" (Caso 2) y cuándo usar composite vs reusable workflow.

#### Scenario: Explica el concepto de composite action

- **WHEN** un lector lee la guía
- **THEN** entiende qué es una composite action, su estructura (`runs.using: composite`, `steps`) y para qué se usa

#### Scenario: Desglosa setup-monorepo

- **WHEN** la guía trata el archivo real
- **THEN** desglosa `.github/actions/setup-monorepo/action.yml` paso a paso: setup-node con `node-version-file: '.nvmrc'` y cache npm, `npm ci`, cache de Vitest con `actions/cache@v5` y key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`, citando la ruta fuente

#### Scenario: Explica la regla de no-checkout

- **WHEN** la guía trata la relación con `actions/checkout`
- **THEN** explica que la composite NO hace checkout (regla del Caso 2) y que el job invocador debe ejecutar checkout con `fetch-depth: 0` antes, citando `docs/workflows-mantenimiento-guia.md`

#### Scenario: Compara composite y reusable

- **WHEN** la guía compara los mecanismos
- **THEN** explica cuándo usar composite action vs reusable workflow con ejemplos del proyecto (setup-monorepo como composite, quality.yml como reusable)

### Requirement: Contenido didáctico de 09-caching-y-performance

La guía `09-caching-y-performance.md` SHALL explicar la estrategia de caching del proyecto: cache npm vía setup-node (`cache-dependency-path`), cache de Vitest (`vitest-${OS}-${hash(package-lock.json)}`), cache de navegadores Playwright, las reglas de invalidación de keys, el gotcha de cache-miss de `ci-enterprise.yml` (paths `frontend/` y `backend/` inexistentes) y la ejecución local con `act`.

#### Scenario: Explica el cache npm

- **WHEN** la guía trata el caching
- **THEN** explica cómo `actions/setup-node@v5` con `cache: 'npm'` y `cache-dependency-path: package-lock.json` cachea las dependencias y cómo se invalida la key

#### Scenario: Explica el cache de Vitest

- **WHEN** la guía trata el cache de Vitest
- **THEN** explica la key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` con `restore-keys` y `exclude` del step de la composite action

#### Scenario: Explica el cache de Playwright

- **WHEN** la guía trata los navegadores
- **THEN** explica el cache de `~/.cache/ms-playwright` con key basada en `package-lock.json` y la instalación condicional de Chromium en el job e2e de `ci.yml`

#### Scenario: Explica las reglas de invalidación

- **WHEN** la guía trata la vida de las keys
- **THEN** explica qué invalida cada cache (cambio en package-lock.json, cambio de OS/runner) y por qué se usan `restore-keys` para reutilizar caches parciales

#### Scenario: Cubre el gotcha de ci-enterprise.yml

- **WHEN** la guía trata cache-miss
- **THEN** explica el gotcha de `ci-enterprise.yml`: `cache-dependency-path` referencia `frontend/package-lock.json` y `backend/package-lock.json` que no existen en este monorepo (paths reales `apps/client` y `apps/server`), causando cache-miss, referenciando `docs/workflows-mantenimiento-guia.md`

#### Scenario: Explica ejecución local con act

- **WHEN** la guía trata ejecución local
- **THEN** explica cómo ejecutar workflows localmente con `act` (p. ej. `act -j quality -W .github/workflows/quality.yml`) y sus limitaciones (service containers, secrets, caches)

### Requirement: Contenido didáctico de 10-testing-pipeline

La guía `10-testing-pipeline.md` SHALL explicar la arquitectura del pipeline de testing en CI: path filtering por workspace, tests unitarios co-locados, tests de integración con PostgreSQL real (service container), smoke tests (`vitest.smoke.config.js`), E2E con Playwright Chromium (navegadores cacheados), reporter JUnit y `test-reporter` adjuntando check runs al PR, y la pirámide de tests.

#### Scenario: Explica la pirámide de tests

- **WHEN** la guía presenta la estrategia de testing
- **THEN** explica la pirámide de tests (unit/integration/E2E), su distribución en CI y enlaza a `docs/testing-architecture.md` en lugar de duplicarla

#### Scenario: Explica el path filtering por workspace

- **WHEN** la guía trata qué tests corren
- **THEN** explica cómo los outputs de `dorny/paths-filter` deciden qué jobs de test corren por workspace (client/server/e2e/shared)

#### Scenario: Explica los tests de integración con PostgreSQL real

- **WHEN** la guía trata tests de integración
- **THEN** explica el service container de PostgreSQL 16, el paso `prisma migrate deploy` y por qué se usa una BD real en vez de mocks

#### Scenario: Explica los smoke tests

- **WHEN** la guía trata los smoke tests
- **THEN** explica `vitest.smoke.config.js` y el job `test-smoke` de `ci.yml`

#### Scenario: Explica los E2E con Playwright

- **WHEN** la guía trata los E2E
- **THEN** explica el job `e2e` de `ci.yml`: Chromium con navegadores cacheados, `playwright test --project=chromium` y el reporter JUnit

#### Scenario: Explica el reporting JUnit al PR

- **WHEN** la guía trata el reporting
- **THEN** explica cómo `dorny/test-reporter@v3` adjunta los resultados JUnit como check runs al PR y la relación con `fetch-depth: 0`

### Requirement: Estilo didáctico y formato

Las guías SHALL usar español, tono amigable de enseñanza, tablas markdown para comparaciones, diagramas mermaid para flujos, bloques de código con snippets reales citando la ruta fuente, y una extensión de 800-1500 líneas por archivo.

#### Scenario: Las guías están en español

- **WHEN** se lee cualquier guía del nivel
- **THEN** el contenido está escrito en español siguiendo la convención del proyecto

#### Scenario: Usan tablas y diagramas

- **WHEN** la guía presenta comparaciones o flujos
- **THEN** usa tablas markdown para comparaciones (p. ej. reusable vs composite) y diagramas mermaid para flujos (p. ej. los 9 jobs de ci.yml)

#### Scenario: Los snippets citan su fuente

- **WHEN** la guía incluye un snippet de código del proyecto
- **THEN** el bloque de código indica la ruta del archivo fuente (p. ej. `.github/workflows/ci.yml`, `.husky/pre-commit`)

#### Scenario: Extensión dentro del rango

- **WHEN** se mide la extensión de cada guía
- **THEN** cada archivo tiene entre 800 y 1500 líneas

### Requirement: Cross-references entre guías y niveles

Las guías SHALL enlazar entre sí (anterior/siguiente/índice), hacia el nivel Fundamentos (00-04) y hacia el README intermedio, manteniendo la navegabilidad de la ruta.

#### Scenario: Las guías enlazan a la anterior y siguiente

- **WHEN** se navega por las guías del nivel
- **THEN** cada guía enlaza a la guía anterior y a la siguiente (o al índice intermedio si es la última)

#### Scenario: Las guías enlazan al nivel Fundamentos

- **WHEN** una guía asume conceptos del nivel anterior
- **THEN** enlaza a la guía de Fundamentos correspondiente (00-04) en lugar de re-explicar el concepto desde cero

### Requirement: Sin duplicación de documentación existente

Las guías SHALL referenciar con enlaces la documentación existente (`docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`, `docs/code-style.md`, `docs/adr/turborepo-evaluation.md`) en lugar de copiar su contenido.

#### Scenario: Se enlaza en lugar de copiar

- **WHEN** una guía necesita contenido que ya existe en `docs/cicd-*.md`, `docs/testing-architecture.md` o `docs/code-style.md`
- **THEN** enlaza al documento existente en lugar de duplicar el contenido

#### Scenario: Los enlaces cruzados funcionan

- **WHEN** se validan los enlaces entre guías del nivel, hacia `docs/` y hacia `.github/` y `.husky/`
- **THEN** todas las rutas relativas apuntan a archivos existentes
