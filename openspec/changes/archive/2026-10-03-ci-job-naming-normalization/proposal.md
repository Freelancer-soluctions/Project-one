# Proposal

## Why

Cada job de `ci.yml` declara un `name:` que es lo que se ve en la pestaña Checks del PR y lo que lee el developer
antes de mergear. La convención del repo es que ese nombre lleve el prefijo del bloque al que pertenece
(`Quality: …`, `Security: …`), y esa convención se cumple en 2B, 2C, STAGE 4 y los agregadores — pero **no en el
resto**, y la más visible es la de los tests:

| Bloque              | Jobs  | Prefijo actual | Incumplen                                                                                                   |
| ------------------- | ----- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| 2A GOVERNANCE       | 5     | ninguno        | `sast` + los 4 del ruleset                                                                                  |
| 2B CODE QUALITY     | 16    | `Quality:`     | 0                                                                                                           |
| **2D UNIT TESTING** | **4** | **ninguno**    | **4/4**: `Unit Tests - Client`, `Unit Tests - Server`, `Integration Tests - Server`, `Smoke Tests - Server` |
| 2C SECURITY         | 9     | `Security:`    | `dependency-review`, `secrets`, `actionlint-advisory` (prefijo equivocado)                                  |
| **STAGE 3 BUILD**   | **2** | **ninguno**    | **2/2**: `Build - Client`, `Build - Server`                                                                 |
| STAGE 4 POST-BUILD  | 6     | `Quality:`     | 0                                                                                                           |
| TESTS post-build    | 1     | ninguno        | `e2e`                                                                                                       |

El caso de los tests es el que más dana: en la lista de checks del PR, `Unit Tests - Client` aparece junto a
`Quality: Client Lint` sin ninguna señal de que uno es una capa de validación y el otro un gate de calidad. Del mismo
modo, `actionlint-advisory` **miente sobre su ubicación**: se anunciaba como `Quality:` cuando lo que hace es
escanear la configuración de los workflows, que es Security (2C).

## What Changes

**11 jobs renombrados** en `.github/workflows/ci.yml` (solo líneas `name:`; ningún `id:`, ningún `needs:`, ningún job
nuevo):

| Job                   | Nombre anterior                                | Nombre nuevo                                    | Bloque             |
| --------------------- | ---------------------------------------------- | ----------------------------------------------- | ------------------ |
| `dependency-review`   | `Dependency Review`                            | `Security: Dependency Review`                   | 2C SECURITY        |
| `secrets`             | `Secret Detection`                             | `Security: Secret Detection`                    | 2C SECURITY        |
| `actionlint-advisory` | `Quality: ActionLint Advisory (SARIF, FASE 1)` | `Security: ActionLint Advisory (SARIF, FASE 1)` | 2C SECURITY        |
| `sast`                | `SAST (Semgrep)`                               | `Governance: SAST (Semgrep)`                    | 2A GOVERNANCE      |
| `test-unit-client`    | `Unit Tests - Client`                          | `Tests: Unit - Client`                          | 2D TESTING         |
| `test-unit-server`    | `Unit Tests - Server`                          | `Tests: Unit - Server`                          | 2D TESTING         |
| `test-integration`    | `Integration Tests - Server`                   | `Tests: Integration - Server`                   | 2D TESTING         |
| `test-smoke`          | `Smoke Tests - Server`                         | `Tests: Smoke - Server`                         | 2D TESTING         |
| `client-build`        | `Build - Client`                               | `Build: Client`                                 | STAGE 3            |
| `server-build`        | `Build - Server`                               | `Build: Server`                                 | STAGE 3            |
| `e2e`                 | `E2E Tests`                                    | `Tests: E2E`                                    | testing post-build |

- **Los 3 specs que citan el nombre de `sast`** (`sast-governance-gate`, `ruleset-expansion` y el delta de
  `ci-runtime-config-hygiene` del change `ci-governance-quality-hygiene`) se actualizan en lockstep: describían el
  contexto que un admin añadiría al ruleset en el paso manual F2, y ese contexto pasa a ser `Governance: SAST (Semgrep)`.
- Documentación en lockstep: `docs/CONTEXT-CICD.md` (§3.2, §3.3 tabla de jobs, **§3.3.1 nueva** con la convención
  completa y las excepciones por rol, §9.3.9, diagrama), `docs/pre-merge-gates-governance.md`,
  `docs/learning/ci-cd/24-dag-infraestructura.md` (tabla y diagrama del DAG real).
- Banners de "material congelado" en las guías `docs/learning/ci-cd/{02,06,10}` cuyos extractos YAML son de un
  `ci.yml` anterior, en vez de editar ~25 sitios de material didáctico ya desincronizado por deriva estructural.
- La convención y sus **excepciones** quedan escritas como requirements normativos, para que los jobs futuros nazcan
  normalizados y para que nadie intente "arreglar" los 4 nombres atados al ruleset ni "normalizar" el entry, el guard o
  el agregador raíz.

## Non-Goals

- **Renombrar los 4 checks atados al ruleset** (`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`,
  `PR Title Lint`, `DCO`). Ver design.md D2: el beneficio es estético y el riesgo es bloquear `main`.
- **Prefijar los jobs que no pertenecen a ningún substage**: `repo-discovery` (`Detect Changes`),
  `zombie-workflow-guard` (`Zombie Workflow Guard`) y `ci-complete` (`CI Complete`). Ver design.md D6: son 3
  excepciones por rol, enumeradas en el requirement para que no se reporten como inconsistencias.
- Cambiar los `id:` de los jobs. El `name:` es lo que ve el humano; el `id:` es la referencia de los `needs:` y del
  fallo del agregador (design.md D4).
- Editar los extractos YAML congelados de `docs/learning/ci-cd/{02,06,10}` y de
  `docs/ci-cd-pipeline-empresarial.md` (design.md D8).

## Impact

- `.github/workflows/ci.yml` — 11 líneas de `name:`. Ningún `id:`, ningún `needs:`, ningún job nuevo.
- Docs — §3.3.1 nueva + ~15 referencias en 5 ficheros.
- Specs — 2 specs de `openspec/specs/` + 1 delta de change activo, por el renombrado de `sast`.
- `openspec/specs/ci-prebuild-substage-structure` — 2 requirements nuevos (jobs sin bloque enumerados; specs que
  citan nombres de check) y 1 ampliado (el de convención, ahora con la tabla completa de bloques).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ci-prebuild-substage-structure`: amplía el requirement de convención de nombres a todos los bloques de `ci.yml`,
  añade la enumeración de las excepciones por rol, mantiene la excepción de los checks atados al ruleset y añade el
  requisito de actualizar en lockstep toda spec que cite un nombre de job como contexto de ruleset.
