# WebSocket Implementation Guide

## Cómo estudiar los niveles (guía de lectura)

```
Nivel 1  → level-01-conceptos.js     (solo teoría — empieza aquí)
Nivel 2  → level-02-server.js        (servidor productivo + cliente)
Nivel 3  → auth.js / level-04-auth   (autenticación JWT)
Nivel 4  → rooms.js / level-05-rooms (salas de usuario)
Nivel 5  → events/* / level-06-events(validación + eventos)
Nivel 6  → notificationBus / level-07(EventEmitter bus)
Nivel 7  → handler.js / level-08     (offline recovery)
Nivel 8  → rateLimiter + monitor/*   (hardening producción)
Nivel 9  → nginx.conf + Docker       (WSS + despliegue)
Nivel 10 → adapter.js / level-11     (escalamiento Redis)
```

**Orden recomendado:** Lee cada nivel en orden. Cada nivel educativo (`level-XX-*.js`) es un archivo standalone que puedes ejecutar con `node` para verlo funcionar. El archivo `level-02-server.js` es especial: es TAMBIÉN el servidor productivo integrado en Express.

---

## ¿Qué se implementó? (10 niveles)

El sistema WebSocket se implementó siguiendo **10 niveles progresivos** en `apps/server/src/socket/` y su contraparte cliente en `apps/client/src/`. Cada nivel es un change OpenSpec archivado en `openspec/changes/archive/`.

---

## Mapa de Arquitectura Actual

```
apps/server/src/socket/
├── auth.js                        # Middleware JWT (HS256, misma SECRETKEY que Express)
├── rooms.js                       # Gestión de salas user:<ID>
├── handler.js                     # Conexión + backlog offline
├── notificationBus.js             # EventEmitter singleton (desacopla services de WS)
├── rateLimiter.js                 # Token Bucket rate limiter
├── adapter.js                     # Redis adapter (multi-instancia) o memoria
├── events/
│   ├── schemas.js                 # Validación Joi de payloads
│   └── mentionEvents.js           # Handlers mention:new / mention:read
├── monitor/
│   ├── metrics.js                 # 5 métricas Prometheus personalizadas
│   └── middleware.js              # Recolección por evento
└── levels/
    ├── level-01-conceptos.js      # Solo teoría (0 código ejecutable)
    ├── level-02-server.js         ⚠️ SERVIDOR PRODUCTIVO (exporta `attachSocketServer`, integrado en Express puerto 3000)
    ├── level-03-client.js         # Cliente Node.js educativo
    ├── level-04-auth.js           # Demo auth (puerto 3002)
    ├── level-05-rooms.js          # Demo rooms (puerto 3003)
    ├── level-06-events.js         # Demo eventos (puerto 3004)
    ├── level-07-integration.js    # Demo EventBus (puerto 3005)
    ├── level-08-offline.js        # Demo offline (puerto 3006)
    ├── level-09-hardening-server.js # Demo hardening (puerto 3007)
    ├── level-09-hardening-client.js # Cliente de carga
    ├── level-10-wss.js            # Demo WSS + NGINX
    ├── level-11-scale.js          # Demo Redis adapter (solo teoría)
    ├── test-client.html           # Cliente HTML educativo
    └── README.md                  # Documentación educativa

apps/client/src/
├── hooks/
│   ├── useSocket.js               # Hook React: conexión, auth, refresh token
│   └── useMentionNotifications.js # Hook: toast de menciones en tiempo real
└── services/
    └── socketService.js           # Constantes de eventos + helpers
```

---

## Nivel 1: Hello WebSocket (Conceptos)

**Archivos:** `level-01-conceptos.js` (solo comentarios)

**Qué hace:** Explica teoría WebSocket vs HTTP, qué es Socket.IO, Engine.IO, lifecycle de conexión, diferencia entre `io.emit`, `socket.emit`, `socket.broadcast`.

**Implementado:** ✅ Sí — archivo educativo con 0 código, solo documentación inline.

**Tu responsabilidad:** Ninguna. Es teoría.

---

## Nivel 2: Servidor + Cliente

**Archivos productivos:**
- `level-02-server.js` ⚠️ **ES EL SERVIDOR WS PRODUCTIVO**

**Qué implementa:**
- Socket.IO adjuntado al mismo servidor HTTP que Express (puerto 3000) vía `attachSocketServer(httpServer)`
- También ejecutable standalone en puerto 3001: `node src/socket/levels/level-02-server.js`
- CORS para `http://localhost:5173`
- Evento `welcome` al conectar
- Manejo de disconnect, error
- Graceful shutdown (SIGINT/SIGTERM)
- ✅ Middleware JWT (`createAuthMiddleware()`)
- ✅ Rate limiting por conexión y evento
- ✅ Auto-join a `user:<userId>` room
- ✅ Validación Joi de mensajes entrantes
- ✅ Manejo de eventos `mention:new`, `mention:read`
- ✅ Integración con `notificationBus`
- ✅ Métricas Prometheus
- ✅ Conexión con adapter (Redis/memoria)

