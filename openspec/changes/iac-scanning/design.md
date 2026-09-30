# Design

> **NOTA DE RE-ESCOPO (auditoría 2026-09-27):** este design describe el alcance original (capa base
> IaC + evolución). La capa **base** quedó implementada y especificada por `sca-lockfile-compliance`
> (archivado 2026-09-27, requirement "Capa IaC (Checkov)"): sus D1-D5 son historia vigente como
> implementación ya verificada, NO pendientes de este change. **El alcance activo de este change es
> solo la evolución** (baseline fail-on-new, transición FASE 1 → FASE 2, política tfsec/KICS) — ver
> `proposal.md` y `tasks.md` re-escopados. De las decisiones originales siguen vivas: **D3**
> (transición a blocking, hoy con precondiciones explícitas en el spec) y **D6** (validación local).
> Las referencias L-numéricas de este documento (L765, L1465…) son históricas y frágiles — anclar
> por nombre de job/clave (`checkov-iac`, `prebuild-security-complete.needs`).

## Context

Estado verificado 2026-09-26 (fuente: `docs/learning/iac-scanning.md`):

- `ci.yml`: `repo-discovery` L20, `sast` L408 (Semgrep diff), `dependency-review` L765, `scancode-license-pr-diff` L855 (advisory `continue-on-error`), `prebuild-security-complete` L1465 con `needs: [dependency-review, secrets, scancode-license-pr-diff]`. **IaC en implementación (este change)**: `checkov-iac` (advisory FASE 1, artifact 14d), `checkov-iac-weekly` (scheduled 90d, SARIF), `.checkov.yml` (policy as code), pre-commit advisory (`soft-fail`); no bloquea releases (`advisory`); no reemplaza SAST (`security.yml` CodeQL/semgrep) ni SCA (`security.yml` Trivy/dependency-review).
- `security.yml` (activo 2026-09-25): `dependency-scan` (Trivy filesystem, `category: trivy`) + `sbom` + `sast` (CodeQL) + `semgrep-full-scan`. **Sin checkov/tfsec/kics.**
- `scheduled-security.yml`: cron `0 3 * * 1`, jobs `gitleaks-full-scan` (30d), `scancode-license-audit` (90d, `continue-on-error`), `notify-failure`; `permissions.security-events: write` ya declarado.
- `.github/dependabot.yml` (fuera de `workflows/`): `npm` + `github-actions` + `docker`, weekly lunes 03:00 UTC, `groups.dev-dependencies`.
- Sin `terraform/`, `k8s/`, `pulumi/` ni `Dockerfile`-infra hoy; `docs/ci-cd-pipeline-empresarial.md` §23.3 (Stage 2 Security paralelo), §29 (Containerización) y §32 (IaC en CI/CD) exigen la capa.
- Change vecino `sca-lockfile-compliance` describe la misma capa IaC de pasada (Capa 4) → coordinación de implementación única (ver Decisions).

## Goals / Non-Goals

**Goals:**

- Cero gap IaC: todo `.tf`/manifest infra/`Dockerfile` escaneado en PR y semanalmente, con evidencia SARIF auditable.
- Shift-left en 3 niveles: pre-commit advisory → PR advisory → semanal auditoría 90d.
- Política como código versionada; evolución `advisory` → `blocking` sin rework (baseline desde el día 1 de datos).
- Coste marginal ~0: sin runners dedicados, sin dependencia de `build`, sin nuevos scanners de terceros.

**Non-Goals:**

- Bloquear PRs en FASE 1 (taxonomía `quality-gates.md`: blocking solo tras 2-4 semanas sin FP + baseline).
- Crear infraestructura (`terraform/`, `k8s/`) o escanear artefactos desplegados (eso es post-deploy, §23.3/§29).
- Reemplazar Trivy, dependency-review, ScanCode, OSV ni tocar `security-digest.yml`.
- Activar KICS ni transformadores JSON→SARIF propios.

