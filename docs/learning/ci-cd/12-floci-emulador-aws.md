# 🐳 Guía 12 — Floci: emulador de AWS

> **Nivel Avanzado · Guía 12 de 7**
> En esta guía aprenderás a usar **Floci**, el emulador open source de AWS que el proyecto usa en desarrollo y CI. Entenderás qué es, cómo se compara con LocalStack, cómo se configura en `docker-compose.preview.yml` y cómo interactuar con él mediante comandos y scripts.

## 🎯 Objetivos de aprendizaje

Al terminar esta guía serás capaz de:

1. **Explicar qué es Floci** desde cero: licencia, servicios emulados, puerto, tamaño y velocidad.
2. **Comparar Floci con LocalStack** y decidir cuándo usar cada uno.
3. **Desglosar `apps/server/docker-compose.preview.yml`**: los servicios floci, db y server.
4. **Ejecutar comandos hands-on**: levantar Floci, verificar su healthcheck y usar env vars dummy.
5. **Explicar el patrón del script `preview-smoke.mjs`** (CreateSecret + GetSecretValue contra Secrets Manager emulado).
6. **Explicar la secuencia pedagógica** Floci → Consola AWS → Terraform.
7. **Explicar por qué Floci NO es un proveedor de hosting** — es un emulador para dev/CI.

## 📋 Prerequisitos

- Guía 11 completada (conceptos de CD y AWS): ARN, servicios regionales vs globales, Secrets Manager.
- Nivel Fundamentos, guía 04 (Docker básico): saber qué es una imagen y un contenedor.
- Docker instalado y funcionando en tu máquina (para los hands-on).
- Nivel Intermedio, guía 06 (walkthrough de `ci.yml`): saber leer un workflow.

## 1. ¿Qué es Floci?

### 1.1 El problema que resuelve

Los servicios AWS (Secrets Manager, S3, DynamoDB...) son **servicios en la nube**: para usarlos necesitas una cuenta, credenciales y conexión a Internet. Eso es un problema para:

- **Desarrollo local**: no quieres crear recursos reales (cuestan dinero) cada vez que pruebas.
- **CI**: los runners de GitHub Actions no tienen acceso a tu cuenta AWS (y no deberían tenerlo).

**Floci** resuelve esto: es un **emulador** que corre en un contenedor Docker y **replica el comportamiento de los servicios AWS en tu máquina**, con la misma API.

### 1.2 Datos clave

| Dato                   | Valor                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **Licencia**           | MIT (open source, gratis incluso para uso comercial)              |
| **Servicios emulados** | ~68 servicios AWS                                                 |
| **Puerto**             | 4566 (endpoint único para todos los servicios)                    |
| **Imagen Docker**      | ~90MB                                                             |
| **Arranque**           | ~24ms                                                             |
| **Persistencia**       | Volátil por defecto (los datos se pierden al parar el contenedor) |

### 1.3 Cómo funciona

Floci expone un **único endpoint** (`http://localhost:4566`) que implementa la API REST de los servicios AWS. Cualquier cliente que hable con AWS (la AWS CLI, el SDK de JavaScript, `aws-sdk-client-mock`...) puede apuntar a ese endpoint y funcionar igual.

La magia está en la **variable de entorno**:

```bash
AWS_ENDPOINT_URL=http://localhost:4566
```

Con esa variable, la AWS CLI y los SDKs envían las peticiones a Floci en lugar de a AWS real. El código de tu aplicación **no cambia**: solo cambia a dónde apunta.

### 1.4 Enlaces de referencia

Floci está documentado en el repo en dos documentos que te recomendamos consultar:

- `docs/aws-dev-local-floci.md` — Floci para desarrollo local.
- `docs/aws-learning-with-floci.md` — Aprender AWS con Floci.

Esta guía es la versión didáctica de esos documentos: explica los conceptos desde cero y te guía paso a paso.

## 2. Floci vs LocalStack

**LocalStack** es el emulador de AWS más conocido. Floci es una alternativa más ligera. Esta tabla compara ambos para que entiendas por qué el proyecto eligió Floci:

| Aspecto              | Floci                  | LocalStack                                         |
| -------------------- | ---------------------- | -------------------------------------------------- |
| **Licencia**         | MIT (100% open source) | Community (open source) + Pro (comercial, de pago) |
| **Tamaño de imagen** | ~90MB                  | ~700MB+                                            |
| **Arranque**         | ~24ms                  | Segundos                                           |
| **Servicios**        | ~68                    | ~100+ (más en Pro)                                 |
| **Costo**            | Gratis                 | Community gratis; Pro de pago                      |
| **Uso comercial**    | Sin restricciones      | Pro requiere licencia para features avanzadas      |
| **Ideal para**       | Dev local y CI ligero  | Testing complejo, features avanzadas               |
| **Comunidad**        | Más pequeña            | Muy grande                                         |

### 2.1 ¿Por qué el proyecto usa Floci?

Tres razones principales:

