# Guía de Integración Trello + Composio

## 1. Introducción

Composio es un plataforma de integración que conecta con más de 500 aplicaciones, incluyendo Trello. Esta guía explica cómo usar la API de Trello a través de Composio de manera eficiente, optimizando el consumo de tokens.

### 1.1 ¿Qué es Composio?

Composio actúa como intermediario entre tu aplicación y la API de Trello:
- Maneja autenticación OAuth automáticamente
- Proporciona herramientas predefinidas para cada operación
- Unifica las respuestas en un formato consistente

### 1.2 ¿Por qué usar Composio para Trello?

| Beneficio | Descripción |
|-----------|-------------|
| Sin gestión de tokens | OAuth manejado automáticamente |
| Herramientas predefinidas | No necesitas construir peticiones desde cero |
| Múltiples acciones en paralelo | Ejecutar varias operaciones en una sola llamada |
| Control de campos | Solicitar solo los datos necesarios |

---

## 2. Prerrequisitos

### 2.1 Conectar Trello a Composio

Antes de usar cualquier herramienta, conecta tu cuenta de Trello:

```javascript
// Verificar conexiones existentes
{
  toolkits: [{ name: "trello", action: "list" }]
}
```

Respuesta exitosa:
```json
{
  "successful": true,
  "data": {
    "results": {
      "trello": {
        "status": "active",
        "accounts": [{
          "id": "trello_anta-herat",
          "user_info": { "fullName": "johan Garcia" }
        }]
      }
    }
  }
}
```

### 2.2 Cuenta activa

Una vez conectada, tu cuenta tiene un ID único:
- **Account ID:** `trello_anta-herat`
- Este ID se usa en todas las llamadas a herramientas

---

## 3. Herramientas Disponibles

