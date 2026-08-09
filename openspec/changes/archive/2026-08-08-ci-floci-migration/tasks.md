## 1. Activar Floci en el compose dev-local

- [x] 1.1 Insertar el servicio `floci` bajo la clave `services:` de `apps/server/docker-compose.yml` (tras `grafana`, ~línea 85) — imagen `floci/floci:1.5.31`, puerto `4566:4566`, `FLOCI_STORAGE_MODE=memory`, healthcheck `["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health >/dev/null 2>&1 || exit 1"]`, en la red existente `app-network`. **NOTA de alineación**: el tag `v1.5.11` no existe en Docker Hub (el publicado es `1.5.31`) y el comando `floci health` no existe en la imagen (el patrón correcto es curl `/_localstack/health`, consistente con el preview stack). **NOTA**: el bloque LocalStack comentado (líneas 96-119: `api` alternativo + red `aws-local`) está DESPUÉS de la clave `volumes:` — fuera de `services:` — por lo que debe ELIMINARSE por completo (no reemplazarse in-place, que produciría YAML inválido)
- [x] 1.2 Verificar que los servicios existentes del compose dev-local quedan intactos: `db` (`postgres:17`), `pgAdmin`, `api`, `nginx`, `prometheus`, `grafana`
- [x] 1.3 Validar el compose: `docker compose config` desde `apps/server` pasa sin errores de YAML y muestra el servicio `floci`. Verificar antes que la imagen existe: `docker manifest inspect floci/floci:1.5.31` (o `docker pull floci/floci:1.5.31`)

## 2. Setup de desarrollo (variables AWS)

- [x] 2.1 Añadir a `apps/server/.env.example` las variables AWS de dev como referencia: `AWS_REGION=us-east-1`, `AWS_ENDPOINT_URL=http://localhost:4566`, `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`, `SECRET_NAME=<secret-de-dev>`, marcadas como "solo local / dummy" (no tocar `.env` real)
- [x] 2.2 Validar el path de Secrets Manager emulado vía script/REPL independiente (NOTA: `loadSecrets()` es código muerto hoy — ningún archivo de la app la importa; ejecutar la app no ejercita nada): levantar `floci` (`docker compose up -d floci`), crear un secret de prueba en Floci, y ejecutar desde `apps/server` `node --input-type=module -e "import {loadSecrets} from './src/config/aws/secrets.js'; console.log(await loadSecrets())"` con las variables AWS (endpoint Floci, dummy creds, `SECRET_NAME`) → obtiene el secret emulado sin cambios de código

## 3. Documentación dev-local

- [x] 3.1 Crear `docs/aws-dev-local-floci.md`: qué es Floci (floci.io, MIT, 68 servicios AWS, puerto 4566), cómo activarlo (`docker compose up -d floci` desde `apps/server`), verificación del healthcheck (`docker compose ps` healthy), tabla de variables de entorno de dev (dummy creds), cómo el código de Secrets Manager se conecta vía `AWS_ENDPOINT_URL`, diferencias vs AWS real, y referencia cruzada a `docs/aws-learning-with-floci.md` (ruta de aprendizaje, change `ci-preview-environments` — ese archivo lo introduce el sibling, mergear este change después o notar el ordering). **Incluir**: (a) distinción host-mode vs container-mode — `localhost:4566` funciona para `npm run dev` en el host; el servicio containerizado `api` (env_file: .env) necesita `AWS_ENDPOINT_URL=http://floci:4566` para alcanzar Floci desde la red interna; (b) nota de reiniciar el server tras cambiar variables AWS (nodemon no recarga env)
- [x] 3.2 Documentar en `docs/aws-dev-local-floci.md` el follow-up: ampliación de tests AWS con `@floci/testcontainers` + Vitest (ítem 2.4 de `docs/cicd-plan-implementacion.md`), fuera de scope de este change

## 4. Verificación final

- [x] 4.1 Verificar que no hay impacto en producción/staging: sin `AWS_ENDPOINT_URL` definida, el cliente de Secrets Manager usa el endpoint real de AWS por defecto
- [x] 4.2 Confirmar que el stack de preview (`docker-compose.preview.yml` + workflow `preview.yml` de `ci-preview-environments`) no se tocó
