## Context

El Level 1 implementó un servidor Socket.IO en `apps/server/src/socket/levels/level-02-server.js` que escucha en el puerto 3001, loggea conexiones y emite un evento `welcome` al cliente conectado. Sin embargo, no existe ningún cliente que consuma ese servidor, por lo que no es posible validar el funcionamiento del servidor ni experimentar con la comunicación bidireccional.

Este nivel (Level 2) añade el lado cliente: un cliente Node.js educativo y una página HTML autocontenida para navegador. Ambos se conectan al servidor existente sin modificarlo.

**Restricciones:**
- El servidor Level 1 no se modifica
- socket.io-client se añade como dependencia en `apps/server/`
- El cliente Node.js debe tener cada línea comentada en español con intención educativa
- El cliente HTML debe ser self-contained (sin build step, CDN para socket.io)

## Goals / Non-Goals

**Goals:**
- Enseñar el lifecycle de conexión de Socket.IO desde el lado cliente
- Proporcionar herramientas de prueba manual (Node.js + navegador)
- Documentar el flujo handshake, negociación de transporte, reconexión y graceful shutdown
- Mantener compatibilidad total con el servidor Level 1 existente

**Non-Goals:**
- No se modifica el servidor existente
- No se añaden namespaces personalizados (solo el default `/`)
- No se implementan salas (rooms) ni eventos de broadcast
- No se añaden tests automatizados (solo prueba manual)
- No se configura autenticación ni middleware de cliente

## Decisions

### 1. URL de conexión: `http://localhost:3001`

| Opción | Decisión |
|--------|----------|
| ✅ `http://localhost:3001` | Socket.IO negocia automáticamente el upgrade a WebSocket |
| ❌ `ws://localhost:3001` | Evita el polling inicial, pero Socket.IO internamente prefiere la URL HTTP |

**Razón**: Socket.IO usa HTTP como transporte inicial para handshake, luego negocia el upgrade a WebSocket (`websocket`). Usar `ws://` directamente salta la negociación y puede romper si el servidor depende del handshake HTTP. La URL HTTP es la práctica recomendada por la documentación oficial.

### 2. Namespace: `'/'` (default)

**Razón**: El servidor Level 1 usa el namespace default. No hay necesidad de namespaces adicionales para este nivel educativo. Si en el futuro se necesitan múltiples canales, se pueden añadir sin cambiar la lógica base.

### 3. Transports: `['websocket', 'polling']`

**Razón**: Socket.IO intenta WebSocket primero; si falla (firewall, proxy), degrada gracefulmente a HTTP long-polling. Esta configuración es el estándar de producción y educativamente muestra el concepto de negociación de transporte. El orden importa: Socket.IO prueba en el orden dado.

### 4. Reconnection: activada por defecto, backoff exponencial con jitter

Socket.IO cliente tiene reconnection habilitada por defecto. La estrategia de backoff es:

- `reconnectionDelay`: 1000ms (espera inicial)
- `reconnectionDelayMax`: 5000ms (espera máxima)
- `randomizationFactor`: 0.5 (jitter — añade aleatoriedad ±50% para evitar thundering herd)

**Razón**: El backoff exponencial evita saturar el servidor en reinicios. El jitter distribuye los reintentos para evitar picos de reconexión simultánea. Estos valores por defecto son apropiados para un entorno de desarrollo/educativo. Se documentan en los comentarios del cliente Node.js.

### 5. Eventos del cliente a manejar

| Evento | Propósito |
|--------|-----------|
| `connect` | Conexión establecida, mostrar transporte usado |
| `welcome` | Mensaje de bienvenida del servidor (recibido) |
| `disconnect` | Desconexión voluntaria o por cierre del servidor |
| `connect_error` | Error de conexión (servidor caído, red) |
| `reconnect_attempt` | Intento de reconexión con número de intento |
| `reconnect` | Reconexión exitosa |

### 6. Instalación: `socket.io-client` v4

**Razón**: socket.io-client v4 es compatible con la versión del servidor Socket.IO v4 del Level 1. Se importa con sintaxis ES Module (`import { io } from 'socket.io-client'`).

### 7. Cliente Node.js: ES Module (`type: module` en apps/server)

**Razón**: apps/server ya tiene `"type": "module"` en package.json, por lo que el cliente usa `import` nativo. Esto simplifica la ejecución: `node src/socket/levels/level-03-client.js`.

### 8. Cliente HTML: CDN + vanilla JS

**Razón**: Elimina la necesidad de build step. El usuario abre el archivo directamente en el navegador. Se usa CDN (`https://cdn.socket.io/4.7.5/socket.io.min.js`) que carga `io` como global.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| [CDN caído] El cliente HTML no carga si la CDN está inaccesible | Incluir versión específica (4.7.5) con SRI hash. El cliente Node.js no depende de CDN. |
| [Puerto ocupado] El servidor Level 1 no está corriendo | Los clientes muestran error claro (`connect_error`) y reintentan automáticamente. |
| [Firewall corporativo] Bloqueo de WebSocket | Transport `polling` como fallback. El cliente HTML muestra el transporte activo en el log. |
| [Versiones incompatibles] socket.io-client v4 con server v4 | Socket.IO v4 tiene retrocompatibilidad dentro de major version. Se fija versión en package.json. |
| [Múltiples clientes] Dos clientes conectados simultáneamente | Sin impacto — el servidor maneja múltiples conexiones sin estado compartido. |


## 9. React Hook: useSocket

### Arquitectura
- **Singleton a nivel de modulo**: Variable `let socket` fuera del hook. En Strict Mode (React 18 dev), `useEffect` cleanup + re-run no crea conexion duplicada.
- **useRef para seguimiento**: `const socketRef = useRef(null)` previene re-conexion en re-renders.
- **cleanup en useEffect**: `socket.disconnect()` al desmontar el componente.

### Estado retornado
```js
return { socket, isConnected, isError }
```

- `isConnected`: booleano, cambia en eventos `connect` / `disconnect`.
- `isError`: booleano, cambia en evento `connect_error`.

### Integracion en Notes.jsx
- `const { isConnected } = useSocket()` sin dependencias externas (nivel 2).
- Indicador visual: circulo verde (conectado) / rojo (desconectado).
- Eventos manejados con `socket.on()` dentro del mismo hook.
