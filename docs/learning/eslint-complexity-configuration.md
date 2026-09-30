# Configuración de complejidad de ESLint en Project One

> **Change de origen:** `eslint-complexity-rules` (OpenSpec)
> **Archivo de configuración:** `eslint.config.js` (raíz del monorepo, flat config ESLint 9)
> **Doc canónica relacionada:** [docs/learning/eslint-configuration.md](eslint-configuration.md)

---

## Índice

1. [Modelo mental: umbrales por capa](#1-modelo-mental-umbrales-por-capa)
2. [`max-lines-per-function` sin patrón de exención interno](#2-max-lines-per-function-sin-patrón-de-exención-interno)
3. [Wiring del lint de e2e (script → bloque → job)](#3-wiring-del-lint-de-e2e-script--bloque--job)
4. [Cómo cambiar los umbrales](#4-cómo-cambiar-los-umbrales)

---

## 1. Modelo mental: umbrales por capa

La complejidad ciclomática mide ramas por función (`if/else`, loops, `case`,
`&&/||`, `catch`...). Un máximo bajo obliga a extraer helpers y mantiene el
código testeable. En lugar de un único umbral plano para todo el monorepo, la
configuración define **tres capas**:

| Capa  | Glob `files`                                                                                                        | Umbral `complexity`      | Racional                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| core  | `apps/*/src/**/*.{js,jsx}` (todo `src` de producción: módulos, rutas, middleware, componentes, hooks, servicios...) | `['error', { max: 15 }]` | Lógica de dominio: demasiadas ramas ocultan bugs y dificultan testear                |
| utils | `apps/**/src/utils/**`                                                                                              | `['error', { max: 10 }]` | Una utilidad con muchas ramas debería ser varias funciones o una tabla de decisiones |
| tests | `**/*.test.{js,jsx}`, `**/*.spec.{js,jsx}`, `e2e/tests/**`                                                          | `'off'`                  | Los tests son declarativos; muchos casos por función es normal                       |

Dos reglas de oro que hacen funcionar este modelo:

1. **EL ORDEN IMPORTA.** Los bloques se declaran `core → utils → tests`. En
   flat config, _el último bloque que define la regla gana en el merge_. Por
   eso el bloque de tests va SIEMPRE al final: hay ficheros `.unit.test.js`
   dentro de `src/utils/` (p. ej.
   `apps/server/src/utils/prisma/sanitizePrismaMessage.unit.test.js`) y el
   test-off debe ganar sobre el 10 de utils y el 15 de core.
2. **Sin bloques legacy.** Los dos bloques antiguos `complexity: max 20` por
   workspace fueron eliminados. Si quedara alguno detrás, pisaría 15/10
   ("último gana"); si quedara delante, dejaría un 20 fantasma en ficheros que
   ahora son core.

Además, `max-lines-per-function` (ver §2) vive en el bloque core y se apaga
explícitamente en el bloque de tests. La exención temporal de client (Fase 1)
fue **eliminada en la Fase 2** (change `eslint-mlpf-client-phase2`): el umbral
max 80 aplica hoy a todo el core, server y client.

Verificación del merge por fichero:

```bash
npx eslint --print-config apps/server/src/modules/auth/auth.service.js | jq .rules.complexity
# ["error",{"max":15}]
npx eslint --print-config apps/server/src/utils/pagination/pagination.js | jq .rules.complexity
# ["error",{"max":10}]
npx eslint --print-config apps/server/src/utils/prisma/sanitizePrismaMessage.unit.test.js | jq .rules.complexity
# ["off",{"max":10}]   ← severity 0 = off (las opciones residuales son inertes)
```

## 2. `max-lines-per-function` sin patrón de exención interno

La regla está declarada en el bloque core con opciones fijadas:

```js
'max-lines-per-function': [
  'error',
  { max: 80, skipBlankLines: true, skipComments: true },
],
```

- `max: 80` — calibración inicial generosa (el default de ESLint es 50). Se
  ajusta SOLO aquí, nunca por fichero.
- `skipBlankLines` / `skipComments` — miden lógica efectiva, no documentación.

**Por qué NO se usa `ignorePattern`:** esa opción esconde exenciones dentro de
la propia regla — no son visibles en `--print-config` por capa y son difíciles
de auditar. En su lugar, las exenciones se declaran de dos formas, ambas
explícitas y grep-eables:

1. **Bloque `files`/`ignores` dedicado** — para exenciones amplias. **Hoy no
   hay ningún bloque de exención activo**: la exención temporal de client
   (Fase 1) fue **eliminada en la Fase 2** (change
   `eslint-mlpf-client-phase2`) tras refactorizar los ~104 componentes que
   superaban el umbral. El umbral max 80 aplica así a todo el core (server y
   client). El bloque eliminado era de este estilo:

   ```js
   // ELIMINADO en Fase 2 (change eslint-mlpf-client-phase2):
   // Exención TEMPORAL de max-lines-per-function para client (Fase 1).
   // DEUDA TÉCNICA DOCUMENTADA: el baseline de client tenía 104 funciones
   // de más de 80 líneas (mediana 167, máximo 638)...
   {
     files: ['apps/client/src/**/*.{js,jsx}'],
     rules: { 'max-lines-per-function': 'off' },
   },
   ```

   Si en el futuro se necesitara una exención amplia nueva, se declara con
   este mismo patrón (bloque `files` con comentario de deuda y change que
   documente su caducidad), no con `ignorePattern`.

2. **Disable inline documentado** — para casos puntuales:

   ```js
   // eslint-disable-next-line max-lines-per-function -- tabla de decisión extensa, ver issue #XXX
   ```

   `reportUnusedDisableDirectives` flaggea los disables que quedan huérfanos.

## 3. Wiring del lint de e2e (script → bloque → job)

El workspace `e2e` (Playwright) está cubierto por tres piezas coordinadas:

1. **Script** en `e2e/package.json`:

   ```json
   "lint": "eslint \"tests/**/*.js\" playwright.config.js --max-warnings 0"
   ```

2. **Bloque de config** en `eslint.config.js`:

   ```js
   {
     files: ['e2e/**/*.js', 'e2e/*.js'],
     languageOptions: {
       ecmaVersion: 'latest',
       sourceType: 'module',
       globals: { ...globals.node, ...globals.browser },
     },
   },
   ```

   Sin este bloque, los ficheros de e2e caerían fuera de todo `files`
   ("... ignored due to missing configuration"). Los globals incluyen
   `globals.node` (los specs corren en Node) **y** `globals.browser`:
   los callbacks de `page.evaluate()` se ejecutan en el navegador, donde
   `window`/`document` sí existen y `no-undef` los necesita.

3. **Job CI** `e2e-lint` en `.github/workflows/ci.yml` (Substage 2B), mismo
   patrón que `client-lint`/`server-lint` (condición sobre la salida `e2e` de
   `repo-discovery`, action `setup-monorepo`, `--max-warnings 0`), añadido a
   los `needs` del agregador `prebuild-quality-complete` (13 → 14 jobs).

## 4. Cómo cambiar los umbrales

- **Siempre en `eslint.config.js`.** Nunca desde la CLI de CI (`--rule`) ni
  por fichero: el flag `--rule` de CLI gana silenciosamente sobre el config y
  rompería la coherencia local/CI.
- Los jobs `client-complexity` y `server-complexity` ejecutan
  `npx eslint "src/**..."` y heredan los umbrales por capa del config.
- Tras cambiar un umbral: correr `npm run lint --workspaces --if-present`
  y verificar el merge con `npx eslint --print-config` sobre un fichero
  representativo de cada capa.
