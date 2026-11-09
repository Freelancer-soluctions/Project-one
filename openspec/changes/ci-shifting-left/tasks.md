# Tasks: ci-shifting-left

## Fase A (inmediata, <1 semana)

### Task A1: Instalar y configurar actionlint + yamllint en pre-commit y CI (SLIMMED)

- [x] actionlint ya entregado por `ci-prebuild-lint`/`ci-supply-chain-hygiene`: root devDep `actionlint@2.0.6` (package.json:106), advisory en pre-commit (.husky/pre-commit:54-57) y job `actionlint-advisory` en ci.yml:1830. Blocking promotion queda a cargo de `pipeline-config-scan` FASE 2.
- [x] yamllint: política única `.yamllint.yml` (raíz) + wrapper `scripts/ci/yamllint-staged.mjs` (fail-open solo si el binario no está instalado, igual que gitleaks) + job CI. Baseline verificado: `yamllint -c .yamllint.yml .github/workflows/*.yml .github/dependabot.yml` = exit 0 (se corrigieron 5 hallazgos preexistentes: trailing spaces en ci.yml, newline EOF en release/security-digest/dependabot, blank line final en scheduled-security).
- [x] Entrada yml en `lint-staged` (package.json): `".github/**/*.{yml,yaml}": "node scripts/ci/yamllint-staged.mjs"` (y `"apps/server/prisma/schema.prisma"` para A2).
- [x] Placement del job decidido SIN duplicar `pipeline-config-scan` FASE 2: nuevo job `validate-pipeline` en SUBSTAGE 2B (quality), con ámbito propio `workflows` en `repo-discovery` (`.github/workflows/**`, `.github/dependabot.yml`, `.yamllint.yml`). Corre yamllint + actionlint (imagen `rhysd/actionlint:1.7.12`, la misma del job advisory) como gate blocking; `actionlint-advisory` conserva su rol SARIF y su promoción FASE 2 queda intacta. Añadido a `prebuild-quality-complete.needs`.

### Task A2: Añadir db-contract job y validación Prisma en pre-commit

- [x] Script `db:contract` en `apps/server/package.json` → `scripts/ci/db-contract.mjs`. **Desviación necesaria**: Prisma EXIGE `--shadow-database-url` cuando `--from-migrations` apunta a un directorio ("You must pass the --shadow-database-url…", verificado con prisma 5.22); el script añade el flag y falla con mensaje accionable si `SHADOW_DATABASE_URL` falta (nunca verde falso).
- [x] Job `db-contract` en `ci.yml` (SUBSTAGE 2B, path-scoped `server`): service `postgres:16-alpine`, creación explícita de `shadow_db` y ejecución de `npm run db:contract --workspace=apps/server` con `DATABASE_URL` + `SHADOW_DATABASE_URL`. Añadido a `prebuild-quality-complete.needs`.
- [x] `lint-staged`: `"apps/server/prisma/schema.prisma": "node scripts/ci/prisma-schema-check.mjs"` (validate + `format --check` con cwd `apps/server`, para que Prisma cargue `.env`). El wrapper ignora los args que añade lint-staged.
- [x] `prisma format --check` quedó verde tras **normalizar** `schema.prisma` con `prisma format`: solo reordenó `@default`/`@db.*` y quitó líneas en blanco (diff `-w`: 2 inserciones/4 borrados, sin cambios semánticos; no se añadió/quitaron modelos ni campos).
- [ ] Probar drift real (schema sin migración → exit 2): **no verificable en local** (sin Postgres/shadow DB disponible; Docker daemon parado). Verificado el contrato del script: exit 1 con `SHADOW_DATABASE_URL` ausente y con base inalcanzable. La detección de drift queda cubierta por el job cuando corra en CI.

### Task A3: Configurar Dependabot + dependency-review como required status check

- [x] `.github/dependabot.yml` existe (npm + github-actions + docker) — entregado por `sca-lockfile-compliance`; spec `ci-dependabot`.
- [x] `dependency-review` job blocking en ci.yml:1466 (`dependency-review-action@v5`), cableado a `prebuild-security-complete.needs` (ci.yml:2820).
- [x] "required status check" es moot: el ruleset usa un único check requerido `ci-complete`; el bloqueo ocurre por agregación (documentado en `dependency-review` design.md:23,32). Sub-tareas de activación en branch protection archivadas como superseded.

### Task A4: Instalar eslint-plugin-security y eslint-plugin-jsx-a11y

