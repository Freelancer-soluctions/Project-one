# Patrones de Diseño, Técnicas de Coding y Metodologías para Aplicación Profesional y Empresarial

> **Proyecto:** Project One (monorepo `apps/client`, `apps/server`, `apps/e2e`)
> **Stack:** React 18 + Vite + Tailwind + shadcn/ui + Redux Toolkit/RTK Query (client) · Express 4 + Prisma 5 + PostgreSQL (server) · TypeScript strict (server) / JavaScript (client) · Vitest + Playwright + MSW
> **Documento:** `docs/architecture/professional-enterprise-patterns.md`
> **Estado:** Vivo — actualizar con cada OpenSpec change que cierre un gap
> **Fecha de baseline:** 2026-11-25

---

## 1. Resumen Ejecutivo

Project One **ya opera por encima del promedio** de un proyecto Node/React típico: CI con 18 workflows, SAST (Semgrep), SCA (Trivy), secret scanning (Gitleaks), mutation testing (Stryker), dependency-cruiser, knip, coverage ratchet, commit signing + DCO, TypeScript strict con `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`, RBAC por permisos, field-level encryption (AES-GCM), Helmet/CSP/HSTS, Swagger/OpenAPI, i18n EN/ES, Storybook, WebSocket + Redis adapter, Prometheus metrics, health/version endpoints, graceful shutdown, 22 módulos backend con capas `routes → controller → service → dao`.

**Brecha principal hacia "enterprise de alto nivel" (FAANG/Stripe/Netflix tier):** no está en tooling (ya abundante) sino en **arquitectura de dominio** y **observabilidad runtime**. Faltan: tipado end-to-end en el cliente (sigue en JS/JSX), trazabilidad distribuida (OpenTelemetry), error tracking (Sentry), cache de datos (Redis), feature flags, patrones de dominio (DDD entities, Result/Either, DI), CQRS/eventos para casos de alto volumen, paginación por cursor, contract testing (Pact), accesibilidad WCAG automatizada, y cierre de 5 bugs HIGH conocidos.

**Conclusión:** el proyecto es **Nivel 3–4 de madurez** (de 5). Las recomendaciones de este documento priorizan cerrar los gaps de **Nivel 4→5** con mayor ROI, sin reescribir lo que ya funciona.

---

## 2. Análisis del Estado Actual (evidencia en código)

### 2.1 Patrones y prácticas YA aplicadas

