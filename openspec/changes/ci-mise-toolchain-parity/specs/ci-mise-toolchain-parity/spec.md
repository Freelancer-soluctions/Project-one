# ci-mise-toolchain-parity Specification

## Purpose

Garantizar paridad de versiones y herramientas de lint/seguridad entre entorno local y CI mediante Mise, con lockfile verificable por checksum y ejecución bloqueante (`--locked`), de forma reproducible en Windows/macOS/Linux y air-gapped.

## ADDED Requirements

### Requirement: Toolchain SSOT via Mise

El repositorio SHALL declarar el toolchain de lint/seguridad en `mise.toml` en la raíz, con `monorepo_root = true` y un lockfile unificado (`mise.lock`) que incluya checksums por plataforma.

#### Scenario: New developer onboarding

- **WHEN** un desarrollador clona el repo y ejecuta `mise install --locked`
- **THEN** se instalan exactamente las versiones pinneadas en `mise.lock`
- **AND** si falta una entrada o checksum, el comando falla (no drift silencioso)

#### Scenario: CI parity

- **WHEN** un workflow de CI ejecuta `mise install --locked`
- **THEN** las versiones instaladas coinciden con las del entorno local
- **AND** un job de verificación (`toolchain-verify`) falla si hay desviación

### Requirement: Locked execution in CI

Todos los workflows que usen herramientas de lint/seguridad SHALL ejecutar `mise install --locked` antes de invocarlas, y cachear `downloads-cas` (no `installs`) por plataforma.

#### Scenario: Cache hit

- **WHEN** el cache de `downloads-cas` está disponible
- **THEN** `mise install --locked` no descarga de la red
- **AND** la verificación de checksum se mantiene

#### Scenario: Missing tool in local

- **WHEN** una herramienta no está instalada localmente
- **THEN** el hook falla o avisa según la política (fail-open documentado solo para herramientas opcionales)
- **AND** el CI siempre falla si falta (no fail-open)

### Requirement: Multi-platform support

`mise.toml` SHALL soportar Windows, macOS y Linux (x64/arm64) mediante backends con `supported_envs` y paths documentados.

#### Scenario: Windows developer

- **WHEN** un desarrollador en Windows ejecuta `mise install`
- **THEN** las herramientas se instalan en `%LOCALAPPDATA%\mise\installs`
- **AND** los hooks las encuentran vía shims/PATH

### Requirement: Air-gapped operation

El toolchain SHALL poder operar offline con un mirror interno de descargas y `MISE_OFFLINE=1`.

#### Scenario: Air-gapped CI runner

- **WHEN** el runner no tiene acceso a internet
- **THEN** `MISE_OFFLINE=1 mise install --locked` usa el caché pre-sembrado
- **AND** falla si falta algún artefacto (no fallback silencioso)

### Requirement: Version verification job

Un job de CI `toolchain-verify` SHALL verificar que las versiones instaladas coinciden con `mise.lock` y que `mise doctor` no reporta problemas.

#### Scenario: Version drift (repo)

- **WHEN** el repositorio tiene `mise.toml` sin `mise.lock` correspondiente (o drift entre ellos)
- **THEN** `toolchain-verify` falla (`mise lock --check`)
- **AND** el PR no puede mergearse

#### Scenario: Local drift enforcement

- **WHEN** un desarrollador instala una versión distinta a la del lockfile localmente
- **THEN** el hook pre-push (`mise ls --locked` / `mise doctor`) falla o avisa
- **AND** la verificación definitiva ocurre en CI

### Requirement: Local/CI tool parity

Los hooks locales (pre-commit/pre-push) SHALL usar exactamente las mismas herramientas y versiones que el pipeline (CI), resueltas vía Mise (`mise exec` o shims), de modo que un check que pasa localmente pase en CI y viceversa.

#### Scenario: Hook uses same tool as CI

- **WHEN** un hook ejecuta `checkov`, `hadolint`, `actionlint`, `zizmor`, `gitleaks`, `semgrep` o `guarddog`
- **THEN** la versión resuelta es la del `mise.lock`
- **AND** el comando es idéntico al invocado en CI (misma versión, mismos flags/políticas)

#### Scenario: Tool missing locally

- **WHEN** una herramienta no está instalada localmente
- **THEN** el hook falla o avisa según la política documentada (fail-open solo para opcionales)
- **AND** el CI siempre falla si falta (no fail-open)

### Requirement: Deprecation of legacy tooling

`.tool-versions` y `scripts/install-lint-tools.sh` SHALL marcarse como deprecados y eliminarse tras la migración completa.

#### Scenario: Legacy fallback

- **WHEN** un desarrollador aún usa `.tool-versions`
- **THEN** se muestra un aviso de deprecación
- **AND** se documenta la migración a `mise.toml`
