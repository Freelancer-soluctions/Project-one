# Security Policy

## 1. Propósito

Este documento define las políticas de seguridad del proyecto con el objetivo de mitigar los riesgos identificados en el **OWASP Top 10 (2021/2024)**, con especial énfasis en **A02: Cryptographic Failures**, y extendiéndose a los controles necesarios desde **A03 en adelante**.

El contenido sirve como:

- Evidencia para auditorías de seguridad (OWASP, ISO/IEC 27001, revisiones técnicas)
- Guía para desarrolladores actuales y futuros
- Base de revisión periódica de controles de seguridad

---

## 2. Alcance

Aplica a:

- Backend: **Node.js + Express (JavaScript)**
- Frontend: **React**
- Autenticación basada en **JWT (Access + Refresh Token)**
- Comunicación cliente-servidor vía **HTTPS**

---

## 3. A02 – Cryptographic Failures

### 3.1 Algoritmos criptográficos permitidos

El proyecto **solo permite algoritmos criptográficos considerados seguros y vigentes**:

- Hash de contraseñas: `bcrypt` (cost factor ≥ 10)
- Tokens JWT: `HS256` / `RS256` (según configuración)
- Generación de entropía: `crypto.randomBytes`
- TLS: TLS 1.2 o superior

**Algoritmos explícitamente prohibidos**:

- MD5
- SHA-1
- RC4
- DES / 3DES
- AES en modo ECB

---

### 3.2 Manejo de claves y secretos

- Ninguna clave criptográfica se encuentra hardcodeada en el código fuente.
- Todas las claves se obtienen desde variables de entorno.
- Se utilizan claves separadas para:
  - Access Token
  - Refresh Token

- Las claves cumplen con longitudes adecuadas (≥ 256 bits para secretos simétricos).

---

### 3.3 Tokens JWT

- Los **Access Tokens**:
  - Son de corta duración
  - Se almacenan en `sessionStorage` del frontend
  - Se envían exclusivamente por el header `Authorization`

- Los **Refresh Tokens**:
  - Se almacenan en cookies con:
    - `httpOnly: true`
    - `secure: true`
    - `sameSite` configurado según entorno

  - Son rotados en cada uso
  - Se invalidan al cerrar sesión

---

### 3.4 Protección contra CSRF

- Se implementa el patrón **Double Submit Cookie**:
  - Cookie `csrfToken` accesible por frontend
  - Header `csrf-token` enviado explícitamente

- La validación se realiza con comparación segura (`timingSafeEqual`).
- El endpoint de refresh token está protegido contra CSRF.

---

### 3.5 Transporte seguro (TLS)

- Todo el tráfico se realiza exclusivamente sobre HTTPS.
- No se permite transmisión de tokens ni credenciales sobre HTTP.
- En producción se forzará TLS mediante infraestructura y/o proxy inverso.

---

### 3.6 Logging seguro

- Nunca se registran:
  - Contraseñas
  - Tokens JWT
  - Refresh tokens
  - Claves criptográficas

- Los logs se consideran datos sensibles y se protegen adecuadamente.

---

### 3.7 Revisión criptográfica periódica

La configuración criptográfica se revisa periódicamente para verificar:

- Algoritmos vigentes y no obsoletos
- Tamaños de clave adecuados
- Uso correcto de randomness
- Configuración TLS actualizada

---

## 4. A03 – Injection

- Uso de ORM / query builders para acceso a datos
- Validación y sanitización de entradas

Prevenir vulnerabilidades de inyección (SQL, NoSQL, ORM, Command Injection, Mass Assignment) asegurando que toda entrada proveniente del cliente sea validada explícitamente antes de ser procesada por la aplicación.

Alcance

Esta política aplica a todas las entradas externas recibidas por la aplicación, incluyendo pero no limitado a:

req.body

req.params

req.query

req.headers

req.cookies

Controles implementados

1. Validación centralizada de entrada

Toda ruta expuesta por la API DEBE aplicar un middleware de validación previo al controller, basado en esquemas explícitos.

No se permite acceso directo a req.body, req.params o req.query desde la lógica de negocio sin validación previa.

La validación se realiza mediante esquemas declarativos (Joi u otro validador equivalente).

2. Whitelisting estricto de campos

La aplicación utiliza listas blancas (whitelisting) para definir qué campos son aceptados por cada endpoint.

