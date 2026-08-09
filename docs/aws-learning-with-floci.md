# AWS Learning with Floci

> **Guía de aprendizaje de AWS usando Floci como emulador local**
>
> Esta guía explica cómo levantar y usar el stack de emulación AWS local para aprender servicios AWS sin necesidad de cuenta real ni costos de cloud. Floci es un emulador MIT (no hosting) que permite desarrollar contra APIs AWS 1:1 en local y CI.

---

## 🎯 ¿Qué es Floci?

**Floci** (`floci/floci:1.5.31`) es un emulador local de AWS ("Any Cloud. Locally", licencia MIT) que expone **68 servicios AWS** en el puerto **4566**.

| Característica | Floci              | LocalStack Community            |
| -------------- | ------------------ | ------------------------------- |
| Licencia       | MIT (forever free) | Requiere auth token (mar 2026+) |
| Servicios      | 68                 | ~26                             |
| Tamaño imagen  | ~90 MB             | ~1 GB                           |
| Startup        | ~24 ms             | ~3.3 s                          |
| Telemetría     | No                 | Sí                              |

> ⚠️ **Importante**: Floci es un **emulador para aprendizaje y validación local/CI**. **NO es un proveedor de hosting cloud**. La API validada contra Floci no se expone en URLs públicas. Para producción se usa AWS real.

---

## 🚀 Levantar el Stack de Emulación Local

### Prerrequisitos

- Docker Desktop / Docker Engine
- Docker Compose v2+

### Comandos

```bash
# Desde la raíz del monorepo
cd apps/server

# Levantar stack completo (server + Floci + PostgreSQL efímera)
docker compose -f docker-compose.preview.yml up

# En segundo plano (detached)
docker compose -f docker-compose.preview.yml up -d

# Ver logs
docker compose -f docker-compose.preview.yml logs -f

# Parar y limpiar
docker compose -f docker-compose.preview.yml down
```

### Verificación

```bash
# 1. Verificar Floci responde en puerto 4566
curl http://localhost:4566/_localstack/health
# Respuesta esperada: JSON con servicios disponibles

# 2. Verificar health check del server
curl http://localhost:3000/health
# Respuesta esperada: {"status":"ok"}

# 3. Verificar métricas Prometheus
curl http://localhost:3000/metrics

# 4. Ejecutar smoke test manual (CreateSecret + GetSecretValue)
AWS_ENDPOINT_URL=http://localhost:4566 \
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
AWS_REGION=us-east-1 \
node scripts/preview-smoke.mjs
```

---

## 🏗️ Componentes del Stack

El stack `docker-compose.preview.yml` define tres servicios:

### 1. **Floci** (`floci/floci:1.5.31`)

- **Rol**: Emulador de 68 servicios AWS
- **Puerto**: 4566 (HTTP/HTTPS)
- **Storage**: Memoria (`FLOCI_STORAGE_MODE=memory`) — datos efímeros
- **Healthcheck**: `curl -f http://localhost:4566/_localstack/health || exit 1` cada 10s
- **Variables**:
  - `FLOCI_HOSTNAME=floci` (para resolución DNS interna)

### 2. **PostgreSQL Efímera** (`postgres:16-alpine`)

- **Rol**: Base de datos dedicada por stack de preview
- **Puerto**: 5432
- **Credenciales**: `test` / `test` / `project_one_preview`
- **Sin volúmenes persistentes** — datos se descartan al parar
- **Healthcheck**: `pg_isready` cada 5s

### 3. **Server Express** (build desde `Dockerfile`)

- **Rol**: API Express + Socket.IO de la aplicación
- **Puerto**: 3000
- **Depende de**: `db` + `floci` (healthy)
- **Variables de entorno**:
  ```bash
  DATABASE_URL=postgresql://test:test@db:5432/project_one_preview
  AWS_ENDPOINT_URL=http://floci:4566
  AWS_ACCESS_KEY_ID=test
  AWS_SECRET_ACCESS_KEY=test
  AWS_REGION=us-east-1
  PORT=3000
  ```

---

## ☁️ Catálogo de Servicios AWS Emulados por Floci

Floci emula **68 servicios AWS**. Los más relevantes para este proyecto:

### Servicios Usados por la App (Hoy)

| Servicio            | Cliente AWS SDK                   | Uso en la App                                      |
| ------------------- | --------------------------------- | -------------------------------------------------- |
| **Secrets Manager** | `@aws-sdk/client-secrets-manager` | Gestión de secretos (API keys, DB passwords, etc.) |

