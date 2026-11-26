# Plan de Rollback — Template

> **Etapa:** 5. Diseño técnico
> **Artefacto:** Plan de rollback (reversión de código, BD y feature flag)
> **Nivel de adopción:** Core (Nivel 1 — Mínimo viable)
>
> **¿Qué es?** Documento que define cómo revertir un despliegue: código, migración de BD (expand/contract) y feature flag. Se produce en Diseño técnico, se prueba en staging y se ejecuta en Entrega si falla el release.
>
> **No confundir con:** plan de migración (expand/contract — cómo avanzar), plan de despliegue (release plan — cómo desplegar), runbook (operación post-deploy). El rollback es la reversión; la migración es el avance; el release plan es el despliegue; el runbook es la operación.
>
> **Fuentes:** Prisma Data Guide — Expand and Contract Pattern [1], Google SRE — Canarying Releases [2], LaunchDarkly — Release Management [3], Atlassian — Rollback Planning [4], Martin Fowler — Blue-Green Deployment [5], AWS — Deployment Strategies [6], Google SRE Book — Postmortem Culture [7], Atlassian — How to run a blameless postmortem [8].
>
> ---
>
> ## Instrucciones de uso
>
> 1. Copia y renombra: `rollback-plan-<change-name>.md`.
> 2. Completa la sección 1 (alcance) antes de escribir los pasos de rollback.
> 3. Define rollback para cada capa: código, BD (expand/contract), feature flag, config.
> 4. Prueba el rollback en staging antes del release.
> 5. Persiste en el change OpenSpec (`design.md` → sección "Plan de rollback") o en `/docs/rollback-plans/`.
>
> ---

## 1. Alcance del rollback

| Campo                   | Valor                                  |
| ----------------------- | -------------------------------------- |
| **Change OpenSpec**     | `openspec/changes/<name>/`             |
| **Feature**             | <nombre de la feature>                 |
| **Versión a revertir**  | <versión o commit SHA>                 |
| **Fecha de despliegue** | YYYY-MM-DD                             |
| **Owner del rollback**  | <nombre/rol>                           |
| **Ventana de rollback** | <tiempo máximo para ejecutar rollback> |

---

## 2. Escenarios de rollback

### 2.1 Rollback de código

- **Método:** `git revert <commit>` o revert del PR en GitHub.
- **Pasos:**
  1. Identificar el commit/PR a revertir.
  2. Ejecutar `git revert <commit>` (o revert del PR en GitHub).
  3. CI verde (lint + tests + build).
  4. Deploy a staging → smoke test.
  5. Deploy a producción.
- **Tiempo estimado:** <n> minutos.
- **Riesgo:** bajo (revert limpio si no hay conflictos).

### 2.2 Rollback de base de datos (expand/contract)

- **Patrón:** expand/contract (parallel change). El rollback depende de en qué paso se está.

| Paso actual                                                     | Rollback disponible                                                                                            | Acción                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Expand** (columnas/tablas nuevas añadidas, nullable/default)  | ✅ Sí — revertir código + eliminar columnas/tablas nuevas (si no hay datos)                                    | `ALTER TABLE ... DROP COLUMN` o `DROP TABLE`                         |
| **Migrate** (código soporta ambas formas, backfill en progreso) | ✅ Sí — revertir código a versión anterior (soporta forma antigua); no eliminar columnas nuevas hasta contract | Revertir código; mantener columnas nuevas (nullable)                 |
| **Contract** (estructura antigua eliminada)                     | ❌ No — el rollback ya no depende de la estructura antigua                                                     | **No ejecutar contract hasta validar en producción por ≥ 2 semanas** |

- **Regla de oro:** no ejecutar el paso Contract hasta que todas las instancias usen la nueva estructura y el rollback ya no dependa de la antigua.
- **Pasos:**
  1. Verificar en qué paso está la migración (expand/migrate/contract).
  2. Si está en expand o migrate: revertir código + revertir migración (si aplica).
  3. Si está en contract: **no se puede revertir la BD** — solo revertir código y desactivar feature flag.
- **Tiempo estimado:** <n> minutos (expand/migrate) / N/A (contract).
- **Riesgo:** alto si se ejecutó contract sin validar.

### 2.3 Rollback de feature flag

- **Método:** desactivar el flag en el sistema de feature flags (LaunchDarkly, Flagsmith, etc.).
- **Pasos:**
  1. Desactivar el flag `<feature_flag_name>` para todos los usuarios.
  2. Verificar que el flujo legacy se activa.
  3. Monitorear logs y métricas.
- **Tiempo estimado:** <n> minutos.
- **Riesgo:** bajo (el código legacy sigue funcionando).

### 2.4 Rollback de configuración

- **Método:** revertir cambios en archivos de configuración (env vars, config files).
- **Pasos:**
  1. Identificar cambios de configuración.
  2. Revertir a la configuración anterior.
  3. Reiniciar el servicio si es necesario.
- **Tiempo estimado:** <n> minutos.
- **Riesgo:** bajo.

---

## 3. Plan de rollback por escenario

