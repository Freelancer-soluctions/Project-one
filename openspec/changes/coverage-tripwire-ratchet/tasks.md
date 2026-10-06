# Tasks

## 1. Baseline verificable antes de tocar nada

- [x] 1.1 Ejecutar la suite completa con coverage en ambos workspaces y guardar la salida de `check-coverage.mjs` como baseline de exit codes (verde). Verificar que el comando y sus exit codes quedan anotados para comparar en 2.4.
- [x] 1.2 Medir por área la cobertura desde `coverage-summary.json` (entradas por archivo) e identificar 2-3 globs de áreas con cobertura alta y estable (utilities/hooks/helpers) como candidatas al primer threshold granular. Verificar que la lista de áreas y sus números medidos quedan en el PR.

> **Baseline medido (2026-10-05).** client: 87.02/62.16/69.14/87.7 vs 84/49/63/85 → `exit 0`.
> server: 42.28/21.75/8.98/42.76 vs 39/18/7/39 → `exit 0`. server=144 ficheros, client=29.
> Márgenes estrechos en server (functions 8.98 vs 7; branches 21.75 vs 18) → el ratchet es lo que los sostendrá.
> Áneas al 100%Aggregate candidatas: `src/modules/**/schemas/**` (22 ficheros), `src/lib/**`,
> `src/config/**`, `src/hooks/**`, `src/utils/{constants,multer,pagination}/**`,
> `src/modules/security/**`. `src/components/ui/**` es heterogénea (peor fichero: functions 62.5).
> Los ficheros `*.json` de locale reportan `total=0 → pct=100`, así que no rompen `perFile`.

## 2. Guard: granularidad y normalización de rutas (antes de configurar thresholds)

- [x] 2.1 Añadir a `scripts/ci/check-coverage.mjs` la lectura de `thresholds.perFile` y de thresholds por glob desde el config del workspace, evaluando **adicionalmente** al `summary.total` existente. Verificar que con la configuración actual (solo global) el guard produce exactamente los mismos exit codes y texto que en 1.1.
- [x] 2.2 Normalizar las claves de `coverage-summary.json` a ruta relativa a la raíz del workspace con separadores `/` antes de casar globs (hoy son absolutas y con backslashes en Windows). Verificar que un glob `src/**` casa ficheros en Windows, no devuelve cero coincidencias.
- [x] 2.3 Hacer que el guard falle nombrando workspace, métrica, fichero y valor medido cuando un threshold por fichero o por glob no se cumple, en vez de imprimir solo `✅`. Verificar forzando un umbral por fichero inalcanzable y observando el nombre del fichero en la salida.
- [x] 2.4 Comprobar paridad de veredicto: provocar un fallo solo por `perFile` (global en verde) y verificar que **tanto** la corrida de Vitest **como** el guard fallan. Verificar que ningún punto de enforcement reporta éxito.

> **Verificado.** 2.1: con solo el piso global ambos guards dan exit 0 con los mismos valores que el baseline.
> 2.2: los globs casan 1/1/1/6 ficheros en client sobre claves absolutas con backslashes.
> 2.3: con `src/hooks/** branches: 99` el guard imprime `❌ src/hooks/useChangedFields.js branches: 92.68%`
> y sale 1. 2.4: **Vitest también falla** con
> `ERROR: Coverage for branches (92.68%) does not meet "src/hooks/**" threshold (99%)` y sale 1.

## 3. Configuración de thresholds granulares

- [x] 3.1 Añadir `perFile` y los globs del paso 1.2 a `apps/client/vitest.config.js` **bajo** el piso global existente (sin tocar 84/49/63/85). Verificar que la corrida en verde y que el guard sigue en verde.
- [x] 3.2 Repetir para `apps/server/vitest.config.js` bajo el piso 39/18/7/39. Verificar verde en corrida y guard.
- [x] 3.3 Confirmar que `coverage.thresholds.autoUpdate` sigue sin activarse por defecto en ningún config. Verificar con grep que solo el script del grupo 4 lo pasa por flag.

> **Verificado.** client: 4 globs (`src/lib/**`, `src/config/**`, `src/hooks/**` con `perFile: true`;
> `src/components/ui/**` solo agregado por ser heterogénea). server: 5 globs
> (`src/modules/**/schemas/**` con `perFile: true` sobre 22 ficheros, más 4 singletons al 100%).
> `vitest run --coverage` sale 0 en ambos y el guard sale 0 en ambos. Ningún config declara `autoUpdate`.

## 4. Tier local: verificación y ratchet

- [x] 4.1 Añadir `coverage:check` en el `package.json` raíz: suite completa con coverage en ambos workspaces y después `check-coverage.mjs` por workspace, propagando el fallo si cualquiera no cumple. Verificar que sale 0 en verde y !=0 al bajar un umbral.
- [x] 4.2 Verificar que `coverage:check` regenera siempre coverage de suite completa y nunca evalúa thresholds contra un reporte diff-scoped previo (dejar un `test:changed` por delante y comprobar el comportamiento). Verificar el resultado.
- [x] 4.3 Añadir `coverage:ratchet` en la raíz que invoque la suite completa con `--coverage.thresholds.autoUpdate` y luego reporte, leyendo el diff del config, qué thresholds subieron y de qué valor a qué valor. Verificar que tras subir cobertura el comando muestra el antes/después y que los thresholds suben.
- [x] 4.4 Verificar que el ratchet **no** baja umbrales: con cobertura por debajo de un umbral existente, confirmar que el config queda intacto y que el comando lo reporta como sin cambios.
- [x] 4.5 Confirmar que ningún workflow de CI pasa `--coverage.thresholds.autoUpdate` (grep en `.github/workflows/`). Verificar que no hay coincidencias.

