# Guía de Aprendizaje CI/CD — Nivel Fundamentos

> **Ruta de aprendizaje incremental**: Fundamentos → Intermedio → Avanzado → Profesional
> **Nivel actual**: Fundamentos (primer nivel de 4)
> **Público objetivo**: Desarrollador Junior (0-2 años), JavaScript básico, **sin conocimiento previo** de YAML, GitHub Actions, Docker ni CI/CD

---

## 🎯 Objetivos de aprendizaje del nivel Fundamentos

Al completar este nivel, serás capaz de:

- ✅ **Distinguir CI de CD** y explicar por qué importan en desarrollo moderno
- ✅ **Leer y escribir YAML** — el lenguaje de configuración de GitHub Actions
- ✅ **Entender Git workflows**: ramas, Pull Requests, Conventional Commits
- ✅ **Navegar un workflow real** de GitHub Actions (jobs, steps, triggers, runners)
- ✅ **Diferenciar secrets de variables** y aplicar el principio de mínimo privilegio
- ✅ **Leer un Dockerfile multi-stage** real y entender por qué reduce imágenes

**Al terminar el nivel, podrás responder estas preguntas con confianza:**

| Pregunta                                                    | Guía que la responde |
| ----------------------------------------------------------- | -------------------- |
| ¿Qué diferencia hay entre CI y CD?                          | 00                   |
| ¿Qué es un pipeline y cuáles son sus etapas?                | 00                   |
| ¿Qué son las métricas DORA y qué mide cada una?             | 00                   |
| ¿Por qué `main` siempre debe estar deployable?              | 01                   |
| ¿Qué es un Conventional Commit y por qué el repo lo fuerza? | 01                   |
| ¿Cómo se escribe YAML válido?                               | 01                   |
| ¿Qué es un workflow, un job y un step?                      | 02                   |
| ¿Cuándo corre un workflow? (triggers)                       | 02                   |
| ¿Qué es un secret y en qué se diferencia de una variable?   | 03                   |
| ¿Qué es un Dockerfile y cómo se construye una imagen?       | 04                   |

---

## 👤 Perfil del lector objetivo

| Característica                  | Detalle                                                |
| ------------------------------- | ------------------------------------------------------ |
| **Experiencia**                 | 0-2 años desarrollando                                 |
| **Lenguaje base**               | JavaScript / TypeScript (básico)                       |
| **Conocimiento CI/CD**          | **Ninguno** — empezamos desde cero                     |
| **Conocimiento YAML**           | **Ninguno** — se enseña en la guía 01                  |
| **Conocimiento GitHub Actions** | **Ninguno** — se enseña en la guía 02                  |
| **Conocimiento Docker**         | **Ninguno** — se enseña en la guía 04                  |
| **Conocimiento Git**            | Básico (commit, push, pull) — se profundiza en guía 01 |

> 💡 **Nota**: Si ya conoces alguno de estos temas, puedes saltar a la guía correspondiente. Cada guía declara sus prerequisitos explícitamente.

---

## 🧭 Cómo usar esta guía (metodología)

Esta ruta sigue un método pedagógico fijo, igual en todas las guías:

1. **Teoría desde cero** con analogías cotidianas — no se asume ningún conocimiento previo
2. **Implementación en el proyecto real** — cada concepto se conecta con archivos reales del repo (workflows, Dockerfile, configs), citando siempre la ruta fuente
3. **Tablas comparativas** para contrastar conceptos (CI vs CD, secrets vs variables, etc.)
4. **Diagramas mermaid** para flujos y jerarquías (pipeline, PR lifecycle, anatomy de workflow)
5. **Resumen + enlace a la siguiente guía**

**Recomendaciones de estudio:**