1. **Open source de verdad (MIT)**: sin riesgo de licencia para uso comercial en CI.
2. **Ligereza**: ~90MB de imagen y arranque en milisegundos — perfecto para runners de CI donde cada segundo cuenta.
3. **Suficiente cobertura**: los ~68 servicios incluyen todo lo que el proyecto necesita (Secrets Manager, S3, DynamoDB, etc.).

### 2.2 ¿Cuándo elegirías LocalStack?

- Cuando necesitas servicios o features que Floci no emula.
- Cuando necesitas la integración con herramientas de testing avanzadas (Testcontainers, etc.).
- Cuando el equipo ya tiene experiencia y tooling con LocalStack.

### 2.3 Regla práctica

> Si Floci cubre tus necesidades, úsalo: es más simple y barato. Migra a LocalStack solo si necesitas algo que Floci no ofrece.

## 3. Desglose de docker-compose.preview.yml

El archivo `apps/server/docker-compose.preview.yml` define el stack que se usa en los entornos de preview (guía 14) y en la Fase 1 de `deploy.yml` (guía 13). Tiene **tres servicios**:

**# Source:** `apps/server/docker-compose.preview.yml`

### 3.1 El servicio `floci`

```yaml
floci:
  image: <imagen-de-floci>
  ports:
    - '4566:4566'
```

- Corre la imagen de Floci.
- Expone el puerto **4566** (el endpoint único de la API emulada).
- Es el "AWS de mentira" del stack: Secrets Manager, S3, etc. viven aquí.

### 3.2 El servicio `db`

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    POSTGRES_DB: project_one
  ports:
    - '5432:5432'
```

- Corre **PostgreSQL** real (no emulado — la base de datos no se emula, se ejecuta).
- Credenciales dummy (`test`/`test`) para desarrollo.
- Es la base de datos que Prisma migra y contra la que corre el server.

### 3.3 El servicio `server`

```yaml
server:
  build: .
  environment:
    DATABASE_URL: postgresql://test:test@db:5432/project_one
    AWS_ENDPOINT_URL: http://floci:4566
    AWS_ACCESS_KEY_ID: test
    AWS_SECRET_ACCESS_KEY: test
    AWS_REGION: us-east-1
  depends_on:
    - floci
    - db
```

- Construye la imagen del server desde el `Dockerfile`.
- Apunta la base de datos a `db` y AWS a `floci` (vía `AWS_ENDPOINT_URL`).
- Usa credenciales dummy (`test`/`test`) — Floci no las valida.
- Espera a que `floci` y `db` estén listos (`depends_on`).

### 3.4 Lectura del stack

```
┌─────────────┐     ┌─────────────┐
│   floci     │     │     db      │
│  (AWS fake) │     │ (Postgres)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
          ┌─────────────┐
          │   server    │
          │  (Express)  │
          └─────────────┘
```

El server es el único que habla con los otros dos: lee secretos de Floci y datos de Postgres.

## 4. Hands-on: levantar Floci

Vamos a poner Floci en marcha. Todos los comandos se ejecutan desde `apps/server/` (donde está el `docker-compose.preview.yml`).

### 4.1 Levantar el stack

```bash
cd apps/server
docker compose -f docker-compose.preview.yml up -d floci
```

> 💡 Levantamos solo `floci` para este ejercicio. En los workflows reales se levanta el stack completo (`floci`, `db`, `server`).

### 4.2 Verificar que está corriendo

```bash
docker compose -f docker-compose.preview.yml ps
```

Deberías ver el contenedor de Floci con estado `Up` y el puerto `4566` publicado.

### 4.3 Healthcheck

Floci expone un endpoint de salud. Verifícalo con curl:

```bash
curl http://localhost:4566/_localstack/health
```

> 💡 Nota: Floci mantiene compatibilidad con el endpoint de healthcheck de LocalStack (`/_localstack/health`), lo que facilita migrar entre ambos.

La respuesta es un JSON con el estado de los servicios emulados:

```json
{
  "services": {
    "secretsmanager": "available",
    "s3": "available",
    "dynamodb": "available"
  }
}
```

### 4.4 Variables de entorno dummy

Para hablar con Floci, la AWS CLI necesita tres variables:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
```

**# Source:** patrón de env vars dummy de `apps/server/docker-compose.preview.yml` (servicio `server`).

> ⚠️ **Importante**: Floci **no valida credenciales**. Cualquier valor sirve (`test`/`test` es la convención del proyecto). Esto es posible porque es un emulador local — en AWS real las credenciales se validan contra IAM.

### 4.5 Probar un servicio emulado

Con las variables cargadas, crea un secreto en el Secrets Manager emulado:

```bash
aws secretsmanager create-secret \
  --name prod/JWT_SECRET \
  --secret-string "super-secret-value" \
  --region us-east-1
```

Y léelo:

```bash
aws secretsmanager get-secret-value \
  --secret-id prod/JWT_SECRET \
  --region us-east-1
```

Si ves el JSON con `SecretString: "super-secret-value"`, Floci está funcionando. 🎉

### 4.6 Parar el stack

