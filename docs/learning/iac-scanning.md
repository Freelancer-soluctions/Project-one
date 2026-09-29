# IaC Scanning (Checkov / tfsec / KICS) — Implementación Profesional / Enterprise

> Verificado 2026-09-26 — referencias oficiales comprobadas (`github.com/bridgecrewio/checkov`, `github.com/aquasecurity/tfsec`, `github.com/Checkmarx/kics`, `owasp.org/www-project-top-ten`). Implementación previa consultada: [`docs/learning/sast-implementation.md`](./sast-implementation.md) (§4.2 `p/terraform` / `p/kubernetes` / `p/dockerfile`; §3.1 semgrep packs; §4.3 mejora notebooks); [`docs/learning/dependency-review.md`](./dependency-review.md) (§2 referencias oficiales corregidas); [`docs/ci-cd-pipeline-empresarial.md`](../ci-cd-pipeline-empresarial.md) §23.3 `Stage 2` Security (SAST, SCA, IaC). Proyecto: monorepo `project-one` (Node/Express + React); `security.yml` activa `dependency-scan` Trivy + `sbom`; `ci.yml` L765 `dependency-review`; `scheduled-security.yml` `scancode-license-audit`; sin `terraform/` ni `pulumi/` ni `k8s/` actualmente, pero arquitectura empresarial requiere cobertura preventiva.
>
> **Nota:** Este documento cubre análisis de infraestructura como código (IaC), no código fuente (SAST: Semgrep/CodeQL) ni dependencias (SCA: Trivy/ScanCode/npm audit). Es capa transversal de `DevSecOps` (§20 pipeline).

---

## 1. Contexto y ubicación en pipeline

**IaC = Infrastructure as Code** (Terraform `.tf`, CloudFormation `.yaml`, Kubernetes `.yaml`, Dockerfile, Pulumi, Ansible, Serverless). Detecta misconfiguraciones de seguridad antes del despliegue: credenciales hardcodeadas, permisos excesivos (`*` en IAM/S3), redes públicas (`0.0.0.0/0`), falta de encriptación, versiones obsoletas de base, etc.

En `docs/ci-cd-pipeline-empresarial.md` §23.3 `Stage 2` (`Security`): SAST + SCA + IaC van en paralelo (pre-build). `docs/learning/sast-implementation.md` §4.2 menciona `p/terraform` como pack de comunidad de Semgrep, reconociendo que el pipeline necesita cobertura IaC pero no la tiene implementada hoy.

Estado verificado (`project-one`):

- `.github/workflows/security.yml`: `dependency-scan` (Trivy filesystem) + `sbom` (`anchore/sbom-action@v0.24.0`) activos (2026-09-25, `state: active`); jobs `sast` (**CodeQL**, `name: SAST - CodeQL`) y `semgrep-full-scan` (Semgrep weekly); sin `checkov` / `tfsec` / `kics`.
- `.github/dependabot.yml` (fuera de `workflows/`): actualizaciones de dependencias npm + GitHub Actions — capa preventiva SCA, no ejecuta IaC; complementa sin duplicar.
- `.github/workflows/ci.yml`: `dependency-review` L765 (manifest PR-time); `prebuild-security-complete` L1465 (`needs [dependency-review, secrets, scancode-license-pr-diff]`); **IaC en implementación (change `iac-scanning`)**: job `checkov-iac` (advisory FASE 1, artifact 14d); `checkov-iac-weekly` (scheduled 90d, SARIF); `.checkov.yml` (policy as code); pre-commit advisory (`soft-fail`); no bloquea releases (`advisory`). No reemplaza SAST (`security.yml` CodeQL/semgrep) ni SCA (`security.yml` Trivy/dependency-review). Referencias: `docs/learning/sast-implementation.md` L240 (`p/terraform`); `docs/ci-cd-pipeline-empresarial.md` §23.3, §29 (`Containerización`) y §32 (`IaC`); `security.yml` `state: active` (sbom + Trivy fs, junto a `dependency-review` en `ci.yml` y `checkov-iac` futuro FASE 2).
- `scheduled-security.yml`: `scancode-license-audit` (semanal, 90d); `gitleaks-full-scan`; sin IaC semanal.
- Directorios `terraform/` / `k8s/` / `pulumi/`: no existen hoy, pero `docs/ci-cd-pipeline-empresarial.md` §29 (`Containerización`) y §32 (`IaC`) documentan que el pipeline debe soportar desplegues con Terraform/CDK/Helm.
- `docs/learning/sast-implementation.md`: `L3 Full-history` (audit semanal, nunca bloquea releases) — patrón aplicable a IaC.

