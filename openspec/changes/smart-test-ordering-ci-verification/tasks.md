# Tasks: smart-test-ordering-ci-verification

## 1. Verificaciones pendientes en CI

- [ ] 1.1 Abrir un PR de prueba con un test que falla a propósito y confirmar que el step "Restore ordering history (fail-first)" descarga el artefacto y los archivos con historial de fallos corren primero (logs del job `test-unit-client`).
- [ ] 1.2 Verificar que el step summary muestra TTFF (wall-clock y % de suite), el failing file, y el hit-rate contra el historial. Confirmar que una corrida verde publica "no first failure" y que un script roto marca la métrica como unavailable sin tumbar el job.
- [ ] 1.3 Verificar que un fichero listado en `.github/flaky-quarantine.yml` con fallos en el historial NO es resucitado en el blocking PR run (la cuarentena se aplica después de la selección vía `quarantine-exclude.mjs`).

## 2. Cierre

- [ ] 2.1 Registrar evidencia (links a runs, screenshots del step summary) en este tasks.md.
- [ ] 2.2 Marcar todas las tasks `[x]`.
- [ ] 2.3 `openspec validate smart-test-ordering-ci-verification --strict` exit 0.
- [ ] 2.4 Archivar el change.
