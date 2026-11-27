# Design

## Context

Ver `proposal.md` — Why. El repo es un monorepo npm workspaces (`apps/client`, `apps/server`, `e2e`) con CI de 18 workflows, husky (pre-commit/commit-msg/pre-push), commitlint, dependency-cruiser, y un guard `scripts/check-root-manifest.mjs`. No hay cambios de DB ni de API. El cambio es puramente de higiene de repositorio y tooling.

## Goals / Non-Goals

**Goals:**

- Reducir el número de archivos en la raíz y en el árbol versionado.
- Establecer una convención clara: raíz = orquestación + configs requeridas por plataforma; `.config/` = configs movibles; `config/` = datos/baselines; IDE = ocultar sin mover.
- Eliminar artefactos generados del control de versiones: el único realmente versionado es `docs/opencode/prompts/contracts/node_modules/` (~1.679 archivos); el resto ya está ignorado y con 0 trackeados (verificar y añadir solo los ausentes).
- Mantener CI verde en cada fase.

**Non-Goals:**

- No introducir Turborepo/pnpm ni cambiar workspaces.
- No mover código de aplicación ni cambiar APIs/DB.
- No cambiar convenciones de commit/branching.

## Decisions

1. **Convención híbrida `.config/` + raíz.** Movemos solo configs que aceptan flag explícito (`--config`/`-c`/`--config-file`) e invocadas desde scripts npm/CI. Mantenemos en raíz las que la herramienta resuelve por defecto desde la raíz o que la plataforma exige (`.gitignore`, `.github`, `.husky`, `tsconfig*`, `package.json`, `.npmrc`, `.nvmrc`, `.tool-versions`, `.editorconfig`, `.env*`, `.dockerignore`). Alternativa (mover todo a `.config/`) rechazada: rompe resolución jerárquica de ESLint/Prettier/TS y obliga a tocar IDE, husky y CI en bloque.

2. **File nesting en `.vscode/settings.json`** para ocultar configs sin moverlos (riesgo cero, reversible). Complementa la convención `.config/`.

3. **Estrategia strangler-fig por archivos:** cada fase es un PR independiente y reversible; no big-bang.

4. **`skip_specs: true`** en `.openspec.yaml`: cambio de tooling sin comportamiento de producto; no inventar requisitos.

5. **Artefactos generados fuera del árbol versionado:** `dist/`, `build/`, `coverage/`, `.cache/`, `reports/`, `test-results/`, `*.tsbuildinfo`, `*.log`. Eliminar `docs/opencode/prompts/contracts/node_modules/` del git (mayor quick win).

## Risks / Trade-offs

- [Mover config olvidando flag] → Mitigación: checklist por PR (scripts + husky + CI + IDE).
- [Borrar carpeta de agente usada por alguien] → Mitigación: confirmar con el equipo antes de Fase 2.
- [Reintroducir artefactos generados] → Mitigación: `.gitignore` ampliado + CI check (`git status --porcelain` limpio tras build).
- [Cambios de higiene rompen el funcionamiento del repo] → Mitigación: validación de no-regresión por fase (tarea 7.5): `npm ci` limpio, build, lint, test, tsc, hooks y dry-run de workflows afectados; grep de referencias rotas a configs movidos.
- [Conflictos con guard `check-root-manifest`] → Mitigación: no tocar `package.json` raíz de dependencias, solo scripts.

## Migration Plan

1. Fase 1 — Artefactos generados (riesgo mínimo): `git rm --cached` + `.gitignore`.
2. Fase 2 — Carpetas de agentes/IDE (riesgo bajo): borrar del disco las gitignored; consolidar `.semgrep`.
3. Fase 3 — Mover configs con flag (riesgo medio): lotes pequeños, un PR por config/grupo.
4. Fase 4 — Consolidar Vitest (riesgo medio).
5. Fase 5 — File nesting en IDE (riesgo cero).
6. Fase 6 — Archivos sueltos (riesgo bajo).

Rollback: revertir el PR de la fase afectada; `main` siempre verde.

## Open Questions

- (ninguna que bloquee; confirmar con el equipo el uso de `.kiro/`, `.perch/`, `.freebuff/`, `.agents/` antes de Fase 2.)
