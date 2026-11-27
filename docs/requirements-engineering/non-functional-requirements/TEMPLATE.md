# NFR — Requisitos No Funcionales (Template)

> **Etapa:** 3. Especificación
> **Artefacto:** Requisitos No Funcionales (NFR)
> **Nivel de adopción:** Condicional (Nivel 2 — Equipo maduro)
>
> **¿Qué es?** Restricciones y niveles de calidad que el sistema debe satisfacer, redactados como escenarios medibles y verificables (no adjetivos). Complementan a las reglas de negocio (RN-xxx) y a las historias (US-xxx).
>
> **No confundir con:** requisito funcional (RF-xxx — qué hace el sistema), regla de negocio (RN-xxx — ley del negocio), restricción de diseño (decisión técnica, va en ADR).
>
> **Fuentes:** ISO/IEC 25010:2023 [1], ISO/IEC/IEEE 29148:2018 [2], SWEBOK v4 [3], Bass/Clements/Kazman (SAiP 4ª ed.) [4], EARS (Mavin) [5], BABOK v3 [6], Milkeles software-doc-templates [7], markdowneditor.cc SRS ISO 29148 [8].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `NFR-<DOMINIO>-<NNN>.md` (ej. `NFR-AUTH-001.md`).
> 2. Un archivo por feature/capacidad; agrupa NFR por categoría dentro del archivo.
> 3. Completa la checklist ISO 25010 (sección 2) marcando qué cualidades aplican y por qué.
> 4. Cada NFR se redacta como escenario de 6 partes (Fuente / Estímulo / Ambiente / Artefacto / Respuesta / Medida) con número + percentil + unidad.
> 5. Asigna ID, prioridad (MoSCoW), owner, status y método de verificación.
> 6. Persiste en `/docs/requirements-engineering/nfr/`. Referencia desde el change OpenSpec (`proposal.md` → "Impact") y la RTM.
> 7. Si una cualidad no aplica, escríbelo explícitamente ("N/A — justificación"). No inventes umbrales sin fuente de entrada.
> 8. **Regla de oro:** nunca como adjetivo, siempre como escenario con un número. "Rápido" no es un NFR; "P95 < 500ms" sí.
>
> ---

## Control

| Campo                   | Valor                                      |
| ----------------------- | ------------------------------------------ |
| **ID base**             | NFR-<DOMINIO>-<NNN>                        |
| **Feature / capacidad** | <nombre>                                   |
| **Versión**             | 0.1                                        |
| **Estado**              | Borrador / Acordado / Verificado           |
| **Owner**               | @dev                                       |
| **Fecha**               | YYYY-MM-DD                                 |
| **Prioridad (MoSCoW)**  | Must Have / Should Have / Could Have       |
| **Fuentes de entrada**  | Feature Brief, entrevistas, SLA, normativa |

---

## 1. Contexto y alcance

- **Sistema bajo análisis:** <app / módulo>
- **Supuestos:** <lista>
- **Fuera de alcance:** <lista>

---

## 2. Checklist de cualidades (ISO/IEC 25010:2023)

| Característica                        | Aplica | Justificación / fuente |
| ------------------------------------- | ------ | ---------------------- |
| Idoneidad funcional                   | [ ]    |                        |
| Eficiencia de desempeño               | [ ]    |                        |
| Compatibilidad                        | [ ]    |                        |
| Capacidad de interacción (usabilidad) | [ ]    |                        |
| Fiabilidad                            | [ ]    |                        |
| Seguridad                             | [ ]    |                        |
| Mantenibilidad                        | [ ]    |                        |
| Flexibilidad (portabilidad)           | [ ]    |                        |
| Seguridad de operación (safety)       | [ ]    |                        |

> ISO 25010:2023 define 9 características de calidad de producto. Usar como checklist para no olvidar cualidades.

---

## 3. NFR por categoría

### 3.0 Plantilla de un NFR (copiar por cada requisito)

