# Runbook — error de herramienta de seguridad

## Situación

Un job del stage SECURITY falla por infraestructura, no por hallazgos:
timeout, error de descarga de imagen/action, permisos, `uvx`/`pip` roto,
Docker no disponible, rate limit de la API, SARIF vacío o no parseable.

## Primer paso

1. Distinguir fallo de herramienta de hallazgo: leer el step que falla y el
   artifact/SARIF. Un SARIF vacío **no** equivale a "sin hallazgos" cuando el
   scan salió con error.
2. Re-ejecutar el job (`gh run rerun <run-id> --failed`) para descartar un
   fallo transitorio.

## Siguiente paso

- **Transitorio:** registrar el run en el issue mensual (métrica "runs con
  fallo de herramienta") y continuar.
- **Persistente:** abrir issue con etiqueta `security-tooling`, asignar al
  `devops-team` y aplicar la política fail-closed: **no** se añade
  `continue-on-error` para desbloquear PRs; si el gate debe seguir
  ejecutándose, se arregla la causa (pin de versión, permisos, red).
- **Bloqueo de un fix urgente:** `docs/runbooks/security/urgent-fix-blocked.md`.
