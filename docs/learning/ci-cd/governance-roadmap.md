# Governance Roadmap — Matriz de Cobertura (documentación TOTAL ↔ changes OpenSpec)

> **Puente entre documentación de aprendizaje (comprehensiva) y changes de implementación (atómicos).**
> Fecha: 2026-08-27 · Monorepo Node.js/Express + React (project-one) · GitHub Actions.
>
> **Propósito:** mapear cada concepto/capacidad de governance documentada en la matriz TOTAL (7 momentos + 10 dimensiones transversales + capas operacional y supply-chain) hacia su **change OpenSpec destino** y su **estado real** (implemented / deferred / reference / documentation-only). Así la cobertura documental total no "infla" ningún change de implementación: se rastrea por separado.
>
> **Change activo actual:** `ci-governance-pre-merge-gates` (renombrado 2026-08-27 desde `ci-governance-gates-culmination`). Hace **REQUIRED** (vía `ci.yml:ci-complete` fan-in + ruleset `21227644`) SOLO los gates pre-PR/merge (Levels 2-3): `dependency-review` (L2, control SECURITY preexistente en `security.yml`, **no** es capability nueva) + `ruleset-expansion` (L3). El resto de la cobertura TOTAL está documentado y diferido.

---

## 1. Tabla principal de cobertura

Cada fila = un concepto/capacidad de governance. Columnas: **Concepto/Capacidad · Momento · Dominio · Change destino · Estado · Implementación/ubicación**.

> **Leyenda de estado** (ver §3): `implemented` = live en repo; `deferred` = change futuro nombrado; `reference` = plantilla/referencia en docs (no workflow); `documentation-only` = en artículos, no implementable en repo.

### 1.1 Pre-PR/merge — ACTIVO en `ci-governance-pre-merge-gates` (estado: implemented)

| Concepto/Capacidad                                 | Momento | Dominio     | Change destino                                                            | Estado                                                  | Implementación/ubicación                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------- | ------- | ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firma de commits (GPG/SSH/Sigstore)                | COMMIT  | Commit-time | `ci-governance-pre-merge-gates` (heredado de `ci-pr-metadata-governance`) | implemented                                             | `.github/workflows/ci.yml:verify-signatures` + Husky `commit-msg`                                                                                                                                                                                                                                                                   |
| Commit lint (Conventional Commits)                 | COMMIT  | Commit-time | `ci-governance-pre-merge-gates`                                           | implemented                                             | `ci.yml:commit-lint` + Husky                                                                                                                                                                                                                                                                                                        |
| Pre-commit secret scan (Gitleaks)                  | COMMIT  | Commit-time | prebuild (control existente, no de este change)                           | implemented                                             | Husky pre-commit + `security.yml:secrets`                                                                                                                                                                                                                                                                                           |
| PR metadata (DCO, PR title, templates)             | PR      | PR-time     | `ci-governance-pre-merge-gates` (de `ci-pr-metadata-governance`)          | implemented                                             | `ci.yml:dco`, `ci.yml:pr-title-lint` (no-bloqueantes en fase adopción)                                                                                                                                                                                                                                                              |
| CODEOWNERS review enforcement                      | PR      | PR-time     | `ci-governance-pre-merge-gates` (L3 ruleset-expansion)                    | implemented                                             | ruleset `21227644` → `require_code_owner_review`                                                                                                                                                                                                                                                                                    |
| Dependency review (SCA en diff, bloquea moderate+) | PR      | SECURITY    | `ci-governance-pre-merge-gates` (L2, hace REQUIRED control preexistente)  | implemented                                             | `security.yml:dependency-review` (control SECURITY preexistente) — hecho REQUIRED por `ci-governance-pre-merge-gates` vía `ci.yml:ci-complete` fan-in (`needs: [dependency-review]`) + ruleset `21227644` `required_status_checks`. **Único home: `security.yml`** (no `dependency-review.yml`). No es capability nueva del change. |
| Early-abort SAST en diff (Semgrep/CodeQL)          | PR      | PR-time     | prebuild (control existente)                                              | implemented                                             | `ci.yml:verify-signatures` / `security.yml:sast`                                                                                                                                                                                                                                                                                    |
| Required status checks (fan-in `ci-complete`)      | MERGE   | Merge-time  | `ci-governance-pre-merge-gates` (L3)                                      | implemented                                             | ruleset `21227644` → `required_status_checks`                                                                                                                                                                                                                                                                                       |
| Required reviews + CODEOWNERS                      | MERGE   | Merge-time  | `ci-governance-pre-merge-gates` (L3)                                      | implemented                                             | ruleset `21227644` (`required_approving_review_count` ≥ 1)                                                                                                                                                                                                                                                                          |
| Required signatures (commits firmados)             | MERGE   | Merge-time  | `ci-governance-pre-merge-gates` (L3)                                      | implemented                                             | ruleset `21227644` → `required_signatures` + Admin-1 squash                                                                                                                                                                                                                                                                         |
| Linear history / no force-push                     | MERGE   | Merge-time  | `ci-governance-pre-merge-gates` (L3)                                      | implemented                                             | ruleset `21227644` → `required_linear_history`, `non_fast_forward`                                                                                                                                                                                                                                                                  |
| Merge queue                                        | MERGE   | Merge-time  | GitHub Rulesets (capacidad del ruleset)                                   | implemented\*                                           | ruleset `21227644` (configuración de habilitación pendiente de decisión)                                                                                                                                                                                                                                                            |
| Bypass policies (SoD / 4-eyes para admin)          | MERGE   | Merge-time  | `ci-governance-pre-merge-gates` + dimensión RBAC transversal              | implemented (ruleset) / documentation-only (SoD humano) | ruleset `21227644`                                                                                                                                                                                                                                                                                                                  |