| Campo                        | Valor                                       |
| ---------------------------- | ------------------------------------------- |
| **ID**                       | NFR-<DOMINIO>-<NNN>                         |
| **Categoría**                | Performance / Seguridad / ...               |
| **Característica ISO 25010** | <característica>                            |
| **Fuente del estímulo**      | <quién/qué dispara>                         |
| **Estímulo**                 | <qué ocurre>                                |
| **Ambiente**                 | <condiciones: carga normal/pico, degradado> |
| **Artefacto**                | <componente afectado>                       |
| **Respuesta esperada**       | <qué debe hacer el sistema>                 |
| **Medida de respuesta**      | <número + percentil + unidad>               |
| **Método de verificación**   | Test / Análisis / Inspección / Demostración |
| **Prioridad**                | Must / Should / Could                       |
| **Owner**                    | @dev                                        |
| **Estado**                   | Borrador / Acordado / Verificado            |
| **Fuente**                   | <Feature Brief §X / SLA / norma>            |

**Enunciado (EARS):**

> Mientras [ambiente], cuando [estímulo] por [fuente], el sistema deberá [respuesta], medida como [medida] en el [percentil] de los casos.

### 3.1 Performance (eficiencia de desempeño)

- **NFR-PERF-001 — Latencia de API de lectura**
  - Fuente del estímulo: usuario autenticado
  - Estímulo: GET /api/<recurso>
  - Ambiente: carga pico = 200 req/s, DB en estado normal
  - Artefacto: API gateway + servicio de <recurso>
  - Respuesta esperada: respuesta JSON completa
  - Medida de respuesta: P95 < 500 ms
  - Método de verificación: Test (k6/JMeter)
  - Prioridad: Must
  - Fuente: SLA / Feature Brief §4

- **NFR-PERF-002 — Latencia de API de escritura**
  - Fuente del estímulo: usuario autenticado
  - Estímulo: POST /api/<recurso>
  - Ambiente: carga normal = 50 req/s
  - Artefacto: servicio + BD
  - Respuesta esperada: recurso creado + confirmación
  - Medida de respuesta: P95 < 1000 ms
  - Método de verificación: Test (k6/JMeter)
  - Prioridad: Should
  - Fuente: Feature Brief §4

### 3.2 Escalabilidad

- **NFR-SCAL-001 — Concurrencia**
  - Fuente del estímulo: múltiples usuarios
  - Estímulo: requests simultáneos
  - Ambiente: carga pico = 500 usuarios concurrentes
  - Artefacto: API + BD
  - Respuesta esperada: sin degradación (error rate < 0.1%)
  - Medida de respuesta: 500 usuarios concurrentes sin error 5xx
  - Método de verificación: Test (load test)
  - Prioridad: Should
  - Fuente: estimación de uso

### 3.3 Disponibilidad / Fiabilidad

- **NFR-AVAIL-001 — Uptime**
  - Fuente del estímulo: sistema
  - Estímulo: operación continua
  - Ambiente: producción
  - Artefacto: servicio completo
  - Respuesta esperada: servicio disponible
  - Medida de respuesta: ≥ 99.9% uptime mensual
  - Método de verificación: Monitoreo (Prometheus/Grafana)
  - Prioridad: Must
  - Fuente: SLA

- **NFR-REL-001 — MTTR (Mean Time To Recovery)**
  - Fuente del estímulo: incidente
  - Estímulo: fallo del servicio
  - Ambiente: producción
  - Artefacto: servicio + runbooks
  - Respuesta esperada: recuperación
  - Medida de respuesta: MTTR < 30 min
  - Método de verificación: Incident review
  - Prioridad: Should
  - Fuente: SRE practice

### 3.4 Seguridad

- **NFR-SEC-001 — Autenticación**
  - Fuente del estímulo: usuario no autenticado
  - Estímulo: acceso a endpoint protegido
  - Ambiente: producción
  - Artefacto: middleware de auth
  - Respuesta esperada: rechazo con 401
  - Medida de respuesta: 100% de requests sin token válido → 401
  - Método de verificación: Test (unit + integration)
  - Prioridad: Must
  - Fuente: OWASP, threat model

