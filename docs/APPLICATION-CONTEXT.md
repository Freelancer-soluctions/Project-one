# Application Context — Project One

> **Propósito:** documento único que describe el contexto completo de la aplicación Project One: qué es, para quién, qué hace, cómo está construida, qué reglas de negocio la gobiernan y qué NO hace. Sirve de punto de entrada para onboarding, para la configuración de OpenSpec (`openspec/config.yaml`) y para que cualquier agente o desarrollador entienda el sistema sin leer 35 guías de módulo.
>
> **Fuentes de verdad:** este documento sintetiza y enlaza (no duplica) el contenido de `README.md`, `docs/modules/INDEX.md`, `docs/architecture/rbac-system.md`, `docs/architecture/architectural-approach.md`, `docs/product/analisis-producto-terminado-erp.md`, `apps/server/prisma/schema.prisma` y `AGENTS.md`. Cuando haya conflicto entre este documento y el código, **el código manda**; actualiza este documento.
>
> **Última actualización:** 2026-11-23.
>
> **Idioma:** español.

---

## 1. Visión del producto y alcance

**Project One** es un sistema ERP de operaciones (suite de gestión de inventario, ventas/compras, RRHH y colaboración) construido como monorepo full-stack (React + Express + PostgreSQL). Gestiona el ciclo operativo de una empresa: productos, stock, clientes, proveedores, órdenes de compra/venta, empleados, asistencia, nómina, vacaciones, evaluaciones, gastos, notas y eventos.

### 1.1 Lo que SÍ hace (capacidades implementadas)

- **Inventario y stock:** multi-almacén, lotes con vencimiento, movimientos (entrada/salida/transferencia/ajuste), alertas de stock bajo y vencido. La valoración FIFO/LIFO/promedio ponderado es un **claim de README sin evidencia en código** (el stock calcula `quantity × price`; ver §12).
- **Ventas y compras:** órdenes de clientes, órdenes a proveedores, compras registradas, clientes y proveedores.
- **RRHH:** empleados con datos sensibles encriptados, asistencia/horas, nómina con montos encriptados, vacaciones (PENDING/APPROVED/REJECTED), evaluaciones de desempeño, permisos laborales (licencias, enfermedad, maternidad, asuntos personales).
- **Colaboración:** notas Kanban (columnas, hashtags, menciones, favoritos), noticias con ciclo de vida ACTIVE→PENDING→CLOSED, eventos con tipos y fechas, asistentes.
- **Gastos:** gastos empresariales categorizados (enum nativo de Prisma).
- **Configuración:** settings de visualización e idioma, categorías de producto.
- **Seguridad:** RBAC con **82 códigos de permiso activos** (90 sembrados en BD), JWT + refresh token rotation, CSRF, rate limiting, SAST/SCA/secret scanning en CI.

### 1.2 Lo que NO hace (no-goals explícitos)

Según `docs/product/analisis-producto-terminado-erp.md`, el producto **no** es un ERP completo. Faltan por completo:

- **Finanzas / contabilidad:** no hay libro diario/mayor, plan contable, CxC/CxP, conciliación bancaria, cierre mensual/anual, estados financieros.
- **Facturación e impuestos:** no hay facturación electrónica, IVA/retenciones, libros de IVA, SII.
- **Manufactura / MRP:** no hay BOM, rutas, órdenes de trabajo, calidad de producción.
- **POS (punto de venta):** no existe.
- **Reporting / BI avanzado:** informes operativos básicos; sin drill-down ni consolidación financiera.
- **Multi-tenant:** no hay aislamiento por empresa/compañía (single-tenant).
- **Multi-moneda:** una sola moneda.
- **Integraciones externas:** no hay API bancaria, TPV, e-commerce, EDI.

**Consecuencia para onboarding:** comunica honestamente el alcance. Si un cliente pide contabilidad o facturación, eso es un proyecto nuevo, no una feature.

### 1.3 Actores y roles

