---
# Análisis de Diseño de API REST — Project One

## 1. Resumen Ejecutivo

Se realizó un análisis exhaustivo del diseño de la API REST del proyecto "Project One", un monorepo con backend Express + Prisma + PostgreSQL y frontend React con RTK Query. Se evaluaron 22 módulos funcionales (`products`, `clients`, `users`, `settings`, `warehouse`, `notes`, `auth`, `sales`, `purchase`, `providers`, `stock`, `events`, `news`, `employees`, `expenses`, `attendance`, `payroll`, `performanceEvaluation`, `inventoryMovement`, `security`, `providerOrder`, `clientOrder`, `vacation`, `permission`).

**Hallazgo principal**: La API se encuentra en un **Nivel 2 del Modelo de Madurez Richardson** (uso de recursos y verbos HTTP), pero con inconsistencias críticas en formato de respuesta para mutaciones, ausencia total del verbo `PATCH`, documentación OpenAPI incompleta, y código duplicado en schemas Joi para creación vs. actualización. No hay protección contra *lost updates* (sin ETags ni versionado). Se recomienda una estandarización urgente del formato de respuesta y la migración a esquemas Joi diferenciales para `PUT`/`PATCH`.

---

## 2. Modelo de Madurez Richardson

### Nivel actual: **Nivel 2 — Recursos y Verbos HTTP**

**Justificación:**

| Nivel | Característica | Estado |
|-------|---------------|--------|
| **0** | El Swamp of POX (un solo endpoint, un solo verbo) | ❌ Superado |
| **1** | Recursos individuales (URIs con `/products/{id}`) | ✅ 100% módulos usan URIs con recursos |
| **2** | Verbos HTTP (GET, POST, PUT, DELETE) | ✅ Parcial — falta `PATCH` |
| **3** | HATEOAS (enlaces de navegación en respuestas) | ❌ Ausente |

**Problemas que impiden Nivel 3:**
- No hay enlaces HATEOAS en ninguna respuesta
- No hay representaciones de recursos vinculadas (self, related, collection)
- No hay Content-Type negotiation avanzada

---

## 3. Evaluación por Criterio

### 3.1 Naming de Recursos
**Estado: ⚠️ Parcialmente consistente**

**Lo que funciona:**
- Nombres en plural: `/products`, `/clients`, `/users`, `/settings`
- Nombres en inglés consistente
- Anidamiento lógico: `/products/attributes/{id}`, `/settings/product/categories/{id}`

**Problemas:**

1. **Endpoint que rompe convención REST**: `/products/productsFilters` usa un verbo de acción en lugar de un filtro query. Debería ser `GET /products?filters=all` o `GET /products/filters`.

