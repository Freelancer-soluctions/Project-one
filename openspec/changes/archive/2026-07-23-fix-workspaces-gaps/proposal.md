## Why

El monorepo Project One usa npm workspaces, pero una investigación (`docs/workspaces.md` §9) reveló **13 gaps** (3 críticos, 5 importantes, 5 mejoras opcionales) en la configuración actual. Los gaps críticos incluyen un lockfile anidado (`e2e/package-lock.json`) que rompe el modelo single-lockfile, ausencia de `.npmrc` en la raíz, y falta de scripts de desarrollo `dev`/`dev:client`/`dev:server` en la raíz. Sin estas correcciones, el flujo de desarrollo es frágil, los builds en CI no son deterministas, y la experiencia del desarrollador es pobre.

Este cambio aborda **todos los gaps críticos e importantes** que requieren cambios de código/configuración, más las mejoras opcionales que sean documentación o ajustes triviales.

## What Changes

- **Eliminar `e2e/package-lock.json`** — borrar el lockfile anidado que duplica al raíz y rompe el modelo single-lockfile. Reinstalar desde la raíz. (Gap #1 crítico)
- **Crear `.npmrc` en la raíz** — con `save-exact=true`, `engine-strict=true`, y otras opciones sensatas para hoisting predecible. (Gap #2 crítico)
- **Añadir scripts dev en la raíz** — `dev:client`, `dev:server`, `dev` (concurrente) usando `concurrently`. (Gap #3 crítico)
- **Añadir campo `engines`** — en raíz y cada workspace (`apps/client`, `apps/server`, `e2e`) para fijar Node >=20.0.0 y npm >=10.0.0. (Gap #4 importante)
- **Añadir `"private": true` a `e2e/package.json`** — evitar publicación accidental. (Gap #7 importante, aplicado a e2e)
- **Migrar script `build` raíz a `--workspaces --if-present`** — en lugar de orquestar manualmente cada workspace. (Gap #8 importante)
- **Añadir dependencias `file:` en `e2e/package.json`** — solo si `e2e` importa tipos o módulos de `client`/`server` directamente (requiere investigación durante implementación). (Gap #5 importante)
- **Documentar decisión ESM vs CommonJS** — añadir sección en `docs/workspaces.md` o `docs/architecture.md`. (Gap #6 importante — documentación)

**Queda FUERA del alcance** (ya resuelto en docs/workspaces.md o requiere decisión separada):
- Sección de troubleshooting (§11) y workflow de nuevo workspace (§12) — ya documentados en `docs/workspaces.md`.
- Alineación de TypeScript Project References (Gap #9) — requiere decisión de arquitectura separada.
- Relocalización de `e2e/` a `apps/e2e/` (Gap #13) — requiere decisión separada.
- Rationale de glob `apps/*` vs array explícito (Gap #10) — documentación menor, diferible.

## Capabilities

### New Capabilities

- `workspace-lockfile-cleanup`: Auditoría y eliminación de `package-lock.json` anidados bajo `apps/*` que duplican el lockfile raíz.
- `workspace-npmrc-config`: Configuración de npm en la raíz mediante `.npmrc` para hoisting predecible, `save-exact=true`, y `engine-strict=true`.
- `workspace-dev-scripts`: Scripts `dev`, `dev:client`, `dev:server` en el `package.json` raíz usando `concurrently` para levantar servidores en paralelo.
- `workspace-engines-constraint`: Campos `engines` en raíz y todos los workspaces para acotar versiones de Node.js y npm.
- `workspace-root-config-hardening`: Añadir `"private": true` a `e2e/package.json` y migrar scripts raíz (`build`, `lint`, `format`) a usar `--workspaces --if-present`.
- `workspace-e2e-dependency-wiring`: Dependencias `file:` entre `e2e` y `client`/`server` si `e2e` importa módulos directamente.
- `workspace-esm-commonjs-docs`: Documentación de la decisión de usar ESM (raíz, client y server — server confirmado en `apps/server/package.json:6`) vs CommonJS (solo e2e).

### Modified Capabilities

*(Ninguna — no hay specs existentes para configuración de workspaces)*

## Impact

- **Archivos modificados**: `package.json` (raíz), `apps/client/package.json`, `apps/server/package.json`, `e2e/package.json`
- **Archivos creados**: `.npmrc` (raíz)
- **Archivos eliminados**: `e2e/package-lock.json` (y potencialmente `apps/*/package-lock.json` si existen)
- **Dependencias nuevas**: `concurrently` como devDependency en la raíz
- **Dependencias potenciales**: `file:` protocol entries en `e2e/package.json` (si aplica)
- **Riesgos**: 
  - La migración a `--workspaces --if-present` puede cambiar el orden de ejecución de builds — verificar que no haya dependencias de orden entre workspaces.
  - `concurrently` requiere instalación como devDependency raíz — verificar compatibilidad con la versión de Node del proyecto.
  - Los cambios en `engines` pueden causar errores en máquinas con Node <20.0.0.
