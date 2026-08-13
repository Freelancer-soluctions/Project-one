## 1. Setup del nivel Fundamentos

- [ ] 1.1 Crear directorio `docs/learning/ci-cd/` (si no existe)
- [ ] 1.2 Crear `docs/learning/ci-cd/README.md` con: índice del nivel (README + 5 guías con descripción breve y orden de lectura), roadmap de los 4 niveles (Fundamentos/Intermedio/Avanzado/Profesional con estado), prerequisitos (perfil Junior 0-2 años, JS básico, sin YAML/Actions/Docker/CI-CD), objetivos de aprendizaje del nivel, y cross-links a los 3 cambios futuros (learning-cicd-intermedio, learning-cicd-avanzado, learning-cicd-profesional)

## 2. Guía: ¿Qué es CI/CD?

- [ ] 2.1 Escribir `docs/learning/ci-cd/00-que-es-cicd.md` con objetivos de aprendizaje y prerequisitos
- [ ] 2.2 Explicar CI vs CD desde cero con analogías (integración continua vs entrega/despliegue continuo) en tabla comparativa
- [ ] 2.3 Explicar las etapas de un pipeline (build, test, deploy, etc.) con diagrama mermaid
- [ ] 2.4 Explicar métricas DORA y el concepto de "shifting left"
- [ ] 2.5 Conectar con el pipeline real del proyecto: enlazar a `docs/cicd-plan-implementacion.md` y mostrar qué workflows existen en `.github/workflows/` (tabla inventario)
- [ ] 2.6 Cerrar con resumen y enlace a `01-git-y-yaml.md`

## 3. Guía: Git y YAML

- [ ] 3.1 Escribir `docs/learning/ci-cd/01-git-y-yaml.md` con objetivos de aprendizaje y prerequisitos
- [ ] 3.2 Enseñar flujo de ramas (main/feature) y Pull Requests con diagrama mermaid del ciclo de vida
- [ ] 3.3 Explicar Conventional Commits y mostrar la configuración real de Husky + commitlint del proyecto (citar rutas de configuración)
- [ ] 3.4 Enseñar YAML desde cero: escalares, listas, mapas con ejemplos comentados
- [ ] 3.5 Enseñar YAML avanzado básico: bloques multilínea (| y >), anclas y alias (& y \*)
- [ ] 3.6 Relacionar YAML con GitHub Actions (primer vistazo a un workflow real comentado)
- [ ] 3.7 Cerrar con resumen y enlace a `02-github-actions-base.md`

## 4. Guía: GitHub Actions base

- [ ] 4.1 Escribir `docs/learning/ci-cd/02-github-actions-base.md` con objetivos de aprendizaje y prerequisitos
- [ ] 4.2 Explicar anatomía de un workflow: workflow, job, step y su jerarquía con diagrama mermaid
- [ ] 4.3 Explicar triggers: push, pull_request, workflow_dispatch y cron con ejemplos de los workflows reales del proyecto (citar `.github/workflows/*.yml`)
- [ ] 4.4 Explicar runners: ubuntu-latest vs self-hosted, cuándo usar cada uno
- [ ] 4.5 Explicar expresiones `${{ }}` y contextos (github, secrets, vars, env, needs) con ejemplos del repo
- [ ] 4.6 Explicar outputs de job vs step y cómo pasar datos entre steps/jobs con `needs`
- [ ] 4.7 Mostrar un workflow real del proyecto (p. ej. `ci.yml`) desglosado línea por línea
- [ ] 4.8 Cerrar con resumen y enlace a `03-secrets-variables.md`

## 5. Guía: Secrets y variables

- [ ] 5.1 Escribir `docs/learning/ci-cd/03-secrets-variables.md` con objetivos de aprendizaje y prerequisitos
- [ ] 5.2 Explicar la diferencia entre secrets y variables de GitHub (tabla comparativa: cuándo usar cada uno)
- [ ] 5.3 Explicar environments, environment secrets y el principio de mínimo privilegio
- [ ] 5.4 Mostrar el uso real en el proyecto: gating con `vars.AWS_ROLE_ARN` y secrets `STAGING_*`/`PROD_*` con snippets citados de los workflows
- [ ] 5.5 Enlazar a `docs/workflows-mantenimiento-guia.md` para casos resueltos y anti-patterns
- [ ] 5.6 Cerrar con resumen y enlace a `04-docker-basico-para-cicd.md`

## 6. Guía: Docker básico para CI/CD

- [ ] 6.1 Escribir `docs/learning/ci-cd/04-docker-basico-para-cicd.md` con objetivos de aprendizaje y prerequisitos
- [ ] 6.2 Explicar imagen vs contenedor vs Dockerfile desde cero con analogía
- [ ] 6.3 Explicar multi-stage builds desglosando el `apps/server/Dockerfile` real del proyecto etapa por etapa (citar ruta fuente)
- [ ] 6.4 Explicar docker-compose a nivel básico y su rol en CI/CD
- [ ] 6.5 Introducir el concepto de contenedor Floci (qué es a alto nivel) con enlaces a `docs/aws-*.md`, indicando profundización en nivel Avanzado
- [ ] 6.6 Cerrar con resumen y enlace de vuelta al README (última guía del nivel)

## 7. Verificación de cross-references

- [ ] 7.1 Verificar que todas las guías enlazan correctamente entre sí (anterior/siguiente/README)
- [ ] 7.2 Verificar que los enlaces relativos a `docs/` y `.github/` apuntan a archivos existentes
- [ ] 7.3 Verificar que el README enlaza a los niveles futuros (intermedio/avanzado/profesional)
- [ ] 7.4 Verificar que los snippets citados en las guías existen en las rutas indicadas (workflows reales, Dockerfile, configs de commitlint/Husky)
- [ ] 7.5 Verificar que las afirmaciones factuales de las guías (número de workflows, jobs de ci.yml, triggers, nombres de secrets) coinciden con los archivos reales de .github/workflows/ — NO copiar conteos de docs/cicd-\*.md (ej. "12 workflows" es obsoleto; real: 9 workflows post-cleanup Aug 2026)

## 8. Verificación de anti-duplicación

- [ ] 8.1 Verificar que ninguna guía copia secciones enteras (>40 líneas) de `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/workflows-mantenimiento-guia.md` ni docs AWS/Floci — deben enlazar en su lugar
- [ ] 8.2 Verificar que los snippets cortos (<40 líneas) citan la ruta fuente
- [ ] 8.3 Verificar que el contenido didáctico (analogías, explicaciones desde cero) es original de las guías y no duplica la documentación técnica existente

## 9. Control de calidad markdown

- [ ] 9.1 Verificar que las 5 guías tienen entre 800 y 1500 líneas cada una y el README.md entre 200 y 800 líneas (800-1500 líneas por guía; README.md: 200-800 líneas)
- [ ] 9.2 Verificar que todas las guías tienen secciones de objetivos de aprendizaje y prerequisitos
- [ ] 9.3 Ejecutar lint de markdown disponible en el repo (o verificación manual de formato: tablas válidas, mermaid sin errores de sintaxis, código en español)
- [ ] 9.4 Verificación final: revisar que las 5 guías + README cumplen los requisitos de `specs/cicd-fundamentals-guide/spec.md` y `specs/cicd-guide-readme-index/spec.md`
