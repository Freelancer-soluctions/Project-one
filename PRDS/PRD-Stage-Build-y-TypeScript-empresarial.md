# PRD: Stage Build y TypeScript empresarial

Nov 12, 2026 · @Johan

## Resumen

El stage de build convierte código ya validado en **un artefacto inmutable, reproducible y trazable**, construido una sola vez; staging y producción reciben ese mismo artefacto, identificado por su digest. Este PRD define cómo se construye ese artefacto (imagen de contenedor con GitHub Actions) y cómo se configura TypeScript para que el build sea estricto, rápido y determinista.

Tres ideas lo resumen:

1. **TypeScript es la primera línea de calidad del build.** Una base `tsconfig` estricta (`strict` más flags adicionales) convierte errores de ejecución en errores de compilación; en la prueba, tres de esos flags rechazaron código inválido con un código de error concreto.
2. **El build es una función de sus entradas.** Con lockfile, versiones fijadas y `tsc -b`, dos compilaciones del mismo commit produjeron salidas con hashes idénticos en la prueba.
3. **El artefacto se firma y se rastrea.** SBOM, *provenance* y firma se generan en el mismo job que publica la imagen, y los despliegues referencian el digest, no un tag.

Lo verificado y lo que no: los flags de TypeScript, `tsc -b`, las referencias entre proyectos y la reproducibilidad se ejecutaron en un monorepo de prueba con TypeScript 7.0.2 y Node 22. El Dockerfile y el workflow de GitHub Actions se basan en documentación oficial pero **no se ejecutaron**: el sandbox no tiene daemon de Docker ni acceso a un registro. La sección de verificación lo detalla.

## Alcance y objetivos

El PRD cubre desde que el stage de Quality pasa hasta que existe una imagen publicada, firmada y escaneada. Queda fuera lo que ocurre después: pruebas de integración, despliegue y promoción entre entornos.

| Dentro del alcance | Fuera del alcance |
| --- | --- |
| Configuración de TypeScript (base, por paquete, references) | Reglas de ESLint y formato (documento del stage Quality) |
| Compilación con `tsc -b` y control de salidas | Pruebas unitarias y de integración |
| Dockerfile multi-stage y `.dockerignore` | Despliegue y estrategias de rollout |
| Workflow de build en GitHub Actions | Escaneo de dependencias del lockfile (SCA) |
| SBOM, provenance, firma y escaneo de la imagen | Gestión de secretos de runtime |
| Gates del stage y plan de adopción | Otros lenguajes y runtimes |

**Objetivos medibles**

1. Todo artefacto desplegable se identifica por digest y sale de un solo build por commit.
2. Dos builds del mismo commit con las mismas entradas producen la misma salida de TypeScript (comprobado por hash).
3. Ningún error de tipos ni de compilación llega a la imagen: el build falla antes de empaquetar.
4. Cada imagen publicada tiene SBOM, provenance y firma verificables.
5. El job de build termina con un presupuesto de tiempo acordado y falla si lo excede (`timeout-minutes`).

**No objetivos.** Builds bit a bit reproducibles de la imagen completa (depende de la imagen base y de las marcas de tiempo de las capas; se trata como una decisión en la sección final), ni migrar el proyecto a otro bundler.

## Principios del artefacto

Cada principio tiene un control que lo hace cumplir; sin control, es solo una intención.

| Principio | Qué significa | Cómo se hace cumplir |
| --- | --- | --- |
| Construir una vez | Lo probado en staging es, byte a byte, lo que llega a producción; no se recompila por entorno | El despliegue recibe el digest de la imagen; la configuración por entorno se inyecta en runtime, no en el build |
| Inmutable | Un tag no cambia de contenido; el digest identifica el artefacto | Despliegues por digest; `latest` nunca es referencia de despliegue |
| Reproducible | Mismas entradas, misma salida | `npm ci` con lockfile, Node y TypeScript en versión fija, imagen base por digest, acciones fijadas por SHA |
| Hermético | El build no depende del estado del runner ni de red no declarada | Dependencias solo desde registros permitidos; `--ignore-scripts` y pasos explícitos para lo que necesite scripts |
| Trazable | De la imagen se llega al commit, al workflow y a las dependencias | Etiqueta con el SHA, provenance, SBOM y firma |
| Mínimo | La imagen final solo contiene lo necesario para ejecutar | Multi-stage, `npm prune --omit=dev`, usuario no root |
| Falla antes | El error más barato es el que se detecta primero | El build depende de `quality-complete`; el typecheck corre antes de empaquetar |

