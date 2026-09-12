## Purpose

Garantiza que cualquier desarrollador nuevo (o existente) pueda configurar la firma SSH de commits siguiendo una guía reproducible, verificable y alineada con el pipeline existente de Husky/commitlint/lint-staged.

## ADDED Requirements

### Requirement: Guía de setup reproducible

El repositorio SHALL incluir `docs/commit-signing-setup.md` con pasos reproducibles para: generar una clave SSH ed25519 dedicada a firma, registrarla en GitHub, configurar `git config` (`gpg.format = ssh`, `commit.gpgsign = true`, `user.signingkey`), y verificar con `scripts/setup/verify-signing-setup.sh`.

#### Scenario: Dev nuevo sigue la guía completa

- **WHEN** un desarrollador nuevo sigue `docs/commit-signing-setup.md` de principio a fin
- **THEN** genera su clave ed25519, la sube a GitHub (Settings → SSH and GPG keys → New SSH key, tipo "Signing key")
- **AND** configura git y `verify-signing-setup.sh` reporta todos los chequeos en verde
- **AND** su primer commit firmado muestra "Verified" en GitHub

#### Scenario: Guía con troubleshooting

- **WHEN** un desarrollador encuentra un error al configurar la firma (clave no reconocida, "Good signature" ausente, email no coincidente)
- **THEN** la guía contiene una sección de troubleshooting con las causas conocidas y sus correcciones

### Requirement: Recuperación por pérdida de clave SSH privada

La guía SHALL documentar el procedimiento de recuperación cuando un dev pierde su clave SSH privada, garantizando que los commits antiguos firmados con la clave vieja sigan verificándose.

#### Scenario: dev pierde su clave SSH privada

- **WHEN** un dev pierde acceso a su clave SSH privada (laptop perdida, formateo, etc.)
- **THEN** el dev puede:
  1. Generar nueva clave: `ssh-keygen -t ed25519 -f ~/.ssh/signing_key -C "email@dominio.com"`
  2. Registrar nueva signing key: `gh ssh-key add ~/.ssh/signing_key.pub --type signing`
  3. Remover signing key vieja de GitHub (Settings → SSH and GPG keys → eliminar la vieja)
  4. Continuar haciendo commits con la nueva clave (commits futuros firmados correctamente)
- **AND** los commits antiguos firmados con la clave vieja siguen verificándose con la clave pública anterior (no se pierden)
- **AND** la recuperación está documentada en `docs/commit-signing-setup.md` sección "Recuperación por pérdida de clave"

### Requirement: Onboarding checklist para nuevos devs

La guía SHALL incluir un checklist de onboarding que cubra: generar clave, subir a GitHub, configurar git, verificar entorno, y hacer un commit de prueba firmado.

#### Scenario: Checklist completado

- **WHEN** un dev nuevo completa el checklist de onboarding
- **THEN** todos los ítems están verificados (clave, GitHub, git config, script, commit de prueba)
- **AND** el dev puede contribuir sin commits sin firmar

#### Scenario: Integración con hooks existentes

- **WHEN** un dev nuevo instala el repo con `npm install` (husky `prepare`)
- **THEN** los hooks existentes (pre-commit, commit-msg, pre-push) funcionan igual que antes
- **AND** la nueva advertencia de firma del pre-commit se muestra cuando la firma no está configurada

### Requirement: Política de historial y baseline documentada

La guía SHALL documentar la política de commits históricos: los commits anteriores al baseline tag no se reescriben y el baseline es documental/auditable solamente (branch protection no lo exime); solo se exige firma para commits nuevos (post-baseline).

#### Scenario: Dev consulta la política de historial

- **WHEN** un desarrollador consulta `docs/commit-signing-setup.md` sobre commits históricos sin firma
- **THEN** encuentra la política (no reescritura + baseline documental/auditable) y el motivo de la decisión
