# Guía de entrevista de elicitación — Template

> **Etapa:** 2. Elicitación
> **Artefacto:** Guía de entrevista / notas de elicitación
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** El segundo artefacto del flujo de ingeniería de requisitos (después del Feature Brief / Discovery). Planifica, conduce y procesa una entrevista con un stakeholder para **descubrir** (no confirmar) requisitos, necesidades, problemas y contextos de uso, y convertir las notas crudas en hallazgos sintetizados y requisitos derivados.
>
> **Diferencia con Feature Brief:** el brief captura el problema y el impacto a nivel de negocio; la guía de entrevista descubre los requisitos detallados, casos borde y conflictos a nivel de rol/usuario. El brief precede a la entrevista; la entrevista precede a la especificación.
>
> **Fuentes:** IREB CPRE Elicitation Handbook [1][2], BABOK v3 §10.25 [3], Atlassian Requirements Gathering Guide [5], Kvale 2008 (entrevistador ideal) [1], Leffingwell & Widrig [6], IREB CPRE (conflict resolution) [7][8], ModernAnalyst (BABOK Elicitation, v2.0) [4], IREB CPRE (techniques taxonomy) [9].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia este template y renómbralo: `interview-<rol>-<slug>.md` (ej. `interview-jefa-compras-oc-aprobacion.md`).
> 2. Completa las secciones A-D **antes** de la entrevista (preparación).
> 3. Durante la entrevista, usa la sección E (preguntas) como guía y toma notas en la sección F.
> 4. Inmediatamente después (mismo día), completa las secciones G-K (síntesis, derivados, conflictos, follow-ups, cierre).
> 5. Envía las notas al entrevistado para confirmación (sección K).
> 6. Persiste en `/docs/interviews/` o `/docs/research/`. Referéncialo desde el Feature Brief y desde el change OpenSpec.

---

## A. Metadatos y contexto de la entrevista

| Campo                                | Valor                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| **ID**                               | INT-XXX                                                     |
| **Fecha/hora**                       | YYYY-MM-DD HH:MM (TZ)                                       |
| **Canal**                            | Presencial / videollamada / asíncrono                       |
| **Duración planificada**             | 60 min (+15 min buffer)                                     |
| **Proyecto / feature de referencia** | [link al Feature Brief]                                     |
| **Entrevistador**                    | [nombre / rol]                                              |
| **Entrevistado**                     | [nombre] — [rol] — nivel: estratégico / táctico / operativo |
| **Note-taker**                       | [nombre / rol]                                              |
| **Observadores**                     | [lista]                                                     |
| **Autoridad de decisión**            | [quién tiene la palabra final]                              |
| **Grabación**                        | Sí / No — Consentimiento: Sí / No                           |
| **Guía enviada al entrevistado**     | YYYY-MM-DD (1 semana antes)                                 |

---

## B. Objetivo de elicitación y calidad de resultado esperada

- **Objetivo:** [una frase accionable — ej. "descubrir las necesidades del rol operativo en el flujo de aprobación de OC"]
- **Tipo de datos:** Cualitativos / Cuantitativos / Mixtos
- **Calidad esperada:** [ej. "top-3 necesidades del rol operativo con evidencia"]
- **Fuera de alcance:** [lista de temas que NO se cubrirán]

---

## C. Participantes y roles

| Rol           | Nombre   | Responsabilidad en la sesión                          |
| ------------- | -------- | ----------------------------------------------------- |
| Entrevistador | [nombre] | Conduce, pregunta, escucha, hace play-back            |
| Entrevistado  | [nombre] | Responde, comparte experiencia y contexto             |
| Note-taker    | [nombre] | Toma notas, registra citas textuales, gestiona tiempo |
| Observadores  | [lista]  | Observan sin intervenir                               |

> **Regla (IREB):** evita que el entrevistador sea también note-taker (cambio de modo cognitivo). El note-taker debe conocer el objetivo de elicitación y la guía antes de la sesión.

---

## D. Preparación (background reading)

- **Documentos revisados:** [lista con links — manuales, normativas, contratos, reportes]
- **Perfil del entrevistado:** [breve descripción del rol, experiencia, contexto]
- **Glosario de términos del dominio:** [término → definición]
- **Hipótesis a contrastar (no confirmar):** [lista de supuestos que se validan, no se buscan]

---

## E. Preguntas por rol (guía de entrevista)

> **Reglas (BABOK/IREB):** preguntas abiertas (no leading, no yes/no). Context-free primero (quién es el usuario, quién es el cliente, ¿difieren sus necesidades?). General → específico. Una pregunta a la vez. Dejar silencios. Hacer play-back (repetir lo escuchado para confirmar). Nunca solo managers — cubrir los 3 niveles.

### E.1 Apertura (5 min)

