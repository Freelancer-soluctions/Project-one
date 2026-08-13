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

## 🗺️ Roadmap de los 4 niveles

| Nivel              | Estado            | Propósito                                                           | Guías              |
| ------------------ | ----------------- | ------------------------------------------------------------------- | ------------------ |
| **1. Fundamentos** | ✅ **Completado** | Conceptos base: CI/CD, Git+YAML, Actions, Secrets, Docker           | 00 → 04 (+ README) |
| **2. Intermedio**  | 📋 Planificado    | Workflows reales en profundidad, matrices, caching, jobs compuestos | 05 → 09            |
| **3. Avanzado**    | 📋 Planificado    | Seguridad, AWS/IAM, Floci profundo, quality gates, OIDC             | 10 → 16            |
| **4. Profesional** | 📋 Planificado    | Mantenimiento, observabilidad, SLSA, gobernanza, DORA profundo      | 17 → 22            |

> **Enlaces a niveles futuros** (cuando estén implementados):
>
> - [Intermedio](../learning-cicd-intermedio/) — `openspec/changes/learning-cicd-intermedio/`
> - [Avanzado](../learning-cicd-avanzado/) — `openspec/changes/learning-cicd-avanzado/`
> - [Profesional](../learning-cicd-profesional/) — `openspec/changes/learning-cicd-profesional/`

---

## 📚 Guías del nivel Fundamentos (orden de lectura)

| #   | Archivo                                                          | Descripción                                                       | Prerequisitos |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| 00  | [`00-que-es-cicd.md`](00-que-es-cicd.md)                         | Qué es CI vs CD, etapas de pipeline, métricas DORA, shifting left | Ninguno       |
| 01  | [`01-git-y-yaml.md`](01-git-y-yaml.md)                           | Ramas, PRs, Conventional Commits, YAML desde cero                 | 00            |
| 02  | [`02-github-actions-base.md`](02-github-actions-base.md)         | Workflows, jobs, steps, triggers, runners, expresiones, contextos | 00, 01        |
| 03  | [`03-secrets-variables.md`](03-secrets-variables.md)             | Secrets vs variables, environments, mínimo privilegio, uso real   | 02            |
| 04  | [`04-docker-basico-para-cicd.md`](04-docker-basico-para-cicd.md) | Dockerfile, multi-stage, compose, Floci intro                     | 02, 03        |

---

## 📖 Documentación de referencia del proyecto (enlaces, no duplicación)

Las guías **referencian** (no copian) la documentación técnica existente:

| Documento                         | Qué cubre                                             | Enlace                                                                           |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `cicd-estado-actual.md`           | Estado completo del pipeline CI/CD (1979 líneas)      | [`../../cicd-estado-actual.md`](../../cicd-estado-actual.md)                     |
| `cicd-plan-implementacion.md`     | Plan original de 8 semanas (3149 líneas)              | [`../../cicd-plan-implementacion.md`](../../cicd-plan-implementacion.md)         |
| `workflows-mantenimiento-guia.md` | Mantenimiento de workflows, anti-patterns, inventario | [`../../workflows-mantenimiento-guia.md`](../../workflows-mantenimiento-guia.md) |
| `aws-deploy-architecture.md`      | Arquitectura de despliegue AWS + ECS                  | [`../../aws-deploy-architecture.md`](../../aws-deploy-architecture.md)           |
| `aws-cd-learning-path.md`         | Ruta de aprendizaje AWS/CD                            | [`../../aws-cd-learning-path.md`](../../aws-cd-learning-path.md)                 |
| `aws-dev-local-floci.md`          | Desarrollo local con Floci                            | [`../../aws-dev-local-floci.md`](../../aws-dev-local-floci.md)                   |
| `aws-learning-with-floci.md`      | Aprendizaje AWS usando Floci                          | [`../../aws-learning-with-floci.md`](../../aws-learning-with-floci.md)           |

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

> 💡 **Consejo**: No intentes hacerlo todo de una sentada. Cada guía tiene teoría densa — haz pausas, experimenta con los snippets, y vuelve al día siguiente.

---

## 🔗 Navegación rápida

```
README.md (estás aquí)
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

## ✅ Checklist de completitud del nivel

- [ ] Leído `00-que-es-cicd.md` y entendido CI vs CD + pipeline stages
- [ ] Leído `01-git-y-yaml.md` y practicado YAML + Conventional Commits
- [ ] Leído `02-github-actions-base.md` y entendido workflow real (`ci.yml`)
- [ ] Leído `03-secrets-variables.md` y distinguido secrets/vars + mínimo privilegio
- [ ] Leído `04-docker-basico-para-cicd.md` y desglosado `apps/server/Dockerfile`
- [ ] Puede explicar el flujo: commit → PR → CI → CD → deploy

---

## 🎓 Graduación: ¿Qué sigue?

> **Has completado el nivel Fundamentos.** 🎉

El siguiente nivel es **Intermedio** (guías 05-09), donde profundizaremos en:

- Workflows reales del repo (`ci.yml`, `quality.yml`, `preview.yml`, `deploy.yml`) línea por línea
- Matrices de testing, caching estratégico, jobs compuestos (`setup-monorepo`)
- Path filtering, concurrency groups, reusable workflows
- Quality gates completos (lint, typecheck, tests unitarios, integración, E2E)

**Próxima guía**: [`05-husky-git-hooks.md`](../learning-cicd-intermedio/05-husky-git-hooks.md) (change `learning-cicd-intermedio` por implementar)

---

_Última actualización: agosto 2026 — Parte del cambio OpenSpec `learning-cicd-fundamentos`_
