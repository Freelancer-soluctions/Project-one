## Phase 1 — Inventario y pineado

- [ ] 1.1 Listar todas las actions tag-pinned en `.github/workflows/ci.yml`, `security.yml` y `scheduled-security.yml` con `grep -rn "uses:.*@v" .github/workflows/`.
- [ ] 1.2 Obtener el SHA completo de cada action desde su página de releases en GitHub.
- [ ] 1.3 Reemplazar cada `@vX` por `@SHA # vX` en los tres workflows.
- [ ] 1.4 Verificar que no queda ninguna action con tag mutable: `grep -rn "uses:.*@v[0-9]" .github/workflows/` → 0 resultados.

## Phase 2 — Dependabot

- [ ] 2.1 Verificar que `.github/dependabot.yml` incluye `package-ecosystem: github-actions` con `schedule: weekly`.
- [ ] 2.2 Si no existe, añadirlo con `directory: /` y `open-pull-requests-limit: 5`.

## Phase 3 — Enforcement (manual, owner)

- [ ] 3.1 Documentar en `docs/CONTEXT-CICD.md` cómo habilitar "Require actions to be pinned to a full-length commit SHA" en Settings → Actions → General → Allowed actions.
- [ ] 3.2 (Opcional) Habilitar la política a nivel repo (requiere acción manual del owner).

## Validación

- [ ] 4.1 Ejecutar `openspec validate sha-pinning-remaining-actions --type change` y confirmar sin errores.
- [ ] 4.2 Ejecutar `actionlint` sobre los workflows modificados y confirmar sin errores.
- [ ] 4.3 Verificar que los workflows siguen parseando: `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`.

## Documentación

- [ ] 5.1 Actualizar `docs/learning/quality-gates.md` si se añade una fila para SHA pinning.