Solo se permiten los campos definidos en el esquema de validación.

Campos adicionales enviados por el cliente son rechazados automáticamente.

No se utilizan listas negras.

Esto mitiga:

Inyecciones indirectas

Mass Assignment

Manipulación de payloads

3. Validación por tipo, formato, longitud y rango

Cada campo de entrada es validado explícitamente según:

Tipo de dato esperado

Longitud mínima y máxima

Formato (email, fecha, UUID, etc.)

Reglas de obligatoriedad

No se aceptan valores implícitos, coerción silenciosa ni datos parcialmente válidos.

4. Corte temprano del flujo (Fail Fast)

Si la validación falla:

La petición se rechaza inmediatamente con código 400 Bad Request

El request NO alcanza la capa de controladores ni servicios

No se ejecuta lógica de negocio ni consultas a bases de datos

Esto reduce la superficie de ataque y evita que payloads maliciosos lleguen a capas sensibles.

5. Mensajes de error controlados

Los errores de validación:

No exponen estructuras internas

No revelan detalles de implementación

Devuelven únicamente mensajes de validación controlados

6. Separación entre validación y lógica de negocio

La validación de entrada está desacoplada de:

Controllers

Services

Repositories / DAOs

Esto garantiza consistencia, reutilización y cumplimiento uniforme de la política de seguridad.

Riesgos mitigados

SQL Injection

NoSQL Injection

ORM Injection

Command Injection

Mass Assignment

Manipulación de payloads

Bypass de reglas de negocio por input no validado

Cumplimiento OWASP

Esta implementación cumple con los controles recomendados por OWASP Top 10 2021 – A03: Injection, específicamente:

Validación estricta de entrada

Uso de whitelisting

Rechazo de datos inesperados

Reducción de superficie de ataque desde el input

- No se construyen queries dinámicas sin control

Control de exposición de registros (Data Exposure Control)

La aplicación implementa controles explícitos para evitar la exposición masiva de registros como consecuencia de consultas manipuladas o no acotadas, mitigando escenarios comunes de explotación asociados a A03: Injection. Todas las operaciones de lectura que soportan paginación utilizan valores de limit y offset validados, tipados y acotados previamente, impidiendo que el cliente fuerce consultas sin límites o con rangos arbitrarios. El acceso a datos se realiza exclusivamente mediante ORMs, query builders o consultas parametrizadas, evitando la interpolación directa de valores provenientes del cliente. Adicionalmente, el total de registros (count) requerido para paginación se obtiene mediante consultas controladas y separadas, garantizando que la lógica de conteo no reutilice ni exponga consultas dinámicas no validadas. Este enfoque reduce la superficie de ataque, previene enumeración de datos y asegura que el sistema permanezca resiliente incluso ante intentos de manipulación de parámetros de paginación o filtrado.

Validación fuerte de todos los parámetros

Validar:

Query string

Path params

Headers

JSON bodies

Cookies

Incluso en APIs publicadas o microservicios internos.
👉 Haz revisión de código para confirmar validaciones en todos los endpoints.

---

## 5. A04 – Insecure Design

- La arquitectura separa responsabilidades (controllers, services, middlewares)
- Los controles de seguridad se aplican por defecto (deny by default)
- Las decisiones criptográficas están centralizadas

---

## 6. A05 – Security Misconfiguration

- Uso de `helmet` para encabezados de seguridad
- Configuración explícita de CSP
- Deshabilitación de información sensible en headers
- Configuración estricta de CORS

---

## 7. A06 – Vulnerable and Outdated Components

- Dependencias auditadas periódicamente
- Uso de herramientas como `npm audit`
- Actualización activa de librerías críticas

---

## 8. A07 – Identification and Authentication Failures

- Autenticación basada en tokens
- Hash seguro de contraseñas
- Separación entre access y refresh tokens
- Revocación de sesión al cerrar sesión

---

## 9. A08 – Software and Data Integrity Failures

- Dependencias obtenidas de repositorios oficiales
- Uso de lockfiles
- No ejecución de código remoto dinámico

---

## 10. A09 – Security Logging and Monitoring Failures

- Logging centralizado
- Registro de eventos relevantes de seguridad
- Registro de violaciones CSP

---

## 11. A10 – Server-Side Request Forgery (SSRF)

- No se permiten URLs arbitrarias proporcionadas por el usuario
- Validación estricta de destinos externos

