## Context

El proyecto tiene 24 m�dulos en `apps/server/src/modules/` con una arquitectura de tres capas: controller, service y dao. Cada m�dulo sigue el patr�n MVC con:

- **Controller layer**: Maneja solicitudes HTTP, valida entrada, llama a services
- **Service layer**: Contiene l�gica de negocio, transforma datos, llama a DAOs
- **DAO layer**: Acceso directo a la base de datos usando Prisma

Actualmente, la documentaci�n JSDoc es inconsistente:

- `auth/controller.js` y `products/service.js` tienen documentaci�n excelente
- La mayor�a de m�dulos tienen documentaci�n b�sica o incompleta
- Algunas funciones no tienen documentaci�n JSDoc
- Los errores lanzados no est�n documentados con `@throws`
- Falta documentaci�n de propiedades espec�ficas de objetos

## Goals / Non-Goals

**Goals:**

- Establecer un est�ndar consistente de documentaci�n JSDoc para todas las funciones en controller, service y dao layers
- Mejorar la mantenibilidad y comprensi�n del c�digo
- Proporcionar mejor autocompletado en IDEs
- Facilitar el onboarding de nuevos desarrolladores
- Documentar todos los errores lanzados con `@throws`
- Incluir ejemplos de uso cuando sea apropiado

**Non-Goals:**

- Modificar el comportamiento de las funciones (solo documentaci�n)
- Cambiar la arquitectura existente
- Agregar nuevas funcionalidades
- Modificar archivos `routes.js` (ya tienen Swagger)
- Crear herramientas automatizadas de generaci�n de documentaci�n

## Decisions

### 1. Est�ndar de documentaci�n basado en ejemplos existentes

**Decisi�n:** Usar `auth/controller.js` y `products/service.js` como patrones de referencia para la documentaci�n JSDoc.

**Racional:**

- Estos archivos ya tienen documentaci�n de alta calidad que el equipo ha aprobado
- Proporcionan ejemplos reales de c�mo documentar diferentes tipos de funciones
- Evita reinventar la rueda y mantiene consistencia con el c�digo existente
- Reduce la curva de aprendizaje para el equipo

**Alternativas consideradas:**

- Crear un nuevo est�ndar desde cero: Requiere m�s tiempo y puede introducir inconsistencias
- Usar herramientas de generaci�n autom�tica: No captura el contexto de negocio y puede generar documentaci�n gen�rica

### 2. Documentaci�n por capas con enfoque espec�fico

**Decisi�n:** Documentar cada capa con enfoque en sus responsabilidades espec�ficas:

- **Controller layer:** Documentar par�metros Express (`req`, `res`) con propiedades espec�ficas
- **Service layer:** Documentar par�metros de negocio y transformaciones de datos
- **DAO layer:** Documentar par�metros de base de datos y operaciones CRUD

**Racional:**

- Cada capa tiene responsabilidades diferentes y requiere diferentes niveles de detalle
- Permite a los desarrolladores entender r�pidamente qu� hace cada funci�n
- Facilita la navegaci�n del c�digo al buscar informaci�n espec�fica

**Alternativas consideradas:**

- Documentaci�n uniforme para todas las capas: No refleja las diferencias de responsabilidad entre capas
- Documentaci�n m�nima para todas las capas: No proporciona suficiente contexto para mantenimiento

### 3. Documentaci�n de errores con @throws

**Decisi�n:** Documentar todos los errores lanzados usando etiquetas `@throws` con el tipo de error y descripci�n.

**Racional:**

- Permite a los desarrolladores entender qu� errores pueden ocurrir
- Facilita el manejo de errores en capas superiores
- Mejora la depuraci�n al conocer los posibles puntos de falla
- Sigue las mejores pr�cticas de documentaci�n JSDoc

**Alternativas consideradas:**

- No documentar errores: Dificulta el manejo de errores y la depuraci�n
- Documentar errores solo en comentarios: No es est�ndar JSDoc y no es reconocido por IDEs

### 4. Ejemplos de uso para funciones complejas

**Decisi�n:** Incluir etiquetas `@example` para funciones con patrones de uso no triviales.

**Racional:**

- Proporciona ejemplos concretos de c�mo usar las funciones
- Reduce la curva de aprendizaje para nuevos desarrolladores
- Sirve como documentaci�n viva que puede usarse para pruebas
- Ayuda a identificar casos de uso incorrectos

**Alternativas consideradas:**

- Incluir ejemplos para todas las funciones: Puede ser excesivo para funciones simples
- No incluir ejemplos: Pierde la oportunidad de documentar patrones de uso

