---
title: "Análisis: ¿Qué falta para que Project One sea un ERP 'producto terminado'?"
date: 2026-10-11
description: >-
  Documento combinado de dos investigaciones: (1) teoría de qué define un ERP
  "terminado" y qué capas (cloud, seguridad, legal, operación) exige publicar
  software en internet, con fuentes verificables; (2) auditoría directa del
  codebase de Project One (24 módulos backend, 43 modelos Prisma, 27 páginas
  React) con gap analysis priorizada (P0/P1/P2), checklists accionables y
  hoja de ruta hasta "producto terminado".
audience: Dueño/propietario del proyecto
status: vigente
---

# ¿Qué falta para que Project One sea un ERP "producto terminado"?

> Este documento fusiona dos trabajos de investigación realizados el 2026-10-11:
>
> 1. **Teoría** (`analisis-erp-publicacion-internet.md`): qué es un ERP terminado, publicación, cloud, seguridad, madurez, legal y operación — con fuentes URL.
> 2. **Realidad** (`analisis-codebase-estado.md`): auditoría directa del repo en rama `ci-prebuild-improvement-v4` — inventario de features, calidad, cloud y gaps.
>
> Regla de este documento: **no se inventan datos del codebase**; toda afirmación sobre el repo procede del audit (con ruta de archivo como evidencia) o de lectura directa. Las afirmaciones de teoría llevan fuente URL; lo que no tiene URL verificada se marca **[conocimiento del modelo]**.

---

## 1. Resumen ejecutivo

**Veredicto: Project One es un MVP robusto / beta técnica con ingeniería de nivel senior, pero NO es un ERP "terminado".** La distancia hasta "producto terminado" no está en la infraestructura de desarrollo (que es excelente: CI con ~40 jobs, gates de seguridad, coverage ratchet) sino en **dos frentes**: (a) el **ciclo económico del ERP está abierto** — faltan por completo finanzas/contabilidad, facturación e impuestos, y producción, por lo que el producto no puede cuadrar un asiento con su documento origen (la regla que define a un ERP, ver sección 2); y (b) la **capa de operación en producción es inmadura** — hay despliegue a staging en ECS, pero sin IaC reproducible, sin observabilidad/APM, sin despliegue a producción y sin DR probado.

El producto actual cubre bien **inventario + ventas/compras + RRHH + colaboración** (24 módulos backend, ~126 handlers de ruta, 43 modelos Prisma, 27 páginas React), pero el README vende "ERP" con claims que el código no respalda (ABAC inexistente, FIFO/LIFO no evidenciado, badge Node 18 vs `engines >=22.11`). El primer paso para "terminar" es, irónicamente, **alinear la promesa con la realidad**: o se implementa el ciclo financiero-fiscal, o se redefine el producto como "suite de operaciones" y se comunica honestamente.

**Matriz de madurez (1–5) — heredada del audit (sección 6 del audit):**

| Área                   |     Nota      | En una frase                                                                                                      |
| ---------------------- | :-----------: | ----------------------------------------------------------------------------------------------------------------- |
| Funcionalidad          |   **3 / 5**   | 24 módulos operativos, pero finanzas, facturación, producción y reporting avanzado ausentes                       |
| Calidad de código      |   **4 / 5**   | Lint/typecheck/knip/dependency-cruiser impecables; deuda: server 100% JS (TS 0/25) y 208 `console.log`            |
| Testing                |   **3 / 5**   | ~500 casos y cobertura ~60–64% con ratchet, pero concentrados en events/notes; E2E solo 5 specs; regression vacío |
| Seguridad              |   **4 / 5**   | SAST/SCA/secret-scan/SBOM en CI; faltan DAST y permisos granulares aplicados a todos los módulos                  |
| CI/CD                  |  **4.5 / 5**  | Gates blocking/advisory, DCO, firmas, TIA, preview, changesets; falta CD a prod                                   |
| Cloud / Deploy         |  **2.5 / 5**  | ECS staging + OIDC funciona; sin IaC en repo, sin APM (Sentry 0/26), sin prod reproducible                        |
| Docs                   |   **4 / 5**   | 100+ docs y 35 guías de módulo; pero README desalineado y auditoría OpenSpec obsoleta                             |
| UX / Frontend          |   **3 / 5**   | shadcn + i18n EN/ES + guards + 22 stories; faltan a11y, dark mode, E2E de flujos, manejo uniforme de errores      |
| **Promedio ponderado** | **≈ 3.4 / 5** | **Etapa: MVP robusto / beta técnica**                                                                             |

---

## 2. ¿Qué es un ERP "terminado"? (teoría)

### 2.1 La definición operativa: el ciclo cerrado

Un ERP (Enterprise Resource Planning) no es una suma de módulos: es un sistema donde **un único dato alimenta todos los módulos**. Una factura de compra actualiza a la vez inventario, cuenta por pagar, presupuesto y —si hay implantación por partida doble— el mayor contable. Esa integración es la razón de ser del producto: si inventario y contabilidad divergen, el ERP ha perdido su _single source of truth_.

> **Regla práctica:** si el módulo de contabilidad no puede cuadrar un asiento con su documento origen, el ERP no está terminado. (Sección 1 del research teórico; fuentes: ERPNext, Odoo, NetSuite como referencias de módulos canónicos.)

**Módulos base que todo ERP debe cubrir:**

| Módulo                             | Contenido mínimo                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finanzas / Accounting** (núcleo) | Libro diario/mayor, plan contable, CxC/CxP, conciliación bancaria, impuestos (IVA/retenciones), cierre mensual/anual, consolidación, estados financieros (balance, P&G, flujo de caja) |
| **Inventario / Stock**             | Recepción, ubicaciones, lotes/series, inventario cíclico, valoración FIFO/PEPS/ponderado, stock mínimo y reorden, trazabilidad                                                         |
| **CRM / Ventas**                   | Pipeline de oportunidades, cotizaciones, pedidos, albaranes, facturación, listas de precios y descuentos                                                                               |
| **Compras / Procurement**          | RFQ, comparación de proveedores, órdenes de compra, recepción, _three-way match_ (PO ↔ recepción ↔ factura)                                                                            |
| **HR / Nómina**                    | Fichajes, ausencias, expedientes, evaluaciones y nómina localizada legalmente                                                                                                          |
| **Manufacturing / MRP**            | BOM, rutas de fabricación, MRP, órdenes de trabajo, calidad, costes de producción                                                                                                      |
| **POS**                            | TPV sincronizado con inventario (esencial en retail/hostelería)                                                                                                                        |
| **Reporting / BI**                 | Informes operativos y financieros con drill-down, exportación, coherencia de cifras entre módulos                                                                                      |

