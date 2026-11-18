# Proposal

## Why

La capa de escaneo IaC (Policy as Code con Checkov) **ya está implementada y especificada** en la capability `sca-lockfile-compliance` (archivada 2026-09-27; requirement "Capa IaC (Checkov)": job PR `checkov-iac` advisory con artifact 14d, job `checkov-iac-weekly` con SARIF `category: checkov-iac` y evidencia 90d, política `.checkov.yml` versionada, pre-commit advisory, ajuste de `dependabot.yml`). La auditoría de este change (2026-09-27) verificó esa base 1:1 contra el código.

Lo que **ninguna capability cubre hoy** es el camino de madurez de esa capa:

1. **Baseline `fail-on-new`** (`.checkov.baseline`): sin él, la FASE 2 bloqueante re-abriría toda la deuda histórica de misconfig en cada PR.
2. **Transición FASE 1 advisory → FASE 2 blocking** con precondiciones explícitas (2-4 semanas sin falsos positivos + baseline + ruido clasificado) y **rollback en un revert**.
3. **Política de tooling IaC**: `tfsec` está archivado upstream (absorbido por Trivy) — el repo necesita la decisión registrada (Checkov principal; `trivy config` como alternativa HCL; KICS solo condicional a Kubernetes/Pulumi propios) para evitar re-introducir herramientas muertas.

Contexto de repo: la única IaC real hoy es `apps/server/Dockerfile` (no hay `terraform/`/`k8s/`); el scan no es vacuo, y `docs/ci-cd-pipeline-empresarial.md` §23.3/§29/§32 anticipa infra como código creciente.

## What Changes

- **Re-escopo del change** (auditoría 2026-09-27): el delta se recorta a la capa de **evolución**. Los requirements de la capa base (jobs PR/weekly, política, pre-commit, dependabot, separación de capas, D6) **quedan como especificación vigente en `sca-lockfile-compliance`** y este change no los duplica — cero doble ownership de los mismos jobs.
- **Baseline `fail-on-new`**: generar y versionar `.checkov.baseline` tras el primer run advisory estable en `main` (ruido clasificado en `skip-check`); FASE 1 no lo usa.
- **FASE 2 gated**: quitar `soft_fail: true` de `checkov-iac`, añadirlo al `needs` de `prebuild-security-complete` (anclado por nombre de job) y activar `--baseline .checkov.baseline`; precondiciones: 2-4 semanas sin falsos positivos + baseline versionado; rollback = un revert. `checkov-iac-weekly` permanece advisory siempre.
- **Política de tooling**: sin jobs `tfsec` ni `kics`; documentada en `docs/learning/iac-scanning.md`.

Fuera de alcance: no se re-implementan ni re-especifican los jobs existentes (dueño: `sca-lockfile-compliance`); no se reemplaza `security.yml` (`category: trivy` intacto); no se toca `security-digest.yml` ni `deny-licenses`; no se crean `terraform/`/`k8s/` artificiales ni `scan-list.txt`; nada se vuelve bloqueante hasta las precondiciones de FASE 2.

## Capabilities

### New Capabilities

- `iac-scanning`: evolución de la capa IaC — baseline `fail-on-new` (`.checkov.baseline`), transición advisory → blocking de `checkov-iac` (FASE 2 con precondiciones y rollback), y política de tooling IaC (tfsec deprecated → Checkov/`trivy config`; KICS condicional). La capa base (jobs, política, pre-commit, prevención) vive en la capability `sca-lockfile-compliance`.

### Modified Capabilities

<!-- none — `sca-lockfile-compliance` ya archivado define la capa base vigente ("Capa IaC (Checkov)"); este change la referencia y solo añade la evolución. No se modifican sus requirements. -->

## Impact

- **Archivos nuevos (futuros, gated por FASE 2 / run estable)**: `.checkov.baseline` (raíz).
- **Archivos modificados (gated por FASE 2)**: `.github/workflows/ci.yml` (quitar `soft_fail`, `--baseline`, añadir `checkov-iac` al `needs` de `prebuild-security-complete`).
- **Docs**: `docs/learning/iac-scanning.md` (política de tooling + estado); referencias cruzadas a `sca-lockfile-compliance` como capa base.
- **Sin cambios**: `.github/workflows/security.yml`, `security-digest.yml`, `deny-licenses`, `dependabot.yml` (ya ajustado), pre-commit (ya implementado), código de aplicación.
- **Riesgo retirado**: el design anterior contemplaba `checkov-action@master` sin pin; la implementación real usa `@v12` (verificado).
