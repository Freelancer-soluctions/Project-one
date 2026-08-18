# Guía 13 — Walkthrough de `deploy.yml`: el pipeline de despliegue

> **Nivel**: Avanzado · **Guía 13 de 7** · **Tema**: Despliegue a AWS ECR + ECS con GitHub Actions

Esta guía desglosa línea a línea el workflow `.github/workflows/deploy.yml` del proyecto. Es el pipeline que construye la imagen Docker, la sube a Amazon ECR y la despliega en staging y producción con aprobación manual.

## 🎯 Objetivos de aprendizaje

- [ ] Entender la estructura de dos fases del workflow: build/test y deploy.
- [ ] Desglosar el job `docker-build`: build de imagen, servicios efímeros y smoke tests.
- [ ] Explicar el flujo `ecr-push` con OIDC, login a ECR y push taggeado por SHA.
- [ ] Comparar `deploy-staging` (automático) vs `deploy-production` (aprobación manual).
- [ ] Explicar el gating `vars.AWS_ROLE_ARN != ''` y los jobs `*-skipped`.
- [ ] Hacer inventario de los secrets y variables que consume el workflow.
- [ ] Explicar el gotcha `JWT_SECRET` vs `SECRETKEY`.
- [ ] Explicar los concurrency groups y por qué `cancel-in-progress: false`.

## 📋 Prerequisitos

- Guía 11 — [Conceptos de CD y AWS](./11-cd-conceptos-aws.md)
- Guía 12 — [Floci: emulador de AWS](./12-floci-emulador-aws.md)
- Guía 06 — [Walkthrough de ci.yml](./06-ci-yml-walkthrough.md)
- Guía 03 — [Secrets y variables](./03-secrets-variables.md)
- Conocimiento básico de Docker (Guía 04) y de GitHub Actions (Guía 02)

## 1. Vista general del workflow

### 1.1 Qué hace deploy.yml

El workflow `deploy.yml` se dispara cuando un commit llega a la rama `main` (o `master`). Su misión es llevar la última versión del server a los entornos de AWS:

```mermaid
flowchart LR
    A[Push a main] --> B[Fase 1: docker-build]
    B --> C[Fase 2: ecr-push]
    C --> D[deploy-staging]
    D --> E[deploy-production]
    E --> F[ECS: nueva task definition]
```

**ASCII fallback** (si mermaid no renderiza):

```
Push a main → docker-build → ecr-push → deploy-staging → deploy-production → ECS: nueva task definition
```

### 1.2 Las dos fases

| Fase       | Jobs                                              | Propósito                                                                    |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Fase 1** | `docker-build`                                    | Construir la imagen, probarla contra un stack emulado, publicar el artefacto |
| **Fase 2** | `ecr-push`, `deploy-staging`, `deploy-production` | Subir la imagen a ECR y desplegarla en los entornos                          |

> 💡 La separación en fases permite que el build falle rápido (Fase 1) sin tocar AWS, y que el despliegue (Fase 2) solo ocurra si la imagen es válida.

### 1.3 El disparador

```yaml
on:
  push:
    branches: [main]
```

Solo los pushes a `main`/`master` disparan el despliegue. Los PRs usan otro workflow (`preview.yml`, Guía 14).

### 1.4 Permisos y configuración global

```yaml
permissions:
  contents: read
```

- A nivel de workflow, `deploy.yml` solo declara `contents: read` (el mínimo para leer el repositorio).
- `id-token: write` se declara **por job** en la Fase 2 (`ecr-push`, `deploy-staging`, `deploy-production`), porque es **obligatorio** para OIDC (Guía 15): sin él, el job no puede pedir un token a AWS.

### 1.5 El flujo completo en una imagen

```mermaid
flowchart TD
    subgraph Fase1[Fase 1]
        DB[docker-build]
    end
    subgraph Fase2[Fase 2]
        EP[ecr-push] --> DS[deploy-staging]
        DS --> DP[deploy-production]
    end
    Fase1 --> Fase2
    DP --> ECS[ECS Fargate]
```

**ASCII fallback** (si mermaid no renderiza):

```
Fase 1: [docker-build]
            |
            v
Fase 2: [ecr-push] → [deploy-staging] → [deploy-production] → [ECS Fargate]
```

## 2. Fase 1: el job `docker-build`

### 2.1 Qué hace este job

El job `docker-build` es el corazón de la Fase 1. Construye la imagen del server, la prueba contra un stack emulado (Floci + PostgreSQL efímeros) y deja la imagen lista para la Fase 2.

```yaml
docker-build:
  runs-on: ubuntu-latest
  services:
    floci:
      image: floci/floci:1.5.31
      ports:
        - 4566:4566
      env:
        FLOCI_STORAGE_MODE: memory
        FLOCI_HOSTNAME: floci
      options: >-
        --health-cmd "curl -f http://localhost:4566/_localstack/health || exit 1"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
        --health-start-period 10s
    db:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_cd
      ports:
        - 5432:5432
      options: >-
        --health-cmd "pg_isready -U test -d project_one_cd"
        --health-interval 5s
        --health-timeout 5s
        --health-retries 10
        --health-start-period 5s
```

### 2.2 Los servicios efímeros

GitHub Actions permite declarar **servicios** que corren en contenedores durante el job:

| Servicio | Imagen               | Puerto | Propósito                                      |
| -------- | -------------------- | ------ | ---------------------------------------------- |
| `floci`  | `floci/floci:1.5.31` | 4566   | Emular Secrets Manager (y otros servicios AWS) |
| `db`     | `postgres:16-alpine` | 5432   | Base de datos PostgreSQL para el server        |