| Área                 | Práctica aplicada                                                                                                                      | Evidencia (archivo)                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Arquitectura backend | Capas `routes → controller → service → dao` + HOF error handling                                                                       | `apps/server/src/modules/*/controller.ts`, `service.ts`, `dao.ts`; `docs/APPLICATION-CONTEXT.md §5.2` |
| API                  | Versionado `/api/v1/`, respuesta estándar `{success, statusCode, data, message}`                                                       | `apps/server/src/routes/v1/index.ts`, `middleware/errorHandler.ts`                                    |
| Auth                 | JWT (jsonwebtoken 9) + bcrypt + RBAC por `userPermits`                                                                                 | `middleware/verifyToken.ts`, `verifyRole.ts`, `docs/architecture/rbac-system.md`                      |
| Criptografía         | AES-GCM field-level (payroll, employees)                                                                                               | `common/crypto/hashValue.ts`, `middleware/encription-prisma-middleware.ts`                            |
| Validación           | Joi (server) + Zod (client)                                                                                                            | `modules/*/schemas/*.joi.ts`, client `config/zod-i18n.js`                                             |
| Seguridad HTTP       | Helmet (CSP, HSTS), CORS configurado, CSRF condicional, rate-limit                                                                     | `app.ts`, `middleware/rateLimit.ts`, `verifyCsrf.ts`, `utils/helmet/`                                 |
| Secrets              | AWS Secrets Manager client + gitleaks                                                                                                  | `config/aws/secret-manager.client.ts`, `.gitleaks.toml`                                               |
| ORM                  | Prisma 5 + `$queryRaw` parametrizado (`Prisma.sql`)                                                                                    | `modules/clients/dao.ts`                                                                              |
| Logging              | Winston estructurado (dev/uat/prod)                                                                                                    | `logger/index.ts`, `dev.ts`, `production.ts`, `uat.ts`                                                |
| Observabilidad       | Prometheus `prom-client`, `/health`, `/version`, `/metrics`                                                                            | `app.ts`, `socket/monitor/metrics.ts`                                                                 |
| Realtime             | Socket.IO + Redis adapter opcional                                                                                                     | `socket/adapter.ts`, `level-02-server.ts`                                                             |
| Frontend state       | Redux Toolkit + RTK Query + Redux Persist + `refetchOnFocus/Reconnect`                                                                 | `architectural-approach.md §2`                                                                        |
| Frontend forms       | React Hook Form + Zod                                                                                                                  | client deps                                                                                           |
| i18n                 | i18next EN/ES                                                                                                                          | client deps, `config/i18n.js`                                                                         |
| UI                   | shadcn/ui + Tailwind 3.4 + Radix                                                                                                       | client deps                                                                                           |
| Docs API             | Swagger/OpenAPI + JSDoc + Spectral lint                                                                                                | `docs/swagger.ts`, `openapi.yaml`, `lint:api`                                                         |
| Testing              | Vitest, Testing Library, Playwright, MSW, fast-check (PBT)                                                                             | root/client/server package.json                                                                       |
| Coverage             | v8 + ratchet + exclusion budget + TIA                                                                                                  | `scripts/ci/coverage-*.mjs`, `test:tia`                                                               |
| Mutation             | Stryker 10.1                                                                                                                           | `stryker.config.mjs`, `mutation:test`                                                                 |
| Deps                 | Dependabot (npm/actions/docker) + cooldown                                                                                             | `.github/dependabot.yml`                                                                              |
| Supply chain         | gitleaks, Trivy, Semgrep, knip, depcruise, license-policy                                                                              | workflows, scripts                                                                                    |
| Git governance       | Husky, commitlint conventional, commit signing SSH, DCO, pre-push                                                                      | `.husky/`, root package.json                                                                          |
| CI/CD                | 18 workflows: ci, security, deploy, preview, release, nightly, scheduled                                                               | `.github/workflows/`                                                                                  |
| Monorepo             | npm workspaces, tsconfig composite, build incremental                                                                                  | root package.json, `tsconfig.base.json`                                                               |
| TS strict            | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`, `erasableSyntaxOnly` | `tsconfig.base.json`                                                                                  |
| DevEx                | Storybook 8, Lighthouse CI, size-limit                                                                                                 | client deps/scripts                                                                                   |
| SDD                  | OpenSpec + requirements engineering skills                                                                                             | `openspec/`, `.opencode/skills/`                                                                      |

### 2.2 Gaps detectados (lo que NO se aplica o se aplica parcialmente)

| #   | Gap                                                                                                        | Evidencia                                            | Impacto                                         |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| G1  | Cliente en JavaScript/JSX, no TypeScript                                                                   | `apps/client/src/**/*.jsx`, `tsconfig checkJs:false` | Type safety end-to-end roto; errores en runtime |
| G2  | Sin error tracking runtime (Sentry/GlitchTip)                                                              | grep sin resultados en client/server                 | Bugs de producción invisibles                   |
| G3  | Sin tracing distribuido (OpenTelemetry)                                                                    | solo Prometheus counters                             | Sin correlación entre servicios/requests        |
| G4  | Sin cache de datos (Redis) para queries                                                                    | Redis solo para socket adapter                       | Latencia DB, carga repetida                     |
| G5  | Paginación offset-based (no cursor)                                                                        | `getSafePagination`, `LIMIT/OFFSET` en DAOs          | Degrada con tablas grandes                      |
| G6  | Sin feature flags                                                                                          | grep sin resultados                                  | Deploys = releases; sin rollback fino           |
| G7  | Sin contract testing (Pact)                                                                                | no deps                                              | Roturas silenciosas client↔server               |
| G8  | Sin visual regression (Chromatic instalado pero no integrado en CI)                                        | `@chromatic-com/storybook` devDep                    | Regresiones UI no detectadas                    |
| G9  | Sin performance testing (k6/Artillery)                                                                     | no deps                                              | Sin baseline de carga                           |
| G10 | Sin accesibilidad automatizada WCAG (axe)                                                                  | solo eslint-plugin-jsx-a11y                          | A11y no verificada en runtime                   |
| G11 | Sin Result/Either; errores por throw                                                                       | `errorHandler.ts` basado en throw                    | Flujo de error implícito, sin type-safety       |
| G12 | Sin DI container; imports directos                                                                         | módulos importan `prisma` directo                    | Testabilidad y acoplamiento                     |
| G13 | Sin DDD (entities/value objects/domain events)                                                             | capas anémicas (data bags)                           | Lógica de negocio dispersa en services          |
| G14 | Sin CQRS/event sourcing (no aplica hoy)                                                                    | —                                                    | Solo si volumen/auditoría lo exige              |
| G15 | 5 bugs HIGH abiertos (Events FK, Expenses enum, Vacation createdBy, ClientOrder/ProviderOrder sin backend) | `APPLICATION-CONTEXT.md §4.2`                        | Funcionalidad rota en producción                |
| G16 | Client bundle sin code-splitting documentado                                                               | —                                                    | TTI potencialmente alto                         |
| G17 | Sin SBOM publicado                                                                                         | scancode solo local                                  | Supply chain sin trazabilidad                   |
| G18 | Sin ADRs sistemáticos (solo 1 turborepo-evaluation)                                                        | `docs/requirements-engineering/adr/`                 | Decisiones no trazables                         |
| G19 | Sin runbook de incidentes beyond security                                                                  | `docs/runbooks/security`                             | Operación incompleta                            |
| G20 | Client no usa TypeScript types compartidos con server                                                      | —                                                    | Duplicación de tipos                            |

---

## 3. Recomendaciones por Categoría

Cada recomendación incluye: **Qué**, **Por qué** (evidencia/estándar), **Cómo** (pasos para Project One), **Prioridad** (P0 blocker / P1 alto / P2 medio / P3 bajo) y **Esfuerzo** (S/M/L/XL).

### 3.1 Arquitectura y Patrones de Diseño

#### R1.1 Cerrar los 5 bugs HIGH abiertos antes de cualquier feature nueva

- **Qué:** Fix Events FK `type`, Expenses enum, Vacation `createdBy`, implementar módulos backend `clientOrder` y `providerOrder`.
- **Por qué:** Un sistema con endpoints 404 y datos no persistidos no es "enterprise" independientemente del tooling. Estándar: Definition of Done incluye "sin bugs HIGH abiertos" (DoD del framework RE del proyecto, `docs/product/...`).
- **Cómo:**
  1. Events: en `events/dao.ts` reconectar `type` si `foreignKeys.type` presente; service pasa `type` en `foreignKeys`.
  2. Expenses: unificar enum a `BANK_FEES`/`PROFESSIONAL_SERVICES` en client select y schema.
  3. Vacation: controller inyecta `req.userId` en `createdBy`/`updatedBy`.
  4. ClientOrder/ProviderOrder: crear módulos `routes→controller→service→dao` siguiendo plantilla `clients`, montar en `routes/v1/index.ts`, añadir Swagger schemas.
- **Prioridad:** P0 · **Esfuerzo:** M

#### R1.2 Migrar el cliente a TypeScript (incremental)

- **Qué:** Convertir `apps/client/src` de JS/JSX a TS/TSX con `checkJs: true` progresivo y types compartidos.
- **Por qué:** TypeScript reduce defectos en producción ~15% (estudio Microsoft/Stroustrup citado en TS docs); el server ya es TS strict; la frontera client/server sin tipos compartidos es el mayor riesgo de regresión. Estándar: "type safety end-to-end" (Google Engineering Practices).
- **Cómo:**
  1. Habilitar `allowJs: true, checkJs: true` en `tsconfig.client.json` por directorio (usar `// @ts-check`).
  2. Renombrar módulo por módulo (empezar por `hooks/`, `utils/`, `services/`).
  3. Extraer tipos compartidos a `packages/shared-types` (o `apps/server/src/types` exportado) y consumirlos en client.
  4. Activar `noImplicitAny` por directorio migrado.
