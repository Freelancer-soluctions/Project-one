# Design

## Context

`depcruise-baseline` deprecado desde 18.3.0 (verificación B7). La documentación de exit codes es imprecisa: el CLI principal `depcruise` NO expone `--exit-code`/`-e` (verificado empíricamente: `depcruise --exit-code 1` → "error: unknown option '--exit-code'"; el flag solo existe en el binario `depcruise-fmt`). El bloqueo fiable ya lo da el reporter `err`/`err-long`: su exit code es el número de violaciones de severidad `error` (`advisedExitCode`, obligatorio desde 18.4.0), combinado con `--ignore-known`. La versión fijada en el repo (18.2.0) no soporta `--baseline` ni `--baseline-mode`. Los jobs de CI ya usan `--output-type err --ignore-known` inline (bloquean correctamente). CODEOWNERS del baseline ya está cubierto por hardening P1.3 (`.github/CODEOWNERS:59`). Docs stale (`import-boundaries.md`, `pre-merge-gates-governance.md`).

## Goals / Non-Goals

**Goals:** Gobernanza del baseline, comando actualizado (`--baseline --baseline-mode shrink-only`), documentación del mecanismo real de exit code, ratchet mecánico, upgrade incluido.

**Non-Goals:** No cambiar reglas de boundaries. No añadir el flag inexistente `--exit-code`/`-e` al CLI principal. No tocar CODEOWNERS para eslint/knip/baseline (pertenece a `ci-quality-gates-blocking-hardening` P1.3, ya implementado). No añadir depcruise al pre-push (el espejo pre-commit ya existe vía lint-staged con `err-long --ignore-known`, que bloquea con el mecanismo real del reporter).

## Decisions

1. **Upgrade en el mismo PR:** 18.2.0 → 18.7.2 junto con la migración del comando, para no dejar CI rojo (patrón de `ci-dead-code-advisory-calibration`).
2. **Exit code = mecanismo real del reporter (sin flag inexistente):** el CLI principal `depcruise` no tiene `--exit-code`/`-e`. El bloqueo fiable proviene del exit code del reporter `err`/`err-long` (= nº de violaciones `error`, vía `advisedExitCode`) + `--ignore-known`. Los scripts root, jobs CI y lint-staged ya lo usan; no requieren cambios de flags. Se corrige la documentación que afirmaba lo contrario. Las violaciones `warn` no bloquean por diseño (deuda controlada con baseline).
3. **`depcruise --baseline --baseline-mode shrink-only`** en lugar de `depcruise-baseline` (deprecado). `shrink-only` es el ratchet mecánico: elimina violaciones corregidas, no añade nuevas. (`--baseline` implica `--no-ignore-known --no-cache`.)
4. **CODEOWNERS:** la línea del baseline (`.dependency-cruiser-known-violations.json`) YA existe en `.github/CODEOWNERS:59` (hardening P1.3). No se duplica (last-match-wins). Este change es dueño del comportamiento del baseline (comando + ratchet), no de la línea de CODEOWNERS.
5. **Ratchet:** regeneración del baseline solo en PR dedicado, solo se poda (`--baseline-mode shrink-only`). Verificado que `--baseline` escribe el mismo formato que `.dependency-cruiser-known-violations.json` (array plano; 59 entradas actuales, drift respecto a las 58 del proposal) antes de migrar.
6. **Docs:** actualizar `import-boundaries.md` y `pre-merge-gates-governance.md` al mecanismo real.

## Risks / Trade-offs

- Flags inexistentes en la versión fija (18.2.0): mitiga el upgrade en el mismo PR.
- Premisa incorrecta de `--exit-code` en el proposal/spec original: corregida al mecanismo real (reporter `err` exit = nº errores). Verificado empíricamente: baseline conocido pasa (exit 0, 51 known ignored), violación `error` nueva bloquea (exit 26 con config temporal que promueve `no-circular` a error).
- Regeneración de baseline con `--baseline`: formato validado contra el baseline existente (59 entradas preservadas con `--baseline-mode format`; `shrink-only` poda 8 stale, no añade 7 warn nuevas).
- Solape de CODEOWNERS con hardening: resuelto (la línea ya existe en P1.3; sin duplicado).

## Migration Plan

1. Upgrade dependency-cruiser 18.7.2 (package.json + lockfile).
2. Migrar `depcruise-baseline` → `depcruise --baseline --baseline-mode shrink-only` en el script `depcruise:baseline`.
3. Verificar que scripts root (`depcruise:ci`, `depcruise:report`), jobs CI y lint-staged ya bloquean vía `err`/`err-long` + `--ignore-known` (sin flag inexistente). Sin cambios de flags.
4. Confirmar CODEOWNERS del baseline ya cubierto (`:59`, hardening P1.3). Sin duplicado.
5. Verificar: violación `error` nueva falla (exit != 0), conocida pasa (exit 0).
6. Actualizar docs stale al mecanismo real.
7. Documentar ratchet mecánico (`shrink-only`) en `quality-policy.md`.

## Open Questions

- Ninguna.
