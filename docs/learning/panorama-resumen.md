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

### Implementado pero DESACTIVADO en CI (todos `if: false`)

| Job                          | ci.yml                 | Estado                                                                                 |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| test-unit-client             | L792 (if:false L793)   | declarado, no corre                                                                    |
| test-unit-server             | L822 (if:false L823)   | declarado, no corre                                                                    |
| client-coverage              | L1266 (if:false L1267) | thresholds en vitest.config.js:27-32                                                   |
| server-coverage              | L1324 (if:false L1325) | thresholds en vitest.config.js:20-25                                                   |
| test-integration             | L1358 (if:false L1359) | declarado                                                                              |
| test-smoke                   | L1404 (if:false L1405) | declarado                                                                              |
| prebuild-unit-tests-complete | L1627 agregador        | SUCCESS histórico (docs/ci-prebuild-substage-structure-phase2-verification.md L15/L34) |

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
3. Actualizar CONTEXT.md con 10 términos TESTING + registrar estado `if:false` en quality-gates.md.
