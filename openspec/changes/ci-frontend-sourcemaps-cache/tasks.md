# Tasks

## 1. Source maps

- [x] 1.1 Habilitar `build.sourcemap: 'hidden'` en `apps/client/vite.config.js`.
- [x] 1.2 Ejecutar `npm run build --workspace=apps/client` y verificar que se generan `.map` en `dist/assets/` y que el `.js` no referencia el `.map`.
- [x] 1.3 Documentar en `docs/` que los `.map` se suben al sistema de errores y NO se publican en el servidor estático.

## 2. Cache-Control

- [x] 2.1 Añadir a nginx (o config de entrega): `location /assets/` con `Cache-Control: public, max-age=31536000, immutable`.
- [x] 2.2 Añadir a `index.html`: `Cache-Control: no-cache`.
- [x] 2.3 Verificar con curl que los headers se sirven correctamente.

## 3. Determinismo

- [x] 3.1 Ejecutar dos `vite build` seguidos y comparar nombres de assets (deben ser idénticos).

## Resultado de la verificación (2026-11-18)

- **Source maps:** `build.sourcemap: 'hidden'` en `apps/client/vite.config.js`. Build → EXIT 0 con
  **69 `.map`** y **69 `.js`** en `dist/assets/`; `grep -rl sourceMappingURL dist --include='*.js'`
  → **0 archivos** (el bundle no referencia el mapa).
- **Cache-Control:** `apps/server/nginx.conf` (el único nginx de entrega del repo) gana un bloque
  estático: `root /usr/share/nginx/html`, `location /assets/` con
  `public, max-age=31536000, immutable`, `location = /index.html` con `no-cache`, fallback SPA
  `location / { try_files $uri $uri/ /index.html; }` y `location ~* ^/assets/.+\.map$ { return 404; }`.
  Las locations repiten los headers de seguridad porque `add_header` no se hereda cuando la location
  declara los suyos.
- **curl contra nginx real** (`nginx:alpine` + config del repo + `dist` montado, con `--add-host api`):
  `/assets/<asset>.js` → 200 con `Cache-Control: public, max-age=31536000, immutable`;
  `/assets/<asset>.js.map` → **404**; `/index.html` → 200 con `no-cache`; `/productos/123` (SPA) →
  200 con `no-cache`; `http://…/` → 301 a https; `/api/health` → 502 (proxied, ruta intacta).
- **Determinismo:** dos `vite build` seguidos → mismos **139** archivos en `dist/assets` y `sha256`
  idénticos (nombres y contenido).
- **Documentación:** `docs/frontend-sourcemaps-y-cache.md` (modos de sourcemap, bloqueo de `.map`,
  contrato de subida al sistema de errores, tabla de headers y comandos de verificación).
- **Alcance real:** el repo no tenía config de entrega del frontend (solo el vhost API/WS), así que
  el bloque estático se añadió a ese mismo vhost y se documentó el punto de montaje
  `/usr/share/nginx/html`. Queda pendiente (fuera de este change) el job de CI que sube los `.map`.
