# Diseño de API — Template

> **Etapa:** 5. Diseño técnico
> **Artefacto:** Diseño de API (con versionado y compatibilidad)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Contrato detallado del endpoint: método, ruta, parámetros, body, respuestas, códigos de error, versionado, deprecación y sunset. Se produce en Diseño técnico, después del ADR, y se referencia desde el change OpenSpec (`design.md`).
>
> **No confundir con:** Contrato de API y versionado (Etapa 3 — política general de versionado), Diseño de base de datos (migración expand/contract), Threat model (seguridad del endpoint).
>
> **Fuentes:** Swagger/OpenAPI Best Practices [1], Microsoft REST API Design Guidelines [2], Google API Design Guide [3], Zalando RESTful API Guidelines [4], RFC 7231 (HTTP Semantics) [5], OpenAPI Specification 3.1 [6], Swagger — Best Practices for Deprecating APIs [7], MDN — HTTP response status codes [8].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `api-design-<recurso>.md` (ej. `api-design-purchase-orders.md`).
> 2. Un archivo por recurso o grupo de endpoints relacionados.
> 3. Completa todos los endpoints con método, ruta, parámetros, body, respuestas y errores.
> 4. Define la política de versionado y deprecación.
> 5. Persiste en `/docs/api/` o en el change OpenSpec (`design.md`). Referéncialo desde el ADR.
>
> ---

## 1. Información general

| Campo               | Valor                      |
| ------------------- | -------------------------- |
| **Recurso**         | <nombre del recurso>       |
| **Base URL**        | `/api/v1/`                 |
| **Versión**         | v1                         |
| **Owner**           | @dev                       |
| **Fecha**           | YYYY-MM-DD                 |
| **ADR relacionado** | ADR-xxx                    |
| **Change OpenSpec** | `openspec/changes/<name>/` |

---

## 2. Política de versionado

- **Ruta versionada:** `/api/v1/...`
- **Cambios aditivos preferidos:** añadir campos, no modificar ni eliminar.
- **Deprecación:** aviso mínimo de 6 meses antes de retirar un endpoint/campo.
- **Retiro (sunset):** solo tras período de sunset documentado; cambios breaking requieren nueva versión mayor (`/api/v2/`).
- **Compatibilidad hacia atrás:** mantener campos deprecated con valor por defecto.

---

## 3. Endpoints

### 3.1 <Nombre del endpoint>

```
METHOD /api/v1/<recurso>/{id}/<acción>
```

**Autorización:** Bearer <token> — roles/permisos requeridos: `<lista>`

**Path parameters:**

| Parámetro | Tipo | Descripción               | Requerido |
| --------- | ---- | ------------------------- | --------- |
| `id`      | UUID | Identificador del recurso | Sí        |

**Query parameters:**

| Parámetro | Tipo | Descripción      | Default | Requerido |
| --------- | ---- | ---------------- | ------- | --------- |
| `page`    | int  | Página           | 1       | No        |
| `limit`   | int  | Items por página | 20      | No        |

**Request body:**

```json
{
  "campo1": "string",
  "campo2": "number"
}
```

| Campo    | Tipo   | Descripción | Requerido | Validación       |
| -------- | ------ | ----------- | --------- | ---------------- |
| `campo1` | string | Descripción | Sí        | min: 3, max: 100 |
| `campo2` | number | Descripción | No        | min: 0           |

**Respuestas:**

| Código | Descripción            | Body                                                                                                          |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| 200    | OK                     | `{ "success": true, "statusCode": 200, "data": {...}, "message": "..." }`                                     |
| 201    | Creado                 | `{ "success": true, "statusCode": 201, "data": {...}, "message": "..." }`                                     |
| 400    | Bad Request            | `{ "success": false, "statusCode": 400, "code": "VALIDATION_ERROR", "message": "...", "details": [...] }`     |
| 401    | No autenticado         | `{ "success": false, "statusCode": 401, "code": "UNAUTHORIZED", "message": "..." }`                           |
| 403    | Sin permiso            | `{ "success": false, "statusCode": 403, "code": "FORBIDDEN", "message": "...", "required_role": "..." }`      |
| 404    | No encontrado          | `{ "success": false, "statusCode": 404, "code": "NOT_FOUND", "message": "..." }`                              |
| 409    | Conflicto              | `{ "success": false, "statusCode": 409, "code": "CONFLICT", "message": "..." }`                               |
| 422    | Unprocessable Entity   | `{ "success": false, "statusCode": 422, "code": "UNPROCESSABLE", "message": "..." }`                          |
| 429    | Too Many Requests      | `{ "success": false, "statusCode": 429, "code": "RATE_LIMITED", "message": "...", "retry_after": <seconds> }` |
| 500    | Error interno          | `{ "success": false, "statusCode": 500, "code": "INTERNAL_ERROR", "message": "..." }`                         |
| 503    | Servicio no disponible | `{ "success": false, "statusCode": 503, "code": "SERVICE_UNAVAILABLE", "message": "..." }`                    |

