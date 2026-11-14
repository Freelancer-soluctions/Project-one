# Design

## Context

El stage Quality ya tiene gates enterprise (agregadores, path-scoping, SAST, cobertura, TIA) pero diverge del PRD en items de configuración, gobernanza y seguridad. Este change cierra esas brechas con gates **blocking desde el día 1**, shift-left en pre-commit/pre-push y estrategias enterprise. Se apoya en `docs/learning/quality-gap-analysis.md` y `docs/learning/quality-gap-analysis-verification.md`, que corrigieron claims imprecisos (exit codes de depcruise, vale no falla en warnings, tsc incremental con noEmit no acelera, knip 6.32.2→6.45.1). Los gaps de knip, formato server, tipos y docs/CHANGELOG se cubren en changes dedicados (`ci-dead-code-advisory-calibration`, `ci-format-check-blocking`, `server-typescript-migration`, `docs-changelog-validation`); este change se limita al núcleo cross-cutting.

## Goals / Non-Goals

**Goals:**

- Cerrar los P0/P1 del gap analysis con gates blocking desde el día 1.
- Shift-left: pre-commit (lint/format/md), pre-push (typecheck + boundaries), CI (todo lo demás).
- Gobernanza auditable: `quality-policy.md`, `quality-exceptions.md`, CODEOWNERS completo, runbook, ratchet.
- Seguridad del stage: `npm ci --ignore-scripts` + `prisma generate` explícito, agregador estricto sin interpolación, actions por SHA (meta de seguridad, no task de este change).

**Non-Goals:**

- Activación de `strict` en TypeScript sobre todo el repo (depende de la migración TS en curso; este change solo añade `ban-ts-comment` a eslint.config.js).
- tsBuildInfo en CI (pertenece a `server-typescript-migration`).
- Promoción de SonarQube a required check (D2 abierto; se deja inactivo).
- Promoción de markdownlint a blocking (fase 2, cuando docs/ esté limpio; cubierto por `docs-changelog-validation`).
- Upgrade mayor de ESLint 9→10 (P2, change `ci-eslint-v10-upgrade`).
- Métricas/SLOs semanales (P2, fuera de alcance).
- Upgrade de knip (cubierto por `ci-dead-code-advisory-calibration`).
- Activación de server format-check (cubierto por `ci-format-check-blocking`).

## Decisions

1. **Gates blocking desde el día 1**: no se usa fase advisory para los items de este change; se calibran antes de merge (pre-flight) y se bloquea desde el primer run. Esto sigue la práctica ya establecida en el repo (complexity, import-bounds, api-contract, frontend-budgets promovidos a blocking).

2. **Agregador estricto con env var y skip-authorization**: se reemplaza la interpolación `${{ contains(...) }}` por `env: NEEDS: ${{ toJSON(needs) }}` + evaluación con `jq`/`node`. Los skipped legítimos se autorizan vía la salida de `repo-discovery` (change detection), reutilizando el patrón ya probado en `prebuild-security-complete` (change `2026-11-10-prebuild-security-aggregator-strict`). El script de veredicto debe filtrar/mapear los skipped autorizados **antes** de `all()`, distinguiendo `if`-skipped (reporta `Success`) de `needs.result == 'skipped'` (no autorizado → fail).

3. **`npm ci --ignore-scripts`**: `setup-monorepo` pasa a `npm ci --ignore-scripts`; los jobs que necesiten Prisma añaden `npx prisma generate` explícito. Esto cierra el riesgo de lifecycle scripts y alinea con zizmor.

4. **Allowlist externa**: `scripts/check-root-manifest.mjs` lee `manifest-allowlist.json` (raíz) con schema `{ "allow": [...], "entries": [{ "name", "reason", "owner", "issue" }] }`. El script falla si el archivo falta (exit 2) o si hay violaciones (exit 1).

5. **CODEOWNERS**: se amplía el bloque de patrones siguiendo la sintaxis gitignore (último patrón gana). Se protege `.github/` para que cambiar CODEOWNERS exija revisión.

6. **Shift-left pre-push**: el hook ejecuta `npm run typecheck && npm run deps:boundaries` además de SAST/tests, manteniendo <60s.

7. **Ratchet y solo-afectado**: ratchet documentado en `quality-policy.md` (contador que solo baja para ESLint warnings; baselines que solo se podan). Solo-afectado vía `repo-discovery` path-filter + `merge_group`/`workflow_dispatch` full suite (ya implementado).

## Risks / Trade-offs

- Activar `reportUnusedDisableDirectives: 'error'` puede romper lint en PRs con supresiones obsoletas tras updates de ESLint/reglas. Mitigación: versiones fijadas + PR de actualización de herramientas.
- `npm ci --ignore-scripts` rompe jobs que dependían de `postinstall` (p. ej. Prisma). Mitigación: `npx prisma generate` explícito en jobs que lo requieran.
- Agregador estricto puede bloquear PRs que hoy pasan por skipped. Mitigación: change detection autoriza skipped legítimos; comunicación previa.
- `ban-ts-comment` puede romper lint donde existan `@ts-ignore` sin justificación. Mitigación: pre-flight + corrección en el mismo PR.

## Migration Plan

1. P0: `npm ci --ignore-scripts` + `prisma generate`; agregador estricto; pre-push ampliado.
2. P1: caché ESLint; `reportUnusedDisableDirectives: 'error'`; `ban-ts-comment`; CODEOWNERS; `quality-policy.md`/`quality-exceptions.md` (con ratchet); vale advisory; SARIF.
3. P2: allowlist externa; anotación de gap analysis.

## Open Questions

- D2 (SonarQube y forks): se deja inactivo hasta decisión (cubierto por `ci-pr-review-automation`).
- D5 (knip blocking vs advisory): se resuelve en `ci-dead-code-advisory-calibration`.
- D8 (métricas semanales): fuera de alcance (P2).
