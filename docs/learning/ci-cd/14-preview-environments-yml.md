# Guía 14 — Preview environments: walkthrough de `preview.yml`

> **Nivel**: Avanzado · **Guía 14 de 7** · **Tema**: Entornos de preview por PR con Floci y Vercel

Esta guía desglosa `.github/workflows/preview.yml`, el workflow que crea un **entorno de preview** para cada Pull Request: levanta el server con Floci y PostgreSQL, ejecuta migraciones y smoke tests, y publica la URL de preview de Vercel como comentario en el PR.

## 🎯 Objetivos de aprendizaje

- [ ] Explicar los triggers de `preview.yml` (PR opened/reopened/synchronize + workflow_dispatch).
- [ ] Desglosar los servicios efímeros (Floci + PostgreSQL) y el build de la imagen.
- [ ] Explicar Prisma migrate, el arranque del contenedor y el health check (200/503).
- [ ] Explicar los smoke tests contra Floci (`preview-smoke.mjs`).
- [ ] Explicar la captura de la URL de preview de Vercel vía commit status API.
- [ ] Explicar el comentario en el PR con marker `<!-- preview-environments -->`.
- [ ] Explicar el concurrency `preview-<n>` con `cancel-in-progress: true`.
- [ ] Comparar preview vs deploy (Guía 13) y entender cuándo usar cada uno.

## 📋 Prerequisitos

- Guía 12 — [Floci: emulador de AWS](./12-floci-emulador-aws.md)
- Guía 13 — [Walkthrough de deploy.yml](./13-deploy-yml-walkthrough.md)
- Guía 06 — [Walkthrough de ci.yml](./06-ci-yml-walkthrough.md)
- Guía 03 — [Secrets y variables](./03-secrets-variables.md)
- Conocimiento de GitHub Actions (Guía 02) y Docker (Guía 04)

## 1. ¿Qué es un preview environment?

### 1.1 La idea

Un **preview environment** es una versión efímera de la aplicación que se levanta para **cada Pull Request**. Permite que revisores y stakeholders prueben los cambios en un entorno real (con URL pública) **antes** de mergear.

```mermaid
flowchart LR
    A[Abrir PR] --> B[preview.yml]
    B --> C[Server + Floci + Postgres]
    B --> D[Vercel preview URL]
    C --> E[Comentario en el PR]
    D --> E
```

**ASCII fallback** (si mermaid no renderiza):

```
Abrir PR → preview.yml → [Server + Floci + Postgres] ─┐
                        → [Vercel preview URL] ───────┴→ Comentario en el PR
```

### 1.2 Preview vs deploy

| Aspecto    | Preview (este workflow) | Deploy (Guía 13)   |
| ---------- | ----------------------- | ------------------ |
| Disparador | PR abierto/actualizado  | Push a main        |
| Entorno    | Efímero, por PR         | Staging/Producción |
| Datos      | Sintéticos (Floci)      | Reales             |
| Duración   | Horas (vida del PR)     | Permanente         |
| Costo      | Bajo                    | Alto               |
| Aprobación | No                      | Producción: sí     |

> 🔑 **Regla mental**: preview responde a "¿cómo se ve este cambio?"; deploy responde a "¿cómo se ve en producción?".

### 1.3 El flujo del workflow

```mermaid
flowchart TD
    A[PR opened/synchronize] --> B[Build imagen server]
    B --> C[Levantar Floci + Postgres]
    C --> D[Prisma migrate]
    D --> E[Arrancar contenedor server]
    E --> F[Health check 200/503]
    F --> G[Smoke tests preview-smoke.mjs]
    G --> H[Capturar URL Vercel]
    H --> I[Comentar en el PR]
```

**ASCII fallback** (si mermaid no renderiza):

```
PR opened/synchronize → Build imagen → Floci + Postgres → Prisma migrate → Arrancar server → Health check 200/503 → Smoke tests → Capturar URL Vercel → Comentar en el PR
```

## 2. Los triggers

### 2.1 El bloque `on`

```yaml
on:
  pull_request:
    types: [opened, reopened, synchronize]
    branches: [main]
  workflow_dispatch:
```

### 2.2 Los tipos de PR

| Tipo          | Cuándo ocurre                   | ¿Ejecuta preview?       |
| ------------- | ------------------------------- | ----------------------- |
| `opened`      | Se abre el PR                   | ✅ Sí                   |
| `reopened`    | Se reabre un PR cerrado         | ✅ Sí                   |
| `synchronize` | Se pushea un commit nuevo al PR | ✅ Sí                   |
| `closed`      | Se cierra/mergea el PR          | ❌ No (limpieza aparte) |
| `edited`      | Se edita título/descripción     | ❌ No                   |

> 💡 `synchronize` es el más importante: cada push a la rama del PR regenera el preview con la última versión.

### 2.3 El filtro de rama

```yaml
branches: [main]
```

Solo los PRs **hacia** `main` disparan el workflow. Un PR hacia otra rama no crea preview.

### 2.4 `workflow_dispatch`

```yaml
workflow_dispatch:
```

Permite ejecutar el workflow **manualmente** desde la UI de GitHub. Útil para:

- Regenerar un preview que falló por un problema transitorio.
- Probar el workflow sin abrir un PR.
- Depurar el pipeline.

### 2.5 El contexto del PR

Dentro del workflow, el contexto `github.event.pull_request` da acceso a los datos del PR:

```yaml
${{ github.event.pull_request.number }}   # número del PR
${{ github.event.pull_request.head.sha }} # SHA del último commit del PR
${{ github.event.pull_request.head.ref }} # nombre de la rama
```

## 3. Los servicios efímeros y el build

### 3.1 Los servicios del job

Igual que en `deploy.yml` (Guía 13), el job declara servicios que viven solo durante la ejecución:

````yaml
jobs:
  preview:
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
          POSTGRES_DB: project_one_preview
        ports:
          - 5432:5432
### 3.2 La configuración de Floci

```yaml
env:
  FLOCI_STORAGE_MODE: memory
  FLOCI_HOSTNAME: floci
options: >-
  --health-cmd "curl -f http://localhost:4566/_localstack/health || exit 1"
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
  --health-start-period 10s
````

| Variable                              | Para qué                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `FLOCI_STORAGE_MODE: memory`          | Los servicios emulados guardan estado en memoria (efímero por diseño)          |
| `FLOCI_HOSTNAME: floci`               | Hostname del contenedor para que el server lo resuelva en la red de servicios  |
| `--health-cmd .../_localstack/health` | Healthcheck compatible con LocalStack (mismo criterio que deploy.yml, Guía 13) |

> ℹ️ **Floci no usa la variable `SERVICES` de LocalStack**: siempre arranca con sus servicios emulados (68 en total). Lo que cambia es el _modo de almacenamiento_ (`memory` = efímero, sin persistencia). En este stack solo se ejercita Secrets Manager vía el smoke test; S3 y DynamoDB arrancan igualmente aunque el preview no los use.

### 3.3 El build de la imagen del server

```yaml
steps:
  - uses: actions/checkout@v5

  - name: Build server Docker image
    run: docker build -t preview-server -f apps/server/Dockerfile .
```

- `docker build` con `-f apps/server/Dockerfile` y **contexto raíz del monorepo** (necesario para que el Dockerfile acceda a `package-lock.json` y los workspaces).
- `-t preview-server`: tag local; la imagen queda en el runner y se reutiliza en el paso "Start server container".
- **Sin registro**: no hay ECR ni credenciales AWS. Preview es un entorno de prueba, no un artefacto de producción.
- El build valida además que el Dockerfile usado por `docker-compose.preview.yml` (Guía 12) sigue siendo válido.
  load: true
  tags: server:preview
  cache-from: type=gha
  cache-to: type=gha,mode=max

````

- `push: false` + `load: true`: la imagen queda en el runner, no se sube a ningún registro.
- `tags: server:preview`: tag local para referenciarla después.
- Caché `type=gha`: reutiliza capas de builds anteriores (Guía 09).

### 3.4 ¿Por qué no usar la imagen de ECR?

En preview no hay ECR: la imagen se construye y se usa **en el mismo runner**. Es más rápido y no requiere credenciales AWS. El preview es un entorno de prueba, no un artefacto de producción.

### 3.5 El orden de los pasos

```mermaid
flowchart LR
    A[checkout] --> B[build imagen] --> C[prisma migrate] --> D[run contenedor] --> E[health check] --> F[smoke tests]
````

**ASCII fallback** (si mermaid no renderiza):

```
checkout → build imagen → prisma migrate → run contenedor → health check → smoke tests
```

Cada paso depende del anterior. Si el build falla, no hay migrate; si el migrate falla, no hay contenedor; etc.

## 4. Prisma migrate, arranque y health check

### 4.1 Prisma migrate

Antes de arrancar el server, hay que preparar la base de datos:

````yaml
  - name: Run Prisma migrations
```yaml
  - name: Run Prisma migrations
    working-directory: apps/server
    run: npx prisma migrate deploy
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/project_one_preview
````

- `prisma migrate deploy` aplica las migraciones pendientes a la BD.
- Se usa `deploy` (no `dev`) porque es un entorno no interactivo.
- La `DATABASE_URL` apunta al servicio `db` del job (`test`/`test`/`project_one_preview`).

> 🔑 **Clave**: el orden importa. Primero migraciones, luego arrancar el server. Si el server arranca antes de que existan las tablas, falla al conectar.

### 4.2 Arranque del contenedor con env vars dummy

````yaml
```yaml
  - name: Start server container
    run: |
      docker run -d \
        --name preview-server \
        --network host \
        -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview \
        -e AWS_ENDPOINT_URL=http://localhost:4566 \
        -e AWS_ACCESS_KEY_ID=test \
        -e AWS_SECRET_ACCESS_KEY=test \
        -e AWS_REGION=us-east-1 \
        -e PORT=3000 \
        -e ENABLE_SMOKE_ROUTE=true \
        -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
        -e ALGORITHM=aes-256-gcm \
        preview-server
````

Las variables son **dummy** (de prueba):

