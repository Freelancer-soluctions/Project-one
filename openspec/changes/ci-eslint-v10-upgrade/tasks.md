# Tasks: ci-eslint-v10-upgrade

> **Estado (2026-11-12): FASE 1 implementada; FASE 2 (promoción) BLOQUEADA.**
> El advisory con eslint@10.14.0 revela que la config flat es compatible
> (`--print-config` exit 0, 511 reglas) y server/e2e lintean limpio, pero `client`
> crashea (exit 2): `eslint-plugin-react@7.37.5` usa `context.getFilename()`
> (removido en v10). `eslint-plugin-react` (7.37.5) y `eslint-plugin-jsx-a11y`
> (6.10.2) son las últimas publicadas en npm y no declaran peer `^10`. No se
> promueve hasta que el advisory pase (design D3/D8; `quality-policy.md` §4.1).

## Fase 1: Advisory

- [x] Añadir job `eslint-v10-advisory` en `ci.yml` con `continue-on-error: true` ejecutando lint con ESLint 10 vía `npx --package eslint@10 eslint …`
  - Evidencia: `.github/workflows/ci.yml:2812`. `continue-on-error: true`, `needs: repo-discovery`, `permissions: contents: read`, `setup-monorepo` con `prisma: 'true'`. Un step bash recorre client/server/e2e (`set +e`, exit agregado) con `npx --yes --package eslint@10 eslint <glob> --no-cache --max-warnings 0`. Globs espejo del lint blocking: `apps/client/**/*.{js,jsx}`, `apps/server/**/*.{js,ts}`, `e2e/tests/**/*.js` + `e2e/playwright.config.js`. Condición: PR-only ∧ (client ∨ server ∨ e2e ∨ shared). `--no-cache` evita contaminar la caché de v9.
- [x] Ejecutar advisory y corregir reglas renombradas/removidas y plugins incompatibles en `eslint.config.js`
  - Evidencia: advisory ejecutado localmente con el script exacto del job. Config flat **compatible**: `eslint@10 --print-config apps/client/.storybook/main.js` exit 0 (511 reglas, incl. `react/display-name` sev 2); ESLint 10 no removió reglas core → **sin reglas renombradas/removidas que corregir**. server (260 archivos) y e2e (7) exit 0. La incompatibilidad de `client` es de **código upstream del plugin** (`eslint-plugin-react/lib/util/version.js:31` llama `context.getFilename()`), no de config: no corregible en `eslint.config.js`. Sin cambios a la config (Non-Goal: no tocar reglas/umbrales).
- [ ] Verificar que el advisory pasa
  - **NO pasa (bloqueado):** client exit 2 (crash `eslint-plugin-react@7.37.5`, API removida `context.getFilename()`); server/e2e exit 0. Exit agregado del job = 1, pero `continue-on-error: true` → no bloquea el merge. Este resultado NEGATIVO es la señal que gatea la Fase 2 (design D3). Se re-verificará cuando upstream publique plugins compatibles con v10.
- [x] Confirmar que el advisory NO entra en `needs` del agregador (exento de skipped=fail)
  - Evidencia: `grep eslint-v10-advisory ci.yml` → única aparición en la definición del job (:2812); ausente de `prebuild-quality-complete.needs` (:3546-3575). El verdict (`quality-aggregator-verdict.mjs`) solo lee `needs`, así que el advisory es invisible para él y no lo tiñe.

## Fase 2: Promoción

> **BLOQUEADA** — condicionada a que el advisory pase (design D3). Hoy el advisory
> falla en client por plugins upstream sin peer `^10`. No se ejecuta ningún ítem
> hasta que `eslint-plugin-react` y `eslint-plugin-jsx-a11y` publiquen releases
> compatibles con ESLint 10. Criterio de salida y procedimiento: `quality-policy.md` §4.1.

- [ ] Actualizar `eslint` y `@eslint/js` a 10.x exacto (sin caret) en `package.json`
- [ ] Actualizar `typescript-eslint` si es necesario para compatibilidad
- [ ] Actualizar lockfile
- [ ] Crear `eslint-suppressions.json` con `npx eslint . --suppress-all` por workspace si no existe; regenerar si cambian los hallazgos
- [ ] Añadir patrón `eslint-suppressions.json` (y verificar `eslint.config.*`) en `.github/CODEOWNERS`
  - Nota: los patrones **ya existen** (`/eslint-suppressions.json:60`, `/eslint.config.*:55`, `/eslint.config.js:54`) tras hardening P1.3 → verificación no-op, sin líneas nuevas (evita duplicados last-match-wins).
- [ ] Actualizar `quality-policy.md` con la fecha de promoción (crear plantilla mínima si no existe)
  - Nota: la policy **ya existe**; §2 (fila advisory) y §4.1 (estado de adopción + bloqueo) actualizados en este PR. La fila pasa a `blocking` con fecha solo al promover.
- [ ] Retirar job advisory

## Validación

- [ ] `npm run lint` pasa con ESLint 10 en client/server/e2e
  - **Parcial (bloqueado):** server/e2e exit 0; client exit 2 (crash plugin upstream). No pasa hasta que upstream soporte v10. El lint blocking de v9 (`npm run lint`) sigue verde (sin cambios a config/deps en este PR).
- [x] `openspec validate --specs --strict` sin errores
  - Evidencia: `npx openspec validate ci-eslint-v10-upgrade --type change --strict` → "Change is valid" (exit 0). `npx openspec validate --specs --strict` → **176 passed, 0 failed**. `actionlint` v1.7.12 (binario local, misma versión que el contenedor CI) con `-config-file .github/actionlint.yaml` sobre todos los workflows → exit 0. Script del advisory ejecutado localmente: client exit 2 / server exit 0 / e2e exit 0, exit agregado 1 (esperado; `continue-on-error` lo neutraliza).
