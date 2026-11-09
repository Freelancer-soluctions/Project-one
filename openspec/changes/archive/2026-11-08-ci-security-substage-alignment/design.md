# Design — Alinear substage 2C SECURITY de `ci.yml` con diagrama §23.3

## Context

El bloque security de `ci.yml` (header `# SUBSTAGE 2C: SECURITY`, hoy en L925 de la rama) contiene 6 jobs: `dependency-review`, `secrets`, `scancode-license-pr-diff`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`. Los 3 jobs advisory restantes (`actionlint-advisory` L715, `zizmor-advisory` L760, `typosquat-guarddog` L806) quedaron físicamente fuera del bloque por herencia de la implementación incremental capa-a-capa (`pipeline-config-scan`, `typosquatting-detection`): cada change insertó su job en la zona que le tocaba ese día, y ninguno codificó después la colocación en spec.

El precedente `secret-scanning` (2026-09-25) ya validó el patrón de reubicación física segura: mover `secrets` desde `security.yml` a `ci.yml` sin romper el binding del ruleset, porque los required status checks se vinculan a los `name:` de los jobs, no a su posición en el archivo ni a su workflow de origen.

El diagrama canónico (`docs/ci-cd-pipeline-empresarial.md` §23.3, Stage 2 PRE-BUILD, bloque SECURITY [DD]) lista las 9 capas; la auditoría del 2026-09-30 confirmó que las 9 existen como jobs PR-time en `ci.yml`. GitHub Actions ejecuta jobs por el DAG de `needs`, no por orden de definición: la reubicación es un cambio de legibilidad y governance, no de ejecución.

## Goals / Non-Goals

**Goals**

- Los 9 jobs del diagrama §23.3 viven físicamente dentro del bloque 2C delimitado por headers, en el orden del diagrama.
- El header 2C refleja la realidad (9 jobs, advisory/blocking, `sast` documentado como 2A standalone), mismo patrón que el header 2A del spec.
- El contrato de `needs` del agregador `prebuild-security-complete` queda codificado en spec (hoy solo vive en changes archivados y docs).

**Non-Goals**

- Cambiar la semántica de ningún job (needs/COE/categorías/artifacts/políticas): cada capa tiene su change de origen.
- Mover el job `actionlint` bloqueante de 2B a 2C (decisión 2026-09-30, ver D4).
- Migrar jobs entre workflows: `security.yml`, `scheduled-security.yml` y `security-digest.yml` permanecen como defense-in-depth por trigger (push-main, semanal, digest) — el propio §23.3 los mapea a Stage 3+ / auditoría continua, no a jobs pre-build de PR.
- Promociones FASE 2: gobernadas por los changes de origen de cada capa.

## Decisions

- **D1 — Reubicación física pura (cut-and-paste íntegro de los 3 jobs).** Se corta el bloque exacto de líneas de cada job y se pega tras `containerfile-lint`. Sin re-escritura ni "mejoras" de paso: re-crear los jobs violaría el principio de cambio mínimo y el contrato de los changes de origen (categorías SARIF, artifacts y políticas están spec'd allí). Verificación de preservación semántica: `actionlint` exit 0 post-edición + conteo de jobs estable (50) + greps de unicidad por job id + `git diff --stat` acotado a movimientos (sin líneas nuevas dentro de los jobs salvo el comentario de D6).
- **D2 — Orden dentro del bloque = orden del diagrama §23.3.** `secrets` → `dependency-review` → `scancode-license-pr-diff` → `lockfile-audit` → `checkov-iac` → `containerfile-lint` → `actionlint-advisory` → `zizmor-advisory` → `typosquat-guarddog`. La ordenación relativa de los 6 jobs existentes no cambia (hoy ya están en ese orden salvo `secrets`/`dependency-review`, que se documentan tal cual están); los 3 entrantes cierran el bloque. Alternativa descartada: re-ordenar también los 6 existentes por categoría — churn mayor sin valor de governance y riesgo de L-refs rotas en más docs.
- **D3 — Header 2C actualizado con los 9 jobs + anotación advisory/blocking.** Mismo patrón que el header 2A del spec, que lista `sast` con su nota standalone. Se elimina la referencia muerta a `security.yml` (su responsabilidad PR-time fue absorbida por `ci.yml` desde `secret-scanning`).
- **D4 — `actionlint` bloqueante se queda en 2B (decisión del usuario, 2026-09-30).** El diagrama §23.3 agrupa todo pipeline-config bajo SECURITY; esta implementación lo divide: `actionlint` = lint de sintaxis de workflows (higiene de calidad, substage 2B, `prebuild-quality-complete.needs`); `zizmor` = la capa security de pipeline config (`unpinned-uses` + policies). La desviación se documenta en `docs/CONTEXT-CICD.md` §3.3 y en el propio spec (escenario dedicado). Alternativa descartada: moverlo (delta 15→14 en quality.needs y 3→4 en security.needs; sin cambio neto en merge porque ambos agregadores son required checks; churn en spec + docs sin beneficio).
- **D5 — Codificar el needs-contract del agregador como requirement ADDED.** Hoy `prebuild-security-complete.needs = [dependency-review, secrets, scancode-license-pr-diff]` solo está documentado en changes archivados (`secret-scanning`, `license-compliance`) y en docs; ningún spec lo ancla. El delta lo fija por nombre de job (mismo mecanismo que los requirements de agregadores del spec base y que `sca-lockfile-compliance` usa para su FASE 2), con escenario explícito de que los jobs advisory NO entran en FASE 1.
- **D6 — Comentario de colocación en cada job movido.** Cada job gana una línea de comentario `# change ci-security-substage-alignment (2026-09-30): ubicado en bloque security 2C, orden §23.3` inmediatamente antes de su definición, para que la próxima auditoría de L-refs distinga la posición canónica de la histórica. Es la única línea nueva dentro de la zona movida.
- **D7 — Delta sobre `ci-prebuild-substage-structure`, no capability nueva.** La delimitación de substages es propiedad de esa capability (requirement "Visual substage delimitation" ya existente, hoy con el header 2C obsoleto de 1 job). Crear una capability nueva duplicaría la autoridad sobre la estructura del archivo.
- **D8 — Reubicación de `docs-validation` a 2B quality (incorporada 2026-09-30, post-review).** `docs-validation` es un job de quality (prefijo `Quality:`, change de origen `quality-gates`, advisory fuera de ambos agregadores) que había quedado físicamente al cierre del stage 2, detrás del bloque security — misma familia de dispersión que este change corrige. Decisión del usuario: reubicarlo a 2B (tras `openspec-validate`) doblado en este change. Con ello la región 2C→STAGE 3 contiene exactamente los 9 jobs de security y el escenario "Security block composition" del spec es literalmente verdadero sin excepciones. Reubicación física pura (mismo patrón D1: byte-a-byte verificado) + comentario de trazabilidad + header 2B actualizado (en ci.yml, delta y main spec en lockstep).