```bash
docker compose -f docker-compose.preview.yml down
```

> ⚠️ Recuerda: Floci es **volátil**. Al parar el contenedor, los secretos creados se pierden. Eso es lo esperado en dev/CI.

## 5. El patrón del script preview-smoke.mjs

El proyecto tiene un script de smoke test que verifica que el patrón de Secrets Manager funciona contra el emulador: `apps/server/scripts/preview-smoke.mjs`.

**# Source:** `apps/server/scripts/preview-smoke.mjs`

### 5.1 ¿Qué hace el script?

El script ejecuta dos operaciones contra el Secrets Manager **emulado** (Floci):

1. **CreateSecret** — crea un secreto de prueba.
2. **GetSecretValue** — lo lee y verifica que el valor coincide.

Si ambas operaciones funcionan, el patrón de integración con AWS está correcto. Si fallan, el smoke test falla y el workflow se detiene.

### 5.2 El patrón en pseudocódigo

```javascript
// 1. Configurar el cliente apuntando a Floci
const client = new SecretsManagerClient({
  region: 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL, // http://localhost:4566
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

// 2. CreateSecret: crear un secreto de prueba
await client.send(
  new CreateSecretCommand({
    Name: 'smoke-test/secret',
    SecretString: 'smoke-test-value',
  })
);

// 3. GetSecretValue: leerlo y verificar
const result = await client.send(
  new GetSecretValueCommand({
    SecretId: 'smoke-test/secret',
  })
);

if (result.SecretString !== 'smoke-test-value') {
  throw new Error('El secreto no coincide');
}
```

### 5.3 Por qué es importante

Este smoke test verifica **el patrón completo** que usará el server en producción:

- En **producción**, el server lee `JWT_SECRET` y otros secretos de Secrets Manager real (inyectados por ECS en la task definition).
- En **dev/CI**, el mismo código lee de Floci.

Si el patrón CreateSecret/GetSecretValue funciona contra Floci, es muy probable que funcione contra AWS real — la API es la misma.

### 5.4 El flujo en el workflow

En `deploy.yml` (Fase 1) y en `preview.yml`, el flujo es:

1. Se levanta el stack (`floci` + `db` + `server`).
2. Se espera al health check del server.
3. Se ejecuta `preview-smoke.mjs` contra el stack emulado.
4. Si pasa, el workflow continúa; si falla, se detiene.

### 5.5 Variante: smoke test del server

Además del script de Secrets Manager, los workflows hacen un smoke test HTTP contra el server:

```bash
curl -f http://localhost:3000/health
```

Esto verifica que el server arrancó, conectó con Postgres y responde. Los detalles de tiempos y retries los verás en las guías 13 y 14.

## 6. La secuencia pedagógica: Floci → Consola → Terraform

Floci no es un fin en sí mismo: es el **primer escalón** de una ruta de aprendizaje hacia AWS real. El documento `docs/aws-cd-learning-path.md` define esta secuencia:

**# Source:** `docs/aws-cd-learning-path.md`

### 6.1 Los tres escalones

| Escalón            | Qué es                      | Ventaja                    | Limitación                     |
| ------------------ | --------------------------- | -------------------------- | ------------------------------ |
| **1. Floci**       | Emulador local              | Gratis, rápido, sin cuenta | No es AWS real                 |
| **2. Consola AWS** | Interfaz web real           | Recursos reales, UI        | Cuesta dinero, requiere cuenta |
| **3. Terraform**   | Infraestructura como código | Reproducible, versionable  | Curva de aprendizaje           |

### 6.2 Por qué este orden

1. **Floci primero**: aprendes la API de AWS (crear secretos, subir objetos a S3...) sin riesgo ni costo. Los errores no cuestan dinero.
2. **Consola después**: cuando entiendes los conceptos, los ves en AWS real con la UI. Creas recursos pequeños y los destruyes.
3. **Terraform al final**: cuando ya sabes qué recursos necesitas, los declaras como código para que sean reproducibles.

### 6.3 Dónde está el proyecto en esta ruta

El proyecto ya está en el **escalón 3**: la infraestructura está definida en Terraform (`infra/`). Floci se usa como herramienta de **desarrollo y CI**, no como sustituto de la infraestructura real.

### 6.4 Analogía

Aprender AWS con Floci es como aprender a conducir en un simulador: aprendes los controles y las reglas sin riesgo de accidente. La consola es el coche real en un parking vacío. Terraform es el manual de mantenimiento del coche.

## 7. ⚠️ Floci NO es un proveedor de hosting

Esta es la advertencia más importante de la guía. Es fácil malinterpretar Floci y pensar que "desplegamos en Floci". **No es así.**

### 7.1 Qué es Floci

Floci es un **emulador de la API de AWS** para desarrollo y CI. Emula servicios como Secrets Manager, S3 o DynamoDB **en tu máquina o en un runner**.

### 7.2 Qué NO es Floci