> 🔑 **Clave**: estos servicios viven solo durante el job. Cuando el job termina, los contenedores se destruyen. Es el mismo patrón que viste en la Guía 12 con `docker-compose.preview.yml`, pero gestionado por GitHub Actions.

### 2.3 El healthcheck de PostgreSQL

```yaml
options: >-
  --health-cmd "pg_isready -U test -d project_one_cd"
  --health-interval 5s
  --health-timeout 5s
  --health-retries 10
  --health-start-period 5s
```

- `pg_isready` comprueba que PostgreSQL acepta conexiones.
- El healthcheck se ejecuta cada 5 segundos.
- Si falla 5 veces seguidas, el contenedor se marca `unhealthy`.
- GitHub Actions espera a que el servicio esté `healthy` antes de ejecutar los steps.

### 2.4 El build de la imagen

```yaml
steps:
  - uses: actions/checkout@v5

  - name: Setup Node.js
    uses: actions/setup-node@v5
    with:
      node-version-file: '.nvmrc'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Build server Docker image
    run: |
      docker build -t project-one-server:${GITHUB_SHA} -t project-one-server:latest -f apps/server/Dockerfile .
    env:
      GITHUB_SHA: ${{ github.sha }}
```

- El build usa el comando `docker build` directo (no un action de buildx): construye la imagen con **dos tags** (`${GITHUB_SHA}` y `latest`) desde el `Dockerfile` del server.
- `-f apps/server/Dockerfile` — el Dockerfile del server; el contexto es la raíz del monorepo (necesario para acceder a `package-lock.json`).
- Antes del build, el job hace `npm ci` en la raíz (necesario para los pasos de migración y smoke tests).

### 2.5 Los smoke tests contra el stack emulado

Después de construir, el job arranca el server con la imagen recién creada y ejecuta smoke tests:

```yaml
- name: Run Prisma migrations
  working-directory: apps/server
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/project_one_cd

- name: Start server container
  run: |
    docker run -d \
      --name cd-server \
      --network host \
      -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_cd \
      -e AWS_ENDPOINT_URL=http://localhost:4566 \
      -e AWS_ACCESS_KEY_ID=test \
      -e AWS_SECRET_ACCESS_KEY=test \
      -e AWS_REGION=us-east-1 \
      -e PORT=3000 \
      -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
      -e ALGORITHM=aes-256-gcm \
      project-one-server:${GITHUB_SHA}

- name: Wait for server health
  run: |
    for i in {1..30}; do
      http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
      if [[ "$http_code" == "200" || "$http_code" == "503" ]]; then
        echo "Server health check passed (HTTP $http_code)"
        exit 0
      fi
      echo "Waiting for server... ($i/30) [HTTP $http_code]"
      sleep 2
    done
    echo "Server health check failed after 60s"
    exit 1

- name: Run smoke tests (emulated)
  working-directory: apps/server
  run: |
    AWS_ENDPOINT_URL=http://localhost:4566 \
    AWS_ACCESS_KEY_ID=test \
    AWS_SECRET_ACCESS_KEY=test \
    AWS_REGION=us-east-1 \
    npm run test:smoke
```

### 2.6 Por qué probar antes de desplegar

El principio es **fail fast**: si la imagen no arranca o los smoke tests fallan, el workflow se detiene aquí y **nunca toca AWS**. Esto ahorra dinero y evita desplegar una imagen rota a staging.

> 💡 El patrón completo (build → test contra emulador → push) es el "learning path" de la Fase 1: primero pruebas local, luego despliegas.

## 3. Fase 2: el job `ecr-push`

### 3.1 Qué hace este job

El job `ecr-push` toma la imagen construida en la Fase 1, se autentica contra Amazon ECR usando OIDC y sube la imagen taggeada con el SHA del commit.

```yaml
ecr-push:
  name: Push to ECR
  needs: docker-build
  runs-on: ubuntu-latest
  timeout-minutes: 10
  concurrency:
    group: deploy-staging
    cancel-in-progress: false
  permissions:
    id-token: write
    contents: read
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  steps:
    - name: Harden Runner
      uses: step-security/harden-runner@v2
      with:
        egress-policy: audit

    - uses: actions/checkout@v5

    - name: Configure AWS credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: ${{ vars.AWS_ROLE_ARN }}
        aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
        role-session-name: gha-${{ github.run_id }}
        role-duration-seconds: 900

    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push image to ECR
      run: |
        docker build -t project-one-server:${GITHUB_SHA} -t project-one-server:latest -f apps/server/Dockerfile .
        docker tag project-one-server:${GITHUB_SHA} ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:${GITHUB_SHA}
        docker tag project-one-server:latest ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:latest
        docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:${GITHUB_SHA}
        docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:latest
      env:
        GITHUB_SHA: ${{ github.sha }}
        AWS_ACCOUNT_ID: ${{ vars.AWS_ACCOUNT_ID }}
```

### 3.2 `needs: docker-build`

La dependencia `needs` garantiza el orden: `ecr-push` solo se ejecuta si `docker-build` terminó con éxito. Si el build falla, `ecr-push` se marca como `skipped` y la Fase 2 no arranca.

### 3.3 OIDC: autenticación sin credenciales estáticas