---

## 12. Reporte de vulnerabilidades

Las vulnerabilidades deben ser reportadas de forma responsable mediante los canales definidos por el equipo del proyecto.

---

## 13. Revisión del documento

Este documento será revisado y actualizado cuando:

- Cambien los requisitos de seguridad
- Se modifique la arquitectura
- Se detecten nuevas vulnerabilidades relevantes

---

## Static Application Security Testing (SAST)

This project uses **Semgrep** locally to perform static code analysis following a Shift-Left security strategy.

### Covered OWASP Top 10 categories

The following vulnerability classes are scanned:

- Broken Access Control
- Broken Authentication
- Cross-Site Scripting (XSS)
- Cryptographic Failures
- Identification and Authentication Failures
- Injection
- Insecure Deserialization
- Insecure Design
- Security Misconfiguration
- Sensitive Data Exposure
- Server Side Request Forgery (SSRF)
- Software and Data Integrity Failures
- Vulnerable and Outdated Components

### Implemented Rules

See the full rule definition in: docs/security/semgrep-rules

The rules include checks for:

- Express security misconfigurations
- JWT misconfigurations
- DOM XSS
- SQL Injection
- Unsafe dynamic code execution
- Prototype pollution
- SSRF
- Insecure crypto usage

# Dependency Vulnerability Scanning

## Overview

This project performs **dependency vulnerability scanning** to detect known security issues in third-party libraries used by the application.

The project uses **Trivy** to analyze dependencies and identify vulnerabilities listed in public vulnerability databases.

Dependency scanning helps detect:

- vulnerable packages
- insecure transitive dependencies
- known CVEs affecting third-party libraries
- recommended fixed versions

This process is part of the project's **Shift-Left security strategy**.

---

# Scope

The repository is structured as a **monorepo using npm workspaces**.

Dependencies are resolved through the root lockfile:

```
package-lock.json
```

Because of this, dependency scanning runs at the **repository root**, covering all workspaces automatically.

Example structure:

```
root
│
├── package.json
├── package-lock.json
├── apps
│   ├── client
│   └── server
```

---

# Vulnerability Detection

The dependency scanner identifies vulnerabilities in:

- direct dependencies
- transitive dependencies
- packages referenced in the lockfile

Vulnerabilities are classified by severity:

| Severity | Description                                        |
| -------- | -------------------------------------------------- |
| LOW      | minimal security risk                              |
| MEDIUM   | moderate risk                                      |
| HIGH     | serious security issue                             |
| CRITICAL | severe vulnerability requiring immediate attention |

---

# Security Enforcement

The project enforces security checks through multiple layers:

```
Developer machine
│
├─ Static Analysis (Semgrep)
├─ Secret Detection (Gitleaks)
└─ Dependency Vulnerabilities (Trivy)
```

Dependency vulnerabilities classified as **HIGH or CRITICAL** should be addressed before merging code.

---

# Remediation Process

If a vulnerability is detected, developers should:

1. Identify the affected package.
2. Upgrade the dependency to the **recommended fixed version**.
3. Re-run the dependency scan.
4. Verify that the vulnerability is resolved.

If a patch is not available:

- document the risk
- track the issue in the repository
- monitor upstream fixes

---

# Reporting Security Issues

If a security issue related to dependencies is discovered, it should be reported following the repository's vulnerability reporting process.

Security issues should **not be disclosed publicly until they are properly addressed**.

# Secret Detection

## Overview

This project performs **secret detection scanning** to identify sensitive information that may have been accidentally committed to the repository.

The project uses **GitHub native secret scanning** (free for public repositories) as the primary detection layer, complemented by **Gitleaks open source** (`zricethezav/gitleaks` Docker image, MIT licensed) for CI gate enforcement — no commercial license required.

Secret detection helps prevent exposure of:

- API keys
- authentication tokens
- database credentials
- private cryptographic keys
- passwords and secrets embedded in code

Detecting secrets early reduces the risk of credential leakage and unauthorized access to infrastructure or third-party services.

This process is part of the project's **Shift-Left security strategy**.

---

# Scope

The repository is structured as a **monorepo using npm workspaces**.

Secret detection scans the repository from the **root directory**, ensuring all workspaces are analyzed.

Example repository structure:

root
│
├── package.json
├── .gitleaks.toml
├── apps
│ ├── client
│ └── server

