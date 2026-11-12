## Phase 1 — Deny-list y política

- [x] 1.1 Crear `security/license-policy.md` con el modelo de distribución del ERP, la deny-list confirmada y la justificación por licencia.
      — **Nota de ruta**: la proposal y el spec delta mandatan el doc existente `docs/learning/license-policy.md` (fuente canónica declarada en su propio header); `security/license-policy.md` NO se crea para evitar dos fuentes de verdad. Cumplido en `docs/learning/license-policy.md` §1.1 "Modelo de distribución del ERP — deny-list CONFIRMADA": modelo **SaaS (acceso por red)** confirmado por el owner (2026-11-10), justificación por licencia (AGPL §13 = riesgo máximo bajo SaaS; SSPL = copyleft de servicio; GPL-3.0 = negación conservadora ante cambio de modelo; CC-BY-NC = no comercial) y obligación de re-revisar la lista si cambia el modelo.
- [x] 1.2 Verificar que `scancode-license-pr-diff` en `.github/workflows/ci.yml` usa `--json-pp` (no `--csv`).
      — Verificado 2026-11-10: `--json-pp scancode-scope/pr-license-report.json` (ci.yml L1705); el semanal usa `--json-pp scancode-report.json .` (scheduled-security.yml L248). Cero usos de `--csv`.
- [x] 1.3 Confirmar que la deny-list en `dependency-review` config coincide con `security/license-policy.md`.
      — Coincidencia confirmada: `dependency-review` consume `.github/license-policy.yml` vía `config-file` (fuente única ejecutable: GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0); `scancode-license-pr-diff` lee la misma clave `deny-licenses` del mismo fichero en runtime (sin duplicar lista); `docs/learning/license-policy.md` §1 reproduce exactamente esas 4 entradas y declara que "manda la de config ejecutable" si divergen.

## Phase 2 — Regla de unknown

- [x] 2.1 Documentar el SLA de triage para `unknown` (30 días, ticket, escalación).
      — `docs/learning/license-policy.md` §3.1 (nuevo): proceso de 5 pasos — detección (`::warning::` + artifact), ticket obligatorio vía plantilla `.github/ISSUE_TEMPLATE/unknown-license.yml` (label `security`), clock-start en la PRIMERA detección (run ID + fecha) según `security/SLA.md` §2, resolución, extensión SOLO vía `security/exceptions.yml` (`expires ≤ created + 90`) con escalada a bloqueo cuando la excepción está vencida. Vigilancia de edad: `SLA.md` §3 + audit semanal (el job PR es stateless).
- [x] 2.2 Implementar el step de detección de `unknown` en el job (warning en FASE 1).
      — Implementado en el evaluate step de `scancode-license-pr-diff` (renombrado "Evaluate licenses against unified deny-list (FASE 2 blocking)"): `LicenseRef-scancode-unknown*` → `::warning::` por hallazgo + instrucción de ticket; adicionalmente cruza `security/exceptions.yml` (parser de entradas `tool: scancode` + `scope` + `expires`) y **escala a `::error::` + exit 1** si la excepción que cubre el unknown está vencida. Validado por simulación local de 6 casos (ver 5.3).
- [x] 2.3 Registrar los unknowns en `security/exceptions.yml` cuando se extiende el plazo.
      — Mecanismo operativo: hoy `exceptions: []` (0 unknowns detectados — el scan nunca había corrido realmente, ver Phase 3/§7.4 de quality-gates.md). El esquema (id/tool/finding/scope/reason/owner/created/expires/ticket) ya está validado por `scripts/ci/security-exceptions.mjs` (job `security-exceptions-check`), y el evaluate step consume las entradas con `tool: scancode`. Nada que registrar aún; el flujo queda documentado en `license-policy.md` §3.1.

## Phase 3 — Calibración (4 semanas)

- [x] 3.1 Rastrear los unknowns semana a semana.
      — **Sustituido por observación post-promoción** (decisión del owner, 2026-11-10): la ventana advisory era inviable de facto — la imagen Docker `aboutcode/scancode-toolkit:32.5.0` NO existe (el job era un no-op verde permanente: pull exit 125 enmascarado por `continue-on-error`; 0 runs con evidencia). Tras el fix (`setup-uv` SHA-pinned + `uv tool install --python 3.12 scancode-toolkit==32.5.0` + version check), se promueve directo a blocking; el rastreo semanal de unknowns se hace vía audit semanal `scancode-license-audit` (sigue advisory) + tickets con SLA 30 días. Detalle en `quality-gates.md` §7.4.
- [x] 3.2 Verificar que no queden unknowns sin resolver después de 4 semanas.
      — Cobertura equivalente continua: el evaluate step bloquea unknowns con excepción vencida y el audit semanal + `SLA.md` §3 vigilan la edad de los tickets. Con 0 unknowns históricos (el scan nunca produjo report), la condición "ningún unknown sin resolver" se cumple trivialmente al promover; a partir de ahora se verifica caso a caso vía ticket/SLA.

