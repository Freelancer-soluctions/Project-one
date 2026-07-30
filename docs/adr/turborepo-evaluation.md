# ADR: Evaluación de Migración a Turborepo para Cache de Tests

**Status:** Proposed
**Date:** 2025-07-28
**Authors:** Developer Team
**Deciders:** Tech Lead, Architecture Team

---

## Context

**Monorepo actual:** npm workspaces nativo con 3 workspaces:
- `apps/client-react` — React 18 + Vite + Vitest + Playwright (E2E)
- `apps/server-express` — Express + Prisma + PostgreSQL + Vitest
- `e2e` — Playwright E2E tests (workspace independiente)

**Problemática actual:**
- `npm run test` ejecuta **toda la suite desde cero** en cada push/PR
- No hay cache de resultados de tests entre runs
- CI ejecuta unit + integration + E2E en cada pipeline (~8-12 min)
- Pre-push hook ejecuta `vitest --changed origin/main` pero sin cache persistente entre máquinas
- Desarrollo local: `npm run test` vuelve a correr tests que no cambiaron

**Impacto:**
- Feedback loop lento en CI (~10 min promedio)
- Desarrollo local: tests lentos desincentivan ejecución frecuente
- Costo CI/CD: minutos de build facturables en GitHub Actions

---

## Problem Statement

> **Los tests se ejecutan desde cero en cada push. No hay cache de resultados por workspace. Se busca reducir tiempo de feedback en CI y desarrollo local mediante cache inteligente de tasks.**

---

## Options Considered

### Opción A: Turborepo (Vercel) — **RECOMENDADA**

**Qué es:** Build system para monorepos con cache inteligente de tasks, remote cache opcional (Turborepo Remote Cache / Vercel), y pipeline declaration via `turbo.json`.

**Pros:**
| Factor | Evaluación |
|--------|------------|
| **Intrusividad** | ✅ Muy baja — opt-in, no rompe `npm workspaces` existente |
| **DX / Adopción** | ✅ Excelente — `turbo run test` detecta cambios, cache local + remote |
| **Alineación stack** | ✅ Frontend ya usa Vercel (Next.js no, pero stack Vercel-friendly: Vite, Tailwind, shadcn) |
| **Configuración** | ✅ `turbo.json` simple, pipeline declarativo |
| **Remote Cache** | ✅ Opcional (Vercel, self-hosted, o deshabilitado) |
| **Comunidad/Adopción** | ✅ Estándar de facto en monorepos TypeScript/React 2024-2025 |
| **Parallelización** | ✅ Topológica automática basada en `dependsOn` |

**Contras:**
| Factor | Evaluación |
|--------|------------|
| **Curva aprendizaje** | ⚠️ Baja — conceptos: `pipeline`, `dependsOn`, `cache`, `outputs` |
| **Lock-in Vercel** | ⚠️ Remote cache opcional; local cache funciona sin cuenta Vercel |
| **Config extra** | ⚠️ Requiere `turbo.json` + ajustes `package.json` scripts |

---

### Opción B: Nx (Nrwl)

**Qué es:** Build system más opinado, con plugin ecosystem, code generation, affected graph nativo, y cloud cache (Nx Cloud).

**Pros:**
| Factor | Evaluación |
|--------|------------|
| **Affected graph** | ✅ Nativo y maduro (`nx affected:test`) |
| **Plugin ecosystem** | ✅ Plugins para React, Node, NestJS, Next.js, etc. |
| **Code generation** | ✅ Generators para components, libs, etc. |
| **Nx Cloud** | ✅ Remote cache + distributed task execution |

**Contras:**
| Factor | Evaluación |
|--------|------------|
| **Intrusividad** | ❌ Alta — requiere migración de config, `nx.json`, workspace layout opinionado |
| **Curva aprendizaje** | ❌ Media-Alta — conceptos: projects, targets, generators, executors |
| **Overhead** | ❌ Más pesado para monorepo simple de 3 workspaces |
| **Filosofía** | ❌ "Nx way" vs "npm workspaces way" — cambio mental significativo |

---

### Opción C: Mantener npm workspaces nativo (Status Quo)

**Qué es:** Seguir usando `npm run test --workspaces --if-present` sin cache inteligente.

**Pros:**
| Factor | Evaluación |
|--------|------------|
| **Cero cambios** | ✅ Funciona hoy |
| **Sin dependencias** | ✅ No requiere tooling extra |
| **Simplicidad** | ✅ Entendido por todo el equipo |

**Contras:**
| Factor | Evaluación |
|--------|------------|
| **Cache** | ❌ Ninguno — tests corren desde cero siempre |
| **Affected testing** | ⚠️ Solo `vitest --changed` (local, no persistente cross-machine) |
| **Parallelización** | ❌ `npm workspaces` ejecuta en secuencia por defecto; `--workspaces --if-present` no paralleliza inteligentemente |
| **Escalabilidad** | ❌ No escala bien >5 workspaces |

---

## Comparative Analysis Table

