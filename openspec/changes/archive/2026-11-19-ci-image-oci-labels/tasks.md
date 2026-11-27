# Tasks

## 1. Configurar etiquetas OCI

- [x] 1.1 Configurar `docker/metadata-action` en `build.yml` para emitir `org.opencontainers.image.source`, `.revision`, `.created`, `.version`, `.title`.
- [x] 1.2 Asegurar que `.revision` usa el SHA del commit (`{{.Sha}}` o `${{ github.sha }}`).
- [x] 1.3 Asegurar que `.created` usa `SOURCE_DATE_EPOCH` o la fecha del commit (no `Date.now()` por defecto).
- [x] 1.4 Verificar que `build-push-action` aplica las labels (`labels: ${{ steps.meta.outputs.labels }}`).

## 2. Etiquetas de imagen (PRD §"Versionado")

- [x] 2.1 Configurar `docker/metadata-action` para emitir `sha-<commit>` (identifica el build exacto, usado por el despliegue junto al digest).
- [x] 2.2 Configurar tag semántico `1.4.2` (release, nunca reetiquetado).
- [x] 2.3 Configurar tag `main` (seguimiento de la rama principal, mutable, solo informativa).
- [x] 2.4 Documentar que los despliegues referencian el **digest**, no las etiquetas mutables.

## 3. Verificación

- [x] 3.1 Ejecutar `docker inspect` sobre la imagen publicada y verificar las 5 etiquetas OCI + las 3 etiquetas de imagen.
- [x] 3.2 Documentar en `docs/` las etiquetas OCI y su propósito de trazabilidad.

## Resultado de la verificación (2026-11-18)

Commit de prueba: `4420021b63228a185b07ebb84e5cf9534d626409` (epoch `1795044485`).

### Labels (`build.yml` → `Docker metadata` → `build-push-action`)

| Label                                  | Valor en el build de prueba                            |
| -------------------------------------- | ------------------------------------------------------ |
| `org.opencontainers.image.title`       | `Project One API`                                      |
| `org.opencontainers.image.description` | `API Express + Socket.IO del monorepo Project One`     |
| `org.opencontainers.image.source`      | `https://github.com/Freelancer-soluctions/Project-one` |
| `org.opencontainers.image.revision`    | `4420021b63228a185b07ebb84e5cf9534d626409`             |
| `org.opencontainers.image.created`     | `2026-11-18T23:28:05Z`                                 |
| `org.opencontainers.image.version`     | `1.0.0` (`package.json` raíz)                          |

- **`revision`** = `${{ github.sha }}`; **`created`** sale del paso `Version metadata inputs`
  (`git log -1 --format=%ct` → `date -u`), la misma fuente que `SOURCE_DATE_EPOCH` del Dockerfile.
  Nada de `Date.now()`: dos builds del mismo commit dan la misma label.
- **`build-push-action`** ya aplicaba `labels: ${{ steps.meta.outputs.labels }}`; se mantiene.

### Tags

```yaml
tags: |
  type=sha,format=long
  type=semver,pattern={{version}}
  type=ref,event=branch,enable=${{ github.event_name == 'push' && github.ref_type == 'branch' }}
```

- `sha-<commit>` en todo build; `1.4.2` solo en push de un tag `v*.*.*` (de ahí el trigger
  `push.tags` añadido en `build.yml`, sin el cual `type=semver` nunca podría emitirse); `main`
  solo en push a rama y marcado como mutable en la documentación.

### Evidencia ejecutada

- **`docker inspect`** sobre una imagen construida con el mismo conjunto de labels
  (`--label …` replicando la salida del action): las 5 labels OCI del PRD presentes, más
  `description`. Comando del doc (`grep -E '^org\.opencontainers\.image\.(source|revision|created|version|title)='`)
  → 5/5.
- **`actionlint .github/workflows/build.yml`** → EXIT 0; Prettier → limpio.
- **`docs/imagen-oci-labels.md`** (nuevo): labels, tags, regla de digest, comandos de inspección y
  límites. `markdownlint` → EXIT 0; Prettier → limpio.

### Límite de la verificación

- **No se pudo inspeccionar la imagen publicada**: publicar en GHCR requiere un run de CI con
  credenciales. La verificación 3.1 se hizo sobre una imagen local construida con los mismos
  valores de label; la equivalencia exacta con `metadata-action` solo la confirma el primer run
  tras el merge. Los tags (`sha-…`, `1.4.2`, `main`) tampoco se pueden emitir en local: su
  corrección es estática (`actionlint` + configuración documentada).

### Divergencias del artefacto

- Se añadió `push.tags: ['v*.*.*']` a `build.yml`: sin ese trigger el tag semántico del PRD no
  podría existir nunca.
- `org.opencontainers.image.version` toma la versión de `package.json` (producto único, la sube
  `changeset version` antes del tag de release) en lugar de un valor calculado por el action.
