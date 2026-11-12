# quality-governance Specification

## Purpose

Gobierna el registro, la propiedad y la operación de los gates de calidad del stage Quality: cada gate tiene estado documentado (advisory/bloqueante), fecha de promoción, dueño y umbral; las excepciones llevan motivo, responsable y caducidad; los baselines, allowlists y configuración del linter quedan bajo CODEOWNERS; y existe un runbook de operación. Este change hace que el stage sea auditable y operable por una sola persona sin perder trazabilidad.

## ADDED Requirements

### Requirement: Registro de política de calidad (`quality-policy.md`)

El repositorio SHALL contener `docs/learning/quality-policy.md` listando cada gate del stage Quality con: nombre, estado (advisory/bloqueante), fecha de promoción a bloqueante, dueño, umbral (si aplica) y herramienta. El archivo SHALL actualizarse en el mismo PR que cambie el estado de un gate.

#### Scenario: Gate promovido a bloqueante

- **WHEN** un gate pasa de advisory a bloqueante
- **THEN** `quality-policy.md` SHALL actualizarse en el mismo PR con la fecha de promoción y el responsable
- **AND** el PR no se mergea sin esa actualización

#### Scenario: Auditoría de gates

- **WHEN** se revisa el estado de los gates
- **THEN** `quality-policy.md` refleja el estado real de cada job en `ci.yml`
- **AND** ningún gate bloqueante aparece como advisory (ni viceversa)

### Requirement: Registro de excepciones (`quality-exceptions.md`)

El repositorio SHALL contener `docs/learning/quality-exceptions.md` listando cada excepción vigente (eslint-disable, entradas en baselines/allowlists, supresiones) con motivo, responsable y caducidad. Toda excepción nueva SHALL entrar en un PR separado (EX-2).

#### Scenario: Nueva excepción

- **WHEN** se añade una excepción (p. ej. una entrada en `.dependency-cruiser-known-violations.json` o `manifest-allowlist.json`)
- **THEN** se añade la entrada correspondiente en `quality-exceptions.md` con motivo, responsable y caducidad
- **AND** el PR que la introduce no mezcla otros cambios

#### Scenario: Excepción vencida

- **WHEN** una excepción supera su caducidad sin revisión
- **THEN** el gate correspondiente falla o se revoca la excepción en el siguiente PR

### Requirement: CODEOWNERS completo sobre configuración de calidad

`.github/CODEOWNERS` SHALL incluir patrones para `eslint.config.*`, `.dependency-cruiser.*`, `knip.json*`, `.dependency-cruiser-known-violations.json`, `eslint-suppressions.json`, `manifest-allowlist.json`, `scripts/ci/`, y los archivos de baseline/allowlist, además de los ya cubiertos (`.github/`, workflows). El último patrón que coincide gana (sintaxis gitignore).

#### Scenario: Cambio a config de lint

- **WHEN** un PR modifica `eslint.config.js` o `.dependency-cruiser.cjs`
- **THEN** se requiere aprobación del owner de plataforma (CODEOWNERS)
- **AND** el merge se bloquea sin esa aprobación

#### Scenario: Regeneración de baseline

- **WHEN** un PR modifica `.dependency-cruiser-known-violations.json` o `eslint-suppressions.json`
- **THEN** se requiere aprobación del owner de plataforma
- **AND** el PR es separado (no mezcla otros cambios)

### Requirement: Runbook de operación

`docs/learning/quality-gates.md` (o un documento enlazado) SHALL contener un runbook con acciones inmediatas y de fondo para: `main` en rojo, herramienta rota tras actualización, falso positivo bloqueante, vuelta a advisory, supresiones sin podar, caché sospechosa, check requerido en Pending, fallo de infraestructura, fallo determinista. Cada situación SHALL incluir comandos exactos.

#### Scenario: main en rojo

- **WHEN** `main` queda en rojo por un gate de calidad
- **THEN** el runbook indica revertir primero y diagnosticar después
- **AND** no se apaga ningún gate con un interruptor sin PR revisado

### Requirement: Política de actualización de herramientas

Las actualizaciones de ESLint, Prettier, TypeScript, knip, dependency-cruiser y pins de actions SHALL proponerse agrupadas en un PR de herramientas (Dependabot/Renovate), nunca en el mismo PR que código de producto; una versión mayor se prueba primero en un job advisory paralelo.

#### Scenario: Actualización mayor

- **WHEN** se propone una actualización mayor de una herramienta de calidad
- **THEN** se ejecuta un job advisory paralelo con la versión nueva antes de reemplazar
- **AND** si cambian los hallazgos, se regenera el baseline en ese mismo PR de herramientas