```yaml
- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v6
  with:
    role-to-assume: ${{ vars.AWS_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
    role-session-name: gha-${{ github.run_id }}
    role-duration-seconds: 900
```

En lugar de guardar `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` como secrets, el workflow pide un **token OIDC** a GitHub y lo intercambia por credenciales temporales de AWS. Esto se explica a fondo en la [Guía 15 — OIDC](./15-oidc-sin-credenciales-estaticas.md).

> 🔑 **Clave**: `role-to-assume` apunta al ARN del rol IAM que el proyecto creó con Terraform (`modules/iam/github-oidc.tf`). El rol tiene una trust policy que solo acepta tokens de este repositorio.

### 3.4 Login a ECR

```yaml
- name: Login to Amazon ECR
  uses: aws-actions/amazon-ecr-login@v2
```

ECR (Elastic Container Registry) es el registro de imágenes de AWS. El action `amazon-ecr-login` autentica a Docker contra el registro y expone el output `registry` (el dominio del registro, p. ej. `123456789012.dkr.ecr.us-east-1.amazonaws.com`).

### 3.5 El push taggeado por SHA

```yaml
docker tag project-one-server:${GITHUB_SHA} ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:${GITHUB_SHA}
docker tag project-one-server:latest ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:latest
docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:${GITHUB_SHA}
docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com/project-one-server:latest
```

La imagen se sube con **dos tags**:

| Tag       | Propósito                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `:<sha>`  | Tag inmutable que identifica el commit exacto. Permite desplegar una versión concreta y hacer rollback. |
| `:latest` | Tag móvil que apunta a la última versión. Cómodo para desarrollo, peligroso para producción.            |

> 💡 **Por qué el SHA importa**: si despliegas `:latest` y algo falla, no sabes qué versión está corriendo. Con `:<sha>` puedes volver a cualquier commit anterior con precisión.

### 3.6 El flujo completo de la Fase 2

```mermaid
flowchart LR
    A[docker-build] --> B[ecr-push]
    B --> C[deploy-staging]
    C --> D[deploy-production]
    D --> E[ECS Fargate]
```

**ASCII fallback** (si mermaid no renderiza):

```
docker-build → ecr-push → deploy-staging → deploy-production → ECS Fargate
```

Cada job de la Fase 2 depende del anterior. Si `ecr-push` falla, nada se despliega.

## 4. Fase 2: el job `deploy-staging`

### 4.1 Qué hace este job

`deploy-staging` despliega la imagen en el entorno de staging (ECS Fargate) de forma **automática**. Es el primer entorno real que recibe la nueva versión.

```yaml
deploy-staging:
  name: Deploy to Staging
  needs: ecr-push
  runs-on: ubuntu-latest
  timeout-minutes: 15
  concurrency:
    group: deploy-staging
    cancel-in-progress: false
  permissions:
    id-token: write
    contents: read
  environment: staging
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  steps:
    - name: Harden Runner
      uses: step-security/harden-runner@v2
      with:
        egress-policy: audit

    - name: Configure AWS credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: ${{ vars.AWS_ROLE_ARN }}
        aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
        role-session-name: gha-${{ github.run_id }}
        role-duration-seconds: 900

    - name: Register task definition (staging)
      id: task-def-staging
      run: |
        TASK_DEF=$(aws ecs register-task-definition \
          --family project-one-staging-api \
          --network-mode awsvpc \
          --requires-compatibilities FARGATE \
          --cpu "256" \
          --memory "512" \
          --execution-role-arn ${{ secrets.STAGING_TASK_EXECUTION_ROLE_ARN }} \
          --task-role-arn ${{ secrets.STAGING_TASK_ROLE_ARN }} \
          --container-definitions '[...]' \
          --query 'taskDefinition.taskDefinitionArn' \
          --output text)
        echo "task_definition_arn=$TASK_DEF" >> $GITHUB_OUTPUT

    - name: Update ECS service (staging)
      run: |
        aws ecs update-service \
          --cluster project-one-staging \
          --service api \
          --task-definition ${{ steps.task-def-staging.outputs.task_definition_arn }} \
          --force-new-deployment \
          --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"

    - name: Wait for service stability (staging)
      run: |
        aws ecs wait services-stable \
          --cluster project-one-staging \
          --services api
```

### 4.2 El `environment: staging`

```yaml
environment: staging
```

El bloque `environment` enlaza el job con un **entorno de GitHub**. Los entornos permiten:

1. **Secrets y variables por entorno**: `staging` puede tener secrets distintos de `production`.
2. **Aprobaciones manuales**: solo si las configuras (producción las tiene, staging no).
3. **Reglas de protección**: ramas permitidas, esperas, etc.
4. **Auditoría**: cada despliegue queda registrado en la pestaña Environments del repo.

> 💡 En este proyecto, `staging` se despliega automáticamente (sin aprobación), mientras que `production` exige aprobación manual. Eso lo verás en la sección 5.

### 4.3 El despliegue a ECS

```bash
aws ecs register-task-definition --family project-one-staging-api ... --query 'taskDefinition.taskDefinitionArn'
aws ecs update-service --cluster project-one-staging --service api \
  --task-definition <task_definition_arn> --force-new-deployment \
  --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"
aws ecs wait services-stable --cluster project-one-staging --services api
```

El proyecto **no usa un action de GitHub** para desplegar a ECS: usa la **CLI de AWS directamente** en tres pasos:

