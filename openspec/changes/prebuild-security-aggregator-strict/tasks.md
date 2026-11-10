## Phase 0 — Agregador estricto (G7)

- [ ] 1.1 Verificar la ubicación exacta del bloque `prebuild-security-complete` en `.github/workflows/ci.yml` y su `needs` actual (`[dependency-review, secrets, scancode-license-pr-diff]`). Confirmar con `grep -n "prebuild-security-complete:" ci.yml`.
- [ ] 1.2 Actualizar `needs` del agregador para incluir los 9 jobs de substage 2C: `[dependency-review, secrets, scancode-license-pr-diff, lockfile-audit, checkov-iac, containerfile-lint, actionlint-advisory, zizmor-advisory, typosquat-guarddog]`.
- [ ] 1.3 Asegurar `if: vars.CI_MINIMAL != 'true' && always()` en el agregador (ya presente; verificar).
- [ ] 1.4 Reemplazar el step de evaluación por la versión estricta: `env: NEEDS: ${{ toJSON(needs) }}` + jq que falla con `failure`, `cancelled` y `skipped` no autorizado.
- [ ] 1.5 Añadir anti-skip guard para `dependency-review`: fallar si `needs.dependency-review.result == 'skipped' && github.event_name == 'pull_request'`.
- [ ] 1.6 Añadir anti-skip guard para `scancode-license-pr-diff`: fallar si `needs.scancode-license-pr-diff.result == 'skipped' && github.event_name == 'pull_request' && <ACMR changes>`.
- [ ] 1.7 Añadir change-detection outputs para los jobs condicionales (`lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`): publicar una salida `skip-authorized` que el agregador consulte antes de tolerar `skipped`.
- [ ] 1.8 Verificar que el agregador sigue teniendo `name: 'Prebuild Security Complete'` (nombre congelado para el ruleset).

## Validación

- [ ] 2.1 Ejecutar `openspec validate prebuild-security-aggregator-strict` y confirmar sin errores.
- [ ] 2.2 Parsear `ci.yml` con `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` y verificar que `prebuild-security-complete.needs` tiene exactamente 9 entradas.
- [ ] 2.3 Verificar con grep que el step de evaluación usa `env: NEEDS:` y no interpola `${{ }}` en el script.
- [ ] 2.4 Ejecutar `actionlint` (o el job `validate-pipeline`) sobre `ci.yml` y confirmar sin errores.
- [ ] 2.5 Smoke test: abrir un PR de prueba y verificar que `Prebuild Security Complete` reporta success cuando todos los jobs pasan, y failure cuando un job falla (caso negativo).

## Documentación

- [ ] 3.1 Actualizar `docs/learning/quality-gates.md` §2 para reflejar el nuevo `needs` contract (9 jobs) y la política de anti-skip scoped por evento.
- [ ] 3.2 Reescribir las filas FASE-2 de `quality-gates.md` (L27-34) que actualmente dicen "NO está en `needs` del agregador en FASE 1; FASE 2: añadir a `prebuild-security-complete.needs` tras 2-4 semanas" — ahora que los jobs están cableados, actualizar a "cableado al agregador (Phase 0); promoción a blocking en Fase 1-5".
- [ ] 3.3 Anotar en `docs/CONTEXT-CICD.md` que el agregador ahora es estricto (Phase 0) y que la promoción de jobs advisory a blocking es Fase 1-5.

## Gobernanza (opcional, pendiente de decisión del owner)

- [ ] 4.1 (Opcional, requiere decisión del owner) Añadir `Prebuild Security Complete` al `required_status_checks` del ruleset 21227644, con `github-actions` (integration_id 15368) como fuente esperada. Patrón: `secret-scanning` task 6.2 (declinada por el owner el 2026-11-08). Reabrir cuando el owner lo decida.