| Rol     | Código | Descripción         | Comportamiento                                             |
| ------- | ------ | ------------------- | ---------------------------------------------------------- |
| ADMIN   | C01    | Administrador total | Bypass completo de permisos                                |
| USER    | C02    | Usuario estándar    | Default al registrarse; acceso según permisos individuales |
| MANAGER | C03    | Gestión intermedia  | Acceso a funciones administrativas limitadas               |

Además existen permisos laborales (licencias, enfermedad, maternidad, asuntos personales) gestionados por el módulo `permission/`, que es un dominio distinto del RBAC.

Ver detalle completo en `docs/architecture/rbac-system.md`.

---

## 2. Actores y roles (dominio de negocio)

- **Administrador (ADMIN / C01):** gestiona usuarios, roles, permisos, configuración, módulos.
- **Manager (MANAGER / C03):** funciones administrativas limitadas (ver/editar según permisos).
- **Usuario estándar (USER / C02):** acceso según permisos individuales asignados.
- **Empleado:** entidad de RRHH con datos sensibles encriptados (no siempre es usuario del sistema).
- **Cliente:** entidad comercial (catálogo de clientes).
- **Proveedor:** entidad comercial (catálogo de proveedores).

La asignación de permisos es **por usuario** (`userPermits`), no por rol (no hay herencia rol→permiso; `rolePermits` está comentado en el schema). Ver `docs/architecture/rbac-system.md` §8.

---

## 3. Glosario de negocio (términos del dominio)

| Término                           | Significado en el sistema                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| Producto                          | Artículo del catálogo con SKU, categoría, proveedor y atributos dinámicos |
| Stock                             | Cantidad disponible de un producto en un almacén/lote                     |
| Lote                              | Agrupación de stock con fecha de vencimiento                              |
| Almacén (Warehouse)               | Ubicación física de stock con estado operativo                            |
| Movimiento de inventario          | Entrada, salida, transferencia o ajuste de stock                          |
| Venta (Sale)                      | Transacción de venta con items y totales                                  |
| Compra (Purchase)                 | Compra registrada con detalle                                             |
| Orden de cliente (ClientOrder)    | Pedido de un cliente (estado de flujo)                                    |
| Orden a proveedor (ProviderOrder) | Orden de compra a un proveedor                                            |
| Cliente                           | Entidad comercial (comprador)                                             |
| Proveedor                         | Entidad comercial (vendedor)                                              |
| Empleado                          | Persona de la empresa (RRHH)                                              |
| Asistencia                        | Registro de horas trabajadas                                              |
| Nómina (Payroll)                  | Pago a empleado con montos encriptados                                    |
| Vacación                          | Solicitud con estados PENDING/APPROVED/REJECTED                           |
| Permiso laboral (Leave)           | Licencia, enfermedad, maternidad, asuntos personales                      |
| Evaluación de desempeño           | Evaluación periódica de un empleado                                       |
| Gasto (Expense)                   | Gasto empresarial categorizado                                            |
| Nota (Note)                       | Nota Kanban con columnas, hashtags, menciones, favoritos                  |
| Evento                            | Evento con tipo y fecha, con asistentes                                   |
| Noticia (News)                    | Comunicación con ciclo ACTIVE→PENDING→CLOSED                              |
| Permiso (RBAC)                    | Código de autorización (ej. `canViewUser`)                                |
| Rol                               | C01/C02/C03 (admin/user/manager)                                          |

Glosarios por módulo (más detallados) en `docs/modules/<modulo>.md`.

---

## 4. Mapa de módulos

26 módulos documentados en `docs/modules/INDEX.md` (SDD arc42/C4/IEEE 1016 por módulo). En código: **22 módulos backend** (`apps/server/src/modules/`) y **25 frontend** (`apps/client/src/modules/`); la unión da los 26 (`home` y `settingsProductCategories` son solo cliente, `security` solo backend, y **`clientOrder`/`providerOrder` existen solo en frontend — sin backend**). Convención transversal: `routes → controller → service → dao`, Prisma ORM, auth `verifyToken` + `checkRoleAuthOrPermisssion`, paginación `getSafePagination`, validación Joi (server) + Zod (client), estado Redux Toolkit + RTK Query, fechas `date-fns` (solo cliente), i18n `react-i18next`.