Referencia completa: [docs.composio.dev/toolkits/trello](https://docs.composio.dev/toolkits/trello)

### 3.1 Principales herramientas para tarjetas

| Operación | Herramienta (Slug) |
|-----------|-------------------|
| Crear tarjeta | `TRELLO_ADD_CARDS` |
| Buscar tarjetas | `TRELLO_GET_SEARCH` |
| Obtener tarjeta | `TRELLO_GET_CARDS_BY_ID_CARD` |
| Actualizar tarjeta | `TRELLO_UPDATE_CARDS_BY_ID_CARD` |
| Eliminar tarjeta | `TRELLO_DELETE_CARDS_BY_ID_CARD` |
| Agregar comentario | `TRELLO_ADD_CARDS_ACTIONS_COMMENTS_BY_ID_CARD` |
| Agregar etiqueta | `TRELLO_ADD_CARDS_ID_LABELS_BY_ID_CARD` |
| Asignar miembro | `TRELLO_ADD_MEMBER_TO_CARD` |

### 3.2 Herramientas para listas y boards

| Operación | Herramienta (Slug) |
|-----------|-------------------|
| Listar boards | `TRELLO_GET_MEMBERS_BOARDS_BY_ID_MEMBER` |
| Listar listas | `TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD` |
| Listar tarjetas de board | `TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD` |
| Crear lista | `TRELLO_ADD_LISTS` |

---

## 4. Crear Tarjetas

### 4.1 Tool: TRELLO_ADD_CARDS

Crea una nueva tarjeta en una lista específica.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `idList` | string | ✅ Sí | ID de la lista donde crear la tarjeta |
| `name` | string | Recomendado | Título de la tarjeta |
| `desc` | string | No | Descripción de la tarjeta |
| `due` | string | No | Fecha de vencimiento (ISO 8601) |
| `pos` | string | No | Posición: "top", "bottom", o número |
| `idBoard` | string | No | ID del board (opcional, se deduce del idList) |
| `idLabels` | string | No | IDs de etiquetas separados por coma |
| `idMembers` | string | No | IDs de miembros separados por coma |
| `closed` | string | No | Archivar tarjeta ("true" o "false") |
| `subscribed` | string | No | Suscribir al creador ("true" o "false") |

#### Ejemplo de llamada

```javascript
{
  tool_slug: "TRELLO_ADD_CARDS",
  arguments: {
    idList: "67350aad430c7ecc2edc35df",
    name: "Nueva tarea desde API",
    desc: "Descripción de la tarea",
    due: "2026-05-20T23:59:59.999Z",
    pos: "top"
  },
  account: "trello_anta-herat"
}
```

#### Respuesta exitosa

```json
{
  "successful": true,
  "data": {
    "id": "6a06c3d70262bf3fdeaa5dc0",
    "name": "Nueva tarea desde API",
    "desc": "Descripción de la tarea",
    "due": "2026-05-20T23:59:59.999Z",
    "idList": "67350aad430c7ecc2edc35df",
    "idBoard": "663aa79b4bb80987bc775706",
    "shortUrl": "https://trello.com/c/tT5HoLiA",
    "url": "https://trello.com/c/tT5HoLiA/78-nueva-tarea-desde-api"
  }
}
```

### 4.2 Cómo obtener el ID de una lista

Antes de crear una tarjeta, necesitas el `idList`. Hay dos formas:

#### Método 1: Buscar listas de un board

```javascript
{
  tool_slug: "TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    filter: "open",
    fields: "name,id"
  },
  account: "trello_anta-herat"
}
```

#### Método 2: Obtener boards con sus listas

```javascript
{
  tool_slug: "TRELLO_GET_MEMBERS_BOARDS_BY_ID_MEMBER",
  arguments: {
    idMember: "me",
    fields: "name,shortUrl",
    lists: "open"
  },
  account: "trello_anta-herat"
}
```

### 4.3 Ejemplo completo: Crear tarjeta en lista "Failed"

**Contexto:** Board "Project One", lista "Failed"

1. Obtener ID de la lista:
```javascript
// idBoard de Project One: 663aa79b4bb80987bc775706
// Lista "Failed" ID: 67350aad430c7ecc2edc35df
```

2. Crear la tarjeta:
```javascript
{
  tool_slug: "TRELLO_ADD_CARDS",
  arguments: {
    idList: "67350aad430c7ecc2edc35df",
    name: "🧪 Tarjeta de prueba",
    desc: "Creada mediante API de Composio",
    due: "2026-05-25T23:59:59.999Z"
  },
  account: "trello_anta-herat"
}
```

---

## 5. Mover Tarjetas (Cambiar Columna/Estado)

### 5.1 Tool: TRELLO_UPDATE_CARDS_BY_ID_CARD

Para mover una tarjeta entre listas, actualiza su `idList`.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `idCard` | string | ✅ Sí | ID de la tarjeta a mover |
| `idList` | string | No | Nuevo ID de lista (para mover) |
| `name` | string | No | Nuevo nombre |
| `desc` | string | No | Nueva descripción |
| `due` | string | No | Nueva fecha de vencimiento |
| `pos` | string | No | Nueva posición |
| `closed` | string | No | Archivar ("true") o restaurar ("false") |
| `idLabels` | string | No | Nuevas etiquetas (sobrescribe) |
| `idMembers` | string | No | Nuevos miembros (sobrescribe) |

#### Ejemplo: Mover tarjeta de "Failed" a "In Progress"

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    idList: "663aa79b4bb80987bc775709"
  },
  account: "trello_herat"
}
```

**Explicación:**
- `idCard`: "673bbf0a3fb27eb95d621d45" (tarjeta "Landing page")
- `idList`: "663aa79b4bb80987bc775709" (lista "In Progress" en Project One)

#### Cómo obtener los IDs de las listas de un board

```javascript
{
  tool_slug: "TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    fields: "name,id"
  },
  account: "trello_anta-herat"
}
```

**Respuesta:**
```json
{
  "successful": true,
  "data": {
    "lists": [
      { "id": "663aa79b4bb80987bc775707", "name": "Backlog" },
      { "id": "663aa79b4bb80987bc775708", "name": "Sprint Backlog" },
      { "id": "663aa79b4bb80987bc775709", "name": "In Progress" },
      { "id": "673507e3f305b42410f04639", "name": "Testing" },
      { "id": "663aa79b4bb80987bc77570a", "name": "8.9.17 Sprint - Complete" },
      { "id": "67350aad430c7ecc2edc35df", "name": "Failed" },
      { "id": "67b7ec8941cbc1b5a53afd56", "name": "Revision de modulos" }
    ]
  }
}
```

### 5.2 Estados de tarjetas

En Trello, las listas representan estados. Algunos ejemplos comunes:

| Estado | Lista típica |
|--------|--------------|
| Pendiente | Backlog, To Do, Sprint Backlog |
| En proceso | In Progress, En proceso |
| En revisión | Testing, Code Review, En revisión |
| Completado | Done, Hecho, Sprint Complete |
| Fallido | Failed, Canceled |

---

## 6. Editar Tarjetas

### 6.1 Tool: TRELLO_UPDATE_CARDS_BY_ID_CARD

La misma herramienta sirve para editar cualquier campo de la tarjeta.

#### Editar nombre

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    name: "Landing Page - Actualizado"
  },
  account: "trello_anta-herat"
}
```

