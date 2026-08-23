# Tasks: ci-shifting-left

## Fase A (inmediata, <1 semana)

### Task A1: Instalar y configurar actionlint + yamllint en pre-commit y CI

- [ ] Verificar que `actionlint` y `yamllint` están disponibles (instalar via brew/apt en CI runner o usar `rhysd/actionlint` action)
- [ ] Añadir a `lint-staged` en `package.json` raíz: `"*.{yml,yaml}": "actionlint && yamllint"` (o reglas separadas para `.github/workflows/**`)
- [ ] Añadir job `validate-pipeline` en `.github/workflows/ci.yml` con `dorny/paths-filter` (solo cuando cambian `.github/workflows/**` o `.github/dependabot.yml`)
- [ ] Job `validate-pipeline`: correr `actionlint` sobre todos los `.github/workflows/*.yml` y `yamllint` sobre los YAML
- [ ] Probar: commit con workflow inválido debe bloquearse en pre-commit; PR con workflow inválido debe fallar en CI

### Task A2: Añadir db-contract job y validación Prisma en pre-commit

- [ ] Añadir script `db:contract` en `apps/server/package.json`: `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code`
- [ ] Añadir job `db-contract` en `.github/workflows/ci.yml` (backend) que ejecuta `npm run db:contract --workspace=server-express`
- [ ] Añadir a `lint-staged`: `"prisma/schema.prisma": "prisma validate && prisma format --check"` (con working-directory apps/server)
- [ ] Probar: modificar schema sin migración → job falla con exit 2; schema válido → pasa

### Task A3: Configurar Dependabot + dependency-review como required status check

- [ ] Crear `.github/dependabot.yml` con ecosystems `npm` (root), `docker` (Dockerfiles), `github-actions` (workflows)
- [ ] Verificar que `actions/dependency-review-action@v4` corre en `security.yml` (ya existe como v5 — alinear a v4 o mantener v5 según decisión)
- [ ] Correr dependency-review como **advisory** (non-required) durante 1 semana y validar ausencia de falsos positivos
- [ ] Activar `dependency-review` como **required status check** en branch protection de `main` (Settings → Branches → main → Require status checks)
- [ ] Documentar el BREAKING change para PRs existentes (comunicar al equipo antes de activar)

### Task A4: Instalar eslint-plugin-security y eslint-plugin-jsx-a11y

- [ ] Instalar `eslint-plugin-security` en `apps/server` (devDependency)
- [ ] Añadir `plugin:security/recommended` a `apps/server/eslint.config.*`
- [ ] Instalar `eslint-plugin-jsx-a11y` en `apps/client` (devDependency)
- [ ] Añadir `plugin:jsx-a11y/recommended` a `apps/client/eslint.config.*`
- [ ] Verificar que corren via lint-staged y `quality.yml` (mismo gate existente, `--max-warnings 0`)
- [ ] Probar: violación de security/a11y en archivo staged → commit bloqueado

### Task A5: Instalar knip + job CI de deadcode

- [ ] Instalar `knip` en la raíz (devDependency)
- [ ] Crear `knip.json` en la raíz con entry points y project patterns por workspace (client, server, e2e)
- [ ] Añadir script `knip` en `package.json` raíz: `knip` y `knip --production`
- [ ] Añadir job `knip` en `.github/workflows/ci.yml` que corre `npx knip` y `npx knip --production` (exit 1 si hay unused)
- [ ] Correr en advisory mode la primera semana; ajustar entry points ante falsos positivos
- [ ] Probar: añadir dep sin usar → job falla

### Task A6: Añadir TruffleHog a security.yml

- [ ] Añadir job `trufflehog` en `.github/workflows/security.yml` (o `scheduled-security.yml`)
- [ ] Job: `trufflehog github --repo ${{ github.repository }} --results=verified`
- [ ] Verificar que complementa Gitleaks (ambos corren, no se reemplaza ninguno)
- [ ] Probar: secret verificado → job falla; sin secrets verificados → pasa

## Fase B (1-2 semanas)

### Task B1: Spectral + openapi.yaml + job api-contract

- [ ] Instalar `@stoplight/spectral-cli` en `apps/server` (devDependency)
- [ ] Crear `apps/server/.spectral.yaml` extends `spectral:oas` + reglas custom (naming, no-numeric-ids, no-http-basic, request-GET-no-body)
- [ ] Crear/mover `apps/server/openapi.yaml` (si no existe, generar desde swagger-jsdoc)
- [ ] Añadir script `lint:api` en `apps/server/package.json`: `spectral lint openapi.yaml`
- [ ] Añadir job `api-contract` en `.github/workflows/ci.yml`: `npm run lint:api --workspace=server-express`
- [ ] Probar: violación de regla custom en openapi.yaml → job falla

### Task B2: size-limit + Lighthouse CI con budgets

- [ ] Instalar `size-limit` + `@size-limit/esbuild` en `apps/client` (devDependencies)
- [ ] Crear `.size-limit.json` en client con budgets por página/entry
- [ ] Añadir script `size` en `apps/client/package.json`: `size-limit`
- [ ] Instalar `@lhci/cli` (o usar `treosh/lighthouse-ci-action@v11`) en client
- [ ] Crear `budget.json` con LCP < 2500ms, TBT < 200ms, total < 200KB
- [ ] Añadir job `frontend-budgets` en `.github/workflows/ci.yml` (Lighthouse CI contra preview/build)
- [ ] Correr Lighthouse CI como advisory 1 semana; ajustar budgets si hay falsos positivos
- [ ] Activar Lighthouse CI como **required status check** en branch protection de `main`

### Task B3: Sharding de E2E con Playwright

- [ ] Modificar job `e2e` en `.github/workflows/ci.yml`: `strategy.matrix: shardIndex: [1,2,3,4], shardTotal: [4]`
- [ ] Cada shard: `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`
- [ ] Configurar reporter `blob` en `e2e/playwright.config.js` (CI) + upload de blob reports como artifact
- [ ] Añadir job `merge-reports`: `npx playwright merge-reports --reporter=html` + upload del HTML
- [ ] Activar `fullyParallel: true` y `retries: 2` en `e2e/playwright.config.js`
- [ ] Actualizar cache de browsers keyed por versión de `@playwright/test` (no solo package-lock.json)
- [ ] Probar: E2E completo corre en ~6min con 4 shards y reporte mergeado

## Documentación

### Task D1: Completar Ejercicio 6 del doc 00-que-es-cicd.md

- [ ] Reemplazar las 3 filas con `******\*\*\*\*******` del Ejercicio 6 (líneas 653-655) con:
  - Fila 1: "Validación de schema de API (OpenAPI) → Spectral en pre-commit/CI, ahorro ~80-95%"
  - Fila 2: "Check de dependencias vulnerables → Dependabot + dependency-review-action, ahorro ~90%"
  - Fila 3: "Test de contrato de base de datos → `prisma migrate diff --exit-code`, ahorro ~90-95%"
- [ ] Actualizar la línea 657 "Para cada una: ¿qué tool/hook la ejecutaría antes? ¿Cuánto tiempo ahorrarías estimado?" con la respuesta concreta por validación