## Phase 4 — Promoción a blocking (gated)

- [x] 4.1 Modificar el evaluate step (ci.yml L1680-1685) para salir con código non-zero cuando se detectan licencias de la deny-list.
      — Hecho: el evaluate step ahora emite `::error::Licencias en deny-list o unknowns escalados (FASE 2 blocking)` + `process.exit(1)` ante violaciones; y es **fail-closed**: report ausente → `::error::pr-license-report.json no producido — el scan falló o no corrió` + exit 1 (mismo principio que `lockfile-audit`: no se puede distinguir "sin hallazgos" de "no auditado").
- [x] 4.2 Quitar `continue-on-error: true` de `scancode-license-pr-diff`.
      — Hecho: eliminado el COE a nivel job Y el del scan step (2026-11-10). El step de upload del artifact conserva `if: always()` + `if-no-files-found: warn` (no es COE de gate).
- [x] 4.3 Verificar que `scancode-license-pr-diff` ya está en `prebuild-security-complete.needs` (ci.yml L3035). La promoción = quitar COE + hacer evaluate fail + rename.
      — Verificado 2026-11-10: presente en el `needs` del agregador (ci.yml L3333, contrato "exactly 9 jobs" intacto). Promoción completada = COE fuera (4.2) + evaluate fail (4.1) + rename (4.4).
- [x] 4.4 Renombrar job para quitar "advisory"/"FASE 1" del nombre.
      — Hecho: `name: 'Security: ScanCode License PR-Diff'` (antes "…PR-Diff (License Audit, FASE 1 advisory)"). El id del job (`scancode-license-pr-diff`) NO cambia — el ruleset/agregador lo referencia por id y nombre estable.
- [x] 4.5 Actualizar fila en `docs/learning/quality-gates.md`.
      — Hecho: fila §1 actualizada a `**blocking (PR, fase 2)**` con FIX (imagen Docker inexistente → uv install pinneado), fail-closed, regla unknown/SLA/escalada y rollback; fila del semanal actualizada (fix docker→uv, sigue advisory); fila §2 → `**blocking (PR)** desde 2026-11-10 (§7.4)`.

## Validación

- [x] 5.1 Ejecutar `openspec validate scancode-license --type change` y confirmar sin errores.
      — Ejecutado 2026-11-10: "Change 'scancode-license' is valid". Adicional: ambos workflows YAML-parsean sin errores (ci.yml 62 jobs, scheduled-security.yml 8 jobs).
- [x] 5.2 Verificar que `scancode-license-pr-diff` está en `prebuild-security-complete.needs` (ya presente desde Phase 0).
      — Verificado 2026-11-10 (ci.yml L3333); el agregador estricto lo cuenta entre los 9 y su `result` ya no puede ser "success con COE": un fallo real tiñe el agregador.
- [x] 5.3 Verificar que el evaluate step falla (exit non-zero) cuando se detecta una licencia de la deny-list.
      — Verificado por simulación local (2026-11-10): el run-block real del evaluate step se extrajo de ci.yml y se ejecutó contra fixtures en `scancode-scope/` — 6 casos: (1) report ausente → exit 1 fail-closed; (2) limpio → exit 0; (3) `AGPL-3.0-or-later` (normaliza a AGPL-3.0) → `::error::` + exit 1; (4) unknown sin excepción → `::warning::` + exit 0; (5) unknown con excepción vencida → ESCALADO + exit 1; (6) unknown con excepción vigente → exit 0. Fixtures limpiados tras la prueba.

## Documentación

- [x] 6.1 Actualizar `docs/learning/quality-gates.md` con el estado de la capa.
      — Hecho: filas §1 (PR blocking fase 2 / semanal advisory con fix) y §2 actualizadas + nueva sección §7.4 "Calibración ScanCode (license compliance)" con descubrimiento del no-op, fix, confirmación SaaS de la deny-list, decisión del owner, regla unknown y rollback de revert único.
- [x] 6.2 Actualizar `docs/learning/license-policy.md` con la confirmación de la deny-list por modelo de distribución.
      — Hecho: header note del change `scancode-license` (2026-11-10); §1.1 nuevo (modelo SaaS + justificación por licencia); §3.1 nuevo (SLA unknown); §6 fila L2b → blocking FASE 2 activa; §7 comando local actualizado a `uv tool install` (la imagen Docker oficial no existe).
- [x] 6.3 Implementar mecanismo de tickets para unknown licenses (issue template o automation) y documentar cómo se determina la edad de 30 días.
      — Hecho: creada `.github/ISSUE_TEMPLATE/unknown-license.yml` (GitHub issue form; title `[license] unknown: <archivo o dependencia>`; labels `security`; campos path, license-key, first-detection con run ID/fecha = clock-start, source, evidencia, resolución, checklist SLA). La edad de 30 días se cuenta desde la PRIMERA detección registrada en el ticket (`security/SLA.md` §2); extensiones solo vía `security/exceptions.yml` con `expires ≤ created + 90`.
