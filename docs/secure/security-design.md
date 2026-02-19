> Note:
> This document represents a post-implementation security design reconstruction
> based on existing code and configuration.
> At the time of initial development, a formal secure design process was not documented.
> This document establishes the baseline for future secure-by-design development.

# Security Design

## 1. Security Design Principles
**Principle:** Multiple independent security layers must protect critical assets.

### Defense in Depth
**Evidence:** Multiple overlapping security controls implemented:
- Application layer: Helmet CSP, rate limiting, CSRF protection
- Authentication layer: JWT with issuer/audience validation, refresh token rotation
- Data layer: Joi validation with allowUnknown: false
- Network layer: CORS configuration, secure cookie settings

### Least Privilege
**Evidence:** Role-based access control implemented with granular permissions:
- Permission matrix defined (README.md:95-201) showing Admin/Manager/User access levels
- Middleware `verifyRole.js` and `checkRoleAuthOrPermisssion` controls route access
- Frontend route guards (`ProtectedRoutes.jsx`) prevent unauthorized navigation

### Secure by Default
**Evidence:** Security controls applied globally in `app.js:12-38`:
- Helmet configuration applied to all routes by default
- Rate limiting applied globally to `/api` endpoints
- CSRF protection conditionally applied to all `/api/v1` routes
- Secure cookie defaults (httpOnly, secure, sameSite)

**Not explicitly defined in project:** Zero Trust Architecture, Secure Coding Standards documentation

## 2. Security Requirements

### 2.1 Functional Security Requirements

| Requirement | Evidence |
|-------------|----------|
| **Authentication required for protected endpoints** | Implemented via `verifyToken` middleware. **Decision made during implementation; no evidence of authentication requirements defined at design time.** |
| **Session management with secure token rotation** | Implemented via refresh token mechanism with `refreshTokenLimiter`. **No formal session security requirements documented before implementation.** |
| **Role-based authorization** | Implemented via permission matrix and `verifyRole` middleware. **Authorization model inferred during development; no pre-defined access control design artifact found.** |
| **CSRF protection for state-changing operations** | Implemented via `verifyCsrf` middleware using double-submit cookie pattern. **CSRF protection added as technical control, not as design requirement.** |
| **Input validation and sanitization** | Implemented via Joi validation middleware. **Input validation strategy not documented during design phase.** |
| **Rate limiting for abuse prevention** | Implemented via multiple rate limiters (global, login, refresh). **Abuse prevention controls added during implementation without documented threat modeling.** |
| **Secure configuration management** | **Missing.** No documented configuration security requirements or secure defaults defined at design time. |
| **Secure logging and monitoring** | Partially implemented via logger for security events. **No defined logging or monitoring requirements documented during design.** |
| **API security documentation** | Swagger documentation exists, but **security requirements are descriptive, not design-driven.** |


### 2.2 Non-Functional Security Requirements

#### Confidentiality
- **Data at rest encryption:** **Missing.** No evidence of database encryption requirements defined during the design phase.
- **Data in transit encryption:** Implemented via HTTPS with HSTS in production. Transport security assumed as an infrastructure concern rather than an explicit application design requirement.
- **Sensitive data handling:** Partially present via HTTP-only cookies for refresh tokens. No documented data classification or sensitivity handling requirements.
- **PII protection:** **Missing.** No explicit privacy or personal data protection requirements documented at design time.

#### Integrity
- **Data validation:** Implemented via Joi strict whitelisting (`allowUnknown: false`). Validation strategy not formally defined during design.
- **CSRF protection:** Implemented using the double-submit cookie pattern. CSRF mitigation added during the implementation phase, not specified as a design requirement.
- **Secure headers:** Implemented via Helmet configuration. Security headers were applied globally but not documented as part of the initial security design.
- **API integrity controls:** Implemented via JWT signing and verification. Token integrity controls derived from implementation decisions.

#### Availability
- **Rate limiting:** Implemented with multiple rate limiters (global, login, refresh). Availability protections added reactively without predefined availability requirements.
- **Error handling:** Implemented via a global error handler to prevent information disclosure. Error handling strategy not documented as a security requirement.
- **Resource protection:** Partially present. No formal DoS resistance or capacity protection requirements defined.
- **Monitoring:** Partially present via security event logging. No explicit availability or uptime monitoring requirements documented.

#### Authenticity
- **Strong authentication:** Implemented via JWT with issuer and audience validation. Authentication strength requirements not formally defined during design.
- **Session management:** Implemented via secure access/refresh token lifecycle. Session management policies not documented as design requirements.
- **Identity verification:** Partially present. No MFA or identity assurance requirements defined.
- **Non-repudiation:** **Missing.** No audit trail or accountability requirements documented.


## 3. Threat Modeling

