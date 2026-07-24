## ADDED Requirements

### Requirement: Script dev:client en la raiz
El `package.json` raiz SHALL incluir un script `dev:client` que inicie el servidor de desarrollo del workspace client-react.

#### Scenario: Ejecutar dev:client desde la raiz
- **WHEN** se ejecuta `npm run dev:client` desde la raiz
- **THEN** MUST ejecutarse `npm run dev --workspace=client-react`
- **AND** MUST iniciarse el servidor de desarrollo Vite en el puerto 5173

### Requirement: Script dev:server en la raiz
El `package.json` raiz SHALL incluir un script `dev:server` que inicie el servidor de desarrollo del workspace server-express.

#### Scenario: Ejecutar dev:server desde la raiz
- **WHEN** se ejecuta `npm run dev:server` desde la raiz
- **THEN** MUST ejecutarse `npm run dev --workspace=server-express`
- **AND** MUST iniciarse nodemon con Express en el puerto 4000

### Requirement: Script dev en la raiz (concurrente)
El `package.json` raiz SHALL incluir un script `dev` que inicie client y server simultaneamente.

#### Scenario: Ejecutar dev desde la raiz con concurrently
- **WHEN** se ejecuta `npm run dev` desde la raiz
- **THEN** MUST iniciarse el servidor de desarrollo de client (Vite) y server (Express/nodemon) en paralelo
- **AND** MUST usarse `concurrently` para la ejecucion paralela con prefijos de nombre y color

#### Scenario: concurrently instalado como devDependency
- **WHEN** se ejecuta `npm install` desde la raiz
- **THEN** `concurrently` MUST estar listado en `devDependencies` del `package.json` raiz
