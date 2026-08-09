# AWS Dev Local con Floci

> **Guía de activación y uso de Floci como emulador AWS en el entorno de desarrollo local**
>
> Este documento explica cómo levantar y usar Floci (`floci/floci:1.5.31`) junto con la aplicación Express para desarrollar contra Secrets Manager emulado sin necesidad de cuenta AWS real.

---

## 🎯 ¿Qué es Floci?

**Floci** (`floci.io`, licencia **MIT**) es un emulador local de AWS ("Any Cloud. Locally") que expone **68 servicios AWS** en el puerto **4566**.

| Característica | Floci              | LocalStack Community            |
| -------------- | ------------------ | ------------------------------- |
| Licencia       | MIT (forever free) | Requiere auth token (mar 2026+) |
| Servicios      | 68                 | ~26                             |
| Tamaño imagen  | ~90 MB             | ~1 GB                           |
| Startup        | ~24 ms             | ~3.3 s                          |
| Telemetría     | No                 | Sí                              |

> ⚠️ **Importante**: Floci es un **emulador para desarrollo local y validación en CI**. **NO es un proveedor de hosting cloud**. La API validada contra Floci no se expone en URLs públicas. Para producción se usa AWS real.

---

## 🚀 Cómo Activar Floci

### Prerrequisitos

- Docker Desktop / Docker Engine
- Docker Compose v2+

### Comandos

```bash
# Desde apps/server
cd apps/server

# Levantar solo Floci (en segundo plano)
docker compose up -d floci

# Ver estado y healthcheck
docker compose ps
# floci debe aparecer como "healthy"

# Ver logs de Floci
docker compose logs -f floci

# Parar Floci
docker compose down
```

### Verificación del Healthcheck

```bash
# Verificar que el healthcheck reporta healthy
docker compose ps
# STATE debe mostrar: Up ... (healthy)

# O directamente (el contenedor tiene curl disponible):
docker compose exec floci curl -f http://localhost:4566/_localstack/health
# Respuesta esperada: JSON con status ok y servicios running
```

---

## 🔧 Variables de Entorno de Desarrollo

La siguiente tabla documenta las variables necesarias para conectar la app al emulador Floci. **Son credenciales dummy — solo para uso local**.

| Variable                | Valor                   | Descripción                                  |
| ----------------------- | ----------------------- | -------------------------------------------- |
| `AWS_REGION`            | `us-east-1`             | Región simulada                              |
| `AWS_ENDPOINT_URL`      | `http://localhost:4566` | Endpoint del emulador (modo host)            |
| `AWS_ENDPOINT_URL`      | `http://floci:4566`     | Endpoint del emulador (modo contenedor)      |
| `AWS_ACCESS_KEY_ID`     | `test`                  | Credencial dummy (Floci no valida)           |
| `AWS_SECRET_ACCESS_KEY` | `test`                  | Credencial dummy                             |
| `SECRET_NAME`           | `<secret-de-dev>`       | Nombre del secreto a leer en Secrets Manager |

> **Estas variables están documentadas como referencia en `apps/server/.env.example`** (marcadas como "solo local / dummy"). **NO modificar el `.env` real** — cada desarrollador configura su entorno local.

---

## 🔌 Modo Host vs Modo Contenedor — Distinción Crítica

### Modo Host (`npm run dev` en el host)

- La app corre en el host (fuera de Docker) con `nodemon`
- Floci expone el puerto 4566 en `localhost:4566`
- Usar: `AWS_ENDPOINT_URL=http://localhost:4566`

```bash
# Terminal 1: Levantar Floci
cd apps/server && docker compose up -d floci

# Terminal 2: App en host
AWS_REGION=us-east-1 \
AWS_ENDPOINT_URL=http://localhost:4566 \
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
SECRET_NAME=mi-secreto-dev \
npm run dev
```

### Modo Contenedor (`api` service en docker-compose)

- El servicio `api` corre dentro de Docker Compose (usa `env_file: .env`)
- Desde la red interna `app-network`, Floci es accesible como `floci:4566`
- Usar: `AWS_ENDPOINT_URL=http://floci:4566` (en `.env`)

```yaml
# docker-compose.yml (ya configurado)
services:
  api:
    env_file:
      - .env
    networks:
      - app-network
  floci:
    networks:
      - app-network
```

> **Nota**: Si cambias variables de entorno AWS en `.env`, **debes reiniciar el servidor** (`docker compose restart api` o `npm run dev` en host). **Nodemon no recarga variables de entorno** — solo recarga código.

---

## 🔐 Cómo el Código de Secrets Manager se Conecta vía `AWS_ENDPOINT_URL`

La aplicación usa `@aws-sdk/client-secrets-manager` y el cliente se configura en:

```
apps/server/src/config/aws/secret-manager.client.js
```

### Código del Cliente

```javascript
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const config = {
  region: process.env.AWS_REGION,
};

// Solo existe en emulador (Floci/LocalStack)
if (process.env.AWS_ENDPOINT_URL) {
  config.endpoint = process.env.AWS_ENDPOINT_URL;
}

export const secretsClient = new SecretsManagerClient(config);
```

### Flujo de Conexión

1. **Sin `AWS_ENDPOINT_URL`** → Cliente apunta a AWS real (producción/staging)
2. **Con `AWS_ENDPOINT_URL=http://localhost:4566`** → Cliente apunta a Floci (host mode)
3. **Con `AWS_ENDPOINT_URL=http://floci:4566`** → Cliente apunta a Floci (container mode)

