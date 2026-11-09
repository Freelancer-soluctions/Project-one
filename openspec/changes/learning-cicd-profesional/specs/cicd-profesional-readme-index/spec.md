## Purpose

Define el contrato de contenido y estructura del archivo `profesional-README.md` índice del nivel Profesional de la ruta de aprendizaje de CI/CD, que funciona como punto de entrada al nivel final, mapa de navegación de las guías del nivel (plan original 18-23; entrega actual: guía 23), y ceremonia de graduación que conecta los 4 niveles en una ruta de maestría CI/CD.

## ADDED Requirements

### Requirement: README como índice del nivel Profesional

El archivo `docs/learning/ci-cd/profesional-README.md` SHALL ser el índice del nivel Profesional, listando las piezas del nivel con una descripción breve de cada una, su orden de lectura recomendado y el estado de entrega de cada una.

#### Scenario: Lista las piezas del nivel con su estado

- **WHEN** se lee el README del nivel Profesional
- **THEN** lista las guías con descripción breve y orden de lectura, e indica cuáles están publicadas (18-24, con la 23 del bloque enterprise/DAG) y cuáles son plan pendiente ya numerado (25-29)

#### Scenario: Los enlaces apuntan a archivos existentes

- **WHEN** el README enlaza una guía
- **THEN** el enlace resuelve a un archivo existente; las guías no escritas se mencionan como texto sin enlace roto

#### Scenario: Indica el nivel actual en el roadmap

- **WHEN** se identifica la posición del lector en la ruta
- **THEN** queda claro que este README corresponde al nivel Profesional, cuarto y último de los 4 niveles

### Requirement: Prerequisitos y objetivos declarados

El README SHALL declarar los prerequisitos del nivel (haber completado los niveles Fundamentos, Intermedio y Avanzado) y los objetivos de aprendizaje globales del nivel.

#### Scenario: Declara los prerequisitos

- **WHEN** se lee la sección de prerequisitos
- **THEN** describe que el lector debe haber completado los niveles Fundamentos (00-04), Intermedio (05-10) y Avanzado (11-17), y que se asume que ya conoce CI/CD, los workflows del proyecto, Husky, composite actions, caching, AWS CD con Floci/ECS/OIDC y Changesets

#### Scenario: Declara objetivos de aprendizaje

- **WHEN** se lee la sección de objetivos
- **THEN** enumera qué sabrá hacer el lector al terminar el nivel (p. ej. explicar la familia SAST/SCA/SBOM, operar la seguridad por cron, gestionar Dependabot, mantener workflows, interpretar métricas DORA y SLSA, evaluar patrones enterprise)

### Requirement: Navegación y enlaces cruzados

El README SHALL enlazar a las guías del nivel, a los documentos de referencia existentes en `docs/` y de vuelta al nivel Avanzado de la ruta.

#### Scenario: Enlaza a las 6 guías

- **WHEN** se navega desde el README
- **THEN** cada guía del nivel es alcanzable mediante un enlace relativo válido

#### Scenario: Enlaza a documentación de referencia

- **WHEN** el README menciona documentación existente (`docs/learning/ci-cd/workflows-mantenimiento-guia.md`, `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/security/security-enterprise-guide.md`, AWS)
- **THEN** enlaza a esos documentos en `docs/` en lugar de duplicar su contenido, y no referencia `docs/cicd-estado-actual.md` ni `docs/cicd-plan-implementacion.md` (no existen)

#### Scenario: Enlaza de vuelta al nivel Avanzado

- **WHEN** se lee la sección de navegación
- **THEN** hay un enlace al nivel Avanzado (guías 11-17 / `avanzado-README.md`) para el lector que aún no completó el nivel anterior

### Requirement: Wrap-up de la ruta de 4 niveles

El README SHALL incluir una sección final de wrap-up/graduación que conecte los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional) en una ruta de maestría CI/CD coherente, con el recorrido completo y los siguientes pasos para el lector graduado.

#### Scenario: Presenta la ruta completa de 4 niveles

- **WHEN** se lee la sección de wrap-up
- **THEN** presenta los 4 niveles con su propósito y lo que el lector logró en cada uno, formando un camino continuo de Junior a Staff

#### Scenario: Ofrece siguientes pasos al graduado

- **WHEN** termina la sección de wrap-up
- **THEN** sugiere siguientes pasos para el lector graduado (p. ej. contribuir a los workflows del proyecto, implementar mejoras de seguridad, proponer cambios OpenSpec de CI/CD) y enlaces a la documentación técnica profunda
