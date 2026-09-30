# Design

## Context

Ver `proposal.md` (Why) y `specs/root-manifest-hygiene/spec.md` (contrato). Estado actual medido (2026-09-29): `dependencies` raíz = 825 entradas, de las cuales 63 coinciden con requisitos directos de workspaces/root-devDeps y **762 (92%) son transitivas promovidas**; `devDependencies` raíz = 21. Evidencia de daño ya producida: FPs de GuardDog y riesgo de dependency confusion (change `typosquatting-detection`, tasks.md nota de auditoría). Correcciones previas del PR #133 (6 entradas espurias) resuelven solo los FPs inmediatos, no la causa.

## Goals / Non-Goals

**Goals**

- `dependencies` raíz reducido al conjunto de requisitos directos reales del raíz (objetivo esperado: 0–5 entradas) + allowlist justificada si hace falta.
- Guard de CI en segundos, sin red, que bloquea PRs que re-aplanen el manifest.
- Cero cambios en `apps/*` y `e2e` (solo manifests de raíz + guard).

**Non-Goals**

- Migrar dependencias entre workspaces (p. ej. bajar deps del cliente a la raíz).
- Introducir gestor de monorepo (turborepo/nx/pnpm workspaces).
- Reordenar o reformatear el manifest más allá de lo que npm escriba al regenerar.
- Corregir el aplanado de otros manifests de workspace (fuera de evidencia de daño).

## Decisions

- **D1 — Estado final del raíz: `dependencies` vacío o mínimo + allowlist versionada.** Para un root privado de monorepo npm, `dependencies` tiene sentido solo si el raíz importa código en runtime (no es el caso: el raíz es orquestación). Alternativas: (a) mover todo a devDependencies — mezcla tooling del repo con requisitos runtime hipotéticos, y el guard no podría distinguir; (b) mantener el aplanado — invalida el propósito. El guard valida `dependencies` ⊆ (requisitos directos ∪ allowlist), siendo los requisitos directos la unión de manifests de workspaces + `devDependencies` del raíz; `devDependencies` raíz se audita (las 21 actuales) pero no se vacía en este change.

- **D2 — Guard como script Node sin dependencias (`scripts/check-root-manifest.mjs`) + paso en `ci.yml`.** Node puro (`node:fs`, sin libs): lee manifests, construye el conjunto de requisitos directos, compara y reporta las inválidas con su versión. Se engancha como paso dedicado en la banda pre-build de `ci.yml` (condicionado a que el PR toque `package.json`/`package-lock.json` de raíz) y como script npm (`npm run check:manifest`) para uso local y pre-commit advisory. Alternativas descartadas: acción de marketplace (permitidas pero sin una que valide esta política específica; añade superficie de confianza), hook Husky bloqueante (el repo reserva Husky para advisory en esta capa).

- **D3 — Allowlist en el propio script con justificación obligatoria por entrada.** Estructura `{ name, version?, reason }` versionada en el script; una entrada sin `reason` hace fallar el guard (auditable, sin ficheros extra). Alternativa: `.manifest-allowlist.json` separado — un fichero más que mantener para 0–5 entradas esperadas.

- **D4 — Limpieza mecánica asistida, revisión humana del resultado.** El script genera la lista de removibles (`--report`); la edición del manifest se hace en un paso único y revisable (un diff de 762 líneas menos), seguido de `npm install` para regenerar lockfile. No se automatiza en CI la edición (el guard valida, no muta).

- **D5 — Respetar las entradas ya saneadas en PR #133.** El change parte de la rama `ci-prebuild-improvement` (workspaces y `-cjs` ya retirados); su resultado final absorbe ese trabajo (el diff final de limpieza lo subsume).

- **D6 — Orden de verificación para detectar dependencias "fantasma"** (que solo funcionaban por el aplanado): limpieza → `npm ci` → build de los 3 workspaces → unit/integration/smoke → scripts raíz. Cualquier fallo identifica la dependencia fantasma y se resuelve: si es real, entra a la allowlist con justificación; si no, se corrige el import faltante en el workspace correspondiente.

## Risks / Trade-offs

- [Dependencia fantasma rompe un build tras la limpieza] → D6: gate de verificación completo antes de merge; allowlist como escape con justificación; rollback trivial (`git revert`).
- [El aplanado se reintroduce por un `npm install <pkg>` en la raíz] → Guard bloqueante en CI (Requirement 3) + advisory pre-commit (`npm run check:manifest`) para feedback inmediato.
- [Falsos negativos del guard (requisito directo no detectado)] → El conjunto "directos" se construye desde los manifests, no desde imports: cualquier dep declarada en un workspace es directa por definición; el guard solo castiga lo que no está declarada en ningún sitio.
- [Guard demasiado estricto bloquea tooling legítimo del raíz] → La vía correcta para tooling del raíz es `devDependencies` (ya cubiertas como "directas"); la allowlist existe para el caso límite con `reason` obligatoria.
- [npm re-introduce entradas al ejecutar ciertos comandos en la raíz] → El guard corre en cada PR que toque el manifest; si se detecta un comando npm culpable, se documenta en este change.

## Migration Plan

1. Generar reporte (`node scripts/check-root-manifest.mjs --report`) y revisar las 762+ entradas removibles (muestra manual + verificación de que ninguna está en allowlist candidates).
2. Editar `package.json` raíz (remover entradas + `add@2.0.6` que llegará de main + `yoctocolors-cjs`), `npm install` para regenerar lockfile.
3. Verificación D6 completa (npm ci → builds → tests → scripts raíz).
4. Añadir guard a `ci.yml` + `npm run check:manifest`; validar con actionlint local.
5. Merge a la rama del PR #133 o PR dedicado desde rama propia; rollback: `git revert` del commit de limpieza.

## Open Questions

- Ninguna que bloquee: el set exacto de entradas en allowlist se define en la ejecución (task 3.1), no cambia specs ni tasks.