> `*implemented*` = capacidad real de GitHub Rulesets disponible; su habilitación es una decisión de configuración, no un entregable de código nuevo. No se cuenta como "gobernanza documentada implementada por este change".

### 1.2 Post-merge — DIFERIDO a changes futuros (estado: deferred)

| Concepto/Capacidad                                                | Momento        | Dominio        | Change destino                                      | Estado   | Implementación/ubicación                                             |
| ----------------------------------------------------------------- | -------------- | -------------- | --------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| GitHub Environments + required reviewers (staging/production)     | DEPLOY         | Deploy-time    | `ci-deploy-gating`                                  | deferred | `.github/workflows/deploy-gating.yml` (futuro)                       |
| Wait timer / deployment freeze                                    | DEPLOY         | Deploy-time    | `ci-deploy-gating`                                  | deferred | GitHub Environments (futuro)                                         |
| Custom protection rules (CAB/SRB)                                 | DEPLOY         | Deploy-time    | `ci-deploy-gating`                                  | deferred | GitHub App + humano (futuro)                                         |
| Change record / ticket linkage                                    | DEPLOY         | Change mgmt    | `ci-deploy-gating`                                  | deferred | ref ITSM en commit (futuro)                                          |
| Rollback plan validado (gate pre-deploy)                          | DEPLOY         | Change mgmt    | `ci-rollback-strategy`                              | deferred | migration down gate (futuro)                                         |
| Post-deploy smoke tests / health checks                           | POST-DEPLOY    | Post-deploy    | `ci-deploy-gating`                                  | deferred | `smoke-test.yml` (futuro)                                            |
| Canary/baseline + auto-rollback                                   | POST-DEPLOY    | Post-deploy    | `ci-rollback-strategy`                              | deferred | Argo Rollouts / deploy-gating (futuro)                               |
| Release readiness sign-off                                        | POST-DEPLOY    | Sign-off       | `ci-deploy-gating` (o `ci-contributing-governance`) | deferred | acceptance record (futuro)                                           |
| Rollback / fix-forward runbooks (`rollback.md`, `fix-forward.md`) | AUDIT/Recovery | Recovery       | `ci-rollback-strategy`                              | deferred | `docs/runbooks/rollback.md`, `docs/runbooks/fix-forward.md` (futuro) |
| Audit trail inmutable (WORM)                                      | AUDIT          | Audit/recovery | `ci-audit-streaming`                                | deferred | deployment event record (futuro)                                     |
| DORA metrics (4 claves)                                           | AUDIT          | Audit/recovery | `ci-audit-streaming`                                | deferred | deploy freq, lead time, CFR, MTTR (futuro)                           |
| Compliance evidence archive                                       | AUDIT          | Compliance     | `ci-audit-streaming`                                | deferred | SOC2/ISO27001/SSDF evidence (futuro)                                 |
| CONTRIBUTING.md governance gates doc                              | (contributing) | Governance     | `ci-contributing-governance`                        | deferred | `CONTRIBUTING.md` (futuro)                                           |

