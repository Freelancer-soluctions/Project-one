# Design — secret-scanning-history-governance

## Decisiones

1. **CODEOWNERS extendido (no reemplazado).** El repo ya tiene `.github/CODEOWNERS` con equipos (`@Freelancer-soluctions/core-team`, `devops-team`, etc.) y orden tail-wins documentado. Este change _extiende_ ese archivo con entradas para `.gitleaksignore`, `.gitleaks.toml` y `.github/workflows/**`, conservando los equipos y el orden. La aplicación efectiva requiere habilitar la revisión por code owner en el branch ruleset (task 1.2), coordinando con `secret-scanning` tasks 6.x. Owner efectivo: equipo devops (`@Freelancer-soluciones/devops-team`) + @Johan como fallback (riesgo de un solo mantenedor aceptado y documentado, PRD Riesgos).
2. **Guard A5 sin dependencia de red.** Verificar que `git rev-list --count --all` coincide con un umbral versionado en el workflow (o simplemente que `git rev-parse --is-shallow-repository` = false). Se elige la segunda opción por simplicidad y portabilidad.
3. **Detalle del issue desde el JSON.** `notify-failure` lee `gitleaks-report.json` con `actions/github-script` y pega hasta N hallazgos (regla, archivo, commit) truncados, sin imprimir el valor del secreto (ya viene redactado por `--redact`). Si el archivo no existe o no parsea, el issue se crea con el link al run (fallback).
4. **Anti-skip en el agregador.** `prebuild-security-complete` ya usa `contains(needs.*.result, 'failure')`. Se añade `contains(needs.*.result, 'skipped') && github.event_name == 'pull_request'` para que un job saltado en PR falle el agregador. En `merge_group`, el job `secrets` se extiende para que no quede skipped.
5. **Escaneo pre-release en `release.yml`.** Se añade un job `secrets-full-history` con `gitleaks git --log-opts="--all"` (y TruffleHog cuando exista) antes de publicar. Falla el release si hay hallazgos fuera de allowlist.
6. **Capa nativa GitHub.** Habilitar `secret_scanning` y `secret_scanning_push_protection` vía API/UI (repo público → gratis). Documentar en `docs/CONTEXT-CICD.md` §5.7 y el runbook.
7. **Runbook de respuesta.** Nuevo documento `docs/security/secret-incident-response.md` con RR-1..RR-6 y plazo D3 = 24h para equipo de una persona, con registro de incidentes.

## No se toca

- TruffleHog (capacidad `secret-verification`, `ci-shifting-left` Task A6).
- Fail-closed del escaneo programado (`ci-security-hardening`) — este change rebasea su delta en vez de duplicarlo; aplicar **después** de `ci-security-hardening`.
- Binding del job `Secret Detection` al ruleset (`secret-scanning` tasks 6.x).

## Orden de aplicación

1. `ci-security-hardening` (fail-closed + notify-failure job).
2. `secret-scanning` (tasks 6.x, ruleset binding).
3. Este change (`secret-scanning-history-governance`).
