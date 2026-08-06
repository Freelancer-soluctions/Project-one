## Context

El proyecto es un monorepo Node.js con workspaces npm. CI actual tiene jobs de cambios y quality activos pero tests y build comentados.

**Estado actual de CI:**
- `ci.yml` tiene jobs `changes` (dorny/paths-filter) y `quality` (reusa quality.yml)
- Tests unitarios, integración, build, y E2E están comentados
- `ci-enterprise.yml` referencia paths `frontend/`, `backend/` que NO existen en el monorepo (los reales son `apps/client`, `apps/server`)
- Sin caching de dependencias ni test artifacts
- Sin test reporting en PRs

**Contexto del proyecto:**
- Monorepo npm workspaces: client-react (Vite + React), server-express (Express + Prisma), e2e (Playwright)
- JavaScript puro (no TypeScript)
- Prisma ORM con PostgreSQL
- Husky hooks para pre-commit y pre-push
- ESLint + Prettier para calidad de código

## Goals / Non-Goals

**Goals:**
1. Pipeline CI completo con tests unitarios (client + server), integración (server + PostgreSQL), build, y E2E
2. Multi-layer caching para CI < 7 minutos
3. Test reporting con anotaciones en PR
4. Detección inteligente de cambios por workspace
5. Manejo de tests flaky con retries
6. Coverage thresholds como gate de calidad (baseline-driven)

**Non-Goals:**
- CD / despliegue automático (Sprint 2+)
- Preview environments (Sprint 2)
- Migración de workflows zombie (Sprint 2)
- Integración con Floci (Sprint 2+)
- Security scanning en CI (ya existe en security.yml)

## Decisions

### D1: Composite Action for Setup

**Decisión:** Crear `.github/actions/setup-monorepo/action.yml` con checkout + setup-node + npm ci + Vitest cache.
**Alternativas:** Repetir setup en cada job, usar matrix strategy.
**Rationale:** Elimina duplicación entre jobs. Un solo lugar para cambios de setup. Fácil de mantener.
**Tradeoff:** Acción local no es reusable entre repos, pero es el estándar para monorepos.

### D2: Independent Jobs vs Matrix

**Decisión:** Jobs independientes por workspace (test-unit-client, test-unit-server, test-integration, build, e2e) con `fail-fast: false`.
**Alternativas:** Matrix strategy con include por workspace.
**Rationale:** Jobs independientes permiten condiciones `if:` claras por workspace, mejor paralelismo, y reportes separados por tipo de test.
**Tradeoff:** Más lines de YAML, pero más legible y debuggable.

### D3: Change Detection via dorny/paths-filter

**Decisión:** Usar `dorny/paths-filter@v3` con filtros por workspace + shared detection.
**Rationale:** Ya está configurado en ci.yml actual. Se extiende para incluir `e2e` y `shared` (package.json, lockfile, workflows).
**Shared trigger:** Cuando cambia package.json o package-lock.json, TODOS los test jobs se ejecutan porque el cambio de dependencias puede afectar cualquier workspace.

### D4: Multi-Layer Caching

**Decisión:** Tres capas de cache independientes.

| Capa | Mecanismo | Key | Ubicación |
|------|-----------|-----|-----------|
| npm | `setup-node@v4` `cache: 'npm'` | hash package-lock.json | `~/.npm` |
| Vitest | `actions/cache@v4` | `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` | `node_modules/.cache/vitest` (root-level) |
| Playwright | `actions/cache@v4` | `playwright-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}` | `~/.cache/ms-playwright` |

**Nota:** Vitest cache path usa root `node_modules/.cache/vitest`, no `apps/*/node_modules/.cache/vitest`. npm hoists dependencias a la raíz del monorepo; workspace-local `node_modules/` son symlinks que no persisten cache directories.
**Rationale:** npm cache es built-in y más rápido. Vitest cache evita re-ejecutar tests no afectados. Playwright browsers evita descargar Chromium +300MB en cada run.

### D5: PostgreSQL Service Container (Tests + E2E)

**Decisión:** Usar GitHub Actions service container con `postgres:16-alpine` para tests de integración Y E2E.
**Health check:** `pg_isready` con interval 10s, timeout 5s, retries 5.
**Rationale:** El backend Express requiere PostgreSQL para arrancar — tanto en tests de integración como en E2E (Playwright webServer). GitHub Actions soporta service containers nativamente. Prisma migrate deploy replica el esquema exacto de producción.
**E2E specific:** El job e2e también necesita PostgreSQL porque el Playwright webServer (`npm run dev --workspace=server-express`) conecta a DB. Sin service container, E2E falla en cada run.

### D6: Test Reporting with dorny/test-reporter

**Decisión:** `dorny/test-reporter@v3` con reporter `java-junit` para parsear JUnit XML.
**Rationale:** Crea GitHub Check Run con anotaciones en el PR — los desarrolladores ven qué tests fallaron y dónde sin salir del PR. Alternativa: `EnricoMi/publish-unit-test-result-action` (más features pero más complejo).
**Playwright config:** Agregar `--reporter=junit,list --output=reports/junit-e2e.xml` para generar JUnit XML de E2E también.

### D7: Flaky Test Handling