- 📝 **Haz los ejercicios**: cada guía tiene ejercicios prácticos. Escribe YAML, crea una rama, lee un workflow. Leer sin practicar no sirve.
- 🔍 **Abre los archivos reales**: cuando una guía cite `.github/workflows/ci.yml` o `apps/server/Dockerfile`, ábrelos en tu editor y sigue la lectura. La cita te dice exactamente dónde mirar.
- ⏱️ **Respeta el ritmo**: cada guía tiene tiempo estimado. No apresures la guía 01 (YAML) ni la 02 (Actions) — son la base de todo lo demás.
- 🔁 **Relee con un objetivo**: la primera lectura es "¿de qué se trata?". La segunda lectura es "¿puedo explicarlo con mis palabras?". Usa los checklists al final de cada guía.

> **Cómo están escritas las guías**: en español, con los términos técnicos en inglés (workflow, job, step, trigger, secret, runner) porque así aparecen en la herramienta real. Cada término se explica en español la primera vez que aparece.

---

## 🗺️ Roadmap de los 4 niveles

| Nivel              | Estado            | Propósito                                                           | Guías              |
| ------------------ | ----------------- | ------------------------------------------------------------------- | ------------------ |
| **1. Fundamentos** | ✅ **Completado** | Conceptos base: CI/CD, Git+YAML, Actions, Secrets, Docker           | 00 → 04 (+ README) |
| **2. Intermedio**  | 📋 Planificado    | Workflows reales en profundidad, matrices, caching, jobs compuestos | 05 → 10            |
| **3. Avanzado**    | 📋 Planificado    | Seguridad, AWS/IAM, Floci profundo, quality gates, OIDC             | 11 → 17            |
| **4. Profesional** | 📋 Planificado    | Mantenimiento, observabilidad, SLSA, gobernanza, DORA profundo      | 18 → 23            |

### Detalle por nivel

| Nivel                           | Qué aprenderás                                                                                                                    | Qué sabrás hacer al terminar                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **1. Fundamentos** (estás aquí) | Conceptos CI/CD, Git+YAML, Actions base, secrets/variables, Docker básico                                                         | Leer y explicar un workflow real, distinguir CI de CD, escribir YAML, entender secrets y leer un Dockerfile |
| **2. Intermedio**               | Workflows reales del repo en profundidad (`ci.yml` job por job), reusable workflows, composite actions, caching, testing pipeline | **Leer y modificar cualquiera de los workflows del proyecto** + los hooks de Husky                          |
| **3. Avanzado**                 | Seguridad (SAST/SCA/secrets), AWS/IAM, OIDC, Floci en profundidad, quality gates                                                  | Endurecer el pipeline, entender el despliegue AWS real, razonar sobre permisos y mínimo privilegio          |
| **4. Profesional**              | Mantenimiento de pipelines, observabilidad, SLSA, gobernanza, DORA profundo                                                       | Diseñar pipelines para organizaciones, medir y mejorar la entrega de software                               |

> **Enlaces a los cambios OpenSpec de los niveles futuros** (planificación oficial en el repo):
>
> - [**Intermedio**](../../../openspec/changes/learning-cicd-intermedio/) — `openspec/changes/learning-cicd-intermedio/`
> - [**Avanzado**](../../../openspec/changes/learning-cicd-avanzado/) — `openspec/changes/learning-cicd-avanzado/`
> - [**Profesional**](../../../openspec/changes/learning-cicd-profesional/) — `openspec/changes/learning-cicd-profesional/`
>
> Estos directorios contienen la propuesta, especificaciones y tareas de cada nivel (work in progress). Cuando un nivel se implemente, sus guías aparecerán en este mismo directorio `docs/learning/ci-cd/` continuando la numeración.

---

## 📚 Guías del nivel Fundamentos (orden de lectura)

| #   | Archivo                                                          | Descripción                                                       | Prerequisitos |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| 00  | [`00-que-es-cicd.md`](00-que-es-cicd.md)                         | Qué es CI vs CD, etapas de pipeline, métricas DORA, shifting left | Ninguno       |
| 01  | [`01-git-y-yaml.md`](01-git-y-yaml.md)                           | Ramas, PRs, Conventional Commits, YAML desde cero                 | 00            |
| 02  | [`02-github-actions-base.md`](02-github-actions-base.md)         | Workflows, jobs, steps, triggers, runners, expresiones, contextos | 00, 01        |
| 03  | [`03-secrets-variables.md`](03-secrets-variables.md)             | Secrets vs variables, environments, mínimo privilegio, uso real   | 02            |
| 04  | [`04-docker-basico-para-cicd.md`](04-docker-basico-para-cicd.md) | Dockerfile, multi-stage, compose, Floci intro                     | 02, 03        |

