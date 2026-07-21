# ============================================================
# Dockerfile para API Express + Socket.IO
# ============================================================
# Usamos Node 20 Alpine por tamaño reducido (~120MB vs ~300MB de node:20)
# ============================================================

FROM node:20-alpine

WORKDIR /app

# Copiar package.json y lockfile primero (cache de capas de Docker)
# Mientras no cambien las dependencias, Docker reusa esta capa
COPY package*.json ./

# Instalar dependencias de producción (--omit=dev para imagen más pequeña)
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# El servidor Express corre en puerto 3000
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/bin/index.js"]