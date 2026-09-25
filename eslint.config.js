// =============================================================================
// Configuración ESLint del monorepo (Flat Config, ESLint 9+).
// Archivo único que cubre backend (apps/server), frontend (apps/client) y
// Storybook. Cada bloque está comentado en español para explicar QUÉ hace
// y POR QUÉ se decidió así. El código existente no debe alterarse: solo se
// añaden/clarifican comentarios.
// =============================================================================

// Importa la configuración base oficial de ESLint para JavaScript.
// @eslint/js expone las reglas recomendadas mantenidas por el core team de ESLint.
import js from '@eslint/js';

// Plugin oficial de ESLint para React.
// Proporciona reglas específicas para JSX, componentes, props, etc.
import react from 'eslint-plugin-react';

// Plugin oficial para validar las reglas de React Hooks.
// Previene errores como dependencias mal definidas en useEffect.
import reactHooks from 'eslint-plugin-react-hooks';

// Configuración que desactiva todas las reglas de ESLint
// que entran en conflicto con Prettier.
// Debe aplicarse SIEMPRE al final.
import prettier from 'eslint-config-prettier';

// Importa las variables globales predefinidas para diferentes entornos
// (browser: window/document; node: process/__dirname; etc.).
import globals from 'globals';

// Plugin de Vitest: reglas de calidad para describes/its/expects
// (p. ej. no-focused-tests, valid-expect). Se reutilizan sus globals
// (describe, it, expect, vi) vía vitest.environments.env.globals.
import vitest from '@vitest/eslint-plugin';

// Plugin oficial de Storybook: valida CSF (Component Story Format),
// default-exports, nombres de stories, jerarquía, etc.
import storybook from 'eslint-plugin-storybook';