1. `register-task-definition` registra una **nueva revisión** de la task definition con la imagen taggeada por SHA (la definición se construye inline con `--container-definitions`).
2. `update-service` actualiza el servicio ECS para que use esa revisión, con `--force-new-deployment` y el **circuit breaker** activo (`deploymentCircuitBreaker={enable=true,rollback=true}`).
3. `wait services-stable` espera a que el servicio alcance estabilidad (mínimo de tareas running).

> 🔑 Este despliegue es **in-place**: ECS lanza tareas nuevas y retira las viejas progresivamente. La Guía 16 profundiza en el circuit breaker y los health checks de ECS.

### 4.4 Smoke test post-despliegue

Después de desplegar, el job verifica que el servicio responde en el entorno real:

```yaml
- name: Post-deploy health check (staging)
  run: |
    for i in {1..30}; do
      if curl -sf "${{ secrets.STAGING_URL }}/health" > /dev/null; then
        echo "Staging health check passed"
        exit 0
      fi
      echo "Waiting for staging health... ($i/30)"
      sleep 10
    done
    echo "Staging health check failed after 5 minutes"
    exit 1

- name: Run remote smoke tests (staging)
  working-directory: apps/server
  run: |
    BASE_URL="${{ secrets.STAGING_URL }}" npm run test:smoke
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

### 4.5 ¿Por qué staging primero?

El objetivo de staging es **atrapar errores en un entorno casi real** antes de que lleguen a producción:

| Aspecto           | Staging    | Producción    |
| ----------------- | ---------- | ------------- |
| Aprobación manual | No         | Sí            |
| Datos             | Sintéticos | Reales        |
| Riesgo de fallo   | Bajo       | Alto          |
| Automatización    | Completa   | Puerta humana |

> 💡 **Regla mental**: staging es el ensayo general. Producción es el estreno. Nadie se salta el ensayo general.

## 5. Fase 2: el job `deploy-production`

### 5.1 Qué hace este job

`deploy-production` despliega la imagen en producción, pero **solo después de una aprobación humana**:

```yaml
deploy-production:
  name: Deploy to Production
  needs: deploy-staging
  runs-on: ubuntu-latest
  timeout-minutes: 20
  concurrency:
    group: deploy-production
    cancel-in-progress: false
  permissions:
    id-token: write
    contents: read
  environment: production
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  steps:
    - name: Harden Runner
      uses: step-security/harden-runner@v2
      with:
        egress-policy: audit

    - name: Configure AWS credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: ${{ vars.AWS_ROLE_ARN }}
        aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
        role-session-name: gha-${{ github.run_id }}
        role-duration-seconds: 900

    - name: Register task definition (production)
      id: task-def-production
      run: |
        TASK_DEF=$(aws ecs register-task-definition \
          --family project-one-prod-api \
          --network-mode awsvpc \
          --requires-compatibilities FARGATE \
          --cpu "512" \
          --memory "1024" \
          --execution-role-arn ${{ secrets.PROD_TASK_EXECUTION_ROLE_ARN }} \
          --task-role-arn ${{ secrets.PROD_TASK_ROLE_ARN }} \
          --container-definitions '[...]' \
          --query 'taskDefinition.taskDefinitionArn' \
          --output text)
        echo "task_definition_arn=$TASK_DEF" >> $GITHUB_OUTPUT

    - name: Update ECS service (production)
      run: |
        aws ecs update-service \
          --cluster project-one-prod \
          --service api \
          --task-definition ${{ steps.task-def-production.outputs.task_definition_arn }} \
          --force-new-deployment \
          --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"

    - name: Wait for service stability (production)
      run: |
        aws ecs wait services-stable \
          --cluster project-one-prod \
          --services api

    - name: Post-deploy health check (production)
      run: |
        for i in {1..30}; do
          if curl -sf "${{ secrets.PROD_URL }}/health" > /dev/null; then
            echo "Production health check passed"
            exit 0
          fi
          echo "Waiting for production health... ($i/30, 10s intervals)"
          sleep 10
        done
        echo "Production health check failed after 5 minutes"
        exit 1

    - name: Run remote smoke tests (production)
      working-directory: apps/server
      run: |
        BASE_URL="${{ secrets.PROD_URL }}" npm run test:smoke
      env:
        BASE_URL: ${{ secrets.PROD_URL }}
```

### 5.2 La aprobación manual

El entorno `production` está configurado con **required reviewers**. Cuando el job `deploy-production` intenta arrancar, GitHub pausa la ejecución y muestra un botón "Review deployments":

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant USER as Reviewer humano
    participant AWS as AWS ECS
    GHA->>USER: deploy-production listo. ¿Apruebas?
    USER-->>GHA: Apruebo ✓
    GHA->>AWS: Despliega a producción
```

**ASCII fallback** (si mermaid no renderiza):

```
GitHub Actions → Reviewer humano: "deploy-production listo. ¿Apruebas?"
Reviewer humano → GitHub Actions: Apruebo ✓
GitHub Actions → AWS ECS: Despliega a producción
```

### 5.3 ¿Por qué una puerta humana?

La aprobación manual para producción es una **mitigación de riesgo**:

1. Alguien revisa que staging esté sano antes de promover.
2. Permite desplegar en ventanas de baja actividad.
3. Da la oportunidad de revertir el commit si staging mostró problemas.
4. Cumple requisitos de auditoría (quién aprobó qué y cuándo).

> ⚠️ **Importante**: la aprobación humana **no** sustituye a los tests automáticos. Es una capa adicional sobre ellos, no un reemplazo.

