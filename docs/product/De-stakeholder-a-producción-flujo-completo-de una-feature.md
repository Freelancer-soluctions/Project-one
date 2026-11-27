<!-- markdownlint-disable MD013 -->

# De stakeholder a producción: flujo completo de una feature

Nov 20, 2026 · @Johan · actualizado con prácticas modernas de ingeniería de requisitos y entrega

## Qué recorre este documento

Una feature no nace cuando el desarrollador abre su editor. Nace cuando alguien en la organización tiene un problema o una oportunidad, y termina cuando ese problema se resolvió en producción y se verificó con métricas. Entre esos dos puntos hay siete etapas, cada una con responsables, artefactos de entrada y salida, y preguntas de control.

Este documento muestra ese recorrido completo con el nivel de detalle que se aplica en un equipo de ingeniería profesional, usando como hilo conductor una sola feature de un ERP: **aprobación de órdenes de compra con límite por rol**. Los artefactos son reales y reutilizables.

Además de las siete etapas originales, este documento incorpora las prácticas que la literatura de ingeniería de requisitos (IEEE/ISO/IEC 29148 [1], SWEBOK v4 [2]) y de entrega continua (DORA [7][8], Google SRE [9][10]) consideran imprescindibles y que la versión anterior omitía: descubrimiento continuo de producto, investigación de UX, modelado de amenazas, seguridad y privacidad shift-left, accesibilidad, internacionalización, versionado y compatibilidad hacia atrás de APIs, migraciones de base de datos con expand/contract, planes de rollback, pruebas de capacidad y caos, observabilidad, gestión de incidentes y post-mortems, FinOps, y retiro/deprecación de features. La sección "Gaps de la versión original y prácticas modernas" resume cada omisión con su fuente.

Las citas entre corchetes [n] remiten a la sección "Fuentes" al final del documento.

