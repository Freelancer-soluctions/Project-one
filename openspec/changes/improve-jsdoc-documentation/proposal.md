## Why

La documentación JSDoc en los módulos del servidor es inconsistente, incompleta y no sigue un estándar claro. Algunos módulos como `products/service.js` y `auth/controller.js` tienen documentación excelente con parámetros detallados, propiedades específicas, ejemplos y documentación de errores. Sin embargo, la mayoría de los módulos (como `clients/service.js`, `employees/service.js`, etc.) tienen documentación básica o incompleta que solo documenta tipos genéricos sin especificar las propiedades de los objetos. Esto dificulta el mantenimiento, la comprensión del código y la colaboración entre desarrolladores.

## What Changes

- Documentar todas las funciones en `controller.js`, `service.js` y `dao.js` de los 24 módulos en `apps/server/src/modules/`
- Aplicar el estándar completo de documentación JSDoc (Opción C) que incluye:
  - `@param` con tipos específicos y propiedades detalladas de objetos
  - `@returns` con tipos Promise específicos
  - `@throws` para documentar errores lanzados
  - `@example` cuando sea útil para ilustrar el uso
- Excluir archivos `routes.js` (ya tienen documentación Swagger)
- Seguir los patrones de documentación de `auth/controller.js` y `products/service.js` como referencia
- Documentar parámetros de Express (`req`, `res`) con sus propiedades específicas (`req.params.id`, `req.body`, `req.userId`, `req.cookies`, etc.)
- Documentar transformaciones de datos en service layer (conversión de tipos, fechas automáticas, IDs de usuario)

## Capabilities

### New Capabilities
- `jsdoc-documentation-standards`: Estándar de documentación JSDoc para funciones en controller, service y dao layers

### Modified Capabilities
- Ninguna - este cambio no modifica requisitos de comportamiento, solo mejora la documentación existente

## Impact

- **Código afectado**: ~72 archivos (24 módulos × 3 archivos: controller.js, service.js, dao.js)
- **Archivos excluidos**: 24 archivos routes.js (documentación Swagger existente)
- **APIs**: Sin cambios - solo documentación
- **Dependencias**: Sin cambios
- **Sistemas**: Sin cambios - solo mejora de mantenibilidad y comprensión del código
- **Beneficios**: Mejora la experiencia de desarrollo, facilita el onboarding de nuevos desarrolladores, y proporciona mejor autocompletado en IDEs
