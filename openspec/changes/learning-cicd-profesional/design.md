## Context

El proyecto tiene un ecosistema CI/CD maduro con **15 archivos de workflow** en `.github/workflows/` (94 definiciones de job; `ci.yml` concentra 57, de las que 16 llevan `if: false`), una composite action (setup-monorepo), Dependabot configurado en `.github/dependabot.yml`, y documentación técnica extensa (`docs/ci-cd-pipeline-empresarial.md` con los 14 stages, §25 supply chain y §26 DORA, `docs/CONTEXT-CICD.md` con el inventario de workflows §3.4/§5.9 y los pins §13.5, `docs/learning/ci-cd/workflows-mantenimiento-guia.md` con el playbook de mantenimiento). `quality.yml` y `ci-enterprise.yml` **ya no existen**: el primero se consolidó inline en `ci.yml` (2026-08-28), el segundo se retiró del repo. Esta documentación es de referencia técnica y asume conocimientos; los niveles Fundamentos (00-04), Intermedio (05-10) y Avanzado (11-17) de la ruta didáctica ya están diseñados en cambios OpenSpec previos (`learning-cicd-fundamentos`, `learning-cicd-intermedio`, `learning-cicd-avanzado`). Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**

- Crear el nivel Profesional (6 guías 18-23 + `profesional-README.md`) que complete la ruta de 4 niveles, llevando al lector de "operar el CI" a "diseñar, asegurar, medir y mantener el pipeline como activo de producción" (nivel Staff).
- Enseñar la familia SAST/SCA/SBOM/Secrets/Dependency Review desde cero usando `.github/workflows/security.yml` como caso real de 5 jobs.
- Enseñar el modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador, usando `scheduled-security.yml` y `security-digest.yml`.
- Enseñar DORA, SLSA y VEX como los marcos que marcan la transición Senior → Staff, conectando con `docs/ci-cd-pipeline-empresarial.md` §25/§26.
- Enseñar la filosofía de mantenimiento de workflows usando `docs/learning/ci-cd/workflows-mantenimiento-guia.md` como fuente intensiva (Casos 1-2, checklist trimestral, anti-patrones).
- Cerrar la ruta con un wrap-up de graduación en `profesional-README.md` que conecte los 4 niveles.

**Non-Goals:**

- NO escribir las guías aún — este cambio solo genera los artefactos OpenSpec (proposal, specs, design, tasks).
- NO modificar código de aplicación, workflows, Dependabot ni infraestructura.
- NO reescribir ni migrar `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/learning/ci-cd/workflows-mantenimiento-guia.md` ni `docs/aws-*.md`.
- NO implementar mejoras de seguridad reales en el pipeline (p. ej. no añadir VEX real, no crear IaC scan) — el nivel solo enseña; los gaps se documentan como learning.
- NO duplicar el contenido de `docs/security/security-enterprise-guide.md` — se referencia para SLSA/VEX en profundidad.

## Decisions

### D1: Continuidad con los niveles previos (numeración 18-29, mismo estilo)

El nivel continúa la numeración secuencial (Fundamentos 00-04 → Intermedio 05-10 → Avanzado 11-17 → Profesional 18-29; ver D10 para la renumeración 18-23 → 23 + 25-29) y reutiliza el mismo contrato pedagógico (objetivos → prerequisitos → teoría → implementación → resumen → siguiente guía), el idioma español y el rango de 800-1500 líneas por guía.

**Por qué**: La ruta es un solo artefacto de aprendizaje; romper el patrón en el último nivel confundiría al lector. La continuidad formal refuerza la sensación de progresión (cada nivel es "más de lo mismo, más profundo"). Se verifica contra `specs/cicd-professional-guide/spec.md` y los cambios previos `learning-cicd-fundamentos` e `learning-cicd-intermedio`.

