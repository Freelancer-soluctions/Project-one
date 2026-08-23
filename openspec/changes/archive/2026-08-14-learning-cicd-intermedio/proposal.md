## Why

Un Junior que completó el nivel Fundamentos (guías 00-04) ya sabe _qué es_ CI/CD y _qué es_ GitHub Actions (workflow/job/step/trigger/runner, secrets/variables, Docker básico), pero todavía **no puede leer ni modificar los workflows reales del proyecto**: no entiende por qué `ci.yml` tiene 9 jobs, qué es un workflow reutilizable, qué es una composite action, cómo funcionan los caches ni cómo se orquesta la pirámide de testing en CI. La documentación técnica existente (`docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`) es de referencia y asume conocimientos; `docs/testing-architecture.md` y `docs/code-style.md` documentan estrategias, no guías paso a paso. Sin este nivel, el lector se queda en teoría y no logra el objetivo del nivel: **"puedo leer y modificar cualquiera de los workflows del proyecto + los hooks de Husky"**.

## What Changes

- Crear el nivel **Intermedio** de la ruta de aprendizaje incremental de CI/CD en `docs/learning/ci-cd/`, continuando la numeración del nivel Fundamentos (00-04) con las guías 05-10.
- `intermedio-README.md`: índice del nivel Intermedio (archivo separado del README de Fundamentos para estructura modular limpia), con objetivos del nivel, prerequisitos, mapa de navegación 05-10 y enlace de vuelta a Fundamentos y hacia Avanzado.
- `05-husky-git-hooks.md`: walkthrough didáctico de los git hooks del proyecto (`.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`): pre-commit con lint-staged + Semgrep + Gitleaks en paralelo, commit-msg con commitlint + Conventional Commits, pre-push con `vitest run --changed origin/main`. Cubre el gotcha del timeout por defecto de bash (120s) y el baseline de 19 findings de Semgrep.
- `06-ci-yml-walkthrough.md`: walkthrough profundo de `.github/workflows/ci.yml`: los 9 jobs (changes → quality → test-unit-client → test-unit-server → test-integration → test-smoke → build → e2e → zombie-guard), `dorny/paths-filter@v4` para path filtering, `concurrency` con `cancel-in-progress`, service container de PostgreSQL 16 con healthcheck, reporter JUnit + `dorny/test-reporter@v3` y el gotcha de `fetch-depth` (Caso 2 de `docs/workflows-mantenimiento-guia.md`).
- `07-quality-yml-reusable.md`: workflows reutilizables vía `workflow_call`: concepto, cómo `ci.yml` invoca `quality.yml` con inputs, y la distinción reusable vs composite.
- `08-composite-actions.md`: composite actions: concepto y walkthrough de `.github/actions/setup-monorepo/action.yml` (setup-node con `.nvmrc`, `npm ci`, cache Vitest), la regla "la composite NO hace checkout" (Caso 2) y cuándo usar composite vs reusable workflow.
- `09-caching-y-performance.md`: estrategia de caching: cache npm via `setup-node` (`cache-dependency-path`), cache de Vitest (`vitest-${OS}-${hash(package-lock.json)}`), cache de navegadores Playwright, reglas de invalidación de keys, el gotcha de cache-miss de `ci-enterprise.yml` (paths `frontend/` y `backend/` inexistentes en este monorepo) y ejecución local con `act`.
- `10-testing-pipeline.md`: arquitectura del pipeline de testing en CI: path filtering por workspace, tests unitarios co-locados, tests de integración con PostgreSQL real (service container), smoke tests (`vitest.smoke.config.js`), E2E con Playwright Chromium (navegadores cacheados), reporter JUnit y `test-reporter` adjuntando check runs al PR. Pirámide de tests.
- **No se modifica código de aplicación ni workflows**: es documentación didáctica nueva. No se duplica `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md` ni `docs/code-style.md` — se enlazan (link, no copy), con snippets cortos citando la ruta fuente.

## Capabilities

### New Capabilities

- `cicd-intermediate-guide`: Guía didáctica de nivel Intermedio (6 guías: 05-husky-git-hooks, 06-ci-yml-walkthrough, 07-quality-yml-reusable, 08-composite-actions, 09-caching-y-performance, 10-testing-pipeline) con estructura pedagógica obligatoria (objetivos de aprendizaje, prerequisitos "completado Fundamentos 00-04", teoría primero → walkthrough de la implementación real con snippets citando la ruta fuente, resumen y enlace a la siguiente guía), en español, 800-1500 líneas por guía, con tablas y diagramas mermaid.
- `cicd-intermedio-readme-index`: Archivo `intermedio-README.md` índice del nivel Intermedio con objetivos del nivel, prerequisitos, navegación entre las 6 guías (05-10), enlace de vuelta al nivel Fundamentos y hacia el nivel Avanzado, y referencias a la documentación técnica existente.

### Modified Capabilities

<!-- Ninguna: no cambian requisitos de capacidades existentes. Es documentación nueva. -->

## Impact

- **Nuevos archivos**: 7 archivos markdown en `docs/learning/ci-cd/` (intermedio-README.md + 6 guías 05-10).
- **Sin impacto en código**: no se tocan `apps/`, `.github/workflows/`, `.github/actions/`, `.husky/`, ni dependencias.
- **Referencias (solo lectura)**: `.github/workflows/*.yml` (ci.yml, quality.yml, ci-enterprise.yml), `.github/actions/setup-monorepo/action.yml`, `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`, `package.json` (config lint-staged), `apps/server/vitest.smoke.config.js`, `.nvmrc`, `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`, `docs/code-style.md`, `docs/adr/turborepo-evaluation.md`, `openspec/changes/learning-cicd-fundamentos/`.
- **Convención**: documentación en español (convención del proyecto), 800-1500 líneas por archivo, tablas markdown, diagramas mermaid, bloques de código con snippets reales citando la ruta fuente, cross-references entre guías y a los docs existentes.