### Objetivos detallados por guía

| Guía   | Objetivos de aprendizaje específicos                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **00** | Definir CI y CD con analogías · Enumerar etapas de un pipeline · Explicar "shifting left" · Identificar las 4 métricas DORA · Reconocer los 9 workflows del proyecto                                                           |
| **01** | Explicar el flujo de ramas y PRs · Escribir Conventional Commits · Entender Husky + commitlint · Leer/escribir YAML (escalares, listas, mapas) · Dominar multilínea y anclas · Conectar YAML con Actions                       |
| **02** | Explicar anatomía workflow/job/step · Configurar triggers (push, PR, dispatch, cron) · Diferenciar runners · Dominar expresiones `${{ }}` y contextos · Distinguir outputs de job vs step · Desglosar `ci.yml` línea por línea |
| **03** | Diferenciar secrets de variables · Entender environments y protection rules · Aplicar mínimo privilegio · Explicar el gating real con `vars.AWS_ROLE_ARN` y secrets `STAGING_*`/`PROD_*`                                       |
| **04** | Explicar imagen vs contenedor vs Dockerfile · Desglosar `apps/server/Dockerfile` · Entender multi-stage builds · Conocer docker-compose y su rol en CI/CD · Introducir el contenedor Floci                                     |

---

## 📖 Documentación de referencia del proyecto (enlaces, no duplicación)

Las guías **referencian** (no copian) la documentación técnica existente. Estos documentos son la fuente de verdad técnica:

| Documento                         | Qué cubre                                             | Enlace                                                                           |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `cicd-estado-actual.md`           | Estado completo del pipeline CI/CD (1979 líneas)      | [`../../cicd-estado-actual.md`](../../cicd-estado-actual.md)                     |
| `cicd-plan-implementacion.md`     | Plan original de 8 semanas (3149 líneas)              | [`../../cicd-plan-implementacion.md`](../../cicd-plan-implementacion.md)         |
| `workflows-mantenimiento-guia.md` | Mantenimiento de workflows, anti-patterns, inventario | [`../../workflows-mantenimiento-guia.md`](../../workflows-mantenimiento-guia.md) |
| `aws-deploy-architecture.md`      | Arquitectura de despliegue AWS + ECS                  | [`../../aws-deploy-architecture.md`](../../aws-deploy-architecture.md)           |
| `aws-cd-learning-path.md`         | Ruta de aprendizaje AWS/CD                            | [`../../aws-cd-learning-path.md`](../../aws-cd-learning-path.md)                 |
| `aws-dev-local-floci.md`          | Desarrollo local con Floci                            | [`../../aws-dev-local-floci.md`](../../aws-dev-local-floci.md)                   |
| `aws-learning-with-floci.md`      | Aprendizaje AWS usando Floci                          | [`../../aws-learning-with-floci.md`](../../aws-learning-with-floci.md)           |

**Archivos de código fuente que las guías citan** (lee estos cuando la guía los mencione):

| Archivo                   | Qué es                                      |
| ------------------------- | ------------------------------------------- |
| `.github/workflows/*.yml` | Los 9 workflows de CI/CD del proyecto       |
| `apps/server/Dockerfile`  | Dockerfile de la API (build de imagen)      |
| `commitlint.config.js`    | Config de commitlint (Conventional Commits) |
| `.husky/commit-msg`       | Hook que valida mensajes de commit          |
| `.husky/pre-commit`       | Hook que corre lint-staged + SAST + secrets |
| `.husky/pre-push`         | Hook que corre tests scoped antes de push   |
| `.nvmrc`                  | Versión de Node fijada para el proyecto     |

---

## ⏱️ Ritmo sugerido

