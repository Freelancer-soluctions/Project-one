# Proposal: coverage-merge-gate-hardening

## Why

El review del PRD Coverage Merge Gate (2026-11-05) detectó gaps que impiden que el gate sea realmente blocking. El gap crítico (ruleset binding) es acción manual posterior; los gaps implementables se cierran aquí como blocking (sin advisory).

Gaps verificados:

1. `ci-complete` trata `cancelled` como éxito (exit 0) y tolera `skipped` sin autorización.
2. Integridad RM-2 incompleta: solo verifica `.vitest-reports/` no vacío; no cuenta exactamente M parciales ni lista índices ausentes.
3. Sin gate de cobertura de código nuevo (diff/patch coverage, decisión D3).
4. Sin artefacto del reporte fusionado (lcov/HTML, 14d) ni delta vs base.
5. `.coverage-policy.json` / `.coverage-baseline.json` sin entrada explícita en CODEOWNERS.
6. Task 4.4 sin validación en run real de CI.

## What Changes

- `ci-complete`: fallar en `cancelled` y en `skipped` inesperado.
- Conteo exacto de parciales `blob-<i>-<n>.json` contra M antes del merge.
- Subir reporte fusionado como artefacto 14d.
- Entrada explícita en CODEOWNERS para archivos de política de cobertura.
- Script de diff coverage (lcov + git diff) como gate blocking.
- Validación en PR de prueba (task 4.4).

## Capabilities

### New Capabilities

- `coverage-merge-gate-hardening`: cierre de gaps implementables del Coverage Merge Gate.

### Modified Capabilities

_(ninguna)_

## Impact

- `.github/workflows/ci.yml`: ci-complete, client/server-coverage, CODEOWNERS.
- `scripts/ci/check-coverage.mjs` o nuevo `diff-coverage.mjs`.
- `.github/CODEOWNERS`.
