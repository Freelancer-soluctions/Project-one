# Design

## Context

Gate `dependency-review` vive inline en `.github/workflows/ci.yml` L765-787 (substage 2C, `needs: prebuild-security-complete`), corre solo en `pull_request`, con `fail-on-severity: moderate`, `license-check: true`, `vulnerability-check: true`, `allow-ghsas: ""` y sin `continue-on-error` -> blocking. Detalle verificado en `docs/learning/dependency-review.md` (2026-09-25). Motivación completa: ver proposal.md — Why.

Gaps verificados: (a) `quality-gates.md` §2 sin fila `dependency-review`; (b) `license-check: true` sin `allow-licenses`/`deny-licenses` (no impone política); (c) `comment-summary-in-pr` no configurado (default `never`); (d) scope `development` sin evaluar (default `runtime`); (e) `security-events: write` declarado sin uso; (f) Trivy vs `dependency-review` sin documentar como complementarios.

## Goals / Non-Goals

**Goals:**

- Cerrar los 6 gaps de gobernanza documental y de configuración del gate.
- Mantener la taxonomía `blocking` del gate y su coherente con `secret-scanning` / `quality-gates.md`.
- Hacer la política de licencias explícita y auditable.

**Non-Goals:**

- Mover el job a `security.yml` o reescribir el pipeline.
- Cambiar `fail-on-severity` (`moderate` se mantiene).
- Configurar waivers (`allow-ghsas`) — requiere issues con tracking; cambio aparte.
- Cambiar Trivy / `dependency-scan` ni agregar SARIF a la acción (no lo soporta).
- Tocar `required_status_checks` del ruleset de GitHub.

## Decisions

### D1 — Taxonomía: `blocking (PR)`, no `advisory`

`quality-gates.md` §2 usa taxonomía `blocking` / `advisory` (y la variante `blocking (PR) / advisory (scheduled)` para `secrets` / `gitleaks-full-scan`). `dependency-review` es `blocking (PR)`: solo corre en `pull_request`, sin `continue-on-error`, agregado en `needs` de `prebuild-security-complete` -> falla -> `prebuild-security-complete` falla -> `ci-complete` falla -> merge bloqueado. No es advisory: nada absorbe su fallo.

- Alternativa A: fila `blocking` simple -> pierde el matiz PR-only (en push a `main` el job se salta). Elegida la forma `blocking (PR)`, coherente con la fila `secrets` del change `secret-scanning`.
- Alternativa B: marcarlo advisory porque no está en `required_status_checks` -> incorrecto: el ruleset solo enumera governance checks (4 requeridos); el bloqueo real ocurre vía `ci-complete` (único required check), igual que `secrets`.

### D2 — Política de licencias: `deny-licenses` (lista negra) primero, `allow-licenses` como alternativa documentada

`deny-licenses` y `allow-licenses` son mutuamente excluyentes en `actions/dependency-review-action@v5`.

- **Recomendado para este repo: `deny-licenses`** (`GPL-3.0`, `AGPL-3.0`, `SSPL-1.0`, `Proprietary`, `CC-BY-NC-4.0`), alineado con el `LICENSE_DENY_LIST` de `generate-security-digest.mjs` (15 entradas familia GPL/LGPL/AGPL, documentado en `docs/security/SECURITY.md`). Bajo riesgo de roturas: una licencia desconocida/`NOASSERTION` no falla con lista negra.
- **Alternativa `allow-licenses`** (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`, `CC0-1.0`, `Unlicense`, `MPL-2.0`): más estricta, falla ante cualquier licencia fuera de lista. Requiere revisión previa del árbol: `npm ls --depth=0 --json | jq '.dependencies | to_entries[] | .value.license'`.
- La elección y la validación local se documentan en `docs/learning/dependency-review.md` §4.2. Modo solo-auditoría (`warn-only: true`) descartado: el gate ya es blocking por diseño.

### D3 — `quality-gates.md` se actualiza como parte del change (no como doc suelta)

Fila nueva en §2 + registro en la tabla resumen de estado, con la columna de notas apuntando a `ci.yml` L765-787 y al doc canónico `docs/learning/dependency-review.md`. Mismo patrón que la fila `secrets` (change `secret-scanning`). De paso, corregir la inexactitud de `docs/pre-merge-gates-governance.md` §4.12 (afirma default `high`; el default real de la acción es `low`; el repo usa `moderate`, más estricto que el default).

- Alternativa: dejar el gap y no tocar docs -> rechazado: el gap de taxonomía es precisamente uno de los objetivos del change.

## Risks / Trade-offs

- [`comment-summary-in-pr` requiere `pull-requests: write`; en PRs de forks el comentario puede fallar] -> usar `on-failure`; el job NO debe fallar por el comentario (aceptar warning en forks; si resulta ruidoso, degradar a `never` solo para forks).
- [Lista negra de licencias no cubre licencias desconocidas / `NOASSERTION`] -> aceptado y documentado; migrar a `allow-licenses` si se quiere strict.
- [Agregar `development` a `fail-on-scopes` puede bloquear PRs por vulnerabilidades en tooling de build/test] -> decisión explícita documentada; si se agrega, validar primero con un PR de prueba.
- [Fila nueva en `quality-gates.md` puede desincronizarse del pipeline] -> fila referencia ubicación exacta y doc canónico; `openspec validate` + `actionlint` como verificación.

## Migration Plan

1. Docs (`quality-gates.md`, `dependency-review.md`, `pre-merge-gates-governance.md`) -> PR sin cambio de comportamiento del pipeline.
2. Config (`ci.yml`: licencias + `comment-summary-in-pr` + `fail-on-scopes`) -> PR con PR de prueba que confirme el comentario en el PR y la ausencia de falsos positivos de licencia.
3. Rollback: revert del commit de `ci.yml`; los cambios de docs son aditivos.

## Open Questions

- ¿Se incluye `development` en `fail-on-scopes` ahora o en una segunda fase? -> resoluble en la fase de implementación con un PR de prueba; el spec exige que la decisión quede documentada en cualquier caso (no presupone el resultado).