- **Prioridad:** P1 · **Esfuerzo:** XL (incremental, 4-6 sprints)

#### R1.3 Introducir capa de Dominio (DDD táctico) solo donde haya lógica compleja

- **Qué:** Entities con invariantes, Value Objects para IDs/emails/money, Domain Services para reglas cross-aggregate (ej. payroll calculation, stock movement).
- **Por qué:** DDD (Evans 2003) reduce "anemic domain model" (Fowler). Project One ya tiene lógica compleja (payroll, inventory movements, event RSVP state machine) que hoy vive en services procedurales. Estándar: Clean Architecture (Martin 2017) — dependencias apuntan hacia el dominio.
- **Cómo:** empezar por `events/stateMachine.ts` (ya existe un state machine — buen candidato) y `payroll` (cálculos). Mover reglas a `modules/<m>/domain/`. Mantener capas `routes/controller/service/dao` como adaptadores.
- **Prioridad:** P2 · **Esfuerzo:** L

#### R1.4 Result/Either para errores de dominio (en módulos nuevos)

- **Qué:** Tipo `Result<T, E>` en lugar de `throw` para errores esperados (validación de negocio, not found). Reservar `throw` para errores inesperados.
- **Por qué:** Errores tipados = exhaustiveness checking en TS; patrón usado por Rust/Go y librerías como `neverthrow`. Reduce try/catch anidados.
- **Cómo:** crear `common/result.ts` con `ok`/`err` y `match`; adoptar en un módulo piloto (`events` RSVP) y medir. No refactorizar todo de golpe (decisión framework §5 del architectural-approach).
- **Prioridad:** P3 · **Esfuerzo:** M