| Guía | Tiempo estimado | Tipo de esfuerzo         |
| ---- | --------------- | ------------------------ |
| 00   | 45-60 min       | Lectura + analogías      |
| 01   | 60-90 min       | Práctica YAML + Git      |
| 02   | 90-120 min      | Anatomía workflow real   |
| 03   | 60-90 min       | Secrets/vars + seguridad |
| 04   | 60-90 min       | Dockerfile + multi-stage |

**Total nivel Fundamentos**: ~5-7 horas de estudio dedicado

### Calendario sugerido (una semana laboral)

| Día               | Actividad                                          | Objetivo                                    |
| ----------------- | -------------------------------------------------- | ------------------------------------------- |
| **Lunes**         | Guía 00 (45-60 min)                                | Conceptos CI/CD claros                      |
| **Martes**        | Guía 01 primera mitad (Git + Conventional Commits) | Ramas y commits del proyecto                |
| **Miércoles**     | Guía 01 segunda mitad (YAML)                       | Escribir YAML sin miedo                     |
| **Jueves**        | Guía 02 (90-120 min)                               | Leer `ci.yml` completo                      |
| **Viernes**       | Guías 03 + 04 (2-3 h)                              | Secrets + Dockerfile                        |
| **Fin de semana** | Repaso + checklist del README                      | Explicar el flujo completo con tus palabras |

> 💡 **Consejo**: No intentes hacerlo todo de una sentada. Cada guía tiene teoría densa — haz pausas, experimenta con los snippets, y vuelve al día siguiente.

---

## 🔗 Navegación rápida

```
fundamentos-README.md (estás aquí)
    │
    ▼
00-que-es-cicd.md  ──►  01-git-y-yaml.md  ──►  02-github-actions-base.md
                                                                  │
                                                                  ▼
                                                         03-secrets-variables.md
                                                                  │
                                                                  ▼
                                                         04-docker-basico-para-cicd.md
                                                                  │
                                                                  ▼
                                                         🎓 Graduación Fundamentos
                                                                  │
                                                                  ▼
                                                     Nivel Intermedio (05+)
```

---

## ❓ Preguntas frecuentes (FAQ)

### ¿Necesito saber Docker para empezar?

**No.** La guía 04 te enseña Docker desde cero. Hasta la guía 03, solo necesitas saber que la imagen del servidor se construye con un `Dockerfile` — sin entrar en detalles.

### ¿Tengo que memorizar la sintaxis YAML?

**No.** La guía 01 te enseña a _leer_ YAML primero y a _escribirlo_ después con ayuda de ejemplos. Con práctica, la sintaxis se vuelve natural. Lo importante es entender la _estructura_ (escalares, listas, mapas) — los detalles se consultan.

### ¿Puedo saltarme la guía 00 si "ya sé qué es CI/CD"?

Si puedes explicar con tus palabras qué es _integración continua_ y qué es _entrega continua_ (y la diferencia entre entrega y despliegue), puedes saltarla. Si dudas, léela: son solo 45-60 minutos y conecta con el pipeline real del proyecto.

### ¿Qué hago si un snippet de las guías no coincide con el archivo real?

Los snippets se copian de los archivos reales y cada bloque cita su ruta fuente. Si el archivo real cambió, **el archivo real manda**. Abre la ruta citada y compara. Reporta la discrepancia al equipo.

### ¿Cuándo estarán listos los niveles Intermedio/Avanzado/Profesional?

Son cambios OpenSpec planificados en `openspec/changes/learning-cicd-{intermedio,avanzado,profesional}/`. Están en fase de planificación (proposal + specs + tasks). Cuando se implementen, sus guías se publicarán en este directorio.

### ¿Estas guías reemplazan la documentación técnica?

**No.** `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md` y `docs/workflows-mantenimiento-guia.md` siguen siendo la fuente de verdad técnica. Estas guías son una _ruta de aprendizaje_ que te lleva hasta esa documentación. Cuando necesites el detalle técnico completo, las guías te enlazan a ella.

---

## 🧰 Glosario rápido del nivel

