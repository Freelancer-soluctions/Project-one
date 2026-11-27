# RTM — Requirements Traceability Matrix (Template)

> **Etapa:** 3. Especificación
> **Artefacto:** Matriz de trazabilidad de requisitos (RTM)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Tabla que vincula cada requisito con su origen (stakeholder need, estándar, documento superior), sus artefactos de diseño/implementación y sus casos de prueba/verificación, en ambas direcciones (forward/backward). IEEE 830/29148 la define como una de las características de una buena especificación ("traceable"), y NASA SWE-072 exige trazabilidad bidireccional requisito↔procedimiento de prueba.
>
> **No confundir con:** backlog (lista de tareas), catálogo de artefactos (inventario de documentos), change log (registro de cambios). La RTM vincula requisitos con código y pruebas.
>
> **Fuentes:** IEEE Std 830-1998 [1], IEEE/ISO/IEC 29148-2018 [2], Jama Software (8 pasos) [3], Atlassian (RTM template) [4], HHS EPLC (Requirements Traceability Practices Guide) [5], NASA SWE-072 [6], PTC Windchill (Allocate/Satisfy/Implement) [7], Traceable Docs (RTM template) [8], PTC (What is requirements traceability) [9].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `RTM-<proyecto>-v<X.Y>.md` (ej. `RTM-OC-aprobacion-v1.0.md`).
> 2. Un archivo por change/proyecto. Para releases mayores, consolidar en `RELEASE-<version>.md`.
> 3. IDs únicos y estables (no cambian con revisiones). Prefijo por nivel: `REQ-xxx` (requisito), `TC-xxx` (test), `ADR-xxx` (decisión).
> 4. Una fila por requisito; nunca fusionar dos requisitos en una fila.
> 5. Actualizar en el **mismo PR** que el código. Si el código cambia sin actualizar la RTM, el review debe bloquear.
> 6. Persiste en `/docs/traceability/`. Referénciala desde el change OpenSpec y el Feature Brief.
>
> ---

## Leyenda

- **Tipo:** F (funcional) | NF (no funcional) | C (restricción) | R (regulatorio)
- **Estado:** Open | In Progress | Verified | Waived (quién/cuándo)
- **Resultado:** Pass | Fail | Not Run | Blocked | N/A
- **Método de verificación:** Test / Inspección / Análisis / Demostración

> **Regla:** un blank no es un pass. Resultado vacío ≠ verificado. Todo item de diseño/test debe apuntar a un Req ID; lo que no apunta es scope no solicitado (backward trace).

---

## Matriz de trazabilidad

| Req ID  | Descripción | Fuente (doc §pág) | Tipo | Prio   | Diseño ref   | Implementación     | Test ID | Método | Resultado | Estado | Owner | Notas |
| ------- | ----------- | ----------------- | ---- | ------ | ------------ | ------------------ | ------- | ------ | --------- | ------ | ----- | ----- |
| REQ-001 | <requisito> | <doc §sección>    | F    | Must   | <diseño ref> | <archivo/servicio> | TC-001  | Test   | Not Run   | Open   | @dev  | —     |
| REQ-002 | <requisito> | <doc §sección>    | NF   | Should | <diseño ref> | <archivo/servicio> | TC-002  | Test   | Not Run   | Open   | @dev  | —     |

### Ejemplo (feature de aprobación de OC)

| Req ID       | Descripción                                                      | Fuente           | Tipo | Prio   | Diseño ref           | Implementación          | Test ID    | Método | Resultado | Estado   | Owner | Notas |
| ------------ | ---------------------------------------------------------------- | ---------------- | ---- | ------ | -------------------- | ----------------------- | ---------- | ------ | --------- | -------- | ----- | ----- |
| RN-OC-001    | Umbral de aprobación autónoma (≤ $500K, proveedor con historial) | Feature Brief §3 | F    | Must   | ADR-012, design.md   | services/po-approval.ts | TC-OC-01   | Test   | Pass      | Verified | @dev  | —     |
| RN-OC-002    | Proveedor nuevo → aprobación gerencial                           | Feature Brief §3 | F    | Must   | ADR-012, design.md   | services/po-approval.ts | TC-OC-02   | Test   | Pass      | Verified | @dev  | —     |
| NFR-SEC-001  | Autorización por rol en endpoint /approve                        | NFR §3.4         | NF   | Must   | design.md §seguridad | middleware/auth.ts      | TC-AUTH-01 | Test   | Pass      | Verified | @dev  | —     |
| NFR-PERF-001 | Latencia P95 < 500ms en /approve                                 | NFR §3.1         | NF   | Should | design.md §perf      | api/gateway             | TC-PERF-01 | Test   | Not Run   | Open     | @dev  | —     |