#### R1.5 Dependency Injection (lightweight, sin framework pesado)

- **Qué:** Inyectar `prisma`, `logger`, `secretsClient` vía factory en vez de import directo. Sin contenedor (Inversify) — solo factory functions.
- **Por qué:** Testabilidad (mock en unit tests sin `vi.mock`), desacoplamiento. Estándar: SOLID (DIP). Evitar frameworks DI pesados en Node (overhead).
- **Cómo:** `createClientService({ prisma, logger })` retorna handlers; routes construyen la instancia. Migrar módulo piloto.
- **Prioridad:** P3 · **Esfuerzo:** L

#### R1.6 API: cursor-based pagination para listados grandes

- **Qué:** Añadir `cursor`/`limit` además de `page`/`limit` en endpoints de alto volumen (products, stock movements, audit logs).
- **Por qué:** Offset pagination degrada O(n) en PostgreSQL con tablas grandes; cursor pagination es O(log n) con índice. Estándar: Stripe/Slack/GitHub APIs usan cursor. Prisma soporta `cursor` nativamente.
- **Cómo:** añadir `cursor?: string` a filtros, DAO usa `prisma.<model>.findMany({ cursor, take, skip: cursor?1:0 })`, respuesta incluye `nextCursor`.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R1.7 Event-driven para side effects (domain events)

- **Qué:** Emitir eventos de dominio (`ClientCreated`, `PayrollProcessed`) a un bus in-process (EventEmitter) o Redis/BullMQ para side effects (emails, audit log, websocket notify).
- **Por qué:** Desacopla side effects del flujo principal; base para CQRS/auditoría. Estándar: DDD Domain Events (Evans). Solo si hay side effects reales (hoy notificaciones websocket).
- **Cómo:** crear `common/eventBus.ts` (typed EventEmitter), emitir en services, suscribir en `socket/` para broadcast. Migrar notificaciones de menciones en notes.
- **Prioridad:** P3 · **Esfuerzo:** M

### 3.2 Calidad de Código y Estándares

#### R2.1 SOLID aplicado al stack

- **Qué:** Checklist por PR: SRP (funciones < 50 líneas, un motivo de cambio), OCP (extender vía composition), LSP (subtipos sustituibles), ISP (interfaces pequeñas), DIP (depender de abstracciones).
- **Por qué:** SOLID (Martin 2000) correlaciona con menor defect density (estudios empíricos en "Clean Code"). Ya se aplica parcialmente.
- **Cómo:** añadir sección a `docs/quality/code-review-checklist.md` con ejemplos del proyecto; ESLint rule `max-lines-per-function` (ya configurado? verificar) y `complexity`.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R2.2 Logging estructurado con correlation IDs

- **Qué:** Añadir `requestId` (UUID) a cada log vía middleware; propagar a client (header `X-Request-Id`); winston incluye `requestId`, `userId`, `module`.
- **Por qué:** Observabilidad distribuida (12-factor XI: logs como event streams). Sin correlation ID no se puede trazar un request end-to-end. Estándar: OpenTelemetry semantic conventions.
- **Cómo:** middleware `requestId` (uuid v4) → `req.id`; winston child logger con `defaultMeta: { requestId }`; incluir en respuesta de error.
- **Prioridad:** P1 · **Esfuerzo:** S

#### R2.3 Configuración 12-factor

- **Qué:** Validar env vars al bootstrap con schema (Zod/Joi) y fallar rápido; no defaults silenciosos para secrets; `.env.example` completo.
- **Por qué:** 12-factor III (config en env). Hoy `dotenv.ts` lee sin validación. Estándar: 12-factor app.
- **Cómo:** crear `config/env.schema.ts` con Zod; `bootstrap()` valida y aborta si falta. Documentar en `docs/backend/server-bootstrap-env-vars.md`.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R2.4 ADRs sistemáticos

- **Qué:** Crear ADR por cada decisión arquitectónica significativa (template ya existe en `docs/requirements-engineering/adr/TEMPLATE.md`).
- **Por qué:** ADRs (Nygard 2011) preservan contexto de decisiones; onboarding y auditorías. Hoy solo 1 ADR.
- **Cómo:** exigir ADR en PRs que toquen arquitectura (checklist PR template); numerar `docs/adr/0001-...md`.
- **Prioridad:** P2 · **Esfuerzo:** S

