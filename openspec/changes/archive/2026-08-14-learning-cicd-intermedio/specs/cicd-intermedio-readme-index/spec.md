## Purpose

Define el contrato de contenido y estructura del archivo `intermedio-README.md` índice del nivel Intermedio de la ruta de aprendizaje de CI/CD, que funciona como punto de entrada al nivel, mapa de navegación de las guías 05-10, declaración de prerequisitos y objetivos, y puente entre el nivel Fundamentos y el nivel Avanzado.

## ADDED Requirements

### Requirement: README como índice del nivel Intermedio

El archivo `docs/learning/ci-cd/intermedio-README.md` SHALL ser el índice del nivel Intermedio, listando las 6 guías (05-10) con una descripción breve de cada una y su orden de lectura recomendado.

#### Scenario: Lista todas las guías del nivel

- **WHEN** se lee el intermedio-README.md
- **THEN** lista las 6 guías (05 a 10) con descripción breve y orden de lectura

#### Scenario: Indica el nivel actual en el roadmap

- **WHEN** se identifica la posición del lector en el roadmap
- **THEN** queda claro que este README corresponde al nivel Intermedio, segundo de los 4 (Fundamentos → Intermedio → Avanzado → Profesional)

#### Scenario: El índice es un archivo separado

- **WHEN** se inspecciona `docs/learning/ci-cd/`
- **THEN** el índice del nivel Intermedio es un archivo propio (`intermedio-README.md`), separado del README del nivel Fundamentos, para mantener una estructura modular limpia

### Requirement: Prerequisitos y objetivos declarados

El intermedio-README.md SHALL declarar los prerequisitos del nivel (haber completado las guías 00-04 de Fundamentos) y los objetivos de aprendizaje globales del nivel (poder leer y modificar cualquiera de los workflows del proyecto y los hooks de Husky).

#### Scenario: Declara haber completado Fundamentos

- **WHEN** se lee la sección de prerequisitos
- **THEN** indica que el lector debe haber completado las guías 00-04 del nivel Fundamentos y conocer los conceptos básicos de CI/CD, GitHub Actions, secrets/variables, YAML y Docker

#### Scenario: Declara objetivos de aprendizaje

- **WHEN** se lee la sección de objetivos
- **THEN** enumera qué sabrá hacer el lector al terminar el nivel (p. ej. leer y modificar cualquier workflow del proyecto, entender los hooks de Husky, explicar el pipeline de testing en CI)

#### Scenario: Describe el perfil del lector

- **WHEN** se lee la sección de prerequisitos
- **THEN** describe el perfil del lector objetivo (desarrollador Junior 0-2 años que completó el nivel Fundamentos)

### Requirement: Navegación y enlaces cruzados

El intermedio-README.md SHALL enlazar a las guías del nivel (05-10), al README del nivel Fundamentos, a los documentos de referencia existentes en `docs/` y al nivel futuro Avanzado, indicando que se crea en un cambio OpenSpec posterior.

#### Scenario: Enlaza a las 6 guías

- **WHEN** se navega desde el intermedio-README.md
- **THEN** cada guía del nivel es alcanzable mediante un enlace relativo válido

#### Scenario: Enlaza de vuelta a Fundamentos

- **WHEN** se lee la sección de navegación
- **THEN** existe un enlace al README del nivel Fundamentos (guías 00-04) para que el lector pueda repasar conceptos previos

#### Scenario: Enlaza a documentación de referencia

- **WHEN** el README menciona documentación existente (cicd-estado-actual, workflows-mantenimiento-guia, testing-architecture, code-style)
- **THEN** enlaza a esos documentos en `docs/` en lugar de duplicar su contenido

#### Scenario: Enlaza al nivel futuro

- **WHEN** se lee la sección de roadmap
- **THEN** el nivel Avanzado tiene una referencia explícita al futuro cambio OpenSpec (learning-cicd-avanzado)
