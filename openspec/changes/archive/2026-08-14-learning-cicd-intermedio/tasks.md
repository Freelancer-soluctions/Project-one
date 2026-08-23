## 1. Setup del nivel Intermedio

- [x] 1.1 Crear `docs/learning/ci-cd/intermedio-README.md` con: indice del nivel (6 guias 05-10 con descripcion breve y orden de lectura), prerequisitos (haber completado Fundamentos 00-04), objetivos de aprendizaje del nivel, roadmap de los 4 niveles con el nivel actual marcado, enlace de vuelta a Fundamentos y hacia el nivel Avanzado, y cross-links a `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`

## 2. Guia: Husky git hooks (05)

- [x] 2.1 Escribir `docs/learning/ci-cd/05-husky-git-hooks.md` con objetivos de aprendizaje y prerequisitos
- [x] 2.2 Explicar teoria: que es un git hook, como Husky los gestiona (`.husky/`), ciclo de vida del commit/push, relacion con `prepare: husky` en package.json
- [x] 2.3 Desglosar el hook pre-commit (`.husky/pre-commit`): lint-staged primero (config en `package.json` raiz), luego Semgrep (`npm run sast:semgrep`) + Gitleaks (`npm run security:secrets`) en paralelo con `&` + `wait`, captura de exit codes
- [x] 2.4 Desglosar el hook commit-msg (`.husky/commit-msg`): `commitlint --edit $1` y su relacion con Conventional Commits (recordar guia 01)
- [x] 2.5 Desglosar el hook pre-push (`.husky/pre-push`): `git fetch origin main --depth=1`, verificacion de origin/main, y `vitest run --changed origin/main` para server y client (tests scoped)
- [x] 2.6 Cubrir el gotcha del timeout de bash 120s: commits `cf5e1bb` y `32d35a8`, falsos positivos, mitigacion con `timeout 600 bash -c "git commit ..."` (referenciar `docs/workflows-mantenimiento-guia.md`)
- [x] 2.7 Cubrir el baseline de Semgrep: 19 findings pre-existentes no bloqueadores; el hook solo falla por findings nuevos en archivos staged
- [x] 2.8 Explicar lint-staged config en `package.json` (prettier + eslint con `--max-warnings 0` sobre archivos staged) y su contexto con `docs/adr/turborepo-evaluation.md`
- [x] 2.9 Cerrar con resumen y enlace a `06-ci-yml-walkthrough.md`

## 3. Guia: Walkthrough de ci.yml (06)

- [x] 3.1 Escribir `docs/learning/ci-cd/06-ci-yml-walkthrough.md` con objetivos de aprendizaje y prerequisitos
- [x] 3.2 Explicar la anatomia del workflow: `on: pull_request` hacia main, `permissions: contents: read`, y el diagrama mermaid de los 9 jobs
- [x] 3.3 Explicar el bloque `concurrency` con `group: pr-${{ github.event.pull_request.number }}` y `cancel-in-progress: true`
- [x] 3.4 Desglosar el job `changes`: `dorny/paths-filter@v4` con los filtros client/server/e2e/shared y sus outputs
- [x] 3.5 Desglosar el job `quality`: invocacion del reusable workflow quality.yml con `run-client`/`run-server` (adelanto de guia 07)
- [x] 3.6 Desglosar los jobs test-unit-client y test-unit-server: checkout con `fetch-depth: 0`, composite setup-monorepo, reporter JUnit de Vitest
- [x] 3.7 Desglosar los jobs test-integration y test-smoke: service container `postgres:16-alpine` con healthcheck (`pg_isready`), `prisma migrate deploy`, DATABASE_URL
- [x] 3.8 Desglosar el job build: `npm run build --ws --if-present` con `if: always()`
- [x] 3.9 Desglosar el job e2e: service container postgres:16-alpine (igual que integration/smoke), `prisma migrate deploy`, Playwright Chromium con cache de navegadores, reporter JUnit
- [x] 3.10 Desglosar el job zombie-workflow-guard: verificacion de que workflows eliminados (pr-validation.yml, lint.yml, formatter.yml) no reaparezcan
- [x] 3.11 Explicar el reporting: JUnit reporter (`--reporter=junit --outputFile=reports/junit.xml`), `dorny/test-reporter@v3` adjuntando check runs al PR
- [x] 3.12 Cubrir el gotcha de `fetch-depth` (Caso 2 de `docs/workflows-mantenimiento-guia.md`): sintoma exit 128 → causa shallow checkout → fix `fetch-depth: 0`, por que es opt-in consciente (no "por si acaso")
- [x] 3.13 Cubrir el Caso 1 de `docs/workflows-mantenimiento-guia.md` §3 (incidente EBADENGINE por `omniroute@3.8.49`, fix commit `cf5e1bb`, principio `.nvmrc` SSOT) — explicar por que NO se edita `node-version:` workflow por workflow
- [x] 3.14 Cerrar con resumen y enlace a `07-quality-yml-reusable.md`

