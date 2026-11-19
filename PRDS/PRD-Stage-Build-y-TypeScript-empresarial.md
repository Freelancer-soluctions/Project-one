# PRD: Stage Build y TypeScript empresarial

Nov 12, 2026 · @Johan

## Resumen

El stage de build convierte código ya validado en **un artefacto inmutable, reproducible y trazable**, construido una sola vez; staging y producción reciben ese mismo artefacto, identificado por su digest. Este PRD define cómo se construye ese artefacto (imagen de contenedor con GitHub Actions) y cómo se configura TypeScript para que el build sea estricto, rápido y determinista.

Tres ideas lo resumen:

1. **TypeScript es la primera línea de calidad del build.** Una base `tsconfig` estricta (`strict` más flags adicionales) convierte errores de ejecución en errores de compilación; en la prueba, tres de esos flags rechazaron código inválido con un código de error concreto.
2. **El build es una función de sus entradas.** Con lockfile, versiones fijadas y `tsc -b`, dos compilaciones del mismo commit produjeron salidas con hashes idénticos en la prueba.
3. **El artefacto se firma y se rastrea.** SBOM, _provenance_ y firma se generan en el mismo job que publica la imagen, y los despliegues referencian el digest, no un tag.

Lo verificado y lo que no: los flags de TypeScript, `tsc -b`, las referencias entre proyectos y la reproducibilidad se ejecutaron en un monorepo de prueba con TypeScript 7.0.2 y Node 22. El Dockerfile y el workflow de GitHub Actions se basan en documentación oficial pero **no se ejecutaron**: el sandbox no tiene daemon de Docker ni acceso a un registro. La sección de verificación lo detalla.

**Ampliación de esta versión.** Se añadieron perfiles de TypeScript por tipo de proyecto, el comportamiento probado de `tsc -b` (incluido `noEmitOnError`, que corrige una afirmación previa del documento), el build de frontend con presupuesto de tamaño, el gate de drift del código generado, endurecimiento y multi-arquitectura de la imagen, versionado y metadatos, verificación de la cadena (SLSA, cosign, admisión), hermeticidad como escala de decisión, y un runbook con métricas. Cada sección distingue lo **probado en el sandbox** de lo **no verificado** (Docker, atestaciones, cosign, Bazel, Nix, Verdaccio, Turborepo, Nx, release-please y Changesets no se probaron).

## Alcance y objetivos

El PRD cubre desde que el stage de Quality pasa hasta que existe una imagen publicada, firmada y escaneada. Queda fuera lo que ocurre después: pruebas de integración, despliegue y promoción entre entornos.

| Dentro del alcance                                          | Fuera del alcance                                        |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Configuración de TypeScript (base, por paquete, references) | Reglas de ESLint y formato (documento del stage Quality) |
| Compilación con `tsc -b` y control de salidas               | Pruebas unitarias y de integración                       |
| Dockerfile multi-stage y `.dockerignore`                    | Despliegue y estrategias de rollout                      |
| Workflow de build en GitHub Actions                         | Escaneo de dependencias del lockfile (SCA)               |
| SBOM, provenance, firma y escaneo de la imagen              | Gestión de secretos de runtime                           |
| Gates del stage y plan de adopción                          | Otros lenguajes y runtimes                               |

**Objetivos medibles**

1. Todo artefacto desplegable se identifica por digest y sale de un solo build por commit.
2. Dos builds del mismo commit con las mismas entradas producen la misma salida de TypeScript (comprobado por hash).
3. Ningún error de tipos ni de compilación llega a la imagen: el build falla antes de empaquetar.
4. Cada imagen publicada tiene SBOM, provenance y firma verificables.
5. El job de build termina con un presupuesto de tiempo acordado y falla si lo excede (`timeout-minutes`).

**No objetivos.** Builds bit a bit reproducibles de la imagen completa (depende de la imagen base y de las marcas de tiempo de las capas; se trata como una decisión en la sección final), ni migrar el proyecto a otro bundler. Bazel y Nix se tratan solo como criterio de decisión, sin implementación.

## Principios del artefacto

Cada principio tiene un control que lo hace cumplir; sin control, es solo una intención.

| Principio         | Qué significa                                                                                 | Cómo se hace cumplir                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Construir una vez | Lo probado en staging es, byte a byte, lo que llega a producción; no se recompila por entorno | El despliegue recibe el digest de la imagen; la configuración por entorno se inyecta en runtime, no en el build  |
| Inmutable         | Un tag no cambia de contenido; el digest identifica el artefacto                              | Despliegues por digest; `latest` nunca es referencia de despliegue                                               |
| Reproducible      | Mismas entradas, misma salida                                                                 | `npm ci` con lockfile, Node y TypeScript en versión fija, imagen base por digest, acciones fijadas por SHA       |
| Hermético         | El build no depende del estado del runner ni de red no declarada                              | Dependencias solo desde registros permitidos; `--ignore-scripts` y pasos explícitos para lo que necesite scripts |
| Trazable          | De la imagen se llega al commit, al workflow y a las dependencias                             | Etiqueta con el SHA, provenance, SBOM y firma                                                                    |
| Mínimo            | La imagen final solo contiene lo necesario para ejecutar                                      | Multi-stage, `npm prune --omit=dev`, usuario no root                                                             |
| Falla antes       | El error más barato es el que se detecta primero                                              | El build depende de `quality-complete`; el typecheck corre antes de empaquetar                                   |

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
    "incremental": true,
    "noEmitOnError": true
  }
}
```

| Flag                                                                                                                                        | Para qué sirve                                                          | Evidencia                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `strict`                                                                                                                                    | Activa todo el chequeo estricto de tipos                                | La guía de Total TypeScript lo llama indispensable                                                                       |
| `noUncheckedIndexedAccess`                                                                                                                  | Un acceso por índice devuelve `T \| undefined`                          | Probado: asignar `ids["a"]` a `string` dio TS2322                                                                        |
| `verbatimModuleSyntax`                                                                                                                      | Obliga a `import type` para tipos                                       | Probado: importar un tipo sin `type` dio TS1484                                                                          |
| `erasableSyntaxOnly`                                                                                                                        | Prohibe sintaxis con efecto en runtime (`enum`, parameter properties)   | Probado: un `enum` dio TS1294                                                                                            |
| `noImplicitOverride`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature` | Cierran huecos que `strict` no cubre                                    | No se probaron uno a uno; son opciones del compilador documentadas                                                       |
| `isolatedModules`                                                                                                                           | Prohíbe construcciones inseguras si cada archivo se transpila aislado   | Recomendado por la misma guía                                                                                            |
| `module` y `moduleResolution`: `nodenext`                                                                                                   | Resolución igual a la de Node para código que se ejecuta en Node        | La guía lo recomienda cuando se transpila con `tsc`; con bundler se usa `module: preserve`                               |
| `skipLibCheck`                                                                                                                              | No revisa los `.d.ts` de `node_modules`                                 | Ahorra tiempo; acepta el riesgo de no detectar errores en tipos de terceros                                              |
| `composite`, `declaration`, `declarationMap`                                                                                                | Necesarios para referencias entre proyectos y navegación entre paquetes | El handbook exige `composite` y `declaration` en proyectos referenciados                                                 |
| `rewriteRelativeImportExtensions`                                                                                                           | Permite importar con extensión `.ts` y reescribirla a `.js` al emitir   | Sin él, un import `.ts` dio TS5097; la prueba final importa por nombre de paquete y no ejercita este flag                |
| `noEmitOnError`                                                                                                                             | Si hay errores de tipos no emite ningún archivo                         | Probado con TypeScript 7.0.2: sin ella emitió salidas y terminó con exit 2; con ella no emitió nada y terminó con exit 1 |

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