---

## 2. Diferencia técnica: SAST vs SCA vs IaC

| Capa                      | Herramienta ejemplo                               | Qué analiza                            | Fuente de datos                               | Salida                                                        | Uso en `project-one` hoy                                                                                                                    | Gap IaC                                                  |
| ------------------------- | ------------------------------------------------- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **SAST** (código fuente)  | Semgrep (`p/javascript`, `p/typescript`) / CodeQL | Código de aplicación (JS/TS)           | `apps/client/src`, `apps/server/src`          | JSON / SARIF / issues                                         | `security.yml` `sast` (**CodeQL**) + `semgrep-full-scan` (Semgrep weekly); `ci.yml` `sast` (Semgrep diff-scoped, `semgrep/semgrep:1.176.1`) | No cubre `.tf`, `.yaml` Kubernetes, `Dockerfile`         |
| **SCA** (dependencias)    | Trivy / `npm audit` / ScanCode                    | Librerías de terceros (CVE + licencia) | `package-lock.json`, `node_modules`           | SARIF (`trivy`), JSON (`npm audit`), `--json-pp` (`scancode`) | `security.yml` `dependency-scan`; `scheduled-security.yml` `scancode-license-audit`; `ci.yml` `dependency-review`                           | No cubre imagen base `Dockerfile`, bucket S3, IAM policy |
| **IaC** (infraestructura) | `checkov`, `tfsec`, `kics`                        | Configuración de despliegue            | `terraform/`, `k8s/`, `Dockerfile`, `pulumi/` | JSON / SARIF / CLI / PR comment                               | ✅ **Activo** (`checkov-iac`/`checkov-iac-weekly`, change `sca-lockfile-compliance`; ver §9)                                                | `.tf`/`.yaml` infra aún fuera (no existen en el repo)    |

> **Conclusión:** `sast-implementation.md` reconoce `p/terraform` como pack Semgrep, pero no configura un job dedicado de IaC. `security.yml` cubre filesystem (Trivy) y SBOM, no misconfiguraciones de red/permisos en archivos de despliegue.
>
> **Separación de capas sobre el Dockerfile (change `containerfile-lint`, 2026-09-28):** el
> Containerfile lo cubren DOS capas complementarias, no duplicadas: **Checkov** = IaC _policy_
> (CKV*DOCKER**, política `.checkov.yml`, jobs `checkov-iac`/`checkov-iac-weekly`) y **Hadolint\*\* =
> *calidad/higiene\* (ShellCheck sobre `RUN`, pin de versiones, capas consolidadas, registry
> allowlist; política `.hadolint.yaml`, jobs `containerfile-lint`/`containerfile-lint-weekly`).
> Solape parcial aceptado y anotado: CKV_DOCKER_2/4 ≈ DL3006/DL3057 (`quality-gates.md` §2).

---

## 3. Referencias oficiales verificadas (2026-09-26)

| Fuente / URL                                | Estado                                                                                                               | Nota clave / Corrección                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkov (`github.com/bridgecrewio/checkov`) | ✅ 200 HTML                                                                                                          | `checkov` CLI (Python); reglas `checkov --framework terraform --check CKV_AWS_*`; config `.checkov.yml` (`soft-fail`, `compact`, `quiet`; `framework`); integración GitHub Action `bridgecrewio/checkov-action@master`; salida `--output-file-path <folder>` (carpeta, no archivo único); SARIF nativo (`checkov -o sarif --output-file-path .`); JSON (`checkov -o json --output-file-path .`); `--soft-fail` fase 1; `--baseline` (`.checkov.baseline`) para `fail-on-new`; `~1000+` reglas; `checkov --create-baseline`. |
| tfsec (`github.com/aquasecurity/tfsec`)     | ✅ 200 HTML — **deprecado / archivado** (`API: Tfsec is now part of Trivy`); preferir `trivy` IaC o `checkov`/`kics` | `tfsec` CLI (Go); enfocado Terraform/HCL; reglas `tfsec --soft-fail`; salida `--format json`; `tfsec --out tfsec.json`; integración `aquasecurity/tfsec-action`; `tfsec --minimum-severity HIGH`; `tfsec --no-color`; `tfsec --exclude-severity LOW`; no cubre Kubernetes directamente (solo Terraform); **nota: archivado → usar Trivy IaC / Checkov / KICS**                                                                                                                                                              |
| KICS (`github.com/Checkmarx/kics`)          | ✅ 200 HTML                                                                                                          | `kics` CLI (Go); multi-language; reglas `kics scan --no-progress`; salida `--output-path <folder>` (`--report-formats json,sarif --report-name kics`); SARIF (`--report-formats sarif --report-name result`); `kics scan -p . --report-formats sarif --report-name result -o ./results/`; GitHub Action `Checkmarx/kics-action@master`; `kics` cubre más frameworks que `tfsec`; requiere `--path .` con filtro.                                                                                                            |
| OWASP Top 10 2025 / IaC                     | ✅ `owasp.org/www-project-top-ten/` 200                                                                              | A05 (Security Misconfiguration) cubre IaC mal configurado; A01 (Broken Access Control) cubre IAM/S3 excesivo; referencia para reglas de Checkov/KICS.                                                                                                                                                                                                                                                                                                                                                                       |
| `p/terraform` Semgrep pack                  | Referenciado `sast-implementation.md` §4.2                                                                           | Semgrep cubre `.tf` vía `p/terraform`; no reemplaza Checkov/KICS (Semgrep es general; Checkov/KICS son especializados con reglas de políticas específicas de proveedor de nube).                                                                                                                                                                                                                                                                                                                                            |

