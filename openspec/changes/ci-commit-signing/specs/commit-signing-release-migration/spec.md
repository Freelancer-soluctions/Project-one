## Purpose

Migra el workflow `release.yml` para que los commits de versión y el Release PR que genera changesets/action queden firmados y verificados en GitHub, sin romper el enforcement de commits firmados.

## ADDED Requirements

### Requirement: release.yml produce commits Verified vía GitHub App SSH

El workflow `release.yml` SHALL usar una GitHub App dedicada con su propia SSH signing key (vía `actions/create-github-app-token`) para generar el token con el que `changesets/action` crea el version commit y el Release PR. Los commits y el Release PR SHALL marcarse como "Verified" en GitHub. Como fallback si App indisponible, SHALL (fallback si App indisponible: (a) pausar releases hasta restaurar App — preferido; o (b) firmar en runner con SSH signing key dedicada de emergencia importada vía secret — requiere su .pub registrada como Signing Key previamente).

**Nota (condicional — R8):** R8 aplica SOLO si GATE 4.0 (tasks 4.0) determina que commits de changesets son rechazados por enforcement; si aceptados, R8 queda not-needed y este spec delta se marca como descartado en sync/archive.

#### Scenario: Version commit firmado por la App

- **WHEN** `changesets/action` crea el version commit usando el token de la GitHub App con SSH signing key configurada
- **THEN** el version commit se marca como "Verified" en GitHub
- **AND** el Release PR resultante también se marca como "Verified"

#### Scenario: Fallback si la App no está disponible

- **WHEN** la GitHub App no está disponible (credenciales revocadas o servicio caído)
- **THEN** se aplica el fallback dual: (a) pausar releases hasta restaurar la App — preferido; o (b) firmar en el runner con una SSH signing key dedicada de emergencia importada vía secret, cuya `.pub` debe estar registrada previamente como Signing Key en GitHub
- **AND** el fallback NO depende de firmas automáticas de GitHub (web-flow); el comportamiento exacto de firma según mecanismo (git push vs REST API) se determina empíricamente en GATE 4.0

#### Scenario: release.yml sin migrar rompe enforcement

- **WHEN** `release.yml` sigue usando GITHUB_TOKEN con contents:write sin firma de la App
- **THEN** los commits de release NO quedan Verified y el enforcement en main los rechaza (riesgo mitigado ejecutando F3 antes de F5)

## Non-Goals

- **Firma de tags de release**: queda fuera del alcance de este change. `tag.gpgsign true` cubre los tags locales del dev; los tags empujados automáticamente por `changesets/action` (version tag) quedan out-of-scope (m2).
