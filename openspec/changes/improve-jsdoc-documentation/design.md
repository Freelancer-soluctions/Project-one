## Context

El proyecto tiene 24 módulos en `apps/server/src/modules/` con una arquitectura de tres capas: controller, service y dao. Cada módulo sigue el patrón MVC con:

- **Controller layer**: Maneja solicitudes HTTP, valida entrada, llama a services
- **Service layer**: Contiene lógica de negocio, transforma datos, llama a DAOs
- **DAO layer**: Acceso directo a la base de datos usando Prisma

Actualmente, la documentación JSDoc es inconsistente:
- `auth/controller.js` y `products/service.js` tienen documentación excelente
- La mayoría de módulos tienen documentación básica o incompleta
- Algunas funciones no tienen documentación JSDoc
- Los errores lanzados no están documentados con `@throws`
- Falta documentación de propiedades específicas de objetos

## Goals / Non-Goals

**Goals:**
- Establecer un estándar consistente de documentación JSDoc para todas las funciones en controller, service y dao layers
- Mejorar la mantenibilidad y comprensión del código
- Proporcionar mejor autocompletado en IDEs
- Facilitar el onboarding de nuevos desarrolladores
- Documentar todos los errores lanzados con `@throws`
- Incluir ejemplos de uso cuando sea apropiado

**Non-Goals:**
- Modificar el comportamiento de las funciones (solo documentación)
- Cambiar la arquitectura existente
- Agregar nuevas funcionalidades
- Modificar archivos `routes.js` (ya tienen Swagger)
- Crear herramientas automatizadas de generación de documentación

## Decisions

### 1. Estándar de documentación basado en ejemplos existentes

**Decisión:** Usar `auth/controller.js` y `products/service.js` como patrones de referencia para la documentación JSDoc.

**Racional:**
- Estos archivos ya tienen documentación de alta calidad que el equipo ha aprobado
- Proporcionan ejemplos reales de cómo documentar diferentes tipos de funciones
- Evita reinventar la rueda y mantiene consistencia con el código existente
- Reduce la curva de aprendizaje para el equipo

**Alternativas consideradas:**
- Crear un nuevo estándar desde cero: Requiere más tiempo y puede introducir inconsistencias
- Usar herramientas de generación automática: No captura el contexto de negocio y puede generar documentación genérica

### 2. Documentación por capas con enfoque específico

**Decisión:** Documentar cada capa con enfoque en sus responsabilidades específicas:

- **Controller layer:** Documentar parámetros Express (`req`, `res`) con propiedades específicas
- **Service layer:** Documentar parámetros de negocio y transformaciones de datos
- **DAO layer:** Documentar parámetros de base de datos y operaciones CRUD

**Racional:**
- Cada capa tiene responsabilidades diferentes y requiere diferentes niveles de detalle
- Permite a los desarrolladores entender rápidamente qué hace cada función
- Facilita la navegación del código al buscar información específica

**Alternativas consideradas:**
- Documentación uniforme para todas las capas: No refleja las diferencias de responsabilidad entre capas
- Documentación mínima para todas las capas: No proporciona suficiente contexto para mantenimiento

### 3. Documentación de errores con @throws

**Decisión:** Documentar todos los errores lanzados usando etiquetas `@throws` con el tipo de error y descripción.

**Racional:**
- Permite a los desarrolladores entender qué errores pueden ocurrir
- Facilita el manejo de errores en capas superiores
- Mejora la depuración al conocer los posibles puntos de falla
- Sigue las mejores prácticas de documentación JSDoc

**Alternativas consideradas:**
- No documentar errores: Dificulta el manejo de errores y la depuración
- Documentar errores solo en comentarios: No es estándar JSDoc y no es reconocido por IDEs

### 4. Ejemplos de uso para funciones complejas

**Decisión:** Incluir etiquetas `@example` para funciones con patrones de uso no triviales.

**Racional:**
- Proporciona ejemplos concretos de cómo usar las funciones
- Reduce la curva de aprendizaje para nuevos desarrolladores
- Sirve como documentación viva que puede usarse para pruebas
- Ayuda a identificar casos de uso incorrectos

