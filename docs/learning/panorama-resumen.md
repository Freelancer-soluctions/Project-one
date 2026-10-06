# Resumen — Panorama TESTING Prebuild + Pipeline-config-scan + Typosquatting (2026-09-29)

> Verificado contra repo real. Distinción clave: **IMPLEMENTADO ≠ ACTIVO**.

## 1. Pipeline-config-scan — VALIDADO

- `openspec validate pipeline-config-scan --strict` → exit 0.
- design.md D2: download-script pinned 1.7.12 + plantilla SARIF versionada `.github/actionlint-sarif.tmpl` + upload-artifact@v7.
- spec.md: 8 requirements con escenarios (incl. Documentación).
- tasks.md: grupos 1-3, 7 actualizados (enmiendas A1-A9).
- Sin duplicación con Trivy / dependency-review / checkov-iac / hadolint / actionlint bloqueante.

## 2. Typosquatting-detection — 3/4

- Doc creada: `docs/learning/typosquatting-detection.md` (190 líneas, GuardDog v3.2.0 + Socket CLI).
- Change: proposal + spec + design completos. Falta: tasks.md grupos 4-7 + `openspec validate --strict`.

## 3. TESTING Prebuild (§23.3 L2824-2832) — Corregido por @researcher

### Estado real en CI (mixto: FASE 1 advisory ACTIVADO + activos no-advisory + `if: false`)

| Job                          | ci.yml                              | Estado                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| test-unit-client             | L744 (`if:`), COE L748              | ✅ **FASE 1 advisory ACTIVADO** (2026-10-01, change `coverage-tripwire-stage-2d`): `if:` sobre repo-discovery + `continue-on-error: true`; corre en PRs path-scoped. FASE 2: quitar COE tras 2-4 semanas de calibración |
| test-unit-server             | L843 (`if:`), COE L847              | ✅ **FASE 1 advisory ACTIVADO** (2026-10-01, change `coverage-tripwire-stage-2d`): mismo patrón que client. FASE 2: quitar COE tras 2-4 semanas de calibración                                                          |
| client-coverage              | L1514 (if: pull_request, COE L1524) | ✅ **FASE 1 advisory activado** — thresholds en vitest.config.js:27-32, check-coverage.mjs                                                                                                                              | L1514 | Activado (2026-10-01, change `coverage-tripwire-stage-2d`): `if: github.event_name == 'pull_request'` + `continue-on-error: true` + `needs: [test-unit-client]` (D17) + D18 tripwire (scope=diff se difiere). FASE 2: quitar COE tras calibración |
| server-coverage              | L1603 (if: pull_request, COE L1610) | ✅ **FASE 1 advisory activado** — thresholds en vitest.config.js:20-25, check-coverage.mjs                                                                                                                              | L1603 | Activado (2026-10-01, change `coverage-tripwire-stage-2d`): `if: github.event_name == 'pull_request'` + `continue-on-error: true` + `needs: [test-unit-server]` (D17) + D18 tripwire (scope=diff se difiere). FASE 2: quitar COE tras calibración |
| test-integration             | L1665 (`if:` activo)                | ✅ **Activo, NO advisory**: `if:` sobre repo-discovery, **sin** `continue-on-error` — su fallo propaga a `prebuild-unit-tests-complete` de forma real                                                                   |
| test-smoke                   | L1717 (`if:` activo)                | ✅ **Activo, NO advisory**: mismo patrón que integration — corre, pero sin COE                                                                                                                                          |
| prebuild-unit-tests-complete | L1946 agregador                     | ✅ Activo; `needs` = los **6** jobs (2 test-unit + test-integration + test-smoke + 2 coverage). SUCCESS histórico (docs/ci-prebuild-substage-structure-phase2-verification.md L15/L34)                                  |

### TIA local presente (no en CI)

- `.husky/pre-push:52,56` → `vitest run --changed origin/main` (client + server).
- `.husky/pre-commit:1-56` → 0 invocaciones test (solo lint-staged, semgrep, secrets, advisory).
- scripts `test:changed` en server package.json:27 y client package.json:25.
- ci.yml: 0 referencias a test:changed/TIA.

### Faltante explícito

- Snapshot: 0 `.snap`, 0 `__snapshots__`, 0 `toMatchSnapshot`.
- Smart test ordering: 0 evidencia.
- Test sharding: 0 evidencia.
- Coverage Merge Gate: gate por workspace sí (`scripts/ci/check-coverage.mjs`), merge de shards no.
- Property-based: dep `fast-check` 3.23.2 (package.json:341) instalada, 0 usos en tests.
- CONTEXT.md (40 líneas): 0/10 términos TESTING.
- Docs inexistentes citados antes por error: `docs/learning/testing-architecture.md`, `docs/cicd-estado-actual.md` (real: `docs/testing-architecture.md`).

## 4. Pendiente

1. @spec-manager: tasks.md grupos 4-7 typosquatting + validate --strict.
2. @developer: `/opsx-apply pipeline-config-scan` + typosquatting (FASE 1 advisory).
3. Actualizar CONTEXT.md con 10 términos TESTING + registrar el estado mixto (FASE 1 advisory activado en test-unit-\*/coverage, activos no-advisory en integration/smoke) en quality-gates.md.
