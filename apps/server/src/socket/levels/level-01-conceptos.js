// ============================================================
// LEVEL 01: Conceptos Fundamentales de WebSocket + Socket.IO
// ============================================================
//
// PROPÓSITO:
//   Este archivo es puramente educativo. Explica los conceptos
//   detrás de WebSocket y Socket.IO antes de escribir código.
//
// ------------------------------------------------------------
// 1. ¿Qué es WebSocket?
// ------------------------------------------------------------
// WebSocket es un protocolo de comunicación bidireccional sobre
// una única conexión TCP persistente. A diferencia de HTTP:
//
//   HTTP  → Cliente pide, servidor responde (unidireccional)
//   WS    → Cliente y servidor se envían mensajes cuando quieran
//
// Casos de uso: chats, notificaciones en vivo, colaboración en
// tiempo real, dashboards, juegos multijugador.
//
// ------------------------------------------------------------
// 2. ¿Por qué Socket.IO y no WebSocket puro?
// ------------------------------------------------------------
// WebSocket puro requiere manejar manualmente:
//   - Reconexión automática
//   - Rooms (canales de suscripción)
//   - Fallback a HTTP long-polling cuando WS no está disponible
//   - Eventos con nombres (vs mensajes raw)
//
// Socket.IO resuelve todo esto con una API simple.
// En producción: mismo servidor HTTP, middleware de autenticación,
// Redis adapter para escalar (todo en niveles siguientes).
//
// ------------------------------------------------------------
// 3. Flujo de una conexión Socket.IO
// ------------------------------------------------------------
// Cliente                      Servidor
//   │                             │
//   │───── HTTP handshake ───────→│  (transporte: polling o WS)
//   │←──── 200 OK (101 upgrade) ──│
//   │══════ WebSocket full duplex ═│
//   │───── emit('evento', data) → │
//   │←──── emit('otro', data) ────│
//   │───── disconnect ──────────→│
//
// ------------------------------------------------------------
// 4. Conceptos Clave
// ------------------------------------------------------------
// Namespace  → Canal de comunicación (/ por defecto)
// Room       → Subconjunto de sockets en un namespace
// Evento     → Mensaje con nombre (ej: 'mention:new')
// Middleware → io.use() → se ejecuta en cada conexión
// Adapter    → Backend que sincroniza eventos entre instancias
//
// ------------------------------------------------------------
// 5. Puertos en este proyecto
// ------------------------------------------------------------
// 3000 → Express (API REST)
// 3001 → Socket.IO (servidor principal WS, montado sobre Express)
// 3002+ → Niveles educativos con servidores independientes
//
// ------------------------------------------------------------
// PRÓXIMO NIVEL → level-02-server.js
//   Implementa el servidor Socket.IO mínimo (puerto 3001)
// ------------------------------------------------------------