## 6. El gating `vars.AWS_ROLE_ARN != ''` y los jobs `*-skipped`

### 6.1 El problema que resuelve

No todos los forks o repositorios tienen AWS configurado. Si un workflow intenta asumir un rol que no existe, falla con un error confuso. El gating evita eso: **si no hay rol AWS, el despliegue se salta limpiamente**.

### 6.2 El patrón de gating

```yaml
if: vars.AWS_ROLE_ARN != ''
```

Este `if` a nivel de job evalúa la variable de configuración `AWS_ROLE_ARN`:

- Si está definida (no vacía) → el job se ejecuta.
- Si está vacía → el job se **salta** y GitHub lo muestra como `skipped` en la UI.

### 6.3 Los jobs `*-skipped`

Para que la UI sea clara, el workflow define jobs espejo que se ejecutan cuando el job real se salta:

```yaml
ecr-push-skipped:
  name: ECR Push (Skipped - No AWS Config)
  needs: docker-build
  runs-on: ubuntu-latest
  timeout-minutes: 1
  concurrency:
    group: deploy-staging
    cancel-in-progress: false
  if: ${{ vars.AWS_ROLE_ARN == '' }}
  steps:
    - name: Report skipped
      run: |
        echo "::notice title=ECR Push Skipped::AWS_ROLE_ARN repository variable is not configured. This job requires AWS infrastructure (OIDC role + ECR repo). Configure vars.AWS_ROLE_ARN and vars.AWS_ACCOUNT_ID to enable Phase 2."
        exit 0
```

### 6.4 Las annotations `::notice::`

GitHub Actions tiene tres niveles de annotations que aparecen en la UI:

| Comando       | Nivel             | Color en UI |
| ------------- | ----------------- | ----------- |
| `::error::`   | Error             | Rojo        |
| `::warning::` | Advertencia       | Amarillo    |
| `::notice::`  | Aviso informativo | Azul/gris   |

```bash
echo "::notice title=Deploy Skipped::AWS_ROLE_ARN repository variable is not configured."
```

La annotation aparece en la pestaña **Annotations** del job, visible para cualquiera que mire el run. Así, un run "verde" con jobs skipped no confunde: hay un aviso explícito de por qué se saltó.

### 6.5 El patrón completo

```yaml
# Job real (solo si hay AWS)
deploy-staging:
  needs: ecr-push
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  ...

# Job espejo (solo si NO hay AWS)
deploy-staging-skipped:
  name: Deploy Staging (Skipped - No AWS Config)
  needs: docker-build
  runs-on: ubuntu-latest
  timeout-minutes: 1
  concurrency:
    group: deploy-staging
    cancel-in-progress: false
  if: ${{ vars.AWS_ROLE_ARN == '' }}
  steps:
    - name: Report skipped
      run: |
        echo "::notice title=Staging Deploy Skipped::AWS_ROLE_ARN repository variable is not configured. ECS staging cluster and environment secrets not provisioned. Complete Floci ECS learning milestone to unlock."
        exit 0
```

### 6.6 Por qué este patrón es importante

1. **Repos sin AWS**: un fork del proyecto puede ejecutar el workflow sin fallar.
2. **UI clara**: los reviewers ven exactamente qué se ejecutó y qué se saltó.
3. **Learning path**: en la Fase 1 del aprendizaje, el alumno puede correr el workflow sin AWS y ver los notices.

> 🔑 **Regla mental**: `if: vars.AWS_ROLE_ARN != ''` es un interruptor de configuración. Los jobs `*-skipped` son la señalización que hace visible el estado del interruptor.

### 6.7 Ejemplo de run con gating activo

```text
✔ docker-build          (Fase 1 — build + smoke tests)
✔ ecr-push              (Fase 2 — OIDC + ECR)
✔ deploy-staging        (Fase 2 — automático)
⏸ deploy-production     (Fase 2 — esperando aprobación)
```

### 6.8 Ejemplo de run sin AWS configurado

```text
✔ docker-build          (Fase 1 — build + smoke tests)
✔ ecr-push-skipped      (::notice:: AWS_ROLE_ARN not set)
✔ deploy-staging-skipped (::notice:: AWS_ROLE_ARN not set)
✔ deploy-production-skipped (::notice:: AWS_ROLE_ARN not set)
```

El run termina en verde, pero los notices explican que no hubo despliegue.

## 7. Inventario de secrets y variables

### 7.1 La diferencia entre secrets y variables

| Tipo         | Sintaxis         | Visibilidad         | Uso típico                                          |
| ------------ | ---------------- | ------------------- | --------------------------------------------------- |
| **Secret**   | `secrets.NOMBRE` | Enmascarado en logs | Contraseñas, tokens, claves                         |
| **Variable** | `vars.NOMBRE`    | Visible en logs     | Configuración no sensible (ARNs, regiones, nombres) |

> 💡 Referencia completa: [Guía 03 — Secrets y variables](./03-secrets-variables.md) y la sección 14 de `docs/workflows-mantenimiento-guia.md`.

### 7.2 Variables de configuración (`vars.*`)

| Variable              | Ejemplo                                                     | Propósito                                                            |
| --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `vars.AWS_ROLE_ARN`   | `arn:aws:iam::123456789012:role/project-one-github-actions` | Rol IAM a asumir vía OIDC (creado en `modules/iam/github-oidc.tf`)   |
| `vars.AWS_REGION`     | `us-east-1`                                                 | Región de AWS (con fallback `us-east-1` en el workflow)              |
| `vars.AWS_ACCOUNT_ID` | `123456789012`                                              | ID de la cuenta AWS; se usa para componer la URL del repositorio ECR |

