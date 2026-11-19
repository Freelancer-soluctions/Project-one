# Imagen: etiquetas OCI y tags de trazabilidad

Implementa el change `ci-image-oci-labels` (PRD §"Versionado, metadatos de build y release"). La
imagen del server se publica en GHCR desde `.github/workflows/build.yml`, y cada build lleva
**labels dentro de la imagen** más un conjunto de **tags** en el registro.

El objetivo es que una imagen descargada de cualquier registro se pueda rastrear hasta su commit
sin consultar el registro ni el pipeline: las labels viajan en el manifiesto de la imagen.

---

## 1. Labels OCI

Las emite `docker/metadata-action` (paso `Docker metadata`) y las aplica
`docker/build-push-action` con `labels: ${{ steps.meta.outputs.labels }}`.

| Label                                  | Valor                                              | Fuente                                       |
| -------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `org.opencontainers.image.title`       | `Project One API`                                  | literal                                      |
| `org.opencontainers.image.description` | `API Express + Socket.IO del monorepo Project One` | literal                                      |
| `org.opencontainers.image.source`      | `https://github.com/<owner>/<repo>`                | `github.server_url` + `github.repository`    |
| `org.opencontainers.image.revision`    | SHA completo del commit                            | `github.sha`                                 |
| `org.opencontainers.image.created`     | `2026-11-18T23:28:05Z`                             | fecha del commit (`git log -1 --format=%ct`) |
| `org.opencontainers.image.version`     | `1.0.0`                                            | `version` de `package.json` (raíz)           |

`created` y `revision` son las **mismas** que alimentan `dist/version.json`
(change `ci-write-version-metadatos`): el paso `Version metadata inputs` calcula la fecha del commit
una sola vez y la reparte al Dockerfile (`SOURCE_DATE_EPOCH`) y a las labels. Nunca `Date.now()`,
así que dos builds del mismo commit producen la misma label `created`.

`version` sale del `package.json` raíz porque el producto se despliega como un todo; `changeset
version` lo sube antes de crear el tag de release, de modo que en un tag `v1.4.2` la label y el
tag semántico coinciden.

---

## 2. Tags de imagen

```yaml
tags: |
  type=sha,format=long
  type=semver,pattern={{version}}
  type=ref,event=branch,enable=${{ github.event_name == 'push' && github.ref_type == 'branch' }}
```

| Patrón         | Ejemplo                                        | Cuándo                     | Mutabilidad                   |
| -------------- | ---------------------------------------------- | -------------------------- | ----------------------------- |
| `sha-<commit>` | `sha-4420021b63228a185b07ebb84e5cf9534d626409` | todo build del job `image` | **inmutable** (por commit)    |
| `<semver>`     | `1.4.2`                                        | push de un tag `v*.*.*`    | **inmutable** (tag de git)    |
| `main`         | `main`                                         | push a la rama `main`      | **mutable**: solo informativa |

### Regla de despliegue

**Los despliegues referencian el digest, no las etiquetas mutables.**

- `main` se mueve con cada push: usarla en un despliegue significa que un `docker pull` mañana trae
  otro código que el de hoy, sin que nadie lo haya decidido.
- `sha-<commit>` identifica el build exacto y es seguro para referenciar, pero el digest es la
  identidad criptográfica del manifiesto: es lo que se firma, atesta y escanea.
- El tag semántico se crea una sola vez, a partir de un tag de git, y no se reetiqueta.

El `build.yml` ya expone el digest en el output `digest` (`steps.push.outputs.digest`) y la
atestación de procedencia se firma sobre él, no sobre el tag.

---

## 3. Cómo verificarlo

En local, sobre una imagen construida con los mismos valores:

```bash
docker inspect --format '{{json .Config.Labels}}' <imagen> | jq .
```

Sobre lo publicado en el registro (requiere autenticación y no descarga la imagen):

```bash
docker buildx imagetools inspect ghcr.io/<owner>/<repo>:sha-<commit>
# o, por digest:
docker buildx imagetools inspect ghcr.io/<owner>/<repo>@sha256:<digest>
```

Comprobación mínima de que las cinco labels del PRD están presentes:

```bash
docker inspect --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' <imagen> \
  | grep -E '^org\.opencontainers\.image\.(source|revision|created|version|title)='
```

Los tags se listan con `docker image ls` en local o con `docker buildx imagetools inspect
<imagen>` contra el registro.

---

## 4. Límites conocidos

- La verificación sobre la imagen **publicada** exige un run de CI con permiso de push a GHCR; en
  un checkout local solo se puede validar la imagen construida con los mismos valores.
- El tag semántico solo aparece si el workflow corre sobre un tag `v*.*.*`; un push a `main` nunca
  lo crea ni lo mueve (por eso el trigger `push.tags` está declarado en `build.yml`).
- `1.0.0` es la versión actual de `package.json`; hasta que exista una release con tag, las
  imágenes de `main` llevan `sha-<commit>` y `main`, no un tag semántico.
