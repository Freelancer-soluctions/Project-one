# Runbook — licencia denegada o desconocida

## Situación

`dependency-review` (PR) o `scancode-license-pr-diff`/`scancode-license-audit`
reporta una licencia incluida en la deny-list (`GPL`, `AGPL`, `SSPL`,
`CC-BY-NC`, etc.) o una licencia desconocida.

## Primer paso

1. Identificar el paquete, versión y licencia exacta desde el artifact del
   job o el SBOM (`npm sbom`).
2. Confirmar si es dependencia **directa** o transitiva y si se distribuye
   (runtime) o solo se usa en build/test.

## Siguiente paso

- **Sustituible:** cambiar a una alternativa con licencia permisiva
  (MIT/Apache-2.0/BSD/ISC) y re-ejecutar el gate.
- **Transitiva y no distribuida:** evaluar `overrides` a una versión con
  licencia aceptable; si no existe, excepción justificada en
  `security/exceptions.yml` (máx. 90 días) con revisión de `/security/`.
- **Deny-list incorrecta para el modelo de distribución:** PR a la política
  (`LICENSE_DENY_LIST` en `scripts/security/generate-security-digest.mjs`) con
  justificación; nunca un `--allow-licenses` ad-hoc en el workflow.
- Ver `docs/learning/license-policy.md` para la política vigente.
