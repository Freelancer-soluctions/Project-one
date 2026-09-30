# root-manifest-hygiene Specification

## Purpose

Gobierna el inventario de dependencias del `package.json` raíz de `project-one` (monorepo npm workspaces): el manifiesto raíz es un **manifiesto de orquestación** (tooling del repo, scripts, engines, workspaces), no un volcado del árbol resuelto. Esta capability define qué puede contener `dependencies`, prohíbe las entradas promovidas de dependencias transitivas y los nombres de workspaces internos, y establece el guard de CI que impide la re-aplanación del manifiesto (causa raíz de falsos positivos de typosquatting y de riesgo de dependency confusion documentados en el change `typosquatting-detection`).

## ADDED Requirements

### Requirement: Inventario de dependencies raíz limitado a requisitos directos

El bloque `dependencies` del `package.json` raíz SHALL contener únicamente (a) paquetes cuya necesidad es directa y justificada (importados o requeridos por código/scripts del raíz), o (b) entradas de la allowlist versionada con justificación por entrada. SHALL NOT contener dependencias transitivas promovidas ni residuos de instalaciones accidentales.

#### Scenario: Sin transitivas promovidas

- **WHEN** se compara cada entrada de `dependencies` del raíz contra la unión de requisitos directos declarados en los manifests de los workspaces (`apps/client`, `apps/server`, `e2e`), las `devDependencies` del raíz y la allowlist versionada
- **THEN** no queda ninguna entrada sin correspondencia
- **AND** el conteo de entradas es del orden de decenas (no cientos)

#### Scenario: Sin residuos de instalación accidental

- **WHEN** se inspecciona el inventario del raíz buscando nombres que no corresponden a librerías reales del registro (p. ej. `add`, comandos npm usados como paquete)
- **THEN** ninguna entrada lo contiene

#### Scenario: Los requisitos internos de terceros no se pixean en la raíz

- **WHEN** un paquete de terceros declara requisitos internos con nombre distinto (aliases `npm:` o variantes `-cjs` de paquetes existentes, p. ej. los de `@isaacs/cliui`)
- **THEN** esos requisitos NO aparecen como entradas de `dependencies` del raíz
- **AND** su resolución queda a cargo del árbol de dependencias normal (lockfile), no del manifiesto raíz

### Requirement: Prohibición de nombres de workspace interno en dependencies

El bloque `dependencies` del `package.json` raíz SHALL NOT declarar el nombre de ningún workspace interno del monorepo (`client-react`, `server-express`, `e2e` o los que existan en `workspaces`). La vinculación entre workspaces SHALL quedar a cargo del campo `workspaces` y el lockfile (`link: true`).

#### Scenario: Workspaces ausentes del inventario

- **WHEN** se listan las claves de `dependencies` del raíz y se comparan con los nombres (`name`) de los manifests de los workspaces
- **THEN** no hay intersección

#### Scenario: Sin exposición a dependency confusion

- **WHEN** un scanner de typosquatting/dependency-confusion analiza el manifest raíz
- **THEN** ningún nombre privado interno consulta el registro público como dependencia declarada
- **AND** se elimina la clase de falso positivo `Package/Version <workspace> not on NPM` en GuardDog

### Requirement: Guard de higiene del manifest en CI

El pipeline SHALL ejecutar un guard que valide el inventario de `dependencies` del raíz contra los requisitos directos + allowlist, y SHALL fallar ante cualquier entrada no justificada. El guard corre sobre todo PR que modifique `package.json` o `package-lock.json` en la raíz.

#### Scenario: PR que re-aplana el manifest es bloqueado

- **WHEN** un PR agrega a `dependencies` del raíz una entrada que no es requisito directo ni está en la allowlist
- **THEN** el guard falla con un mensaje que lista las entradas inválidas
- **AND** el PR queda bloqueado

#### Scenario: PR legítimo pasa

- **WHEN** un PR modifica el manifest raíz sin introducir entradas inválidas
- **THEN** el guard termina en éxito
- **AND** la duración del guard es de segundos (comparación de manifests, sin acceso a red)

#### Scenario: Allowlist auditable

- **WHEN** el guard encuentra una entrada de la allowlist
- **THEN** cada entrada de la allowlist tiene justificación registrada junto a la entrada
- **AND** una allowlist con entradas sin justificación hace fallar el guard

### Requirement: Instalación reproducible y builds verificados tras la limpieza

La limpieza del manifiesto raíz SHALL dejar el árbol funcional: `npm ci` instala desde el lockfile regenerado sin errores, y los builds, tests unitarios y de integración de los workspaces pasan sin cambios de código de aplicación.

#### Scenario: npm ci desde lockfile regenerado

- **WHEN** se ejecuta `npm ci` en la raíz con el lockfile posterior a la limpieza
- **THEN** la instalación termina con éxito
- **AND** el lockfile no contiene entradas huérfanas respecto de los manifests

#### Scenario: Workspaces intactos

- **WHEN** se ejecutan build, tests unitarios y de integración de `client-react`, `server-express` y `e2e` tras la limpieza
- **THEN** todos pasan sin modificaciones de código
- **AND** los scripts raíz (`dev`, `test`, `build`, `lint`) siguen resolviendo sus binarios vía hoisting