### 2.2 Capacidades transversales: lo que separa un MVP de un ERP terminado

- **Multi-tenant** con aislamiento real de datos (nunca confiar el tenant del cliente; derivarlo de la sesión y aplicar Row-Level Security). Un _tenant leakage_ es un fallo catastrófico. (AWS, WorkOS)
- **Multi-idioma / i18n**: UI, formatos de fecha/número, impuestos por país.
- **Multi-moneda**: moneda funcional vs. de compañía, tipos de cambio, revaluación.
- **Workflows de autorización**: aprobaciones configurables y encadenadas ("una compra > X€ requiere firma del director") — es el control interno que exigen auditorías.
- **Audit log inmutable** con retención (PCI-DSS pide ≥12 meses; SOC 2/ISO 27001 también lo exigen).
- **Permisos granulares**: roles por módulo, campo y compañía; separación de funciones (quien crea un proveedor no aprueba su propia factura).
- **Cumplimiento fiscal localizado**: facturación electrónica, libro de IVA, SII, retenciones.

### 2.3 MVP vs. ERP terminado (tabla del research teórico)

| Criterio            | MVP funcional                     | ERP "terminado" / producción                                |
| ------------------- | --------------------------------- | ----------------------------------------------------------- |
| Alcance             | 1-2 flujos (p. ej. venta + stock) | Ciclo completo compras→producción→ventas→contabilidad       |
| Contabilidad        | Libro diario básico               | Partida doble, cierre, consolidación, conciliación bancaria |
| Multiempresa/moneda | Una compañía, una moneda          | Multi-compañía, multi-moneda, tipos de cambio               |
| Auditoría           | Sin logs                          | Audit log inmutable + retención                             |
| Escala              | Unos pocos usuarios               | Miles de transacciones, concurrencia, SLA 99,9%             |
| Localización        | Un país                           | Impuestos, idioma y formato por país                        |
| Integraciones       | Ninguna o 1                       | API, bancos, TPV, e-commerce, EDI                           |
| Operación           | Se reinicia a mano                | Auto-recuperación, backups, DR probados                     |

### 2.4 "Terminado" también es una cuestión de madurez medible

Publicar el software exige capas más allá de lo funcional, con frameworks objetivos:

- **ISO/IEC 25010:2023** — 9 características de calidad de producto (idoneidad funcional, rendimiento, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad, flexibilidad, safety/protección). _Reliability_ y _security_ son las más caras si se dejan para el final. (iso.org)
- **DORA** — 4 métricas clave (deployment frequency, lead time, change failure rate, MTTR); un equipo "terminado" está en Alto/Elite en ≥3 de 4. (dora.dev)
- **SPACE** — 5 dimensiones de productividad del equipo (ACM Queue 2021).
- **TRL 1-9** — niveles de madurez tecnológica (NASA/ESA/UE) para comunicar "esto no está listo" a negocio.
- **PMF** — test de Sean Ellis (40%): un producto técnicamente terminado sin mercado no está "terminado".
- **Disciplina de release**: SemVer 2.0.0 + Keep a Changelog automatizados desde Conventional Commits (que Project One ya usa — encaje directo con `standard-version`/changesets).
- **Cloud**: 12-factor, IaC (Terraform), CI/CD con promoción de artefactos inmutables, entornos dev/staging/prod con paridad, observabilidad (logs/métricas/traces con OpenTelemetry), autoscaling, RPO/RTO definidos y **restore probado**, FinOps.
- **Seguridad**: OWASP Top 10 (A01 Broken Access Control es la más prevalente — 94% de apps testadas), DevSecOps shift-left (SAST/DAST/SCA/secret scan/IaC scan), authN/authZ (OAuth2/OIDC/JWT/RBAC→ABAC), cifrado en tránsito y en reposo, gestión de secretos, SOC 2 / ISO 27001, GDPR+LOPDGDD, hardening CIS, bug bounty.
- **Legal**: EULA, ToS/MSA, política de privacidad, cookies (en España el consentimiento por scroll **no** es válido), aviso legal, facturación de suscripciones con impuestos, DPA con subencargados.
- **Operación**: soporte por niveles, monitorización con alertas accionables y métricas de negocio (una caída de facturas emitidas es incidente aunque la infra esté verde), postmortems sin culpa, blue-green/canary, feature flags.

_(El detalle de cada punto con sus fuentes está en el research teórico `analisis-erp-publicacion-internet.md`; las URL se consolidan en la sección 8 de este documento.)_

---

## 3. Estado actual de Project One (evidencia del repo)

> Fuente: auditoría directa del 2026-10-11 sobre rama `ci-prebuild-improvement-v4` (árbol limpio). Rutas de archivo como evidencia.

### 3.1 Inventario de lo implementado

**Backend — `apps/server/src/` (24 módulos, patrón Controller → Service → DAO, ~126 handlers bajo `/api/v1` en `apps/server/src/routes/v1/index.js`):**

| Bloque               | Módulos                                                                                            | Evidencia                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Identidad/acceso     | Auth (JWT + refresh + cookies), Usuarios, RBAC                                                     | `modules/auth/`, `modules/users/`, `middleware/verifyRole.js`, `modules/security/`                                                |
| Inventario           | Productos (+categorías/atributos), Almacén, Stock, Movimientos                                     | `modules/products/`, `modules/warehouse/`, `modules/stock/`, `modules/inventoryMovement/`                                         |
| Cadena de suministro | Compras, Ventas, Órdenes de cliente/proveedor, Clientes, Proveedores                               | `modules/purchase/`, `modules/sales/`, `modules/clientOrder/`, `modules/providerOrder/`, `modules/clients/`, `modules/providers/` |
| Gastos               | Expenses                                                                                           | `modules/expenses/`                                                                                                               |
| RRHH                 | Empleados, Asistencia, Nómina, Evaluación, Vacaciones, Permisos laborales                          | `modules/{employees,attendance,payroll,performanceEvaluation,vacation,permission}/`                                               |
| Colaboración         | Notas (menciones/hashtags/favoritos — _maduro, mejor testeado_), Noticias, Eventos+RSVP (_maduro_) | `modules/notes/`, `modules/news/`, `modules/events/` (+ `stateMachine.js`)                                                        |
| Config               | Settings                                                                                           | `modules/settings/`                                                                                                               |

