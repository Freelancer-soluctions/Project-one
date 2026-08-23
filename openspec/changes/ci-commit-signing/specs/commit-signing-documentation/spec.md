## Purpose

Provee documentación reproducible de onboarding y troubleshooting para la firma de commits SSH en el repositorio, incluyendo el entorno Windows/MSYS2.

## ADDED Requirements

### Requirement: Guía de onboarding reproducible

El repositorio SHALL incluir `docs/commit-signing.md` con una guía de onboarding reproducible que permita a un nuevo desarrollador (en Windows/MSYS2) generar la clave, subirla a GitHub, configurar git y producir un commit Verified siguiendo pasos deterministas.

#### Scenario: Nuevo dev en Windows/MSYS2

- **WHEN** un nuevo desarrollador sigue `docs/commit-signing.md` en Windows/MSYS2
- **THEN** puede generar la clave ed25519 dedicada, subirla como Signing Key, configurar los 4 flags de git, crear el archivo allowed_signers y producir un commit Verified siguiendo pasos reproducibles

### Requirement: Troubleshooting documentado

`docs/commit-signing.md` SHALL documentar los errores típicos y su corrección, incluyendo el error de push rechazado por falta de firma y la sintaxis exacta de `allowed_signers`.

#### Scenario: Error de push rechazado documentado

- **WHEN** un desarrollador encuentra el error `! [remote rejected] main -> main (push declined)`
- **THEN** `docs/commit-signing.md` explica la causa (falta firma de commit) y los pasos de corrección

#### Scenario: Sintaxis de allowed_signers documentada

- **WHEN** un desarrollador consulta la sección de troubleshooting de `allowed_signers`
- **THEN** el documento muestra la sintaxis exacta (`<email> namespaces="git" <clave-publica>`) y advierte que un formato incorrecto rompe la verificación local