All files staged for commit are analyzed regardless of the workspace they belong to.

---

# Secret Detection Rules

Secret detection is performed using the configuration defined in: .gitleaks.toml

All files staged for commit are analyzed regardless of the workspace they belong to.

This configuration includes:

- official Gitleaks detection rules
- custom rules for generic secrets
- exclusions for build artifacts and dependencies
- exclusions for testing directories

Typical detection patterns include:

- API key assignments
- secret environment variables
- password assignments
- private cryptographic keys
- JSON Web Tokens (JWT)

---

# GitHub Secret Scanning

## Overview

This project uses a **two-layer secret detection strategy**:

1. **GitHub Native Secret Scanning** (primary layer) — Runs automatically on every push to the repository. Free for public repositories; requires GitHub Advanced Security (GHAS) for private repositories. Provides real-time alerts in the Security tab and optional push protection.

2. **Gitleaks Open Source in CI** (enforcement layer) — Runs on every pull request (diff-scoped scan) and weekly (full-history scan) via GitHub Actions. Uses the `zricethezav/gitleaks` Docker image (MIT licensed). No commercial license or secret required.

### Layer 1: GitHub Native Secret Scanning

#### Enabling Secret Scanning (Repository Admin)

**Via UI (recommended):**

1. Navigate to **Settings → Security → Secret scanning & push protection**
2. Click **Enable** for "Secret scanning"
3. Click **Enable** for "Push protection" to block pushes containing recognized secrets

**Via API (one-liner, automatable):**

```bash
gh api -X PATCH repos/{owner}/{repo}/security-and-analysis \
  -f secret_scanning.enabled=true \
  -f secret_scanning_push_protection.enabled=true
```

> **Note for private repositories:** GitHub Secret Scanning and Push Protection require **GitHub Advanced Security (GHAS)**, which is a paid feature. If the repository is private and GHAS is not enabled, the native layer cannot be activated. In this case, the operational detection layer is **Gitleaks OSS only** — the CI workflows will still run and detect secrets via the open-source tool.

#### Handling Alerts

When GitHub Secret Scanning detects a secret:

1. An **alert appears in the Security tab** with the secret type, file path, and commit
2. **Review the alert** — confirm whether it is a true positive or false positive
3. **If true positive:**
   - **Rotate the secret immediately** (revoke and regenerate)
   - **Remove the secret from history** if needed (e.g., `git filter-repo`, BFG Repo-Cleaner)
   - Update the application configuration with the new secret
4. **Dismiss the alert** with appropriate justification:
   - "False positive" — not actually a secret
   - "Won't fix" — secret is intentionally in the repo (e.g., test fixtures, documented examples)
   - "Revoked" — secret has been rotated and is no longer valid

### Layer 2: Gitleaks in CI

#### PR-Time Gate (Pull Request Scan)

- **Trigger:** Every PR targeting `main`
- **Scope:** Diff-only scan (`base.sha..head.sha`) — only new/changed lines in the PR
- **Behavior:** **Fail-closed** — if a secret is detected in the PR diff, the check fails and blocks merge
- **Tool:** `docker://zricethezav/gitleaks:v8.22.1` with `git --log-opts="${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}" --redact --verbose`
- **Graceful degradation:** If `GIT_LEAKS` secret is not configured, the job still runs using open-source Gitleaks and emits a warning (does not fail)

#### Weekly Full-History Scan (Scheduled)

- **Trigger:** Weekly cron (Monday 03:00 UTC) + manual `workflow_dispatch`
- **Scope:** Full repository history (`--log-opts="--all"`) — all refs and commits
- **Behavior:** **Audit mode** (`continue-on-error: true`) — findings are reported but do not fail the run
- **Outputs:**
  - JSON artifact (`gitleaks-report`) uploaded for 30 days (with `--redact` to avoid exposing secrets in the artifact)
  - SARIF uploaded to **Security tab** for centralized visibility (requires `security-events: write` permission)
- **Tool:** `docker://zricethezav/gitleaks:v8.22.1` with `git --log-opts="--all" --report-format=json --report-path=gitleaks-report.json --redact` (and a second invocation for SARIF)

---

# Security Enforcement

Security checks are executed at multiple stages of the development lifecycle.