### 3.3 Seguridad

El proyecto ya tiene una guía enterprise de seguridad (`docs/security/security-enterprise-guide.md`) y OWASP Top 10 implementado (`SECURITY.md`). Gaps específicos:

#### R3.1 SAST en PR (no solo nightly)

- **Qué:** Ejecutar Semgrep en cada PR (no solo scheduled) con reglas OWASP + custom.
- **Por qué:** Shift-left: detectar vulnerabilidades antes de merge (OWASP SAMM). Hoy `sast:semgrep:full` es manual.
- **Cómo:** añadir job `semgrep` a `ci.yml` con `--config p/owasp-top-ten` + `.semgrep/`; fail on new findings.
- **Prioridad:** P1 · **Esfuerzo:** S

#### R3.2 DAST en preview/staging

- **Qué:** OWASP ZAP baseline scan contra preview environment.
- **Por qué:** DAST detecta issues runtime (misconfig, headers) que SAST no ve. Estándar: OWASP.
- **Cómo:** job en `preview.yml` ejecutando `zaproxy/action-baseline` contra URL de preview; reportar SARIF.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R3.3 Dependency vulnerability gating en PR

- **Qué:** `npm audit --audit-level=high` + Trivy en PR (no solo scheduled); bloquear merge si critical/high.
- **Por qué:** Supply chain (SolarWinds, Log4Shell). Estándar: SLSA level 2+.
- **Cómo:** job en `ci.yml`; usar `dependency-review-action` (ya hay doc `dependency-review.md`).
- **Prioridad:** P1 · **Esfuerzo:** S

#### R3.4 SBOM publicado en releases

- **Qué:** Generar SBOM (CycloneDX) en release pipeline y adjuntar a GitHub Release.
- **Por qué:** Transparencia supply chain; requerido por EO 14028 (US) y EU CRA. Estándar: SPDX/CycloneDX.
- **Cómo:** `cyclonedx-npm` en `release.yml`; upload artifact + attach to release.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R3.5 Auditoría de raw queries ($queryRaw)

- **Qué:** Revisar los 12 módulos que usan `$queryRaw` para asegurar `Prisma.sql` parametrizado (no interpolación de strings).
- **Por qué:** SQL injection si se concatena. Prisma protege solo con `Prisma.sql`. Estándar: OWASP A03.
- **Cómo:** grep `\$queryRaw\`` y auditar; añadir regla Semgrep custom (ya hay `semgrep-rules.md`).
- **Prioridad:** P1 · **Esfuerzo:** S

#### R3.6 Rate limiting por usuario/IP en endpoints sensibles

- **Qué:** Rate limit específico en login, password reset, export; usar `express-rate-limit` con store Redis (cuando Redis esté).
- **Por qué:** Brute force/credential stuffing (OWASP A07). Hoy rateLimit global.
- **Cómo:** middleware dedicado en rutas auth con `keyGenerator` por IP+email; store Redis para multi-instancia.
- **Prioridad:** P2 · **Esfuerzo:** S

### 3.4 Testing y Calidad

#### R4.1 Contract testing client↔server (Pact)

- **Qué:** Pact consumer tests en client (RTK Query) + provider verification en server.
- **Por qué:** Detecta breaking changes de API antes de deploy (microservices best practice, Pact Foundation). Crítico con 22 módulos y 25 slices client.
- **Cómo:** añadir `@pact-foundation/pact` a client devDeps; generar pacts en CI; verificar en server job.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R4.2 Visual regression (Chromatic)

- **Qué:** Integrar Chromatic en CI para Storybook (ya instalado).
- **Por qué:** Detecta regresiones visuales automáticamente; usado por Stripe/Airbnb. Estándar: visual testing.
- **Cómo:** job en `ci.yml` `chromatic --project-token=$CHROMATIC_TOKEN`; baseline en main.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R4.3 Accesibilidad automatizada (axe-core)

- **Qué:** `jest-axe`/`axe-core` en tests de componentes UI + Playwright a11y checks en E2E.
- **Por qué:** WCAG 2.1 AA (estándar legal en EU/US). Hoy solo lint estático.
- **Cómo:** añadir `toHaveNoViolations()` en tests de componentes shadcn; Playwright `@axe-core/playwright` en E2E smoke.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R4.4 Performance testing (k6)

- **Qué:** Smoke load test en endpoints críticos (login, list products) con k6; baseline en CI nightly.
- **Por qué:** Detecta regresiones de performance; estándar SRE. Estándar: Google SRE book.
- **Cómo:** `k6 run scripts/perf/smoke.js` en `nightly-full-suite.yml`; thresholds p95 < 500ms.
- **Prioridad:** P3 · **Esfuerzo:** M