| Término         | Definición corta                                                     |
| --------------- | -------------------------------------------------------------------- |
| **CI**          | Integración Continua: verificar cada cambio automáticamente          |
| **CD**          | Despliegue/Entrega Continua: publicar cambios verificados            |
| **Pipeline**    | Secuencia de etapas automatizadas (build → test → deploy)            |
| **Workflow**    | Archivo `.yml` en `.github/workflows/` que define una automatización |
| **Job**         | Unidad de ejecución con su propio runner                             |
| **Step**        | Paso atómico dentro de un job (action o comando)                     |
| **Trigger**     | Evento que inicia un workflow (push, PR, cron, manual)               |
| **Runner**      | Máquina que ejecuta los jobs                                         |
| **Secret**      | Credencial cifrada (nunca visible en logs)                           |
| **Variable**    | Configuración no sensible (visible en logs)                          |
| **Environment** | Entorno con secrets aislados y protection rules (staging/production) |
| **Dockerfile**  | Receta para construir una imagen                                     |
| **Imagen**      | Paquete inmutable listo para ejecutar                                |
| **Contenedor**  | Instancia en ejecución de una imagen                                 |

---

## ✅ Checklist de completitud del nivel

- [ ] Leído `00-que-es-cicd.md` y entendido CI vs CD + pipeline stages
- [ ] Leído `01-git-y-yaml.md` y practicado YAML + Conventional Commits
- [ ] Leído `02-github-actions-base.md` y entendido workflow real (`ci.yml`)
- [ ] Leído `03-secrets-variables.md` y distinguido secrets/vars + mínimo privilegio
- [ ] Leído `04-docker-basico-para-cicd.md` y desglosado `apps/server/Dockerfile`
- [ ] Puede explicar el flujo: commit → PR → CI → CD → deploy

### Autoevaluación: ¿estás listo para el nivel Intermedio?

Marca cada afirmación que puedas sostener:

- [ ] Puedo explicar la diferencia entre CI y CD a un compañero sin usar jerga
- [ ] Puedo escribir un commit que pase `commitlint` a la primera
- [ ] Puedo leer un archivo YAML y decir qué es escalar, lista y mapa
- [ ] Puedo identificar en `ci.yml` el trigger, los jobs y los steps
- [ ] Puedo explicar por qué un secret nunca debe ir en `vars`
- [ ] Puedo decir qué hace cada línea del `apps/server/Dockerfile`

Si marcaste al menos **4 de 6**, estás listo para el nivel Intermedio. 🚀

---

## 🎓 Graduación: ¿Qué sigue?

> **Has completado el nivel Fundamentos.** 🎉

El siguiente nivel es **Intermedio** (guías 05-10), donde profundizaremos en:

- Git hooks del proyecto (`.husky/pre-commit`, `commit-msg`, `pre-push`)
- Workflows reales del repo (`ci.yml`, `quality.yml`, `preview.yml`, `deploy.yml`) línea por línea
- Matrices de testing, caching estratégico, jobs compuestos (`setup-monorepo`)
- Path filtering, concurrency groups, reusable workflows
- Quality gates completos (lint, typecheck, tests unitarios, integración, E2E)

**Planificación del nivel Intermedio**: [`openspec/changes/learning-cicd-intermedio/`](../../../openspec/changes/learning-cicd-intermedio/) — revisa su `proposal.md` para ver el detalle de las guías 05-10.

> **Próxima guía (cuando se implemente)**: [`05-husky-git-hooks.md`](05-husky-git-hooks.md) (nivel Intermedio)

---

## 📝 Notas para el lector del repo

- Estas guías son **documentación didáctica nueva** — no modifican código, workflows ni infraestructura.
- Se crearon como parte del cambio OpenSpec [`learning-cicd-fundamentos`](../../../openspec/changes/learning-cicd-fundamentos/) (nivel Fundamentos de la ruta).
- Si encuentras un enlace roto o un snippet desactualizado, abre un issue o PR — la verificación de referencias es parte del contrato de estas guías.

---

_Última actualización: agosto 2026 — Parte del cambio OpenSpec `learning-cicd-fundamentos`_