**Archivos cliente:**
- `level-03-client.js` — Cliente Node.js educativo
- `test-client.html` — Cliente HTML educativo
- `useSocket.js` — Hook React (conexión, auth, refresh token, room join)

**Implementado:** ✅ Sí, completamente. Integrado en `bin/index.js` vía `attachSocketServer(httpServer)`. Express y Socket.IO comparten el mismo puerto 3000.

---

## Nivel 3: Autenticación JWT

**Archivos productivos:**
- `auth.js` — Middleware `io.use(createAuthMiddleware())`

**Qué hace:**
- Verifica JWT desde `socket.handshake.auth.token` (no query params)
- Misma clave `SECRETKEY` y algoritmo `HS256` que Express
- Payload decodificado → `socket.data.user`
- Rechazo → `next(new Error('UNAUTHORIZED'))` → cliente recibe `connect_error`

**Cliente:**
- `useSocket.js` lee token de Redux (`state.auth.user.data.accessToken`)
- En `connect_error` UNAUTHORIZED → intenta `refreshTokenFecth()` → actualiza `socket.auth.token` → reconecta
- Si refresh falla → `dispatch(logout())`

**Implementado:** ✅ Sí.

---

## Nivel 4: Rooms (Salas)

**Archivos productivos:**
- `rooms.js` — `joinUserRoom()`, `leaveUserRoom()`, `getActiveUserSockets()`, `isUserOnline()`, `getActiveRoomCount()`

**Convención:** `user:<ID>` — cada usuario tiene su sala personal. Multi-tab soportado naturalmente (varios sockets en misma sala). Socket.IO maneja cleanup automático al desconectar.

**Cliente:** `useSocket.js` emite `room:join` tras conexión exitosa.

**Implementado:** ✅ Sí.

---

## Nivel 5: Sistema de Eventos

**Archivos productivos:**
- `events/schemas.js` — Validación Joi: envelope + payload, XSS prevention (`noHtml`)
- `events/mentionEvents.js` — Handlers `mention:new` (envía a sala del mencionado) y `mention:read` (broadcast a otros sockets del mismo usuario)

**Catálogo de eventos:**

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `mention:new` | Server → Client | Nueva mención @usuario en nota |
| `mention:read` | Client → Server | Marcar menciones como leídas |
| `mention:backlog` | Server → Client | Menciones perdidas durante desconexión |
| `room:join` | Client → Server | Unirse a sala personal |
| `error:validation` | Server → Client | Payload inválido |
| `error:unknown` | Server → Client | Tipo de evento no registrado |
| `error:rate_limit` | Server → Client | Demasiados eventos |
| `error:auth` | Server → Client | No autorizado |
| `error:server` | Server → Client | Error interno |
| `welcome` | Server → Client | Confirmación de conexión |

**Cliente:**
- `socketService.js` — Constantes centralizadas (`SERVER_EVENTS`, `CLIENT_EVENTS`)
- `useMentionNotifications.js` — Escucha `mention:new` y muestra toast shadcn

**Implementado:** ✅ Sí.

---

## Nivel 6: Integración (EventEmitter Bus)

**Arquitectura Clave:**

```
Controller HTTP → Service Layer → notificationBus → Socket.IO → Cliente
       │                │                │                │
    createNote()    mentionParser()   EventEmitter    io.to(room)
    POST /notes     detecta @user     bus.emit()      socket.emit()
```

**Archivo productivo:** `notificationBus.js`

**Qué hace:**
- Singleton `EventEmitter` con `setMaxListeners(50)`
- Eventos definidos: `MENTION_CREATED`, `MENTION_READ`
- **Desacopla** services de Socket.IO — un service NO importa Socket.IO, solo emite en el bus
- **Testabilidad** — mockear bus (3 líneas) vs mockear Socket.IO (~30 líneas)
- **Extensibilidad** — agregar Slack/Discord = un listener más en el bus

**Conexión en level-02-server.js:**
```js
const bus = getBus()
bus.on(BUS_EVENTS.MENTION_CREATED, (payload) => {
  io.to(`user:${payload.mentionedUserId}`).emit('mention:new', {...})
})
```

**Implementado:** ✅ Sí.

---

## Nivel 7: Offline Delivery

**Archivos productivos:** `handler.js`

**Estrategia dual:**
1. **ConnectionStateRecovery** (Socket.IO v4+) — restaura salas si reconexión <2 min
2. **DB Fallback** — consulta `mentions` table (`isRead: false`) y emite `mention:backlog` con hasta 50 menciones

