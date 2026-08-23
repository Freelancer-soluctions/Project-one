## Purpose

Define el contrato de contenido y estructura del archivo `README.md` índice del nivel Fundamentos de la ruta de aprendizaje de CI/CD, que funciona como punto de entrada, mapa de navegación y declaración de prerequisitos y objetivos de la ruta completa.

## ADDED Requirements

### Requirement: README como índice del nivel

El archivo `docs/learning/ci-cd/README.md` SHALL ser el índice del nivel Fundamentos, listando las 6 piezas (README + 5 guías) con una descripción breve de cada una y su orden de lectura recomendado.

#### Scenario: Lista todas las piezas del nivel

- **WHEN** se lee el README del nivel Fundamentos
- **THEN** lista el README y las 5 guías (00 a 04) con descripción breve y orden de lectura

#### Scenario: Presenta el roadmap de 4 niveles

- **WHEN** se lee la sección de roadmap del README
- **THEN** muestra los 4 niveles (Fundamentos, Intermedio, Avanzado, Profesional) con su propósito y el estado de cada uno (completado/en progreso/planificado)

#### Scenario: Indica el nivel actual

- **WHEN** se identifica la posición del lector en el roadmap
- **THEN** queda claro que este README corresponde al nivel Fundamentos, primero de los 4

### Requirement: Prerequisitos y objetivos declarados

El README SHALL declarar los prerequisitos del nivel (perfil del lector: Junior 0-2 años, JS básico, sin conocimiento de YAML/GitHub Actions/Docker/CI-CD) y los objetivos de aprendizaje globales del nivel.

#### Scenario: Declara el perfil del lector objetivo

- **WHEN** se lee la sección de prerequisitos
- **THEN** describe el perfil del lector objetivo (desarrollador Junior con 0-2 años, JS básico) y aclara que no se asume conocimiento de YAML, GitHub Actions, Docker ni CI/CD

#### Scenario: Declara objetivos de aprendizaje

- **WHEN** se lee la sección de objetivos
- **THEN** enumera qué sabrá hacer el lector al terminar el nivel (p. ej. leer y modificar un workflow, distinguir CI de CD, entender secrets y variables)

### Requirement: Navegación y enlaces cruzados

El README SHALL enlazar a las guías del nivel, a los documentos de referencia existentes en `docs/` y a los niveles futuros de la ruta (intermedio, avanzado, profesional), enlazando a los directorios de los cambios OpenSpec adyacentes ya existentes (`openspec/changes/learning-cicd-intermedio/`, `openspec/changes/learning-cicd-avanzado/`, `openspec/changes/learning-cicd-profesional/`) y/o usando referencias por nombre como fallback.

#### Scenario: Enlaza a las 5 guías

- **WHEN** se navega desde el README
- **THEN** cada guía del nivel es alcanzable mediante un enlace relativo válido

#### Scenario: Enlaza a documentación de referencia

- **WHEN** el README menciona documentación existente (cicd-estado-actual, cicd-plan-implementacion, workflows-mantenimiento-guia, AWS/Floci)
- **THEN** enlaza a esos documentos en `docs/` en lugar de duplicar su contenido

#### Scenario: Enlaza a los niveles futuros

- **WHEN** se lee la sección de roadmap
- **THEN** los niveles Intermedio, Avanzado y Profesional tienen enlaces a los directorios de sus cambios OpenSpec adyacentes (`openspec/changes/learning-cicd-intermedio/`, `openspec/changes/learning-cicd-avanzado/`, `openspec/changes/learning-cicd-profesional/`) y/o referencias por nombre como fallback