### 4.1 Módulos por dominio

| Dominio                 | Módulos                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| Dashboard & Layout      | Home                                                                        |
| Core System             | Auth, Permission (leave), Users, Settings, Settings Product Categories      |
| Inventory & Products    | Products, Stock, Inventory Movement                                         |
| Sales & Purchases       | Sales, Client Orders, Providers, Provider Orders, Purchase, Clients         |
| Warehouse & Employees   | Warehouse, Employees, Attendance, Payroll, Vacation, Performance Evaluation |
| Security                | Security (CSP report)                                                       |
| Content & Communication | Events, Notes, News                                                         |
| Finance                 | Expenses                                                                    |

### 4.2 Bugs conocidos (8 HIGH) — estado verificado 2026-11-23

`docs/modules/INDEX.md` sigue listando los 8 como HIGH. Verificación contra el código: **3 resueltos, 5 abiertos**.

| Módulo                | Bug                                                                                                                                                                                                    | Severidad | Estado                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Events                | `updateEventById` no actualiza FK `type`: el service saca `type` del payload y lo pasa en `foreignKeys`, pero el dao solo reconecta si `data.type !== undefined` (siempre ausente en la actualización) | HIGH      | **Abierto** (fix incompleto; `events/dao.ts` vs `events/service.ts`)                                                                         |
| Notes                 | `updateNoteById` llamada recursiva para `hasMentions: true`                                                                                                                                            | HIGH      | Resuelto (hoy llama a `notesDao.updateNoteById`, no a sí mismo)                                                                              |
| PerformanceEvaluation | URL mismatch client (`/performance-evaluation`) vs server (`/performance-evaluations`) → 404                                                                                                           | HIGH      | Resuelto (server monta `/performance-evaluation` en `routes/v1/index.ts`; solo el JSDoc/Swagger aún dice en plural)                          |
| Expenses              | Category enum spaces vs underscores (`BANK FEES` vs `BANK_FEES`)                                                                                                                                       | HIGH      | **Abierto** (el select del cliente aún usa `'BANK FEES'`/`'PROFESSIONAL SERVICES'`; schema y `expenseCategoryEnumValues` usan guiones bajos) |
| Vacation              | `createdBy`/`updatedBy` nunca seteados                                                                                                                                                                 | HIGH      | **Abierto** (el controller no inyecta `req.userId` y el cliente no envía `createdBy`)                                                        |
| Payroll               | `ILIKE` en columnas Int (month, year)                                                                                                                                                                  | HIGH      | Resuelto (comparación por igualdad en `payroll/dao.ts`, con comentario)                                                                      |
| ProviderOrder         | Rutas backend no montadas en `v1/index.ts`                                                                                                                                                             | HIGH      | **Abierto y agravado**: no existe módulo server en absoluto; el cliente llama `/api/v1/providerOrder` → 404                                  |
| ClientOrder           | `routes.js` vacío                                                                                                                                                                                      | HIGH      | **Abierto y agravado**: no existe módulo server en absoluto; el cliente llama `/api/v1/clientOrder` → 404                                    |

---

## 5. Arquitectura de alto nivel

### 5.1 Estructura del monorepo

```
project-one/
├── apps/
│   ├── client/       # React 18 + Vite 6 + Tailwind 3.4 + shadcn/ui
│   ├── server/       # Express 4 + Prisma 5 + PostgreSQL 16/17 (100% TypeScript)
│   └── e2e/          # Playwright
├── docs/             # Documentación (modules/, security/, etc.)
├── openspec/         # OpenSpec SDD (specs/, changes/)
├── scripts/          # Automatización de seguridad
├── .github/workflows # CI/CD (18 workflows: ci, security, release, deploy, preview, scheduled-*, nightly-*)
└── .agents/ / .opencode/  # Orquestación de agentes IA
```

