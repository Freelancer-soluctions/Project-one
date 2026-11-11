# sca-lockfile-compliance Specification (delta)

## MODIFIED Requirements

### Requirement: Job de auditoría de lockfile en PR (capa PR-time)

El workflow `ci.yml` SHALL ejecutar un job `lockfile-audit` en cada `pull_request` que ejecute `npm audit --audit-level=moderate --json` directamente sobre el `package-lock.json` commiteado (sin `npm ci`), conservando el reporte como artifact con retención de 14 días.

La promoción a blocking es inmediata: `continue-on-error` se quita desde día uno. `npm audit` con `--audit-level=moderate` puede generar ruido en dependencias de desarrollo; si es necesario, se ajusta el umbral. Deep research (2026-11-10) confirma que `npm audit` es adecuado para CVE gating pero no calcula EPSS ni KEV; el triage completo requiere Snyk (comercial) o enriquecimiento manual.

#### Scenario: Job presente y disparado solo por PR

- **WHEN** corre `ci.yml` en un `pull_request`
- **THEN** existe el job `lockfile-audit` con condición `if: github.event_name == 'pull_request'`
- **AND** declara `needs: repo-discovery` y un `timeout-minutes` acotado

#### Scenario: Umbral y salida del audit

- **WHEN** el job ejecuta el audit
- **THEN** el comando es `npm audit --audit-level=moderate --json` y su salida se redirige a `audit-report.json`
- **AND** NO declara `npm ci` como requisito: el audit lee el lockfile directamente

#### Scenario: Evidencia PR retenida 14 días

- **WHEN** el audit termina (con o sin hallazgos)
- **THEN** `audit-report.json` se sube vía `actions/upload-artifact` con nombre `lockfile-audit-pr`
- **AND** `retention-days` es `14`
- **AND** el upload corre con `if: always()` e `if-no-files-found: warn`

#### Scenario: FASE 1 advisory (continue-on-error)

- **WHEN** el audit encuentra vulnerabilidades `>= moderate` mientras rige la FASE 1
- **THEN** el paso declara `continue-on-error: true` y el job no bloquea el merge
- **AND** ninguna entrada de `required_status_checks` depende de `lockfile-audit` en FASE 1
- **AND** el artifact con los hallazgos queda disponible para revisión
- **NOTE:** Superseded by "Blocking from day one" — el control es blocking desde día uno, sin FASE 1.

#### Scenario: FASE 2 bloqueante gradual

- **WHEN** el job acumula 2-4 semanas de runs con hallazgos triados y sin falsos positivos
- **THEN** la remoción de `continue-on-error` convierte el check en blocking de forma gradual
- **AND** `lockfile-audit` se agrega al bloque `needs` del agregador `prebuild-security-complete` en `ci.yml` (anclado por nombre de job)
- **AND** `docs/learning/quality-gates.md` refleja el cambio de fase (`advisory (PR, fase 1)` → `blocking (PR)`)
- **NOTE:** Superseded by "Blocking from day one" — el control es blocking desde día uno, sin período de calibración.

#### Scenario: Blocking from day one

- **WHEN** el audit encuentra vulnerabilidades `>= moderate`
- **THEN** el job falla (sin `continue-on-error`) y bloquea el merge
- **AND** `lockfile-audit` está en `prebuild-security-complete.needs` desde día uno
- **AND** el artifact con los hallazgos queda disponible para revisión

#### Scenario: Falsa positiva documentada

- **WHEN** un run de `lockfile-audit` produce un falso positivo
- **THEN** el hallazgo se registra con: paquete, CVE, motivo del falso positivo, y fecha
- **AND** si el paquete es una devDependency, se evalúa excluirlo del umbral o ajustar `--audit-level`
- **AND** la tasa de falsos positivos se recalcula al final de cada semana

#### Scenario: `deny-licenses` no aplica a esta capa

- **WHEN** se configura el job `lockfile-audit`
- **THEN** no se declaran `allow-licenses` ni `deny-licenses` ni se modifica `fail-on-severity`
- **AND** la documentación explica que esta capa detecta CVE/vulnerabilidades, no licencias

## ADDED Requirements

### Requirement: OSV-Scanner step opcional

El job `lockfile-audit` SHALL incluir un step opcional que ejecuta `osv-scanner --lockfile=package-lock.json` para cobertura multi-ecosistema (npm/yarn/pnpm/bun). El step se gated on lockfile changes y es advisory en FASE 1. OSV-Scanner es free (Apache-2.0) y consulta OSV DB (30+ fuentes), pero solo output CVSS (no EPSS ni KEV).

#### Scenario: OSV-Scanner step presente

- **WHEN** el job `lockfile-audit` ejecuta en un PR con cambios en el lockfile
- **THEN** el step de OSV-Scanner ejecuta `osv-scanner --lockfile=package-lock.json`
- **AND** genera un reporte SARIF con `category: osv-scanner`
- **AND** el step es advisory en FASE 1 (`continue-on-error: true`)

#### Scenario: OSV-Scanner step gated on lockfile changes

- **WHEN** el PR no toca el lockfile
- **THEN** el step de OSV-Scanner se salta
- **AND** el job principal (`npm audit`) sigue ejecutándose si el lockfile está presente

### Requirement: Lockfile obligatorio en PR

El sistema SHALL verificar que `package-lock.json` existe cuando `package.json` cambia en un PR. GitHub no enforcea nativamente la presencia de lockfile; se implementa via un step custom en el job `lockfile-audit`.

#### Scenario: PR cambia package.json sin lockfile

- **WHEN** un PR modifica `package.json` pero no actualiza `package-lock.json`
- **THEN** el step de verificación falla con un mensaje claro
- **AND** el job `lockfile-audit` reporta el fallo (advisory en FASE 1, blocking en FASE 2)

#### Scenario: PR con lockfile presente

- **WHEN** un PR modifica `package.json` y actualiza `package-lock.json`
- **THEN** el step de verificación pasa
- **AND** el job continúa con `npm audit` y OSV-Scanner
