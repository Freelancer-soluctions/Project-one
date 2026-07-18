## Context

The project currently runs Express (HTTP only) behind direct port access. Levels 1–8 of the WebSocket curriculum covered foundation, authentication, rooms, events, integration testing, offline resilience, and hardening — all over unencrypted WS.

Production-grade WebSocket requires WSS (Secure WebSocket) to prevent man-in-the-middle attacks, ensure data privacy, and meet compliance requirements. This design introduces NGINX as a TLS-terminating reverse proxy with WSS upgrade support, wraps the application in Docker Compose with monitoring services (Prometheus, Grafana), and provides a Node 18 Alpine Dockerfile with efficient layer caching.

## Goals / Non-Goals

**Goals:**
- Terminate TLS at NGINX, proxy WebSocket Upgrade/Connection headers to Node.js
- Serve the Express API (port 3000) behind NGINX (port 443) with WSS support
- Provide a Docker Compose stack with API, NGINX, PostgreSQL, pgAdmin, Prometheus, and Grafana
- Build a minimal, production-ready Dockerfile with Node 18 Alpine and layer caching
- Include HSTS headers, restricted TLS protocols (v1.2, v1.3), and modern ciphers
- Create an educational demo file (`level-10-wss.js`) demonstrating WSS behind NGINX, commented in Spanish

**Non-Goals:**
- No changes to application business logic
- No modifications to existing modules, controllers, services, or Prisma schema
- No CI/CD pipeline changes (deployment orchestration is out of scope)
- No load balancing or clustering (single NGINX + single Node.js instance)
- No automated TLS certificate provisioning (certbot/Let's Encrypt setup is documented but not automated)

## Decisions

### 1. NGINX as TLS Terminator (not Node.js)
**Why**: NGINX is battle-tested for TLS termination, handles SSL/TLS configuration more efficiently than Node.js, and allows centralizing certificate management. The Node.js process remains simpler without certificate loading logic.

**Alternatives considered**:
- Node.js `https` module with certificates — more code in app, SSL config mixed with app config
- Caddy — simpler config but not already in the project's skillset; NGINX is more widely documented for WSS

### 2. proxy_read_timeout 86400s
**Why**: Socket.IO default ping timeout is 120s with a ping interval of 25s. Setting NGINX proxy read timeout to 86400s (24h) prevents NGINX from closing idle WebSocket connections prematurely. This is the industry-standard approach for long-lived WebSocket proxies.

### 3. WebSocket Upgrade Headers
**Why**: NGINX needs explicit `Upgrade` and `Connection` header forwarding for WebSocket to work. Using `proxy_http_version 1.1` is required because HTTP/1.1 is the minimum for WebSocket upgrade.

### 4. Node 18 Alpine Docker Image
**Why**: Alpine-based images are ~5× smaller than full Debian-based images (160MB vs 900MB+). Node 18 matches the project's current runtime requirement. Layer caching (dependencies → code) optimizes rebuild speed.

### 5. Docker Compose Monitoring Stack
**Why**: Prometheus + Grafana provide production observability with minimal overhead. Prometheus scrapes the Node.js metrics endpoint; Grafana visualizes dashboards. Both are industry standards.

**Alternatives considered**:
- Datadog/New Relic — SaaS cost, external dependency not needed for this deployment
- ELK stack — heavier than needed; we want metrics, not full log aggregation

### 6. HSTS + TLS Protocol Restrictions
**Why**: HSTS (Strict-Transport-Security) forces browsers to always use HTTPS, preventing SSL stripping attacks. Restricting to TLSv1.2 and TLSv1.3 removes obsolete, vulnerable protocols (SSLv3, TLSv1.0, TLSv1.1).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| NGINX config error breaks both HTTP and WSS | Validate config with `nginx -t` before reload; keep a backup of the previous config |
| Long proxy_read_timeout holds stale connections | Socket.IO heartbeat mechanism and ping timeout naturally close dead connections on the app side |
| Alpine base image has different libc (musl) | Test all native dependencies (Prisma, bcrypt) against musl; use `prisma generate` in the Dockerfile |
| Certificates expire | Document certbot renewal command; add reminder for `crontab` renewal automation in README |
| Port 443 requires privileged or root | Map host port 443 → container port 443 or use a port >1024 in development |

## Migration Plan

1. Create `nginx.conf` with TLS, WSS upgrade, HSTS, and security headers
2. Create `Dockerfile` with Node 18 Alpine and layer caching
3. Update `docker-compose.yml` to add `api`, `nginx`, `prometheus`, `grafana` services
4. Create test SSL certificates (self-signed for development)
5. Build and test the full stack: `docker compose up --build`
6. Verify WSS connectivity: `wscat -n wss://localhost`
7. Create `level-10-wss.js` educational demo
8. Update README with deployment guide

## Open Questions

- Should we use self-signed certs for dev or integrate certbot in the Docker Compose stack? → Decision: Self-signed for dev (document certbot for production)
- Should Prometheus scrape config be embedded in compose or external? → Decision: External `prometheus.yml` mounted as a volume for flexibility
