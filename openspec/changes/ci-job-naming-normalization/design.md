# Design

## Contexto

`ci.yml` tiene 50 jobs repartidos en 4 substage de STAGE 2 (2A GOVERNANCE, 2B CODE QUALITY, 2C SECURITY, 2D UNIT
TESTING), más STAGE 3 BUILD, STAGE 4 POST-BUILD y 6 agregadores. El `name:` de cada job es lo que aparece en la
pestaña Checks del PR: es la interfaz humana del pipeline.

La convención de prefijar por substage ya existe y está mayoritariamente aplicada. Este change no la crea — la
consolida y hace que su excepción sea explícita.

## Estado real antes del cambio

| Substage           | Jobs | Prefijo               | Incumplen                                                                  |
| ------------------ | ---- | --------------------- | -------------------------------------------------------------------------- |
| 2A GOVERNANCE      | 5    | (ninguno)             | `sast`, + los 4 atados al ruleset                                          |
| 2B CODE QUALITY    | 16   | `Quality:`            | 0                                                                          |
| 2C SECURITY        | 9    | `Security:`           | `dependency-review`, `secrets`, `actionlint-advisory` (prefijo equivocado) |
| 2D UNIT TESTING    | 4    | (ninguno)             | 0 (homogéneos entre sí)                                                    |
| STAGE 3 BUILD      | 2    | (ninguno)             | 0 (homogéneos entre sí)                                                    |
| STAGE 4 POST-BUILD | 6    | `Quality:`            | 0                                                                          |
| AGGREGATORS        | 6    | `Prebuild … Complete` | 0                                                                          |

La conclusión del inventario es que el problema no es "falta un prefijo en todas partes" sino **tres excepciones**,
dos por omisión y una por error de clasificación.

## Decisiones

**D1 — Se arreglan las excepciones, no se reescribe la convención.**

La alternativa era prefijar TODO (`Tests: Unit Tests - Client`, `Build: Client`, `Governance: …`) para simetría
visual. Se descartó: son ~100 referencias documentales repartidas entre `docs/ci-cd-pipeline-empresarial.md`
(7.283 líneas), `quality-gates.md` y la spec archivada, y el resultado visual sigue siendo irregular porque
`actionlint-advisory` ocupará la substage SECURITY con un nombre `Security:` igual que sus 6 hermanos pero sin el
dorado de haber nacido ahí. Renombrar todo no produce una convención más limpia: produce más churn.

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

**D5 — Los jobs `if: false` se dejan como están.**

`client-build`, `server-build`, `client-depcheck`, `server-depcheck`, `client-sonarqube`, `server-sonarqube` y `e2e`
no se ejecutan. Sus nombres ya son homogéneos dentro de su grupo. Normalizarlos ahora produce un diff que se
deshace —o se olvida— cuando se activen, que es exactamente la clase de deuda que este change viene a evitar.

## Riesgos

| Riesgo                                                                           | Mitigación                                                              |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Que algún check esté atado a un nombre distinto de los 4 conocidos               | Verificado contra la API del ruleset, no contra la documentación        |
| Que un job renombrado rompa un `needs:`                                          | No se tocan ids ni `needs:` (D4)                                        |
| Que la documentación quede desincronizada y se convierta en la fuente de mentira | Se actualiza en el mismo PR y se verifica con un grep de nombres viejos |

## Open Questions

Ninguna. La decisión sobre los 4 nombres atados la tomó el usuario el 2026-10-03 tras conocer el análisis de riesgo/beneficio:
dejarlos como están y documentar la excepción.
