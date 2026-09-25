# Tasks

## 1. ESLint config por capa (umbrales de complejidad)

- [x] 1.1 SUSTITUIR los dos bloques legacy `complexity: ['error', { max: 20 }]` por workspace (bloque 6 actual) por un bloque core `files: ['apps/*/src/**/*.{js,jsx}']` con `complexity: ['error', { max: 15 }]` y comentarios `//` en español (qué + por qué). Verificar: `npx eslint --print-config <fichero core>` muestra `complexity: ["error", {"max": 15}]`; `grep -n "max: 20" eslint.config.js` sin resultados.
- [x] 1.2 Añadir bloque `complexity` utils (max 10) para `apps/**/src/utils/**` con comentarios ES. Verificar: `npx eslint --print-config apps/server/src/utils/<fichero>.js` muestra `{"max": 10}`.
- [x] 1.3 Añadir bloque `complexity: 'off'` para tests (`**/*.test.*`, `**/*.spec.*`, `e2e/tests/**`) como ÚLTIMO de los tres bloques de capa (hay `.unit.test.js` dentro de `src/utils/`; el último define en merge) con comentario ES. Verificar: `--print-config` sobre un `.test.js` (p. ej. `apps/server/src/utils/prisma/sanitizePrismaMessage.unit.test.js`) y sobre un spec de `e2e/tests/` muestra la regla desactivada.
- [x] 1.4 Ajustar/refactorizar funciones que violen los nuevos umbrales (o añadir `eslint-disable` con motivo ES). Verificar: `npm run lint --workspaces --if-present` → exit 0.

## 2. max-lines-per-function sin ignorePattern

- [x] 2.1 Declarar `'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }]` en el bloque core de `eslint.config.js` SIN opción `ignorePattern`, con comentario ES (qué + por qué; `max: 80` = calibración inicial, se ajusta solo en config). FASED: exención de Fase 1 para `apps/client/src/**` vía bloque `files` con comentario ES que documente la deuda (mediana 167 líneas, max 638) y la Fase 2. Verificar: `grep -n "ignorePattern" eslint.config.js` sin resultados; `npx eslint --print-config <fichero server core>` muestra `{"max":80,"skipBlankLines":true,"skipComments":true}`; `npx eslint --print-config <fichero client src>` muestra mlpf `off` y `complexity` `["error",{"max":15}]`.
- [x] 2.2 Exentos amplios vía bloque `{ files: [...], rules: { 'max-lines-per-function': 'off' } }` (fixtures/archivos generados si existen) y `'max-lines-per-function': 'off'` explícito en el bloque de tests (defensa en profundidad, espeja `complexity: 'off'`). Verificar: `--print-config` sobre un fichero exento y sobre un `.test.js` muestra `off`.
- [x] 2.3 Casos puntuales con `// eslint-disable-next-line max-lines-per-function -- <motivo ES>`. Verificar: `npm run lint` exit 0 y `npx eslint . --report-unused-disable-directives` sin directs huérfanos.

## 3. Script lint e2e + bloque config + job CI

- [x] 3.1 Añadir `"lint": "eslint \"tests/**/*.js\" playwright.config.js --max-warnings 0"` a `e2e/package.json`. Verificar: `npm run lint --workspace=e2e` ejecuta y hace exit 0.
- [x] 3.2 Añadir bloque `files: ['e2e/**/*.js', 'e2e/*.js']` en `eslint.config.js` con globals Node (`...globals.node`) y comentario ES. Verificar: `npx eslint --print-config e2e/playwright.config.js` sin warning "ignored due to missing configuration".
- [x] 3.3 Añadir job `e2e-lint` en `.github/workflows/ci.yml` (Substage 2B, patrón de `client-lint`, `--max-warnings 0`) y añadirlo a los `needs` del agregador `prebuild-quality-complete` (13 → 14 jobs). Verificar: `actionlint .github/workflows/ci.yml` → sin errores; `e2e-lint` aparece en el `needs` de `prebuild-quality-complete`.

## 4. Actualizar docs/learning/eslint-configuration.md

- [x] 4.1 Corregir TODAS las líneas desactualizadas: recuentos y RANGOS DE LÍNEA de los bloques en §2 ("235 líneas"/"8 elementos", Bloques 1–7 — insertar los bloques de capa desplaza todo lo posterior), árbol de §1.2, diagrama de flujo de §1.3, ejemplo de reglas de §3.8 (`max: 20`), nota e2e de §4.2, refs de umbral 20 (§2 Bloque 6, §4.5, §4.8). Verificar: `grep -n "max 20\|max: 20\|235 líneas\|8 elementos" docs/learning/eslint-configuration.md` → sin restos obsoletos; los números de línea citados coinciden con `wc -l eslint.config.js`.
- [x] 4.2 Actualizar tabla de jobs CI de §4.5 (añadir `e2e-lint`, estado de `*-complexity`). Verificar: la tabla coincide con los jobs reales de `.github/workflows/ci.yml`.

## 5. Crear docs/learning/eslint-complexity-configuration.md (ES)

- [x] 5.1 Crear el doc en español explicando: modelo por capas (core 15 / utils 10 / tests off), por qué sin `ignorePattern` (bloques `files`/`ignores` + `eslint-disable` documentado), wiring e2e lint (script → bloque → job), y cómo cambiar umbrales (solo en `eslint.config.js`). Verificar: `npx prettier --check docs/learning/eslint-complexity-configuration.md` → pass; enlace añadido desde `docs/learning/eslint-configuration.md` §Documentación interna relacionada.

## 6. Verificación integral

- [x] 6.1 `openspec validate eslint-complexity-rules --strict` → pass. Verificar: exit code 0.
- [x] 6.2 `npm run lint --workspaces --if-present` → exit 0 en todos los workspaces (incluye e2e). Verificar: exit 0 sin warnings (`--max-warnings 0`).
