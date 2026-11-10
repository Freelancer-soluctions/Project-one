# Design — prebuild-security-aggregator-strict

## Decisiones

1. **Strict aggregator via jq over `needs`.** El agregador evalúa `echo "$NEEDS" | jq -r 'to_entries[] | select(.value.result != "success") | ...'` y falla si hay alguna entrada. El valor de `needs` se pasa por `env: NEEDS: ${{ toJSON(needs) }}`, nunca interpolado en el script (PRD regla #5).
2. **`if: always()` obligatorio.** Sin él, si un job falla el agregador se salta y el check queda sin resultado.
3. **Anti-skip scoped, no genérico.** Solo `secrets`, `dependency-review` y `scancode-license-pr-diff` (cuando hay cambios ACMR) fallan al saltarse en eventos `pull_request`. Los jobs condicionales (Hadolint, IaC, typosquatting, actionlint-advisory, zizmor-advisory, lockfile-audit) son authorized-skip en eventos no-PR (ver decisión 7). Un `contains(needs.*.result, 'skipped')` genérico rompería los jobs que legítimamente se saltan por path-scoping o por evento.
4. **Nombre congelado.** `Prebuild Security Complete` se mantiene exacto para no romper el binding del ruleset (cuando se aplique).
5. **No se promueven jobs advisory a blocking en este change.** Los jobs siguen con `continue-on-error: true` donde lo tienen. Este change solo hace el agregador estricto y los cablea. La promoción a blocking es Fase 1-5, cada una en su propio change.
6. **No se cambia el ruleset.** El binding de `Prebuild Security Complete` como required check se hace como task separada cuando el owner lo decida (patrón `secret-scanning` task 6.2, declinada por el owner el 2026-11-08).
7. **Event-scoping (resuelve C1 del review).** La regla estricta `skipped ≠ success` se aplica solo en eventos `pull_request`. En `merge_group` y `workflow_dispatch`, los 8 jobs que solo corren en PR (todo excepto `secrets`) se saltan por diseño; el agregador trata esos skips como autorizados por tipo de evento (event guard en el step de jq). Esto evita que el agregador se ponga rojo en cada ejecución de merge queue o manual. Los jobs que corren en todos los eventos (`secrets` en merge_group, y los que no tienen gate de evento) siguen sujetos a la regla estricta.
8. **Canal de autorización de skip (resuelve C2 del review).** La autorización de skip para jobs condicionales se calcula dentro del step del agregador (checkout + `git diff --name-only` para detectar cambios en manifiestos/lockfile/infra), NO mediante un job adicional en `needs`. Esto preserva el contrato "exactly 9" (PRD rule 3) sin añadir un job de change-detection. El step del agregador evalúa: si `github.event_name == 'pull_request'` y el job está skipped, verificar si el cambio relevante (path) está presente; si no está presente, el skip es autorizado.
9. **PRD rule 4 (conditionals inside workflow, not workflow-level `paths:`).** Verificado: `ci.yml` no usa `paths:` a nivel de workflow para estos jobs (solo `if:` a nivel de job). Sin cambios necesarios.
10. **Job-level `continue-on-error` normaliza failure.** Los 6 jobs advisory tienen `continue-on-error: true`, lo que normaliza `failure` a `success` en `needs.*.result` (quality-gates.md L26). Por eso la escenario "advisory job failure fails the aggregator" solo se activa cuando el origin change quita COE. Este change no quita COE (non-goal).

## Cambios en ci.yml

- Bloque `prebuild-security-complete` (~L3028): `needs: [dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog]`.
- Step de evaluación: `if: always()`, `env: NEEDS: ${{ toJSON(needs) }}`, jq que falla con `failure`, `cancelled` y `skipped` no autorizado.
- Anti-skip guards por job (solo los tres indicados).

## No se toca

- `continue-on-error` de ningún job (sigue en Fase 1-5).
- `security.yml` ni `scheduled-security.yml` (fuera de scope de Phase 0).
- El ruleset de GitHub.
- `security/exceptions.yml` ni SLA doc (changes posteriores).

## Orden de aplicación

1. Este change (agregador estricto + wiring).
2. `pipeline-config-scan` (Phase 1: zizmor + actionlint blocking).
3. `containerfile-lint` (Phase 5: Hadolint blocking).
4. `iac-scanning` (Phase 5: Checkov blocking si hay IaC).
5. `typosquatting-detection` (Phase 5: GuardDog blocking).
6. `sca-lockfile-compliance` (Phase 3: lockfile-audit blocking).
7. `scancode-license` (Phase 4: licenses blocking).
