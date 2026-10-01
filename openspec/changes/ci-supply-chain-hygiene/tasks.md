# Tasks

## 0. Preparación y baseline

- [x] 0.1 Snapshot pre-cambio: copiar `.github/workflows/ci.yml` a `.tmp/ci.yml.pre-supply-chain-hygiene` (gitignored) y registrar baseline con el método de conteo correcto. **Evidencia**: snapshot 1776 líneas / 50 jobs (el snapshot ya contenía la remoción intencional de `actionlint`; conteo histórico corregido: pre-alignment = 51 jobs reales — el "54" previo venía del grep inflado con 4 triggers)

## 1. Fuente de verdad de la deny-list

- [x] 1.1 Crear `.github/license-policy.yml` (config-schema de dependency-review-action, lista YAML con los 4 SPDX + header de trazabilidad). **Evidencia**: parser `node` simulado exit 0 → `GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0`; sin `allow-licenses`

## 2. Reconfiguración de ci.yml

- [x] 2.1 Agregador `prebuild-quality-complete`: removida la línea fantasma `- actionlint` del `needs`. **Evidencia**: `actionlint` exit 0 (desapareció el error `job "prebuild-quality-complete" needs job "actionlint"`)
- [x] 2.2 Header `# SUBSTAGE 2B`: quitado `actionlint` de la lista, en lockstep con el delta de `ci-prebuild-substage-structure`. **Evidencia**: grep del header sin `actionlint`
- [x] 2.3 Job `actionlint-advisory` (2C): step convertido a `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12` (nota de apply: se usa `docker run` en vez de `uses: docker://` porque el `-format "$(cat …)"` requiere sustitución de shell, igual que el job scancode; imagen y versión idénticas), conservando `-config-file`, template SARIF, `|| true`, validaciones `test -s` + `jq -e .`, ambos uploads, `name:`/`if:`/`needs:`/`continue-on-error`. **Evidencia**: `grep -c download-actionlint` = 0; actionlint exit 0; comentario del job actualizado (consolidación + sin curl|bash)
- [x] 2.4 Job `dependency-review` (2C): clave inline `deny-licenses` reemplazada por `config-file: .github/license-policy.yml`, conservando `fail-on-severity: moderate`, `allow-ghsas`, `vulnerability-check`, `license-check`, `comment-summary-in-pr: on-failure`, permisos y `name:`. **Evidencia**: grep `deny-licenses:` = 1 (solo el literal regex del parser JS del job scancode, no configuración)
- [x] 2.5 Job `scancode-license-pr-diff` (2C): bloque grep/sed reemplazado por lectura de `.github/license-policy.yml` con `node -e` (parser de lista YAML plana + validación no-vacía con `::error::` + exit 1); log de la lista efectiva actualizado a la nueva fuente; normalización y warnings intactos. **Evidencia**: simulacro local del parser imprime los 4 SPDX
- [x] 2.6 Verificación mecánica conjunta. **Evidencia**: `actionlint` exit 0 en ci.yml y scheduled-security.yml; job count 50 estable (corrección de aritmética: el baseline del snapshot YA estaba post-remoción de `actionlint` — el job counts son: 51 inicio sesión → 50 tras remoción intencional → 50 actual); ids únicos (diff de sets pre-alignment vs actual: único job en un sentido = `actionlint`); `name:` de todos los jobs intactos byte-a-byte vs snapshot (0 cambios); diff acotado a agregador (1 línea), header 2B, job advisory, dependency-review, scancode + comentarios

## 3. Docs

- [x] 3.1 `docs/learning/license-policy.md`: fuente ejecutable actualizada a `.github/license-policy.yml` (bloque YAML en lista, refs del header y del "manda la de config ejecutable"). **Evidencia**: grep sin referencias a la clave inline de ci.yml como fuente
- [x] 3.2 `docs/learning/license-compliance.md` y `docs/learning/dependency-review.md`: mecanismo `config-file` + fuente `.github/license-policy.yml` en tabla de capas, snippet §4.2 (2 bloques: with: + policy file), nota P1 del roadmap y mención del PR-diff. **Evidencia**: grep de referencias actualizadas; sin menciones al scrapeo
- [x] 3.3 `docs/learning/pipeline-config-scan.md`: inventario actualizado (job único advisory 2C, Docker pinneado, sin curl|bash, consolidación) + fila de integraciones oficiales corregida. **Evidencia**: grep sin `download-actionlint` como mecanismo vigente
- [x] 3.4 `docs/learning/quality-gates.md` §2: fila blocking sin `actionlint` (solo `e2e-lint`, `openspec-validate`); fila `actionlint-advisory` actualizada (Docker pinneado, consolidación, FASE 2 = restablecimiento del gate). **Evidencia**: la tabla ya no presenta el gate bloqueante como activo
- [x] 3.5 Prettier aplicado sobre los 5 docs tocados. **Evidencia**: `npx prettier --write` OK (4 reflow menores, license-policy unchanged)

## 4. Validación final

- [x] 4.1 **Evidencia**: `openspec validate ci-supply-chain-hygiene --strict` → "is valid" (exit 0, sin warnings); `openspec validate --specs --strict` → **118 passed, 0 failed**
- [x] 4.2 **Evidencia**: `npm run docs:lint` (gate real) exit 0; join diff×lint sobre los 5 docs → 94 líneas añadidas, 0 violaciones nuevas
- [ ] 4.3 Operacional pre-merge documentado: verificar en GitHub que el check `Quality: ActionLint` no esté en `required_status_checks` del ruleset `main` (removerlo del ruleset si lo está). Verificación: paso anotado y ejecutado post-push, pre-merge
- [ ] 4.4 Primer run observado en GitHub (post-push del PR de implementación, pre-merge): `dependency-review` valida `config-file` sin error de startup, `scancode-license-pr-diff` imprime la deny-list desde el archivo nuevo, `actionlint-advisory` corre vía imagen Docker y sube SARIF. Verificación: run en el PR con los 3 jobs en estado esperado