### Uso en Código de Aplicación (`loadSecrets()`)

```javascript
// apps/server/src/config/aws/secrets.js
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { secretsClient } from './secret-manager.client.js';

export async function loadSecrets() {
  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_NAME,
  });

  const response = await secretsClient.send(command);

  if (!response.SecretString) {
    throw new Error('Secret vacío o no encontrado');
  }

  return JSON.parse(response.SecretString);
}
```

> **Nota**: `loadSecrets()` es **código muerto hoy** — ningún archivo de la app la importa; ejecutar la app no ejercita el path de Secrets Manager hasta que exista un consumidor. La validación del path emulado se hace vía script/REPL independiente (ver sección "Validación Manual" abajo).

---

## 🧪 Validación Manual del Path Secrets Manager (Opcional)

Si Docker está disponible, puedes validar el path completo:

```bash
# 1. Levantar Floci
cd apps/server && docker compose up -d floci

# 2. Crear un secreto de prueba en Floci
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name mi-secreto-dev \
  --secret-string '{"FLOCI_CONN":"<DEV_PASSWORD>","FLOCI_AUTH":"<DEV_API_KEY>"}'

# 3. Ejecutar script de validación (REPL independiente)
AWS_REGION=us-east-1 \
AWS_ENDPOINT_URL=http://localhost:4566 \
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
SECRET_NAME=mi-secreto-dev \
node --input-type=module -e "
import {loadSecrets} from './src/config/aws/secrets.js';
console.log(await loadSecrets());
"
# Output esperado: { FLOCI_CONN: '<DEV_PASSWORD>', FLOCI_AUTH: '<DEV_API_KEY>' }
```

---

## ⚠️ Diferencias Clave vs AWS Real

| Aspecto                | Floci (Emulador)                                           | AWS Real                     |
| ---------------------- | ---------------------------------------------------------- | ---------------------------- |
| **Autenticación**      | Credenciales dummy (`test`/`test`)                         | IAM roles, políticas, MFA    |
| **Límites**            | Sin límites (local)                                        | Cuotas por cuenta/región     |
| **Latencia**           | ~1-5 ms (local)                                            | Variable (red, región)       |
| **Persistencia**       | Memoria (`FLOCI_STORAGE_MODE=memory`) — se pierde al parar | Duradero, replicado multi-AZ |
| **Facturación**        | Gratis                                                     | Pay-per-use                  |
| **Compliance**         | No certificado                                             | SOC, ISO, PCI, HIPAA, etc.   |
| **Features avanzadas** | Subconjunto                                                | Completo                     |

> 📝 **Nota**: El catálogo completo y diferencias detalladas por servicio están en la [documentación oficial de Floci](https://floci.io).

---

## 📚 Referencia Cruzada: Ruta de Aprendizaje AWS con Floci

Para una guía progresiva de aprendizaje de servicios AWS usando Floci (S3, DynamoDB, Lambda, SQS/SNS, EventBridge, RDS, etc.), consulta:

> **`docs/aws-learning-with-floci.md`** — _Ruta de aprendizaje progresiva de AWS (Niveles 1-5), propiedad del change sibling `ci-preview-environments`_.
>
> Este archivo (`aws-dev-local-floci.md`) documenta la **activación dev-local** (compose + env vars). El learning path completo está en `aws-learning-with-floci.md`. **Nota de ordenamiento**: este change (`ci-floci-migration`) documenta el setup dev-local; el learning path fue introducido por el sibling `ci-preview-environments` y puede mergearse antes o después — referenciarlo textualmente evita dependencias de orden.

---

## 🔗 Referencia: Plan de Implementación CI/CD

Este change implementa el **ítem 2.3** de `docs/cicd-plan-implementacion.md` ("migrar de LocalStack a Floci"). El **ítem 2.4** ("ampliar tests AWS con `@floci/testcontainers` + Vitest") queda como **follow-up documentado abajo** — fuera de scope de este change.

---

## 📋 Follow-up: Ampliación de Tests AWS con `@floci/testcontainers` + Vitest

> **Fuera de scope de este change** — documentado aquí para trazabilidad.

Según **ítem 2.4 de `docs/cicd-plan-implementacion.md`**:

- **Objetivo**: Añadir tests de integración que usen Floci via `@floci/testcontainers` para validar el path de Secrets Manager (y futuros servicios AWS) en CI.
- **Herramientas**: `@floci/testcontainers` (Testcontainers module para Floci) + Vitest.
- **Alcance**: Tests que levantan Floci efímero por test suite, crean secretos, y validan `loadSecrets()` end-to-end.
- **Ubicación sugerida**: `tests/integration/aws/` o junto a módulos que consuman Secrets Manager.
- **Estado**: Pendiente — requiere consumidor real de `loadSecrets()` en la app para tener valor de prueba.

---

## 📝 Resumen Rápido

| Acción                           | Comando                                                |
| -------------------------------- | ------------------------------------------------------ |
| Levantar Floci                   | `cd apps/server && docker compose up -d floci`         |
| Ver healthcheck                  | `docker compose ps` (buscar "healthy")                 |
| Modo host (npm run dev)          | `AWS_ENDPOINT_URL=http://localhost:4566`               |
| Modo contenedor (docker-compose) | `AWS_ENDPOINT_URL=http://floci:4566` en `.env`         |
| Reiniciar tras cambio de env     | `docker compose restart api` o reiniciar `npm run dev` |
| Ver learning path                | `docs/aws-learning-with-floci.md`                      |