- ❌ **No es un proveedor de hosting**: no despliegas tu aplicación "en Floci".
- ❌ **No es producción**: no tiene la disponibilidad, seguridad ni rendimiento de AWS real.
- ❌ **No persiste datos**: es volátil por diseño.
- ❌ **No escala**: corre en un contenedor local.

### 7.3 La cita exacta

Los documentos de referencia lo dicen literalmente:

> **# Source:** `docs/aws-dev-local-floci.md:21` — Floci es un emulador para desarrollo local, no un sustituto de AWS en producción.

> **# Source:** `docs/aws-learning-with-floci.md:21` — Floci sirve para aprender la API de AWS, no para alojar aplicaciones.

### 7.4 El flujo real de producción

En producción, el despliegue usa **AWS real**:

1. La imagen se sube a **ECR** (registro real).
2. **ECS Fargate** ejecuta el contenedor (compute real).
3. Los secretos vienen de **Secrets Manager real**.
4. La base de datos es **RDS real**.

Floci solo aparece en **desarrollo local** y en la **Fase 1 de CI** (para verificar el patrón antes de tocar AWS real).

### 7.5 Regla mental

> **Floci emula la API de AWS para que puedas desarrollar y testear sin AWS. Producción siempre usa AWS real.**

## 8. Resumen

En esta guía has aprendido:

1. **Qué es Floci**: emulador open source (MIT) de ~68 servicios AWS, puerto 4566, imagen ~90MB, arranque ~24ms.
2. **Floci vs LocalStack**: Floci es más ligero y 100% open source; LocalStack tiene más servicios y features pero licencia más restrictiva.
3. **El stack de preview**: `docker-compose.preview.yml` tiene tres servicios — `floci` (AWS emulado), `db` (Postgres real) y `server` (la app).
4. **Hands-on**: levantar Floci, verificar el healthcheck, usar env vars dummy (`test`/`test`) y probar CreateSecret/GetSecretValue.
5. **El patrón del smoke test**: `preview-smoke.mjs` verifica CreateSecret + GetSecretValue contra el emulador.
6. **La ruta pedagógica**: Floci → Consola AWS → Terraform.
7. **La advertencia clave**: Floci **NO es hosting** — es un emulador para dev/CI; producción usa AWS real.

**Siguiente paso**: en la [guía 13](./13-deploy-yml-walkthrough.md) verás Floci en acción dentro del workflow de despliegue real (`deploy.yml`), en la Fase 1 de build y smoke tests.

## ❓ FAQ

### ¿Floci reemplaza a AWS?

**No.** Floci emula la API de AWS para desarrollo y CI. Producción usa AWS real (ECR, ECS, RDS, Secrets Manager). Confundir esto es el error más común del nivel.

### ¿Puedo usar Floci en producción?

**No.** No tiene disponibilidad, seguridad, ni rendimiento de producción. Es una herramienta de desarrollo.

### ¿Floci es gratis?

Sí, es MIT: gratis incluso para uso comercial. LocalStack Community también es gratis, pero su versión Pro (con más features) es de pago.

### ¿Qué servicios emula Floci?

~68 servicios AWS, incluyendo Secrets Manager, S3, DynamoDB, SQS, SNS, Lambda, etc. El proyecto usa principalmente Secrets Manager.

### ¿Por qué las credenciales son `test`/`test`?

Porque Floci **no valida credenciales**: cualquier valor funciona. Es un emulador local; la validación real ocurre en IAM cuando usas AWS de verdad.

### ¿Los datos de Floci persisten?

**No.** Al parar el contenedor, todo se pierde. Es volátil por diseño — perfecto para CI donde cada run empieza limpio.

### ¿Dónde está el docker-compose?

En `apps/server/docker-compose.preview.yml`. Se usa en los workflows de preview (guía 14) y en la Fase 1 de deploy (guía 13).

### ¿Necesito Docker para esta guía?

Para los hands-on sí. Si no tienes Docker, puedes leer la guía igualmente: los conceptos se entienden sin ejecutar los comandos.

## 9. Hands-on adicionales

### Ejercicio 1: crear y leer un secreto

1. Levanta Floci (`docker compose -f docker-compose.preview.yml up -d floci`).
2. Carga las env vars dummy.
3. Crea un secreto `dev/API_KEY` con valor `abc-123`.
4. Léelo y verifica que devuelve `abc-123`.
5. Lista los secretos (`aws secretsmanager list-secrets`).

### Ejercicio 2: probar S3

Floci también emula S3. Prueba:

```bash
aws s3 mb s3://mi-bucket-test
echo "hola" | aws s3 cp - s3://mi-bucket-test/hola.txt
aws s3 ls s3://mi-bucket-test
```

### Ejercicio 3: el stack completo

1. Levanta el stack completo: `docker compose -f docker-compose.preview.yml up -d`.
2. Espera al health check: `curl http://localhost:3000/health`.
3. Ejecuta el smoke test: `node scripts/preview-smoke.mjs`.
4. Observa los logs: `docker compose -f docker-compose.preview.yml logs -f server`.

### Ejercicio 4: verificar la volatilidad

