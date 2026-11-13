# Tasks: ci-import-boundaries-enforcement

## Fase 1: Upgrade + migración de comando

- [x] Upgrade `dependency-cruiser` 18.2.0 → 18.7.2 en `package.json` + lockfile (mismo PR que la migración). Evidencia: HEAD ya pinea `18.7.2` en `package.json:112` y en `package-lock.json` (`node_modules/dependency-cruiser` 18.7.2, root devDeps 18.7.2), sincronizados y commiteados en trabajo previo; `npm install` confirmó la sync. La versión soporta `--baseline`/`--baseline-mode` (verificado empíricamente). El aporte no commiteado de este change en `package.json` es la migración del comando (HEAD aún usa `depcruise-baseline`).
- [x] Migrar `depcruise-baseline` → `depcruise --baseline --baseline-mode shrink-only` en el script `depcruise:baseline` de `package.json`. Evidencia: `package.json:86` usa `--baseline .dependency-cruiser-known-violations.json --baseline-mode shrink-only` (ratchet mecánico: solo poda).
- [x] Verificar que `--baseline` escribe el mismo formato que `.dependency-cruiser-known-violations.json` antes de migrar. Evidencia: array plano preservado; `--baseline-mode format` mantiene 59 entradas (drift respecto a las 58 del proposal); `shrink-only` reporta "new: 7, same: 51, stale: 8" (poda 8 stale, no añade 7 warn nuevas).

## Fase 2: Exit code fiable (mecanismo real del reporter, sin flag inexistente)

- [x] Confirmar que el CLI principal `depcruise` NO expone `--exit-code`/`-e` (solo `depcruise-fmt`). Evidencia: `depcruise --exit-code 1` → "error: unknown option '--exit-code'" (exit 1). NO se añade el flag inexistente.
- [x] Verificar que scripts root (`depcruise:ci`, `depcruise:report`) ya bloquean vía reporter `err`/`err-html` + `--ignore-known`. Evidencia: `package.json:84-85` sin cambios; `depcruise:ci` = `--output-type err --ignore-known`.
- [x] Verificar que lint-staged ya bloquea vía `err-long --ignore-known`. Evidencia: `package.json:135` `depcruise --config .dependency-cruiser.cjs --output-type err-long --ignore-known=.dependency-cruiser-known-violations.json` (sin flag inexistente).
- [x] Verificar que jobs `client-import-bounds` y `server-import-bounds` ya bloquean vía `err --ignore-known`. Evidencia: `ci.yml` gate `npm run depcruise:{client,server} -- --output-type err --ignore-known`; report no-blocking con `if: always()` + `continue-on-error: true`. Sin cambios de flags.
- [x] Verificar exit code: violación `error` nueva falla (exit != 0), conocida pasa (exit 0). Evidencia: `npm run --silent depcruise:ci` → exit 0 ("7 violations, 0 errors, 7 warnings; 51 known ignored; 8 stale"); config temporal que promueve `no-circular` a error + baseline vacío → exit 26 (26 errores). Temp files limpiados.

## Fase 3: Gobernanza

- [x] Confirmar línea de CODEOWNERS para `.dependency-cruiser-known-violations.json` (hardening P1.3; last-match-wins). Evidencia: `.github/CODEOWNERS:59` `/.dependency-cruiser-known-violations.json @Freelancer-soluctions/devops-team` YA presente. Sin duplicado.
- [x] Documentar ratchet en `quality-policy.md` (regenerar baseline solo en PR dedicado, solo se poda vía `--baseline-mode shrink-only`). Evidencia: §3.2 nueva (mecanismo real de exit code, ratchet shrink-only, CODEOWNERS `:59`, PR dedicado, baseline actual 59 entradas, fase 2); fila de §2 actualizada a 18.7.2; fila de ratchet §3 y nota de upgrade §4.

## Fase 4: Docs

- [x] Actualizar `docs/learning/import-boundaries.md` (exit code = mecanismo real del reporter `err`; comando `--baseline --baseline-mode shrink-only`). Evidencia: §1 versión 18.7.2; §4 fila `depcruise:baseline` migrada + párrafo de baseline (59 entradas, composición, ratchet shrink-only, nota "Exit code real sin flag inexistente"); §11 bloque de poda con `npm run depcruise:baseline`.
- [x] Actualizar `docs/pre-merge-gates-governance.md` (línea 753). Evidencia: párrafo de import boundaries actualizado (18.7.2, exit code real del reporter `err`, 59 entradas, ratchet `shrink-only`, CODEOWNERS `:59`, PR dedicado, referencia a quality-policy §3.2).
- [x] Revisar sync con spec main `config-correctness` (líneas 211, 218-230). Evidencia: el mecanismo ya era correcto (reporter `err`, exit ≠ 0 para violaciones `error`, sin afirmar `--exit-code`); sync factual del comando `depcruise:baseline` (`--baseline --baseline-mode shrink-only`, req. 5) y del conteo/composición del baseline (58→59, scenario). Sin contradicción normativa; el change no declara Modified Capabilities.

## Validación

- [x] `openspec validate --specs --strict` sin errores. Evidencia: `npx openspec validate ci-import-boundaries-enforcement --type change --strict` → "Change is valid"; `npx openspec validate --specs --strict` → 174 passed, 0 failed (incl. `config-correctness` sincronizado). INFO de longitud de requisito son notas preexistentes, no errores.
- [x] Verificar exit code con violación nueva y conocida. Evidencia (Fase 2): `npm run --silent depcruise:ci` → exit 0 (51 known ignored, 0 errors); config temporal que promueve `no-circular` a error + baseline vacío → exit 26. actionlint local v1.7.12 (versión pineada del repo) sobre `ci.yml` + `scheduled-quality.yml` → exit 0, sin hallazgos.