| Variable                | Valor                                                       | Por qué                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | `postgresql://test:test@localhost:5432/project_one_preview` | BD efímera del job                                                                       |
| `AWS_ENDPOINT_URL`      | `http://localhost:4566`                                     | Apuntar a Floci, no a AWS real                                                           |
| `AWS_ACCESS_KEY_ID`     | `test`                                                      | Credenciales dummy de Floci                                                              |
| `AWS_SECRET_ACCESS_KEY` | `test`                                                      | Credenciales dummy de Floci                                                              |
| `AWS_REGION`            | `us-east-1`                                                 | Región (AWS SDK v3)                                                                      |
| `PORT`                  | `3000`                                                      | Puerto del server                                                                        |
| `ENABLE_SMOKE_ROUTE`    | `true`                                                      | Expone `GET /_smoke/secrets` para el smoke test                                          |
| `AES_GCM_KEY`           | Base64 dummy de 32 ceros                                    | Requerida por el bootstrap del middleware de cifrado (`encription-prisma-middleware.js`) |
| `ALGORITHM`             | `aes-256-gcm`                                               | Algoritmo de cifrado                                                                     |

> ℹ️ No se inyectan `SECRETKEY`/`REFRESHSECRETKEY` en preview: el server arranca con la ruta de smoke (`ENABLE_SMOKE_ROUTE`) y sin autenticación real. `--network host` evita publicar puertos con `-p` y simplifica la red con los servicios del job.
> ⚠️ **Nunca** uses secrets reales en preview. El entorno es efímero y público; cualquier secret real sería un riesgo.

### 4.3 El health check (200 o 503)

```yaml
- name: Wait for server health
  run: |
    for i in {1..30}; do
      http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
      if [[ "$http_code" == "200" || "$http_code" == "503" ]]; then
        echo "✅ Server health check passed (HTTP $http_code)"
        exit 0
      fi
      echo "⏳ Waiting for server... ($i/30) [HTTP $http_code]"
      sleep 2
    done
    echo "❌ Server health check failed after 60s"
    exit 1
```

El patrón de polling (mismo criterio que deploy.yml, Guía 13):

1. Hace `curl` al endpoint `/health` cada 2 segundos.
2. Si responde `200` (sano) **o `503`** (vivo con BD degradada) → health gate superado.
3. Cualquier otro código (o error de conexión) → sigue esperando.
4. Tras 30 intentos (~60s), falla con error.

> 💡 **¿Por qué acepta 503?** El endpoint `/health` devuelve `503` cuando el server está vivo pero la BD aún no está lista (degraded). El health gate es de **supervivencia del proceso**: si el server responde 200 o 503, está de pie, y la evaluación real del backend se difiere a los smoke tests del paso siguiente.

### 4.4 Los smoke tests contra Floci

````yaml
```yaml
  - name: Run AWS emulation smoke tests
    run: |
      AWS_ENDPOINT_URL=http://localhost:4566 \
      AWS_ACCESS_KEY_ID=test \
      AWS_SECRET_ACCESS_KEY=test \
      AWS_REGION=us-east-1 \
      SERVER_BASE_URL=http://localhost:3000 \
      node apps/server/scripts/preview-smoke.mjs
    env:
      AWS_ENDPOINT_URL: http://localhost:4566
      AWS_ACCESS_KEY_ID: test
      AWS_SECRET_ACCESS_KEY: test
      AWS_REGION: us-east-1
      SERVER_BASE_URL: http://localhost:3000
````

El script `preview-smoke.mjs` (`apps/server/scripts/preview-smoke.mjs`) hace **dos comprobaciones** contra el stack emulado:

1. **CreateSecret + GetSecretValue** directamente contra el Secrets Manager emulado por Floci.
2. **`GET /_smoke/secrets`** contra el server (`SERVER_BASE_URL`): verifica que el `secretsClient` de la app puede leer un secreto a través de la ruta de smoke expuesta con `ENABLE_SMOKE_ROUTE=true`.

```js
// apps/server/scripts/preview-smoke.mjs (patrón simplificado)
import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  endpoint: process.env.AWS_ENDPOINT_URL, // http://localhost:4566
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 1. Crear el secreto
await client.send(
  new CreateSecretCommand({
    Name: 'smoke/test',
    SecretString: 'ok',
  })
);

// 2. Leerlo
const { SecretString } = await client.send(
  new GetSecretValueCommand({
    SecretId: 'smoke/test',
  })
);

if (SecretString !== 'ok') {
  throw new Error('Smoke test failed: secret mismatch');
}
console.log('✅ Smoke test passed: CreateSecret + GetSecretValue OK');
```

> 🔑 **Qué valida realmente**: que el server (o el script) puede hablar con Secrets Manager emulado y que la ruta de smoke de la app funciona. Si Floci no estuviera arriba, o el endpoint estuviera mal, el smoke test fallaría y el preview se marcaría como fallido.

### 5.1 El contexto

El frontend (React) se despliega en **Vercel**. Cuando hay un PR, Vercel genera automáticamente una **preview deployment** con una URL propia. El workflow necesita descubrir esa URL y publicarla en el PR.

### 5.2 Commit status API

Vercel integra con GitHub mediante **commit statuses**: cuando Vercel despliega una preview, crea un status en el commit del PR con la URL de la preview.

```mermaid
sequenceDiagram
    participant GH as GitHub
    participant V as Vercel
    participant WA as Workflow preview.yml
    V->>GH: Crea commit status "Preview ready" con target_url
    WA->>GH: gh api repos/{owner}/{repo}/commits/{sha}/status
    GH-->>WA: statuses[] con target_url de la preview
