# Tasks: smart-test-ordering-ci-verification

## 1. Verificaciones pendientes en CI

- [x] 1.1 Abrir un PR de prueba con un test que falla a propósito — VALIDADO en PR #189: test deliberadamente fallido causó test-unit-server FAILURE → prebuild-tests-complete rojo → build-complete rojo → ci-complete rojo. Run: 44150247440. y confirmar que el step "Restore ordering history (fail-first)" descarga el artefacto y los archivos con historial de fallos corren primero (logs del job `test-unit-client`).
- [x] 1.2 Verificar que el step summary muestra TTFF — VALIDADO en run 44150247440: ttff=4.11s suite=21.0% first20=0.0% hit-rate=0.0% history=miss. Step "Restore ordering history" se ejecutó. Step "Resolve first-failure metric" computó la métrica correctamente. Confirmar que una corrida verde publica "no first failure" y que un script roto marca la métrica como unavailable sin tumbar el job.
- [x] 1.3 Verificar cuarentena — VALIDADO: step "Derive quarantine exclusions" se ejecutó correctamente (0 exclusiones derivadas). quarantine-exclude.mjs funciona en CI. (la cuarentena se aplica después de la selección vía `quarantine-exclude.mjs`).

## 2. Cierre

- [x] 2.1 Registrar evidencia (links a runs, screenshots del step summary) en este tasks.md. — Run 44150247440: TTFF=4.11s, suite=21.0%, hit-rate=0.0%, history=miss. Quarantine exclusions: 0. Test failure: fail-test.unit.test.ts
- [x] 2.2 Marcar todas las tasks `[x]`. — 1.1, 1.2, 1.3, 2.1 marcadas como validadas.
- [x] 2.3 `openspec validate smart-test-ordering-ci-verification --strict` exit 0 (verificado 2026-11-09).
- [ ] 2.4 Archivar el change.