### 1.3 Capa GOVERNANCE TRANSVERSAL (CONTINUOUS) — DOCUMENTACIÓN-ONLY

| Concepto/Capacidad                                               | Momento    | Dominio                | Change destino                       | Estado             | Implementación/ubicación                                                |
| ---------------------------------------------------------------- | ---------- | ---------------------- | ------------------------------------ | ------------------ | ----------------------------------------------------------------------- |
| 1. Human repo access governance (RBAC, 4-eyes)                   | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | GitHub repo roles (ver §20-governance-stage.md §"1. Human repo access") |
| 2. Vulnerability mgmt governance (SLA/excepciones/disclosure)    | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | NIST SSDF RV.1.3/RV.2 (ver §20 §"2. Vulnerability mgmt")                |
| 3. Third-party & tooling governance (allowlist actions, license) | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | GitHub allowed-actions + OWASP CI/CD (ver §20 §"3. Third-party")        |
| 4. Data governance in pipelines (PII/PHI, masking, test data)    | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | ISO 27001 A.5.34/A.8.11/A.8.33 (ver §20 §"4. Data governance")          |
| 5. Release governance (trains, feature-flag, changelog, semver)  | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | ITIL / Keep a Changelog (ver §20 §"5. Release governance")              |
| 6. Incident & postmortem governance (SEV, SLA, war-room)         | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | ISO 27001 A.5.27 / NIST 800-61r3 (ver §20 §"6. Incident")               |
| 7. SLO / error-budget governance (release gate)                  | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | SRE Error Budget Policy (ver §20 §"7. SLO")                             |
| 8. Configuration & environment drift governance                  | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | ISO 27001 A.8.9 / NIST 800-53 CM (ver §20 §"8. Config")                 |
| 9. Meta-governance (governance-as-code, auditoría de policy)     | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | CNCF Policy-as-Code (ver §20 §"9. Meta-governance")                     |
| 10. Docs & knowledge governance (ADRs, docs-as-code, runbook)    | CONTINUOUS | GOVERNANCE TRANSVERSAL | `ci-governance-transversal` (futuro) | documentation-only | ADR (Nygard) / §45 docs-as-code (ver §20 §"10. Docs")                   |

### 1.4 Operacional (ejecución de CI/CD)

| Concepto/Capacidad                                       | Momento     | Dominio     | Change destino                                                     | Estado             | Implementación/ubicación                                               |
| -------------------------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------- |
| Cost governance / FinOps                                 | OPERATIONAL | Operational | documentation-only (`ci-governance-transversal` conceptual)        | documentation-only | presupuesto runners, OIDC (ver §20-governance-stage.md §"OPERATIONAL") |
| Secrets management governance (Vault, OIDC, pin actions) | OPERATIONAL | Operational | documentation-only (detección Gitleaks implementada como prebuild) | documentation-only | Gitleaks en prebuild; política de Vault/OIDC pendiente                 |
| Identity & access (least privilege)                      | OPERATIONAL | Operational | implementado en ejecución de CI (no es change de governance)       | implemented        | `permissions:` mínimo + OIDC en workflows `ci.yml`/`security.yml`      |
| Runner security (ephemeral, egress restrict)             | OPERATIONAL | Operational | documentation-only                                                 | documentation-only | runners efímeros recomendados (ver §20 §"OPERATIONAL")                 |