- Presentación, proyecto, propósito de la entrevista.
- Agenda y cómo se tomarán notas.
- Acuerdo de confidencialidad y grabación (si aplica).
- Pregunta de calentamiento: "¿Podría describir brevemente su rol y un día típico?"

### E.2 Context-free (10 min)

- ¿Quién es el usuario final de este proceso?
- ¿Quién es el cliente (quien paga/solicita)?
- ¿Difieren sus necesidades? ¿Cómo?
- ¿Qué resultado de negocio se busca con esta feature?

### E.3 Nivel estratégico (si aplica) (10 min)

- ¿Cuáles son los objetivos de negocio que esta feature debe apoyar?
- ¿Qué métricas de éxito esperan?
- ¿Qué restricciones (presupuesto, fecha, tecnología, regulatorias) aplican?
- ¿Quién es el sponsor y cuál es su expectativa?

### E.4 Nivel táctico (10 min)

- ¿Qué procesos actuales deben mantenerse?
- ¿Qué controles, medidas o reportes se requieren?
- ¿Qué personas o roles están involucrados?
- ¿Qué dependencias existen con otros sistemas/módulos?

### E.5 Nivel operativo (20 min)

- Describa el proceso actual paso a paso: ¿quién hace qué y cuánto tarda?
- ¿Qué información necesita ver antes de decidir?
- ¿Hay casos especiales o excepciones? ¿Cuáles?
- ¿Qué pasa si la persona que debe actuar no está disponible?
- ¿Con qué frecuencia se rechazan/cancelan? ¿Por qué?
- ¿Qué workaround usan hoy?
- ¿Qué teme que salga mal si se automatiza/delega?

### E.6 Preguntas adicionales modernas (según contexto)

- **Privacidad y datos personales:** ¿qué datos de proveedores/empleados se manejan? ¿Hay consentimiento, minimización, retención? (GDPR/leyes locales) [3].
- **Accesibilidad:** ¿hay usuarios con discapacidad visual/motriz/cognitiva? ¿Se requiere conformidad WCAG 2.2 AA [12]?
- **Internacionalización:** ¿el sistema se usará en otros países/idiomas/monedas/zonas horarias? [3].
- **Gobernanza de datos:** ¿cuánto tiempo se retienen los registros? ¿Quién es el dueño del dato? ¿Hay auditoría externa (DIAN, SOX)? [1].
- **Seguridad:** ¿qué roles/permisos existen? ¿Hay segregación de funciones (quien aprueba no puede pagar)? [11].

### E.7 Preguntas de seguimiento (probes) previstas

- "¿Podría darme un ejemplo concreto?"
- "¿Qué pasaría si...?"
- "¿Cómo lo manejan hoy?"
- "¿Hay algún caso en el que esto no aplique?"

### E.8 Cierre (5 min)

- "Si pudiera hacer una sola cosa diferente en este proceso, ¿qué sería?"
- "¿A quién más debería hablar?" (snowball sampling)
- Resumen de lo escuchado (play-back) y confirmación.
- Agradecimiento y próximos pasos.

---

## F. Notas crudas (durante la entrevista)

> Tomar notas durante o inmediatamente después. Separar explícitamente "lo que dijo" de "lo que inferimos".

### Citas textuales (verbatim)

- "<cita textual>" — [rol/usuario]
- "<cita textual>" — [rol/usuario]

### Observaciones no verbales

- <gestos, expresiones, dudas, confusión, cansancio>

### Diagramas / mind maps

- <términos y relaciones capturados durante la entrevista>

### Tiempos y eventos

- <duración real, interrupciones, cambios de tema>

### Marcadores "Open"

- [Open] <lo que no se pudo responder en la sesión>

---

## G. Hallazgos sintetizados (post-entrevista, mismo día)

> Completar el mismo día. Separar evidencia (cita) de interpretación (hallazgo).

### Top-3 necesidades/problemas

1. <necesidad/problema> — evidencia: "<cita>" — fuerza: alta/media/baja
2. <necesidad/problema> — evidencia: "<cita>" — fuerza: alta/media/baja
3. <necesidad/problema> — evidencia: "<cita>" — fuerza: alta/media/baja

### Affinity diagram (clusters)

- **Cluster 1: <etiqueta>**
  - Insight: <...>
  - Evidencia: "<cita>"
- **Cluster 2: <etiqueta>**
  - Insight: <...>
  - Evidencia: "<cita>"

### Vistas divergentes (preservar, no forzar consenso)

- <rol A> dice X; <rol B> dice Y → <análisis>

### Jobs-to-be-Done (lente complementaria)

- Job: <el usuario quiere...> → Outcome deseado: <...>

---

## H. Requisitos derivados