2. **Dos rutas GET /** compitiendo (products): la ruta `GET /` para `getAllProductsFilters` (línea 32) nunca se ejecuta porque `GET /` para `getAllProducts` (línea 22) se registra primero. Express usa la primera coincidencia.

3. **Sub-recursos inconsistentes**: Algunos módulos usan sub-recursos (`/products/attributes`), otros no. No hay un estándar claro.

4. **Auth inconsistente**: `POST /auth/signin` usa `signin` (mezcla inglés/español). Debería ser `login` para consistencia.

### 3.2 Verbos HTTP
**Estado: ⚠️ Parcial**

| Verbo | Presente | Uso correcto |
|-------|----------|--------------|
| `GET` | ✅ | Lectura de colecciones y elementos individuales. Correcto y consistente. |
| `POST` | ✅ | Creación de recursos (201) y acciones RPC como `/auth/signin`. Correcto. |
| `PUT` | ⚠️ | Presente pero con ambigüedad semántica (ver caso crítico abajo). |
| `DELETE` | ✅ | Eliminación de recursos. Correcto. |
| `PATCH` | ❌ **AUSENTE** | No existe en ningún módulo. |

#### Caso crítico: PUT se comporta como PATCH internamente

En settings, el schema `SettingsProductCategoryUpdate` permite campos vacíos (`.allow('')`), lo que semánticamente es una operación `PATCH` pero se expone como `PUT`. En contraste, `ProductsUpdate` requiere **todos** los campos (`.required()`), que es semánticamente correcto para `PUT` pero obliga al cliente a enviar el recurso completo incluso para cambios mínimos.

**Conclusión**: No hay una decisión arquitectónica clara entre `PUT` y `PATCH`. Los módulos implementan cada uno una interpretación distinta.

### 3.3 Códigos de Estado HTTP
**Estado: ⚠️ Parcialmente correcto**

| Código | Uso | Evaluación |
|--------|-----|-----------|
| `200` | GET, PUT, DELETE | ✅ Correcto |
| `201` | POST (crear) | ✅ Correcto |
| `400` | Validación Joi fallida | ✅ Correcto |
| `401` | Token inválido/ausente | ✅ Correcto |
| `403` | Rol/permiso insuficiente | ✅ Correcto |
| `404` | ❌ **Ausente** — no se usa en ningún controlador | ❌ Crítico |
| `429` | Rate limiting | ✅ Correcto |
| `500` | Error interno | ✅ Correcto |

**Problemas:**
- **No hay 404**: Cuando un recurso no existe, Prisma lanza `P2025` (RecordNotFound) que cae como 500, no como 404.
- El error handler global solo maneja `P2002` (unique constraint); el resto de errores Prisma se devuelven como 500.

### 3.4 Formato de Respuesta
**Estado: ❌ Inconsistente entre módulos**

**Problemas críticos:**

1. **UPDATE no devuelve el recurso**: Products devuelve `{ message: 'Items updated successfully' }` en lugar del recurso actualizado. Clients SÍ devuelve el recurso. Esto es inconsistente.

2. **Error en tres formatos distintos**:
   - Validación Joi: `{ error: ["msg1", "msg2"] }`
   - Autorización: `{ error: "texto" }`
   - Autenticación: `{ message: "Unauthorized" }`
   - Error global: `{ error: true, message, code }`

   El frontend no puede parsear errores de forma unificada.

### 3.5 Validación de Datos
**Estado: ✅ Bueno, con oportunidades de mejora**

**Aciertos:**
- `allowUnknown: false` (whitelisting estricto)
- `abortEarly: false` (todos los errores)
- `validatePathParam` con regex `^[0-9]+$` + `Number.isSafeInteger`

**Problemas:**
- Products y ProductsUpdate son **idénticos** — código duplicado, riesgo de divergencia
- Settings usa `.allow('')` en vez de `.optional()` — semántica distinta
- Arrays sin `.items()` in users.joi.js — permiten datos inválidos

### 3.6 Manejo de Errores
**Estado: ⚠️ Funcional pero con problemas**

- `handleCatchErrorAsync` wrapper — patrón correcto
- Cada middleware tiene su propio formato de error (3 formatos distintos)
- `console.log` en vez de logger estructurado
- No hay diferenciación dev/prod

### 3.7 Autenticación y Autorización
**Estado: ✅ Bien diseñado**

- JWT HS256 con issuer/audience — correcto
- Refresh token en cookie HttpOnly — correcto
- Roles + permisos granulares — bien diseñado
- Admin bypass automático — correcto

**Problemas:**
- Consulta a DB `getUserRoleByUserId` en cada request — sin caché, N+1
- `console.log('auth', authHeader)` expone token en consola
- Typo: `checkRoleAuthOrPermisssion` (3 s)

### 3.8 Documentación OpenAPI
**Estado: ❌ Inconsistente**

- **15 módulos con OpenAPI**: clients, settings, warehouse, stock, purchase, providers, etc.
- **7 módulos SIN OpenAPI**: products (el más complejo), auth (punto de entrada), notes, payroll, vacation, permission, providerOrder, clientOrder
- No hay archivo central `openapi.json`/`openapi.yaml`
- No hay Swagger UI expuesta

### 3.9 Idempotencia y Concurrencia
**Estado: ❌ Sin protección**

- No hay ETags ni If-Match
- No hay optimistic locking
- No hay conditional requests (If-Unmodified-Since)
- Lost updates: el último PUT gana, sobrescribe cambios del primero

### 3.10 Seguridad
**Estado: ✅ Buenas prácticas implementadas**

**Aciertos:**
- Rate limiting por capas (general, login, refresh, password)
- CSRF con `crypto.timingSafeEqual`
- CORS con orígenes explícitos, credentials: true
- Prisma ORM previene SQL injection
- Joi whitelist (`allowUnknown: false`)
- Path param validation estricta

**Problemas:**
- `console.log('auth', authHeader)` expone token
- No hay Helmet (X-Frame-Options, X-XSS-Protection, etc.)
- No hay input normalization (trimming)

---

## 4. Tabla Resumen de Hallazgos

| Criterio | Estado | Prioridad | Impacto |
|----------|--------|-----------|---------|
| **3.4 Formato de respuesta UPDATE** | ❌ Inconsistente | **Alta** | Clientes reciben datos distintos según módulo |
| **3.3 Códigos de estado** | ⚠️ Sin 404 | **Alta** | Errores 500 cuando deberían ser 404 |
| **3.2 Verbo PATCH ausente** | ❌ No implementado | **Alta** | Clientes forzados a PUT con datos completos |
| **3.8 OpenAPI en products** | ❌ Ausente | **Alta** | Módulo más complejo sin documentación |
| **3.4 Error format inconsistente** | ❌ 3 formatos | **Alta** | Frontend no puede parsear unificadamente |
| **3.1 Dos rutas GET /** | ❌ Bug funcional | **Alta** | Filtros de productos no funcionan |
| **3.9 Idempotencia** | ❌ Sin protección | **Media** | Lost updates en operaciones concurrentes |
| **3.5 Duplicación schemas** | ⚠️ Products = ProductsUpdate | **Media** | Código duplicado, riesgo de divergencia |
| **3.7 Auth query por request** | ⚠️ Sin caché | **Media** | N+1 queries de roles |
| **3.10 Helmet ausente** | ⚠️ No implementado | **Baja** | Headers de seguridad faltantes |

---

## 5. Recomendaciones Priorizadas

### Prioridad Alta (Semana 1-2)

1. **Unificar formato de respuesta para mutaciones**
   - POST → 201 + recurso creado (no mensaje)
   - PUT → 200 + recurso actualizado (no mensaje)
   - DELETE → 200 + mensaje (o 204 sin body)

2. **Implementar PATCH y corregir PUT**
   - Crear schemas Joi con campos opcionales para PATCH
   - Mantener schemas required para PUT
   - PUT = reemplazo total, PATCH = actualización parcial

3. **Añadir manejo de 404**
   - Capturar Prisma P2025 y responder 404
   - Revisar controladores que buscan por ID

4. **Corregir bug rutas duplicadas en products**
   - Renombrar a `GET /products/filters` o usar query param

5. **Unificar formato de error**
   - Estándar: `{ error: true, statusCode, message, details?: [] }`

### Prioridad Media (Semana 3-4)

6. **OpenAPI para todos los módulos** — priorizar products y auth
7. **ETags para concurrencia** — If-Match, 412 Precondition Failed
8. **Cache de roles** — en memoria o incluir rol en JWT
9. **Migrar schemas duplicados** — usar `Joi.object().fork()` para derivar

### Prioridad Baja (Semana 5+)

10. **Helmet** para headers de seguridad
11. **HATEOAS básico** — enlaces self, collection
12. **Normalizar nombres** — fix typo en `checkRoleAuthOrPermisssion`

---

## 6. Conclusión

La API de Project One tiene una base sólida: uso correcto de recursos REST, autenticación JWT robusta, autorización granular por rol+permiso, rate limiting y CSRF bien implementados, y validación estricta con Joi. La arquitectura de capas (Route → Controller → Service → DAO → Prisma) es limpia y mantenible.

Sin embargo, adolece de inconsistencias críticas que afectan directamente al frontend:

1. **Formato de respuesta impredecible**: el frontend debe manejar tanto `{ message }` como el recurso completo según el módulo
2. **No hay PATCH**: clientes forzados a PUT con datos completos
3. **No hay 404**: errores de recurso no encontrado aparecen como 500
4. **Bug funcional** (ruta duplicada) en products
5. **Documentación OpenAPI parcial**: el módulo más complejo no tiene docs

Se recomienda abordar las correcciones de Prioridad Alta en una sprint dedicada. Una vez estandarizados, la API estará en condiciones óptimas para alcanzar Nivel 2 sólido y preparar el camino hacia Nivel 3 (HATEOAS).

---

*Documento generado el 28 de mayo de 2026 basado en el análisis de 22 módulos del backend Express (apps/server/src/modules/) y su consumo desde el frontend React con RTK Query (apps/client/src/modules/).*