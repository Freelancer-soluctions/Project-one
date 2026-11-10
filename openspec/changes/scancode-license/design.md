# Design — scancode-license

## Decisiones

1. **Deny-list confirmada por modelo de distribución.** La deny-list actual (GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0) es un default razonable. La confirmación final depende de cómo se distribuye el ERP (SaaS, on-prem, imagen). Documentar la decisión en `security/license-policy.md`.

2. **`unknown` licenses: aviso con ticket y plazo.** Un warning que nadie revisa se convierte en ruido. Definir un SLA de triage (ej. 30 días) y bloquear después de 4 semanas limpias (sin desconocidas sin resolver).

3. **Promoción gradual.** Seguir el patrón de `containerfile-lint` y `typosquatting-detection`: quitar `continue-on-error: true`, añadir al `needs` del agregador, actualizar `quality-gates.md`. Rollback = un solo revert.

4. **ScanCode en PR-time (ACMR diff) y semanal (repo completo).** PR-time escanea el diff; semanal documenta la deriva y produce evidencia (SPDX 2.3, OSADL, retención 90 días). La licencia de dependencias la cubre `dependency-review` (job separado).

5. **No cambiar la imagen Docker.** ScanCode 32.5.0 (`aboutcode/scancode-toolkit:32.5.0`) se mantiene. `--csv` está deprecado; se usa `--json-pp`.

## No se toca

- `security.yml` ni `scheduled-security.yml` (scancode-license-audit sigue advisory siempre).
- No se cambia la versión de ScanCode.
- No se implementa SPDX generation en este change (ya existe en el job semanal).
