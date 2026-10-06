# Design

## Contexto

`ci.yml` tiene 50 jobs repartidos en 4 substage de STAGE 2 (2A GOVERNANCE, 2B CODE QUALITY, 2C SECURITY, 2D UNIT
TESTING), más STAGE 3 BUILD, STAGE 4 POST-BUILD, 6 agregadores, un job ENTRY y un job GUARD. El `name:` de cada job
es lo que aparece en la pestaña Checks del PR: es la interfaz humana del pipeline.

La convención de prefijar por bloque ya existía y estaba aplicada en 2B, 2C, STAGE 4 y los agregadores. Este change la
**extiende a todos los bloques que se habían quedado fuera** — notably 2D UNIT TESTING y STAGE 3 BUILD, que eran los
incumplimientos más visibles porque el developer ve `Unit Tests - Client` junto a `Quality: Client Lint` sin poder
saber que son capas distintas — y hace explícita la excepción de los checks atados al ruleset.

## Estado real antes del cambio

Inventario de los 50 jobs por bloque físico en `ci.yml`, con el prefijo que declaraba cada uno:

| Bloque físico            | Jobs | Prefijo declarado     | Incumplen                                                                                                   |
| ------------------------ | ---- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| ENTRY                    | 1    | (ninguno)             | n/a\* — no pertenece a ningún substage                                                                      |
| SUBSTAGE 2A GOVERNANCE   | 5    | (ninguno)             | `sast` + los 4 atados al ruleset                                                                            |
| SUBSTAGE 2B CODE QUALITY | 16   | `Quality:`            | 0                                                                                                           |
| SUBSTAGE 2D UNIT TESTING | 4    | (ninguno)             | **4/4**: `Unit Tests - Client`, `Unit Tests - Server`, `Integration Tests - Server`, `Smoke Tests - Server` |
| SUBSTAGE 2C SECURITY     | 9    | (Security en 6 de 9)  | `dependency-review`, `secrets`, `actionlint-advisory` (prefijo equivocado)                                  |
| STAGE 3 BUILD            | 2    | (ninguno)             | **2/2**: `Build - Client`, `Build - Server`                                                                 |
| STAGE 4 POST-BUILD       | 6    | `Quality:`            | 0                                                                                                           |
| TESTS post-build         | 1    | (ninguno)             | `e2e`                                                                                                       |
| SUBSTAGE AGGREGATORS     | 5    | `Prebuild … Complete` | 0                                                                                                           |
| AGGREGATOR raíz          | 1    | `CI Complete`         | n/a\* — por definición no pertenece a un substage                                                           |
| GUARDS                   | 1    | (ninguno)             | n/a\* — aserción transversal                                                                                |

\* No es un incumplimiento: son jobs **por rol**, no por substage. Ver D6.

**11 jobs renombrados en total**, en dos pasadas el mismo día (2026-10-03): 3 de SECURITY en el primer commit
(`ece67e3c`), 8 en la ampliación de alcance que atiende la petición del usuario — "aún veo jobs sin normalizar, en
particular los de test".

## Decisiones

**D1 — Se normalizan los incumplimientos, no se reescribe la convención.**

El `name:` es lo que el developer lee antes de mergear. Un job de test que se llama `Unit Tests - Client` junto a
`Quality: Client Lint` no permite saber que son capas distintas del pipeline. Se añade el prefijo que falta en vez de
sustituir la convención por otra.

**D2 — Los 4 checks atados al ruleset NO se renombran.**

El ruleset 21227644 ("Require signed commits", `enforcement: active`) exige exactamente estos contexts:

| Context                              | Job                 |
| ------------------------------------ | ------------------- |
| `Verify Commit Signatures`           | `verify-signatures` |
| `Commit Lint (Conventional Commits)` | `commit-lint`       |
| `PR Title Lint`                      | `pr-title-lint`     |
| `DCO`                                | `dco`               |

El match es por **cadena exacta** contra el `name:` del job. Si el nombre cambia y el ruleset no, el check requerido
nunca se emite y el PR queda bloqueado indefinidamente con `Expected — Waiting for status to be reported`, un
mensaje que no sugiere en absoluto que el problema sea un nombre. Si se actualiza el ruleset primero y el push
falla, el fallo es simétrico y además afecta a `main` para todo el equipo, porque el ruleset protege la rama.