### 5. Exclusi�n de archivos routes.js

**Decisi�n:** No modificar archivos `routes.js` ya que tienen documentaci�n Swagger/OpenAPI.

**Racional:**

- Los archivos routes.js ya tienen documentaci�n API completa en formato Swagger
- Evita duplicaci�n de esfuerzos
- Swagger es el est�ndar para documentaci�n de APIs REST
- Mantiene la separaci�n de responsabilidades (JSDoc para c�digo interno, Swagger para API externa)

**Alternativas consideradas:**

- Agregar JSDoc a routes.js adem�s de Swagger: Duplicaci�n innecesaria
- Reemplazar Swagger con JSDoc: Pierde los beneficios de Swagger (UI interactiva, generaci�n de clientes)

## Risks / Trade-offs

### Risk 1: Inconsistencia en la aplicaci�n del est�ndar

**Riesgo:** Diferentes desarrolladores pueden interpretar el est�ndar de manera diferente, resultando en documentaci�n inconsistente.

**Mitigaci�n:**

- Proporcionar ejemplos claros y concretos en el documento de dise�o
- Realizar code review enfocado en la calidad de la documentaci�n
- Crear una gu�a de referencia con patrones comunes

### Risk 2: Documentaci�n desactualizada

**Riesgo:** La documentaci�n puede quedar desactualizada si el c�digo cambia sin actualizar la JSDoc correspondiente.

**Mitigaci�n:**

- Incluir la actualizaci�n de JSDoc como parte del proceso de code review
- Usar herramientas de linting que validen la consistencia entre c�digo y JSDoc
- Establecer la actualizaci�n de documentaci�n como parte de los criterios de aceptaci�n de PRs

### Risk 3: Tiempo de implementaci�n

**Riesgo:** Documentar ~72 archivos puede tomar tiempo significativo y retrasar otras tareas.

**Mitigaci�n:**

- Priorizar m�dulos m�s cr�ticos o usados frecuentemente
- Dividir el trabajo en fases iterativas
- Aprovechar el proceso para familiarizarse con el c�digo existente

### Trade-off 1: Detalle vs. Concisi�n

**Trade-off:** M�s detalle en la documentaci�n mejora la comprensi�n pero requiere m�s tiempo de mantenimiento.

**Decisi�n:** Buscar un balance: documentar propiedades espec�ficas de objetos pero evitar documentaci�n excesiva para casos triviales.

### Trade-off 2: Ejemplos vs. Mantenimiento

**Trade-off:** Los ejemplos de uso mejoran la comprensi�n pero requieren mantenimiento adicional.

**Decisi�n:** Incluir ejemplos solo para funciones con patrones de uso no triviales o complejos.

## Migration Plan

### Fase 1: Preparaci�n

1. Revisar y validar los patrones de referencia (`auth/controller.js`, `products/service.js`)
2. Crear una gu�a de referencia con ejemplos comunes
3. Identificar m�dulos prioritarios (por uso cr�tico o complejidad)

### Fase 2: Implementaci�n por m�dulos

1. Documentar m�dulos en orden de prioridad
2. Para cada m�dulo:
   - Documentar controller.js
   - Documentar service.js
   - Documentar dao.js
3. Validar que la documentaci�n sigue el est�ndar establecido

### Fase 3: Validaci�n

1. Revisar la documentaci�n de todos los m�dulos
2. Verificar consistencia con el est�ndar
3. Ajustar seg�n feedback del equipo

### Fase 4: Integraci�n

1. Integrar la documentaci�n actualizada en el c�digo base
2. Actualizar gu�as de desarrollo si es necesario
3. Comunicar al equipo el nuevo est�ndar de documentaci�n

### Rollback Strategy

Si surge alg�n problema durante la implementaci�n:

- Los cambios son solo documentaci�n, no afectan el comportamiento del c�digo
- Se puede revertir cualquier commit de documentaci�n sin impacto funcional
- No hay dependencias externas ni cambios de arquitectura

## Open Questions

1. **�Deber�amos crear una herramienta de linting para validar la documentaci�n JSDoc?**
   - Podr�a ayudar a mantener la consistencia pero requiere tiempo de configuraci�n

2. **�Deber�amos priorizar m�dulos espec�ficos o documentar todos en paralelo?**
   - Priorizar m�dulos cr�ticos permite obtener valor m�s r�pido, pero documentar en paralelo puede ser m�s eficiente

3. **�Deber�amos incluir documentaci�n de tipos TypeScript en el futuro?**
   - El proyecto usa JavaScript actualmente, pero TypeScript podr�a proporcionar mejor validaci�n de tipos
