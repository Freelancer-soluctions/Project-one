# Design — sha-pinning-remaining-actions

## Decisiones

1. **SHA + version comment.** Cada action se fija a un commit SHA completo con un comentario de versión: `uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7`. Esto permite a Dependabot sugerir actualizaciones.

2. **Dependabot github-actions ecosystem.** Verificar que `.github/dependabot.yml` incluye `package-ecosystem: github-actions` con `schedule: weekly`. Si no, añadirlo.

3. **Enforcement a nivel repo.** Documentar cómo habilitar "Require actions to be pinned to a full-length commit SHA" en Settings → Actions → General → Allowed actions. Esto es una tarea manual del owner.

4. **No cambiar la funcionalidad.** Solo se cambia el ref de `@vX` a `@SHA # vX`. No se tocan inputs, outputs ni steps.

5. **Workflow dependency lockfiles (futuro).** GitHub ha introducido workflow dependency lockfiles que superseden SHA pinning para pinning transitivo completo. Documentar como opción futura.

## Actions a pinear

| Action                             | Ubicación                            | Versión actual | SHA a obtener                             |
| ---------------------------------- | ------------------------------------ | -------------- | ----------------------------------------- |
| `actions/dependency-review-action` | ci.yml                               | @v5            | Obtener de releases                       |
| `bridgecrewio/checkov-action`      | ci.yml, scheduled-security.yml       | @v12           | Obtener de releases                       |
| `anchore/sbom-action`              | security.yml, scheduled-security.yml | @v0.24.0       | Obtener de releases                       |
| `hadolint/hadolint-action`         | ci.yml, scheduled-security.yml       | @v3.1.0        | Obtener de releases                       |
| `gitleaks/gitleaks-action`         | ci.yml                               | @v3            | Obtener de releases (opcional, ya es COE) |

## No se toca

- No se cambian inputs ni steps de ningún job.
- No se cambia la versión de ninguna action.
- No se implementa workflow dependency lockfiles (futuro).