#### R4.5 Coverage threshold enforcement (ya existe ratchet — verificar floor)

- **Qué:** Asegurar floor mínimo (ej. 70% líneas) bloqueante en PR.
- **Por qué:** Coverage ratchet solo sube; floor evita caídas. Estándar: Google 60-80%.
- **Cómo:** `coverage:check` en `ci.yml` PR job (ya existe script).
- **Prioridad:** P1 · **Esfuerzo:** S

### 3.5 CI/CD y DevOps

#### R5.1 Blue-green / canary deployments

- **Qué:** Deploys a ECS con circuit breaker + canary (CodeDeploy) en lugar de replace directo.
- **Por qué:** Zero-downtime, rollback automático. Estándar: AWS ECS deployment circuit breaker (ya documentado en `docs/learning/ci-cd/16-ecs-circuit-breaker-health-checks.md`).
- **Cómo:** configurar `deploymentCircuitBreaker: { enable: true, rollback: true }` en task def; CodeDeploy canary 10%→100%.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R5.2 Database migrations zero-downtime

- **Qué:** Estrategia expand-contract para migraciones (añadir columna nullable → backfill → NOT NULL → drop old).
- **Por qué:** Evita downtime en deploys. Estándar: "Evolutionary Database Design" (Fowler/Sadalage).
- **Cómo:** documentar en `docs/backend/`; PR checklist para migraciones; `prisma migrate deploy` en deploy (no `dev`).
- **Prioridad:** P2 · **Esfuerzo:** S

#### R5.3 Infrastructure as Code (Terraform/Pulumi) — si no existe

- **Qué:** Versionar infra (ECS, RDS, Vercel) como código.
- **Por qué:** Reproducibilidad, auditoría, disaster recovery. Estándar: IaC.
- **Cómo:** verificar si hay `infra/` o `terraform/`; si no, crear módulo mínimo para ECS+RDS.
- **Prioridad:** P2 · **Esfuerzo:** L

#### R5.4 Feature flags

- **Qué:** Introducir sistema de feature flags (Unleash self-hosted o Flagsmith) para decoplar deploy de release.
- **Por qué:** Reduce riesgo de releases; permite A/B y gradual rollout. Estándar: "Feature Toggles" (Fowler).
- **Cómo:** empezar con flags en DB + middleware `isFeatureEnabled(flag, userId)`; migrar a Unleash cuando escale.
- **Prioridad:** P3 · **Esfuerzo:** M

### 3.6 Performance y Escalabilidad

#### R6.1 Cache de datos con Redis

- **Qué:** Cache de lecturas frecuentes (products list, settings, permissions) con TTL e invalidación por tag.
- **Por qué:** Reduce carga DB y latencia. Estándar: cache-aside pattern. Redis ya disponible para socket adapter.
- **Cómo:** añadir `ioredis` client compartido; wrapper `cacheAside(key, ttl, fetcher)`; invalidar en mutaciones.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R6.2 Frontend: code splitting y lazy loading

- **Qué:** `React.lazy` + `Suspense` por ruta; dynamic imports para módulos pesados (tiptap, recharts si hay).
- **Por qué:** Reduce bundle inicial; mejora TTI/LCP (Core Web Vitals). Estándar: Vercel React best practices (skill disponible).
- **Cómo:** auditar con `vite build --report`; convertir rutas en `App.jsx` a lazy; verificar size-limit.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R6.3 Virtualización de listas largas

- **Qué:** `@tanstack/react-virtual` en tablas > 100 filas.
- **Por qué:** Render de miles de DOM nodes bloquea main thread. Estándar: performance.
- **Cómo:** aplicar en `dataTable.jsx` cuando `data.length > 100`.
- **Prioridad:** P3 · **Esfuerzo:** S

#### R6.4 Image optimization

- **Qué:** WebP/AVIF, lazy loading, responsive srcset, CDN.
- **Por qué:** LCP. Estándar: web.dev.
- **Cómo:** Vite plugin `vite-plugin-image-optimizer`; Cloudinary (ya dep) para uploads.
- **Prioridad:** P3 · **Esfuerzo:** S

### 3.7 Documentación y Governance

#### R7.1 OpenAPI como fuente de verdad (generación desde código)

- **Qué:** Generar `openapi.yaml` desde JSDoc/annotations (ya hay `openapi:generate`) y validar en CI (Spectral ya configurado).
- **Por qué:** Evita drift docs↔código. Estándar: API-first (Stripe/Stripe API).
- **Cómo:** asegurar `openapi:generate` en CI y `lint:api` bloqueante.
- **Prioridad:** P1 · **Esfuerzo:** S

