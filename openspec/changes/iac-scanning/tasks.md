# Tasks

> **RE-ESCOPO (2026-09-27, auditoría del change):** la capa IaC **base** ya está implementada y
> verificada — pero por el change hermano `sca-lockfile-compliance` (archivado 2026-09-27), cuyo
> spec main lleva el requirement "Capa IaC (Checkov)". Evidencia verificada 1:1: job `checkov-iac`
> en `ci.yml` (checkov-action@v12, `soft_fail: true`, `config_file: .checkov.yml`, artifact
> `checkov-report-pr` 14d, fuera del agregador), job `checkov-iac-weekly` en
> `scheduled-security.yml` (docker checkov:3, SARIF `category: checkov-iac` con guard hashFiles,
> artifact 90d), `.checkov.yml` versionado (dockerfile/terraform/kubernetes), paso advisory en
> `.husky/pre-commit` (L41, fuera de `set -e`), `.github/dependabot.yml` con grupo
> `security-patches` + cooldown, docs actualizados (`quality-gates.md` ×3, `license-policy.md` §6).
> **Este change queda como capa de EVOLUCIÓN** (baseline fail-on-new, transición FASE 1 → FASE 2,
> política de tooling tfsec/KICS) — cero doble ownership de los jobs.
>
> **Notas de auditoría del scoping anterior:** (1) task 1.2 antigua exigía upload-sarif en el job
> PR; la implementación real es artifact-only en PR (SARIF al Security tab solo en el weekly) —
> decisión conservada, la evolución FASE 2 no la requiere. (2) task 3.2 antigua verificaba
> `config_file: .checkov.yml` = 1+1, pero el weekly usa la CLI docker con `--config-file` (misma
> política, otra sintaxis). (3) L-refs frágiles (L765/L1465/…) reemplazadas por anclas por nombre
> de job/clave. (4) Riesgo del design "action @master sin pin" ya resuelto en la implementación
> (checkov-action@v12).

## 1. Capa base (ya implementada — dueño: `sca-lockfile-compliance`, NO re-implementar)

- [x] 1.1 Job `checkov-iac` PR-time en `ci.yml` — ✅ verificado: `grep -c "checkov-iac:" ci.yml` = 1; checkov-action@v12, `soft_fail: true`, `config_file: .checkov.yml`, artifact `checkov-report-pr` 14d (`if: always()`, warn), `timeout-minutes: 10`, `needs: repo-discovery`, `if: pull_request`. En FASE 1 NO está en el `needs` de `prebuild-security-complete` (verificado: needs = `[dependency-review, secrets, scancode-license-pr-diff]`).
- [x] 1.2 Job `checkov-iac-weekly` en `scheduled-security.yml` — ✅ verificado: docker `bridgecrew/checkov:3` con `--config-file /io/.checkov.yml` + soft-fail; upload-sarif@v4 `category: checkov-iac` con guard `hashFiles('checkov-weekly.sarif') != ''`; artifact `checkov-iac-weekly` 90d (`if: always()`, warn); `continue-on-error`; sin `trivy-action` nuevo; jobs `gitleaks-full-scan`/`scancode-license-audit`/`notify-failure` intactos.
- [x] 1.3 `.checkov.yml` policy-as-code en raíz (soft-fail, compact, quiet, frameworks dockerfile/terraform/kubernetes) + paso pre-commit advisory (`.husky/pre-commit` L41, fuera de `set -e`) + `.github/dependabot.yml` con `security-patches` + cooldown — ✅ todos verificados.
- [x] 1.4 Integridad de capas vecinas — ✅ `deny-licenses` sin eliminaciones en el diff; sin `scan-list.txt`; `security-digest.yml` sin cambios; documentación cruzada sin duplicar filas (`quality-gates.md`, `license-policy.md` §6).

## 2. Baseline `fail-on-new` (este change)

- [ ] 2.1 Primer run real estable: activar Docker (o validar en CI) y correr `checkov-iac-weekly` vía `workflow_dispatch`; clasificar el ruido en `skip-check` de `.checkov.yml` (comentario por regla).
- [ ] 2.2 Generar y versionar `.checkov.baseline` con `checkov --create-baseline` en `main` tras el run estable; documentar en el archivo la fecha y el número de hallazgos absorbidos.
- [ ] 2.3 Verificar que FASE 1 (actual) NO pasa `--baseline` en ningún job (el modo `fail-on-new` solo entra con FASE 2, task 3.2).

## 3. Transición FASE 1 → FASE 2 (este change, gated por 2.1/2.2 + 2-4 semanas sin falsos positivos)

- [ ] 3.1 Quitar `soft_fail: true` del job `checkov-iac` en `ci.yml`.
- [ ] 3.2 Añadir `checkov-iac` al `needs` del agregador `prebuild-security-complete` (anclado por nombre de job; el agregador ya interpreta `needs.*.result` con `always()`) y activar `--baseline .checkov.baseline` en el step del job (`fail-on-new`).
- [ ] 3.3 Rollback documentado: un solo revert re-añade `soft_fail: true` y quita la línea del `needs`; `checkov-iac-weekly` permanece advisory siempre.
- [ ] 3.4 Validación del gate: PR de prueba que introduce una misconfig nueva (p. ej. Dockerfile sin usuario no-root) → el gate falla; PR solo-deuda-histórica → pasa por baseline.

## 4. Política de tooling y validación (este change)

- [ ] 4.1 Confirmar en `docs/learning/iac-scanning.md` la política: Checkov principal, tfsec NO (repo archivado; alternativa `trivy config`), KICS condicional a Kubernetes/Pulumi propios — sin jobs `tfsec`/`kics` en el pipeline.
- [ ] 4.2 Validación local (D6): `checkov -d . --soft-fail` lee `.checkov.yml` del cwd — documentado; corrida real pendiente de entorno (Docker daemon caído / checkov no está en PATH); la evidencia real llega del job CI o del weekly dispatch.
- [x] 4.3 Validación final: `openspec validate iac-scanning --strict` → válido; `openspec list` muestra el change activo; `--specs --strict` sin regresiones. ✅ ejecutado 2026-09-27: change válido, activo (4/14 tasks), specs 117/117 (antes 112; sin regresión); `docs:lint` sin violaciones nuevas en las líneas tocadas de `docs/learning/iac-scanning.md` (baseline legacy intacto).