### Authentication Module
**Likely Threats:**
- Credential stuffing attacks
- JWT token manipulation
- Session hijacking
- Brute force attacks

**Mitigations Implemented:**
- Rate limiting for login attempts (`loginLimiter`: 5 attempts/15min)
- JWT validation with issuer/audience verification
- Secure HTTP-only cookies for refresh tokens
- CSRF protection for state changes

**Expected Secure Design Artifacts (Missing):**
- Data Flow Diagram (DFD)
- Threat model (STRIDE)
- Risk ranking

**Threat Modeling Evidence:** **Not formally documented for this module prior to implementation. Security controls appear to be implemented based on industry best practices rather than formal threat modeling.**

### API Gateway/Endpoints
**Likely Threats:**
- Injection attacks (SQL/NoSQL)
- Mass assignment attacks
- Unauthorized data access
- API abuse/DoS

**Mitigations Implemented:**
- Input validation via Joi with allowUnknown: false
- Role-based access control
- Parameter validation middleware (`validatePathParam`)
- Rate limiting per endpoint type
- CORS restrictions

**Threat Modeling Evidence:** **Not formally documented for this module prior to implementation. Partial evidence of threat awareness in security audit document (SECURITY_AUDIT_PATH_PARAMS.md) which identifies injection vulnerabilities in path parameters.**

### Frontend Application
**Likely Threats:**
- XSS attacks
- CSRF attacks
- Client-side data exposure
- Authentication token theft

**Mitigations Implemented:**
- Content Security Policy via Helmet
- CSRF token handling in axios interceptors
- Route guards for protected navigation
- Secure token storage (sessionStorage for access tokens, httpOnly cookies for refresh)

**Threat Modeling Evidence:** **Not formally documented for this module prior to implementation. Security controls appear to follow React security best practices without documented threat analysis.**

### Data Access Layer
**Likely Threats:**
- SQL injection
- Data leakage
- Privilege escalation
- Data tampering

**Mitigations Implemented:**
- Prisma ORM with parameterized queries
- Role-based data access patterns
- Input validation before data layer
- Audit logging in security events

**Threat Modeling Evidence:** **Not formally documented for this module prior to implementation. Use of ORM suggests awareness of injection risks, but no documented threat analysis.**

### Configuration Management
**Likely Threats:**
- Credential exposure
- Configuration tampering
- Environment-specific vulnerabilities

**Mitigations Implemented:**
- Environment-based configuration
- AWS Secrets Manager integration (commented out but implemented)
- Development vs production security settings (CSP, HSTS)

**Threat Modeling Evidence:** **Not formally documented for this module prior to implementation. Security decisions appear to be implementation-driven rather than design-driven.**

## 4. Security Architecture Decisions

### Decision 1: JWT-based Authentication with Refresh Tokens

**Description:** Access tokens (15min) with refresh tokens (24h) stored in HTTP-only cookies.
**Context:** Stateless authentication required for the application.
**Decision Timing:** During implementation (no prior security design document).
**Decision Owner:** Engineering team (no formal security architecture review).
**Risks Considered:** Token theft, session hijacking, replay attacks, scalability.
**Security Justification:** 
This decision was made based on industry best practices during implementation.
Short-lived access tokens reduce exposure, HTTP-only cookies mitigate XSS-based token theft,
and refresh token rotation limits session abuse.
**Evidence:** `utils/jwt/createToken.js:151-176`, `modules/auth/controller.js:41-109`


### Decision 2: CSRF Protection Implementation
**Description:** Double-submit cookie pattern using a CSRF token stored in a non-HTTP-only cookie and validated against a custom request header.
**Context:** The application uses cookies for authentication (refresh token in HTTP-only cookie), which makes it vulnerable to CSRF attacks on state-changing operations.
**Decision Timing:** During implementation (no prior security design document).
**Decision Owner:** Engineering team (no formal security architecture review).
**Risks Considered:** Cross-Site Request Forgery (CSRF), unauthorized state changes, session abuse.
**Security Justification:**  
The double-submit cookie pattern was selected as a lightweight CSRF mitigation aligned with the existing cookie-based authentication model. Timing-safe comparison is used to avoid token comparison attacks. The decision was made during implementation based on common industry practices rather than a formal design-phase threat model.
**Evidence:** `middleware/verifyCsrf.js:32-33`


### Decision 3: Defense in Depth via Multiple Rate Limiters
**Description:** Multiple rate limiters applied at different layers: global API access, login attempts, refresh token usage, and sensitive operations.
**Context:** The API is publicly accessible and exposed to abuse patterns such as brute-force attacks, credential stuffing, and denial-of-service attempts.
**Decision Timing:** During implementation (incrementally added as abuse scenarios were identified).
**Decision Owner:** Engineering team.
**Risks Considered:** Denial of Service (DoS), credential stuffing, brute-force authentication attempts, token abuse.
**Security Justification:**  
Tiered rate limiting was implemented to apply proportional controls based on endpoint sensitivity. This approach limits attack surface while preserving usability. The decision reflects reactive hardening based on anticipated threat vectors rather than predefined design-stage security requirements.
**Evidence:** `middleware/rateLimit.js:21-133`