**Capas transversales del server (evidencia sólida):** `prisma/schema.prisma` (773 líneas, **43 modelos + 11 enums**); middleware de `verifyToken`, `verifyRole`, validación Joi (`validateSchema/Query/Param`), `verifyCsrf`, rate limiting (globales + login/refresh/changePassword/forgotPassword en `src/app.js:103`), **cifrado de campos AES-GCM vía middleware Prisma** (`encription-prisma-middleware.js`), `errorHandler`, CSP report; WebSockets/Socket.IO con Redis adapter (`src/socket/`); Winston estructurado (`src/logger/`); Swagger/OpenAPI (`src/docs/swagger.js`).

**Frontend — `apps/client/src/` (25 módulos, 27 páginas):** rutas lazy en `App.jsx` bajo `/home/*` con guards (`components/guards/ProtectedRoutes.jsx`); **23 slices RTK Query** (`modules/*/api/*Api.js`) + `redux-persist`; i18n EN/ES (`locale/*.json`, i18next); shadcn/ui + Tailwind + DataTable; socketService; **22 stories** de Storybook.

**E2E — `e2e/tests/`:** solo **5 specs / ~48 casos** (`login`, `logout`, `dashboard`, `users-crud`, `sales-view`).

### 3.2 Módulos ERP presentes vs ausentes

| Área ERP                     | Estado | Evidencia / comentario                                                                                                          |
| ---------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------- |
| Inventario / almacén         |   ✅   | `warehouse`, `stock`, `inventoryMovement`, `products`                                                                           |
| Ventas                       |   ✅   | `sales`, `clientOrder`, `clients`                                                                                               |
| Compras / proveedores        |   ✅   | `purchase`, `providerOrder`, `providers`                                                                                        |
| RRHH (básico→medio)          |   ✅   | 6 módulos (empleados…permisos laborales)                                                                                        |
| Gastos                       |   ⚠️   | `expenses` existe, pero sin CxC/CxP                                                                                             |
| **Finanzas / Contabilidad**  |   ❌   | Sin libro diario/mayor, plan de cuentas, conciliación bancaria, tesorería, CxC/CxP, cobros/pagos, multi-moneda, cierre contable |
| **Facturación / Impuestos**  |   ❌   | Sin modelos `invoice` ni `tax`; `sale` sin serie/folio fiscal ni e-invoicing                                                    |
| Valoración FIFO/LIFO         |   ⚠️   | README lo afirma; **no evidenciada en schema** como campos de costo/valoración                                                  |
| **Producción / MRP**         |   ❌   | Sin BOM, órdenes de producción, routings, MRP                                                                                   |
| Activos fijos                |   ❌   | —                                                                                                                               |
| Proyectos / Timesheet        |   ❌   | —                                                                                                                               |
| Logística / Envíos           |   ❌   | Sin guías de remisión ni tracking                                                                                               |
| Calidad                      |   ❌   | —                                                                                                                               |
| CRM (pipeline)               |   ⚠️   | Solo directorio de clientes; sin pipeline de oportunidades                                                                      |
| Reporting / BI               |   ⚠️   | Dashboards en `home` (`homeAPI`, widgets); sin informes exportables ni querying ad-hoc                                          |
| Multi-empresa / Multi-tenant |   ❌   | —                                                                                                                               |

### 3.3 Calidad, tests y seguridad (resumen del audit)

- **Tests:** ~140 archivos, ~490–550 casos. Server unit: 17 archivos/~200 casos **concentrados en `events/` (12) y `notes/utils`** → **21 de 24 módulos SIN unit tests**. Integración: solo 2 módulos (events, notes). `tests/regression/` **vacía**. Client: 113 archivos/~202 casos (87 UI). Cobertura: server statements 60.8 / branches 64.48 (`apps/server/vitest.config.js:47-54`); client 64.44 / 42.11; **ratchet operativo** (`scripts/ci/coverage-check.mjs`, `coverage-ratchet.mjs`, change `coverage-tripwire-ratchet` 22/22).
- **Herramientas:** ESLint 9 `--max-warnings 0`, Prettier, knip, dependency-cruiser, actionlint, zizmor, checkov, hadolint, markdownlint, vale, `tsc --noEmit` + JSDoc sobre JS.
- **Husky:** pre-commit bloqueante (lint-staged + Semgrep + Gitleaks) y advisory (npm audit, checkov, hadolint, GuardDog); pre-push (DCO + tests scoped); commit-msg (commitlint).
- **CI (11 workflows):** `ci.yml` ~2.100 líneas con verify-signatures, DCO, SAST, tests con TIA + flaky quarantine + coverage gates, SonarQube, SBOM…; `security.yml` con Trivy, CodeQL, Semgrep semanal; `deploy.yml` (CD), `preview.yml`, `release.yml` (changesets), nightly/flaky/security scheduled.
- **Pendientes de seguridad:** **DAST no existe**; **permisos granulares no aplicados a todos los módulos** (pending.txt: "aplicar los permisos a módulos y sistema"); **ABAC inexistente** (`grep ABAC src` = 0) pese a claim del README; **208 `console.log`** en `apps/*/src` (log injection / ruido — debe migrarse a Winston).

### 3.4 Cloud / deploy