**Estado (2026-11-07) — colisión de numeración detectada.** El supuesto de que 18-23 estaban libres es falso: en
`docs/learning/ci-cd/` ya existen `18-trunk-based-development.md`, `19-governance-gates.md`, `20-governance-stage.md`,
`21-code-review.md`, `22-rulesets-guide.md` y `24-dag-infraestructura.md` (serie governance/review, escrita en otros
cambios). Sólo el **23** estaba libre y es el que se implementó. Las guías 18-22 de este plan (security.yml, cron,
Dependabot, mantenimiento, DORA) **no pueden crearse con esos nombres**: la renumeración se resolvió en **D10**
(`25-29`), conservando el orden relativo y sin tocar archivos publicados.

**Alternativa considerada**: Nivel con formato distinto (ej. sin numeración, estilo "handbook" técnico). Rechazada: rompe el contrato pedagógico establecido y dificulta la navegación entre niveles.

### D2: Conceptos de seguridad (SAST/SCA/SBOM) introducidos desde cero

La guía 18 no asume ningún background de seguridad: define SAST, SCA, SBOM, secrets detection y dependency review desde sus fundamentos (qué problema resuelven, qué detectan, dónde se ubican en la cadena de suministro) antes de mostrar el workflow real.

**Por qué**: El lector del nivel Avanzado domina CI/CD y AWS pero puede no conocer la taxonomía de seguridad de aplicaciones. La familia SAST/SCA/SBOM es el vocabulario del nivel Profesional; sin definirlo desde cero el walkthrough de `security.yml` sería ruido técnico. Sigue el mismo principio "teoría primero → implementación después" de los niveles previos.

**Alternativa considerada**: Asumir que el lector ya conoce los términos (solo nombrarlos). Rechazada: el objetivo del nivel es enseñar SecOps desde la base; nombrar sin explicar crea falsa competencia.

### D3: Uso intensivo de `docs/learning/ci-cd/workflows-mantenimiento-guia.md` como fuente

La guía 21 (mantenimiento) se construye sobre el playbook real: Caso 1 (EBADENGINE omniroute@3.8.49 → `.nvmrc` SSOT), Caso 2 (dorny/test-reporter exit 128 → `fetch-depth: 0` opt-in), la política de versionado de actions (tags vs SHA pinning, decisión ago 2026), el gotcha del timeout bash 120s, el checklist trimestral (11 items, sección 17) y los anti-patrones (sección 18).

**Por qué**: El documento ya contiene los incidentes reales con formato (Síntoma, Causa, Fix, Propagación, Lección). Reutilizarlo evita duplicación y ancla el aprendizaje en la historia real del repo. Las guías 18-19 también referencian las secciones 13 (security workflows), 16 (permissions) y 7 (third-party actions).

**Regla aplicada**: >40 líneas continuas de un archivo existente → enlace; <40 líneas con valor didáctico → snippet con cita de ruta (misma regla D4 del nivel Fundamentos).

### D4: DORA + SLSA + VEX como conceptos Staff-level con framing explícito Senior → Staff

Las guías 22-23 presentan DORA, SLSA y VEX como los marcadores de la transición de Senior (ejecuta el pipeline) a Staff (diseña, asegura, mide y mejora el pipeline). Cada concepto se explica desde cero y se conecta con el estado real del proyecto (`docs/ci-cd-pipeline-empresarial.md` §26 DORA y costo, §25.2 SLSA, §25.5 SBOM CycloneDX vs SPDX; `docs/CONTEXT-CICD.md` §13.5 pins y §5.9 inventario).

**Corrección (2026-11-07)**: las fuentes que el plan citaba — `docs/cicd-plan-implementacion.md` §12/§16/§19.2.3 (incluido el "gap G18") y `docs/cicd-estado-actual.md` Stage 6 — **no existen** en el repo; el gap G18 no aparece en ninguna parte. Las referencias válidas son las de la frase anterior.

**Corrección SLSA (2026-11-07)**: el proyecto **no** está en "nivel 2-3". `grep` sobre `.github/workflows/` no encuentra
`attest`, `cosign`, `provenance` ni `sigstore`; hay SBOM y dependency review, pero no provenance firmada → **Build L1**,
con L2 a un job de distancia (`actions/attest`). La guía 23 lo dice así.