## Risks / Trade-offs

- [Diff grande en `ci.yml` (~140 líneas movidas) dificulta el review línea a línea] → Verificación mecánica en tasks: `actionlint` exit 0, conteo de jobs por grep estable, `git diff --color-moved=zebra` para confirmar que el review es de movimientos puros; comentario D6 marca cada job movido.
- [L-refs stale en docs de learning (`pipeline-config-scan.md`, `typosquatting-detection.md` citan posiciones ~L715-806)] → Tareas dedicadas de actualización de refs con grep de verificación; las refs a `containerfile-lint.md` vecinas se revisan en la misma pasada.
- [Un job movido accidentalmente alterado (pérdida de un step o campo)] → D1 exige cut-and-paste íntegro; el task de verificación compara el YAML pre/post con `actionlint` + conteo; el diff debe mostrar los bloques como puros movimientos (+1 comentario por job).
- [Confusión future-dev: `actionlint` en 2B pero `zizmor-advisory` en 2C] → Escenario explícito en el spec + desviación documentada en CONTEXT-CICD §3.3 con la decisión y fecha.
- [El agregador security queda con 3 needs mientras el bloque tiene 9 jobs — aparente inconsistencia] → El nuevo requirement "prebuild-security-complete needs contract" declara explícitamente la asimetría advisory/blocking y remite a los changes de origen para FASE 2.

## Migration Plan

1. Ejecutar la reubicación (grupo de tasks 2), validar con `actionlint` + greps + YAML parse.
2. Actualizar docs de learning y CONTEXT-CICD §3.3 (grupo 3).
3. Validar OpenSpec (`--strict` del change + `--specs --strict` global) y markdownlint de 0 violaciones nuevas.
4. **Rollback**: un solo `git revert` del commit de implementación restaura posiciones y docs (la sesión no commitea sin go-ahead; el revert aplica igual cuando exista el commit).

## Open Questions

- Ninguna abierta que afecte specs, approach o tasks. La fecha del primer run remoto de los jobs weekly (validación pendiente de Docker/CI) es ajena a este change: los jobs no cambian, solo se reubican.