// Exporta la configuración usando Flat Config (formato recomendado por ESLint 9+)
export default [
  // ---------------------------------------------------------------------------
  // (1) Ignores — qué se excluye del lint y por qué.
  // ---------------------------------------------------------------------------
  // Estos patrones nunca se analizan porque son artefactos generados,
  // dependencias o tooling que no aportan señal de calidad y ralentizan el lint:
  {
    ignores: [
      // Salida compilada de Vite (frontend) y tsc (backend): código generado,
      // ya minificado/transpilado; lintarlo daría falsos positivos.
      '**/dist/**',
      // Dependencias instaladas: miles de ficheros de terceros, fuera de
      // nuestro control; lintarlos es ruido y coste de CI.
      '**/node_modules/**',
      // Build estático publicado por Storybook (`npm run build-storybook`):
      // HTML/JS empaquetado, no fuente.
      '**/storybook-static/**',
      // Salida genérica de builds alternativos (p. ej. bundles locales).
      '**/build/**',
      // Configuración local del editor VS Code (.vscode/settings.json, etc.):
      // JSON de preferencias, no código lintable.
      '.vscode/**',
      // Informes de cobertura de Vitest/Istanbul: HTML/JSON generados
      // en cada `npm run test -- --coverage`.
      '**/coverage/**',
      // Fixtures de reglas Semgrep de ejemplo: se prueban con semgrep,
      // no con ESLint; además contienen intencionalmente código vulnerable.
      '.semgrep/rules/tests/**',
    ],
  },

  // ---------------------------------------------------------------------------
  // (2) Base JavaScript oficial (@eslint/js recommended).
  // ---------------------------------------------------------------------------
  // Punto de partida común a todos los workspaces. Aporta las reglas
  // "recommended" del core team (no-unused-vars, no-undef, eqeqeq,
  // no-debugger, etc.) para que backend, frontend y Storybook compartan
  // el mismo suelo mínimo de calidad antes de sus reglas específicas.
  //
  // Gradación de reglas (estrategia del repo):
  // - Core recommended: 'error' por defecto (bloqueante en lint/CI).
  // - Reglas de plugins con subjetividad alta (p. ej. storybook/* de
  //   jerarquía/nombres): 'warn' + `--max-warnings 0` en CI para hacerlas
  //   visibles sin bloquear la iteración, con camino a 'error' cuando el
  //   baseline llegue a cero (ver doc canónica §4.1).
  // - Ninguna regla de estilo: el formato lo gobierna Prettier (bloque 7).

  // Aplica las reglas recomendadas por ESLint para JavaScript puro.
  // Incluye reglas como:
  // - no-unused-vars
  // - no-undef
  // - eqeqeq
  // - no-debugger
  js.configs.recommended,

  // ---------------------------------------------------------------------------
  // (3) Backend Node.js (apps/server).
  // ---------------------------------------------------------------------------

  {
    // `files`: limita este bloque SOLO a fuentes del backend dentro del
    // monorepo, para no contaminar al frontend con globals/reglas de Node.
    files: ['apps/server/**/*.js'],

    // `plugins`: registra el plugin de Vitest porque los tests del servidor
    // (unitarios/integración con `*.test.js`) viven bajo apps/server/ y usan
    // describe/it/expect/vi que requieren sus reglas y sus globals.
    plugins: {
      vitest,
    },

    // Define opciones del lenguaje para Node.js moderno.
    languageOptions: {
      // `ecmaVersion: 'latest'`: permite la sintaxis ECMAScript más reciente
      // soportada por ESLint (top-level await, import attributes, etc.) sin
      // tener que subir el número de versión cada año.
      ecmaVersion: 'latest',

      // `sourceType: 'module'`: el backend usa módulos ES (import/export)
      // en lugar de CommonJS (require/module.exports), acorde a "type": "module".
      sourceType: 'module',

      globals: {
        // Sin globals.browser: el backend corre en Node (window/document no
        // deben existir aquí) — change eslint-configuration; `no-undef` vuelve
        // a detectar globals de navegador en server. Se exponen
        // `...globals.node` (process, Buffer, __dirname...) más los globals
        // de Vitest (`...vitest.environments.env.globals`: describe, it,
        // expect, vi, beforeEach...) para que `no-undef` no falle ni en
        // fuente ni en tests. Intencionadamente NO se incluye
        // `globals.browser` para que cualquier uso accidental de
        // window/document en server falle.
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },

    // Reglas específicas para backend.
    rules: {
      // Hereda las reglas recomendadas de Vitest (no-focused-tests, etc.).
      ...vitest.configs.recommended.rules,
      // Permite el uso de console.log en backend,
      // ya que es común para logging en servidores.
      // Decisión consciente: en server el console es el logger por defecto
      // (luego se centraliza con pino/winston); prohibirlo aquí solo añadiría
      // fricción sin ganancia. En frontend se mantiene el aviso por defecto.
      'no-console': 'off',
      // NOTA: la regla `complexity` de este workspace vive en los bloques
      // "Umbrales de complejidad por capa" de abajo (core 15 / utils 10 /
      // tests off; fuente única: los jobs CI `*-complexity` no pasan `--rule`).
    },
  },

  // ---------------------------------------------------------------------------
  // (4) Frontend React + JSX (apps/client).
  // ---------------------------------------------------------------------------

  {
    // `files`: aplica esta configuración solo al frontend
    // y únicamente a archivos JavaScript y JSX. Así los .ts/.tsx (si se
    // añaden en el futuro) no caen accidentalmente bajo este parser.
    files: ['apps/client/**/*.{js,jsx}'],

    // Registra los plugins que se usarán en esta sección.
    plugins: {
      // Plugin de React para validaciones de JSX y componentes.
      react,

      // Plugin para reglas de React Hooks.
      'react-hooks': reactHooks,
      // Plugin de Vitest: también el frontend testea con Vitest + RTL,
      // así que necesita las mismas reglas/globals de test que el backend.
      vitest,
    },

    // Opciones del lenguaje para frontend.
    languageOptions: {
      // Permite sintaxis moderna de JavaScript.
      // `ecmaVersion: 'latest'`: igual que en server, evita fijar un año.
      ecmaVersion: 'latest',

      // Usa módulos ES en el frontend.
      // `sourceType: 'module'`: Vite exige ESM (import/export).
      sourceType: 'module',

      // Define las variables globales del navegador usando el preset
      globals: {
        // `...globals.browser` (window, document, fetch, localStorage...):
        // el cliente corre en el navegador.
        ...globals.browser,
        // `...globals.node` (process, etc.): Vite expone process.env y los
        // configs/scripts del frontend corren en Node, así que se permiten.
        ...globals.node,
        // `...vitest.environments.env.globals` (describe/it/expect/vi):
        // los tests colocalizados (*.test.jsx) necesitan estos globals.
        ...vitest.environments.env.globals,
      },

      // Habilita explícitamente JSX.
      parserOptions: {
        ecmaFeatures: {
          // `jsx: true`: sin esto el parser falla ante `<App />`. No usamos
          // parser TypeScript aquí porque el cliente actual es JS puro.
          jsx: true,
        },
      },
    },

    // Configuración específica del plugin de React.
    settings: {
      react: {
        // Detecta automáticamente la versión de React instalada.
        // Evita configurarla manualmente.
        // `version: 'detect'`: lee la versión desde package.json para aplicar
        // las reglas correctas según la major (p. ej. nuevo JSX transform).
        version: 'detect',
      },
    },

    // Reglas aplicadas al frontend.
    rules: {
      // Aplica las reglas recomendadas oficiales del plugin de React.
      // Cubre validación de JSX, prop-types, keys en listas, etc.
      ...react.configs.recommended.rules,

      // Aplica las reglas recomendadas oficiales para React Hooks.
      // Cubre rules-of-hooks y exhaustive-deps (useEffect/useMemo/useCallback).
      ...reactHooks.configs.recommended.rules,

      // Reglas recomendadas de Vitest (igual que en server).
      ...vitest.configs.recommended.rules,

      // Desactiva la regla que exige importar React en JSX.
      // A partir de React 17+, esto ya no es necesario.
      // Con el nuevo JSX transform (Vite + React 18) el import React es
      // innecesario; exigirlo añadiría imports muertos en cada fichero.
      'react/react-in-jsx-scope': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // (5) Storybook (dentro de client).
  // ---------------------------------------------------------------------------
  // Las stories son un dialecto propio (CSF) con default-export obligatorio
  // y play functions que rompen intencionadamente rules-of-hooks, por eso
  // tienen bloque dedicado con reglas más permisivas/precisas.

  {
    // `files`: solo archivos .stories dentro de apps/client y la config
    // `.storybook/main.js|preview.js`, para no relajar las reglas del resto
    // de la app cliente.
    files: [
      'apps/client/**/*.stories.{js,jsx}',
      'apps/client/.storybook/**/*.{js,jsx}',
    ],

    plugins: {
      // Plugin de Storybook: aporta storybook/default-exports, etc.
      storybook,
      react, // También necesita React plugin para JSX
    },

    languageOptions: {
      // Misma base moderna ESM que el cliente...
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // Storybook corre en el navegador
        // Solo browser a propósito: las stories se renderizan aisladas en el
        // canvas del navegador; no necesitan globals de Node ni de Vitest.
      },
      parserOptions: {
        ecmaFeatures: {
          // JSX necesario porque las stories retornan elementos React.
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        // Igual que en cliente: autodetectar versión de React.
        version: 'detect',
      },
    },

    rules: {
      // Reglas recomendadas de Storybook
      ...storybook.configs.recommended.rules,

      // Reglas adicionales útiles
      // Separador de jerarquía en el panel lateral (mantiene árbol ordenado).
      'storybook/hierarchy-separator': 'warn',
      // Obliga al default-export con `title` + `component`: sin él la story
      // no aparece en el catálogo, por eso es 'error' (bloqueante).
      'storybook/default-exports': 'error',
      // Avisar si el nombre de la story repite el del componente/título
      // (p. ej. Button/Button): ruido en la sidebar, por eso 'warn'.
      'storybook/no-redundant-story-name': 'warn',

      // Desactiva reglas que pueden causar conflictos en stories
      // Stories pueden usar hooks en play functions: las `play` son funciones
      // async de testing-interacción (user-event) que llaman hooks fuera del
      // render de React, lo que dispara falsos positivos de rules-of-hooks.
      'react-hooks/rules-of-hooks': 'off', // Stories pueden usar hooks en play functions
      // No requerir prop-types en stories: los args/controls de Storybook ya
      // documentan y validan las props mejor que propTypes en este contexto.
      'react/prop-types': 'off', // No requerir prop-types en stories
    },
  },

  // ---------------------------------------------------------------------------
  // (6) Umbrales de complejidad por capa (core 15 / utils 10 / tests off).
  // ---------------------------------------------------------------------------
  // La complejidad ciclomática mide ramas por función (if/else, loops,
  // case, &&/||, catch...). Un max bajo obliga a extraer helpers y mantiene
  // el código testeable. EL ORDEN IMPORTA: el ÚLTIMO bloque que define la
  // regla gana en el merge, por eso los bloques se declaran
  // core → utils → tests (change eslint-complexity-rules). Cambia el umbral
  // aquí, nunca desde la CLI de CI ni por fichero.

  // CAPA CORE: TODO el código de producción bajo src de server y client
  // (módulos, rutas, middleware, socket, componentes, hooks, servicios...).
  // Max 15 porque es la lógica de dominio: demasiadas ramas ocultan bugs y
  // dificultan testear. Sustituye a los dos bloques legacy "max 20 por
  // workspace": cualquier resto de esos bloques pisaría 15/10 (último gana).
  {
    files: ['apps/*/src/**/*.{js,jsx}'],
    rules: {
      complexity: ['error', { max: 15 }],

      // max-lines-per-function: techo de tamaño por función en el core.
      // max 80 = calibración inicial generosa (el default de ESLint es 50);
      // se ajusta SOLO aquí, nunca por fichero. skipBlankLines/skipComments
      // miden lógica efectiva, no documentación. Sin opción de exención por
      // patrón interno: las exenciones se declaran con bloques
      // files/ignores o con eslint-disable documentado (visibles en
      // --print-config y grep-eables).
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // CAPA UTILS: utilidades compartidas (apps/**/src/utils/**). Max 10, más
  // estricto que core: una utilidad con muchas ramas es señal de que debería
  // ser varias funciones o una tabla de decisiones. Va DESPUÉS del bloque
  // core para ganar el merge sobre el 15.
  {
    files: ['apps/**/src/utils/**'],
    rules: {
      complexity: ['error', { max: 10 }],
    },
  },

  // CAPA TESTS: *.test.* / *.spec.* (incluye e2e/tests/**). La complejidad
  // y el tamaño por función quedan OFF: los tests son declarativos (muchos
  // casos por función es normal) y la señal útil está en código de
  // producción. Es el ÚLTIMO de los tres bloques a propósito: hay
  // .unit.test.js dentro de src/utils/ y el test-off debe ganar sobre
  // core (15) y utils (10).
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'e2e/tests/**'],
    rules: {
      complexity: 'off',
      // Espeja complexity: 'off' como defensa en profundidad: aunque el
      // glob core se ampliara algún día, los tests siguen exentos.
      'max-lines-per-function': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // (7) E2E (Playwright) — workspace e2e.
  // ---------------------------------------------------------------------------
  // Sin este bloque, los ficheros de e2e caerían fuera de todo `files`
  // ("... ignored due to missing configuration") y el script lint del
  // workspace no tendría reglas que aplicar. Los specs y la config de
  // Playwright corren en Node (globals.node), PERO los callbacks de
  // page.evaluate() se ejecutan EN EL NAVEGADOR: ahí window/document sí
  // existen y no-undef los necesita (globals.browser). Incluir ambos
  // refleja la doble naturaleza de un spec de Playwright.
  {
    files: ['e2e/**/*.js', 'e2e/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // (8) Prettier (siempre al final).
  // ---------------------------------------------------------------------------
  // `eslint-config-prettier` NO formatea: solo DESACTIVA las reglas de estilo
  // de ESLint (indent, quotes, semi, coma...) que chocarían con Prettier.
  // Debe ir SIEMPRE al final del array para que su "off" gane a cualquier
  // bloque anterior. El formato real lo aplica `npm run format` / el hook.

  // Desactiva todas las reglas de ESLint relacionadas con formato
  // para evitar conflictos con Prettier.
  // Debe ir siempre al final del array.
  prettier,
];