## Decisions

### Diagrama — pipeline PR (ci.yml) y semanal

```
ci.yml (pull_request)                          scheduled-security.yml (cron 0 3 * * 1)
┌─────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│ repo-discovery (L20)                    │    │ gitleaks-full-scan      (30d, advisory)  │
│      │                                  │    │ scancode-license-audit  (90d, advisory)  │
│      ├─► sast / Semgrep diff (L408)     │    │ checkov-iac-weekly  (NUEVO, 90d, adv.)   │
│      ├─► dependency-review (L765)       │    │   soft: continue-on-error, SARIF         │
│      ├─► secrets (L808)                 │    │   category: checkov-iac                  │
│      ├─► scancode-license-pr-diff(L855) │    │ notify-failure                          │
│      └─► checkov-iac  (NUEVO) ◄─PARALELO│    └──────────────────────────────────────────┘
│            soft_fail: true, SARIF,      │
│            artifact 14d, timeout 10m    │
│      │            (sin dependencia de build)
│      ▼                                  │
│ prebuild-security-complete (L1465)      │
│   needs: [dependency-review, secrets,   │
│           scancode-license-pr-diff]     │
│   FASE 2: + checkov-iac                 │
└─────────────────────────────────────────┘
```

Alineado con `docs/ci-cd-pipeline-empresarial.md` §23.3 (SAST + SCA + IaC en paralelo, pre-build), §29 (contenedores) y §32 (IaC en CI/CD). Nota: `lockfile-audit` (change `sca-lockfile-compliance`) entra en la misma banda paralela, también sin dependencia de `build`.

### D1 — Capa IaC como job nuevo en `ci.yml`, sin reemplazar SAST/SCA/Dependency-Review

Job nuevo `checkov-iac` en la banda paralela pre-build (tras `repo-discovery`, sin dependencia de `build`). **Alternativas**: (a) meter Checkov en `security.yml` → rechazada: `security.yml` corre en `push`/`schedule`, no en PR-time, y mezclaría `category` de SARIF con el `category: trivy` existente; (b) reutilizar job `sast` de Semgrep con pack `p/terraform` → rechazada: Semgrep es generalista, Checkov aporta ~1000 reglas `CKV_AWS_*`/`CKV_AZURE_*`/`CKV_GCP_*` y baseline propio. `dependency-review` (L765) y `license-compliance` quedan intactos.

### D2 — FASE 1 advisory: `soft_fail: true` + evidencia (14d PR / 90d semanal)

`soft_fail: true` en PR y `continue-on-error: true` en el job semanal; SARIF `category: checkov-iac` + artifact `checkov-report-pr` (14d) / `checkov-iac-weekly` (90d, `if: always()`, `if-no-files-found: warn`). **Alternativa**: blocking inmediato → rechazada: con deuda histórica y ruido `CKV_*` fatigaría el equipo (riesgo §6 del doc fuente). Taxonomía idéntica a `sca-lockfile-compliance` (`lockfile-audit`) y `license-compliance`: `advisory` → `blocking` tras período limpio.

### D3 — FASE 2 blocking gradual sobre el agregador existente

Tras 2-4 semanas sin falsos positivos: quitar `soft_fail`, añadir `checkov-iac` al `needs` de `prebuild-security-complete` (L1465, hoy `[dependency-review, secrets, scancode-license-pr-diff]`, anclado **por nombre de job**) y activar `--baseline .checkov.baseline` (`fail-on-new`). El agregador ya sabe interpretar `needs.*.result` (`always()` + checks de `failure`/`cancelled`), así que no requiere rediseño. **Retroceso**: re-añadir `soft_fail: true` y quitar la línea del `needs` (un solo revert).

### D4 — Política como código en `.checkov.yml`, no flags en workflows

