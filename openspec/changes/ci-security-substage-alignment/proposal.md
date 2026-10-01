# Change: Alinear el substage 2C SECURITY de `ci.yml` con el diagrama §23.3

## Why

El diagrama canónico del pipeline (`docs/ci-cd-pipeline-empresarial.md` §23.3, Stage 2 PRE-BUILD, bloque SECURITY [DD]) lista 9 capas de seguridad que deben correr en el substage pre-build. La auditoría del 2026-09-30 sobre `ci.yml` confirma que **las 9 capas ya existen como jobs PR-time**, pero 3 de ellos están **físicamente dispersos fuera del bloque security**:

| Job disperso          | Línea hoy (rama)                                  | Línea esperada     |
| --------------------- | ------------------------------------------------- | ------------------ |
| `actionlint-advisory` | L715 (tras `actionlint` bloqueante, zona quality) | Bloque 2C security |
| `zizmor-advisory`     | L760                                              | Bloque 2C security |
| `typosquat-guarddog`  | L806 (antes de `# --- Specs Pre-Build ---`)       | Bloque 2C security |

Consecuencias de la dispersión:

- **Violación de la delimitación visual** exigida por el requirement "Visual substage delimitation" de `ci-prebuild-substage-structure`: un lector de `ci.yml` que navegue al header `# SUBSTAGE 2C: SECURITY` no ve 6 de los 9 jobs del diagrama.
- **Orden de ejecución no refleja el orden del diagrama**: `actionlint-advisory`/`zizmor-advisory`/`typosquat-guarddog` corren antes de `openspec-validate` y de los tests, en una zona quality, cuando el diagrama los sitúa en el bloque SECURITY (después de Containerfile lint).
- **Riesgo de repetición**: el precedente `secret-scanning` (2026-09-25) ya resolvió una dispersión idéntica migrando `secrets` desde `security.yml` al bloque 2C de `ci.yml` con wire al agregador; la colocación actual de los 3 jobs advisory fue herencia de la implementación incremental por changes separados (containerfile-lint → pipeline-config-scan → typosquatting-detection), no una decisión de diseño.

Auditoría completa del diagrama vs implementación (todas las 9 capas SECURITY de §23.3):

| Ítem diagrama §23.3     | Job en `ci.yml`                                                                   | Estado                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Secrets Detection       | `secrets` (L980)                                                                  | ✅ inline, blocking, en `needs` del agregador (change `secret-scanning`)                                     |
| SAST 3 capas            | `sast` (L408) + `security.yml` `sast`/`semgrep-full-scan`                         | ✅ implementado (clasificación 2A Governance = decisión documentada 2026-09-06, feedback <2 min; NO se toca) |
| SCA lockfiles           | `lockfile-audit` (L1131) + `lockfile-audit-weekly`                                | ✅ advisory FASE 1 (change `sca-lockfile-compliance`)                                                        |
| Dependency Review       | `dependency-review` (L930)                                                        | ✅ blocking, en `needs`                                                                                      |
| License Compliance dual | `scancode-license-pr-diff` (L1030) + `scancode-license-audit` semanal             | ✅ FASE 1 (change `license-compliance`)                                                                      |
| IaC Scanning            | `checkov-iac` (L1182) + `checkov-iac-weekly`                                      | ✅ advisory FASE 1 (change `iac-scanning`)                                                                   |
| Containerfile lint      | `containerfile-lint` (L1221) + weekly                                             | ✅ advisory FASE 1 (change `containerfile-lint`)                                                             |
| Pipeline config scan    | `actionlint` (L686, quality) + `actionlint-advisory` + `zizmor-advisory` + weekly | ⚠️ implementado pero disperso (este change)                                                                  |
| Typosquatting           | `typosquat-guarddog` + weekly                                                     | ⚠️ implementado pero disperso (este change)                                                                  |

Además, el header de sección `# SUBSTAGE 2C: SECURITY — dependency-review (+ security.yml when enabled)` está **obsoleto** (data del change `ci-prebuild-substage-structure`, antes de que el substage creciera a 9 jobs): menciona solo 1 job y una referencia muerta a security.yml (cuyo job `secrets` migró a `ci.yml` y cuya responsabilidad PR-time quedó cubierta).

**Fuera de alcance (explícito):**

- NO se mueve el job bloqueante `actionlint` (L686) desde quality a security: es lint de sintaxis de workflows (higiene de calidad); la capa security de pipeline config es zizmor (`unpinned-uses`). Decisión 2026-09-30. Queda como desviación documentada del diagrama (que agrupa todo pipeline-config bajo SECURITY) en `docs/CONTEXT-CICD.md` §3.3.
- NO se modifica `security.yml` ni `scheduled-security.yml` ni `security-digest.yml`: son las capas defense-in-depth (push-main, semanal, digest) que el propio §23.3 mapea a Stage 3+ / auditoría continua, no a jobs pre-build de PR. No migrar ningún job de ellos a `ci.yml`.
- NO se cambia ningún `needs`, `continue-on-error`, `category` SARIF, artifact ni política de FASE 2: los 3 jobs advisory siguen FUERA de `prebuild-security-complete.needs` (su promoción a FASE 2 ya está especificada por sus changes de origen).
- NO se toca el job `sast` ni su clasificación 2A (requirement dedicado en `ci-prebuild-substage-structure`).