La protección clásica de `main` tiene `required_status_checks.contexts: []`, así que **no hay ningún otro binding**:
fuera de estos 4, renombrar es seguro.

_Beneficio de renombrarlos:_ que en la UI se lean `Governance: DCO` en lugar de `DCO`.
_Costo:_ la posibilidad de bloquear el merge de todo el equipo.
Se decide no hacerlo, y **se escribe la excepción** (D3) para que conste por qué.

**D3 — La excepción del ruleset se documenta como requirement, no como nota.**

Un comentario en el YAML se pierde; un requirement normativo sobrevive al archivo y aparece en
`openspec validate`. El requirement declara explícitamente que esos 4 nombres son intocables mientras el ruleset los
ligue, para que un cambio futuro de normalización los trate como caso conocido y no como descuido.

**D4 — Se cambia `name:`, nunca `id:`.**

El `id:` es la clave que referencian los `needs:` del agregador y los informes de fallo. `prebuild-unit-tests-complete.needs`
contiene ids, no nombres. Tocar ids sería un cambio de contrato (y la spec `ci-prebuild-substage-structure` lo fija),
sin ningún beneficio visible: el developer ve el `name:`, nunca el `id:`.

**D5 — `sast` SÍ se renombra, y sus 3 specs se actualizan en lockstep.**

Renombrar `sast` a `Governance: SAST (Semgrep)` tiene un coste que no tenían los otros: las specs
`sast-governance-gate` y `ruleset-expansion` citan literalmente `"SAST (Semgrep)"` como el **contexto que un admin
añadirá al ruleset en el paso manual F2** para volver el gate bloqueante. Renombrar sin actualizar esas specs dejaría
un manual de F2 que dice añadir un contexto que ya no existe.

Decisión del usuario (2026-10-03): renombrar y actualizar las 3 specs en lockstep — `sast-governance-gate`,
`ruleset-expansion` y el delta de `ci-runtime-config-hygiene` del change `ci-governance-quality-hygiene` (que declara
`name: SAST (Semgrep)` como invariante). El contexto de F2 pasa a ser `Governance: SAST (Semgrep)`.

Es seguro porque `sast` **no está en el ruleset hoy** (verificado contra la API: exige solo los 4 de D2), así que no
hay ningún binding que romper. La nota Regla 8 de `CONTEXT-CICD.md` §9.3.9 se reescribe para dejar constancia de que
el nombre a enlazar en F2 es el nuevo.

**D6 — El esquema es "prefijo del bloque", y los jobs sin bloque se documentan como excepción.**

Esquema aplicado a los 11 jobs renombrados:

| Bloque           | Prefijo       | Jobs renombrados                                                                                                                                                       |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2A GOVERNANCE    | `Governance:` | `SAST (Semgrep)` → `Governance: SAST (Semgrep)`                                                                                                                        |
| 2D UNIT TESTING  | `Tests:`      | `Unit Tests - Client` → `Tests: Unit - Client`; `Unit Tests - Server` → `Tests: Unit - Server`                                                                         |
| 2D (post-build)  | `Tests:`      | `Integration Tests - Server` → `Tests: Integration - Server`; `Smoke Tests - Server` → `Tests: Smoke - Server`                                                         |
| 2C SECURITY      | `Security:`   | `Dependency Review` → `Security: Dependency Review`; `Secret Detection` → `Security: Secret Detection`; `Quality: ActionLint Advisory (SARIF, FASE 1)` → `Security: …` |
| STAGE 3 BUILD    | `Build:`      | `Build - Client` → `Build: Client`; `Build - Server` → `Build: Server`                                                                                                 |
| TESTS post-build | `Tests:`      | `E2E Tests` → `Tests: E2E`                                                                                                                                             |

El criterio es _el prefijo nombra el bloque donde el job está definido en el YAML_, no la catégorie funcional:
`client-coverage` está en STAGE 4 POST-BUILD y por eso lleva `Quality:`, no `Tests:`, aunque ejecute tests.

Quedan **cuatro categorías de jobs sin prefijo de bloque, todas legítimas**:

