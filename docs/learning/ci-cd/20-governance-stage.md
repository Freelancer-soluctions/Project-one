# 20. Governance en CI/CD: Por Qué Controlamos Cada Paso del Camino al Deploy

> Artículo explicativo de la **Stage 11 — Approval / Governance** del pipeline CI/CD empresarial.
> Basado en `docs/ci-cd-pipeline-empresarial.md` (diagrama 23.3, §13, §23.3.1; **governance a lo largo de todo el ciclo de vida §13.10**; **ciclo completo de 7 momentos §23.3.1.1**; **matriz completa de governance por momento §23.3.2**) y la implementación real del proyecto.
>
> **Cobertura de este artículo:** Capa transversal CONTINUOUS de governance + las 10 dimensiones transversales + la matriz consolidada de 44 filas / 10 dominios + la extensión del lifecycle de 6 a 7 momentos. Fuente de verdad: `docs/ci-cd-pipeline-empresarial.md`.

---

## Qué es Governance y por qué lo necesitamos

Cuando hablamos de governance en un pipeline de CI/CD, nos referimos al **conjunto de puntos de control que verifican que todo cumpla las reglas antes de que el código llegue a producción**. No es un stage aislado que aparece de golpe al final — es un ciclo de vida que atraviesa todo el pipeline, desde el primer commit del desarrollador hasta el registro del deploy en producción.

La razón de ser de governance es simple: **la automatización nos da velocidad, pero la gobernanza nos da garantía**. Sin governance, un pipeline puede ser rápido pero inseguro, o eficiente pero no auditable. Nosotros necesitamos ambas cosas: velocidad _y_ control.

La pregunta que governance responde en cada paso es: **"¿Estamos seguros de que este cambio cumple nuestras políticas antes de que llegue a los usuarios?"**

### Dos caras de la gobernanza: gates puntuales + capa transversal continua

Governance **no es solo un conjunto de gates puntuales que aparecen dentro de un stage concreto** (el `commit-lint` en el PR, la branch protection antes del merge, el `required reviewers` en el deploy). Esa es la cara _discreta_: controles que se disparan en un momento determinado del pipeline y deciden pasa/no-pasa.

La otra cara —y la que a menudo se olvida— es la **capa transversal continua (Momento = CONTINUOUS)**: un conjunto de dimensiones organizativas y de ciclo de vida completo que **recorren todo el pipeline de extremo a extremo**, desde el `commit` hasta el `audit`, y que no se limitan a un instante único. Pensamos en ella como una banda continua que envuelve a los gates puntuales:

```
GOVERNANCE TRANSVERSAL (CONTINUOUS)
commit ─▶ PR ─▶ merge ─▶ build/artifact ─▶ deploy ─▶ post-deploy ─▶ audit   (Momento = CONTINUOUS)
```

Mientras que un gate puntual responde _"¿este commit cumple la regla X?"_, la capa transversal responde _"¿tenemos gobernanza de acceso humano, de vulnerabilidades, de datos, de incidentes, de release, de configuración, de política... a lo largo de TODO el ciclo?"_. Las dos caras son complementarias: los gates puntuales son la ejecución táctica; la capa transversal es la responsabilidad estratégica. Ambas se detallan en este artículo.

---

## El Governance Lifecycle: de 6 pasos a 7 momentos (del commit al audit/recovery)

Nosotros no tratamos governance como un stage paralelo al resto del pipeline. Lo tratamos como **un ciclo de vida** que conecta el primer commit del desarrollador con el registro del deploy en producción y la evidencia de auditoría. Cada paso depende del anterior, y si alguno falla, todo se detiene.

El ciclo original de este artículo describía **6 pasos** centrados en el núcleo CI (commit → merge). Para cubrir governance en su **totalidad** (y alinearnos con `docs/ci-cd-pipeline-empresarial.md` §23.3.1.1), el ciclo se extiende a **7 momentos**, añadiendo explícitamente **build/artifact** y **post-deploy** entre el merge y el audit:

> **commit → PR → merge → build/artifact → deploy → post-deploy → audit/recovery**

### Vista CI-core (núcleo de 6 pasos, histórica)

Esta es la vista original del artículo, centrada en el recorrido commit→merge y la protección de la rama principal:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  1. COMMIT  │───▶│  2. PR GATE  │───▶│ 3. CODE PIPELINE│
│    Local    │    │  Governance  │    │  (Testing+Build)│
└─────────────┘    └──────────────┘    └────────┬────────┘
                                                  │
                     ┌──────────────┐    ┌────────▼────────┐
                     │ 5. PRODUCTION│◀───│4. BRANCH        │
                     │    Deploy    │    │   PROTECTION    │
                     └──────┬───────┘    └─────────────────┘
                            │
                     ┌──────▼───────┐
                     │6. AUDIT TRAIL│
                     └──────────────┘
```

### Vista completa de 7 momentos (commit → audit/recovery)

Agregando **build/artifact** (entre branch protection y deploy) y **post-deploy** (entre deploy y audit), el diagrama refleja el modelo de gobernanza de extremo a extremo. Cada momento tiene sus propios controles de governance documentados en la [matriz completa](#matriz-completa-de-governance-por-momento-del-pipeline-44-filas--10-dominios):

```
 [1 COMMIT] ─▶ [2 PR GATE] ─▶ [3 MERGE] ─▶ [4 BUILD/ARTIFACT] ─▶ [5 DEPLOY] ─▶ [6 POST-DEPLOY] ─▶ [7 AUDIT/RECOVERY]
     │             │             │              │                   │                │                  │
 firma GPG/    commitlint    branch          SLSA provenance    GitHub Envs +    smoke/health +    audit trail (WORM)
 sigstore +     PR metadata    protection       + SBOM + artifact  required reviewers canary vs        DORA metrics +
 commitlint    early-abort    (lee checks,     signing (cosign)  + wait timer +   baseline +         compliance evidence
 + pre-commit  + signing verify approval,       + policy-as-code  custom protection release readiness (SOC2/ISO/SSDF)
 hooks secret  + code pipeline firma)           (OPA/Kyverno)     rules (CAB/SRB)   + rollback/
 (gitleaks)   (CI)          → MERGE          + artifacts        (auto + manual    fix-forward       continuous
                              habilitado        inmutables        por riesgo)       (change mgmt)     compliance
