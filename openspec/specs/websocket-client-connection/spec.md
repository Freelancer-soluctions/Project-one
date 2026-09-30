# websocket-client-connection Specification

## Purpose

Gestiona el ciclo de conexión del cliente Socket.IO: conexión, reconexión, apagado ordenado y página de prueba.

## Requirements

### Requirement: Socket.IO client connection lifecycle

The system SHALL provide a Socket.IO client that connects to the server at `http://localhost:3001`, handles the full connection lifecycle (connect, disconnect, reconnect, connect_error), supports bidirectional communication via custom events, and performs graceful shutdown on termination.

The client SHALL exist in two forms:

1. **Node.js client** (`level-03-client.js`) — educational script with every line commented in Spanish
2. **Browser client** (`test-client.html`) — self-contained HTML page with CDN-loaded socket.io

#### Scenario: Client connects to server successfully

- **WHEN** the client initializes a connection to `http://localhost:3001` using `io()` with transports `['websocket', 'polling']`
- **THEN** the `connect` event SHALL fire on the client
- **AND** the client SHALL log the transport mechanism used (e.g., "websocket", "polling")

#### Scenario: Client receives welcome event from server

- **WHEN** the client receives the `welcome` event from the server
- **THEN** the client SHALL display the welcome message payload in the console/log area

#### Scenario: Client emits client:ping events periodically

- **WHEN** the client is connected
- **THEN** the client SHALL emit a `client:ping` event every 5 seconds with a timestamp payload `{ time: <ISO timestamp> }`
- **AND** the client SHALL log each emission to the console/log area

#### Scenario: Client handles server disconnection

- **WHEN** the server stops or the connection drops unexpectedly
- **THEN** the `disconnect` event SHALL fire on the client
- **AND** the client SHALL log the disconnection reason

#### Scenario: Client auto-reconnects after connection loss

- **WHEN** the connection is lost and `reconnection` is enabled (default)
- **THEN** the `reconnect_attempt` event SHALL fire with the attempt number
- **AND** the client SHALL log each reconnection attempt
- **AND** the `reconnect` event SHALL fire when reconnection succeeds

### Requirement: Graceful shutdown

The system SHALL support graceful shutdown for the Node.js client.

#### Scenario: Client disconnects cleanly on SIGINT

- **WHEN** the user presses Ctrl+C (SIGINT) while the client is connected
- **THEN** the client SHALL call `socket.disconnect()` before the process exits
- **AND** the client SHALL log "Cliente desconectado correctamente" to the console

### Requirement: Test client HTML page

The system SHALL provide a self-contained HTML page for browser-based testing.

#### Scenario: User connects via browser page

- **WHEN** the user opens `test-client.html` in a browser and clicks "Conectar"
- **THEN** a connection SHALL be established to the server at `http://localhost:3001`
- **AND** the connection status indicator SHALL update to "Conectado"
- **AND** incoming events SHALL appear in the log area

#### Scenario: User disconnects via browser page

- **WHEN** the user clicks "Desconectar" while connected
- **THEN** the client SHALL disconnect from the server
- **AND** the connection status indicator SHALL update to "Desconectado"

### Requirement: React Hook useSocket

El hook `useSocket` SHALL gestionar una conexión Socket.IO compartida para los componentes React, exponiendo el estado de conexión y limpiando los listeners al desmontar.

#### Scenario: Conexión establecida al montar

- **GIVEN** el componente Notes está montado, **WHEN** el hook ejecuta `socket.connect()` hacia `localhost:3001`, **THEN** la conexión SHALL establecerse

#### Scenario: Desconexión al desmontar

- **GIVEN** el componente se desmonta, **WHEN** se ejecuta el cleanup de `useEffect`, **THEN** `socket.disconnect()` SHALL ejecutarse

#### Scenario: Estado conectado

- **GIVEN** una conexión exitosa, **WHEN** el socket emite `connect`, **THEN** `isConnected` SHALL pasar a `true`

#### Scenario: Estado de error

- **GIVEN** una conexión fallida, **WHEN** el socket emite `connect_error`, **THEN** `isError` SHALL pasar a `true`

#### Scenario: Singleton bajo Strict Mode

- **GIVEN** Strict Mode con doble montaje, **WHEN** ocurre el segundo mount, **THEN** `socketRef` SHALL prevenir la duplicación de conexión (singleton a nivel de módulo)