- **Docker:** `apps/server/Dockerfile`, `docker-compose.yml`, `docker-compose.preview.yml`.
- **CD real:** `deploy.yml` → build → smoke emulados → push **ECR vía OIDC** (sin keys permanentes) → **ECS Fargate staging** + CloudWatch logs. Preview: Vercel para el client.
- **IaC: NO hay Terraform/CDK/CloudFormation en el repo** (`*.tf` = 0). La arquitectura target está documentada en `docs/aws-deploy-architecture.md` (ECS, ALB+ACM, RDS, VPC, Secrets Manager, OIDC) pero **sin codificar**.
- **Observabilidad:** solo CloudWatch de contenedor. APM: change `cd-observability-sentry` **0/26** (no implementado).
- **Secrets:** GitHub secrets → Secrets Manager con fase de wiring (`loadSecrets()`) pendiente; el server ya depende de `@aws-sdk/client-secrets-manager`.
- **Release:** `.changeset/` configurado + `release.yml`.

### 3.5 Docs, UX y proceso

- **Docs:** 100+ archivos (`docs/rbac-system.md`, `aws-deploy-architecture.md`, `ci-cd-pipeline-empresarial.md`, `testing-architecture.md`, `security/`, 1 ADR, 24 guías de learning, **35 guías de módulo**). Pero `docs/openspec-implementation-audit.md` es puntual y obsoleta (audita solo `testing-strategy`, 2025-07-28).
- **README desalineado:** badge Node 18 vs `engines >=22.11`; claim "RBAC + ABAC" sin código ABAC; "45+ permisos" vs seed hasta 82; "FIFO/LIFO" sin evidencia.
- **OpenSpec (SDD):** **34 changes activos** (130 specs; ~140 archivados). ~10 casi cerrados; backlog sin empezar incluye `add-sse-notification-infrastructure` (76 tareas), `frontend-data-architecture` (71), `ci-shifting-left` (53), `adjust-global-rate-limit` (28), `cd-observability-sentry` (26), `server-typescript-migration` (25), `ci-testcontainers` (18), `iac-scanning` (5/14).
- **UX:** shadcn + i18n + guards + stories, pero **sin a11y, sin dark mode**, sin error boundaries, refresco de datos deficiente y manejo no uniforme de `isError` en RTK Query (todo anotado en `pending.txt`, 189 líneas).

---

## 4. Gap analysis (cruce teoría vs realidad)

| #   | Requisito teórico (sección de origen)                                             | Estado en Project One (evidencia)                                                                 | Gap / acción                                                                                                   |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Contabilidad: libro diario/mayor, plan de cuentas, CxC/CxP, cierre (§2.1)         | **Ausente** — sin modelos contables en `schema.prisma`                                            | 🔴 Crítico. Ciclo económico ABIERTO. Implementar finanzas básicas o renombrar el producto                      |
| 2   | Facturación e impuestos: invoice, serie/folio, IVA, e-invoicing (§2.2)            | **Ausente** — `sale` sin datos fiscales                                                           | 🔴 Crítico para vender (legal en España: Reglamento de Facturación/SII **[conocimiento del modelo]**)          |
| 3   | Producción / MRP: BOM, órdenes, routings (§2.1)                                   | **Ausente**                                                                                       | 🟠 Decidir alcance: si el target es "comercio" declararlo; si es "product-centric" implementar                 |
| 4   | Permisos granulares por módulo/campo + separación de funciones (§2.2)             | RBAC por roles (`verifyRole.js`) pero **permisos no aplicados a todos los módulos** (pending.txt) | 🔴 Crítico (OWASP A01, la más prevalente). Aplicar `userPermits` a los 24 módulos                              |
| 5   | ABAC (atributos de compañía/región) (§5.3 teórico)                                | **Inexistente** (`grep ABAC src` = 0) — README lo claima                                          | 🔴 Corregir README o implementar                                                                               |
| 6   | Pirámide de tests: unit + integración por módulo (§6.1 teórico)                   | 21/24 módulos server sin unit; integración solo en 2                                              | 🔴 Tests de negocio (compras, ventas, stock, nómina) — ver checklist §5                                        |
| 7   | E2E de flujos críticos (§6.1 teórico: emitir factura, recibir contra PO, cierre…) | 5 specs (login/logout/dashboard/users/sales-view)                                                 | 🔴 Ampliar a ventas, compras, stock, login+RBAC, RRHH                                                          |
| 8   | Contract testing OpenAPI/Pact (§6.1 teórico)                                      | Pendiente en pending.txt (Swagger existe en server)                                               | 🟠 Generar tests de contrato desde el OpenAPI ya presente                                                      |
| 9   | Regression tests + UAT (§2.6 teórico)                                             | `tests/regression/` vacía; sin UAT                                                                | 🟠 Poblar nightly (infra ya operativa: `nightly-full-suite.yml`)                                               |
| 10  | DAST (§5.2 teórico: OWASP ZAP)                                                    | **No existe** (pending.txt confirma A03/DAST abierto)                                             | 🟠 ZAP baseline en CI programado                                                                               |
| 11  | Cobertura como gate + ratchet (§6.2 teórico)                                      | ✅ **Hecho** — ratchet 22/22, gates en CI                                                         | 🟢 Mantener; subir umbrales al añadir tests de los módulos huérfanos                                           |
| 12  | IaC (Terraform) reproducible (§4.4 teórico)                                       | **Sin `*.tf`**; arquitectura solo documentada                                                     | 🔴 Codificar VPC/ALB/ECS/RDS/Secrets en Terraform (change `iac-scanning`, `cd-aws-deploy-pipeline` sin cerrar) |
| 13  | Observabilidad: logs/métricas/traces, APM (§4.7 teórico)                          | Solo CloudWatch; Sentry 0/26                                                                      | 🔴 `cd-observability-sentry`; OTel como estándar                                                               |
| 14  | DR: RPO/RTO definidos y **restore probado** (§4.9 teórico)                        | No evidenciado en repo                                                                            | 🔴 Definir RPO/RTO (RPO≈0 para transacciones financieras) + drill de restore                                   |
| 15  | CD a producción con promoción de artefacto (§4.5 teórico)                         | CD a **staging**; prod no evidenciada                                                             | 🟠 `cd-aws-deploy-pipeline` 21/24; añadir aprobación + rollback                                                |
| 16  | SSL/DNS/dominios por entorno (§4.11 teórico)                                      | ALB+ACM planificado en docs; no codificado                                                        | 🟢 Queda cubierto con IaC (gap 12)                                                                             |
| 17  | Multi-tenant / multi-moneda / i18n de negocio (§2.2 teórico)                      | i18n UI EN/ES ✅; multi-tenant y multi-moneda ❌                                                  | 🟠 Decidir modelo: si SaaS multi-cliente, RLS + tenant de sesión; si on-prem single-company, declararlo        |
| 18  | Audit log inmutable (§2.2 teórico)                                                | No evidenciado como módulo (existe `registration_log` solo para eventos)                          | 🟠 Implementar audit log transversal                                                                           |
| 19  | a11y + dark mode + error boundaries (ISO 25010 usabilidad)                        | No implementados (pending.txt)                                                                    | 🟠 UX baseline para beta pública                                                                               |
| 20  | Logging estructurado sin `console.log` (§4.7/5.2 teórico)                         | **208 `console.log`** pese a existir `src/logger/`                                                | 🔴 Migrar (también riesgo de log injection)                                                                    |
| 21  | SemVer + changelog curado (§3.1/3.2 teórico)                                      | ✅ Changesets + `release.yml` configurados                                                        | 🟢 Asegurar changelog legible para usuario (Keep a Changelog)                                                  |
| 22  | Docs alineadas con el producto (§3.6 teórico)                                     | README con 4 claims falsos; auditoría OpenSpec obsoleta                                           | 🔴 Corregir README y regenerar auditoría global                                                                |
| 23  | TypeScript / tipado fuerte (mantenibilidad ISO 25010)                             | Server 100% JS; cambio `server-typescript-migration` 0/25                                         | 🟡 P2 — no bloquea, pero deuda que encarece el futuro                                                          |
| 24  | GDPR/LOPDGDD, EULA, licencia, privacidad (§7 teórico)                             | No evidenciado en repo (sin docs legales)                                                         | 🔴 Antes de cobrar a clientes reales con PII                                                                   |
| 25  | Proceso: 34 openspec changes activos                                              | Drift de plan vs ejecución                                                                        | 🟠 Cerrar los ~10 casi terminados; arrancar los P0 del backlog                                                 |

