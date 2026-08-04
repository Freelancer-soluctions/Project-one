## 1. Rework del job secrets en security.yml

- [x] 1.1 Reemplazar el step `uses: gitleaks/gitleaks-action@v2` con `GITLEAKS_LICENSE` por la imagen open source `docker://zricethezav/gitleaks:v8.22.1` con `args: git --log-opts="${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}" --redact --verbose` (scan diff-scoped, fail-closed: exit code 1 bloquea el merge; usar `git` no `detect` — deprecado desde v8.19.0)
- [x] 1.2 Eliminar el env `GITLEAKS_LICENSE: ${{ secrets.GIT_LEAKS }}` a nivel de JOB para que el job no falle cuando el secret no existe (el env se re-declara a nivel de STEP en 1.3, solo en el step condicional de la action licenciada)
- [x] 1.3 Añadir step condicional `if: ${{ secrets.GIT_LEAKS != '' }}` que ejecute la action licenciada como capa extra SOLO si el secret está configurado, con `env: GITLEAKS_LICENSE: ${{ secrets.GIT_LEAKS }}` a nivel de step (sin este env la action licenciada falla incluso con el secret presente)
- [x] 1.4 Añadir step con la condición invertida `if: ${{ secrets.GIT_LEAKS == '' }}` que emita un warning de que el scan licenciado no está disponible, sin fallar el job (GitHub Actions no tiene `else` — usar la condición negada)
- [x] 1.5 Verificar que el job conserva el nombre `secrets` y el trigger en PRs hacia `main` (y `workflow_call`)

## 2. Nuevo workflow scheduled-security.yml (full repo scan semanal)

- [x] 2.1 Crear `.github/workflows/scheduled-security.yml` con trigger `schedule: cron '0 3 * * 1'` (lunes 03:00 UTC) y `workflow_dispatch` para ejecución manual
- [x] 2.2 Configurar `actions/checkout@v5` con `fetch-depth: 0` para obtener el historial completo
- [x] 2.3 Ejecutar Gitleaks open source (imagen pineada `zricethezav/gitleaks:v8.22.1`) con `git --log-opts="--all" --report-format=json --report-path=gitleaks-report.json --redact` para cubrir todas las refs/commits (usar `git` no `detect`; `--redact` evita secretos en claro en el artifact)
- [x] 2.4 Poner el step del scan en modo auditoría (`continue-on-error: true`): el run no falla por hallazgos, los reporta y continúa
- [x] 2.5 Subir el reporte JSON como artifact con `actions/upload-artifact@v4` (nombre `gitleaks-report`)
- [x] 2.6 Añadir paso que genere el SARIF con una segunda invocación de gitleaks (`--report-format=sarif --report-path=gitleaks.sarif --redact`) y luego subirlo con `github/codeql-action/upload-sarif@v4` con permiso `security-events: write` para visibilidad en el Security tab (si se omite 2.6, omitir también el permiso)
- [x] 2.7 Declarar `permissions: contents: read` (+ `security-events: write` solo si se incluye 2.6) en el workflow

## 3. Habilitar GitHub secret scanning nativo (acción one-off de repo admin)

- [x] 3.1 Documentar en `docs/security/SECURITY.md` los pasos UI: Settings → Security → Secret scanning & push protection → Enable
- [x] 3.2 Documentar el one-liner API: `gh api -X PATCH repos/{owner}/{repo}/security-and-analysis` activando `secret_scanning` y `secret_scanning_push_protection` en `enabled`
- [x] 3.3 Documentar el manejo de alertas del Security tab (revisar, rotar secretos, dismiss con justificación)
- [x] 3.4 Verificar la visibilidad del repo (`gh repo view --json visibility,isPrivate`) y el entitlement de GitHub Advanced Security; si el repo es privado sin GHAS, documentar en SECURITY.md que el secret scanning nativo requiere GHAS (pago) y que la capa operativa es Gitleaks OSS

## 4. Actualizar documentación en docs/security/SECURITY.md

- [x] 4.1 Añadir sección "GitHub Secret Scanning" dentro del bloque Secret Detection describiendo la estrategia de 2 capas (PR-time gate + full-history semanal)
- [x] 4.2 Actualizar el Overview para reflejar que la detección usa GitHub secret scanning nativo + Gitleaks open source sin requerir licencia comercial
- [x] 4.3 Actualizar la mención a la ejecución en CI (no solo pre-commit): indicar que existe job de PR y workflow programado semanal
- [x] 4.4 **CREADOR AUTORITATIVO** de `.github/dependabot.yml` (este change crea el archivo con `package-ecosystem: github-actions` [+ docker], `directory: /`, schedule semanal, para automatizar updates del pin `zricethezav/gitleaks:v8.22.1` — el ecosistema `docker` escanea Dockerfiles, no tags `docker://` en workflow YAML; el ecosistema `github-actions` es el que trackea esos tags; el repo tiene `apps/server/Dockerfile`, así que puede incluirse también `package-ecosystem: docker`). **Nota cross-change**: `ci-test-integration` task 13.1 EXTENDERÁ este archivo con el ecosistema `npm` (no lo recreará); `ci-scheduled-security` task 7.2 solo verifica cobertura de pines. UN solo `.github/dependabot.yml` en el repo

## 5. Verificación

- [x] 5.1 Validar que ambos workflow YAML parsean correctamente (ej. `npx actionlint` si se instala, o apertura en GitHub Actions tab sin error de sintaxis)
- [~] 5.2 Ejecutar manualmente el workflow programado (`workflow_dispatch`) y confirmar que el scan full-history corre y sube el artifact `gitleaks-report` (sin secretos en claro gracias a `--redact`) — **DEFERRED a CI run per orchestrator 2026-08-02 (requiere workflow_dispatch manual en GitHub UI)**
- [~] 5.3 Verificar que el job `secrets` pasa en un PR sin el secret `GIT_LEAKS` configurado (degradación elegante, sin fallo) — **DEFERRED a primer PR post-merge per orchestrator 2026-08-02**
- [x] 5.4 Confirmar que la documentación de SECURITY.md incluye pasos de activación reproducibles (UI + API) y el caveat de visibilidad/GHAS para repos privados