**Por qué**: El objetivo declarado del nivel es la graduación a práctica Staff. Nombrar explícitamente los marcos que diferencian niveles de experiencia (respaldado por `docs/nivel-experiencia-analisis.md`, que sitúa el pipeline security en nivel Senior) da al lector un mapa de qué debe dominar para avanzar. DORA conecta el CI/CD con métricas de negocio (deploys frecuentes, lead time, fallos, MTTR); SLSA conecta con integridad de cadena de suministro; VEX con comunicación de vulnerabilidad explotable.

### D5: Modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador

La guía 19 organiza toda la seguridad del proyecto en un modelo de 3 niveles: (1) **pre-commit** — hooks de Husky locales (Semgrep + Gitleaks en staged, `.husky/pre-commit`); (2) **PR/CI** — `security.yml` en cada PR (Trivy SCA, CodeQL SAST, Gitleaks diff, SBOM, Dependency Review); (3) **cron** — `scheduled-security.yml` + `security-digest.yml` cada lunes (Gitleaks full-history, OSV, digest consolidado).

**Por qué**: Es el patrón real del proyecto (documentado en `docs/CONTEXT-CICD.md` §3.4/§5.9 — `security.yml` en PR, `scheduled-security.yml` + `security-digest.yml` por cron lunes 03:00 UTC — y en `docs/security/security-enterprise-guide.md`). Presentarlo como modelo con diagrama mermaid da al lector un marco mental reutilizable en cualquier repo: detección temprana (barata) + detección profunda programada (cubre lo que el diff no ve). Cada capa tiene coste y cobertura distintos; el modelo explica por qué las tres coexisten.

**Alternativa considerada**: Explicar cada workflow por separado sin modelo unificador. Rechazada: pierde la lección principal del nivel — la seguridad no es un workflow, es una estrategia en capas.

### D6: `ci-enterprise.yml` como pipeline de referencia **retirado**, estudiado por snippets

La guía 23 usa `ci-enterprise.yml` (8 jobs: changes, install, lint, type-check, test, build, dependency-audit, codeql)
como herramienta de enseñanza de anti-patrones de portabilidad. **Corrección (2026-11-07)**: el archivo **no existe** en
`.github/workflows/` ni en el registro de GitHub Actions — se retiró (ver `docs/CONTEXT-CICD.md` §5.9) —, así que la guía
lo estudia a partir de los **snippets supervivientes** (guía 02 §7.1: triggers/permisos/lista de jobs; guía 09 §6.1-§6.3:
`cache-dependency-path` con `frontend/`/`backend/` y filtros `paths-filter` muertos). Se conservan los dos hechos
didácticos (paths inexistentes → cache-miss garantizado y path filtering muerto) y se añade la lista de cinco
anti-patrones con síntoma observable.

**Por qué**: Es el espécimen real del repo para enseñar el salto de escala y la lección de portabilidad, y los snippets ya
estaban citados en dos guías del nivel Intermedio. Mantenerlo como "workflow no operativo" habría sido falso: ya no está.

**Alternativa considerada**: Ignorar `ci-enterprise.yml` del todo. Rechazada: el caso enseña tres cosas que ningún
workflow vivo enseña (paths fantasma, cache-miss silencioso, trigger huérfano) y su retirada es en sí una lección de
gobernanza documental.

### D7: README final con wrap-up de graduación de los 4 niveles

`profesional-README.md` incluye una sección final de wrap-up que recorre los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional), resume lo logrado en cada uno y conecta la ruta completa en un camino de maestría CI/CD de Junior a Staff.

**Por qué**: La ruta es un programa de aprendizaje completo, no 4 documentos sueltos. El wrap-up actúa como ceremonia de graduación: cierra el círculo, da sentido a todo el recorrido y ofrece siguientes pasos (contribuir a los workflows, proponer mejoras de seguridad, seguir con `docs/cicd-plan-implementacion.md`). Sin él, el nivel final termina sin conclusión emocional ni direccional.

### D8: Cross-references — LINK, no copiar

