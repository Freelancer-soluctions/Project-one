# Spec Delta

## Purpose

Define la gobernanza del gate SCA PR-time `dependency-review`: su taxonomía `blocking/advisory` en la documentación de quality gates, la política de licencias explícita, la publicación del resumen en el PR, la evaluación de scopes de fallo y la separación documentada respecto del escáner Trivy.

## ADDED Requirements

### Requirement: Fila de taxonomía en quality-gates.md

`docs/learning/quality-gates.md` §2 SHALL include una fila `dependency-review` en la tabla de gates que declare su tipo de taxonomía y su estado, coherente con la implementación real en `.github/workflows/ci.yml`.

#### Scenario: Fila presente y coherente con el pipeline

- **WHEN** se revisa la tabla §2 de `quality-gates.md`
- **THEN** existe una fila `dependency-review`
- **AND** declara taxonomía `blocking (PR)` (job sin `continue-on-error`, en `needs` de `prebuild-security-complete`)
- **AND** referencia `ci.yml` substage 2C como ubicación

#### Scenario: Job falla y documentación lo refleja

- **WHEN** el job `dependency-review` falla en un PR
- **THEN** el merge queda bloqueado vía `ci-complete`
- **AND** la fila documentada clasifica el gate como bloqueante (no advisory)

### Requirement: Política de licencias explícita

El job `dependency-review` SHALL configurar una política de licencias explícita usando exactamente una de las opciones `allow-licenses` (lista blanca) o `deny-licenses` (lista negra), y la política SHALL estar documentada en `docs/learning/dependency-review.md`.

#### Scenario: Opción configurada

- **WHEN** se inspecciona el bloque `with:` del job `dependency-review` en `ci.yml`
- **THEN** `license-check: true` está activo
- **AND** `allow-licenses` o `deny-licenses` está definido con al menos una entrada
- **AND** ambas opciones NO están definidas a la vez (son mutuamente excluyentes)

#### Scenario: PR introduce licencia fuera de política

- **WHEN** un PR agrega una dependencia cuya licencia no satisface la política configurada
- **THEN** el job `dependency-review` falla
- **AND** el PR queda bloqueado

#### Scenario: Política documentada

- **WHEN** se consulta `docs/learning/dependency-review.md`
- **THEN** la sección de licencias describe la lista elegida, su justificación y cómo validarla localmente

### Requirement: Resumen publicado en el PR

El job `dependency-review` SHALL configurar `comment-summary-in-pr` para que los hallazgos se publiquen como comentario en el PR aprovechando el permiso `pull-requests: write` ya declarado.

#### Scenario: Hallazgos presentes

- **WHEN** `dependency-review` detecta vulnerabilidades o incumplimientos de licencia en un PR
- **THEN** la acción publica (o actualiza) un comentario de resumen en el PR
- **AND** el comentario incluye los hallazgos que causaron el fallo

#### Scenario: Modo de publicación elegido

- **WHEN** se lee la configuración del job
- **THEN** `comment-summary-in-pr` tiene un valor explícito (no el default `never`)
- **AND** el valor elegido (`on-failure` recomendado) está documentado junto con su razón

### Requirement: Scopes de fallo evaluados y documentados

La configuración SHALL declarar o documentar explícitamente la decisión sobre `fail-on-scopes`: incluir `development` (devDependencies vulnerables bloquean) o mantener el default `runtime` con la justificación registrada.

#### Scenario: Decisión registrada

- **WHEN** se revisa `ci.yml` y `docs/learning/dependency-review.md`
- **THEN** `fail-on-scopes` está configurado explícitamente o su omisión está justificada
- **AND** la documentación indica qué scope cubre el gate hoy (`runtime` por defecto)

#### Scenario: Scope development incluido

- **WHEN** se configura `fail-on-scopes: runtime, development`
- **THEN** una vulnerabilidad con severidad >= `fail-on-severity` en una devDependency que cambia en el PR bloquea el PR

### Requirement: Permisos del job documentados

La razón de ser de cada permiso del job `dependency-review` SHALL estar documentada, en particular `security-events: write`, que la acción no ejerce (no emite SARIF).

#### Scenario: security-events explicado

- **WHEN** se lee la documentación del gate
- **THEN** se explica que `security-events: write` no se usa porque `actions/dependency-review-action` no genera SARIF
- **AND** se indica que el SARIF de vulnerabilidades de dependencias lo produce Trivy (`security.yml` job `dependency-scan`)

### Requirement: Separación Trivy vs dependency-review documentada

La documentación SHALL describir que `dependency-review` (`ci.yml`, diff del PR sobre el árbol npm + licencias) y Trivy `dependency-scan` (`security.yml`, CVEs del filesystem y paquetes OS, SARIF) son capas complementarias, no duplicadas.

#### Scenario: Complementariedad explicada

- **WHEN** se lee `docs/learning/dependency-review.md`
- **THEN** documenta el alcance de cada capa y por qué no se elimina ninguna
- **AND** referencia `docs/learning/quality-gates.md` y `docs/CONTEXT-CICD.md` §9.3.5 como fuentes de taxonomía
