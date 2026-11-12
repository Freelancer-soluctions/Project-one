# Design

## Context

SonarQube inactivo (`if: false`, sin credenciales, D2 abierto). D2 tiene dos mitades: (1) ¿Sonar aporta algo que ESLint+resto no cubren? (2) ¿Qué pasa con PRs de fork? El PRD quiere Sonar Quality Gate sobre código nuevo como único bloqueante entre los revisores IA. Los revisores con IA (CodeRabbit/DeepSource) deben quedar como comentarios sin check requerido. El ruleset de `main` tiene merge queue activa, así que todo required check debe seguir reportando en `merge_group`.

## Goals / Non-Goals

**Goals:** Decidir D2 (ambas mitades) y, si se activa, configurar Sonar con token + host URL + `pull_request` (no `pull_request_target`), manejar forks, verificar reportería en merge queue, PR de prueba, y required check tras confirmación.

**Non-Goals:** No activar Sonar sin credenciales ni decisión D2. No hacer required checks de revisores IA. No tocar CODEOWNERS (ya cubierto).

## Decisions

1. **D2 (ambas mitades) se decide y documenta en `quality-policy.md`** con la opción elegida y justificación.
2. **Si se activa:** token + host URL vía secrets, job con `pull_request` (no `pull_request_target`).
3. **Forks:** decidir entre skip (job no corre en PRs de fork) o análisis sin secreto. Recomendación: skip con guard `if: github.event.pull_request.head.repo.full_name == github.repository` (patrón ya usado en `archive/2026-09-21-ci-quality-dag/tasks.md:28`).
4. **Reportería en merge queue:** el check `SonarQube Code Analysis` lo emite la integración Sonar↔GitHub ligada al PR. En el commit sintético de la cola no hay PR → puede no reportarse → cola bloqueada. Decidir si el required check es el agregador existente (`Postbuild Analysis Complete`/`CI Complete`) o un job que también corra en `merge_group`. Analizar antes de tocar el ruleset.
5. **Quality Gate:** Sonar way (0 issues nuevos, 80% cobertura, 3% duplicación, hotspots revisados) con matizes (MQR mode, fudge factor ≥20 líneas, solape cobertura-QG vs stage de testing — que la condición viva en un solo lugar).
6. **Advisory-first vs required-directo:** PRD recomienda advisory primero; decisión doc dice blocking desde día 1 con pre-flight. Aceptar una y justificarla.
7. **Mecanismo del check:** elegir entre integración Sonar↔GitHub (emite `SonarQube Code Analysis`) o `SonarSource/sonar-quality-gate-check` action + `continue-on-error`. Reconciliar con `docs/learning/quality-gates.md:29` (enfoque advisory con action). Decidir si un check para client y otro para server, o uno solo.
8. **Revisores IA:** verificar que CodeRabbit/DeepSource estén instalados antes de exigir que "permanezcan" como asesores.

## Risks / Trade-offs

- Sonar en forks no recibe secretos → job rojo/no-reportado si es required. Mitigación: guard de fork o skip.
- Reportería en merge queue: check ligado al PR no reporta en commit sintético → cola bloqueada. Mitigación: análisis previo (decisión 4).
- Doble cobertura de QG (Sonar + stage de testing). Mitigación: que la condición viva en un solo lugar.
- Doble check (client/server) vs uno solo.

## Migration Plan

1. Decidir D2 (ambas mitades: valor + forks).
2. Si activa: configurar `SONAR_TOKEN` y `SONAR_HOST_URL` en secrets.
3. Decidir mecanismo del check (integración vs action) y forks handling.
4. Analizar reportería en `merge_group`.
5. Modificar jobs `client-sonarqube`/`server-sonarqube` (quitar `if: false`, usar `pull_request`).
6. Ejecutar PR de prueba y confirmar nombre del check.
7. Añadir al ruleset como required (tras confirmación y análisis de merge queue).
8. Verificar que CodeRabbit/DeepSource permanecen como asesores (si instalados).
9. Registrar en `quality-policy.md`: decisión D2, QG aplicado, forks, merge queue, fecha.
10. Crear plantilla mínima de `quality-policy.md` si hardening no aterrizó.

## Open Questions

- D2: ¿Sonar aporta algo que ESLint+resto no cubren?
- D2-forks: ¿skip o análisis sin secreto?
- Mecanismo: ¿integración Sonar↔GitHub o action `sonar-quality-gate-check`?
- Merge queue: ¿required check es el agregador o un job que corre en `merge_group`?
- ¿Un check para client y otro para server, o uno solo?
