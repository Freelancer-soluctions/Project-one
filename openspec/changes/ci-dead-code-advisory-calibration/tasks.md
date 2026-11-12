# Tasks: ci-dead-code-advisory-calibration

## Fase 1: Advisory (calibración)

- [ ] Validar flags `--production`, `--cache`, `--no-exit-code`, `--max-issues` en knip 6.45.1 instalado (verificación A3)
- [ ] Upgrade knip 6.32.2 → 6.45.1 en package.json + lockfile (PR único con flags + upgrade, para no dejar CI rojo)
- [ ] Actualizar `$schema` en knip.jsonc (si se pinnea versión exacta; hoy es major-only)
- [ ] Añadir `--production --cache --no-exit-code` a client-dead-code/server-dead-code (PR mode); unificar reporter (client usa json, server no)
- [ ] Invocar vía scripts root (`npm run knip:ci`) en vez de `npx knip` inline para single-source
- [ ] Crear job scheduled con modo default (definir trigger, cadencia, severidad advisory, mecanismo de triage)
- [ ] Revisar `ignore`/`ignoreDependencies`/`ignoreIssues` para reducir puntos ciegos (criterio: reducir `ignore`/`ignoreIssues` con justificación por entrada)
- [ ] Regenerar baseline de ignores si el upgrade cambia hallazgos (CODEOWNERS aprueba)
- [ ] Configurar ratchet: severidades por tipo (warn→error al llegar a cero) + `--max-issues N` en los jobs
- [ ] Cross-reference: CODEOWNERS para `knip.json*` se cubre en hardening P1.3 (mientras tanto, `knip.jsonc` editable sin revisión de owner)
- [ ] Documentar ratchet y promoción en `quality-policy.md` (crear plantilla mínima si hardening no aterrizó)
- [ ] Reconciliar con `ci-prebuild-substage-structure-phase2` (superseded) y cerrar sus tasks 6.1/6.2
- [ ] `openspec validate --specs --strict`
