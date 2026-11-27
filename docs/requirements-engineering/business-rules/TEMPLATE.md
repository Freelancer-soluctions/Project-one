# Regla de Negocio — Template (RN-<DOMINIO>-<NNN>)

> **Etapa:** 3. Especificación
> **Artefacto:** Reglas de negocio (RN-xxx)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Una directiva específica, practicable y verificable, bajo control del negocio, que sirve como criterio para guidar el comportamiento, formar juicios o tomar decisiones (BABOK v3, glosario). Existe antes del proyecto y sobrevive a cambios de sistema. La regla es el "qué del negocio"; el requisito es el "cómo la enforcea el sistema".
>
> **No confundir con:** requisito funcional (RF-xxx — cómo el sistema implementa la regla), historia de usuario (US-xxx — valor para el usuario), lógica de UI/API (cómo se presenta al usuario). La regla es la ley del negocio; el requisito es la implementación.
>
> **Fuentes:** Eclipse SW360 BR Template [1], IIBA BABOK Glossary [2], NashTech Business Rules Analysis [3], IREB CPRE Foundation Handbook [4], IREB CPRE Requirements Management Handbook [5], jam01 SRS Template (IEEE 830/29148) [6], BABOK Guide v3 [7].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia este template y renómbralo: `RN-<DOMINIO>-<NNN>.md` (ej. `RN-AUTH-001.md` o `RN-OC-001.md`).
> 2. Un archivo por regla (atomicidad). Agrupa por dominio en subcarpetas si es necesario: `business-rules/<dominio>/RN-XXX.md`.
> 3. El ID sigue el esquema `RN-<DOMINIO>-<NNN>` (dominio = módulo o área de negocio, NNN = secuencial).
> 4. Completa todas las secciones. Si una no aplica, escríbelo explícitamente ("N/A — justificación").
> 5. Redacta en presente, voz activa, sin ambigüedad (BABOK: específica, practicable, verificable).
> 6. Persiste en `/docs/business-rules/` o `/docs/rules/`. Referénciala desde el change OpenSpec (`proposal.md` → "Stakeholders / validación") y desde la RTM.
>
> ---
>
> ## Frontmatter (YAML)

```yaml
---
id: RN-<DOMINIO>-<NNN>
title: '<Título corto de la regla>'
domain: '<Módulo o área de negocio>'
rule_type: 'Estructural | Comportamental'
status: 'Borrador | Aprobada | Deprecada'
owner: '<responsable>'
created: YYYY-MM-DD
last_verified: YYYY-MM-DD
governing_policy: '<política, norma o regulación fuente>'
related_requirements: ['RF-xxx', 'RNF-xxx']
related_stories: ['US-xxx']
---
```

---

## 1. Enunciado formal

### 1.1 Regla (RuleSpeak® / EARS)

- **Mientras** [precondición/estado inicial, ej. entidad en estado X],
- **si** [condición o disparador, ej. propiedad de configuración Y habilitada],
- **entonces** el sistema debe [permitir/denegar/ejecutar comportamiento específico].
- **En caso contrario**, el sistema debe [comportamiento por defecto / fallback].

### 1.2 Propósito y riesgo mitigado

[Por qué existe esta regla, qué riesgo de negocio u operativo previene, racional de dominio.]

---

## 2. Vocabulario de dominio (SBVR)

| Término     | Definición en el dominio | Atributo / campo fuente |
| ----------- | ------------------------ | ----------------------- |
| [Término 1] | [Definición]             | `entidad.campo`         |
| [Término 2] | [Definición]             | `entidad.campo`         |

---

## 3. Especificación detallada

### 3.1 Disparadores y precondiciones

- **Disparador:** [qué evento activa la regla]
- **Precondiciones:** [estados requeridos]
- **Configuración / feature flag:** `[clave.propiedad]` (por defecto: `true | false`)

### 3.2 Actores y matriz de permisos

| Actor / Rol | Condiciones cumplidas | Acción permitida     | Efecto secundario / fallback |
| ----------- | --------------------- | -------------------- | ---------------------------- |
| [Rol A]     | [Condición]           | [Operaciones/campos] | [HTTP status / evento]       |
| [Rol B]     | [Condición]           | [Operaciones/campos] | [HTTP status / evento]       |

### 3.3 Efectos secundarios e invariantes del sistema