1. Crea un secreto.
2. Para el contenedor: `docker compose -f docker-compose.preview.yml down`.
3. Vuelve a levantarlo.
4. Intenta leer el secreto: **no existe** — confirma que Floci es volátil.

## 10. Glosario

| Término              | Definición                                                            |
| -------------------- | --------------------------------------------------------------------- |
| **AWS_ENDPOINT_URL** | Variable que redirige las peticiones AWS a un endpoint custom (Floci) |
| **CreateSecret**     | Operación de Secrets Manager para crear un secreto                    |
| **Emulador**         | Programa que replica el comportamiento de otro (Floci replica AWS)    |
| **Endpoint**         | URL a la que se envían las peticiones de una API                      |
| **Floci**            | Emulador open source (MIT) de servicios AWS para dev/CI               |
| **GetSecretValue**   | Operación de Secrets Manager para leer un secreto                     |
| **Healthcheck**      | Verificación de que un servicio está listo                            |
| **LocalStack**       | Emulador de AWS alternativo, más pesado y con más servicios           |
| **Secrets Manager**  | Servicio AWS para guardar secretos cifrados                           |
| **Smoke test**       | Verificación rápida de que el sistema arranca y responde              |
| **Volátil**          | Que no persiste datos entre ejecuciones                               |

## ✅ Checklist de la guía

- [ ] Puedo explicar qué es Floci y sus datos clave (MIT, 68 servicios, 4566, ~90MB, ~24ms).
- [ ] Puedo comparar Floci vs LocalStack y justificar la elección del proyecto.
- [ ] Puedo desglosar los 3 servicios de `docker-compose.preview.yml`.
- [ ] He levantado Floci y verificado su healthcheck.
- [ ] He creado y leído un secreto con la AWS CLI contra Floci.
- [ ] Puedo explicar el patrón CreateSecret + GetSecretValue de `preview-smoke.mjs`.
- [ ] Puedo explicar la secuencia Floci → Consola → Terraform.
- [ ] Puedo explicar por qué Floci NO es un proveedor de hosting.

## 11. Deep dive: emulación de S3 en Floci

S3 (Simple Storage Service) es el servicio de almacenamiento de objetos de AWS. Floci lo emula de forma local, lo que permite probar flujos de subida/descarga de archivos sin tocar AWS real.

### 11.1 Qué emula Floci de S3

| Operación           | ¿Emulada? | Notas                             |
| ------------------- | --------- | --------------------------------- |
| `CreateBucket`      | ✅        | Crea un bucket con nombre único   |
| `PutObject`         | ✅        | Sube un objeto con su contenido   |
| `GetObject`         | ✅        | Descarga un objeto                |
| `ListObjectsV2`     | ✅        | Lista objetos de un bucket        |
| `DeleteObject`      | ✅        | Borra un objeto                   |
| `DeleteBucket`      | ✅        | Borra un bucket vacío             |
| Versionado          | ⚠️        | Soporte parcial según versión     |
| Políticas de bucket | ⚠️        | No aplica permisos reales         |
| Cifrado SSE         | ⚠️        | Acepta el parámetro pero no cifra |

### 11.2 El endpoint de S3 en Floci

Cuando levantas el stack de `docker-compose.preview.yml`, Floci expone S3 en:

```bash
http://localhost:4566
```

La AWS CLI necesita saber que debe hablar con Floci y no con AWS real. Por eso se usan las variables de entorno:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
```

> 💡 **Nota**: `AWS_ENDPOINT_URL` es la variable moderna (AWS CLI v2). En versiones antiguas se usaba `--endpoint-url` en cada comando.

### 11.3 Ejemplo completo: ciclo de vida de un objeto

```bash
# 1. Crear un bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://mi-bucket-preview

# 2. Subir un archivo
echo "hola desde floci" > /tmp/nota.txt
aws --endpoint-url=http://localhost:4566 s3 cp /tmp/nota.txt s3://mi-bucket-preview/nota.txt

# 3. Listar
aws --endpoint-url=http://localhost:4566 s3 ls s3://mi-bucket-preview/

# 4. Descargar
aws --endpoint-url=http://localhost:4566 s3 cp s3://mi-bucket-preview/nota.txt /tmp/nota-bajada.txt
cat /tmp/nota-bajada.txt

