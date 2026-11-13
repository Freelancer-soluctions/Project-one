# 04c — Docker Multi-stage Build del Server (referencia técnica)

> Referencia de implementación del change **`ci-dockerfile-multi-stage`**. Complementa a
> [`04-docker-basico-para-cicd.md`](04-docker-basico-para-cicd.md) (conceptos) con el diseño
> real del `apps/server/Dockerfile` multi-stage. Última actualización: 2026-11-12.

---

## 1. Resumen

El `apps/server/Dockerfile` pasa de single-stage (`tsx src/bin/index.ts`) a **multi-stage
con runtime de JS compilado** (`node dist/bin/index.js`). Objetivos del PRD: base fijada por
digest, `npm ci --ignore-scripts`, emisión `tsc`, `npm prune --omit=dev`, usuario no root
(UID 1001), `HEALTHCHECK` contra `/health`, init de procesos (`dumb-init`) y **sin secretos en
`ARG`/`ENV`**.

**Build context = raíz del monorepo** (acceso a `package-lock.json` + workspaces):

```bash
docker build -f apps/server/Dockerfile -t server:local .
```

---

## 2. Etapas

| Etapa     | Base       | Qué hace                                                                                                                                                                         |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`    | digest pin | `node:22-alpine` fijada por digest; `WORKDIR /app`.                                                                                                                              |
| `deps`    | `base`     | `apk add openssl python3 make g++`; manifiestos; `npm ci --ignore-scripts` + `prisma generate` + `npm rebuild bcrypt`.                                                           |
| `build`   | `deps`     | `COPY` tsconfigs + `src`; `npx tsc -p apps/server/tsconfig.build.json` (emite `dist`); `npm prune --omit=dev`.                                                                   |
| `runtime` | `base`     | `apk add dumb-init libstdc++`; usuario `app` (1001); `COPY` node_modules + dist + src + prisma; `USER app`; `HEALTHCHECK`; `ENTRYPOINT dumb-init`; `CMD node dist/bin/index.js`. |

El toolchain de compilación (`python3/make/g++`) vive **solo en `deps`**: el runtime (`FROM base`)
no lo arrastra → imagen final sin compiladores.

---

## 3. Imagen base fijada por digest

```
node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a
```

- Digest del **manifest index multi-arch** (`application/vnd.oci.image.index.v1+json`),
  re-verificado contra el registro oficial de Docker Hub (`registry-1.docker.io`) el 2026-11-12.
- Pin por digest (no por tag) → build reproducible; el tag `22-alpine` puede moverse, el digest no.
- **Dependabot** ya tiene el ecosystem `docker` con `directory: "/apps/server"`
  (`.github/dependabot.yml`): propone los bumps de este digest (task 1.2b, ya configurado).

---

## 4. Módulos nativos bajo Alpine (musl) — decisión D8

Alpine usa **musl libc**, no glibc. Dos módulos nativos requieren atención:

### 4.1 bcrypt 6.0.0 (compilación obligatoria)

- bcrypt publica prebuilds para `darwin-*`, `linux-arm/arm64/x64` (**glibc**), `win32-*`.
  **NO publica `linux-musl-x64`**. El prebuild `linux-x64` (glibc) **no carga** sobre musl.
- Con `npm ci --ignore-scripts` el install script (`node-gyp-build`) se omite → sin binding
  compilado, bcrypt falla al primer `require` (rutas de auth).
- **Solución**: `npm rebuild bcrypt` en la etapa `deps`, con `python3 make g++` presentes,
  compila el binding contra musl (`node-gyp-build` → `node-gyp rebuild`). El runtime añade
  `libstdc++` (el binding C++ la enlaza).
- Este es el motivo de que el toolchain esté en `deps`. **Validación pendiente del primer
  build real** (task 4.2b): confirmar que el binding musl compila y carga.
- **Fallback D8**: si la compilación musl resultara problemática, `node:22-slim` (Debian,
  glibc) usaría el prebuild `linux-x64` directamente sin compilar. El PRD fija Alpine por
  defecto (task 1.2); Debian slim queda como alternativa documentada.

### 4.2 Prisma (engine musl)

- `@prisma/client` necesita el query engine correcto. Alpine trae `libssl3` (OpenSSL 3) pero
  **no el CLI `openssl`**; sin él, `prisma generate` detecta el engine equivocado
  (`linux-musl` / OpenSSL 1.1) que no carga sobre `libssl.so.3`.
- **Solución**: `apk add openssl` en `deps` + `npx prisma generate` explícito (el
  `--ignore-scripts` omite el postinstall `prisma generate`). Generate corre **antes** de
  `prune` (prune elimina el CLI `prisma`, devDep). El engine generado persiste en
  `node_modules/.prisma/client` y se copia al runtime.

> Nota: `tsx`/`vite` son **prod-deps** del server y permanecen tras `prune --omit=dev`, pero
> el runtime usa `node dist` (no tsx) → quedan como peso muerto, no como riesgo de ejecución.

---

## 5. Emisión JS (runtime sin tsx)

El `tsconfig.json` del server es de **type-check** (`noEmit: true` + `allowImportingTsExtensions`,
gate `server-typecheck`). Para emitir se añade `apps/server/tsconfig.build.json`:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "allowImportingTsExtensions": false,
    "rewriteRelativeImportExtensions": true, // TS 5.7+: reescribe imports .ts → .js
    "outDir": "dist",
    "declaration": false,
    "incremental": false,
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts", "src/**/*.spec.ts"],
}
```