Un solo archivo versionado en la raíz (`soft-fail`, `compact`, `quiet`, `framework`, `check`, `skip-check` con comentario por regla), referenciado por `config_file` en ambos jobs (la CLI además lo auto-lee del cwd). **Alternativa**: flags en `ci.yml` → rechazada: dispersa la política en dos workflows, no auditable por CODEOWNERS y obliga a tocar CI para cambiar una regla.

### D5 — Pre-commit advisory, fuera de la cadena `set -e`

Paso `checkov -d . --soft-fail || echo "[IA] Checkov findings (advisory only) — see .checkov.yml"` en `.husky/pre-commit`. **Alternativa**: hook bloqueante → rechazada: el hook actual (`set -e` con lint-staged + SAST + secrets) ya bloquea; añadir IaC bloqueante ahí violaría la regla "la deuda histórica no bloquea commits" (`sast-implementation.md` §3.1 L3). **Coherencia**: misma taxonomía `advisory` → `blocking` (solo PR) que D2/D3 en `sca-lockfile-compliance` y `license-compliance`; el pre-commit NUNCA escala a blocking.

### D6 — Validación local antes de merge

`checkov -d . --soft-fail --check CKV_AWS_1,CKV_AWS_2` como paso documentado pre-merge (misma figura D6 que en `sca-lockfile-compliance`): hallazgos ≥ umbral → corregir `.tf`/`Dockerfile` o registrar en `skip-check`/baseline; retirar `--soft-fail` solo en FASE 2. Sin automatización de remediación forzada.

### D7 — Checkov principal; tfsec archivado; KICS condicional

Checkov elige por: reglas de proveedor (AWS), `--soft-fail` nativo, baseline `fail-on-new` y SARIF `-o sarif` sin transformación. **tfsec**: repo archivado (`Tfsec is now part of Trivy`) → alternativa válida `trivy config`, pero no se añade (Checkov ya cubre HCL). **KICS**: cubre más frameworks pero sin baseline nativo y menos reglas AWS → solo si crece K8s/Pulumi propio. **Coordinación**: los jobs `checkov-iac`/`checkov-iac-weekly` se implementan una sola vez (dueño: este change); en `sca-lockfile-compliance` sus tasks 1.2/3.1/5.2/6.x se marcan como cubiertas para no duplicar definiciones en los mismos workflows.

## Risks / Trade-offs

- **Ruido `CKV_*` en repos sin `.tf`** (scan sobre `Dockerfile`/vacío) → `framework` explícito + `check` selectivo + `skip-check`; revisar tras 2-4 semanas antes de FASE 2.
- **Storage 90d: 3 artifacts semanales** (`gitleaks` 30d, `scancode`, `checkov-iac-weekly`) → nombres diferenciados, SARIF < 100MB; aceptado.
- **Doble definición de job con `sca-lockfile-compliance`** → dueño único (D7) + `openspec validate` de ambos cambios; grep de unicidad en tasks (`grep -c "checkov-iac:" ci.yml == 1`).
- **`upload-sarif` exige `security-events: write`** → declararlo a nivel job; sin él el paso falla (advisory lo tolera en FASE 1, no en FASE 2).
- **Action `bridgecrewio/checkov-action@master` sin pin de versión** → alternativa: invocar la CLI (`pip install checkov`) con pin; se decide en implementación — la semántica del gate no cambia (spec no fija el mecanismo de invocación).

## Migration Plan

1. Land `.checkov.yml` + job `checkov-iac` (advisory) + pre-commit advisory → FASE 1 observando.
2. Land `checkov-iac-weekly` + ajuste `dependabot.yml` + filas `quality-gates.md`/`license-policy.md`.
3. Tras 2-4 semanas sin FP: `checkov --create-baseline` en `main` → FASE 2 (`soft_fail: false`, `--baseline`, `needs` en L1465).
4. Rollback: revert del commit que añade el job (FASE 1) o re-activación de `soft_fail` (FASE 2); ningún estado intermedio rompe el agregador.