**Alternativas consideradas:**
- Incluir ejemplos para todas las funciones: Puede ser excesivo para funciones simples
- No incluir ejemplos: Pierde la oportunidad de documentar patrones de uso

### 5. Exclusión de archivos routes.js

**Decisión:** No modificar archivos `routes.js` ya que tienen documentación Swagger/OpenAPI.

**Racional:**
- Los archivos routes.js ya tienen documentación API completa en formato Swagger
- Evita duplicación de esfuerzos
- Swagger es el estándar para documentación de APIs REST
- Mantiene la separación de responsabilidades (JSDoc para código interno, Swagger para API externa)

**Alternativas consideradas:**
- Agregar JSDoc a routes.js además de Swagger: Duplicación innecesaria
- Reemplazar Swagger con JSDoc: Pierde los beneficios de Swagger (UI interactiva, generación de clientes)

## Risks / Trade-offs

### Risk 1: Inconsistencia en la aplicación del estándar
**Riesgo:** Diferentes desarrolladores pueden interpretar el estándar de manera diferente, resultando en documentación inconsistente.

**Mitigación:**
- Proporcionar ejemplos claros y concretos en el documento de diseño
- Realizar code review enfocado en la calidad de la documentación
- Crear una guía de referencia con patrones comunes

### Risk 2: Documentación desactualizada
**Riesgo:** La documentación puede quedar desactualizada si el código cambia sin actualizar la JSDoc correspondiente.

**Mitigación:**
- Incluir la actualización de JSDoc como parte del proceso de code review
- Usar herramientas de linting que validen la consistencia entre código y JSDoc
- Establecer la actualización de documentación como parte de los criterios de aceptación de PRs

### Risk 3: Tiempo de implementación
**Riesgo:** Documentar ~72 archivos puede tomar tiempo significativo y retrasar otras tareas.

**Mitigación:**
- Priorizar módulos más críticos o usados frecuentemente
- Dividir el trabajo en fases iterativas
- Aprovechar el proceso para familiarizarse con el código existente

### Trade-off 1: Detalle vs. Concisión
**Trade-off:** Más detalle en la documentación mejora la comprensión pero requiere más tiempo de mantenimiento.

**Decisión:** Buscar un balance: documentar propiedades específicas de objetos pero evitar documentación excesiva para casos triviales.

### Trade-off 2: Ejemplos vs. Mantenimiento
**Trade-off:** Los ejemplos de uso mejoran la comprensión pero requieren mantenimiento adicional.

**Decisión:** Incluir ejemplos solo para funciones con patrones de uso no triviales o complejos.

## Migration Plan

### Fase 1: Preparación
1. Revisar y validar los patrones de referencia (`auth/controller.js`, `products/service.js`)
2. Crear una guía de referencia con ejemplos comunes
3. Identificar módulos prioritarios (por uso crítico o complejidad)

### Fase 2: Implementación por módulos
1. Documentar módulos en orden de prioridad
2. Para cada módulo:
   - Documentar controller.js
   - Documentar service.js
   - Documentar dao.js
3. Validar que la documentación sigue el estándar establecido

### Fase 3: Validación
1. Revisar la documentación de todos los módulos
2. Verificar consistencia con el estándar
3. Ajustar según feedback del equipo

### Fase 4: Integración
1. Integrar la documentación actualizada en el código base
2. Actualizar guías de desarrollo si es necesario
3. Comunicar al equipo el nuevo estándar de documentación

### Rollback Strategy
Si surge algún problema durante la implementación:
- Los cambios son solo documentación, no afectan el comportamiento del código
- Se puede revertir cualquier commit de documentación sin impacto funcional
- No hay dependencias externas ni cambios de arquitectura

## Open Questions

1. **¿Deberíamos crear una herramienta de linting para validar la documentación JSDoc?**
   - Podría ayudar a mantener la consistencia pero requiere tiempo de configuración

2. **¿Deberíamos priorizar módulos específicos o documentar todos en paralelo?**
   - Priorizar módulos críticos permite obtener valor más rápido, pero documentar en paralelo puede ser más eficiente

3. **¿Deberíamos incluir documentación de tipos TypeScript en el futuro?**
   - El proyecto usa JavaScript actualmente, pero TypeScript podría proporcionar mejor validación de tipos