---

## 4. Herramientas — comparación profesional

| Característica                     | Checkov                                                                     | tfsec                                       | KICS                                                                           | Observación para `project-one`                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lenguaje / framework**           | Terraform, CloudFormation, Kubernetes, Dockerfile, Serverless, Ansible, ARM | Terraform / HCL                             | Terraform, Kubernetes, CloudFormation, Dockerfile, Ansible, Pulumi, Serverless | `KICS` = más amplio; `tfsec` = especializado Terraform; `Checkov` = más reglas de proveedor (AWS, Azure, GCP)                                  |
| **Reglas (policies)**              | `~1000+` (`CKV_AWS_`, `CKV_AZURE_`, `CKV_GCP_`)                             | `~100` (HCL focus)                          | Susceptibles por framework (`~100-200`)                                        | Checkov más completo para AWS; KICS mejor para Kubernetes multi-cloud                                                                          |
| **Baseline (`fail-on-new`)**       | `--baseline` (`.checkov.baseline`)                                          | `tfsec --soft-fail` + `tfsec --ignore-file` | No baseline nativo (usar `--exclude` / filtro)                                 | **Checkov gana** para evolución progresiva (`fail-on-new` es clave enterprise)                                                                 |
| **Salida**                         | JSON / SARIF (via `checkov -o sarif`) / CLI                                 | JSON / SARIF (nativo con `--format sarif`)  | JSON / SARIF (nativo `--output-path`)                                          | `KICS` y `tfsec` SARIF nativo (`--format sarif` / `--output-path`); `Checkov` SARIF nativo (`checkov -o sarif`) — sin transformación necesaria |
| **Integración GitHub Action**      | `bridgecrewio/checkov-action`                                               | `aquasecurity/tfsec-action@master`          | `Checkmarx/kics-action@master`                                                 | Todas disponibles; `Checkov` más usado en enterprise por reglas AWS                                                                            |
| **Continuación en error (fase 1)** | `--soft-fail` (`.checkov.yml`)                                              | `--soft-fail`                               | `continue-on-error: true` (CI level)                                           | Todos soportan advisory → blocking gradual                                                                                                     |
| **Evidence / artifact**            | `upload-artifact` (JSON / SARIF / 90d)                                      | `upload-artifact` / `upload-sarif`          | `upload-artifact` / `upload-sarif`                                             | Alineado con `scheduled-security.yml` (90d) y `security.yml` (SARIF)                                                                           |
| **Pre-commit / local**             | `checkov -d . --soft-fail`                                                  | `tfsec --soft-fail`                         | `kics scan --no-progress`                                                      | Recomendado `checkov` por `soft-fail` nativo y rapidez                                                                                         |
| **Cosmética / ruido**              | Alto si se activa todo (`CKV_*`)                                            | Medio                                       | Medio                                                                          | Requiere `framework` explícito + `check` selecto + `skip-check` para reducir ruido                                                             |

**Recomendación para `project-one`:** usar `Checkov` como capa principal (AWS rules, `--soft-fail`, `--baseline` posible, `.checkov.yml` política como código) + `KICS` como capa secundaria para Kubernetes/Pulumi si crecen. No usar `tfsec` si `Checkov` cubre Terraform; `tfsec` es útil solo si se quiere un análisis más rápido y específico de HCL con menos reglas.