```

> **Nota de coherencia:** los momentos **1–3 (commit / PR / merge + branch protection + dependency review + rulesets)** pertenecen al change `ci-governance-pre-merge-gates` y son **pre-PR/merge → implementables**. Los momentos **4–7 (build/artifact, deploy, post-deploy, audit)** son **post-merge → documentados** (OUT OF SCOPE de implementación en ese change), pero se incluyen para cubrir governance en su totalidad y cumplir SOC 2 CC8.1, ISO 27001 A.8.32 y NIST SSDF PS.3.

### Implementación real de cada paso (ci.yml)

A continuación se muestra cómo cada paso del lifecycle se materializa en `ci.yml`:

| Paso                 | Lifecycle Stage        | Implementación                                       |
| -------------------- | ---------------------- | ---------------------------------------------------- |
| 1. Commit Local      | pre-commit hooks       | `.husky/pre-commit` (lint-staged, semgrep, gitleaks) |
| 1. Commit Local      | commit-msg hook        | `.husky/commit-msg` (commitlint)                     |
| 2. PR Gate           | commit-lint job        | `ci.yml:commit-lint` (required check)                |
| 2. PR Gate           | verify-signatures job  | `ci.yml:verify-signatures` (required check)          |
| 2. PR Gate           | pr-title-lint job      | `ci.yml:pr-title-lint` (non-blocking, fase adopción) |
| 2. PR Gate           | dco job                | `ci.yml:dco` (non-blocking, fase adopción)           |
| 3. Code Pipeline     | zombie-workflow-guard  | `ci.yml:zombie-workflow-guard` (anti-regresión)      |
| 3. Code Pipeline     | ci-complete aggregator | `ci.yml:ci-complete` (required check, fan-in gate)   |
| 4. Branch Protection | Ruleset 21227644       | GitHub Settings → Rulesets                           |

### Paso 1: El commit local — la primera línea de defensa

Todo empieza en la máquina del desarrollador. Cuando ejecuta `git commit -S`, está haciendo dos cosas simultáneamente: **firmando el commit** con su clave SSH/ED25519 (para probar que realmente fue él quien escribió ese código) y **ejecutando commitlint** para validar que el mensaje sigue el formato Conventional Commits (`feat(scope): descripción`).

**¿Por qué hacemos esto aquí?** Porque es la verificación más barata que existe. Un hook local se ejecuta en milisegundos, en la máquina del desarrollador, sin consumir recursos de CI. Si el mensaje del commit está mal formateado o falta la firma, el commit se aborta inmediatamente y el desarrollador puede corregirlo antes de gastar ni un segundo de tiempo de pipeline.

También ejecutamos pre-commit hooks con Husky:

- **lint-staged** (Prettier + ESLint sobre los archivos staged)
- **Semgrep** (SAST con reglas OWASP)
- **Gitleaks** (detección de secretos antes de que entren al historial de Git)

Todo esto corre en paralelo antes de que el commit se confirme.

**Pero hay un detalle crítico:** los hooks locales son bypassable con `--no-verify`. Por eso nunca confiamos exclusivamente en ellos — el CI re-verifica todo. Los hooks son el primer filtro rápido; el CI es la garantía real.

---

### Paso 2: El PR Gate — las verificaciones de gobierno

Cuando el desarrollador hace push y abre un PR, GitHub Actions dispara nuestro workflow de CI. Aquí es donde governance se materializa como un conjunto coordinado de checks que validan la integridad del cambio:

#### Commit Lint (commitlint)

Re-valida que todos los commits del PR sigan Conventional Commits. Es **defense-in-depth**: ya lo validamos en local, pero aquí lo verificamos de nuevo porque no confiamos ciegamente en los hooks locales. Usamos `npx commitlint --from BASE_SHA --to HEAD_SHA --verbose`.

**¿Por qué importa?** Los mensajes de commit conforman el changelog automático, alimentan herramientas de release (Changesets, semantic-release) y son la primera línea de documentación en el historial de Git. Un commit que dice "fix things" es inútil para cualquier persona (o herramienta) que necesite entender qué cambió y por qué.

#### Commit Signature Verification

Un job que usa la REST API de GitHub para verificar que **cada commit del PR esté firmado**. Usamos el endpoint de compare (`base...head`) para scoping eficiente, y aplicamos un cutoff de grandfathering (`2026-08-01`): commits anteriores a esa fecha no se consideran fallos porque no podían estar firmados retroactivamente. Los commits nuevos desde la fecha de rollout _deben_ estar firmados o el job falla.

**¿Por qué importa?** La firma criptográfica de commits previene impersonación. Sin ella, cualquiera podría hacer `git commit --author="Senior Dev <senior@company.com>"` y el pipeline lo aceptaría. Con la firma, el commit lleva una firma digital que solo el titular de la clave privada puede generar. Si GitHub no verifica la firma, el commit no pasa.

#### PR Title Lint

Valida que el título del PR siga Conventional Commits, porque cuando hacemos squash merge, el título del PR se convierte en el mensaje del commit. Si el título es "update stuff", el changelog automático genera basura. Usamos `amannn/action-semantic-pull-request@v6`.

**Estado actual:** modo no-bloqueante (`continue-on-error: true`) como parte de la fase de adopción. El equipo se está acostumbrando; una vez que el hábito esté establecido, lo hacemos bloqueante.

#### DCO (Developer Certificate of Origin)

Verifica que cada commit tenga el trailer `Signed-off-by`. Mientras que commit signing prueba _quién firmó_ (autenticidad criptográfica), el DCO certifica _quién tiene derecho a contribuir_. Son controles complementarios, no redundantes. Usamos `KineticCafe/actions-dco@v3.2.0`.

**¿Por qué importa?** En proyectos open source o con contribuciones externas, el DCO es evidencia legal de que el contribuyente tiene derecho a licenciar ese código bajo la licencia del proyecto. En contextos empresariales, previene disputas sobre propiedad intelectual.

#### Early-Abort Gate (SAST de diff)

Una verificación SAST ultrarrápida que analiza solo el diff del PR (no el repo completo), buscando vulnerabilidades de severidad CRÍTICA/ALTA como inyecciones SQL, RCE o secrets hardcoded. Si detecta algo, aborta el pipeline en segundos _antes_ de que arranquen las suites de testing largas.

**¿Por qué importa?** Es **fail-fast puro**: detecta lo peor primero, lo más rápido posible. En vez de esperar 15 minutos de tests unitarios e integración para descubrir que hay un SQL injection en el controller nuevo, lo detecta en 30 segundos y ahorra todos esos minutos de compute.

#### ¿Por qué un solo workflow?

El patrón `ci-complete` agrega todos los resultados upstream en un solo check. La branch protection ruleset solo necesita requisar un check (`ci-complete`) en vez de listar 30+ jobs individualmente. Esto nos da mantenibilidad: cuando agregamos un nuevo job de CI, solo lo añadimos a la lista de `needs` del job `ci-complete`, sin tocar la configuración de GitHub.

---

### Paso 3: Code Pipeline — testing, build, y security scanning

Después del PR gate, el pipeline ejecuta los stages de testing, security scanning, quality analysis, build e integration tests. Governance participa aquí a través de los jobs que finalmente alimentan el gate `ci-complete`.

**Importante:** El workflow `security.yml` contiene jobs de SBOM, Dependency Review y CodeQL, pero **NO están integrados** en el gate `ci-complete`:

- **SBOM (Software Bill of Materials):** el job `security.yml:sbom` genera la lista de dependencias (CycloneDX), pero no es required check.

- **Dependency Review:** el job `security.yml:dependency-review` escanea vulnerabilidades y licencias, pero no es required check.

- **CodeQL SAST:** el job `security.yml:sast` ejecuta análisis estático, pero no es required check.

Los jobs que SÍ son required checks por el ruleset 21227644 son: commit-lint, verify-signatures, PR Title Lint, DCO, zombie-workflow-guard, y ci-complete (que agrupa todos los upstream).

---

### Paso 4: Branch Protection — el guardián pasivo

Este es el paso más elegante de todo el ciclo. **Branch Protection no es un job de CI — es una configuración de GitHub Rulesets que lee pasivamente los resultados de todos los required checks.**

Cuando configuramos una branch protection rule en GitHub (vía el Ruleset API), le decimos: "no permitas merge a `main` hasta que `ci-complete` pase". El job `ci-complete` ya verificó que todos los checks upstream pasaron. Branch Protection simplemente verifica el estado de `ci-complete` antes de permitir el merge.

**¿Por qué importa?** Porque es la última barrera antes de que el código toque `main`. Ni merge manual, ni override del admin, ni commit directo puede saltárselo (a menos que se deshabilite la protección explícitamente). Es la aplicación automática de la política: si no pasa, no mergea.

La configuración en nuestro Ruleset (ID `21227644`) requiere:

- `ci-complete` como status check requerido
- `Require signed commits` activado
- `Require branches to be up to date` activado

---

### Paso 5: Production Deploy — la transición controlada

Una vez que el código está en `main`, el deploy a producción tiene sus propias verificaciones de governance:

- **Deploy Gates (Kubernetes Rollouts):** si el health check del pod nuevo falla (errores 5xx > 5%), Kubernetes revierte automáticamente el rollout. No necesitamos intervención humana; la definición de la propiedad "sano" está declarada en la configuración del rollout.

- **Canary Deployments:** deployamos el cambio primero a un porcentaje pequeño de tráfico (p. ej., 5%). Si las métricas se mantienen estables, expandimos gradualmente. Si algo falla, la reversión es automática.

- **Change Approval (para producción):** para cambios de alto riesgo (migraciones de base de datos, cambios de configuración crítica), requerimos aprobación manual antes de que el pipeline continúe. Es el único punto donde un humano debe intervenir activamente en el pipeline.

---

### Paso 6: Audit Trail — la memoria institucional

Después del deploy, governance no se detiene. Registramos evidencia completa de todo lo que pasó:

- **Deployment logs:** qué se desplegó, cuándo, por quién, desde qué commit.
- **Approval records:** quién aprobó el cambio, cuándo, con qué justificación.
- **Security scan results:** el historial completo de scans de seguridad para cada build.
- **Rollback evidence:** si hubo reversión, por qué y qué pasos se tomaron.

**¿Por qué importa?** Porque si mañana tenemos un incidente de seguridad o una auditoría de compliance (SOC2, ISO 27001, GDPR), necesitamos responder a preguntas como:

- "¿Quién desplegó esta versión?"
- "¿Se verificaron las vulnerabilidades antes del deploy?"
- "¿Quién aprobó este cambio de configuración?"

Sin audit trail, esas preguntas no tienen respuesta. Con él, tenemos evidencia criptográfica de cada decisión.

---

## La capa GOVERNANCE TRANSVERSAL (CONTINUOUS)

Además de los gates puntuales que vimos en el lifecycle (commit-lint, branch protection, required reviewers, etc.), existe una **capa transversal continua** que no se limita a un momento del pipeline. Esta capa recorre los 7 momentos de extremo a extremo y agrupa **10 dimensiones de cobertura total** que exigen los frameworks de compliance pero que los gates puntuales no cubren solos.

En `docs/ci-cd-pipeline-empresarial.md` §23.3 se representa como una banda continua al cierre del diagrama del pipeline:

```
══════════════════════════════════════════════════════════════════════════════════════════════
 GOVERNANCE TRANSVERSAL (CONTINUOUS)
 commit ─▶ PR ─▶ merge ─▶ build/artifact ─▶ deploy ─▶ post-deploy ─▶ audit     (Momento = CONTINUOUS)
