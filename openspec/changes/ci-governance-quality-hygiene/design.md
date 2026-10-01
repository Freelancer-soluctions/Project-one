# Design

## Context

Los tres targets son de configuración runtime de `ci.yml` (ver proposal.md para motivación y detalle). Restricciones que condicionan el diseño:

- **Corrección de conteo respecto del análisis original**: el pipeline tiene **50 jobs** (regex de job-keys a 2 espacios con indentación exacta), no 54 — un `grep -cE '^  [a-z][a-z0-9-]+:'` infla el conteo con 4 claves de triggers YAML (`pull_request`, `merge_group`, etc.). Ambos cambios de higiene de esta sesión (este y `ci-supply-chain-hygiene`) anclan el método de conteo correcto.
- La geometría de ci.yml es sensible (3 changes recientes; el archivo ya cambió de tamaño durante la sesión). Toda edición parte de snapshot + conteo de método correcto.
- Las specs existentes (`sast-governance-gate`, `ci-prebuild-substage-structure`, `config-correctness`, capabilities de commit-signing) describen **comportamiento**, no el `needs` de estos jobs ni la ubicación de `ROLLOUT_DATE` — verificado grep-a-grep. Por eso este change no produce deltas sobre capabilities existentes.
- Los docs de signing ya registran `ROLLOUT_DATE` como item de limpieza pendiente (05c §"Estado final"), lo que convierte #9 en deuda documentada, no en idea nueva.

## Goals / Non-Goals

**Goals:**

- DAG mínimo: ninguna dependencia sin consumo de datos (especificado para `sast` y `openspec-validate`).
- Constantes de gobernanza visibles: `ROLLOUT_DATE` administrable desde Settings sin editar código.
- Jobs diferidos auditables: convención FASE uniforme, condición de re-activación explícita.

**Non-Goals:**

- Reactivar `server-format-check` o cualquier job `if: false` (la brecha de cobertura del format-check del server se cierra con su propio PR/change, no aquí).
- Tocar el agregador `prebuild-unit-tests-complete` ni el hallazgo #1 (gate inerte) — pertenecen al paquete de 2D testing.
- Pinneo por SHA de actions (#2), fetch-depth (#6), consolidación de actionlint (#7), reusable workflows (#10).
- Cambiar el comportamiento de ningún gate (check de firma, SAST, validate de specs, format-check).

## Decisions

- **D1 — Remoción quirúrgica del `needs`.** Borrar la línea `needs: repo-discovery` de `sast` y `openspec-validate`; nada más cambia en esos jobs. El `if: github.event_name == 'pull_request'` de ambos es auto-contenido (no referencia outputs). Alternativa: dejar el needs "por si acaso" — descartada: la spec nueva prohíbe needs sin consumo, y el costo (arranque serializado) es el que se quiere eliminar.
- **D2 — Fallback inline en la expresión, no step separado de setup.** `ROLLOUT_DATE="${{ vars.SIGNING_ROLLOUT_DATE || '2026-08-01' }}"` dentro del heredoc existente. Alternativas: step `env:` a nivel job (separaría la constante de su punto de uso en el script de ~150 líneas — peor legibilidad); secret (no: es configuración, no credencial); hardcodear dos veces (peor). El operador `||` de expresiones es el mecanismo estándar para defaults (evalúa a fallback solo con null/''/false).
- **D3 — La variable se define en Settings como paso operacional post-merge, no como código.** GitHub no permite declarar repository variables en YAML. Tasks incluye: (a) doc con el paso exacto (Settings → Secrets and variables → Actions → Variables → `SIGNING_ROLLOUT_DATE=2026-08-01`), (b) nota de que el fallback mantiene el comportamiento idéntico hasta entonces. Riesgo de drift variable-vs-fallback se mitiga documentando que el fallback es el valor canónico hasta que la variable exista.
- **D4 — Comentario FASE sin fórmula de change/fecha.** El comentario de `server-format-check` usa la convención de contenido del bloque Security (`FASE 1 (diferido): … FASE 2: re-activar cuando …`) pero sin la fórmula "change X (fecha)" que reservó `ci-security-substage-alignment` para trazabilidad de reubicación física; aquí no hay movimiento. Consistente con D7 de `ci-supply-chain-hygiene`.
- **D5 — Un solo commit atómico post-snapshot.** Snapshot `.tmp/ci.yml.pre-governance-quality-hygiene` + conteo 50 + las 4 ediciones (2 needs, 1 constante, 1 comentario) en un commit revertible. Misma disciplina que `ci-supply-chain-hygiene`.
- **D6 — `docs/learning/pipeline-config-scan.md` NO se toca.** Ese doc cubre actionlint/zizmor (jobs 2C); este change no los altera. Los docs afectados son solo los de firma y gobernanza pre-merge.

## Risks / Trade-offs

- [`vars.SIGNING_ROLLOUT_DATE` no definida y expresión mal escapada en heredoc] → El fallback `'2026-08-01'` mantiene comportamiento idéntico; validación con actionlint + inspección del heredoc renderizado en el primer run (log del job imprime el corte efectivo si el cambio de task lo añade).
- [Quitar needs cambia el orden visual del grafo en el UI de Actions] → Cosmético; el orden de arranque es justamente el objetivo. Los checks del PR y su binding al ruleset no cambian.
- [Comentario FASE de server-format-check queda desalineado si otro change reactiva el job primero] → El comentario incluye la condición de re-activación, así que el próximo actor encuentra la instrucción en el lugar correcto.
- [Drift entre fallback inline y variable en Settings si alguien cambia solo uno] → Doc de task operacional: el fallback es canónico hasta definir la variable; al definirla, la variable gana. El primer run post-merge imprime el corte efectivo (nuevo log line), haciendo visible cuál aplicó.

## Migration Plan

1. Snapshot + conteo (50) → editar ci.yml (2 needs, 1 constante, 1 comentario) en un commit atómico.
2. `actionlint` per-file + `git diff --stat` acotado + conteo estable + `name:` intactos.
3. Docs de firma/pre-merge-gates actualizados en el mismo PR.
4. Post-merge: definir la variable en Settings (paso operacional documentado; opcional e inmediato, el fallback ya da el mismo valor). Rollback: revert del commit único.