---

## 5. Implementación empresarial / profesional — patrones

### 5.1 Pipeline (pre-build, shift-left)

```yaml
# .github/workflows/ci.yml — nuevo job o paso en security pre-build
# Alínea con prebuild-security-complete.needs (L1465) si se quiere bloqueante fase 2
checkov-iac:
  name: IaC Scanning (Checkov)
  runs-on: ubuntu-latest
  timeout-minutes: 10
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write # si se sube SARIF
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0
    - name: Checkov (advisory fase 1)
      uses: bridgecrewio/checkov-action@master
      with:
        directory: .
        framework: terraform # o 'kubernetes', 'dockerfile', 'cloudformation', 'all'
        output_format: sarif
        output_file_path: checkov.sarif
        soft_fail: true # fase 1: no bloquea; continua para reportar
        check: CKV_AWS_1,CKV_AWS_2 # selectivo; no todos
    - name: Upload SARIF (evidencia)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: checkov.sarif
    - name: Upload JSON artifact (14d, advisory)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: checkov-report-pr
        path: checkov.sarif # SARIF generado con -o sarif; JSON con -o json
        retention-days: 14
```

- **Fase 1 (advisory)**: `soft_fail: true`; `continue-on-error: true`; artifact 14d; no bloquea `prebuild-security-complete`; feedback al PR vía PR comment (opcional, `checkov-action` no emite comment nativo; requiere transformación o `pr-comment` personalizado).
- **Fase 2 (blocking gradual)**: `soft_fail: false`; añadir `checkov-iac` a `prebuild-security-complete.needs`; bloquear solo tras 2-4 semanas sin falsos positivos y tras ajuste de reglas (`check` selectivo, `skip-check` para reglas ruidosas).
- **Baseline**: `checkov --baseline .checkov.baseline` para `fail-on-new`; crear baseline en `main` tras primer scan limpio.

### 5.2 Semanal / full repo (auditoría, evidencia 90d)

```yaml
# .github/workflows/scheduled-security.yml — extender existente (L105 scancode-license-audit)
checkov-iac-weekly:
  name: IaC Scan Weekly
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'
  steps:
    - uses: actions/checkout@v5
    - name: Checkov weekly
      uses: bridgecrewio/checkov-action@master
      with:
        directory: .
        framework: all
        output_format: sarif
        output_file_path: checkov-weekly.sarif
        soft_fail: true
    - name: Upload evidence (90d)
      uses: actions/upload-artifact@v4
      with:
        name: checkov-iac-weekly
        path: checkov-weekly.sarif
        retention-days: 90
    - name: Sarif upload
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: checkov-weekly.sarif
```

- **Coherencia con `scancode-license-audit`**: ambos semanales, 90d, `continue-on-error: true`; no duplican (uno analiza archivo fuente licencia, otro analiza configuración infra CVE).
- **SBOM / provenance**: no aplica directamente, pero `security.yml` ya genera SBOM (`sbom` job); IaC no requiere SBOM de librerías, pero sí evidencia de configuración (JSON/SARIF).

### 5.3 Política como código (`.checkov.yml` / `.kics`)

```yaml
# .checkov.yml — política de IaC para el repo (versionado, auditable)
soft-fail: true
compact: true
skip-check:
  - CKV_AWS_18 # ejemplo: regla ruidosa en este repo
check:
  - CKV_AWS_1
  - CKV_AWS_2
  - CKV_AWS_3
framework:
  - terraform
  - kubernetes
  - dockerfile
  - cloudformation
```

- **Enterprise**: `.checkov.yml` es `Policy as Code`; auditable; versionado; se modifica vía PR (`CODEOWNERS` `docs/learning/` o `security/`); se valida con `checkov --config-file .checkov.yml`.
- **Fail-on-new gradual**: `--baseline .checkov.baseline` creado tras primer scan limpio; luego `fail-on-new` solo reporta nuevos hallazgos en PR.

### 5.4 Pre-commit / local (shift-left)

```bash
# .husky/pre-commit (o script check local)
# Nota: no bloquear commit si hay deuda histórica; solo informativo
checkov -d . --framework terraform --soft-fail --check CKV_AWS_1,CKV_AWS_2 || echo "[IA] Checkov findings (advisory only) — see .checkov.yml"
```