1. **Los 4 atados al ruleset** (D2/D3).
2. **ENTRY**: `repo-discovery` (`Detect Changes`) es el path-filter que decide qué corre; es anterior a todos los
   substage.
3. **GUARDS**: `zombie-workflow-guard` (`Zombie Workflow Guard`) es una aserción transversal sobre el propio repo.
4. **El agregador raíz**: `ci-complete` (`CI Complete`) es el check que agrega; por definición no pertenece a un
   substage. Los agregadores de substage sí llevan `Prebuild <Substage> Complete`.

Se escribe en el requirement y en `CONTEXT-CICD.md` §3.3.1 para que un job futuro sin prefijo se evalúe contra estas
cuatro categorías y no se reporte como inconsistencia.

**D7 — Los jobs `if: false` SÍ se renombran.**

`client-build`, `server-build` y `e2e` no se ejecutan. La primera versión de este design (D5 de la versión previa)
dejó los `if: false` sin tocar con el argumento de que normalizarlos "produce un diff que se deshace cuando se
activen". Se revirtió: el argumento era débil frente al coste real de la alternativa. Un check deshabilitado cuyo
nombre miente sobre su bloque se reactiva tarde y mal, porque el nombre es lo primero que lee quien lo activa. El
coste de renombrar un job deshabilitado es **cero** — no hay check emitido cuyo nombre pueda cambiar — mientras que el
coste de dejarlo inconsistente aparece justo en el momento de la activación, cuando el nombre es la única guía que
tiene el developer. `server-format-check`, `client-depcheck`, `server-depcheck`, `client-sonarqube` y `server-sonarqube`
ya tenían prefijo correcto y no se tocan.

**D8 — Los extractos YAML congelados en docs/learning no se editan; se bannerizan.**

`docs/learning/ci-cd/{02,06,10}-*.md` contienen extractos de un `ci.yml` anterior (el path-filter se llamaba `changes`
con outputs `frontend`/`backend`; hoy es `repo-discovery` con `client`/`server`). Editar 8 nombres en ~25 sitios de
material que ya está desincronizado por deriva estructural daría una falsa impresión de vigencia. Se añade un banner
en cada guía que declara que los extractos son material didáctico congelado y que el estado real está en
`CONTEXT-CICD.md` §3.3/§3.3.1. `docs/learning/ci-cd/24-dag-infraestructura.md` **sí** se actualiza: sus tablas
declaran "jobs habilitados que SÍ corren hoy" y su diagrama es el mapa del DAG real.
`docs/ci-cd-pipeline-empresarial.md` tampoco se edita (ya declarado en la versión previa: extractos hipotéticos de
workflows de ejemplo).

## Gotcha técnico

Un `name:` con `:` sin comillas rompe el YAML. `actionlint` lo reporta como
`Nested mappings are not allowed in compact mappings (948:11)`. Los 11 nombres llevan comillas simples:
`name: 'Tests: Unit - Client'`.

## Riesgos

| Riesgo                                                                           | Mitigación                                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Que algún check esté atado a un nombre distinto de los 4 conocidos               | Verificado contra la API del ruleset, no contra la documentación             |
| Que un job renombrado rompa un `needs:`                                          | No se tocan ids ni `needs:` (D4)                                             |
| Que un job deshabilitado se renombre y alguien compare contra el check histórico | Los `if: false` no emiten check; no hay binding roto (D7)                    |
| Que el paso manual F2 de SAST cite un contexto que ya no existe                  | Las 2 specs que citan el nombre se actualizan en lockstep (D5)               |
| Que la documentación quede desincronizada y se convierta en la fuente de mentira | Se actualiza en el mismo PR y se verifica con un grep de nombres viejos      |
| Que un banner de "material congelado" envejece y oculte deriva nueva             | El banner apunta a `CONTEXT-CICD.md` §3.3/§3.3.1 como fuente única de verdad |

## Open Questions

Ninguna. Dos decisiones las tomó el usuario el 2026-10-03: (a) esquema por bloque con ENTRY/GUARDS/agregadores como
excepciones documentadas, y (b) renombrar `sast` asumiendo el coste de actualizar las 3 specs que citan su nombre.
