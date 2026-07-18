# Módulo: Security (Server only)

> Documentación técnica del módulo **Security**. arc42 / C4 / IEEE 1016.
> Backend: `apps/server/src/modules/security/`. No tiene cliente.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `security` |
| **Estado** | Released |
| **Path Server** | `apps/server/src/modules/security/` |
| **Path Client** | N/A (server-only) |
| **Base URL API** | `/api/v1/security` |

---

## 2. Introducción y Objetivos

Endpoint único de reporte CSP (Content Security Policy). Recibe violaciones de seguridad del navegador y las registra. Sin almacenamiento persistente — solo logging.

---

## 3. Contexto y Alcance

```
[Navegador] --violation report--> POST /api/v1/security/csp-report --> [console.log]
```

**In-Scope**: Recepción de reportes CSP, logging.

**Out-of-Scope**: Almacenamiento en DB, análisis de patrones, alertas.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | Express.js + Prisma ORM |
| C-02 | Sin autenticación (no verifyToken) |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, Morgan (logging).

---

## 6. Arquitectura del Módulo

```
routes.js → controller.js
```

Sin service, sin DAO, sin schemas. El controller recibe el body crudo del reporte CSP y lo loguea.

```
apps/server/src/modules/security/
├── routes.js                   # 1 ruta
├── controller.js               # 1 handler
└── schemas/                    # (vacio)
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Middleware | Handler |
| ------ | ----------------------------- | ---------- | ---------------- |
| POST | `/csp-report` | Ninguno | `cspReport` |

Sin `verifyToken` — endpoint público para recibir reports del navegador.

### Controller

```js
cspReport(req, res):
  console.log(req.body)  // log CSP violation
  res.status(204).send() // No Content
```

Sin service, sin DAO.

---

## 8. (Sin Cliente)

Módulo server-only. No tiene componentes cliente, API hooks, páginas ni utilidades.

---

## 9. Modelo de Datos

N/A. Sin modelo Prisma. No persiste datos.

---

## 10. Contratos de API

### POST /api/v1/security/csp-report

Body: Objeto CSP Report (formato CSP Level 2/3).

Response: `204 No Content`.

---

## 11. Validación

N/A. Body se loguea sin validación ni transformación.

---

## 12. Seguridad

- **Sin autenticación** — endpoint público (requerido para que navegadores envíen reports CSP).
- **Sin rate limiting explícito** (aplica el global de Express si existe).

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **Solo logging**: Reports no se persisten ni agregan. Sin dashboard ni análisis. | MEDIUM |
| R-02 | **Sin validación**: Body no validado — podría recibir payloads malformados. | LOW |
| R-03 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **CSP** | Content Security Policy — estándar W3C para prevenir XSS. |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (20), controller.js (11)
```

### Middleware Stack

Sin middleware.