### Otros Servicios Disponibles (67 más)

| Categoría      | Servicios                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| **Compute**    | Lambda, ECS, EKS, Batch, Fargate                                            |
| **Storage**    | S3, EFS, FSx, Backup, Storage Gateway                                       |
| **Database**   | RDS, DynamoDB, ElastiCache, DocumentDB, Neptune, Timestream, QLDB           |
| **Messaging**  | SQS, SNS, EventBridge, Kinesis, MQ, MSK                                     |
| **Networking** | VPC, CloudFront, Route53, API Gateway, AppSync, PrivateLink                 |
| **Security**   | IAM, STS, KMS, Secrets Manager, Certificate Manager, WAF, Shield, GuardDuty |
| **Monitoring** | CloudWatch, X-Ray, CloudTrail, Config                                       |
| **DevOps**     | CodeBuild, CodeDeploy, CodePipeline, CodeCommit, CodeArtifact               |
| **Analytics**  | Athena, EMR, Redshift, Kinesis Data Analytics, QuickSight                   |
| **ML/AI**      | SageMaker, Rekognition, Comprehend, Transcribe, Translate, Polly, Lex       |
| **IoT**        | IoT Core, IoT Analytics, IoT Events, IoT Greengrass                         |
| **Otros**      | S3 Control, Resource Groups, Tagging, STS, Organizations, SSO, SSM          |

### Diferencias Clave vs AWS Real

| Aspecto                | Floci (Emulador)                   | AWS Real                     |
| ---------------------- | ---------------------------------- | ---------------------------- |
| **Autenticación**      | Credenciales dummy (`test`/`test`) | IAM roles, políticas, MFA    |
| **Límites**            | Sin límites (local)                | Cuotas por cuenta/región     |
| **Latencia**           | ~1-5 ms (local)                    | Variable (red, región)       |
| **Persistencia**       | Memoria (se pierde al parar)       | Duradero, replicado multi-AZ |
| **Facturación**        | Gratis                             | Pay-per-use                  |
| **Compliance**         | No certificado                     | SOC, ISO, PCI, HIPAA, etc.   |
| **Features avanzadas** | Subconjunto                        | Completo                     |