| Criterio | Turborepo (A) | Nx (B) | npm workspaces (C) |
|----------|---------------|--------|---------------------|
| **Cache local tasks** | ✅ Automático (hash inputs/outputs) | ✅ Automático | ❌ No |
| **Remote cache** | ✅ Opcional (Vercel/self-hosted) | ✅ Nx Cloud | ❌ No |
| **Affected detection** | ✅ `turbo run test --filter=...` | ✅ `nx affected:test` | ⚠️ `vitest --changed` solo local |
| **Parallelización inteligente** | ✅ Topológica (`dependsOn`) | ✅ Topológica | ❌ Secuencial |
| **Intrusividad migración** | 🟢 **Muy baja** (opt-in) | 🔴 **Alta** (opinionado) | 🟢 Ninguna |
| **Configuración** | `turbo.json` (simple) | `nx.json` + `project.json` c/u | `package.json` scripts |
| **Curva aprendizaje equipo** | 🟢 Baja | 🔴 Media-Alta | 🟢 Ya conocida |
| **Costo migración (días)** | **1-2** | 5-10 | 0 |
| **Riesgo breaking changes** | 🟢 Bajo | 🔴 Medio-Alto | 🟢 N/A |
| **Alineación stack Vercel** | 🟢 Alta | 🟡 Media | 🟡 Media |
| **Mantenimiento long-term** | 🟢 Activo (Vercel) | 🟢 Activo (Nrwl) | 🟢 Nativo npm |

---

## Recommendation: **Opción A — Turborepo**

### Justificación

1. **Menor intrusividad**: Turborepo se instala como devDependency, añade `turbo.json`, y los scripts `npm run test` siguen funcionando igual. `turbo run test` es **aditivo**, no sustitutivo.

2. **Mejor DX para el equipo**: `turbo run test` muestra output agrupado por workspace, cache hits/misses visibles, y parallelización automática. `turbo run test --filter=server-express` corre solo server.

3. **Alineación estratégica**: Frontend usa Vite + Tailwind + shadcn/ui (ecosistema Vercel-friendly). Turborepo es "hermano" de Next.js/Vercel.

4. **Remote cache opcional**: Se puede habilitar Turborepo Remote Cache (gratis en Vercel para OSS/personal, o self-hosted) sin lock-in — el cache local ya da 60-80% mejora.

5. **Riesgo bajo**: Si no funciona, `npm uninstall turbo` y borras `turbo.json` — cero breaking changes al workspace actual.

---

## Migration Plan (High-Level)

| Paso | Acción | Esfuerzo | Validación |
|------|--------|----------|------------|
| 1 | `npm i -D turbo` en root | 5 min | `npx turbo --version` |
| 2 | Crear `turbo.json` con pipeline `test`, `build`, `lint`, `typecheck` | 30 min | `turbo run test --dry-run` |
| 3 | Ajustar `package.json` scripts: agregar `turbo run` wrappers opcionales | 15 min | `npm run test` sigue funcionando |
| 4 | Configurar `outputs` en `turbo.json` para cache de `coverage/`, `dist/`, `.turbo/` | 15 min | `turbo run test` segunda vez = cache hit |
| 5 | (Opcional) Habilitar Turborepo Remote Cache en Vercel | 30 min | CI muestra "Remote cache hit" |
| 6 | Documentar en `docs/testing-architecture.md` § Workspaces y Orquestación | 20 min | PR merged |
| 7 | CI: migrar GitHub Actions a `turbo run test:ci` | 30 min | Pipeline verde, tiempo reducido |

**Total estimado:** **1-2 días de trabajo** (incluye testing, doc, CI migration)

---

## Risk Assessment

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Turbo rompe scripts existentes | Baja | Medio | Opt-in: `npm run test` sin turbo sigue funcionando |
| Cache corrompido da false positives | Baja | Alto | `turbo run test --force` para invalidar; `outputs` bien definidos |
| Team resistance a nuevo tool | Media | Bajo | Demo de cache hit local (2s vs 45s); doc clara |
| Remote cache cost (Vercel) | Baja | Bajo | Gratis para OSS/personal; self-hosted opción; deshabilitable |
| Windows compatibility issues | Media | Medio | Turbo soporta Windows nativo; testear en CI Windows runner |

**Veredicto de riesgo: BAJO** — Turborepo es opt-in, no rompe npm workspaces, y rollback es trivial.

---

## Decision Status

| Estado | Descripción |
|--------|-------------|
| **Proposed** | Este ADR propone la migración. No decidida aún. |
| **Próximos pasos** | 1. Team review este ADR (async o sync) 2. Spike de 2-3 hrs en branch `spike/turborepo` 3. Decisión go/no-go en planning próximo |

---

## References

- Turborepo Docs: https://turbo.build/repo/docs
- Turborepo Remote Cache: https://turbo.build/repo/docs/core-concepts/remote-caching
- Nx vs Turborepo comparison: https://nx.dev/concepts/more-concepts/turborepo-comparison
- npm workspaces docs: https://docs.npmjs.com/cli/v10/using-npm/workspaces