### 5.2 Backend (Express)

- **Capas:** `routes → controller → service → dao` (HOF error handling).
- **ORM:** Prisma ORM 5 + `$queryRaw` (attendance, clients, employees, expenses, payroll, performanceEvaluation, permission, products, providers, stock, users, vacation — hoy 12 módulos, no 5; `warehouse` ya no lo usa).
- **Auth:** `verifyToken` (JWT) global + `checkRoleAuthOrPermisssion` por endpoint.
- **Validación:** Joi (server).
- **User ID:** `req.userId` inyectado por middleware.
- **Paginación:** `getSafePagination({page, limit})`.
- **Fechas:** `Date` nativo de JS (el backend no depende de `date-fns`; esa librería es solo del cliente).
- **Logging:** Winston estructurado.
- **Errores:** `handleCatchErrorAsync` / `globalResponse`.

### 5.3 Frontend (React)

- **State:** Redux Toolkit + RTK Query + Redux Persist.
- **Forms:** React Hook Form + Zod.
- **i18n:** i18next + react-i18next (EN/ES).
- **UI:** shadcn/ui + Tailwind 3.4.
- **Stories:** Storybook.

### 5.4 API

- Base: `/api/v1/`.
- Respuesta estándar: éxito `{ success: true, statusCode, data, message? }`; error `{ success: false, statusCode, code, message, details? (solo dev) }`.
- Documentación: Swagger/OpenAPI en `/api/v1/docs`.

### 5.5 Principios de diseño

- Monorepo con tooling compartido y CI/CD unificado.
- Backend en capas (Controller → Service → DAO).
- Versionado de API (`/api/v1/`).
- Workflow determinista: OpenSpec SDD con orquestación multi-agente.

---

## 6. Tech stack y versiones

| Capa     | Tecnología                                                                                       | Propósito                              |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Frontend | React 18, Vite 6, Tailwind 3.4 (instalado 3.4.19), shadcn/ui                                     | UI, bundler, componentes               |
| State    | Redux Toolkit, RTK Query, Redux Persist                                                          | Estado global, caché API, persistencia |
| Forms    | React Hook Form + Zod                                                                            | Validación de formularios              |
| i18n     | i18next + react-i18next                                                                          | Internacionalización (EN/ES)           |
| Backend  | Express 4, Node.js (`engines` ≥22.11 en root/server, ≥20 en client; badge README 18.x — ver §12) | API REST                               |
| Database | PostgreSQL 16 (CI/tests/preview en 16-alpine; docker-compose de desarrollo usa 17), Prisma ORM 5 | Persistencia                           |
| Auth     | JWT, bcrypt, AES-GCM (field-level)                                                               | Autenticación, hashing, cifrado        |
| API Docs | Swagger/OpenAPI + JSDoc                                                                          | Documentación de API                   |
| Testing  | Vitest, Testing Library, Playwright, MSW                                                         | Unit, integración, E2E                 |
| Security | Semgrep, Trivy, Gitleaks, Helmet                                                                 | SAST, scan de dependencias, secretos   |

**Inconsistencias conocidas (README vs código):** Node 18.x (badge y tabla) vs `engines` ≥22.11 en root/server y ≥20 en client; "RBAC + ABAC" vs `grep ABAC src` = 0 (RBAC puro); "Tailwind 4" vs 3.4.19 instalado. Ver `docs/product/analisis-producto-terminado-erp.md` §3.5.

---

## 7. Modelo de datos (resumen)

Fuente de verdad: `apps/server/prisma/schema.prisma` (43 modelos). No existe un ERD consolidado; los ERD por módulo están en `docs/modules/<modulo>.md`.

### 7.1 Modelos principales (43)