## What Changes

1. **Reubicación física (cut-and-paste íntegro) de 3 jobs** en `.github/workflows/ci.yml`: `actionlint-advisory`, `zizmor-advisory` y `typosquat-guarddog` se mueven al final del bloque security 2C, tras `containerfile-lint` (y tras `checkov-iac`, respetando el orden del diagrama: Secrets → Dependency Review → License → SCA → IaC → Containerfile → Pipeline config → Typosquatting). Sin cambios dentro de los jobs: mismos `id`, `name:`, `needs: [repo-discovery]`, `if`, `continue-on-error: true`, steps, categorías y artifacts.
2. **Header 2C actualizado** a la lista real de 9 jobs del diagrama, con anotación advisory/blocking y la clasificación 2A de `sast` documentada (mismo patrón que el header 2A del spec).
3. **Delta spec sobre `ci-prebuild-substage-structure`**: (a) el requirement "Visual substage delimitation" pasa a codificar el header 2C con los 9 jobs; (b) nuevo requirement "Security substage 2C job placement" que fija la colocación física de los 9 jobs (ids + orden + pertenencia al bloque) y declara el `actionlint` bloqueante como perteneciente a 2B; (c) nuevo requirement que codifica el contrato actual del `needs` del agregador `prebuild-security-complete` = `[dependency-review, secrets, scancode-license-pr-diff]` (hoy no anclado por ningún spec; lo documentan changes ya archivados).
4. **Comentario de colocación**: cada job movido conserva/gana un comentario `# change ...: bloque security 2C, orden §23.3` con la fecha de la reubicación, para que la próxima auditoría L-ref la identifique.
5. **Docs de learning**: actualización de L-refs stale causadas por el movimiento (los jobs pasan de ~L715-806 a ~L1270-1360): `pipeline-config-scan.md`, `typosquatting-detection.md`, `containerfile-lint.md` (líneas vecinas de referencia) y nota de orden en `quality-gates.md` §2 (filas de los 3 jobs ganan "ubicado en bloque 2C"). `docs/CONTEXT-CICD.md` §3.3 ya lista los jobs con su semántica; se reordena la tabla al orden físico nuevo y se documenta la desviación `actionlint`-en-quality.
6. **Reubicación de `docs-validation` a 2B quality (D8, incorporada post-review 2026-09-30):** el job de markdownlint (prefijo `Quality:`, change de origen `quality-gates`, advisory) había quedado físicamente al cierre del stage 2, detrás del bloque security — misma familia de dispersión. Mismo patrón cut-and-paste con verificación byte-a-byte; con ello la región 2C→STAGE 3 contiene exactamente los 9 jobs de security y el header 2B queda actualizado (ci.yml + delta + main spec en lockstep).

## Capabilities

### Modified Capabilities

- `ci-prebuild-substage-structure`: el requirement "Visual substage delimitation" se actualiza (header 2C con los 9 jobs reales y `sast` documentado como 2A standalone); se añaden los requirements "Security substage 2C job placement" (colocación física de los 9 jobs en orden §23.3) y "prebuild-security-complete needs contract" (needs exactos del agregador security, hoy no codificados).

## Impact

- **Código**: solo `.github/workflows/ci.yml` (reordenar ~140 líneas de definiciones de jobs; cero cambios semánticos). Verificación: `actionlint` exit 0, YAML parseable, conteo de jobs estable (50), greps de unicidad (cada job id 1 vez), `openspec validate --specs --strict` 117/117 → 118/118 si el delta crea capability nueva (no: modifica la existente).
- **Specs**: `openspec/specs/ci-prebuild-substage-structure/spec.md` gana 2 requirements y actualiza 1 (header 2C). Ningún otro spec menciona la ubicación física de los 3 jobs (verificado: `pipeline-config-scan`, `typosquatting-detection`, `containerfile-lint`, `sca-lockfile-compliance` solo especifican comportamiento, categorías y artifacts, no líneas de código).
- **Docs**: L-refs stale en ≤4 docs de learning + §3.3 de CONTEXT-CICD; markdownlint 0 violaciones nuevas (verificación join diff-líneas × lint-líneas).
- **Riesgos**: bajo — el YAML no cambia semánticamente; GitHub Actions no depende del orden de definición de jobs (solo del DAG de `needs`); los status checks (`Secret Detection`, etc.) no se renombran; el agregador no cambia. Riesgo mayor real: referencias de línea en docs (mitigado con tareas dedicadas).
- **Sin commits** en este change (política de la sesión: esperan go-ahead del usuario con firma SSH).
