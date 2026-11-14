# Runbook — corrección urgente bloqueada por un gate

## Situación

Un incidente requiere mergear un fix (hotfix de seguridad, caída en
producción) y un gate del stage SECURITY lo bloquea por un hallazgo no
relacionado con el fix.

## Primer paso

1. Confirmar que el hallazgo es **preexistente** y no introducido por el fix
   (comparar el SARIF/artifact del PR con el de `main`).
2. Verificar que el fix no amplía la superficie del hallazgo (p. ej. no toca la
   dependencia afectada).

## Siguiente paso

- **Preferente:** fusionar el fix con el gate en verde resolviendo el hallazgo
  en el mismo PR o en uno previo (si es < 7 días de trabajo).
- **Bypass gobernado** (solo si lo anterior no es posible):
  1. **Limitado a un rol:** únicamente el mantenedor principal puede aprobar el
     bypass; queda registrado en el PR (comentario con motivo, hallazgo,
     ticket y fecha objetivo).
  2. **Registrado:** se abre/actualiza una entrada en
     `security/exceptions.yml` con `expires` ≤ 30 días y el `ticket` del
     hallazgo.
  3. **Excepción formal posterior:** antes del vencimiento, el hallazgo se
     corrige o la excepción se renueva con justificación.
  4. **El check NUNCA se desactiva:** no se edita `ci.yml` para quitar el job,
     ni se añade `continue-on-error`, ni se usa `--no-verify` en el merge. El
     bypass solo exime temporalmente el _resultado_, no la ejecución.
- Cualquier bypass sin excepción registrada se trata como incidente de
  gobernanza en la revisión mensual.
