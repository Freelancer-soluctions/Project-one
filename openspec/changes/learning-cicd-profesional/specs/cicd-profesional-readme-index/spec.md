## Purpose

Define el contrato de contenido y estructura del archivo `profesional-README.md` índice del nivel Profesional de la ruta de aprendizaje de CI/CD, que funciona como punto de entrada al nivel final, mapa de navegación de las guías 18-23, y ceremonia de graduación que conecta los 4 niveles en una ruta de maestría CI/CD.

## ADDED Requirements

### Requirement: README como índice del nivel Profesional

El archivo `docs/learning/ci-cd/profesional-README.md` SHALL ser el índice del nivel Profesional, listando las 7 piezas (README + 6 guías) con una descripción breve de cada una y su orden de lectura recomendado.

#### Scenario: Lista todas las piezas del nivel

- **WHEN** se lee el README del nivel Profesional
- **THEN** lista el README y las 6 guías (18 a 23) con descripción breve y orden de lectura

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

- **WHEN** el README menciona documentación existente (workflows-mantenimiento-guia, cicd-estado-actual, cicd-plan-implementacion, security-enterprise-guide, AWS)
- **THEN** enlaza a esos documentos en `docs/` en lugar de duplicar su contenido

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
