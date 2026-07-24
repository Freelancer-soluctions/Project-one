## Context

El monorepo Project One utiliza npm workspaces nativos (sin pnpm ni Yarn) para gestionar tres workspaces: `apps/client` (client-react, ESM), `apps/server` (server-express, ESM — verificado en `apps/server/package.json` linea 6 `"type": "module"`), y `e2e` (e2e, CommonJS). Los workspaces se declaran en el `package.json` raíz mediante `"workspaces": ["apps/*", "e2e"]`.

Una investigación documentada en `docs/workspaces.md` §9 identificó 13 gaps en la configuración actual. Los 3 críticos afectan el determinismo del lockfile, la previsibilidad del hoisting, y la experiencia del desarrollador. Este diseño cubre las correcciones de los 7 gaps que requieren cambios de código/configuración (más un gap de documentación).

### Arquitectura actual

```
project-one/
├── package.json          # Raíz: workspaces, scripts, devDeps compartidas
├── (falta .npmrc)
├── package-lock.json     # Lockfile único (pero e2e/ tiene otro)
├── apps/
│   ├── client/package.json   # client-react (ESM)
│   └── server/package.json   # server-express (ESM)
└── e2e/
    ├── package.json          # e2e (CommonJS, sin "private": true)
    ├── package-lock.json     # GAP: lockfile anidado
    └── node_modules/         # GAP: node_modules anidado
```

### Restricciones técnicas

- **npm workspaces nativos**: NO se usa pnpm ni Yarn. npm NO soporta el protocolo `workspace:*`. Las dependencias entre workspaces se declaran con `file:`.
- **ESM + CommonJS coexistiendo**: raíz, client y server son ESM (`"type": "module"` — server confirmado en `apps/server/package.json:6`); e2e es CommonJS. No cambiar esto en este cambio.
- **Node.js >= 20.0.0**: El proyecto requiere Node 20+ (por las features y el soporte LTS).

## Goals / Non-Goals

**Goals:**
1. Restaurar el modelo single-lockfile eliminando `e2e/package-lock.json` y cualquier otro lockfile anidado.
2. Configurar npm en la raíz mediante `.npmrc` para hoisting predecible (`save-exact=true`, `engine-strict=true`).
3. Añadir scripts `dev`, `dev:client`, `dev:server` en la raíz usando `concurrently` para levantar client + server en paralelo.
4. Añadir `engines` en raíz y todos los workspaces para acotar Node >=20.0.0 y npm >=10.0.0.
5. Añadir `"private": true` a `e2e/package.json`.
6. Migrar scripts raíz (`build`) a `--workspaces --if-present` para auto-detección de workspaces.
7. Documentar la decisión ESM vs CommonJS.
8. (Condicional) Añadir dependencias `file:` en e2e si importa módulos de client/server.

**Non-Goals:**
- Migrar a pnpm/Yarn ni usar protocolo `workspace:*`.
- Cambiar la ubicación de `e2e/` a `apps/e2e/`.
- Modificar los `tsconfig.json` ni alinear TypeScript Project References.
- Cambiar `"type": "module"` en ningún workspace.
- Crear un paquete `@project-one/shared` (requiere diseño aparte).
- Refactorizar los scripts existentes de test (ya usan `--workspaces` correctamente).

## Decisions

### D1: Protocolo `file:` para dependencias entre workspaces

**Contexto:** npm workspaces nativos NO soportan el protocolo `workspace:*` (es exclusivo de pnpm/Yarn).

**Decisión:** Usar `file:` con rutas relativas para cualquier dependencia entre workspaces.

**Ejemplo:**
```json
{
  "dependencies": {
    "@project-one/client": "file:../apps/client",
    "@project-one/server": "file:../apps/server"
  }
}
```

**Alternativa considerada:** Usar rutas que npm resuelva vía hoisting. Se descarta porque no es explícito y puede romperse si el hoisting cambia.

**Riesgo:** El nombre en `file:` debe coincidir con el campo `"name"` del workspace destino. `client-react` y `server-express` son los nombres reales. Se debe verificar antes de implementar.

### D2: `concurrently` para scripts dev paralelos

**Contexto:** Necesitamos un script `dev` en la raíz que levante client (Vite) y server (nodemon) simultáneamente.

**Decisión:** Usar `concurrently` como devDependency en la raíz.