### Escenario A: Fallo en staging (pre-deploy)

- **Acción:** no desplegar a producción. Corregir en la rama de feature.
- **Pasos:** revertir PR, corregir, nuevo PR, re-validar en staging.
- **Tiempo:** <n> horas.

### Escenario B: Fallo en producción (post-deploy, feature flag desactivado)

- **Acción:** desactivar feature flag (rollback de código no necesario si el flag controla el flujo).
- **Pasos:** desactivar flag → verificar flujo legacy → investigar causa raíz → corregir → re-deploy.
- **Tiempo:** <n> minutos (desactivar flag) + <n> horas (corrección).

### Escenario C: Fallo en producción (post-deploy, feature flag activado al 100%)

- **Acción:** desactivar feature flag + revertir código si es necesario.
- **Pasos:** desactivar flag → revertir código (si el flag no cubre todo) → revertir migración BD (si aplica) → verificar flujo legacy → investigar → corregir.
- **Tiempo:** <n> minutos (desactivar flag) + <n> horas (corrección + re-deploy).

### Escenario D: Fallo en producción (migración BD en paso contract)

- **Acción:** **no se puede revertir la BD**. Solo revertir código y desactivar feature flag.
- **Pasos:** desactivar flag → revertir código → verificar flujo legacy → investigar → corregir (puede requerir nueva migración).
- **Tiempo:** <n> minutos (desactivar flag) + <n> horas/días (corrección).
- **Riesgo:** alto. Por eso la regla: no ejecutar contract hasta validar en producción.

---

## 4. Checklist de rollback (pre-deploy)

- [ ] Plan de rollback documentado y revisado por Tech Lead
- [ ] Rollback probado en staging (al menos una vez)
- [ ] Feature flag configurado y probado (desactivar → flujo legacy funciona)
- [ ] Paso de migración BD identificado (expand/migrate/contract)
- [ ] Revert del PR probado (sin conflictos)
- [ ] Runbook de rollback actualizado
- [ ] Comunicación de rollback definida (quién avisa a quién)
- [ ] Métricas de monitoreo listas (SLIs para detectar fallo)

---

## 5. Rollback drill (ensayo)

Antes del release, ensayar el plan de rollback en staging:

1. Desplegar la feature con flag activado.
2. Simular un fallo (ej. error 500 en endpoint crítico).
3. Ejecutar el plan de rollback (desactivar flag, revertir código si aplica).
4. Verificar que el flujo legacy funciona.
5. Medir tiempo de rollback (debe ser < objetivo).
6. Documentar lecciones aprendidas.

---

## 6. Trazabilidad

| Escenario   | Change OpenSpec            | ADR     | Runbook                   | Test de rollback |
| ----------- | -------------------------- | ------- | ------------------------- | ---------------- |
| Escenario A | `openspec/changes/<name>/` | ADR-xxx | `docs/runbooks/<name>.md` | Staging drill    |
| Escenario B | `openspec/changes/<name>/` | ADR-xxx | `docs/runbooks/<name>.md` | Staging drill    |
| Escenario C | `openspec/changes/<name>/` | ADR-xxx | `docs/runbooks/<name>.md` | Staging drill    |
| Escenario D | `openspec/changes/<name>/` | ADR-xxx | `docs/runbooks/<name>.md` | Staging drill    |

---

## Exit criteria (criterio de salida de Diseño)

- [ ] Plan de rollback documentado (código, BD, feature flag, config)
- [ ] Rollback probado en staging (al menos una vez)
- [ ] Feature flag configurado y probado
- [ ] Paso de migración BD identificado y documentado
- [ ] Runbook de rollback actualizado
- [ ] Comunicación de rollback definida
- [ ] Métricas de monitoreo listas para detectar fallo

---

## Referencias

- [1] Prisma Data Guide — Using the expand and contract pattern for schema changes: https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern
- [2] Google SRE Workbook — Canarying Releases: https://sre.google/workbook/canarying-releases
- [3] LaunchDarkly — Release Management: A Guide on Best Practices & Processes: https://launchdarkly.com/blog/release-management-guide
- [4] Atlassian — Rollback Planning: https://www.atlassian.com/continuous-delivery/deployment/rollback
- [5] Martin Fowler — Blue-Green Deployment: https://martinfowler.com/bliki/BlueGreenDeployment.html
- [6] AWS — Deployment Strategies: https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/deployment-strategies.html
- [7] Google SRE Book — Postmortem Culture: https://sre.google/sre-book/postmortem-culture
- [8] Atlassian — How to run a blameless postmortem: https://www.atlassian.com/incident-management/postmortem/blameless

> **Nota:** Las referencias [2], [5], [6], [7] y [8] se incluyen para contexto de estrategias de release (canary, blue-green, deployment strategies) y gestión de incidentes (post-mortem), que complementan el plan de rollback aunque no tengan sección dedicada en este template. Para canary/blue-green, ver docs/De-stakeholder-a-produccion-flujo-completo-de una-feature.md (Etapa 7).

---

_Template creado: 2026-11-24. Mantener vivo: actualizar con cada lección aprendida._