> **Verificado.** 4.1/4.2: `npm run coverage:check` sale 0 (client 26 ficheros, server 21); corre siempre la
> suite completa por workspace, invoca el MISMO guard que CI, y no evalúa el guard si la corrida de tests falló
> (evita un veredicto sobre un resumen obsoleto). 4.3: subió client 84/49/63/85 → 87.02/62.16/69.14/87.7 y
> server 39/18/7/39 → 42.28/21.75/8.98/42.76, más los 9 globs. 4.4: con un umbral puesto **por encima** de la
> cobertura real (99 vs 92.68) el ratchet salió 1 y **dejó el config intacto**. 4.5: sin coincidencias en
> `.github/`.

> **HALLAZGO QUE FORZÓ UN AJUSTE DE DISEÑO (D4).** El `autoUpdate` de Vitest **no funciona** con la forma de
> config del repo: `defineConfig(mergeConfig(shared, {...}))` lanza
> `Failed to update coverage thresholds. Configuration file is too complex.` porque `resolveConfig()` de Vitest
> solo reconoce `{test:{}}`, `defineConfig({...})` y `mergeConfig(..., defineConfig({...}))`. Se invirtió el orden
> en `apps/{client,server}/vitest.config.js` (igual que ya hacia `vitest.smoke.config.js`). Es un cambio de
> forma, no de comportamiento: `coverage:check` sigue dando los mismos veredictos.

## 5. Documentación

- [x] 5.1 Reestructurar `docs/learning/coverage-tripwire-floor-ratchet.md` con CI y local como dos tracks en paralelo, sustituyendo el §5 único (hoy íntegramente CI). Verificar que el lector puede encontrar "cómo verifico mi coverage local" sin pasar por la sección de CI.
- [x] 5.2 Documentar la granularidad: por qué los thresholds por fichero/glob se añaden **bajo** el piso global (floor bajo + granularidad alta) y el criterio para elegir un glob. Verificar que la sección conecta con `coverage-threshold-granularity` sin contradecirla.
- [x] 5.3 Añadir la tabla de paridad local↔CI: cada job `*-coverage` frente a su equivalente local, y declarar explícitamente que `.husky/pre-push` corre TIA diff-scoped **sin** evaluar coverage y que el comando local es la vía de verificación. Verificar que la tabla no promete paridad donde no la hay (p. ej. el deferimiento D18).
- [x] 5.4 Documentar el ratchet: cuándo usarlo (tras añadir tests), que solo sube, y que nunca se usa en CI. Verificar que la sección enlaza con el comando real.
- [x] 5.5 Corregir el cross-reference roto en `docs/learning/unit-tests-enterprise.md` (apunta a `docs/learning/ci-cd/coverage-tripwire-floor-ratchet.md`; el archivo está en `docs/learning/`). Verificar que la ruta existe.

> **Verificado.** §3.3 pasa de "pendiente" a implementado, con la tabla de semántica de Vitest (globs casan contra
> ruta relativa, `perFile` no se hereda, globs también cuentan para el global) y la config real. Nuevas §5.5 (tier
> local), §5.6 (paridad local↔CI, incluyendo lo que NO tiene equivalente local: artefacto JUnit,
> `dorny/test-reporter`, runner) y §5.7 (ratchet + la trampa de magicast). §6.1 actualizado con las estrategias
> buenas/malas reales. Checklist pasa de 14 a 17 items. `markdownlint`: 10 MD013, **idéntico al baseline**.

## 6. Verificación de cierre

- [x] 6.1 Ejecutar la verificación de cobertura local en verde y en rojo (bajando un umbral temporalmente) y verificar que el veredicto coincide con el que darían los jobs de CI para el mismo estado.
- [x] 6.2 Ejecutar `npm run docs:lint` y verificar que los docs tocados no introducen errores nuevos de markdownlint respecto a su baseline.
- [x] 6.3 Confirmar que ningún `continue-on-error` fue modificado y que `prebuild-unit-tests-complete.needs` sigue intacto (la promoción a FASE 2 es de `ci-testing-gate-promotion`).

> **Verificado.** 6.1: con `statements: 99` (real 87.02) el guard sale **1** y Vitest sale **1** con
> `ERROR: Coverage for statements (87.02%) does not meet global threshold (99%)` — mismo veredicto. Restaurado a 87.02
> y ambos verdes otra vez. 6.2: `npm run docs:lint` → solo 10 MD013 preexistentes, sin reglas nuevas. 6.3: `.husky/`
> sin cambios; ningún `autoUpdate` en `.github/workflows/`; el diff de `ci.yml` es de la activación FASE 1 de la
> sesión previa, este change no lo toca. `eslint` y `prettier --check` limpios en los 3 scripts nuevos y los 3 configs.