### 1.5 Supply chain / build

| Concepto/Capacidad                    | Momento        | Dominio      | Change destino                                 | Estado             | Implementación/ubicación                               |
| ------------------------------------- | -------------- | ------------ | ---------------------------------------------- | ------------------ | ------------------------------------------------------ |
| SLSA provenance (L1→L3)               | BUILD/ARTIFACT | Supply chain | reference (plantilla en docs)                  | reference          | `docs/ci-cd-pipeline-empresarial.md` §25 (no workflow) |
| SBOM (CycloneDX/SPDX)                 | BUILD/ARTIFACT | Build-time   | implementado como prebuild (no de este change) | implemented        | `security.yml:sbom` (no bloqueante)                    |
| Artifact signing (cosign/sigstore)    | BUILD/ARTIFACT | Supply chain | reference (plantilla en docs)                  | reference          | `docs/ci-cd-pipeline-empresarial.md` §25 (no workflow) |
| Immutable artifacts                   | BUILD/ARTIFACT | Supply chain | documentation-only                             | documentation-only | promoción sin rebuild (ver §20 matriz BUILD/ARTIFACT)  |
| Policy-as-code (OPA/Conftest/Kyverno) | BUILD/ARTIFACT | Supply chain | documentation-only                             | documentation-only | validación de manifests/imagen (ver §20 matriz)        |

---

## 2. Resumen de distribución

| Grupo                    | Filas  | Estado dominante                                    |
| ------------------------ | ------ | --------------------------------------------------- |
| Pre-PR/merge (activo)    | 13     | implemented                                         |
| Post-merge (diferido)    | 13     | deferred                                            |
| Transversal (CONTINUOUS) | 10     | documentation-only                                  |
| Operacional              | 4      | documentation-only (identity = implemented)         |
| Supply chain / build     | 5      | reference / documentation-only (SBOM = implemented) |
| **Total**                | **45** | —                                                   |

> Nota: las 45 filas cubren los 44 conceptos de la matriz TOTAL (`docs/ci-cd-pipeline-empresarial.md` §23.3.2) más la fila de "merge queue" y la de "CONTRIBUTING.md", que son capacidades de gobernanza nombradas en el change activo / futuros pero no estaban como fila explícita en la matriz de 44. No se duplica la matriz de 8 columnas: aquí cada concepto tiene una sola fila con referencia a los docs fuente.

---

## 3. Sección de estado (leyenda)

- **implemented** — capacidad LIVE en el repositorio (ejecutada por CI o por el ruleset `21227644`). Incluye lo entregado por `ci-governance-pre-merge-gates` y los controles prebuild existentes (Gitleaks, Semgrep/CodeQL, SBOM) y la práctica de `permissions:` mínimo + OIDC.
- **deferred** — capacidad post-merge fuera del alcance del change activo; tiene un **change futuro nombrado** explícito (§4) que la implementará. No está en el repo.
- **reference** — plantilla/diseño documentado en `docs/ci-cd-pipeline-empresarial.md` (p. ej. SLSA, cosign) pero sin workflow en el repo; se materializará en un change futuro o queda como patrón de referencia.
- **documentation-only** — dimensión de la capa transversal CONTINUOUS (o governance operacional de plataforma) que existe solo en los artículos de aprendizaje; **no es implementable como change de repo aislado** (depende de políticas de org/plataforma). Se rastrea aquí para no inflar la cobertura de ningún change.

---

## 4. Rastreo de changes futuros