**Leyenda:** 🔴 bloqueante para "producto terminado" · 🟠 necesario para beta pública · 🟡 madurez enterprise · 🟢 ya cubierto.

---

## 5. Checklists de "producto terminado"

### 5.1 Producto / funcional

Objetivo: **cerrar el ciclo económico del ERP** y validar con usuarios reales.

- [ ] **Decisión de alcance documentada (ADR)**: ¿Project One es un ERP con ciclo financiero cerrado o una suite de operaciones? Registrar en `docs/adr/` (falta de ADRs es deuda — solo hay 1)
- [ ] Ciclo compras→stock→ventas→**contabilidad** cerrado y cuadrado (regla de §2.1)
- [ ] Módulo **finanzas básico**: plan de cuentas, libro diario/mayor, CxC/CxP, cobros/pagos
- [ ] Módulo **facturación**: modelos `invoice`/`tax`, serie/folio, IVA, exportación
- [ ] **Producción**: o bien BOM+órdenes mínimas, o bien descarte explícito en README/docs
- [ ] **Valoración de stock**: implementar FIFO/LIFO real o retirar el claim del README
- [ ] **Audit log transversal**: quién cambió qué, cuándo, inmutable, con retención
- [ ] **Multi-tenant**: decisión tomada (SaaS vs on-prem) y, si aplica, RLS + tenant derivado de sesión
- [ ] **Data seeding demo**: plan contable de ejemplo + catálogo de productos + clientes/proveedores de muestra (onboarding: "primer éxito en minutos")
- [ ] **UAT con 2-3 usuarios reales** (beta cerrada) con guiones de uso por rol
- [ ] Reporting básico exportable (Excel/CSV) con coherencia de cifras entre módulos
- [ ] README y docs de usuario reflejan exactamente lo que el producto hace (ver §4, gaps 20/22)

### 5.2 Ingeniería / calidad

Objetivo: que cada release sea confiable.

- [ ] Unit tests en los **21 módulos server sin cobertura** (prioridad: sales, purchase, stock, inventoryMovement, payroll)
- [ ] Integration tests en los módulos de negocio (hoy solo events/notes)
- [ ] **E2E de flujos críticos**: ventas completo, compras completo, stock/inventario, login+RBAC, RRHH (hoy 5 specs)
- [ ] **Contract testing** client↔server (OpenAPI ya existe en `src/docs/swagger.js` — Pact o schemathesis)
- [ ] Poblar **`tests/regression/`** y ejecutar en `nightly-full-suite.yml`
- [ ] Subir **coverage ratchet** progresivamente tras cada ola de tests (umbrales actuales: server 60.8/64.48, client 64.44/42.11)
- [ ] **0 `console.log`** en `apps/*/src` — todo a Winston (back) y logger (front)
- [ ] Manejo uniforme de `isError` de RTK Query + react-error-boundary + refresco de datos tras mutaciones
- [ ] Migración TypeScript del server iniciada (`server-typescript-migration`, 0/25)
- [ ] Cerrar los ~10 openspec changes al 85–100% (reducir drift de los 34 activos)
- [ ] Mutation testing (Stryker) en pipeline separado — opcional, rigor real

### 5.3 Cloud / ops

Objetivo: que staging y prod sean reproducibles, observables y recuperables.

