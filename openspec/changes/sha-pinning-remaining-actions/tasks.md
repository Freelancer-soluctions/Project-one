## Phase 1 — Inventario y pineado

- [x] 1.1 Listar todas las actions tag-pinned en `.github/workflows/ci.yml`, `security.yml` y `scheduled-security.yml` con `grep -rn "uses:.*@v" .github/workflows/`.
      _Hecho repo-wide (design D6), no solo los 3 workflows del enunciado: **31 refs únicos** en **17 workflows** + el composite `./.github/actions/setup-monorepo/action.yml` (usado por ~30 jobs; sin pinnear rompería un enforcement de allowed-actions). Fuera de alcance por diseño: `docker://zricethezav/gitleaks:v8.30.1` (imagen por tag, no action) y las acciones locales `./.github/actions/*`._
- [x] 1.2 Obtener el SHA completo de cada action desde su página de releases en GitHub.
      _Resueltos **31/31** vía API (`gh api repos/<owner>/<repo>/commits/<tag>` → `.sha`, que pela tags anotadas), 0 fallos. Los SHAs quedan en los propios workflows, con su tag como comentario._
- [x] 1.3 Reemplazar cada `@vX` por `@SHA # vX` en los tres workflows.
      _**204 reemplazos** con el formato `uses: owner/action@<sha40> # <tag>`; 0 refs sin resolver. No se cambió ninguna versión (design D4): `checkout` sigue en v5/v5.0.0/v6, `setup-node` en v4/v5, `download-artifact` en v4/v5/v7. `actions/checkout@v5` resolvió al mismo SHA que ya estaba pineado en `pr-metadata.yml` (`fbc6f39…`, v5.1.0), lo que confirma la coherencia del método._
- [x] 1.4 Verificar que no queda ninguna action con tag mutable: `grep -rn "uses:.*@v[0-9]" .github/workflows/` → 0 resultados.
      _0 referencias de action con tag. El único match textual en `.github/` es un **comentario** en `.github/actionlint.yaml:3` que documenta que actionlint se ejecuta por imagen Docker (`rhysd/actionlint:1.7.12`) y no vía `uses:`._

## Phase 2 — Dependabot

- [x] 2.1 Verificar que `.github/dependabot.yml` incluye `package-ecosystem: github-actions` con `schedule: weekly`.
      _Ya existía: `package-ecosystem: "github-actions"`, `directory: "/"`, `interval: weekly` (lunes 03:00 UTC), `open-pull-requests-limit: 10`, labels `dependencies`/`github-actions`, prefijo de commit `ci`._
- [x] 2.2 Si no existe, añadirlo con `directory: /`. No regredir el `open-pull-requests-limit` existente (actualmente 10).
      _N/A: el bloque ya existe y no se tocó (sin cambios en `.github/dependabot.yml`)._
- [x] 2.3 (Opcional) Configurar `groups` para el ecosistema github-actions (agrupar minor/patch). Si no se configura, eliminar la cláusula de grouping del scenario en el spec.
      _No configurado (fuera del mínimo del change). El scenario del spec ya está redactado de forma condicional («grouped … **if configured**»), así que no requiere edición._

## Phase 3 — Enforcement (manual, owner)

- [x] 3.1 Documentar en `docs/CONTEXT-CICD.md` cómo habilitar "Require actions to be pinned to a full-length commit SHA" en Settings → Actions → General → Allowed actions.
      _Añadido en §5.4: pasos UI, equivalente API (`sha_pinning_required=true`), recomendación de allow-list frente a `allowed_actions=all`, alcance real del pinning (204 refs / 31 tags / 17 workflows + composite) y quién lo mantiene (Dependabot semanal). Actualizados también §3.5 y la tabla de §5.10, que seguían afirmando que el pinning estaba pendiente._
- [ ] 3.2 (Opcional) Habilitar la política a nivel repo (requiere acción manual del owner).
      _Pendiente por diseño: `gh api repos/... --jq .security_and_analysis` no cubre este campo y el setting exige permisos de owner; verificado que hoy sigue en `sha_pinning_required=false` (§5.10)._

## Validación

- [x] 4.1 Ejecutar `openspec validate sha-pinning-remaining-actions --type change` y confirmar sin errores.
      _`--strict`: Change 'sha-pinning-remaining-actions' is valid._
- [x] 4.2 Ejecutar `actionlint` sobre los workflows modificados y confirmar sin errores.
      _`actionlint -config-file .github/actionlint.yaml .github/workflows/*.yml` → exit 0._
- [x] 4.3 Verificar que los workflows siguen parseando: `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`.
      _Los 17 workflows + el composite parsean con `yaml.safe_load`; además `zizmor` (todas las reglas) devuelve **0 resultados** sobre `.github/workflows/`._

## Documentación

- [x] 5.1 Actualizar `docs/learning/quality-gates.md` si se añade una fila para SHA pinning.
      _N/A: no se añade job ni gate nuevo (la fila de `zizmor-advisory` en §2 ya documenta `unpinned-uses` y su política), así que una fila propia duplicaría la garantía. **Follow-up EJECUTADO (2026-11-10):** `.github/zizmor.yml` pasa de `"*": ref-pin` a `"*": hash-pin`, de modo que el pinning queda enforced por el gate bloqueante y no solo por convención. Verificado: zizmor 1.30.1 sobre `.github/workflows/` + `.github/actions/` → 0 hallazgos; sonda con `uses: actions/checkout@v5` → `error[unpinned-uses]` (con `ref-pin` la misma sonda pasa), así que el endurecimiento es efectivo y no cosmético._

## Notas de implementación

- El cambio es puramente de referencia (`@tag` → `@sha # tag`): 0 cambios en inputs, outputs, `if:`, `needs` ni versiones.
- No se commiteó nada: el árbol queda modificado (17 workflows + composite + `docs/CONTEXT-CICD.md` + este `tasks.md`).