Las guías 18-23 referencian por enlaces relativos: `docs/learning/ci-cd/workflows-mantenimiento-guia.md` (uso intensivo), `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/security/security-enterprise-guide.md`, `docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, y los workflows reales por ruta. Los snippets se copian en pequeño (10-40 líneas) solo con valor didáctico y siempre citando la ruta fuente.

**Por qué**: Evita drift de documentación (dos versiones del mismo dato) y respeta los docs técnicos como fuente de verdad. La regla práctica del nivel Fundamentos (D4) se mantiene: >40 líneas → enlace; <40 líneas → snippet con cita.

### D9: Performance tuning con `act` para dry-run local

La guía 29 introduce `act` (ej. `act -j quality -W .github/workflows/ci.yml`) como técnica para validar cambios de
workflow localmente sin gastar minutos de GitHub Actions, y lo conecta con el checklist trimestral
(`docs/learning/ci-cd/workflows-mantenimiento-guia.md` sección 17 item 5).

**Por qué**: El coste de GitHub Actions es un tema de nivel Staff (minutos, caches, concurrencia). `act` permite iterar
rápido y barato antes de un PR; es además una herramienta citada en la guía de mantenimiento del repo. Enseñarlo cierra
el tema de performance: no solo se optimiza el pipeline, se optimiza el flujo de desarrollo del propio pipeline.

### D10: Renumeración del plan a 25-29 (decisión 2026-11-07)

Las cinco guías pendientes del nivel adoptan estos nombres definitivos, en el mismo orden relativo del plan original:

| Plan original      | Nombre definitivo                       | Contenido                                     |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| 18 (security)      | `25-security-yml-sast-sca-sbom.md`      | SAST/SCA/SBOM, walkthrough de `security.yml`  |
| 19 (cron)          | `26-scheduled-security-yml.md`          | 3 niveles, `scheduled-security`, digest       |
| 20 (Dependabot)    | `27-dependabot-3-ecosistemas.md`        | `dependabot.yml`, rutina mensual, drift       |
| 21 (mantenimiento) | `28-mantenimiento-workflows.md`         | Filosofía, `.nvmrc`, `fetch-depth`, checklist |
| 22 (DORA)          | `29-dora-metrics-performance-tuning.md` | 4 métricas DORA, SLSA, performance tuning     |

**Por qué 25-29 y no otro hueco**: 18-22 están publicadas por la serie governance/review, 23 es la guía enterprise
ya escrita y 24 el DAG. Los huecos no ocupados empiezan en 25, así que cualquier reutilización de números menores
exigiría renombrar archivos con 132 referencias vivas (el caso de la guía de mantenimiento, ver abajo) o insertar
números fraccionarios (`18b`, `22a`) que rompen el orden lexicográfico de los índices.

**Por qué no se renombra `workflows-mantenimiento-guia.md`**: el playbook de mantenimiento existe sin número
desde antes y tiene **132 referencias** en docs, openspec y guías. La guía `28` no lo duplica: es el capítulo del
nivel que lo recorre (filosofía, casos, checklist) con ejercicios propios, y el playbook sigue siendo la fuente
técnica enlazada.

**Consecuencia pedagógica**: 25-29 llegan después de 23 (enterprise) y 24 (DAG), así que la seguridad del nivel se
estudia al final de la secuencia numérica aunque 23 asuma su vocabulario. Mitigación: el README declara el orden de
lectura recomendado (18-22 → 23 → 24 → 25-29) y cada guía de 25-29 abre con la teoría desde cero, de modo que se
pueden leer de forma autónoma.

**Alternativas rechazadas**: (a) absorber las cinco en las guías existentes — pierde el nivel como bloque y mezcla
seguridad con gobernanza; (b) numerar 18a/19a — rompe el orden lexicográfico y el patrón `NN-` de toda la ruta;
(c) renumerar 18-22 de la serie governance — rompe enlaces publicados y el historial de otros cambios.

## Risks / Trade-offs

- **[Riesgo] Drift de snippets**: los snippets de `security.yml`, `scheduled-security.yml`, `security-digest.yml` y `dependabot.yml` pueden quedar obsoletos si esos archivos cambian → Mitigación: citar siempre la ruta fuente, mantener snippets cortos (<40 líneas) y tarea de verificación de referencias (tasks 8.x/9.x).
- **[Riesgo] Enlaces rotos**: rutas relativas hacia `docs/` y `.github/` pueden romperse al reestructurar el repo → Mitigación: task 8.1 de verificación de cross-references y uso consistente de rutas relativas desde `docs/learning/ci-cd/`.
- **[Riesgo] Contenido de seguridad profundo mal explicado**: SAST/SCA/SBOM/SLSA/VEX son temas densos; explicarlos mal genera falsa confianza → Mitigación: teoría primero desde cero con analogías, cada concepto conectado a su implementación real en el repo, y enlaces a `docs/security/security-enterprise-guide.md` para profundización.
- **[Trade-off] Extensión 800-1500 líneas**: 6 guías de hasta 1500 líneas es costoso de producir y revisar → Mitigación: cada guía es un bloque de tareas independiente (tasks.md), revisable por separado.
- **[Riesgo] `ci-enterprise.yml` confundido con workflow operativo**: el lector podría intentar "arreglar" el cache miss → Mitigación: la guía 23 lo declara explícitamente como referencia didáctica no operativa (D6) y documenta el gotcha como lección, no como bug a corregir.
- **[Riesgo] Docs de referencia en evolución**: `docs/learning/ci-cd/workflows-mantenimiento-guia.md`, `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md` y los docs AWS pueden cambiar entre diseño e implementación → Mitigación: las guías enlazan por ruta relativa (no copian contenido), así los enlaces siguen funcionando aunque el contenido evolucione.
- **[Riesgo materializado y resuelto] Colisión de numeración**: 18-22 están ocupadas por la serie governance/review y por `22-rulesets-guide.md`; sólo 23 estaba libre. Resuelto en D10 con la renumeración a 25-29.
- **[Riesgo materializado] Docs de referencia fantasma**: `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md` y el "gap G18" no existen; varias tareas (6.2, 6.3, 7.3, 7.4, 9.2) citan secciones de esos archivos. Reescritas contra `docs/ci-cd-pipeline-empresarial.md` y `docs/CONTEXT-CICD.md`.
- **[Riesgo materializado] Conteos y hechos del plan obsoletos**: "9 workflows", "12 → 3 zombies", "30+ jobs", "SLSA 2-3", "job `iac-security` comentado" y "`ci-enterprise.yml` es interno". La guía 23 se escribió con datos verificados (15 archivos / 94 jobs / Build L1 / `checkov-iac` advisory / workflow retirado).
- **[Limitación de verificación] `docs:vale` no ejecutable local**: vale no está instalado en el entorno de desarrollo, así que el gate de prosa de CI no puede verificarse localmente. Mitigación: `npm run docs:lint` (markdownlint) + `prettier --check` sí se ejecutaron; el gate de vale queda para CI.
- **[Limitación de fuentes] URL muerta**: la referencia a la página VEX de CISA devolvía 404 y se descartó; sólo se citan URLs ya usadas en la documentación del repo (`slsa.dev`, `github.com/openvex/spec`, `checkov.io`, `opentelemetry.io`, docs de GitHub).

## Migration Plan

No aplica migración de sistemas: es documentación nueva en `docs/learning/ci-cd/` sin tocar código, workflows, Dependabot ni infraestructura. Rollout: este cambio (Profesional) → revisión → implementación del resto de guías + README (el README ya existe y la guía 23 está entregada; las guías 25-29 ya tienen número y pueden escribirse en cualquier orden). Rollback: eliminar los archivos nuevos del nivel — no afecta nada más; los niveles previos (00-17) y la serie governance/review (18-22, 24) permanecen intactos.

## Open Questions

- Ninguna pendiente: las decisiones de diseño (D1-D10) cubren estructura, contenido, fuentes, numeración y framing. Los detalles finos de redacción de cada guía se resuelven en implementación sin cambiar specs ni tasks.
