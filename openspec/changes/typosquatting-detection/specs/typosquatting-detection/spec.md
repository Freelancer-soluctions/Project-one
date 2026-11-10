# typosquatting-detection Specification (delta)

## MODIFIED Requirements

### Requirement: Transición FASE 1 → FASE 2 bloqueante gradual (diferida)

La capa SHALL evolucionar de `advisory` a `blocking` solo tras 2-4 semanas de runs sin falsos positivos, momento en el que se quitará `continue-on-error: true`, se añadirá `typosquat-guarddog` al `needs` de `prebuild-security-complete` y se actualizará la fila en `docs/learning/quality-gates.md` (registro único de la taxonomía).

La calibración SHALL rastrear la tasa de falsos positivos por ecosistema. Investigación web (2026-11-10) confirma que GuardDog tiene una tasa de falsos positivos del 2.2% en npm (263/12.111 paquetes) y 6.7% en PyPI (1.002/15.001-30.000). El issue #898 (abierto, 2026-10) documenta bugs en la heurística de typosquatting (confused forms matching anywhere in term). La promoción a blocking SHALL requerir que la tasa de falsos positivos esté por debajo del umbral aceptable para el equipo (a definir en la calibración) y que los hallazgos ruidosos estén clasificados en `scripts/guarddog-verify.sh`.

#### Scenario: Criterio de promoción (R6-FASE1/2)

- **WHEN** han pasado 2-4 semanas de runs de `typosquat-guarddog` sin falsos positivos y los ruidosos están clasificados en `scripts/guarddog-verify.sh`
- **THEN** se puede quitar `continue-on-error: true` y añadir `typosquat-guarddog` al `needs` de `prebuild-security-complete` (anclado por nombre de job)
- **AND** la fila en `quality-gates.md` pasa de `advisory (PR, fase 1)` a `blocking (PR)` y se añade/actualiza la fila del job semanal

#### Scenario: Retroceso simple

- **WHEN** la FASE 2 produce un falso positivo en un PR
- **THEN** se re-añade `continue-on-error: true` y se retira la línea del `needs` (un solo revert), sin rediseñar el job
- **AND** la regresión queda anotada en `quality-gates.md` para revisar la política antes de re-promover

#### Scenario: Falsa positiva documentada

- **WHEN** un run de `typosquat-guarddog` produce un falso positivo durante la calibración
- **THEN** el hallazgo se registra con: paquete, regla disparada, motivo del falso positivo, y fecha
- **AND** si la regla es recurrentemente ruidosa, se evalúa una exclusión justificada en `scripts/guarddog-verify.sh` (qué regla, por qué, hasta cuándo)
- **AND** la tasa de falsos positivos se recalcula al final de cada semana de calibración

## ADDED Requirements

### Requirement: Evaluación de Socket como alternativa

El equipo SHALL evaluar Socket (comercial) como alternativa a GuardDog si la tasa de falsos positivos de GuardDog sigue inaceptable después de la calibración. La evaluación SHALL comparar: tasa de falsos positivos, cobertura de señales (70+ en Socket vs metadata+YARA en GuardDog), costo, y compatibilidad con el flujo de CI existente. La decisión SHALL documentarse en el change antes de promover a blocking.

#### Scenario: Socket evaluado

- **WHEN** la calibración de GuardDog concluye con tasa de falsos positivos inaceptable
- **THEN** se documenta la comparación Socket vs GuardDog en el change
- **AND** se decide si promover GuardDog (con exclusiones) o migrar a Socket
- **AND** la decisión se registra en `docs/learning/quality-gates.md`

#### Scenario: GuardDog promovido sin Socket

- **WHEN** la calibración de GuardDog concluye con tasa de falsos positivos aceptable
- **THEN** se promueve GuardDog a blocking sin evaluar Socket
- **AND** la decisión se registra en `docs/learning/quality-gates.md`