```

**ASCII fallback** (si mermaid no renderiza):

```yaml
- name: Capture Vercel preview URL
  if: github.event_name == 'pull_request'
  id: vercel-url
  continue-on-error: true
  run: |
    SHA="${{ github.event.pull_request.head.sha }}"
    for i in {1..12}; do
      STATUS=$(gh api repos/${{ github.repository }}/commits/${SHA}/status --jq '.statuses[] | select(.context | ascii_downcase | startswith("vercel")) | .target_url' 2>/dev/null | head -1) || true
      if [ -n "$STATUS" ]; then
        echo "vercel_url=$STATUS" >> $GITHUB_OUTPUT
        echo "✅ Found Vercel preview URL: $STATUS"
        break
      fi
      echo "⏳ Waiting for Vercel deployment... ($i/12)"
      sleep 5
    done
    if [ -z "$STATUS" ]; then
      echo "⚠️ Vercel preview URL not found in commit status after 60s"
      echo "vercel_url=" >> $GITHUB_OUTPUT
    fi
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

      echo "preview_url=$URL" >> "$GITHUB_OUTPUT"
      if [ -z "$URL" ]; then
        echo "::warning::No Vercel preview URL found after polling"
      fi
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

````

### 5.4 Desglose del comando `gh api`

```bash
gh api repos/owner/repo/commits/$SHA/status --jq '...'
| `--jq '.statuses[] \| select(.context \| ascii_downcase \| startswith("vercel"))'` | Filtra los statuses cuyo contexto (en minúsculas) empieza por "vercel" |

| Parte | Qué hace |
|---|---|
| `gh api` | Cliente de la API REST de GitHub |
| `repos/{owner}/{repo}/commits/{sha}/status` | Endpoint que devuelve los statuses del commit |
| `--jq '.statuses[] \| select(.context \| contains("vercel"))'` | Filtra los statuses cuyo contexto contiene "vercel" |
1. Consulta el status del commit cada 5 segundos.
2. Si encuentra la URL → la guarda en `GITHUB_OUTPUT` (`steps.vercel-url.outputs.vercel_url`).
3. Si se agota el tiempo (12 intentos ≈ 60 s) → avisa y continúa con URL vacía (no falla el job).

Vercel tarda en construir y desplegar la preview (a veces 1-2 minutos). El workflow **espera activamente**:

```yaml
echo "vercel_url=$STATUS" >> $GITHUB_OUTPUT
````

El step expone `steps.vercel-url.outputs.vercel_url` para los pasos siguientes:

```yaml
${{ steps.vercel-url.outputs.vercel_url }}
```

El step expone `steps.preview-url.outputs.preview_url` para los pasos siguientes:

```yaml
${{ steps.preview-url.outputs.preview_url }}
```

El aviso (`⚠️ Vercel preview URL not found...`) **no falla el job** (`continue-on-error: true`). El comentario en el PR se publica igualmente, pero con el texto "Not yet available". Esto mantiene el workflow verde en repos sin Vercel.

### 5.7 ¿Qué pasa si Vercel no está configurado?

El `::warning::` avisa pero **no falla el job**. El comentario en el PR se publica igualmente, pero sin URL o con un aviso. Esto mantiene el workflow verde en repos sin Vercel.

````yaml
  - name: Find existing preview comment
    if: always() && github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
    uses: peter-evans/find-comment@v4
    id: find-comment
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      issue-number: ${{ github.event.pull_request.number }}
      comment-author: 'github-actions[bot]'
      body-includes: '<!-- preview-environments -->'

  - name: Create or update preview comment
    if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
    uses: peter-evans/create-or-update-comment@v5
    continue-on-error: true
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
```yaml
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  issue-number: ${{ github.event.pull_request.number }}
  comment-id: ${{ steps.find-comment.outputs.comment-id }}
  edit-mode: replace
````

| Paso             | Action                                    | Comportamiento                                                                  |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Encontrar        | `peter-evans/find-comment@v4`             | Busca el comentario previo cuyo cuerpo contiene `<!-- preview-environments -->` |
| Crear/actualizar | `peter-evans/create-or-update-comment@v5` | Si `comment-id` existe lo **edita**; si no, crea uno nuevo                      |

| Opción                                                     | Comportamiento                                            |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `body-includes: '<!-- preview-environments -->'`           | Filtro de búsqueda del comentario a reemplazar            |
| `comment-id: ${{ steps.find-comment.outputs.comment-id }}` | ID del comentario encontrado; vacío ⇒ crear nuevo         |
| `edit-mode: replace`                                       | **Reemplaza** el cuerpo del comentario en vez de duplicar |

Gracias a esto, cada push al PR **actualiza** el comentario en lugar de acumular decenas de comentarios:

```text
Push 1 → comentario "Preview URL: abc.vercel.app"
Push 2 → mismo comentario, ahora "Preview URL: def.vercel.app"
Push 3 → mismo comentario, ahora "Preview URL: ghi.vercel.app"
    A[URL de Vercel detectada] --> B[Buscar comentario con marker <!-- preview-environments -->]