#### Editar descripción

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    desc: "Nueva descripción actualizada"
  },
  account: "trello_anta-herat"
}
```

#### Editar fecha de vencimiento

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    due: "2026-06-15T23:59:59.999Z"
  },
  account: "trello_anta-herat"
}
```

#### Editar múltiples campos a la vez

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    name: "Landing Page - Nueva versión",
    desc: "Descripción actualizada con nuevos detalles",
    due: "2026-06-20T23:59:59.999Z",
    pos: "top"
  },
  account: "trello_anta-herat"
}
```

### 6.2 Editar posición

| Valor | Descripción |
|-------|-------------|
| "top" | Primera posición en la lista |
| "bottom" | Última posición en la lista |
| Número (ej: "16384") | Posición específica |

---

## 7. Otras Operaciones Importantes

### 7.1 Agregar Etiquetas

**Tool:** `TRELLO_ADD_CARDS_ID_LABELS_BY_ID_CARD`

```javascript
{
  tool_slug: "TRELLO_ADD_CARDS_ID_LABELS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    value: "60d5f0f5b3f3d50029f7a3c3"
  },
  account: "trello_anta-herat"
}
```

**Nota:** Necesitas el ID de la etiqueta. Para obtener etiquetas de un board:

```javascript
{
  tool_slug: "TRELLO_GET_BOARDS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    labels: "all",
    label_fields: "name,color,id"
  },
  account: "trello_anta-herat"
}
```

### 7.2 Asignar Miembros

**Tool:** `TRELLO_ADD_MEMBER_TO_CARD`

```javascript
{
  tool_slug: "TRELLO_ADD_MEMBER_TO_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    value: "6606187e712266870ad3e9a8"
  },
  account: "trello_anta-herat"
}
```

### 7.3 Agregar Comentarios

**Tool:** `TRELLO_ADD_CARDS_ACTIONS_COMMENTS_BY_ID_CARD`

```javascript
{
  tool_slug: "TRELLO_ADD_CARDS_ACTIONS_COMMENTS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    text: "Esta tarea está siendo tratada @johan Garcia"
  },
  account: "trello_anta-herat"
}
```

### 7.4 Eliminar Tarjeta

**Tool:** `TRELLO_DELETE_CARDS_BY_ID_CARD`

```javascript
{
  tool_slug: "TRELLO_DELETE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "6a06c3d70262bf3fdeaa5dc0"
  },
  account: "trello_anta-herat"
}
```

**Nota:** Solo elimina tarjetas archivadas. Para eliminar una tarjeta activa, primero márcela como cerrada:

```javascript
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "6a06c3d70262bf3fdeaa5dc0",
    closed: "true"
  },
  account: "trello_anta-herat"
}
```

---

## 8. Estrategias de Optimización de Tokens

El consumo de tokens depende de la cantidad de datos transferidos. Optimizar las llamadas reduce costos y mejora el rendimiento.

### 8.1 Usar Campos Específicos (Nunca "all")

| ✅ RECOMENDADO | ❌ EVITAR |
|---------------|-----------|
| `fields: "name,idList,shortUrl"` | `fields: "all"` |
| `card_fields: "name,desc,due"` | `card_fields: "all"` |
| `board_fields: "name,url"` | `board_fields: "all"` |

**Ejemplo comparativo:**

```javascript
// ✅ EFICIENTE - ~500 bytes
{
  tool_slug: "TRELLO_GET_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    fields: "name,idList,shortUrl,url"
  }
}

