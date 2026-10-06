# Proposal

## Why

Tres deficiencias de higiene en la configuración runtime de `ci.yml` (jobs de los substages 2A governance y 2B quality), identificadas en el análisis externo del pipeline (2026-09-30) y verificadas contra el repo y la documentación oficial de GitHub Actions:

1. `sast` (2A) y `openspec-validate` (2B) declaran `needs: repo-discovery` sin consumir ninguno de sus outputs — la dependencia solo añade espera en el DAG (arrancan tras el path-filter en vez de en paralelo desde t=0), y el propio reporte de análisis la señala como dependencia sin razón de datos.
2. La fecha de corte del grandfathering de firma (`ROLLOUT_DATE="2026-08-01"`) vive enterrada en el heredoc bash del job `verify-signatures` (2A) — invisible en Settings, y con items de limpieza pendientes registrados en docs (`05c-ci-commit-signing-implementation.md` §"Estado final" y post-PR #101) que dependen de que alguien recuerde que existe ahí.
3. `server-format-check` (2B, `if: false`) usa el comentario genérico "Disabled for incremental CI" sin la convención FASE 1/FASE 2 (con condición de re-activación) que el resto del pipeline usa consistentemente en el bloque Security — el estado diferido queda sub-documentado y puede persistir por olvido.

## What Changes

- **#8 — needs mínimos**: remover `needs: repo-discovery` de `sast` y `openspec-validate`. Ambos corren incondicionalmente en `pull_request` (sin filtrar por outputs), no leen outputs, y ninguna spec exige la dependencia (`sast-governance-gate` y `ci-prebuild-substage-structure` describen comportamiento, no el `needs`). Ganancia: ambos arrancan en paralelo con `repo-discovery` (segundos menos de wall-clock por PR).
- **#9 — ROLLOUT_DATE visible y configurable**: migrar la constante del heredoc a repository variable `vars.SIGNING_ROLLOUT_DATE` con fallback inline (`${{ vars.SIGNING_ROLLOUT_DATE || '2026-08-01' }}`), preservando el comportamiento de grandfathering exactamente igual (comparación `author.date < cutoff`) y documentando la variable en el repo. Los docs que citan el literal (`CONTEXT-CICD.md` §firma, `pre-merge-gates-governance.md`, `05c-ci-commit-signing-implementation.md`) se actualizan.
- **#5 — convención de comentarios FASE en jobs diferidos**: el comentario de `server-format-check` pasa a la convención del bloque Security (`FASE 1 (diferido): … — FASE 2: re-activar cuando …`), documentando la condición de re-activación. Solo comentario — sin cambio de `if`, `name:`, ni lógica.
- No se mueve ningún job, no cambian agregadores, `name:`, `permissions` ni substages. El conteo de jobs queda estable.

## Capabilities

### New Capabilities

- `ci-runtime-config-hygiene`: higiene de configuración runtime de `ci.yml` — (a) jobs que no consumen outputs de `repo-discovery` no le declaran `needs` (especificado para `sast` y `openspec-validate`); (b) los valores de configuración con vida más allá del PR (como la fecha de corte del grandfathering de firma) se declaran en repository variables (`vars`) con fallback inline y visibilidad en Settings; (c) todo job con `if: false` documenta su convención de fase diferida (FASE 1 con condición de re-activación) alineada con la convención del bloque Security.

### Modified Capabilities

- (ninguna — los requirements existentes de `sast-governance-gate`, `ci-prebuild-substage-structure` y `config-correctness` describen comportamiento que no cambia: sast/openspec-validate siguen corriendo en todo `pull_request` y agregándose igual; el gate de formato sigue siendo el mismo job con la misma lógica)

## Impact

- **Código**: `.github/workflows/ci.yml` (3 jobs tocados: `sast`, `openspec-validate` — 1 línea cada uno; `verify-signatures` — 1 constante → expresión con fallback; `server-format-check` — 1 comentario). Ninguno renombrado ni movido.
- **Config de repo**: crear la variable `SIGNING_ROLLOUT_DATE` en Settings → Secrets and variables → Actions (valor `2026-08-01`) — paso operacional posterior al merge, documentado en tasks; hasta entonces el fallback inline mantiene el comportamiento.
- **Docs**: `docs/CONTEXT-CICD.md` (§firma, cita del literal), `docs/pre-merge-gates-governance.md` (snippet del script), `docs/learning/ci-cd/05c-ci-commit-signing-implementation.md` (fila "Pendiente" del estado final).
- **Specs**: 1 capability nueva (`ci-runtime-config-hygiene`); 0 deltas sobre capabilities existentes (verificado: ninguna spec exige el `needs` de estos jobs, menciona `ROLLOUT_DATE`, ni regula comentarios de jobs diferidos).
- **Riesgo principal**: bajo — el único cambio de comportamiento observable es el orden de arranque (paralelismo) en #8; #9 y #5 son neutrales al comportamiento si la variable existe o el fallback aplica.
