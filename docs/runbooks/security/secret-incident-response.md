# Runbook — secreto detectado

## Situación

Gitleaks (PR, full-history o pre-release) o GitHub Secret Scanning detecta un
secreto en el diff, en el historial o en un artifact.

## Primer paso

1. **No** pegar el valor en el issue/PR/log. Localizarlo por ruta y commit.
2. Asumir que está comprometido: **rotar/revocar** la credencial antes de
   cualquier otra acción.
3. Confirmar el alcance (¿producción? ¿solo test? ¿histórico?) con
   `git log -S` y los alerts de GitHub.

## Siguiente paso

1. Sustituir el valor por una variable de entorno/secret del repo.
2. Si está en el historial, evaluar reescritura (`git filter-repo`) según el
   procedimiento canónico.
3. Cerrar el alert de GitHub con la justificación correcta
   (`revoked` / `false positive` / `won't fix`) y registrar el incidente.

Procedimiento completo y canónico (política, capas y límites de push
protection): [`docs/security/secret-incident-response.md`](../../security/secret-incident-response.md).
