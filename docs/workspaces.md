# Workspaces

> Documentación técnica sobre la configuración, funcionamiento y finalidad de npm workspaces en el monorepo Project One.

## Tabla de contenidos
- [1. ¿Qué son los npm workspaces?](#1-qué-son-los-npm-workspaces)
- [2. ¿Por qué usamos workspaces?](#2-por-qué-usamos-workspaces)
- [3. Configuración actual](#3-configuración-actual)
- [4. Cómo funciona el hoisting](#4-cómo-funciona-el-hoisting)
- [5. Comandos disponibles](#5-comandos-disponibles)
- [6. Flujo de instalación](#6-flujo-de-instalación)
- [7. Resolución de dependencias](#7-resolución-de-dependencias)
- [8. Dependencias entre workspaces](#8-dependencias-entre-workspaces)
- [9. Gaps y limitaciones actuales](#9-gaps-y-limitaciones-actuales)
- [10. Recomendaciones](#10-recomendaciones)
- [11. Troubleshooting](#11-troubleshooting)
- [12. Cómo añadir un nuevo workspace](#12-cómo-añadir-un-nuevo-workspace)
- [13. Referencias](#13-referencias)
- [14. ESM vs CommonJS](#14-esm-vs-commonjs)

---

## 1. ¿Qué son los npm workspaces?

**npm workspaces** es una funcionalidad nativa de npm (desde v7, estable en v8+) que permite gestionar múltiples paquetes dentro de un único repositorio (monorepo) usando **un solo lockfile** (`package-lock.json` en la raíz) y una única instalación de dependencias.

### Modelo de un solo lockfile
- Ejecutas `npm install` **una sola vez** en la raíz.
- Se genera **un único** `package-lock.json` en la raíz del monorepo.
- Todas las dependencias de todos los workspaces se resuelven juntas, permitiendo deduplicación máxima.

### Hoisting automático
npm "hoistea" (eleva) las dependencias compartidas al `node_modules` de la raíz. Las dependencias exclusivas de un workspace permanecen en su propio `node_modules`.

### Protocolo de dependencias entre workspaces
> **Crítico:** **npm NO soporta el protocolo `workspace:*`** — ese protocolo es exclusivo de **pnpm** y **Yarn**. En npm workspaces nativos, las dependencias entre workspaces se declaran con el protocolo **`file:`** o rutas relativas, por ejemplo:
> ```json
> "@project-one/client": "file:../client"
> ```

### Contraste rápido
| Característica | npm workspaces | pnpm workspaces | Yarn workspaces |
|---|---|---|---|
| Lockfile único | ✅ Sí | ✅ Sí | ✅ Sí |
| Protocolo `workspace:*` | ❌ No | ✅ Sí | ✅ Sí |
| Protocolo `file:` | ✅ Sí | ✅ Sí | ✅ Sí |
| Aislamiento estricto (node_modules) | ❌ No (hoisting laxo) | ✅ Sí (hard links) | ⚠️ Parcial (plug'n'play) |
| Herramienta externa requerida | ❌ No | ❌ No (pero pnpm CLI) | ✅ Yarn CLI |

---

## 2. ¿Por qué usamos workspaces?

Project One adopta npm workspaces por las siguientes razones, alineadas con la estructura del monorepo (`apps/client`, `apps/server`, `e2e`):

| Beneficio | Cómo se aplica en Project One |
|---|---|
| **Un solo `npm install`** | Un comando en la raíz instala dependencias de `apps/client`, `apps/server` y `e2e` de una vez. |
| **Un solo lockfile** | `package-lock.json` único en la raíz garantiza builds reproducibles en CI/CD. |
| **Hoisting de `devDependencies` compartidas** | TypeScript, ESLint, Prettier, Vitest, Playwright, Husky, etc., se instalan una sola vez en la raíz y se comparten. |
| **Enlace local de paquetes internos** | Posibilidad de usar `file:../client` para que `e2e` importe directamente de `client`/`server` sin publicar a npm. |
| **Orquestación de scripts cross-workspace** | Flags `--workspace`, `--workspaces`, `--if-present` permiten lanzar tests, builds, lint en todos los workspaces o en uno específico desde la raíz. |
| **Flujo de CI unificado** | Un solo `npm ci` en la raíz instala todo; los pipelines de CI no necesitan múltiples pasos de instalación. |
| **Cero dependencias externas de tooling** | No requiere Lerna, Turborepo, Nx, pnpm ni Yarn — solo npm nativo (incluido en Node.js). |

---

## 3. Configuración actual

### 3.1 Raíz: `package.json` (`C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\package.json`)

```json
{
  "name": "project-one",
  "type": "module",
  "private": true,
  "workspaces": [
    "apps/*",
    "e2e"
  ],
  "scripts": {
    "prepare": "husky",
    "husky:disable": "ren .husky .husky.disabled",
    "husky:enable": "ren .husky.disabled .husky",
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "npm run test:unit --workspaces --if-present",
    "test:integration": "npm run test:integration --workspaces --if-present",
    "test:e2e": "npm run test --workspace=e2e",
    "test:watch": "npm run test:watch --workspaces --if-present",
    "test:changed": "npm run test:changed --workspaces --if-present",
    "test:ci": "npm run test --workspaces --if-present -- --reporter=junit",
    "test:server": "npm run test --workspace=server-express",
    "test:client": "npm run test --workspace=client-react"
  }
}
```

**Observaciones clave:**
- `"workspaces": ["apps/*", "e2e"]` usa un **glob** (`apps/*`) para `client` y `server`, más una entrada explícita `e2e` (ubicada en la raíz, no en `apps/e2e`).
- `"private": true` está presente — **buena práctica** para evitar `npm publish` accidental.
- `"type": "module"` está declarado en la raíz — **ESM nativo** para el monorepo.
- **NO hay** scripts `dev`, `dev:client`, `dev:server` en la raíz (gap UX documentado en §9).
- Los scripts de test usan flags `--workspaces`, `--workspace=<name>`, `--if-present` — **correcto**.

### 3.2 Workspace: `apps/client` (`apps/client/package.json`)

```json
{
  "name": "client-react",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:watch": "vitest",
    "test:changed": "vitest run --changed",
    "test:coverage": "vitest run --coverage",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

- **Nombre del workspace:** `client-react` (referenciado en root scripts como `--workspace=client-react`).
- `private: true` — correcto.
- `type: "module"` — ESM.

### 3.3 Workspace: `apps/server` (`apps/server/package.json`)

```json
{
  "name": "server-express",
  "version": "1.0.0",
  "description": "Back-end application with good practices using node.js and express",
  "main": "index.js",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "scripts": {
    "dev": "nodemon src/bin/index.js",
    "build": "echo 'No build step needed for Express'",
    "postinstall": "prisma generate ",
    "prisma-migration": "prisma migrate dev",
    "prisma-seed": "prisma db seed",
    "prisma-push": "prisma db push",
    "prisma-pull": "prisma db pull",
    "test": "npm run test:unit && npm run test:integration",
    "test:watch": "vitest --watch",
    "test:unit": "vitest run \".unit.test.js\"",
    "test:integration": "vitest run \".integration.test.js\"",
    "test:changed": "vitest run --changed",
    "test:coverage": "vitest run --coverage",
    "format": "prettier --write \"**/*.{js,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,json,md}\"",
    "lint": "eslint \"**/*.js\"",
    "lint:fix": "eslint \"**/*.js\" --fix"
  },
  "author": "Johan Garcia",
  "license": "ISC",
  "dependencies": { ... },
  "devDependencies": { ... },
  "eslintConfig": {
    "extends": "./node_modules/standard/eslintrc.json"
  }
}
```

- **Nombre del workspace:** `server-express` (referenciado en root scripts como `--workspace=server-express`).
- **TIENE** `"type": "module"` (línea 6 de `apps/server/package.json`) — usa **ESM** (`import`/`export`).
- `private: true` — correcto.

### 3.4 Workspace: `e2e` (`e2e/package.json`)

```json
{
  "name": "e2e",
  "version": "1.0.0",
  "main": "playwright.config.js",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2"
  }
}
```

- **Ubicación:** raíz del monorepo (`e2e/`), **NO** en `apps/e2e/`.
- **Nombre del workspace:** `e2e` (referenciado en root scripts como `--workspace=e2e`).
- **FALTA** `"private": true` — **gap documentado en §9**.
- **FALTA** `"type": "module"` — usa CommonJS por defecto.
- **TIENE** `e2e/package-lock.json` — **GAP CRÍTICO** documentado en §9 (duplicación de lockfile).

### 3.3 Resumen de workspaces descubiertos

| Workspace | Ruta | `name` en package.json | `private` | `type` |
|---|---|---|---|---|
| Client | `apps/client/` | `client-react` | ✅ true | `module` (ESM) |
| Server | `apps/server/` | `server-express` | ✅ true | `module` (ESM) |
| E2E | `e2e/` | `e2e` | ❌ **falta** | (CommonJS) |

---

## 4. Cómo funciona el hoisting

### Modelo de hoisting de npm
Cuando ejecutas `npm install` en la raíz:

1. **Resolución unificada**: npm resuelve **todas** las dependencias de **todos** los workspaces en una sola pasada, produciendo un único `package-lock.json` en la raíz.
2. **Hoisting a la raíz**: Las dependencias que comparten **la misma versión** entre dos o más workspaces se "hoistean" (copian/enlazan) al `node_modules` de la **raíz** del monorepo.
3. **Dependencias exclusivas**: Las dependencias que solo usa un workspace (o que tienen versiones conflictivas) se quedan en `apps/<workspace>/node_modules/`.
4. **Estructura resultante**:
   ```
   project-one/
   ├── node_modules/           # ← Dependencias hoisteadas (compartidas)
   │   ├── typescript/
   │   ├── eslint/
   │   ├── vitest/
   │   └── @playwright/test/
   ├── package-lock.json       # ← ÚNICO lockfile
   ├── apps/
   │   ├── client/
   │   │   └── node_modules/   # ← Solo deps exclusivas de client
   │   └── server/
   │       └── node_modules/   # ← Solo deps exclusivas de server
   └── e2e/
       └── node_modules/       # ← Solo deps exclusivas de e2e
           └── @playwright/
   ```

### Beneficios del hoisting
- **Ahorro de espacio en disco**: Una sola copia de `typescript`, `eslint`, `vitest`, etc.
- **Instalación más rápida**: Una sola resolución de árbol de dependencias.
- **Consistencia**: Mismas versiones de herramientas compartidas en todo el monorepo.

### Riesgo: **Phantom dependencies** (dependencias fantasma)
Como npm **no aísla estrictamente** `node_modules` por workspace (a diferencia de pnpm), un workspace puede `require`/`import` un paquete que **no declara en su propio `package.json`** pero que está hoisteado en la raíz porque otro workspace lo usa.

> **Ejemplo**: `apps/server` usa `zod`. `apps/client` **no** declara `zod` en su `package.json`. Como `zod` está hoisteado en la raíz, `import { z } from 'zod'` en `client` **funciona en dev** pero **falla en CI/producción** si el hoisting cambia.

**Mitigación:** Declarar **todas** las dependencias directas en el `package.json` del workspace que las usa. No confiar en el hoisting implícito.

### Gap: Ausencia de `.npmrc` en la raíz
Sin `.npmrc`, el hoisting usa **comportamiento por defecto** de npm (sin `legacy-peer-deps`, sin `save-exact`, sin preferencias de hoisting). Ver §9 y §10.

---

## 5. Comandos disponibles

### Tabla de comandos raíz + por workspace

| Comando | Dónde ejecutarlo | Qué hace |
|---|---|---|
| `npm install` | Raíz (`project-one/`) | Instala **todos** los workspaces, genera **un** `package-lock.json` en la raíz, hoistea deps compartidas. |
| `npm ci` | Raíz | Instalación limpia y determinista desde `package-lock.json` raíz (ideal para CI). |
| `npm run build` | Raíz | `npm run build --workspaces --if-present` — ejecuta `build` en **cada workspace** que lo tenga definido. |
| `npm run test` | Raíz | Ejecuta suite completa: unit + integration + e2e (ver scripts root). **Nota:** tests de integración del servidor requieren PostgreSQL corriendo. |
| `npm run test:unit` | Raíz | `npm run test:unit --workspaces --if-present` — corre tests unitarios en **todos** los workspaces que tengan el script. |
| `npm run test:integration` | Raíz | `npm run test:integration --workspaces --if-present` — corre tests de integración en todos los workspaces. |
| `npm run test:e2e` | Raíz | `npm run test --workspace=e2e` — corre **solo** tests e2e (Playwright). |
| `npm run test:watch` | Raíz | Modo watch en todos los workspaces con script `test:watch`. |
| `npm run test:ci` | Raíz | Ejecuta todos los tests con reporter JUnit (CI). |
| `npm run test:server` | Raíz | `npm run test --workspace=server-express` — tests solo del servidor. |
| `npm run test:client` | Raíz | `npm run test --workspace=client-react` — tests solo del cliente. |
| `npm run dev` | Raíz | `concurrently` — levanta **client (Vite) + server (nodemon)** simultáneamente con logs coloreados. |
| `npm run dev:client` | Raíz | `npm run dev --workspace=client-react` — levanta solo el cliente (Vite, puerto 5173). |
| `npm run dev:server` | Raíz | `npm run dev --workspace=server-express` — levanta solo el servidor (nodemon, puerto 4000). |
| `npm run lint` | Raíz | `npm run lint --workspaces --if-present` — ESLint en **todos** los workspaces. |
| `npm run format` | Raíz | `npm run format --workspaces --if-present` — Prettier en **todos** los workspaces. |
| `npm run dev` | `apps/client/` | `vite` — levanta dev server Vite (puerto 5173 por defecto). |
| `npm run dev` | `apps/server/` | `nodemon src/bin/index.js` — levanta Express con hot-reload (puerto 4000 típicamente). |
| `npm run build` | `apps/client/` | `tsc && vite build` — build de producción del cliente. |
| `npm run build` | `apps/server/` | **NO TIENE script `build`** — servidor se ejecuta directo con `dev` o `node`. |
| `npm run test` | `apps/client/` | `vitest run` — tests unitarios cliente. |
| `npm run test` | `apps/server/` | `vitest run` — todos los tests servidor (unit + integration). |
| `npm run test` | `e2e/` | `playwright test` — tests E2E completos. |
| `npm run lint` | `apps/client/` \| `apps/server/` | ESLint en cada workspace. |
| `npm run format` | `apps/client/` \| `apps/server/` | Prettier formateo. |
| `npm run storybook` | `apps/client/` | Storybook dev server (puerto 6006). |

### Flags de npm CLI relevantes para workspaces

| Flag | Uso | Ejemplo |
|---|---|---|
| `--workspace=<name>` / `-w` | Ejecuta el comando **solo** en el workspace nombrado | `npm run test --workspace=server-express` |
| `--workspaces` / `-ws` | Ejecuta el comando en **todos** los workspaces | `npm run lint --workspaces` |
| `--workspaces=all` | Alias de `--workspaces` (explícito) | `npm run build --workspaces=all` |
| `--if-present` | No falla si el workspace no tiene el script | `npm run test:unit --workspaces --if-present` |
| `--ignore-scripts` | Salta scripts `prepare`, `preinstall`, etc. | `npm ci --ignore-scripts` |

> **Nota:** Los scripts de la raíz **ya usan** estos flags correctamente (ver §3.1). La excepción es `npm run build` en la raíz, que **no usa `--workspaces`** y en su lugar orquesta manualmente — ver gap en §9.

---

## 6. Flujo de instalación

### Paso a paso: `npm install` en la raíz

1. **Lee** `package.json` de la raíz → detecta `"workspaces": ["apps/*", "e2e"]`.
2. **Descubre** workspaces: `apps/client`, `apps/server`, `e2e`.
3. **Lee** `package.json` de cada workspace → construye el grafo completo de dependencias.
4. **Resuelve** versiones de forma unificada → genera/actualiza **un único** `package-lock.json` en la raíz.
5. **Descarga** paquetes al cache global de npm (`~/.npm`).
6. **Hoistea** dependencias compartidas al `node_modules` de la raíz.
7. **Crea** `node_modules` en cada workspace **solo** con sus dependencias no hoisteadas (o con versiones conflictivas).
8. **Ejecuta** scripts `prepare`/`postinstall` de cada workspace (ej. `husky` en la raíz).

### ⚠️ No hagas esto
```bash
# MAL — Crea lockfile anidado y rompe el modelo single-lockfile
cd apps/e2e && npm install

# MAL — Duplica node_modules, inconsistencias de versiones
cd apps/client && npm install
```

> **Hecho real en este repo:** `e2e/package-lock.json` existe (2.3 KB) — **evidencia de que alguien corrió `npm install` dentro de `e2e/`**. Ver §9 Gap Crítico #1.

### Flujo correcto para CI
```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci           # Usa lockfile raíz, instalación limpia y determinista
- name: Build
  run: npm run build
- name: Test
  run: npm run test:ci
```

---

## 7. Resolución de dependencias

### Algoritmo de resolución de Node.js + Workspaces
Cuando un módulo en `apps/client/src/App.tsx` hace `import { z } from 'zod'`:

1. Node busca en `apps/client/node_modules/zod` → **no está** (no hoisteado, no declarado en client).
2. Node sube al padre: `apps/node_modules/zod` → **no existe**.
3. Node sube a la raíz: `project-one/node_modules/zod` → **¡está!** (hoisteado porque `server` lo usa).
4. **Resuelve correctamente en dev**, pero **falla en producción/CI** si el hoisting cambia o si `zod` no está en `client/package.json`.

### `devDependencies` compartidas en la raíz
Herramientas de desarrollo (TypeScript, ESLint, Prettier, Vitest, Playwright, Husky, lint-staged) se instalan **una vez** en la raíz y están disponibles en todos los workspaces vía hoisting.

| Herramienta | Declarada en | Disponible en |
|---|---|---|
| `typescript` | Root `devDependencies` (implícito) | Todos |
| `eslint` | Root `devDependencies` | Todos |
| `prettier` | Root `devDependencies` | Todos |
| `vitest` | Root `devDependencies` + `apps/server/devDependencies` | Todos (hoisted) |
| `@playwright/test` | `e2e/devDependencies` | Solo `e2e` (no hoisteado — solo e2e lo usa) |

### Diferencia clave vs pnpm
- **pnpm**: `node_modules` tiene **hard links** al store global + symlinks estrictos por workspace. **Imposible** acceder a dep de otro workspace sin declararla.
- **npm**: `node_modules` es plano en la raíz. **Posible** acceder a dep de otro workspace sin declararla (phantom dep). **Responsabilidad del desarrollador** declarar todo.

---

## 8. Dependencias entre workspaces

### El protocolo `file:` (nativo de npm)
Para que un workspace dependa de otro **sin publicar a npm**, se usa `file:` con ruta relativa:

```json
// e2e/package.json (ejemplo propuesto)
{
  "name": "e2e",
  "dependencies": {
    "@project-one/client": "file:../apps/client",
    "@project-one/server": "file:../apps/server"
  }
}
```

> **Regla:** La ruta en `file:` es **relativa al package.json que la declara** (aquí `e2e/` → `../apps/client`).

### Estado actual en Project One
**NO hay dependencias `file:` declaradas.** El workspace `e2e` (Playwright) **testea los artefactos construidos/servidores corriendo** (puertos 3000/4000), **no importa código fuente** de `client` ni `server` directamente.

| Workspace | Depende de | Mecanismo actual | ¿Debería usar `file:`? |
|---|---|---|---|
| `e2e` → `client` | UI construida + servidor dev | `baseURL: http://localhost:3000` en Playwright | **Opcional** — si tests E2E importan utils/types de client, sí. |
| `e2e` → `server` | API corriendo | `API_URL: http://localhost:4000` | **Opcional** — si tests E2E importan tipos DTO/validación, sí. |
| `client` → `server` | API types, schemas | **Ninguno** (duplicación manual o fetch runtime) | **Sí recomendado** — compartir tipos Zod/DTOs via `file:../server` o paquete compartido. |

### Cuándo usar `file:` vs testear contra artefactos
| Escenario | Recomendación |
|---|---|
| Compartir **tipos TypeScript**, schemas Zod, constantes, utilidades puras | `file:../shared` o `file:../server` — evita duplicación y drift. |
| Tests E2E que **solo hacen peticiones HTTP** a servidores corriendo | **No** usar `file:` — testea la API real (contrato). |
| Tests E2E que **importan componentes React** para testing unitario de UI | Usar `file:../client` (o mover componentes a paquete compartido). |
| Build de producción | Publicar paquetes internos a registry privado (npm/GitHub Packages) y usar `workspace:*` en pnpm/Yarn, o version fija en npm. |

---

## 9. Gaps y limitaciones actuales

Basado en la investigación (hallazgos § Crítico/Importante/Mejora opcional), aquí el catálogo completo con **rutas exactas**.

### 🔴 Crítico

| # | Gap | Archivo/Ubicación | Impacto | Solución |
|---|---|---|---|---|
| 1 | **`e2e/package-lock.json` existe** (2.3 KB) — duplica el lockfile raíz, rompe modelo single-lockfile. | `e2e/package-lock.json` | Instalaciones no deterministas; `npm ci` en raíz no limpia el lockfile anidado; posibles versiones divergentes. | ✅ **RESUELTO en change fix-workspaces-gaps:** Eliminado `e2e/package-lock.json` y `e2e/node_modules`, regenerado lockfile único con `npm install` en raíz. |
| 2 | **Sin `.npmrc` en la raíz** — hoisting sin configuración explícita. | (archivo inexistente) | Comportamiento por defecto de npm: sin `save-exact`, sin `legacy-peer-deps`, hoisting impredecible entre versiones de npm. | ✅ **RESUELTO en change fix-workspaces-gaps:** Creado `.npmrc` en raíz con `save-exact=true`, `engine-strict=true`, `workspaces-update=true`, `include-workspace-root=true`, `fund=false`, `audit-level=moderate`, `legacy-peer-deps=false`. |
| 3 | **Sin scripts `dev`, `dev:client`, `dev:server` en raíz** — UX pobre para levantar entorno de desarrollo. | `package.json` (raíz), scripts | Desarrollador debe `cd apps/client && npm run dev` y `cd apps/server && npm run dev` en terminales separadas. | ✅ **RESUELTO en change fix-workspaces-gaps:** Añadidos scripts `dev`, `dev:client`, `dev:server` en raíz con `concurrently` como devDependency. |

### 🟠 Importante

| # | Gap | Archivo/Ubicación | Impacto | Solución |
|---|---|---|---|---|
| 4 | **Sin campo `engines`** en ningún `package.json` — versiones Node/npm no acotadas. | `package.json` (raíz), `apps/client/package.json`, `apps/server/package.json`, `e2e/package.json` | Builds inconsistentes entre máquinas/CI; actualizaciones de Node rompen builds silenciosamente. | ✅ **RESUELTO en change fix-workspaces-gaps:** Añadido `"engines": { "node": ">=20.0.0", "npm": ">=10.0.0" }` en todos los `package.json`. Con `.npmrc` `engine-strict=true`, npm validará en install. |
| 5 | **`e2e` no formaliza dependencia hacia `client`/`server` con `file:`**. | `e2e/package.json` | Imposible importar tipos/utils compartidos desde E2E; acoplamiento solo por puertos de red. | ✅ **Investigado en change fix-workspaces-gaps — no aplica:** `e2e/` no importa código de `client-react` ni `server-express` (solo levanta dev servers vía `playwright.config.js` con `npm run dev --workspace=...`). No se requieren deps `file:`. |
| 6 | **Sin `type: "module"` documentado/uniforme** — root, client y server son ESM (`apps/server/package.json:6` declara `"type": "module"`), solo e2e es CommonJS. | `package.json` (raíz, client, server, e2e) | Confusión al importar entre workspaces; `import` vs `require` mixing. | Pendiente: documentar decisión; considerar migrar e2e a ESM o usar `.cjs`/`.mjs`. |
| 7 | **Root `package.json` sin `"private": true` explícito** (está presente, ver §3.1 — **NOTA: en este repo SÍ está**, pero se documenta como gap genérico). | `package.json` (raíz) | Riesgo de `npm publish` accidental si se quita. | Verificar que `"private": true` permanezca. |
| 8 | **Scripts raíz `build` no usan `--workspaces`** — orquesta manualmente cada workspace. | `package.json` (raíz), script `build` | Mantenimiento manual; si se añade workspace, hay que editar script raíz. | ✅ **RESUELTO en change fix-workspaces-gaps:** Script `build` en raíz ya usa `"npm run build --ws --if-present"` (equivalente a `--workspaces --if-present`). |

> **Nota sobre Gap #7**: En este repositorio **sí existe** `"private": true` en el root `package.json` (línea 16). Se incluye en la tabla como referencia del hallazgo original, pero **no aplica como gap real aquí**.

### 🟡 Mejora opcional

| # | Gap | Archivo/Ubicación | Acción sugerida |
|---|---|---|---|
| 9 | Sin alineación documentada de **TypeScript Project References** con workspaces. | `tsconfig.json` (raíz y workspaces) | Documentar si se usa `references` en `tsconfig.json` raíz apuntando a `apps/*/tsconfig.json`. |
| 10 | Sin rationale documentado para **glob `apps/*` vs array explícito** `["apps/client", "apps/server"]`. | `package.json` (raíz), campo `workspaces` | Añadir comentario en `package.json` o documentar aquí. |
| 11 | Sin sección de **troubleshooting** previa en docs del repo. | (Ninguna) | Este documento cubre el gap (§11). |
| 12 | Sin **workflow documentado** para añadir un nuevo workspace. | (Ninguno) | Este documento cubre el gap (§12). |
| 13 | Ubicación de `e2e` en raíz (`e2e/`) vs `apps/e2e/` **no documentada**. | Estructura de carpetas | Documentar decisión: E2E es "cross-cutting", no una "app" más. |

---

## 10. Recomendaciones

### 10.1 Crear `.npmrc` en la raíz (Gap #2)
```ini
# C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\.npmrc
# Hoisting y lockfile
save-exact=true
legacy-peer-deps=false
strict-peer-dependencies=false

# Workspaces
workspaces-update=true
include-workspace-root=true

# Rendimiento
prefer-offline=false
audit-level=moderate
fund=false

# Engine strict (requiere engines en package.json)
engine-strict=true
```

### 10.2 Añadir `engines` a todos los `package.json` (Gap #4)
```json
// En CADA package.json (raíz, apps/client, apps/server, e2e)
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

### 10.3 Scripts de desarrollo en la raíz (Gap #3)
**Opción A — `concurrently` (recomendada):**
```bash
npm install -D concurrently -w .
```
```json
// package.json (raíz)
"scripts": {
  "dev": "concurrently \"npm run dev --workspace=client-react\" \"npm run dev --workspace=server-express\"",
  "dev:client": "npm run dev --workspace=client-react",
  "dev:server": "npm run dev --workspace=server-express"
}
```

**Opción B — `npm-run-all` (más ligero):**
```bash
npm install -D npm-run-all -w .
```
```json
"scripts": {
  "dev": "npm-run-all --parallel dev:*",
  "dev:client": "npm run dev --workspace=client-react",
  "dev:server": "npm run dev --workspace=server-express"
}
```

### 10.4 Eliminar `e2e/package-lock.json` y reinstalar (Gap #1)
```bash
# Desde la raíz del monorepo
rm -rf e2e/node_modules e2e/package-lock.json
npm install
```

### 10.5 Usar `--workspaces` en script `build` raíz (Gap #8)
```json
// package.json (raíz) - ANTES
"build": "npm run build --workspace=client-react && npm run build --workspace=server-express"

// DESPUÉS (auto-detecta workspaces con script build)
"build": "npm run build --workspaces --if-present"
```

### 10.6 Wiring `file:` para e2e si se comparten tipos (Gap #5)
```json
// e2e/package.json
{
  "name": "e2e",
  "private": true,
  "dependencies": {
    "@project-one/client": "file:../apps/client",
    "@project-one/server": "file:../apps/server"
  }
}
```
> **Nota:** Los nombres `@project-one/client` y `@project-one/server` deben coincidir con el campo `"name"` en los respectivos `package.json` (`client-react`, `server-express`). Alternativamente, usa los nombres exactos o crea un paquete `@project-one/shared` para tipos comunes.

### 10.7 Añadir `"private": true` a `e2e/package.json` (Gap #7 aplicado a e2e)
```json
// e2e/package.json
{
  "name": "e2e",
  "private": true,
  ...
}
```

### 10.8 Documentar decisión de ESM vs CommonJS (Gap #6)
Añadir en `docs/architecture.md` o aquí una sección explicando:
- Root: ESM (`"type": "module"`)
- Client: ESM (`"type": "module"`)
- Server: CommonJS (sin `"type"`)
- E2E: CommonJS (sin `"type"`)
- Estrategia de interop: `.js` en server usa `require`, client usa `import`. Si server migra a ESM, renombrar a `.mjs` o añadir `"type": "module"`.

---

## 11. Troubleshooting

### Problema: `Error: Cannot find module 'X'` / `Module not found: Error: Can't resolve 'X'`
**Causa:** **Phantom dependency** — el módulo `X` está hoisteado en la raíz porque otro workspace lo usa, pero **este workspace no lo declara en su `package.json`**.

**Solución:**
```bash
# En el workspace que falla
npm install X --save        # o --save-dev si es herramienta de dev
# O manualmente en package.json
"dependencies": { "X": "^1.0.0" }
```
Luego `npm install` en la raíz.

---

### Problema: `npm ci` falla o `package-lock.json` tiene conflictos / versiones divergentes
**Causa:** Existe un **lockfile anidado** (ej. `e2e/package-lock.json`) o se corrió `npm install` dentro de un workspace.

**Solución:**
```bash
# Desde la raíz
rm -rf e2e/node_modules e2e/package-lock.json
# Repite para cualquier apps/*/node_modules y package-lock.json anidados
npm install
```

---

### Problema: Dos workspaces necesitan versiones diferentes de la misma dependencia
**Comportamiento npm:** Hoistea la versión **compatible** (la más alta que satisface ambos rangos) a la raíz. La versión incompatible se **anida** en el `node_modules` del workspace que la requiere.

**Verificación:**
```bash
npm ls <paquete> --workspaces
# Muestra árbol de dependencias por workspace
```

---

### Problema: `npm run <script>` solo ejecuta el script de la raíz
**Causa:** El script existe en la raíz y en workspaces, pero no usaste flags de workspace.

**Solución:**
```bash
# Ejecutar en TODOS los workspaces que tengan el script
npm run lint --workspaces --if-present

# Ejecutar en UN workspace específico
npm run test --workspace=server-express

# Ejecutar en root Y workspaces
npm run build --workspaces --if-present
```

---

### Problema: `npm ERR! ERESOLVE unable to resolve dependency tree` / Peer dependency conflict
**Causa:** Dependencias de pares (peer deps) con versiones incompatibles entre workspaces.

**Soluciones (orden de preferencia):**
1. **Alinear versiones** en los workspaces afectados (mejor).
2. **Añadir en `.npmrc` raíz:**
   ```ini
   legacy-peer-deps=true
   ```
3. **Usar `overrides` en root `package.json`** (npm 8.3+):
   ```json
   "overrides": {
     "conflicting-package": "version-compatible"
   }
   ```

---

### Problema: Cambios en `node_modules` de un workspace no se reflejan en otro
**Causa:** Son `node_modules` separados (no hoisteado). Cada workspace tiene su propia copia si la versión difiere.

**Verificación:**
```bash
ls -la apps/client/node_modules/<pkg>
ls -la apps/server/node_modules/<pkg>
ls -la node_modules/<pkg>   # raíz
```
Si son carpetas distintas (no symlinks al mismo inode), son copias separadas.

---

## 12. Cómo añadir un nuevo workspace

### Paso a paso

1. **Crear directorio** bajo `apps/` (o raíz si es cross-cutting como `e2e`):
   ```bash
   mkdir apps/nuevo-workspace
   ```

2. **Inicializar `package.json`** dentro del nuevo directorio:
   ```bash
   cd apps/nuevo-workspace
   npm init -y
   ```

3. **Editar `package.json`** con campos obligatorios:
   ```json
   {
     "name": "@project-one/nuevo-workspace",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "...",
       "build": "...",
       "test": "...",
       "lint": "..."
     }
   }
   ```
   - Usa **scope `@project-one/`** para consistencia.
   - `private: true` **obligatorio**.
   - `type: "module"` si usas ESM (recomendado para nuevo código).

4. **Volver a la raíz y instalar**:
   ```bash
   cd ../..
   npm install
   ```
   > npm detecta automáticamente el nuevo workspace vía el glob `apps/*`.

5. **Verificar** que aparece en la lista de workspaces:
   ```bash
   npm ls --workspaces --depth=0
   # Debe mostrar @project-one/nuevo-workspace
   ```

6. **Añadir scripts de raíz** si procede (ej. `dev:nuevo`, `test:nuevo`).

7. **Si depende de un workspace hermano**, usa `file:`:
   ```json
   // apps/nuevo-workspace/package.json
   "dependencies": {
     "@project-one/client": "file:../client"
   }
   ```

8. **NO corras `npm install` dentro del nuevo workspace** — crearía lockfile anidado y `node_modules` duplicado.

---

## 13. Referencias

- **npm Workspaces (oficial):** https://docs.npmjs.com/cli/v10/using-npm/workspaces
- **npm install --workspaces:** https://docs.npmjs.com/cli/v10/commands/npm-install
- **npm run-script --workspace:** https://docs.npmjs.com/cli/v10/commands/npm-run-script
- **Node.js Module Resolution:** https://nodejs.org/api/modules.html#all-together
- **pnpm Workspaces (contraste):** https://pnpm.io/workspaces
- **Yarn Workspaces (contraste):** https://yarnpkg.com/features/workspaces
- **package-lock.json format:** https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json
- **npmrc config:** https://docs.npmjs.com/cli/v10/configuring-npm/npmrc

---

## 14. ESM vs CommonJS

> Documentación de la decisión de sistemas de módulos por workspace y estrategia de interoperabilidad.

### Decisión por workspace

| Workspace | `"type"` en package.json | Sistema | Razón |
|---|---|---|---|
| Raíz | `"module"` | ESM | Scripts de build/test/lint usan `import`. Necesario para ESM en archivos de configuración que el root ejecuta directamente. |
| `apps/client` | `"module"` | ESM | Vite y React requieren ESM. Builds de Vite generan ESM. |
| `apps/server` | `"module"` (línea 6 de `apps/server/package.json`) | ESM | ESM moderno — permite top-level `await`, `import` statements. Compatibilidad con `@prisma/client` ESM build y otros paquetes ESM-only. |
| `e2e` | (sin campo — default) | CommonJS | Playwright config utiliza `require`. CJS es el sistema por defecto cuando no se declara `"type"` en package.json. |

### Estrategia de interoperabilidad

Los workspaces ESM (raíz, client, server) y CJS (e2e) necesitan coexistir. Estrategia:

#### 1. Imports desde CJS a ESM (e2e → client/server)

CommonJS no puede usar `require()` para importar módulos ESM — generaría error `ERR_REQUIRE_ESM`. En su lugar:

```js
// e2e/test/example.spec.js (CommonJS)
const { someExport } = await import('@project-one/client/utils/example.js');
```

Usar `import()` dinámico (retorna una Promise). Disponible en Node >=14.8 y soportado en Playwright test runner.

#### 2. Imports desde ESM a CJS (raíz/client/server → e2e)

ESM puede importar CJS con `import` o `import()`:

```js
// apps/server/src/some-file.js (ESM)
import { someCjsExport } from '../../e2e/some-cjs-module.cjs';
```

Si el módulo CJS exporta con `module.exports`, usar `import` con `default` o `import * as`.

#### 3. Archivos `.cjs` y `.mjs` como escape hatch

Si un workspace necesita scripts en el otro sistema:
- En workspace ESM, archivos `.cjs` se ejecutan como CommonJS.
- En workspace CJS, archivos `.mjs` se ejecutan como ESM.

Ejemplo: en `apps/server` (ESM), un script legacy `prisma/seed.js` puede usar `import` (ESM) o renombrarse a `.cjs` si necesita `require`.

#### 4. Convención: no mezclar dentro del mismo archivo

Cada archivo es ESM **o** CJS — no ambos. La extensión (.js vs .cjs vs .mjs) + el campo `"type"` del package.json lo determina.

### Verificación

Validar la configuración actual:

```bash
# Verificar que root, client, server declaren "type": "module"
grep -l '"type": "module"' package.json apps/client/package.json apps/server/package.json

# Verificar que e2e NO declara "type" (default CJS)
grep -L '"type": "module"' e2e/package.json
```

### Notas

- Esta decisión no se modifica en el change `fix-workspaces-gaps` — se documenta la configuración pre-existente.
- Migrar e2e a ESM requeriría un change separado (implicaría migrar configs/imports de `require` a `import`).
- Para más contexto sobre interop ESM/CJS: [Node.js docs](https://nodejs.org/api/esm.html), [Vite docs](https://vitejs.dev/guide/features.html), [Playwright docs](https://playwright.dev/docs/test-config).

---

*Documento generado basado en la investigación de la configuración real del monorepo Project One (fecha: 2025-07-22).*