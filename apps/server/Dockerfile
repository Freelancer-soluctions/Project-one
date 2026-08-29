# ============================================================
# Dockerfile para API Express + Socket.IO
# ============================================================
# Usamos Node 20 Alpine por tamaño reducido (~120MB vs ~300MB de node:20)
# Build context: monorepo root (to access package-lock.json)
#   docker build -f apps/server/Dockerfile .
# ============================================================

FROM node:26-alpine

WORKDIR /app

# Copiar root package.json + lockfile, luego workspace package.json y prisma schema
# Esto permite `npm ci --workspace=apps/server` que encuentra el lockfile en la raíz
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma ./apps/server/prisma/

# Instalar dependencias del workspace (incluye devDeps para prisma CLI en postinstall)
# El postinstall "prisma generate" se ejecuta aquí y encuentra el schema en apps/server/prisma/
# --ignore-scripts evita el prepare script del root (husky) que no está disponible en el contenedor
RUN npm ci --workspace=apps/server --ignore-scripts

# Eliminar devDependencies del workspace para imagen de producción más pequeña
RUN npm prune --workspace=apps/server --omit=dev

# Copiar código fuente del server (sobrescribe package.json del workspace, OK: deps ya instaladas)
COPY apps/server/. .

# El servidor Express corre en puerto 3000
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/bin/index.js"]

# NOTA: El compose de dev-local (apps/server/docker-compose.yml) usa `build: .` con context apps/server.
# Con este Dockerfile (context: root), el build de dev-local FALLA.
# Para build local de dev, usa: `docker build -f apps/server/Dockerfile .` desde la raíz del repo.
# El change `ci-floci-migration` actualizará docker-compose.yml a `{ context: .., dockerfile: apps/server/Dockerfile }`.