> 🔑 **Clave**: sin `edit-mode: replace`, cada push crearía un comentario nuevo y el PR se llenaría de spam. El marker `<!-- preview-environments -->` es el **ancla de búsqueda** (`body-includes`) que `find-comment` usa para localizar el comentario, y `comment-id` se lo pasa a `create-or-update-comment` para editarlo.
        **Server**: http://localhost:3000 (dentro del runner de CI)
        **Commit**: ${{ github.event.pull_request.head.sha }}
```

### 6.2 `edit-mode: replace` y el comportamiento sticky

```yaml
URL de Vercel detectada → ¿existe comentario con marker <!-- preview-environments -->?
  header: preview-environments
  edit-mode: replace
```

| Opción                         | Comportamiento                                                 |
| ------------------------------ | -------------------------------------------------------------- |
| `header: preview-environments` | Busca comentarios previos con ese header                       |
| `edit-mode: replace`           | **Reemplaza** el comentario anterior en vez de crear uno nuevo |

1. **Frontend URL**: la preview de Vercel (de `steps.vercel-url.outputs.vercel_url`).
   Gracias a esto, cada push al PR **actualiza** el comentario en lugar de acumular decenas de comentarios:

```text
Push 1 → comentario "Preview URL: abc.vercel.app"
Push 2 → mismo comentario, ahora "Preview URL: def.vercel.app"
Push 3 → mismo comentario, ahora "Preview URL: ghi.vercel.app"
```

> 🔑 **Clave**: sin `edit-mode: replace`, cada push crearía un comentario nuevo y el PR se llenaría de spam. El marker `<!-- preview-environments -->` (visible en el markdown del comentario) es el ancla que el action usa para encontrar el comentario a reemplazar.

### 6.3 El flujo completo del comentario

```mermaid
flowchart TD
    A[URL de Vercel detectada] --> B[Buscar comentario con header preview-environments]
    B -->|existe| C[Editar el comentario existente]
    B -->|no existe| D[Crear comentario nuevo]
    C --> E[PR con URL actualizada]
    D --> E
```

**ASCII fallback** (si mermaid no renderiza):

```
URL de Vercel detectada → ¿existe comentario con header preview-environments?
    ├─ Sí → Editar el comentario existente ─┐
    └─ No → Crear comentario nuevo ─────────┴→ PR con URL actualizada
```

### 6.4 El mensaje del comentario

El comentario incluye:

1. **Frontend URL**: la preview de Vercel (de `steps.preview-url.outputs.preview_url`).
2. **Server info**: el server corre dentro del runner de CI (no es accesible desde fuera).
3. **Commit**: el SHA probado, para trazabilidad.

### 6.5 Limitaciones del preview

> ⚠️ **Importante**: el server del preview corre en el runner de CI, que no es accesible desde Internet. Lo que los revisores ven es el **frontend** (Vercel), que apunta al backend de producción o de staging. El valor del preview está en verificar que **el build funciona y los smoke tests pasan**, no en tener un backend público por PR.

## 7. Concurrency: `preview-<n>` con cancelación

### 7.1 El bloque

```yaml
concurrency:
  group: ${{ github.event_name == 'pull_request' && format('preview-{0}', github.event.pull_request.number) || 'preview-manual' }}
  cancel-in-progress: true