// ❌ INEFICIENTE - ~5000+ bytes
{
  tool_slug: "TRELLO_GET_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    fields: "all"
  }
}
```

### 8.2 Limitar Resultados

| Parámetro | Descripción | Valor recomendado |
|-----------|-------------|-------------------|
| `cards_limit` | Número máximo de tarjetas | 10-20 |
| `boards_limit` | Número máximo de boards | 5-10 |
| `actions_limit` | Número máximo de acciones | 10-50 |

```javascript
// ✅ EFICIENTE
{
  tool_slug: "TRELLO_GET_SEARCH",
  arguments: {
    query: "failed",
    cards_limit: "5",
    card_fields: "name,idList,shortUrl"
  }
}
```

### 8.3 Filtrar Datos No Necesarios

```javascript
// ✅ Ligero - sin datos relacionados
{
  tool_slug: "TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    fields: "name,idList",
    filter: "open"
  }
}

// ❌ Pesado - carga objetos anidados
{
  tool_slug: "TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    members: "true",
    card_board: "true",
    card_list: "true"
  }
}
```

### 8.4 Buscar vs Enumerar

| Método | Cuándo usar | Llamadas | Tokens |
|--------|-------------|----------|--------|
| **TRELLO_GET_SEARCH** | Conoces el nombre/keyword | 1 | Medio |
| **TRELLO_GET_BOARDS_CARDS** | Necesitas todas las tarjetas | 1-2 | Alto |
| **TRELLO_GET_CARDS_BY_ID** | Tienes el ID específico | 1 | Bajo |

**Ejemplo: Encontrar "Landing page" en Project One**

```javascript
// ✅ BÚSQUEDA DIRECTA - 1 llamada, tokens medios
{
  tool_slug: "TRELLO_GET_SEARCH",
  arguments: {
    query: "Landing page",
    idBoards: "663aa79b4bb80987bc775706",
    card_fields: "name,idList,shortUrl",
    cards_limit: "5"
  }
}

// ❌ ENUMERACIÓN - 2+ llamadas, tokens altos
// Paso 1: Obtener todas las listas
// Paso 2: Obtener todas las tarjetas
// Paso 3: Filtrar client-side
```

### 8.5 Tabla Comparativa de Eficiencia

| Operación | Sin optimizar | Optimizado | Ahorro |
|-----------|---------------|------------|--------|
| Obtener tarjeta | fields: "all" | fields: "name,idList" | ~80% |
| Buscar tarjetas | cards_limit: 100 | cards_limit: 10 | ~90% |
| Listar boards | lists: "all" | filter: "open" | ~50% |
| Obtener tarjetas | con members/list/board | sin datos relacionados | ~70% |

### 8.6 Mejores Prácticas

1. **Cachear IDs**: Guarda los IDs de boards, listas y tarjetas frecuentes
2. **Buscar antes de enumerar**: Usa `GET_SEARCH` cuando conoces el nombre
3. **Pedir solo lo necesario**: Especifica campos exactos
4. **Filtrar resultados**: Usa límites y filtros apropiados
5. **Evitar "all"**: Siempre especifica los campos que necesitas

---

## 9. Ejemplos Completos de Flujos

### 9.1 Flujo 1: Crear y mover tarjeta

**Objetivo:** Crear una tarjeta en "Backlog" y moverla a "In Progress"

```javascript
// Paso 1: Obtener IDs de listas
// Board: Project One (663aa79b4bb80987bc775706)
// Backlog: 663aa79b4bb80987bc775707
// In Progress: 663aa79b4bb80987bc775709

// Paso 2: Crear tarjeta en Backlog
{
  tool_slug: "TRELLO_ADD_CARDS",
  arguments: {
    idList: "663aa79b4bb80987bc775707",
    name: "Nueva funcionalidad",
    desc: "Desarrollar módulo de reportes",
    pos: "top"
  },
  account: "trello_anta-herat"
}

// Paso 3: Mover a In Progress (usando el ID de la tarjeta creada)
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "NUEVO_ID_DE_TARJETA",
    idList: "663aa79b4bb80987bc775709"
  },
  account: "trello_anta-herat"
}
```

### 9.2 Flujo 2: Buscar y editar tarjeta

**Objetivo:** Encontrar la tarjeta "Landing page" y actualizar su descripción

```javascript
// Paso 1: Buscar la tarjeta
{
  tool_slug: "TRELLO_GET_SEARCH",
  arguments: {
    query: "Landing page",
    modelTypes: "cards",
    card_fields: "name,idList,shortUrl,id",
    cards_limit: "3"
  },
  account: "trello_anta-herat"
}

