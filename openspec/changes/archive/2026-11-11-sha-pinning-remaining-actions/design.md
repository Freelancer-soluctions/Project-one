# Design — sha-pinning-remaining-actions

## Decisiones

1. **SHA + version comment.** Cada action se fija a un commit SHA completo con un comentario de versión: `uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7`. Esto permite a Dependabot sugerir actualizaciones.

2. **Dependabot github-actions ecosystem.** Verificar que `.github/dependabot.yml` incluye `package-ecosystem: github-actions` con `schedule: weekly`. Si no, añadirlo. No regredir el `open-pull-requests-limit` existente (actualmente 10).

3. **Enforcement a nivel repo.** Documentar cómo habilitar "Require actions to be pinned to a full-length commit SHA" en Settings → Actions → General → Allowed actions. Esto es una tarea manual del owner.

4. **No cambiar la funcionalidad.** Solo se cambia el ref de `@vX` a `@SHA # vX`. No se tocan inputs, outputs ni steps.

5. **Workflow dependency lockfiles (futuro).** GitHub ha introducido workflow dependency lockfiles que superseden SHA pinning para pinning transitivo completo. Documentar como opción futura.

6. **Alcance repo-wide.** El pineado aplica a TODOS los workflows en `.github/workflows/`, no solo a los del stage de seguridad. La tarea 1.1 usa `grep -rn` para inventariar todas las actions tag-pinned.

7. **Caveats (§8.16 #6).** El pineado aumenta el mantenimiento; mitigado por Dependabot. Algunas actions (checkov-action@v12) pueden no publicar SHAs de release; usar dereferencia de tag vía GitHub API como fallback.

## Actions tag-pinned a pinear (inventario inicial — verificar con grep)

| Action                                | Ubicación(es)                                                                                                                                                                  | Versión actual |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `actions/checkout`                    | ci.yml, security.yml, scheduled-security.yml, deploy.yml, preview.yml, release.yml, security-digest.yml, pr-metadata.yml, coverage-ratchet-monthly.yml, nightly-full-suite.yml | @v4 / @v6      |
| `actions/upload-artifact`             | ci.yml, security.yml, scheduled-security.yml                                                                                                                                   | @v4            |
| `actions/download-artifact`           | ci.yml                                                                                                                                                                         | @v4            |
| `actions/dependency-review-action`    | ci.yml                                                                                                                                                                         | @v5            |
| `bridgecrewio/checkov-action`         | ci.yml                                                                                                                                                                         | @v12           |
| `anchore/sbom-action`                 | security.yml, security-digest.yml                                                                                                                                              | @v0.24.0       |
| `hadolint/hadolint-action`            | ci.yml                                                                                                                                                                         | @v3.1.0        |
| `gitleaks/gitleaks-action`            | ci.yml                                                                                                                                                                         | @v3            |
| `aquasecurity/trivy-action`           | security.yml                                                                                                                                                                   | @v0.36.0       |
| `KineticCafe/actions-dco`             | ci.yml                                                                                                                                                                         | @v3.2.0        |
| `SonarSource/sonarqube-scan-action`   | ci.yml                                                                                                                                                                         | @v4            |
| `dorny/paths-filter`                  | ci.yml                                                                                                                                                                         | @v4            |
| `dorny/test-reporter`                 | ci.yml, nightly-full-suite.yml                                                                                                                                                 | @v3            |
| `amannn/action-semantic-pull-request` | pr-metadata.yml                                                                                                                                                                | @v6            |
| `peter-evans/create-pull-request`     | preview.yml, coverage-ratchet-monthly.yml                                                                                                                                      | @v7            |
| `changesets/action`                   | release.yml                                                                                                                                                                    | @v2.1.2        |
| `osv-scanner-action`                  | security-digest.yml                                                                                                                                                            | @v2.5.0        |
| `harden-runner`                       | deploy.yml                                                                                                                                                                     | @v2            |
| `aws-actions/*`                       | deploy.yml                                                                                                                                                                     | @v\*           |

> **Nota:** Esta tabla es un inventario inicial. La tarea 1.1 (`grep -rn "uses:.*@v" .github/workflows/`) es la fuente de verdad. Algunas actions pueden tener SHAs de release; otras requieren dereferencia de tag vía API.

## No se toca

- No se cambian inputs ni steps de ningún job.
- No se cambia la versión de ninguna action.
- No se implementa workflow dependency lockfiles (futuro).
- No se pinean actions que ya están fijadas por SHA (setup-uv, gitleaks docker, etc.).