- `rewriteRelativeImportExtensions` reescribe los imports relativos `.ts` → `.js` en la salida;
  sin él, `tsc` emite pero los imports `.ts` no son ejecutables por `node` (TS5097).
- **No existe `tsconfig.base.json`** en este repo: la base es `tsconfig.json` (raíz). Se usa
  `tsc -p` (no `tsc -b`: no hay project references/composite).
- **Validado localmente** (sin Docker): `npx tsc -p tsconfig.build.json` → exit 0, **210 `.js`**,
  `dist/bin/index.js` con imports reescritos (`../app.js`), **0 imports `.ts` filtrados**,
  `node --check` OK en entry/app/swagger.

---

## 6. Layout del runtime y cwd (por qué `dist/bin/index.js`)

El runtime **preserva el layout del monorepo** con `WORKDIR /app/apps/server`:

- `node_modules` hoisted en `/app/node_modules` **y** local en `/app/apps/server/node_modules`
  (multer, @prisma, fs-extra, jiti **no** hoisted). Ambos se copian: Node resuelve subiendo
  desde `dist/bin` → `apps/server/node_modules` → `/app/node_modules`.
- **cwd = raíz del paquete server** (`/app/apps/server`). Esto es obligatorio porque:
  - `swagger-jsdoc` lee globs **relativos al cwd** (`src/modules/**/routes.ts`,
    `src/docs/schemas*.ts` — ver `src/docs/swagger-options.ts`).
  - `dotenv` carga `.env`/`.env.<env>` **relativo al cwd** (`src/config/dotenv.ts`).
- Por eso el `CMD` es `["node", "dist/bin/index.js"]` y **no** `["node", "apps/server/dist/bin/index.js"]`
  (el WORKDIR ya es `apps/server`). El fichero objetivo es el mismo.

### 6.1 `src/` en el runtime (anotaciones swagger)

`swagger-jsdoc` parsea las anotaciones `@openapi` **en runtime** (module scope) desde los globs
`src/**/*.ts`. Un runtime solo-`dist` produciría un spec **sin paths** (regresión silenciosa de
`/api/v1/docs`). Por eso el runtime incluye `src/` como **datos de anotación** (texto que se
parsea, no se ejecuta). El config de swagger es compartido con el generador de contrato
(`scripts/generate-openapi.ts`, capability `api-contract-linting`) y **no se modifica** en este
change. `tsc` conserva los comentarios `@openapi` en `dist/` (`removeComments` sin fijar).

---

## 7. Seguridad de runtime

- **No root**: `addgroup -g 1001 -S app` + `adduser -u 1001 -S app -G app`; `USER app`.
  Los `COPY --from=build` usan `--chown=app:app`.
- **Init de señales**: `ENTRYPOINT ["dumb-init", "--"]` → PID 1 reenvía `SIGTERM` al
  graceful shutdown de `src/bin/index.ts`.