1. **El build es `tsc -b`.** Construye los proyectos desactualizados en orden de dependencia. En la prueba con TypeScript 7.0.2, sin la opción `noEmitOnError` el compilador emitió salidas aunque hubiera errores de tipos y terminó con exit 2; con ella no emitió nada y terminó con exit 1. La base la activa para que un error nunca deje un dist/ a medias (el handbook dice lo contrario, así que aquí prevalece lo observado).
2. **Los paquetes se importan por nombre** (`@x/shared`, con `exports` en su `package.json`), no con rutas relativas a otro paquete: en la prueba, resolverlos por workspace de npm funcionó y mantiene `rootDir` limpio.
3. **Una sola versión de TypeScript** fijada en el lockfile y en `devDependencies` raíz; el mismo compilador en local, en CI y en el Dockerfile.
4. **`tsconfig` de entornos distintos no se mezclan.** Código de Node y código de navegador tienen `lib` y `types` distintos; si el repo tiene ambos, cada uno extiende la base y añade lo suyo.
5. **Sin `any` implícito ni `@ts-ignore` libres.** `@ts-expect-error` con descripción cuando sea inevitable; la regla de ESLint `ban-ts-comment` lo hace cumplir (stage Quality).
6. **Salidas fuera de git.** `dist/` y `.tsbuildinfo` en `.gitignore` y `.dockerignore`; el handbook advierte que versionar salidas obliga a `--force` tras algunas operaciones de git.