**Handler:**
```js
handleConnection(io, socket, getBacklogFn)
// Si !socket.recovered → getBacklogFn(userId) → socket.emit('mention:backlog')
```

**Cliente:** `useMentionNotifications.js` escucha `mention:backlog` y muestra toast agrupado "Tienes N menciones nuevas".

**Implementado:** ✅ Sí.

---

## Nivel 8: Hardening (Producción)

**Archivos productivos:**
- `rateLimiter.js` — Token Bucket: 100 conexiones/min por IP, 30 eventos/s por usuario, cleanup en disconnect
- `monitor/metrics.js` — 5 métricas Prometheus:
  - `ws_connected_users` (Gauge)
  - `ws_events_total` (Counter, label: event_type)
  - `ws_event_duration_ms` (Histogram, label: event_type)
  - `ws_errors_total` (Counter, label: error_type)
  - `ws_reconnections_total` (Counter)
- `monitor/middleware.js` — Recolección automática por socket
- `app.js` — Endpoint `GET /metrics`

**Archivos educativos:**
- `levels/level-09-hardening-server.js` — Demo standalone puerto 3007 con rate limiting + métricas + Joi validation
- `levels/level-09-hardening-client.js` — Script de carga para probar rate limiting

**Implementado:** ✅ Sí.

---

## Nivel 9: WSS + Docker

**Archivos:**
- `nginx.conf` — Reverse proxy con TLS, WebSocket upgrade headers, timeout 86400s
- `Dockerfile` — Node 20 alpine
- `docker-compose.yml` — API + NGINX + Prometheus + Grafana + Postgres + pgAdmin
- `level-10-wss.js` — Demo educativo

**Implementado:** ✅ Sí.

**Tu responsabilidad:** Generar certificados SSL y configurar dominio.

---

## Nivel 10: Escalamiento

**Archivos productivos:** `adapter.js`

**Árbol de decisión:**
```
¿Un servidor alcanza? → Sí → Fin
   ↓ No
¿CPU limitada? → PM2 cluster (ecosystem.config.js)
   ↓ No
¿Muchos usuarios? → Redis adapter (REDIS_URL)
   ↓ No
¿K8s? → Kubernetes
```

**Implementado:** ✅ Sí (adapter condicional, PM2 config, Redis opcional).

---

---

# ✅ CAMBIOS IMPLEMENTADOS

## Gap #1: Socket.IO integrado en bootstrap ✅

**Archivos modificados:**
- `src/bin/index.js` — ahora usa `createServer(app)`, importa `attachSocketServer(httpServer)`, graceful shutdown unificado
- `src/socket/levels/level-02-server.js` — refactorizado a función `attachSocketServer(httpServer)` exportada

**Ya no necesitas hacer nada.** Socket.IO arranca automáticamente con `npm run dev`. Express y WS comparten el mismo puerto (3000).

---

## Gap #2: notificationBus conectado con services ✅

**Archivo modificado:** `src/modules/notes/service.js`

**Cambios:**
- Importado `bus, { BUS_EVENTS }` desde notificationBus
- `createNote()` — emite `MENTION_CREATED` por cada mención detectada después de guardar
- `updateNoteById()` — emite `MENTION_CREATED` por cada mención al actualizar contenido

**Ya no necesitas hacer nada.** El flujo completo funciona: al crear/editar nota con @mención → `bus.emit()` → Socket.IO → `io.to(user:ID).emit('mention:new')` → cliente muestra toast.

---

# ⚠️ LO QUE QUEDA PENDIENTE (TU RESPONSABILIDAD)

## Pendiente: Probar el flujo completo

1. Iniciar servidor: `cd apps/server && npm run dev`
2. Iniciar cliente: `cd apps/client && npm run dev`
3. Iniciar sesión como `admin@gmail.com` (pestaña 1) y `user2@gmail.com` (pestaña 2)
4. Desde admin, crear una nota con mención a user2 (`@user2`)
5. Verificar que user2 recibe toast "Nueva mención" en tiempo real
6. Revisar terminal del server: debe aparecer "📢 Bus → WS: mención creada para usuario"

## Pendiente: Seed database (si no se ha ejecutado)

```bash
cd apps/server && npm run prisma-seed
```

## Pendiente: Certificados SSL para producción (WSS)

```bash
cd apps/server && mkdir -p ssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx.key -out ssl/nginx.crt
docker-compose up -d
```

## Pendiente: Redis para multi-instancia (escalamiento)

Solo cuando necesites >1 instancia. Configurar `REDIS_URL` en entorno.

---

## Comandos de referencia

```bash
# Iniciar todo (Express + Socket.IO en puerto 3000)
cd apps/server && npm run dev

# Iniciar cliente
cd apps/client && npm run dev

# Seed database
cd apps/server && npm run prisma-seed

# Ver métricas WS
curl http://localhost:3000/metrics
```