> ℹ️ El workflow **no** usa variables tipo `ECR_REPOSITORY`, `ECS_CLUSTER` o `ECS_SERVICE_*`: esos nombres están **hardcodeados** en el YAML (p. ej. familia `project-one-staging-api`, cluster `project-one-staging`, servicio `api`). Solo hay 3 variables: `AWS_ROLE_ARN`, `AWS_REGION` y `AWS_ACCOUNT_ID`.

### 7.3 Secrets de staging (`secrets.STAGING_*`)

| Secret                                         | Propósito                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `secrets.STAGING_DATABASE_URL_SECRET_ARN`      | ARN del secret con la URL de conexión a la BD de staging                       |
| `secrets.STAGING_JWT_SECRET_SECRET_ARN`        | ARN del secret de firma de access tokens (se inyecta como `SECRETKEY`)         |
| `secrets.STAGING_REFRESH_SECRETKEY_SECRET_ARN` | ARN del secret de firma de refresh tokens (se inyecta como `REFRESHSECRETKEY`) |
| `secrets.STAGING_AES_GCM_KEY_SECRET_ARN`       | ARN del secret de cifrado AES-GCM (se inyecta como `AES_GCM_KEY`)              |
| `secrets.STAGING_AWS_REGION_SECRET_ARN`        | ARN del secret de región AWS (se inyecta como `AWS_REGION`)                    |
| `secrets.STAGING_TASK_EXECUTION_ROLE_ARN`      | ARN del rol de ejecución de la task definition                                 |
| `secrets.STAGING_TASK_ROLE_ARN`                | ARN del rol de la tarea                                                        |
| `secrets.STAGING_URL`                          | URL pública del entorno staging (usada por los smoke tests remotos)            |

### 7.4 Secrets de producción (`secrets.PROD_*`)

| Secret                                      | Propósito                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `secrets.PROD_DATABASE_URL_SECRET_ARN`      | ARN del secret con la URL de conexión a la BD de producción                    |
| `secrets.PROD_JWT_SECRET_SECRET_ARN`        | ARN del secret de firma de access tokens (se inyecta como `SECRETKEY`)         |
| `secrets.PROD_REFRESH_SECRETKEY_SECRET_ARN` | ARN del secret de firma de refresh tokens (se inyecta como `REFRESHSECRETKEY`) |
| `secrets.PROD_AES_GCM_KEY_SECRET_ARN`       | ARN del secret de cifrado AES-GCM (se inyecta como `AES_GCM_KEY`)              |
| `secrets.PROD_AWS_REGION_SECRET_ARN`        | ARN del secret de región AWS (se inyecta como `AWS_REGION`)                    |
| `secrets.PROD_TASK_EXECUTION_ROLE_ARN`      | ARN del rol de ejecución de la task definition                                 |
| `secrets.PROD_TASK_ROLE_ARN`                | ARN del rol de la tarea                                                        |
| `secrets.PROD_URL`                          | URL pública de producción (usada por los smoke tests remotos)                  |

### 7.5 Cómo se inyectan en la task definition

Los secrets no van en el Dockerfile ni en el código. Se inyectan en la task definition de ECS como variables de entorno:

```json
{
  "environment": [{ "name": "DATABASE_URL", "value": "..." }],
  "secrets": [
    {
      "name": "SECRETKEY",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/prod/SECRETKEY"
    }
  ]
}
```

> 🔑 **Clave**: en ECS, los secrets sensibles se guardan en **AWS Systems Manager Parameter Store** o **Secrets Manager**, y la task definition referencia el ARN. El código nunca ve el valor en claro en el repositorio.

### 7.6 El flujo de los secrets en el despliegue

```mermaid
flowchart LR
    A[GitHub Secrets] --> B[workflow deploy.yml]
    B --> C[task-definition JSON]
    C --> D[ECS Fargate]
    D --> E[env vars en el contenedor]
```

**ASCII fallback** (si mermaid no renderiza):

```
GitHub Secrets → deploy.yml → task-definition JSON → ECS Fargate → env vars en el contenedor
```

### 7.7 Buenas prácticas de inventario

1. **Nunca** pongas un secret en `vars.*` (sería visible en logs).
2. **Prefija** los secrets por entorno (`STAGING_`, `PROD_`) para evitar colisiones.
3. **Rota** los secrets periódicamente (especialmente `SECRETKEY`).
4. **Documenta** cada secret en `docs/workflows-mantenimiento-guia.md` sección 14.
5. Usa **Parameter Store** para valores que cambian sin redeploy.

> ⚠️ **Ojo**: si un secret aparece en los logs, GitHub lo enmascara automáticamente, pero eso no es una excusa para filtrarlo. El enmascarado es un parche, no una solución.

## 8. El gotcha: `JWT_SECRET` vs `SECRETKEY`

### 8.1 El problema

En versiones antiguas del proyecto, la variable de entorno se llamaba `JWT_SECRET`. El código actual, sin embargo, lee **`SECRETKEY`** y **`REFRESHSECRETKEY`**. Si despliegas con `JWT_SECRET` pero el código busca `SECRETKEY`, la app arranca pero **la autenticación falla en runtime**.

### 8.2 Qué lee el código realmente

```js
// apps/server/src/config/dotenv.js (simplificado)
const secretKey = process.env.SECRETKEY; // ← el código lee ESTO
const refreshSecretKey = process.env.REFRESHSECRETKEY; // ← y ESTO
```