Developer machine
│
├─ Static Analysis (Semgrep)
├─ Secret Detection (Gitleaks pre-commit)
├─ Secret Detection (CI: PR-time gate + weekly full-history scan)
└─ Dependency Vulnerabilities (Trivy)

Secret detection is executed locally before code is committed to the repository.

This prevents accidental leaks from reaching the version control system.

In CI, secret detection runs at two additional stages:

1. **Pull Request gate** — Diff-scoped scan on every PR to `main` (fail-closed)
2. **Weekly scheduled scan** — Full-history audit every Monday 03:00 UTC (audit mode, findings via artifact + Security tab)

This multi-layered approach ensures secrets are caught both before commit and after merge, covering the gap where a secret already in history would not be detected by pre-commit or PR-time scans alone.

---

# Commit Protection

Secret detection runs during the **pre-commit phase** of the development workflow.

If a potential secret is detected:

- the commit is blocked
- the developer receives a warning message
- the secret must be removed or replaced

This mechanism prevents sensitive information from being committed to the repository.

---

# Remediation Process

If a secret is detected during scanning, developers should:

1. Identify the exposed credential.
2. Remove the secret from the source code.
3. Replace the value with an environment variable if needed.
4. Re-run the secret scan.
5. Commit the changes once the issue is resolved.

If the secret has already been exposed:

- rotate the credential immediately
- revoke the compromised token or key
- update the application configuration with the new secret

---

# Reporting Security Issues

If a security issue related to exposed secrets is discovered, it should be reported following the repository's vulnerability reporting process.

Sensitive information should **never be disclosed publicly** until the issue has been properly mitigated.

---

# Scheduled Security Digest

## Overview

This project runs a **weekly scheduled security digest** every **Monday at 03:00 UTC** via the GitHub Actions workflow `.github/workflows/security-digest.yml`. The digest consolidates three security analyses into a single human-readable markdown report:

1. **SBOM Generation** — CycloneDX Software Bill of Materials for the merged `main` branch state
2. **Vulnerability & License Review** — OSV Scanner analysis of `package-lock.json` for known vulnerabilities and license compliance
3. **Secret Scan Cross-Reference** — Findings from the sibling `scheduled-security.yml` workflow (Gitleaks full-history scan)

The workflow also supports manual execution via `workflow_dispatch` with an optional `pull_request_number` input to post an actionable summary as a PR comment.

---

## Cadence

| Trigger                          | Schedule                       | Notes                                                                 |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Scheduled (cron)**             | `0 3 * * 1` — Monday 03:00 UTC | Same cadence as `scheduled-security.yml` for artifact cross-reference |
| **Manual (`workflow_dispatch`)** | On-demand                      | Optional `pull_request_number` input enables PR summary comment       |

> **Note**: GitHub disables scheduled workflows after 60 days of repository inactivity. Use `workflow_dispatch` to re-enable or run manually.

---

## What Runs

### 1. SBOM Generation (`sbom` job)

- **Tool**: `anchore/sbom-action@v0.17.2` (Syft)
- **Format**: CycloneDX JSON (`sbom-project-one.json`)
- **Scope**: Entire repository (npm workspaces hoisted to root `package-lock.json`)
- **Artifact**: `sbom` (retention: 365 days)

### 2. Vulnerability & License Review (`vulnerability-review` job)

- **Tool**: `google/osv-scanner-action@v2.3.8`
- **Target**: `package-lock.json` (root lockfile covering all workspaces)
- **Output**: JSON report (`osv-report.json`) with vulnerability details and severity
- **Mode**: Audit (`continue-on-error: true`) — findings reported but run does not fail
- **Artifact**: `osv-report` (default retention)

### 3. Security Digest Generation (`digest` job)

- **Dependencies**: `needs: [sbom, vulnerability-review]` with `if: always() && !cancelled()`
- **Script**: `scripts/security/generate-security-digest.mjs` (pure Node.js ≥20, zero npm dependencies)
- **Inputs**:
  - `sbom-project-one.json` (from `sbom` job)
  - `osv-report.json` (from `vulnerability-review` job)
  - `gitleaks-report.json` (optional, from latest `scheduled-security.yml` run)
- **Output**: `security-digest.md` artifact
- **Optional PR Comment**: When `pull_request_number` input is provided, posts a summary comment **only if actionable findings exist** (critical/high vulnerabilities or deny-listed licenses)

---

## How to Read the Digest