Users & Auth: `users`, `roles`, `permissions`, `userPermits`, `userStatus`, `refreshToken`.
Notes: `notes`, `mentions`, `hashtags`, `note_hashtags`, `user_notes_favorites`, `noteColumns`.
News: `news`, `newsStatus`.
Events: `events`, `attendees`, `registration_log`, `eventTypes`.
Products & Stock: `products`, `productCategories`, `productProviders`, `productStatus`, `productAttributes`, `warehouse`, `stock`, `inventoryMovement`.
Sales & Purchases: `purchase`, `purchaseDetail`, `sale`, `saleDetail`, `clients`, `clientOrder`, `clientOrderDetail`, `providerOrder`, `providerOrderDetail` (el catálogo de proveedores usa `productProviders`; **no existe modelo `providers`** — 43 modelos en total).
HR: `employees`, `attendance`, `payroll`, `performanceEvaluation`, `vacation`, `permission`.
Finance: `expenses`.
Settings: `settings`.

### 7.2 Convenciones de datos

- **Soft delete:** comportamiento de borrado lógico en varios módulos (ver docs de módulo).
- **Campos de auditoría:** `createdBy` / `updatedBy` (en algunos módulos no se setean — bug conocido en Vacation).
- **Datos sensibles encriptados:** empleados (datos personales) y nómina (montos) con AES-GCM a nivel de campo.
- **IDs:** enteros autoincrementales en la mayoría; UUIDs en algunos (refreshToken).
- **Enums:** Prisma native enums (expenses category) — cuidado con espacios vs underscores (bug conocido).

### 7.3 Modelo de autorización (RBAC)

- 3 roles: ADMIN (C01), USER (C02), MANAGER (C03).
- 82 códigos de permiso activos en `PERMISSIONCODES` (`apps/server/src/utils/constants/enums.ts`), 90 sembrados en BD (los de órdenes/dashboard/reportes están comentados en el enum). CRUD por módulo (view/create/edit/delete).
- Permisos asignados por usuario (`userPermits`), no por rol (no hay herencia).
- ADMIN hace bypass completo.
- `rolePermits` está comentado (sin herencia rol→permiso).
- Control 100% server-side; frontend solo sabe si está autenticado (`isAuth`), no qué puede hacer (falta `usePermission`, `PermissionGate`, `RoleGuard` — ver `docs/architecture/rbac-system.md` §7.2).

---

## 8. Reglas de negocio e invariantes (resumen)

Reglas extraídas de los módulos y del RBAC. La lista completa está en cada `docs/modules/<modulo>.md`.

- **Stock:** alertas de stock bajo y vencido; auto-actualización en ventas/compras. Valoración FIFO/LIFO/promedio ponderado: **claim README sin evidencia** (verificado 2026-11-23: el stock solo calcula `quantity × price`; ver §12).
- **Vacaciones:** estados PENDING/APPROVED/REJECTED; flujo de aprobación.
- **Permisos laborales:** licencias, enfermedad, maternidad, asuntos personales (dominio independiente del RBAC).
- **Noticias:** ciclo de vida ACTIVE→PENDING→CLOSED.
- **Notas:** Kanban con columnas, hashtags, menciones, favoritos.
- **Eventos:** con tipos y fechas, asistentes y registro.
- **Gastos:** categorizados con enum nativo de Prisma.
- **Auth:** password strength, JWT + refresh token rotation, detección de reuso de refresh token, CSRF.
- **RBAC:** ADMIN bypass; permisos por usuario; fail-closed (sin permiso → 403).
- **Soft delete:** comportamiento de borrado lógico en varios módulos.
- **Auditoría:** audit logging para operaciones sensibles (claim README).

---

## 9. Convenciones de API

- Base: `/api/v1/`.
- Respuesta estándar: éxito `{ success: true, statusCode, data, message? }`; error `{ success: false, statusCode, code, message, details? }`.
- Validación: Joi (server) + Zod (client).
- Auth: Bearer JWT; refresh token rotation.
- Rate limiting en endpoints críticos.
- Documentación: Swagger/OpenAPI en `/api/v1/docs`.
- Seguridad: Helmet, CORS, rate limiting, input validation.