**Ejemplo de respuesta 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "campo1": "valor",
    "campo2": 100
  },
  "message": "Recurso obtenido exitosamente"
}
```

---

## 4. Errores y códigos de error

| Código de error       | HTTP status | Descripción                | Cuándo ocurre                                 |
| --------------------- | ----------- | -------------------------- | --------------------------------------------- |
| `VALIDATION_ERROR`    | 400         | Datos de entrada inválidos | Body/query/params no cumplen validación       |
| `UNAUTHORIZED`        | 401         | Token inválido o expirado  | Sin token o token inválido                    |
| `FORBIDDEN`           | 403         | Sin permiso                | Rol/permiso insuficiente                      |
| `NOT_FOUND`           | 404         | Recurso no encontrado      | ID no existe                                  |
| `CONFLICT`            | 409         | Conflicto de estado        | Estado no permite la operación                |
| `UNPROCESSABLE`       | 422         | Entidad no procesable      | Datos válidos pero lógicamente inconsistentes |
| `RATE_LIMITED`        | 429         | Demasiadas requests        | Límite de rate excedido                       |
| `INTERNAL_ERROR`      | 500         | Error interno del servidor | Error no controlado                           |
| `SERVICE_UNAVAILABLE` | 503         | Servicio no disponible     | Servicio temporalmente fuera de servicio      |

---

## 5. Paginación y filtrado

- **Paginación:** `?page=1&limit=20` → respuesta incluye `meta: { total, page, limit, totalPages }`.
- **Filtrado:** `?status=active&search=texto`.
- **Ordenamiento:** `?sort=createdAt&order=desc`.
- **Formato de respuesta paginada:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "message": "Recursos obtenidos exitosamente"
}
```

---

## 6. Autenticación y autorización

- **Método:** Bearer token (JWT) en header `Authorization: Bearer <token>`.
- **Roles/permisos requeridos:** listados por endpoint en la sección 3.
- **Rate limiting:** <n> requests/min por IP para endpoints críticos. Respuesta 429 incluye header `Retry-After: <seconds>`.
- **CORS:** configurado en el servidor.

---

## 7. Versionado y deprecación

### 7.1 Política de versionado

- Ruta versionada: `/api/v1/...`
- Cambios aditivos preferidos (añadir campos, no modificar ni eliminar).
- Cambios breaking requieren nueva versión mayor (`/api/v2/`).

### 7.2 Deprecación

- Aviso mínimo de 6 meses antes de retirar un endpoint/campo.
- Header `Deprecation: @<epoch>` (RFC draft-ietf-httpapi-deprecation-header) y `Sunset: <fecha>` en respuestas.
- Documentación actualizada con "deprecated" y alternativa.

### 7.3 Retiro (sunset)

- Solo tras período de sunset documentado.
- Confirmar que no hay consumidores (analytics/logs).
- Remover código y actualizar docs.

---

## 7b. Especificación OpenAPI (opcional)

Si el proyecto usa OpenAPI/Swagger, generar el spec a partir de este diseño:

- **Formato:** OpenAPI 3.1 (YAML o JSON)
- **Ubicación:** `docs/api/<recurso>.yaml` o inline en `src/docs/`
- **Herramientas:** swagger-jsdoc, tsoa, zod-to-openapi
- **Validación:** `swagger-cli validate` o `openapi-generator validate`

```yaml
# Ejemplo mínimo
openapi: 3.1.0
info:
  title: <recurso> API
  version: 1.0.0
paths:
  /api/v1/<recurso>:
    get:
      summary: Listar <recurso>
      responses:
        '200':
          description: OK
```

---

## 8. Trazabilidad

| Endpoint             | Change OpenSpec            | ADR     | Tests       | RTM     |
| -------------------- | -------------------------- | ------- | ----------- | ------- |
| `METHOD /api/v1/...` | `openspec/changes/<name>/` | ADR-xxx | `tests/...` | RTM-xxx |

---

## Exit criteria (criterio de salida de Diseño)

- [ ] Todos los endpoints documentados con método, ruta, parámetros, body, respuestas y errores
- [ ] Códigos de error definidos y consistentes
- [ ] Política de versionado y deprecación declarada
- [ ] Paginación/filtrado/ordenamiento documentados (si aplica)
- [ ] Autenticación y autorización por endpoint definidas
- [ ] Rate limiting especificado para endpoints críticos
- [ ] Trazabilidad a change OpenSpec, ADR y tests
- [ ] Revisado por par (Tech Lead)

---

## Referencias

- [1] Swagger — Best Practices for REST API Design: https://swagger.io/blog/api-design/api-design-best-practices/
- [2] Microsoft — REST API Design Guidelines: https://github.com/microsoft/api-guidelines
- [3] Google — API Design Guide: https://cloud.google.com/apis/design
- [4] Zalando — RESTful API Guidelines: https://opensource.zalando.com/restful-api-guidelines/
- [5] RFC 9110 — HTTP Semantics (obsoletes RFC 7231): https://www.rfc-editor.org/rfc/rfc9110
- [5b] RFC 7231 — HTTP/1.1 Semantics and Content (obsolete): https://www.rfc-editor.org/rfc/rfc7231
- [6] OpenAPI Specification 3.1: https://spec.openapis.org/oas/v3.1.0
- [7] Swagger — Best Practices for Deprecating APIs: https://swagger.io/blog/best-practices-for-deprecating-apis
- [8] MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