- [x] `eslint-plugin-security@4.2.1` en `apps/server` (devDependency).
- [x] `plugin:security/recommended` aplicado en `eslint.config.js` (bloque 3, server): 14 de sus 15 reglas activas. **Excepción documentada**: `security/detect-object-injection` desactivada (47 hallazgos, todos accesos a mapas internos tipados: campos Prisma por nombre, `process.env[EnvKey]`, mapas de labels) — la razón está escrita en la config.
- [x] `eslint-plugin-jsx-a11y@6.10.2` en `apps/client` (devDependency).
- [x] `plugin:jsx-a11y/recommended` aplicado en `eslint.config.js` (bloque 4, client). Se corrigieron los 6 errores reales que destapó: headings/enlaces de `ui/alert`, `ui/card`, `ui/pagination` (children explícitos) y las celdas/headers clickables de `dataTable` y `EventCalendar` (role + tabIndex + Enter/Espacio).
- [x] Mismo gate existente: no hay `quality.yml` (zombie-workflow-guard lo prohíbe); corre en `lint-staged` (eslint `--max-warnings 0`) y en los jobs `client-lint`/`server-lint` de `ci.yml`.
- [x] Verificado que bloquea: con los plugins recién activados, `npm run lint` falló con 49 warnings (server) y 6 errores (client); tras corregir, ambos workspaces pasan con exit 0.

### Task A5: Instalar knip + job CI de deadcode

- [x] Entregado por archived `2026-09-23-knip-consolidation`: `knip.jsonc` en raíz, scripts `knip`/`knip:client`/`knip:server`/`knip:ci` (package.json:76-79), devDep `knip@6.32.2` (package.json:118), jobs `client-dead-code` (ci.yml:2021) y `server-dead-code` (ci.yml:2137), ambos en `prebuild-quality-complete.needs` (ci.yml:2808/2814) → blocking. Spec `knip-config-single-source`.

### Task A6: Añadir TruffleHog a security.yml

- [x] Job `trufflehog` en `.github/workflows/security.yml` (imagen fijada `ghcr.io/trufflesecurity/trufflehog:3.99.4`, nunca `:latest`).
- [x] Ejecuta `trufflehog github --repo <server_url>/<repo> --results=verified --fail --token $GITHUB_TOKEN` (`--repo` como URL completa, formato que documenta la CLI; `--fail` es lo que convierte un hallazgo verificado en exit 183 → job rojo).
- [x] Complementa Gitleaks: Gitleaks sigue en el diff/PR y en el scan semanal; TruffleHog escanea el historial del repo y solo reporta credenciales verificadas.
- [ ] Probar secret verificado → job falla: **no ejecutado** (requiere Docker daemon/red contra la API del emisor). Validado el YAML y la semántica de flags contra la documentación oficial de TruffleHog.

## Fase B (1-2 semanas)

### Task B1: Spectral + openapi.yaml + job api-contract

- [x] `@stoplight/spectral-cli@6.17.1` en `apps/server` (devDependency).
- [x] `apps/server/.spectral.yaml`: extends `spectral:oas` + 5 reglas custom en `error` (operationId lowerCamelCase, path params lowerCamelCase, sin ids numéricos literales en paths, sin HTTP Basic, GET sin requestBody).
- [x] `apps/server/openapi.yaml` **generado y versionado** desde las anotaciones `@openapi`: se corrigieron los globs de swagger-jsdoc (apuntaban a `src/components/**`, inexistente) en `src/docs/swagger-options.ts` (fuente única con el runtime), y el generador `scripts/generate-openapi.ts` normaliza los prefijos (`/v1/...` → `/api/v1/...`) y ordena. 44 paths / 80 operaciones. De paso se arregló una anotación YAML rota en `purchase/routes.ts` (línea sin `*` que descartaba un bloque entero).
- [x] Script `lint:api` (`spectral lint openapi.yaml --ruleset .spectral.yaml`) y `openapi:generate`.
- [x] Job `api-contract` en `ci.yml`: verifica que `openapi.yaml` esté regenerado (`git diff --exit-code`) y lintea.
- [x] **Deuda de refs cerrada**: los 28 `$ref` huérfanos que obligaban al modo advisory ya resuelven. Los 25 schemas de RRHH y los cuerpos PATCH viven en `apps/server/src/docs/schemas-shift-left.ts` (nuevo glob `src/docs/schemas-*.ts` en `swagger-options.ts`), `Employee` se añadió, y `ProductProvider` / `approver` ahora apuntan a los schemas existentes `ResponseGetProductProvider` y `ResponseGetUser`. `spectral lint` → **0 errores** (227 warnings de `spectral:oas`: operationId/description/tags, deuda visible sin relajar severidad).
- [x] Job **promovido a blocking**: sin `continue-on-error`, añadido a `prebuild-quality-complete.needs` y renombrado `Quality: API Contract`.
- [x] Probar violación de regla custom: fichero temporal con `/users/123` + GET con body → `api-no-numeric-ids` y `api-request-get-no-body` en `error`, spectral exit 1.

