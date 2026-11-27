# Proposal

## Why

El frontend (`apps/client`) no genera source maps de producción (`build.sourcemap` no configurado en vite.config) y nginx no sirve `Cache-Control: immutable` para assets con hash ni `no-cache` para `index.html`. El PRD §"Frontend: bundling..." exige source maps ocultos (`.map` existe pero el `.js` no lo referencia, subidos al sistema de errores, no publicados) y cache inmutable en assets con hash. Sin mapas no es posible depurar errores en prod; sin cache headers se desperdicia la inmutabilidad de los nombres con hash.

## What Changes

- Habilitar `build.sourcemap: 'hidden'` en `apps/client/vite.config.js` (o `.ts`).
- Añadir a `apps/server/nginx.conf` (o el config de entrega): `location /assets/` con `Cache-Control: public, max-age=31536000, immutable` y `index.html` con `no-cache`.
- Verificar que dos `vite build` seguidos producen los mismos nombres con hash (determinismo).
- Documentar que los `.map` se suben al sistema de errores (Sentry u otro) y NO se publican en el servidor estático.

## Capabilities

- **New Capabilities**: `ci-frontend-sourcemaps-cache`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `apps/client/vite.config.js`, `apps/server/nginx.conf` (o config de entrega).
- Riesgo: bajo — solo añade mapas ocultos y headers; no cambia el bundle.
