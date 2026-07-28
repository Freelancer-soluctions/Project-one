## ADDED Requirements

### Requirement: e2e/package.json declarado como privado
El `package.json` de `e2e/` SHALL incluir `"private": true` para evitar publicacion accidental a npm.

#### Scenario: private: true en e2e
- **WHEN** se inspecciona `e2e/package.json`
- **THEN** MUST existir el campo `"private": true`

### Requirement: Script build raiz usa --workspaces --if-present
El script `build` en el `package.json` raiz SHALL usar `--workspaces --if-present` para ejecutar build en todos los workspaces que lo tengan definido.

#### Scenario: Build raiz ejecuta build en workspaces
- **WHEN** se ejecuta `npm run build` desde la raiz
- **THEN** MUST ejecutarse `npm run build --workspaces --if-present`
- **AND** MUST ejecutar build en todos los workspaces que tengan script `build` definido

#### Scenario: Workspace sin build no causa error
- **WHEN** se ejecuta `npm run build` desde la raiz
- **THEN** los workspaces que NO tengan script `build` MUST ser ignorados silenciosamente
- **AND** MUST continuar con los demas workspaces sin error

### Requirement: Script lint usa --workspaces --if-present (si aplica)
Si el script `lint` raiz no usa `--workspaces`, SHALL migrarse para consistencia.

#### Scenario: Lint ejecutado en todos los workspaces
- **WHEN** se ejecuta `npm run lint` desde la raiz
- **THEN** MUST ejecutarse en todos los workspaces que tengan script `lint` definido
