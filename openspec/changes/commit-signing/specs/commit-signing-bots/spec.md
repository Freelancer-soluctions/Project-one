## Purpose

Define cómo los commits automatizados (Dependabot, GitHub Actions bot, CI auto-fixes) cumplen la política de firmas sin requerir claves SSH humanas, aprovechando la firma automática de GitHub para identidades de bot.

## ADDED Requirements

### Requirement: Commits de bots verificables por GitHub

Los commits creados por bots (Dependabot y `github-actions[bot]` con el token por defecto `GITHUB_TOKEN`) SHALL ser firmados automáticamente por la infraestructura de GitHub y mostrar estado "Verified", de modo que cumplan la política de commits firmados sin configuración adicional.

#### Scenario: Commit de Dependabot en PR de dependencias

- **WHEN** Dependabot abre un PR y crea commits en la rama del PR
- **THEN** los commits aparecen firmados y verificados por GitHub (badge "Verified")
- **AND** no se requiere configurar claves SSH para Dependabot

#### Scenario: Commit de GitHub Actions bot (version bump de Changesets / CI auto-fix)

- **WHEN** un workflow usa la identidad `github-actions[bot]` con `GITHUB_TOKEN` para commitear (ej. `release.yml` version packages, auto-fixes)
- **THEN** los commits aparecen firmados y verificados por GitHub
- **AND** el job CI de verificación de firmas los acepta

### Requirement: Evitar firmas con PAT de servicio para bots

La estrategia de firmas SHALL documentar que los bots no deben firmar con claves SSH asociadas a PATs de servicio de larga duración como mecanismo estándar; si un proceso requiere una identidad de servicio con firma propia, la clave SSH del servicio SHALL estar registrada en la cuenta del bot y el uso de PATs de larga duración SHALL evitarse en favor de `GITHUB_TOKEN`/OIDC.

#### Scenario: Proceso requiere identidad de servicio con firma propia

- **WHEN** existe un proceso de servicio que debe commitear y no puede usar `GITHUB_TOKEN` (ej. runner auto-hosted con credenciales propias)
- **THEN** la guía documenta registrar la clave SSH del servicio en la cuenta del bot
- **AND** se documenta el riesgo de PATs de larga duración y la alternativa OIDC

#### Scenario: Commits de bots en PRs hacia main

- **WHEN** un PR con commits de bot (Dependabot o Actions) se abre hacia `main` con la política v2 activa
- **THEN** el branch protection y el job CI aceptan los commits del bot por estar firmados por GitHub
- **AND** no se requiere bypass por username en CODEOWNERS para firmas