══════════════════════════════════════════════════════════════════════════════════════════════
```

**Por qué importa esta distinción:** los gates puntuales responden _"¿este commit pasa la regla X?"_. La capa transversal responde _"¿tenemos gobernanza de acceso humano, vulnerabilidades, terceros, datos, release, incidentes, SLO, configuración, política y conocimiento a lo largo de TODO el ciclo?"_. Cubre el análisis de brechas frente a la matriz original de 34 filas / 9 dominios (que solo tenía gates puntuales) y la extiende a **44 filas / 10 dominios**, exigiendo SOC 2 (CC6 acceso, CC7 monitoreo, CC8 cambio), ISO 27001:2022 (A.5.15/A.5.16, A.5.27, A.8.9, A.5.34/A.8.11), NIST SSDF (RV, PO) y NIST 800-53 (AC, CM, IR).

> **Alcance:** las 10 dimensiones transversales son **post-merge → documentadas** (OUT OF SCOPE de implementación en el change `ci-governance-pre-merge-gates`), alineadas con la nota de alcance de §23.3.2. No reemplazan los gates puntuales: los enmarcan en la responsabilidad total de governance.

### Las 10 dimensiones transversales (detalle)

A continuación, cada dimensión se explica con **qué es**, **por qué importa** y su **mapeo a compliance / fuente**.

#### 1. Human repo access governance (RBAC)

- **Qué es:** Gobernanza del _acceso humano al repositorio_ mediante los roles de GitHub (Read / Triage / Write / Maintain / Admin), custom roles, org base permissions y enterprise policies. Incluye el principio de **4-eyes (segregación de deberes)** para acciones destructivas o de bypass (admin, bypass de ruleset).
- **Por qué importa:** Complementa la fila `Identity & access (least privilege)` del dominio OPERATIONAL, que gobierna el _token/workload_ de CI (`permissions:` mínimo, OIDC). Esta dimensión gobierna al _humano_: el Ruleset lee resultados pasivamente, pero el acceso humano (quién puede modificar el ruleset, quién puede hacer bypass) es la capa de mayor riesgo. El 4-eyes para bypass/admin evita que un solo actor deshabilite la protección de rama. Es la aplicación de SoD exigida por SOC 2 CC6.
- **Mapeo a compliance / fuente:** SOC 2 CC6 (access controls), ISO 27001 A.5.15/A.5.16 (access control). Fuente: [GitHub Docs — Repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)

#### 2. Vulnerability mgmt governance (SLA / excepciones / disclosure)

- **Qué es:** Gestión de vulnerabilidades como proceso: **remediation SLA por severidad** (p. ej. crítica 7 días, alta 30, media 90), **waiver documentado** para excepciones justificadas y con fecha de expiración, y un **vulnerability disclosure program** (ISO 29147) operado por un **PSIRT** (Product Security Incident Response Team).
- **Por qué importa:** La matriz original de gates puntuales solo tenía _detección_ (dependency review, early-abort SAST). Faltaba la _respuesta_: un SLA de remediación, un proceso de waiver y un canal de divulgación coordinada. Sin esto, detectar una CVE no garantiza que se arregle ni que un investigador externo sepa cómo reportarla. Lo exige NIST SSDF RV (RV.1.3 / RV.2).
- **Mapeo a compliance / fuente:** NIST SSDF RV.1.3 / RV.2 (vulnerability disclosure & response). Fuente: [NIST SSDF (SP 800-218)](https://csrc.nist.gov/pubs/sp/800/218/final)

#### 3. Third-party & tooling governance (allowlist actions, license)

- **Qué es:** Política de **allowed-actions** (allowlist/blocklist de GitHub Actions a nivel org) + **SHA pinning** de actions, evaluación de riesgo de Marketplace/OAuth apps, y **license compliance** de dependencias (FOSSA / ScanCode).
- **Por qué importa:** Extiende el `pin actions by SHA` (hasta aquí solo mencionado en secrets governance) hacia una _política de terceros a nivel organización_: qué actions pueden ejecutarse, qué OAuth apps pueden integrarse y que las licencias de las dependencias sean compatibles con la política del negocio. Lo exige SSDF PO (requisitos a terceros / PO.1.3).
- **Mapeo a compliance / fuente:** NIST SSDF PO.1.3 (requirements for third-party components), OWASP CI/CD Security (Top 10: poisoned pipeline execution). Fuente: [GitHub allowed actions policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/actions-policies) + [OWASP CI/CD Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)

#### 4. Data governance in pipelines (PII/PHI, masking, test data)

- **Qué es:** Gobernanza de datos personales/sensibles en el pipeline: **PII/PHI masking** en logs y artifacts, **test data sintética** (sin datos reales de producción), **GDPR data minimization** y políticas de **retention/deletion** (incl. A.8.33 Test Information).
- **Por qué importa:** Es una dimensión nueva ausente en la matriz original: los artifacts y los logs de CI pueden filtrar emails, tokens, datos de pacientes. El masking, la data sintética y la minimización evitan fugas de datos sensibles a través del pipeline y cumplen GDPR e ISO 27001.
- **Mapeo a compliance / fuente:** ISO 27001 A.5.34 (privacy), A.8.11 (data masking), A.8.33 (test information). Fuente: [ISO 27001 A.8.11 Data Masking](https://www.isms.online/iso-27001/annex-a-2022/8-11-data-masking-2022)

#### 5. Release governance (trains, feature-flag, changelog, semver)

- **Qué es:** Gobierno del proceso de release: **release trains** (cadencia fija de entregas), **feature-flag lifecycle** (kill-switch y cleanup de flags muertos), **CHANGELOG governance** (Keep a Changelog) y **cadencia SemVer**.
- **Por qué importa:** Va más allá del `Release readiness sign-off` (post-deploy). Sin release governance, los feature flags se acumulan como deuda, el changelog se genera inconsistente y las versiones no comunican compatibilidad. Alinea la entrega con el negocio y la trazabilidad.
- **Mapeo a compliance / fuente:** ITIL release management, SOC 2 CC8.1 (change). Fuente: [Release train governance](https://beefed.ai/en/release-train-orchestration) + [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

#### 6. Incident & postmortem governance (SEV, SLA, war-room)

- **Qué es:** Gestión de incidentes: **clasificación de severidad (SEV1–4)**, **response SLA** por severidad, **Incident Commander / war-room**, y **blameless postmortem** con **action items trackeados** bajo SLO (p. ej. 30/60 días).
- **Por qué importa:** La matriz original tenía `Rollback / fix-forward + postmortem` (blameless), pero faltaban la clasificación de severidad, el SLA de respuesta, la war-room y el seguimiento de action items con SLO. Sin esto, los incidentes no se aprenden (ISO 27001 A.5.27 — aprendizaje de incidentes).
- **Mapeo a compliance / fuente:** ISO 27001 A.5.27 (learning from information security incidents), NIST SP 800-61r3 (incident handling). Fuente: [Google SRE — Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) + [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

#### 7. SLO / error-budget governance (release gate)

- **Qué es:** Política de **error budget** como _gate de release_: si el presupuesto de error se agota, se congela el release (freeze); **alerting burn-rate**, un **SLO committee** y feedback del SLO al change process.
- **Por qué importa:** Es un gate de release basado en confiabilidad, no solo en aprobación humana: cierra el feedback de observabilidad al proceso de cambio. Si el servicio es inestable, el pipeline de release se detiene automáticamente, protegiendo a los usuarios.
- **Mapeo a compliance / fuente:** SRE Error Budget Policy (release gating). Fuente: [SRE Error Budget Policy](https://sre.google/workbook/error-budget-policy/) + [Release gating](https://oneuptime.com/blog/post/2026-02-17-how-to-establish-error-budget-policies-for-release-gating-on-google-cloud/view)

#### 8. Configuration & environment drift governance

- **Qué es:** Gobernanza de configuración: **config baselines (CIS)**, **drift detection** (desviación entre lo declarado y lo ejecutado), **environment parity** (staging ≈ prod) y **change control de config**.
- **Por qué importa:** La configuración y el drift de entornos son una causa frecuente de incidentes en producción que los gates de código no detectan. Los baselines CIS, la detección de drift y la paridad de entornos garantizan que lo probado en staging sea lo que corre en prod.
- **Mapeo a compliance / fuente:** ISO 27001 A.8.9 (configuration management), NIST 800-53 CM (configuration management). Fuente: [ISO 27001 A.8.9](https://www.upguard.com/compliance/iso-27001/8-9) + [NIST 800-53 CM](https://csf.tools/reference/nist-sp-800-53/r4/cm)

#### 9. Meta-governance (governance-as-code, versionado, auditoría de policy)

- **Qué es:** El _governance del governance_: **policy-as-code versionada en Git** (Rego / CUE / CEL), **multiparty review** de la política, **auditoría de la política** y **revisión periódica de gates**.
- **Por qué importa:** La matriz original trataba los rulesets como lectores pasivos, sin gobernar la _evolución_ de las propias reglas. La meta-gobernanza asegura que las reglas de governance cambien por PR revisado (igual que el código), sean auditables y se revisen periódicamente. Lo promueve CNCF Policy-as-Code.
- **Mapeo a compliance / fuente:** CNCF Policy-as-Code (supply chain governance). Fuente: [CNCF — Policy as Code](https://www.cncf.io/blog/2024/02/14/policy-as-code-in-the-software-supply-chain/)

#### 10. Docs & knowledge governance (ADRs, docs-as-code, runbook review)

- **Qué es:** Gobernanza del conocimiento: **ADR governance** (ciclo Proposed → Accepted → Superseded, review trimestral), **docs-as-code** (documentación versionada en el repo) y **runbook review cadence**.
- **Por qué importa:** Ya estaba cubierto en el cuerpo del documento (§45 docs-as-code, `docs/adr/`, runbooks en §13.10 / §37). Se integra como fila de referencia para no duplicar y mantener la matriz completa: las decisiones arquitectónicas y los runbooks son evidencia de governance tanto como los gates.
- **Mapeo a compliance / fuente:** ADR (Nygard) + §45 docs-as-code (este doc). Fuente: [ADR (Nygard)](https://adr.github.io/)

---

## Matriz completa de Governance por momento del pipeline (44 filas / 10 dominios)

Tabla exhaustiva de **TODAS** las capacidades de governance mapeadas al momento del pipeline donde intervienen. Cubre los 10 dominios macro: commit-time, PR-time, merge-time, build/artifact-time, deploy-time, post-deploy, audit/recovery, supply-chain, operational y **GOVERNANCE TRANSVERSAL** (dimensiones continuas). Total: **34 → 44 filas** (la extensión añade build/artifact, post-deploy, audit y las 10 filas transversales).

| Momento        | Dominio                | Capacidad                                                                | ¿Quién ejecuta?            | ¿Cuándo?                | Ejemplo / herramienta                                                                                                                        | CI/CD      | Fuente                                                                                                                                                                                                                                                     |
| -------------- | ---------------------- | ------------------------------------------------------------------------ | -------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COMMIT         | Commit-time            | Firma de commits (GPG/SSH/Sigstore)                                      | Dev (local)                | pre-commit hook         | `git commit -S` / `git config gpg.format ssh`                                                                                                | CI(local)  | [GitHub Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)                                                                                                                        |
| COMMIT         | Commit-time            | Commit lint (Conventional Commits)                                       | Dev (local)                | pre-commit hook         | commitlint + Husky (implementado ✅)                                                                                                         | CI(local)  | [Conventional Commits](https://www.conventionalcommits.org/)                                                                                                                                                                                               |
| COMMIT         | Commit-time            | Pre-commit secret scan                                                   | Dev (local)                | pre-commit hook         | Husky + gitleaks (implementado ✅)                                                                                                           | CI(local)  | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| PR             | PR-time                | PR metadata (DCO, templates, title)                                      | CI + Dev                   | push PR                 | DCO action, PR template                                                                                                                      | CI         | [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-commit-approve-and-signing)                                                                                        |
| PR             | PR-time                | Code review policies (CODEOWNERS)                                        | Equipo + GitHub            | push PR                 | CODEOWNERS, required reviews                                                                                                                 | CI(gate)   | [GitHub Docs CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)                                                                                            |
| PR             | PR-time                | Dependency review (SCA en diff)                                          | CI (action)                | push PR                 | dependency-review-action (bloquea vulnerable)                                                                                                | CI         | [GitHub Docs dependency review](https://docs.github.com/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)                                                                                              |
| PR             | PR-time                | Early-abort SAST en diff                                                 | CI                         | push PR                 | Semgrep diff (crítico/alta)                                                                                                                  | CI         | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| MERGE          | Merge-time             | Required status checks                                                   | GitHub Rulesets            | continuous              | checks verdes antes de merge                                                                                                                 | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)                                                                                             |
| MERGE          | Merge-time             | Required reviews + CODEOWNERS                                            | GitHub Rulesets            | continuous              | N approvals, code owner review                                                                                                               | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)                                                                                                       |
| MERGE          | Merge-time             | Required signatures                                                      | GitHub Rulesets            | continuous              | commits firmados requeridos                                                                                                                  | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)                                                                                                   |
| MERGE          | Merge-time             | Linear history / no force-push                                           | GitHub Rulesets            | continuous              | squash/rebase, bloquear force-push                                                                                                           | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)                                                                                             |
| MERGE          | Merge-time             | Merge queue                                                              | GitHub Rulesets            | continuous              | merge_group FIFO, checks en grupo                                                                                                            | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)                                                                                           |
| MERGE          | Merge-time             | Bypass policies (SoD)                                                    | GitHub Rulesets            | continuous              | solo roles autorizados by-pass                                                                                                               | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)                                                                                                                 |
| BUILD/ARTIFACT | Build-time             | SLSA provenance (L1→L3)                                                  | CI (build service)         | post-build              | slsa-github-generator / GitHub OIDC                                                                                                          | CD start   | [SLSA](https://slsa.dev/spec/v1.0-rc2/levels)                                                                                                                                                                                                              |
| BUILD/ARTIFACT | Build-time             | SBOM (CycloneDX/SPDX)                                                    | CI                         | post-build              | syft / CycloneDX                                                                                                                             | CD start   | [OWASP CycloneDX](https://owasp.org/www-project-cyclonedx/)                                                                                                                                                                                                |
| BUILD/ARTIFACT | Supply chain           | Artifact signing (cosign/sigstore)                                       | CI (OIDC keyless)          | post-build              | cosign sign + Fulcio + Rekor                                                                                                                 | CD start   | [Sigstore](https://www.sigstore.dev/)                                                                                                                                                                                                                      |
| BUILD/ARTIFACT | Supply chain           | Immutable artifacts                                                      | CI/CD                      | post-build              | artifact promovido, no rebuild                                                                                                               | CD         | [SLSA](https://slsa.dev/spec/v1.0-rc2/levels)                                                                                                                                                                                                              |
| BUILD/ARTIFACT | Supply chain           | Policy-as-code (OPA/Conftest/Kyverno)                                    | CI                         | post-build              | validar manifests/imagen                                                                                                                     | CD start   | [OPA](https://www.openpolicyagent.org/docs/latest/cicd/)                                                                                                                                                                                                   |
| DEPLOY         | Deploy-time            | GitHub Environments + required reviewers                                 | GitHub                     | deploy                  | `environment: production` + reviewers                                                                                                        | CD         | [GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)                                                                                                                                             |
| DEPLOY         | Deploy-time            | Wait timer / deployment freeze                                           | GitHub                     | deploy                  | freeze windows, wait timer                                                                                                                   | CD         | [GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)                                                                                                                                             |
| DEPLOY         | Deploy-time            | Custom protection rules (CAB/SRB)                                        | GitHub App + humano        | deploy                  | aprobación ITIL/CAB, SRB seguridad                                                                                                           | CD         | [GitHub Docs](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/create-custom-protection-rules)                                                                                                                           |
| DEPLOY         | Change mgmt            | Change record / ticket linkage                                           | CI + ITSM                  | deploy                  | ServiceNow/Jira ref en commit                                                                                                                | CD         | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| DEPLOY         | Change mgmt            | Rollback plan validado (gate)                                            | CI                         | pre-deploy              | rollback-gate (migration down)                                                                                                               | CD         | [ISO 27001 A.8.32](https://www.aicpa-cima.com/resources/download/mapping-2017-trust-services-criteria-to-iso-27001)                                                                                                                                        |
| POST-DEPLOY    | Post-deploy            | Smoke tests / health checks                                              | CI                         | post-deploy             | `/health`, critical path                                                                                                                     | CD         | [Google SRE](https://sre.google/sre-book/service-level-objectives/)                                                                                                                                                                                        |
| POST-DEPLOY    | Post-deploy            | Canary/baseline + auto-rollback                                          | CI/CD                      | post-deploy             | Argo Rollouts + Prometheus                                                                                                                   | CD         | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| POST-DEPLOY    | Sign-off               | Release readiness sign-off                                               | Humano + CI                | post-deploy             | acceptance record, evidence archive                                                                                                          | CD         | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| AUDIT          | Audit/recovery         | Audit trail inmutable (WORM)                                             | CI + GitHub                | post-merge              | deployment event record: commit+artifact SHA                                                                                                 | Post-CD    | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| AUDIT          | Audit/recovery         | DORA metrics (4 claves)                                                  | CI                         | post-merge              | deploy freq, lead time, CFR, MTTR                                                                                                            | Post-CD    | [DORA Accelerate](https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report)                                                                                                                                           |
| AUDIT          | Compliance             | Compliance evidence archive                                              | CI                         | post-merge              | SOC2/ISO27001/SSDF evidence                                                                                                                  | Post-CD    | [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)                                                                                                                                                                                                   |
| AUDIT          | Recovery               | Rollback / fix-forward + postmortem                                      | Humano + CI                | on-incident             | feature flag kill-switch, blameless postmortem                                                                                               | Post-CD    | [Google SRE](https://sre.google/sre-book/implementing-devops/)                                                                                                                                                                                             |
| OPERATIONAL    | Operational            | Cost governance / FinOps                                                 | Plataforma                 | continuous              | presupuesto runners, OIDC                                                                                                                    | CI/CD      | [FinOps](https://www.finops.org/)                                                                                                                                                                                                                          |
| OPERATIONAL    | Operational            | Secrets management governance                                            | Plataforma                 | continuous              | Vault, OIDC, pin actions by SHA                                                                                                              | CI/CD      | [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)                                                                                                                                                     |
| OPERATIONAL    | Operational            | Identity & access (least privilege)                                      | Plataforma                 | continuous              | `permissions:` mínimo, OIDC workload identity                                                                                                | CI/CD      | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| OPERATIONAL    | Operational            | Runner security                                                          | Plataforma                 | continuous              | ephemeral runners, egress restrict                                                                                                           | CI/CD      | [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)                                                                                                                                                     |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Human repo access governance (RBAC)                                      | Org owners / Plataforma    | continuous              | GitHub repo roles (Read/Triage/Write/Maintain/Admin) + custom roles + org base permissions; 4-eyes para acciones destructivas (admin/bypass) | Repo       | [GitHub Docs repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)                                                            |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Vulnerability mgmt governance (SLA / excepciones / disclosure)           | Security / PSIRT           | continuous              | Remediation SLA por severidad, waiver documentado, vulnerability disclosure program (ISO 29147), PSIRT                                       | CD / Repo  | [NIST SSDF RV.1.3 / RV.2](https://csrc.nist.gov/pubs/sp/800/218/final)                                                                                                                                                                                     |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Third-party & tooling governance (allowlist actions, license)            | Plataforma / Security      | continuous              | Allowed-actions policy + SHA pinning + blocklist; license compliance (FOSSA/ScanCode); OAuth app policy                                      | CI/CD      | [GitHub allowed actions policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/actions-policies) + [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html) |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Data governance in pipelines (PII/PHI, masking, test data)               | Plataforma / Privacy       | continuous              | PII/PHI masking en logs y artifacts, test data sintética, GDPR data minimization, retention/deletion (A.8.10)                                | CI/CD      | [ISO 27001 A.5.34 / A.8.11 / A.8.33](https://www.isms.online/iso-27001/annex-a-2022/8-11-data-masking-2022)                                                                                                                                                |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Release governance (trains, feature-flag, changelog, semver)             | Release Eng / Product / QA | continuous + release    | Release train cadence, feature-flag lifecycle (kill-switch, cleanup), CHANGELOG governance (keepachangelog), SemVer cadence                  | CD         | [Release train governance](https://beefed.ai/en/release-train-orchestration) + [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)                                                                                                                    |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Incident & postmortem governance (severity, SLA, war-room, action items) | SRE / On-call              | on-incident             | Severity classification (SEV1-4), response SLA, Incident Commander / war-room, blameless postmortem con action items trackeados (SLO 30/60d) | Post-CD    | [Google SRE Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) + [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)                                                                                                       |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | SLO / error-budget governance (release gate)                             | SRE / Plataforma           | continuous + pre-deploy | Error budget policy como gate de release (freeze si se agota), alerting burn-rate, SLO committee, feedback al change process                 | CD gate    | [SRE Error Budget Policy](https://sre.google/workbook/error-budget-policy/) + [Release gating](https://oneuptime.com/blog/post/2026-02-17-how-to-establish-error-budget-policies-for-release-gating-on-google-cloud/view)                                  |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Configuration & environment drift governance                             | Plataforma / SRE           | continuous              | Config baselines (CIS), drift detection, environment parity (staging≈prod), change control de config                                         | CI/CD + CD | [ISO 27001 A.8.9](https://www.upguard.com/compliance/iso-27001/8-9) + [NIST 800-53 CM](https://csf.tools/reference/nist-sp-800-53/r4/cm)                                                                                                                   |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Meta-governance (governance-as-code, versionado, auditoría de policy)    | Plataforma / Governance    | continuous              | Policy-as-code versionada en Git (Rego/CUE/CEL), multiparty review de la policy, audit de la policy, periodic gate review                    | CI/CD      | [CNCF Policy-as-Code](https://www.cncf.io/blog/2024/02/14/policy-as-code-in-the-software-supply-chain/)                                                                                                                                                    |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Docs & knowledge governance (ADRs, docs-as-code, runbook review)         | Equipo / Tech leads        | continuous              | ADR governance (ciclo Proposed→Accepted→Superseded, review trimestral), docs-as-code, runbook review cadence — ver §45 y docs/adr/           | Repo       | [ADR (Nygard)](https://adr.github.io/) + §45 docs-as-code (este doc)                                                                                                                                                                                       |

> **Lectura de la matriz:** las filas `COMMIT`/`PR`/`MERGE` son **pre-PR/merge → implementables** en el change `ci-governance-pre-merge-gates`. Las filas `BUILD/ARTIFACT`, `DEPLOY`, `POST-DEPLOY`, `AUDIT` y las 10 filas `CONTINUOUS` son **post-merge → documentadas** (OUT OF SCOPE de implementación en ese change), pero se incluyen para cubrir governance en su totalidad (SOC 2 CC8.1, ISO 27001 A.8.32, NIST SSDF PS.3). El dominio `OPERATIONAL` (cost, secrets, identity, runners) es transversal de ejecución de CI/CD.

---

## Anti-patrones que nosotros evitamos

### Governance vacacional

> "Lo dejamos pasar esta vez, es urgente"

La primera vez que aceptas un bypass, creas un precedente. La segunda vez es más fácil. La tercera vez es la norma. **Si el pipeline bloquea algo, tiene razón — arregla la causa raíz, no el pipeline.**

### Parches al governance en vez de governance para los parches

> "Adding a cron job on a Friday afternoon to fix a critical bug"

Si "necesitas" deshabilitar governance para arreglar algo rápido, tu pipeline tiene un problema de diseño. La respuesta correcta es: hotfix → PR → pipeline completo → merge → deploy. **Si tu pipeline es tan lento que necesitas saltártelo, acelera el pipeline, no lo saltes.**

### Control sin automatización

> "Requires manual approval for all PRs"

La aprobación manual no escala. **Governance automatizado para lo verificable (tests, scans, linting) + aprobación manual solo para lo que requiere juicio humano (diseño, UX, riesgo de negocio).**

---

## Mapeo a compliance

Governance no es solo buena práctica técnica — es requisito de frameworks de compliance:

| Framework | Requisito                          | Governance对应                            |
| --------- | ---------------------------------- | ----------------------------------------- |
| SOC2      | Access controls, change management | Branch Protection + Approval Gates        |
| ISO 27001 | Information security controls      | SAST + DAST + Signed Commits              |
| GDPR      | Data protection, audit trail       | SBOM + Audit Logs + Encryption            |
| EO 14028  | Supply chain security              | SLSA Provenance + SBOM + Artifact Signing |

---

## Governance de Supply Chain

Governance no se limita al control de código — también abarca la **cadena de suministro completa** desde el build hasta el deploy:

### SBOM (Software Bill of Materials)

**Importancia:** El SBOM es el inventario machine-readable de todas las dependencias del artifact. Permite:

- **Trazabilidad de componentes** — identificar qué versión de cada dependencia está presente
- **Supply chain security** — detectar dependencias con vulnerabilidades conocidas
- **Compliance EO 14028** — requisito para software distribuido por US federal agencies

**Implementación en project-one:** El job `sbom` en `security.yml` genera SBOM en formato CycloneDX JSON usando `anchore/sbom-action@v0.24.0`.

### Dependency Review

**Importancia:** Valida que las dependencias nuevas no introduzcan vulnerabilidades o licencias problemáticas antes del merge.

**Implementación en project-one:** El job `dependency-review` en `security.yml` usa `actions/dependency-review-action@v5` con:

- `vulnerability-check: true`
- `license-check: true`

### Cadena de suministro: desde build hasta runtime

El ciclo de governance no termina en `ci-complete`. Los artifacts firmados (SBOM, cosign signatures, SLSA provenance) entran al registry y se verifican en el deploy:

```
[SBOM] ──→ [cosign sign] ──→ [attest-build-provenance] ──→ [registry]
                                 │
                                 ▼
  [deploy] ──→ [cosign verify] ──→ [salsa-verifier] ──→ [runtime]