**Decisión:**
- Playwright: `retries: process.env.CI ? 2 : 0` en `playwright.config.js`
- Vitest integration: `retry: 2` en `vitest.config.js` del server
**Rationale:** Tests de integración con base de datos son inherentemente más flaky (timing, conexiones). Playwright E2E tiene interacciones asíncronas que pueden fallar intermitentemente.
**Playwright system deps:** Usar `npx playwright install --with-deps chromium` en CI para instalar system libraries (libgtk, libnss, etc.) necesarias en Linux runners.

### D8: Coverage Thresholds (Baseline-Driven)

**Decisión:** No usar thresholds estáticos (80%). En su lugar:
1. Ejecutar `npm run test:coverage` en ambos workspaces
2. Registrar baselines actuales de statements, branches, functions, lines
3. Configurar thresholds a esos valores (o ligeramente por debajo)
4. Crear follow-up change para incrementar gradualmente
**Rationale:** Thresholds fijos al 80% fallarían en el primer run porque muchos módulos server carecen de cobertura. Esto bloquea el pipeline y erosiona confianza. El enfoque baseline-driven asegura que el pipeline pase desde el inicio y mejora incrementalmente.
**Alternativas:** No poner thresholds (sin gate). Umbrales fijos al 50%.
**Tradeoff:** Sin baseline, el primer pipeline falla. Con baseline, el gate es real desde el día 1.

### D9: Build Job Always Runs

**Decisión:** `build` job corre con `if: always()` para ejecutarse incluso si algún test falló.
**Rationale:** Queremos saber si el build también está roto independientemente de los tests. Un test puede fallar por razones ajenas al build.

### D10: Job Timeouts

**Decisión:** Cada job tiene `timeout-minutes` explícito:
- Unit tests: 10 min
- Integration tests: 10 min
- E2E: 15 min (más lento por browser + DB setup)
- Build: 10 min
- Quality/lint: 10 min
**Rationale:** Sin timeout, jobs pueden correr 360 minutos por defecto. Si Prisma migration cuelga o Playwright browser download se atasca, el pipeline nunca termina.

### D11: Explicit Playwright Projects Config

**Decisión:** Agregar `projects:` array explícito en `e2e/playwright.config.js` con `{ name: 'chromium', use: { browserName: 'chromium' } }`.
**Rationale:** Playwright v1.58+ requiere `projects:` definido explícitamente para `--project=chromium`. Sin esto, el flag puede fallar o ignorarse.

### D12: Unskip Integration Tests in CI

**Decisión:** Remover `describe.skip` de `events-soft-delete.integration.test.js` y `events-combined-filters.integration.test.js`.
**Rationale:** Estos tests fueron skipeados en desarrollo porque requerían base de datos real. CI ahora proporciona PostgreSQL — deben ejecutarse. Si fallan, arreglar seed data o mock adjustments.

## Risks / Trade-offs

- **[R1: CI timeout en PRs grandes]** → Mitigation: Caching multi-capa + path-filtering + jobs paralelos. Target < 7 min. Hard timeout 10-15 min por job.
- **[R2: Flaky tests en integración]** → Mitigation: Retry 2 en Vitest + Playwright. Considerar cuarentena automática con DeFlaky si persiste.
- **[R3: Service container PostgreSQL no disponible]** → Mitigation: Health check con pg_isready + retries 5. Fallback a PostgreSQL local en desarrollo.
- **[R4: Cache miss frecuente por lockfile changes]** → Mitigation: restore-keys con `vitest-${{ runner.os }}-` para al menos recuperar cache parcial.
- **[R5: Coverage thresholds muy agresivos]** → Mitigation: Baseline-driven approach — usar thresholds actuales del proyecto y ajustar gradualmente en follow-up change.
- **[R6: Integration tests skipped al activarse en CI]** → Mitigation: Remover `describe.skip` y arreglar dependencias de seed data antes de mergear.

## Migration Plan

1. Crear `.github/actions/setup-monorepo/action.yml` (composite action)
2. Extender `changes` job en ci.yml para outputs `e2e` y `shared`
3. Configurar jobs test-unit-client, test-unit-server, test-integration en ci.yml
4. Configurar PostgreSQL service container + Prisma migrate deploy en test-integration y e2e
5. Agregar job build en ci.yml
6. Configurar caching multi-capa (npm root-level + Vitest root-level + Playwright)
7. Configurar test reporting con dorny/test-reporter + JUnit XML
8. Configurar flaky test retry + Playwright system deps + projects config
9. Medir coverage baselines y configurar thresholds baseline-driven
10. Re-activar lint-staged en .husky/pre-commit
11. Crear .dockerignore
12. Habilitar Dependabot (.github/dependabot.yml)
13. Remover `describe.skip` de integration tests y arreglar seed data
14. Configurar job-level timeouts

## Open Questions

- ¿Usar `EnricoMi/publish-unit-test-result-action` en vez de `dorny/test-reporter`? Ofrece más features (flaky detection, trending) pero es más complejo.
- ¿Agregar Turborepo remote cache en este sprint o en Sprint 2? Propuesta: Sprint 2 para evitar dependency overhead ahora.
- ¿Integration tests existentes fallarán al quitar `describe.skip`? Revisar y arreglar como parte de este cambio.

## Cross-Platform Considerations

- Todos los jobs corren en `ubuntu-latest` (GitHub Actions)
- No hay concerns cross-platform porque CI es Linux
- Playwright browsers en Linux requieren system dependencies (`--with-deps` al instalar)
- Prisma migrate deploy funciona igual en Linux que en Windows/Mac
- Vitest cache path usa root `node_modules/.cache/vitest` — funciona en Linux CI runners
