# Tasks

## 1. Configuration Corrections

- [x] 1.1 Alinear el `complexity` del server: quitar el override `--rule '{"complexity": ...}'` de los jobs `server-complexity` y `client-complexity` en `.github/workflows/ci.yml` (servidor 15 → 20 heredado de la config) — verificar con `grep -n '"complexity"' .github/workflows/ci.yml` (sin valores divergentes) y `npx eslint --print-config apps/server/src/app.js` (muestra `complexity: ["error", { "max": 20 }]`)
  - → Ambos jobs ahora ejecutan `npx eslint "src/**/*.{js,jsx}"` / `npx eslint "src/**/*.js"` sin `--rule` (con comentario señalando a `eslint.config.js` como fuente única). `grep complexity ci.yml` ya no muestra ningún `--rule`/valor divergente. `--print-config apps/server/src/app.js` → `complexity: [2,{"max":20}]`. actionlint OK.
- [x] 1.2 Quitar `...globals.browser` del bloque backend (`files: ['apps/server/**/*.js']`) en `eslint.config.js`, manteniendo `...globals.node` y `...vitest.environments.env.globals` — verificar con `npx eslint --print-config apps/server/src/app.js` (globals sin `window`/`document`, con `process`) y `npm run lint --workspace=apps/server` (exit 0, cero errores `no-undef` nuevos)
  - → Eliminado (con comentario del change). `--print-config` (vía `languageOptions.globals`): 87 globals, `window`/`document` ausentes, `process`/`describe`/`expect`/`console` presentes. `npm run lint --workspace=apps/server` exit 0 — cero errores `no-undef` nuevos (ningún código de server usaba globals de navegador).

## 2. Dependency Verification

- [x] 2.1 Verificar `eslint-plugin-import`: buscar referencias en `eslint.config.js`, `apps/**`, `.github/**` y docs (`grep -rn "eslint-plugin-import" eslint.config.js apps .github docs`); si hay cero consumidores, retirarlo de `devDependencies` en `package.json` y verificar con `npm install` + `npm run lint` (exit 0); si se encuentra un consumidor, registrarlo en `eslint.config.js` en su lugar y dejar constancia del hallazgo en este change
  - → Cero consumidores en código (solo `package.json` y menciones en la doc canónica). Desinstalado con `npm uninstall eslint-plugin-import` (removed 10 packages incl. deps transitorias). `npm run lint` raíz exit 0 tras el cambio; `package.json`/`package-lock.json` sin referencias. Hallazgo registrado: los límites de import los aplica `dependency-cruiser` (jobs `*-import-bounds`), no este plugin.

## 3. Documentation Validation

- [x] 3.1 Validar la doc canónica `docs/learning/eslint-configuration.md` contra la configuración corregida: actualizar los hallazgos de §2 (discrepancia 15/20 resuelta), §3.6/§4.3 (sin `globals.browser` en backend; tabla de plugins sin `eslint-plugin-import`) y §4.5 (jobs `*-complexity` sin `--rule`), verificando coherencia con `npx eslint --print-config apps/server/src/app.js` y los jobs `*-complexity` de `ci.yml`, y cerrar con `openspec validate eslint-configuration --strict` en verde
  - → Doc actualizada: Bloque 3 (§2) con globals corregidos + nota de verificación; Bloque 6 (§2) discrepancia marcada resuelta; §3.6 nota práctica backend/frontend; §4.3 plugin marcado ❌ desinstalado (ejemplo conservado como referencia histórica); §4.5 tabla CI actualizada + recomendación de coherencia marcada resuelta. `openspec validate eslint-configuration --strict` → válido, sin warnings de archive.

## Notas de implementación

- **Corrección de artefactos del change:** el delta `config-correctness` usaba `## MODIFIED Requirements` sobre un spec que no existe en `openspec/specs/` (`config-correctness` nunca fue creado por un change previo) — el archive lo habría rechazado ("only ADDED requirements are allowed for new specs"). Corregido a `## ADDED Requirements` con contexto de la corrección en cada requisito, y se añadió `## Purpose`. `documentation-canónica-es` ya usaba ADDED correctamente.
- **Nuevos requerimientos (comentarios explicativos en `eslint.config.js`):** se implementaron los dos ítems añadidos al change: (1) comentarios bloque a bloque en español (ignores, base, server, client, storybook, complexity, prettier) y (2) notas de decisión. Durante la integración se corrigieron afirmaciones obsoletas que los comentarios introducían: duplicación de la línea `'no-console': 'off'`, y referencias a la discrepancia CI-15-vs-config-20 que la tarea 1.1 ya eliminó (header "CI usa 15", "re-evalúa con max 15", "divide la función hasta ≤15", NOTA cruzada al bloque 3). Los comentarios ahora describen el estado post-fix: threshold único 20 en `eslint.config.js`, sin override CI. Se añadió la nota de gradación de reglas al bloque base y la regla práctica de globals por entorno en el bloque server.
- **Alcance CI:** `server-complexity` sigue `if: false` (disabled) — este change corrige su contenido, no su activación (non-goal del design).

- Configuración de `eslint.config.js` completada con comentarios explicativos en español para cada bloque (ignores, base, server, client, storybook, complexity, prettier), incluyendo notas sobre decisiones (gradación de reglas, CI-15 vs config-20, prettier al final, `globals.browser` en server).
- `npm run lint` pasa (`exit 0`).