---

## Relaciones de trazabilidad (traceability criteria)

| Relación     | Descripción                                            | Ejemplo                             |
| ------------ | ------------------------------------------------------ | ----------------------------------- |
| Need → Req   | Todo requisito deriva de una necesidad del stakeholder | RN-OC-001 ← Feature Brief §3        |
| Req → Req    | Descomposición (requisito padre → hijos)               | US-OC-007 → Escenario 1..4          |
| Req → Diseño | Todo requisito tiene un artefacto de diseño            | RN-OC-001 → ADR-012                 |
| Req → Código | Todo requisito tiene implementación                    | RN-OC-001 → services/po-approval.ts |
| Req → Test   | Todo requisito tiene prueba                            | RN-OC-001 → TC-OC-01                |
| Req → Riesgo | Control de riesgo vinculado                            | RN-OC-002 → RISK-003                |

> **Backward trace:** todo item de diseño/test debe apuntar a un Req ID. Lo que no apunta es scope no solicitado.

---

## Cobertura (auto-chequeo)

- Requisitos sin test: \_\_\_
- Tests sin requisito: \_\_\_
- Requisitos en Fail/Blocked: \_\_\_
- Links sospechosos (requieren re-evaluación tras cambio): \_\_\_

---

## Historial de cambios

| Fecha      | Req ID  | Cambio                   | Impacto                           | Aprobado por |
| ---------- | ------- | ------------------------ | --------------------------------- | ------------ |
| YYYY-MM-DD | REQ-xxx | <descripción del cambio> | <impacto en alcance/costo/tiempo> | <nombre>     |

---

## Exit criteria (criterio de salida de Especificación)

- [ ] Cada requisito tiene ID único y estable
- [ ] Cada requisito tiene fuente (doc §sección) trazable
- [ ] Cada requisito tiene tipo (F/NF/C/R) y prioridad
- [ ] Cada requisito tiene diseño ref, implementación y test ID
- [ ] Cada requisito tiene método de verificación y resultado
- [ ] Cobertura auto-chequeo completada (0 requisitos sin test, 0 tests sin requisito)
- [ ] RTM actualizada en el mismo PR que el código
- [ ] Historial de cambios actualizado

---

## Referencias

- [1] IEEE Std 830-1998 — IEEE Recommended Practice for Software Requirements Specifications (trazabilidad backward/forward, §4.3.8): https://www.cse.msu.edu/~chengb/RE-491/Papers/IEEE-SRS-practice.pdf
- [2] IEEE/ISO/IEC 29148-2018 — Systems and software engineering — Life cycle processes — Requirements engineering: https://standards.ieee.org/ieee/29148/6937/
- [3] Jama Software — How to Create and Use a Requirements Traceability Matrix (RTM): https://www.jamasoftware.com/requirements-management-guide/requirements-traceability/how-to-create-and-use-a-requirements-traceability-matrix-rtm/
- [4] Atlassian — Requirements Traceability Matrix Template: https://www.atlassian.com/software/jira/templates/requirements-traceability-matrix
- [5] HHS EPLC — Requirements Traceability Practices Guide: https://www.hhs.gov/sites/default/files/ocio/eplc/EPLC%20Archive%20Documents/24%20-%20Requirements%20Traceability%20Matrix/eplc_requirements_traceability_practices_guide.pdf
- [6] NASA SWE-072 — Bidirectional Traceability Between Software Test Procedures and Software Requirements: https://swehb.nasa.gov/spaces/7150/pages/16449898/SWE-072+-+Bidirectional+Traceability+Between+Software+Test+Procedures+and+Software+Requirements
- [7] PTC Windchill — Working with Trace Links (Allocate/Satisfy/Implement): https://support.ptc.com/help/windchill/r2027.0.0.0/en/Windchill_Help_Center/reqmgmt/RMTraceabilityAbout.html
- [8] Traceable Docs — Requirements Traceability Matrix Template: https://traceabledocs.com/templates/requirements-traceability-matrix
- [9] PTC — What is requirements traceability: https://www.ptc.com/en/blogs/alm/requirements-traceability

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
