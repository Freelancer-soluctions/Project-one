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
import globals from 'globals';

import vitest from '@vitest/eslint-plugin';
import storybook from 'eslint-plugin-storybook';

// Exporta la configuración usando Flat Config (formato recomendado por ESLint 9+)
export default [
  // ----------------------------
  // Ignorar archivos
  // ----------------------------
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      '**/build/**',
    ],
  },

  // ----------------------------
  // Base JavaScript (oficial)
  // ----------------------------

  // Aplica las reglas recomendadas por ESLint para JavaScript puro.
  // Incluye reglas como:
  // - no-unused-vars
  // - no-undef
  // - eqeqeq
  // - no-debugger
  js.configs.recommended,

  // ----------------------------
  // Backend (Node.js)
  // ----------------------------

  {
    // Limita esta configuración únicamente a los archivos del backend
    // dentro del monorepo.
    files: ['apps/server/**/*.js'],

    plugins: {
      vitest,
    },

    // Define opciones del lenguaje para Node.js moderno.
    languageOptions: {
      // Permite usar la versión más reciente de ECMAScript soportada por ESLint.
      ecmaVersion: 'latest',

      // Indica que el backend usa módulos ES (import/export).
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },

    // Reglas específicas para backend.
    rules: {
      ...vitest.configs.recommended.rules,
      // Permite el uso de console.log en backend,
      // ya que es común para logging en servidores.
      'no-console': 'off',
    },
  },

  // ----------------------------
  // Frontend (React + JSX)
  // ----------------------------

  {
    // Aplica esta configuración solo al frontend
    // y únicamente a archivos JavaScript y JSX.
    files: ['apps/client/**/*.{js,jsx}'],

    // Registra los plugins que se usarán en esta sección.
    plugins: {
      // Plugin de React para validaciones de JSX y componentes.
      react,

      // Plugin para reglas de React Hooks.
      'react-hooks': reactHooks,
      vitest,
    },

    // Opciones del lenguaje para frontend.
    languageOptions: {
      // Permite sintaxis moderna de JavaScript.
      ecmaVersion: 'latest',

      // Usa módulos ES en el frontend.
      sourceType: 'module',

      // Define las variables globales del navegador usando el preset
      globals: {
        ...globals.browser,
        ...vitest.environments.env.globals,
      },

      // Habilita explícitamente JSX.
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    // Configuración específica del plugin de React.
    settings: {
      react: {
        // Detecta automáticamente la versión de React instalada.
        // Evita configurarla manualmente.
        version: 'detect',
      },
    },

    // Reglas aplicadas al frontend.
    rules: {
      // Aplica las reglas recomendadas oficiales del plugin de React.
      ...react.configs.recommended.rules,

      // Aplica las reglas recomendadas oficiales para React Hooks.
      ...reactHooks.configs.recommended.rules,

      ...vitest.configs.recommended.rules,

      // Desactiva la regla que exige importar React en JSX.
      // A partir de React 17+, esto ya no es necesario.
      'react/react-in-jsx-scope': 'off',
    },
  },

  // ----------------------------
  // Storybook (dentro de client)
  // ----------------------------

  {
    // Solo archivos .stories dentro de apps/client
    files: [
      'apps/client/**/*.stories.{js,jsx}',
      'apps/client/.storybook/**/*.{js,jsx}',
    ],

    plugins: {
      storybook,
      react, // También necesita React plugin para JSX
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // Storybook corre en el navegador
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // Reglas recomendadas de Storybook
      ...storybook.configs.recommended.rules,

      // Reglas adicionales útiles
      'storybook/hierarchy-separator': 'warn',
      'storybook/default-exports': 'error',
      'storybook/no-redundant-story-name': 'warn',

      // Desactiva reglas que pueden causar conflictos en stories
      'react-hooks/rules-of-hooks': 'off', // Stories pueden usar hooks en play functions
      'react/prop-types': 'off', // No requerir prop-types en stories
    },
  },

  // ----------------------------
  // Prettier (siempre al final)
  // ----------------------------

  // Desactiva todas las reglas de ESLint relacionadas con formato
  // para evitar conflictos con Prettier.
  // Debe ir siempre al final del array.
  prettier,
];