- **No debe ser bloqueante** (`soft-fail`) porque deuda histórica requiere remediación planificada (`sast-implementation.md` §4.3, §3.1 L3 Full-history).

---

## 6. Limitaciones y riesgos (corporativo)

| Riesgo                                                                                                               | Impacto                                                                                                                                                                                                                                                | Mitigación / Documento                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkov` sin `soft-fail` bloquea todo PR con deuda histórica                                                        | Bloqueo excesivo; fatiga                                                                                                                                                                                                                               | `soft-fail: true` + `.checkov.yml` `skip-check`; `fail-on-new` solo tras baseline                                                              |
| Ruido de reglas (`CKV_*` excesivo)                                                                                   | Falsos positivos; desgaste                                                                                                                                                                                                                             | Filtrar `check` + `framework` explícito; usar `skip-check`; revisar `base` tras 2-4 semanas                                                    |
| `tfsec` / `kics` requieren framework específico; `tfsec` no cubre Kubernetes                                         | Si repo usa Kubernetes pero solo `tfsec`, se pierde cobertura                                                                                                                                                                                          | Usar `Checkov` (`framework: kubernetes`) o `KICS` (§4) como capa secundaria                                                                    |
| `security.yml` Trivy cubre filesystem / `node_modules`; no reemplaza IaC                                             | Confusión de capas                                                                                                                                                                                                                                     | Documentar claramente en `docs/learning/iac-scanning.md`; no eliminar Trivy, complementar                                                      |
| `scancode-license-audit` (semanal) + `checkov-iac-weekly` (semanal) = 2 artifacts 90d                                | Coste de almacenamiento; pero < 100MB cada uno                                                                                                                                                                                                         | `retention-days: 90`; usar `actions/upload-artifact` con nombres diferenciados (`scancode-license-audit` vs `checkov-iac-weekly`)              |
| `npm audit` / `scancode` / `checkov` son independientes; un PR con cambios en `.tf` + `package.json` dispara 3 gates | Tiempo de CI; pero pre-build paralelo (`repo-discovery` DAG) mantiene rápido                                                                                                                                                                           | `checkov-iac` paralelo a `dependency-review`; no depende de `build`; `timeout-minutes: 10`                                                     |
| No hay `terraform/` hoy                                                                                              | Scan sobre `.` vacío o con `Dockerfile` solo puede ser ruidoso                                                                                                                                                                                         | Activar `framework: dockerfile` (si hay `Dockerfile`) y `terraform` (cuando aparezca); usar `check` selectivo hasta que crezca infra           |
| Bloqueos conocidos (reporte researcher 2026-09-26)                                                                   | `scancode` no en PATH → mitigación `docker pull aboutcode/scancode-toolkit:32.5.0`; `scan-list.txt` inexistente → lista PR-diff `git diff --name-only --diff-filter=ACMR`; `npm audit` sin SARIF nativo → usar Trivy `upload-sarif@v4` o transformador | Referenciar `docs/learning/sca-dependency-lockfile-scan.md` §9; validar `docker pull` antes de merge; no crear `scan-list.txt` artificialmente |

---

## 7. Decisiones propuestas para `project-one` (coherentes con pipeline existente)

1. **D1 — Añadir capa IaC sin reemplazar SAST/SCA/Dependency-Review:** `checkov-iac` (o `kics-iac`) como job pre-build; `dependency-review` L765 (manifest PR) y `security.yml` `dependency-scan` (Trivy filesystem) permanecen.
2. **D2 — Fase 1 advisory (`soft-fail: true`, `continue-on-error: true`, artifact 14d PR / 90d semanal):** no bloqueante inicial; feedback al desarrollador; baseline creado tras primer scan limpio.
3. **D3 — Fase 2 blocking gradual (`soft-fail: false`, añadido a `prebuild-security-complete.needs`, tras 2-4 semanas sin falsos positivos):** bloquea solo hallazgos nuevos (`fail-on-new`) y tras ajuste de reglas (`skip-check`).
4. **D4 — Política como código (`.checkov.yml`):** versionado, auditable, `CODEOWNERS`; no hardcodear reglas en `ci.yml`.
5. **D5 — Pre-commit local (advisory):** `checkov -d . --soft-fail`; no bloquea commit histórico (`sast-implementation.md` §3.1 L3).
6. **D6 — Validación local antes de merge:** `checkov -d . --soft-fail --check CKV_AWS_1,CKV_AWS_2`; si hallazgos > umbral → corregir `.tf`; para fase 2 quitar `--soft-fail` solo tras `baseline` limpio y 2-4 semanas sin falsos positivos.

> **Nota:** D2/D3 replican exactamente la taxonomía `quality-gates.md` y el cambio `license-compliance` / `sca-lockfile-compliance`: `advisory` → `blocking` tras período sin falsos positivos y con baseline.

---

## 8. Fuentes (verificadas esta sesión / referencias internas)

- `github.com/bridgecrewio/checkov` (200 HTML); `checkov --soft-fail`; `checkov --baseline`; `.checkov.yml`; `checkov -o sarif`
- `github.com/aquasecurity/tfsec` (200 HTML); `tfsec --soft-fail`; `tfsec --format sarif`
- `github.com/Checkmarx/kics` (200 HTML); `kics scan --no-progress`; `kics --output-path kics.sarif`
- `owasp.org/www-project-top-ten/` (200) — A05 Security Misconfiguration
- Referencias internas: `docs/learning/sast-implementation.md` (§4.2 `p/terraform`, §3.1 L3 Full-history, §4.3 remediación); `docs/learning/dependency-review.md` (§2 referencias corregidas); `docs/ci-cd-pipeline-empresarial.md` §23.3; `docs/learning/license-compliance.md`; `.github/workflows/security.yml`; `.github/workflows/ci.yml` L765/1465/1469

---

## 9. Estado del documento

- Creado: `docs/learning/iac-scanning.md` (2026-09-26)
- Revisión cruzada: coherente con `sast-implementation.md` (packs Semgrep `p/terraform` reconocen necesidad); no duplica `dependency-review.md` (manifest) ni `license-compliance.md` (archivo + licencia); complementa `sca-dependency-lockfile-scan.md` (CVE lockfile) con capa infra CVE.
- Siguiente paso: verificar/implementar las tasks del change `iac-scanning` (artifacts completos: `proposal.md`, `design.md`, `tasks.md`, `specs/iac-scanning/spec.md`) y archivarlo tras la validación; revisar `prebuild-security-complete.needs` (L1465) y mantener filas en `quality-gates.md`.
- **IMPLEMENTADO (change `sca-lockfile-compliance`, 2026-09-26):** job `checkov-iac` en `ci.yml` (FASE 1 advisory: `soft_fail: true`, política `.checkov.yml` vía input `config_file`, artifact `checkov-report-pr` 14d) + job `checkov-iac-weekly` en `scheduled-security.yml` (SARIF `category: checkov-iac` + artifact 90d, sin ruta blocking) + paso local advisory en `.husky/pre-commit`; filas en `quality-gates.md` §2/§4.4.
- **Change `iac-scanning` creado (2026-09-26)** en `openspec/changes/iac-scanning/` con artifacts completos (`proposal.md`, `design.md`, `tasks.md`, `specs/iac-scanning/spec.md`) — corrige la nota anterior que negaba su existencia (verificado con `openspec list`: change activo, 0/26 tasks); siguiente paso: implementar/verificar tasks y archivar.
- **RE-ESCOPO del change `iac-scanning` (auditoría 2026-09-27): capa de EVOLUCIÓN.** La capa IaC base
  ya está implementada y especificada por `sca-lockfile-compliance` (archivado 2026-09-27, requirement
  "Capa IaC (Checkov)") — este change NO re-especifica los jobs (cero doble ownership). Alcance
  activo: (1) baseline `.checkov.baseline` fail-on-new (no existe hoy, correcto para FASE 1),
  (2) transición FASE 1 advisory → FASE 2 blocking con precondiciones (2-4 semanas sin FP + baseline
  versionado + ruido en `skip-check`) y rollback en un revert (quitar `checkov-iac` del `needs` de
  `prebuild-security-complete` + re-añadir `soft_fail: true`), (3) política de tooling IaC: tfsec NO
  (repo archivado upstream, absorbido por Trivy; alternativa `trivy config`), KICS solo condicional a
  Kubernetes/Pulumi propios. Delta validado `--strict`; `tasks.md` §1 marcado [x] con evidencia 1:1;
  design.md lleva nota de re-escopo (D3/D6 siguen vivas, resto histórico).
- **Pendiente real de este change:** run real de checkov (Docker daemon caído — validar vía
  `workflow_dispatch` de `checkov-iac-weekly` en CI o al reactivar Docker), clasificar ruido en
  `skip-check`, generar `.checkov.baseline`, y después la transición FASE 2 gated.
