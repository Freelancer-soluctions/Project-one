# Runbook — escaneo programado sin reporte

## Situación

Un workflow programado (`scheduled-security.yml`, `security-digest.yml`,
`nightly-full-suite.yml`, `security-metrics.yml`) termina pero no genera el
artifact/SARIF esperado, o el digest no encuentra el reporte del workflow
hermano.

## Primer paso

1. Inspeccionar el run: `gh run view <run-id> --log-failed` y comprobar si el
   step de escaneo salió 0 pero escribió un fichero vacío, si el artifact
   expiró, o si el cron está deshabilitado (GitHub desactiva schedules tras 60
   días sin actividad).
2. Verificar retención: los artifacts de 30/90 días pueden haber expirado
   antes de que el consumidor los lea.

## Siguiente paso

- **Cron deshabilitado:** re-habilitar con `workflow_dispatch` y confirmar que
  el schedule vuelve a estar activo.
- **Fallo silencioso:** aplicar el patrón fail-closed de los jobs existentes
  (`test -s` + `jq -e .` sobre el SARIF) para que el run falle en vez de subir
  evidencia vacía.
- **Retención insuficiente:** ajustar `retention-days` o el orden de los jobs
  consumidores; registrar la decisión en el issue mensual de métricas.
- **Sin datos en el digest:** el digest ya marca "Secret report unavailable";
  no es un fallo del gate, pero se anota en la revisión mensual.