- **NFR-SEC-002 — Autorización (RBAC)**
  - Fuente del estímulo: usuario sin permiso
  - Estímulo: operación sobre recurso protegido
  - Ambiente: producción
  - Artefacto: middleware de roles/permisos
  - Respuesta esperada: rechazo con 403
  - Medida de respuesta: 100% de requests sin permiso → 403
  - Método de verificación: Test (unit + integration)
  - Prioridad: Must
  - Fuente: RBAC system, threat model

### 3.5 Privacidad

- **NFR-PRIV-001 — Minimización de datos**
  - Fuente del estímulo: sistema
  - Estímulo: almacenamiento de datos personales
  - Ambiente: producción
  - Artefacto: BD + logs
  - Respuesta esperada: solo datos necesarios, sin PII en logs
  - Medida de respuesta: 0 PII en logs de auditoría
  - Método de verificación: Inspección (log review) + Test
  - Prioridad: Must
  - Fuente: GDPR/leyes locales, PIA/DPIA

- **NFR-PRIV-002 — Retención**
  - Fuente del estímulo: sistema
  - Estímulo: datos con fecha de expiración
  - Ambiente: producción
  - Artefacto: job de limpieza + BD
  - Respuesta esperada: borrado según política de retención
  - Medida de respuesta: 100% de datos expirados borrados en < 24h
  - Método de verificación: Test (integration) + monitoreo
  - Prioridad: Should
  - Fuente: GDPR/leyes locales, política de retención

### 3.6 Accesibilidad (a11y)

- **NFR-A11Y-001 — Conformidad WCAG**
  - Fuente del estímulo: usuario con discapacidad
  - Estímulo: uso de la UI
  - Ambiente: producción
  - Artefacto: componentes UI
  - Respuesta esperada: conformidad WCAG 2.2 nivel AA
  - Medida de respuesta: 0 violaciones críticas (axe-core)
  - Método de verificación: Test (axe-core) + inspección manual
  - Prioridad: Should (Must si regulado)
  - Fuente: WCAG 2.2 [9]

### 3.7 Internacionalización (i18n)

- **NFR-I18N-001 — Soporte multi-idioma**
  - Fuente del estímulo: usuario
  - Estímulo: cambio de idioma
  - Ambiente: producción
  - Artefacto: UI + backend messages
  - Respuesta esperada: toda la UI y mensajes en idioma seleccionado
  - Medida de respuesta: 100% de strings externalizados, 0 hardcoded
  - Método de verificación: Inspección (code review) + Test
  - Prioridad: Should
  - Fuente: Feature Brief, requisitos de producto

### 3.8 Observabilidad / Auditoría

- **NFR-OBS-001 — Logging de auditoría**
  - Fuente del estímulo: acción de usuario
  - Estímulo: aprobación/rechazo de OC
  - Ambiente: producción
  - Artefacto: servicio de auditoría
  - Respuesta esperada: registro inmutable en BD
  - Medida de respuesta: 100% de acciones auditables registradas; 0 registros perdidos
  - Método de verificación: Test (integration) + monitoreo
  - Prioridad: Must
  - Fuente: RN-OC-004, requisito de auditoría

- **NFR-OBS-002 — Métricas para SLI**
  - Fuente del estímulo: sistema
  - Estímulo: operación normal
  - Ambiente: producción
  - Artefacto: servicio + Prometheus/Grafana
  - Respuesta esperada: métricas emitidas
  - Medida de respuesta: P95 latencia, error rate, throughput disponibles en dashboard
  - Método de verificación: Demostración (dashboard)
  - Prioridad: Should
  - Fuente: SLO definido en Feature Brief

### 3.9 Compatibilidad

- **NFR-COMP-001 — Navegadores soportados**
  - Fuente del estímulo: usuario
  - Estímulo: acceso a la app
  - Ambiente: producción
  - Artefacto: frontend
  - Respuesta esperada: renderizado correcto
  - Medida de respuesta: Chrome ≥ X, Firefox ≥ Y, Safari ≥ Z, Edge ≥ W
  - Método de verificación: Test (E2E cross-browser)
  - Prioridad: Should
  - Fuente: requisitos de producto

### 3.10 Mantenibilidad

