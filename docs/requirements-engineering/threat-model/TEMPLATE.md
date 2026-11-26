# Threat Model — Template (STRIDE)

> **Etapa:** 3. Especificación (semilla) / 5. Diseño técnico (revisión)
> **Artefacto:** Threat model (modelado de amenazas)
> **Nivel de adopción:** Condicional (Nivel 2 — Equipo maduro; Core en Nivel 3 — Enterprise regulado)
>
> **¿Qué es?** Artefacto que identifica amenazas sobre el flujo/funcionalidad, las vincula a controles y a tests, y se revisa en Diseño técnico. Usa STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) como taxonomía. Se crea en Especificación (semilla) y se refina en Diseño (controles concretos).
>
> **No confundir con:** security audit (OWASP Top 10 — revisión de código), penetration test (prueba dinámica), SAST/SCA (herramientas de CI). El threat model es un artefacto de diseño que precede al código.
>
> **Fuentes:** OWASP Cheat Sheet Series — Threat Modeling [1], Threat Modeling Manifesto [2], Adam Shostack — _Threat Modeling: Designing for Security_ (Wiley) [3], Microsoft STRIDE [4], OWASP Top 10 [5], NIST SP 800-154 [6].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `threat-model-<feature-slug>.md`.
> 2. Completa la sección 1 (alcance y diagrama) antes de escribir amenazas.
> 3. Usa STRIDE por elemento del diagrama (DFD: procesos, almacenes de datos, flujos de datos, entidades externas, límites de confianza).
> 4. Cada amenaza debe vincularse a un control y a un test (o justificar N/A).
> 5. Persiste en `/docs/threat-models/` o en el change OpenSpec (`design.md` → sección threat model).
> 6. Revisa en Etapa 5 (Diseño técnico) con controles concretos y mitigaciones específicas.
>
> ---

## 1. Alcance y diagrama de flujo de datos (DFD)

- **Feature / capacidad:** <nombre>
- **Versión:** 0.1
- **Fecha:** YYYY-MM-DD
- **Owner:** @dev / security
- **Estado:** Borrador / Revisado / Aprobado

### 1.1 Descripción del flujo

<descripción del flujo de datos de la feature: quién envía qué, a dónde, qué se almacena, qué se responde>

### 1.2 Diagrama de flujo de datos (DFD)

```
[Entidad externa] --(flujo de datos)--> [Proceso] --(flujo)--> [Almacén de datos]
```

> Usar DFD (Data Flow Diagram) con elementos: procesos (círculos), almacenes de datos (rectángulos paralelos), flujos de datos (flechas), entidades externas (rectángulos), límites de confianza (líneas discontinuas).

### 1.3 Límites de confianza (trust boundaries)

- **TB-1:** <descripción del límite — ej. cliente ↔ servidor>
- **TB-2:** <descripción del límite — ej. servidor ↔ base de datos>
- **TB-3:** <descripción del límite — ej. servidor ↔ servicio externo>

---

## 2. Análisis STRIDE por elemento

Para cada elemento del DFD, evaluar las 6 categorías STRIDE:

| Categoría STRIDE               | Pregunta guía                                          | Ejemplo de amenaza                                  |
| ------------------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| **S — Spoofing**               | ¿Puede alguien hacerse pasar por otro?                 | Suplantación del aprobador                          |
| **T — Tampering**              | ¿Pueden modificarse los datos en tránsito o en reposo? | Modificación del monto en tránsito                  |
| **R — Repudiation**            | ¿Puede alguien negar haber realizado una acción?       | Negación de haber aprobado (mitigado por audit log) |
| **I — Information Disclosure** | ¿Pueden exponerse datos a quien no debe verlos?        | Exposición de OCs ajenas                            |
| **D — Denial of Service**      | ¿Puede bloquearse el servicio?                         | Bloqueo del endpoint de aprobación                  |
| **E — Elevation of Privilege** | ¿Puede un usuario escalar sus permisos?                | Escalar de asistente a gerente                      |

### 2.0 Correspondencia elemento DFD → categoría STRIDE (best practice)

| Elemento DFD                               | Categoría STRIDE principal | Justificación                                          |
| ------------------------------------------ | -------------------------- | ------------------------------------------------------ |
| Procesos (círculos)                        | Elevation of Privilege     | Un proceso puede ejecutarse con privilegios indebidos  |
| Flujos de datos (flechas)                  | Tampering                  | Los datos en tránsito pueden modificarse               |
| Almacenes de datos (rectángulos paralelos) | Information Disclosure     | Los datos en reposo pueden exponerse                   |
| Entidades externas (rectángulos)           | Spoofing                   | Una entidad externa puede hacerse pasar por otra       |
| Límites de confianza (líneas discontinuas) | Todos (cross-boundary)     | Toda categoría aplica al cruzar un límite de confianza |

