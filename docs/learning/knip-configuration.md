# Guía de configuración de Knip — Project One (Monorepo: Express + React)

> **Herramienta:** [knip](https://knip.dev/) — detector de código muerto para proyectos JavaScript/TypeScript.
> **Versión fijada:** `knip@6.32.2` (en `devDependencies` de la raíz).
> **Esquema:** `https://unpkg.com/knip@6/schema-jsonc.json` (variante JSONC; mantener sincronizado con la versión major instalada).
> **Documentación oficial:** <https://knip.dev/reference/configuration>

---

## 1. Qué hace Knip (modelo mental en 30 segundos)

Knip construye un **grafo de módulos** a partir de los _archivos de entrada_, resuelve cada importación e informa lo que **no** pudo alcanzar:

```
unused files = project files − (entry files + resolved files)
```

Informa cuatro familias de problemas:

| Familia           | Tipos de problemas                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Archivos**      | `files` (archivos huérfanos/sin usar)                                                                                  |
| **Dependencias**  | `dependencies` (dependencias/devDeps sin usar), `unlisted`, `binaries` (binarios no listados), `unresolved`, `catalog` |
| **Exportaciones** | `exports`, `types`, `enumMembers`, `namespaceMembers`, `nsExports`, `nsTypes`, `duplicates`                            |
| **Estructura**    | `cycles` (dependencias circulares — excluido del informe por defecto, regla `warn` por defecto)                        |

Los **plugins** (186 en total: vitest, storybook, vite, playwright, prisma, eslint, …) descubren automáticamente archivos de entrada y archivos de configuración, por lo que la mayoría de las herramientas no necesita configuración.

Consecuencias clave:

- Un "falso positivo" suele ser una **brecha de configuración** (falta un archivo de entrada, falta un plugin, un glob `project` incorrecto) — no un error de Knip.
- Trabaja de arriba hacia abajo: corrige primero los **archivos sin usar** → esto reduce en cascada los informes de exportaciones/dependencias.
- Las opciones `ignore*` **suprimen informes**, **no** eliminan archivos del análisis. Prioriza corregir `entry`/`project` primero.

---

## 2. Descubrimiento del archivo de configuración — cómo funciona realmente

Knip lee **exactamente UN archivo de configuración**, buscado desde el **directorio de trabajo actual**:

1. `knip.json`
2. `knip.jsonc`
3. `.knip.json`
4. `.knip.jsonc`
5. `knip.ts`
6. `knip.js`
7. `knip.config.ts`
8. `knip.config.js`
9. `package.json#knip`
10. O explícito: `npx knip --config path/to/file.json`

**Caso límite crítico (verificado localmente con `--debug`):**

```
npx knip --debug --workspace=apps/server   # ejecutado desde la raíz del repo
→ configFilePath: 'C:/.../project-one/knip.jsonc'          ← GANA la config de la RAÍZ

cd apps/server && npx knip --debug
→ configFilePath: undefined, workspaces: [], defaults      ← SIN config (knip no sube a la raíz)
```

Knip **NO** recorre el árbol hacia arriba y **NO** fusiona archivos `knip.json` anidados.

- Ejecutar desde la **raíz del repo** → solo se usa `./knip.jsonc`. (Desde el 2026-09-23, cambio `knip-consolidation`, ya NO existen `apps/client/knip.json` ni `apps/server/knip.json`.)
- Ejecutar desde **dentro de un workspace** (`cd apps/server && npx knip`, o `npx knip --directory apps/server`) → knip NO encuentra config (`configFilePath: undefined`, verificado con `--debug` en 6.32.2: no sube al directorio raíz) y analiza con **defaults sin conciencia de monorepo** (`workspaces: []`). Usa los scripts npm de la raíz (`npm run knip:server`) en lugar de hacer `cd`.

> ⚠️ Nota histórica: un requisito OpenSpec antiguo afirmaba que “`npx knip --workspace apps/client`
> usa `apps/client/knip.json`”. **Era falso.** `--workspace` solo _filtra_ workspaces; el descubrimiento
> de config depende del CWD, y desde un subdirectorio knip no sube a la raíz (queda sin config).
> La afirmación fue corregida en el cambio `knip-consolidation` (delta de `ci-prebuild-substage-structure`).

### Tipos de archivo de configuración

```jsonc
// knip.json — JSON puro, sin comentarios, comas finales NO permitidas
{ "$schema": "https://unpkg.com/knip@6/schema.json" }

// knip.jsonc — comentarios + comas finales permitidos (schema: .../schema-jsonc.json)
// knip.ts    — configuración dinámica/tipada: admite RegExp en arrays ignore*, valores calculados
```

**Los valores que defines SOBRESCRIBEN los valores por defecto — no se fusionan** (esto aplica a `entry` y `project`). Si defines `project`, reemplazas por completo el `project` por defecto.

---

## 3. Estado actual de knip.jsonc en este repo

Existe UN archivo de configuración (desde el cambio `knip-consolidation`, 2026-09-23; antes había tres):

| Archivo                      | Se usa cuando…                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `/knip.jsonc`                | Cualquier ejecución `npx knip` / `npm run knip*` desde la raíz del repo (CI incluido) |
| ~~`/apps/client/knip.json`~~ | ELIMINADO (divergía en silencio)                                                      |
| ~~`/apps/server/knip.json`~~ | ELIMINADO (redundante)                                                                |

### `knip.jsonc` raíz (fuente de verdad para CI)

```jsonc
{
  "$schema": "https://unpkg.com/knip@6/schema-jsonc.json",
  "workspaces": {
    ".": {
      "entry": ["scripts/**/*.{js,mjs}", ".husky/*"], // eslint.config.js lo detecta el plugin eslint
      "project": ["scripts/**/*.js", "*.js"],
    },
    "apps/client": {
      "project": [
        "src/**/*.{js,jsx}",
        "tests/**/*.{js,jsx}",
        ".storybook/**/*.{js,jsx}",
        "*.config.{js,mjs}",
      ],
      "paths": { "@": ["./src"], "@/*": ["./src/*"] },
      "ignore": [
        /* 2 entradas (las demás se eliminaron tras ampliar globs: hints "Remove from ignore") */
      ],
      "ignoreDependencies": [
        /* 7 paquetes (msw/globals/storybook ya NO: atribuidos por globs o genuinamente sin uso) */
      ],
      "ignoreExportsUsedInFile": true,
      "ignoreIssues": {
        /* 20 archivos → mapeos ["exports"] */
      },
    },
    "apps/server": {
      "project": ["src/**/*.js", "prisma/**/*.js", "tests/**/*.js"],
      "ignore": [
        /* 16 globs de archivos */
      ],
      "ignoreDependencies": [
        /* 6 paquetes */
      ],
      "ignoreExportsUsedInFile": true,
      "ignoreIssues": {
        /* 24 archivos → mapeos ["exports"] */
      },
    },
    "e2e": {
      "project": ["tests/**/*.js"], // playwright.config.js lo detecta el plugin playwright
    },
  },
  "rules": { "duplicates": "off" },
}
```

Notas:

- La sección `"."` (workspace raíz) cubre los scripts de la raíz (`scripts/`, `eslint.config.js`, hooks de husky) con `entry`/`project` explícitos en lugar de los valores implícitos por defecto.
- La sección `"e2e"` cubre el workspace `e2e` (SÍ está en `package.json#workspaces: ["apps/*", "e2e"]`) con `project: ["tests/**/*.js", "playwright.config.js"]`.
- `rules.duplicates: off` está fijado a **nivel raíz** → aplica a cada workspace.

### Divergencia raíz vs anidadas (RESUELTA en `knip-consolidation`, 2026-09-23)

| Campo                 | Antes (raíz)  | Antes (`apps/client/knip.json`)                       | Después (raíz consolidada)                                                 |
| --------------------- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `ignore` client       | 23 entradas   | 2 entradas                                            | 2 entradas (18 sin hallazgos verificados se eliminaron tras ampliar globs) |
| `ignoreIssues` client | 18            | 20 (con `fieldLimits`/`socketService` como `exports`) | 20 (unión, forma quirúrgica gana)                                          |
| `ignoreBinaries`      | por workspace | —                                                     | eliminadas (no generaban hallazgos)                                        |
| **Archivos anidados** | existían      | existían                                              | **eliminados**                                                             |

→ Ya no hay segunda fuente de verdad: cualquier ejecución sancionada pasa por `/knip.jsonc`.

### Por qué existen estos ignorados (contexto)

- `ignoreBinaries` — eliminadas del config: los hints de knip confirmaron que `eslint`/`prettier`/`concurrently` no generan hallazgos de binarios (resueltos vía devDeps de la raíz donde viven los scripts).
- `ignoreDependencies: ["msw", …]` — `msw`/`globals`/`@storybook/addon-docs`/`@chromatic-com/storybook` fueron removidas: `msw` se atribuye ahora vía globs ampliados (`tests/**`); `globals` y los addons de storybook resultaron genuinamente sin uso (solo referencias comentadas) y se reportan como hallazgo real.
- `ignoreIssues: { "…": ["exports"] }` — archivos barril/`index.js` y módulos de esquemas/middleware que exportan intencionalmente para reutilización futura.
- `ignoreExportsUsedInFile: true` — las exportaciones usadas solo dentro de su propio archivo no se informan.

---

## 4. Referencia completa de configuración (con ejemplos para este repo)

### 4.1 Alcance del proyecto

#### `$schema`

```json
{ "$schema": "https://unpkg.com/knip@6/schema.json" }
```

URL del esquema JSON → subrayados rojos en el IDE ante erratas. Usa `schema-jsonc.json` para JSONC. **Fija la major instalada** (`knip@6` mientras `knip@6.32.2` esté instalado).

#### `entry` (array de globs, prefijo `!` = negación)

Patrones glob para **archivos de entrada** — las raíces del grafo de módulos. Valores por defecto (por workspace):

```json
{
  "entry": [
    "{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}",
    "src/{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"
  ]
}
```

Entradas automáticas adicionales: campos `package.json#main`, `bin`, scripts de npm (analizador de scripts), entradas de plugins (vite → `index.html`, vitest → archivos de test, storybook → `*.stories.*`).

```json
{
  "workspaces": {
    "apps/server": {
      "entry": ["src/bin/index.js", "prisma/seed.js"]
    },
    "apps/client": {
      "entry": ["index.html", "src/main.jsx"]
    }
  }
}
```

**Buena práctica:** mantén `entry` mínimo. Cada archivo de entrada extra (a) oculta las propias exportaciones sin usar de ese archivo, (b) saca todo su árbol de importaciones del estado "sin usar".

#### `project` (array de globs)

El **alcance del análisis**. Los archivos que coinciden con `project` pero no se alcanzan desde `entry` se informan como archivos sin usar.

```json
{
  "workspaces": {
    "apps/client": { "project": ["src/**/*.{js,jsx}"] },
    "apps/server": { "project": ["src/**/*.js"] }
  }
}
```

Negación = excluir del alcance (así se definen los límites del código base):

```json
{
  "project": ["src/**/*.js", "!src/generated/**"]
}
```

> Usa `project` (NO `ignore`) para excluir salidas de compilación, artefactos generados, fixtures:
> ✅ `"project": ["src/**"]` excluye `dist/` del análisis por completo (más rápido + correcto)
> ❌ `"ignore": ["dist/**"]` igual lo analiza y solo oculta los informes

#### `paths` (alias de importación)

Knip lee automáticamente `compilerOptions.paths` de `tsconfig.json`. Para **alias de Vite** (`@/` → `src/`) en este repo, añádelos manualmente por workspace:

```json
{
  "workspaces": {
    "apps/client": {
      "paths": {
        "@": ["./src"],
        "@/*": ["./src/*"]
      }
    }
  }
}
```

Semántica TypeScript: arrays de rutas relativas; los patrones sin `*` son coincidencias exactas. Omitir esto es la causa n.º 1 de informes `unresolved` en proyectos Vite.

---

### 4.2 Workspaces

#### `workspaces` (objeto; claves = directorios, se admiten globs; raíz = `"."`)

```json
{
  "workspaces": {
    ".": {
      "entry": ["scripts/*.js", "eslint.config.js"],
      "project": ["scripts/**/*.js", "*.js"]
    },
    "apps/client": { "project": ["src/**/*.{js,jsx}"] },
    "apps/server": { "project": ["src/**/*.js"] },
    "e2e": { "project": ["tests/**/*.js"] }
  }
}
```

Knip descubre los workspaces desde:

1. El array `package.json#workspaces` (npm/Bun/Yarn/Lerna) ← **este repo: `["apps/*", "e2e"]`**
2. `pnpm-workspace.yaml#packages`
3. `package.json#workspaces.packages` (formato heredado)
4. El objeto **`workspaces`** en la config de Knip (las entradas que no estén en 1–3 se _añaden_ al análisis)

Cada workspace debe tener un `package.json`.

**Reglas:**

- El workspace raíz se identifica con `"."`.
- En un repo basado en workspaces, `entry`/`project` de nivel superior se **ignoran** — usa en su lugar la sección `"."`.
- Las configs de workspace pueden contener **todas las opciones excepto las exclusivas de raíz**: `include`, `exclude`, `ignoreWorkspaces`, `workspaces`.
- Los workspaces no pueden anidarse _en la config_, pero las carpetas sí pueden anidarse en disco.
- Ejecuta `npx knip --debug` para ver workspaces resueltos, configs, plugins, opciones de glob.

#### `ignoreWorkspaces` (solo raíz)

```json
{
  "ignoreWorkspaces": ["apps/legacy-*", "!apps/legacy-keep"]
}
```

Se admiten globs. El prefijo `!` anula un comodín anterior. El sufijo `!` = aplicar solo en modo producción.

---

### 4.3 Plugins

Valores de plugin: objeto (anula `config`/`entry`), `true` (forzar activación), `false` (desactivar).

```json
{
  "vite": { "config": "vite.config.ts" },
  "storybook": true,
  "webpack": false
}
```

- Configurable a nivel raíz y por workspace; un `false` en workspace desactiva un plugin activado en raíz y viceversa.
- Anular `entry` rara vez es necesario — los plugins ya leen patrones de entrada desde la propia config de la herramienta (`vitest.config.js`, `.storybook/main.js`, `playwright.config.ts`…).

---

### 4.4 Reglas y filtros

#### `rules` (severidad por tipo de problema — solo config, sin equivalente CLI)

| Valor     | Se imprime | Cuenta para el código de salida | Significado                                |
| --------- | ---------- | ------------------------------- | ------------------------------------------ |
| `"error"` | sí         | sí                              | valor por defecto para la mayoría de tipos |
| `"warn"`  | sí (gris)  | no                              | se informa pero sale con 0                 |
| `"off"`   | no         | no                              | como `--exclude`                           |

```json
{
  "rules": {
    "files": "warn",
    "dependencies": "error",
    "devDependencies": "warn",
    "exports": "warn",
    "duplicates": "off",
    "cycles": "error"
  }
}
```

Notas:

- `cycles` es `warn` por defecto (todos los demás tipos son `error`).
- Incluir `dependencies` incluye/excluye automáticamente `devDependencies` + `optionalPeerDependencies`, pero esos dos aún pueden fijarse en `warn` individualmente.
- **Estrategia de graduación:** empieza todo en `"warn"`, cambia cada tipo a `"error"` cuando llegue a cero. Así CI solo falla en los tipos ya limpios.

#### `include` / `exclude` (solo raíz; equivalente en config de los filtros CLI)

```json
{ "include": ["files", "dependencies"], "exclude": ["enumMembers"] }
```

Atajos CLI (config + CLI):

- `--files` → solo archivos sin usar
- `--dependencies` → `dependencies` + `unlisted` + `binaries` + `unresolved` + `catalog` + `catalogReferences`
- `--exports` → `exports` + `types` + `enumMembers` + `namespaceMembers` + `duplicates`
- `--cycles` → solo dependencias circulares

> `nsExports`, `nsTypes`, `cycles` NO están en el informe por defecto — incluir solo esos **los añade** en vez de acotar.

**Reglas vs filtros:** filtros = cómodos para CLI, gruesos (`include`/`exclude`); reglas = solo config, más finos (existe el nivel `warn`).

#### `tags` (directivas JSDoc/TSDoc)

```json
{ "tags": ["-lintignore"] }   // excluye exportaciones etiquetadas @lintignore
{ "tags": ["@lintignore", "@internal"] }  // + es el valor por defecto; el prefijo @ se ignora
```

En código:

```js
/** @lintignore */
export const myUnusedExport = 1;

/** @public */ // nunca se informa como exportación sin usar
export const api = () => {};

/** @internal */ // solo se informa en modo producción
export const helperForTests = () => {};

/** @alias */ // suprime "exportación duplicada"
export default Component;
```

Las etiquetas no deben contener guiones ni `+`. Knip emite una **sugerencia de etiqueta** cuando una etiqueta supresora deja de ser necesaria.

#### `preprocessor` / `preprocessorOptions`

```json
{
  "preprocessor": ["./first.ts", "./second.ts"],
  "preprocessorOptions": { "key": "value" }
}
```

Muta la lista de problemas antes de que corran los reporteros (ruta de archivo local o nombre de paquete).

#### `treatConfigHintsAsErrors` / `treatTagHintsAsErrors`

```json
{ "treatConfigHintsAsErrors": true, "treatTagHintsAsErrors": true }
```

Sale con `1` también ante sugerencias. Las sugerencias te avisan de brechas de config (alias de ruta sin resolver, entrada faltante…) — **nunca desactives las sugerencias**; trátalas como errores cuando la línea base esté limpia.

---

### 4.5 Opciones ignore (usar como ÚLTIMO recurso)

Orden de preferencia oficial: **sugerencias de config → ajuste de `entry`/`project` → modo producción → otros `ignore*` → `ignore`**.

#### `ignore` — suprime TODOS los tipos de problema para archivos coincidentes (NO los excluye del análisis)

```json
{
  "ignore": [
    "src/docs/**",
    "src/socket/levels/**",
    "src/config/aws/secrets.js",
    "src/utils/responses&Errors/globalErrorResponse.js"
  ]
}
```

Truco de excepción — informar temporalmente SOLO problemas de un directorio: `"ignore": ["!src/dir/**"]`.

#### `ignoreFiles` — suprime solo el tipo `files` (archivo sin usar)

```json
{ "ignoreFiles": ["src/generated/**", "fixtures/**"] }
```

Úsalo cuando un archivo debe seguir analizándose por exportaciones/deps pero nunca informarse como huérfano. Sufijo `!` → solo modo producción.

#### `ignoreBinaries` — comandos de shell usados pero no provistos por una dependencia

```json
{ "ignoreBinaries": ["eslint", "prettier", "concurrently", "pm2-.+"] }
```

Las cadenas pueden ser patrones regex (`RegExp` real permitido en `knip.ts`). Sufijo `!` → solo producción.

Los binarios de este repo vienen de devDeps de la **raíz** con hoisting — ver §3.

#### `ignoreGlobalBinaries` (por defecto `true`)

```json
{ "ignoreGlobalBinaries": false, "ignoreBinaries": ["git"] }
```

Mientras sea `true`, los comandos globales comunes (`git`, `docker`…) nunca se informan. Fija `false` para exigir una dependencia de paquete por cada comando. Los workspaces heredan el valor raíz.

#### `ignoreDependencies` — nombres de paquete exentos de informes de no usadas/no listadas

```json
{
  "ignoreDependencies": [
    "@prisma/language-server",
    "cloudinary",
    "knex",
    "socket.io-client",
    "vite",
    "why-is-node-running",
    "@org/.+"
  ]
}
```

Se admiten cadenas regex; `RegExp` real en `knip.ts`. Sufijo `!` → solo producción.

Razones legítimas comunes (en este repo):

| Razón                                                            | Ejemplos aquí                                                                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| usado por config de herramientas fuera del glob `project`        | `msw`, `globals`, `@storybook/addon-docs`, `@chromatic-com/storybook`                                          |
| peer/opcional cargado por plugin en tiempo de ejecución          | `embla-carousel-react`, `date-fns-tz`                                                                          |
| herramienta CLI/depuración invocada por el analizador de scripts | `why-is-node-running`, `shadcn-ui`, `quill`                                                                    |
| paquete solo de editor                                           | `@prisma/language-server`                                                                                      |
| erratas accidentales de `npm i <pkg>`                            | `add`, `command` ← **estos dos huelen a instalaciones accidentales — candidatos a eliminar en vez de ignorar** |

#### `ignoreMembers` — miembros de enum / namespace

```json
{ "ignoreMembers": ["render", "on.+"] }
```

#### `ignoreUnresolved` — especificadores de importación que Knip no puede resolver

```json
{ "ignoreUnresolved": ["#virtual/.+", "ignore-me"] }
```

#### `ignoreIssues` — supresión quirúrgica por archivo y por tipo de problema (bisturí)

```json
{
  "ignoreIssues": {
    "src/components/ui/dropdown-menu.jsx": ["exports"],
    "src/hooks/useFetch.js": ["exports"],
    "src/middleware/rateLimit.js": ["exports"],
    "src/generated/**": ["exports", "types", "enumMembers"]
  }
}
```

Claves = globs, valores = array de claves de tipo de problema (`files`, `exports`, `types`, `dependencies`, `unlisted`, `binaries`, `unresolved`, `enumMembers`, `namespaceMembers`, `duplicates`, `cycles`…). **Preferible a `ignore`** porque los demás tipos de problema del mismo archivo sí se siguen informando.

---

### 4.6 Exportaciones

#### `ignoreExportsUsedInFile`

```json
{ "ignoreExportsUsedInFile": true }

// granular:
{
  "ignoreExportsUsedInFile": {
    "class": true, "enum": true, "function": true, "interface": true,
    "member": true, "namespace": true, "type": true, "variable": true
  }
}
```

Una exportación referenciada **dentro de su propio archivo** no se informa — pero cuando deja de usarse también internamente, _sí_ se informa. Configurable en raíz para todos los workspaces, o por workspace. Ambos workspaces de este repo lo fijan en `true`.

#### `includeEntryExports`

```json
{ "includeEntryExports": true }
```

Por defecto las exportaciones de archivos de entrada están exentas (son "API pública"). En un **monorepo de apps privadas** (como este — nada se publica a npm), activarlo encuentra exportaciones realmente muertas en barriles `src/bin/index.js` / `src/main.jsx`. También activa el informe de miembros de enum/namespace. Los archivos de config de plugins (`next.config.js`…) siguen exentos.

---

### 4.7 Ciclos

```json
{
  "cycles": {
    "dynamicImports": true,
    "allow": [["src/i18n/index.ts", "src/i18n/middleware.ts"]]
  }
}
```

- El tipo `cycles` **no se informa por defecto** → actívalo con `"include": ["cycles"]` o `--cycles`.
- La regla por defecto es `warn`; fija `"rules": { "cycles": "error" }` para que CI falle.
- Las aristas de `import()` dinámico se excluyen por defecto (evaluación diferida = sin riesgo de inicialización).
- `allow` acepta rutas de ciclo específicas (relativas, omitiendo la repetición de cierre).

---

### 4.8 Compiladores

```json
{
  "compilers": {
    ".html": "./my-html-compiler.ts"
  }
}
```

Enseña a Knip a extraer importaciones de archivos no estándar (tipos de archivo personalizados, plantillas). Los compiladores integrados cubren formatos populares de frameworks (Svelte/Astro/HTML…).

---

## 5. Tipos de problema — tabla completa

| Clave                           | Título                                                   | Auto-corregible 🔧                   | Informe por defecto     |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------ | ----------------------- |
| `files`                         | Archivos sin usar                                        | 🔧 (requiere `--allow-remove-files`) | sí                      |
| `dependencies`                  | Deps / devDeps sin usar / peers opcionales referenciados | 🔧                                   | sí                      |
| `unlisted`                      | Usada pero no en package.json                            |                                      | sí                      |
| `binaries`                      | Binarios no provistos por ninguna dependencia            |                                      | sí                      |
| `unresolved`                    | Especificador de importación irresoluble                 |                                      | sí                      |
| `catalog` / `catalogReferences` | catálogos pnpm                                           | 🔧 /                                 | sí                      |
| `exports`                       | Exportaciones sin usar                                   | 🔧                                   | sí                      |
| `types`                         | Tipos exportados sin usar (type/interface/enum)          | 🔧                                   | sí                      |
| `enumMembers`                   | Miembros de enum exportados sin usar                     | 🔧                                   | sí                      |
| `namespaceMembers`              | Miembros de namespace exportados sin usar                | 🔧                                   | sí                      |
| `nsExports` / `nsTypes`         | Namespace usado, exportación interna no                  | 🔧 🟠                                | **no** (opt-in)         |
| `duplicates`                    | Misma exportación declarada dos veces                    |                                      | sí                      |
| `cycles`                        | Dependencias circulares                                  | 🟠                                   | **no** (opt-in, `warn`) |

---

## 6. Buenas prácticas de monorepo (para ESTE repo: npm workspaces `apps/*` + `e2e`)

1. **Una config para gobernarlos a todos.** Mantén un único `knip.jsonc` raíz con una sección `workspaces` por app. Los `knip.json` anidados por app SOLO sirven para ejecuciones con `cd` dentro de la app y divergirán silenciosamente (ya lo han hecho — §3).
2. **Declara cada workspace** — `package.json#workspaces: ["apps/*", "e2e"]` de la raíz se lee automáticamente; añade una sección `"."` para scripts de nivel raíz.
3. **Delimita por workspace, no globalmente:** cada app tiene su propio `entry`/`project`/`ignore*`. Nunca pongas ignorados específicos de un workspace a nivel raíz.
4. **Las importaciones entre workspaces deben basarse en dependencias.** Las importaciones relativas entre workspaces (`../../common/x.js`) NO tienen tratamiento especial → se informan como huérfanas. Declara deps estilo `@project-one/common` en `package.json` e importa por nombre de paquete.
5. **El hoisting es invisible por workspace.** Binarios/deps instalados en raíz usados por un workspace → o bien los listas en el `package.json` del workspace (preferido, honesto) o usas `ignoreBinaries`/`ignoreDependencies` (enfoque actual).
6. **Usa `--workspace` para iterar**, recuerda que arrastra ancestros/dependientes:

   ```bash
   npx knip --workspace apps/server          # ruta de directorio
   npx knip --workspace=apps/server          # igual
   npx knip --workspace server-express       # nombre de paquete
   npx knip --workspace './apps/*'           # glob
   npx knip --workspace '!e2e'               # excluir (con comillas)
   npx knip --workspace apps/client --workspace apps/server
   ```

   El filtrado incluye workspaces **ancestros, dependencias y dependientes** (pueden proveer config/exportaciones que el objetivo usa). Para aislamiento: añade `--strict` (modo estricto de producción) o ejecuta desde dentro del directorio del workspace.

7. **`--debug` muestra la verdad:** workspaces resueltos, ruta de config cargada, plugins activados, globs, archivos. Lo primero que debes ejecutar cuando la salida te sorprenda.

---

## 7. Gestión de hallazgos — manual de decisiones

Trabaja en este orden (guía oficial — cada corrección reduce la siguiente categoría):

### 7.1 Archivos sin usar (huérfanos)

```
unused files = project − (entry + resolved)
```

1. Revisa primero las **sugerencias de configuración** (entrada faltante, alias sin resolver).
2. Falta un plugin / el plugin no conoce un archivo de config → añade `entry` o anula el `entry` del plugin.
3. Importación dinámica construida en tiempo de ejecución (`await import(path.join(...))`) → añade el objetivo a `entry`.
4. Argumento de script que Knip no puede analizar (`some-cli --entry prod.ts`) → añádelo a `entry`.
5. El archivo generado debe existir antes de que Knip corra (compilar `dist`, generadores de rutas) → genera primero.
6. Archivo genuinamente muerto → elimínalo (o `ignoreFiles` si debe quedarse, p. ej. fixtures).

Enfoque: `npx knip --files`.

### 7.2 Importaciones sin resolver

1. Alias de ruta no configurado → `paths` en `knip.jsonc` (¡caso `@/` de Vite!) o `compilerOptions.paths` de tsconfig.
2. Importación sin extensión o con formato raro → compilador o problema conocido.
3. Módulo genuinamente virtual → `ignoreUnresolved`.

### 7.3 Exportaciones sin usar

1. ¿El consumidor está fuera del alcance de `project`? → amplía `project` primero.
2. Exportación usada solo dentro de su propio archivo → `ignoreExportsUsedInFile`.
3. Barril que re-exporta intencionalmente para uso futuro → `ignoreIssues: { "index.js": ["exports"] }` (patrón actual del repo) o etiqueta `/** @public */`.
4. API pública de un archivo de entrada → considera `includeEntryExports` en vez de adivinar.
5. Ayudante solo de tests → `/** @internal */` + modo producción.
6. Realmente muerta → `npx knip --fix --fix-type exports` (¡después de confiar en la config!).

### 7.4 Dependencias sin usar / no listadas

1. Usada solo en archivos de config/test fuera de `project` → amplía `project` (❌ hábito actual: añadir a `ignoreDependencies`).
2. Falta un plugin que reconozca el uso → añade config de `entry`/plugin.
3. Paquete `@types/*` / de definiciones de tipos informado → se gestiona vía resolución de plugins/tipos; si no, `ignoreDependencies`.
4. No listada → `npm install <pkg>` en el workspace correcto (¡no en la raíz!).

### 7.5 Binarios

`binaries` = comando en `package.json#scripts` (o yaml de CI / git hook) sin dependencia proveedora **en ese workspace**. Corrige añadiendo la dep al workspace, o `ignoreBinaries` para herramientas con hoisting/provistas desde la raíz.

### 7.6 Adopción gradual (código heredado)

```json
{
  "rules": {
    "files": "error", // ya limpio
    "dependencies": "error", // ya limpio
    "exports": "warn", // aún en proceso de limpieza
    "cycles": "warn",
    "duplicates": "off" // aún no adoptado
  }
}
```

Palancas de CI mientras reduces la deuda:

```bash
npx knip --max-issues 112        # presupuesto: falla solo en regresiones más allá de N
npx knip --no-exit-code          # solo informe (nunca falla)
npx knip --production            # solo código publicado + deps de producción
npx knip --workspace apps/client # limpia un workspace cada vez
```

---

## 8. Fusión de configs → ruta de migración (cliente+servidor separados → workspaces raíz)

### Por qué no puedes "fusionar" dos archivos de config en tiempo de ejecución

Knip lee **un** archivo (§2). No hay `extends`, ni cascada, ni fusión automática de `apps/*/knip.json` en la raíz. "Fusionar" = **mover físicamente** las configs de workspace al objeto `workspaces` del archivo raíz — lo que este repo _ya hizo una vez_, y luego dejó divergir.

### Estado alcanzado (única fuente de verdad — HECHO en `knip-consolidation`, 2026-09-23)

```
/knip.jsonc                ← ÚNICA config. Usada por CI + local + editores.
/apps/client/knip.json     ← ELIMINADO
/apps/server/knip.json     ← ELIMINADO
```

### Migración paso a paso

1. **Mide la línea base de los dos puntos de entrada (solo lectura):**
   ```bash
   npx knip --no-progress --reporter json > knip-root-run.json      # desde la raíz del repo
   (cd apps/client && npx knip --no-progress) > knip-client-standalone.txt
   (cd apps/server && npx knip --no-progress) > knip-server-standalone.txt
   ```
   O sin salir de la raíz: `npx knip --directory apps/client --no-progress`.
2. **Compara la sección workspace de la raíz vs el archivo anidado** (la tabla de divergencia en §3 es el resultado actual). Decide por cada entrada divergente cuál versión es correcta — normalmente la de la **raíz** es la más nueva (lleva la lista completa de 23 ignorados del cliente; el archivo anidado del cliente está desactualizado).
3. **Reconcilia en el `knip.jsonc` raíz:** unión de `ignore`/`ignoreIssues`, un único `ignoreDependencies`, `ignoreBinaries`, `ignoreExportsUsedInFile`, `rules` locales de workspace si deben diferir de la raíz.
4. **Elimina los archivos anidados** (preferido), O consérvalos pero añade un comentario de cabecera en el archivo raíz: _"`apps/_/knip.json`solo aplica a ejecuciones`cd <app> && npx knip` — sincronizar manualmente"\*. Mantener ambos garantiza divergencia.
5. **Si necesitas comandos por app**, añade scripts npm en vez de configs anidadas:
   ```json
   "scripts": {
     "knip": "knip",
     "knip:client": "knip --workspace=apps/client",
     "knip:server": "knip --workspace=apps/server",
    "knip:ci": "knip --no-progress --reporter json"
   }
   ```
   Todos corren desde la raíz → siempre usan la config raíz.
6. **Añade las secciones faltantes:** `"."` (scripts/archivos de config de la raíz) y `"e2e"`. — HECHO.
7. **Verifica paridad** — HECHO (baseline antes→después en §11):
   ```bash
   npx knip --workspace=apps/client --no-progress | tail -5
   npx knip --workspace=apps/server --no-progress
   npx knip --workspace=. --no-progress
   ```
8. **Corrige la afirmación OpenSpec** (`ci-prebuild-substage-structure/spec.md` §"Per-workspace knip.json"): `--workspace` no cambia archivos de config; el requisito ahora dice "secciones `workspaces` del `knip.jsonc` raíz". — HECHO vía delta del cambio.
9. **Actualiza CI** (`.github/workflows/ci.yml`) — HECHO en `knip-consolidation`: `client-dead-code` ejecuta `npx knip --workspace=apps/client --no-progress --reporter json` y `server-dead-code` `npx knip --workspace=apps/server --no-progress`, ambos **sin `working-directory`** (raíz del repo) y con `continue-on-error: true` (Fase 1).

### Hoja de referencia de semántica de fusión

| Situación                                                 | Regla                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor raíz vs valor de workspace                          | El valor del workspace aplica a ese workspace; el valor raíz se usa donde el workspace no lo anula                                                                                                                                                |
| Arrays (`entry`, `project`, `ignore*`)                    | **Anulan, nunca fusionan** con los valores por defecto; pero ¿`ignoreDependencies` a nivel raíz + nivel workspace? La config del workspace es autocontenida por opción — pon los elementos compartidos en cada workspace o mantenlos solo en raíz |
| `rules`, `ignoreExportsUsedInFile`, `includeEntryExports` | Válidos en raíz (global) y por workspace                                                                                                                                                                                                          |
| `include`, `exclude`, `ignoreWorkspaces`, `workspaces`    | **Solo raíz** — ponerlos en una sección de workspace es config inválida                                                                                                                                                                           |
| Plugins                                                   | `true` en raíz → el workspace puede cambiarlo a `false`, y viceversa                                                                                                                                                                              |

---

## 9. Comandos

### Uso diario

```bash
npx knip                                  # ejecución completa desde la raíz del repo (usa /knip.jsonc)
npx knip --workspace=apps/client          # un workspace (más ancestros/dependientes)
npx knip --workspace=apps/server
npx knip --workspace=.                    # solo workspace raíz (CI hace esto)
npx knip --workspace='./apps/*'           # glob
npx knip --workspace '!e2e'               # excluir workspace
npx knip --directory apps/server          # ejecutar COMO SI cwd = apps/server (¡sin config: knip no sube a la raíz — evítalo)
npx knip --config path/to/knip.json       # archivo de config explícito
npx knip --debug                          # verboso: ruta de config, workspaces, plugins, globs
```

### Recorte del informe (filtros)

```bash
npx knip --files                          # solo archivos sin usar (¡corrige estos primero!)
npx knip --dependencies                   # deps + no listadas + binarios + no resueltas + catálogo
npx knip --exports                        # exportaciones + tipos + miembros enum + miembros namespace + duplicadas
npx knip --cycles                         # solo dependencias circulares
npx knip --include files,dependencies
npx knip --include files --exclude enumMembers,duplicates
npx knip --production                     # solo código publicado (patrones entry/project con sufijo `!`)
npx knip --production --strict            # + aislamiento de workspace, peerDeps, distinción de tipos dev
npx knip --include-entry-exports          # informar también exportaciones muertas en archivos de entrada
```

### Salida / reporteros

```bash
npx knip --reporter compact               # conciso
npx knip --reporter symbols               # por defecto, vistoso
npx knip --reporter json > knip.json      # legible por máquina (usado por CI + agentes)
npx knip --reporter markdown > knip.md    # tablas por tipo de problema, para seguimiento en el tiempo
npx knip --reporter sarif > knip.sarif    # subida a code scanning de GitHub
npx knip --reporter github-actions        # anotaciones inline en PRs
npx knip --reporter codeclimate           # JSON de Code Climate
npx knip --reporter codeowners            # enriquece con propietarios de .github/CODEOWNERS
npx knip --reporter cycles                # vista de árbol de dependencias circulares
npx knip --reporter disclosure            # bloques <details> colapsados para PRs
npx knip --reporter compact --reporter json   # múltiples reporteros = repetir el flag
npx knip --reporter json --reporter-options '{"codeowners":"docs/CODEOWNERS"}'
NO_COLOR=1 npx knip                       # salida plana (automático en CI)
npx knip --no-progress                    # sin spinner de progreso (automático en CI)
npx knip --max-issues 112                 # falla solo si el conteo > 112 (trinquete)
npx knip --max-show-issues 20             # imprime como máximo 20
npx knip --no-exit-code                   # siempre sale con 0 (modo solo informe)
```

Código de salida: `1` cuando los problemas contados > 0 (los avisos no cuentan). `--no-exit-code` lo desactiva.

### "Dry run" / inspección segura

Knip **no tiene flag `--dry-run`**. Equivalentes:

```bash
npx knip                                  # solo informe por defecto — NUNCA muta archivos
npx knip --reporter json                  # captura hallazgos sin tocar nada
npx knip --fix --fix-type exports         # CASI-dry: edita exportaciones pero NO borra archivos
npx knip --fix                            # elimina exportaciones sin usar/deps de package.json (aun así no borra archivos)
npx knip --fix --allow-remove-files       # PELIGROSO: también borra archivos sin usar
npx knip --fix --format                   # corrige + ejecuta Prettier/Biome/dprint/deno fmt en archivos tocados
npx knip --fix-type files                 # solo válido junto con la semántica de --allow-remove-files para archivos
```

Tipos corregibles: `dependencies`, `exports`, `types`, `files`, `catalog`.

> **Nunca ejecutes `--fix` antes de confiar en la config** (sugerencias resueltas, entry/project verificados). Con una config rota, Knip borrará alegremente código vivo. Haz commit antes de corregir; revisa con `git diff`.

### Rendimiento / CI

```bash
npx knip --cache                          # 10–40% más rápido en repeticiones (basado en mtime+tamaño)
npx knip --cache-location ./node_modules/.cache/knip   # ubicación por defecto de todos modos
npx knip --performance --duration         # en qué se va el tiempo
npx knip --trace-file src/index.js        # por qué está este archivo en el grafo?
npx knip --trace-export myFn
npx knip --trace-dependency lodash
npx knip --treat-config-hints-as-errors   # endurecimiento de CI
```

Uso actual en CI (`.github/workflows/ci.yml`, Fase 1 no bloqueante vía `continue-on-error: true`):

```yaml
- run: npx knip --workspace=apps/client --no-progress --reporter json # client-dead-code, desde la raíz del repo
- run: npx knip --workspace=apps/server --no-progress # server-dead-code, desde la raíz del repo
```

Scripts npm de la raíz (`package.json`, deben coincidir exactamente):

```json
{
  "knip": "knip",
  "knip:client": "knip --workspace=apps/client",
  "knip:server": "knip --workspace=apps/server",
  "knip:ci": "knip --no-progress --reporter json"
}
```

---

## 10. Casos límite (leer dos veces)

1. **Un archivo de config, basado en CWD.** La ejecución desde raíz ignora `apps/*/knip.json`; la ejecución anidada ignora la raíz y pierde conciencia de monorepo (`workspaces: []`). Verificado con `--debug` en knip 6.32.2.
2. **`--workspace` filtra el análisis, NO el descubrimiento de config.** `npx knip --workspace=apps/client` sigue leyendo `/knip.jsonc`.
3. **`--workspace` arrastra ancestros + dependientes + dependencias** del objetivo — la salida no es "solo esa carpeta". Para aislamiento usa `--strict` o entra con `cd`.
4. **`ignore` ≠ exclusión.** Solo oculta informes; el archivo permanece en el grafo de módulos. Usa patrones `project` negados para excluir de verdad (salidas de compilación, fixtures).
5. **No luches contra los plugins con `entry` negado.** Los plugins Vitest/Storybook inyectan archivos de test/stories como entradas; excluye los tests correctamente vía **modo producción** (`--production` + `patrón!`), no `ignore: ["**/*.test.js"]`.
6. **`entry`/`project` anulan los valores por defecto — no se fusionan.** Olvidar un glob que usabas de los valores por defecto encoge/agranda silenciosamente el alcance.
7. **`entry`/`project` de nivel superior se ignoran en repos basados en workspaces** — deben vivir bajo `workspaces."."`.
8. **Opciones solo-raíz en una sección de workspace = config inválida:** `include`, `exclude`, `ignoreWorkspaces`, `workspaces`.
9. **Fijado de esquema:** `knip@6/schema-jsonc.json` (o `schema.json` en archivos `.json`) debe seguir a la major instalada (`6.32.2`), si no el IDE valida contra una forma incorrecta.
10. **Las sugerencias de config son estructurales.** Silenciar sugerencias (o `--no-config-hints`) garantiza futuros falsos positivos. Corrige las sugerencias primero y considera `treatConfigHintsAsErrors`.
11. **Las deps de la raíz con hoisting parecen "no listadas" por workspace.** npm workspaces: el binario/dep existe en raíz pero el `package.json` del workspace no lo declara → informes `binaries`/`unlisted` → hoy silenciados vía `ignoreBinaries`. La solución honesta = declarar en el workspace.
12. **Glob `project` demasiado estrecho ⇒ deps fantasma sin usar.** Cliente `project: ["src/**/*.{js,jsx}"]` excluye `tests/setup/msw/server.js`, `.storybook/**`, `vite.config.js`, `*.config.js` → las deps usadas solo ahí (`msw`, `globals`, addons de storybook) se informan → hoy aparcadas en `ignoreDependencies`. Amplía `project` en su lugar.
13. **`add` y `command` en `ignoreDependencies` del cliente son casi seguro instalaciones accidentales** (errata `npm i add`) — candidatas a desinstalar, no a ignorar.
14. **La divergencia era real y ya está resuelta:** sección cliente raíz (23 ignorados) vs `apps/client/knip.json` (2 ignorados) — los anidados se eliminaron en `knip-consolidation` (2026-09-23). UNA sola fuente de verdad.
15. **`--fix` antes de una config confiable = pérdida de datos.** El FAQ lo advierte explícitamente. Haz siempre commit primero; nunca `--fix` en CI.
16. **`--fix` no borrará archivos sin `--allow-remove-files`** — esta es tu única "red de seguridad" integrada, úsala conscientemente.
17. **Las exportaciones de archivos de entrada están ocultas por defecto.** Las exportaciones muertas en `src/bin/index.js`, `src/main.jsx`, `index.js` no se mostrarán salvo `includeEntryExports: true` (recomendado para monorepos de apps privadas).
18. **`duplicates: off` (actual) oculta problemas de higiene de re-exportación** — bien como decisión por etapas, pero re-evalúalo cuando las exportaciones sean `error`.
19. **`cycles` está doblemente apagado:** fuera del informe por defecto Y regla `warn`. Dos ajustes para que controle CI: `"include": ["cycles"]` + `"rules": {"cycles": "error"}`.
20. **Las importaciones relativas entre workspaces son invisibles** para el grafo de workspaces de Knip — importa siempre vía nombre de paquete + declara la dependencia.
21. **Regex en arrays `ignore*`:** la config JSON admite _cadenas_ regex (`"pm2-.+"`); objetos `RegExp` reales solo en `knip.ts`.
22. **Sufijo `!` = solo producción** para elementos `entry`/`project`/`ignore*`; prefijo `!` en globs = negación (y anulación en `ignoreWorkspaces`). Mismo símbolo, dos significados — fácil de malinterpretar.
23. **Archivos generados/`dist`:** compila ANTES de ejecutar Knip si el mapeo de fuentes depende de ellos, o Knip informará sus importaciones como huérfanas.
24. **Caché obsoleta:** los `.gitignore` recién añadidos no se detectan — borra `node_modules/.cache/knip` en ese caso.
25. **Los reporteros se apilan** (`--reporter` repetible) pero **los filtros no deduplican la salida** — `--reporter json` escribe UNA línea; redirige con cuidado (`> archivo`, no añadas dos veces).

---

## 11. `knip.jsonc` objetivo recomendado para Project One

> **Nota:** el estado actual consolidado (lo ya implementado en `/knip.jsonc`) difiere de este "objetivo"
> recomendado a propósito: mantiene `ignore`/`ignoreIssues` por archivo en vez de `ignoreFiles`, y las severidades
> del objetivo (graduación warn→error) son un ratchet posterior fuera del alcance de `knip-consolidation`.

```jsonc
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  // Severidad global — graduar warn → error a medida que las categorías lleguen a cero
  "rules": {
    "files": "error",
    "dependencies": "error",
    "exports": "warn",
    "duplicates": "off",
    "cycles": "warn",
  },
  "ignoreExportsUsedInFile": true,
  "workspaces": {
    ".": {
      "entry": ["scripts/**/*.{js,mjs}", "eslint.config.js", ".husky/*"],
      "project": ["scripts/**/*.js", "*.js"],
    },
    "apps/client": {
      "entry": ["index.html", "src/main.jsx"],
      "project": [
        "src/**/*.{js,jsx}",
        "tests/**/*.{js,jsx}", // corrige #12: fin de deps fantasma sin usar
        ".storybook/**/*.{js,jsx}",
        "*.config.{js,mjs}",
      ],
      "paths": { "@": ["./src"], "@/*": ["./src/*"] }, // Alias de Vite
      "ignoreFiles": ["src/**/*.test.{js,jsx}"],
      "ignoreDependencies": ["shadcn-ui"], // tras auditar msw/globals/storybook vía glob project
      "ignoreBinaries": ["eslint", "prettier"],
      "ignoreIssues": {
        "src/components/ui/dropdown-menu.jsx": ["exports"],
        "src/hooks/useFetch.js": ["exports"],
        // …recortado: re-verificar cada uno tras ampliar los globs project
      },
    },
    "apps/server": {
      "entry": ["src/bin/index.js", "prisma/seed.js"],
      "project": ["src/**/*.js", "prisma/**/*.js", "tests/**/*.js"],
      "ignoreFiles": ["src/docs/**", "src/socket/levels/**"],
      "ignoreDependencies": ["@prisma/language-server", "why-is-node-running"],
      "ignoreBinaries": ["concurrently", "eslint", "prettier"],
      "ignoreIssues": {
        "src/middleware/rateLimit.js": ["exports"],
        // …conservar las entradas barril de esquemas/middleware
      },
    },
    "e2e": {
      "project": ["tests/**/*.js"],
    },
  },
}
```

Los anidados ya fueron eliminados tras verificar paridad (`knip-consolidation`, 2026-09-23). Baseline por workspace antes→después de la consolidación (conteo de hallazgos; el aumento es esperado: los globs ampliados analizan `tests/`, `.storybook/`, `prisma/` y configs antes fuera de alcance):

| Workspace     | Antes (nested/estrecho) | Después (globs ampliados) |
| ------------- | ----------------------- | ------------------------- |
| `apps/client` | 28                      | 152                       |
| `apps/server` | 28                      | 266                       |

```bash
npx knip --workspace=apps/client --no-progress
npx knip --workspace=apps/server --no-progress
npx knip --workspace=. --no-progress
```

---

## 12. Fuentes

- Referencia de configuración — <https://knip.dev/reference/configuration>
- Monorepos y Workspaces — <https://knip.dev/features/monorepos-and-workspaces>
- Reglas y Filtros — <https://knip.dev/features/rules-and-filters>
- Tipos de problema — <https://knip.dev/reference/issue-types>
- Argumentos CLI — <https://knip.dev/reference/cli>
- Reporteros y Preprocesadores — <https://knip.dev/features/reporters>
- Configuración de archivos de proyecto — <https://knip.dev/guides/configuring-project-files>
- Resolución de problemas informados — <https://knip.dev/guides/handling-issues>
- Adopción gradual de Knip — <https://knip.dev/guides/adopt-gradually>
- Uso de Knip en CI — <https://knip.dev/guides/using-knip-in-ci>
- Modo Producción — <https://knip.dev/features/production-mode>
- Auto-corrección — <https://knip.dev/features/auto-fix>
- Etiquetas JSDoc y TSDoc — <https://knip.dev/reference/jsdoc-tsdoc-tags>
- Preguntas frecuentes — <https://knip.dev/reference/faq>
- Verificación local: ejecuciones `npx knip --debug` contra este repo, knip 6.32.2 (2026-09-23)
- Contexto del repo: `knip.jsonc`, `.github/workflows/ci.yml`, `openspec/specs/ci-prebuild-substage-structure/spec.md`, `docs/ci-prebuild-substage-structure-phase2-baseline.md`, `openspec/changes/knip-consolidation/`
