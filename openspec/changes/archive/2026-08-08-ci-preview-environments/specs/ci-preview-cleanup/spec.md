## Purpose

Garantiza que la validación de preview por PR no deje recursos: el stack AWS emulado es efímero en CI (muere con el runner) y Vercel elimina el preview del client al mergear — sin recursos cloud que limpiar.

## ADDED Requirements

### Requirement: Validación efímera por PR sin recursos persistentes

La validación del backend contra el stack AWS emulado SHALL ser efímera: vive solo durante la ejecución del job de CI y no deja ningún recurso persistente al terminar.

#### Scenario: El runner termina y limpia el stack

- **WHEN** el job de preview del PR termina (con éxito o con fallo)
- **THEN** los service containers de Floci y PostgreSQL mueren junto con el runner de CI
- **AND** no queda ningún contenedor, volumen o recurso cloud asociado al PR

#### Scenario: Sin hosting cloud que desprovisionar

- **WHEN** el PR se cierra o se mergea
- **THEN** no existe un preview de la API alojado en la nube que deba destruirse
- **AND** la validación del backend ya terminó con el runner de CI

### Requirement: No hay fugas de datos entre PRs

La PostgreSQL efímera del stack emulado SHALL descartar sus datos al terminar, sin volúmenes persistentes compartidos entre PRs.

#### Scenario: Datos descartados al terminar

- **WHEN** el stack emulado del PR se detiene
- **THEN** los datos de la PostgreSQL efímera se descartan
- **AND** ningún dato del PR puede contaminar la validación de otro PR

### Requirement: Ciclo de vida del preview de Vercel

Vercel SHALL eliminar automáticamente el preview deployment del client cuando el PR se mergea, sin lógica de cleanup custom en el workflow.

#### Scenario: PR mergeado elimina el preview del client

- **WHEN** un pull request se mergea en `main`
- **THEN** Vercel elimina automáticamente el preview deployment de ese PR
- **AND** la URL del preview deja de resolverse

#### Scenario: Previews documentados como efímeros

- **WHEN** un preview se elimina
- **THEN** la documentación explica que los previews son efímeros y se eliminan al mergear o cerrar el PR