---

## 10. Cross-cutting concerns

- **i18n:** inglés y español (`react-i18next`, `locale/en.json` + `locale/es.json`), formatos locale de fecha/número (`date-fns`, solo cliente).
- **Paginación:** `getSafePagination({page, limit})`.
- **Logging:** Winston estructurado (server).
- **Manejo de errores:** `handleCatchErrorAsync` + respuesta global.
- **Seguridad HTTP:** Helmet, CORS, rate limiting.
- **Cifrado:** AES-GCM a nivel de campo (datos sensibles de empleados y nómina).
- **Hashing:** bcrypt (passwords).

---

## 11. Limitaciones conocidas y gaps (honestidad de producto)

De `docs/product/analisis-producto-terminado-erp.md` (madurez ~3.4/5, etapa MVP robusto/beta técnica):

- **Sin finanzas/contabilidad, facturación/impuestos, producción, POS, reporting avanzado, multi-tenant, multi-moneda, integraciones externas.**
- **Bugs HIGH:** los 8 de `docs/modules/INDEX.md`; hoy **3 resueltos** (Notes, PerformanceEvaluation, Payroll) y **5 abiertos** (Events, Expenses, Vacation, ProviderOrder, ClientOrder) — ver §4.2.
- **Client-side permission gating no implementado** (sin `usePermission`, `PermissionGate`, `RoleGuard`).
- **`rolePermits` comentado** (sin herencia rol→permiso).
- **`users.isAdmin` legacy** sin uso.
- **Códigos de permiso sin usar** (Settings, Dashboard, Orders, Reports).
- **README desalineado** con el código (ABAC inexistente, FIFO/LIFO no evidenciado, badge Node 18 vs engines ≥22.11, Tailwind 4 vs 3.4.19).
- **Sin DAST, sin APM (Sentry 0/26), sin despliegue a producción, sin DR probado.**
- **Testing:** ~500-600 casos (352 server + 242 client), cobertura ~60-64%, E2E solo 5 specs, regression vacío.
- **Server 100% TypeScript desde 2026-11-13** (0 `.js` en `apps/server/src`; ya no aplica el viejo claim "server 100% JS"). Quedan ~180 `console.log` en fuente (fuera de tests) sin migrar a Winston.

---

## 12. Inconsistencias README vs código (a tener en cuenta)

| Claim en README                                                   | Realidad en código                                                         | Fuente                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| "RBAC + ABAC hybrid"                                              | Solo RBAC por permisos por usuario; ABAC no implementado                   | `docs/architecture/rbac-system.md`, `docs/product/analisis-producto-terminado-erp.md` |
| "Stock valuation (FIFO, LIFO, Weighted Average)"                  | No evidenciado; el stock calcula `quantity × price` (`stock/dao.ts`)       | `docs/product/analisis-producto-terminado-erp.md` §3.5                                |
| "Node 18.x" badge y "Node.js ≥ 18.x"                              | `engines` ≥22.11 (root/server), ≥20 (client)                               | `package.json` (raíz, server, client)                                                 |
| "20+ modules" / "45+ permissions" / "24 feature modules" (server) | 26 documentados (22 backend + 25 frontend), 82 permisos activos (90 en BD) | `docs/modules/INDEX.md`, `apps/server/src/utils/constants/enums.ts`, `prisma/seed.ts` |
| "Tailwind 4" (README y doc previo)                                | Tailwind 3.4.19 instalado                                                  | `package-lock.json`, `apps/client/package.json`                                       |
| "Invoice and expense tracking" (README)                           | No hay módulo de facturación (invoice)                                     | `docs/product/analisis-producto-terminado-erp.md` §1                                  |

---

## 13. Índice de documentos relacionados

