# websocket-learning-level-01 Specification

## Purpose

Nivel 01 del itinerario de aprendizaje de WebSocket: un servidor Socket.IO mínimo ("Hello WebSocket") con ciclo de conexión, evento de bienvenida, notificación de desconexión, manejo de errores, validación CORS y apagado ordenado.

## Requirements

### Requirement: Connection Handshake

El servidor Socket.IO SHALL correr en el puerto 3001, aceptar conexiones de `socket.io-client` v4, registrar cada conexión y emitir un evento `welcome` con payload `{ message, timestamp }`.

#### Scenario: Cliente conecta al servidor

- **GIVEN** the Socket.IO server is running on port 3001, **WHEN** a browser connects using `socket.io-client` v4, **THEN** the server logs "🟢 Cliente conectado: {socketId}"
- **AND** the server emits a "welcome" event
- **AND** the welcome payload contains `{ message: string, timestamp: string }`

### Requirement: Welcome Event

El cliente SHALL mostrar el payload del evento `welcome` al recibirlo.

#### Scenario: Cliente recibe la bienvenida

- **GIVEN** a client is connected to the server, **WHEN** the "welcome" event is received, **THEN** the client console shows "🎉 Conectado al servidor WebSocket"
- **AND** the client console shows the welcome payload

### Requirement: Disconnection Notification

El servidor SHALL registrar cada desconexión con su motivo.

#### Scenario: Cliente desconecta

- **GIVEN** a client is connected to the server, **WHEN** the client disconnects (closes tab, navigates away, network drops), **THEN** the server logs "🔴 Cliente desconectado: {socketId}"
- **AND** the server log includes the disconnect reason

### Requirement: Error Handling

El servidor SHALL registrar los errores de transporte de cualquier conexión.

#### Scenario: Error de transporte

- **GIVEN** the server is running, **WHEN** a transport error occurs on any connection, **THEN** the server logs "⚠️ Error en socket: {errorMessage}"

### Requirement: CORS Validation

El servidor SHALL aceptar conexiones únicamente desde los orígenes permitidos (`cors.origin = ['http://localhost:5173']`).

#### Scenario: Origen no permitido

- **GIVEN** the server is configured with `cors.origin = ['http://localhost:5173']`, **WHEN** a connection attempt comes from origin 'http://evil-site.com', **THEN** the connection is rejected
- **AND** the client receives a CORS error

### Requirement: Graceful Shutdown

El servidor SHALL cerrar el proceso de forma ordenada ante SIGINT/SIGTERM, cerrando todas las conexiones.

#### Scenario: Apagado ordenado

- **GIVEN** the server is running, **WHEN** the process receives SIGINT or SIGTERM, **THEN** the server logs "🛑 Cerrando servidor WebSocket..."
- **AND** all socket connections are closed gracefully
- **AND** the process exits with code 0