#### R7.2 Changelog (Keep a Changelog) automatizado

- **Qué:** Changesets ya configurado; generar CHANGELOG.md en release.
- **Por qué:** Trazabilidad de releases. Estándar: Keep a Changelog.
- **Cómo:** `changeset version` ya en scripts; verificar que CHANGELOG se commitea.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R7.3 README estándar por app

- **Qué:** README con setup, env vars, scripts, arquitectura, troubleshooting.
- **Por qué:** Onboarding. Estándar: "Make a README".
- **Cómo:** auditar `apps/client/README`, `apps/server/README` (si existen); completar.
- **Prioridad:** P3 · **Esfuerzo:** S

### 3.8 Accesibilidad y UX

#### R8.1 WCAG 2.1 AA compliance audit

- **Qué:** Auditoría con axe + Lighthouse a11y (ya hay `lhci`); corregir contraste, labels, focus.
- **Por qué:** Legal (ADA, EN 301 549) y calidad. Estándar: WCAG 2.1 AA.
- **Cómo:** `lhci` assertions a11y score ≥ 90; axe en E2E.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R8.2 i18n completo (sin strings hardcoded)

- **Qué:** Auditar strings hardcoded en componentes; mover a `locales/`.
- **Por qué:** i18n incompleto rompe UX en ES. Estándar: i18n.
- **Cómo:** `i18next-parser` o grep de literales en JSX.
- **Prioridad:** P3 · **Esfuerzo:** M

### 3.9 Observabilidad y Monitoreo

#### R9.1 Error tracking (Sentry)

- **Qué:** Sentry en client (React ErrorBoundary) y server (errorHandler envía a Sentry).
- **Por qué:** Visibilidad de errores en producción; estándar de industria. Estándar: observability (3 pillars: logs/metrics/traces).
- **Cómo:** `@sentry/react` + `@sentry/node`; DSN por env; source maps upload en build (ya hay doc sourcemaps).
- **Prioridad:** P1 · **Esfuerzo:** S

#### R9.2 OpenTelemetry tracing

- **Qué:** Instrumentar Express + Prisma + HTTP client con OTel; exportar a Jaeger/Tempo/Grafana.
- **Por qué:** Trazabilidad end-to-end; estándar CNCF. Estándar: OpenTelemetry.
- **Cómo:** `@opentelemetry/sdk-node` + auto-instrumentations; propagar traceparent; correlacionar con requestId.
- **Prioridad:** P2 · **Esfuerzo:** M

#### R9.3 Alerting y SLOs

- **Qué:** Definir SLOs (availability 99.9%, p95 < 500ms) y alertas (PagerDuty/Slack) sobre Prometheus.
- **Por qué:** SRE practice. Estándar: Google SRE.
- **Cómo:** Grafana alerting rules; runbook de respuesta.
- **Prioridad:** P3 · **Esfuerzo:** M

#### R9.4 Health checks profundos

- **Qué:** `/health` ya verifica DB; añadir Redis, migrations status, disk.
- **Por qué:** Orquestadores (ECS/K8s) necesitan señal precisa. Estándar: k8s probes.
- **Cómo:** extender `/health` con checks opcionales; `/health/live` y `/health/ready`.
- **Prioridad:** P2 · **Esfuerzo:** S

### 3.10 Gestión de Dependencias y Supply Chain

#### R10.1 Lock file integrity en CI

- **Qué:** `npm ci` (no `npm install`) en CI; verificar lock file committed.
- **Por qué:** Reproducibilidad. Estándar: npm docs.
- **Cómo:** auditar workflows; `npm ci` ya debería usarse.
- **Prioridad:** P1 · **Esfuerzo:** S

#### R10.2 License compliance automatizado

- **Qué:** `license-checker` en CI contra `license-policy.yml` (ya existe).
- **Por qué:** Evita dependencias con licencias incompatibles (GPL en producto comercial). Estándar: OpenChain.
- **Cómo:** job en `ci.yml` ejecutando `scripts/ci/license-check.mjs` (si existe) o `license-checker`.
- **Prioridad:** P2 · **Esfuerzo:** S

#### R10.3 Typosquatting detection

- **Qué:** Ya hay doc `typosquatting-detection.md`; verificar que esté en CI.
- **Por qué:** Supply chain attacks. Estándar: SLSA.
- **Cómo:** job scheduled (ya `scheduled-security.yml` probablemente).
- **Prioridad:** P3 · **Esfuerzo:** S