> **Flujo de integración OpenSpec:** las etapas 1 a 5 son manuales (Discovery → Elicitación → Especificación → Refinement → Diseño técnico, donde se crea el ADR). OpenSpec entra después del ADR, en la **creación del change**, y se encarga de la formalización (`/opsx:propose`), la ejecución (`/opsx:apply`) y el cierre (`/opsx:verify` → `/opsx:archive`). El flujo operativo detallado (manual → ADR → OpenSpec, con OpenSpec y Trello) está en [la sección "Framework operativo para Project One"](#framework-operativo-para-project-one). Este documento conserva el "qué y por qué" de la ingeniería de requisitos.

## Flujo completo

[embedded content: 7 etapas de una feature · desde la señal de negocio hasta el monitoreo en producción]

El flujo no es lineal: si en Refinement se descubre que el problema no está bien entendido, la feature regresa a Elicitación. Si en Code Review aparece un defecto de diseño, regresa a Diseño técnico. Avanzar sin resolver el criterio de salida de cada etapa es la causa principal de retrabajo costoso [1][2].

## Etapa 1 — Discovery: de dónde viene la feature

**La feature no nace con una idea del desarrollador.** Nace con una señal de negocio. Puede ser una queja recurrente de usuarios, un proceso manual que cuesta tiempo, una oportunidad regulatoria o un análisis de competidores. Alguien en la organización la convierte en una propuesta y la lleva a la persona que gestiona el backlog.

**Quién participa:** patrocinador (quien tiene el problema), product owner o tech lead, stakeholders clave. En equipos maduros se suma un trío de producto (product manager, diseñador, ingeniero) que practica descubrimiento continuo [3].

**El artefacto de esta etapa es una Feature Brief.** Antes de cualquier conversación técnica, se responde por escrito:

```
Feature Brief — Aprobación de órdenes de compra por rol

Problema: el gerente de operaciones aprueba manualmente todas las OC
por correo. Las OC < $500.000 no requieren revisión gerencial pero
siguen el mismo flujo, generando 2–3 días de retraso promedio.

Impacto medido:
- 47 OC/mes por debajo de $500.000 con retraso promedio de 2.1 días.
- Costo estimado de oportunidad: $1.2M COP/mes en descuentos perdidos
  por pago tardío a proveedores.

Resultado esperado:
- OC < $500.000 aprobadas en < 4 h sin intervención del gerente.
- OC ≥ $500.000 mantienen aprobación gerencial.
- Trazabilidad completa de quién aprobó, cuándo y con qué monto.

Medida de éxito:
- Tiempo promedio de aprobación de OC < $500.000: de 2.1 días a < 4 h.
- Adopción: 100 % de OC procesadas por el módulo en 30 días.

Stakeholders:
- Gerente de operaciones (aprobador actual, impulsor del cambio)
- Jefa de compras (usuario principal del flujo nuevo)
- Contador general (trazabilidad y auditoría)
- CTO / tech lead (factibilidad técnica)
```

### Product discovery continuo y UX research (práctica moderna)

La Brief no debe ser un documento estático creado una sola vez. La práctica moderna es el **descubrimiento continuo**: el equipo que construye el producto tiene contacto semanal con clientes/usuarios, transforma supuestos en hipótesis y las valida con experimentos de baja fidelidad antes de comprometer código [3]. El descubrimiento y la entrega corren en paralelo (dual-track agile), no como fases secuenciales [3].

Para esta feature, eso implica: entrevistas de contextual inquiry con la jefa de compras y el gerente, prototipos de baja fidelidad del flujo de aprobación, y una prueba de usabilidad con 5 usuarios antes de escribir la historia. La investigación de UX debe estar documentada (grabaciones, notas, síntesis) y vinculada a la Brief.

### Métricas baseline y experimentación

Antes de construir, se captura el **baseline** de las métricas de éxito (2.1 días promedio de aprobación, 47 OC/mes) para poder comparar después. Si la feature es de alto riesgo o impacto incierto, se define un experimento (A/B o rollout gradual) con hipótesis y criterio de éxito/fracaso medible [3]. Sin baseline no hay verificación posterior.

### Artefactos de descubrimiento adicionales (práctica moderna)

Además del Feature Brief, la etapa de Discovery produce (o consume) otros artefactos que la literatura de ingeniería de requisitos y de producto considera estándar [1][2][3]:

- **Stakeholder register / matriz de stakeholders (poder-interés):** inventario de todos los interesados con su rol, influencia (poder), interés, expectativas y estrategia de gestión (Mendelow / power-interest grid). Permite detectar quién puede bloquear o impulsar la feature y cómo comunicarse con cada uno [1][2].
- **Product Vision / Vision Statement / Product Vision Board:** declaración del "para quién, qué problema, cómo se diferencia, métricas de éxito" que ancla la feature a la estrategia del producto. Evita el "feature factory" [3].
- **Personas y empathy maps:** arquetipos de usuario basados en investigación (no estereotipos inventados), con metas, dolores y contexto. Se acompañan de **journey maps** (mapa del viaje del usuario) y **service blueprints** (blueprint del servicio) que visualizan el flujo actual y el deseado, incluyendo frontstage/backstage [3].
- **Opportunity Solution Tree (OST) / Impact Mapping:** árbol que vincula un outcome de negocio → oportunidades (necesidades/dolores) → soluciones → experimentos. **Impact Mapping** añade actores, impactos y entregables. Ambos evitan saltar de una métrica a una feature sin hipótesis intermedia [3].
- **System context diagram (C4 nivel 1 / diagrama de contexto):** vista de alto nivel del sistema, sus usuarios y los sistemas externos con los que interactúa. Es el punto de partida para entender alcance y dependencias [6].
- **Baseline de métricas:** captura cuantitativa del estado actual (ya descrita arriba) para poder verificar el outcome posterior [3].

### Factibilidad, alcance y gestión de stakeholders (práctica prescrita, añadida en revisión)

La literatura de ingeniería de sistemas/requisitos (IEEE/ISO/IEC 29148 [1][59], SWEBOK v4 [2]) exige, además de los artefactos anteriores, validar que la feature es viable y delimitar su alcance antes de comprometer recursos:

- **Feasibility study (estudio de factibilidad):** análisis técnico, económico, legal, operativo y de cronograma para confirmar que la solución es alcanzable con los recursos disponibles; incluye PoC cuando hay incertidumbre técnica [2][59].
- **Business case / cost-benefit:** justificación económica del problema (costo del problema actual vs. costo de la solución), base para priorización y aprobación de presupuesto [2][65].
- **Project charter / scope statement:** documento que autoriza la feature, nombra responsables y delimita alcance in/out, restricciones, supuestos y criterios de éxito; evita scope creep silencioso [65].
- **Stakeholder communication plan:** estrategia de comunicación por interesado (canal, frecuencia, contenido) derivada del stakeholder register [1][2].
- **Early risk identification:** semilla del risk register con los riesgos iniciales (técnicos, regulatorios, de adopción) y su owner [31].
- **Assumption log seed:** supuestos que se asumen verdaderos para planificar (ej. "el proveedor ya está en el ERP"), que se revisan en cada sprint [31].

**Pregunta de control (criterio de salida de la etapa):** ¿está claro el problema, el impacto en números, la medida de éxito y el baseline? ¿Se hizo discovery con usuarios reales y no solo validación de una solución preconcebida? Si no, no se pasa a Elicitación [1][3].

## Etapa 2 — Elicitación: hablar con las personas correctas

**El objetivo es descubrir, no confirmar.** La trampa de la elicitación es ir con una solución en mente y buscar validación. El método correcto es ir con preguntas abiertas y escuchar [2].

**Quién participa:** el desarrollador o analista, y cada rol de usuario por separado. Los grupos mixtos tienden a silenciar las opiniones menos dominantes [2].

### Guía de entrevista — Feature: aprobación de OC por rol

**Para la jefa de compras (usuario principal):**

1. Describa el proceso actual desde que surge la necesidad de compra hasta que la OC está aprobada. ¿Quién hace qué y cuánto tarda cada paso?
2. ¿Qué información de la OC necesita ver antes de decidir si aprobar o rechazar?
3. ¿Hay casos en los que una OC que parece pequeña requiere revisión especial? ¿Cuáles?
4. ¿Qué pasa si la persona que debe aprobar no está disponible? ¿Cómo lo manejan hoy?
5. ¿Con qué frecuencia se rechazan OC? ¿Por qué razones?
6. Si pudiera hacer una sola cosa diferente en este proceso, ¿qué sería?

**Para el gerente de operaciones (aprobador actual):**

1. ¿Cuántas OC aprueba por semana? ¿Cuánto tiempo le toman?
2. ¿Cuáles son las OC que definitivamente necesitan su visto bueno? ¿Por qué?
3. ¿Cuáles podría delegar sin riesgo si tuviera las herramientas para hacerlo?
4. ¿Qué información necesita ver para sentirse seguro aprobando?
5. ¿Qué teme que salga mal si se delega la aprobación de OC pequeñas?

**Para el contador general (trazabilidad y auditoría):**

1. ¿Qué necesita ver en una OC aprobada para que sea válida contablemente?
2. ¿Hay requisitos de auditoría externa que el flujo de aprobación deba cumplir?
3. ¿Qué información debe quedar registrada y por cuánto tiempo?

### Preguntas adicionales modernas (omitidas en la versión original)

Además de las anteriores, la elicitación debe incluir, por rol, preguntas sobre:

- **Privacidad y datos personales:** ¿qué datos de proveedores/empleados se manejan? ¿Hay consentimiento, minimización, retención? (GDPR/leyes locales) [11].
- **Accesibilidad:** ¿hay usuarios con discapacidad visual/motriz/cognitiva que usan el flujo? ¿Se requiere conformidad WCAG 2.2 AA [12]?
- **Internacionalización:** ¿el ERP se usará en otros países/idiomas/monedas/zonas horarias? [12].
- **Gobernanza de datos:** ¿cuánto tiempo se retienen los registros? ¿Quién es el dueño del dato? ¿Hay requisitos de auditoría externa (DIAN, SOX)? [1].
- **Seguridad:** ¿qué roles/permisos existen? ¿Hay segregación de funciones (quien aprueba no puede pagar)? [11].

### Técnicas de elicitación y artefactos adicionales (práctica moderna)

La elicitación no se limita a entrevistas. La taxonomía de BABOK/IREB reconoce múltiples técnicas, cada una con su artefacto de salida [2][19][20]:

- **Entrevistas** (individuales o por rol), **focus groups**, **workshops de requisitos** y **observación / contextual inquiry** (shadowing del usuario en su contexto real).
- **Análisis de documentos** (procesos actuales, manuales, normativas, contratos, reportes).
- **Prototipos, wireframes y mockups** como artefactos de elicitación y validación: un prototipo de baja fidelidad del flujo de aprobación revela requisitos que las entrevistas no capturan [2][20].
- **Brainstorming, card sorting, encuestas/cuestionarios** para priorizar o clasificar requisitos a escala.
- **Jobs-to-be-Done (JTBD) / outcome-driven innovation:** en lugar de "features", se capturan los "jobs" que el usuario intenta realizar y los outcomes deseados. Útil para evitar el sesgo de solución [3][20].
- **Requirements workshops (JAD) y storyboarding:** talleres facilitados con stakeholders para acordar requisitos en tiempo real; el storyboarding captura flujos narrativos de uso [19][20][67].
- **Interface analysis (análisis de interfaces):** identificación de interfaces con sistemas/módulos externos (tesorería, notificaciones, directorio) y sus contratos de datos [19][20].
- **Benchmarking / análisis competitivo:** comparación con soluciones existentes para detectar requisitos implícitos [2][19].
- **Elicitación de restricciones y supuestos:** captura explícita de restricciones (presupuesto, fecha, tecnología, regulatorias) y supuestos que afectan el diseño [2][31].

Artefactos que esta etapa puede producir además de las notas de entrevista:

- **Business process model (BPMN) as-is / to-be:** diagrama del proceso actual (as-is) y del proceso deseado (to-be) con swimlanes por rol, gateways y eventos. Hace visible el cuello de botella y el cambio esperado [19][20].
- **Event Storming / domain events:** taller colaborativo que produce una línea de tiempo de eventos de dominio (ej. `OC Creada`, `OC Aprobada`, `OC Rechazada`) con comandos, actores y agregados. Es la base del modelo de dominio [21].
- **Domain model / glosario / lenguaje ubicuo (DDD):** vocabulario compartido entre negocio y tecnología (qué significa "proveedor nuevo", "aprobación directa", "umbral"). Se mantiene como glosario en el repositorio y se refleja en los nombres del código [21].
- **Conceptual data model (modelo de datos conceptual):** entidades, atributos y relaciones de negocio (OC, Proveedor, Aprobador, Regla de aprobación) sin detalles técnicos. Sirve para alinear con stakeholders [22].
- **Data dictionary (diccionario de datos):** definición de cada campo (nombre, tipo, formato, dominio, reglas de validación, fuente) para evitar ambigüedades en montos, fechas y estados [22].
- **Interface analysis / contratos de datos:** lista de interfaces con sistemas externos, datos intercambiados y protocolos [19][20].
- **Stakeholder communication plan:** estrategia de comunicación por interesado [1][2].
- **System context diagram (C4 nivel 1):** si no se hizo en Discovery, se elabora aquí para fijar alcance y dependencias [6].

### Resultado de la elicitación (notas reales)

Después de tres entrevistas de 60 minutos, se documentan los hallazgos:

```
Hallazgos clave — Aprobación de OC por rol

1. Umbral de delegación acordado: OC < $500.000 pueden ser aprobadas
   por la jefa de compras sin intervención del gerente.

2. Excepción no prevista en la Brief: OC de proveedores nuevos (sin
   historial en el sistema) requieren siempre revisión del gerente,
   independientemente del monto.

3. Cobertura en ausencia: si la jefa de compras no está, puede delegar
   a la asistente de compras con un límite de $200.000.

4. Requisito de auditoría (contador): el sistema debe guardar quién
   aprobó, en qué fecha y hora, el monto y si fue aprobación directa
   o delegada. Retención mínima: 5 años (requisito DIAN).

5. Rechazo: la jefa de compras rechaza ~3 OC/mes por proveedor
   no registrado o partida presupuestal equivocada. El proveedor
   debe recibir notificación con la razón específica.

6. Conflicto detectado: el gerente quiere poder ver y anular cualquier
   aprobación aunque ya haya sido procesada. El contador dice que
   una OC aprobada y pagada no puede anularse, solo puede generarse
   una nota crédito. → Resolución: el gerente puede anular antes del
   pago, no después.
```

**Pregunta de control:** ¿se conocen todos los roles, sus necesidades, los casos borde y los conflictos entre interesados? ¿Se documentaron los requisitos derivados, incluyendo seguridad, privacidad, accesibilidad e i18n? [1][2].

## Etapa 3 — Análisis y especificación: convertir lo aprendido en artefactos precisos

Esta es la etapa más técnicamente densa. La elicitación produce notas crudas; el análisis las convierte en artefactos que el equipo puede implementar y verificar [1][2].

### Reglas de negocio (artefacto en el repositorio)

```markdown
# Reglas de negocio — Aprobación de órdenes de compra (RN-OC)

## RN-OC-001: Umbral de aprobación autónoma

Una OC con valor neto ≤ $500.000 COP puede ser aprobada por la
jefa de compras sin aprobación del gerente de operaciones,
SIEMPRE QUE el proveedor no sea nuevo (ver RN-OC-002).

## RN-OC-002: Proveedor nuevo

Un proveedor es nuevo si no tiene ninguna OC aprobada en el sistema
en los últimos 180 días. Una OC de proveedor nuevo requiere aprobación
del gerente de operaciones independientemente del monto.

## RN-OC-003: Delegación temporal

La jefa de compras puede delegar su rol a la asistente de compras.
En modo delegado el límite de aprobación autónoma es $200.000 COP.
La delegación queda registrada en el log de auditoría.

## RN-OC-004: Registro de auditoría

Cada aprobación o rechazo debe registrar:

- ID del usuario que tomó la acción
- Timestamp UTC con zona local
- Monto de la OC al momento de la acción
- Tipo de aprobación: directa | delegada | gerencial
  Retención mínima: 5 años. No puede eliminarse ni modificarse.

## RN-OC-005: Anulación pre-pago

Una OC aprobada puede ser anulada por el gerente de operaciones
SIEMPRE QUE su estado no sea 'Pagada'. La anulación genera un
registro de auditoría y notifica a la jefa de compras.
```

### Requisitos no funcionales (NFR) — artefacto añadido

La especificación debe incluir, además de las reglas de negocio, los requisitos no funcionales que condicionan el diseño. Para esta feature:

- **Seguridad:** autenticación Bearer, autorización por rol, segregación de funciones (aprobador ≠ pagador), protección contra IDOR en `/purchase-orders/{id}/approve` [11].
- **Privacidad:** datos de proveedores y montos tratados como confidenciales; logs de auditoría sin PII innecesaria; retención 5 años con política de borrado posterior [11].
- **Accesibilidad:** conformidad WCAG 2.2 nivel AA en la UI de aprobación [12].
- **i18n:** mensajes y formatos de moneda/fecha localizables; soporte de zona horaria del usuario [12].
- **Performance:** p95 < 500 ms en `/approve`; detección de proveedor nuevo O(1) [7].
- **Disponibilidad:** SLO de 99.9 % para el endpoint de aprobación [9].
- **Auditabilidad:** log inmutable, append-only, con búsqueda por fecha y proveedor [1].

### Threat model (modelado de amenazas) — artefacto añadido

Antes de diseñar, se elabora un threat model ligero usando STRIDE sobre el flujo de aprobación [11]: spoofing (suplantación del aprobador), tampering (modificación del monto en tránsito), repudiation (negación de haber aprobado → mitigado por RN-OC-004), information disclosure (exposición de OCs ajenas), denial of service (bloqueo del endpoint), elevation of privilege (escalar de asistente a gerente). Cada amenaza se vincula a un control y a un test. Este artefacto se revisa en Diseño técnico.

### Contrato de API y versionado

La API debe declarar su política de versionado y compatibilidad hacia atrás desde esta etapa: ruta versionada (`/api/v1/...`), cambios aditivos preferidos, deprecación con aviso mínimo de 6 meses, y retiro solo tras período de sunset [14]. Los cambios breaking requieren nueva versión mayor y migración documentada.

### Matriz de trazabilidad de requisitos (RTM)

Se mantiene una matriz que vincula cada requisito (RN-OC-xxx, escenario BDD, NFR) con su artefacto de diseño, código, prueba y evidencia de validación [15]. Esto permite responder "¿este requisito está implementado y verificado?" y evaluar el impacto de cambios. La RTM es un documento vivo, no un spreadsheet estático [15].

### Validación de requisitos con stakeholders antes del build

Antes de pasar a Refinement, los artefactos (reglas, historia, NFR, threat model) se revisan con los stakeholders (jefa de compras, gerente, contador) en una sesión de validación [1][2]. Se busca consenso explícito y se registra el sign-off. Los requisitos ambiguos o en conflicto se resuelven aquí, no durante el sprint.

### Artefactos de especificación adicionales (práctica moderna)

Además de las reglas de negocio, la historia BDD y el NFR, la especificación profesional incluye los siguientes artefactos, varios de ellos definidos por IEEE/ISO/IEC 29148 [1][19]:

- **Familia de documentos de requisitos (ISO/IEC/IEEE 29148):** la especificación se organiza en documentos con audiencia y nivel de detalle distintos: **BRS** (Business Requirements Specification — objetivos, alcance, éxito, restricciones), **OpsCon** (Operational Concept — escenarios operacionales, roles, flujos), **StRS** (Stakeholder Requirements Specification — expectativas y criterios de aceptación sin detalles de implementación), **SyRS** (System Requirements Specification — requisitos del sistema completo, funcionales, no funcionales, interfaces, performance) y **SRS** (Software Requirements Specification — comportamiento del software en detalle suficiente para desarrollar y probar). En equipos ágiles estos documentos pueden ser ligeros y vivir como work items vinculados, pero los niveles de abstracción se mantienen [1][19].
- **Use cases (casos de uso):** diagrama de casos de uso + especificación textual (actor, precondiciones, flujo principal, flujos alternativos, postcondiciones, requisitos especiales). Complementan a las historias de usuario cuando el flujo es complejo o multi-actor; las historias capturan "qué valor", los casos de uso capturan "cómo interactúa" [2][23].
- **Domain model y glosario (lenguaje ubicuo):** ya iniciado en Elicitación; aquí se formaliza como diagrama de clases/conceptos del dominio y un glosario versionado en el repo, que los nombres de código deben respetar [21].
- **Conceptual data model y data dictionary:** formalización del modelo conceptual (entidades, relaciones) y el diccionario de datos con dominios y reglas de validación [22].
- **System context diagram (C4 nivel 1):** fija el alcance y las dependencias externas (módulo de tesorería, notificaciones, directorio de usuarios) [6].
- **Decision tables y state machines (máquinas de estado):** para reglas con muchas combinaciones de condiciones (ej. aprobación según monto × proveedor nuevo × rol × delegación) se usan tablas de decisión; para entidades con ciclo de vida (OC: Pendiente → Aprobada → Pagada → Anulada) se usan máquinas de estado. Ambos son artefactos de especificación verificables [24].
- **Requisitos con atributos (requirements attributes):** cada requisito (RN-OC-xxx, NFR, escenario) se gestiona con atributos: ID, nombre, descripción, tipo, fuente (stakeholder), prioridad, estado (borrador/en revisión/aprobado/implementado/verificado), versión, racional, criterio de verificación, owner y fecha. Estos atributos son la base del RTM y del control de cambios [25].
- **Validación vs verificación de requisitos:** la **validación** confirma que los requisitos correctos fueron capturados (¿resuelven el problema del stakeholder?); la **verificación** confirma que los requisitos están bien escritos (completos, no ambiguos, verificables, consistentes). Ambas deben ocurrir antes del build [26].
- **Definition of Ready (DoR):** criterios que debe cumplir una historia antes de entrar al sprint (historia clara, criterios de aceptación verificables, dependencias identificadas, diseño técnico si aplica, estimada, DoD conocida). Es el gate de entrada, distinto del DoD que es el gate de salida [27].
- **Plan de pruebas de aceptación (UAT) / estrategia de pruebas:** documento que define alcance, escenarios, datos de prueba, roles, entorno, criterios de entrada/salida y sign-off para la aceptación por el negocio. Se deriva de los criterios de aceptación BDD [28].
- **Privacy Impact Assessment (PIA/DPIA):** evaluación estructurada de riesgos de privacidad del procesamiento de datos personales (proveedores, empleados), con medidas de mitigación. Obligatorio bajo GDPR/leyes locales para procesamiento de alto riesgo [29].
- **Compliance matrix (matriz de cumplimiento):** mapeo de cada requisito regulatorio (DIAN, SOX, GDPR, WCAG, etc.) a la regla de negocio o NFR que lo satisface y a su evidencia de verificación [1].
- **Revisión formal de requisitos (inspection/walkthrough):** revisión estructurada de los artefactos (reglas, historia, NFR, threat model) contra criterios de calidad INCOSE (necesario, apropiado, singular, correcto, conforme, no ambiguo, completo, factible, verificable); se registran defectos y se cierran antes del build [60][61][68].
- **Restricciones y supuestos documentados:** restricciones de diseño/interfaz/entorno y supuestos que condicionan la especificación, separados de los requisitos funcionales [2][59].
- **Requisitos funcionales vs. no funcionales separados:** los funcionales describen "qué hace el sistema"; los NFR (ISO/IEC 25010 [33]) describen "cómo de bien"; ambos se gestionan y verifican por separado [2][33][69].
- **Modelado de requisitos (DFD, ERD, modelos de estado):** modelos conceptuales que facilitan el análisis y la comunicación; la elección de notación depende del problema y del equipo [2].
- **Criterios de aceptación verificables (INVEST/testables):** cada escenario debe ser observable y automatizable; se valida su testabilidad antes del build [2][26].
- **Threat model (STRIDE):** ya descrito; se referencia aquí como artefacto de especificación que se revisa en Diseño [11].

### Historia de usuario completa

```
US-OC-007 · Aprobación autónoma de OC por jefa de compras
Épica: Órdenes de Compra
Feature: Flujo de aprobación por rol
Prioridad: Must Have (MoSCoW)
Puntos: 5 (estimación equipo)

Como jefa de compras,
quiero poder aprobar directamente las OC que cumplen los criterios
de aprobación autónoma (RN-OC-001)
para reducir el tiempo de ciclo de las compras rutinarias sin
requerir la intervención del gerente en cada caso.

Contexto:
Hoy el 100 % de las OC pasan por el gerente, incluso las rutinarias.
Esto genera un cuello de botella de 2.1 días en promedio.
El gerente ha confirmado que confía en la jefa de compras para
OC ≤ $500.000 de proveedores con historial.

Criterios de aceptación:

Escenario 1 — Aprobación autónoma exitosa:
  Dado que soy la jefa de compras autenticada en el sistema
    Y existe una OC en estado 'Pendiente de aprobación'
    Y el valor neto de la OC es ≤ $500.000 COP
    Y el proveedor tiene al menos una OC aprobada en los últimos 180 días
  Cuando apruebo la OC
  Entonces la OC pasa a estado 'Aprobada'
    Y el sistema registra mi ID, el timestamp UTC, el monto
      y tipo = 'directa' (RN-OC-004)
    Y la OC queda disponible para el módulo de tesorería

Escenario 2 — OC de proveedor nuevo bloqueada:
  Dado que soy la jefa de compras
    Y la OC es de un proveedor sin OC aprobadas en los últimos 180 días
  Cuando intento aprobar la OC
  Entonces el sistema muestra aviso:
    'Esta OC requiere aprobación gerencial (proveedor nuevo).'
    Y la OC permanece en 'Pendiente de aprobación'
    Y el sistema envía notificación al gerente de operaciones

Escenario 3 — OC supera el umbral:
  Dado que soy la jefa de compras
    Y el valor neto de la OC es > $500.000 COP
  Cuando intento aprobar la OC
  Entonces el sistema muestra aviso:
    'Esta OC supera el límite de aprobación autónoma. Se notificó al gerente.'
    Y la OC permanece en 'Pendiente de aprobación gerencial'

Escenario 4 — Rechazo con razón:
  Dado que soy la jefa de compras
  Cuando rechazo la OC con una razón de al menos 10 caracteres
  Entonces la OC pasa a estado 'Rechazada'
    Y el sistema registra la acción en el log de auditoría
    Y notifica al solicitante con la razón del rechazo

Definition of Done:
- [ ] Los 4 escenarios tienen prueba automatizada pasando en CI
- [ ] RN-OC-001 y RN-OC-002 cubiertas por pruebas de integración
- [ ] RN-OC-004 verificada: el log de auditoría persiste y no es editable
- [ ] NFR de seguridad, a11y e i18n verificados
- [ ] Threat model revisado y controles implementados
- [ ] La historia fue validada con la jefa de compras antes del sprint
- [ ] Demo grabada o realizada en la revisión del sprint
- [ ] Documentación de API actualizada si aplica
- [ ] Runbook y métricas de observabilidad definidas
```

**Pregunta de control:** ¿cada criterio de aceptación es verificable automáticamente? ¿Alguien externo al equipo puede leerlo y confirmar que entiende lo mismo? ¿Los NFR y el threat model están especificados? [1][2][11].

## Etapa 4 — Refinement y priorización: qué entra al sprint y cuándo

El refinement es la sesión en que el equipo lee la historia, hace preguntas técnicas y la estima. Antes de esa sesión, el backlog debe estar priorizado.

### Priorización MoSCoW de la épica Órdenes de Compra

| Feature                                      | MoSCoW      | Razón                                          |
| -------------------------------------------- | ----------- | ---------------------------------------------- |
| Aprobación autónoma (US-OC-007)              | Must Have   | Es el core del problema. Sin esto, nada cambia |
| Aprobación gerencial con notificación        | Must Have   | Flujo complementario obligatorio               |
| Delegación temporal (RN-OC-003)              | Should Have | Frecuente, pero no bloquea el lanzamiento      |
| Anulación pre-pago (RN-OC-005)               | Should Have | El gerente lo necesitará en 1–2 meses          |
| Dashboard de OC por estado                   | Could Have  | Útil, pero los usuarios pueden hacer consultas |
| Integración con firma electrónica calificada | Won't Have  | V1: firma simple es suficiente para auditoría  |

### Priorización RICE (para comparar features entre épicas)

| Feature                       | Reach           | Impact    | Confidence | Effort | RICE score |
| ----------------------------- | --------------- | --------- | ---------- | ------ | ---------- |
| Aprobación autónoma OC        | 47 OC/mes       | 3 (alto)  | 90 %       | 5 pts  | **25.4**   |
| Notificaciones de rechazo CxP | 12 facturas/mes | 2 (medio) | 80 %       | 2 pts  | **9.6**    |
| Dashboard de proveedores      | 3 usuarios      | 2 (medio) | 70 %       | 8 pts  | **0.5**    |

Formula: `(Reach × Impact × Confidence) / Effort`. El score más alto entra primero.

### Priorización WSJF y Kano (prácticas modernas)

Para iniciativas grandes donde el costo del retraso es medible, se usa **WSJF (Weighted Shortest Job First)**: `(Costo del retraso) / (Tamaño del trabajo)`, donde el costo del retraso combina valor de negocio, criticidad por tiempo y reducción de riesgo/oportunidad [4]. **Kano** clasifica features en básicos, de desempeño y deleitadores según su impacto en la satisfacción del cliente, útil cuando hay investigación de usuarios [4]. MoSCoW es ordenamiento por cubetas, no ranking; combinarlo con RICE/WSJF evita la inflación de "Must Have" [4].

### Artefactos de priorización y gestión de cambios adicionales

- **Definition of Ready (DoR) formal:** antes de que una historia entre al sprint, se verifica un checklist: problema y valor claros; criterios de aceptación verificables; dependencias identificadas; impacto en BD/API/seguridad/a11y/i18n evaluado; estimación acordada; DoD conocida. La DoR es el gate de entrada al sprint, complementario al DoD (gate de salida) [27].
- **Baseline de requisitos y versionado:** una vez validados, los requisitos se "baselinan": se congela una versión aprobada que sirve como referencia para desarrollo, pruebas y control de cambios. Todo cambio posterior se gestiona contra esa baseline, con registro de qué versión cambió, quién lo aprobó y por qué [30].
- **Change request / log de cambios de requisitos:** registro formal de cada cambio a la baseline (descripción, justificación, impacto en alcance/costo/tiempo, aprobador, fecha). Evita el "scope creep" silencioso [30].
- **Risk register (registro de riesgos):** catálogo de riesgos del proyecto/feature con probabilidad, impacto, owner y mitigación. Se revisa en cada sprint [31].
- **Assumption log (registro de supuestos) y constraints log (restricciones):** supuestos que se asumen verdaderos para planificar (ej. "el proveedor ya está registrado en el ERP") y restricciones (presupuesto, fecha, tecnología, regulatorias). Si un supuesto resulta falso, se convierte en riesgo o cambio [31].
- **Decision log / ADR:** registro de decisiones tomadas (incluyendo las de requisitos: por qué se eligió $500.000 como umbral) con contexto y alternativas. Complementa los ADR técnicos [5].
- **Priorización avanzada (mención):** además de MoSCoW/RICE/WSJF/Kano, existen **AHP (Analytic Hierarchy Process)** (comparación pareada con escala 1–9) y el **método de los 100 dólares (cumulative voting)**, útiles cuando hay muchos stakeholders y requisitos. Se mencionan para contextos de priorización compleja [32].
- **Story splitting / descomposición vertical:** patrones para dividir historias grandes en slices verticales que entregan valor (por regla de negocio, por flujo, por variante de datos, por interfaz) durante el refinement; evita splits horizontales por capa [62].
- **Refinement continuo y capacidad:** cadencia de refinement (p. ej. semanal), estimación por afinidad/planning poker/t-shirt, y planificación de capacidad del sprint considerando deuda técnica y soporte [4][62].
- **Priorización basada en riesgo:** las historias que reducen riesgos técnicos/regulatorios se priorizan aunque su valor de negocio sea medio [4][31].

### Refinement: checklist de preguntas técnicas

En la sesión de refinement el equipo revisa la historia y responde:

- [ ] ¿La historia tiene un único criterio de aceptación no verificable? → volver a Especificación.
- [ ] ¿Depende de otra historia no entregada? → identificar la dependencia y bloquear.
- [ ] ¿Afecta la base de datos o el modelo de datos? → el diseño técnico es obligatorio antes de comenzar.
- [ ] ¿Afecta la API expuesta a otros módulos? → requiere ADR y coordinación.
- [ ] ¿Hay impacto en seguridad/privacidad/accesibilidad/i18n? → revisar threat model y NFR.
- [ ] ¿Es estimable? Si nadie puede estimar, el equipo la divide o investiga más.
- [ ] ¿Hay capacidad/performance implicada? → definir prueba de carga.

**US-OC-007 estimada en 5 puntos** (escala Fibonacci: 1, 2, 3, 5, 8, 13). La discusión reveló una incertidumbre: ¿cómo se detecta "proveedor nuevo"? ¿Se consulta en tiempo real o hay una bandera en el registro? → se creó un spike técnico de 1 punto para resolverlo antes de que la historia entre al sprint.

**Pregunta de control:** ¿el equipo entiende la historia, conoce las dependencias y la estimación refleja el esfuerzo real, incluyendo seguridad, a11y y performance? [1][4].

## Etapa 5 — Diseño técnico: decisiones de arquitectura antes de codificar (aquí se crea el ADR)

El diseño técnico ocurre cuando la historia es Must Have y el refinement confirmó que afecta el modelo de datos, la API o la arquitectura. No es un documento largo; es una decisión registrada [5][6].

**El ADR se crea aquí, antes de OpenSpec.** El ADR (Architecture Decision Record) es el artefacto que captura la decisión arquitectural (contexto, opciones, decisión, consecuencias) y vive en `/docs/adr/`. Se crea en esta etapa porque la decisión debe estar tomada y documentada **antes** de crear el change OpenSpec, ya que `design.md` (que se genera en la siguiente etapa) referencia el ADR. El ADR precede al change, no lo sigue.

### Spike técnico resuelto: detección de proveedor nuevo

Antes de diseñar, el equipo resolvió la incertidumbre del refinement:

```
Spike TASK-SP-021 — Detección de proveedor nuevo
Resultado: se agrega el campo `last_approved_oc_date` a la tabla
`suppliers`. Se actualiza en cada aprobación de OC. La consulta es
O(1). No requiere join adicional. Tiempo: 3 horas.
```

### ADR-012: Modelo de aprobación por rol

```markdown
# ADR-012 — Estrategia de aprobación de OC por rol

Fecha: 2026-11-20 · Estado: Aprobado
Decisores: Tech Lead, Jefa de compras (negocio)

## Contexto

Necesitamos un mecanismo de aprobación de OC que soporte múltiples
roles, umbrales variables y delegación temporal, con log de auditoría
no modificable. Las reglas de negocio pueden cambiar (el umbral
puede ajustarse por política de la empresa).

## Opciones consideradas

### A — Lógica de aprobación hardcodeada en el servicio

Simple de implementar. Cambiar el umbral requiere un deploy.

### B — Motor de reglas de aprobación configurable (tabla de BD)

Las reglas (umbral, rol, condición) se guardan en una tabla y se
evalúan en tiempo de ejecución. Cambiar el umbral es una operación
de base de datos, sin deploy.

## Decisión: Opción B

El umbral de $500.000 es una política de empresa, no una constante
técnica. Cambios futuros son previsibles. El costo de implementar
el motor es 2 puntos adicionales; el costo de no tenerlo es un deploy
cada vez que gerencia cambia el umbral.

## Consecuencias

- Se crea la tabla `approval_rules` con columnas: role, max_amount,
  requires_supplier_history (bool), delegate_role, delegate_max_amount.
- El servicio de aprobación consulta esta tabla al evaluar cada OC.
- Las reglas son inmutables desde el código (no hay hardcode);
  solo el administrador del sistema puede modificarlas.
- Se agrega el campo `last_approved_oc_date` a la tabla `suppliers`.
```

### RFC y diagramas C4 (prácticas modernas)

Para decisiones que afectan a varios equipos o módulos, se redacta un **RFC (Request for Comments)**: documento con contexto, propuesta, alternativas y discusión, compartido para feedback antes de decidir [5]. Las decisiones finalmente aceptadas se registran como **ADR** (inmutables; si se revierten se crea un ADR que supersede al anterior) [5][6]. Se acompañan de **diagramas C4** (niveles 1 contexto y 2 contenedores) para que cualquier persona entienda el sistema sin leer código [6].

### Diseño de API (con versionado y compatibilidad)

```
POST /api/v1/purchase-orders/{id}/approve
Authorización: Bearer <token>
Body: { "action": "approve" | "reject", "reason": string? }

Respuesta 200 — aprobación directa:
{
  "status": "approved",
  "approval_type": "direct" | "delegated" | "managerial",
  "approved_by": "uuid",
  "approved_at": "2026-11-20T18:32:00Z",
  "audit_log_id": "uuid"
}

Respuesta 200 — redirigida a aprobación gerencial:
{ "status": "pending_managerial", "reason": "new_supplier" | "threshold_exceeded" }

Respuesta 403 — sin permiso:
{ "error": "insufficient_role", "required_role": "purchasing_manager" }
```

La API sigue la política de versionado declarada en Especificación: cambios aditivos, deprecación con aviso ≥ 6 meses, retiro con sunset [14].

### Migración de base de datos: expand/contract

Los cambios de esquema (nuevo campo `last_approved_oc_date`, nueva tabla `approval_rules`) se ejecutan con el patrón **expand/contract (parallel change)** para evitar downtime y permitir rollback [13]:

1. **Expand:** añadir columnas/tablas nuevas sin romper el código actual (nullable o con default).
2. **Migrate:** desplegar código que soporta ambas formas, backfill en lotes, verificar consistencia.
3. **Contract:** eliminar la estructura antigua solo cuando todas las instancias usan la nueva y el rollback ya no depende de ella.

Cada paso debe ser reversible y probado en staging; se documenta el plan de rollback [13].

### Performance, capacidad y FinOps

Se definen objetivos de performance (p95 < 500 ms) y se estima la carga esperada (47 OC/mes base, picos de cierre de mes). Se revisa el costo de los recursos nuevos (tabla, índices, notificaciones) bajo la lente FinOps: visibilidad, rightsizing, y alertas de costo [16]. La observabilidad (métricas, logs, traces) se diseña aquí, no después.

### Diseño por atributos de calidad (práctica prescrita, añadida en revisión)

El diseño debe explicitar cómo se satisfacen los NFR y atributos de calidad (ISO/IEC 25010 [33], ATAM [34]):

- **Security/privacy/accessibility/i18n by design:** controles de seguridad y privacidad, conformidad WCAG 2.2 AA, externalización de strings y formatos locales se diseñan aquí, no se añaden después [11][12][33].
- **Architecture evaluation (ATAM):** evaluación de trade-offs de arquitectura (performance vs. costo, seguridad vs. usabilidad) con escenarios de calidad [34].
- **Proof of Concept / prototipo técnico:** validación de decisiones de alto riesgo (motor de reglas, performance) antes de comprometer el build [2][5].
- **Design patterns y principios:** aplicación de patrones (repository, strategy para reglas de aprobación) y principios SOLID; documentados en el ADR [5][6].
- **Design review:** revisión por pares del diseño (ADR/RFC/C4) con checklist de impactos en BD, API, seguridad, performance, costo y rollback [5][6][13].

### Threat model revisado

El threat model de Especificación se revisa con el diseño concreto: se verifican controles (validación de rol, parametrización de queries, rate limiting, audit log inmutable) y se añaden mitigaciones específicas [11].

**Pregunta de control:** ¿el diseño técnico fue revisado por al menos un par? ¿Los impactos en BD, API, seguridad, performance y costo están documentados? ¿Hay plan de migración y rollback? [5][6][11][13].

## Etapa 6 — Build y pruebas: TDD, CI y code review

### Flujo de ramas (trunk-based development)

La práctica moderna preferida es **trunk-based development**: ramas de vida muy corta (< 1 día), merges frecuentes a trunk, sin code freezes ni fases de integración [8]. La feature se integra detrás de un feature flag, por lo que el código puede mergearse y desplegarse "oscuro" [8].

```
main (trunk)
  └── feature/OC-007-approval-by-role   ← vida corta, merge frecuente
        └── (merge a main al finalizar, detrás de flag)
```

Una historia = una rama corta. El PR se abre contra `main`. La integración continua ejecuta build y tests en cada commit [8].

### TDD — ciclo para Escenario 1 (aprobación autónoma)

El principio de TDD es: escribe la prueba primero, haz que falle, escribe el código mínimo que la hace pasar, refactoriza.

```python
# test_purchase_order_approval.py
# Paso 1: escribir la prueba ANTES del código

def test_direct_approval_success(purchase_order_service, mock_audit_log):
    """
    US-OC-007 · Escenario 1: aprobación autónoma exitosa
    Cobertura: RN-OC-001 (umbral ≤ $500.000, proveedor con historial)
    """
    # Arrange
    po = PurchaseOrder(
        id="po-001",
        amount=350_000,
        supplier=Supplier(id="s-001", last_approved_oc_date=date(2026, 10, 1)),
        status=POStatus.PENDING_APPROVAL
    )
    approver = User(id="u-001", role=Role.PURCHASING_MANAGER)

    # Act
    result = purchase_order_service.approve(po, approver, action="approve")

    # Assert
    assert result.status == POStatus.APPROVED
    assert result.approval_type == ApprovalType.DIRECT
    mock_audit_log.assert_called_once_with(
        po_id="po-001",
        user_id="u-001",
        action="approve",
        approval_type=ApprovalType.DIRECT
    )

def test_new_supplier_blocked_regardless_of_amount(purchase_order_service):
    """
    US-OC-007 · Escenario 2: proveedor nuevo → bloqueo y notificación gerencial
    Cobertura: RN-OC-002
    """
    po = PurchaseOrder(
        id="po-002",
        amount=100_000,  # Bajo el umbral, pero proveedor nuevo
        supplier=Supplier(id="s-002", last_approved_oc_date=None),  # Nunca aprobado
        status=POStatus.PENDING_APPROVAL
    )
    approver = User(id="u-001", role=Role.PURCHASING_MANAGER)

    result = purchase_order_service.approve(po, approver, action="approve")

    assert result.status == POStatus.PENDING_MANAGERIAL
    assert result.block_reason == "new_supplier"
```

### Seguridad shift-left (DevSecOps)

La seguridad se integra en el pipeline, no al final [11]: SAST (análisis estático), SCA (escaneo de dependencias), secret scanning, y DAST básico en staging. El threat model se traduce en casos de prueba de seguridad (autorización, IDOR, inyección). Las vulnerabilidades críticas bloquean el merge [11].

### Pruebas adicionales modernas

- **Contract testing:** si la API la consumen otros módulos, se validan contratos (Pact o similar) para detectar breaking changes [14].
- **Accesibilidad:** pruebas automatizadas (axe-core) + revisión manual con lector de pantalla [12].
- **i18n:** verificación de strings externalizados, formatos de fecha/moneda, layouts RTL [12].
- **Performance/carga:** prueba de carga del endpoint `/approve` contra el SLO [7].
- **Resiliencia/caos:** experimentos controlados (latencia de BD, caída de dependencia) para validar manejo de errores [17].
- **Observabilidad:** verificación de que métricas, logs y traces se emiten correctamente [9].
- **Estrategia de pruebas y pirámide de tests:** definición de la proporción unitarias/integración/E2E y de la estrategia de automatización; tests rápidos y deterministas en la base [64].
- **Gestión de datos de prueba:** datos representativos, anonimizados para privacidad, y fixtures reproducibles [28].
- **Mutation testing:** evaluación de la calidad de la suite de pruebas mediante mutantes (opcional, para código crítico) [64].
- **Seguridad (DAST/IAST/pen testing):** pruebas dinámicas e, idealmente, pentesting para flujos críticos (aprobación, auditoría) [11].
- **Performance testing (load/stress/soak/spike):** validación de comportamiento bajo carga sostenida y picos [7].
- **Prácticas de CI:** feedback rápido (< 10 min), build una sola vez, artefactos reutilizables, gates bloqueantes [7][8].
- **Colaboración (pair/mob programming):** opcional para código crítico o transferencia de conocimiento [8].

### Code Review Checklist

Antes de aprobar el PR, el revisor verifica:

- [ ] **Funcional:** ¿el código implementa exactamente los criterios de aceptación de US-OC-007? ¿Sin más, sin menos?
- [ ] **Reglas de negocio:** ¿están referenciadas en los comentarios o en los nombres de los tests (RN-OC-001, RN-OC-002)?
- [ ] **Seguridad:** ¿el endpoint verifica el rol antes de ejecutar la lógica? ¿No hay exposición de datos de auditoría por API no autenticada? ¿Se validó contra el threat model? [11]
- [ ] **Cobertura:** ¿los 4 escenarios tienen prueba automatizada? ¿La cobertura de la capa de servicio es ≥ 90 %?
- [ ] **Diseño:** ¿la lógica de aprobación consulta `approval_rules` como definió ADR-012? ¿No hay hardcode del umbral?
- [ ] **Migraciones:** ¿la migración sigue expand/contract? ¿Es reversible? ¿Fue revisada? [13]
- [ ] **Log de auditoría:** ¿el registro se escribe en la misma transacción que la aprobación? (Si falla uno, falla el otro.)
- [ ] **Performance:** ¿la consulta de `approval_rules` es indexada? ¿La detección de proveedor nuevo es O(1)?
- [ ] **Accesibilidad/i18n:** ¿la UI cumple WCAG 2.2 AA y strings localizados? [12]
- [ ] **Observabilidad:** ¿se emiten métricas/logs/traces para el SLI? [9]
- [ ] **Documentación:** ¿README/runbook/API docs actualizados?

### Pipeline CI (GitHub Actions)

```yaml
on: [pull_request]
jobs:
  verify:
    steps:
      - name: Lint
        run: ruff check .
      - name: Tests unitarios
        run: pytest tests/unit/ --cov=src --cov-fail-under=90
      - name: Tests de integración
        run: pytest tests/integration/ -k "purchase_order"
      - name: Contract tests
        run: pytest tests/contract/
      - name: Análisis estático de seguridad (SAST)
        run: bandit -r src/
      - name: Escaneo de dependencias (SCA)
        run: safety check
      - name: Accesibilidad
        run: npx axe-cli http://localhost:3000/approval
      - name: Performance (k6)
        run: k6 run tests/perf/approve.js
```

El PR no puede mergearse si algún paso falla. No hay excepciones [7][8].

### Plan de rollback

Antes de mergear, se documenta el plan de rollback: cómo revertir el código (revert del PR), cómo revertir la migración de BD (paso contract no ejecutado aún), y cómo desactivar el feature flag. El plan se prueba en staging [13][9].

**Pregunta de control:** ¿todos los checks del CI pasan? ¿El revisor aprobó explícitamente? ¿La Definition of Done está 100 % marcada? ¿Existe plan de rollback probado? [7][8].

## Etapa 7 — Entrega y monitoreo: de staging a producción

### Despliegue con feature flag y estrategias de release

La feature no se activa para todos los usuarios el día del deploy. Se usa un feature flag para controlar quién la ve, combinado con estrategias de bajo riesgo [9][18]:

```python
# En el código
if feature_flags.is_enabled('oc_approval_by_role', user=current_user):
    return ApprovalByRoleFlow()
else:
    return LegacyApprovalFlow()  # El flujo actual sigue funcionando
```

**Secuencia de activación:**

1. Deploy a producción con el flag desactivado para todos (el código está, nadie lo ve).
2. Activar para el equipo interno (QA manual en producción real).
3. Demo de sprint con la jefa de compras y el gerente en producción con datos reales.
4. Canary: activar para un porcentaje pequeño de tráfico/usuarios y monitorear SLIs [9].
5. Blue-green o progressive delivery: cambiar tráfico gradualmente si los SLIs se mantienen [9].
6. Activar para el 100 % si no hay observaciones bloqueantes.
7. Retirar el feature flag en el siguiente sprint (deuda técnica planificada).

### Demo de sprint — Checklist

- [ ] Mostrar escenario 1: OC de $300.000 de proveedor con historial → aprobación directa.
- [ ] Mostrar escenario 2: OC de $100.000 de proveedor nuevo → bloqueo y notificación al gerente.
- [ ] Mostrar escenario 3: OC de $700.000 → redirigida a aprobación gerencial.
- [ ] Mostrar el log de auditoría al contador general.
- [ ] Capturar retroalimentación en el backlog. Si hay un bloqueante, la feature no va a producción.

### Monitoreo post-despliegue

**SLIs definidos para esta feature:**

| Indicador                                   | Objetivo (SLO) | Alerta si                              |
| ------------------------------------------- | -------------- | -------------------------------------- |
| Tiempo de respuesta del endpoint `/approve` | p95 < 500 ms   | p95 > 800 ms por 5 min                 |
| Tasa de error 5xx en `/approve`             | < 0.1 %        | > 0.5 % en cualquier ventana de 10 min |
| Log de auditoría escrito por aprobación     | 100 %          | Cualquier aprobación sin log           |
| Tiempo promedio de aprobación de OC < $500K | < 4 h          | > 8 h por 2 días consecutivos          |

**Error budget:** con un SLO de 99.9 %, el presupuesto de error es ~43 min/mes. Si se consume, se pausan los releases y se prioriza la confiabilidad [9][10].

**Métricas DORA del sprint:**

- **Tiempo de entrega de cambios:** desde el primer commit de US-OC-007 hasta su despliegue en producción.
- **Frecuencia de despliegue:** si el equipo hace un deploy por sprint, aquí queda registrado.
- **Tasa de fallos de cambios:** si esta feature genera un incidente, se registra como fallo.
- **Tiempo de recuperación ante fallos:** MTTR del servicio.

Se miden por servicio, en tendencia, sin convertirlas en objetivo individual (evitar gaming) [8].

### Gestión de incidentes, runbooks y post-mortems

Se preparan **runbooks** para los escenarios de fallo previsibles (BD caída, notificación fallida, log de auditoría no escrito) con pasos de mitigación y rollback [10][18]. Ante un incidente, se sigue el proceso de gestión de incidentes (severidad, comunicación, mitigación, resolución) y se realiza un **post-mortem blameless** si se cumple algún trigger (downtime visible, pérdida de datos, intervención on-call, tiempo de resolución alto, fallo de monitoreo) [10][18]. El post-mortem documenta impacto, causa raíz y acciones preventivas, y se trackea su cumplimiento.

### Retroalimentación y cierre del ciclo

**Retrospectiva (input para el siguiente ciclo):**

Una semana después del despliegue se revisa:

- ¿El tiempo promedio de aprobación cayó de 2.1 días a < 4 h?
- ¿Cuántos proveedores nuevos generaron escalaciones al gerente?
- ¿Hay casos borde que no se cubrieron?
- ¿Se consumió el error budget?

Esta retroalimentación se convierte en historias en el backlog para el siguiente sprint. El ciclo comienza de nuevo (descubrimiento continuo) [3].

### Documentación, onboarding y runbooks

Se actualiza la documentación de usuario, la documentación de API, el runbook operativo y los materiales de onboarding para nuevos miembros. La documentación es un artefacto de salida de la feature, no un afterthought [10].

### Deprecación y retiro de la feature (ciclo de vida)

Toda feature tiene un ciclo de vida. Si en el futuro se reemplaza el flujo de aprobación (ej. firma electrónica calificada), se aplica una política de deprecación: anuncio con ≥ 6 meses de anticipación, período de sunset, migración documentada y retiro solo tras confirmar que no hay consumidores [14]. Los feature flags y las versiones de API se retiran para evitar deuda técnica.

### Release management, hypercare y limpieza (práctica prescrita, añadida en revisión)

La entrega profesional incluye, además de lo anterior, la gestión del release y el período posterior [63][66]:

- **Release plan / checklist:** secuencia de despliegue, responsables, comunicación a usuarios y stakeholders, y criterios de go/no-go [63].
- **Hypercare:** período post-release con monitoreo reforzado y soporte dedicado para detectar regresiones tempranas [63].
- **Post-release verification:** validación en producción de los SLIs y de la medida de éxito (tiempo de aprobación < 4 h) contra el baseline [9][3].
- **Feature flag cleanup plan:** retiro del flag y del código legacy en el sprint siguiente para evitar deuda técnica [66][14].
- **Experimentación (A/B, dark launching):** si el impacto es incierto, rollout gradual con hipótesis y criterio de éxito/fracaso medible [3][66].
- **Comunicación de release:** anuncio a usuarios, notas de release y actualización de documentación/onboarding [10][63].
- **Rollback drill:** ensayo del plan de rollback en staging antes del release [13][9].

**Pregunta de control final:** ¿el problema definido en la Feature Brief (etapa 1) fue resuelto y verificado con métricas reales? ¿Los runbooks y la documentación están actualizados? [1][9][10].

## Gobernanza transversal: seguridad, privacidad, cumplimiento, accesibilidad e i18n

Estas prácticas no son una etapa aislada: atraviesan Discovery (preguntas), Especificación (NFR, threat model), Diseño (controles), Build (pruebas y gates) y Entrega (monitoreo). Se resumen aquí para que ningún equipo las omita:

- **Seguridad:** threat modeling STRIDE [11], SAST/SCA/secret scanning en CI [11], autorización por rol, segregación de funciones.
- **Privacidad:** minimización y retención de datos, GDPR/leyes locales, logs sin PII innecesaria [11].
- **Cumplimiento:** requisitos regulatorios (DIAN, SOX, etc.) reflejados en reglas de negocio y RTM [1][15].
- **Privacidad:** minimización y retención de datos, GDPR/leyes locales, logs sin PII innecesaria; PIA/DPIA para procesamiento de alto riesgo [11][29].
- **Compliance matrix:** mapeo requisito regulatorio → regla/NFR → evidencia de verificación [1].
- **Accesibilidad:** WCAG 2.2 AA, pruebas automatizadas + manuales [12].
- **i18n:** externalización de strings, formatos locales, zonas horarias [12].
- **Datos:** gobernanza, dueño del dato, retención, backups [1].

## Catálogo de artefactos de levantamiento de requisitos

Para que el flujo sea completo y auditable, se lista aquí el conjunto de artefactos que la ingeniería de requisitos (IEEE/ISO/IEC 29148 [1], SWEBOK v4 [2], BABOK [19], IREB CPRE [20]) considera parte del levantamiento y gestión de requisitos. No todos aplican a toda feature; se seleccionan según criticidad, regulación y tamaño. La columna "Etapa" indica dónde se produce o consume en este flujo.

| #   | Artefacto                                                                                                               | Etapa                         | Nivel       | Propósito / contenido clave                                                   | Fuente       |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------- | ----------------------------------------------------------------------------- | ------------ |
| 1   | Feature Brief                                                                                                           | 1 Discovery                   | Core        | Problema, impacto medido, resultado esperado, medida de éxito, stakeholders   | [3]          |
| 2   | Stakeholder register / matriz poder-interés                                                                             | 1 Discovery                   | Condicional | Inventario de interesados, influencia, interés, estrategia de gestión         | [1][2]       |
| 3   | Product Vision / Vision Statement / Vision Board                                                                        | 1 Discovery                   | Condicional | Anclaje de la feature a la estrategia del producto                            | [3]          |
| 4   | Personas / empathy maps                                                                                                 | 1 Discovery                   | Condicional | Arquetipos de usuario basados en investigación                                | [3]          |
| 5   | Journey maps / service blueprints                                                                                       | 1 Discovery                   | Condicional | Flujo actual y deseado del usuario (frontstage/backstage)                     | [3]          |
| 6   | Opportunity Solution Tree / Impact Mapping                                                                              | 1 Discovery                   | Condicional | Outcome → oportunidades → soluciones → experimentos                           | [3]          |
| 7   | System context diagram (C4 nivel 1)                                                                                     | 1/2                           | Condicional | Alcance y dependencias externas                                               | [6]          |
| 8   | Baseline de métricas                                                                                                    | 1 Discovery                   | Condicional | Estado actual para verificación posterior                                     | [3]          |
| 9   | Notas de entrevista por rol                                                                                             | 2 Elicitación                 | Core        | Hallazgos crudos por rol de usuario                                           | [2]          |
| 10  | Guía de entrevista                                                                                                      | 2 Elicitación                 | Core        | Preguntas abiertas por rol                                                    | [2]          |
| 11  | Técnicas de elicitación (workshops, observación, document analysis, prototipos, encuestas, card sorting, brainstorming) | 2 Elicitación                 | Condicional | Descubrimiento, no confirmación                                               | [2][19][20]  |
| 12  | Jobs-to-be-Done (JTBD)                                                                                                  | 2 Elicitación                 | Condicional | Jobs y outcomes deseados del usuario                                          | [3][20]      |
| 13  | Prototipos / wireframes / mockups                                                                                       | 2 Elicitación                 | Condicional | Artefactos de elicitación y validación                                        | [2][20]      |
| 14  | Business process model BPMN as-is/to-be                                                                                 | 2 Elicitación                 | Condicional | Proceso actual y deseado por rol                                              | [19][20]     |
| 15  | Event Storming / domain events                                                                                          | 2 Elicitación                 | Condicional | Línea de tiempo de eventos de dominio                                         | [21]         |
| 16  | Domain model / glosario / lenguaje ubicuo (DDD)                                                                         | 2/3                           | Condicional | Vocabulario compartido negocio-tecnología                                     | [21]         |
| 17  | Conceptual data model                                                                                                   | 2/3                           | Condicional | Entidades, atributos, relaciones de negocio                                   | [22]         |
| 18  | Data dictionary                                                                                                         | 2/3                           | Condicional | Definición de cada campo (tipo, dominio, validación)                          | [22]         |
| 19  | BRS (Business Requirements Specification)                                                                               | 3 Especificación              | Condicional | Objetivos, alcance, éxito, restricciones                                      | [1][19]      |
| 20  | OpsCon (Operational Concept)                                                                                            | 3 Especificación              | Condicional | Escenarios operacionales, roles, flujos                                       | [1][19]      |
| 21  | StRS (Stakeholder Requirements Specification)                                                                           | 3 Especificación              | Condicional | Expectativas y criterios de aceptación (sin implementación)                   | [1][19]      |
| 22  | SyRS (System Requirements Specification)                                                                                | 3 Especificación              | Condicional | Requisitos del sistema completo (funcionales, NFR, interfaces, performance)   | [1][19]      |
| 23  | SRS (Software Requirements Specification)                                                                               | 3 Especificación              | Condicional | Comportamiento del software para desarrollar y probar                         | [1][19]      |
| 24  | Reglas de negocio (RN-xxx)                                                                                              | 3 Especificación              | Core        | Reglas formales y verificables                                                | [1][2]       |
| 25  | Use cases (diagrama + especificación textual)                                                                           | 3 Especificación              | Condicional | Actor, precondiciones, flujos, postcondiciones, requisitos especiales         | [2][23]      |
| 26  | Requisitos no funcionales (NFR)                                                                                         | 3 Especificación              | Condicional | Seguridad, privacidad, a11y, i18n, performance, disponibilidad, auditabilidad | [1][11][12]  |
| 27  | ISO/IEC 25010 (marco de calidad)                                                                                        | 3 Especificación              | Avanzado    | Características de calidad para NFR                                           | [33]         |
| 28  | Quality attribute scenarios (ATAM)                                                                                      | 3/5 Especificación/Diseño     | Avanzado    | Escenarios de atributos de calidad y trade-offs                               | [34]         |
| 29  | Historia de usuario BDD + DoD                                                                                           | 3 Especificación              | Core        | Criterios de aceptación en Gherkin + Definition of Done                       | [2]          |
| 30  | Definition of Ready (DoR)                                                                                               | 3/4 Especificación/Refinement | Core        | Gate de entrada al sprint (distinto del DoD)                                  | [27]         |
| 31  | Decision tables / state machines                                                                                        | 3 Especificación              | Condicional | Reglas combinacionales y ciclo de vida de entidades                           | [24]         |
| 32  | Requisitos con atributos (ID, fuente, prioridad, estado, versión, racional, verificación, owner)                        | 3 Especificación              | Condicional | Base del RTM y control de cambios                                             | [25]         |
| 33  | Matriz de trazabilidad (RTM)                                                                                            | 3 Especificación              | Core        | Requisito → diseño → código → prueba → evidencia                              | [15]         |
| 34  | Validación de requisitos con sign-off                                                                                   | 3 Especificación              | Condicional | Consenso explícito con stakeholders                                           | [1][2]       |
| 35  | Validación vs verificación                                                                                              | 3 Especificación              | Condicional | Requisitos correctos vs requisitos bien escritos                              | [26]         |
| 36  | Acceptance test plan (UAT) / estrategia de pruebas                                                                      | 3 Especificación              | Condicional | Alcance, escenarios, datos, criterios de entrada/salida, sign-off             | [28]         |
| 37  | Threat model (STRIDE)                                                                                                   | 3 Especificación              | Condicional | Amenazas vinculadas a controles y tests                                       | [11]         |
| 38  | Privacy Impact Assessment (PIA/DPIA)                                                                                    | 3 Especificación              | Avanzado    | Riesgos de privacidad y mitigaciones                                          | [29]         |
| 39  | Compliance matrix (matriz de cumplimiento)                                                                              | 3 Especificación              | Condicional | Requisito regulatorio → regla/NFR → evidencia                                 | [1]          |
| 40  | Contrato de API y versionado                                                                                            | 3 Especificación              | Core        | Política de versionado, deprecación, sunset                                   | [14]         |
| 41  | Priorización MoSCoW / RICE / WSJF / Kano                                                                                | 4 Refinement                  | Core        | Ordenamiento y ranking de features                                            | [4]          |
| 42  | Priorización avanzada (AHP, método de los 100 dólares)                                                                  | 4 Refinement                  | Condicional | Priorización con muchos stakeholders                                          | [32]         |
| 43  | Baseline de requisitos y versionado                                                                                     | 4 Refinement                  | Core        | Versión aprobada congelada como referencia                                    | [30]         |
| 44  | Change request / log de cambios de requisitos                                                                           | 4 Refinement                  | Core        | Control de cambios contra la baseline                                         | [30]         |
| 45  | Risk register (registro de riesgos)                                                                                     | 4 Refinement                  | Condicional | Riesgos con probabilidad, impacto, owner, mitigación                          | [31]         |
| 46  | Assumption log (supuestos)                                                                                              | 4 Refinement                  | Condicional | Supuestos asumidos verdaderos para planificar                                 | [31]         |
| 47  | Constraints log (restricciones)                                                                                         | 4 Refinement                  | Condicional | Restricciones de presupuesto, fecha, tecnología, regulación                   | [31]         |
| 48  | Decision log / ADR                                                                                                      | 4/5 Refinement/Diseño         | Condicional | Decisiones tomadas con contexto y alternativas                                | [5]          |
| 49  | Spikes técnicos                                                                                                         | 4 Refinement                  | Core        | Resolución de incertidumbres antes del sprint                                 | [2]          |
| 50  | Estimación (story points)                                                                                               | 4 Refinement                  | Core        | Esfuerzo relativo del equipo                                                  | [4]          |
| 51  | ADR / RFC + diagramas C4                                                                                                | 5 Diseño                      | Core        | Decisiones de arquitectura registradas                                        | [5][6]       |
| 52  | Diseño de API (con versionado)                                                                                          | 5 Diseño                      | Core        | Contrato detallado del endpoint                                               | [14]         |
| 53  | Migración BD (expand/contract) + plan rollback                                                                          | 5 Diseño                      | Core        | Cambios de esquema sin downtime                                               | [13]         |
| 54  | Interface Control Document (ICD)                                                                                        | 5 Diseño                      | Condicional | Contrato de interfaces entre sistemas/módulos                                 | [35]         |
| 55  | Runbooks / plan de incidentes / post-mortem                                                                             | 7 Entrega                     | Core        | Operación y aprendizaje                                                       | [10][18]     |
| 56  | Feasibility study (factibilidad)                                                                                        | 1 Discovery                   | Condicional | Viabilidad técnica/económica/legal/operativa/cronograma                       | [2][59]      |
| 57  | Business case / cost-benefit                                                                                            | 1 Discovery                   | Condicional | Justificación económica del problema vs. solución                             | [2][65]      |
| 58  | Project charter / scope statement                                                                                       | 1 Discovery                   | Condicional | Autorización, alcance in/out, restricciones, supuestos                        | [65]         |
| 59  | Stakeholder communication plan                                                                                          | 1/2                           | Condicional | Estrategia de comunicación por interesado                                     | [1][2]       |
| 60  | Risk register (semilla)                                                                                                 | 1/4                           | Condicional | Riesgos iniciales, owner, mitigación                                          | [31]         |
| 61  | Assumption log (semilla)                                                                                                | 1/4                           | Condicional | Supuestos asumidos verdaderos para planificar                                 | [31]         |
| 62  | Interface analysis / contratos de datos                                                                                 | 2 Elicitación                 | Condicional | Interfaces con sistemas externos y datos intercambiados                       | [19][20]     |
| 63  | Requirements review (inspection/walkthrough)                                                                            | 3 Especificación              | Condicional | Revisión formal contra criterios de calidad INCOSE                            | [60][61][68] |
| 64  | Restricciones y supuestos documentados                                                                                  | 3 Especificación              | Condicional | Restricciones de diseño/interfaz/entorno y supuestos                          | [2][59]      |
| 65  | Story splitting patterns                                                                                                | 4 Refinement                  | Condicional | Descomposición vertical de historias grandes                                  | [62]         |
| 66  | Test strategy / pirámide de tests                                                                                       | 6 Build                       | Condicional | Proporción y estrategia de automatización                                     | [64]         |
| 67  | Gestión de datos de prueba                                                                                              | 6 Build                       | Condicional | Datos representativos y anonimizados                                          | [28]         |
| 68  | Security testing (DAST/IAST/pentest)                                                                                    | 6 Build                       | Condicional | Pruebas dinámicas de seguridad                                                | [11]         |
| 69  | Performance testing (load/stress/soak/spike)                                                                            | 6 Build                       | Condicional | Validación bajo carga sostenida y picos                                       | [7]          |
| 70  | Release plan / checklist                                                                                                | 7 Entrega                     | Condicional | Secuencia de despliegue, go/no-go, comunicación                               | [63]         |
| 71  | Hypercare                                                                                                               | 7 Entrega                     | Condicional | Monitoreo reforzado post-release                                              | [63]         |
| 72  | Feature flag cleanup plan                                                                                               | 7 Entrega                     | Condicional | Retiro de flag y código legacy                                                | [66][14]     |

Esta tabla es el "inventario" de artefactos de requisitos; la RTM (artefacto #33) es el mecanismo que los vincula entre sí y con el código y las pruebas [15].

## Gaps de la versión original y prácticas modernas

La versión original de este documento cubría bien el flujo de 7 etapas pero omitía prácticas que la ingeniería profesional considera estándar. Las 46 omisiones originales y cómo se cubren ahora están resumidas en el catálogo de artefactos (columna "Nivel") y en la sección "Niveles de adopción". Las principales: descubrimiento continuo y UX research [3], métricas baseline y experimentación [3], validación con stakeholders [1][2], RTM [15], NFR [1][11][12], threat model STRIDE [11], seguridad shift-left [11], a11y [12], i18n [12], gobernanza de datos [1][11], versionado de API [14], migración expand/contract [13], plan de rollback [13][9], pruebas de capacidad [7], caos/resiliencia [17], observabilidad [9], incidentes/runbooks/post-mortems [10][18], DORA [8], canary/blue-green [9], FinOps [16], docs/onboarding [10], deprecación [14], priorización WSJF/Kano [4], RFC/C4 [5][6], trunk-based [8], stakeholder register [1][2], Product Vision [3], personas/journey maps/OST [3], técnicas de elicitación [2][19][20], BPMN [19][20], Event Storming/domain events [21], domain model/glosario [21], data model/dictionary [22], familia ISO 29148 [1][19], use cases [2][23], decision tables/state machines [24], requisitos con atributos y validación vs verificación [25][26], DoR [27], UAT [28], PIA/DPIA y compliance matrix [1][29], baseline de requisitos y change log [30], risk/assumption/constraints logs [31], ISO 25010 [33], ATAM [34], ICD [35].

## Tabla resumen del flujo (actualizada)

| Etapa                        | Responsable                                    | Entra                                   | Sale                                                                                                                                                                                                                                                         | Herramienta                              | Pregunta de control                                                                             |
| ---------------------------- | ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1. Discovery                 | Product owner / Stakeholder / Trío de producto | Señal de negocio (queja, oportunidad)   | Feature Brief, stakeholder register, Product Vision, personas, journey maps, OST/Impact Mapping, system context diagram, baseline, discovery UX                                                                                                              | Notion, Confluence, sesiones, prototipos | ¿El problema está en números? ¿Hay medida de éxito y baseline? ¿Se hizo discovery con usuarios? |
| 2. Elicitación               | Desarrollador / Analista                       | Feature Brief                           | Notas de entrevista, hallazgos, requisitos derivados, conflictos resueltos, preguntas de privacidad/a11y/i18n/datos, BPMN as-is/to-be, Event Storming, domain model/glosario, conceptual data model, data dictionary, prototipos                             | Guía de entrevista, Miro, grabación      | ¿Se habló con todos los roles? ¿Se documentaron casos borde y NFR?                              |
| 3. Análisis y especificación | Desarrollador / Analista                       | Hallazgos de elicitación                | BRS/OpsCon/StRS/SyRS/SRS (según nivel), reglas de negocio, use cases, historia BDD con DoD, DoR, NFR (ISO 25010), quality attribute scenarios, threat model, PIA/DPIA, compliance matrix, contrato API, RTM con atributos, validación con sign-off, plan UAT | Linear/Jira, Markdown en repo            | ¿Cada criterio es verificable? ¿Stakeholders validaron? ¿RTM completa?                          |
| 4. Refinement y priorización | Equipo completo                                | Historia de usuario                     | Historia estimada, DoR verificada, dependencias, spikes, priorización MoSCoW/RICE/WSJF/Kano/AHP, baseline de requisitos, change log, risk/assumption/constraints logs, decision log                                                                          | Planning Poker, MoSCoW, RICE, WSJF       | ¿El equipo entiende la historia y sabe por dónde empezar?                                       |
| 5. Diseño técnico            | Desarrollador senior / Tech lead               | Historia estimada + spikes resueltos    | ADR/RFC, C4, diseño API, cambios BD (expand/contract), plan rollback, NFR/perf/FinOps, threat model revisado                                                                                                                                                 | draw.io, Structurizr, Markdown           | ¿Diseño revisado por par? ¿Impactos y rollback documentados?                                    |
| 6. Build y pruebas           | Desarrollador                                  | Diseño técnico + historia con criterios | Código, pruebas (TDD, contract, a11y, perf, caos), PR aprobado, CI verde, plan rollback                                                                                                                                                                      | Git, pytest/Jest, GitHub Actions         | ¿CI pasa? ¿DoD 100 %? ¿Revisor aprobó? ¿Rollback probado?                                       |
| 7. Entrega y monitoreo       | Desarrollador + Product owner + SRE            | PR mergeado                             | Feature desplegada (flag/canary), alertas activas, métricas DORA, runbooks, docs, post-mortem si aplica                                                                                                                                                      | Feature flags, Prometheus, Grafana, k6   | ¿El problema original se resolvió? ¿Las métricas lo confirman? ¿Docs/runbooks actualizados?     |

---

## Niveles de adopción (realidad vs. ideal)

El catálogo anterior es un **inventario completo** de lo que la ingeniería de requisitos prescribe; no es una lista obligatoria. En la práctica empresarial real, el nivel de formalidad depende del contexto (tamaño del equipo, regulación, criticidad). Se proponen tres niveles; cada artefacto del catálogo se marca con su nivel en la columna "Nivel".

| Nivel                                                                            | Contexto típico                                                    | Artefactos mínimos (Core)                                                                                                                                                                                                                                                                                                                                                                      | Artefactos adicionales                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Nivel 1 — Mínimo viable** (startup / equipo pequeño, bajo riesgo)              | Equipos < 8 personas, sin regulación, ciclos cortos                | Feature Brief, notas de entrevista, reglas de negocio, historia BDD + DoD, DoR, RTM, contrato API, priorización MoSCoW/RICE, spikes, estimación, ADR, diseño API, migración BD + rollback, runbooks                                                                                                                                                                                            | —                                                     |
| **Nivel 2 — Equipo maduro** (mediana empresa, producto con usuarios reales)      | Equipos 8-30, producto en producción, usuarios externos            | Todo lo de Nivel 1 + stakeholder register, Product Vision, personas, journey maps, OST, baseline de métricas, BPMN as-is/to-be, domain model/glosario, data dictionary, familia ISO 29148 (BRS/StRS/SyRS/SRS según necesidad), use cases, NFR, ISO 25010, threat model, validación con sign-off, UAT, risk/assumption/constraints logs, decision log, RFC/C4, expand/contract, NFR/perf/FinOps | AHP/100 dólares, ATAM, decision tables/state machines |
| **Nivel 3 — Enterprise regulado** (finanzas, salud, gobierno, sistemas críticos) | Regulación (DIAN, SOX, GDPR), auditoría externa, sistemas críticos | Todo lo de Nivel 2 + PIA/DPIA, compliance matrix, ISO 25010 completo, quality attribute scenarios (ATAM), ICD, mutation testing, DAST/IAST/pentest, chaos engineering, hypercare, release management formal, DORA completo                                                                                                                                                                     | —                                                     |

**Lectura:** un equipo Nivel 1 que intente producir los 72 artefactos fracasará por sobrecarga. Un equipo Nivel 3 que omita PIA/threat model/compliance fallará en auditoría. El catálogo es el "menú"; el nivel define el "pedido".

**Regla de selección:** elegir el nivel según el riesgo del cambio y la regulación aplicable, no según el tamaño del equipo. Un cambio pequeño en un sistema de pagos (Nivel 3) exige más artefactos que un cambio grande en un dashboard interno (Nivel 1).

---

## Cómo hacer ingeniería de requisitos al entrar en una organización (startup vs. empresa consolidada)

Este apartado responde a la pregunta práctica: "Acabo de entrar a una empresa que usa Project One como software. ¿Cómo levanto y gestiono requisitos aquí?". La respuesta depende del tipo de organización. Se asume que el lector ya conoce el flujo de 7 etapas y el catálogo de artefactos anteriores; aquí se traducen a la realidad operativa de cada contexto.

### 0. Principio común a ambos contextos

Antes de elegir nivel o artefactos, aplica siempre:

1. Identifica el nivel de adopción (Nivel 1/2/3 de la sección "Niveles de adopción") según el riesgo y la regulación del cambio, no según el tamaño de la empresa.
2. Mapea tu rol a los roles del framework (PO/stakeholder, Tech Lead, Desarrollador, Reviewer, Researcher, PM, SRE). En organizaciones pequeñas una persona cumple varios roles; en consolidadas están separados.
3. Usa OpenSpec como fuente de verdad (openspec/changes/<name>/): proposal -> specs (deltas) -> design -> tasks. Todo requisito debe terminar en un change verificable o en un ADR/RFC.
4. No inventes artefactos que nadie consumirá. La regla de oro: un artefacto existe solo si alguien lo lee y lo usa para decidir. Si nadie lo consume, no lo produzcas (evita burocracia).
5. Persiste todo en el repo (docs/, PRDS/, openspec/), nunca solo en chat o en conversaciones efímeras.

### A. Contexto: Startup (equipo pequeño, producto propio, bajo riesgo inicial)

Perfil típico: 3-12 personas, un solo producto, clientes internos o early adopters, ciclos cortos, presupuesto limitado, sin regulación estricta. El mismo desarrollador suele ser PO, analista y tester.

Nivel de adopción recomendado: Nivel 1 (Mínimo viable), subiendo a Nivel 2 cuando aparezcan usuarios externos o datos sensibles.

#### A.1 Cómo se recogen los requisitos en una startup

| Etapa del flujo   | Cómo se hace en la startup                                                                                                                                          | Artefactos mínimos                                                                             | Tiempo típico |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------- |
| 1. Discovery      | Conversación directa con el fundador/cliente; si hay métricas, se capturan. No se hace Feature Brief formal salvo que el cambio sea grande.                         | Feature Brief ligero (1 página) o issue de Trello; baseline de métricas si existe.             | 0.5-1 día     |
| 2. Elicitación    | 1 entrevista o una llamada de 30 min con el usuario principal. No se documentan todos los roles; se pregunta "¿qué te duele y qué esperas?".                        | Notas en el issue/Trello; si hay flujo complejo, un BPMN rápido.                               | 0.5 día       |
| 3. Especificación | Historia de usuario con AC en BDD (3-5 escenarios) + DoD. NFR solo los críticos (seguridad básica, performance). No se producen BRS/OpsCon/StRS/SyRS/SRS separados. | OpenSpec change (proposal.md + delta spec + tasks.md); ADR solo si hay decisión arquitectural. | 0.5-1 día     |
| 4. Refinement     | Planning poker rápido o estimación por afinidad. Priorización por impacto/urgencia, no MoSCoW formal. DoR verificada mentalmente.                                   | Historia estimada; Trello card con AC.                                                         | 0.5 día       |
| 5. Diseño         | ADR solo si hay trade-off no obvio. Sin C4 formal (un diagrama mental o un sketch). Migración expand/contract solo si hay datos en producción.                      | design.md si afecta BD/API; plan de rollback simple.                                           | 0.5-1 día     |
| 6. Build          | TDD para lógica de negocio crítica; CI mínimo (lint + tests + build). Sin contract testing ni chaos.                                                                | Código, tests, PR contra main, CI verde.                                                       | 2-5 días      |
| 7. Entrega        | Deploy directo con feature flag si el cambio es riesgoso; si no, deploy directo. Monitoreo básico (logs + uptime). Sin SLO formal ni DORA.                          | Feature desplegada; smoke test manual.                                                         | 0.5 día       |

#### A.2 Detalle etapa por etapa con ejemplo real (startup)

**Ejemplo real:** Feature "Notificación por email cuando una OC es rechazada" (startup de 5 personas, producto ERP interno).

**Etapa 1 — Discovery (0.5 día).** El fundador dice "los proveedores se quejan de que no saben por qué se rechazó su OC". Se captura baseline: 3 rechazos/mes sin notificación. Feature Brief de 1 página: problema, impacto (3 OC/mes sin feedback), medida de éxito (100% de rechazos notificados en < 1 min). No se hace stakeholder register formal (solo fundador + 1 usuario).

**Etapa 2 — Elicitación (0.5 día).** Una llamada de 30 min con la jefa de compras. Preguntas: ¿qué info necesita el proveedor? ¿qué canal? (email). ¿qué pasa si el email falla? (reintentar 3 veces, luego marcar como "notificación fallida"). Notas en el issue de Trello. No se hace BPMN ni Event Storming.

**Etapa 3 — Especificación (0.5 día).** Se crea el change `add-po-rejection-notification` con `/opsx:propose`. Contenido:

- `proposal.md`: Why (proveedores sin feedback), What Changes (servicio de notificación + template email + retry), Non-goals (no SMS, no push), Impact (riesgo bajo, depende de servicio de email existente), Rollback (desactivar feature flag).
- `specs/po-rejection-notification/spec.md`: delta ADDED con 3 escenarios BDD (notificación exitosa, retry en fallo, fallo definitivo tras 3 intentos).
- `tasks.md`: 6 tasks (crear servicio, template, retry logic, test unitario, test integración, actualizar docs).
- DoR verificada mentalmente (problema claro, AC verificables, dependencias disponibles, estimación 2 días).
- NFR: solo seguridad básica (no exponer datos sensibles en el email) y performance (envío async, no bloquear el rechazo).

**Etapa 4 — Refinement (0.5 día).** Estimación: 2 días (S). Priorización: Must Have (bloquea adopción del módulo). Spike: ninguno (servicio de email ya existe). Trello card creada con AC en BDD.

**Etapa 5 — Diseño (0.5 día).** No se hace ADR (decisión obvia: usar servicio de email existente). `design.md` mínimo: flujo (rechazo → enqueue notificación → envío async → log), retry con backoff exponencial, template con variables (proveedor, razón, monto, fecha). Plan de rollback: desactivar flag `po_rejection_notification_enabled`.

**Etapa 6 — Build (2 días).** TDD: test del servicio de notificación (mock del mailer), test de retry. Implementación. CI: lint + tests + build. Code review por el subagente `reviewer` (auto-review). PR contra `main`. Feature flag configurado (desactivado por defecto).

**Etapa 7 — Entrega (0.5 día).** Deploy a producción con flag desactivado. Activar para el equipo interno (fundador + jefa de compras). Prueba manual: rechazar una OC de prueba → verificar email recibido. Activar para 100%. Monitoreo básico: logs del servicio de email + alerta si hay > 5 fallos en 1 hora. `/opsx:verify` → `/opsx:archive`. RTM actualizada (tabla simple en el change).

**Total: ~4.5 días-persona.** Sin BPMN, sin Event Storming, sin ADR, sin SLO formal, sin hypercare. Suficiente para una startup.

Roles en la startup: una persona (el dev principal) cumple PO + desarrollador + reviewer. El subagente reviewer se usa para code review cuando el dev no puede auto-revisarse con objetividad. El researcher se usa solo para incertidumbres técnicas bloqueantes.

Artefactos que SÍ se usan (Core): Feature Brief ligero, notas de entrevista, reglas de negocio, historia BDD + DoD, DoR (mental o checklist corto), RTM (aunque sea una tabla simple en el change), contrato API, priorización por impacto, spikes, estimación, ADR (solo si hay decisión), diseño API, migración + rollback, runbooks básicos.

Artefactos que NO se usan (Nivel 1): stakeholder register formal, Product Vision board, personas/journey maps, OST, BPMN, Event Storming, domain model formal, familia ISO 29148 (BRS/OpsCon/StRS/SyRS/SRS), use cases, NFR formales, ISO 25010, ATAM, decision tables, PIA/DPIA, compliance matrix, ICD, AHP, risk/assumption/constraints logs formales, mutation testing, DAST/IAST, chaos, hypercare, DORA formal.

Cadencia recomendada: sprint de 1 semana, refinement cada viernes, demo cada viernes, retrospectiva cada 2 semanas. Un change OpenSpec por feature pequeña; varios changes solo si la feature es grande.

Peligros típicos en startup:

- Scope creep silencioso: sin PRD ni DoR, el alcance crece sin control. Mitigación: escribir siempre un issue con "qué entra / qué NO entra" (Non-goals).
- Deuda técnica acumulada: sin ADR ni threat model, las decisiones se olvidan. Mitigación: ADR de una página para cada decisión no obvia.
- Falta de trazabilidad: sin RTM, no se sabe qué está implementado. Mitigación: la RTM mínima vive dentro del tasks.md del change (columna "verificado por test X").
- No medir outcomes: sin baseline, no se sabe si el problema se resolvió. Mitigación: capturar 1-2 métricas antes de construir.

### B. Contexto: Empresa consolidada de software a la medida (custom software)

Perfil típico: 20-200+ personas, múltiples clientes/proyectos, contratos con SLA, facturación por proyecto, equipos por cliente o por squad, mayor formalidad, posible regulación por industria del cliente (finanzas, salud, gobierno).

Nivel de adopción recomendado: Nivel 2 (Equipo maduro) por defecto; Nivel 3 si el cliente es regulado (DIAN, SOX, GDPR, HIPAA) o el sistema es crítico.

#### B.1 Cómo se recogen los requisitos en una empresa consolidada

| Etapa del flujo   | Cómo se hace en empresa consolidada                                                                                                                                                                              | Artefactos mínimos                                                                                                                                         | Tiempo típico |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1. Discovery      | Reunión con el sponsor del cliente + Product Owner interno. Se firma un SOW (Statement of Work) o anexo de alcance. Se captura baseline de métricas del proceso actual.                                          | Feature Brief formal, stakeholder register, Product Vision, baseline de métricas, project charter/scope statement, feasibility study si hay incertidumbre. | 2-5 días      |
| 2. Elicitación    | Workshops de requisitos (JAD) con usuarios clave del cliente (3-6 personas). Entrevistas individuales por rol. Análisis de documentos (manuales, normativas, contratos). Prototipos de baja fidelidad validados. | Notas por rol, BPMN as-is/to-be, domain model/glosario, data dictionary, interface analysis, prototipos validados, stakeholder communication plan.         | 3-8 días      |
| 3. Especificación | PRD formal (BRS/StRS/SyRS según contrato) con NFR, threat model, RTM, DoR, UAT plan, compliance matrix si aplica. Revisión formal de requisitos (inspection) con sign-off del cliente.                           | OpenSpec change con proposal + deltas + design + tasks; ADR/RFC para decisiones; threat model; PIA/DPIA si hay datos personales; contrato API versionado.  | 3-7 días      |
| 4. Refinement     | Planning poker con el equipo completo. Priorización MoSCoW/RICE con el cliente. DoR verificada y registrada. Baseline de requisitos congelada. Risk/assumption/constraints logs.                                 | Historia estimada, DoR verificada, dependencias, spikes, baseline, change log, risk register.                                                              | 1-2 días      |
| 5. Diseño         | ADR/RFC con review por Tech Lead y (si aplica) arquitecto del cliente. C4 niveles 1-2. Plan de migración expand/contract y rollback. ATAM si el sistema es crítico.                                              | ADR/RFC, C4, diseño API, plan de migración + rollback, NFR/perf/FinOps, threat model revisado, ICD si hay integraciones.                                   | 2-5 días      |
| 6. Build          | TDD, CI completo (lint, tests, SAST, SCA, secret scanning, a11y, perf). Code review obligatorio por par. Contract testing si hay integraciones.                                                                  | Código, pruebas, PR aprobado, CI verde, plan de rollback probado en staging.                                                                               | 5-15 días     |
| 7. Entrega        | Deploy con feature flag y canary. Demo al cliente (sprint review). Hypercare post-release. Métricas DORA y SLO. Post-mortem si hay incidente. Documentación y runbooks actualizados.                             | Feature desplegada, alertas activas, DORA, runbooks, docs, deprecación planificada.                                                                        | 2-4 días      |

#### B.2 Detalle etapa por etapa con ejemplo real (empresa consolidada)

**Ejemplo real:** Feature "Integración con firma electrónica calificada para aprobación de OC" (empresa de software a la medida, cliente = entidad financiera regulada por la Superintendencia Financiera; equipo de 12 personas).

**Etapa 1 — Discovery (3 días).** Reunión con el sponsor del cliente (Director de Compras) y el PO interno. Se firma anexo de alcance al SOW. Baseline capturado: 47 OC/mes aprobadas manualmente con firma manuscrita, tiempo promedio 2.1 días, 2 incidentes de fraude en el último año. Feature Brief formal + stakeholder register (sponsor, jefa de compras, contador, auditor interno, TI del cliente, proveedor de firma). Product Vision: "aprobación digital con validez legal y trazabilidad total". Feasibility study: evaluar 2 proveedores de firma calificada (costo, SLA, integración). Project charter con alcance in/out (in: firma de aprobador; out: firma de solicitante en V1). Early risk register: riesgo de no aceptación legal, riesgo de integración, riesgo de costo. Baseline de métricas: tiempo de aprobación 2.1 días, 0% de OC con firma digital.

**Etapa 2 — Elicitación (5 días).** Workshop JAD con 5 usuarios del cliente (jefa de compras, 2 aprobadores, contador, auditor). Entrevistas individuales por rol. Análisis de documentos: normativa de firma electrónica (Ley 527 de 1999, Decreto 2364 de 2012), manual de aprobaciones del cliente, contratos con proveedores de firma. Prototipo de baja fidelidad del flujo de firma validado con 3 usuarios. BPMN as-is (firma manuscrita + escaneo) y to-be (firma digital + verificación). Domain model: OC, Aprobador, Firma, Certificado, Proveedor de firma. Data dictionary: campos de firma (ID certificado, timestamp, hash, algoritmo). Interface analysis: API del proveedor de firma (REST, OAuth2, webhook de confirmación). Stakeholder communication plan: reuniones quincenales con sponsor, demo mensual.

**Etapa 3 — Especificación (5 días).** PRD formal (BRS + StRS + SyRS) con NFR: seguridad (OAuth2, mTLS, cifrado en tránsito y reposo), privacidad (datos de firmantes, retención 10 años por regulación), a11y (WCAG 2.2 AA), performance (p95 < 2s para firma), disponibilidad (99.9%). Threat model STRIDE sobre el flujo de firma (spoofing del firmante, tampering de la OC firmada, repudiation, information disclosure de certificados, DoS del proveedor de firma). PIA/DPIA (datos personales de firmantes). Compliance matrix: Ley 527/1999 -> RN-FIRMA-001..005 -> evidencia de verificación. RTM con atributos por requisito. DoR formal. UAT plan: escenarios, datos de prueba, roles, entorno de staging del proveedor, criterios de entrada/salida, sign-off del auditor. Revisión formal de requisitos (inspection) con el cliente: 12 defectos encontrados, 10 cerrados, 2 diferidos con justificación. OpenSpec change `add-qualified-electronic-signature` con proposal + delta spec (8 escenarios BDD) + design + tasks (32 tasks). ADR-013: elección de proveedor de firma (opciones: proveedor A vs B; decisión: A por SLA y soporte mTLS).

**Etapa 4 — Refinement (2 días).** Planning poker con el equipo (8 devs). Estimación: 32 tasks → tamaño L → se descompone en 3 changes: `add-signature-provider-integration` (M, 12 tasks), `add-signature-approval-flow` (M, 14 tasks), `add-signature-verification-ui` (S, 6 tasks). Priorización MoSCoW: los 3 son Must Have (el cliente los necesita para el release regulatorio). DoR verificada y registrada en cada proposal. Baseline de requisitos congelada (v1.0). Risk register: riesgo de integración con proveedor (probabilidad media, impacto alto, owner Tech Lead, mitigación: PoC en sprint 0). Assumption log: "el proveedor de firma entrega certificados de prueba en 2 semanas". Constraints log: fecha límite regulatoria (31/03/2027), presupuesto fijo, tecnología mandada por el cliente (Java + Spring). Decision log: elección de proveedor, algoritmo (SHA-256 + RSA), formato (XAdES).

**Etapa 5 — Diseño (4 días).** ADR-013 (proveedor de firma) + RFC para la integración (contexto, propuesta, alternativas, feedback del equipo). Diagramas C4 niveles 1-2. Diseño API: endpoint `POST /api/v1/purchase-orders/{id}/sign` con request/response, errores, idempotencia. Migración BD expand/contract: nueva tabla `signatures` (expand: crear tabla nullable), backfill, contract (eliminar campo legacy) en sprint posterior. Plan de rollback: revertir código + desactivar feature flag + no ejecutar contract hasta validar. ATAM: trade-off performance (latencia del proveedor 1.5s) vs. seguridad (mTLS + retry). PoC técnico: integración con el proveedor en staging (2 días). Design review por Tech Lead + arquitecto del cliente. Threat model revisado con mitigaciones concretas (mTLS, validación de certificado, audit log inmutable).

**Etapa 6 — Build (12 días).** TDD: tests unitarios del servicio de firma (mock del proveedor), tests de integración con el sandbox del proveedor, tests de retry/fallo. Contract testing con el proveedor (Pact). Seguridad: SAST, SCA, secret scanning, DAST básico en staging. Accesibilidad: axe-core en la UI de firma. Performance: prueba de carga del endpoint de firma contra SLO (p95 < 2s). Resiliencia: experimento de caída del proveedor (retry + circuit breaker). Observabilidad: métricas/logs/traces para SLI (latencia de firma, tasa de error, firmas exitosas). Code review obligatorio por par (Tech Lead + senior). CI verde con todos los gates. Plan de rollback probado en staging (revert + desactivar flag).

**Etapa 7 — Entrega (3 días).** Release plan: secuencia de despliegue (staging → producción), responsables, comunicación al cliente, criterios go/no-go. Deploy a producción con feature flag desactivado. Activar para equipo interno (QA manual en producción real). Demo al cliente (sprint review) con los 3 escenarios. Canary: 10% de usuarios por 48h monitoreando SLIs. Blue-green: cambiar tráfico si SLIs se mantienen. Hypercare: 2 semanas con monitoreo reforzado y soporte dedicado. Post-release verification: validar tiempo de aprobación con firma vs. baseline (2.1 días -> objetivo < 4h). Métricas DORA registradas. Feature flag cleanup plan: retiro en sprint siguiente. Documentación y runbooks actualizados. Post-mortem si hay incidente (blameless). Comunicación de release: notas de release al cliente. /opsx:verify -> /opsx:archive por cada change. RTM consolidada en RELEASE-v1.0.md.

**Total: ~34 días-persona distribuidos en 3 sprints.** Con BPMN, Event Storming, domain model, familia ISO 29148, NFR formales, threat model, PIA/DPIA, compliance matrix, ADR/RFC, C4, ATAM, PoC, contract testing, DAST, performance testing, canary, hypercare, DORA, RTM por change y por release. Justificado por la regulación (entidad financiera) y la criticidad (firma con validez legal).

Roles en empresa consolidada: separados por persona. El PO del cliente (o el PM interno) define y valida; el Tech Lead diseña; los developers implementan; el Reviewer (puede ser un senior o un agente) revisa; el Researcher investiga; el PM (Trello) gestiona; SRE/Ops despliega y monitorea. En Project One, el main agent asume varios roles, pero la separación se mantiene como modos.

Artefactos adicionales vs. startup (Nivel 2/3): stakeholder register, Product Vision, personas, journey maps, OST, baseline de métricas, BPMN, Event Storming, domain model/glosario, data dictionary, familia ISO 29148 (según contrato), use cases, NFR formales, ISO 25010, threat model, validación con sign-off, UAT plan, PIA/DPIA (si datos personales), compliance matrix (si regulación), risk/assumption/constraints logs, decision log, RFC/C4, expand/contract, plan de rollback, feature flag, canary, SLI/SLO, DORA, runbooks, docs, deprecación.

Cadencia recomendada: sprint de 2 semanas, refinement semanal, sprint review con el cliente al final de cada sprint, retrospectiva interna. Un change OpenSpec por capacidad; PRDs grandes se descomponen (sección 4 del framework). Cada change tiene su RTM y su card Trello.

Peligros típicos en empresa consolidada:

- Burocracia excesiva: producir los 72 artefactos para cada cambio. Mitigación: aplicar el nivel de adopción (Nivel 2 por defecto) y justificar cada artefacto adicional.
- Desalineación con el cliente: requisitos que el dev interpreta distinto al cliente. Mitigación: validación con sign-off (Etapa 3) y demo en producción (Etapa 7).
- Scope creep contractual: cambios no contemplados en el SOW. Mitigación: change request formal contra la baseline de requisitos (sección 4.3 del framework).
- Trazabilidad rota: código que no se mapea a requisitos. Mitigación: RTM viva en el mismo PR.
- Deuda de documentación: docs que se desactualizan. Mitigación: documentación como artefacto de salida (DoD) y revisión en cada PR.

### C. Guía de entrada: primeros 30 días en Project One

Independientemente del tipo de organización, al entrar a trabajar en Project One sigue esta secuencia:

1. Día 1-2: Conocer el contexto. Leer AGENTS.md, este documento, y la sección "Framework operativo". Revisar openspec/config.yaml, openspec/specs/ (capacidades existentes) y openspec/changes/ (activos y archivados).
2. Día 2-3: Entender el tooling. OpenSpec (/opsx:\*), gh, Trello (via @project-manager), CI, guardrails. Verificar que los hooks de Husky funcionan.
3. Día 3-5: Identificar el nivel de adopción de tu equipo/proyecto (Nivel 1/2/3) y los artefactos Core que se usan. Preguntar al Tech Lead o PO cuáles son obligatorios en tu contexto.
4. Día 5-10: Primer cambio pequeño. Tomar una tarea XS/S (1-8 tasks), crear el change con /opsx:propose, escribir proposal + delta spec + tasks con DoR/DoD, implementar con TDD, verificar con /opsx:verify, archivar. Esto valida que entiendes el flujo end-to-end.
5. Día 10-20: Primer PRD o feature. Si te asignan una feature, aplicar las 7 etapas al nivel de adopción elegido. Crear el Feature Brief, entrevistar al stakeholder, especificar, refinar, diseñar, construir, entregar. Persistir todo en el repo.
6. Día 20-30: Adoptar hábitos. Persistir research en docs/research/, mantener la RTM, verificar DoR antes de build, registrar decisiones en ADR, medir baseline y outcomes. Participar en code review y retrospectivas.

### D. Checklist rápido por tipo de organización

| Pregunta                  | Startup (Nivel 1)                | Empresa consolidada (Nivel 2/3)       |
| ------------------------- | -------------------------------- | ------------------------------------- |
| ¿Hay PRD formal?          | Issue de 1 página con Non-goals  | PRD firmado con alcance y baseline    |
| ¿Se entrevistan usuarios? | 1 llamada de 30 min              | Workshop JAD + entrevistas por rol    |
| ¿Se documentan NFR?       | Solo críticos (seguridad básica) | NFR formales (ISO 25010)              |
| ¿Hay threat model?        | Solo si toca auth/datos          | Sí, STRIDE para cambios sensibles     |
| ¿Se usa RTM?              | Tabla simple en el change        | Archivo docs/traceability/<change>.md |
| ¿Se hace ADR?             | Solo si hay trade-off no obvio   | Sí, para decisiones arquitecturales   |
| ¿Se miden outcomes?       | 1-2 métricas manuales            | SLO/SLI + DORA + retrospectiva        |
| ¿Se hace hypercare?       | No (monitoreo básico)            | Sí, con rollback drill                |

### E. Errores comunes al empezar (y cómo evitarlos)

1. Producir artefactos que nadie lee. Solución: aplicar el nivel de adopción y preguntar "¿quién consume esto?".
2. Saltarse la validación con stakeholders. Solución: siempre una sesión de validación con sign-off antes del build, aunque sea de 15 minutos.
3. No registrar el baseline. Solución: capturar 1-2 métricas del estado actual antes de construir; sin ellas no se puede verificar el outcome.
4. Marcar tasks como done sin ejecutar. Solución: DoD con pruebas reales en CI; no aceptar "static verification only" como done.
5. No persistir la investigación. Solución: toda investigación del researcher se guarda en docs/research/ y se cita en el change.
6. Confundir "listo para build" con "listo para merge". Solución: DoR (entrada) ≠ DoD (salida); verificar ambas.
7. No archivar changes. Solución: un change sin tasks completas en 30 días se revisa (archivar/dividir/descartar).

---

---

## Framework operativo para Project One

> **Propósito:** definir el flujo de ingeniería de requisitos para Project One, especificando en qué etapa entra OpenSpec y cuándo se crean los tickets en Trello. Las secciones anteriores conservan el "qué y por qué" de cada etapa con nivel de detalle enterprise; este apartado es la referencia operativa del día a día.

### Flujo propuesto: manual → ADR → OpenSpec change

| #         | Etapa               | Quién / Cómo                                       | Artefactos                                                                                                                                       | OpenSpec involucrado         |
| --------- | ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1         | Discovery           | Manual (solo, modo stakeholder)                    | Feature Brief (problema, impacto, medida de éxito, baseline)                                                                                     | No                           |
| 2         | Elicitación         | Manual (solo, modo analista)                       | Notas por rol, hallazgos, reglas de negocio RN-xxx, conflictos resueltos, NFR derivados                                                          | No                           |
| 3         | Especificación      | Manual (solo, modo analista)                       | Reglas de negocio formales, historia de usuario BDD (GIVEN/WHEN/THEN), DoD, DoR, NFR, threat model, RTM seed                                     | No                           |
| 4         | Refinement          | Manual (solo, modo equipo)                         | Priorización, estimación, spikes, dependencias, baseline de requisitos                                                                           | No                           |
| 5         | Diseño técnico      | Manual (solo, modo tech lead)                      | **ADR** (decisión arquitectural), RFC si aplica, C4, diseño API, plan de migración expand/contract, rollback, perf/FinOps, threat model revisado | No (todavía)                 |
| → Handoff | Handoff             | Manual → OpenSpec (ADR + paquete de spec validada) | ADR en `openspec/adr/` + paquete de spec validada                                                                                                | Se crea el change            |
| 6a        | Creación del change | OpenSpec                                           | `/opsx:propose <change>` → `proposal.md` + delta specs + `design.md` (referencia el ADR) + `tasks.md`                                            | **Sí — aquí entra OpenSpec** |
| 6b        | Build               | OpenSpec                                           | `/opsx:apply` → código, tests, CI verde, code review                                                                                             | Sí                           |
| 7         | Entrega             | OpenSpec + manual                                  | `/opsx:verify` → `/opsx:archive`, RTM actualizada, deploy, monitoreo, DORA                                                                       | Sí (cierre)                  |

### Por qué funciona este orden

1. **El ADR existe antes del change** → `design.md` puede referenciarlo sin dependencia circular.
2. **La especificación (RN-xxx, BDD, NFR) ya está hecha a mano** → al crear el change con `/opsx:propose`, el proposal y los delta specs se llenan con contenido ya validado, no se inventa sobre la marcha.
3. **OpenSpec entra solo cuando hay certeza** → no se crean changes prematuros con scope ambiguo.
4. **El handoff es limpio:** el ADR (en `openspec/adr/`) + el paquete de spec validada (Feature Brief + RN-xxx + BDD + NFR + DoR) son el input de `/opsx:propose`.

### Qué queda manual vs. OpenSpec

| Manual (siempre)                                    | OpenSpec (desde la creación del change)                  |
| --------------------------------------------------- | -------------------------------------------------------- |
| Feature Brief, stakeholder register, baseline       | `proposal.md` (sintetiza el Brief + RN-xxx)              |
| Notas de elicitación, hallazgos, BPMN, domain model | Delta specs (traduce RN-xxx + BDD a formato OpenSpec)    |
| Reglas de negocio RN-xxx                            | `design.md` (referencia ADR, migra a formato del change) |
| Historia de usuario BDD + DoD                       | `tasks.md` (descompone en tasks atómicas)                |
| NFR, threat model, compliance matrix                | Validación (`openspec validate --strict`)                |
| Priorización, estimación, spikes                    | `/opsx:apply` (ejecuta tasks)                            |
| ADR, RFC, C4, API design, expand/contract, rollback | `/opsx:verify` + `/opsx:archive` (cierra y fusiona)      |

### La única fricción

Al crear el change, debes **traducir** los artefactos manuales (Feature Brief, RN-xxx, BDD) al formato OpenSpec (proposal, delta specs). No es duplicación si lo ves como "formalización": los artefactos manuales son el borrador; los artefactos OpenSpec son la versión versionada y verificable. El DoR (Etapa 4) debe incluir: "los artefactos manuales (Brief, RN-xxx, BDD, NFR, ADR) existen y están validados antes de crear el change".

### Resumen

1. **Manual:** Discovery → Elicitación → Especificación → Refinement → Diseño (ADR creado aquí).
2. **OpenSpec:** `/opsx:propose` (formaliza) → `/opsx:apply` (construye) → `/opsx:verify` → `/opsx:archive` (cierra).

OpenSpec no entra en Discovery ni Elicitación. Entra en la **creación del change**, después del ADR, y se encarga de la formalización, ejecución y cierre. Esto es coherente con el research: OpenSpec es una herramienta de _especificación y ejecución_ de cambios, no de investigación de producto.

### OpenSpec y Trello: cómo encajan en el flujo

#### OpenSpec: el motor de la especificación

OpenSpec (`openspec/`) es donde vive la **especificación formal** del sistema. Su rol en el flujo de requisitos es el de **artefacto de especificación (Etapa 3)** y **verificación (Etapa 6-7)**:

| Artefacto OpenSpec            | Etapa del flujo                              | Qué contiene                                                                                                          |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `proposal.md`                 | 3. Especificación (formalizada en el change) | Why, What Changes, Non-goals, Capabilities, Impact, Rollback, Stakeholders/validación                                 |
| `specs/<cap>/spec.md` (delta) | 3. Especificación (formalizada en el change) | ADDED/MODIFIED/REMOVED con escenarios GIVEN/WHEN/THEN; referencias a RN-xxx                                           |
| `design.md`                   | 5. Diseño (referencia el ADR)                | Contexto, decisiones (ADR/RFC), diseño API, migración expand/contract, plan rollback, NFR/perf, threat model revisado |
| `tasks.md`                    | 4. Refinement / 6. Build                     | Checklist `- [ ]` numerado, agrupado por sección, con verificación final                                              |

**Comandos del ciclo:**

- `/opsx:explore` → Discovery + Elicitación (Etapas 1-2).
- `/opsx:new` / `/opsx:propose` → Análisis y especificación (Etapa 3) + creación del change (Handoff).
- `/opsx:continue` → Refinement (tasks) y Diseño (design) (Etapas 4-5).
- `/opsx:apply` → Build y pruebas (Etapa 6).
- `/opsx:verify` → verificación contra spec (Etapas 6-7).
- `/opsx:archive` → cierre y fusión de deltas a specs base (Etapa 7).

#### Trello: el backlog y el pipeline de ejecución

Trello es donde vive el **backlog y el estado de ejecución** (Etapa 4 y 6). Su rol es complementario a OpenSpec: OpenSpec es la especificación técnica; Trello es la gestión del trabajo.

**Estándar de cards (ver `docs/ci-cd/trello-workflow-guide.md`):**

- Título: `[Area] Descripción corta`.
- Descripción con: Context, Scope, Acceptance Criteria (GIVEN/WHEN/THEN), Technical Approach, Dependencies, Size, Priority.
- Estados: Sprint Backlog → In Progress → In Review → Done.
- Labels y pipeline según criticidad.

**Relación 1:1:** cada change OpenSpec tiene al menos una card Trello (o un epic con cards por task-group). El main agent delega operaciones Trello a `@project-manager` (nunca llama Composio directo).

#### Mapa integrado: etapa → artefacto → dónde vive → herramienta

| Etapa del flujo   | Artefacto principal                                                      | Dónde vive                         | Herramienta                     |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------- | ------------------------------- |
| 1. Discovery      | Feature Brief                                                            | `/docs/features/` o Notion         | Manual / IA                     |
| 2. Elicitación    | Notas por rol, hallazgos                                                 | Issue/Trello o `/docs/research/`   | Trello / docs                   |
| 3. Especificación | Reglas de negocio RN-xxx, BDD, NFR, DoR                                  | `/docs/` o `/docs/rules/`          | Manual                          |
| 4. Refinement     | Historia estimada, DoR verificada, spikes                                | Trello card con AC + estimación    | Trello                          |
| 5. Diseño técnico | ADR, RFC, C4, API design, expand/contract, rollback                      | `openspec/adr/`, `/docs/`          | Manual                          |
| → Handoff         | ADR + paquete de spec validada                                           | Input de `/opsx:propose`           | OpenSpec (creación del change)  |
| 6. Build          | OpenSpec change (proposal + deltas + design + tasks) → código, tests, CI | `openspec/changes/<name>/`         | `/opsx:apply`                   |
| 7. Entrega        | Verify + archive + RTM + deploy + monitoreo                              | `openspec/` + `docs/traceability/` | `/opsx:verify`, `/opsx:archive` |

#### Reglas de oro de la integración

- **OpenSpec es la fuente de verdad técnica; Trello es la fuente de verdad de ejecución.** No duplicar especificación en Trello ni estado en OpenSpec.
- **Toda investigación se persiste** en `docs/research/` y se cita en el change.
- **Toda decisión arquitectural** se registra en `openspec/adr/` y se referencia en `design.md`.
- **Toda card Trello** referencia su change OpenSpec; todo change referencia su Feature Brief/PRD.
- **La RTM** es el pegamento: vincula requisito (Feature Brief) → change (OpenSpec) → spec (delta) → task → código → prueba → evidencia.

#### Ejemplo de flujo completo (solo, startup)

Feature: "Notificación por email cuando una OC es rechazada" (startup de 5 personas).

1. Día 1: escribes Feature Brief (problema: proveedores sin feedback; 3 rechazos/mes; objetivo: 100% notificados en < 1 min).
2. Día 2: lees como analista; escribes RN-NOTIF-001..003 y historia BDD (3 escenarios).
3. Día 3: escribes ADR (si hay decisión arquitectural); si no, saltas al handoff.
4. Día 3: `/opsx:propose add-po-rejection-notification` → proposal + delta spec + tasks. DoR verificada.
5. Día 3: creas card Trello `[Notifications] Notificación de rechazo de OC` con AC en BDD, tamaño S, prioridad Must Have.
6. Día 3-4: `/opsx:apply` implementa (TDD), CI verde, code review por `reviewer`.
7. Día 5: `/opsx:verify` → OK; `/opsx:archive`; actualiza RTM; cierra card Trello; deploy con flag.

### Artefactos necesarios para crear el change de OpenSpec

Para crear el change (`/opsx:propose <change-name>`), necesitas el **paquete de especificación validada** que se produce en las Etapas 1-5 (manuales). OpenSpec no descubre ni elicitá — consume lo que ya validaste.

#### Artefactos obligatorios (gate: DoR)

| #   | Artefacto                           | Etapa donde se produce            | Qué debe contener                                                                                                                                                                    |
| --- | ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Feature Brief**                   | 1. Discovery                      | Problema, impacto medido, resultado esperado, medida de éxito, stakeholders, baseline de métricas                                                                                    |
| 2   | **Reglas de negocio (RN-xxx)**      | 2-3. Elicitación / Especificación | Reglas formales y verificables, con condiciones explícitas                                                                                                                           |
| 3   | **Escenarios BDD (Gherkin)**        | 3. Especificación                 | Historia de usuario con criterios de aceptación GIVEN/WHEN/THEN (los que se traducen a delta specs)                                                                                  |
| 4   | **NFR (requisitos no funcionales)** | 3. Especificación                 | Seguridad, privacidad, a11y, i18n, performance, disponibilidad, auditabilidad — al menos los críticos                                                                                |
| 5   | **DoR verificada**                  | 4. Refinement                     | Checklist: problema y valor claros; AC verificables; dependencias identificadas; impacto en BD/API/seguridad/a11y/i18n evaluado; estimación acordada; DoD conocida; spikes resueltos |
| 6   | **ADR**                             | 5. Diseño técnico                 | Decisión arquitectural (contexto, opciones, decisión, consecuencias) en `openspec/adr/` — **debe existir antes del change**                                                          |
| 7   | **Sign-off de stakeholders**        | 3. Especificación                 | Validación con fecha de quién aprobó los requisitos                                                                                                                                  |

#### Artefactos condicionales (según criticidad/regulación)

| Artefacto                   | Cuándo se necesita                               |
| --------------------------- | ------------------------------------------------ |
| **Threat model (STRIDE)**   | Si toca auth, datos sensibles, API expuesta      |
| **PIA/DPIA**                | Si procesa datos personales (GDPR/leyes locales) |
| **Compliance matrix**       | Si hay regulación (DIAN, SOX, WCAG)              |
| **UAT plan**                | Si el cliente debe aceptar formalmente           |
| **BPMN as-is/to-be**        | Si el proceso de negocio es complejo             |
| **Domain model / glosario** | Si hay ambigüedad de términos                    |
| **Data dictionary**         | Si hay campos con dominios complejos             |
| **RFC**                     | Si la decisión afecta a varios equipos/módulos   |
| **C4 diagramas**            | Si hay múltiples equipos o módulos               |

#### Qué genera OpenSpec a partir de estos (el handoff)

```bash
/opsx:propose <change-name>
```

| Artefacto OpenSpec            | Se llena con...                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proposal.md`                 | Feature Brief (Why) + RN-xxx (What Changes) + Non-goals + Impact (riesgo, dependencias, rollback) + Stakeholders/validación con fecha de sign-off |
| `specs/<cap>/spec.md` (delta) | Escenarios BDD traducidos a ADDED/MODIFIED/REMOVED con referencias a RN-xxx                                                                       |
| `design.md`                   | Referencia el ADR (ya existente) + diseño de API, migración expand/contract, plan de rollback, NFR/perf, threat model revisado                    |
| `tasks.md`                    | Descompone la implementación en tasks atómicas (≤ 2h) con sección de verificación final                                                           |

#### Regla de oro

> **Un change = una capacidad de usuario verificable.** Si no se puede escribir un escenario GIVEN/WHEN/THEN que demuestre valor al usuario, no es un change válido (es una tarea técnica o un ADR). Máximo 5 días-persona por change; si excede, descomponer.

#### Resumen mínimo (Nivel 1 — startup/solo dev)

Para un cambio de bajo riesgo, lo mínimo es:

1. Feature Brief (1 página, con Non-goals)
2. Reglas de negocio (RN-xxx)
3. Historia BDD con 3-5 escenarios
4. NFR críticos (seguridad básica, performance)
5. DoR verificada (mental o checklist corto)
6. ADR (solo si hay decisión arquitectural no obvia)

Con eso ya puedes hacer `/opsx:propose <change-name>` y OpenSpec formaliza el resto.

### Cuándo crear el ticket en Trello

El ticket (card) en Trello se crea en **dos momentos distintos**, según el nivel de detalle:

#### 1. Epic / Feature (Etapa 1 — Discovery)

Cuando se escribe el **Feature Brief**, se crea un **Epic** en Trello (o una card de alto nivel) que representa la feature completa. En este punto solo tiene: título, problema, impacto y medida de éxito. No tiene criterios de aceptación todavía.

- **Quién:** PO / stakeholder (o el dev en modo stakeholder).
- **Estado:** Backlog / Sprint Backlog (sin asignar).
- **Contenido mínimo:** título `[Area] Nombre de la feature`, descripción con el problema y el impacto, label de prioridad.

#### 2. Card de historia (Etapa 3 — Especificación, al terminar)

Cuando la historia de usuario está escrita con criterios de aceptación BDD (GIVEN/WHEN/THEN), NFR y DoR, se crea la **card de historia** en Trello. En este punto ya tiene todo lo necesario para que alguien (o tú mismo) la pueda implementar.

- **Quién:** desarrollador / analista (o el dev en modo analista).
- **Estado:** Sprint Backlog (lista para refinement).
- **Contenido completo (según `docs/ci-cd/trello-workflow-guide.md`):**
  - Título: `[Area] Descripción corta`
  - Context, Scope, Acceptance Criteria (GIVEN/WHEN/THEN), Technical Approach, Dependencies, Size, Priority
  - Labels según criticidad

#### 3. Refinement (Etapa 4)

La card ya existe. En refinement se:

- Estima (story points, Fibonacci).
- Verifica la DoR (checklist completo).
- Prioriza (MoSCoW/RICE/WSJF).
- Identifica dependencias y spikes.
- Se mueve a "Sprint Backlog" si pasa el DoR.

#### 4. Build (Etapa 6)

La card se mueve a **"In Progress"** cuando se ejecuta `/opsx:apply`. Al mergear el PR, se mueve a **"In Review"** y luego a **"Done"**.

#### Mapa integrado: etapa → ticket Trello

| Etapa             | Acción en Trello                              | Qué se crea/actualiza                                 |
| ----------------- | --------------------------------------------- | ----------------------------------------------------- |
| 1. Discovery      | Crear **Epic** (feature de alto nivel)        | Título, problema, impacto, medida de éxito            |
| 2. Elicitación    | Actualizar Epic con hallazgos                 | Notas de entrevista, conflictos, requisitos derivados |
| 3. Especificación | Crear **card de historia** por cada capacidad | AC en BDD, NFR, DoR, dependencias, tamaño             |
| 4. Refinement     | Estimar, priorizar, verificar DoR             | Story points, prioridad, DoR checklist, spikes        |
| 5. Diseño técnico | Actualizar card con diseño                    | ADR/RFC referencia, plan de migración, rollback       |
| → Handoff         | Referenciar change OpenSpec en la card        | `OpenSpec: openspec/changes/<name>/`                  |
| 6. Build          | Mover a "In Progress" → "In Review" → "Done"  | PR link, CI verde, code review                        |
| 7. Entrega        | Cerrar card, actualizar métricas              | Deploy, DORA, retrospectiva                           |

#### Regla de oro para el solo dev

> **No crees la card hasta que tengas la historia con AC verificables.** Una card sin criterios de aceptación es solo un recordatorio, no un requisito. Si no puedes escribir GIVEN/WHEN/THEN, el requisito no está listo para entrar al backlog.

#### Resumen

- **Epic:** Etapa 1 (Discovery) — representa la feature completa.
- **Card de historia:** Etapa 3 (Especificación) — cuando hay AC en BDD, NFR y DoR.
- **Refinement de la card:** Etapa 4 — estimación, priorización, DoR.
- **Ejecución:** Etapa 6 (Build) — mover a In Progress/In Review/Done.
- **Cierre:** Etapa 7 (Entrega) — actualizar métricas y cerrar.

#### Referencias del framework operativo

- Contexto de la aplicación: `docs/application-context.md`
- Workflow y estándar de cards Trello: `docs/ci-cd/trello-workflow-guide.md`
- Plantilla ADR: `openspec/adr/TEMPLATE.md`
- OpenSpec config: `openspec/config.yaml`

---

## Revisión total: cumplimiento por etapa

Auditoría stage-by-stage realizada sobre el documento (2026-11-23). Cada etapa se comparó con IEEE/ISO/IEC 29148 [1][59], SWEBOK v4 [2], BABOK [19], IREB CPRE [20] e INCOSE [60][68]. Resultado: todas las etapas tienen inputs, actividades, outputs, roles, gates y artefactos alineados tras los ajustes aplicados (factibilidad/alcance en Discovery; JAD/storyboarding/interface analysis en Elicitación; inspection/walkthrough, restricciones/supuestos, DFD/ERD en Especificación; story splitting y priorización por riesgo en Refinement; diseño por atributos de calidad, ATAM, PoC, design review en Diseño; estrategia de pruebas, mutation testing, DAST/IAST, performance testing en Build; release plan, hypercare, post-release verification, rollback drill en Entrega). Se añadieron 18 artefactos al catálogo (56→72) y 12 fuentes nuevas [59]–[70]. Debilidades residuales (no bloqueantes): RTM no materializada, DoR no verificada y NFR no obligatorios en OpenSpec son acciones de adopción, no del documento.

---

## Fuentes

[1] IEEE/ISO/IEC 29148-2018 — Systems and software engineering — Life cycle processes — Requirements engineering. IEEE Standards Association. https://standards.ieee.org/ieee/29148/6937/

[2] Guide to the Software Engineering Body of Knowledge (SWEBOK Guide) v4. IEEE Computer Society. https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf

[3] Continuous Discovery (tema). Interaction Design Foundation (IxDF), basado en Torres, T. (2021) Continuous Discovery Habits. https://ixdf.org/literature/topics/continuous-discovery

[4] Product prioritization frameworks compared: MoSCoW, RICE, Kano, WSJF. Product Map Blog. https://www.productmap.io/blog/product-prioritization-frameworks

[5] Engineering Planning with RFCs, Design Documents and ADRs. The Pragmatic Engineer. https://newsletter.pragmaticengineer.com/p/rfcs-and-design-docs

[6] Design docs, ADRs and C4 diagrams for AI coding agents. AR Labs Engineering. https://arlabs.tech/engineering/architecture-documentation-c4

[7] DORA — Capabilities: Continuous delivery. https://dora.dev/capabilities/continuous-delivery/

[8] DORA — Capabilities: Trunk-based development. https://dora.dev/capabilities/trunk-based-development/

[9] Google SRE Workbook — Canarying Releases. https://sre.google/workbook/canarying-releases

[10] Google SRE Book — Postmortem Culture: Learning from Failure. https://sre.google/sre-book/postmortem-culture

[11] OWASP Cheat Sheet Series — Threat Modeling. https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html

[12] Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation. https://www.w3.org/TR/WCAG22

[13] Using the expand and contract pattern for schema changes. Prisma Data Guide. https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern

[14] Best practices for deprecating APIs. Swagger. https://swagger.io/blog/best-practices-for-deprecating-apis

[15] What is requirements traceability? PTC. https://www.ptc.com/en/blogs/alm/requirements-traceability

[16] FinOps Framework — Engineering persona. FinOps Foundation. https://www.finops.org/framework/persona/engineering

[17] Chaos engineering / resilience testing. Harness University. https://developer.harness.io/university/more-products/chaos-engineering

[18] How to run a blameless postmortem. Atlassian. https://www.atlassian.com/incident-management/postmortem/blameless

[19] Tasks Mapped to Artifacts (BABOK output sections). ModernAnalyst. https://modernanalyst.com/Resources/Articles/tabid/115/ID/5769/Tasks-Mapped-To-Artifacts.aspx

[20] CPRE Foundation Level Syllabus (IREB). https://cpre.ireb.org/en ; IREB CPRE Elicitation Handbook. https://gasq.org/files/content/gasq/downloads/certification/IREB/IREB%20AL/advanced_level_elicitation_handbook_en_v2.2.0.pdf

[21] Ubiquitous Language (glossary). Agile Alliance. https://agilealliance.org/glossary/ubiquitous-language/ ; Event Storming. Wikipedia. https://en.wikipedia.org/wiki/Event_storming

[22] What is a Data Dictionary? DataVersity. https://www.dataversity.net/data-concepts/what-is-a-data-dictionary/ ; Conceptual Data Modeling starts with business use cases. EWSolutions. https://ewsolutions.com/conceptual-data-modeling-starts-with-business-use-cases

[23] Use Case Specification Outline. IBM Engineering Requirements Management DOORS Next. https://www.ibm.com/docs/en/engineering-lifecycle-management-suite/doors-next/7.0.3?topic=cases-use-case-specification-outline ; What is Use Case Specification? Visual Paradigm. https://www.visual-paradigm.com/guide/use-case/what-is-use-case-specification/

[24] Decision table (glossary). IREB CPRE. https://cpre.ireb.org/en/downloads-and-resources/glossary ; A Finite State Machine Model for Requirements Engineering. IREB Requirements Engineering Magazine. https://re-magazine.ireb.org/articles/a-finite-state-machine-model

[25] What Are Requirement Attributes? microTOOL. https://microtool.de/en/knowledge-base/what-are-requirement-attributes/ ; Requirement Attributes – Part 2. ArgonDigital. https://argondigital.com/blog/product-management/requirement-attributes-part-2/

[26] Requirements Verification and Validation. The Requirements Engineer. https://the-requirements-engineer.com/validation/requirements-verification-and-validation ; Requirements Verification and Validation for Product Teams. Jama Software. https://jamasoftware.com/requirements-management-guide/requirements-validation-and-verification/requirements-verification-and-validation-for-product-teams

[27] What is the Difference Between the Definition of Done (DoD) and the Definition of Ready (DoR)? Scrum.org. https://www.scrum.org/resources/blog/what-difference-between-definition-done-dod-and-definition-ready-dor ; Definition of Ready. Atlassian. https://www.atlassian.com/agile/project-management/definition-of-ready

[28] The Complete Guide to User Acceptance Testing (UAT). TestRail. https://www.testrail.com/blog/user-acceptance-testing/ ; User Acceptance Testing (UAT): Process, Template & Checklist. Reliasoftware. https://reliasoftware.com/blog/user-acceptance-testing

[29] How do we do a DPIA? ICO (UK GDPR). https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/how-do-we-do-a-dpia/ ; Data Protection Impact Assessment (Article 35). TrustArc. https://trustarc.com/resource/data-protection-impact-assessment-article35/

[30] Baselining vs Versioning in Requirements Management. Modern Requirements. https://modernrequirements.com/blogs/baselining-vs-versioning ; How to track changes to requirements: versions and history. Specroot. https://specroot.io/notes/requirements-change-history

[31] What Is a Risk Register? Smartsheet. https://www.smartsheet.com/content/project-risk-register ; Assumption Log vs Risk Register. ONES. https://ones.com/blog/assumption-log-vs-risk-register-key-differences-explained

[32] An Approach for Managing Large-Sized Software Requirements During Prioritization (AHP). IEEE Xplore. https://ieeexplore.ieee.org/document/8632806 ; Prioritization: 100 Dollar Method and Scale. DEV Community. https://dev.to/devlix-blog/prioritization-100-dollar-method-and-scale-1mp

[33] ISO/IEC 25010:2023 — Systems and Software Quality Models. ISO. https://www.iso.org/standard/78176.html

[34] Architecture Tradeoff Analysis Method (ATAM) Collection. Carnegie Mellon SEI. https://sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection

[35] Interface Control Document. Wikipedia. https://en.wikipedia.org/wiki/Interface_control_document

[36] ISO/IEC/IEEE 29148:2018 Explained: document family (BRS, StRS, SyRS, SRS, OpsCon). Modern Requirements. https://www.modernrequirements.com/blogs/iso-29148-explained/

### Fuentes nuevas del framework operativo ([37]–[58])

[37] OpenSpec — sitio oficial. https://openspec.dev
[38] Fission-AI/OpenSpec — concepts.md (brownfield-first, delta specs, archive). https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md
[39] Addy Osmani — "How to write a good spec for AI agents". https://addyosmani.com/blog/good-spec
[40] GitHub Blog — "Spec-driven development with AI: Get started with a new open source toolkit". https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit
[41] Shiplight AI — "What Is Spec-Driven Development? 2026 Guide". https://www.shiplight.ai/blog/what-is-spec-driven-development
[42] Augment Code — "What Is Spec-Driven Development? A Complete Guide". https://www.augmentcode.com/guides/what-is-spec-driven-development
[43] arXiv — "Spec-Driven Development as Prescribed and as Practiced" (2608.25202v4). https://arxiv.org/html/2608.25202v4
[44] aridanemartin.dev — "PRD vs ADR vs RFC: The Documents Every Engineer Should Know". https://aridanemartin.dev/blog/prd-adr-rfc-decision-documents
[45] Candost — "ADRs and RFCs: Their Differences and Templates". https://candost.blog/adrs-rfcs-differences-when-which
[46] Volere Requirements Specification Template. https://www.volere.org/templates/volere-requirements-specification-template
[47] ModernAnalyst — "An Introduction to Requirements Traceability". https://modernanalyst.com/Resources/Articles/tabid/115/ID/1722/An-Introduction-to-Requirements-Traceability.aspx
[48] PTC — "What is requirements traceability". https://www.ptc.com/en/blogs/alm/requirements-traceability
[49] Basecamp — "Shape Up: Stop Running in Circles and Ship Work that Matters". https://basecamp.com/shapeup
[50] JustSteveKing — "Shape Up: A Practical Introduction". https://www.juststeveking.com/articles/shape-up
[51] Levelop — "Spec Kit vs Kiro vs OpenSpec: SDD Tools". https://levelop.dev/blog/spec-driven-development-tools-compared
[52] Ssojet — "7 Spec-Driven Development Tools: Spec Kit, Kiro, OpenSpec, Tessl". https://ssojet.com/blog/best-spec-driven-development-tools
[53] Augment Code — "How to Write Living Specs for AI Agent Development". https://www.augmentcode.com/guides/living-specs-for-ai-agent-development
[54] ASDLC — "The Spec: Living Specifications for Agentic Development". https://asdlc.io/patterns/the-spec
[55] Martin Fowler — "Structured-Prompt-Driven Development (SPDD)". https://martinfowler.com/articles/structured-prompt-driven
[56] IREB CPRE — "Requirements Management". https://cpre.ireb.org/en/concept/requirements-management
[57] SodiusWillert — "Requirements Traceability: A Practical Implementation Guide". https://www.sodiuswillert.com/en/blog/implementing-requirements-traceability-in-systems-software-engineering
[58] Flagsmith — "Spec-Driven Development: A Practical Guide for Teams". https://www.flagsmith.com/blog/spec-driven-development

### Fuentes nuevas de la revisión total ([59]–[70])

[59] ISO/IEC/IEEE 29148:2018 — Systems and software engineering — Life cycle processes — Requirements engineering (ISO). https://www.iso.org/standard/72089.html

[60] INCOSE Guide to Writing Requirements (Visure summary) — quality criteria and V&V. https://visuresolutions.com/alm-guide/incose-guide-to-writing-requirements

[61] SodiusWillert — Best practices for reviewing requirements in complex engineering environments. https://www.sodiuswillert.com/en/blog/best-practices-for-reviewing-requirements-in-complex-engineering-environments

[62] Richard Lawrence — The Humanizing Work Guide to Splitting User Stories. https://richardlawrence.info/splitting-user-stories

[63] LaunchDarkly — Release Management: A Guide on Best Practices & Processes. https://launchdarkly.com/blog/release-management-guide

[64] Martin Fowler — The Practical Test Pyramid. https://martinfowler.com/articles/practical-test-pyramid.html

[65] Atlassian — Project Charter: Definition, Examples & Template. https://www.atlassian.com/work-management/project-management/project-planning/project-charter

[66] StartupMethods — Feature Flags & Progressive Delivery. https://startupmethods.com/chapter/feature-flags-progressive-delivery

[67] ModernAnalyst — Describe the Elicitation knowledge area of the BABOK and its key tasks. https://www.modernanalyst.com/Careers/InterviewQuestions/tabid/128/ID/1256/Describe-the-Elicitation-knowledge-area-of-the-BABOK-and-its-key-tasks-BABOK-v20.aspx

[68] INCOSE Guide to Writing Requirements v4 — Summary Sheet (quality criteria). https://incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf

[69] ShiftAsia — 8 items that make up a non-functional requirement under ISO 25010. https://shiftasia.com/community/8-items-nonfunctional-requirement-under-iso-25010/

[70] LaunchDarkly — Release Management Best Practices with Feature Flags. https://launchdarkly.com/blog/release-management-flags-best-practices
