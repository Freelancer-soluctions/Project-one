# Runbook — PR rojo por hallazgo nuevo

## Situación

Un PR falla en un gate de seguridad (Trivy, Semgrep, Gitleaks, Checkov,
hadolint, actionlint, zizmor, GuardDog, `npm audit`) con un hallazgo que no
existía en `main`.

## Primer paso

1. Abrir el job y el artifact/SARIF; identificar herramienta, regla y línea.
2. Decidir la naturaleza: **verdadero positivo introducido por el PR**,
   **falso positivo**, o **hallazgo preexistente expuesto por el diff**.

## Siguiente paso

- **Verdadero positivo:** corregirlo en el PR (código, dependencia, pin,
  permisos). No se suprime para "desbloquear".
- **Falso positivo:** añadir la supresión **con** `# <tool>: ignore[...]` o
  `skip-check` y una entrada en `security/exceptions.yml` referenciando el
  `id` (máx. 90 días). La revisión de `/security/` es obligatoria.
- **Preexistente:** demostrarlo con el SARIF de `main`; si el gate nuevo lo
  detecta por primera vez, abrir issue de deuda y aplicar la política de
  baseline del change correspondiente (no silenciar en el PR).
- Si el PR es un hotfix: `docs/runbooks/security/urgent-fix-blocked.md`.