## Flujo del stage

&#91;embedded content: flujo del stage de build · 8 pasos, 1 decisión, 4 gates\]

El build corre solo con Quality en verde. En un pull request el flujo termina tras construir la imagen (G1 y G2); solo un push a `main` publica, atesta, escanea y promueve el digest, y cada gate en rojo detiene el recorrido.

## TypeScript empresarial: configuración

La configuración se reparte en tres niveles: una **base compartida** con las reglas estrictas, un `tsconfig` **por paquete** con salidas y referencias, y un `tsconfig` **raíz** de solución que solo apunta a los paquetes. Todo lo de esta sección se ejecutó con TypeScript 7.0.2 (la versión `latest` en npm el 2026-11-12), Node 22 y `@types/node` 26.

**1. Base compartida (`tsconfig.base.json`)**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "rewriteRelativeImportExtensions": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "incremental": true
  }
}
```

| Flag | Para qué sirve | Evidencia |
| --- | --- | --- |
| `strict` | Activa todo el chequeo estricto de tipos | La guía de Total TypeScript lo llama indispensable |
| `noUncheckedIndexedAccess` | Un acceso por índice devuelve `T \| undefined` | Probado: asignar `ids["a"]` a `string` dio TS2322 |
| `verbatimModuleSyntax` | Obliga a `import type` para tipos | Probado: importar un tipo sin `type` dio TS1484 |
| `erasableSyntaxOnly` | Prohibe sintaxis con efecto en runtime (`enum`, parameter properties) | Probado: un `enum` dio TS1294 |
| `noImplicitOverride`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature` | Cierran huecos que `strict` no cubre | No se probaron uno a uno; son opciones del compilador documentadas |
| `isolatedModules` | Prohíbe construcciones inseguras si cada archivo se transpila aislado | Recomendado por la misma guía |
| `module` y `moduleResolution`: `nodenext` | Resolución igual a la de Node para código que se ejecuta en Node | La guía lo recomienda cuando se transpila con `tsc`; con bundler se usa `module: preserve` |
| `skipLibCheck` | No revisa los `.d.ts` de `node_modules` | Ahorra tiempo; acepta el riesgo de no detectar errores en tipos de terceros |
| `composite`, `declaration`, `declarationMap` | Necesarios para referencias entre proyectos y navegación entre paquetes | El handbook exige `composite` y `declaration` en proyectos referenciados |
| `rewriteRelativeImportExtensions` | Permite importar con extensión `.ts` y reescribirla a `.js` al emitir | Sin él, un import `.ts` dio TS5097; la prueba final importa por nombre de paquete y no ejercita este flag |

Lo que **no** va en la base: `noUnusedLocals` y `noUnusedParameters`. La guía de Total TypeScript los considera demasiado ruidosos para un valor por defecto, y en este stack esa regla la lleva ESLint (stage Quality), donde se puede aplicar con ratchet.

**2. Por paquete (`packages/api/tsconfig.json`)**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

**3. Raíz de solución (`tsconfig.json`)**

```json
{
  "files": [],
  "references": [{ "path": "packages/shared" }, { "path": "packages/api" }]
}
```

El handbook recomienda este patrón (herencia de la base y un tsconfig de solución con `files: []`) para no compilar archivos dos veces.

**Reglas de uso**

1. **El build es `tsc -b`.** Construye los proyectos desactualizados en orden de dependencia. El handbook indica que en modo build el compilador actúa como si `noEmitOnError` estuviera activo.
2. **Los paquetes se importan por nombre** (`@x/shared`, con `exports` en su `package.json`), no con rutas relativas a otro paquete: en la prueba, resolverlos por workspace de npm funcionó y mantiene `rootDir` limpio.
3. **Una sola versión de TypeScript** fijada en el lockfile y en `devDependencies` raíz; el mismo compilador en local, en CI y en el Dockerfile.
4. **`tsconfig` de entornos distintos no se mezclan.** Código de Node y código de navegador tienen `lib` y `types` distintos; si el repo tiene ambos, cada uno extiende la base y añade lo suyo.
5. **Sin `any` implícito ni `@ts-ignore` libres.** `@ts-expect-error` con descripción cuando sea inevitable; la regla de ESLint `ban-ts-comment` lo hace cumplir (stage Quality).
6. **Salidas fuera de git.** `dist/` y `.tsbuildinfo` en `.gitignore` y `.dockerignore`; el handbook advierte que versionar salidas obliga a `--force` tras algunas operaciones de git.

