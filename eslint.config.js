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

// Exporta la configuración usando Flat Config (formato recomendado por ESLint 9+)
export default [
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

    // Define opciones del lenguaje para Node.js moderno.
    languageOptions: {
      // Permite usar la versión más reciente de ECMAScript soportada por ESLint.
      ecmaVersion: 'latest',

      // Indica que el backend usa módulos ES (import/export).
      sourceType: 'module',
    },

    // Reglas específicas para backend.
    rules: {
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

      // Desactiva la regla que exige importar React en JSX.
      // A partir de React 17+, esto ya no es necesario.
      'react/react-in-jsx-scope': 'off',
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
