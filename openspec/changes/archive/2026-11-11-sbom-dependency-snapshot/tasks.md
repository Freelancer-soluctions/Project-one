## Phase 1 — Implementación

- [x] 1.1 Añadir `dependency-snapshot: true` al step de `anchore/sbom-action` en `.github/workflows/security.yml`.
      — Hecho (2026-11-10): input añadido al step `Generate SBOM` del job `sbom` (pin SHA `e22c3899…` v0.24.0 intacto, formato CycloneDX sin cambios — design D3/D5). `github-token` no se explicita: el default del action es `${{ github.token }}` (verificado en action.yml del action).
- [x] 1.2 Añadir `dependency-snapshot: true` al step de `anchore/sbom-action` en `.github/workflows/security-digest.yml`.
      — Hecho (2026-11-10): input añadido al step `Generate CycloneDX SBOM` del job `sbom`. Este workflow solo corre en schedule/dispatch (nunca forks) → submission siempre write-capable.
- [x] 1.3 Elevar `contents: read` a `contents: write` en el job `sbom` de `security.yml` (L212).
      — Hecho: `permissions: contents: write` a nivel JOB (la línea real era L229-230, no L212 — el fichero creció desde que se escribió el change; el workflow-level sigue en `contents: read`, least privilege). Comentario inline documenta el porqué (Dependency submission API) y la degradación en forks.
- [x] 1.4 Verificar que `security-digest.yml` ya tiene `contents: write` (o añadirlo).
      — NO lo tenía: el workflow-level es `contents: read` + `actions: read` y el job `sbom` no tenía bloque propio. Añadido `permissions: contents: write` a nivel JOB (no se eleva el workflow completo — least privilege, evita `excessive-permissions` de zizmor en los demás jobs).

## Validación

- [x] 2.1 Ejecutar `openspec validate sbom-dependency-snapshot --type change` y confirmar sin errores.
      — Ejecutado 2026-11-10: "Change 'sbom-dependency-snapshot' is valid".
- [x] 2.2 Verificar que los workflows siguen parseando: `python -c "import yaml; yaml.safe_load(open('.github/workflows/security.yml'))"`.
      — Verificado con equivalente Node (`js-yaml`): security.yml OK (6 jobs), security-digest.yml OK (4 jobs).
- [x] 2.3 Ejecutar actionlint sobre los workflows modificados y confirmar sin errores (catches misspelled inputs).
      — Ejecutado actionlint v1.7.12 local (misma versión que el job CI `actionlint-advisory`) sobre ambos ficheros: exit 0, 0 hallazgos. El input `dependency-snapshot` está confirmado contra el action.yml del action (default "false", tipo boolean).
- [~] 2.4 (Post-merge, requiere push) Disparar el workflow y verificar que el snapshot aparece en el GitHub Dependency graph sin errores de autenticación. No ejecutable localmente. Documentado en tasks.md.
  — **Pendiente por naturaleza**: requiere merge a `main` (el cron/dispatch corre el YAML del default branch). Verificación: log del step `Generate SBOM` debe contener "Uploading GitHub dependency snapshot…" sin el warning "Error uploading depdendency snapshot"; después, Insights → Dependency graph debe listar entradas enviadas por el correlator `Security Pipeline_sbom` / `Scheduled Security Digest_sbom`.

## Documentación

- [x] 3.1 Actualizar `docs/CONTEXT-CICD.md` o `docs/learning/quality-gates.md` con la mejora de cobertura.
      — Hecho en `docs/CONTEXT-CICD.md` (tabla de workflows §estado toggle): filas `security.yml` y `security-digest.yml` actualizadas con `dependency-snapshot: true`, `contents: write` job-level y la mejora de cobertura Dependabot (transitivas vía Dependency submission API); fila `scheduled-security.yml` aclara que queda fuera de scope (`npm sbom`, sin capability de snapshot). `quality-gates.md` no tiene fila de capa SBOM (no es un gate: sin umbral ni bloqueo) — el registro vive en CONTEXT-CICD.md.
- [x] 3.2 Documentar que en PRs de forks la submission degrada gracefully (token read-only, esperado).
      — Documentado en 3 niveles: (1) comentario inline del job `sbom` en security.yml; (2) fila de CONTEXT-CICD.md; (3) verificación en fuente del action (`GithubClient.postDependencySnapshot` envuelve el POST en try/catch y solo emite `core.warning` ante status >= 400 — nunca `setFailed`, el step no falla; el artifact SBOM se genera igual vía `if: always()`).