### Decision 4: Strict Input Validation with Whitelisting
**Description:** Server-side input validation using Joi schemas with `allowUnknown: false` to strictly whitelist accepted fields.
**Context:** The API processes user-controlled input that could be exploited for injection, mass assignment, or data pollution attacks.
**Decision Timing:** During implementation (introduced as part of API validation strategy).
**Decision Owner:** Engineering team.
**Risks Considered:** Injection attacks (SQL/NoSQL), mass assignment vulnerabilities, unexpected data persistence, data integrity compromise.
**Security Justification:**  
Strict whitelisting ensures that only explicitly defined fields are processed, reducing the risk of injection and mass assignment. This control was implemented as a defensive coding measure rather than derived from formal security requirements defined during design.
**Evidence:** `middleware/validateSchema.js:22-25`


### Decision 5: CSP with Production-Only Reporting
**Description:** Content Security Policy with security reporting in production only
**Context:** Prevent XSS while avoiding development noise
**Risk Considered:** XSS attacks, resource loading from unauthorized sources
**Security Justification:** **Implicitly implemented** - CSP provides strong XSS protection, production-only reporting reduces noise while maintaining security monitoring
**Evidence:** `utils/helmet/helmet.config.js:33-41, 109-112`

## 5. Security Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| **All authenticated endpoints require valid JWT verification** | Present and verifiable |
| **All state-changing operations are protected against CSRF** | Present and verifiable |
| **All user input is validated before processing** | Present and verifiable |
| **Rate limiting prevents abuse and DoS attacks** | Present and verifiable |
| **Sensitive data is protected at rest and in transit** | Partially present (transit: yes, rest: missing) |
| **Security events are logged and monitored** | Partially present (some logging, no monitoring requirements) |
| **Authorization follows principle of least privilege** | Present and verifiable |
| **Secure configuration management is implemented** | Partially present (env-based, no formal requirements) |
| **Threat modeling conducted for major modules** | Missing |
| **Security requirements documented before implementation** | Missing |
| **Security architecture reviewed and approved** | Missing |

## 6. Secure Design Gap Analysis

### What a Formal OWASP A04 Secure Design Process SHOULD Contain:

1. **Pre-Development Security Requirements**
   - Documented functional and non-functional security requirements
   - Risk assessment and threat modeling artifacts
   - Security acceptance criteria defined before coding
   - Security architecture reviews and sign-offs

2. **Design Phase Security Activities**
   - Threat modeling for all major components
   - Security pattern selection and justification
   - Data flow and trust boundary analysis
   - Security control specification

3. **Architecture Security Documentation**
   - Security design decisions with risk justification
   - Security control mapping to threats
   - Security requirements traceability matrix
   - Security architecture diagrams with trust boundaries

4. **Implementation Guidance**
   - Secure coding standards specific to project
   - Security control implementation requirements
   - Integration testing security requirements
   - Security verification procedures

### What Was Found in Project:

**Strengths:**
- Strong implementation of security controls
- Evidence of security awareness in code comments
- Multiple overlapping controls (defense in depth)
- Good separation of security concerns

**Critical Gaps:**

1. **Missing Pre-Development Security Documentation**
   - No evidence of security requirements defined before implementation
   - No threat modeling artifacts from design phase
   - Security decisions appear to be made during implementation rather than design

2. **Missing Formal Threat Modeling**
   - No documented threat analysis for any module
   - Security controls appear reactive rather than proactive
   - No evidence of risk-based security decision making

3. **Missing Security Architecture Documentation**
   - No security design document existing prior to this assessment
   - No documented security requirements traceability
   - No formal security architecture review evidence

4. **Missing Security Acceptance Process**
   - No documented security acceptance criteria before development
   - Security verification appears to be implementation-driven
   - No evidence of security testing requirements

### Conclusion:

The project demonstrates **strong technical security implementation** but **lacks evidence of a formal secure design process**. The security controls present suggest security awareness and good engineering practices, but they do not meet OWASP A04's requirement for "proceso formal de diseño seguro" where security is integrated from the initial design phase.

**Primary Compliance Gap:** The absence of pre-development security requirements, threat modeling, and documented security architecture decisions means the project has security **implemented** but not **designed in** from the beginning.

**Risk Level:** Medium - While the current implementation provides good security coverage, the lack of formal design process may lead to inconsistent security application in future development and missing security considerations in new features.