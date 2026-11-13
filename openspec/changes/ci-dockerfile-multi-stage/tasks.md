# Tasks

> **Estado (2026-11-12):** implementación local completa. Las tareas que requieren **primer build
> real con Docker daemon** (2.2, 2.3, 4.1, 4.2b, 4.3) quedan **BLOQUEADAS**: el daemon Docker no
> está disponible en este entorno. El job `docker-build` de `deploy.yml` (stack emulado) ya es
> compatible con el nuevo Dockerfile y ejecutará esa validación al reactivarse (toggle de la UI de
> GitHub) o en una máquina con Docker. Ver `docs/learning/ci-cd/04c-docker-multistage-build.md`.

## 1. Dockerfile multi-stage

- [x] 1.1 Reescribir `apps/server/Dockerfile` con etapas base/deps/build/runtime según el PRD.
  - Evidencia: 4 etapas (`base`/`deps`/`build`/`runtime`); runtime ejecuta `node dist/bin/index.js` (sin tsx).
- [x] 1.2 Fijar la imagen base por digest (`node:22-alpine@sha256:<DIGEST>`).
  - Evidencia: `node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a` (OCI index multi-arch), re-verificado en `registry-1.docker.io` (Docker Hub oficial) 2026-11-12.
- [x] 1.2b Configurar Dependabot/Renovate para proponer actualizaciones del digest de la imagen base (PRD §"Dockerfile": un bot propone las actualizaciones).
  - Evidencia: `.github/dependabot.yml` ya tiene `package-ecosystem: "docker"` + `directory: "/apps/server"` (líneas 62-63). Sin cambios necesarios.
- [x] 1.3 Etapa `deps`: copiar solo `package.json` + lockfile, `npm ci --ignore-scripts`, cache mount.
  - Evidencia: COPY manifiestos (root + server + prisma + `.npmrc`); `RUN --mount=type=cache,target=/root/.npm npm ci --workspace=apps/server --include-workspace-root --ignore-scripts`. `--include-workspace-root` necesario: typescript es devDep raíz y la etapa build necesita `tsc`.
- [x] 1.4 Etapa `build`: `COPY tsconfig.base.json tsconfig.json .npmrc ./` + `COPY apps/server apps/server` (NO existe `packages/` en este repo; el único paquete es `apps/server`), `RUN npx tsc -b && npm prune --omit=dev`.
  - Desviaciones documentadas: NO existe `tsconfig.base.json` (la base es `tsconfig.json` raíz); se usa `tsc -p apps/server/tsconfig.build.json` (no `tsc -b`: sin project references/composite). `tsconfig.build.json` nuevo emite JS (`noEmit:false` + `rewriteRelativeImportExtensions`).
  - Evidencia: emisión local exit 0, 210 `.js`, 0 imports `.ts` filtrados, `node --check` entry/app/swagger OK.
- [x] 1.5 Etapa `runtime`: copiar `node_modules` + `apps/server/dist`, `USER app` (UID 1001), `CMD ["node", "apps/server/dist/bin/index.js"]` (sin tsx en runtime: el build emite JS; tsx solo en dev).
  - Desviación documentada: `CMD ["node","dist/bin/index.js"]` con `WORKDIR /app/apps/server` (cwd = raíz del paquete server). El path literal `apps/server/dist/...` con cwd=`/app` rompería los globs cwd-relativos de swagger-jsdoc (`src/**`) y dotenv. Se copian AMBOS `node_modules` (root hoisted + server-local: multer/@prisma no hoisted).
  - Evidencia: `addgroup -g 1001 -S app` + `adduser -u 1001 -S app -G app`; `USER app`; `COPY --chown=app:app`.
- [x] 1.6 Añadir `HEALTHCHECK` contra `/health` y `dumb-init` como entrypoint.
  - Evidencia: `HEALTHCHECK ... wget .../health`; `apk add dumb-init`; `ENTRYPOINT ["dumb-init","--"]`.

## 2. .dockerignore y validación

- [x] 2.1 Crear/actualizar `.dockerignore` (node_modules, \*_/dist, .git, .env_).
  - Evidencia: `dist`→`**/dist`; añadidos `**/*.test.ts`/`**/*.spec.ts`; ya tenía `**/node_modules`, `.git`, `.env`/`.env.*`. Ningún path COPYd del contexto queda excluido.
- [ ] 2.2 Ejecutar `docker build -t server:test .` y verificar tamaño de imagen. — ⏳ BLOQUEADO: daemon Docker no disponible. Tamaño pendiente de medición (doc §9-10).
- [ ] 2.3 Ejecutar el contenedor como UID 1001 y verificar respuesta `/health` 200. — ⏳ BLOQUEADO: daemon Docker no disponible.
- [x] 2.4 Verificar que `npm prune --omit=dev` no elimina dependencias de runtime (tsx si se usa).
  - Evidencia: escaneo de imports en `dist` (210 ficheros, 26 bare imports) → **0 imports de devDeps**; todo resuelve a prod-deps o builtins. tsx/vite son prod-deps (quedan tras prune) pero el runtime usa `node dist` (no tsx). La ejecución real de prune se confirma en el primer build (2.2).

## 3. Documentación

- [x] 3.1 Documentar en `docs/` el tamaño de imagen, digest base y módulos nativos probados.
  - Evidencia: `docs/learning/ci-cd/04c-docker-multistage-build.md` (digest, etapas, bcrypt musl + Prisma, emisión, layout/cwd, swagger-src, seguridad, `.dockerignore`, checklist primer build). Tamaño de imagen: pendiente del primer build real (documentado como tal). Banner de actualización en `04-docker-basico-para-cicd.md`.

## 4. Gaps del reviewer (2026-11-12)

- [ ] 4.1 Sustituir la validación manual `disabled_manually` de `deploy.yml` (`docker-build`) por el build local validado aquí (primer build real con Docker daemon). — ⏳ BLOQUEADO: el primer build real requiere Docker. Verificado: el job `docker-build` ya construye `-f apps/server/Dockerfile .` y valida boot/health/smoke contra stack emulado; compatible con el nuevo layout (sin `docker exec` ni rutas hardcoded; migraciones y smoke corren en el host). `disabled_manually` es un toggle de la UI de GitHub (no YAML); reactivarlo o construir en máquina con Docker ejecuta la validación.
- [x] 4.2 Verificar que `--ignore-scripts` no rompe módulos nativos (ejecutar explícitamente los scripts necesarios, p.ej. `prisma generate`).
  - Evidencia: scripts explícitos en `deps`: `npx prisma generate` (engine musl, requiere openssl CLI) + `npm rebuild bcrypt` (binding musl, requiere python3/make/g++). Confirmación empírica de carga musl → 4.2b (bloqueado).
- [ ] 4.2b Validar módulos nativos bajo Alpine (libc musl) en el primer build real (decisión D8 del PRD: Alpine vs Debian slim). — ⏳ BLOQUEADO: daemon Docker no disponible. bcrypt 6.0.0 NO publica prebuild `linux-musl-x64` → se compila (`npm rebuild bcrypt`). Fallback D8 documentado: `node:22-slim` (glibc) usaría el prebuild `linux-x64` sin compilar.
- [ ] 4.3 Confirmar que el arranque con usuario no root (UID 1001) responde `/health` 200 en el primer build real. — ⏳ BLOQUEADO: daemon Docker no disponible.
