# Proposal

## Why

El `package.json` raíz está **aplanado**: 825 entradas en `dependencies` de las cuales **762 (92%) son dependencias transitivas** promovidas indebidamente (solo 63 corresponden a requisitos directos declarados en los workspaces). Esto ya produjo daño verificable: falsos positivos del job GuardDog (`client-react`, `e2e`, `string-width-cjs` — documentados en `openspec/changes/typosquatting-detection/tasks.md`), **riesgo real de dependency confusion** (los workspaces privados `e2e` y `server-express` existen en NPM como paquetes de terceros) y basura como `add@2.0.6` (residuo de un `npm install add` accidental). La existancia de la capability `ci-clean-manifest` (workflows zombie) no cubre este gap: ninguna spec gobierna el inventario de dependencias del manifest raíz.

## What Changes

- **Limpieza del manifest raíz**: eliminar de `dependencies` las 762 entradas transitivas promovidas + `add@2.0.6` + `yoctocolors-cjs` (verificado que es debris del aplanado, disponible vía hoisting) + los restantes duplicados de requirements de workspaces. El estado final esperado para un root privado de monorepo: `dependencies` **vacío o mínimo con justificación**; el tooling del root vive en `devDependencies` (hoy 21 entradas, se auditan).
- **Notas previas (ya corregidas en PR #133, este change generaliza)**: se retiraron las 6 entradas espurias (`client-react`, `e2e`, `server-express`, `string-width-cjs`, `strip-ansi-cjs`, `wrap-ansi-cjs`); este change remueve el resto del aplanado.
- **Guard de higiene**: script `scripts/check-root-manifest.mjs` + `npm run check:manifest` + paso en CI que falla si el manifest raíz vuelve a aplanarse (dependencies ⊄ requisitos directos ∪ allowlist justificada).
- **Regeneración del lockfile** y verificación de builds/tests de los 3 workspaces + scripts raíz.
- Sin cambio de runtime de la aplicación: los workspaces ya declaran sus propias dependencias y npm resuelve el árbol igual vía hoisting.

## Capabilities

### New Capabilities

- `root-manifest-hygiene`: normas del inventario de dependencias del `package.json` raíz (qué puede contener `dependencies`, prohibición de entradas promovidas/espurias) y el guard que lo hace cumplir en CI.

### Modified Capabilities

- (ninguna — las specs existentes `workspace-root-config-hardening` y `workspace-engines-constraint` gobiernan otros aspectos del manifest raíz y no cambian)

## Impact

- **Archivos**: `package.json` (raíz), `package-lock.json` (regenerado), `scripts/check-root-manifest.mjs` (nuevo), `.github/workflows/ci.yml` (paso guard), `package.json` scripts.
- **Scanners beneficiados**: `typosquat-guarddog`/`guarddog-weekly` (elimina la clase de FP `not on NPM` — ~825 lookups → ~40), `dependency-review`, `lockfile-audit`, GuardDog reduce ruido de red (los errores `Connection refused` del run 36525527662).
- **Seguridad**: reduce la superficie de dependency confusion (nombres internos ya no declarados como deps públicas) y el ruido que tapa señales reales (criterio FASE 2 del change `typosquatting-detection` exige runs sin falsos positivos).
- **Riesgos**: una dependencia que solo "funcionaba" porque el aplanado la promovió podría faltar tras la limpieza → mitigación: builds + unit/integration/smoke de los 3 workspaces + scripts raíz como gate del change; allowlist explícita y justificada para casos límite.
- **Out of scope**: herramienta de monorepo adicional (turborepo/nx), migrar deps entre workspaces, los `-cjs` internos de `@isaacs/cliui` (ya resueltos en PR #133).
