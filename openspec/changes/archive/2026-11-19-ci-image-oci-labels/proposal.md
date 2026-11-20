# Proposal

## Why

El PRD §"Versionado, metadatos de build y release" exige añadir las anotaciones estándar OCI `org.opencontainers.image.source`, `.revision`, `.created`, `.version` y `.title`, que `docker/metadata-action` puede generar, para que cualquier imagen en un registro se pueda rastrear hasta su commit. El repo no tiene estas etiquetas configuradas explícitamente en `build.yml` ni documentadas.

## What Changes

- Configurar `docker/metadata-action` en `build.yml` para emitir las etiquetas OCI estándar (`org.opencontainers.image.source`, `.revision`, `.created`, `.version`, `.title`).
- Asegurar que `.revision` usa el SHA del commit y `.created` usa `SOURCE_DATE_EPOCH` (o la fecha del commit) para reproducibilidad.
- Configurar las etiquetas de imagen del PRD §"Versionado": `sha-<commit>` (identifica el build exacto, usado por el despliegue junto al digest), `1.4.2` (release semántico, nunca reetiquetado), `main` (seguimiento de la rama principal, mutable, solo informativa). Los despliegues referencian el **digest**, no las etiquetas mutables.
- Verificar con `docker inspect` que las etiquetas se aplican a la imagen publicada.
- Documentar en `docs/` las etiquetas OCI y su propósito de trazabilidad.

## Capabilities

- **New Capabilities**: `ci-image-oci-labels`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `.github/workflows/build.yml`, `docs/`.
- Riesgo: bajo — solo añade labels a la imagen.