| Documento                                                         | Propósito                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `README.md`                                                       | Overview, quick start, estructura, features               |
| `AGENTS.md` (root)                                                | Normas del monorepo, convenciones, skills                 |
| `CONTEXT.md`                                                      | Glosario de agentes/tooling (no de la app)                |
| `apps/server/AGENTS.md`, `apps/client/AGENTS.md`, `e2e/AGENTS.md` | Convenciones por componente                               |
| `docs/modules/INDEX.md` + `docs/modules/*.md`                     | SDD por módulo (fuente de detalle)                        |
| `docs/architecture/rbac-system.md`                                | Sistema de roles y permisos                               |
| `docs/architecture/architectural-approach.md`                     | Arquitectura frontend                                     |
| `docs/architecture/workspaces.md`                                 | Monorepo/npm workspaces                                   |
| `docs/quality/testing-architecture.md`                            | Estrategia de testing                                     |
| `docs/quality/code-style.md`                                      | Estilo de código                                          |
| `docs/CONTEXT-CICD.md`                                            | CI/CD y gobernanza                                        |
| `docs/product/analisis-producto-terminado-erp.md`                 | Auditoría de madurez del producto                         |
| `docs/security/SECURITY.md`                                       | Seguridad                                                 |
| `docs/De-stakeholder-a-producción-...md`                          | Flujo de ingeniería de requisitos (7 etapas)              |
| `openspec/config.yaml`                                            | Config de OpenSpec (contexto vacío → poblar con este doc) |
| `apps/server/prisma/schema.prisma`                                | Modelo de datos canónico (43 modelos)                     |

---

## 14. Checklist de onboarding (contexto de la aplicación)

- [ ] Leer este documento (`docs/application-context.md`) completo.
- [ ] Leer `README.md` (quick start) y levantar el entorno (Node, PostgreSQL, `npm install`, migrate, seed, `npm run dev`).
- [ ] Revisar `docs/modules/INDEX.md` y abrir los módulos del área en la que trabajarás.
- [ ] Leer `docs/architecture/rbac-system.md` si tocas auth/permisos.
- [ ] Revisar `docs/product/analisis-producto-terminado-erp.md` §1 para entender los gaps del producto (no prometer lo que no existe).
- [ ] Revisar `AGENTS.md` para convenciones (commits firmados, TDD, OpenSpec).
- [ ] Consultar `apps/server/prisma/schema.prisma` para el modelo de datos.
- [ ] Verificar inconsistencias conocidas (§11-12) antes de asumir que una feature "ya existe".

---

## 15. Revisión y ajustes (2026-11-23)

Revisión del documento contra el código y la documentación existente. Correcciones aplicadas:

