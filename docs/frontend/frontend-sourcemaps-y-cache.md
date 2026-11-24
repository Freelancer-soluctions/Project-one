# Frontend: source maps ocultos y política de cache

Implementa el change `ci-frontend-sourcemaps-cache`. Cubre dos cosas que van juntas: **mapas de
producción** para depurar errores reales y **cache inmutable** para los assets con hash, sin servir
nunca los `.map` desde el servidor estático.

---

## 1. Source maps ocultos (`sourcemap: 'hidden'`)

`apps/client/vite.config.js`:

```js
build: {
  sourcemap: 'hidden',
},
```

| Modo           | Emite `.map` | El bundle referencia el mapa (`//# sourceMappingURL`) | El navegador descarga el `.map` |
| -------------- | ------------ | ----------------------------------------------------- | ------------------------------- |
| `false`        | No           | No                                                    | No                              |
| `true`         | Sí           | Sí                                                    | Sí (DevTools)                   |
| **`'hidden'`** | **Sí**       | **No**                                                | **No**                          |

`'hidden'` es lo que pide el PRD: el mapa existe para el sistema de errores, pero el usuario final
nunca lo pide ni puede reconstruir el fuente desde DevTools.

Medición del build actual:

```bash
npm run build --workspace=client-react
find apps/client/dist -name '*.map' | wc -l          # 69
grep -rl sourceMappingURL apps/client/dist --include='*.js' | wc -l   # 0
```

---

## 2. Los `.map` NO se publican

`apps/server/nginx.conf` bloquea explícitamente el patrón:

```nginx
location ~* ^/assets/.+\.map$ {
    return 404;
}
```

Es defensa en profundidad: aunque el volumen que monta el build incluya los `.map`, nginx no los
sirve. Sin esto, cualquiera con la URL del asset puede pedir `foo.js.map` y obtener el código fuente
original, que es justo lo que `'hidden'` intenta evitar.

## 3. Subida al sistema de errores

Los `.map` se suben desde el artefacto de build, **antes** de publicar el estático. El proveedor no
está elegido todavía (no hay SDK ni DSN en el repo), así que el paso queda como contrato:

```bash
# Ejemplo con sentry-cli; sustituir por el CLI del proveedor que se adopte.
npm run build --workspace=client-react
sentry-cli sourcemaps upload \
  --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" \
  --url-prefix '~/assets' \
  apps/client/dist/assets
```

Requisitos del paso, sea cual sea el proveedor:

- Correr **después** del build y **antes** del deploy del estático.
- Mantener el `url-prefix` igual al path público (`/assets/`), o los mapas no aplican.
- Fallar el job si la subida falla: un deploy sin mapas deja los errores de prod sin symbolicate.
- No publicar el directorio `dist/assets/*.map` en el hosting estático.

Pendiente: no existe todavía job de CI que ejecute esta subida (el build del client en CI solo
verifica que compila). Al elegir proveedor, añadirlo al workflow como paso posterior al build.

---

## 4. Cache-Control en nginx

En el vhost 443 de `apps/server/nginx.conf`:

| Ruta                              | `Cache-Control`                            | Motivo                                                                  |
| --------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `/assets/*` (con hash)            | `public, max-age=31536000, immutable`      | el nombre cambia si cambia el contenido: cachear un año es seguro       |
| `/index.html` (y `/` por `index`) | `no-cache`                                 | es el que apunta a los bundles con hash: si se cachea, se sirven viejos |
| rutas del router (SPA)            | `no-cache` (redirect interno a index.html) | `try_files ... /index.html` re-evalúa `location = /index.html`          |

Detalle importante de nginx: **`add_header` no se hereda** del bloque `server` cuando la `location`
declara sus propios `add_header`. Por eso las locations nuevas repiten
`Strict-Transport-Security`, `X-Content-Type-Options` y `X-Frame-Options`; si se omiten, esos
headers de seguridad desaparecen justo en los assets.

El build se monta en `/usr/share/nginx/html` (valor por defecto de la imagen `nginx:alpine`; queda
explícito con `root` en el config). El fallback `location / { try_files $uri $uri/ /index.html; }`
es lo que hace funcionar las rutas del router React al recargar.

---

## 5. Verificación

```bash
# 1) mapas emitidos y no referenciados
npm run build --workspace=client-react

# 2) headers reales (nginx con el config y el dist montados)
curl -skI https://localhost:8443/assets/<asset>.js | grep -i cache-control
#   Cache-Control: public, max-age=31536000, immutable
curl -skI https://localhost:8443/index.html | grep -i cache-control
#   Cache-Control: no-cache
curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:8443/assets/<asset>.js.map
#   404
```

Resultado medido (2026-11-18, `nginx:alpine` con `apps/server/nginx.conf` + `apps/client/dist`):

| Petición                     | Resultado                                                  |
| ---------------------------- | ---------------------------------------------------------- |
| `GET /assets/<asset>.js`     | 200 · `Cache-Control: public, max-age=31536000, immutable` |
| `GET /assets/<asset>.js.map` | 404                                                        |
| `GET /index.html`            | 200 · `Cache-Control: no-cache`                            |
| `GET /productos/123` (SPA)   | 200 · `Cache-Control: no-cache`                            |
| `GET http://…/`              | 301 → `https://api.tudominio.com/`                         |
| `GET /api/health`            | 502 (proxied; la ruta sigue intacta)                       |

## 6. Determinismo del build

Con el mismo árbol de entrada, dos `vite build` seguidos producen los mismos nombres con hash:

```bash
ls apps/client/dist/assets > /tmp/b1
npm run build --workspace=client-react
ls apps/client/dist/assets > /tmp/b2
diff /tmp/b1 /tmp/b2   # sin diferencias (139 archivos, sha256 idénticos)
```

Es la condición que hace segura la cache `immutable`: si el nombre cambiara entre builds del mismo
commit, cada deploy invalidaría todo el cache sin motivo.

---

## 7. Referencias

- Change: `openspec/changes/ci-frontend-sourcemaps-cache/`
- Config: `apps/client/vite.config.js`, `apps/server/nginx.conf`
- Vite `build.sourcemap`: <https://vite.dev/config/build-options#build-sourcemap>

## 7. Gates automatizados en CI (añadidos 2026-11-19)

Para que la verificación no dependa solo de pasos manuales, `build.yml` incluye dos jobs:

- **`frontend-determinism`**: ejecuta `vite build` dos veces y compara con `sha256sum` los archivos de `dist/assets/*.js`; falla si difieren (regresión de determinismo).
- **`frontend-headers-smoke`**: levanta `nginx:alpine` con el `nginx.conf` del repo y el `dist/` montado, y verifica con `curl`:
  - `Cache-Control: public, max-age=31536000, immutable` en assets con hash.
  - `Cache-Control: no-cache` en `index.html`.
  - `404` en cualquier `.map`.

Ambos jobs tienen `timeout-minutes: 10` y permisos mínimos (`contents: read`). El YAML valida con `actionlint` (EXIT 0).