### Task B2: size-limit + Lighthouse CI con budgets

- [x] `size-limit` + `@size-limit/esbuild` + `@size-limit/file` en `apps/client` (devDependencies). Los entries miden el build (`dist/assets/*.js`) con el plugin `file`; `@size-limit/esbuild` se desactiva por entry con `disablePlugins` porque el cliente usa el alias `@/` (279 ficheros) y esbuild sin ese alias no resuelve el grafo.
- [x] `.size-limit.json` con budgets por entry: index 240 kB, chunk diferido Notes 200 kB, JS total 700 kB (gzip). Medido: 220.88 / 175.77 / 628.95 kB → verde con ~9% de holgura.
- [x] Script `size` en `apps/client/package.json`.
- [x] `@lhci/cli` en `apps/client` + `.lighthouserc.json` (`vite preview` como server, assertions LCP < 2500 ms, TBT < 200 ms, total-byte-weight < 204800 B).
- [x] `apps/client/budget.json` (total 200 KiB, script 150 KiB, stylesheet 30 KiB, third-party ≤ 10).
- [x] Job `frontend-budgets` en `ci.yml` (build + size-limit + `lhci autorun` + artifact del reporte).
- [x] **Budget de `total-byte-weight` cumplido**: `lhci autorun` mide **200 375 B** (196 KiB) contra el límite de 204 800 B, con LCP 211 ms y TBT 0 ms. La causa del exceso anterior (231 819 B) era `Home` importado estáticamente en `App.jsx`: arrastraba calendario, resúmenes y editor al bundle de entrada aunque `/` solo monta `Layout`. Ahora entra por `lazy()` como el resto de rutas (entrada 215 788 → 184 379 B gzip).
- [x] Job **promovido a blocking**: sin `continue-on-error`, renombrado `Quality: Frontend Budgets` y añadido a `prebuild-quality-complete.needs`.
- [ ] Correr Lighthouse CI como advisory 1 semana: **no aplicable** — el gate pasó a blocking al cumplirse el budget; queda como deuda de proceso, no técnica.
- [ ] Activar los checks como **required status check** en branch protection de `main`: pendiente (branch protection se cambia fuera del repo).

### Task B3: Sharding de E2E con Playwright (CONDICIONAL)

> Precondición NO cumplida: el job `e2e` sigue deshabilitado (`if: false`). No se aplica hasta reactivar E2E.

- [ ] Modificar job `e2e` en `.github/workflows/ci.yml`: `strategy.matrix: shardIndex: [1,2,3,4], shardTotal: [4]`
- [ ] Cada shard: `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`
- [ ] Configurar reporter `blob` en `e2e/playwright.config.js` (CI) + upload de blob reports como artifact
- [ ] Añadir job `merge-reports`: `npx playwright merge-reports --reporter=html` + upload del HTML
- [ ] Activar `fullyParallel: true` y `retries: 2` en `e2e/playwright.config.js` (`retries: 2` ya existe en CI; `fullyParallel` no)
- [ ] Actualizar cache de browsers keyed por versión de `@playwright/test` (hoy keyed por `package-lock.json`)
- [ ] Probar: E2E completo corre en ~6min con 4 shards y reporte mergeado

## Sync (post-fix)

### Task S1: Sincronizar delta specs a main specs

- [ ] Ejecutar `openspec sync ci-shifting-left` para propagar los 9 capabilities nuevos (`workflow-linting`, `db-contract-testing`, `dependency-governance`, `shift-left-lint-extensions`, `deadcode-detection`, `api-contract-linting`, `frontend-budgets`, `e2e-sharding`, `secret-verification`) y el MODIFIED de `ci-supply-chain-security` a `openspec/specs/`.
- [ ] Verificar con `openspec validate --specs --strict` que no haya errores tras el sync.
- [ ] Archivar el change (`openspec archive ci-shifting-left`) solo cuando B2 (required status check) y los [ ] pendientes estén resueltos o explícitamente diferidos.

## Documentación

### Task D1: Completar Ejercicio 6 del doc 00-que-es-cicd.md

- [x] Sustituidas las 3 filas con `******\*\*\*\*******` del Ejercicio 6 por las 3 validaciones concretas: schema OpenAPI → Spectral (ahorro ~80-95%), dependencias vulnerables → Dependabot + dependency-review (~90%), contrato de BD → `prisma migrate diff --exit-code` (~90-95%).
- [x] La línea de la pregunta se mantiene y se responde por validación (tool/hook que la adelanta y por qué el ahorro es real).
