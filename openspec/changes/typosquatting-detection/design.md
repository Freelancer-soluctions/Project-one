# Design — typosquatting-detection

## Decisiones

1. **Condicionamiento en manifest/lockfile.** El job ya está cableado a `repo-discovery` outputs. Verificar que `if: needs.repo-discovery.outputs.manifests == 'true'` (o equivalente) esté presente. Si no, añadirlo.

2. **Calibración antes de blocking.** GuardDog tiene una tasa de falsos positivos del 2.2% en npm y 6.7% en PyPI (issue #898, open 2026-10). Promover a blocking sin calibración causaría ruido excesivo. Período de observación: 2-4 semanas de runs limpios.

3. **Promoción gradual.** Seguir el patrón de `containerfile-lint` y `iac-scanning`: quitar `continue-on-error: true`, añadir al `needs` del agregador, actualizar `quality-gates.md`. Rollback = un solo revert.

4. **Socket como alternativa.** Si la tasa de falsos positivos de GuardDog sigue inaceptable después de la calibración, evaluar Socket (comercial, 70+ señales, CLI que envuelve npm install). Documentar la decisión.

5. **Sin baseline.** GuardDog no soporta baseline file (a diferencia de Gitleaks). La calibración se hace por observación de runs, no por baseline.

## No se toca

- `security.yml` ni `scheduled-security.yml` (guarddog-weekly sigue advisory siempre).
- No se cambia la versión de GuardDog (v3.2.0) sin evaluación.
- No se implementa Socket en este change (solo se evalúa).