- **NFR-MAINT-001 — Cobertura de tests**
  - Fuente del estímulo: CI
  - Estímulo: PR merge
  - Ambiente: CI/CD
  - Artefacto: pipeline
  - Respuesta esperada: cobertura ≥ umbral
  - Medida de respuesta: ≥ 80% cobertura en capa de servicio
  - Método de verificación: Test (CI gate)
  - Prioridad: Should
  - Fuente: estándar del equipo

### 3.11 Capacidad / Almacenamiento

- **NFR-CAP-001 — Retención de datos**
  - Fuente del estímulo: sistema
  - Estímulo: datos con fecha de expiración
  - Ambiente: producción
  - Artefacto: BD + job de limpieza
  - Respuesta esperada: borrado según política
  - Medida de respuesta: 100% de datos expirados borrados en < 24h
  - Método de verificación: Test (integration) + monitoreo
  - Prioridad: Should
  - Fuente: GDPR/leyes locales, política de retención

### 3.12 Costo (FinOps)

- **NFR-COST-001 — Costo de infraestructura**
  - Fuente del estímulo: sistema
  - Estímulo: operación normal
  - Ambiente: producción
  - Artefacto: infraestructura
  - Respuesta esperada: dentro del presupuesto
  - Medida de respuesta: costo mensual ≤ $X
  - Método de verificación: Análisis (dashboard de costos)
  - Prioridad: Could
  - Fuente: presupuesto del proyecto

---

## 4. Trazabilidad

| NFR ID       | Feature Brief § | RN-xxx    | US-xxx    | Change OpenSpec          | Test                  |
| ------------ | --------------- | --------- | --------- | ------------------------ | --------------------- |
| NFR-PERF-001 | §4 Métricas     | RN-OC-001 | US-OC-007 | add-po-approval-rules    | tests/perf/approve.js |
| NFR-SEC-001  | §3 NFR          | RN-OC-004 | US-OC-007 | add-po-approval-endpoint | tests/auth.test.ts    |

---

## 5. Exit criteria (criterio de salida de Especificación)

- [ ] Checklist ISO 25010 completado (qué aplica y qué no, con justificación)
- [ ] Cada NFR redactado como escenario de 6 partes con medida numérica (percentil)
- [ ] Cada NFR tiene método de verificación explícito (Test/Análisis/Inspección/Demostración)
- [ ] Cada NFR tiene ID, prioridad, owner, status y fuente
- [ ] NFR vinculados a Feature Brief, RN-xxx, US-xxx y change OpenSpec
- [ ] No hay adjetivos sin número ("rápido" → "P95 < 500ms")
- [ ] NFR validados con stakeholders (si afectan UX o SLA)
- [ ] NFR revisados en Design (Etapa 5) para verificar factibilidad

---

## 6. Referencias

- [1] ISO/IEC 25010:2023 — Systems and Software Quality Models: https://www.iso.org/standard/78176.html
- [2] ISO/IEC/IEEE 29148:2018 — Requirements engineering: https://www.iso.org/standard/72089.html
- [3] SWEBOK v4 — IEEE Computer Society: https://www.computer.org/education/bodies-of-knowledge/software-engineering
- [4] Bass, Clements, Kazman — _Software Architecture in Practice_ (4ª ed.), Addison-Wesley (escenario de 6 partes)
- [5] Mavin, Alistair — EARS (Easy Approach to Requirements Syntax): https://alistairmavin.com/ears/
- [6] BABOK Guide v3 (§10.30 NFR Analysis): https://www.business-analysis-excellence.com/wp-content/uploads/2019/08/BABOK_Guide_v3-1.pdf
- [7] Milkeles — software-doc-templates (NFR): https://github.com/Milkeles/software-doc-templates/blob/main/general-swe/requirements/non-functional-requirements.md
- [8] markdowneditor.cc — SRS ISO 29148 (sección 3.8 atributos de calidad): https://markdowneditor.cc/en/templates/requirements/srs-iso-29148
- [9] Business Analyst's Toolkit — NFR Template: https://businessanalyststoolkit.com/non-functional-requirements-template

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
