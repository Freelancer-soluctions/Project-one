## Context

El job `secrets` de `.github/workflows/security.yml` usa `gitleaks/gitleaks-action@v2` con `GITLEAKS_LICENSE: ${{ secrets.GIT_LEAKS }}`. La action oficial de Gitleaks requiere licencia comercial (brecha A2): el job falla cuando el secret no está configurado. Además solo escanea cambios staged/PR — no hay scan de historial completo (brecha M7). `docs/security/SECURITY.md` documenta Gitleaks pre-commit, pero no existe GitHub secret scanning nativo habilitado. Ver proposal.md - Why para la motivación completa.

## Goals / Non-Goals

**Goals:**
- CI de detección de secretos 100% license-free: GitHub secret scanning nativo (gratuito, sin token) + Gitleaks open source (`zricethezav/gitleaks` Docker image, MIT).
- Degradación elegante: el job no falla si `GIT_LEAKS` no existe — advierte y continúa.
- Scan full-history programado (cron semanal) que cubre brecha M7.
- Documentación de activación (Settings → Security → Secret scanning) en `docs/security/SECURITY.md`.

**Non-Goals:**
- Sin cambios en código de runtime (`apps/server`, `apps/client`), APIs ni esquemas.
- No se elimina el pre-commit hook local ni la config `.gitleaks.toml`.
- No se automatiza la rotación de secretos expuestos (solo detección/reporte).
- No se migra a otra tool de SAST.

## Decisions

### 1. Reemplazar gitleaks-action@v2 por Gitleaks open source vía Docker image en el job `secrets`
El job `secrets` de `security.yml` pasa a ejecutar Gitleaks mediante la imagen oficial `docker://zricethezav/gitleaks:v8.22.1` con `args: git --log-opts="${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}" --redact --verbose` — scan acotado al diff del PR (alineado con la spec: "scan pull request changes"). La imagen es open source (MIT) y no exige licencia.
- **Alternativa considerada**: mantener `gitleaks/gitleaks-action@v2` → rechazada (requiere `GITLEAKS_LICENSE`; es la causa de brecha A2).
- **Alternativa considerada**: descargar binario de gitleaks en el runner → rechazada (fragilidad de URLs/checksums; la imagen docker es el canal oficial publicado).
- **Por qué `git` en vez de `detect`**: `detect`/`protect` están deprecados desde v8.19.0 (ocultos del help, aún disponibles). `gitleaks git` escanea commits con `--log-opts` y es el comando moderno; pinear una versión futura que elimine `detect` no romperá el job.
- **Por qué diff-scoped**: el escenario de spec "secreto histórico no falla el PR" solo es satisfacible si el scan cubre el rango del diff (`base.sha..head.sha`), no todo el árbol del head (donde un secreto viejo aún presente en el working tree fallaría el check).
- El step falla (exit code 1) al detectar secretos → fail-closed en PR, alineado con la spec (PR-time gate).

### 2. Degradación elegante ante `GIT_LEAKS` ausente
Un step condicional `if: ${{ secrets.GIT_LEAKS != '' }}` ejecuta la action licenciada como capa extra solo si el secret existe; un step con la condición invertida `if: ${{ secrets.GIT_LEAKS == '' }}` emite un warning de que el scan licenciado no está disponible (GitHub Actions no tiene rama `else`; se usa la condición negada). El scan open source corre siempre → el job nunca falla por licencia.

### 3. Nuevo workflow `scheduled-security.yml` (cron semanal full-history)
- Triggers: `schedule` con cron `0 3 * * 1` (lunes 03:00 UTC) + `workflow_dispatch` manual.
- `actions/checkout@v5` con `fetch-depth: 0` para historial completo.
- Gitleaks open source con `git --log-opts="--all"` para cubrir todas las refs/commits (comando moderno; `detect` está deprecado desde v8.19.0).
- Modo auditoría: el step del scan usa `continue-on-error: true` → el run no falla por hallazgos, pero se sube el reporte JSON como artifact (`actions/upload-artifact@v4`) generado con `--redact` (el reporte no debe exponer secretos en claro a quien descargue el artifact) y opcionalmente SARIF al Security tab — el SARIF se genera con una segunda invocación de gitleaks (`--report-format=sarif --report-path=gitleaks.sarif`) antes de `github/codeql-action/upload-sarif@v4`, que requiere `security-events: write`. Alineado con la spec: el run programado reporta hallazgos sin romper automatización.