1. **Bugs HIGH re-verificados uno a uno (§4.2):** de los 8 de `docs/modules/INDEX.md`, **3 resueltos** — Notes (la llamada recursiva hoy va a `notesDao.updateNoteById`), PerformanceEvaluation (server monta `/performance-evaluation` en `routes/v1/index.ts:47`, igual que el cliente) y Payroll (`ILIKE` → igualdad en `payroll/dao.ts`) — y **5 abiertos**: Events (el dao reconecta el tipo solo si `data.type !== undefined`, pero el service lo elimina del payload: fix incompleto), Expenses (el select del cliente usa `'BANK FEES'`/`'PROFESSIONAL SERVICES'` con espacios vs enum del schema con guiones bajos), Vacation (controller sin `req.userId`, cliente sin `createdBy`), y ProviderOrder/ClientOrder (hoy **no hay módulo backend en absoluto**, no solo rutas sin montar: el cliente llama `/api/v1/providerOrder` y `/api/v1/clientOrder` → 404). _Fuentes: `apps/server/src/modules/{events,notes,payroll,vacation}/`, `apps/server/src/routes/v1/index.ts`, `apps/client/src/modules/expenses/utils/enums.js`._ `docs/modules/INDEX.md` conserva la tabla vieja (8/8 HIGH) — candidato a sincronizar.
2. **Recuento de permisos:** "~65" → **82 activos** en `PERMISSIONCODES` (`apps/server/src/utils/constants/enums.ts`, 10 comentados) y **90 sembrados** (`prisma/seed.ts`, incluye orders/dashboard/reports comentados en el enum). _Coincide con `docs/product/analisis-producto-terminado-erp.md` §3.5 ("seed hasta 82")._
3. **Modelo de datos (§7.1):** eliminado el modelo `providers` — **no existe** en `schema.prisma` (43 modelos verificados con `grep "^model "`); el catálogo de proveedores vive en `productProviders`.
4. **Recuento de módulos (§4):** 26 documentados ✓, pero en código son **22 backend + 25 frontend**; `clientOrder`/`providerOrder` solo frontend. _Fuente: `ls apps/server|client/src/modules`._
5. **Server ya no es JavaScript (§11):** migración TS completada 2026-11-13 (0 `.js` en `apps/server/src`, `apps/server/AGENTS.md`); `console.log` ~180 (no 208).
6. **Tailwind es 3.4, no 4 (§5.1/§5.3/§6):** instalado 3.4.19 en `package-lock.json`. Corregido aquí; el README también dice "Tailwind 4" (añadido a §12).
7. **Node/engines (§6/§12):** ≥22.11 en root y server, **≥20 en client**, badge README 18.x — detallado.
8. **PostgreSQL (§6):** CI/tests/preview usan `postgres:16-alpine`; `docker-compose.yml` de desarrollo usa `postgres:17` (README dice "≥16").
9. **`date-fns` es solo cliente (§5.2/§10):** 0 usos y 0 dependencia en server (51 archivos en client); el backend usa `Date` nativo.
10. **Forma de respuesta y Swagger (§5.4/§9):** no es `{ error, statusCode, message, data }` sino éxito `{ success: true, statusCode, data, message? }` / error `{ success: false, statusCode, code, message, details? }` (`globalResponse.ts`, `errorHandler.ts`); Swagger en **`/api/v1/docs`** (`docs/swagger.ts`), no `/api-docs`.
11. **`$queryRaw` (§5.2):** hoy en 12 módulos (attendance, clients, employees, expenses, payroll, performanceEvaluation, permission, products, providers, stock, users, vacation); `warehouse` ya no lo usa (la lista "Warehouse, Employees, Attendance, Vacation, Expenses" estaba desactualizada; `docs/modules/INDEX.md` la repite).
12. **Workflow CI/CD (§5.1):** inventario real = 18 workflows (`ci.yml`, `security.yml`, `release.yml`, `deploy.yml`, `preview.yml`, `scheduled-*`, `nightly-*`…). **No existen `quality.yml`** (migrado a jobs inline en `ci.yml`) **ni `ci-enterprise.yml`** (retirado) — ver `docs/CONTEXT-CICD.md`.
13. **Verificado sin cambios (confirmado correcto):** 43 modelos Prisma; roles C01/C02/C03; `userPermits` sin herencia (`rolePermits` comentado); sin `usePermission`/`PermissionGate`/`RoleGuard` en frontend; gaps de producto (sin finanzas, facturación, producción, multi-tenant, multi-moneda, integraciones — `grep` de `tenant|currency|invoice|BOM|webhook` = 0); ~500-600 casos de test (352 server + 242 client por `it(`/`test(`), cobertura ~60-64% (umbrales server 60.8/64.48, client 64.44/42.11), 5 specs E2E, `tests/regression/` vacío; i18n EN/ES, Winston, `handleCatchErrorAsync`/`globalResponse`, AES-256-GCM (`.env.example`), bcrypt, Helmet/CORS/rate limiting, Joi (server) + Zod (client), Redux Toolkit + RTK Query + Redux Persist, capas `routes → controller → service → dao`, `checkRoleAuthOrPermisssion` (el typo es real, está en el código), 126 handlers bajo `/api/v1`.

_Documento creado: 2026-11-23. Mantener vivo: actualizar cuando cambie el alcance, se añadan módulos o se resuelvan gaps._