**Alternativa: ejecutar `.ts` directamente.** Node soporta quitar tipos de forma nativa (estable desde la v24.12 y la v25.2, activado por defecto desde la v22.18), pero solo ejecuta sintaxis borrable, ignora `tsconfig.json` (sin `paths`) y exige extensiones en los imports. La base de arriba ya es compatible (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`), así que la migración queda abierta, pero este PRD mantiene la compilación con `tsc` porque produce `dist/` con tipos, mapas y control de salidas, y Node no verifica tipos.

## Dockerfile multi-stage

El Dockerfile separa cuatro etapas para que la imagen final no contenga compilador, `devDependencies` ni código fuente, y para que la caché de capas se invalide solo cuando cambia lo que corresponde. El patrón (base, deps, build, runtime, `npm ci`, `npm prune --omit=dev`, usuario no root) coincide con el de la guía de OneUptime para Node y TypeScript; esta versión lo adapta a un monorepo con workspaces.

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine@sha256:<DIGEST> AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

FROM deps AS build
COPY tsconfig.json tsconfig.base.json ./
COPY packages packages
RUN npx tsc -b && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=app:app /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=app:app /app/packages/api/package.json ./packages/api/package.json
COPY --from=build --chown=app:app /app/packages/api/dist ./packages/api/dist
USER app
CMD ["node", "packages/api/dist/index.js"]
```

`.dockerignore`:

```text
node_modules
**/dist
.git
.env*
```

| Decisión | Motivo |
| --- | --- |
| Base fijada por digest (`@sha256:<DIGEST>`) | Un tag como `22-alpine` se mueve; el digest hace el build repetible. Un bot (Dependabot o Renovate) propone las actualizaciones |
| Se copian los `package.json` y el lockfile antes del código | La capa de dependencias solo se reconstruye si cambia el lockfile |
| `--mount=type=cache` para `~/.npm` | Acelera `npm ci` entre builds sin dejar la caché en la imagen |
| `npm ci --ignore-scripts` | No ejecuta scripts de instalación de terceros; lo que sí los necesite (por ejemplo `prisma generate`) se ejecuta como paso explícito. La guía fuente advierte que algunos módulos nativos pueden requerirlos: se prueba |
| `tsc -b` en la etapa `build` | El mismo compilador y la misma configuración que en CI; si hay un error de tipos, no hay imagen |
| `npm prune --omit=dev` | La etapa final copia solo dependencias de producción |
| Usuario no root con UID fijo | Reduce el impacto de una vulnerabilidad en la aplicación y facilita políticas del clúster |
| Sin secretos en `ARG` ni `ENV` | Los argumentos de build quedan registrados en el provenance de repos públicos; los secretos van por montajes de secretos de BuildKit |

**Añadir según el servicio:** un `HEALTHCHECK` o sondas del orquestador (la guía fuente usa uno contra `/health`, que hay que ajustar al servicio real) y un init de procesos como `dumb-init` para manejar señales y apagado ordenado.

**Lo que no se verificó.** El Dockerfile no se construyó en el sandbox: el cliente de Docker está instalado, pero no hay daemon activo y el acceso a registros está restringido, así que no se puede descargar la imagen base. Lo que sí se comprobó son los pasos que ejecuta: `npm ci --ignore-scripts` terminó con éxito en el monorepo de prueba y `tsc -b` generó `dist/` en ambos paquetes y el resultado se ejecutó con `node`. El primer build real debe validar el tamaño de la imagen, el arranque con el usuario no root y que `npm prune` no elimine algo que el runtime necesita.

## Workflow de GitHub Actions

Dos jobs con responsabilidades separadas: `build` compila y comprueba TypeScript con permisos mínimos; `image` construye, publica y atesta la imagen con los permisos extra que eso exige. Los permisos de escritura y de identidad (`id-token`) solo existen en el segundo.

```yaml
name: build
on:
  pull_request:
  push:
    branches: [main]
  merge_group:

permissions: {}

concurrency:
  group: build-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  IMAGE: ghcr.io/${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<SHA> # vX
        with:
          persist-credentials: false
      - uses: actions/setup-node@<SHA> # vX
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npx tsc -b

  image:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      packages: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@<SHA> # vX
        with:
          persist-credentials: false
      - uses: docker/setup-buildx-action@<SHA> # v4
      - uses: docker/login-action@<SHA> # v4
        if: github.event_name != 'pull_request'
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@<SHA> # v6
        with:
          images: ${{ env.IMAGE }}
          tags: type=sha,format=long
      - id: push
        uses: docker/build-push-action@<SHA> # v7
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          provenance: mode=max
          sbom: true
          cache-from: type=gha,scope=app
          cache-to: type=gha,mode=max,scope=app
      - uses: actions/attest@<SHA> # v4
        if: github.event_name != 'pull_request'
        with:
          subject-name: ${{ env.IMAGE }}
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
```

Las versiones entre comentarios (`v4`, `v6`, `v7`) son las que muestran las páginas oficiales de Docker y GitHub consultadas; las de `checkout` y `setup-node` no se consultaron, así que `<SHA>` y `vX` se resuelven al fijar cada acción por SHA completo (con Dependabot o Renovate para actualizarlas).

**Por qué está así**

1. **`permissions: {}` global** y permisos por job: el job que solo compila no puede escribir paquetes ni pedir un token OIDC.
2. **`push` solo fuera de PRs.** En un PR la imagen se construye para validar el Dockerfile, pero no se publica ni se atesta. Docker documenta que las atestaciones requieren push directo: con `load: true` o el exportador `docker` no se añaden.
3. **`provenance: mode=max` y `sbom: true`.** Docker indica que los repositorios públicos reciben `mode=max` por defecto y los privados `mode=min`, y que el SBOM no se añade por defecto. Se declaran explícitos para que el comportamiento no dependa de la visibilidad del repo.
4. **Atestación por digest.** `subject-name` es el nombre completo de la imagen sin tag y `subject-digest` sale de la salida `digest` de `build-push-action`, tal como indica la documentación de GitHub.
5. **Caché `type=gha` con `scope` propio.** Docker advierte que sin `scope` distinto, cada imagen sobrescribe la caché de la anterior. La caché de GitHub tiene límites de tamaño y entradas que pueden expirar: sirve para acelerar, no para garantizar.
6. **`merge_group`.** Imprescindible si la rama usa cola de merge; sin él, el check obligatorio queda pendiente.
7. **`concurrency` y `timeout-minutes`.** Cancelan builds obsoletos de un PR y evitan que un build colgado consuma minutos.

**Integración con el stage Quality.** En el pipeline completo el job `build` declara `needs: quality-complete` (el agregador estricto del documento del stage Quality); aquí se omitió para que el ejemplo se lea solo.

**Pull requests de forks.** El flujo de arriba no debe publicar imágenes desde un fork: con `pull_request` el token es de solo lectura y la condición `push` queda en falso. Nunca se usa `pull_request_target` para ejecutar código del PR.

## Supply chain de la imagen

Tres evidencias acompañan a cada imagen publicada: qué contiene (SBOM), cómo y dónde se construyó (provenance) y quién la atestó (atestación firmada). Una cuarta comprobación, el escaneo de vulnerabilidades de la imagen, decide si se puede promover.

| Control | Herramienta | Qué produce | Cuándo falla |
| --- | --- | --- | --- |
| SBOM | `sbom: true` en `docker/build-push-action` | Atestación con la lista de componentes de la imagen, adjunta en el registro | No se genera (el push directo es requisito) |
| Provenance | `provenance: mode=max` | Registro de cómo se construyó: fuente, workflow y parámetros | No se genera |
| Atestación firmada | `actions/attest` con `subject-digest` y `push-to-registry: true` | Atestación verificable vinculada al digest | Permisos insuficientes o digest vacío |
| Verificación | `gh attestation verify oci://<imagen>:<tag> -R <org>/<repo>` | Confirma que la imagen salió de ese repositorio | La verificación falla: no se despliega |
| Escaneo de imagen | Trivy sobre la imagen publicada | Lista de vulnerabilidades por severidad | Hallazgos que cumplen el umbral (ver abajo) |

**Permisos del job de imagen.** La documentación de GitHub para atestar imágenes de contenedor pide `id-token: write`, `contents: read`, `attestations: write` y `packages: write`. El nombre del sujeto es el nombre completo de la imagen, sin tag, y el digest va en forma `sha256:<hex>`.

**Secretos y provenance.** En repositorios públicos el provenance registra los valores de los argumentos de build; por eso los secretos nunca viajan como `ARG`, sino como montajes de secretos de BuildKit.

**Escaneo de la imagen con Trivy.** El comando `trivy image` devuelve exit 1 cuando encuentra vulnerabilidades que cumplen el umbral de `--severity` y `--exit-code 1`; `--ignore-unfixed` omite las que no tienen parche. La guía consultada advierte dos cosas que se aplican aquí: su ejemplo de Action no muestra un `exit-code` explícito, así que hay que confirmar que el paso falle de verdad (con una imagen de prueba con una vulnerabilidad conocida), y fija la Action a `@master`, que no es reproducible; se fija por SHA. Umbral propuesto: fallar con `CRITICAL` y `HIGH` que tengan corrección disponible, y registrar el resto como advisory.

**Verificación antes de desplegar.** El último control de la cadena está en el despliegue, no en el build: antes de aplicar una imagen se verifica su atestación y se referencia por digest. Si el despliegue no verifica, la firma no protege nada.

**Lo que no cubre este PRD.** La documentación de GitHub consultada no afirma un nivel SLSA concreto, así que el PRD no lo declara. La firma con `cosign` y las políticas de admisión en el clúster (por ejemplo, verificar atestaciones al desplegar) son alternativas y complementos que no se investigaron en esta sesión; quedan como decisión abierta.

## Gates del stage

Cada gate tiene un criterio verificable, un código de salida o un resultado de job y una consecuencia. Todos deben alimentar un agregador estricto (`build-complete`) que es el check obligatorio de la rama, igual que `quality-complete` en el stage anterior: un job omitido sin autorización cuenta como fallo.

| Gate | Criterio | Consecuencia | Nivel inicial |
| --- | --- | --- | --- |
| G1. Compilación de TypeScript | `tsc -b` termina con exit 0 en todos los proyectos | Sin imagen; el PR no se puede fusionar | Bloqueante desde el inicio |
| G2. Construcción de la imagen | `docker build` termina sin error (en PRs también, sin publicar) | Sin imagen publicada | Bloqueante |
| G3. Atestaciones generadas | SBOM, provenance y atestación firmada existen para el digest publicado | La imagen no se promueve | Bloqueante en `main` |
| G4. Escaneo de imagen | Sin `CRITICAL` ni `HIGH` con corrección disponible | La imagen no se promueve | Advisory 2 a 4 semanas, luego bloqueante |
| G5. Arranque de la imagen | El contenedor arranca como usuario no root y responde a su sonda de salud | La imagen no se promueve | Advisory hasta tener sonda definida |
| G6. Presupuesto de tiempo | El job termina dentro de `timeout-minutes` | El job falla y se investiga la causa | Bloqueante |
| G7. Presupuesto de tamaño | La imagen no supera el límite acordado | Revisión antes de fusionar | Advisory (valor por decidir) |

**Comportamiento ante fallo**

1. **Orden de ejecución.** `build` (G1) corre antes de `image` (G2 a G5): si el código no compila, no se gasta tiempo en construir ni escanear una imagen.
2. **Un fallo es un fallo.** `build-complete` falla ante `failure`, `cancelled` y `skipped` no autorizado. Un `skipped` solo se acepta si una salida de detección de cambios lo autoriza (por ejemplo, un cambio solo en documentación).
3. **Sin reintentos automáticos que oculten fallos reales.** Se permite un reintento manual para fallos de infraestructura (red, caché); un fallo de compilación no se reintenta.
4. **Publicar y promover son pasos distintos.** Una imagen con atestaciones pero escaneo pendiente puede existir en el registro con un tag provisional (el SHA); la promoción a un entorno exige que G3 y G4 estén en verde.
5. **Excepciones.** Una vulnerabilidad aceptada se registra con fecha de caducidad, motivo y responsable, y entra al escaneo como excepción versionada, igual que las excepciones del stage Quality.

**Check obligatorio.** El ruleset de `main` exige `build-complete`. Hay que recordar que un workflow omitido por filtros de ruta deja el check en *Pending* y bloquea, mientras que un job omitido por `if` se reporta como correcto: por eso el agregador usa `if: always()` y evalúa los resultados explícitamente.

## Monorepo, caché y rendimiento

Hay tres capas de caché y cada una tiene un límite conocido. La regla es acelerar sin que la caché pueda esconder un fallo: ante la duda, un build sin caché debe dar el mismo resultado.

| Capa | Mecanismo | Qué acelera | Límite o riesgo |
| --- | --- | --- | --- |
| Compilador | `incremental` y `tsc -b` con `.tsbuildinfo` por proyecto | Recompilar solo lo que cambió y sus dependientes | Probado: con nada modificado, ambos proyectos figuran como actualizados y no se recompilan. En CI, restaurar `dist/` y `.tsbuildinfo` entre ejecuciones no se probó; el handbook advierte que las marcas de tiempo condicionan si un proyecto se considera al día |
| Dependencias | `cache: npm` de `setup-node` y `--mount=type=cache` en Docker | Descarga de paquetes | La caché acelera, pero la fuente de verdad es el lockfile |
| Capas de imagen | `cache-from` y `cache-to` con `type=gha`, `mode=max` y un `scope` por imagen | Reutilizar capas sin cambios | Los límites de tamaño de GitHub; entradas que pueden expirar; las ramas solo leen las cachés de su rama, la base y la predeterminada; sin `scope` propio, una imagen sobrescribe la caché de otra |

**Orden de capas.** El Dockerfile copia primero los `package.json` y el lockfile y después el código: un cambio de código no invalida la capa de dependencias.

**Solo lo afectado.** Si el monorepo tiene varios servicios, el stage construye solo los afectados por el cambio (con Turborepo `--affected`, que necesita historial de git suficiente, o con filtros de ruta). El filtro por ruta tiene una trampa conocida con los checks obligatorios: un workflow omitido deja el check pendiente, por lo que la detección de cambios debe vivir dentro del workflow y alimentar al agregador.

**Matriz.** Un servicio por entrada de matriz, cada uno con su `scope` de caché y su atestación. `fail-fast` en falso para ver todos los fallos de una vez.

**Presupuestos.** `timeout-minutes` en cada job, `concurrency` con cancelación en PRs y una medición semanal de duración p50 y p95 del job de build (mismas métricas que el stage Quality). Los umbrales concretos se fijan tras medir en el repositorio real.

## Verificación en un repositorio de prueba

Se creó un monorepo mínimo con dos paquetes (`shared` y `api`, este último dependiente del primero por workspace de npm), la configuración de la sección de TypeScript y TypeScript 7.0.2 con Node 22.22.0. Esta tabla separa lo observado de lo que queda por probar.

| Prueba | Resultado observado |
| --- | --- |
| `tsc -b` con la base estricta completa | Exit 0; cada paquete genera `.js`, `.js.map`, `.d.ts` y `.d.ts.map` en `dist/` |
| Ejecutar la salida con `node` | Funciona: el paquete `api` importa `@x/shared` ya compilado |
| Segunda ejecución de `tsc -b --verbose` sin cambios | Ambos proyectos figuran como actualizados (la entrada más reciente es anterior al `.tsbuildinfo`) y no se recompilan |
| Dos builds desde `dist/` vacío; hash de todos los `.js`, `.d.ts` y `.map` | Hash idéntico en ambas ejecuciones |
| `enum` con `erasableSyntaxOnly` | TS1294 |
| Acceso por índice asignado a `string` con `noUncheckedIndexedAccess` | TS2322 (`string \| undefined` no es asignable a `string`) |
| Importar un tipo sin `type` con `verbatimModuleSyntax` | TS1484 |
| `tsc -p packages/api --noEmit` | Exit 0 |
| `npm ci --ignore-scripts` desde cero | Exit 0; los workspaces quedan enlazados |

**Errores que aparecieron en el primer intento** y que la guía ya incorpora:

1. **TS5097**: un import con extensión `.ts` exige `allowImportingTsExtensions`; la base usa `rewriteRelativeImportExtensions` y los paquetes se importan por nombre.
2. **TS2584** (`console` no existe): sin `@types/node` el compilador no conoce las APIs de Node. La base declara `types: ["node"]` y `@types/node` es una dependencia de desarrollo.

**Alcance de la prueba de reproducibilidad.** Se compararon `.js`, `.d.ts` y mapas, no `.tsbuildinfo`, en la misma máquina y con el mismo lockfile. No demuestra que dos máquinas o dos versiones de Node produzcan lo mismo; por eso la versión de Node y la de TypeScript se fijan.

**No verificado en esta sesión**

- Construcción del Dockerfile: el cliente de Docker (29.8.2) existe, pero no hay daemon ni acceso a un registro para descargar la imagen base.
- El workflow de GitHub Actions, la caché `type=gha`, las atestaciones, la verificación con `gh attestation verify` y el escaneo con Trivy.
- Restaurar `dist/` y `.tsbuildinfo` entre ejecuciones de CI.
- Tiempos de compilación en el monorepo real: la prueba tiene un archivo por paquete.

Estas pruebas son el primer criterio de salida de la Fase 1 del plan de adopción.

## Criterios de aceptación

El stage se considera listo cuando los quince casos producen el resultado esperado en una rama de prueba. Cada caso es un *fixture*: una violación mínima que se introduce a propósito. Los cinco primeros ya se ejecutaron en el repositorio de prueba; el resto exige el repositorio real y el registro.

| # | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| B1 | Error de tipos en cualquier paquete | `tsc -b` falla, no se construye imagen y `build-complete` queda en rojo | Por probar en CI (el compilador devuelve error en local) |
| B2 | `enum` nuevo | TS1294 | Verificado |
| B3 | Acceso por índice asignado a un tipo sin `undefined` | TS2322 | Verificado |
| B4 | Importar un tipo sin `type` | TS1484 | Verificado |
| B5 | Dos builds del mismo commit | Hash idéntico de `.js`, `.d.ts` y mapas | Verificado en una máquina |
| B6 | Cambio en un solo paquete | Se recompilan ese paquete y los que dependen de él | Por probar |
| B7 | Dockerfile con un error | G2 en rojo, también en PRs | Por probar |
| B8 | PR desde un fork | No se publica ni se atesta | Por probar |
| B9 | Push a `main` | Imagen con tag SHA, SBOM, provenance y atestación | Por probar |
| B10 | `gh attestation verify` | Pasa con el repositorio correcto y falla con otro | Por probar |
| B11 | Imagen con una vulnerabilidad crítica corregible | G4 en rojo | Por probar |
| B12 | Contenedor en ejecución | Corre con UID 1001, no root | Por probar |
| B13 | Job obligatorio omitido sin autorización | `build-complete` en rojo | Por probar |
| B14 | Job que se cuelga | Termina por `timeout-minutes` | Por probar |
| B15 | Despliegue con un tag en lugar de un digest | Rechazado por la política de despliegue | Por probar |

**Presupuestos para fijar tras medir** (valores por decidir, no recomendados aquí): duración p95 del job de build, tamaño máximo de la imagen y porcentaje de aciertos de caché.

## Plan de adopción

&#91;embedded content: plan de adopción · 4 fases, 3 gates de salida\]

Cada rombo es el criterio para pasar a la fase siguiente. Qué entra en cada una:

1. **Fase 0, base.** Node y TypeScript fijados en el lockfile y en `.nvmrc`; `tsconfig.base.json`, un `tsconfig` por paquete y el de solución; `tsc -b` como único comando de compilación en local y en CI. Salida: el build local funciona y dos compilaciones dan el mismo hash (casos B2 a B5, ya verificados en el repo de prueba).
2. **Fase 1, advisory.** Workflow de dos jobs, Dockerfile multi-stage, SBOM, provenance, atestación y escaneo de la imagen sin bloquear. Se ejecutan los casos B6 a B15 en una rama de prueba del repositorio real, se mide la duración p50 y p95 del build y se resuelven los tres puntos pendientes de verificación: construcción del Dockerfile, atestaciones y restauración de caché.
3. **Fase 2, bloqueante.** G1, G2 y G3 pasan a obligatorios mediante `build-complete`, el agregador estricto, y el ruleset de `main` lo exige. Se activa `merge_group` si hay cola de merge.
4. **Fase 3, endurecer.** G4 pasa a bloqueante con el umbral decidido, se añaden G5 y G7 si hay sonda de salud y presupuesto de tamaño, y el despliegue verifica la atestación y exige el digest. Las decisiones D6 y D10 se cierran aquí.

La fase siguiente no empieza hasta que se cumple el criterio del rombo anterior: si una prueba falla, se corrige el control, no el criterio.

## Decisiones y riesgos

**Decisiones por tomar**

| # | Decisión | Opciones | Recomendación |
| --- | --- | --- | --- |
| D1 | Compilar con `tsc` o ejecutar `.ts` con Node | `tsc -b` y `dist/`, o type stripping nativo | `tsc -b` mientras se necesiten mapas, declaraciones y verificación de tipos en el build; la base ya es compatible con migrar |
| D2 | `module`: `nodenext` o `preserve` | `nodenext` para código que corre en Node; `preserve` con bundler | `nodenext` para servicios Node |
| D3 | `skipLibCheck` | Activo (más rápido) o inactivo (detecta errores en tipos de terceros) | Activo en CI; revisar si hay incidentes por tipos de terceros |
| D4 | Reproducibilidad de la imagen | Solo la salida de TypeScript, o imagen bit a bit | Salida de TypeScript y digest de la base; la imagen bit a bit queda fuera hasta que haga falta |
| D5 | Registro de imágenes | GHCR u otro (ECR, etc.) | Decidir según dónde se despliega; el workflow se adapta cambiando `registry` y el login |
| D6 | Firma y admisión | Atestaciones de GitHub, `cosign` o política de admisión en el clúster | Atestaciones de GitHub al inicio; evaluar admisión cuando haya un orquestador |
| D7 | Umbral del escaneo de imagen | Solo `CRITICAL`, o `CRITICAL` y `HIGH` corregibles | `CRITICAL` y `HIGH` con corrección disponible |
| D8 | Imagen base | Alpine o Debian slim | Decidir tras probar módulos nativos; Alpine usa otra libc y puede fallar con algunos |
| D9 | Publicar en PRs | Solo construir, o publicar con tag de PR | Solo construir; publicar solo desde `main` |
| D10 | Retención de imágenes y atestaciones | Plazo fijo o según auditoría | Preguntar a quien audite antes de fijar un plazo |

**Riesgos**

| Riesgo | Efecto | Mitigación |
| --- | --- | --- |
| `--ignore-scripts` rompe un módulo nativo | El build o el runtime fallan | Ejecutar explícitamente los scripts necesarios y validar en el primer build real |
| La caché `gha` se evicta o se sobrescribe | Builds más lentos, no incorrectos | `scope` por imagen y builds sin caché semanales para detectar dependencia de ella |
| Tag mutable de la imagen base | Builds no repetibles | Fijar por digest y actualizar con un bot |
| Atestaciones generadas pero no verificadas al desplegar | La firma no protege | Verificar en el despliegue (caso B10 y B15) |
| Un solo mantenedor | Sin separación de funciones en aprobaciones | Riesgo aceptado y documentado; ver el documento del stage Quality |
| Documentación de acciones desactualizada | Versiones o entradas que cambian | Fijar por SHA y revisar los changelogs al actualizar |

## Fuentes

Páginas abiertas y leídas el 2026-11-12. Las pruebas de TypeScript son propias (ver la sección de verificación).

- [TypeScript, Project References](https://www.typescriptlang.org/docs/handbook/project-references): `composite`, `tsc -b`, solution tsconfig, advertencias de salidas versionadas.
- [Total TypeScript, tsconfig cheat sheet](https://totaltypescript.com/tsconfig-cheat-sheet): flags recomendados y motivos.
- [Node.js, soporte de TypeScript](https://nodejs.org/api/typescript.html): type stripping, sintaxis no soportada y tsconfig recomendado.
- [Docker, atestaciones SBOM y provenance con GitHub Actions](https://docs.docker.com:443/build/ci/github-actions/attestations/): entradas `provenance` y `sbom`, valores por defecto y restricciones.
- [GitHub, atestaciones de artefactos para provenance de builds](https://docs.github.com/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds): permisos, `subject-name`, `subject-digest` y verificación con la CLI.
- [Docker, backend de caché de GitHub Actions](https://docs.docker.com/build/cache/backends/gha.md): `scope`, `mode`, límites y acceso por rama.
- [OneUptime, Dockerfile multi-stage para Node.js](https://oneuptime.com/blog/post/2026-01-06-nodejs-multi-stage-dockerfile/markdown): patrón de etapas, usuario no root y `npm prune`.
- [OneUptime, escaneo de contenedores con Trivy](https://oneuptime.com/blog/post/2026-01-27-trivy-container-scanning/view): exit codes y flags de severidad.

No se pudo abrir la documentación oficial de Trivy ni la referencia completa de `tsconfig` en typescriptlang.org; esas partes se apoyan en las guías citadas.