## 4. Guia: Workflows reutilizables (07)

- [x] 4.1 Escribir `docs/learning/ci-cd/07-quality-yml-reusable.md` con objetivos de aprendizaje y prerequisitos
- [x] 4.2 Explicar teoria: que es un workflow reutilizable, `workflow_call`, inputs y reutilizacion entre repos/workflows
- [x] 4.3 Desglosar `.github/workflows/quality.yml`: triggers (`workflow_call` + `workflow_dispatch`), inputs `run-client`/`run-server`, setup-node con `.nvmrc` y cache npm, `npm ci`
- [x] 4.4 Explicar los steps condicionales por workspace: lint y format check para client/server segun inputs, y el typecheck que ejecuta `npm run typecheck || echo "Typecheck skipped"` (gap real del repo, ver D8)
- [x] 4.5 Mostrar como `ci.yml` invoca quality.yml (job `quality` con `uses: ./.github/workflows/quality.yml`) y como `workflow_dispatch` permite ejecutarlo manualmente
- [x] 4.6 Explicar la distincion reusable workflow vs composite action (tabla comparativa) y adelantar guia 08
- [x] 4.7 Cerrar con resumen y enlace a `08-composite-actions.md`

## 5. Guia: Composite actions (08)

- [x] 5.1 Escribir `docs/learning/ci-cd/08-composite-actions.md` con objetivos de aprendizaje y prerequisitos
- [x] 5.2 Explicar teoria: que es una composite action, estructura (`name`, `description`, `runs.using: composite`, `steps`), como se guarda en `.github/actions/<nombre>/action.yml`
- [x] 5.3 Desglosar `.github/actions/setup-monorepo/action.yml` linea por linea (24 lineas): setup-node con `node-version-file: '.nvmrc'` y cache npm (`cache-dependency-path: package-lock.json`), `npm ci`, cache de Vitest con `actions/cache@v5` y key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` con `restore-keys` y `exclude`
- [x] 5.4 Explicar la regla "la composite NO hace checkout" (Caso 2 de `docs/workflows-mantenimiento-guia.md`): el job invocador ejecuta `actions/checkout@v5` con `fetch-depth: 0` ANTES; el doble checkout provoco exit 128 en `dorny/test-reporter`
- [x] 5.5 Explicar cuando usar composite vs reusable workflow (tabla) y como se invoca desde los 6 jobs de ci.yml (`uses: ./.github/actions/setup-monorepo`)
- [x] 5.6 Cerrar con resumen y enlace a `09-caching-y-performance.md`

## 6. Guia: Caching y performance (09)

- [x] 6.1 Escribir `docs/learning/ci-cd/09-caching-y-performance.md` con objetivos de aprendizaje y prerequisitos
- [x] 6.2 Explicar teoria: que se cachea en CI, por que (tiempo de CI), vida de una key de cache, invalidation por hash
- [x] 6.3 Explicar el cache npm: `actions/setup-node@v5` con `cache: 'npm'` y `cache-dependency-path: package-lock.json` (un solo lockfile en la raiz)
- [x] 6.4 Explicar el cache de Vitest: key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`, `restore-keys` para reutilizar parcialmente, `exclude: node_modules/.cache/vitest`
- [x] 6.5 Explicar el cache de navegadores Playwright: `~/.cache/ms-playwright` con key `playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` y `npx playwright install --with-deps chromium` condicional al cache-hit
- [x] 6.6 Explicar las reglas de invalidacion: cambio en package-lock.json invalida npm+vitest+playwright; cambio de OS/runner invalida por componente de key; `restore-keys` como fallback
- [x] 6.7 Cubrir el gotcha de `ci-enterprise.yml`: `cache-dependency-path` referencia `frontend/package-lock.json` y `backend/package-lock.json` que no existen en este monorepo (paths reales `apps/client` y `apps/server`) → cache-miss y path filtering muerto (referenciar `docs/workflows-mantenimiento-guia.md`)
- [x] 6.8 Explicar ejecucion local con `act`: `act -j quality -W .github/workflows/quality.yml`, limitaciones (service containers, secrets, caches locales)
- [x] 6.9 Cerrar con resumen y enlace a `10-testing-pipeline.md`