El código **no** lee `JWT_SECRET`. Es un nombre legacy que quedó en documentación antigua y en algunos ejemplos.

### 8.3 La tabla de correspondencia

| Nombre legacy (NO usar) | Nombre actual (usar) | Propósito                         |
| ----------------------- | -------------------- | --------------------------------- |
| `JWT_SECRET`            | `SECRETKEY`          | Firmar y verificar access tokens  |
| —                       | `REFRESHSECRETKEY`   | Firmar y verificar refresh tokens |

### 8.4 Por qué ocurre este tipo de gotcha

1. **Renombrado incompleto**: se renombró la variable en el código pero no en la documentación.
2. **Dos fuentes de verdad**: el `.env.example` y la guía de mantenimiento divergieron.
3. **Falta de tests de integración**: nadie detectó que la app arrancaba con la variable equivocada.

### 8.5 Cómo detectarlo

```bash
# En el contenedor desplegado
docker exec <container> env | grep -i secret

# Debe mostrar SECRETKEY y REFRESHSECRETKEY
# Si solo muestra JWT_SECRET, el despliegue está mal configurado
```

### 8.6 Cómo evitarlo en el futuro

1. **Una sola fuente de verdad**: el `.env.example` del server es la referencia canónica.
2. **Validación al arrancar**: el código debería fallar rápido si `SECRETKEY` falta:

```js
if (!process.env.SECRETKEY) {
  throw new Error('SECRETKEY is required');
}
```

3. **Tests de integración** que verifiquen que un login real funciona contra el entorno desplegado.
4. **Buscar referencias legacy** antes de desplegar:

```bash
grep -rn "JWT_SECRET" apps/server/ docs/ --include="*.ts" --include="*.md"
```

> 🔑 **Regla mental**: el nombre de una variable de entorno es un **contrato** entre el código y la infraestructura. Si cambias uno, cambia el otro, y actualiza toda la documentación.

### 8.7 El gotcha en el contexto del workflow

En `deploy.yml`, los secrets `STAGING_JWT_SECRET_SECRET_ARN` y `PROD_JWT_SECRET_SECRET_ARN` se inyectan en la task definition como `SECRETKEY` (y `STAGING_REFRESH_SECRETKEY_SECRET_ARN` / `PROD_REFRESH_SECRETKEY_SECRET_ARN` como `REFRESHSECRETKEY`). Si alguien "arregla" el workflow usando `JWT_SECRET` por costumbre, rompe la autenticación en silencio. Por eso el inventario de la sección 7 es tan importante.

## 9. Concurrency groups

### 9.1 Qué son

Los concurrency groups evitan que dos ejecuciones del mismo workflow (o job) corran a la vez:

```yaml
concurrency: deploy-staging
```

```yaml
concurrency: deploy-production
```

### 9.2 El comportamiento

| Configuración                         | Comportamiento                                        |
| ------------------------------------- | ----------------------------------------------------- |
| `concurrency: deploy-staging`         | Solo una ejecución de `deploy-staging` a la vez       |
| `cancel-in-progress: false` (default) | La ejecución nueva **espera** a que termine la actual |

### 9.3 Por qué `cancel-in-progress: false` aquí

En despliegues, **cancelar** una ejecución en curso es peligroso:

- Si cancelas un `ecr-push` a mitad, puedes dejar ECR con una imagen a medias.
- Si cancelas un `deploy-staging`, el servicio ECS puede quedar en estado inconsistente.
- Dos despliegues simultáneos al mismo servicio ECS pueden pisarse.

Por eso el workflow usa `cancel-in-progress: false` (el valor por defecto): la ejecución nueva **se pone en cola** y espera.

### 9.4 Comparación con preview.yml

| Workflow      | Concurrency                           | cancel-in-progress           |
| ------------- | ------------------------------------- | ---------------------------- |
| `deploy.yml`  | `deploy-staging`, `deploy-production` | `false` (espera)             |
| `preview.yml` | `preview-<n>`                         | `true` (cancela la anterior) |

> 💡 La diferencia tiene sentido: en preview, la versión nueva **reemplaza** a la anterior (cancelar es seguro). En deploy, cada despliegue es una operación delicada que no debe interrumpirse. Verás el detalle en la [Guía 14](./14-preview-environments-yml.md).

### 9.5 Concurrency con contexto

A veces el grupo incluye contexto para separar ramas o entornos:

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false
```

En este proyecto, los grupos son fijos (`deploy-staging`, `deploy-production`) porque solo hay una rama de despliegue (main).

## 10. Resumen

### 10.1 El flujo completo

```mermaid
flowchart TD
    A[Push a main] --> B[docker-build]
    B -->|imagen válida| C[ecr-push]
    C --> D[deploy-staging]
    D -->|aprobación manual| E[deploy-production]
    E --> F[ECS Fargate]
    B -.->|sin AWS_ROLE_ARN| G[*-skipped con ::notice::]
```

**ASCII fallback** (si mermaid no renderiza):

```
Push a main → docker-build → ecr-push → deploy-staging → deploy-production → ECS Fargate
                |
                +-- sin AWS_ROLE_ARN → *-skipped con ::notice::
