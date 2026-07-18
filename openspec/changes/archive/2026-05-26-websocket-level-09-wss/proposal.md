## Why

Production WebSocket requires WSS (secure WebSocket), proper reverse proxy, TLS termination, and Docker deployment. NGINX is the industry standard for this. Levels 1-8 have covered foundation, auth, rooms, events, integration, offline, and hardening. Level 9 deploys to production with WSS, NGINX reverse proxy, and Docker Compose.

## What Changes

- NGINX configuration with WSS reverse proxy support, TLS termination, and WebSocket upgrade headers
- Dockerfile for Node.js API service (Node 18 alpine)
- Docker Compose update adding API service, NGINX, Prometheus, and Grafana services
- New educational level-10-wss.js demo server showing WSS behind NGINX
- README update with deployment guide

## Capabilities

### New Capabilities
- `websocket-wss-deployment`: Production-grade WebSocket deployment with WSS, NGINX reverse proxy, TLS termination, orchestrated via Docker Compose with monitoring services

### Modified Capabilities
- (none — no existing spec-level behavior is changing)

## Impact

- **Infrastructure**: New NGINX reverse proxy, Dockerfile, updated docker-compose.yml
- **Dependencies**: nginx:alpine Docker image, Let's Encrypt / certbot for TLS
- **Code**: New educational demo file at apps/server/src/socket/levels/level-10-wss.js
- **Configuration**: New nginx.conf, updated docker-compose.yml
- **Documentation**: README deployment guide updates
