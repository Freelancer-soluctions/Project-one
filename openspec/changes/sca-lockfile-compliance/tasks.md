## Phase 1 — Verificación y condicionamiento

- [ ] 1.1 Verificar que `lockfile-audit` en `.github/workflows/ci.yml` tiene `needs: repo-discovery` y condición de lockfile changes.
- [ ] 1.2 Añadir step de verificación de lockfile obligatorio (falla si `package.json` cambia sin `package-lock.json`).
- [ ] 1.3 Añadir step de OSV-Scanner (`osv-scanner --lockfile=package-lock.json`) advisory con `continue-on-error: true`.

## Phase 2 — Calibración (2-4 semanas)

- [ ] 2.1 Registrar la tasa de falsos positivos por semana durante la calibración.
- [ ] 2.2 Clasificar los hallazgos ruidosos y ajustar `--audit-level` si es necesario.
- [ ] 2.3 Calcular la tasa de falsos positivos al final de cada semana.

## Phase 3 — Promoción a blocking (gated)

- [ ] 3.1 Quitar `continue-on-error: true` de `lockfile-audit`.
- [ ] 3.2 Añadir `lockfile-audit` al `needs` de `prebuild-security-complete`.
- [ ] 3.3 Renombrar job para quitar "advisory"/"FASE 1" del nombre.
- [ ] 3.4 Actualizar fila en `docs/learning/quality-gates.md` de `advisory (PR, fase 1)` a `blocking (PR)`.

## Validación

- [ ] 4.1 Ejecutar `openspec validate sca-lockfile-compliance --type change` y confirmar sin errores.
- [ ] 4.2 Verificar que `lockfile-audit` no está en `prebuild-security-complete.needs` antes de la promoción.
- [ ] 4.3 Verificar que el step de OSV-Scanner es advisory.

## Documentación

- [ ] 5.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
- [ ] 5.2 Documentar la limitación de OSV-Scanner (no EPSS/KEV nativo) en la doc de la capa.