```

### 7.2 El grupo dinámico

```yaml
group: ${{ github.event_name == 'pull_request' && format('preview-{0}', github.event.pull_request.number) || 'preview-manual' }}
```

El grupo incluye el **número del PR**. Esto significa:

- Cada PR tiene su **propio grupo** (`preview-12`, `preview-13`, ...).
- Los PRs **no se bloquean entre sí**: el PR 12 y el PR 13 pueden ejecutar previews en paralelo.
- Dentro del mismo PR, solo hay **una** ejecución de preview a la vez.
- En ejecuciones manuales (`workflow_dispatch`) no hay PR: el grupo cae al fallback `preview-manual`.

### 7.3 `cancel-in-progress: true`

A diferencia de `deploy.yml` (Guía 13, sección 9), aquí **sí** se cancela la ejecución anterior:

| Workflow      | cancel-in-progress | Razón                                    |
| ------------- | ------------------ | ---------------------------------------- |
| `deploy.yml`  | `false`            | Un despliegue no debe interrumpirse      |
| `preview.yml` | `true`             | La preview nueva reemplaza a la anterior |

### 7.4 ¿Por qué es seguro cancelar en preview?

1. **El preview es efímero**: no hay estado que corromper.
2. **La versión nueva es mejor**: si pusheas un commit nuevo, la preview del commit viejo ya no sirve.
3. **Ahorro de recursos**: cancelar un build a medias libera el runner.
4. **Resultado determinista**: el comentario final siempre refleja el último commit.

### 7.5 El escenario típico

```text
09:00  Push commit A → preview-A arranca
09:01  Push commit B → preview-A se CANCELA, preview-B arranca
09:03  Push commit C → preview-B se CANCELA, preview-C arranca
09:05  preview-C termina → comentario con URL del commit C
```

Solo el preview del **último commit** llega a publicar su comentario. Los anteriores se cancelaron.

### 7.6 Comparación visual

```mermaid
flowchart LR
    subgraph PR12[PR #12]
        A1[preview-12 run 1] -->|cancel-in-progress| A2[preview-12 run 2]
    end
    subgraph PR13[PR #13]
        B1[preview-13 run 1]
    end
```

**ASCII fallback** (si mermaid no renderiza):

```
PR #12: preview-12 run 1 --cancel-in-progress--> preview-12 run 2
PR #13: preview-13 run 1   (corre en paralelo con PR #12)
```

PR #12 y PR #13 corren en paralelo (grupos distintos). Dentro de PR #12, el run 2 cancela al run 1.

## 8. Resumen

### 8.1 El flujo completo

```mermaid
flowchart TD
    A[PR hacia main] --> B[Build imagen]
    B --> C[Floci + Postgres]
    C --> D[Prisma migrate]
    D --> E[Contenedor server]
    E --> F[Health check 200/503]
    F --> G[Smoke tests]
    G --> H[Polling URL Vercel]
    H --> I[Comentario sticky en PR]
```

**ASCII fallback** (si mermaid no renderiza):

```
PR hacia main → Build imagen → Floci + Postgres → Prisma migrate → Contenedor server → Health check 200/503 → Smoke tests → Polling URL Vercel → Comentario sticky en PR
```

### 8.2 Los 7 conceptos clave

1. **Triggers**: `opened`, `reopened`, `synchronize` + `workflow_dispatch`.
2. **Servicios efímeros**: Floci (solo secretsmanager,s3,dynamodb) + PostgreSQL.
3. **Prisma migrate deploy**: prepara la BD antes de arrancar el server.
4. **Health check 200/503**: polling hasta que el server está listo.
5. **Smoke tests**: CreateSecret + GetSecretValue contra Floci.
6. **URL de Vercel**: descubierta vía commit status API con polling.
7. **Comentario sticky**: marker `<!-- preview-environments -->` + `edit-mode: replace`.

### 8.3 Errores comunes

| Error                      | Causa                      | Solución                         |
| -------------------------- | -------------------------- | -------------------------------- |
| Smoke test falla           | Floci no está listo        | Aumentar el wait del healthcheck |
| No encuentra URL de Vercel | Vercel tarda más de 5 min  | Aumentar intentos del polling    |
| Comentarios duplicados     | Falta `edit-mode: replace` | Añadir header + replace          |
| Migraciones fallan         | BD no lista                | Verificar healthcheck de `db`    |
| Preview cancelado          | Push rápido de commits     | Normal: solo el último cuenta    |

## ❓ FAQ

### ¿Puedo ver el server del preview desde mi navegador?

No. El server corre dentro del runner de CI, que no es accesible desde Internet. Lo que ves es el frontend de Vercel. El valor del preview es verificar build + smoke tests.

### ¿Por qué Floci solo con 3 servicios?

Porque son los que el server usa en el preview. Menos servicios = arranque más rápido y menos memoria. Puedes añadir más si el server los necesita.

### ¿Qué pasa si cierro el PR sin mergear?

El preview deja de ser relevante. El workflow no tiene un job de cleanup automático en este proyecto, pero los contenedores del runner se destruyen al terminar el job. La preview de Vercel se puede desactivar desde el dashboard.

### ¿Por qué `workflow_dispatch`?

Para poder regenerar un preview manualmente sin tocar el PR. Útil cuando un preview falló por un problema transitorio (red, timeout) y no quieres hacer un push vacío.

### ¿El comentario sticky funciona con cualquier action?

Este proyecto usa `peter-evans/find-comment@v4` + `peter-evans/create-or-update-comment@v5` (sección 5.3): `find-comment` localiza el comentario previo por el marker `<!-- preview-environments -->` y `create-or-update-comment` lo edita (o crea uno nuevo si no existe). Otros actions (como `marocchino/sticky-pull-request-comment` o `thollander/actions-comment-pull-request`) implementan el mismo patrón header + edit-mode, pero no son los que usa este proyecto.

### ¿Cuánto cuesta un preview?

En runners hospedados de GitHub, el costo es el de los minutos de CI. Floci y PostgreSQL son imágenes ligeras. En Vercel, las preview deployments son gratuitas en el plan Hobby. En general, los previews son mucho más baratos que un entorno de staging permanente.

## 9. Glosario

| Término                | Definición                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| **Commit status**      | Estado que un servicio externo (Vercel) asocia a un commit          |
| **Edit-mode**          | Modo del action sticky: `replace` actualiza el comentario existente |
| **Marker**             | Ancla HTML (`<!-- ... -->`) que identifica un comentario            |
| **Polling**            | Consulta repetida hasta que se cumple una condición                 |
| **Preview deployment** | Despliegue efímero de Vercel asociado a un PR                       |
| **Sticky comment**     | Comentario que se actualiza en vez de duplicarse                    |
| **Synchronize**        | Evento de PR cuando se pushea un commit nuevo                       |
| **Target URL**         | Campo del commit status con la URL del despliegue                   |
| **workflow_dispatch**  | Trigger manual de un workflow desde la UI                           |

## ✅ Checklist de la guía

- [ ] Puedo explicar los triggers de preview.yml.
- [ ] Puedo desglosar los servicios efímeros y el build.
- [ ] Puedo explicar Prisma migrate y el health check 200/503.
- [ ] Puedo explicar los smoke tests contra Floci.
- [ ] Puedo explicar la captura de URL de Vercel vía commit status API.
- [ ] Puedo explicar el comentario sticky con marker y edit-mode.
- [ ] Puedo explicar el concurrency `preview-<n>` con cancel-in-progress.
- [ ] Puedo comparar preview vs deploy y elegir cuándo usar cada uno.

## 🧭 Navegación

| Anterior                                                         | Actual                        | Siguiente                                                                       |
| ---------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| [13 — Walkthrough de deploy.yml](./13-deploy-yml-walkthrough.md) | **14 — Preview environments** | [15 — OIDC sin credenciales estáticas](./15-oidc-sin-credenciales-estaticas.md) |

- [Volver al índice Avanzado](./avanzado-README.md)

---

_Guía 14 de 7 del nivel Avanzado. Siguiente: [15 — OIDC sin credenciales estáticas](./15-oidc-sin-credenciales-estaticas.md)._

## 10. Hands-on: reproducir el preview en local

Puedes reproducir el flujo del preview **en tu máquina** sin GitHub Actions. Esto es exactamente lo que hace el workflow, paso a paso.

### Ejercicio 1: levantar el stack de preview

**Enunciado**: Levanta Floci + PostgreSQL usando el docker-compose del proyecto.

**Solución**:

```bash
cd apps/server
docker compose -f docker-compose.preview.yml up -d

# Verificar que ambos contenedores están arriba
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Qué aprendes**: El mismo stack que el workflow levanta como `services`, pero en local.

### Ejercicio 2: ejecutar las migraciones

**Enunciado**: Aplica las migraciones de Prisma a la BD local del preview.

**Solución**:

```bash
cd apps/server
export DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview
npx prisma migrate deploy
```

**Qué aprendes**: El paso `prisma migrate deploy` del workflow, ejecutado a mano.

### Ejercicio 3: arrancar el server con env vars dummy

**Enunciado**: Arranca el server apuntando a Floci y a la BD local.

**Solución**:

```bash
cd apps/server
export DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
export SECRETKEY=preview-secret
export REFRESHSECRETKEY=preview-refresh-secret
npm run dev
```

**Qué aprendes**: Las variables dummy que el workflow inyecta en el contenedor.

### Ejercicio 4: verificar el health check

**Enunciado**: Comprueba que el server responde `200` o `503` en `/health`.

**Solución**:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health
# Debe imprimir: 200
```

**Qué aprendes**: El endpoint que el workflow sondea con polling.

### Ejercicio 5: ejecutar el smoke test

**Enunciado**: Ejecuta `preview-smoke.mjs` contra tu stack local.

**Solución**:

```bash
cd apps/server
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
node scripts/preview-smoke.mjs
# Debe imprimir: ✅ Smoke test passed
```

**Qué aprendes**: El paso final del workflow, ejecutado a mano. Si falla, algo está mal en tu stack local.

### Ejercicio 6: simular el polling de Vercel

**Enunciado**: Consulta los commit statuses de un commit de tu repo con `gh api`.

**Solución**:

```bash
SHA=$(git rev-parse HEAD)
gh api repos/${{ github.repository }}/commits/$SHA/status --jq '.statuses[] | {context, target_url}'
```

**Qué aprendes**: El comando que el workflow usa para descubrir la URL de Vercel. En un commit sin preview de Vercel, la lista estará vacía.

## 11. Deep dive: el ciclo de vida completo de un preview

### 11.1 La línea de tiempo

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GH as GitHub
    participant WA as preview.yml
    participant V as Vercel
    DEV->>GH: Push commit a rama feature
    GH->>WA: Evento pull_request (synchronize)
    WA->>WA: Build imagen + Floci + Postgres
    WA->>WA: Migraciones + health check + smoke tests
    V->>GH: Commit status con URL de preview
    WA->>GH: Polling commit status API
    WA->>GH: Comentario sticky con URL
    DEV->>GH: Revisa el PR con la URL de preview
```

**ASCII fallback** (si mermaid no renderiza):

```
Developer → GitHub: push commit a rama feature
GitHub → preview.yml: evento pull_request (synchronize)
preview.yml: build imagen + Floci + Postgres → migraciones + health check + smoke tests
Vercel → GitHub: commit status con URL de preview
preview.yml → GitHub: polling commit status API → comentario sticky con URL
Developer → GitHub: revisa el PR con la URL de preview
```

### 11.2 Qué ve el desarrollador

1. **Checks del PR**: el workflow `preview` aparece como check.
2. **Comentario sticky**: con la URL del frontend de Vercel.
3. **Annotations**: warnings si la URL no se encontró o si algo se saltó.

### 11.3 Qué ve el revisor

1. La URL de preview para probar el frontend con los cambios.
2. El estado de los checks (build, smoke tests).
3. El commit exacto que se probó.

### 11.4 Qué ve el mantenedor

1. El consumo de minutos de CI por PR.
2. Los fallos recurrentes (para mejorar el workflow).
3. El historial de previews en la pestaña Actions.

### 11.5 El patrón en el contexto del proyecto

El preview es el **escalón 2** del learning path (Floci → Consola → Terraform, Guía 12): demuestra que el stack emulado funciona de extremo a extremo en CI, sin tocar AWS real. Cuando el preview pasa, el deploy (Guía 13) puede confiar en la imagen.

### 11.6 Limitaciones y mejoras futuras

| Limitación                                  | Mejora posible                             |
| ------------------------------------------- | ------------------------------------------ |
| El server no es accesible desde fuera       | Exponerlo con un túnel (ngrok/cloudflared) |
| No hay cleanup de previews de Vercel        | Job en `closed` que borre la deployment    |
| El polling es fijo (5s × 12)                | Hacerlo configurable con inputs            |
| Los smoke tests solo cubren Secrets Manager | Añadir S3 y DynamoDB al script             |

## 12. El preview en el pipeline completo

### 12.1 Los tres workflows del proyecto

| Workflow      | Cuándo        | Qué valida                       | Guía      |
| ------------- | ------------- | -------------------------------- | --------- |
| `ci.yml`      | Cada push/PR  | Lint, tests unitarios, build     | Guía 06   |
| `preview.yml` | PR hacia main | Build + smoke tests + URL Vercel | Esta guía |
| `deploy.yml`  | Push a main   | Despliegue a staging/producción  | Guía 13   |

### 12.2 La progresión de confianza

```mermaid
flowchart LR
    A[ci.yml: lint + tests] --> B[preview.yml: build + smoke]
    B --> C[deploy.yml staging]
    C --> D[deploy.yml producción]
```

**ASCII fallback** (si mermaid no renderiza):

```
ci.yml (lint + tests) → preview.yml (build + smoke) → deploy.yml staging → deploy.yml producción
```

Cada workflow añade una capa de confianza:

1. **ci.yml**: el código compila y los tests pasan.
2. **preview.yml**: la imagen se construye y el server arranca contra el stack emulado.
3. **deploy.yml staging**: la imagen corre en un entorno AWS real.
4. **deploy.yml producción**: la imagen llega a los usuarios.

### 12.3 ¿Qué pasa si un workflow falla?

| Workflow fallido        | Consecuencia                                        |
| ----------------------- | --------------------------------------------------- |
| `ci.yml`                | El PR no se puede mergear (branch protection)       |
| `preview.yml`           | El PR se puede mergear, pero sin preview verificado |
| `deploy.yml` staging    | No hay despliegue a staging                         |
| `deploy.yml` producción | No hay despliegue a producción                      |

> 🔑 **Regla mental**: cada workflow es una puerta. `ci.yml` es la puerta de entrada, `preview.yml` es la verificación del artefacto, `deploy.yml` es la puerta de salida a producción.

### 12.4 El preview como herramienta de aprendizaje

Para el learning path del proyecto, el preview es donde **todo se junta**:

- Docker (Guía 04): la imagen del server.
- GitHub Actions (Guía 02): el workflow y sus servicios.
- Secrets (Guía 03): las variables dummy.
- Floci (Guía 12): el emulador de AWS.
- Prisma: las migraciones.
- Vercel: la URL pública.

Si entiendes el preview, entiendes cómo encajan todas las piezas del pipeline.

## ❓ FAQ adicional

### ¿Puedo ejecutar preview.yml manualmente sin PR?

Sí, con `workflow_dispatch`. Pero el contexto `github.event.pull_request` estará vacío, así que el número de PR y el SHA del head no existirán. El workflow debe manejar ese caso (por ejemplo, usando `github.sha` como fallback).

### ¿Por qué el health check acepta 503 como "aún no listo"?

Porque el server devuelve `503` explícitamente mientras inicializa. Es una señal de "estoy vivo pero ocupado". El polling distingue entre `503` (espera) y error de conexión (falla).

### ¿El comentario sticky funciona si el PR tiene muchos comentarios?

Sí. El action busca el comentario por su **header** (`preview-environments`), no por posición. Aunque haya 50 comentarios, encuentra el correcto y lo reemplaza.

### ¿Qué token usa `gh api`?

`secrets.GITHUB_TOKEN`, el token automático de GitHub Actions. Tiene permisos limitados al repo actual y expira al terminar el job. No necesitas crear un PAT.

### ¿Puedo tener previews para ramas que no van a main?

El filtro `branches: [main]` lo impide. Si quieres previews para otras ramas base, añádelas al filtro o elimínalo.

### ¿Cuánto tarda un preview completo?

Depende del caché: con caché de capas, el build tarda ~1-2 min; sin caché, ~3-5 min. El polling de Vercel puede añadir 1-2 min más. En total, típicamente 3-7 minutos.