> 📝 **Nota**: El catálogo completo y diferencias detalladas por servicio están en la [documentación oficial de Floci](https://floci.io).

---

## 🔐 Conexión de Secrets Manager via `AWS_ENDPOINT_URL`

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

### Cómo Funciona

1. **Sin `AWS_ENDPOINT_URL`** → Cliente apunta a AWS real (producción)
2. **Con `AWS_ENDPOINT_URL=http://floci:4566`** → Cliente apunta a Floci (local/CI preview)

### Variables de Entorno Requeridas en el Stack Emulado

| Variable                | Valor en Preview                                             | Descripción                        |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------- |
| `AWS_ENDPOINT_URL`      | `http://floci:4566` (compose) / `http://localhost:4566` (CI) | Endpoint del emulador              |
| `AWS_ACCESS_KEY_ID`     | `test`                                                       | Credencial dummy (Floci no valida) |
| `AWS_SECRET_ACCESS_KEY` | `test`                                                       | Credencial dummy                   |
| `AWS_REGION`            | `us-east-1`                                                  | Región simulada                    |

### Uso en Código de Aplicación

```javascript
import { secretsClient } from '../config/aws/secret-manager.client.js';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await secretsClient.send(command);
  return response.SecretString; // JSON string del secreto
}
```

---

## 📚 Ruta de Aprendizaje Progresiva de AWS

Esta guía ofrece un camino estructurado para aprender AWS usando el stack emulado:

### Nivel 1: Fundamentos del Stack (Esta Guía)

- [x] Levantar stack: `docker compose -f apps/server/docker-compose.preview.yml up`
- [x] Verificar Floci en puerto 4566
- [x] Verificar server en puerto 3000 (`/health`, `/metrics`)
- [x] Ejecutar smoke test: `node scripts/preview-smoke.mjs`
- [x] Entender `AWS_ENDPOINT_URL` y credenciales dummy

### Nivel 2: Secrets Manager Emulado

- [ ] Crear secretos via AWS CLI: `aws --endpoint-url=http://localhost:4566 secretsmanager create-secret ...`
- [ ] Leer secretos desde la app
- [ ] Rotar secretos y versionado
- [ ] Políticas de acceso (IAM emulado)

### Nivel 3: Explorar Otros Servicios

- [ ] **S3**: Subir/descargar archivos, bucket policies, versionado
- [ ] **DynamoDB**: Tablas, índices, streams, TTL
- [ ] **SQS/SNS**: Colas, temas, suscripciones, dead-letter queues
- [ ] **Lambda**: Funciones, capas, event source mappings
- [ ] **EventBridge**: Reglas, targets, archive/replay
- [ ] **RDS**: Instancias, read replicas, backups, parameter groups

### Nivel 4: Patrones de Arquitectura

- [ ] Microservicios con API Gateway + Lambda + DynamoDB
- [ ] Event-driven con EventBridge + SQS + Lambda
- [ ] Serverless full-stack con S3 + CloudFront + Lambda@Edge
- [ ] Infrastructure as Code con CDK/Terraform contra Floci

### Nivel 5: Migración a AWS Real

- [ ] Comparar comportamiento emulado vs real
- [ ] Configurar credenciales reales (IAM roles, STS)
- [ ] Ajustar timeouts, reintentos, circuit breakers
- [ ] Configurar monitoring real (CloudWatch, X-Ray)
- [ ] Desplegar a staging/producción

---

## 🔗 Referencia: Change `ci-floci-migration`

La migración de **LocalStack → Floci en el entorno de desarrollo local** (`docker-compose.yml`) está documentada en el change separado:

> **Change**: `ci-floci-migration`
> **Ubicación**: `openspec/changes/ci-floci-migration/`
> **Objetivo**: Reemplazar LocalStack Community (que requiere auth token desde marzo 2026) por Floci en `apps/server/docker-compose.yml` para desarrollo diario.

Este change (`ci-preview-environments`) **solo incorpora Floci al stack de preview** (`docker-compose.preview.yml`). El compose de dev-local queda intacto hasta que se ejecute `ci-floci-migration`.

---

## ♻️ Ciclo de Vida Efímero (Zero Cloud Resources)

### Validación CI (Backend)

- **Vive**: Solo durante el job de GitHub Actions (~5-8 min)
- **Muere**: Al terminar el runner (éxito o fallo)
- **Limpieza**: Automática por GitHub — service containers (Floci + PostgreSQL) destruidos
- **Persistencia**: Ninguna — sin volúmenes, sin recursos cloud

### Preview Vercel (Frontend)

- **Creado**: Automáticamente por Vercel GitHub App al abrir PR
- **URL**: Única por branch/PR (`*.vercel.app`)
- **Eliminado**: Automáticamente al mergear o cerrar PR (comportamiento nativo)
- **Configuración**: Dashboard Vercel (root `apps/client`, preset Vite) — **sin archivos en repo**

### Resumen: Zero Cleanup Manual

```
┌─────────────────────────────────────────────────────────────┐
│  PR Abierto                                                 │
│  ├─ CI Preview Job: Floci + PostgreSQL + Server (efímero)  │
│  │   └─ Muere con el runner → 🧹 Limpieza automática        │
│  └─ Vercel Preview Deployment (client)                      │
│      └─ Merge/Cierre PR → 🧹 Eliminación automática         │
└─────────────────────────────────────────────────────────────┘
❌ No hay: servidores corriendo, volúmenes, recursos cloud, scripts de cleanup
```

---

## 🛠️ Comandos de Referencia Rápida

```bash
# Levantar stack preview local
cd apps/server && docker compose -f docker-compose.preview.yml up -d

# Ver estado servicios
docker compose -f docker-compose.preview.yml ps

# Logs en tiempo real
docker compose -f docker-compose.preview.yml logs -f

# Ejecutar smoke test
AWS_ENDPOINT_URL=http://localhost:4566 \
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
AWS_REGION=us-east-1 \
node scripts/preview-smoke.mjs

# AWS CLI contra Floci (ejemplos)
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Parar todo
docker compose -f docker-compose.preview.yml down

# Ver workflow CI en acción
# Push a PR → GitHub Actions → "Preview Environments" workflow
```

---

## 📖 Recursos Adicionales

- **Floci Official**: https://floci.io
- **Floci GitHub**: https://github.com/floci/floci
- **AWS SDK for JavaScript v3**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- **Prisma ORM**: https://www.prisma.io/docs
- **Vercel GitHub App**: https://vercel.com/docs/concepts/git/vercel-for-github
- **Change `ci-floci-migration`**: `openspec/changes/ci-floci-migration/`

---

_Documentación generada como parte del change `ci-preview-environments` — Stage 6 del plan de implementación CI/CD._