**Alternativa: ejecutar `.ts` directamente.** Node soporta quitar tipos de forma nativa (estable desde la v24.12 y la v25.2, activado por defecto desde la v22.18), pero solo ejecuta sintaxis borrable, ignora `tsconfig.json` (sin `paths`) y exige extensiones en los imports. La base de arriba ya es compatible (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`), así que la migración queda abierta, pero este PRD mantiene la compilación con `tsc` porque produce `dist/` con tipos, mapas y control de salidas, y Node no verifica tipos.

## TypeScript: perfiles por tipo de proyecto

Una sola configuración no sirve para todo: un servicio que corre en Node, una librería que consumen otros paquetes y una aplicación de navegador necesitan opciones distintas. Todos extienden las reglas estrictas de la base (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, etc.) y cambian solo lo que depende del entorno de ejecución.

| Perfil                                   | `module` / resolución  | `lib` y `types`                                           | Emite JS                             | Quién genera la salida |
| ---------------------------------------- | ---------------------- | --------------------------------------------------------- | ------------------------------------ | ---------------------- |
| Servicio Node                            | `nodenext`             | `ES2023`, `types: ["node"]`                               | Sí, con `tsc -b` en `dist/`          | `tsc`                  |
| Librería de workspace                    | `nodenext`             | igual que el servicio                                     | Sí, más `.d.ts` y mapas, `composite` | `tsc`                  |
| Aplicación de navegador                  | `preserve` / `bundler` | `ES2022`, `DOM`, `DOM.Iterable`, `types: ["vite/client"]` | No (`noEmit`)                        | El bundler (Vite)      |
| Scripts y herramientas (`.mjs`, configs) | según el runtime       | `types: ["node"]`                                         | No                                   | Node directo           |

**Servicio y librería** usan la base y la configuración por paquete de la sección anterior. La librería exporta por nombre desde su `package.json` (`exports` con `types` y `default` apuntando a `dist/`), y quien la consume la importa por ese nombre; así el compilador lee el `.d.ts` y no el código fuente.

**Aplicación de navegador.** El compilador solo comprueba tipos; el bundler genera el JavaScript. Configuración probada con TypeScript 7.0.2 y Vite 8.3.8 (`tsc -p .` terminó con exit 0):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

Las reglas estrictas adicionales de la base (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.) se añaden igual vía `extends`; esta prueba las dejó fuera para aislar lo que cambia por entorno.

**Reglas del reparto**

1. **Nunca un solo `tsconfig` con `lib` de DOM y de Node a la vez.** Mezclarlos hace que `window` compile en el servidor y `process` en el navegador; un error que solo aparece en ejecución.
2. **Un `tsconfig` por entorno de ejecución,** referenciados desde la raíz de solución.
3. **Las pruebas se comprueban pero no se emiten.** Convención habitual: `tsconfig.build.json` que excluye `**/*.test.ts` para el build, y el `tsconfig.json` completo para el typecheck y el editor. No se probó en esta sesión.
4. **Los scripts de Node se lintean con globals de Node.** En el stage Quality se vio que los `.cjs` y `.mjs` fallan con `no-undef` si ESLint no declara esos globals.

## TypeScript: comportamiento probado de `tsc -b`, source maps y diagnóstico

Esta sección recoge lo que se **observó** en el sandbox con TypeScript 7.0.2 sobre un monorepo de prueba (`packages/shared` y `packages/api`). Donde el handbook y la observación difieren, prevalece lo observado.

| Prueba                 | Qué se hizo                                                                   | Resultado observado                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Build incremental      | Segundo `tsc -b` sin cambios; luego cambio en `shared`; luego cambio en `api` | Sin cambios no recompila nada; un cambio en `shared` recompila `shared` y `api`; un cambio en `api` solo recompila `api` |
| `noEmitOnError`        | Error de tipos con y sin la opción                                            | Sin ella: emitió salidas y terminó con exit 2. Con ella: no emitió nada y terminó con exit 1                             |
| Propagación de errores | Error en `shared` con `api` dependiente                                       | `api` no se compila y aparecen errores en cascada (TS2307) que son ruido; el error real es el primero                    |
| Source maps            | Compilación con `sourceMap` y ejecución de un error lanzado                   | Con `node --enable-source-maps` la traza apunta al `.ts` original; sin la bandera apunta al `.js`                        |
| Diagnóstico            | `tsc --extendedDiagnostics`                                                   | Informa archivos, tiempo de comprobación y memoria; sirve de línea base para detectar regresiones                        |

**Consecuencias para el pipeline**

1. **`noEmitOnError: true` en la base.** Así un error nunca deja un `dist/` a medias que un paso posterior pueda empaquetar. El job se detiene por el exit distinto de cero de todos modos, pero la opción protege a quien compile en local.
2. **Leer el primer error.** En la cascada solo importa el primero; el log del job conviene mostrarlo completo y no truncarlo.
3. **Source maps en producción.** La imagen ejecuta con `NODE_OPTIONS=--enable-source-maps` para que las trazas sean legibles. Tiene un coste de rendimiento al formatear errores que **no se midió**.
4. **Caché de `.tsbuildinfo`.** El incremental funciona dentro del mismo árbol de trabajo. Restaurarlo en una ejecución limpia de Actions **no se probó** (sigue abierto desde el stage Quality).

**Política de versiones de TypeScript**

- Fijar la versión exacta en `devDependencies` y en el lockfile (hoy 7.0.2, la última en npm el 2026-11-12).
- Actualizar solo por pull request, con `tsc -b` limpio, tests en verde y comparación de los hashes de `dist/` para ver qué cambia en la salida.
- No usar rangos (`^`) para el compilador: una versión menor puede introducir errores nuevos de tipos sin que cambie tu código.
- Los tiempos de `--extendedDiagnostics` sirven para decidir si una actualización empeora el build; el sandbox no es representativo de tu repositorio real, así que hay que medir ahí.

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

| Decisión                                                    | Motivo                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base fijada por digest (`@sha256:<DIGEST>`)                 | Un tag como `22-alpine` se mueve; el digest hace el build repetible. Un bot (Dependabot o Renovate) propone las actualizaciones                                                                                         |
| Se copian los `package.json` y el lockfile antes del código | La capa de dependencias solo se reconstruye si cambia el lockfile                                                                                                                                                       |
| `--mount=type=cache` para `~/.npm`                          | Acelera `npm ci` entre builds sin dejar la caché en la imagen                                                                                                                                                           |
| `npm ci --ignore-scripts`                                   | No ejecuta scripts de instalación de terceros; lo que sí los necesite (por ejemplo `prisma generate`) se ejecuta como paso explícito. La guía fuente advierte que algunos módulos nativos pueden requerirlos: se prueba |
| `tsc -b` en la etapa `build`                                | El mismo compilador y la misma configuración que en CI; si hay un error de tipos, no hay imagen                                                                                                                         |
| `npm prune --omit=dev`                                      | La etapa final copia solo dependencias de producción                                                                                                                                                                    |
| Usuario no root con UID fijo                                | Reduce el impacto de una vulnerabilidad en la aplicación y facilita políticas del clúster                                                                                                                               |
| Sin secretos en `ARG` ni `ENV`                              | Los argumentos de build quedan registrados en el provenance de repos públicos; los secretos van por montajes de secretos de BuildKit                                                                                    |

**Añadir según el servicio:** un `HEALTHCHECK` o sondas del orquestador (la guía fuente usa uno contra `/health`, que hay que ajustar al servicio real) y un init de procesos como `dumb-init` para manejar señales y apagado ordenado.

**Lo que no se verificó.** El Dockerfile no se construyó en el sandbox: el cliente de Docker está instalado, pero no hay daemon activo y el acceso a registros está restringido, así que no se puede descargar la imagen base. Lo que sí se comprobó son los pasos que ejecuta: `npm ci --ignore-scripts` terminó con éxito en el monorepo de prueba y `tsc -b` generó `dist/` en ambos paquetes y el resultado se ejecutó con `node`. El primer build real debe validar el tamaño de la imagen, el arranque con el usuario no root y que `npm prune` no elimine algo que el runtime necesita.

## Dockerfile: endurecimiento, multi-arch, Kaniko y variantes de imagen base

**Endurecimiento de la imagen final**

1. **Etapa final mínima:** solo el `dist/` y las dependencias de producción (`npm ci --omit=dev --ignore-scripts`); sin compilador, sin `devDependencies`, sin código fuente.
2. **Usuario no root** con UID numérico fijo (`USER 10001`), de modo que Kubernetes pueda aplicar `runAsNonRoot`.
3. **Sistema de archivos de solo lectura** en tiempo de ejecución (`readOnlyRootFilesystem`) y sin capacidades adicionales; se configura en el despliegue, no en el Dockerfile.
4. **Base fijada por digest** (`FROM node:<versión>@sha256:…`) y actualizada por pull request automatizado.
5. **Secretos solo con montajes de BuildKit** (`--mount=type=secret`), nunca `ARG` ni `ENV`, porque quedan en las capas.
6. **`.dockerignore`** que excluya `.git`, `node_modules`, `.env*` y salidas de build.
7. **`HEALTHCHECK` o sondas** definidas en el orquestador.

**Variantes de imagen base**

| Variante                      | Ventaja                                  | Coste                                                   |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `node:<v>-slim` (Debian)      | Compatibilidad total con módulos nativos | Tamaño medio y más paquetes que escanear                |
| `node:<v>-alpine` (musl)      | Muy pequeña                              | Diferencias de libc que rompen algunos binarios nativos |
| Distroless o imágenes mínimas | Superficie de ataque reducida, sin shell | Depuración más difícil                                  |

Para un ERP con dependencias que pueden incluir módulos nativos, el punto de partida prudente es `slim` fijada por digest; pasar a una variante mínima es una decisión a medir con el escáner. Ninguna se construyó en el sandbox (no hay daemon de Docker).

**Multi-arquitectura**

- **Solo si se necesita** (por ejemplo producción en ARM). Si todo corre en amd64, un solo `linux/amd64` es lo más simple.
- **QEMU:** `docker/setup-qemu-action` y `buildx --platform linux/amd64,linux/arm64`. Es sencillo pero lento para la arquitectura emulada.
- **Runners nativos por arquitectura:** un job por plataforma que empuja por digest y un job final que une los manifiestos con `docker buildx imagecreate`/`imagetools create`. Es más rápido y más complejo.
- La atestación y el escaneo se aplican al **índice** y a cada plataforma, no solo a una.

**Kaniko.** El repositorio de Kaniko de Google está archivado; según el blog de Chainguard existe una bifurcación mantenida por ellos. En GitHub Actions, donde `docker/build-push-action` con BuildKit funciona sin privilegios especiales en los runners alojados, no hay motivo para usar Kaniko. Solo tendría sentido en un clúster sin daemon (por ejemplo runners dentro de Kubernetes). Esa bifurcación no se probó.

**Lo que no se verificó:** ningún Dockerfile se construyó, ninguna imagen multi-arch se publicó y los tiempos QEMU frente a nativo no se midieron.

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

## Versionado, metadatos de build y release

**Qué identifica un artefacto.** La identidad real es el **digest** de la imagen. El nombre legible (etiqueta) es una conveniencia que apunta a él. Cada build registra al menos: SHA del commit, fecha del commit, ejecución del workflow y versión semántica si es un release.

**Etiquetas de la imagen**

| Etiqueta       | Uso                                                                    | Mutable                  |
| -------------- | ---------------------------------------------------------------------- | ------------------------ |
| `sha-<commit>` | Identifica el build exacto; la que usa el despliegue (junto al digest) | No                       |
| `1.4.2`        | Release semántico                                                      | No (nunca se reetiqueta) |
| `main`         | Seguimiento de la rama principal                                       | Sí; solo informativa     |

Los despliegues referencian el **digest**; las etiquetas mutables no se usan para desplegar.

**Etiquetas OCI.** Se añaden las anotaciones estándar `org.opencontainers.image.source`, `.revision`, `.created`, `.version` y `.title`, que `docker/metadata-action` puede generar. Así cualquier imagen en un registro se puede rastrear hasta su commit.

**Metadatos dentro del artefacto.** `scripts/write-version.mjs` escribe `dist/version.json` con `{ revision, created }`. Probado: usa `GITHUB_SHA` o `git rev-parse HEAD`, y para la fecha `SOURCE_DATE_EPOCH` o la fecha del commit (`git log -1 --format=%ct`); **solo usa `Date.now()` si se pide explícitamente**. Con ello dos builds del mismo commit producen el mismo `version.json`, y la reproducibilidad no se rompe por una marca de tiempo. La aplicación puede exponerlo en un endpoint de versión para soporte.

**Release**

- El release se crea al **promover** una imagen ya construida (etiqueta semántica sobre el mismo digest), no reconstruyendo.
- Para decidir el número de versión se puede usar Conventional Commits con herramientas como release-please o Changesets. **Ninguna se consultó ni se probó en esta sesión;** la elección queda abierta (decisión D17).
- Las versiones de los paquetes internos del monorepo solo importan si se publican; si todo se despliega junto, una versión única de producto es suficiente.

**Lo que no se verificó:** la generación de etiquetas con `docker/metadata-action`, la integración de release-please o Changesets y el endpoint de versión.

## Supply chain de la imagen

Tres evidencias acompañan a cada imagen publicada: qué contiene (SBOM), cómo y dónde se construyó (provenance) y quién la atestó (atestación firmada). Una cuarta comprobación, el escaneo de vulnerabilidades de la imagen, decide si se puede promover.

| Control            | Herramienta                                                      | Qué produce                                                                 | Cuándo falla                                |
| ------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| SBOM               | `sbom: true` en `docker/build-push-action`                       | Atestación con la lista de componentes de la imagen, adjunta en el registro | No se genera (el push directo es requisito) |
| Provenance         | `provenance: mode=max`                                           | Registro de cómo se construyó: fuente, workflow y parámetros                | No se genera                                |
| Atestación firmada | `actions/attest` con `subject-digest` y `push-to-registry: true` | Atestación verificable vinculada al digest                                  | Permisos insuficientes o digest vacío       |
| Verificación       | `gh attestation verify oci://<imagen>:<tag> -R <org>/<repo>`     | Confirma que la imagen salió de ese repositorio                             | La verificación falla: no se despliega      |
| Escaneo de imagen  | Trivy sobre la imagen publicada                                  | Lista de vulnerabilidades por severidad                                     | Hallazgos que cumplen el umbral (ver abajo) |

**Permisos del job de imagen.** La documentación de GitHub para atestar imágenes de contenedor pide `id-token: write`, `contents: read`, `attestations: write` y `packages: write`. El nombre del sujeto es el nombre completo de la imagen, sin tag, y el digest va en forma `sha256:<hex>`.

**Secretos y provenance.** En repositorios públicos el provenance registra los valores de los argumentos de build; por eso los secretos nunca viajan como `ARG`, sino como montajes de secretos de BuildKit.

**Escaneo de la imagen con Trivy.** El comando `trivy image` devuelve exit 1 cuando encuentra vulnerabilidades que cumplen el umbral de `--severity` y `--exit-code 1`; `--ignore-unfixed` omite las que no tienen parche. La guía consultada advierte dos cosas que se aplican aquí: su ejemplo de Action no muestra un `exit-code` explícito, así que hay que confirmar que el paso falle de verdad (con una imagen de prueba con una vulnerabilidad conocida), y fija la Action a `@master`, que no es reproducible; se fija por SHA. Umbral propuesto: fallar con `CRITICAL` y `HIGH` que tengan corrección disponible, y registrar el resto como advisory.

**Verificación antes de desplegar.** El último control de la cadena está en el despliegue, no en el build: antes de aplicar una imagen se verifica su atestación y se referencia por digest. Si el despliegue no verifica, la firma no protege nada.

**Lo que no cubre este PRD.** La documentación de GitHub consultada no afirma un nivel SLSA concreto, así que el PRD no lo declara. La firma con `cosign` y las políticas de admisión en el clúster (por ejemplo, verificar atestaciones al desplegar) son alternativas y complementos que no se investigaron en esta sesión; quedan como decisión abierta.

## Verificación de la cadena: niveles SLSA, cosign y políticas al desplegar

Generar procedencia y SBOM no sirve de nada si nadie las comprueba. La cadena completa tiene tres pasos: **producir**, **firmar o atestiguar** y **verificar antes de desplegar**.

**Niveles SLSA de build.** Según la página de SLSA consultada (v1.0), el track de build tiene tres niveles:

| Nivel | Idea                                  | Qué se exige en esencia                                                          |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------- |
| L1    | Existe procedencia                    | El build documenta cómo se produjo el artefacto                                  |
| L2    | Procedencia firmada por la plataforma | Un servicio de build alojado genera y firma la procedencia                       |
| L3    | Build endurecido                      | Builds aislados entre sí y claves de firma inaccesibles para el código del build |

La página de la v1.0 estaba marcada como retirada y la versión vigente era la 1.2, así que **antes de citar un nivel en una auditoría hay que revisar la especificación vigente**. Con la atestación de GitHub (`actions/attest`) sobre un runner alojado, este PRD aspira a **L2** y no afirma L3: alcanzar L3 depende de cómo se estructure el workflow (por ejemplo, flujos reutilizables) y no se verificó.

**Verificación antes de desplegar**

1. **Atestación de GitHub:** `gh attestation verify oci://<imagen>@sha256:… --owner <organización>` comprueba que la imagen la construyó un workflow de tu organización. Es el mismo comando descrito en la sección de supply chain; no se ejecutó contra un registro real.
2. **Firma con cosign (alternativa):** firma sin claves con la identidad OIDC del workflow y verificación con `cosign verify` indicando identidad y emisor esperados. **No se consultó la documentación ni se probó en esta sesión;** si se adopta, hay que leer su documentación vigente.
3. **Política de admisión en el clúster:** un controlador (Kyverno, Sigstore policy-controller, Gatekeeper) rechaza imágenes que no tengan atestación válida o que no vengan del registro y el workflow permitidos. Tampoco se probó.

**Política mínima propuesta**

- Solo se despliega por **digest**.
- Solo se despliegan imágenes con atestación de procedencia del repositorio y del workflow esperados.
- Una imagen con vulnerabilidad crítica corregible no pasa a producción, según el umbral del gate de Trivy.

**Lo que no se verificó:** la verificación con `gh attestation verify`, cosign y las políticas de admisión requieren un registro y un clúster reales.

## Gates del stage

Cada gate tiene un criterio verificable, un código de salida o un resultado de job y una consecuencia. Todos deben alimentar un agregador estricto (`build-complete`) que es el check obligatorio de la rama, igual que `quality-complete` en el stage anterior: un job omitido sin autorización cuenta como fallo.

| Gate                          | Criterio                                                                  | Consecuencia                           | Nivel inicial                            |
| ----------------------------- | ------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| G1. Compilación de TypeScript | `tsc -b` termina con exit 0 en todos los proyectos                        | Sin imagen; el PR no se puede fusionar | Bloqueante desde el inicio               |
| G2. Construcción de la imagen | `docker build` termina sin error (en PRs también, sin publicar)           | Sin imagen publicada                   | Bloqueante                               |
| G3. Atestaciones generadas    | SBOM, provenance y atestación firmada existen para el digest publicado    | La imagen no se promueve               | Bloqueante en `main`                     |
| G4. Escaneo de imagen         | Sin `CRITICAL` ni `HIGH` con corrección disponible                        | La imagen no se promueve               | Advisory 2 a 4 semanas, luego bloqueante |
| G5. Arranque de la imagen     | El contenedor arranca como usuario no root y responde a su sonda de salud | La imagen no se promueve               | Advisory hasta tener sonda definida      |
| G6. Presupuesto de tiempo     | El job termina dentro de `timeout-minutes`                                | El job falla y se investiga la causa   | Bloqueante                               |
| G7. Presupuesto de tamaño     | La imagen no supera el límite acordado                                    | Revisión antes de fusionar             | Advisory (valor por decidir)             |

**Comportamiento ante fallo**

1. **Orden de ejecución.** `build` (G1) corre antes de `image` (G2 a G5): si el código no compila, no se gasta tiempo en construir ni escanear una imagen.
2. **Un fallo es un fallo.** `build-complete` falla ante `failure`, `cancelled` y `skipped` no autorizado. Un `skipped` solo se acepta si una salida de detección de cambios lo autoriza (por ejemplo, un cambio solo en documentación).
3. **Sin reintentos automáticos que oculten fallos reales.** Se permite un reintento manual para fallos de infraestructura (red, caché); un fallo de compilación no se reintenta.
4. **Publicar y promover son pasos distintos.** Una imagen con atestaciones pero escaneo pendiente puede existir en el registro con un tag provisional (el SHA); la promoción a un entorno exige que G3 y G4 estén en verde.
5. **Excepciones.** Una vulnerabilidad aceptada se registra con fecha de caducidad, motivo y responsable, y entra al escaneo como excepción versionada, igual que las excepciones del stage Quality.

**Check obligatorio.** El ruleset de `main` exige `build-complete`. Hay que recordar que un workflow omitido por filtros de ruta deja el check en _Pending_ y bloquea, mientras que un job omitido por `if` se reporta como correcto: por eso el agregador usa `if: always()` y evalúa los resultados explícitamente.

## Runbook de fallos y métricas del stage

**Runbook: qué hacer cuando el stage falla**

| Síntoma                          | Causa probable                                  | Qué hacer                                                                                   |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm ci` falla por lockfile      | `package.json` y lockfile desincronizados       | Regenerar el lockfile en local con la misma versión de Node y confirmarlo                   |
| `tsc -b` falla con muchos TS2307 | Cascada desde un error en un paquete base       | Leer el **primer** error; los demás son consecuencia                                        |
| Gate de drift falla              | El contrato cambió y no se regeneró             | Ejecutar `npm run codegen`, revisar el diff y confirmarlo                                   |
| Presupuesto de tamaño falla      | Una dependencia nueva o un import accidental    | Revisar el bundle, dividir el código o subir el límite con justificación en el pull request |
| Build de Docker falla solo en CI | Diferencia de caché o de contexto               | Reejecutar sin caché; revisar `.dockerignore`                                               |
| Trivy bloquea                    | Vulnerabilidad crítica o alta corregible        | Actualizar la base o la dependencia; si no hay corrección, excepción con caducidad          |
| Atestación falla                 | Falta `id-token: write` o `attestations: write` | Revisar los permisos del job, que son por job y no globales                                 |
| Job "fallido" que parece ok      | Un job obligatorio fue omitido                  | Revisar el agregador `build-complete`; debe fallar si algo fue omitido                      |

**Métricas que conviene medir**

1. **Duración del stage** (mediana y percentil 95), por job.
2. **Tasa de aciertos de caché** de BuildKit y de dependencias.
3. **Tamaño de la imagen** y del bundle por commit, para ver regresiones.
4. **Tasa de fallos** por causa (tipos, drift, presupuesto, escaneo, infraestructura).
5. **Tiempo hasta un build en verde** tras un fallo.
6. **Edad de la imagen base** fijada por digest.

Los umbrales se fijan después de unas semanas de datos reales; este PRD no propone números que no se hayan medido. Las métricas se pueden obtener de la API de Actions o de un resumen que cada job escriba en `$GITHUB_STEP_SUMMARY`; no se implementó ninguna de las dos.

## Monorepo, caché y rendimiento

Hay tres capas de caché y cada una tiene un límite conocido. La regla es acelerar sin que la caché pueda esconder un fallo: ante la duda, un build sin caché debe dar el mismo resultado.

| Capa            | Mecanismo                                                                    | Qué acelera                                      | Límite o riesgo                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compilador      | `incremental` y `tsc -b` con `.tsbuildinfo` por proyecto                     | Recompilar solo lo que cambió y sus dependientes | Probado: con nada modificado, ambos proyectos figuran como actualizados y no se recompilan. En CI, restaurar `dist/` y `.tsbuildinfo` entre ejecuciones no se probó; el handbook advierte que las marcas de tiempo condicionan si un proyecto se considera al día |
| Dependencias    | `cache: npm` de `setup-node` y `--mount=type=cache` en Docker                | Descarga de paquetes                             | La caché acelera, pero la fuente de verdad es el lockfile                                                                                                                                                                                                         |
| Capas de imagen | `cache-from` y `cache-to` con `type=gha`, `mode=max` y un `scope` por imagen | Reutilizar capas sin cambios                     | Los límites de tamaño de GitHub; entradas que pueden expirar; las ramas solo leen las cachés de su rama, la base y la predeterminada; sin `scope` propio, una imagen sobrescribe la caché de otra                                                                 |

**Orden de capas.** El Dockerfile copia primero los `package.json` y el lockfile y después el código: un cambio de código no invalida la capa de dependencias.

**Solo lo afectado.** Si el monorepo tiene varios servicios, el stage construye solo los afectados por el cambio (con Turborepo `--affected`, que necesita historial de git suficiente, o con filtros de ruta). El filtro por ruta tiene una trampa conocida con los checks obligatorios: un workflow omitido deja el check pendiente, por lo que la detección de cambios debe vivir dentro del workflow y alimentar al agregador.

**Matriz.** Un servicio por entrada de matriz, cada uno con su `scope` de caché y su atestación. `fail-fast` en falso para ver todos los fallos de una vez.

**Presupuestos.** `timeout-minutes` en cada job, `concurrency` con cancelación en PRs y una medición semanal de duración p50 y p95 del job de build (mismas métricas que el stage Quality). Los umbrales concretos se fijan tras medir en el repositorio real.

## Frontend: bundling, minificación, compresión, presupuesto de tamaño y source maps

Para una aplicación de navegador el build lo hace el bundler (Vite 8.3.8 en la prueba) y `tsc` solo comprueba tipos con `noEmit`. El stage ejecuta ambos: `tsc -p .` como puerta de tipos y `vite build` como generador del artefacto.

**Presupuesto de tamaño como gate.** Un script mide el tamaño gzip de cada `.js` de `dist/assets` y falla si alguno supera el límite. Probado: salió con exit 1 y anotación `::error::` cuando se superó y con exit 0 dentro del límite.

```js
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const LIMIT = Number(process.argv[2]);
let bad = 0;
for (const f of readdirSync('dist/assets').filter((x) => x.endsWith('.js'))) {
  const size = gzipSync(readFileSync(`dist/assets/${f}`)).length;
  const over = size > LIMIT;
  console.log(`${over ? '::error::' : ''}${f} gzip=${size} límite=${LIMIT}`);
  if (over) bad = 1;
}
process.exit(bad);
```

Se invoca como `node scripts/check-budget.mjs 150000` tras `vite build`. El límite se fija con el tamaño real de tu aplicación más un margen, no con un número genérico.

**Source maps.** Se generan en modo oculto (`build.sourcemap: 'hidden'`): el `.map` existe pero el `.js` no lo referencia, así el navegador del usuario no lo descarga. Los mapas se suben al sistema de errores (Sentry u otro) y **no** se publican en el servidor estático ni dentro de la imagen pública.

**Determinismo.** Dos `vite build` seguidos sobre el mismo árbol y el mismo lockfile produjeron los mismos nombres con hash de contenido en la prueba. Eso permite caché larga e inmutable (`Cache-Control: public, max-age=31536000, immutable`) en los assets con hash, y `no-cache` solo en `index.html`.

**Compresión.** Lo habitual es comprimir en la capa de entrega (CDN o proxy con gzip y brotli) y no en el build. Precomprimir en el build (`.gz` y `.br`) solo compensa si el servidor estático los sirve tal cual. No se probó ninguna de las dos configuraciones, así que queda como decisión abierta.

**Lo que no se verificó:** el comportamiento con un proyecto real de miles de módulos, la división en chunks (`manualChunks`) y la integración con un CDN.

## Código generado (OpenAPI, GraphQL, Prisma): gate de drift

El código generado (clientes de API, tipos de GraphQL, clientes de ORM) tiene dos formas de gestionarse: versionarlo en el repositorio o generarlo en cada build. La recomendación de este PRD es **versionarlo y verificar en CI que no hay drift**: así el diff de un pull request muestra el efecto de un cambio de contrato y el build no depende de un paso de generación oculto.

**Gate probado** con `openapi-typescript` (esquema `api/openapi.yaml` → `src/generated/api.d.ts`):

```bash
npm pkg set scripts.codegen="openapi-typescript api/openapi.yaml -o src/generated/api.d.ts"
npm run codegen
git add -N .
git diff --exit-code
```

| Caso                                              | Resultado observado                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Esquema y generado coherentes                     | `git diff --exit-code` sale con 0                                                                                                 |
| Se cambió el esquema y no se regeneró             | La regeneración modifica el archivo y `git diff --exit-code` sale con 1                                                           |
| La generación crea un archivo nuevo sin versionar | `git diff --exit-code` sale con 0 (no lo ve); `git status --porcelain` lo muestra como `??`; tras `git add -N` el diff sale con 1 |

Por eso el gate incluye `git add -N .` antes del diff (o comprueba que `git status --porcelain` esté vacío). Sin eso, un archivo generado nuevo pasaría sin que nadie lo notara.

**Reglas**

1. **El generador va fijado** a una versión exacta en el lockfile; si no, una actualización cambia la salida y el gate falla sin que cambie el contrato.
2. **El gate corre en el stage Quality o al inicio de Build,** antes de `tsc -b`, para que un tipo desactualizado falle con un mensaje claro y no con errores de compilación.
3. **El generado se excluye de ESLint y de la cobertura,** pero **no** de `tsc`: los tipos generados deben compilar con la configuración estricta.
4. **Prisma y similares** (el cliente depende de la base de datos o de binarios) se tratan aparte: `prisma generate` debe correr en el Dockerfile, no se versiona. Este caso no se probó.

**Lo que no se verificó:** GraphQL Code Generator, Prisma y la generación de clientes con plantillas de OpenAPI Generator.

## Hermeticidad: Bazel y Nix frente a lo pragmático, registro intermedio y caché remota

Un build **hermético** declara todas sus entradas y no depende de nada del entorno ni de la red durante la compilación. Es una escala, no un sí o no.

| Nivel                     | Qué aporta                                                                                                                                           | Coste                                                                | Recomendación para este PRD                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1. Pragmático             | Lockfile con `npm ci --ignore-scripts`, base de imagen fijada por digest, versiones de Node y TypeScript exactas, `SOURCE_DATE_EPOCH` para metadatos | Bajo                                                                 | **Punto de partida obligatorio** (es lo que describen las secciones anteriores)                |
| 2. Registro intermedio    | Un proxy o espejo de npm (por ejemplo Verdaccio o el de un artefactos corporativo) que guarda lo descargado                                          | Medio: hay que operarlo                                              | Recomendado cuando se necesite resiliencia ante caídas de npm o control de qué paquetes entran |
| 3. Caché remota de tareas | Turborepo o Nx reutilizan salidas entre ejecuciones y máquinas según el hash de las entradas                                                         | Medio                                                                | Recomendada si el monorepo crece y el build tarda; evaluar con tiempos reales                  |
| 4. Hermético estricto     | Bazel o Nix: entradas declaradas, sandbox, reproducibilidad bit a bit                                                                                | Alto: curva de aprendizaje, reglas propias para JS/TS, mantenimiento | Solo si hay un requisito de auditoría o de reproducibilidad que lo exija                       |

**Criterio de decisión.** Se sube de nivel por un dolor medido (tiempos, incidentes de dependencias, exigencia de auditoría), no por completitud. Para un ERP mantenido por un equipo reducido, el nivel 1 con la caché de BuildKit y la caché de `actions/cache` o `type=gha` cubre la mayor parte del beneficio con una fracción del coste.

**Registro intermedio, a tener en cuenta**

- El lockfile ya fija versiones y hashes de integridad; el proxy no sustituye al lockfile, añade disponibilidad y control.
- Debe ser la única fuente en CI (`.npmrc` con `registry=`), de lo contrario no se controla nada.
- Las credenciales del registro se pasan como secretos de BuildKit, nunca como `ARG`.

**Caché remota de tareas, a tener en cuenta**

- La caché acepta salidas de quien tenga permiso de escritura: si un pull request de fork puede escribirla, puede envenenarla. Escritura solo desde `main` y lectura desde PR.
- Las entradas del hash deben incluir versión de Node y del compilador, si no, un cambio de herramienta sirve salidas antiguas.

**Lo que no se verificó:** Bazel, Nix, Verdaccio, Turborepo y Nx **no se probaron ni se consultaron en esta sesión**. Las filas 2 a 4 son criterio de diseño general, no resultados medidos; hay que evaluarlas en tu repositorio antes de adoptarlas.

## Verificación en un repositorio de prueba

Se creó un monorepo mínimo con dos paquetes (`shared` y `api`, este último dependiente del primero por workspace de npm), la configuración de la sección de TypeScript y TypeScript 7.0.2 con Node 22.22.0. Esta tabla separa lo observado de lo que queda por probar.

| Prueba                                                                    | Resultado observado                                                                                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tsc -b` con la base estricta completa                                    | Exit 0; cada paquete genera `.js`, `.js.map`, `.d.ts` y `.d.ts.map` en `dist/`                                       |
| Ejecutar la salida con `node`                                             | Funciona: el paquete `api` importa `@x/shared` ya compilado                                                          |
| Segunda ejecución de `tsc -b --verbose` sin cambios                       | Ambos proyectos figuran como actualizados (la entrada más reciente es anterior al `.tsbuildinfo`) y no se recompilan |
| Dos builds desde `dist/` vacío; hash de todos los `.js`, `.d.ts` y `.map` | Hash idéntico en ambas ejecuciones                                                                                   |
| `enum` con `erasableSyntaxOnly`                                           | TS1294                                                                                                               |
| Acceso por índice asignado a `string` con `noUncheckedIndexedAccess`      | TS2322 (`string \| undefined` no es asignable a `string`)                                                            |
| Importar un tipo sin `type` con `verbatimModuleSyntax`                    | TS1484                                                                                                               |
| `tsc -p packages/api --noEmit`                                            | Exit 0                                                                                                               |
| `npm ci --ignore-scripts` desde cero                                      | Exit 0; los workspaces quedan enlazados                                                                              |

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

El stage se considera listo cuando los quince casos producen el resultado esperado en una rama de prueba. Cada caso es un _fixture_: una violación mínima que se introduce a propósito. Los cinco primeros ya se ejecutaron en el repositorio de prueba; el resto exige el repositorio real y el registro.

| #   | Caso                                                                 | Resultado esperado                                                                      | Estado                                                               |
| --- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| B1  | Error de tipos en cualquier paquete                                  | `tsc -b` falla, no se construye imagen y `build-complete` queda en rojo                 | Por probar en CI (el compilador devuelve error en local)             |
| B2  | `enum` nuevo                                                         | TS1294                                                                                  | Verificado                                                           |
| B3  | Acceso por índice asignado a un tipo sin `undefined`                 | TS2322                                                                                  | Verificado                                                           |
| B4  | Importar un tipo sin `type`                                          | TS1484                                                                                  | Verificado                                                           |
| B5  | Dos builds del mismo commit                                          | Hash idéntico de `.js`, `.d.ts` y mapas                                                 | Verificado en una máquina                                            |
| B6  | Cambio en un solo paquete                                            | Se recompilan ese paquete y los que dependen de él                                      | Por probar                                                           |
| B7  | Dockerfile con un error                                              | G2 en rojo, también en PRs                                                              | Por probar                                                           |
| B8  | PR desde un fork                                                     | No se publica ni se atesta                                                              | Por probar                                                           |
| B9  | Push a `main`                                                        | Imagen con tag SHA, SBOM, provenance y atestación                                       | Por probar                                                           |
| B10 | `gh attestation verify`                                              | Pasa con el repositorio correcto y falla con otro                                       | Por probar                                                           |
| B11 | Imagen con una vulnerabilidad crítica corregible                     | G4 en rojo                                                                              | Por probar                                                           |
| B12 | Contenedor en ejecución                                              | Corre con UID 1001, no root                                                             | Por probar                                                           |
| B13 | Job obligatorio omitido sin autorización                             | `build-complete` en rojo                                                                | Por probar                                                           |
| B14 | Job que se cuelga                                                    | Termina por `timeout-minutes`                                                           | Por probar                                                           |
| B15 | Despliegue con un tag en lugar de un digest                          | Rechazado por la política de despliegue                                                 | Por probar                                                           |
| B16 | Error de tipos con noEmitOnError activo                              | tsc -b termina con exit 1 y no emite dist/                                              | Verificado en el sandbox (TypeScript 7.0.2)                          |
| B17 | Contrato OpenAPI cambiado sin regenerar los tipos                    | El gate de drift falla (git diff con exit 1, incluidos archivos nuevos tras git add -N) | Verificado en el sandbox                                             |
| B18 | Bundle de frontend que supera el límite gzip                         | check-budget.mjs termina con exit 1 y anotación ::error::                               | Verificado en el sandbox (Vite 8.3.8)                                |
| B19 | Dos builds del mismo commit                                          | Mismo version.json y mismos nombres de assets con hash                                  | Verificado en el sandbox para version.json y Vite; no para la imagen |
| B20 | Imagen publicada sin atestación de procedencia del workflow esperado | gh attestation verify falla y el despliegue se rechaza                                  | Por probar                                                           |
| B21 | Imagen multi-arquitectura (si se adopta)                             | El índice contiene ambas plataformas, y atestación y escaneo cubren cada una            | Por probar                                                           |

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

| #   | Decisión                                        | Opciones                                                                                  | Recomendación                                                                                                                |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| D1  | Compilar con `tsc` o ejecutar `.ts` con Node    | `tsc -b` y `dist/`, o type stripping nativo                                               | `tsc -b` mientras se necesiten mapas, declaraciones y verificación de tipos en el build; la base ya es compatible con migrar |
| D2  | `module`: `nodenext` o `preserve`               | `nodenext` para código que corre en Node; `preserve` con bundler                          | `nodenext` para servicios Node                                                                                               |
| D3  | `skipLibCheck`                                  | Activo (más rápido) o inactivo (detecta errores en tipos de terceros)                     | Activo en CI; revisar si hay incidentes por tipos de terceros                                                                |
| D4  | Reproducibilidad de la imagen                   | Solo la salida de TypeScript, o imagen bit a bit                                          | Salida de TypeScript y digest de la base; la imagen bit a bit queda fuera hasta que haga falta                               |
| D5  | Registro de imágenes                            | GHCR u otro (ECR, etc.)                                                                   | Decidir según dónde se despliega; el workflow se adapta cambiando `registry` y el login                                      |
| D6  | Firma y admisión                                | Atestaciones de GitHub, `cosign` o política de admisión en el clúster                     | Atestaciones de GitHub al inicio; evaluar admisión cuando haya un orquestador                                                |
| D7  | Umbral del escaneo de imagen                    | Solo `CRITICAL`, o `CRITICAL` y `HIGH` corregibles                                        | `CRITICAL` y `HIGH` con corrección disponible                                                                                |
| D8  | Imagen base                                     | Alpine o Debian slim                                                                      | Decidir tras probar módulos nativos; Alpine usa otra libc y puede fallar con algunos                                         |
| D9  | Publicar en PRs                                 | Solo construir, o publicar con tag de PR                                                  | Solo construir; publicar solo desde `main`                                                                                   |
| D10 | Retención de imágenes y atestaciones            | Plazo fijo o según auditoría                                                              | Preguntar a quien audite antes de fijar un plazo                                                                             |
| D11 | Multi-arquitectura                              | Solo amd64, QEMU, o runners nativos con imagetools create                                 | Solo amd64 mientras no haya destino ARM; si lo hay, runners nativos                                                          |
| D12 | Constructor de imágenes                         | BuildKit (build-push-action) o Kaniko                                                     | BuildKit en Actions; Kaniko solo en clústeres sin daemon                                                                     |
| D13 | Frontend: presupuesto, source maps y compresión | Límite gzip por archivo o ninguno; mapas ocultos o públicos; compresión en build o en CDN | Presupuesto como gate, mapas ocultos subidos al sistema de errores, compresión en la capa de entrega                         |
| D14 | Código generado                                 | Versionado con gate de drift, o generado en cada build                                    | Versionado con gate de drift y generador fijado                                                                              |
| D15 | Registro intermedio de npm                      | Ninguno, Verdaccio o gestor de artefactos corporativo                                     | Ninguno al inicio; evaluar si hay incidentes de disponibilidad o necesidad de control de paquetes                            |
| D16 | Hermeticidad estricta                           | Bazel, Nix o nivel pragmático                                                             | Nivel pragmático; subir solo por requisito de auditoría (no se probaron Bazel ni Nix)                                        |
| D17 | Esquema de versionado y herramienta de release  | release-please, Changesets o manual                                                       | Abierta: evaluar al llegar a la fase de release; ninguna se probó                                                            |

**Riesgos**

| Riesgo                                                  | Efecto                                      | Mitigación                                                                        |
| ------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `--ignore-scripts` rompe un módulo nativo               | El build o el runtime fallan                | Ejecutar explícitamente los scripts necesarios y validar en el primer build real  |
| La caché `gha` se evicta o se sobrescribe               | Builds más lentos, no incorrectos           | `scope` por imagen y builds sin caché semanales para detectar dependencia de ella |
| Tag mutable de la imagen base                           | Builds no repetibles                        | Fijar por digest y actualizar con un bot                                          |
| Atestaciones generadas pero no verificadas al desplegar | La firma no protege                         | Verificar en el despliegue (caso B10 y B15)                                       |
| Un solo mantenedor                                      | Sin separación de funciones en aprobaciones | Riesgo aceptado y documentado; ver el documento del stage Quality                 |
| Documentación de acciones desactualizada                | Versiones o entradas que cambian            | Fijar por SHA y revisar los changelogs al actualizar                              |

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
- [Chainguard, blog sobre la bifurcación de Kaniko](https://www.chainguard.dev/): estado archivado del proyecto original (consultado; URL exacta del artículo no conservada, verificar).
- [SLSA, niveles del track de build](https://slsa.dev/spec/v1.0/levels): L1 a L3 (la página v1.0 figuraba como retirada frente a la v1.2).
- Docker, buenas prácticas de build y anotaciones OCI de imagen: consultadas para multi-stage, caché y etiquetas `org.opencontainers.image.*`.
- OneUptime, builds multi-arquitectura con buildx: QEMU frente a runners nativos.

No se pudo abrir la documentación oficial de Trivy ni la referencia completa de `tsconfig` en typescriptlang.org; esas partes se apoyan en las guías citadas.