- [ ] **IaC Terraform** de la arquitectura ya documentada (`docs/aws-deploy-architecture.md`): VPC, ALB+ACM, ECS Fargate, RDS PostgreSQL, Secrets Manager, OIDC IAM — estado remoto con bloqueo, por entorno
- [ ] **Wiring de Secrets Manager** completo (`loadSecrets()`) — fase 2c pendiente
- [ ] **Observabilidad**: Sentry (o equivalente) + trazas (OpenTelemetry), dashboards RED/USE, logs correlacionados con trace ID (cambios `cd-observability-sentry`, `add-sse-notification-infrastructure`)
- [ ] **SLOs + alertas accionables** (incl. métricas de negocio: facturas emitidas/hora, pedidos/minuto)
- [ ] **RPO/RTO definidos por workload** (RPO≈0 para datos financieros → PITR/réplicas) y **drill de restore probado** (no basta con "los backups están activos")
- [ ] **CD staging→prod** con aprobación, rollback probado y promoción del mismo artefacto (cerrar `cd-aws-deploy-pipeline` 21/24)
- [ ] SSL/ACM con renovación automática, HSTS, subdominios por entorno (`app.`, `staging.`, `api.`), SPF/DKIM/DMARC para correo transaccional
- [ ] Backups de RDS automatizados + cifrados + verificados
- [ ] Paridad dev/prod (12-factor #10): mismos servicios de backing
- [ ] Runbooks de despliegue y rollback documentados; feature flags para rollout progresivo
- [ ] Status page (aunque sea básica) y proceso de incidentes con severidades SEV1–SEV4

### 5.4 Seguridad / legal

Objetivo: poder vender sin riesgos regulatorios ni de seguridad.

- [ ] **DAST**: OWASP ZAP baseline en CI programado (cubre A03, A05–A10)
- [ ] **Permisos granulares RBAC aplicados a los 24 módulos** (hoy `userPermits` solo referenciado desde `modules/users`)
- [ ] Decisión y, si aplica, implementación de **ABAC** (o retirar el claim del README)
- [ ] Validación completa del checklist **OWASP Top 10** (A02 TLS/HTTPS pendiente de infra; A01 parcial)
- [ ] MFA para cuentas administrativas; revisión de JWT (expiración corta, refresh rotation, validación de `alg`)
- [ ] **Secrets**: cero secretos en repo/imágenes; rotación vía Secrets Manager (Gitleaks ya bloquea commits)
- [ ] **SOC 2 / ISO 27001 track**: al menos Type I o plan con calendario si el target es B2B enterprise (6-12 meses de preparación típica)
- [ ] **GDPR + LOPDGDD**: bases legales, minimización, derechos del interesado, registro de actividades, notificación de brechas 72h, DPA con subencargados
- [ ] **Banner de cookies** conforme a España (rechazo en misma jerarquía que aceptar; scroll no vale — AEPD)
- [ ] **EULA + ToS/MSA + política de privacidad + aviso legal** redactados y publicados
- [ ] **Licencia** del software decidida (comercial/dual si se sigue el modelo Odoo) y NOTICE de terceros revisado
- [ ] **Changelog + SemVer** publicados para usuarios (changesets ya integran; curar el changelog como doc de producto)
- [ ] Pentest externo antes de GA (o security.txt RFC 9116 + disclosure policy como mínimo)

---

## 6. Hoja de ruta priorizada

Tres fases que convierten los P0/P1/P2 del audit en un plan con hitos verificables. Los cambios de OpenSpec entre paréntesis ya existen en `openspec/changes/` con sus tareas contadas.

### Fase P0 — Cierre de MVP ("el producto dice lo que hace")

| Trabajo                                                                                                                                                                                        | Fuente          | Esfuerzo relativo                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------- |
| Aplicar permisos RBAC a nivel API en los 24 módulos; corregir README (ABAC, Node, permisos, FIFO/LIFO)                                                                                         | Audit P0 #1, #6 | M                                         |
| Tests unit+integration de los 21 módulos server huérfanos (manteniendo ratchet)                                                                                                                | Audit P0 #2     | L                                         |
| E2E de flujos críticos: ventas, compras, stock, login+RBAC, RRHH                                                                                                                               | Audit P0 #3     | M                                         |
| Decisión de alcance de ERP + ADR: facturación/impuestos y finanzas básicas (CxC/CxP) → implementar o descartar explícitamente                                                                  | Audit P0 #4     | L (si se implementa) / S (si se descarta) |
| Eliminar 208 `console.log` → Winston/logger                                                                                                                                                    | Audit P0 #5     | S-M                                       |
| Auditoría global de openspec regenerada; cerrar los ~10 changes al 85–100% (`cd-aws-deploy-pipeline`, `containerfile-lint`, `ci-security-hardening`, `add-patch-endpoints`, `add-event-rsvp`…) | Audit P1 #7     | S (son casi terminados)                   |

**Hito de salida:** producto que cumple lo que promete, con módulos de negocio testeados y E2E de los flujos clave. _Esfuerzo total estimado: alto (la parte de finanzas/facturación domina si se decide implementarla)._

### Fase P1 — Beta pública ("se puede operar con clientes reales")

| Trabajo                                                                                   | Fuente                                                                        | Esfuerzo relativo |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------- |
| **IaC Terraform** (VPC/ALB/ECS/RDS/Secrets) + wiring Secrets Manager                      | Audit P1 #9; `iac-scanning` 5/14, `cd-aws-deploy-pipeline` 21/24              | L                 |
| **Observabilidad** Sentry/APM + alertas                                                   | Audit P1; `cd-observability-sentry` 0/26                                      | M                 |
| **DAST** (ZAP baseline programado)                                                        | Audit P1 #11; `ci-shifting-left` 0/53                                         | S                 |
| **Contract testing** OpenAPI/Pact                                                         | Audit P1 #8                                                                   | M                 |
| Regression + sanity/UAT en nightly                                                        | Audit P1 #10                                                                  | S-M               |
| UX baseline: a11y, dark mode, error boundaries, refresco de datos, `isError` centralizado | Audit P1 #12                                                                  | M                 |
| Infra de notificaciones (**SSE**) y **frontend-data-architecture** (deuda RTK Query)      | `add-sse-notification-infrastructure` 0/76, `frontend-data-architecture` 0/71 | L                 |
| Ajuste de rate limiting global                                                            | `adjust-global-rate-limit` 0/28                                               | S                 |
| GDPR/LOPDGDD baseline + EULA/ToS/privacidad/cookies                                       | Teoría §7 (sin trabajo previo en repo)                                        | M                 |

**Hito de salida:** staging es un espejo reproducible de prod (IaC), releases son observables, seguridad validada dinámicamente, y el marco legal permite cobrar. _Esfuerzo total: medio-alto._

### Fase P2 — GA / compliance enterprise

| Trabajo                                                                         | Fuente                                | Esfuerzo relativo           |
| ------------------------------------------------------------------------------- | ------------------------------------- | --------------------------- |
| **CD staging→prod** con aprobación y rollback (cierra `cd-aws-deploy-pipeline`) | Audit sección 4                       | M                           |
| DR: RPO/RTO definidos + **drill de restore probado**                            | Teoría §4.9                           | M                           |
| **Migración TypeScript** del server                                             | `server-typescript-migration` 0/25    | L                           |
| Reporting/BI exportable + i18n de módulos de negocio                            | Audit P2 #15; `i18n-business-modules` | L                           |
| SOC 2 Type I / ISO 27001 track; pentest externo; bug bounty o security.txt      | Teoría §5.6/5.7                       | L (proceso, no solo código) |
| Multi-moneda / multi-tenant (si el modelo de negocio lo exige)                  | Teoría §2.2                           | XL                          |
| Mutation testing, testcontainers, test sharding ampliado                        | `ci-testcontainers` 0/18, P2 #14      | M                           |
| Reevaluar PM2/NX solo con señal real de necesidad                               | Audit P2 #16                          | S                           |

**Hito de salida:** CD a producción, DR certificado, cumplimiento baseline y tipado fuerte. _Esfuerzo total: alto, continuado en el tiempo (compliance es calendario, no sprint)._

> **Nota de estimación:** los tamaños (S/M/L/XL) son relativos entre sí, no horas; la incertidumbre dominante es la decisión de alcance de la Fase P0 (finanzas/facturación): implementar contabilidad partida doble real es, por sí sola, el trabajo más grande del plan.

---

## 7. Conclusión

**¿Qué define "producto terminado"?** Para Project One, cuatro verificadores objetivos y en este orden:

1. **Ciclo económico cerrado** — compras→stock→ventas→facturación→contabilidad cuadrados entre sí. Sin esto, "ERP" es oversell; con esto, el producto justifica su nombre. _(Sección 2.1 y §4, gaps 1-3.)_
2. **Gates de calidad en cada módulo** — no 5 specs de E2E sino los flujos críticos cubiertos; no 3 módulos con tests sino los 24; permisos aplicados donde hay datos. _(§5.1-5.2.)_
3. **CD a producción reproducible y observable** — IaC que haga de staging un espejo, APM que vea el error antes que el cliente, restore probado que convierta los backups en una DR real. _(§5.3.)_
4. **Compliance baseline** — DAST, OWASP cerrado, GDPR/LOPDGDD, EULA y licencia: el mínimo para que un cliente firme y pague sin riesgo para ninguno de los dos. _(§5.4.)_

**Reflexión honesta:** "producto terminado" no es un estado sino un umbral. Un ERP nunca estará "terminado" en el sentido absoluto — Odoo, SAP y NetSuite llevan décadas añadiendo módulos. Lo que sí existe son **hitos verificables** que separan un hobby de un producto vendible, y Project One ya está más cerca de lo que su nota agregada (3.4/5) sugiere: la ingeniería de CI/CD, seguridad estática y proceso SDD está en nivel senior, y eso es exactamente lo que hace que los huecos restantes sean **acotables y planificables**. El mayor riesgo no es técnico sino de **promesa**: mientras el README diga "ABAC", "FIFO/LIFO" y "ERP" sin los módulos que lo sustentan, el producto se mide contra una imagen que él mismo publica. Cerrar esa brecha —decidir el alcance, cerrar el ciclo financiero o renombrar honestamente el producto— es el primer 10% del camino; el resto (IaC, observabilidad, tests, compliance) ya tiene los cambios de OpenSpec, los pending.txt y esta hoja de ruta para ejecutarse sin sorpresas.

---

## 8. Fuentes

### 8.1 Investigación teórica (con URL verificada)

**ERP / analistas**

- ERPNext Modules (oficial) — https://frappe.io/erpnext/modules
- ERPNext Docs Introduction — https://docs.frappe.io/erpnext/introduction
- Odoo vs SAP vs NetSuite — https://silentinfotech.com/blog/erp-5/odoo-vs-sap-vs-netsuite-377
- NetSuite vs SAP — https://www.netsuite.com/portal/solutions/sap.shtml
- Gartner MQ Cloud ERP for Product-Centric Enterprises 2025 — https://cxtoday.com/gartner-magic-quadrant-for-cloud-erp-for-product-centric-enterprises-2025-the-rundown · https://www.gartner.com/en/documents/5907275
- Forrester ERP Landscape Q1 2026 — https://www.forrester.com/blogs/the-forrester-landscape-erp-solutions-q1-2026-is-out/
- AWS: 5 multi-tenant SaaS best practices — https://aws.amazon.com/isv/resources/5-multi-tenant-saas-architecture/
- WorkOS: SaaS multi-tenant guide — https://workos.com/blog/developers-guide-saas-multi-tenant-architecture
- Multi-tenant audit logging lessons — https://dev.to/robertatkinson3570/multi-tenant-audit-logging-the-architecture-mistakes-we-made-3m8f

**Madurez / calidad**

- ISO/IEC 25010:2023 — https://www.iso.org/standard/78176.html · https://iso25000.com/en/iso-25000-standards/iso-25010
- SonarSource ISO 25010 — https://www.sonarsource.com/resources/library/iso-iec-25010-explained/
- arc42: ISO 25010 update 2023 — https://quality.arc42.org/articles/iso-25010-update-2023
- DORA metrics — https://dora.dev/guides/dora-metrics/ · Google Four Keys — https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance · Atlassian DORA — https://www.atlassian.com/devops/frameworks/dora-metrics
- SPACE (ACM Queue) — https://queue.acm.org/doi/fullHtml/10.1145/3454122.3454124 · Microsoft SPACE — https://azure.microsoft.com/en-us/blog/navigating-the-space-between-productivity-and-developer-happiness/
- NASA TRL — https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/ · ESA TRL — https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Shaping_the_Future/Technology_Readiness_Levels_TRL
- Reforge: 40% test de PMF — https://www.reforge.com/guides/measure-and-improve-product-market-fit
- First Round: Superhuman PMF — https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/

**Distribución / release**

- Semantic Versioning 2.0.0 — https://semver.org/
- Keep a Changelog 2.0.0 — https://keepachangelog.com/en/2.0.0/
- standard-version — https://github.com/conventional-changelog/standard-version
- Licencias OSI — https://opensource.org/licenses
- Flexera: híbrido seats+consumo — https://www.flexera.com/blog/saas-management/from-seats-to-consumption-why-saas-pricing-has-entered-its-hybrid-era/
- Maxio 2025 SaaS pricing — https://www.maxio.com/resources/2025-saas-pricing-trends-report
- Moesif: 7 modelos de pricing — https://www.moesif.com/blog/technical/api-development/SaaS-Pricing-Models/
- OpenAPI meets SLA — https://www.openapis.org/blog/2021/03/10/openapi-meets-sla · OpenAPI 3.1 — https://spec.openapis.org/oas/v3.1.0
- Hyperping: uptime SLA tiers — https://hyperping.com/glossary/uptime-sla
- Odoo Apps Store — https://www.odoo.com/store/apps

**Cloud / infra**

- The Twelve-Factor App — https://12factor.net/
- Terraform — https://developer.hashicorp.com/terraform/intro · https://developer.hashicorp.com/terraform/language
- AWS RPO/RTO — https://aws.amazon.com/blogs/mt/establishing-rpo-and-rto-targets-for-cloud-applications/ · https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-of-on-premises-applications-to-aws/recovery-objectives.html · https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
- FinOps Framework — https://www.finops.org/framework/ · https://www.finops.org/framework/principles/
- OpenTelemetry — https://openobserve.ai/blog/full-stack-observability-logs-metrics-traces/ · Grafana OTel — https://grafana.com/blog/opentelemetry-best-practices-a-users-guide-to-getting-started-with-opentelemetry/
- Prometheus — https://prometheus.io/docs/introduction/overview/ · Kubernetes — https://kubernetes.io/docs/home/

**Seguridad**

- OWASP Top 10 2021 — https://owasp.org/Top10/2021/ · proyecto — https://owasp.org/projects/top-ten/ · 2025 — https://top10.owasp.org/2025/en/ · Cheat Sheets — https://cheatsheetseries.owasp.org/IndexTopTen.html
- OIDC Core 1.0 — https://openid.net/specs/openid-connect-core-1_0.html · Okta OAuth/OIDC — https://developer.okta.com/docs/concepts/oauth-openid/
- Vanta: SOC 2 for startups — https://www.vanta.com/collection/soc-2/soc-2-for-startups
- Stripe: SaaS compliance — https://stripe.com/resources/more/saas-compliance-requirements-and-how-companies-meet-them
- DLA Piper: data protection Spain — https://www.dlapiperdataprotection.com/?t=law&c=ES
- Didomi: cookie law Spain — https://www.didomi.io/blog/all-you-need-to-know-about-cookie-consent-law-in-spain
- AEPD: consentimiento — https://www.aepd.es/es/derechos-y-deberes/consentimiento
- Comisión Europea: cookies — https://commission.europa.eu/cookies-policy_en · Iubenda Spain — https://www.iubenda.com/en/blog/spain-cookie-consent-rules · Satya Legal GDPR — https://www.satyalegal.es/en/services/gdpr-startups/
- HashiCorp vulnerability management — https://www.hashicorp.com/en/trust/security/vulnerability-management
- HackerOne bug bounty — https://www.hackerone.com/bug-bounty-programs
- CIS Benchmarks — https://www.cisecurity.org/benchmark

**Ingeniería**

- adr.github.io — https://adr.github.io/ · Fowler ADR — https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
- SonarSource code coverage — https://www.sonarsource.com/resources/library/code-coverage/
- Qt: umbrales de cobertura — https://www.qt.io/software-insights/is-70-80-90-or-100-code-coverage-good-enough
- LaunchDarkly: code coverage — https://launchdarkly.com/blog/code-coverage-what-it-is-and-why-it-matters/
- CircleCI monorepo — https://circleci.com/blog/monorepo-dev-practices/ · Nx monorepo — https://nx.dev/docs/kb/what-is-a-monorepo · Aviator mono vs poly — https://www.aviator.co/blog/monorepo-vs-polyrepo/

**Operación**

- Google SRE postmortems — https://sre.google/sre-book/postmortem-culture/ · https://sre.google/workbook/postmortem-culture/
- Atlassian blameless postmortem — https://www.atlassian.com/incident-management/postmortem/blameless
- LaunchDarkly: blue-green — https://launchdarkly.com/blog/blue-green-deployments-a-definition-and-introductory/ · estrategias — https://launchdarkly.com/blog/deployment-strategies/ · canary — https://launchdarkly.com/blog/what-is-a-canary-release/ · feature flags — https://launchdarkly.com/blog/what-are-feature-flags/
- Harness: canary + flags — https://www.harness.io/blog/canary-release-feature-flags

### 8.2 Auditoría del codebase (fuentes primarias, lectura directa en repo)

- `README.md`, `pending.txt` (189 líneas), `package.json` (raíz, `apps/server`, `apps/client`), `AGENTS.md`
- `apps/server/prisma/schema.prisma`, `apps/server/src/{modules,middleware,routes,app.js}`, `apps/server/vitest.config.js`, `apps/server/tests/`
- `apps/client/src/{App.jsx,modules,redux,components}`, `apps/client/vitest.config.js`
- `e2e/tests/`, `.husky/{pre-commit,pre-push,commit-msg}`, `.github/workflows/*.yml` (11 workflows)
- `openspec/changes/` (34 activos + ~140 archivados), `openspec/specs/` (130)
- `docs/` (rbac-system, aws-deploy-architecture, ci-cd-pipeline-empresarial, testing-architecture, openspec-implementation-audit, security/, adr/, learning/, modules/), `reports/`, `.changeset/config.json`
- Documentos de trabajo: `C:\Users\user\AppData\Local\Temp\opencode\analisis-erp-publicacion-internet.md` y `analisis-codebase-estado.md` (2026-10-11)

### 8.3 Afirmaciones sin URL verificada — [conocimiento del modelo]

Las siguientes afirmaciones se basan en conocimiento general del modelo y deben contrastarse con la normativa oficial antes de usarse en documentación legal o de producción:

- Detalles del Reglamento de Facturación español, SII y ticket de empresa (§2.2, §4 gap 2).
- Matices de PCI-DSS v4.0 (retención de audit logs ≥12 meses).
- Plantillas concretas de runbook y postmortem (patrones de Google SRE descritos de forma general).
- La afirmación sobre invalidez del consentimiento por scroll en España se apoya en la guía de la AEPD citada, pero la URL exacta de la guía específica debe verificarse al redactar los textos legales.
