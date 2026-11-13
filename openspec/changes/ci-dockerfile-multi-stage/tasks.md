# Tasks

## 1. Dockerfile multi-stage

- [ ] 1.1 Reescribir `apps/server/Dockerfile` con etapas base/deps/build/runtime según el PRD.
- [ ] 1.2 Fijar la imagen base por digest (`node:22-alpine@sha256:<DIGEST>`).
- [ ] 1.3 Etapa `deps`: copiar solo `package.json` + lockfile, `npm ci --ignore-scripts`, cache mount.
- [ ] 1.4 Etapa `build`: `COPY tsconfig...`, `COPY packages`, `RUN npx tsc -b && npm prune --omit=dev`.
- [ ] 1.5 Etapa `runtime`: copiar `node_modules` + `dist`, `USER app` (UID 1001), `CMD ["node", "packages/.../dist/index.js"]` o `tsx` según el paquete.
- [ ] 1.6 Añadir `HEALTHCHECK` contra `/health` y `dumb-init` como entrypoint.

## 2. .dockerignore y validación

- [ ] 2.1 Crear/actualizar `.dockerignore` (node_modules, **/dist, .git, .env*).
- [ ] 2.2 Ejecutar `docker build -t server:test .` y verificar tamaño de imagen.
- [ ] 2.3 Ejecutar el contenedor como UID 1001 y verificar respuesta `/health` 200.
- [ ] 2.4 Verificar que `npm prune --omit=dev` no elimina dependencias de runtime (tsx si se usa).

## 3. Documentación

- [ ] 3.1 Documentar en `docs/` el tamaño de imagen, digest base y módulos nativos probados.

## 4. Gaps del reviewer (2026-11-12)

- [ ] 4.1 Sustituir la validación manual `disabled_manually` de `deploy.yml` (`docker-build`) por el build local validado aquí (primer build real con Docker daemon).
- [ ] 4.2 Verificar que `--ignore-scripts` no rompe módulos nativos (ejecutar explícitamente los scripts necesarios, p.ej. `prisma generate`).
- [ ] 4.3 Confirmar que el arranque con usuario no root (UID 1001) responde `/health` 200 en el primer build real.