## 7. Guia: Pipeline de testing (10)

- [x] 7.1 Escribir `docs/learning/ci-cd/10-testing-pipeline.md` con objetivos de aprendizaje y prerequisitos
- [x] 7.2 Explicar la piramide de tests (unit/integration/E2E), su distribucion en CI y enlazar a `docs/testing-architecture.md` (link, no copy)
- [x] 7.3 Explicar el path filtering por workspace: como los outputs de `dorny/paths-filter` (client/server/e2e/shared) deciden que jobs de test corren (diagrama mermaid)
- [x] 7.4 Explicar los tests unitarios co-locados: jobs test-unit-client y test-unit-server con reporter JUnit
- [x] 7.5 Explicar los tests de integracion con PostgreSQL real: service container postgres:16-alpine, `prisma migrate deploy`, DATABASE_URL, por que BD real en vez de mocks
- [x] 7.6 Explicar los smoke tests: `vitest.smoke.config.js` en apps/server y el job test-smoke
- [x] 7.7 Explicar los E2E con Playwright: job e2e, Chromium con navegadores cacheados, `playwright test --project=chromium`
- [x] 7.8 Explicar el reporting JUnit al PR: `dorny/test-reporter@v3` adjuntando check runs y la dependencia con `fetch-depth: 0`
- [x] 7.9 Cerrar con resumen y enlace de vuelta al intermedio-README (ultima guia del nivel)

## 8. Verificacion de cross-references

- [x] 8.1 Verificar que las 6 guias (05-10) enlazan correctamente entre si (anterior/siguiente/intermedio-README)
- [x] 8.2 Verificar que las guias enlazan de vuelta a Fundamentos (00-04) cuando asumen conceptos base
- [x] 8.3 Verificar que el intermedio-README enlaza al README de Fundamentos (previo) y al nivel Avanzado (siguiente)
- [x] 8.4 Verificar que los enlaces relativos a `docs/`, `.github/` y `.husky/` apuntan a archivos existentes
- [x] 8.5 Verificar que los snippets citados existen en las rutas indicadas (ci.yml, quality.yml, setup-monorepo/action.yml, hooks de husky, package.json lint-staged, vitest.smoke.config.js)
- [x] 8.6 Re-verificar el contenido de quality.yml:64 (typecheck-skipped gotcha de guide 07) — si `ci-security-hardening` aterrizo y des-suprimio el typecheck, actualizar la guia 07 para reflejar el estado actual

## 9. Verificacion de anti-duplicacion

- [x] 9.1 Verificar que ninguna guia copia secciones enteras (>40 lineas) de `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md` ni `docs/code-style.md` — deben enlazar en su lugar
- [x] 9.2 Verificar que los snippets cortos (<40 lineas) citan la ruta fuente
- [x] 9.3 Verificar que el contenido didactico (teoria, analogias, walkthroughs) es original de las guias y no duplica la documentacion tecnica existente

## 10. Control de calidad markdown

- [x] 10.1 Cada guia (05-10) tiene learning objectives + prereqs section ("completed Fundamentos level"); intermedio-README.md entre 200-800 lineas; las 6 guias entre 800-1500 lineas cada una
- [x] 10.2 Verificar que todas las guias tienen secciones de objetivos de aprendizaje y prerequisitos ("debes haber completado el nivel Fundamentos 00-04")
- [x] 10.3 Ejecutar lint de markdown disponible en el repo (o verificacion manual de formato: tablas validas, mermaid sin errores, codigo en espanol)
- [x] 10.4 Verificacion final: revisar que las 6 guias + intermedio-README cumplen los requisitos de `specs/cicd-intermediate-guide/spec.md` y `specs/cicd-intermedio-readme-index/spec.md`
