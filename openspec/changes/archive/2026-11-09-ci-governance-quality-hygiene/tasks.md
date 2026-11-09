# Tasks

## 0. Preparación y baseline

- [x] 0.1 Snapshot pre-cambio: `.tmp/ci.yml.pre-governance-quality-hygiene`. **Evidencia**: snapshot 1795 líneas / 50 jobs (método correcto; el snapshot incluye sobre sí las ediciones aún no commiteadas del Paquete 1 — mismo working tree), actionlint exit 0 sobre ese estado

## 1. Ediciones en ci.yml

- [x] 1.1 Job `sast` (2A): removida la línea `needs: repo-discovery`, sin tocar `name:`, `if:`, permisos ni steps (D1). **Evidencia**: actionlint exit 0; diff acotado a esa línea
- [x] 1.2 Job `openspec-validate` (2B): removida la línea `needs: repo-discovery`; comentario del job actualizado (sin needs, corre desde t=0; nota: el comentario previo citaba actionlint, que ya no existe tras la consolidación del Paquete 1). **Evidencia**: actionlint exit 0; diff acotado
- [x] 1.3 Job `verify-signatures` (2A): literal reemplazado por `ROLLOUT_DATE="${{ vars.SIGNING_ROLLOUT_DATE || '2026-08-01' }}"` (D2) + log line `Signing rollout cutoff (effective)`. **Evidencia**: grep sin literal hardcodeado (0) y con la expresión (1); actionlint exit 0
- [x] 1.4 Job `server-format-check` (2B): comentario reemplazado por convención FASE (`FASE 1 (diferido): server aún no pasa format:check — FASE 2: re-activar cuando el workspace server pase el check limpio`), `if: false` intacto (D4). **Evidencia**: diff acotado al comentario + `if: false` sin cambios
- [x] 1.5 Verificación mecánica conjunta. **Evidencia**: actionlint exit 0 en ci.yml y scheduled-security.yml; job count 50 estable (método correcto); `name:` de todos los jobs intactos vs snapshot (0 diferencias); `needs: repo-discovery` restantes = 27, todos consumidores legítimos de outputs (spot-check: client-lint/server-lint/e2e-lint/test-\* filtran por outputs)

## 2. Docs

- [x] 2.1 `docs/CONTEXT-CICD.md` (§ 9.3.1): grandfathering ahora cita `vars.SIGNING_ROLLOUT_DATE` (fallback inline `2026-08-01`) en vez del literal enterrado (D6: solo docs de firma). **Evidencia**: grep sin la cita del literal como ubicación
- [x] 2.2 `docs/pre-merge-gates-governance.md` (snippet §3): comentario del snippet actualizado a variable + fallback. **Evidencia**: grep del comentario matchea la nueva redacción
- [x] 2.3 `docs/learning/ci-cd/05c-ci-commit-signing-implementation.md`: fila "Pendiente" del estado final (`Endurecer = definir vars.SIGNING_ROLLOUT_DATE`) + anotación histórica (2026-09-30) en el item de restauración del PR #101, sin reescribir la cronología. **Evidencia**: grep de ambas redacciones
- [x] 2.4 Prettier sobre los 3 docs. **Evidencia**: `npx prettier --write` OK (2 unchanged, 1 reflow)

## 3. Validación final

- [x] 3.1 **Evidencia**: `openspec validate ci-governance-quality-hygiene --strict` → "is valid" (exit 0); `openspec validate --specs --strict` → **118 passed, 0 failed**
- [x] 3.2 **Evidencia**: `npm run docs:lint` (gate real) exit 0; join diff×lint sobre los 3 docs → 22 líneas tocadas, 0 violaciones nuevas
- [ ] 3.3 Operacional post-merge documentado: definir `SIGNING_ROLLOUT_DATE=2026-08-01` en Settings → Secrets and variables → Actions → Variables (D3; opcional, el fallback ya da el mismo valor). Verificación: paso anotado aquí y ejecutado post-merge
