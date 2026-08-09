## Why

Brecha A2 del plan de seguridad: el job de secrets en `security.yml` usa `gitleaks/gitleaks-action@v2`, que requiere una licencia comercial vía el secret `GIT_LEAKS` — el job falla cada vez que ese secret no está configurado. Además, brecha M7: la detección de secretos solo corre sobre cambios staged/PR, por lo que un secreto ya commiteado en la historia puede pasar desapercibido indefinidamente.

## What Changes

- Rework el job `secrets` de `.github/workflows/security.yml` para que deje de depender de la licencia `GIT_LEAKS`: usar GitHub secret scanning (capa de plataforma: alertas + push protection) como primera línea + Gitleaks open source (`zricethezav/gitleaks` Docker image, MIT) como gate real en PRs, sin fallar si el secret no está presente.
- Añadir `.github/workflows/scheduled-security.yml`: cron semanal que ejecuta Gitleaks full repo scan sobre toda la historia (no solo staged), cubriendo brecha M7.
- Documentar cómo habilitar GitHub secret scanning y push protection en repo settings (Settings → Security → Secret scanning), incluyendo la activación de alertas y el bloqueo de push de secretos.
- Eliminar la dependencia del job de CI respecto a un secret comercial opcional: comportamiento degradado y no bloqueante cuando `GIT_LEAKS` no está configurado.

## Capabilities

### New Capabilities

- `ci-secret-scanning`: Detección de secretos en CI a nivel PR y programada (cron semanal) — GitHub secret scanning nativo + Gitleaks open source full-repo scan sin licencia, con documentación de activación y política de severidad (PR-time gate vs full-history audit).

### Modified Capabilities

<!-- Sin cambios de requisitos sobre specs existentes: ninguna spec actual cubre CI secret scanning. -->

## Impact

- `.github/workflows/security.yml` — job `secrets` reworkeado: se reemplaza `gitleaks/gitleaks-action@v2` (licenciado) por GitHub secret scanning + `zricethezav/gitleaks` (open source). Se elimina el requisito de `GITLEAKS_LICENSE`.
- `.github/workflows/scheduled-security.yml` — NUEVO: workflow con `schedule` (cron semanal) para full repo scan.
- Documentación — nueva sección sobre habilitar GitHub secret scanning / push protection en repo settings.
- Sin cambios en código de runtime (apps/server, apps/client) ni en APIs. Solo tooling de CI/seguridad.
- **BREAKING** (CI behavior): el job `secrets` deja de fallar cuando `GIT_LEAKS` no existe — pasa a degradarse (warning) en lugar de bloquear el pipeline.
