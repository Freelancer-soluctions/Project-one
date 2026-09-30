# Configuración de ESLint en Project One (Flat Config)

> **Versión de ESLint:** `^9.39.2` (flat config es el formato por defecto desde ESLint v9.0.0)
> **Archivo de configuración:** `eslint.config.js` (raíz del monorepo, formato ESM porque `package.json` declara `"type": "module"`)
> **Fuentes oficiales:** [eslint.org/docs/latest](https://eslint.org/docs/latest/)

---

## Índice

1. [Modelo mental: flat config y scoping por workspace](#1-modelo-mental-flat-config-y-scoping-por-workspace)
2. [Implementación actual: explicación bloque a bloque](#2-implementación-actual-explicación-bloque-a-bloque)
3. [Todas las opciones de ESLint explicadas (con ejemplos del monorepo)](#3-todas-las-opciones-de-eslint-explicadas-con-ejemplos-del-monorepo)
4. [Prácticas profesionales](#4-prácticas-profesionales)
5. [Tabla comparativa: `.eslintrc` (legacy) vs `eslint.config.js` (flat)](#5-tabla-comparativa-eslintrc-legacy-vs-eslintconfigjs-flat)
6. [Referencias oficiales](#6-referencias-oficiales)

---

## 1. Modelo mental: flat config y scoping por workspace

### 1.1 ¿Qué es flat config?

El formato **flat config** (configuración plana) reemplaza al formato heredado `.eslintrc.*`. La idea central es simple:

> **`eslint.config.js` exporta un _array_ de _configuration objects_. ESLint evalúa cada archivo contra ese array y combina (merge) todos los objetos cuyo `files` coincide con el archivo.**

Reglas de oro del modelo mental:

1. **Array, no cascada.** No hay `.eslintrc` anidados que se "heredan" por carpeta ni `root: true`. Exime **un solo archivo** en la raíz del proyecto. La jerarquía de carpetas ya no existe: la selección se hace con _globs_ (`files`).
2. **Merge en orden.** Para cada archivo lintado, ESLint toma **todos** los objetos del array cuyo `files` coincide y los fusiona en orden: **el último objeto que define una opción gana**. Ejemplo: `eslint.config.js` → `[A, B, C]`; si `A` y `C` configuran la regla `semi`, se aplica la de `C`.
3. **`files` = scoping.** Un objeto **con** `files: ['apps/server/**/*.js']` solo aplica a esos archivos. Un objeto **sin** `files` ni `ignores` aplica a _todos_ los archivos procesados (cualquier objeto con `files` los "arrastra").
4. **`ignores` global vs no-global.** Si un objeto tiene **solo** la clave `ignores` (sin `files`, `rules`, etc.), actúa como **global ignores**: excluye esos patrones de _toda_ la configuración. Si va acompañada de otras claves, es un _exclude local_ de ese objeto.
5. **Los plugins son objetos JS, no strings.** Se importan con `import` y se registran en `plugins: { nombre }`. Una vez registrados, sus reglas se referencian como `nombre/regla`.
6. **Los presets son objetos/plans que se importan.** `js.configs.recommended`, `react.configs.recommended.rules`, etc. se combinan manualmente (esparciendo `...rules`), no mediante `extends: ["airbnb"]` mágico (aunque hoy existe una clave `extends` como azúcar sintáctico sobre el mismo mecanismo).

### 1.2 Scoping por workspace en un monorepo

En este monorepo (npm workspaces: `apps/*` y `e2e`) la estrategia es **un único `eslint.config.js` en la raíz, con bloques separados por `files`**:

```text
eslint.config.js (raíz)
├── ignores globales        → no lintear dist/, build/, coverage/...
├── js.configs.recommended   → base para TODO
├── files: apps/server/**    → backend (Node + vitest)
├── files: apps/client/**    → frontend (React + hooks + vitest)
├── files: apps/client/**.stories → Storybook
├── complejidad por capa     → core 15 / utils 10 / tests off (+ mlpf 80, ver doc de complejidad)
├── files: apps/client/src/** → exención temporal max-lines-per-function (Fase 1)
├── files: e2e/**            → workspace Playwright (globals Node + browser)
└── prettier                 → SIEMPRE al final (desactiva reglas de formato)
```

Esto tiene ventajas sobre un `.eslintrc` por workspace:

- **Una sola instalación** de ESLint y plugins (devDependencies raíz) → sin _duplication_ ni versiones divergentes entre workspaces.
- **Los workspaces ejecutan ESLint por su cuenta** con su propio glob (`npm run lint --workspace=apps/client` → `eslint "**/*.{js,jsx}" --max-warnings 0`), pero **comparten la misma configuración raíz**.
- El scoping fino (`files`) garantiza que las reglas de React **nunca** se apliquen al backend y viceversa.

### 1.3 Flujo de evaluación (resumen)

```text
Archivo: apps/client/src/pages/Home.jsx
  │
  ├─ ¿matchea un global ignores? → Sí ⇒ fuera (no se lintea)
  ├─ ¿matchea js.configs.recommended (sin files)? → Sí ⇒ reglas base
  ├─ ¿matchea files: apps/client/**/*.{js,jsx}? → Sí ⇒ React + Hooks + vitest
  ├─ ¿matchea files: ...*.stories.*? → Sí (si es story) ⇒ Storybook + overrides
  ├─ ¿matchea files: apps/*/src/**/*.{js,jsx} (core)? → Sí ⇒ complexity 15
  ├─ ¿matchea files: apps/**/src/utils/** (utils)? → Sí ⇒ complexity 10 (gana al ir después)
  ├─ ¿matchea files: **/*.test.* / **/*.spec.* / e2e/tests/** (tests)? → Sí ⇒ complexity off
  ├─ ¿matchea files: apps/client/src/** (exención Fase 1)? → Sí ⇒ max-lines-per-function off
  └─ ¿matchea prettier (sin files)? → Sí ⇒ reglas de formato apagadas
       ▲ todo fusionado en orden → config final efectiva del archivo
```

**Depuración:** `npx eslint --print-config ruta/al/archivo.js` muestra la configuración final efectiva tras el merge. También puede usarse el **ESLint Config Inspector** (`npx eslint-config-inspector` o `eslint --inspect-config` en versiones recientes) para ver visualmente qué bloque aporta cada opción.

---

## 2. Implementación actual: explicación bloque a bloque

El archivo actual (`eslint.config.js`) exporta un array literal de configuración; el recuento exacto de líneas y elementos se puede verificar en cada momento con `wc -l eslint.config.js` (el archivo evolucionará con cada change, así que esta guía cita solo los rangos aproximados y el nombre de cada bloque). Nota de estilo: al ser un `.js` ESM, admite **comentarios `//` estilo JSONC** libremente (a diferencia de un `.eslintrc.json`, donde los comentarios no están permitidos). Todo el archivo está comentado **en español** para el equipo.

### Bloque 0 — Imports (líneas 1–22)

```js
import js from '@eslint/js'; // reglas recomendadas del core
import react from 'eslint-plugin-react'; // plugin React
import reactHooks from 'eslint-plugin-react-hooks'; // plugin React Hooks
import prettier from 'eslint-config-prettier'; // apaga reglas de formato
import globals from 'globals'; // globals predefinidos (browser, node, jest...)
import vitest from '@vitest/eslint-plugin'; // reglas para tests Vitest
import storybook from 'eslint-plugin-storybook'; // reglas para stories
```

**Puntos clave:**

- `@eslint/js` es el paquete oficial que expone `js.configs.recommended` (equivalente flat del antiguo `extends: "eslint:recommended"`).
- `globals` **no** es un plugin: es un paquete de datos con conjuntos de variables globales (`globals.browser`, `globals.node`, `globals.jest`, ...). En flat config **ya no existe la opción `env`**; los "environments" de eslintrc se replican esparciendo estos objetos en `languageOptions.globals`.
- `eslint-config-prettier` contiene **solo reglas apagadas**; su trabajo es desactivar todas las reglas de formato de ESLint que chocan con Prettier.

### Bloque 1 — `ignores` globales (líneas 29–39)

```js
{
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/storybook-static/**',
    '**/build/**',
    '.vscode/**',
    '**/coverage/**',
    '.semgrep/rules/tests/**',
  ],
},
```

- Es un objeto **con solo `ignores`** ⇒ actúa como **global ignores** (equivale al antiguo archivo `.eslintignore`).
- Excluye artefactos de build (`dist`, `build`, `storybook-static`), cobertura, `node_modules` (aunque ESLint ya lo ignora por defecto junto con `.git/`) y utilidades no-lintables.
- Los patros usan sintaxis **minimatch** y se evalúan **relativos a la ubicación de `eslint.config.js`**.

### Bloque 2 — Base JavaScript: `js.configs.recommended` (línea 51)

```js
js.configs.recommended,
```

- Aplica las ~100+ reglas recomendadas del core de ESLint a **todos** los archivos JS procesados (objeto sin `files`).
- Incluye reglas fundamentales como `no-unused-vars`, `no-undef`, `no-console` (en recommended... _ver nota_), `eqeqeq` (no está en recommended, es un ejemplo de regla a añadir aparte), `no-debugger`, `no-empty`, etc.
- Funciona como **capa base**: cualquier bloque posterior puede sobreescribir sus severidades (ej. `no-console: 'off'` en backend).

### Bloque 3 — Backend (Node.js): `apps/server/**/*.js` (líneas 57–88)

```js
{
  files: ['apps/server/**/*.js'],
  plugins: { vitest },
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      // Sin globals.browser (corregido en change eslint-configuration):
      // el backend corre en Node; window/document no deben existir aquí y
      // no-undef debe poder detectarlos.
      ...globals.node,
      ...vitest.environments.env.globals,
    },
  },
  rules: {
    ...vitest.configs.recommended.rules,
    'no-console': 'off',
  },
},
```

- **`files`** limita todo el bloque al backend ⇒ _workspace scoping_.
- **`plugins: { vitest }`** registra el plugin `@vitest/eslint-plugin` con namespace `vitest`; sus reglas se activan con `vitest/...`.
- **`ecmaVersion: 'latest'`** — soporta la sintaxis ECMAScript más reciente soportada por ESLint.
- **`sourceType: 'module'`** — el backend usa ESM (`import/export`); ESLint aplica strict mode de módulo.
- **`globals`** — combina dos conjuntos: globals de Node y los de Vitest (`describe`, `it`, `expect`, ... disponibles en los tests del servidor).
  - _✅ Corregido (change `eslint-configuration`):_ `...globals.browser` fue **eliminado** del backend — APIs de `window`/`document` no existen en Node y su presencia en globals anulaba la detección de `no-undef` para exactamente esa clase de bug. El backend usa solo `...globals.node` (+ globals de Vitest). Verificado con `npx eslint --print-config` (87 globals; `window`/`document` ausentes; `process`/`describe`/`expect` presentes) y `npm run lint --workspace=apps/server` (exit 0, sin `no-undef` nuevos). Frontend y Storybook conservan `globals.browser`.
- **`no-console: 'off'`** — en servidores, `console.log` es legítimo para logging (aunque este proyecto usa `winston`).
- **`...vitest.configs.recommended.rules`** — reglas `vitest/*` recomendadas para archivos de test dentro del server.

### Bloque 4 — Frontend (React + JSX): `apps/client/**/*.{js,jsx}` (líneas 94–155)

```js
{
  files: ['apps/client/**/*.{js,jsx}'],
  plugins: { react, 'react-hooks': reactHooks, vitest },
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: { ...globals.browser, ...globals.node, ...vitest.environments.env.globals },
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  settings: { react: { version: 'detect' } },
  rules: {
    ...react.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    ...vitest.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off',
  },
},
```

- **`plugins`** — registra `react` y `react-hooks` (namespace con guion: `'react-hooks': reactHooks` ⇒ reglas `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`).
- **`parserOptions.ecmaFeatures.jsx: true`** — habilita el parseo JSX en el parser por defecto (**espree**). _Importante:_ soportar JSX ≠ soportar React; las reglas semánticas de React las aporta `eslint-plugin-react`.
- **`settings.react.version: 'detect'`** — los plugins leen `settings` como _shared settings_; aquí `eslint-plugin-react` detecta automáticamente la versión instalada de React (18.3.1) para aplicar reglas dependientes de la versión.
- **`rules`** — spread de los presets recomendados de React, Hooks y Vitest.
- **`'react/react-in-jsx-scope': 'off'`** — con el nuevo JSX transform (React 17+) no hace falta `import React from 'react'` en cada archivo JSX.
- Nuevamente: los tests de frontend (`*.test.js`) también matchean `apps/client/**/*.{js,jsx}`, por eso se incluyen los globals de Vitest en este bloque.

### Bloque 5 — Storybook: `apps/client/**/*.stories.*` y `apps/client/.storybook/**` (líneas 161–205)

```js
{
  files: [
    'apps/client/**/*.stories.{js,jsx}',
    'apps/client/.storybook/**/*.{js,jsx}',
  ],
  plugins: { storybook, react },
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module',
    globals: { ...globals.browser },
    parserOptions: { ecmaFeatures: { jsx: true } } },
  settings: { react: { version: 'detect' } },
  rules: {
    ...storybook.configs.recommended.rules,
    'storybook/hierarchy-separator': 'warn',
    'storybook/default-exports': 'error',
    'storybook/no-redundant-story-name': 'warn',
    'react-hooks/rules-of-hooks': 'off',
    'react/prop-types': 'off',
  },
},
```

- Este bloque **sobre-escribe** (en orden) al bloque frontend para los archivos `.stories.*`: como las reglas se fusionan y _gana el último_, `'react-hooks/rules-of-hooks': 'off'` y `'react/prop-types': 'off'` anulan el preset recomend del bloque anterior **solo para stories**.
- Los plugins se re-declaran porque los plugins registrados en un objeto con `files` solo están disponibles para los archivos que matchean ese objeto.
- Justificación documentada en el propio código: las _play functions_ de Storybook pueden usar hooks fuera del render estándar (`rules-of-hooks` daba falsos positivos) y las stories no usan `prop-types`.

### Bloque 6 — Umbrales de complejidad por capa (core 15 / utils 10 / tests off)

```js
// core: TODO el código de producción bajo apps/*/src
{ files: ['apps/*/src/**/*.{js,jsx}'],
  rules: {
    complexity: ['error', { max: 15 }],
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
  } },
// utils: override más estricto
{ files: ['apps/**/src/utils/**'], rules: { complexity: ['error', { max: 10 }] } },
// tests: último de los tres — gana el merge (hay .unit.test.js dentro de src/utils/)
{ files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'e2e/tests/**'],
  rules: { complexity: 'off', 'max-lines-per-function': 'off' } },
```

- Los dos bloques legacy `complexity: max 20` por workspace fueron **eliminados** (change `eslint-complexity-rules`): un resto pisaría 15/10 porque "el último que define la regla gana".
- **EL ORDEN IMPORTA**: los bloques se declaran core → utils → tests; el último que define la regla gana en el merge.
- `max-lines-per-function` NO usa exención por patrón interno de la regla (no existe `ignorePattern`): las exenciones son bloques `files`/`ignores` (grepeables) o `eslint-disable` documentado. La exención temporal de client (`apps/client/src/**`, Fase 1) fue **eliminada** por el change `eslint-mlpf-client-phase2` (archivado 2026-09-24) tras refactorizar las funciones que superaban 80 líneas: hoy la regla aplica idéntica a server y client (`max: 80, skipBlankLines, skipComments`).
- **✅ Coherencia local/CI (changes `eslint-configuration` y `eslint-complexity-rules`):** los jobs `client-complexity` y `server-complexity` de `.github/workflows/ci.yml` **no pasan `--rule '{"complexity": ...}'`** — ejecutan `npx eslint "src/**/*.{js,jsx}"` / `npx eslint "src/**/*.js"` y heredan los umbrales por capa de `eslint.config.js`, que es la **única fuente de verdad**. Cambios futuros del umbral se hacen solo en `eslint.config.js`. Ver §4.5.

### Bloque 8 — E2E (workspace e2e) y Prettier al final

```js
// e2e (Playwright): Node + browser (los callbacks de page.evaluate corren en el navegador)
{ files: ['e2e/**/*.js', 'e2e/*.js'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module',
    globals: { ...globals.node, ...globals.browser } } },

prettier, // ← SIEMPRE el último elemento del array
```

- `eslint-config-prettier` es un objeto de config **sin `files`** que apaga (`'off'`) todas las reglas de estilo (`indent`, `quotes`, `semi`, `arrow-spacing`, ...) de core y plugins (React, etc.).
- **Debe ir al final** para que su merge venza a cualquier regla de formato activada por bloques anteriores. Documentado tanto en la [guía oficial de Prettier](https://prettier.io/docs/en/install.html) como en `eslint-config-prettier`.
- **No confundir:** `eslint-config-prettier` (solo desactiva reglas) ≠ `eslint-plugin-prettier` (ejecuta Prettier _como regla_ de ESLint — desaconsejado hoy: hace el lint mucho más lento y reporta formato como errores de lint). Este proyecto usa la integración correcta: **Prettier aparte + `eslint-config-prettier` al final**.

---

## 3. Todas las opciones de ESLint explicadas (con ejemplos del monorepo)

Un _configuration object_ de flat config puede contener estas claves (referencia: [Configuration Files — Configuration Objects](https://eslint.org/docs/latest/use/configure/configuration-files)):

| Clave             | Tipo               | Descripción                                                                                                   |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `name`            | `string`           | Nombre del bloque, visible en errores y en el Config Inspector.                                               |
| `basePath`        | `string`           | Subdirectorio al que aplica el bloque; `files`/`ignores` se evalúan relativos a él.                           |
| `files`           | `string[]`         | Globs (minimatch) de los archivos a los que aplica el bloque. Sin él ⇒ aplica a todos.                        |
| `ignores`         | `string[]`         | Globs excluidos. **Solo `ignores`** ⇒ _global ignores_; con otras claves ⇒ exclude local.                     |
| `extends`         | `array`            | Azúcar sintáctico: acepta configs/plugins/objetos a fusionar (misma semántica que el merge del array).        |
| `language`        | `string`           | Lenguaje a lintear, formato `"plugin/language"` (p. ej. `"markdown/commonmark"`). Default: `"js/js"`.         |
| `languageOptions` | `object`           | Opciones del lenguaje: `ecmaVersion`, `sourceType`, `globals`, `parser`, `parserOptions`.                     |
| `linterOptions`   | `object`           | Opciones del proceso de lint: `noInlineConfig`, `reportUnusedDisableDirectives`, `reportUnusedInlineConfigs`. |
| `processor`       | `string \| object` | Procesador (`"markdown/markdown"` o un objeto `preprocess/postprocess`).                                      |
| `plugins`         | `object`           | Mapa `namespace → plugin object` disponible solo en los archivos de este bloque.                              |
| `rules`           | `object`           | Reglas y severidades; fusionadas en orden (gana la última).                                                   |
| `settings`        | `object`           | _Shared settings_ legibles por cualquier regla (p. ej. `settings.react`).                                     |

### 3.1 `files` — scoping por workspace

```js
// Solo el backend
{ files: ['apps/server/**/*.js'], rules: { 'no-console': 'off' } }

// Múltiples extensiones (llave de expansión de minimatch)
{ files: ['apps/client/**/*.{js,jsx}'] }

// Excluir un subdirectorio de un bloque (exclude local)
{ files: ['apps/server/**/*.js'], ignores: ['apps/server/scripts/**'], rules: { /* ... */ } }
```

- Por defecto ESLint procesa `**/*.js`, `**/*.cjs`, `**/*.mjs`. Para lintear `.jsx` **hay** que declararlo en `files` (como hace el bloque frontend).
- Patrones evaluados relativos a `eslint.config.js`.

### 3.2 `ignores` — global vs local, y `globalIgnores()`

```js
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Opción actual (válida): objeto solo-ignores = global ignores
  { ignores: ['**/dist/**', '**/coverage/**'] },

  // Opción explícita recomendada en ESLint reciente: helper globalIgnores()
  globalIgnores(['**/dist/**', '**/coverage/**'], 'Ignorar builds y cobertura'),
]);
```

- `globalIgnores(patterns, nombre?)` crea un bloque de ignores globales **con nombre** (mejor debuggeo).
- Solo los _global ignores_ matchean **directorios completos**; los `ignores` de un bloque con `files` solo matchean nombres de archivo.
- Se pueden combinar negaciones: `['build/**/*', '!build/test.js']`.
- Alternativa CLI: `npx eslint . --ignore-pattern '.config/*'`.

### 3.3 `languageOptions.ecmaVersion` / `sourceType`

```js
languageOptions: {
  ecmaVersion: 'latest',      // default: 'latest' — año (2022) o versión (5) también válidos
  sourceType: 'module',       // 'module' (default en .js) | 'commonjs' | 'script'
}
```

- `ecmaVersion` fija tanto la **sintaxis** como los **built-ins** (p. ej. `Promise` disponible desde ES2015).
- `sourceType: 'commonjs'` para archivos `.cjs` o código con `require()` (default automático en `.cjs`).
- En este proyecto: ESM en todos lados (frontend Vite y backend Node moderno con `import`).

### 3.4 `languageOptions.parserOptions` (parser espree)

```js
languageOptions: {
  parserOptions: {
    ecmaFeatures: {
      jsx: true,           // habilita JSX (bloques frontend y storybook de este repo)
      globalReturn: true,  // return en scope global (solo sourceType 'script')
      impliedStrict: true, // strict mode global (ecmaVersion >= 5)
    },
    allowReserved: true,   // palabras reservadas como identificadores (ecmaVersion 3)
  },
}
```

- `ecmaVersion` y `sourceType` pueden ir aquí por compatibilidad, pero **se recomienda ponerlos directo en `languageOptions`** (si ambos existen, gana `parserOptions`).
- Soportar JSX ≠ soportar React: para semántica de React se usa el plugin (o `@eslint-react/eslint-plugin`).

### 3.5 `languageOptions.parser` — parsers alternativos

```js
import tsParser from '@typescript-eslint/parser';

// Ejemplo TypeScript (aunque este repo aún es JS)
{
  files: ['**/*.ts'],
  languageOptions: { parser: tsParser },
}
```

- En flat config el parser es un **objeto módulo**, no un string (en eslintrc era `parser: "@babel/eslint-parser"`).
- Default: [`espree`](https://github.com/eslint/js/tree/main/packages/espree).

### 3.6 `languageOptions.globals` — el reemplazo de `env`

```js
import globals from 'globals';

{
  languageOptions: {
    globals: {
      ...globals.browser,   // window, document, fetch...  (equivale al viejo env: browser)
      ...globals.node,      // process, __dirname...       (equivale al viejo env: node)
      ...vitest.environments.env.globals, // describe/it/expect del plugin vitest
      MY_GLOBAL: 'readonly',              // global propio
      __DEV__: 'writable',                // escribible
      LEGACY: 'off',                       // desactivada
    },
  },
}
```

- Valores: `'readonly'` | `'writable'` | `'off'` (los booleanos `false`/`true` son alias **deprecados** de `readonly`/`writable`).
- También se pueden declarar en un comentario: `/* global var1, var2:writable */`.
- Las reglas que dependen de globals (`no-undef`, `no-native-reassign`) usan esta información.
- **⚠️ El ejemplo combina browser+node a modo didáctico** — en este repo cada bloque declara solo lo que su entorno necesita: el backend (`apps/server/**`) usa `...globals.node` + globals de Vitest **sin** `...globals.browser` (change `eslint-configuration`); frontend y Storybook sí incluyen `globals.browser`. Ver Bloque 3/4/5 de §2.
- **Regla práctica:** el **backend solo `globals.node`**, el **frontend `globals.browser`**, los **tests añaden los globals del framework**. Mezclar `browser` en el backend debilita `no-undef` — el bloque 3 lo hacía y fue corregido en el change `eslint-configuration`.

### 3.7 `settings` — shared settings

```js
{
  files: ['apps/client/**/*.{js,jsx}'],
  settings: {
    react: { version: 'detect' },          // leído por eslint-plugin-react
    // Si se activara eslint-plugin-import (instalado pero no usado hoy):
    // 'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
  },
}
```

- `settings` es un objeto genérico de pares clave-valor **legible por cualquier regla** (los plugins definen qué claves leen).
- No afecta al lint directamente; solo alimenta a los plugins.

### 3.8 `rules` — severidades, opciones y reglas de plugin

```js
rules: {
  // Severidades: 'off'/0 | 'warn'/1 | 'error'/2
  'no-console': 'off',                       // string
  complexity: ['error', { max: 15 }],        // array: severidad + opciones de la regla
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'storybook/default-exports': 'error',      // regla de plugin → namespace/regla
  'react-hooks/exhaustive-deps': 'warn',
}
```

- **Prioridad:** comentarios inline (`/* eslint ... */`) > último objeto del array que la define > presets anteriores.
- La documentación oficial recomienda: **`error`** para reglas que deben cumplirse en CI/pre-commit (exit code ≠ 0) y **`warn`** para adopción gradual o falsos positivos probables.
- Desactivar inline debe ir documentado: `/* eslint eqeqeq: "off" -- descripción del porqué */` (separador `--`).

### 3.9 `plugins`

```js
import storybook from 'eslint-plugin-storybook';

{
  files: ['apps/client/**/*.stories.{js,jsx}'],
  plugins: { storybook },          // shorthand: namespace = nombre del import
  rules: { 'storybook/no-redundant-story-name': 'warn' },
}
```

- Namespace por convención = nombre npm **sin** el prefijo `eslint-plugin-`.
- Un plugin con `files` solo está disponible en los archivos de ese bloque (por eso el bloque storybook re-declara `react`).
- Los plugins también pueden ser **locales** (`./my-local-plugin.js`) o **virtuales** (objeto literal con `rules`).

### 3.10 `processor` — lintear código embebido

```js
import markdown from '@eslint/markdown';

export default defineConfig([
  { files: ['**/*.md'], plugins: { markdown }, processor: 'markdown/markdown' },
  // Bloques nombrados dentro del markdown (0.js, 1.js...):
  { files: ['**/*.md/*.js'], rules: { 'no-console': 'off' } },
]);
```

- Los procesadores extraen JS de otros archivos (Markdown, HTML, Vue SFC) mediante `preprocess()`/`postprocess()`.
- **Nunca** se auto-configuran en flat config: hay que declarar `processor` explícitamente.
- Los _named code blocks_ (`archivo.md/*.js`) reciben su propia config con `files`.

### 3.11 `linterOptions` — control del proceso de lint

```js
{
  linterOptions: {
    noInlineConfig: false,                    // true ⇒ ignora comentarios /* eslint ... */
    reportUnusedDisableDirectives: 'warn',    // default 'warn': flaggear eslint-disable sin uso
    reportUnusedInlineConfigs: 'off',         // default 'off': flaggear configs inline inútiles
  },
}
```

- `reportUnusedDisableDirectives` detecta `/* eslint-disable no-undef */` que ya no hace falta → higiene del código. Puede elevarse a `'error'` en CI.
- Equivalente CLI: `--report-unused-disable-directives` / `--report-unused-inline-configs`.
- Para reglas de estilo sobre los propios comentarios de ESLint existe [`eslint-plugin-eslint-comments`](https://github.com/eslint-community/eslint-plugin-eslint-comments).

### 3.12 `name`, `basePath` y `defineConfig`

```js
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/dist/**'], 'Build outputs'),
  {
    name: 'backend/server', // aparece en --print-config y el Config Inspector
    basePath: 'apps/server', // files/ignores relativos a apps/server/
    files: ['**/*.js'],
    rules: { 'no-console': 'off' },
  },
]);
```

- `defineConfig()` normaliza/valida el array (y soporta `extends`); es la forma recomendada en ESLint ≥ 9.22.
- `name` es muy útil para saber **qué bloque** aplicó una opción (documentación oficial: [Configuration Naming Conventions](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-naming-conventions)).

### 3.13 Comentarios inline en código fuente

```js
/* global window, process */
/* eslint eqeqeq: "off" -- temporal: pendiente issue #123 */
/* eslint-disable no-console -- logging intencional en CLI */
// eslint-disable-next-line complexity -- refactor planificado en sprint 12
// eslint-disable-next-line max-lines-per-function -- tabla de decisión extensa, ver issue #XXX
```

- Máxima prioridad: siempre ganan al config file.
- Documentar **siempre** el porqué tras `--` (recomendación oficial).
- Con `reportUnusedDisableDirectives: 'warn'` los disables obsoletos se reportan.

---

## 4. Prácticas profesionales

### 4.1 Adopción gradual con severidades

Patrón oficial y de la industria para no bloquear el delivery al introducir reglas nuevas:

1. **Introducir como `warn`** en un PR dedicado → el lint pasa (`exit 0` con warnings), pero los violations quedan visibles.
2. **Reducir warnings** a cero (refactors, `--fix`).
3. **Promover a `error`** una vez limpio ⇒ ya no puede volver a romperse.
4. En CI, endurecer con `--max-warnings 0` (como ya hacen los scripts de workspace y lint-staged de este repo).

Ejemplo aplicado a este monorepo:

```js
rules: {
  // Fase 1 (hoy): warn — visibilidad sin bloquear
  'no-console': 'warn',
  // Fase 2 (objetivo): error tras limpiar hallazgos
  // 'no-console': 'error',
}
```

Separación semántica recomendada por la [documentación de reglas](https://eslint.org/docs/latest/use/configure/rules):

- `error` → problemas que rompen build/runtime o incumplen política innegociable (complejidad, hooks, seguridad).
- `warn` → código sospechoso, deuda visible, o regla con falsos positivos.
- `off` → regla ruidosa o irrelevante para este workspace (documentar el porqué en el bloque).

### 4.2 Scoping por workspace

- **Un config raíz + `files` por workspace** (estrategia actual) en lugar de un `.eslintrc` por paquete: evita duplicación de plugins/versiones y garantiza consistencia.
- Cada workspace corre **su propio glob** con `--max-warnings 0`:
  - `apps/client`: `eslint "**/*.{js,jsx}" --max-warnings 0`
  - `apps/server`: `eslint "**/*.js" --max-warnings 0`
- Añadir nuevos workspaces = añadir un bloque con su `files` y sus globals. El workspace `e2e/` ya está integrado así (change `eslint-complexity-rules`): bloque `files: ['e2e/**/*.js', 'e2e/*.js']` con `...globals.node + ...globals.browser` (los callbacks de `page.evaluate()` corren en el navegador), script `lint` en `e2e/package.json` y job `e2e-lint` en CI.
- Usar `name` en cada bloque para que `--print-config` y el Config Inspector identifiquen el origen de cada opción.

### 4.3 Selección de plugins (estándar del ecosistema)

| Plugin                                      | Rol                                                                              | ¿En este repo?                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@eslint/js`                                | Reglas recomendadas del core                                                     | ✅ `js.configs.recommended`                                                                                                                                                                                                                                                         |
| `eslint-plugin-react`                       | Reglas semánticas de React/JSX                                                   | ✅ frontend                                                                                                                                                                                                                                                                         |
| `eslint-plugin-react-hooks`                 | Reglas de hooks (rules-of-hooks, exhaustive-deps) — **crítico para evitar bugs** | ✅ frontend                                                                                                                                                                                                                                                                         |
| `@vitest/eslint-plugin`                     | Reglas `vitest/*` para tests                                                     | ✅ server + client                                                                                                                                                                                                                                                                  |
| `eslint-plugin-storybook`                   | Reglas para stories y `.storybook/`                                              | ✅ stories                                                                                                                                                                                                                                                                          |
| `eslint-config-prettier`                    | Desactiva reglas de formato en conflicto con Prettier                            | ✅ último bloque                                                                                                                                                                                                                                                                    |
| `globals`                                   | Datos de variables globales por entorno                                          | ✅                                                                                                                                                                                                                                                                                  |
| `eslint-plugin-import`                      | Orden de imports, resolución, cycles                                             | ❌ **desinstalado** (change `eslint-configuration`): nunca se registró en `eslint.config.js` y los límites de import son propiedad exclusiva de `dependency-cruiser` (config raíz `.dependency-cruiser.cjs`, change `import-boundaries`) — ver `docs/learning/import-boundaries.md` |
| `typescript-eslint`                         | Reglas TS                                                                        | ❌ (repo aún JS; añadir si se migra a TS)                                                                                                                                                                                                                                           |
| `eslint-plugin-security` / `no-unsanitized` | Superficies de seguridad (complementan Semgrep, ya presente)                     | ❌ opcional                                                                                                                                                                                                                                                                         |

Criterios de selección profesionales: (1) mantenimiento activo y compatibilidad con ESLint 9 / flat config, (2) presupuesto de reglas razonable (evitar 5 presets simultáneos), (3) `--fix` disponible, (4) falsos positivos acotados.

> **Nota histórica:** `eslint-plugin-import` estuvo instalado pero sin registrar en la config (instalación huérfana: Dependabot lo bumping-eaba sin uso). Se desinstaló tras verificar cero consumidores (verificado en `eslint.config.js`, `apps/**`, `.github/**`). Si en el futuro se quiere activar, el ejemplo de integración era:

```js
import importPlugin from 'eslint-plugin-import';

{
  files: ['apps/**/*.{js,jsx}'],
  plugins: { import: importPlugin },
  settings: { 'import/resolver': { node: { extensions: ['.js', '.jsx'] } } },
  rules: {
    'import/no-unresolved': 'error',
    'import/order': ['warn', { 'newlines-between': 'always' }],
    'import/no-duplicates': 'error',
  },
}
```

(Ejemplo de referencia — no activo hoy; activarlo requeriría reinstalar el plugin y es un change separado.)

### 4.4 Integración con Prettier (división de responsabilidades)

- **Prettier** → formato (indentación, comas, saltos de línea). **ESLint** → calidad (bugs, malas prácticas, estilo _semántico_ como `eqeqeq`).
- `eslint-config-prettier` **siempre al final** del array (como en este repo).
- **No** usar `eslint-plugin-prettier` (correr Prettier como regla ESLint): lento y convierte issues de formato en errores de lint.
- Flujo de defensa en profundidad de este repo ([docs/code-style.md](../code-style.md)):
  1. Editor → save con Prettier (formato).
  2. `format:check` en CI → Prettier verifica.
  3. Commit (Husky + lint-staged) → `prettier --write` + `eslint --fix --max-warnings 0 --no-warn-ignored` **solo sobre staged files**.
  4. CI `client-lint` / `server-lint` → lint completo del workspace.
- `--no-warn-ignored` evita el aviso de archivos ignorados cuando lint-staged pasa archivos que están en `ignores`.

### 4.5 CI: jobs de lint

Estructura actual en `.github/workflows/ci.yml` (Substage 2B — Code Quality):

| Job                          | Comando                                                | Propósito                                                                                                                   |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `client-lint`                | `npm run lint --workspace=apps/client`                 | Lint completo frontend, `--max-warnings 0`                                                                                  |
| `server-lint`                | `npm run lint --workspace=apps/server`                 | Lint completo backend, `--max-warnings 0`                                                                                   |
| `e2e-lint`                   | `npm run lint --workspace=e2e`                         | Lint del workspace Playwright (specs + config), `--max-warnings 0`                                                          |
| `client-complexity`          | `npx eslint "src/**/*.{js,jsx}"` (desde `apps/client`) | Quality gate de ciclomaticidad — umbrales por capa heredados de `eslint.config.js` (core 15 / utils 10)                     |
| `server-complexity`          | `npx eslint "src/**/*.js"` (desde `apps/server`)       | Quality gate de ciclomaticidad — umbrales por capa heredados de `eslint.config.js` (core 15 / utils 10; nunca vía `--rule`) |
| `ci-enterprise.yml` → `lint` | `npm run lint`                                         | Lint raíz (todos los workspaces)                                                                                            |

Recomendaciones:

- **`--max-warnings 0` en CI siempre**: un `warn` que se ignora indefinidamente se convierte en ruido invisible.
- **✅ Coherencia de umbrales resuelta (changes `eslint-configuration` y `eslint-complexity-rules`):** los jobs `*-complexity` ya no usan `--rule` — `eslint.config.js` es la única fuente de verdad de los umbrales por capa (core 15 / utils 10 / tests off). Nunca dupliques un threshold entre CLI y config: el `--rule` de CLI gana silenciosamente sobre el config.
- Mantener la separación por workspace (`client-lint`, `server-lint`) → feedback más rápido y _ownership_ claro; el gate final (`needs:` de los jobs de staging) los agrega.
- Opcional: `--format github` (anotaciones inline en PRs) o `eslint-formatter-checkstyle` para reportes.

### 4.6 Comentarios y anotaciones para el equipo (hispanohablante)

Convenio ya adoptado en `eslint.config.js` y recomendable para todo el equipo:

- **Comentarios de config en español**, una línea de _qué_ + una de _por qué_ (ej. _"Debe aplicarse SIEMPRE al final"_ para Prettier).
- Secciones delimitadas con un banner:

  ```js
  // ----------------------------
  // Frontend (React + JSX)
  // ----------------------------
  ```

- Los comentarios `//` dentro de `eslint.config.js` son comentarios JS normales (formato "JSONC" permitido porque el archivo es `.js`, no `.json`).
- En código fuente, toda desactivación inline **documenta el porqué en español** tras el separador `--`:

  ```js
  /* eslint-disable-next-line complexity -- refactor en el issue #412, sprint 14 */
  ```

- Nombres de bloques (`name: 'backend'`, `name: 'frontend-react'`) en inglés técnico corto para grep/inspector; prosa en español (consistencia con el resto de `docs/`).

### 4.7 Mantenimiento y debug

- `npx eslint --print-config <file>` → config efectiva final (merge resuelto).
- ESLint Config Inspector → mapa visual de bloques.
- `npx eslint . --debug` para problemas de resolución de globs/plugins.
- Dependabot ya vigila `eslint*` (`.github/dependabot.yml`) → plugins siempre compatibles con el core.
- Al añadir un workspace o extensión nueva (`.ts`, `.md` con code blocks): nuevo bloque `files` + parser/processor correspondiente.
- Revisar periódicamente `reportUnusedDisableDirectives` y buscar `eslint-disable` huérfanos.

### 4.8 Errores comunes (cheat sheet)

| Síntoma                                        | Causa probable                                        | Solución                                                          |
| ---------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `Definition for rule 'X' was not found`        | Plugin no registrado en **ese** bloque                | Añadir a `plugins` del objeto cuyo `files` matchea                |
| `no-undef` en `describe/it`                    | Faltan globals de test                                | `...vitest.environments.env.globals` en `languageOptions.globals` |
| JSX "parsing error"                            | Falta `ecmaFeatures: { jsx: true }`                   | Añadir en `parserOptions` del bloque frontend                     |
| Regla de formato peleando con Prettier         | `eslint-config-prettier` no es el **último** elemento | Moverlo al final del array                                        |
| Un `.jsx` no se lintea                         | `files` no incluye `.jsx`                             | Ampliar glob a `**/*.{js,jsx}`                                    |
| Reglas de React en el backend                  | Bloque sin `files`                                    | Añadir `files: ['apps/client/**']`                                |
| Archivo "ignored due to missing configuration" | Fuera de todo `files`                                 | Ampliar globs o quitar ignores                                    |

---

## 5. Tabla comparativa: `.eslintrc` (legacy) vs `eslint.config.js` (flat)

Referencia: [Configuration Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide). Flat config es el formato **por defecto desde ESLint v9.0.0**; `.eslintrc` queda deprecado.

| Aspecto                      | `.eslintrc.*` (legacy)                                       | `eslint.config.js` (flat)                                                                  | Nota                                                 |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| **Formato**                  | JSON/YAML/JS jerárquico (objeto único)                       | **Array de objetos planos** exportado (ESM/CJS/TS)                                         | Un solo archivo en la raíz                           |
| **Cascada por carpetas**     | Sí: `.eslintrc` heredados por directoria + `root: true`      | **No existe**: todo por `files` globs                                                      | Modelo mental mucho más simple y predecible          |
| **`overrides`**              | Bloques condicionales dentro del objeto                      | Propio `files`/`ignores` por objeto del array                                              | El scoping es el mecanismo principal                 |
| **`extends`**                | Cadena de strings resueltos por Node resolution (`"airbnb"`) | `extends` opcional sobre el mismo merge + imports directos de JS                           | Sin resolución mágica de strings                     |
| **Plugins**                  | Strings: `plugins: ["react"]`                                | **Objetos importados**: `plugins: { react }`                                               | Tree-shakeable, sin `--resolve-plugins-relative-to`  |
| **Parsers**                  | String: `parser: "@babel/eslint-parser"`                     | Objeto: `languageOptions: { parser: babelParser }`                                         | Idem plugins                                         |
| **Environments**             | `env: { browser: true, node: true }`                         | **No existe `env`**: `languageOptions.globals: { ...globals.browser }` (paquete `globals`) | El paquete `globals` es la fuente canónica           |
| **Globals**                  | `globals: { window: false }`                                 | `languageOptions.globals: { window: 'readonly' }`                                          | Booleanos deprecados; usar strings                   |
| **`parserOptions`**          | Clave de primer nivel junto a `parser`                       | Anidado en `languageOptions.parserOptions`                                                 | `ecmaVersion`/`sourceType` suben a `languageOptions` |
| **Ignore files**             | Archivo `.eslintignore` o `ignorePatterns`                   | `globalIgnores()` / objeto solo-`ignores` / `--ignore-pattern`                             | `.eslintignore` ya no se soporta en v9               |
| **Ignore por config**        | `ignorePatterns`                                             | `ignores` por objeto (local) o global                                                      | Los globales matchean directorios                    |
| **Config en `package.json`** | Sí (`eslintConfig`)                                          | **Eliminado**                                                                              |                                                      |
| **`--env` CLI**              | Existía                                                      | Eliminado                                                                                  | Usar `globals`                                       |
| **Procesadores**             | Auto-config por extensión (`.md`)                            | **Siempre explícito** `processor: "plugin/proc"`                                           |                                                      |
| **Linter options**           | `reportUnusedDisableDirectives` en config o CLI              | Objeto `linterOptions` (+ `noInlineConfig`, `reportUnusedInlineConfigs`)                   |                                                      |
| **Orden/prioridad**          | Subida por carpetas; el más cercano gana                     | **Último elemento del array que define la regla gana** + inline comments encima            |                                                      |
| **Validación/ergonomía**     | Silenciosa en muchos errores                                 | `defineConfig()` valida; **Config Inspector** y `--print-config` visuales                  | Mejor DX                                             |
| **TypeScript**               | `extends: "plugin:@typescript-eslint/recommended"`           | Import del módulo; `eslint.config.ts` soportado nativamente                                |                                                      |
| **Migración**                | —                                                            | `npx @eslint/migrate-config .eslintrc.json`                                                | Herramienta oficial                                  |
| **Velocidad**                | Resolución de cascada + Node resolution                      | Sin cascada: evaluación lineal de un array                                                 | Más rápido y cacheable                               |

### 5.1 Equivalencias rápidas (cheat sheet de migración)

```js
// .eslintrc.js (legacy)              →   // eslint.config.js (flat)
{
  root: true,                            //   (innecesario — un solo archivo)
  env: { browser: true, node: true },    //   languageOptions: { globals: { ...globals.browser, ...globals.node } }
  extends: ["eslint:recommended"],       //   import js from '@eslint/js' → js.configs.recommended
  parserOptions: { ecmaVersion: 2022,
                   sourceType: "module",
                   ecmaFeatures: { jsx: true } },
                                         //   languageOptions: { ecmaVersion, sourceType,
                                         //                     parserOptions: { ecmaFeatures: { jsx: true } } }
  plugins: ["react"],                    //   import react from 'eslint-plugin-react';
                                         //   plugins: { react }
  overrides: [{ files: ["**/*.test.js"],
                env: { jest: true } }],  //   { files: ['**/*.test.js'],
                                         //     languageOptions: { globals: { ...globals.jest } } }
  rules: { eqeqeq: "error" },            //   rules: { eqeqeq: 'error' }
  ignorePatterns: ["dist/"],             //   { ignores: ['dist/'] }  |  globalIgnores(['dist/'])
}
```

---

## 6. Referencias oficiales

- Configuración flat (archivos de configuración): <https://eslint.org/docs/latest/use/configure/configuration-files>
- Opciones de lenguaje (`languageOptions`, globals): <https://eslint.org/docs/latest/use/configure/language-options>
- Reglas (severidades, opciones, inline config): <https://eslint.org/docs/latest/use/configure/rules>
- Plugins: <https://eslint.org/docs/latest/use/configure/plugins>
- Ignorar archivos (`ignores`, `globalIgnores`): <https://eslint.org/docs/latest/use/configure/ignore>
- Parser: <https://eslint.org/docs/latest/use/configure/parser>
- Combinar configs: <https://eslint.org/docs/latest/use/configure/combine-configs>
- Debug de la configuración: <https://eslint.org/docs/latest/use/configure/debug>
- Guía de migración `.eslintrc` → flat: <https://eslint.org/docs/latest/use/configure/migration-guide>
- Referencia de reglas del core: <https://eslint.org/docs/latest/rules/>
- CLI (flags: `--max-warnings`, `--rule`, `--ignore-pattern`, `--report-unused-disable-directives`): <https://eslint.org/docs/latest/use/command-line-interface>
- Extensión: crear plugins, procesadores, lenguajes: <https://eslint.org/docs/latest/extend/ways-to-extend>
- ESLint Config Inspector: <https://github.com/eslint/config-inspector>
- Prettier + ESLint: <https://prettier.io/docs/en/install.html>
- `globals` (npm): <https://www.npmjs.com/package/globals>
- Blog: _New Config System_ (parte 1 y 2): <https://eslint.org/blog/2022/08/new-config-system-part-2/>

### Documentación interna relacionada

- [docs/code-style.md](../code-style.md) — política de formato, lint-staged y línea de defensa CRLF.
- [docs/learning/eslint-complexity-configuration.md](eslint-complexity-configuration.md) — umbrales de complejidad por capa, `max-lines-per-function` sin patrón de exención interno, y wiring e2e lint.
- [docs/testing-architecture.md](../testing-architecture.md) — arquitectura de tests (Vitest/Playwright) que motivan los globals de test.
- `.github/workflows/ci.yml` — jobs `client-lint`, `server-lint`, `e2e-lint`, `*-complexity`.