| Change futuro                | Capacidades que cubre                                                                                                                                                                                                                                 | Specs de origen (referencia)                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ci-deploy-gating`           | GitHub Environments + required reviewers, wait timer/freeze, custom protection rules (CAB/SRB), change record linkage, post-deploy smoke tests, release readiness sign-off                                                                            | `openspec/changes/ci-governance-pre-merge-gates/specs/OUT-OF-SCOPE/deploy-gating/spec.md` (D3, D10 en design.md) |
| `ci-rollback-strategy`       | Rollback plan validado (gate), canary/baseline + auto-rollback, runbooks `rollback.md` + `fix-forward.md`, rollback/fix-forward + postmortem                                                                                                          | `.../OUT-OF-SCOPE/rollback-strategy/spec.md` (D4 en design.md)                                                   |
| `ci-audit-streaming`         | Audit trail inmutable (WORM), DORA metrics, compliance evidence archive, quarterly review cadence                                                                                                                                                     | `.../OUT-OF-SCOPE/audit-streaming/spec.md` (D5 en design.md)                                                     |
| `ci-contributing-governance` | Documentación de los governance gates en `CONTRIBUTING.md` (onboarding de contribuidores)                                                                                                                                                             | design.md §"Integration Points" (CONTRIBUTING.md → contributors); sin spec OUT-OF-SCOPE aún                      |
| `ci-governance-transversal`  | Las 10 dimensiones transversales (RBAC humano, vuln mgmt, third-party/tooling, data governance, release governance, incident/postmortem, SLO/error-budget, config/drift, meta-governance, docs/ADRs) + operacional (FinOps, secrets, runner security) | conceptual; derivado de §20-governance-stage.md §"La capa GOVERNANCE TRANSVERSAL" — sin change creado aún        |

> Los specs `deploy-gating`, `rollback-strategy` y `audit-streaming` fueron **relocados físicamente** de `specs/` a `specs/OUT-OF-SCOPE/` dentro de `ci-governance-pre-merge-gates` (2026-08-27, Opción B de @planner). Son **referencia preservada**, NO requisitos activos de ese change.

---

## 5. Referencias

- `docs/ci-cd-pipeline-empresarial.md` — §13 (Stage 11 Approval/Governance), §13.10 (governance a lo largo de todo el ciclo), §23.3.1.1 (ciclo de 7 momentos), **§23.3.2 (matriz completa 44 filas / 10 dominios, 8 columnas)** — fuente de verdad de los conceptos.
- `docs/learning/ci-cd/20-governance-stage.md` — artículo que detalla el lifecycle de 7 momentos, la capa transversal CONTINUOUS (10 dimensiones) y la matriz consolidada; "Componentes Implementados" y "Componentes de Supply Chain (Plantilla/Referencia)".
- `openspec/changes/ci-governance-pre-merge-gates/proposal.md` — alcance reducido a pre-PR/merge (Levels 2-3); post-merge OUT OF SCOPE.
- `openspec/changes/ci-governance-pre-merge-gates/design.md` — D3 (deploy gating), D4 (rollback), D5 (audit), D6 (compliance mapping), D7 (correcciones enterprise).
- `openspec/changes/ci-governance-pre-merge-gates/specs/OUT-OF-SCOPE/{deploy-gating,rollback-strategy,audit-streaming}/spec.md` — specs diferidos.

---

> **Pie de página:** El change activo es `ci-governance-pre-merge-gates` (pre-PR/merge, Levels 2-3: `dependency-review` + `ruleset-expansion`, ruleset `21227644`). La **capa transversal CONTINUOUS (10 dimensiones) es documentation-only** y la cobertura post-merge (deploy/rollback/audit) está **deferred** a los changes de §4. Ningún change de implementación debe declarar "implementado" lo que aquí figura como `deferred` o `documentation-only`.
>
> **Nota de dominio (dependency-review):** NO es una capability nueva del change — es un control SECURITY **preexistente** en `security.yml` que `ci-governance-pre-merge-gates` eleva a REQUIRED vía `ci-complete` + ruleset. Su **único home legítimo es `security.yml`** (no `dependency-review.yml`).