```json
"scripts": {
  "dev": "concurrently -n client,server -c cyan,green \"npm run dev --workspace=client-react\" \"npm run dev --workspace=server-express\"",
  "dev:client": "npm run dev --workspace=client-react",
  "dev:server": "npm run dev --workspace=server-express"
}
```

**Alternativa considerada:** `npm-run-all` (más ligero, menos dependencias). Se prefiere `concurrently` porque tiene mejor output con prefijos de color y nombres de proceso, lo que mejora la UX en desarrollo.

**Riesgo:** `concurrently` es una dependencia más. Si el proyecto ya tiene `concurrently` instalado en algún workspace o como hoisted dep, se reutiliza. Verificar antes de instalar.

### D3: `.npmrc` con `engine-strict=true`

**Contexto:** Sin `.npmrc`, npm usa comportamiento por defecto que no fuerza `save-exact=true`, no valida engines, y tiene defaults que pueden cambiar entre versiones de npm.

**Decisión:** Crear `.npmrc` en la raíz con:
```ini
save-exact=true
legacy-peer-deps=false
engine-strict=true
workspaces-update=true
include-workspace-root=true
fund=false
audit-level=moderate
```

- `save-exact=true`: Todas las instalaciones guardan versiones exactas (sin ^), lockfile más determinista.
- `engine-strict=true`: npm rechaza instalación si la versión de Node/npm no cumple `engines`. Requiere que todos los package.json tengan `engines` definido.
- `legacy-peer-deps=false`: Usar resolución estricta de peer deps (default recomendado).
- `fund=false`: Silencia mensajes de npm fund.
- `audit-level=moderate`: No falla en audit de baja severidad.

### D4: Scripts raíz a `--workspaces --if-present`

**Contexto:** El script `build` raíz actualmente orquesta manualmente (`npm run build --workspace=client-react && npm run build --workspace=server-express`). Si se añade un workspace, el script debe editarse.

**Decisión:** Cambiar a:
```json
"build": "npm run build --workspaces --if-present"
```
Esto ejecuta `build` en todos los workspaces que tengan el script definido, ignorando los que no. El flag `--if-present` evita errores si un workspace no tiene script `build` (como `e2e` o `server`).

### D5: Engines versionados

**Contexto:** Sin `engines`, cualquier versión de Node/npm puede usarse, causando builds inconsistentes.

**Decisión:** Añadir en raíz y cada workspace:
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

Node >=20.0.0 es la LTS actual y requerida por las herramientas del proyecto. npm >=10.0.0 es la versión incluida con Node 20+.

### D6: Documentación ESM/CJS

**Contexto:** Raíz, client y server son ESM (`"type": "module"` — server confirmado en `apps/server/package.json:6`); e2e es CommonJS. No hay documentación de esta decisión.

**Decisión:** Añadir una sección en `docs/workspaces.md` (o `docs/architecture.md`) explicando:
- Raíz: ESM (necesario para que los scripts de build/test usen `import`)
- Client: ESM (Vite/React requieren ESM)
- Server: ESM (`"type": "module"`declarado en `apps/server/package.json:6`; necesario para usar `import` y compatibilidad con Prisma ES module build)
- E2E: CommonJS (Playwright config usa `require`)
- Estrategia de interop: e2e puede importar módulos ESM vía `import()` dinámico

## Risks / Trade-offs

- **[R1] Migración a `--workspaces --if-present` puede cambiar orden de build**: Actualmente `build` ejecuta client y server secuencialmente. Con `--workspaces`, el orden es indeterminado (workspaces se ejecutan en orden de descubrimiento). Si `build` de client depende del de server (o viceversa), puede romperse. Mitigación: Verificar que `build` de client y server no dependen el uno del otro. Si dependen, mantener el orden explícito.
- **[R2] `engine-strict=true` puede bloquear instalaciones en Node <20**: Desarrolladores con Node 18 o inferior no podrán ejecutar `npm install`. Mitigación: Documentar el requisito de Node 20+ en el README y en el mensaje de error de npm.
- **[R3] `save-exact=true` cambia el comportamiento de instalación**: Nuevas instalaciones guardarán versiones exactas (ej. `1.2.3` en vez de `^1.2.3`). Esto puede causar sorpresas si alguien espera rangos semver. Mitigación: Documentar en `.npmrc` y en `docs/workspaces.md`.
- **[R4] `e2e/package-lock.json` puede contener dependencias únicas**: Si algún paquete solo existe en el lockfile anidado (no en el raíz), eliminarlo puede romper algo. Mitigación: Comparar contenido antes de eliminar. Reinstalar desde raíz des