---

## 4. Roadmap de Implementación

### Fase 0 — Quick Wins (1-2 sprints, alto ROI)

- R1.1 (bugs HIGH), R3.5 (raw query audit), R3.1 (SAST en PR), R3.3 (dep vuln gating), R4.5 (coverage floor), R7.1 (OpenAPI CI), R9.1 (Sentry), R2.2 (correlation IDs), R10.1 (npm ci).

### Fase 1 — Medium-term (3-6 sprints)

- R1.2 (TS client incremental), R1.6 (cursor pagination), R2.3 (env validation), R3.2 (DAST), R3.4 (SBOM), R3.6 (rate limit auth), R4.1 (Pact), R4.2 (Chromatic), R4.3 (axe), R5.2 (zero-downtime migrations), R6.1 (Redis cache), R6.2 (code splitting), R9.2 (OTel), R9.4 (health deep), R10.2 (license compliance).

### Fase 2 — Long-term (6-12 sprints)

- R1.3 (DDD táctico), R1.4 (Result/Either), R1.5 (DI), R1.7 (domain events), R4.4 (k6), R5.1 (blue-green), R5.3 (IaC), R5.4 (feature flags), R6.3 (virtualization), R6.4 (images), R8.1 (WCAG audit), R8.2 (i18n completo), R9.3 (SLOs/alerting), R2.4 (ADRs), R7.2/R7.3 (docs).

---

## 5. Métricas de Éxito

| Métrica                         | Baseline (hoy)   | Target (Nivel 5)        |
| ------------------------------- | ---------------- | ----------------------- |
| Bugs HIGH abiertos              | 5                | 0                       |
| Client TS coverage              | 0%               | 100% (incremental)      |
| Coverage líneas (server)        | ratchet actual   | ≥ 75% floor             |
| Mutation score                  | baseline stryker | ≥ 60%                   |
| p95 latencia endpoints críticos | sin baseline     | < 500ms (medido k6)     |
| Errores de producción visibles  | 0 (sin tracking) | Sentry + alerting       |
| A11y score Lighthouse           | sin medir        | ≥ 90                    |
| OpenAPI drift                   | manual           | 0 (CI bloqueante)       |
| Raw queries auditadas           | 0/12             | 12/12                   |
| ADRs                            | 1                | ≥ 10 (decisiones clave) |
| SLO availability                | sin definir      | 99.9%                   |

---

## 6. Referencias y Evidencia

### Estándares y frameworks

- **OWASP Top 10 (2021)** — https://owasp.org/Top10/
- **OWASP SAMM** — https://owaspsamm.org/
- **12-Factor App** — https://12factor.net/
- **Clean Architecture** (Robert C. Martin, 2017)
- **Domain-Driven Design** (Eric Evans, 2003)
- **SOLID Principles** (Robert C. Martin, 2000)
- **Clean Code** (Robert C. Martin, 2008)
- **WCAG 2.1** — https://www.w3.org/TR/WCAG21/
- **OpenTelemetry** — https://opentelemetry.io/
- **SLSA** — https://slsa.dev/
- **CycloneDX / SPDX** — SBOM standards
- **OpenChain** — license compliance
- **Google SRE Book** — https://sre.google/sre-book/
- **Keep a Changelog** — https://keepachangelog.com/

### Documentación interna de referencia

- `docs/APPLICATION-CONTEXT.md` — contexto de aplicación y bugs conocidos
- `docs/architecture/architectural-approach.md` — decisiones RTK Query
- `docs/architecture/rbac-system.md` — RBAC
- `docs/security/security-enterprise-guide.md` — seguridad enterprise
- `docs/security/SECURITY.md` — OWASP implementado
- `docs/quality/code-review-checklist.md`, `testing-architecture.md`, `code-style.md`
- `docs/learning/ci-cd/*` — CI/CD
- `docs/backend/server-typescript-migration-research.md`

### Empresas de referencia citadas

- **Stripe** — API design, cursor pagination, idempotency keys
- **GitHub** — cursor pagination, OpenAPI
- **Google** — SRE, testing coverage thresholds, TypeScript
- **Netflix** — resilience, observability
- **Airbnb** — visual regression, design systems
- **Amazon** — IaC, blue-green deployments

### Notas de pragmatismo

No todo aplica a un proyecto de este tamaño. Las prioridades P3 son "nice-to-have" y deben justificarse caso por caso con el framework de decisión de `docs/architecture/architectural-approach.md §5`. Evitar sobrediseño: empezar simple, añadir complejidad solo cuando se mida un problema real.
