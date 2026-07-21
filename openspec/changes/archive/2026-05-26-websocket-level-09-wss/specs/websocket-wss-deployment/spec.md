## ADDED Requirements

### Requirement: WSS Connection Upgrade
The system SHALL terminate TLS at NGINX and upgrade WebSocket connections to WS internally to Node.js on port 3000.

#### Scenario: Client connects via wss://
- **GIVEN** client connects via wss://api.example.com
- **WHEN** NGINX terminates TLS
- **THEN** connection upgrades to WS internally to Node.js on port 3000

### Requirement: NGINX Upgrade Headers
NGINX SHALL be configured with proxy_http_version 1.1 and proper Upgrade headers to proxy WebSocket connections.

#### Scenario: WebSocket upgrade request forwarded
- **GIVEN** NGINX configured with proxy_http_version 1.1 and Upgrade headers
- **WHEN** client sends WebSocket upgrade request
- **THEN** NGINX forwards Upgrade and Connection headers

### Requirement: Service Health
All services in the Docker Compose stack SHALL report healthy status after startup.

#### Scenario: All containers start successfully
- **GIVEN** Docker compose runs with all services
- **WHEN** all containers start
- **THEN** API, NGINX, Prometheus, and Grafana all report healthy status

### Requirement: TLS Certificate Validity
The system SHALL reject or fail WSS connections when the TLS certificate is invalid or expired.

#### Scenario: Valid TLS certificate handshake
- **GIVEN** TLS certificate is valid and not expired
- **WHEN** client connects via wss://
- **THEN** SSL handshake succeeds without errors

### Requirement: HTTP Path Proxying
NGINX SHALL proxy regular HTTP requests to Node.js for paths under /socket.io/ even when they are not WebSocket upgrade requests.

#### Scenario: Normal GET request proxied
- **GIVEN** a regular HTTP request hits NGINX path /socket.io/
- **WHEN** the path is a normal GET
- **THEN** NGINX still proxies it correctly to Node.js
