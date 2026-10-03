# ci-runtime-config-hygiene Specification

## Purpose

Define las reglas de higiene de la configuración runtime de `ci.yml`: dependencias del DAG justificadas por consumo real de datos, valores de configuración con vida más allá del PR visibles como repository variables, y jobs diferidos (`if: false`) documentados con la convención de fases del pipeline. El objetivo es que la topología del DAG refleje dependencias de datos reales y que ninguna constante de gobernanza quede enterrada en scripts de workflow.

## ADDED Requirements

### Requirement: Needs del DAG justificados por consumo de datos

Un job de `ci.yml` SHALL declarar `needs: repo-discovery` únicamente si consume al menos uno de sus outputs (condición sobre `needs.repo-discovery.outputs.*` o lectura de un output en sus steps). Los jobs que corren incondicionalmente en `pull_request` sin filtrar por outputs SHALL NOT declarar la dependencia.

#### Scenario: sast corre en paralelo con el path-filter

- **WHEN** se lee la definición del job `sast` en `ci.yml`
- **THEN** no declara `needs: repo-discovery`
- **AND** mantiene su condición `if: github.event_name == 'pull_request'` y su `name: SAST (Semgrep)` intactos
- **AND** el job sigue siendo standalone (fuera de `ci-complete.needs` y de los agregadores de substage, según `sast-governance-gate`)

#### Scenario: openspec-validate corre en paralelo con el path-filter

- **WHEN** se lee la definición del job `openspec-validate` en `ci.yml`
- **THEN** no declara `needs: repo-discovery`
- **AND** mantiene su condición `if: github.event_name == 'pull_request'`, su `name: "Quality: OpenSpec Validate"` y su ejecución en todo `pull_request` (no path-filtered) según `ci-prebuild-substage-structure`

#### Scenario: La integración de agregadores no cambia

- **WHEN** los agregadores de substage evalúan sus `needs`
- **THEN** siguen resolviendo los mismos jobs con la misma lógica de propagación de fallos (`always()` + `contains(needs.*.result, ...)`)
- **AND** ningún `required_status_check` del ruleset cambia (los `name:` de los jobs no se modifican)

#### Scenario: Los jobs que sí consumen outputs conservan la dependencia

- **WHEN** un job filtra su ejecución por `needs.repo-discovery.outputs.*` (p. ej. `client-lint` con `client == 'true'`)
- **THEN** mantiene su `needs: repo-discovery`
- **AND** esta regla no se interpreta como remoción generalizada de dependencias

### Requirement: Configuración de gobernanza visible en repository variables

Toda constante de configuración con rol de gobernanza y vida más allá del ciclo del PR (fechas de corte, umbrales de rollout) SHALL declararse como repository variable (`vars.*`) con fallback inline en la expresión del workflow, en lugar de vivir enterrada en scripts bash del workflow. El fallback SHALL preservar el valor vigente.

#### Scenario: ROLLOUT_DATE como repository variable

- **WHEN** se lee el script del job `verify-signatures` en `ci.yml`
- **THEN** la fecha de corte del grandfathering se obtiene de la expresión `${{ vars.SIGNING_ROLLOUT_DATE || '2026-08-01' }}`
- **AND** el script ya no contiene el literal hardcodeado `ROLLOUT_DATE="2026-08-01"`
- **AND** el comportamiento de grandfathering es idéntico al previo (commits con `author.date` anterior al corte quedan exonerados)

#### Scenario: Variable ausente degrada al fallback sin romper el job

- **WHEN** la variable `SIGNING_ROLLOUT_DATE` no está definida en Settings del repo
- **THEN** la expresión evalúa al fallback `'2026-08-01'` y el job se comporta exactamente como antes de la migración
- **AND** definir la variable posteriormente cambia el corte sin editar código (visibilidad en Settings → Secrets and variables → Actions → Variables)

#### Scenario: Documentación sincronizada con el mecanismo

- **WHEN** se revisan `docs/CONTEXT-CICD.md` (§ firma), `docs/pre-merge-gates-governance.md` y `docs/learning/ci-cd/05c-ci-commit-signing-implementation.md`
- **THEN** citan `vars.SIGNING_ROLLOUT_DATE` (con fallback) como ubicación de la fecha de corte, no el literal en el heredoc
- **AND** la fila "Pendiente: Restaurar `ROLLOUT_DATE`" del estado final del doc 05c refleja el nuevo mecanismo

### Requirement: Convención de fase documentada en jobs diferidos

Todo job con `if: false` SHALL documentar su estado diferido con la convención de fases del pipeline (FASE 1 diferido + condición explícita de re-activación), en línea con la convención del bloque Security. El comentario SHALL permitir distinguir un diferimiento planificado de un abandono.

#### Scenario: server-format-check documentado con convención FASE

- **WHEN** se lee el comentario del job `server-format-check` en `ci.yml`
- **THEN** declara la fase diferida y la condición de re-activación (FASE 2: servidor pasa `npm run format:check` limpio, alineado con la deuda de formato del workspace server)
- **AND** el `if: false`, el `name: "Quality: Server Format"` y la lógica del job quedan intactos
- **AND** el comentario referencia la convención equivalente usada en el bloque Security (FASE 1/FASE 2)

#### Scenario: Sin cambio de comportamiento en el gate de formato

- **WHEN** el repo evalúa la cobertura del gate de formato (`config-correctness`)
- **THEN** la lógica de `npm run format:check --workspace=...` y el gating del PR de ambos format-check jobs no cambian
- **AND** la re-activación de `server-format-check` es el mecanismo que cierra la brecha de cobertura (no este change)