# 5. Borrar
aws --endpoint-url=http://localhost:4566 s3 rm s3://mi-bucket-preview/nota.txt
aws --endpoint-url=http://localhost:4566 s3 rb s3://mi-bucket-preview
```

### 11.4 Por qué esto importa para el proyecto

En el proyecto, el server de Express podría usar S3 para guardar archivos (avatars, documentos, exports). Con Floci puedes:

1. Escribir tests de integración que suban y bajen archivos.
2. Probar el flujo completo en CI sin credenciales reales.
3. Verificar que el código usa el SDK correctamente (región, bucket, claves).

### 11.5 Limitación clave: S3 no persiste

Floci guarda los objetos en memoria o en un volumen temporal. Si reinicias el contenedor sin volumen persistente, los buckets y objetos desaparecen. Esto es **intencional**: cada preview debe empezar limpio.

> 🔑 **Regla mental**: S3 en Floci = almacenamiento efímero para pruebas. S3 en AWS = almacenamiento durable de producción.

## 12. Deep dive: emulación de DynamoDB en Floci

DynamoDB es la base de datos NoSQL clave-valor de AWS. Floci la emula localmente, lo que permite probar el modelo de datos sin provisionar una tabla real.

### 12.1 Qué emula Floci de DynamoDB

| Operación                     | ¿Emulada? | Notas                                          |
| ----------------------------- | --------- | ---------------------------------------------- |
| `CreateTable`                 | ✅        | Crea tabla con clave de partición y ordenación |
| `PutItem`                     | ✅        | Inserta o reemplaza un ítem                    |
| `GetItem`                     | ✅        | Lee un ítem por clave                          |
| `UpdateItem`                  | ✅        | Actualiza atributos de un ítem                 |
| `DeleteItem`                  | ✅        | Borra un ítem                                  |
| `Query`                       | ✅        | Consulta por clave de partición                |
| `Scan`                        | ✅        | Recorre toda la tabla (lento en producción)    |
| `ListTables`                  | ✅        | Lista las tablas existentes                    |
| Índices secundarios (GSI/LSI) | ⚠️        | Soporte parcial                                |
| Streams                       | ⚠️        | No emulado de forma fiable                     |

### 12.2 Ejemplo: tabla de sesiones de preview

Imagina que el server guarda sesiones de preview en DynamoDB. Con Floci puedes crear la tabla y probar el CRUD:

```bash
# 1. Crear la tabla
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name preview-sessions \
  --attribute-definitions AttributeName=sessionId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 2. Insertar un ítem
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name preview-sessions \
  --item '{"sessionId": {"S": "abc-123"}, "status": {"S": "active"}}'

# 3. Leer el ítem
aws --endpoint-url=http://localhost:4566 dynamodb get-item \
  --table-name preview-sessions \
  --key '{"sessionId": {"S": "abc-123"}}'

# 4. Listar tablas
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

### 12.3 El formato de los ítems

DynamoDB usa un formato tipado: cada atributo declara su tipo (`S` = string, `N` = number, `B` = binary, `BOOL` = booleano, `L` = lista, `M` = mapa). El SDK de AWS traduce automáticamente entre JSON y este formato, pero la CLI lo muestra en crudo.

```json
{
  "sessionId": { "S": "abc-123" },
  "status": { "S": "active" },
  "createdAt": { "N": "1720000000" }
}
```

### 12.4 Por qué DynamoDB en el proyecto

El proyecto usa PostgreSQL (Prisma) como base principal. DynamoDB aparecería solo si una feature concreta lo requiere (por ejemplo, caché distribuida o sesiones de alta velocidad). Floci permite **evaluar** si DynamoDB encaja sin crear una cuenta AWS.

### 12.5 Limitación clave: consistencia

DynamoDB real ofrece consistencia eventual por defecto y consistencia fuerte bajo demanda. Floci simplifica esto: las lecturas son casi siempre consistentes porque todo vive en un solo proceso. No uses Floci para medir latencias ni comportamientos de consistencia.

> 🔑 **Regla mental**: DynamoDB en Floci = validar el modelo de datos. DynamoDB en AWS = validar rendimiento y consistencia.

## 13. 🔧 Troubleshooting: problemas comunes

Cuando levantas Floci en local o en CI, es normal encontrarte con estos problemas. Aquí tienes los 6 más comunes y cómo resolverlos.

### 13.1 Conflicto de puertos (4566 ya en uso)

**Síntoma**: `docker compose up` falla con `port is already allocated` o `Bind for 0.0.0.0:4566 failed`.

**Causa**: Otro contenedor o proceso (otro Floci, LocalStack, un server local) ya ocupa el puerto 4566.

**Solución**:

```bash
# Ver qué ocupa el puerto
netstat -ano | grep 4566

# Si es otro contenedor, pararlo
docker ps
docker stop <container-id>

# O cambiar el puerto del host en docker-compose.preview.yml
#   ports:
#     - "4567:4566"
```

### 13.2 Healthcheck que nunca pasa (timeout)

**Síntoma**: El contenedor `floci` arranca pero el healthcheck sigue en `starting` o `unhealthy`.

**Causa**: Floci tarda más de lo esperado en cargar los 68 servicios, o el endpoint de health no responde.

**Solución**:

```bash
# Ver el estado del healthcheck
docker inspect --format='{{json .State.Health}}' <container-id>

# Ver los logs del contenedor
docker logs <container-id> --tail 50

# Esperar más tiempo antes de asumir que está listo
sleep 15
curl -s http://localhost:4566/_localstack/health | jq
```

> 💡 En CI, el workflow de preview ya espera el healthcheck antes de lanzar los smoke tests. Si el timeout es corto, el job falla con un error de "service not ready".