### 2.1 Amenazas por elemento

| ID    | Elemento DFD | Categoría STRIDE       | Amenaza       | Severidad       | Control / Mitigación | Test que la verifica | Estado                          |
| ----- | ------------ | ---------------------- | ------------- | --------------- | -------------------- | -------------------- | ------------------------------- |
| T-001 | <elemento>   | Spoofing               | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |
| T-002 | <elemento>   | Tampering              | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |
| T-003 | <elemento>   | Repudiation            | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |
| T-004 | <elemento>   | Information Disclosure | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |
| T-005 | <elemento>   | Denial of Service      | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |
| T-006 | <elemento>   | Elevation of Privilege | <descripción> | Alta/Media/Baja | <control>            | <test>               | Mitigado / Pendiente / Aceptado |

---

## 3. Controles y mitigaciones

### 3.1 Controles aplicados

| Control                     | Amenaza(s) mitigada(s)  | Implementación                         |
| --------------------------- | ----------------------- | -------------------------------------- |
| Autenticación Bearer (JWT)  | T-001 (Spoofing)        | `verifyToken` middleware               |
| Autorización por rol        | T-006 (Elevation)       | `checkRoleAuthOrPermisssion`           |
| Segregación de funciones    | T-006 (Elevation)       | aprobador ≠ pagador                    |
| Parametrización de queries  | T-002 (Tampering)       | Prisma ORM / `$queryRaw` parametrizado |
| Rate limiting               | T-005 (DoS)             | `express-rate-limit`                   |
| Audit log inmutable         | T-003 (Repudiation)     | RN-OC-004, append-only                 |
| Cifrado en tránsito (TLS)   | T-004 (Info Disclosure) | Helmet + HTTPS                         |
| Cifrado en reposo (AES-GCM) | T-004 (Info Disclosure) | Campos sensibles encriptados           |

### 3.2 Amenazas aceptadas (risk acceptance)

| ID    | Amenaza   | Justificación                 | Aprobado por | Fecha      |
| ----- | --------- | ----------------------------- | ------------ | ---------- |
| T-XXX | <amenaza> | <justificación de aceptación> | <nombre>     | YYYY-MM-DD |

---

## 4. Trazabilidad

| Amenaza (T-xxx) | Control              | Test que la verifica        | Change OpenSpec          | Estado   |
| --------------- | -------------------- | --------------------------- | ------------------------ | -------- |
| T-001           | JWT auth             | `tests/auth.test.ts`        | add-po-approval-endpoint | Mitigado |
| T-002           | Parametrized queries | `tests/po-approval.test.ts` | add-po-approval-rules    | Mitigado |

---

## 5. Revisión en Diseño técnico (Etapa 5)

- [ ] Controles verificados contra el diseño concreto (validación de rol, parametrización de queries, rate limiting, audit log inmutable)
- [ ] Mitigaciones específicas añadidas
- [ ] C4 diagramas revisados con los límites de confianza
- [ ] Diseño de API revisado (autorización, IDOR, inyección)
- [ ] Plan de migración BD revisado (expand/contract)
- [ ] Threat model aprobado por Tech Lead / security

---

## Exit criteria (criterio de salida de Especificación)

- [ ] DFD con límites de confianza definidos
- [ ] Todas las 6 categorías STRIDE evaluadas por elemento
- [ ] Cada amenaza vinculada a un control y a un test (o justificada como aceptada)
- [ ] Controles implementables y verificables
- [ ] Threat model revisado en Diseño técnico (Etapa 5) con controles concretos
- [ ] Trazabilidad a change OpenSpec y tests

---

## Referencias

- [1] OWASP Cheat Sheet Series — Threat Modeling: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- [2] Threat Modeling Manifesto: https://www.threatmodelingmanifesto.org/
- [3] Adam Shostack — _Threat Modeling: Designing for Security_ (Wiley, 2014)
- [4] Microsoft — STRIDE (The STRIDE Threat Model): https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
- [5] OWASP Top 10: https://owasp.org/Top10/
- [6] NIST SP 800-154 — Guide to Data-Centric System Threat Modeling: https://csrc.nist.gov/publications/detail/sp/800-154/draft
- [7] IEEE/ISO/IEC 29148:2018: https://standards.ieee.org/ieee/29148/6937/
- [8] SWEBOK v4: https://www.computer.org/education/bodies-of-knowledge/software-engineering

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
