## Why

Level 1 creó el servidor Socket.IO en puerto 3001 con logging de conexiones y un archivo teórico de conceptos. Pero sin un cliente, no hay forma de probar ni validar que el servidor funciona. Este nivel enseña el lado cliente de Socket.IO: cómo un cliente (Node.js o navegador) se conecta al servidor, el lifecycle de conexión, y la comunicación bidireccional.

El objetivo es que el usuario entienda el flujo completo cliente-servidor y pueda probar manualmente lo que construyó en Level 1.

## What Changes

- Crear `apps/server/src/socket/levels/level-03-client.js` — Cliente de prueba en Node.js que se conecta al servidor del Level 1
  - Usa `socket.io-client` para conectarse a `http://localhost:3001`
  - Escucha eventos: 'connect', 'disconnect', 'connect_error', 'reconnect_attempt', 'reconnect'
  - Recibe evento 'welcome' del servidor y lo muestra en consola
  - Emite evento 'client:ping' con timestamp cada 5 segundos
  - Maneja reconexión automática
  - Graceful shutdown con SIGINT (desconexión limpia antes de salir)
  - CADA línea comentada en español explicando conceptos (transporte, handshake, reconnection, jitter)
- Crear `apps/server/src/socket/levels/test-client.html` — Página HTML de prueba para navegador
  - Carga socket.io-client desde CDN
  - Botón conectar/desconectar
  - Indicador de estado de conexión
  - Área de log de mensajes
  - Sin build step (self-contained)
- Instalar `socket.io-client` como dependencia en `apps/server/`
- Actualizar README.md con instrucciones del Level 2

## Capabilities

### New Capabilities
- `websocket-client-connection`: Cliente Socket.IO que se conecta al servidor WebSocket, maneja el lifecycle completo (connect, disconnect, reconnect, connect_error), y permite comunicación bidireccional. Cubre la comprensión del handshake, negociación de transporte (HTTP polling → WebSocket upgrade), reconnection con backoff y jitter, y graceful shutdown del lado cliente.

### Modified Capabilities
<!-- No se modifican capacidades existentes. Este cambio añade el lado cliente que complementa el servidor del Level 1 sin alterarlo. -->

## Impact

- **Nueva dependencia**: `socket.io-client` en `apps/server/package.json`
- **Nuevos archivos**: 
  - `apps/server/src/socket/levels/level-03-client.js` (cliente Node.js)
  - `apps/server/src/socket/levels/test-client.html` (cliente navegador)
- **Sin cambios en servidor existente**: El servidor Socket.IO del Level 1 (level-02-server.js) no se modifica
- **README actualizado**: Se añade sección del Level 2 con instrucciones de prueba