// Paso 2: Editar la tarjeta encontrada
{
  tool_slug: "TRELLO_UPDATE_CARDS_BY_ID_CARD",
  arguments: {
    idCard: "673bbf0a3fb27eb95d621d45",
    desc: "Descripción actualizada: Se debe implementar el diseño de Figma"
  },
  account: "trello_anta-herat"
}
```

### 9.3 Flujo 3: Encontrar tarjeta específica eficientemente

**Escenario:** Encontrar una tarjeta específica en la lista "Failed"

```javascript
// Método 1: Por nombre (más eficiente)
{
  tool_slug: "TRELLO_GET_SEARCH",
  arguments: {
    query: "Landing page",
    idBoards: "663aa79b4bb80987bc775706",
    card_fields: "name,idList,shortUrl",
    cards_limit: "5"
  },
  account: "trello_anta-herat"
}

// Método 2: Enumerar todas las tarjetas y filtrar (menos eficiente)
// Solo usar si el método 1 no funciona
{
  tool_slug: "TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD",
  arguments: {
    idBoard: "663aa79b4bb80987bc775706",
    fields: "name,id"
  },
  account: "trello_anta-herat"
}
// Identificar: Failed = 67350aad430c7ecc2edc35df
```

---

## 10. Tablas de Referencia Rápidas

### 10.1 Herramientas por operación

| Si necesitas... | Usa esta herramienta |
|-----------------|---------------------|
| Crear una tarjeta | `TRELLO_ADD_CARDS` |
| Mover una tarjeta | `TRELLO_UPDATE_CARDS_BY_ID_CARD` |
| Editar nombre/descripción | `TRELLO_UPDATE_CARDS_BY_ID_CARD` |
| Buscar tarjetas | `TRELLO_GET_SEARCH` |
| Ver una tarjeta específica | `TRELLO_GET_CARDS_BY_ID_CARD` |
| Ver todas las tarjetas de un board | `TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD` |
| Ver las listas de un board | `TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD` |
| Ver mis boards | `TRELLO_GET_MEMBERS_BOARDS_BY_ID_MEMBER` |
| Agregar comentario | `TRELLO_ADD_CARDS_ACTIONS_COMMENTS_BY_ID_CARD` |
| Agregar etiqueta | `TRELLO_ADD_CARDS_ID_LABELS_BY_ID_CARD` |
| Asignar miembro | `TRELLO_ADD_MEMBER_TO_CARD` |
| Eliminar tarjeta | `TRELLO_DELETE_CARDS_BY_ID_CARD` |

### 10.2 Parámetros esenciales por herramienta

**TRELLO_ADD_CARDS:**
- Obligatorio: `idList`
- Recomendado: `name`

**TRELLO_UPDATE_CARDS_BY_ID_CARD:**
- Obligatorio: `idCard`
- Para mover: `idList`
- Para editar: `name`, `desc`, `due`, `pos`

**TRELLO_GET_SEARCH:**
- Obligatorio: `query`
- Opcional: `idBoards`, `card_fields`, `cards_limit`

**TRELLO_GET_CARDS_BY_ID_CARD:**
- Obligatorio: `idCard`
- Opcional: `fields`, `list`, `board`

**TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD:**
- Obligatorio: `idBoard`
- Opcional: `fields`, `filter`

---

## 11. Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| 401 | Sin autorización | Reconectar cuenta de Trello |
| 400 | Solicitud inválida | Verificar formato de parámetros |
| 404 | Recurso no encontrado | Verificar que el ID exista |
| 429 | Demasiadas solicitudes | Reducir frecuencia de llamadas |

---

## 12. Recursos Adicionales

- **Documentación oficial de Composio:** [docs.composio.dev](https://docs.composio.dev)
- **Referencia de Trello en Composio:** [docs.composio.dev/toolkits/trello](https://docs.composio.dev/toolkits/trello)
- **API de Trello:** [developer.atlassian.com/cloud/trello](https://developer.atlassian.com/cloud/trello)

---

*Documento creado para el proyecto Project One*
*Última actualización: Mayo 2026*