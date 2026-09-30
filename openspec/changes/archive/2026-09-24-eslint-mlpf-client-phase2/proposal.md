# Proposal

## Why

La Fase 1 del change `eslint-complexity-rules` dejó el umbral `max-lines-per-function: 80` activo en server pero con una **exención temporal documentada** para `apps/client/src/**`: el baseline de client tenía 103 funciones por encima de 80 líneas (mediana ~167, máximo 638), repartidas en ~95 ficheros de 24 directorios de módulos. La deuda quedó visible en un único bloque grepeable de `eslint.config.js` con el compromiso explícito de una Fase 2 que la liquide.

## What Changes

- Refactorizar las ~103 funciones de `apps/client/src/**` que superan 80 líneas efectivas, extrayendo subcomponentes, handlers y builders siguiendo los mismos patrones ya aplicados en server durante la Fase 1 (funciones pequeñas, de un solo propósito, con JSDoc ES).
- **Eliminar el bloque de exención temporal** `files: ['apps/client/src/**/*.{js,jsx}']` de `eslint.config.js` con su comentario de deuda técnica.
- Actualizar la documentación (`docs/learning/eslint-complexity-configuration.md`, sección de la exención de Fase 1) para reflejar que el umbral aplica ya a todo el core.
- Ningún cambio de comportamiento observable en la app: la refactorización es estructural (mismos renders, mismos handlers, mismas llamadas API); los tests y el lint son la red de verificación.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `config-correctness`: la exención temporal de `max-lines-per-function` para `apps/client/src/**` (Fase 1, bloque `files` con deuda documentada) desaparece — el umbral `["error", { max: 80, skipBlankLines: true, skipComments: true }]` del bloque core pasa a aplicar a TODO `apps/*/src/**`, server y client por igual. El requirement de la Fase 1 que exigía la exención se sustituye por uno que la prohibe.

## Impact

- **Código**: ~95 ficheros `.jsx`/`.js` bajo `apps/client/src/**` (extracciones mecánicas: subcomponentes de JSX, handlers de eventos, builders de columnas/opciones, normalizadores de formularios).
- **`eslint.config.js`**: eliminación de un bloque (el de exención) — sin cambios de reglas ni umbrales.
- **Docs**: `docs/learning/eslint-complexity-configuration.md` (sección §2, párrafo de la exención temporal pasa a "eliminada en Fase 2").
- **Riesgo**: alto por superficie (103 funciones) pero bajo por cambio (extracciones puras); mitigado con lint + tests existentes (30 tests de client, 161 de server) + verificación `--print-config` por capa. Se ejecuta por tandas de módulos con lint verde entre tandas.