| ID          | Requisito     | Tipo (Funcional / NFR) | Fuente (cita/hallazgo)  | Prioridad (MoSCoW) | Kano      | Estado        |
| ----------- | ------------- | ---------------------- | ----------------------- | ------------------ | --------- | ------------- |
| RN-XXX-001  | <descripción> | Funcional              | Hallazgo #1, cita "..." | Must Have          | Básico    | Derivado      |
| NFR-XXX-001 | <descripción> | NFR                    | Hallazgo #2             | Should Have        | Desempeño | Por confirmar |

> **Regla:** cada requisito derivado tiene fuente trazable. No se prescribe solución antes de entender el problema. No se confirma requisito sin evidencia.

---

## I. Conflictos identificados y resolución

| #   | Conflicto     | Tipo (materia/datos/intereses/valores/relación/estructura) | Partes involucradas | Análisis   | Técnica de resolución                                                                              | Decisión   | Fecha      | Responsable | Estado               |
| --- | ------------- | ---------------------------------------------------------- | ------------------- | ---------- | -------------------------------------------------------------------------------------------------- | ---------- | ---------- | ----------- | -------------------- |
| 1   | <descripción> | <tipo>                                                     | <partes>            | <análisis> | Acuerdo / Compromiso / Votación / Imposición / Variantes / Consider-all-facts / Matriz de decisión | <decisión> | YYYY-MM-DD | <nombre>    | Resuelto / Pendiente |

### Conflictos no resueltos → follow-up

- <conflicto pendiente> — owner: <nombre> — fecha límite: YYYY-MM-DD

---

## J. Preguntas abiertas y follow-ups

| #   | Pregunta abierta | Owner    | Fecha límite | Estado         |
| --- | ---------------- | -------- | ------------ | -------------- |
| 1   | <pregunta>       | <nombre> | YYYY-MM-DD   | Open / Cerrada |

### Acciones de follow-up

- [ ] <acción> — owner: <nombre> — fecha: YYYY-MM-DD

### Snowball sampling (¿a quién más hablar?)

- <nombre/rol> — razón: <por qué es relevante>

---

## K. Confirmación y cierre

- **Notas enviadas al entrevistado:** YYYY-MM-DD
- **Respuesta del entrevistado:** <confirmación / discrepancias registradas>
- **Agradecimiento:** Enviado (Sí/No)
- **Próximos pasos:** <lista>
- **Fecha de cierre:** YYYY-MM-DD
- **Estado:** Abierta / Cerrada

---

## Exit criteria (criterio de salida de Elicitación)

- [ ] Notas tomadas durante o inmediatamente después de la entrevista
- [ ] Síntesis (top-3 necesidades + affinity diagram) completada el mismo día
- [ ] Evidencia (citas) vinculada a cada hallazgo
- [ ] Fuerza de evidencia justificada (alta/media/baja)
- [ ] Vistas divergentes preservadas (no consenso forzado)
- [ ] Requisitos derivados con fuente trazable
- [ ] Conflictos identificados con estado (resuelto/pendiente) y owner
- [ ] Follow-ups con owner y fecha
- [ ] Notas enviadas al entrevistado para confirmación
- [ ] Preguntas abiertas marcadas como "Open"
- [ ] Entrevista marcada como "Cerrada"

---

## Referencias

- [1] IREB CPRE Elicitation Handbook (v2.2.0) — roles, preparación, preguntas, documentación: https://gasq.org/files/content/gasq/downloads/certification/IREB/IREB%20AL/advanced_level_elicitation_handbook_en_v2.2.0.pdf
- [2] IREB CPRE Foundation Level Syllabus: https://cpre.ireb.org/en
- [3] BABOK v3 — Elicitation & Collaboration (4.2 Conduct Elicitation, 10.25 Interview): https://www.iiba.org/business-analysis-body-of-knowledge-babok/
- [4] ModernAnalyst — "Describe the Elicitation knowledge area of the BABOK and its key tasks (BABOK v2.0)": https://www.modernanalyst.com/Careers/InterviewQuestions/tabid/128/ID/1256/Describe-the-Elicitation-knowledge-area-of-the-BABOK-and-its-key-tasks-BABOK-v20.aspx
- [5] Atlassian — "Requirements Gathering: The Ultimate Guide": https://www.atlassian.com/agile/product-management/requirements-gathering
- [6] Leffingwell & Widrig — _Managing Software Requirements: A Use Case Approach_ (context-free questions, top-3 needs)
- [7] IREB CPRE — Conflict resolution (types, tasks, techniques): https://cpre.ireb.org/en
- [8] IREB CPRE — Techniques taxonomy (questioning, observation, collaboration, artifact-based): https://cpre.ireb.org/en
- [9] BABOK v3 — Elicitation techniques (interviews, workshops, observation, document analysis, prototyping, JTBD): https://www.iiba.org/business-analysis-body-of-knowledge-babok/
- [10] Atlassian — Product Requirements Document template: https://atlassian.com/software/confluence/templates/product-requirements-document
- [11] OWASP Cheat Sheet Series — Threat Modeling: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- [12] Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
