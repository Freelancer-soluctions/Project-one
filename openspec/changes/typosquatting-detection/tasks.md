## Phase 1 — Condicionamiento y verificación

- [ ] 1.1 Verificar que `typosquat-guarddog` en `.github/workflows/ci.yml` tiene `if: needs.repo-discovery.outputs.manifests == 'true'` (o equivalente). Si no, añadirlo.
- [ ] 1.2 Verificar que `guarddog-weekly` en `scheduled-security.yml` está intacto (advisory, `continue-on-error: true`).
- [ ] 1.3 Confirmar que el wrapper `scripts/guarddog-verify.sh` está versionado y ejecutable, con `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false`.

## Phase 2 — Calibración (2-4 semanas)

- [ ] 2.1 Registrar la tasa de falsos positivos por semana durante la calibración (paquete, regla, motivo del FP, fecha).
- [ ] 2.2 Clasificar los hallazgos ruidosos en `scripts/guarddog-verify.sh` con exclusiones justificadas (qué regla, por qué, hasta cuándo).
- [ ] 2.3 Evaluar Socket como alternativa si la tasa de FP sigue inaceptable (comparar: FP rate, cobertura de señales, costo, compatibilidad CI).
- [ ] 2.4 Documentar la decisión (promover GuardDog o migrar a Socket) en el change y en `docs/learning/quality-gates.md`.

## Phase 3 — Promoción a blocking (gated)

- [ ] 3.1 Quitar `continue-on-error: true` de `typosquat-guarddog`.
- [ ] 3.2 Añadir `typosquat-guarddog` al `needs` de `prebuild-security-complete` (anclado por nombre de job).
- [ ] 3.3 Renombrar job para quitar "advisory"/"FASE 1" del nombre (ej. `Security: Typosquat GuardDog`).
- [ ] 3.4 Actualizar fila en `docs/learning/quality-gates.md` de `advisory (PR, fase 1)` a `blocking (PR)`.

## Validación

- [ ] 4.1 Ejecutar `openspec validate typosquatting-detection --type change` y confirmar sin errores.
- [ ] 4.2 Verificar que `typosquat-guarddog` no está en `prebuild-security-complete.needs` antes de la promoción.
- [ ] 4.3 Verificar que `guarddog-weekly` sigue advisory (no se promueve).

## Documentación

- [ ] 5.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
- [ ] 5.2 Documentar la tasa de falsos positivos y la decisión de promoción/no-promoción.
