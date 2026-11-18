# Design: ci-shifting-left

## Context

El proyecto ya tiene una base sólida de shifting left (Husky pre-commit con Semgrep + Gitleaks + lint-staged + commitlint, pre-push con `vitest --changed`, 9 workflows de GitHub Actions, preview environments). La investigación del @researcher (Engram #596) identificó 15+ validaciones adicionales de alto ROI que hoy se detectan tarde (staging/prod, 100-1000x costo) y pueden moverse a temprano (editor/pre-commit/CI, 1-10x). Ver [proposal.md](./proposal.md) para el problem statement completo.

## Goals

- Mover 9 validaciones de alto ROI a la izquierda (pre-commit y CI) en dos fases: Fase A (inmediata, <1 semana) y Fase B (1-2 semanas).
- Reducir el lead time del CLI de E2E de ~20min a ~6min mediante sharding.
- Garantizar enforcement de seguridad a nivel de branch protection (dependency-review como required status check).
- Establecer un loop de remediación automática de dependencias vulnerables (Dependabot → fix PRs → dependency-review gate).
- Detectar drift de DB, dead code, violaciones de contrato API y regresiones de performance en CI, no en producción.

## Non-Goals

- **Fase C (fuera de alcance)**: SBOM firmado + cosign + SLSA provenance, Socket.dev runtime monitoring, hadolint para Dockerfiles. Se documentan como trabajo futuro.
- No se modifica el schema de Prisma (`schema.prisma` es solo lectura; solo se valida).
- No se reemplaza Gitleaks por TruffleHog — TruffleHog complementa con verificación contra API emisora.
- No se cambia el requerimiento base del gate de ESLint existente (`eslint-blocking-gate`) — los plugins nuevos corren bajo el mismo gate.
- No se modifica `ci-secret-scanning` ni `pre-commit-lint-staged` como specs — solo se añaden herramientas complementarias.

## Decisions

### Decision 1: Patrón de 3 herramientas para SCA (Dependabot + dependency-review-action + Trivy)

**Choice**: Dependabot (remediación automática vía fix PRs) + `actions/dependency-review-action@v4` (gate en PR) + Trivy (detección profunda via filesystem scan en security.yml).
**Alternatives considered**: Snyk (comercial, costo por licencia), Socket.dev (runtime monitoring, Fase C), GitHub native dependabot alerts solos (solo detección, sin gate).
**Rationale**: Cada herramienta cubre una etapa distinta del ciclo: Dependabot propone el fix, dependency-review bloquea el merge de PRs que introducen CVEs (enforcement garantizado), y Trivy ya está integrado en `security.yml` con SARIF upload — se reutiliza sin costo adicional. El patrón cubre detección → gate → remediación sin dependencia de licencias comerciales.

### Decision 2: Sharding de 4 (no 2 ni 8) en Playwright

**Choice**: `strategy.matrix: shardIndex: [1,2,3,4], shardTotal: [4]` con blob reporter + merge-reports.
**Alternatives considered**: 2 shards (reducción insuficiente, ~10min), 8 shards (overhead de provisioning y merge que supera el beneficio marginal para ~40 specs), sharding por archivo manual (frágil).
**Rationale**: 4 shards balancea el tiempo de ejecución (~6min vs 20min actual) con el overhead de spin-up de runners y el costo de merge de reports. Con `fullyParallel: true` y `retries: 2`, cada shard procesa un subconjunto disjunto de tests. El número se puede ajustar empíricamente tras medir la distribución de duración por shard.

### Decision 3: Spectral vs Redocly vs Vacuum para API contract linting

**Choice**: `@stoplight/spectral-cli` con `.spectral.yaml` extends `spectral:oas` + reglas custom (naming, no-numeric-ids, no-http-basic, request-GET-no-body).
**Alternatives considered**: Redocly CLI (lint ruleset potente pero más orientado a docs/portal), Vacuum (más nuevo, menos ecosistema de reglas), validación manual con swagger-jsdoc (solo parse, sin reglas de estilo/seguridad).
**Rationale**: Spectral es el estándar de facto para linting OpenAPI, tiene el ruleset `spectral:oas` maduro, soporta reglas custom en YAML sin código, y se integra trivialmente en CI (`spectral lint openapi.yaml`). El proyecto ya usa swagger-jsdoc para generar el contrato; Spectral valida el resultado.

### Decision 4: Lighthouse CI vs Lighthouse componente testing

**Choice**: Lighthouse CI (`@lhci/cli` o `treosh/lighthouse-ci-action@v11`) con `budget.json` (LCP < 2500ms, TBT < 200ms, total < 200KB) como required status check.
**Alternatives considered**: Lighthouse componente testing (mide componentes aislados, no la página real), WebPageTest (externo, requiere API key), size-limit solo (mide bundle pero no runtime performance).
**Rationale**: El objetivo es medir la experiencia real de carga de la página (LCP/TBT) contra el bundle total — solo Lighthouse CI sobre el build desplegado en preview mide ambos. size-limit complementa en pre-commit (rápido), Lighthouse CI enforce en el merge (lento pero completo). El budget de 200KB total fuerza disciplina de bundle.

### Decision 5: knip vs depcheck

**Choice**: `knip` con `knip.json` en la raíz, corriendo en CI en default + `--production` mode.
**Alternatives considered**: depcheck (single-package, sin soporte first-class de monorepo, sin detección de exports/files), eslint-plugin-import/no-unused-modules (solo JS, no cubre deps), análisis manual (no escala).
**Rationale**: knip es monorepo first-class: entiende npm workspaces, entry points por workspace, y detecta unused dependencies, exports Y files. El `--production` mode separa deps de producción de devDeps, lo que es crítico para el Dockerfile del server. La curva de learning de la config se mitiga con entry points explícitos por workspace.

### Decision 6: actionlint + yamllint en lint-staged Y en CI

**Choice**: Ambas herramientas en pre-commit (lint-staged, solo archivos staged) y en el job CI `validate-pipeline` con paths-filter (solo cuando cambian `.github/workflows/**`).
**Alternatives considered**: Solo CI (el error se detecta en el PR, pero el dev pierde el feedback inmediato y el commit ya existe), solo pre-commit (un dev puede saltarse hooks con `--no-verify`).
**Rationale**: Pre-commit da feedback en <1s sobre el archivo staged; CI es la red de seguridad que enforce para todos (incluido `--no-verify`). El paths-filter evita correr el job en PRs que no tocan workflows, manteniendo el CI rápido. actionlint detecta expresiones `${{ }}` malformadas, permisos y shellcheck; yamllint valida sintaxis YAML.

### Decision 7: prisma migrate diff en CI vs pre-push

**Choice**: `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code` en el job CI `db-contract` (exit 2 = drift), con `prisma validate` + `prisma format --check` en lint-staged.
**Alternatives considered**: pre-push hook (lento en dev local — requiere generar el diff contra migraciones, ~5-10s por push), solo `prisma validate` (detecta sintaxis pero NO drift entre schema y migraciones), `prisma migrate dev` en CI (ejecuta migraciones, más lento y muta estado).
**Rationale**: El diff de migraciones es rápido en CI (sin DB local, compara archivos) pero lento en dev local (requiere setup). Por eso: lint-staged valida sintaxis/formato en <1s, y CI detecta drift real de contrato. El script `db:contract` en `apps/server/package.json` permite a devs correr el mismo check localmente cuando lo necesiten.

## Risks / Trade-offs

- **BREAKING change de required status checks**: Hacer `dependency-review` (y Lighthouse CI) required en `main` bloquea PRs existentes que no los tengan. **Mitigación**: rollout phased — primero correr como advisory (non-required) 1 semana, validar que no hay falsos positivos, luego activar como required en branch protection.
- **Agrega minutos al CI**: 5 jobs nuevos (`validate-pipeline`, `db-contract`, `knip`, `api-contract`, `frontend-budgets`) + sharding. **Mitigación**: paths-filter en `validate-pipeline`, sharding reduce E2E de 20→6min, jobs nuevos son <2min cada uno.
- **Falsos positivos en SCA**: dependency-review y Trivy pueden marcar CVEs con fix no aplicable o licencias borderline. **Mitigación**: `ignore-unfixed: 'true'` en Trivy, revisión manual de findings antes de activar required checks, allowlist documentada.
- **knip config con curva de learning**: entry points mal configurados generan falsos positivos (exports usados reportados como unused). **Mitigación**: config explícita por workspace, correr en advisory mode la primera semana, ajustar entry points.
- **Sharding flakiness**: tests que dependen de estado compartido fallan al particionarse. **Mitigación**: `retries: 2` + `fullyParallel` requiere tests aislados; revisar specs con dependencia de orden.
- **TruffleHog rate limits**: `trufflehog github` puede ser lento en repos grandes. **Mitigación**: correr en `scheduled-security.yml` (semanal) además de PRs, `--results=verified` reduce ruido.

## Migration Plan

1. **Fase A (semana 1)**: Instalar herramientas (actionlint, yamllint, eslint plugins, knip), añadir jobs CI nuevos como **non-required** (advisory), configurar Dependabot, añadir TruffleHog a security.yml.
2. **Validación (1 semana)**: Observar los checks nuevos en PRs reales. Corregir falsos positivos (knip entry points, reglas Spectral, budgets de Lighthouse).
3. **Fase B (semanas 1-2)**: Añadir Spectral + openapi.yaml, size-limit + Lighthouse CI, sharding de E2E.
4. **Enforce (después de validación)**: Activar `dependency-review` y Lighthouse CI como **required status checks** en branch protection de `main`. Comunicar el BREAKING change al equipo antes de activar.
5. **Documentación**: Completar Ejercicio 6 de `docs/learning/ci-cd/00-que-es-cicd.md` con las 3 validaciones concretas.
