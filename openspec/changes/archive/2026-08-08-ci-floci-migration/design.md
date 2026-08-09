## Context

- `apps/server/docker-compose.yml` contiene una sección LocalStack comentada (líneas 96-119: un `api` alternativo con `AWS_ENDPOINT_URL: http://localstack:4566` + red `aws-local` `external: true`) — no hay LocalStack activo; el plan `docs/cicd-plan-implementacion.md` (ítem 2.3) prevé "1 línea en docker-compose.yml" para activar Floci.
- El cliente `@aws-sdk/client-secrets-manager` (`src/config/aws/secret-manager.client.js`) ya respeta `AWS_ENDPOINT_URL`; `src/config/aws/secrets.js` (`loadSecrets()`) usa `SECRET_NAME` — ambos listos para emulación sin cambios de código.
- El change sibling `ci-preview-environments` ya adopta Floci (`floci/floci:1.5.31`, puerto 4566, `FLOCI_STORAGE_MODE=memory`, healthcheck `["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health"]`) en un stack separado (`docker-compose.preview.yml`) y es dueño de `docs/aws-learning-with-floci.md`.
- Ningún test de integración usa emulador AWS hoy (verificado: solo Postgres). Motivación completa en proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- Activar Floci como emulador AWS en el stack dev-local con el mínimo cambio de configuración
- Documentar el setup local (Floci + app con credenciales dummy) para que cualquier dev pueda usarlo
- Mantener consistencia con el pinning del repo y con el sibling `ci-preview-environments` (misma imagen, misma versión)

**Non-Goals:**

- NO tocar el stack de preview (`docker-compose.preview.yml`) ni el workflow `preview.yml` — son de `ci-preview-environments`
- NO añadir tooling de tests (`@floci/testcontainers` + Vitest) en este change — queda como follow-up (ítem 2.4 del plan)
- NO cambiar Postgres 17 ni ningún servicio existente del compose dev-local
- NO modificar el código de la app (el cliente AWS ya es compatible)

## Decisions

1. **Activar `floci` en `apps/server/docker-compose.yml` (reemplazando la sección comentada)**
   - Se elimina el bloque comentado (api alternativo + red `aws-local`) y se añade el servicio `floci` al compose dev-local, en la red existente `app-network` con `4566:4566`.
   - Alternativas rechazadas: (a) crear un compose separado para dev — innecesario, el compose dev-local ya es el hogar natural y el plan prevé "1 línea"; (b) dejar la sección comentada y añadir floci al lado — deja deuda muerta; se reemplaza el bloque obsoleto.

2. **Imagen pineada `floci/floci:1.5.31` + `FLOCI_STORAGE_MODE=memory`**
   - Misma versión que `ci-preview-environments` (consistencia) y conforme a la política de pinning del repo (gitleaks v8.22.1, sbom-action v0.17.2). Storage en memoria: dev efímero, sin volumen persistente. **Nota de desviación intencional**: el plan `docs/cicd-plan-implementacion.md` §9 muestra `FLOCI_STORAGE_MODE: persistent` + volumen `floci_data` — se elige `memory` para dev efímero, consistente con el sibling `ci-preview-environments`; la persistencia puede activarse si se necesita conservar estado entre sesiones.
   - **Nota de alineación con la implementación**: el tag `floci/floci:v1.5.11` no existe en Docker Hub; `1.5.31` es el tag publicado real (verificado con `docker manifest inspect`/`docker pull` durante la implementación). El compose dev-local usa `floci/floci:1.5.31`.
   - Alternativas rechazadas: `floci/floci:latest` (no reproducible); LocalStack Community (sunset marzo 2026, auth token).

3. **Healthcheck `["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health"]`**
   - Permite `depends_on: condition: service_healthy` si en el futuro el contenedor `api` del compose necesita esperar a Floci; útil también para verificación manual (`docker compose ps`).
   - **Nota de alineación con la implementación**: el comando `floci health` no existe en la imagen; el patrón correcto es curl contra `/_localstack/health` (endpoint de compatibilidad LocalStack), el mismo que ya usa el stack de preview (`ci-preview-environments`). El compose dev-local usa `["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health >/dev/null 2>&1 || exit 1"]`.

4. **Docs en archivo nuevo `docs/aws-dev-local-floci.md` (no SECURITY.md)**
   - `docs/security/SECURITY.md` trata manejo de secretos reales (gitleaks, claves), no tooling de emulación — mezclar concerns no aporta.
   - `docs/aws-learning-with-floci.md` es del sibling `ci-preview-environments` (ruta de aprendizaje + preview stack); este change documenta la **activación dev-local** (compose + env vars) y referencia cruzada al learning path.

5. **`.env.example` (apps/server): añadir variables AWS de dev como referencia**
   - `AWS_REGION`, `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SECRET_NAME` documentadas (con dummy values) para que el setup local sea reproducible. No se toca el `.env` real.

6. **Sin cambios de tests**
   - Ningún test usa emulador AWS hoy; el path Secrets Manager emulado queda cubierto por la documentación. Ampliar cobertura con `@floci/testcontainers` es follow-up (ítem 2.4 del plan), no parte de este change.

## Risks / Trade-offs

- [Floci no cubre algún servicio AWS que se necesite] → Mitigation: la app solo usa `secretsmanager` hoy; `docs/cicd-plan-implementacion.md` documenta LocalStack (con auth token) como fallback temporal
- [Imagen pineada 1.5.31 queda desactualizada] → Mitigation: política de pinning del repo; bump controlado y versionado como cualquier dependencia
- [Conflicto de puerto 4566 si el stack de preview corre en paralelo en la misma máquina] → Mitigation: el preview stack es efímero (CI/local on-demand); se documenta en `docs/aws-dev-local-floci.md`
- [Credenciales dummy en docs/environment confundidas con secretos reales] → Mitigation: se marcan explícitamente como "solo local"; gitleaks no las detecta como secretos (valores `test`/`test`)

## Migration Plan

1. Eliminar el bloque comentado (líneas 96-119) de `apps/server/docker-compose.yml` y añadir el servicio `floci` bajo `services:`
2. Crear `docs/aws-dev-local-floci.md` con el setup local
3. Añadir variables AWS de referencia a `apps/server/.env.example`
4. Validación manual: `docker compose up -d floci` + `docker compose ps` (estado healthy del healthcheck curl `/_localstack/health`) + script/REPL independiente que importa `loadSecrets()` (ver task 2.2 — `loadSecrets()` es código muerto hoy, no lo llama ningún archivo de la app; se valida vía REPL hasta que exista un consumidor)
5. Rollback: `git revert` del cambio de compose (solo configuración, sin datos ni migraciones)

## Open Questions

- Ninguna: las decisiones de configuración y alcance están resueltas en proposal.md y en este design; los unknowns diferibles (ampliación de tests con Testcontainers) están documentados como follow-up.