### 13.3 Permisos de volumen (permission denied)

**Síntoma**: Floci arranca pero no puede escribir en el volumen, o el contenedor `db` falla al montar datos.

**Causa**: En Windows/WSL2 o en CI con runners Linux, los permisos del directorio montado no coinciden con el usuario del contenedor.

**Solución**:

```bash
# En local (WSL2): asegurar que el directorio existe y es escribible
mkdir -p .floci-data
chmod -R 777 .floci-data

# En CI: usar volúmenes anónimos o tmpfs en vez de bind mounts
#   volumes:
#     - floci-data:/var/lib/localstack
```

### 13.4 Estado obsoleto (stale state)

**Síntoma**: Los buckets, tablas o secretos de una ejecución anterior "aparecen" en la nueva preview.

**Causa**: El volumen de Floci persiste entre ejecuciones porque no se limpia.

**Solución**:

```bash
# Parar y borrar los volúmenes (¡cuidado! borra datos)
docker compose down -v

# O limpiar solo Floci
docker volume ls | grep floci
docker volume rm <volume-name>
```

> 🔑 En el workflow de preview, cada PR crea un stack limpio. Si reutilizas el mismo runner, asegúrate de que el `down -v` se ejecute en el cleanup.

### 13.5 La AWS CLI no conecta (connection refused)

**Síntoma**: `aws s3 ls` falla con `Connection refused` o `Could not connect to the endpoint URL`.

**Causa**: Floci no está corriendo, o `AWS_ENDPOINT_URL` apunta al puerto equivocado.

**Solución**:

```bash
# 1. ¿Está el contenedor arriba?
docker ps | grep floci

# 2. ¿Responde el endpoint?
curl -s http://localhost:4566/_localstack/health

# 3. ¿Está la variable bien definida?
echo $AWS_ENDPOINT_URL
# Debe imprimir: http://localhost:4566
```

### 13.6 Limpieza tras las pruebas

**Síntoma**: El runner de CI se queda sin espacio o los contenedores se acumulan.

**Solución**: Añadir un paso de cleanup al final del job:

```bash
docker compose -f docker-compose.preview.yml down -v --remove-orphans
docker system prune -f
```

> 💡 En GitHub Actions, los runners hospedados se destruyen al terminar, pero en runners self-hosted la limpieza es responsabilidad tuya.

## 14. Hands-on adicionales con solución

Estos ejercicios refuerzan lo aprendido. Intenta resolverlos antes de mirar la solución.

### Ejercicio 5: subir y leer un secreto con la AWS CLI

**Enunciado**: Crea un secreto llamado `preview/db-url` con valor `postgresql://user:pass@db:5432/preview` y luego léelo.

**Solución**:

```bash
# Crear el secreto
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name preview/db-url \
  --secret-string "postgresql://user:pass@db:5432/preview"

# Leerlo
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id preview/db-url \
  --query SecretString --output text
```

**Qué aprendes**: El patrón exacto que usa `preview-smoke.mjs` con el SDK de AWS.

### Ejercicio 6: listar los servicios emulados

**Enunciado**: Verifica qué servicios de AWS están disponibles en tu instancia de Floci.

**Solución**:

```bash
curl -s http://localhost:4566/_localstack/health | jq '.services | to_entries[] | select(.value == "available") | .key'
```

**Qué aprendes**: El endpoint de health de Floci expone el estado de cada servicio. Es la misma información que usa el workflow para decidir si puede continuar.

### Ejercicio 7: simular un fallo de Secrets Manager

**Enunciado**: Intenta leer un secreto que no existe y observa el error. ¿Qué código de error devuelve?

**Solución**:

```bash
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id no-existe \
  --query SecretString --output text
# Error: ResourceNotFoundException
```

**Qué aprendes**: El SDK de AWS lanza excepciones tipadas (`ResourceNotFoundException`). El script `preview-smoke.mjs` captura este error para decidir si el flujo de creación funcionó.

### Ejercicio 8: el ciclo completo de preview

**Enunciado**: Reproduce el flujo del workflow de preview manualmente: 1) levantar el stack, 2) esperar healthcheck, 3) crear un secreto, 4) leerlo, 5) parar y limpiar.

**Solución**:

```bash
# 1. Levantar
docker compose -f docker-compose.preview.yml up -d

# 2. Esperar healthcheck
sleep 15
curl -s http://localhost:4566/_localstack/health | jq '.services.secretsmanager'

# 3. Crear secreto
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name smoke/test --secret-string "ok"

# 4. Leerlo
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id smoke/test --query SecretString --output text

# 5. Limpiar
docker compose -f docker-compose.preview.yml down -v
```

**Qué aprendes**: El flujo completo que ejecuta el job de preview en cada PR, pero a mano y con visibilidad total.

### Ejercicio 9: comparar S3 y DynamoDB

**Enunciado**: Crea un bucket S3 y una tabla DynamoDB con el mismo nombre `preview-data`. ¿Qué pasa?

**Solución**:

```bash
# S3
aws --endpoint-url=http://localhost:4566 s3 mb s3://preview-data

# DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name preview-data \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Qué aprendes**: S3 y DynamoDB son servicios independientes con namespaces separados. Pueden compartir nombre sin conflicto. En AWS real también es así.

## ❓ FAQ extendida

### ¿Floci funciona en Windows nativo o necesito WSL2?

Floci corre en Docker. En Windows, Docker Desktop con WSL2 es la vía recomendada. En CI (GitHub Actions), los runners Linux ejecutan Floci sin problema. Si usas Windows nativo sin WSL2, Docker Desktop lo gestiona igualmente, pero el rendimiento de bind mounts es peor.

### ¿Puedo usar Floci para tests de integración en el server?

Sí, y es uno de sus usos principales. Puedes levantar Floci en un contenedor de test, apuntar el server a `http://localhost:4566` y escribir tests que creen secretos, buckets o tablas. El patrón es idéntico al de `preview-smoke.mjs`.

### ¿Floci consume muchos recursos?

Floci (~90MB de imagen) es ligero comparado con LocalStack. En un runner de CI con 2 vCPU y 4GB de RAM, Floci + PostgreSQL + el server caben sin problema. Eso es parte de por qué el proyecto lo eligió.

### ¿Qué pasa si dos PRs levantan Floci a la vez en el mismo runner?

En GitHub Actions, cada job corre en un runner aislado, así que no hay conflicto. En local, si levantas dos stacks con el mismo `docker-compose.preview.yml`, el segundo fallará por conflicto de puertos (ver sección 13.1).

### ¿Floci emula IAM y permisos?

No de forma real. Acepta credenciales `test`/`test` y no valida políticas IAM. Esto es una ventaja para pruebas (no configuras permisos) y una limitación (no puedes probar errores de autorización). Para eso necesitas AWS real o un emulador más completo.

### ¿Cómo actualizo Floci a una versión más reciente?

```bash
docker pull floci/floci:1.5.31
docker compose -f docker-compose.preview.yml up -d --force-recreate
```

> 💡 El proyecto fija la versión de la imagen en `docker-compose.preview.yml` para que CI y local usen exactamente la misma. No uses `latest` en CI.

## 15. Glosario ampliado

| Término                       | Definición                                                                |
| ----------------------------- | ------------------------------------------------------------------------- |
| **AWS CLI**                   | Herramienta de línea de comandos para interactuar con servicios AWS       |
| **Bucket**                    | Contenedor de objetos en S3                                               |
| **DynamoDB**                  | Base de datos NoSQL clave-valor de AWS                                    |
| **Endpoint URL**              | Dirección a la que apunta el SDK/CLI; en Floci es `http://localhost:4566` |
| **GSI**                       | Global Secondary Index: índice secundario en DynamoDB                     |
| **Ítem**                      | Registro individual en una tabla DynamoDB                                 |
| **PAY_PER_REQUEST**           | Modo de facturación de DynamoDB por uso real                              |
| **ResourceNotFoundException** | Error de AWS cuando un recurso no existe                                  |
| **SDK de AWS**                | Librería oficial para hablar con AWS desde código (v3 en Node.js)         |
| **Secrets Manager**           | Servicio AWS para almacenar secretos cifrados                             |
| **Tabla**                     | Estructura de datos en DynamoDB con clave de partición                    |
| **Volumen Docker**            | Almacenamiento persistente para contenedores                              |

## ✅ Checklist final de la guía

- [ ] Puedo explicar qué es Floci y sus datos clave (MIT, 68 servicios, 4566, ~90MB, ~24ms).
- [ ] Puedo comparar Floci vs LocalStack y justificar la elección del proyecto.
- [ ] Puedo desglosar los 3 servicios de `docker-compose.preview.yml`.
- [ ] He levantado Floci y verificado su healthcheck.
- [ ] He creado y leído un secreto con la AWS CLI contra Floci.
- [ ] Puedo explicar el patrón CreateSecret + GetSecretValue de `preview-smoke.mjs`.
- [ ] Puedo explicar la secuencia Floci → Consola → Terraform.
- [ ] Puedo explicar por qué Floci NO es un proveedor de hosting.
- [ ] Puedo crear y listar buckets S3 contra Floci.
- [ ] Puedo crear tablas DynamoDB y hacer CRUD contra Floci.
- [ ] Puedo diagnosticar los 6 problemas comunes de la sección 13.
- [ ] He completado al menos 3 ejercicios de la sección 14.

## 🧭 Navegación

| Anterior                                               | Actual                          | Siguiente                                                        |
| ------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------- |
| [11 — Conceptos de CD y AWS](./11-cd-conceptos-aws.md) | **12 — Floci: emulador de AWS** | [13 — Walkthrough de deploy.yml](./13-deploy-yml-walkthrough.md) |

- [Volver al índice Avanzado](./avanzado-README.md)

---

_Guía 12 de 7 del nivel Avanzado. Siguiente: [13 — Walkthrough de deploy.yml](./13-deploy-yml-walkthrough.md)._