```

### 10.2 Los 7 conceptos clave

1. **Dos fases**: build/test (Fase 1) y deploy (Fase 2). Fail fast antes de tocar AWS.
2. **Servicios efímeros**: Floci + PostgreSQL viven solo durante el job.
3. **OIDC**: autenticación sin credenciales estáticas (Guía 15).
4. **Tag por SHA**: cada imagen es identificable y reversible.
5. **Staging automático, producción con aprobación**: la puerta humana como mitigación de riesgo.
6. **Gating con `vars.AWS_ROLE_ARN`**: repos sin AWS no fallan, se saltan con notices.
7. **Concurrency sin cancelación**: los despliegues esperan, no se interrumpen.

### 10.3 Errores comunes

| Error                           | Causa                              | Solución                                                         |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `AccessDenied` al asumir rol    | Trust policy mal configurada       | Revisar `modules/iam/github-oidc.tf` (Guía 15)                   |
| Login falla en runtime          | `JWT_SECRET` en vez de `SECRETKEY` | Usar los nombres actuales (sección 8)                            |
| Dos deploys a la vez            | Sin concurrency group              | Añadir `concurrency: deploy-<env>`                               |
| Imagen rota en staging          | Smoke tests insuficientes          | Ampliar la suite `npm run test:smoke` (`vitest.smoke.config.js`) |
| `::notice::` de skip inesperado | `AWS_ROLE_ARN` vacío               | Configurar la variable en el repo                                |

## ❓ FAQ

### ¿Puedo ejecutar deploy.yml en un fork sin AWS?

Sí. Gracias al gating `vars.AWS_ROLE_ARN != ''`, los jobs de despliegue se saltan con notices. El build y los smoke tests sí se ejecutan.

### ¿Por qué staging no tiene aprobación manual?

Porque staging es un entorno de pruebas de bajo riesgo. La aprobación manual añade latencia; en staging se prioriza la velocidad de iteración. Producción, en cambio, prioriza la seguridad.

### ¿Qué pasa si apruebo producción y el despliegue falla?

El workflow usa el **CLI nativo de AWS** (no un action): `aws ecs update-service --force-new-deployment` con `deploymentCircuitBreaker={enable=true,rollback=true}`, y luego `aws ecs wait services-stable`. Si el servicio no se estabiliza, el circuit breaker revierte automáticamente a la task definition anterior y el job falla. Para un rollback manual, despliega el SHA anterior (ver siguiente pregunta).

### ¿Cómo hago rollback?

Vuelve a ejecutar el workflow con el SHA anterior, o despliega manualmente la imagen `:<sha-anterior>`:

```bash
aws ecs update-service --cluster project-one-prod --service api \
  --force-new-deployment \
  --task-definition <task-def-anterior>
```

Para staging (cluster real: `project-one-staging`, servicio real: `api`):

```bash
aws ecs update-service --cluster project-one-staging --service api \
  --force-new-deployment \
  --task-definition <task-def-anterior>
```

### ¿Dónde se guardan los secrets de ECS?

En AWS Systems Manager Parameter Store o Secrets Manager. La task definition referencia los ARNs. Ver sección 7.5.

### ¿Por qué el tag `:latest` es peligroso?

Porque es móvil: no sabes qué versión contiene. Si dos deploys ocurren cerca, `:latest` puede apuntar a una versión que nadie verificó. El tag `:<sha>` es inmutable y trazable.

## 11. Glosario

| Término               | Definición                                                                            |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Annotation**        | Mensaje de GitHub Actions visible en la UI (`::notice::`, `::warning::`, `::error::`) |
| **Concurrency group** | Mecanismo para serializar ejecuciones de un workflow                                  |
| **ECR**               | Elastic Container Registry: registro de imágenes Docker de AWS                        |
| **ECS**               | Elastic Container Service: orquestador de contenedores de AWS                         |
| **Environment**       | Entorno de GitHub con secrets, variables y reglas de aprobación                       |
| **Fargate**           | Modo serverless de ECS: no gestionas servidores                                       |
| **Gating**            | Condición `if:` que decide si un job se ejecuta o se salta                            |
| **OIDC**              | OpenID Connect: autenticación federada sin credenciales estáticas                     |
| **Rollback**          | Volver a una versión anterior de la aplicación                                        |
| **SHA**               | Hash del commit; identifica una versión exacta del código                             |
| **Task definition**   | Definición JSON de cómo correr un contenedor en ECS                                   |

## ✅ Checklist de la guía

- [ ] Puedo explicar la estructura de dos fases de deploy.yml.
- [ ] Puedo desglosar el job `docker-build` y sus servicios efímeros.
- [ ] Puedo explicar el flujo `ecr-push` con OIDC y tag por SHA.
- [ ] Puedo comparar `deploy-staging` vs `deploy-production`.
- [ ] Puedo explicar el gating `vars.AWS_ROLE_ARN != ''` y los jobs `*-skipped`.
- [ ] Puedo hacer el inventario de secrets y variables del workflow.
- [ ] Puedo explicar el gotcha `JWT_SECRET` vs `SECRETKEY`.
- [ ] Puedo explicar los concurrency groups y su `cancel-in-progress: false`.

## 🧭 Navegación

| Anterior                                                  | Actual                             | Siguiente                                                     |
| --------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| [12 — Floci: emulador de AWS](./12-floci-emulador-aws.md) | **13 — Walkthrough de deploy.yml** | [14 — Preview environments](./14-preview-environments-yml.md) |

- [Volver al índice Avanzado](./avanzado-README.md)

---

_Guía 13 de 7 del nivel Avanzado. Siguiente: [14 — Preview environments](./14-preview-environments-yml.md)._
