## Purpose

Define el contrato de contenido y estructura del archivo `avanzado-README.md` indice del nivel Avanzado de la ruta de aprendizaje de CI/CD, que funciona como punto de entrada al nivel, mapa de navegacion de las 7 guias (11-17) y declaracion de prerequisitos y objetivos de aprendizaje.

## ADDED Requirements

### Requirement: README como indice del nivel Avanzado

El archivo `docs/learning/ci-cd/avanzado-README.md` SHALL ser el indice del nivel Avanzado, listando las 7 guias (11 a 17) con una descripcion breve de cada una y su orden de lectura recomendado.

#### Scenario: Lista todas las guias del nivel

- **WHEN** se abre el archivo `avanzado-README.md`
- **THEN** lista las 7 guias (11 a 17) con descripcion breve y orden de lectura recomendado

#### Scenario: Indica el nivel actual en la ruta

- **WHEN** se identifica la posicion del lector en la ruta de aprendizaje
- **THEN** queda claro que este README corresponde al nivel Avanzado, tercero de los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional)

### Requirement: Prerequisitos y objetivos declarados

El README SHALL declarar los prerequisitos del nivel (haber completado los niveles Fundamentos e Intermedio) y los objetivos de aprendizaje globales del nivel Avanzado.

#### Scenario: Declara los prerequisitos

- **WHEN** se lee la seccion de prerequisitos
- **THEN** indica explicitamente que el lector debe haber completado los niveles Fundamentos (00-04) e Intermedio (05-10)

#### Scenario: Declara los objetivos de aprendizaje del nivel

- **WHEN** se lee la seccion de objetivos
- **THEN** enumera que sabra hacer el lector al terminar el nivel Avanzado (p. ej. explicar el despliegue CD completo del proyecto, operar Floci como emulador AWS, entender OIDC y el circuit breaker de ECS)

### Requirement: Navegacion y enlaces cruzados

El README SHALL enlazar a las guias del nivel, a los documentos de referencia AWS en `docs/` y a los niveles adyacentes de la ruta (Intermedio previo y Profesional siguiente), indicando que los niveles futuros se crean en cambios OpenSpec posteriores.

#### Scenario: Enlaza a las 7 guias

- **WHEN** se navega desde el README Avanzado
- **THEN** cada guia del nivel (11 a 17) es alcanzable mediante un enlace relativo valido

#### Scenario: Enlaza a la documentacion de referencia AWS

- **WHEN** el README menciona documentacion existente (aws-deploy-architecture, aws-cd-learning-path, aws-dev-local-floci, aws-learning-with-floci)
- **THEN** enlaza a esos documentos en `docs/` en lugar de duplicar su contenido

#### Scenario: Enlaza a los niveles adyacentes

- **WHEN** se lee la seccion de navegacion del README
- **THEN** contiene enlace de vuelta al nivel Intermedio (guia 10 y README de Intermedio) y referencia al nivel Profesional (cambio OpenSpec futuro learning-cicd-profesional)

### Requirement: Archivo separado por estructura modular

El README del nivel Avanzado SHALL ser un archivo separado (`avanzado-README.md`), siguiendo la estructura modular de un README por nivel, sin reemplazar ni fusionarse con el README de Fundamentos.

#### Scenario: Es un archivo independiente

- **WHEN** se inspecciona el directorio `docs/learning/ci-cd/`
- **THEN** existe el archivo `avanzado-README.md` como indice propio del nivel Avanzado, separado de `README.md` (Fundamentos) e `intermedio-README.md` (Intermedio)
