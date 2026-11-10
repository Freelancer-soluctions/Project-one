## Phase 1 — Deny-list y política

- [ ] 1.1 Crear `security/license-policy.md` con el modelo de distribución del ERP, la deny-list confirmada y la justificación por licencia.
- [ ] 1.2 Verificar que `scancode-license-pr-diff` en `.github/workflows/ci.yml` usa `--json-pp` (no `--csv`).
- [ ] 1.3 Confirmar que la deny-list en `dependency-review` config coincide con `security/license-policy.md`.

## Phase 2 — Regla de unknown

- [ ] 2.1 Documentar el SLA de triage para `unknown` (30 días, ticket, escalación).
- [ ] 2.2 Implementar el step de detección de `unknown` en el job (warning en FASE 1).
- [ ] 2.3 Registrar los unknowns en `security/exceptions.yml` cuando se extiende el plazo.

## Phase 3 — Calibración (4 semanas)

- [ ] 3.1 Rastrear los unknowns semana a semana.
- [ ] 3.2 Verificar que no queden unknowns sin resolver después de 4 semanas.

## Phase 4 — Promoción a blocking (gated)

- [ ] 4.1 Modificar el evaluate step (ci.yml L1680-1685) para salir con código non-zero cuando se detectan licencias de la deny-list.
- [ ] 4.2 Quitar `continue-on-error: true` de `scancode-license-pr-diff`.
- [ ] 4.3 Verificar que `scancode-license-pr-diff` ya está en `prebuild-security-complete.needs` (ci.yml L3035). La promoción = quitar COE + hacer evaluate fail + rename.
- [ ] 4.4 Renombrar job para quitar "advisory"/"FASE 1" del nombre.
- [ ] 4.5 Actualizar fila en `docs/learning/quality-gates.md`.

## Validación

- [ ] 5.1 Ejecutar `openspec validate scancode-license --type change` y confirmar sin errores.
- [ ] 5.2 Verificar que `scancode-license-pr-diff` está en `prebuild-security-complete.needs` (ya presente desde Phase 0).
- [ ] 5.3 Verificar que el evaluate step falla (exit non-zero) cuando se detecta una licencia de la deny-list.

## Documentación

- [ ] 6.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
- [ ] 6.2 Actualizar `docs/learning/license-policy.md` con la confirmación de la deny-list por modelo de distribución.
- [ ] 6.3 Implementar mecanismo de tickets para unknown licenses (issue template o automation) y documentar cómo se determina la edad de 30 días.

## Documentación

- [ ] 6.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
- [ ] 6.2 Actualizar `docs/learning/license-policy.md` (si existe) con la confirmación de la deny-list.