[Jobs automáticos, cascadas, sincronizaciones, actualizaciones de datos disparadas.]

### 3.4 Excepciones

[Casos en los que la regla no aplica o se suspende; proceso de excepción aprobada.]

---

## 4. Escenarios ejecutables (Specification by Example / Gherkin)

```gherkin
Feature: <nombre de la capacidad afectada>

  Scenario: <caso positivo>
    Given [contexto inicial]
    And [contexto adicional o configuración]
    When [actor realiza acción]
    Then [resultado esperado exitoso]
    And [cambios de estado o efectos secundarios]

  Scenario: <caso negativo / límite>
    Given [contexto inicial]
    When [actor realiza acción no autorizada o inválida]
    Then [código de error / excepción esperada]
    And [ausencia de efectos secundarios no deseados]
```

---

## 5. Trazabilidad e implementación

- **Backend (enforcement):** `apps/server/src/...` (servicio/clase/método)
- **Frontend (UI):** `apps/client/src/...` (componente/página)
- **Endpoint API:** `METHOD /path`
- **Tests:** [nombre de la suite de tests unitarios/integración]
- **Requisitos vinculados:** RF-xxx, RNF-xxx
- **Historias vinculadas:** US-xxx
- **Change OpenSpec:** `openspec/changes/<name>/` (si aplica)

---

## 6. Historial de revisiones

| Versión | Fecha      | Autor   | Descripción                     |
| ------- | ---------- | ------- | ------------------------------- |
| 1.0     | YYYY-MM-DD | [Autor] | Especificación inicial aprobada |

---

## 7. Notas y supuestos

[Supuestos, dependencias, decisiones abiertas.]

---

## Clasificación de la regla (BABOK)

| Tipo                           | Definición                                                                            | Ejemplo                                            |
| ------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Estructural (definicional)** | Indica que algo es necesariamente verdadero; criterio definicional de conceptos/datos | "Una OC debe tener exactamente un proveedor"       |
| **Comportamental (operativa)** | Obligación o prohibición sobre conducta/acción/procedimiento                          | "Los aprobadores no pueden aprobar sus propias OC" |

---

## Exit criteria (criterio de salida de Especificación)

- [ ] Regla redactada en presente, voz activa, sin ambigüedad (BABOK: específica, practicable, verificable)
- [ ] Un archivo por regla (atomicidad)
- [ ] ID scheme `RN-<DOMINIO>-<NNN>` asignado
- [ ] Vocabulario de dominio (SBVR) definido con atributo/campo fuente
- [ ] Escenarios Gherkin ejecutables (caso positivo + caso negativo/límite)
- [ ] Trazabilidad a requisitos (RF-xxx), historias (US-xxx), código y tests
- [ ] Estado asignado (Borrador / Aprobada / Deprecada)
- [ ] Owner y fecha de última verificación registrados

---

## Referencias

- [1] Eclipse SW360 — Business Rule Specification Template (SBVR/SBE, ISO/IEC/IEEE 29148): https://eclipse.dev/sw360/docs/businessrules/br-template
- [2] IIBA — BABOK Guide Glossary (definición de business rule, behavioural/definitional): https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/babok/glossary
- [3] NashTech — Business Rules Analysis: Practical Guide for Business Analysts (BABOK v3): https://blog.nashtechglobal.com/business-rules-analysis-practical-guide-for-business-analysts
- [4] IREB — CPRE Foundation Level Handbook (templates, IEEE 29148 phrase templates): https://cockpit-v1.ireb.org/media/pages/downloads/cpre-foundation-level-handbook/0528b23807-1784882677/cpre_foundationlevel_handbook_en_v1.3.2.pdf
- [5] IREB — CPRE Requirements Management Handbook (business rules en modelo de información de requisitos): https://cockpit-v1.ireb.org/media/pages/downloads/cpre-requirements-management-handbook/72c364dea0-1733311674/ireb-cpre-handbook-for-requirements-management-en-v2.1.pdf
- [6] jam01/SRS-Template (markdown SRS basado en IEEE 830 / ISO/IEC/IEEE 29148): https://github.com/jam01/SRS-Template
- [7] IIBA — BABOK Guide v3 (Business Rules Analysis): https://www.iiba.org/business-analysis-body-of-knowledge-babok/
- [8] IEEE/ISO/IEC 29148-2018: https://standards.ieee.org/ieee/29148/6937/

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
