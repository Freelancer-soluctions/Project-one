# Proposal

## Why

Cada job de `ci.yml` declara un `name:` que es lo que se ve en la pestaña Checks del PR y lo que lee el developer
antes de mergear. La convención del repo es que ese nombre lleve el prefijo del substage al que pertenece
(`Quality: …`, `Security: …`), y esa convención se cumple en su mayor parte — pero no en todas partes.

Tres jobs la incumplen, y uno de ellos **miente sobre su ubicación**:

| Job                   | Nombre actual                                  | Bloque real          | Problema                                  |
| --------------------- | ---------------------------------------------- | -------------------- | ----------------------------------------- |
| `dependency-review`   | `Dependency Review`                            | SUBSTAGE 2C SECURITY | Sin prefijo                               |
| `secrets`             | `Secret Detection`                             | SUBSTAGE 2C SECURITY | Sin prefijo                               |
| `actionlint-advisory` | `Quality: ActionLint Advisory (SARIF, FASE 1)` | SUBSTAGE 2C SECURITY | Prefijo **Quality** en un job de Security |

`actionlint-advisory` es el caso con consecuencias: su nombre afirma que es un gate de calidad cuando lo que hace
es escanear la configuración de los workflows. Quien lea la lista de checks para saber qué couvre la capa de
seguridad ve un job de Quality.

El resto del pipeline sí es consistente: los 16 jobs del SUBSTAGE 2B llevan `Quality:`, los 7 de SECURITY llevan
`Security:`, los 4 de TESTING son homogéneos entre sí, y los 6 agregadores siguen el patrón `Prebuild … Complete`.

## What Changes

- `dependency-review`: `Dependency Review` → `Security: Dependency Review`
- `secrets`: `Secret Detection` → `Security: Secret Detection`
- `actionlint-advisory`: `Quality: ActionLint Advisory (SARIF, FASE 1)` → `Security: ActionLint Advisory (SARIF, FASE 1)`
- Documentación en lockstep: `docs/CONTEXT-CICD.md` (§3.3 tabla de jobs, §9.3.x checks),
  `docs/learning/quality-gates.md` (§2 tabla de gates), `docs/ci-cd-pipeline-empresarial.md` (los listados y
  extractos de `ci.yml` que citan los nombres literales).
- La convención y su **excepción obligatoria** quedan escritas como requirement normativo, para que los jobs futuros
  nazcan normalizados y para que nadie intente "arreglar" los 4 nombres atados al ruleset.

## Non-Goals

- **Renombrar los 4 checks atados al ruleset** (`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`,
  `PR Title Lint`, `DCO`). Ver design.md D2: el beneficio es estético y el riesgo es bloquear `main`.
- Renombrar los jobs `if: false` (builds, depcheck, sonarqube, e2e): su nombre ya sigue la convención o el job no
  corre; unificarlos ahora solo genera churn que luego revierte su activación.
- Cambiar los `id:` de los jobs. El `name:` es lo que ve el humano; el `id:` es la referencia de los `needs:` y del
  fallo del agregador.

## Impact

- `.github/workflows/ci.yml` — 3 líneas de `name:`. Ningún `id:`, ningún `needs:`, ningún job nuevo.
- Docs — ~38 referencias.
- `openspec/specs/` — nuevo requirement en `ci-prebuild-substage-structure` (la convención de nombres pertenece al
  contrato del pipeline, que es donde ya vive el contrato de `needs` del agregador).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ci-prebuild-substage-structure`: añade el requirement de convención de nombres por substage, con la excepción
  de los checks atados al ruleset.