```

---

## Estado actual en project-one

> **Distinción de estado (change `ci-governance-pre-merge-gates`):** este artículo ahora documenta la **cobertura TOTAL** de governance (7 momentos + 10 dimensiones transversales). Pero la _implementación_ en el repositorio sigue el alcance del change:
>
> - **Pre-PR/merge (commit / PR / merge) → IMPLEMENTABLES ✅:** firma, lint, PR metadata, dependency review, branch protection/rulesets, CODEOWNERS, merge queue. Son los que aparecen en la tabla "Componentes Implementados" más abajo.
> - **Post-merge (build/artifact / deploy / post-deploy / audit) → DOCUMENTADOS (OUT OF SCOPE de implementación en este change):** se incluyen para cubrir governance en su totalidad y cumplir SOC 2 CC8.1, ISO 27001 A.8.32 y NIST SSDF PS.3.
> - **Las 10 dimensiones de GOVERNANCE TRANSVERSAL (CONTINUOUS) → DOCUMENTADAS (OUT OF SCOPE):** continuas, se detallan en la sección anterior y en la matriz.

### Componentes Implementados

| Componente                         | Estado       | Modo                          | Location                                           |
| ---------------------------------- | ------------ | ----------------------------- | -------------------------------------------------- |
| Commit Lint (Conventional Commits) | Implementado | Bloqueante                    | `.github/workflows/ci.yml:commit-lint`             |
| Commit Signature Verification      | Implementado | Bloqueante                    | `.github/workflows/ci.yml:verify-signatures`       |
| PR Title Lint                      | Implementado | No-bloqueante (fase adopción) | `.github/workflows/ci.yml:pr-title-lint`           |
| DCO                                | Implementado | No-bloqueante (fase adopción) | `.github/workflows/ci.yml:dco`                     |
| Branch Protection Rulesets         | Implementado | Bloqueante (ruleset 21227644) | GitHub Settings → Rulesets                         |
| ci-complete aggregator             | Implementado | Bloqueante                    | `.github/workflows/ci.yml:ci-complete`             |
| Early-Abort Gate (SAST)            | Implementado | Bloqueante                    | `.github/workflows/ci.yml:verify-signatures`       |
| SBOM Generation                    | Implementado | No bloqueante                 | `.github/workflows/security.yml:sbom`              |
| Dependency Review                  | Implementado | No bloqueante                 | `.github/workflows/security.yml:dependency-review` |
| CodeQL SAST                        | Implementado | No bloqueante                 | `.github/workflows/security.yml:sast`              |

### Componentes de Supply Chain (Plantilla/Referencia)

| Componente                | Estado    | Documentación                                  |
| ------------------------- | --------- | ---------------------------------------------- |
| Artifact Signing (cosign) | Plantilla | `docs/ci-cd-pipeline-empresarial.md:1077-1145` |
| SLSA Provenance           | Plantilla | `docs/ci-cd-pipeline-empresarial.md:2521-2540` |
| Deploy Gates              | Plantilla | `docs/ci-cd-pipeline-empresarial.md:4996-5100` |
| Canary Deployments        | Plantilla | `docs/ci-cd-pipeline-empresarial.md:4905-5100` |
| Audit Trail               | Plantilla | Concepto documentado en lifecycle §6           |

### Componentes de Governance Transversal (Documentados / OUT OF SCOPE)

Las 10 dimensiones de la capa CONTINUOUS no tienen implementación en el repositorio (son post-merge, fuera del alcance del change `ci-governance-pre-merge-gates`). Se documentan aquí como referencia de la cobertura total:

| Dimensión transversal                                         | Estado      | Referencia                                |
| ------------------------------------------------------------- | ----------- | ----------------------------------------- |
| 1. Human repo access governance (RBAC)                        | Documentado | `docs/ci-cd-pipeline-empresarial.md:3280` |
| 2. Vulnerability mgmt governance (SLA/excepciones/disclosure) | Documentado | `docs/ci-cd-pipeline-empresarial.md:3281` |
| 3. Third-party & tooling governance                           | Documentado | `docs/ci-cd-pipeline-empresarial.md:3282` |
| 4. Data governance in pipelines (PII/PHI)                     | Documentado | `docs/ci-cd-pipeline-empresarial.md:3283` |
| 5. Release governance                                         | Documentado | `docs/ci-cd-pipeline-empresarial.md:3284` |
| 6. Incident & postmortem governance                           | Documentado | `docs/ci-cd-pipeline-empresarial.md:3285` |
| 7. SLO / error-budget governance                              | Documentado | `docs/ci-cd-pipeline-empresarial.md:3286` |
| 8. Configuration & environment drift governance               | Documentado | `docs/ci-cd-pipeline-empresarial.md:3287` |
| 9. Meta-governance                                            | Documentado | `docs/ci-cd-pipeline-empresarial.md:3288` |
| 10. Docs & knowledge governance (ADRs)                        | Documentado | `docs/ci-cd-pipeline-empresarial.md:3289` |

---

## Resumen

Governance en CI/CD no es un stage extra que se agrega al final — es **una filosofía que permea todo el pipeline** y, además, una **capa transversal continua** que lo envuelve de extremo a extremo. Desde el primer `commit` hasta el `audit/recovery`, cada paso verifica que el código cumpla nuestras políticas antes de llegar a los usuarios.

El ciclo de **7 momentos** (commit → PR → merge → build/artifact → deploy → post-deploy → audit/recovery) nos da **velocidad con garantía**: automatizamos lo verificable, reservamos la intervención humana para lo que requiere juicio, y documentamos todo para que mañana tengamos respuestas a las preguntas que hoy ni siquiera sabemos que haremos.

Pero los gates puntuales no bastan: la **capa GOVERNANCE TRANSVERSAL (CONTINUOUS)** aporta las **10 dimensiones de cobertura total** — acceso humano/RBAC, vulnerabilidades, terceros/tooling, datos/PII-PHI, release, incidentes/postmortem, SLO/error-budget, config/drift, meta-governance y docs/ADRs — que exigen SOC 2, ISO 27001:2022, NIST SSDF y NIST 800-53 y que la [matriz completa de 44 filas / 10 dominios](#matriz-completa-de-governance-por-momento-del-pipeline-44-filas--10-dominios) consolida.

La pregunta final no es "¿tenemos governance?" sino **"¿cada commit que llega a producción pasó por verificaciones que podemos demostrar ante cualquier auditor, y tenemos gobernanza de extremo a extremo sobre acceso, datos, incidentes y política?"**

En nuestro proyecto, la respuesta es sí — para los componentes pre-PR/merge que ya implementamos (commit/PR/merge). Los momentos build/artifact, deploy, post-deploy, audit y las 10 dimensiones transversales están **documentados** como cobertura total (post-merge, OUT OF SCOPE de implementación en el change `ci-governance-pre-merge-gates`), y estamos trabajando para que la respuesta sea sí para todos.

---

## Referencias

- `docs/ci-cd-pipeline-empresarial.md` — §13 (Stage 11: Approval / Governance)
- `docs/ci-cd-pipeline-empresarial.md` — **§13.10 Governance a lo largo de todo el ciclo de vida (CI a CD, post-deploy y audit)**
- `docs/ci-cd-pipeline-empresarial.md` — **§23.3.1.1 Ciclo completo de Governance (7 momentos: commit a audit)**
- `docs/ci-cd-pipeline-empresarial.md` — **§23.3.2 Matriz completa de Governance por momento del pipeline (44 filas / 10 dominios)** y §23.3.2.1 (governance transversal continuo)
- `docs/ci-cd-pipeline-empresarial.md` — Diagrama 23.3 (pipeline reorganizado con capa transversal CONTINUOUS)
- `docs/learning/ci-cd/19-governance-gates.md` — Framework de 5 niveles de governance gates
- `docs/cicd-plantilla-completa.md` — Estado de implementación de governance en project-one
- Change `ci-governance-pre-merge-gates` — alcance pre-PR/merge implementable vs post-merge documentado