### 4. GitHub secret scanning nativo habilitado vía settings o API
No es configurable desde un workflow file: requiere acción de repo admin.
- **Nota de visibilidad (brecha A2)**: "nativo y gratuito sin token/licencia" aplica a repos **públicos**. En repos privados, secret scanning + push protection requieren GitHub Advanced Security (pago). La task 3.4 verifica la visibilidad del repo (`gh repo view --json visibility`); si es privado sin GHAS, la capa nativa no puede activarse (el toggle UI/API falla) y la mitigación A2 descansa solo en Gitleaks OSS — documentar el caveat en SECURITY.md.
- **Path UI**: Settings → Security → Secret scanning & push protection → Enable (documentado en SECURITY.md).
- **Path API** (automatizable, one-off): `gh api -X PATCH repos/{owner}/{repo}/security-and-analysis` con `secret_scanning` y `secret_scanning_push_protection` en `enabled`.
- **Alternativa considerada**: `actions/secret-scanning@v1` → se descarta como mecanismo documentado por ser menos estable que la API nativa; la API `security-and-analysis` es el canal oficial.

### 5. Documentación en `docs/security/SECURITY.md`
Sección "GitHub Secret Scanning" nueva dentro del bloque Secret Detection existente: pasos UI + API, push protection, manejo de alertas, y la estrategia de 2 capas (PR-time + full-history semanal).

## Risks / Trade-offs

- **Tag `latest` de la imagen docker flotante** → Mitigación: pin de versión exacta (`zricethezav/gitleaks:v8.22.1`) + dependabot (`.github/dependabot.yml` con `package-ecosystem: github-actions` — el ecosistema que trackea tags `docker://` en workflow YAML; el ecosistema `docker` solo escanea Dockerfiles. El repo tiene `apps/server/Dockerfile`, así que puede incluirse también el ecosistema `docker`). Nota cross-change: `ci-test-integration` task 13.1 también crea `.github/dependabot.yml` (ecosistema npm) — al mergear ambos changes, combinar ecosistemas (npm + github-actions [+ docker]) en un solo archivo.
- **Cron deshabilitado tras >60 días de inactividad del repo (política GitHub)** → Mitigación: `workflow_dispatch` manual disponible; documentado.
- **Scan full-history de monorepo puede ser lento** → Mitigación: cron off-peak semanal; reporte como artifact; aceptable para cadencia semanal.
- **Falsos positivos de Gitleaks** → Mitigación: allowlist existente en `.gitleaks.toml`; revisión humana antes de rotar.
- **Modo auditoría (continue-on-error) puede pasar desapercibido** → Mitigación: artifact + SARIF al Security tab para visibilidad (el SARIF se genera con una segunda invocación de gitleaks antes del upload).
- **Reporte JSON del artifact con secretos en claro** → Mitigación: `--redact` en la invocación que genera el reporte (el campo Secret del hallazgo se redacta).
- **Activación nativa requiere repo admin manual** → Mitigación: pasos documentados + one-liner `gh api` en tasks.

## Migration Plan

1. Merge del rework de `security.yml` + `scheduled-security.yml` nuevo (compatibles: job `secrets` conserva nombre y trigger PR).
2. Habilitar GitHub secret scanning + push protection (UI o `gh api`) — acción admin one-off.
3. Actualizar `docs/security/SECURITY.md`.
4. Observar el primer run programado; revisar artifact/SARIF.
5. **Rollback**: `git revert` de los workflow files restaura el comportamiento anterior.

## Open Questions

- ¿Subir también SARIF al Security tab desde el workflow programado? Decisión de implementación que no altera specs ni tasks (el step puede omitirse si `security-events: write` no se concede). Se incluye por defecto en el diseño; puede descartarse en implementación sin impacto contractual.
