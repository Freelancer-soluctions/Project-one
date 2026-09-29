## ADDED Requirements

### Requirement: No usar npx en scripts npm del root

The system SHALL NOT use `npx` in any root npm script for test runner invocation.

#### Scenario: Ejecutar npm run test en Windows

- **WHEN** se ejecuta `npm run test` desde el root del monorepo en Windows 10/11
- **THEN** el script NO invoca `npx` en ninguna parte de la cadena de ejecución
- **AND** todos los binarios (`vitest`, `playwright`) se resuelven via `node_modules/.bin/`
- **AND** no se generan procesos `cmd.exe` intermediarios colgados

#### Scenario: Scripts que delegan a workspaces

- **WHEN** se ejecuta `npm run test:unit` desde el root
- **THEN** el script delega ejecución con `npm run test:unit --workspaces --if-present`
- **AND** no usa patrones tipo `npx vitest --config apps/X/vitest.config.js`
- **AND** no usa `&&` para encadenar workspaces (causa spawn loop en Windows)

---

### Requirement: No usar && para encadenar scripts npm en Windows

The system SHALL NOT use shell metacharacters (`&&`, `||`, `;`) to chain npm scripts in root or workspace package.json on Windows, due to cmd.exe /d /s /c wrapper causing spawn loops and PATH loss.

#### Scenario: Script root test secuencial

- **WHEN** se ejecuta `npm run test` desde el root en Windows
- **THEN** el script usa `concurrently -m 1 --kill-others-on-fail` en lugar de `&&`
- **AND** preserva fail-fast (si unit falla, integration y e2e no corren)
- **AND** no genera wrapper `cmd.exe /d /s /c` con metacharacters

#### Scenario: Script workspace test secuencial

- **WHEN** se ejecuta `npm run test` en un workspace (ej. server-express)
- **THEN** el script interno usa `concurrently -m 1 --kill-others-on-fail` en lugar de `&&`
- **AND** no genera wrapper `cmd.exe /d /s /c` anidado

---

### Requirement: Husky hooks sin npx

The system SHALL have husky hooks that do not use `npx` for test or lint invocation, using bins direct from node_modules/.bin/ instead.

#### Scenario: Hook pre-push sin npx

- **WHEN** se ejecuta el hook `.husky/pre-push` antes del git push
- **THEN** el script usa bins directos (`vitest run`) en lugar de `npx vitest`
- **AND** no genera procesos `cmd.exe` intermediarios en Windows

#### Scenario: Hook commit-msg sin npx

- **WHEN** se ejecuta el hook `.husky/commit-msg` después del commit
- **THEN** usa `commitlint` desde `node_modules/.bin/` en lugar de `npx --no-install commitlint`
- **AND** mantiene el behavior de validación Conventional Commits

---

### Requirement: Vitest config usa hanging-process reporter

The system SHALL configure hanging-process reporter in all Vitest configs to detect open handles when vitest cannot close.

#### Scenario: Detectar procesos colgados durante tests

- **WHEN** vitest no puede cerrar (handles abiertos)
- **THEN** el reporter `hanging-process` imprime los handles/listeners activos
- **AND** el proceso termina con exit code 1 (no colgado indefinidamente)

---

### Requirement: Vitest config con pool forks y singleFork condicional

The system SHALL configure pool 'forks' in server vitest config, with singleFork enabled only in CI environments.

#### Scenario: Ejecución de tests en Windows CI

- **WHEN** se ejecutan los tests del server en un entorno CI (`process.env.CI` truthy)
- **THEN** `apps/server/vitest.config.js` define `pool: 'forks'`
- **AND** define `poolOptions.forks.singleFork: true` para reducir procesos hijos a 1

#### Scenario: Ejecución de tests en desarrollo local

- **WHEN** se ejecutan los tests del server localmente (sin `process.env.CI`)
- **THEN** `apps/server/vitest.config.js` define `pool: 'forks'`
- **AND** `singleFork` es false (default) para preservar paralelismo

---

### Requirement: Eliminación de projects anidados en client vitest config

The system SHALL NOT use Vitest Projects API anidado in client vitest config when external --project flag is also used.

#### Scenario: Client vitest.config.js sin projects anidados

- **WHEN** se ejecutan los tests del client
- **THEN** `apps/client/vitest.config.js` NO define `test.projects[]` anidados
- **AND** usa un único patrón de include unificado para todos los tests
- **AND** el root NO pasa el flag `--project=unit` externo

---

### Requirement: Timeouts globales configurados

The system SHALL configure global test timeouts in vitest.shared.js to fail-fast on hanging tests.

#### Scenario: Tests colgados terminan con timeout

- **WHEN** un test supera los 30 segundos
- **THEN** vitest.shared.js define `testTimeout: 30000` y el test falla
- **AND** si un hook supera 15 segundos, `hookTimeout: 15000` aplica
- **AND** el teardown tiene `teardownTimeout: 5000`

---

### Requirement: Script test:debug disponible

The system SHALL provide a `test:debug` npm script using why-is-node-running to diagnose hanging processes.

#### Scenario: Diagnosticar hangs de procesos

- **WHEN** el desarrollador sospecha de tests colgados
- **THEN** ejecuta `npm run test:debug` desde el root
- **AND** vitest se ejecuta con `--import why-is-node-running/include`
- **AND** al terminar, lista los handles abiertos con su stack trace

---

### Requirement: Tests terminan cleanly en Windows

The system SHALL ensure all test executions terminate cleanly in Windows without zombie processes.

#### Scenario: Verificación post-fix

- **WHEN** se ejecuta `npm run test` en Windows post-fix
- **THEN** todos los procesos `node.exe` lanzados terminan
- **AND** no quedan procesos `cmd.exe` zombies en Task Manager
- **AND** el exit code es 0 (éxito) o 1 (falla de tests) pero no hang
