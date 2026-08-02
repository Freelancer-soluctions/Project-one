# Niveles de WebSocket

Este directorio contiene ejemplos y ejercicios para aprender WebSocket con Socket.IO, organizados por niveles de complejidad.

## Niveles

- **Nivel 01**: Conceptos teóricos de WebSocket y Socket.IO (archivo: `level-01-conceptos.js`)
- **Nivel 02**: Servidor Socket.IO independiente (archivo: `level-02-server.js`)
- **Nivel 03**: Cliente Socket.IO en Node.js y prueba en navegador (archivos: `level-03-client.js`, `test-client.html`)

## Cómo ejecutar

### Servidor de nivel 02

Para iniciar el servidor de Socket.IO en el puerto 3001:

```bash
node src/socket/levels/level-02-server.js
```

### Cliente de Node.js (nivel 03)

Para ejecutar el cliente de prueba en Node.js:

```bash
node src/socket/levels/level-03-client.js
```

### Cliente de navegador (nivel 03)

Abra el archivo `src/socket/levels/test-client.html` en su navegador y haga clic en el botón "Conectar".

## Puertos

- **Puerto 3000**: Servidor Express principal (API REST)
- **Puerto 3001**: Servidor Socket.IO (WebSocket)

## Notas

- El servidor de nivel 02 es independiente y no depende del servidor Express.
- Los clientes están diseñados para conectarse al servidor en `http://localhost:3001`.
- Todos los archivos incluyen comentarios en español explicando cada línea.

## Level 3: JWT Authentication

**Archivos:** `../auth.js` (producción), `level-04-auth.js` (educativo)

### Flujo de autenticación

Cliente → handshake.auth.token → io.use() → jwt.verify → socket.data.user → connection
→ Error UNAUTHORIZED → connect_error

### Cómo generar token de prueba

```bash
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: 1, name: 'Test' }, 'secret-key-dev-only', { algorithm: 'HS256', expiresIn: '1h' }))"
```

### Seguridad

- NO usar query params para tokens (quedan en logs del servidor)
- Usar socket.handshake.auth (Socket.IO lo maneja de forma segura)
- Misma clave y algoritmo que Express (HS256, SECRETKEY)

## Level 4: Rooms

**Convención:** `user:<ID>` para salas personales.
**Multi-tab:** Múltiples sockets (pestañas) en misma sala. io.to() llega a todas.
**No guardar socket IDs manualmente:** Socket.IO maneja lifecycle.
**API clave:**

- `socket.join('user:123')` — entrar a sala
- `io.to('user:123').emit(...)` — enviar a sala
- `io.in('user:123').fetchSockets()` — listar sockets en sala

## Level 5: Events

### Event Catalog

| Event            | Direction     | Payload                                                        | Description                  |
| ---------------- | ------------- | -------------------------------------------------------------- | ---------------------------- |
| mention:new      | Server→Client | `{ noteId, noteTitle, mentionedByUserId, excerpt, timestamp }` | Nueva mención en nota        |
| mention:read     | Client→Server | `{ mentionIds: number[] }`                                     | Marcar menciones como leídas |
| room:join        | Client→Server | `{ userId }`                                                   | Unirse a sala personal       |
| error:validation | Server→Client | `{ errors: string[] }`                                         | Payload inválido             |
| error:unknown    | Server→Client | `{ type }`                                                     | Tipo de evento no registrado |

### Throttling

- Payload máximo: 50KB por mensaje
- Frecuencia máxima: 30 mensajes/segundo por usuario (ver Nivel 8)

## Level 6: EventEmitter Bus (Integration)

**Archivo:** `../notificationBus.js`

### Arquitectura

```
Controller HTTP → Service Layer → notificationBus → Socket.IO → Cliente
       │                │                │                │
    createNote()    mentionParser()   EventEmitter    io.to(room)
    POST /notes     detecta @user     bus.emit()      socket.emit()
```

### ¿Por qué un bus?

- **Desacoplamiento**: El service.js no importa Socket.IO. No circular deps.
- **Testabilidad**: Mockear bus (3 líneas) vs mockear Socket.IO (~30 líneas).
- **Extensibilidad**: Agregar Slack/Discord webhook = un nuevo listener en el bus.

## Level 7: Offline Delivery

**Estrategia dual:**

1. **ConnectionStateRecovery** (Socket.IO v4+): Restaura rooms y datos del socket
   si la reconexión ocurre dentro de 2 minutos (maxDisconnectionDuration: 120000ms).
2. **DB Fallback**: Si recovery falla, consultar mentions pendientes (isRead: false)
   y entregar via 'mention:backlog'.

**Índice compuesto en mentions:** (mentioned_user_id, is_read, created_on)

## Level 8: Hardening (Producción)

**Archivos:** `../rateLimiter.js`, `../monitor/metrics.js`, `../monitor/middleware.js`

### Rate Limiting

- Token Bucket por IP (conexiones: 100/min) y por usuario (eventos: 30/s)
- Previene abuso y picos de tráfico al servidor WebSocket
- Middleware ejecutado antes de cualquier handler de evento
- Cleanup automático de buckets al desconectar el socket

### Monitoreo (Prometheus)

- 5 métricas personalizadas: usuarios conectados, eventos totales, latencia, errores, reconexiones
- Endpoint `GET /metrics` servido por Express en `/metrics`
- Grafana puede consumir estas métricas para dashboards en tiempo real

### Endpoint de métricas

```bash
curl http://localhost:3000/metrics
```

## Level 9: WSS + Docker Deployment

**Arquitectura:**

```
Cliente → WSS (443) → NGINX → HTTP (3000) → Express + Socket.IO
```

**Servicios Docker:**

- `api` — Express + Socket.IO (puerto 3000)
- `nginx` — Reverse proxy con TLS (puertos 80/443)
- `prometheus` — Recolección de métricas (puerto 9090)
- `grafana` — Dashboards (puerto 3001)

**Comandos:**

```bash
# Generar certificado self-signed
mkdir -p ssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx.key -out ssl/nginx.crt

# Iniciar todo
docker-compose up -d

# Verificar
curl https://localhost/api/v1/health -k
curl https://localhost/metrics -k
```

**Cliente:** VITE_WS_URL=wss://api.tudominio.com

## Level 10: Scaling

### Decision Tree

```
¿Un solo servidor alcanza? → Sí → Fin
       ↓ No
¿CPU limitada? → PM2 cluster (más instancias)
       ↓ No
¿Muchos usuarios concurrentes? → Redis adapter (más servidores)
       ↓ No
¿Necesitas K8s? → Kubernetes (orquestación completa)
```

### Migration Path

1. **Single instance** — desarrollo local, <100 usuarios simultáneos
2. **PM2 cluster** — `pm2 start ecosystem.config.js` (usa todos los núcleos)
3. **Redis adapter** — `REDIS_URL=redis://...` (múltiples servidores)
4. **Kubernetes** — orquestación completa con auto-scaling

### Environment Variables

| Variable  | Descripción           | Default                          |
| --------- | --------------------- | -------------------------------- |
| REDIS_URL | URL de conexión Redis | (sin Redis = adapter en memoria) |
