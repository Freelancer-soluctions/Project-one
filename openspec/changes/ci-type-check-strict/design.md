# Design

## Context

Los jobs `client-typecheck` y `server-typecheck` corren `npx tsc --noEmit` sin `--tsBuildInfoFile` explícito ni caché del tsBuildInfo. `strict` ya está activo en `apps/server/tsconfig.json` (Fase 4 completada 2026-10-20, 0 errores) y se gobierna por `config-correctness` (un flag por paso). `incremental: true` ya está en `tsconfig.json` (línea 14) y `apps/server/tsconfig.json` (línea 24), así que `--incremental` es redundante. La verificación A2 confirma que con `--noEmit` el tsBuildInfo se escribe pero **no acelera** la verificación (no hay outputs reutilizables); el beneficio real es marginal (reutilización del archivo entre corridas + cache). `@typescript-eslint/ban-ts-comment` se añade en `ci-quality-gates-blocking-hardening` (P1.6), que ya toca `eslint.config.js`; no se duplica aquí.

## Goals / Non-Goals

**Goals:** Persistir y cachear el tsBuildInfo en los jobs de typecheck de CI.

**Non-Goals:** No activar `strict` (ya activo en server; gobernado por `config-correctness`). No añadir `ban-ts-comment` (pertenece a hardening P1.6). No prometer aceleración de typecheck. No tocar `tsconfig.json` raíz ni client (client es JS sin `checkJs`).

## Decisions

1. Añadir `--tsBuildInfoFile` al step `TypeCheck` de `ci.yml` (client y server), con ruta resuelta explícita.
2. Cachear el directorio del tsBuildInfo con `actions/cache` (clave: lockfile + fuentes).
3. No añadir `--incremental` (redundante con `tsconfig`).
4. Ruta del tsBuildInfo: `apps/<workspace>/.cache/tsc/app.tsbuildinfo` (relativa al `working-directory` del job), cache path `apps/<workspace>/.cache/tsc`.
5. No prometer speedup; objetivo = cache reutilizable.

## Risks / Trade-offs

- Ruta mal resuelta (relativa a cwd vs config) invalida la cache. Mitigación: ruta explícita y verificación de cache hit en CI.
- tsBuildInfo en `.gitignore` ya ignorado (`*.tsbuildinfo`); no hace falta task de gitignore.
- Dependencia oculta sobre `quality-policy.md` (creado por hardening P1.4).

## Migration Plan

1. Añadir `--tsBuildInfoFile` al step `TypeCheck` de `ci.yml` (client y server).
2. Añadir `actions/cache` para el directorio del tsBuildInfo.
3. Verificar cache hit en CI.
4. Actualizar `quality-policy.md` con la fecha (crear plantilla mínima si no existe).
5. `openspec sync` + archivar.

## Open Questions

- Ninguna (la pregunta merge-vs-recortar se resolvió a favor de recortar: solo tsBuildInfo+cache).