The generated `security-digest.md` contains the following sections:

### 📦 Total Dependencies

Count of packages in the dependency tree derived from the CycloneDX SBOM components array.

### 🔍 Vulnerable Packages

Vulnerabilities grouped by severity with badges:

- 🚨 **CRITICAL** — Immediate attention required
- 🔴 **HIGH** — Serious security issue
- 🟡 **MEDIUM** — Moderate risk
- 🟢 **LOW** — Minimal security risk

Each entry shows: package name, version, vulnerability ID (CVE/GHSA), title, and CVSS score (if available).

### ⚖️ License Summary

Table of all licenses found in the SBOM with counts and status:

- ✅ **Allowed** — License not in deny-list
- ⛔ **DENY-LIST** — License matches `LICENSE_DENY_LIST` (see below)

Packages with deny-listed licenses are listed individually with name, version, and license.

### 🔐 Secret Scan Cross-Reference

- **Findings: N** — Number of secrets detected by Gitleaks in the latest `scheduled-security.yml` run
- **Secret report unavailable** — Sibling workflow artifact not found (workflow not yet run, artifact expired, or run failed)

---

## Artifact Locations

All artifacts are available in the **GitHub Actions → Artifacts** tab of the `security-digest` workflow run:

| Artifact Name     | Description                                           | Retention         |
| ----------------- | ----------------------------------------------------- | ----------------- |
| `sbom`            | CycloneDX SBOM (`sbom-project-one.json`)              | 365 days          |
| `osv-report`      | OSV Scanner JSON report (`osv-report.json`)           | Default (90 days) |
| `security-digest` | Human-readable markdown digest (`security-digest.md`) | Default (90 days) |

The sibling `gitleaks-report` artifact (from `scheduled-security.yml`) has 30-day retention per its workflow configuration.

---

## License Deny List (`LICENSE_DENY_LIST`)

The following licenses are flagged as **deny-listed** in the digest. This list is aligned with the default deny-list of `actions/dependency-review-action` (used in the sibling `security.yml` workflow):

| License     | Family |
| ----------- | ------ |
| `GPL-1.0`   | GPL    |
| `GPL-1.0+`  | GPL    |
| `GPL-2.0`   | GPL    |
| `GPL-2.0+`  | GPL    |
| `GPL-3.0`   | GPL    |
| `GPL-3.0+`  | GPL    |
| `LGPL-1.0`  | LGPL   |
| `LGPL-1.0+` | LGPL   |
| `LGPL-2.0`  | LGPL   |
| `LGPL-2.1`  | LGPL   |
| `LGPL-3.0`  | LGPL   |
| `AGPL-1.0`  | AGPL   |
| `AGPL-1.0+` | AGPL   |
| `AGPL-3.0`  | AGPL   |
| `AGPL-3.0+` | AGPL   |

**Rationale**: These copyleft licenses impose redistribution requirements that may be incompatible with the project's distribution model. The deny-list is defined as a static constant in `scripts/security/generate-security-digest.mjs` and documented here for auditability.

**Note on scope**: This list intentionally contains **15 entries** rather than the full 18-entry default deny-list of `actions/dependency-review-action`. The three omitted variants — `LGPL-2.0+`, `LGPL-2.1+`, `LGPL-3.0+` — are excluded by design: the base LGPL family (`LGPL-2.0`, `LGPL-2.1`, `LGPL-3.0`) is already covered, and the `-+` "or later" suffix variants are omitted to avoid over-blocking. This is a deliberate scope reduction, not an oversight.

---

## Manual Execution

To run the digest manually and optionally post a PR comment:

1. Go to **Actions → Scheduled Security Digest → Run workflow**
2. (Optional) Enter a **Pull Request number** in the `pull_request_number` field
3. Click **Run workflow**

If a PR number is provided and the digest contains actionable findings (critical/high vulnerabilities or deny-listed licenses), a summary comment will be posted to that PR with a link to the full artifact.

---

## Related Workflows

| Workflow                 | Purpose                           | Relationship                                                                                  |
| ------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `scheduled-security.yml` | Weekly Gitleaks full-history scan | Provides `gitleaks-report` artifact for cross-reference                                       |
| `security.yml`           | PR/push SBOM + Dependency Review  | Separate scope (event-driven); this workflow re-runs SBOM on cron for merged state visibility |

---

**Última actualización:** 2026-07-31
