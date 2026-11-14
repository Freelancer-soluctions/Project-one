# ci-pr-review-automation Specification

## Purpose

Configuración de SonarQube PR analysis y revisores IA como asesores, con decisión D2 documentada.

## ADDED Requirements

### Requirement: Decisión D2 documentada

La decisión sobre SonarQube (D2) SHALL documentarse en `quality-policy.md` con la opción elegida y la justificación.

#### Scenario: Decisión tomada

- **WHEN** se decide sobre SonarQube
- **THEN** `quality-policy.md` registra la decisión y la fecha

### Requirement: SonarQube con token y pull_request (si se activa)

Si se activa SonarQube, el job SHALL usar `pull_request` (no `pull_request_target`), token vía secret, y el Quality Gate SHALL convertirse en required check solo tras un PR de prueba que confirme el nombre del check.

#### Scenario: PR de prueba

- **WHEN** se activa SonarQube
- **THEN** se ejecuta un PR de prueba que confirma el nombre del check
- **AND** solo entonces se añade al ruleset como required

### Requirement: Manejo de PRs de fork

Si se activa SonarQube, el change SHALL documentar y aplicar una política para PRs de fork (skip con guard o análisis sin secreto) para que el check no quede rojo/no-reportado indefinidamente.

#### Scenario: PR de fork

- **WHEN** un PR proviene de un fork
- **THEN** la política decidida (skip o análisis sin secreto) se aplica
- **AND** el check no bloquea indefinidamente ni falla por falta de secretos

### Requirement: Revisores IA como asesores

CodeRabbit y DeepSource SHALL permanecer como asesores (warning, no required checks). Sus checks no se añaden al ruleset.

#### Scenario: Revisor IA

- **WHEN** un revisor IA produce un hallazgo
- **THEN** aparece como comentario
- **AND** no bloquea el merge
