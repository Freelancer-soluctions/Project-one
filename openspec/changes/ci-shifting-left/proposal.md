## Why

El proyecto ya tiene una base sólida de shifting left (Husky pre-commit con Semgrep + Gitleaks + lint-staged + commitlint, pre-push con `vitest --changed`, 9 workflows de GitHub Actions, preview environments), pero la investigación exhaustiva del @researcher (Engram #596) identificó 15+ validaciones adicionales de alto ROI que hoy se detectan tarde (staging/prod, 100-1000x costo) y pueden moverse a temprano (editor/pre-commit/CI, 1-10x). La curva de costo exponencial está respaldada por IBM (1x→100x), NASA (1x→1500x) y NIST ($22-59B/año). Adicionalmente, el Sonatype 2024 reporta +156% de paquetes maliciosos YoY (704K) y 95% de vulnerabilidades consumidas con fix disponible sin aplicar — urgencia regulatoria (EU CRA, EO 14028, SSDF).

## What Changes

**Fase A (inmediata, <1 semana):**

- Añadir `actionlint` + `yamllint` en lint-staged (pre-commit) y job `validate-pipeline` en CI con paths-filter (solo cuando cambian `.github/workflows/**`)
- Añadir job CI `db-contract` en `ci.yml` (backend) que ejecuta `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code` (exit 2 = drift)
- Añadir `prisma validate` + `prisma format --check` en lint-staged
- Añadir script `db:contract` en `apps/server/package.json`
- **BREAKING** para PRs: Añadir `actions/dependency-review-action@v4` como required status check en `main` (bloquea PRs que introducen CVEs)
- Añadir `.github/dependabot.yml` (npm + docker + github-actions ecosystems) para remediación automática de CVEs
- Instalar `eslint-plugin-security` y `eslint-plugin-jsx-a11y` en client y server
- Añadir `plugin:security/recommended` y `plugin:jsx-a11y/recommended` a `eslint.config.*` (client y server)
- Instalar `knip` + configuración `knip.json` con workspaces
- Añadir `knip` como job CI (exit 1 si hay unused deps/exports/files, default + `--production`)

**Fase B (1-2 semanas):**

- Instalar `@stoplight/spectral-cli` en server
- Crear `.spectral.yaml` extends `spectral:oas` + reglas custom (naming, no-numeric-ids, no-http-basic, request-GET-no-body)
- Crear/mover `apps/server/openapi.yaml` (si no existe)
- Añadir job `api-contract` en CI: `spectral lint openapi.yaml`
- Instalar `size-limit` + `@size-limit/esbuild` en client
- Crear `.size-limit.json` con budgets por página
- Añadir `@lhci/cli` o `treosh/lighthouse-ci-action` con `budget.json` (LCP < 2500ms, TBT < 200ms, total < 200KB) como required check
- Modificar el job `e2e` en `ci.yml` para usar `strategy.matrix: shardIndex: [1,2,3,4], shardTotal: [4]` (Playwright sharding)
- Configurar reporter `blob` + `merge-reports --reporter=html` post-sharding
- Activar `fullyParallel: true` y `retries: 2` en `playwright.config.ts`
- Cache de browsers keyed por `@playwright/test` version
- Añadir job `trufflehog` en `security.yml` o `scheduled-security.yml`: `trufflehog github --repo ${{ github.repository }} --results=verified`

**Documentación:**

- Actualizar `docs/learning/ci-cd/00-que-es-cicd.md` Ejercicio 6 (filas con `***\*\*\***`) con las 3 validaciones concretas:
  1. Validación de schema de API (OpenAPI) → Spectral en pre-commit/CI, ahorro ~80-95%
  2. Check de dependencias vulnerables → Dependabot + dependency-review-action, ahorro ~90%
  3. Test de contrato de base de datos → `prisma migrate diff --exit-code`, ahorro ~90-95%

## Capabilities

### New Capabilities

- `workflow-linting`: validación estática de workflows GitHub Actions con actionlint + yamllint en pre-commit y CI (catch de sintaxis inválida, expresiones `${{ }}` malformadas, permisos, shells, antes de que el workflow falle en runtime)
- `db-contract-testing`: contrato de schema Prisma vs migraciones aplicadas via `prisma migrate diff --exit-code`, `prisma validate`, `prisma format --check`; detecta drift de DB en CI en vez de deploy
- `dependency-governance`: SCA con loop de remediación automática — Dependabot (fix PRs) + dependency-review-action (gate en PR) + Trivy (detección profunda via audit)
- `shift-left-lint-extensions`: reglas ESLint adicionales (security + jsx-a11y) corriendo via lint-staged y `quality.yml` para SAST básico + accesibilidad temprana
- `deadcode-detection`: knip en CI para detectar exports, archivos y dependencies sin usar en el monorepo (default + production mode)
- `api-contract-linting`: Spectral contra `openapi.yaml` para validar contrato OpenAPI (estilo, seguridad, naming) en pre-commit/CI
- `frontend-budgets`: size-limit + budget de Lighthouse CI (LCP/TBT/total-size) como required status check en client
- `e2e-sharding`: Playwright sharding con matrix de 4 shards + blob reporter + merge-reports + fullyParallel + retries para reducir lead time del CLI de E2E de 20min → ~6min
- `secret-verification`: TruffleHog en CI con `--results=verified` para verificar secretos contra API emisora (complementa Gitleaks)

### Modified Capabilities

- `ci-supply-chain-security`: el job `dependency-review` (`actions/dependency-review-action@v4`) pasa a ser **required status check** en `main` — enforcement a nivel de branch protection, no solo job que falla; el PR queda bloqueado de merge de forma garantizada al introducir dependencias vulnerables o licencias incompatibles.

## Impact

**Affected code:**

- `.github/workflows/ci.yml` (nuevos jobs: `validate-pipeline`, `db-contract`, `api-contract`, `frontend-budgets`, matrix en `e2e`)
- `.github/workflows/security.yml` (nuevo job: `trufflehog`)
- `.github/dependabot.yml` (nuevo archivo)
- `.husky/pre-commit` (actionlint, yamllint, prisma validate/format)
- `apps/server/package.json` (script `db:contract`, deps Spectral, eslint-plugin-security)
- `apps/client/package.json` (deps size-limit, @lhci/cli, eslint-plugin-jsx-a11y)
- `apps/server/eslint.config.*` (security plugin)
- `apps/client/eslint.config.*` (jsx-a11y plugin)
- `apps/server/.spectral.yaml` (nuevo)
- `apps/server/openapi.yaml` (nuevo o modificado)
- `.size-limit.json` (client, nuevo)
- `.lighthouserc.json` o `budget.json` (nuevo)
- `knip.json` (raíz, nuevo)
- `package.json` (raíz, knip script)
- `apps/e2e/playwright.config.ts` (fullyParallel, retries, shard config)
- `apps/server/prisma/schema.prisma` — solo lectura (no se modifica schema; solo se valida)

**Affected docs:**

- `docs/learning/ci-cd/00-que-es-cicd.md` — completar Ejercicio 6 (3 líneas en blanco)

**Dependencies nuevas:**

- `eslint-plugin-security`, `eslint-plugin-jsx-a11y`, `@stoplight/spectral-cli`, `size-limit`, `@size-limit/esbuild`, `@lhci/cli`, `knip`
- Actions: `actions/dependency-review-action@v4`, `treosh/lighthouse-ci-action@v11` (o `@lhci/cli`)
- Binaries (CI): `actionlint`, `yamllint`, `trufflehog`

**Sistemas:**

- GitHub Actions (required status checks change — **BREAKING** para PRs existentes)
- Dependabot (configuración nueva en repo settings)