- **HEALTHCHECK**: `wget -q -O /dev/null http://127.0.0.1:3000/health` (BusyBox wget ya en
  Alpine). `/health` devuelve 200 (DB ok) o 503 (DB degradado).
- **Sin secretos en `ARG`/`ENV`** (PRD): los build args quedan en el provenance. Los secretos
  se inyectan por stack (ECS task defs, `docker run -e`) o por montajes de secretos de BuildKit.
- `ENV NODE_ENV=production` por defecto (fail-closed). El guard de
  `src/middleware/encription-prisma-middleware.ts` rechaza la dummy `AES_GCM_KEY` bajo
  production → el smoke local y los stacks emulados corren con `-e NODE_ENV=development`.

---

## 8. `.dockerignore` (raíz)

Actualizado (task 2.1): `**/node_modules`, `**/dist` (antes `dist` raíz), `.git`, `.env`/`.env.*`,
y filtros de test `.ts` (`**/*.test.ts`, `**/*.spec.ts`) además de los `.js`. El build genera
`dist` y `node_modules` **dentro** de la imagen; excluirlos del contexto evita arrastrar
artefactos stale del host. `prisma/migrations` **no** se excluye (necesario para `migrate deploy`).

---

## 9. Estado de validación

| Check                                        | Estado       | Evidencia                                                       |
| -------------------------------------------- | ------------ | --------------------------------------------------------------- |
| Emisión `tsc` (exit 0, sin imports `.ts`)    | ✅ Local     | 210 `.js`; `node --check` entry/app/swagger OK                  |
| `prune --omit=dev` no rompe runtime          | ✅ Local     | 0 imports de devDeps en `dist` (210 ficheros, 26 bare imports)  |
| Digest base real                             | ✅ Local     | re-verificado en `registry-1.docker.io` (OCI index)             |
| hadolint                                     | ⏳ CI        | no instalado en sandbox; el gate hadolint de CI es autoritativo |
| `docker build` + tamaño de imagen (2.2)      | ⏳ Bloqueado | daemon Docker no disponible en sandbox                          |
| Run UID 1001 + `/health` 200 (2.3 / 4.3)     | ⏳ Bloqueado | daemon Docker no disponible                                     |
| Nativos musl: bcrypt compile + Prisma (4.2b) | ⏳ Bloqueado | requiere primer build real en Alpine                            |

**Tamaño de imagen**: pendiente de medición en el primer build real (`docker images server:local`).
No se puede medir sin daemon Docker.

---

## 10. Primer build real (checklist)

El job `docker-build` de [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml)
(Fase 1, stack emulado Floci + Postgres) **ya construye y valida** este Dockerfile:
`docker build -f apps/server/Dockerfile .` → `docker run` con `NODE_ENV=development` + dummy
`AES_GCM_KEY` → `curl /health` (acepta 200/503) → `npm run test:smoke`. Es compatible con el
nuevo layout (sin `docker exec` ni rutas hardcoded; migraciones y smoke corren en el host).

El job está `disabled_manually` (toggle de la UI de GitHub, no del YAML). Para el primer build
real (tasks 2.2 / 2.3 / 4.1 / 4.2b / 4.3):

1. Reactivar `deploy.yml` (UI de GitHub Actions) **o** construir en una máquina con Docker.
2. `docker build -f apps/server/Dockerfile -t server:local .` → confirmar exit 0.
3. `docker images server:local` → registrar el tamaño aquí.
4. Verificar que `npm rebuild bcrypt` compila el binding musl y que `prisma generate` produce
   el engine `linux-musl-openssl-3.0.x`.
5. `docker run` como UID 1001 con el stack emulado → `/health` 200 (o 503 DB degradado).
6. Confirmar que `/api/v1/docs.json` describe paths (swagger leyó `src/`).

---

## 11. Archivos del change

- `apps/server/Dockerfile` — multi-stage (base/deps/build/runtime).
- `apps/server/tsconfig.build.json` — config de emisión (nuevo).
- `.dockerignore` — `**/dist` + filtros de test `.ts`.
- `.github/dependabot.yml` — ecosystem docker `/apps/server` (ya existente).
